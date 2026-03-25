import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import prisma from './prisma';
import redisClient from './redis';

export interface UserConnection {
  ws: WebSocket;
  isAlive: boolean;
  userId: string;
}

export const userConnections = new Map<string, UserConnection>();

let wssInstance: WebSocketServer | null = null;

export function getWSS(): WebSocketServer {
  if (!wssInstance) throw new Error('WebSocket server not initialized');
  return wssInstance;
}

// Helper function to get notifications for a user
export async function getNotificationsForUser(userId: string) {
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
export async function broadcastNotificationUpdate(userId: string) {
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

// Cache helpers
export const getCacheKey = (userId: string, type: 'all' | 'published' | 'drafts') => {
  return `user:${userId}:blogs:${type}`;
};

export const invalidateUserBlogsCache = async (userId: string) => {
  const keys = [
    getCacheKey(userId, 'all'),
    getCacheKey(userId, 'published'),
    getCacheKey(userId, 'drafts'),
    `user_blogs:${userId}`,
  ];
  await Promise.all(keys.map(key => redisClient.del(key)));
};

export const invalidatePublicBlogsCache = async () => {
  await redisClient.del('blogs:all');
};

export function initWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server });
  wssInstance = wss;

  const PING_INTERVAL = 30000;

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
    let userId: string | null = null;
    let connectionData: UserConnection = { ws, isAlive: true, userId: '' };

    ws.on('pong', () => {
      if (connectionData) connectionData.isAlive = true;
    });

    ws.on('message', async (message) => {
      const data = message.toString();

      if (data.startsWith('register:')) {
        userId = data.split(':')[1];
        connectionData.userId = userId;
        connectionData.isAlive = true;
        userConnections.set(userId, connectionData);

        try {
          const notifications = await getNotificationsForUser(userId);
          const unreadCount = notifications.filter((n: any) => !n.read).length;
          ws.send(JSON.stringify({ type: 'initial_notifications', notifications, unreadCount }));
        } catch (error) {
          console.error('Error sending initial notifications:', error);
        }
      }

      if (data === 'pong') { connectionData.isAlive = true; return; }
      if (data === 'ping') { connectionData.isAlive = true; ws.send('pong'); return; }

      if (data.startsWith('getLikes:')) {
        const blogId = data.split(':')[1];
        const blog = await prisma.blog.findUnique({ where: { id: blogId }, select: { likes: true } });
        ws.send(JSON.stringify({ type: 'likes_update', blogId, likes: blog?.likes ?? 0 }));
        return;
      }

      if (data.startsWith('like:')) {
        const blogId = data.split(':')[1];
        try {
          const updatedBlog = await prisma.blog.update({
            where: { id: blogId }, data: { likes: { increment: 1 } }, select: { likes: true },
          });
          await redisClient.del(`blog:${blogId}`);
          const payload = JSON.stringify({ type: 'likes_update', blogId, likes: updatedBlog.likes });
          wss.clients.forEach((client) => { if (client.readyState === WebSocket.OPEN) client.send(payload); });
        } catch (err) {
          console.error('Error incrementing likes:', err);
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to like blog' }));
        }
        return;
      }

      if (data.startsWith('unlike:')) {
        const blogId = data.split(':')[1];
        try {
          const current = await prisma.blog.findUnique({ where: { id: blogId }, select: { likes: true } });
          const newLikes = Math.max(0, (current?.likes ?? 1) - 1);
          const updatedBlog = await prisma.blog.update({
            where: { id: blogId }, data: { likes: newLikes }, select: { likes: true },
          });
          await redisClient.del(`blog:${blogId}`);
          const payload = JSON.stringify({ type: 'likes_update', blogId, likes: updatedBlog.likes });
          wss.clients.forEach((client) => { if (client.readyState === WebSocket.OPEN) client.send(payload); });
        } catch (err) {
          console.error('Error decrementing likes:', err);
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to unlike blog' }));
        }
        return;
      }
    });

    ws.on('close', () => { if (userId) userConnections.delete(userId); });
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
      if (userId) userConnections.delete(userId);
    });
  });

  return wss;
}
