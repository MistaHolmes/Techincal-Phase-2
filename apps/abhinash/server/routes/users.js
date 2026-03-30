import express from 'express';
const router = express.Router();
import db from '../db.js';

// Login or Register pseudo-auth
router.post('/login', (req, res) => {
  const { email, name, role } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (user) {
      res.json({ message: 'Login successful', user });
    } else {
      // Create user
      const avatar = name ? name.charAt(0).toUpperCase() : 'U';
      const gradient = 'linear-gradient(135deg,#6366f1,#a5b4fc)'; // default gradient
      
      const insert = 'INSERT INTO users (name, email, role, avatar, gradient) VALUES (?, ?, ?, ?, ?)';
      db.run(insert, [name || 'Anonymous', email, role || 'Reader', avatar, gradient], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Register successful', user: newUser });
        });
      });
    }
  });
});

// Get all authors (users)
router.get('/', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

export default router;
