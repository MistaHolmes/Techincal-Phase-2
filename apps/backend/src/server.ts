import express from 'express';
import { PrismaClient } from '@prisma/client';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import dotenv from 'dotenv';
import { syncUser } from './sync';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { createClient } from 'redis';
import { sendBlogPublishedEmail } from './email';
import rateLimit from 'express-rate-limit';

import abinashRouter from './routes/abinash';
import skRouter from './routes/sk';
import soumyaRouter from './routes/soumya';
import supritRouter from './routes/suprit';

// MUST be first — loads REDIS_URL, DATABASE_URL etc. before anything reads process.env
dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

redisClient.on('error', (err) => console.error('Redis client error:', err));
redisClient.on('connect', () => console.log('Redis connected'));
redisClient.on('reconnecting', () => console.log('Redis reconnecting...'));
redisClient.connect().catch(console.error);

const app = express();
const prisma = new PrismaClient();
const port = parseInt(process.env.PORT || '3000', 10);
const server = http.createServer(app);

app.use(clerkMiddleware());
app.use(cors({
  origin: true,
  credentials: true,
}));
// Use only express.json() — bodyParser.json() is redundant (express wraps it internally)
app.use(express.json({ limit: '10mb' }));

// ── Rate Limiting ────────────────────────────────────────────────────────────
// Global limiter: 200 req / 15 min per IP (generous for public read traffic)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Strict limiter for write operations (create/update/delete/publish)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests, please slow down.' },
});

// Auth-related limiter (user sync)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests.' },
});

app.use(globalLimiter);
// ─────────────────────────────────────────────────────────────────────────────

// Team Member Routes Setup
app.use('/api/abinash', abinashRouter);
app.use('/api/sk', skRouter);
app.use('/api/soumya', soumyaRouter);
app.use('/api/suprit', supritRouter);

// Store user WebSocket connections with ping/pong tracking
interface UserConnection {
  ws: WebSocket;
  isAlive: boolean;
  userId: string;
}

const userConnections = new Map<string, UserConnection>();

const wss = new WebSocketServer({ server });

const PING_INTERVAL = 30000;

// Standard Heartbeat mechanism: periodically check all connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const conn = Array.from(userConnections.values()).find(c => c.ws === ws);
    if (conn) {
      if (!conn.isAlive) {
        console.log(`User ${conn.userId} failed to respond to heartbeat, terminating connection`);
        userConnections.delete(conn.userId);
        return ws.terminate();
      }
      conn.isAlive = false;
    }
  });
}, PING_INTERVAL);

wss.on('close', () => clearInterval(interval));

wss.on('connection', (ws) => {
  // console.log('Client connected');
  let userId: string | null = null;
  let connectionData: UserConnection = { ws, isAlive: true, userId: '' };

  ws.on('pong', () => {
    if (connectionData) connectionData.isAlive = true;
  });

  ws.on('message', async (message) => {
    const data = message.toString();

    // Handle user registration for notifications
    if (data.startsWith('register:')) {
      userId = data.split(':')[1];
      connectionData.userId = userId;
      connectionData.isAlive = true;
      userConnections.set(userId, connectionData);
      // console.log(`Connected users: ${userConnections.size}`);
      
      // Send initial notification data
      try {
        const notifications = await getNotificationsForUser(userId);
        const unreadCount = notifications.filter((n:any) => !n.read).length;
        
        ws.send(JSON.stringify({
          type: 'initial_notifications',
          notifications,
          unreadCount
        }));
      } catch (error) {
        console.error('Error sending initial notifications:', error);
      }
    }

    // Handle text-level pong from client (browser sends text 'pong' in response to text 'ping')
    if (data === 'pong') {
      connectionData.isAlive = true;
      return;
    }

    // Handle text-level ping from client — respond with text 'pong'
    if (data === 'ping') {
      connectionData.isAlive = true;
      ws.send('pong');
      return;
    }

    // Get likes for a blog
    if (data.startsWith('getLikes:')) {
      const blogId = data.split(':')[1];
      const blog = await prisma.blog.findUnique({
        where: { id: blogId },
        select: { likes: true },
      });
      ws.send(JSON.stringify({ type: 'likes_update', blogId, likes: blog?.likes ?? 0 }));
      return;
    }

    // Like a blog — increment and broadcast to all connected clients
    if (data.startsWith('like:')) {
      const blogId = data.split(':')[1];
      try {
        const updatedBlog = await prisma.blog.update({
          where: { id: blogId },
          data: { likes: { increment: 1 } },
          select: { likes: true },
        });
        // Invalidate single-blog cache
        await redisClient.del(`blog:${blogId}`);
        // Broadcast updated likes to ALL connected clients
        const payload = JSON.stringify({ type: 'likes_update', blogId, likes: updatedBlog.likes });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        });
      } catch (err) {
        console.error('Error incrementing likes:', err);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to like blog' }));
      }
      return;
    }

    // Unlike a blog — decrement (floor 0) and broadcast to all connected clients
    if (data.startsWith('unlike:')) {
      const blogId = data.split(':')[1];
      try {
        // Fetch current likes to prevent going below 0
        const current = await prisma.blog.findUnique({
          where: { id: blogId },
          select: { likes: true },
        });
        const newLikes = Math.max(0, (current?.likes ?? 1) - 1);
        const updatedBlog = await prisma.blog.update({
          where: { id: blogId },
          data: { likes: newLikes },
          select: { likes: true },
        });
        await redisClient.del(`blog:${blogId}`);
        const payload = JSON.stringify({ type: 'likes_update', blogId, likes: updatedBlog.likes });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        });
      } catch (err) {
        console.error('Error decrementing likes:', err);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to unlike blog' }));
      }
      return;
    }
  });

  ws.on('close', () => {
    // console.log('Client disconnected');
    if (userId) {
      userConnections.delete(userId);
      // console.log(`Connected users: ${userConnections.size}`);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
    if (userId) {
      userConnections.delete(userId);
    }
  });
});

