import sqlite3Pkg from 'sqlite3';
const sqlite3 = sqlite3Pkg.verbose();
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to SQLite DB in the server directory
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT,
      avatar TEXT,
      gradient TEXT
    )`);

    // Create Posts Table
    db.run(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      emoji TEXT,
      title TEXT NOT NULL,
      excerpt TEXT,
      content TEXT,
      authorId INTEGER,
      date TEXT,
      readTime TEXT,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      bookmarks INTEGER DEFAULT 0,
      featured BOOLEAN DEFAULT 0,
      tags TEXT,
      FOREIGN KEY(authorId) REFERENCES users(id)
    )`, () => {
      // Seed Initial Data if empty
      db.get("SELECT COUNT(*) AS count FROM posts", (err, row) => {
        if (!err && row.count === 0) {
          seedDatabase();
        }
      });
    });
  }
});

function seedDatabase() {
  console.log('Seeding initial data...');
  const authors = [
    { name: 'Abhinash K.', email: 'abhinash@example.com', role: 'Tech Writer', avatar: 'A', gradient: 'linear-gradient(135deg,#2563eb,#60a5fa)' },
    { name: 'Priya Singh', email: 'priya@example.com', role: 'Designer', avatar: 'P', gradient: 'linear-gradient(135deg,#3b82f6,#93c5fd)' },
    { name: 'Rohan Mehta', email: 'rohan@example.com', role: 'Developer', avatar: 'R', gradient: 'linear-gradient(135deg,#6366f1,#a5b4fc)' },
    { name: 'Sneha Das', email: 'sneha@example.com', role: 'Blogger', avatar: 'S', gradient: 'linear-gradient(135deg,#06b6d4,#22d3ee)' },
  ];

  const insertUser = db.prepare('INSERT INTO users (name, email, role, avatar, gradient) VALUES (?, ?, ?, ?, ?)');
  authors.forEach(author => insertUser.run(author.name, author.email, author.role, author.avatar, author.gradient));
  insertUser.finalize();

  const posts = [
    {
      category: 'tech', emoji: '🤖', title: 'The Future of AI: What Developers Need to Know in 2025',
      excerpt: "Artificial intelligence is evolving at breakneck speed. From large language models to multimodal AI, here's what every developer needs to understand about the landscape shaping our future.",
      content: `<h2>The AI Revolution</h2><p>Artificial intelligence has transitioned from a futuristic concept to an everyday reality. In 2025, AI tools are embedded in development workflows, creative processes, and business strategies worldwide.</p><blockquote>"AI won't replace humans – but humans who use AI will replace those who don't." — Karim Lakhani, Harvard Business School</blockquote><h2>Key Trends to Watch</h2><p>Large Language Models (LLMs) have become increasingly sophisticated, capable of understanding context, generating code, and reasoning through complex problems. The GPT-4, Claude, and Gemini families have pushed boundaries we thought were years away.</p><p>Multimodal AI – systems that can understand text, images, audio, and video simultaneously – represents the next frontier. These systems blur the lines between specialized AI tools and general-purpose intelligence.</p><h2>What Developers Should Focus On</h2><p>Understanding prompt engineering, fine-tuning techniques, and AI API integration has become essential. The ability to orchestrate AI agents – autonomous systems that can take actions on your behalf – is becoming a key differentiator for developers.</p>`,
      authorId: 1, date: 'Mar 20, 2025', readTime: '8 min read', likes: 142, comments: 28, bookmarks: 67, featured: 1, tags: JSON.stringify(['AI', 'Machine Learning', 'Development', 'Future'])
    },
    {
      category: 'design', emoji: '🎨', title: 'Design Systems That Scale: From Startup to Enterprise',
      excerpt: 'Building a design system that grows with your company is both an art and a science. We explore the principles that make systems truly scalable.',
      content: `<h2>Why Design Systems Matter</h2><p>A well-crafted design system is the backbone of any successful digital product. It ensures consistency, speeds up development, and keeps your brand cohesive across every touchpoint.</p><h2>Core Principles</h2><p>The best design systems start small and grow intentionally. Begin with core tokens – colors, typography, spacing – and build components on top of those foundations. Every decision should be documented and purposeful.</p><blockquote>A design system is a product that serves products. Treat it with the same rigor you would any customer-facing application.</blockquote><p>Component composition is key. Rather than building monolithic components, create small, focused pieces that can be combined in powerful ways. This gives teams flexibility while maintaining consistency.</p>`,
      authorId: 2, date: 'Mar 18, 2025', readTime: '6 min read', likes: 89, comments: 15, bookmarks: 43, featured: 1, tags: JSON.stringify(['Design', 'UI/UX', 'Systems', 'Figma'])
    },
    {
      category: 'travel', emoji: '🏔️', title: "Hidden Gems of the Himalayas: A Trekker's Ultimate Guide",
      excerpt: 'Beyond the famous trails lies a raw, untouched Himalaya. From secret valleys to ancient monasteries, discover destinations that most travelers never find.',
      content: `<h2>Beyond the Beaten Path</h2><p>The Himalayas stretch across five countries and contain thousands of valleys, peaks, and hidden communities. Most trekkers stick to the famous routes – Everest Base Camp, Annapurna Circuit – but the real magic lies deeper.</p><h2>Spiti Valley, Himachal Pradesh</h2><p>This cold desert valley, often called "Little Tibet," sits at altitudes above 3,800 meters. The ancient Ki Monastery, perched dramatically on a hilltop, has stood for over 1,000 years.</p><blockquote>In the mountains, you find what you didn't know you were looking for.</blockquote><p>The best time to visit Spiti is June through September, when mountain roads are open. Be prepared for altitude sickness and carry appropriate medication.</p>`,
      authorId: 4, date: 'Mar 15, 2025', readTime: '10 min read', likes: 234, comments: 42, bookmarks: 118, featured: 0, tags: JSON.stringify(['Travel', 'Himalayas', 'Trekking', 'India'])
    }
  ];

  const insertPost = db.prepare('INSERT INTO posts (category, emoji, title, excerpt, content, authorId, date, readTime, likes, comments, bookmarks, featured, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  posts.forEach(p => insertPost.run(p.category, p.emoji, p.title, p.excerpt, p.content, p.authorId, p.date, p.readTime, p.likes, p.comments, p.bookmarks, p.featured, p.tags));
  insertPost.finalize();
  console.log('Database seeded successfully.');
}

export default db;
