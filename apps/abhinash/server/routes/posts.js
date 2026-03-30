import express from 'express';
const router = express.Router();
import db from '../db.js';

// Get all posts including author details
router.get('/', (req, res) => {
  const { category, trending } = req.query;
  let query = `
    SELECT p.*, u.name as authorName, u.role as authorRole, u.avatar as authorAvatar, u.gradient as authorGradient
    FROM posts p
    LEFT JOIN users u ON p.authorId = u.id
  `;
  let params = [];

  if (category && category !== 'all') {
    query += ` WHERE p.category = ?`;
    params.push(category);
  }

  if (trending === 'true') {
    query += ` ORDER BY p.likes DESC, p.id DESC`;
  } else {
    query += ` ORDER BY p.id DESC`;
  }
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Format response to match frontend expectations
    const posts = rows.map(row => {
      let tags = [];
      try { tags = row.tags ? JSON.parse(row.tags) : []; } catch(e) {}
      
      return {
        id: row.id,
        category: row.category,
        emoji: row.emoji,
        title: row.title,
        excerpt: row.excerpt,
        content: row.content,
        date: row.date,
        readTime: row.readTime,
        likes: row.likes,
        comments: row.comments,
        bookmarks: row.bookmarks,
        featured: Boolean(row.featured),
        tags: tags,
        author: {
          id: row.authorId,
          name: row.authorName,
          role: row.authorRole,
          avatar: row.authorAvatar,
          gradient: row.authorGradient
        }
      };
    });
    
    res.json(posts);
  });
});

// Create a new post
router.post('/', (req, res) => {
  const { title, excerpt, content, category, emoji, authorId } = req.body;
  if (!title || !authorId) return res.status(400).json({ error: 'Missing title or author ID' });

  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const readTime = Math.max(1, Math.ceil((content || '').split(' ').length / 200)) + ' min read';

  const sql = `INSERT INTO posts 
    (title, excerpt, content, category, emoji, authorId, date, readTime, tags) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [title, excerpt, content, category, emoji || '📝', authorId, date, readTime, '[]'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Post created' });
  });
});

// Toggle Like
router.put('/:id/like', (req, res) => {
  const inc = req.body.increment ? 1 : -1;
  db.run('UPDATE posts SET likes = likes + ? WHERE id = ?', [inc, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Like updated' });
  });
});

// Toggle Bookmark
router.put('/:id/bookmark', (req, res) => {
  const inc = req.body.increment ? 1 : -1;
  db.run('UPDATE posts SET bookmarks = bookmarks + ? WHERE id = ?', [inc, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Bookmark updated' });
  });
});

export default router;