// Cache helper functions
const getCacheKey = (userId: string, type: 'all' | 'published' | 'drafts') => {
  return `user:${userId}:blogs:${type}`;
};

const invalidateUserBlogsCache = async (userId: string) => {
  const keys = [
    getCacheKey(userId, 'all'),
    getCacheKey(userId, 'published'),
    getCacheKey(userId, 'drafts'),
    `user_blogs:${userId}`, // Legacy cache key
  ];
  await Promise.all(keys.map(key => redisClient.del(key)));
};

// Safe public-blogs cache invalidation — avoids KEYS command (unsafe on Redis Cloud clusters)
const invalidatePublicBlogsCache = async () => {
  await redisClient.del('blogs:all');
};

// Helper function to get notifications for a user
async function getNotificationsForUser(userId: string) {
  const cacheKey = `user_notifications:${userId}`;
  const cachedNotifications = await redisClient.get(cacheKey);

  if (cachedNotifications) {
    return JSON.parse(cachedNotifications);
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  await redisClient.set(cacheKey, JSON.stringify(notifications), { EX: 60 * 5 });
  return notifications;
}

// Helper function to broadcast notification to a user (clears stale cache first)
async function broadcastNotificationUpdate(userId: string) {
  // Invalidate stale notification cache before fetching fresh data
  await redisClient.del(`user_notifications:${userId}`);

  const connection = userConnections.get(userId);
  if (!connection || connection.ws.readyState !== WebSocket.OPEN) return;

  prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  }).then((notifications: any[]) => {
    const unreadCount = notifications.filter((n: any) => !n.read).length;
    connection.ws.send(JSON.stringify({
      type: 'notification_update',
      notifications,
      unreadCount,
    }));
  }).catch((err: any) => console.error('broadcastNotificationUpdate error:', err));
}

