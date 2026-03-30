import express from 'express';
import cors from 'cors';
import postsRouter from './routes/posts.js';
import usersRouter from './routes/users.js';

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', usersRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