// Public route - no auth required
app.get('/api/blogs', async (req, res:any) => {
  try {
    const cacheKey = 'blogs:all';
    const cachedBlogs = await redisClient.get(cacheKey);

    if (cachedBlogs) {
      // console.log('Serving from Redis cache');
      return res.json(JSON.parse(cachedBlogs));
    }

    const blogs = await prisma.blog.findMany({
      where: { published: true }, // Only show published blogs publicly
      include: {
        author: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    await redisClient.setEx(cacheKey, 600, JSON.stringify(blogs));
    // console.log('Serving from DB and caching in Redis');
    return res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    return res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// Protected routes

app.get('/api/user', requireAuth(), authLimiter, async (req, res) => {
  try {
    const user = await syncUser(req);
    res.json(user);
  } catch (err: any) {
    console.error('Failed to sync user:', err);
    res.status(401).json({ error: err.message || 'Unauthorized' });
  }
});

// NEW AXIOS-COMPATIBLE ROUTES

// GET /api/user/blogs - Get all user's blogs (published + drafts)
app.get('/api/user/blogs', requireAuth(), async (req, res: any) => {
  // console.log("🔥 GET /api/user/blogs HIT");
  try {
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }
    
    const cacheKey = getCacheKey(user.id, 'all');
    const cachedBlogs = await redisClient.get(cacheKey);
    
    if (cachedBlogs) {
      // console.log('Serving user blogs from cache');
      return res.json({ blogs: JSON.parse(cachedBlogs) });
    }
    
    const blogs = await prisma.blog.findMany({
      where: { authorId: user.id },
      orderBy: [
        { published: 'desc' }, // Published blogs first
        { updatedAt: 'desc' }   // Then by most recent
      ],
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    await redisClient.setEx(cacheKey, 600, JSON.stringify(blogs));
    // console.log('Serving user blogs from DB and caching');
    return res.json({ blogs });
  } catch (error) {
    console.error('Error fetching user blogs:', error);
    return res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

// GET /api/user/blogs/published - Get only published blogs
app.get('/api/user/blogs/published', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    const cacheKey = getCacheKey(user.id, 'published');
    const cachedBlogs = await redisClient.get(cacheKey);

    if (cachedBlogs) {
      return res.json({ blogs: JSON.parse(cachedBlogs) });
    }

    const blogs = await prisma.blog.findMany({
      where: { 
        authorId: user.id,
        published: true 
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    await redisClient.setEx(cacheKey, 600, JSON.stringify(blogs));
    res.json({ blogs });
  } catch (error) {
    console.error('Error fetching published blogs:', error);
    res.status(500).json({ error: 'Failed to fetch published blogs' });
  }
});

// GET /api/user/blogs/drafts - Get only draft blogs
app.get('/api/user/blogs/drafts', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    const cacheKey = getCacheKey(user.id, 'drafts');
    const cachedBlogs = await redisClient.get(cacheKey);

    if (cachedBlogs) {
      return res.json({ blogs: JSON.parse(cachedBlogs) });
    }

    const blogs = await prisma.blog.findMany({
      where: { 
        authorId: user.id,
        published: false 
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    await redisClient.setEx(cacheKey, 600, JSON.stringify(blogs));
    res.json({ blogs });
  } catch (error) {
    console.error('Error fetching draft blogs:', error);
    res.status(500).json({ error: 'Failed to fetch draft blogs' });
  }
});

// DELETE /api/blogs/:id - Delete a blog (NEW AXIOS ROUTE)
app.delete('/api/blogs/:id', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const id = req.params.id as string;
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    // First check if the blog exists and belongs to the user
    const blog = await prisma.blog.findFirst({
      where: { 
        id,
        authorId: user.id 
      }
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found or you do not have permission to delete it' });
    }

    // Delete the blog
    await prisma.blog.delete({
      where: { id }
    });

    // Invalidate caches
    await invalidateUserBlogsCache(user.id);
    await redisClient.del(`blog:${id}`);
    await invalidatePublicBlogsCache();

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});

// PATCH /api/blogs/:id/publish - Publish a draft blog (NEW AXIOS ROUTE)
app.patch('/api/blogs/:id/publish', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const id = req.params.id as string;
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    // First check if the blog exists, belongs to the user, and is a draft
    const blog = await prisma.blog.findFirst({
      where: { 
        id,
        authorId: user.id,
        published: false 
      }
    });

    if (!blog) {
      return res.status(404).json({ 
        error: 'Draft blog not found or you do not have permission to publish it' 
      });
    }

    // Update the blog to published
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: { 
        published: true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        message: `Your blog "${blog.title}" was successfully published.`,
        userId: user.id,
        read: false,
      },
    });

    // Invalidate caches
    await invalidateUserBlogsCache(user.id);
    await redisClient.del(`blog:${id}`);
    await invalidatePublicBlogsCache();

    // Broadcast notification update (also clears stale notification cache)
    await broadcastNotificationUpdate(user.id);

    // Send email — non-blocking, won't crash this route
    sendBlogPublishedEmail(user.email, blog.title).catch((err) =>
      console.error('Email send failed (non-fatal):', err)
    );

    res.json({
      message: 'Blog published successfully',
      blog: updatedBlog,
    });
  } catch (error) {
    console.error('Error publishing blog:', error);
    res.status(500).json({ error: 'Failed to publish blog' });
  }
});

// POST /api/blogs - Create a new blog (NEW AXIOS ROUTE)
app.post('/api/blogs', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { title, content, published = false, coverImage } = req.body;
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        published,
        coverImage,
        authorId: user.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (published) {
      // Create notification for immediate publish
      await prisma.notification.create({
        data: {
          message: `Your blog "${title}" was successfully published.`,
          userId: user.id,
          read: false,
        },
      });

      // Broadcast notification update (clears stale cache internally)
      await broadcastNotificationUpdate(user.id);

      // Send email — non-blocking
      sendBlogPublishedEmail(user.email, title).catch((err) =>
        console.error('Email send failed (non-fatal):', err)
      );

      // Invalidate public blogs cache
      await invalidatePublicBlogsCache();
    }

    // Invalidate user blogs cache
    await invalidateUserBlogsCache(user.id);

    res.status(201).json({
      message: 'Blog created successfully',
      blog,
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

// PUT /api/blogs/:id - Update a blog (NEW AXIOS ROUTE)
app.put('/api/blogs/:id', requireAuth(), async (req, res: any) => {
  try {
    const id = req.params.id as string;
    const { title, content, published } = req.body;
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    // First check if the blog exists and belongs to the user
    const existingBlog = await prisma.blog.findFirst({
      where: { 
        id,
        authorId: user.id 
      }
    });

    if (!existingBlog) {
      return res.status(404).json({ error: 'Blog not found or you do not have permission to update it' });
    }

    // Update the blog
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(published !== undefined && { published }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Invalidate caches
    await invalidateUserBlogsCache(user.id);
    await redisClient.del(`blog:${id}`);

    // If published status changed, invalidate public cache
    if (published !== undefined) {
      await invalidatePublicBlogsCache();
    }

    res.json({
      message: 'Blog updated successfully',
      blog: updatedBlog,
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
});

// LEGACY ROUTES (Keep for backward compatibility)

app.post('/api/create-blog', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    const { title, content, published, coverImage } = req.body;

    if (!title || !content || typeof published !== "boolean") {
      return res.status(400).json({ message: "Missing or invalid fields" });
    }

    const newBlog = await prisma.blog.create({
      data: {
        title,
        content,
        published,
        coverImage,
        authorId: user.id,
      },
    });

    if (published) {
      await prisma.notification.create({
        data: {
          message: `Your blog "${title}" was successfully published.`,
          userId: user.id,
          read: false,
        },
      });

      await broadcastNotificationUpdate(user.id);
      sendBlogPublishedEmail(user.email, title).catch((err) =>
        console.error('Email send failed (non-fatal):', err)
      );
    }

    await invalidatePublicBlogsCache();
    await invalidateUserBlogsCache(user.id);

    return res.status(201).json({ blog: newBlog });
  } catch (error) {
    console.error("Failed to create blog:", error);
    return res.status(500).json({
      message: "Blog creation failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get('/api/user/blogs/all', requireAuth(), async (req, res: any) => {
  // console.log("🔥 get /api/user/blogs/all HIT");
  try {
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ message: "User Not Authenticated" });
    }
    
    const cacheKey = `user_blogs:${user.id}`;
    const cachedBlogs = await redisClient.get(cacheKey);
    
    if (cachedBlogs) {
      return res.json({ blogs: JSON.parse(cachedBlogs) });
    }
    
    const blogs = await prisma.blog.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: 'desc' },
    });
    
    await redisClient.setEx(cacheKey, 600, JSON.stringify(blogs));
    return res.json({ blogs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch user blogs" });
  }
});

// ── IMPORTANT: These /api/blogs/* routes MUST come BEFORE /api/blogs/:blogId ──

// GET /api/blogs/trending — top blogs by likes in last 7 days
app.get('/api/blogs/trending', async (req, res: any) => {
  try {
    const cacheKey = 'blogs:trending';
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const blogs = await prisma.blog.findMany({
      where: { published: true, updatedAt: { gte: sevenDaysAgo } },
      include: { author: { select: { email: true, name: true } }, tags: true },
      orderBy: { likes: 'desc' },
      take: 6,
    });

    await redisClient.setEx(cacheKey, 120, JSON.stringify(blogs));
    return res.json(blogs);
  } catch (err) {
    console.error('Error fetching trending:', err);
    return res.status(500).json({ error: 'Failed to fetch trending blogs' });
  }
});

// GET /api/blogs/featured — featured blogs
app.get('/api/blogs/featured', async (req, res: any) => {
  try {
    const cacheKey = 'blogs:featured';
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const blogs = await prisma.blog.findMany({
      where: { published: true, featured: true },
      include: { author: { select: { email: true, name: true } }, tags: true },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    });

    await redisClient.setEx(cacheKey, 300, JSON.stringify(blogs));
    return res.json(blogs);
  } catch (err) {
    console.error('Error fetching featured:', err);
    return res.status(500).json({ error: 'Failed to fetch featured blogs' });
  }
});

// GET /api/blogs/by-tag/:tag — filter by tag name
app.get('/api/blogs/by-tag/:tag', async (req, res: any) => {
  try {
    const { tag } = req.params;
    const cacheKey = `blogs:tag:${tag}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const blogs = await prisma.blog.findMany({
      where: { published: true, tags: { some: { name: { equals: tag, mode: 'insensitive' } } } },
      include: { author: { select: { email: true, name: true } }, tags: true },
      orderBy: { updatedAt: 'desc' },
    });

    await redisClient.setEx(cacheKey, 300, JSON.stringify(blogs));
    return res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs by tag:', err);
    return res.status(500).json({ error: 'Failed to fetch blogs by tag' });
  }
});

app.get('/api/blogs/:blogId', async (req, res: any) => {
  try {
    const { blogId } = req.params;
    
    const cacheKey = `blog:${blogId}`;
    const cachedBlog = await redisClient.get(cacheKey);

    if (cachedBlog) {
      // console.log('Serving single blog from Redis cache');
      return res.json(JSON.parse(cachedBlog));
    }

    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        author: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    await redisClient.setEx(cacheKey, 600, JSON.stringify(blog)); 
    // console.log('Serving single blog from DB and caching in Redis');
    return res.json(blog);
  } catch (err) {
    console.error('Error fetching blog:', err);
    return res.status(500).json({ error: 'Failed to fetch blog' });
  }
});

// POST /api/blogs/:blogId/view — increment view count
app.post('/api/blogs/:blogId/view', async (req, res: any) => {
  try {
    const { blogId } = req.params;
    const blog = await prisma.blog.update({
      where: { id: blogId },
      data: { views: { increment: 1 } },
      select: { views: true },
    });
    // Invalidate cache so the updated views are reflected
    await redisClient.del(`blog:${blogId}`);
    return res.json({ views: blog.views });
  } catch (err) {
    console.error('Error incrementing views:', err);
    return res.status(500).json({ error: 'Failed to increment views' });
  }
});

//Notifications
app.get('/api/user/notifications', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ message: "User Not Authenticated" });
    }

    const notifications = await getNotificationsForUser(user.id);
    // console.log('Serving notifications from cache/DB');
    return res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// PATCH /api/user/notifications/read-all
app.patch('/api/user/notifications/read-all', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ message: "User Not Authenticated" });

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    const updatedNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    await redisClient.set(`user_notifications:${user.id}`, JSON.stringify(updatedNotifications), {
      EX: 60 * 5,
    });

    await broadcastNotificationUpdate(user.id);

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    return res.status(500).json({ message: "Failed to mark as read" });
  }
});

// DELETE /api/user/notifications/:id
app.delete('/api/user/notifications/:id', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    const id = req.params.id as string;

    if (!user) return res.status(401).json({ message: "User Not Authenticated" });

    // Ensure the notification belongs to this user before deleting
    const notif = await prisma.notification.findFirst({
      where: { id: id, userId: user.id }
    });

    if (!notif) return res.status(404).json({ message: "Notification not found" });

    await prisma.notification.delete({
      where: { id: id }
    });

    // Invalidate cache and broadcast update
    const cacheKey = `user_notifications:${user.id}`;
    await redisClient.del(cacheKey);
    await broadcastNotificationUpdate(user.id);

    return res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ message: "Failed to delete notification" });
  }
});

// LEGACY DELETE ROUTE (Keep for backward compatibility)
app.delete("/api/blogs/delete/:id", requireAuth(), async (req, res: any) => {
  const blogId = req.params.id as string;

  try {
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    const existingBlog = await prisma.blog.findFirst({
      where: { 
        id: blogId,
        authorId: user.id 
      },
    });

    if (!existingBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    await prisma.blog.delete({
      where: { id: blogId },
    });

    try {
      await invalidateUserBlogsCache(user.id);
      await redisClient.del(`blog:${blogId}`);
      await invalidatePublicBlogsCache();
    } catch (cacheErr) {
      console.warn('Redis cache invalidation failed:', cacheErr);
    }

    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.error("Delete blog error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// LEGACY PUBLISH ROUTE (Keep for backward compatibility)
app.patch("/api/draft/publish/:id", requireAuth(), async (req, res: any) => {
  const blogId = req.params.id as string;

  try {
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    const existingBlog = await prisma.blog.findFirst({
      where: { 
        id: blogId,
        authorId: user.id 
      },
    });

    if (!existingBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    const updatedBlog = await prisma.blog.update({
      where: { id: blogId },
      data: { published: true },
    });

    try {
      await invalidateUserBlogsCache(user.id);
      await redisClient.del(`blog:${blogId}`);
      await invalidatePublicBlogsCache();
    } catch (cacheErr) {
      console.warn('Redis cache invalidation failed:', cacheErr);
    }

    res.status(200).json({ message: 'Draft published successfully', blog: updatedBlog });
  } catch (err) {
    console.error("Publish draft error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/redis-test", async (req, res) => {
  try {
    await redisClient.set("health", "ok");
    const value = await redisClient.get("health");
    res.send({ redis: value });
  } catch (err) {
    console.error(err);
    res.status(500).send("Redis error");
  }
});

// ── Blog Update ───────────────────────────────────────────────────────────────

// PUT /api/blogs/:id — update blog (edit mode)
app.put('/api/blogs/:id', requireAuth(), writeLimiter, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { title, content, published, coverImage } = req.body;

    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await prisma.blog.findFirst({ where: { id, authorId: user.id } });
    if (!existing) return res.status(404).json({ error: 'Blog not found' });

    const updated = await prisma.blog.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(published !== undefined && { published }),
        ...(coverImage !== undefined && { coverImage }),
      },
    });

    // Invalidate caches
    await redisClient.del(`blog:${id}`);
    await invalidateUserBlogsCache(user.id);
    await invalidatePublicBlogsCache();

    return res.json(updated);
  } catch (err) {
    console.error('Error updating blog:', err);
    return res.status(500).json({ error: 'Failed to update blog' });
  }
});

// ── User Drafts ────────────────────────────────────────────────────────────────

// GET /api/user/blogs/drafts — get current user's unpublished draft blogs
app.get('/api/user/blogs/drafts', requireAuth(), async (req: any, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const drafts = await prisma.blog.findMany({
      where: { authorId: user.id, published: false },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, content: true, published: true, createdAt: true, updatedAt: true },
    });

    return res.json({ blogs: drafts });
  } catch (err) {
    console.error('Error fetching drafts:', err);
    return res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

// GET /api/user/blogs — get current user's all blogs (published + drafts for sidebar)
app.get('/api/user/blogs', requireAuth(), async (req: any, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const cacheKey = `user_blogs:${user.id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json({ blogs: JSON.parse(cached) });

    const blogs = await prisma.blog.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, content: true, published: true, createdAt: true, updatedAt: true, coverImage: true },
    });

    await redisClient.setEx(cacheKey, 120, JSON.stringify(blogs));
    return res.json({ blogs });
  } catch (err) {
    console.error('Error fetching user blogs:', err);
    return res.status(500).json({ error: 'Failed to fetch user blogs' });
  }
});

// PATCH /api/blogs/:id/publish — publish a blog
app.patch('/api/blogs/:id/publish', requireAuth(), writeLimiter, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await prisma.blog.findFirst({ where: { id, authorId: user.id } });
    if (!existing) return res.status(404).json({ error: 'Blog not found' });

    const updated = await prisma.blog.update({ where: { id }, data: { published: true } });

    await redisClient.del(`blog:${id}`);
    await invalidateUserBlogsCache(user.id);
    await invalidatePublicBlogsCache();

    return res.json({ message: 'Blog published', blog: updated });
  } catch (err) {
    console.error('Error publishing blog:', err);
    return res.status(500).json({ error: 'Failed to publish blog' });
  }
});

// DELETE /api/blogs/:id — delete a blog (RESTful route)
app.delete('/api/blogs/:id', requireAuth(), writeLimiter, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await prisma.blog.findFirst({ where: { id, authorId: user.id } });
    if (!existing) return res.status(404).json({ error: 'Blog not found' });

    await prisma.blog.delete({ where: { id } });

    await redisClient.del(`blog:${id}`);
    await invalidateUserBlogsCache(user.id);
    await invalidatePublicBlogsCache();

    return res.json({ message: 'Blog deleted' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    return res.status(500).json({ error: 'Failed to delete blog' });
  }
});

// ── Tags ─────────────────────────────────────────────────────────────────────


// GET /api/tags — all unique tags with blog count
app.get('/api/tags', async (req, res: any) => {
  try {
    const cacheKey = 'tags:all';
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const tags = await prisma.tag.findMany({
      include: { _count: { select: { blogs: true } } },
      orderBy: { name: 'asc' },
    });

    const result = tags.map((t: any) => ({ name: t.name, count: t._count.blogs }));
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
    return res.json(result);
  } catch (err) {
    console.error('Error fetching tags:', err);
    return res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// ── Comments ─────────────────────────────────────────────────────────────────

// GET /api/blogs/:id/comments
app.get('/api/blogs/:id/comments', async (req, res: any) => {
  try {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: { blogId: id },
      include: { author: { select: { email: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/blogs/:id/comments (auth)
app.post('/api/blogs/:id/comments', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Comment content is required' });

    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const blog = await prisma.blog.findUnique({ where: { id }, select: { id: true } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const comment = await prisma.comment.create({
      data: { content: content.trim(), blogId: id, authorId: user.id },
      include: { author: { select: { email: true, name: true } } },
    });

    return res.status(201).json(comment);
  } catch (err) {
    console.error('Error creating comment:', err);
    return res.status(500).json({ error: 'Failed to create comment' });
  }
});

// DELETE /api/comments/:id (auth, own comments only)
app.delete('/api/comments/:id', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { id } = req.params;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const comment = await prisma.comment.findFirst({ where: { id, authorId: user.id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found or not authorized' });

    await prisma.comment.delete({ where: { id } });
    return res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// ── Bookmarks ────────────────────────────────────────────────────────────────

// GET /api/user/bookmarks (auth)
app.get('/api/user/bookmarks', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      include: {
        blog: {
          include: { author: { select: { email: true, name: true } }, tags: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(bookmarks.map((b: any) => b.blog));
  } catch (err) {
    console.error('Error fetching bookmarks:', err);
    return res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// POST /api/user/bookmarks (auth)
app.post('/api/user/bookmarks', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { blogId } = req.body;
    if (!blogId) return res.status(400).json({ error: 'blogId required' });

    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const bookmark = await prisma.bookmark.upsert({
      where: { userId_blogId: { userId: user.id, blogId } },
      update: {},
      create: { userId: user.id, blogId },
    });

    return res.status(201).json(bookmark);
  } catch (err) {
    console.error('Error creating bookmark:', err);
    return res.status(500).json({ error: 'Failed to bookmark' });
  }
});

// DELETE /api/user/bookmarks/:blogId (auth)
app.delete('/api/user/bookmarks/:blogId', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { blogId } = req.params;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.bookmark.deleteMany({ where: { userId: user.id, blogId } });
    return res.json({ message: 'Bookmark removed' });
  } catch (err) {
    console.error('Error removing bookmark:', err);
    return res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

// GET /api/user/bookmarks/ids — get just the bookmarked blog IDs for client state (auth)
app.get('/api/user/bookmarks/ids', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      select: { blogId: true },
    });
    return res.json(bookmarks.map((b: any) => b.blogId));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch bookmark IDs' });
  }
});

// ── Dashboard Stats ───────────────────────────────────────────────────────────

// GET /api/user/stats (auth)
app.get('/api/user/stats', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const [blogs, commentCount] = await Promise.all([
      prisma.blog.findMany({
        where: { authorId: user.id },
        select: { id: true, title: true, published: true, likes: true, createdAt: true },
        orderBy: { likes: 'desc' },
      }),
      prisma.comment.count({ where: { blog: { authorId: user.id } } }),
    ]);

    const totalLikes = blogs.reduce((sum: number, b: any) => sum + b.likes, 0);
    const publishedCount = blogs.filter((b: any) => b.published).length;
    const draftCount = blogs.filter((b: any) => !b.published).length;
    const topBlog = blogs[0] || null;

    return res.json({ totalBlogs: blogs.length, publishedCount, draftCount, totalLikes, commentCount, topBlog, blogs });
  } catch (err) {
    console.error('Error fetching stats:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── Author Profiles ───────────────────────────────────────────────────────────

// GET /api/authors/:userId — public author profile
app.get('/api/authors/:userId', async (req, res: any) => {
  try {
    const { userId } = req.params;
    const cacheKey = `author:${userId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const author = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        createdAt: true,
        blogs: {
          where: { published: true },
          select: { id: true, title: true, content: true, likes: true, createdAt: true, updatedAt: true, coverImage: true, tags: true },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!author) return res.status(404).json({ error: 'Author not found' });

    await redisClient.setEx(cacheKey, 300, JSON.stringify(author));
    return res.json(author);
  } catch (err) {
    console.error('Error fetching author:', err);
    return res.status(500).json({ error: 'Failed to fetch author' });
  }
});

// ── User Profile Update ───────────────────────────────────────────────────────

// PATCH /api/user/profile (auth)
app.patch('/api/user/profile', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, bio } = req.body;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
      },
      select: { id: true, email: true, name: true, bio: true },
    });

    // Invalidate author cache
    await redisClient.del(`author:${user.id}`);
    return res.json(updated);
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ── Blog Tags Update (extend existing blog create/update) ────────────────────

// POST /api/blogs/:id/tags — set tags for a blog (replace all)
app.put('/api/blogs/:id/tags', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { id } = req.params;
    const { tags } = req.body; // string[]
    if (!Array.isArray(tags)) return res.status(400).json({ error: 'tags must be an array' });

    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const blog = await prisma.blog.findFirst({ where: { id, authorId: user.id } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    // Upsert tags and connect
    const tagRecords = await Promise.all(
      tags.map((name: string) => prisma.tag.upsert({
        where: { name: name.toLowerCase().trim() },
        update: {},
        create: { name: name.toLowerCase().trim() },
      }))
    );

    await prisma.blog.update({
      where: { id },
      data: { tags: { set: tagRecords.map((t: any) => ({ id: t.id })) } },
    });

    await redisClient.del(`blog:${id}`);
    await redisClient.del('tags:all');
    return res.json({ message: 'Tags updated', tags: tagRecords });
  } catch (err) {
    console.error('Error updating tags:', err);
    return res.status(500).json({ error: 'Failed to update tags' });
  }
});

// ── Follow System ─────────────────────────────────────────────────────────────

// POST /api/user/follow — follow a user
app.post('/api/user/follow', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { userId: targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'userId is required' });
    if (targetUserId === user.id) return res.status(400).json({ error: 'Cannot follow yourself' });

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, name: true, email: true } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const follow = await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: user.id, followingId: targetUserId } },
      update: {},
      create: { followerId: user.id, followingId: targetUserId },
    });

    // Notify the followed user
    await prisma.notification.create({
      data: {
        message: `${user.name || user.email.split('@')[0]} started following you.`,
        userId: targetUserId,
        read: false,
      },
    });
    await broadcastNotificationUpdate(targetUserId);
    await redisClient.del(`author:${targetUserId}`);

    return res.status(201).json({ message: 'Followed successfully', follow });
  } catch (err) {
    console.error('Error following user:', err);
    return res.status(500).json({ error: 'Failed to follow user' });
  }
});

// DELETE /api/user/unfollow/:userId — unfollow a user
app.delete('/api/user/unfollow/:userId', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { userId: targetUserId } = req.params;
    await prisma.follow.deleteMany({ where: { followerId: user.id, followingId: targetUserId } });
    await redisClient.del(`author:${targetUserId}`);

    return res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    console.error('Error unfollowing user:', err);
    return res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// GET /api/user/followers — current user's followers
app.get('/api/user/followers', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: { follower: { select: { id: true, email: true, name: true, profilePicture: true, bio: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(followers.map((f: any) => f.follower));
  } catch (err) {
    console.error('Error fetching followers:', err);
    return res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// GET /api/user/following — current user's following list
app.get('/api/user/following', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: { following: { select: { id: true, email: true, name: true, profilePicture: true, bio: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(following.map((f: any) => f.following));
  } catch (err) {
    console.error('Error fetching following:', err);
    return res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// GET /api/user/is-following/:userId — check follow status
app.get('/api/user/is-following/:userId', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { userId: targetUserId } = req.params;
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: targetUserId } },
    });

    return res.json({ isFollowing: !!follow });
  } catch (err) {
    console.error('Error checking follow status:', err);
    return res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// GET /api/authors/:userId/follow-counts — public follower/following counts
app.get('/api/authors/:userId/follow-counts', async (req, res: any) => {
  try {
    const { userId } = req.params;
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);
    return res.json({ followerCount, followingCount });
  } catch (err) {
    console.error('Error fetching follow counts:', err);
    return res.status(500).json({ error: 'Failed to fetch follow counts' });
  }
});

// ── Search ────────────────────────────────────────────────────────────────────

// GET /api/blogs/search?q=... — search blogs by title/content
app.get('/api/blogs/search', async (req, res: any) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) return res.json([]);

    const cacheKey = `search:${q.toLowerCase().slice(0, 100)}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const blogs = await prisma.blog.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { author: { select: { email: true, name: true } }, tags: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    await redisClient.setEx(cacheKey, 120, JSON.stringify(blogs));
    return res.json(blogs);
  } catch (err) {
    console.error('Error searching blogs:', err);
    return res.status(500).json({ error: 'Failed to search blogs' });
  }
});

// ── Reading History ───────────────────────────────────────────────────────────

// POST /api/user/history — record reading
app.post('/api/user/history', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { blogId } = req.body;
    if (!blogId) return res.status(400).json({ error: 'blogId is required' });

    await prisma.readingHistory.upsert({
      where: { userId_blogId: { userId: user.id, blogId } },
      update: { readAt: new Date() },
      create: { userId: user.id, blogId },
    });

    return res.json({ message: 'History recorded' });
  } catch (err) {
    console.error('Error recording history:', err);
    return res.status(500).json({ error: 'Failed to record history' });
  }
});

// GET /api/user/history — get reading history
app.get('/api/user/history', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const history = await prisma.readingHistory.findMany({
      where: { userId: user.id },
      include: {
        blog: {
          include: { author: { select: { email: true, name: true } }, tags: true },
        },
      },
      orderBy: { readAt: 'desc' },
      take: 50,
    });

    return res.json(history.map((h: any) => ({ ...h.blog, readAt: h.readAt })));
  } catch (err) {
    console.error('Error fetching history:', err);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// DELETE /api/user/history — clear reading history
app.delete('/api/user/history', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.readingHistory.deleteMany({ where: { userId: user.id } });
    return res.json({ message: 'History cleared' });
  } catch (err) {
    console.error('Error clearing history:', err);
    return res.status(500).json({ error: 'Failed to clear history' });
  }
});

// ── Series ────────────────────────────────────────────────────────────────────

// POST /api/series — create a series
app.post('/api/series', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Series name is required' });

    const series = await prisma.series.create({
      data: { name: name.trim(), description: description?.trim() || null, authorId: user.id },
    });

    return res.status(201).json(series);
  } catch (err) {
    console.error('Error creating series:', err);
    return res.status(500).json({ error: 'Failed to create series' });
  }
});

// GET /api/series/:id — get series with blogs
app.get('/api/series/:id', async (req, res: any) => {
  try {
    const { id } = req.params;
    const series = await prisma.series.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, email: true, name: true } },
        blogs: {
          where: { published: true },
          orderBy: { seriesOrder: 'asc' },
          include: { author: { select: { email: true, name: true } }, tags: true },
        },
      },
    });
    if (!series) return res.status(404).json({ error: 'Series not found' });
    return res.json(series);
  } catch (err) {
    console.error('Error fetching series:', err);
    return res.status(500).json({ error: 'Failed to fetch series' });
  }
});

// GET /api/user/series — current user's series
app.get('/api/user/series', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const seriesList = await prisma.series.findMany({
      where: { authorId: user.id },
      include: { _count: { select: { blogs: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json(seriesList);
  } catch (err) {
    console.error('Error fetching user series:', err);
    return res.status(500).json({ error: 'Failed to fetch series' });
  }
});

// PUT /api/blogs/:id/series — assign blog to series
app.put('/api/blogs/:id/series', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { id } = req.params;
    const { seriesId, seriesOrder } = req.body;

    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const blog = await prisma.blog.findFirst({ where: { id, authorId: user.id } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const updated = await prisma.blog.update({
      where: { id },
      data: { seriesId: seriesId || null, seriesOrder: seriesOrder ?? null },
    });

    return res.json(updated);
  } catch (err) {
    console.error('Error updating blog series:', err);
    return res.status(500).json({ error: 'Failed to update blog series' });
  }
});

// GET /api/blogs/:id/related — related blogs by shared tags
app.get('/api/blogs/:id/related', async (req, res: any) => {
  try {
    const { id } = req.params;

    const blog = await prisma.blog.findUnique({
      where: { id },
      include: { tags: { select: { id: true } } },
    });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const tagIds = blog.tags.map((t: any) => t.id);
    if (tagIds.length === 0) return res.json([]);

    const related = await prisma.blog.findMany({
      where: {
        published: true,
        id: { not: id },
        tags: { some: { id: { in: tagIds } } },
      },
      include: { author: { select: { email: true, name: true } }, tags: true },
      orderBy: { likes: 'desc' },
      take: 4,
    });

    return res.json(related);
  } catch (err) {
    console.error('Error fetching related blogs:', err);
    return res.status(500).json({ error: 'Failed to fetch related blogs' });
  }
});

// ── Trending Tags ─────────────────────────────────────────────────────────────

// GET /api/tags/trending — top tags by blog count
app.get('/api/tags/trending', async (req, res: any) => {
  try {
    const cacheKey = 'tags:trending';
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const tags = await prisma.tag.findMany({
      include: { _count: { select: { blogs: true } } },
      orderBy: { blogs: { _count: 'desc' } },
      take: 15,
    });

    const result = tags.map((t: any) => ({ name: t.name, count: t._count.blogs }));
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
    return res.json(result);
  } catch (err) {
    console.error('Error fetching trending tags:', err);
    return res.status(500).json({ error: 'Failed to fetch trending tags' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Debugging Deployment Errors
app.get('/version', (_, res) => {
  res.json({
    version: '🟢 blogs-route-present',
    time: new Date().toISOString()
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
