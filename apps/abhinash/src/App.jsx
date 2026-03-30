import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import './index.css'
import './App.css'

// ─── DATA ─────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',      label: '🌐 All' },
  { id: 'tech',     label: '💻 Technology' },
  { id: 'design',   label: '🎨 Design' },
  { id: 'travel',   label: '✈️ Travel' },
  { id: 'food',     label: '🍜 Food' },
  { id: 'health',   label: '💪 Health' },
  { id: 'business', label: '💼 Business' },
  { id: 'science',  label: '🔬 Science' },
]

const AUTHORS = [
  { id: 1, name: 'Abhinash K.', role: 'Tech Writer',  avatar: 'A', gradient: 'linear-gradient(135deg,#2563eb,#60a5fa)' },
  { id: 2, name: 'Priya Singh',  role: 'Designer',     avatar: 'P', gradient: 'linear-gradient(135deg,#3b82f6,#93c5fd)' },
  { id: 3, name: 'Rohan Mehta',  role: 'Developer',    avatar: 'R', gradient: 'linear-gradient(135deg,#6366f1,#a5b4fc)' },
  { id: 4, name: 'Sneha Das',    role: 'Blogger',      avatar: 'S', gradient: 'linear-gradient(135deg,#06b6d4,#22d3ee)' },
]

const INITIAL_POSTS = [
  {
    id: 1, category: 'tech', emoji: '🤖',
    title: 'The Future of AI: What Developers Need to Know in 2025',
    excerpt: 'Artificial intelligence is evolving at breakneck speed. From large language models to multimodal AI, here\'s what every developer needs to understand about the landscape shaping our future.',
    content: `<h2>The AI Revolution</h2><p>Artificial intelligence has transitioned from a futuristic concept to an everyday reality. In 2025, AI tools are embedded in development workflows, creative processes, and business strategies worldwide.</p><blockquote>"AI won't replace humans – but humans who use AI will replace those who don't." — Karim Lakhani, Harvard Business School</blockquote><h2>Key Trends to Watch</h2><p>Large Language Models (LLMs) have become increasingly sophisticated, capable of understanding context, generating code, and reasoning through complex problems. The GPT-4, Claude, and Gemini families have pushed boundaries we thought were years away.</p><p>Multimodal AI – systems that can understand text, images, audio, and video simultaneously – represents the next frontier. These systems blur the lines between specialized AI tools and general-purpose intelligence.</p><h2>What Developers Should Focus On</h2><p>Understanding prompt engineering, fine-tuning techniques, and AI API integration has become essential. The ability to orchestrate AI agents – autonomous systems that can take actions on your behalf – is becoming a key differentiator for developers.</p>`,
    author: AUTHORS[0], date: 'Mar 20, 2025', readTime: '8 min read',
    likes: 142, comments: 28, bookmarks: 67, featured: true,
    tags: ['AI', 'Machine Learning', 'Development', 'Future'],
  },
  {
    id: 2, category: 'design', emoji: '🎨',
    title: 'Design Systems That Scale: From Startup to Enterprise',
    excerpt: 'Building a design system that grows with your company is both an art and a science. We explore the principles that make systems truly scalable.',
    content: `<h2>Why Design Systems Matter</h2><p>A well-crafted design system is the backbone of any successful digital product. It ensures consistency, speeds up development, and keeps your brand cohesive across every touchpoint.</p><h2>Core Principles</h2><p>The best design systems start small and grow intentionally. Begin with core tokens – colors, typography, spacing – and build components on top of those foundations. Every decision should be documented and purposeful.</p><blockquote>A design system is a product that serves products. Treat it with the same rigor you would any customer-facing application.</blockquote><p>Component composition is key. Rather than building monolithic components, create small, focused pieces that can be combined in powerful ways. This gives teams flexibility while maintaining consistency.</p>`,
    author: AUTHORS[1], date: 'Mar 18, 2025', readTime: '6 min read',
    likes: 89, comments: 15, bookmarks: 43, featured: true,
    tags: ['Design', 'UI/UX', 'Systems', 'Figma'],
  },
  {
    id: 3, category: 'travel', emoji: '🏔️',
    title: 'Hidden Gems of the Himalayas: A Trekker\'s Ultimate Guide',
    excerpt: 'Beyond the famous trails lies a raw, untouched Himalaya. From secret valleys to ancient monasteries, discover destinations that most travelers never find.',
    content: `<h2>Beyond the Beaten Path</h2><p>The Himalayas stretch across five countries and contain thousands of valleys, peaks, and hidden communities. Most trekkers stick to the famous routes – Everest Base Camp, Annapurna Circuit – but the real magic lies deeper.</p><h2>Spiti Valley, Himachal Pradesh</h2><p>This cold desert valley, often called "Little Tibet," sits at altitudes above 3,800 meters. The ancient Ki Monastery, perched dramatically on a hilltop, has stood for over 1,000 years.</p><blockquote>In the mountains, you find what you didn't know you were looking for.</blockquote><p>The best time to visit Spiti is June through September, when mountain roads are open. Be prepared for altitude sickness and carry appropriate medication.</p>`,
    author: AUTHORS[3], date: 'Mar 15, 2025', readTime: '10 min read',
    likes: 234, comments: 42, bookmarks: 118,
    tags: ['Travel', 'Himalayas', 'Trekking', 'India'],
  },
  {
    id: 4, category: 'food', emoji: '🍣',
    title: 'Mastering Japanese Ramen: A Complete Guide for Home Cooks',
    excerpt: 'The depth of a perfect bowl of ramen goes far beyond instant noodles. Learn the art of crafting rich tonkotsu broth, perfectly marinated eggs, and hand-pulled noodles.',
    content: `<h2>The Philosophy of Ramen</h2><p>Ramen is more than a meal – it's a cultural institution. Japanese ramen chefs spend years perfecting their craft, obsessing over every element from the broth's fat ratio to the precise alkalinity of noodles.</p><h2>The Four Pillars</h2><p>A perfect bowl of ramen consists of four components: tare (seasoning sauce), broth or soup base, noodles, and toppings. Each element contributes uniquely to the final experience.</p><blockquote>The mark of a great ramen shop is the broth – it should be so complex that you taste something new with every sip.</blockquote><p>Tonkotsu broth is made by boiling pork bones at a rolling boil for 10-18 hours. This vigorous process emulsifies the fat and collagen, creating the signature creamy, milky white soup.</p>`,
    author: AUTHORS[2], date: 'Mar 12, 2025', readTime: '12 min read',
    likes: 389, comments: 67, bookmarks: 201,
    tags: ['Food', 'Japanese', 'Recipe', 'Cooking'],
  },
  {
    id: 5, category: 'health', emoji: '🧘',
    title: 'The Science of Deep Sleep: How to Optimize Your Rest',
    excerpt: 'Modern science has revealed that quality sleep is the single most powerful performance enhancer available to humans. Here\'s how to unlock its full potential.',
    content: `<h2>Understanding Sleep Architecture</h2><p>Sleep is not a uniform state. Throughout the night, your brain cycles through different stages – light sleep, deep sleep (slow-wave sleep), and REM sleep – each serving distinct biological functions.</p><h2>The Power of Deep Sleep</h2><p>Slow-wave sleep is where the magic happens. During these stages, your body releases growth hormone, repairs cellular damage, consolidates memories, and clears metabolic waste from the brain through the glymphatic system.</p><blockquote>Sleep is the foundation upon which every aspect of mental and physical health is built. — Dr. Matthew Walker</blockquote>`,
    author: AUTHORS[0], date: 'Mar 10, 2025', readTime: '7 min read',
    likes: 156, comments: 31, bookmarks: 88,
    tags: ['Health', 'Sleep', 'Wellness', 'Science'],
  },
  {
    id: 6, category: 'business', emoji: '🚀',
    title: 'Building a Profitable SaaS from Zero: Lessons from the Trenches',
    excerpt: 'After building three SaaS products – one failure, one modest success, one breakout hit – here are the hard lessons that no business school teaches.',
    content: `<h2>My SaaS Journey</h2><p>In 2020, I quit my job to build software. Fast forward to 2025, and I've launched three different products, watched one fail spectacularly, sold another for a modest profit, and watched the third grow to $1.2M ARR.</p><h2>Lesson 1: Fall in Love with the Problem</h2><p>My first product failed because I fell in love with my solution, not the problem. I built features nobody asked for, ignored user feedback, and ran out of runway after 8 months.</p><blockquote>The market is the only opinion that matters.</blockquote><p>For my successful product, I spent three months interviewing users, understanding their workflows, and mapping their pain points before I ever opened an IDE.</p>`,
    author: AUTHORS[2], date: 'Mar 8, 2025', readTime: '15 min read',
    likes: 521, comments: 89, bookmarks: 312,
    tags: ['Business', 'SaaS', 'Startup', 'Entrepreneurship'],
  },
]

const TAGS = ['React', 'JavaScript', 'Design', 'Travel', 'Food', 'Health', 'AI', 'CSS', 'Python', 'Startup', 'Photography', 'Music']

// ─── HOOKS ────────────────────────────────────────────────────────

/** Intersection Observer scroll-reveal hook */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

/** Animated counter */
function useCounter(target, duration = 1400, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (ts) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

// ─── PARTICLE SYSTEM ──────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Blue theme accent color
      const accent = '#2563eb' 

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(37,99,235,${p.alpha})`
        ctx.fill()
      })

      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(37,99,235,${0.12 * (1 - dist / 110)})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.7 }}
    />
  )
}

// ─── COMPONENTS ───────────────────────────────────────────────────

function Toast({ toasts }) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' }
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{icons[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

function AuthorAvatar({ author, size = 34 }) {
  return (
    <div className="author-avatar-ring" style={{ padding: 2 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: author.gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
      }}>{author.avatar}</div>
    </div>
  )
}

/** Ripple button wrapper */
function RippleBtn({ className, children, onClick, style, id, disabled }) {
  const handleClick = (e) => {
    const btn = e.currentTarget
    const ripple = document.createElement('span')
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    ripple.style.cssText = `
      position:absolute; border-radius:50%;
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px;
      background:rgba(255,255,255,0.35);
      transform:scale(0); animation:ripple-anim 0.6s linear;
      pointer-events:none;
    `
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 620)
    onClick && onClick(e)
  }
  return (
    <button
      className={className} onClick={handleClick}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      id={id} disabled={disabled}
    >
      {children}
    </button>
  )
}

function Navbar({ theme, setTheme, user, onSignIn, onWrite, searchQuery, setSearchQuery, activeView, setActiveView, onLogout }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  useEffect(() => {
    let ticking = false;
    const fn = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <div className="nav-logo" onClick={() => setActiveView('home')}>
          ✍️ Inkwell
        </div>

        <ul className="nav-links">
          {['Home', 'Explore', 'Topics', 'Contact'].map(link => (
            <li key={link}>
              <a
                href={link === 'Contact' ? '#contact' : '#'}
                className={activeView === link.toLowerCase() ? 'active' : ''}
                onClick={e => {
                  if (link !== 'Contact') {
                    e.preventDefault();
                    setActiveView(link.toLowerCase());
                  }
                }}
              >{link}</a>
            </li>
          ))}
        </ul>

        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text" placeholder="Search posts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            id="search-input"
          />
        </div>

        <div className="nav-actions">
          <button
            className="theme-toggle" title="Toggle theme"
            id="theme-toggle-btn"
            onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          >
            <span style={{ display: 'inline-block', transition: 'transform 0.5s cubic-bezier(.34,1.56,.64,1)', color: 'var(--text-primary)' }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </span>
          </button>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button className="nav-user-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                <AuthorAvatar author={user} size={30} />
                <span className="nav-user-name">{user.name.split(' ')[0]}</span>
              </button>
              {showProfileDropdown && (
                <div className="nav-dropdown">
                  <div className="nav-dropdown-item" onClick={() => { onWrite(); setShowProfileDropdown(false); }}>✏️ Write a Post</div>
                  <div className="nav-dropdown-item">👤 Profile Settings</div>
                  <div className="nav-dropdown-item">🔖 Bookmarks</div>
                  <div className="nav-dropdown-divider" />
                  <div className="nav-dropdown-item danger" onClick={() => { onLogout(); setShowProfileDropdown(false); }}>🔌 Sign Out</div>
                </div>
              )}
            </div>
          ) : (
            <RippleBtn className="btn btn-primary" onClick={onSignIn} id="signin-btn">
              ⚡ Sign In
            </RippleBtn>
          )}

          <button className="hamburger" onClick={() => setMobileOpen(o => !o)} id="hamburger-btn">
            <span /><span /><span />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 24px', background: 'var(--bg-nav)', animation: 'slideUp 0.3s ease' }}>
          {['Home', 'Explore', 'Topics', 'Contact'].map(link => (
            <a key={link} href={link === 'Contact' ? '#contact' : '#'} style={{
              display: 'block', padding: '10px 0', fontWeight: 500,
              color: activeView === link.toLowerCase() ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: '1px solid var(--border)',
            }} onClick={e => {
              if (link !== 'Contact') e.preventDefault();
              setActiveView(link.toLowerCase());
              setMobileOpen(false);
            }}>
              {link}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}

// Typewriter hook
function useTypewriter(words, speed = 80, pause = 2000) {
  const [text, setText] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = words[wordIndex % words.length]
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(current.slice(0, text.length + 1))
        if (text.length + 1 === current.length) setTimeout(() => setDeleting(true), pause)
      } else {
        setText(current.slice(0, text.length - 1))
        if (text.length - 1 === 0) { setDeleting(false); setWordIndex(i => i + 1) }
      }
    }, deleting ? speed / 2 : speed)
    return () => clearTimeout(timeout)
  }, [text, deleting, wordIndex, words, speed, pause])

  return text
}

function HeroSection({ onWrite, totalPosts }) {
  const typeText = useTypewriter([
    'Ideas Come to Life',
    'Stories Get Told',
    'Writers Shine',
    'Knowledge Flows',
  ], 70, 2200)

  const [statVisible, setStatVisible] = useState(false)
  const statsRef = useRef(null)
  const postsCount    = useCounter(totalPosts, 1200, statVisible)
  const readersCount  = useCounter(12000, 1600, statVisible)
  const writersCount  = useCounter(48, 1000, statVisible)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatVisible(true) }, { threshold: 0.4 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section className="hero-section">
      <ParticleCanvas />
      <div className="hero-grid" />
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />

      {/* Floating decorations */}
      <div className="hero-float-emoji hfe-1">💡</div>
      <div className="hero-float-emoji hfe-2">⚡</div>
      <div className="hero-float-emoji hfe-3">🌟</div>
      <div className="hero-float-emoji hfe-4">📚</div>
      <div className="hero-float-emoji hfe-5">🎯</div>

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="hero-content">
          <div className="hero-tag">
            <span className="live-dot" />
            New posts every day — join thousands of readers
          </div>

          <h1 className="hero-title">
            Where&nbsp;
            <span className="highlight">{typeText}</span>
            <span className="typewriter-cursor" />
          </h1>

          <p className="hero-subtitle">
            Discover stories, thinking, and expertise from writers on any topic.
            Your next great read is just one click away.
          </p>

          <div className="hero-actions">
            <RippleBtn className="btn btn-primary" onClick={onWrite} id="hero-write-btn">
              ✏️ Start Writing
            </RippleBtn>
            <RippleBtn className="btn btn-outline" id="hero-explore-btn">
              🔥 Explore Trending
            </RippleBtn>
          </div>

          <div className="hero-stats reveal" ref={statsRef}>
            <div className="hero-stat">
              <div className="hero-stat-value">{statVisible ? postsCount : 0}+</div>
              <div className="hero-stat-label">Articles</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">
                {statVisible ? (readersCount >= 1000 ? `${(readersCount / 1000).toFixed(1)}K` : readersCount) : 0}+
              </div>
              <div className="hero-stat-label">Readers</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">{statVisible ? writersCount : 0}+</div>
              <div className="hero-stat-label">Writers</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">6</div>
              <div className="hero-stat-label">Topics</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** 3-D tilt card wrapper */
function TiltCard({ children, className, onClick, id, revealDelay = 0 }) {
  const cardRef = useRef(null)

  const handleMouseMove = (e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -9
    const rotateY = ((x - centerX) / centerX) * 9
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-7px) scale(1.018)`
    card.style.boxShadow = `${rotateY * -2}px ${rotateX * 2}px 48px rgba(37,99,235,0.22), var(--card-shadow-hover)`
  }

  const handleMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = ''
    card.style.boxShadow = ''
  }

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      id={id}
      style={{
        transitionDelay: `${revealDelay}s`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}

// Category gradient map for vivid card covers
const CAT_GRADIENTS = {
  tech:     'linear-gradient(135deg,#1e1b4b 0%,#3730a3 40%,#6d28d9 100%)',
  design:   'linear-gradient(135deg,#831843 0%,#be185d 40%,#f472b6 100%)',
  travel:   'linear-gradient(135deg,#064e3b 0%,#059669 40%,#34d399 100%)',
  food:     'linear-gradient(135deg,#7c2d12 0%,#c2410c 40%,#fb923c 100%)',
  health:   'linear-gradient(135deg,#164e63 0%,#0e7490 40%,#22d3ee 100%)',
  business: 'linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 40%,#60a5fa 100%)',
  science:  'linear-gradient(135deg,#2d1b69 0%,#7c3aed 40%,#c4b5fd 100%)',
}

function PostCard({ post, onClick, onLike, onBookmark, isFeatured = false, delay = 0 }) {
  const coverGrad = CAT_GRADIENTS[post.category] || CAT_GRADIENTS.tech

  return (
    <TiltCard
      className={`${isFeatured ? 'featured-card featured-card-main' : 'post-card'} reveal`}
      onClick={() => onClick(post)}
      id={`post-card-${post.id}`}
      revealDelay={delay}
    >
      {/* Vivid category-coloured cover */}
      <div
        className={`card-image ${isFeatured ? 'tall' : ''}`}
        style={{ background: coverGrad, position: 'relative', overflow: 'hidden' }}
      >
        {/* animated shimmer sweep */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.12) 50%,transparent 60%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2.5s infinite',
        }} />
        {/* scan line */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)',
          animation: 'scan-line 2.5s linear infinite',
          zIndex: 1,
        }} />
        {/* emoji — always on top */}
        <span style={{
          fontSize: isFeatured ? '5.5rem' : '4.2rem',
          position: 'relative', zIndex: 2,
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.35))',
          transition: 'transform 0.5s cubic-bezier(.34,1.56,.64,1)',
          display: 'inline-block',
        }}
          className="card-image-emoji"
        >
          {post.emoji}
        </span>
      </div>

      <div className="card-body">
        <div className="card-meta">
          <span className="card-category">
            {CATEGORIES.find(c => c.id === post.category)?.label.split(' ')[1] || post.category}
          </span>
          <span className="card-date">⏱ {post.readTime}</span>
          <span className="card-date">📅 {post.date}</span>
        </div>
        <h2 className="card-title">{post.title}</h2>
        <p className="card-excerpt">{post.excerpt}</p>
        <div className="card-footer">
          <div className="author-info">
            <AuthorAvatar author={post.author} />
            <div>
              <div className="author-name">{post.author.name}</div>
              <div className="author-role">{post.author.role}</div>
            </div>
          </div>
          <div className="card-actions" onClick={e => e.stopPropagation()}>
            <button
              className={`action-btn ${post.liked ? 'liked' : ''}`}
              onClick={() => onLike(post.id)}
              id={`like-btn-${post.id}`}
            >
              {post.liked ? '❤️' : '🤍'} {post.likes}
            </button>
            <button
              className={`action-btn ${post.bookmarked ? 'bookmarked' : ''}`}
              onClick={() => onBookmark(post.id)}
              id={`bookmark-btn-${post.id}`}
            >
              {post.bookmarked ? '🔖' : '📌'} {post.bookmarks}
            </button>
            <span className="action-btn">💬 {post.comments}</span>
          </div>
        </div>
      </div>
    </TiltCard>
  )
}

function Sidebar({ posts, activeTag, setActiveTag, onSubscribe }) {
  const trending = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 5)
  return (
    <aside className="sidebar">
      {/* Newsletter */}
      <div className="sidebar-widget newsletter-widget reveal delay-1">
        <div className="widget-title">📧 Stay Updated</div>
        <p>Get the best stories delivered straight to your inbox. Join 12,000+ readers.</p>
        <div className="newsletter-form">
          <input className="newsletter-input" type="email" placeholder="your@email.com" id="newsletter-email" />
          <RippleBtn className="newsletter-btn" onClick={onSubscribe} id="newsletter-btn">
            Subscribe Free →
          </RippleBtn>
        </div>
      </div>

      {/* Trending */}
      <div className="sidebar-widget reveal delay-2">
        <div className="widget-title">🔥 Trending Now</div>
        {trending.map((post, i) => (
          <div key={post.id} className="trending-item" style={{ transitionDelay: `${i * 0.06}s` }}>
            <div className="trending-num">0{i + 1}</div>
            <div>
              <div className="trending-title">{post.title}</div>
              <div className="trending-meta">❤️ {post.likes} likes · {post.readTime}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div className="sidebar-widget reveal delay-3">
        <div className="widget-title">🏷️ Browse by Tag</div>
        <div className="tags-cloud">
          {TAGS.map((tag, i) => (
            <button
              key={tag}
              className={`tag-chip ${activeTag === tag ? 'active' : ''}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              id={`tag-${tag.toLowerCase()}`}
              style={{ transitionDelay: `${i * 0.03}s` }}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="sidebar-widget reveal delay-4">
        <div className="widget-title">✨ About Inkwell</div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          A community of curious minds sharing ideas that matter.
          From technology to travel, find stories that inspire, educate, and entertain.
        </p>
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <span className="badge badge-success">✓ Free Forever</span>
          <span className="badge badge-accent">🔒 No Ads</span>
        </div>
      </div>
    </aside>
  )
}

function LoginPage({ onAuth, user }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/')
  }, [user])

  const handleSubmit = (e) => {
    e.preventDefault();
    onAuth({ name: name || 'Abhinash Kumar', email, role: 'Writer & Tech Enthusiast' });
    navigate('/')
  }

  return (
    <div className="login-page">
      <div className="login-split-viz">
        <ParticleCanvas />
        <div className="login-viz-content">
          <h1 className="nav-logo" style={{ fontSize: '2.5rem', marginBottom: 20 }}>✍️ Inkwell</h1>
          <p style={{ maxWidth: 400, opacity: 0.8, fontSize: '1.1rem', lineHeight: 1.6 }}>
            "A reader lives a thousand lives before he dies. The man who never reads lives only one."
          </p>
          <div className="login-viz-stat">
            <div className="hero-stat-value">25K+</div>
            <div className="hero-stat-label">Active Readers Each Month</div>
          </div>
        </div>
      </div>

      <div className="login-split-form">
        <div className="login-form-container reveal">
          <Link to="/" className="btn btn-ghost" style={{ marginBottom: 40, width: 'fit-content' }}>← Back to Feed</Link>
          <h2 className="section-title" style={{ fontSize: '2.2rem', marginBottom: 12 }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
            {isLogin ? 'Enter your details to access your account.' : 'Join our professional network of writers.'}
          </p>

          <form onSubmit={handleSubmit} className="form-group" style={{ gap: 20 }}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" placeholder="Abhinash Kumar" required value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" /> Remember me
              </label>
              {isLogin && <a href="#" style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>Forgot password?</a>}
            </div>

            <RippleBtn className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: 10, fontSize: '1.05rem' }}>
              {isLogin ? '🔓 Sign In' : '🎉 Join for Free'}
            </RippleBtn>
          </form>

          <div className="auth-divider" style={{ margin: '32px 0' }}>or continue with</div>

          <div className="form-row">
            <button className="oauth-btn"><span>G</span> Google</button>
            <button className="oauth-btn"><span>𝕏</span> Twitter</button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 32, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <span
              style={{ color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign up free' : 'Log in here'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

function WriteModal({ onClose, onPublish }) {
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('tech')
  const [selectedEmoji, setSelectedEmoji] = useState('📝')
  const [authorName, setAuthorName] = useState('')

  const emojis = ['📝', '💻', '🎨', '🌍', '🍕', '💪', '💼', '🔬', '🎵', '📸', '🚀', '🌱']

  const handlePublish = () => {
    if (!title.trim() || !excerpt.trim()) return
    onPublish({ title, excerpt, content: content || excerpt, category, emoji: selectedEmoji,
      author: { name: authorName || 'Abhinash K.', avatar: (authorName || 'A')[0], gradient: 'linear-gradient(135deg,var(--accent),var(--accent2))' } })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">✍️ Write a New Post</h2>
          <button className="modal-close" onClick={onClose} id="modal-close-btn">✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Your Name</label>
            <input className="form-input" type="text" placeholder="e.g. Abhinash Kumar"
              value={authorName} onChange={e => setAuthorName(e.target.value)} id="author-name-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Post Title *</label>
            <input className="form-input" type="text" placeholder="Write a compelling title..."
              value={title} onChange={e => setTitle(e.target.value)} id="post-title-input" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}
                id="post-category-select" style={{ cursor: 'pointer' }}>
                {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cover Emoji</label>
              <div className="emoji-picker">
                {emojis.map(e => (
                  <button key={e} className={`emoji-btn ${selectedEmoji === e ? 'selected' : ''}`}
                    onClick={() => setSelectedEmoji(e)}>{e}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Summary / Excerpt *</label>
            <textarea className="form-input form-textarea"
              placeholder="Write a short summary of your post..."
              value={excerpt} onChange={e => setExcerpt(e.target.value)}
              style={{ minHeight: 100 }} id="post-excerpt-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Full Content</label>
            <textarea className="form-input form-textarea"
              placeholder="Write your full article here... HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;blockquote&gt; are supported."
              value={content} onChange={e => setContent(e.target.value)} id="post-content-input" />
          </div>
        </div>
        <div className="modal-footer">
          <RippleBtn className="btn btn-ghost" onClick={onClose} id="cancel-btn">Cancel</RippleBtn>
          <RippleBtn
            className="btn btn-primary" onClick={handlePublish}
            disabled={!title.trim() || !excerpt.trim()}
            style={{ opacity: (!title.trim() || !excerpt.trim()) ? 0.5 : 1 }}
            id="publish-btn"
          >
            🚀 Publish Post
          </RippleBtn>
        </div>
      </div>
    </div>
  )
}

function ContactSection({ onMessageSent }) {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = (e) => {
    e.preventDefault();
    onMessageSent("Your message has been received! We'll get back to you soon.");
    setFormData({ name: '', email: '', subject: '', message: '' });
  }

  return (
    <section className="contact-section" id="contact">
      <div className="container">
        <div className="contact-grid">
          <div className="contact-info reveal">
            <h2 className="contact-title">Get in <span>Touch</span></h2>
            <p className="contact-desc">
              Have questions or want to collaborate? Reach out to our team of writers and editors.
              We respond to all inquiries within 24 hours.
            </p>
            <div className="contact-items">
              <div className="contact-item">
                <div className="contact-icon">📍</div>
                <div>
                  <div className="contact-item-label">Office Address</div>
                  <div className="contact-item-value">123 Tech Avenue, Bangalore, India</div>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📧</div>
                <div>
                  <div className="contact-item-label">Email Support</div>
                  <div className="contact-item-value">hello@inkwell.blog</div>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div>
                  <div className="contact-item-label">Phone Support</div>
                  <div className="contact-item-value">+91 98765 43210</div>
                </div>
              </div>
            </div>
            <div className="contact-socials">
              <button className="contact-social-btn">Twitter</button>
              <button className="contact-social-btn">LinkedIn</button>
              <button className="contact-social-btn">Instagram</button>
              <button className="contact-social-btn">Discord</button>
            </div>
          </div>

          <div className="contact-form-card reveal">
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" type="text" placeholder="Full name" required
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="Email" required
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="form-input" type="text" placeholder="Subject" required
                  value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-input form-textarea" placeholder="Your message..." required
                  value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} />
              </div>
              <button type="submit" className="contact-submit">
                🚀 Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

function ArticleView({ post, onBack, onLike, onBookmark, onComment }) {
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([
    { id: 1, author: AUTHORS[1], text: 'Excellent article! Really well researched and clearly written. Bookmarked for later reference.', time: '2 hours ago', likes: 12 },
    { id: 2, author: AUTHORS[2], text: 'This changed my perspective completely. The part about the future implications is especially insightful.', time: '5 hours ago', likes: 7 },
  ])
  const [progress, setProgress] = useState(0)
  useScrollReveal()

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? (el.scrollTop / total) * 100 : 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleComment = () => {
    if (!comment.trim()) return
    setComments(prev => [...prev, {
      id: Date.now(), author: AUTHORS[0], text: comment, time: 'Just now', likes: 0,
    }])
    setComment('')
    onComment(post.id)
  }

  return (
    <>
      <div className="reading-progress" style={{ width: `${progress}%` }} />
      <div className="article-view">
        <div className="article-hero">
          <div className="container">
            <div className="article-breadcrumb reveal">
              <span onClick={onBack}>← Home</span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span>{CATEGORIES.find(c => c.id === post.category)?.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span className="badge badge-accent">{CATEGORIES.find(c => c.id === post.category)?.label}</span>
              <span className="read-time">⏱ {post.readTime}</span>
            </div>
            <h1 className="article-title">{post.title}</h1>
            <p className="article-subtitle">{post.excerpt}</p>
            <div className="article-meta-bar reveal">
              <div className="author-info">
                <AuthorAvatar author={post.author} size={48} />
                <div>
                  <div className="author-name" style={{ fontSize: '0.95rem' }}>{post.author.name}</div>
                  <div className="author-role">{post.date} · {post.readTime}</div>
                </div>
              </div>
              <div className="card-actions" style={{ marginLeft: 'auto' }}>
                <button className={`action-btn ${post.liked ? 'liked' : ''}`} onClick={() => onLike(post.id)} id="article-like-btn">
                  {post.liked ? '❤️' : '🤍'} {post.likes}
                </button>
                <button className={`action-btn ${post.bookmarked ? 'bookmarked' : ''}`} onClick={() => onBookmark(post.id)} id="article-bookmark-btn">
                  {post.bookmarked ? '🔖' : '📌'} Save
                </button>
                <button className="action-btn" id="share-btn">📤 Share</button>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="article-content">
            <div className="article-image reveal">
              <span style={{ fontSize: '5rem', filter: 'drop-shadow(0 12px 32px rgba(37,99,235,0.3))' }}>
                {post.emoji}
              </span>
            </div>

            <div className="reveal" dangerouslySetInnerHTML={{
              __html: post.content || `<p>${post.excerpt}</p>`
            }} />

            <div className="article-tags reveal">
              {post.tags?.map(tag => (
                <span key={tag} className="tag-chip">#{tag}</span>
              ))}
            </div>

            {/* Author Card */}
            <div className="reveal" style={{
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', padding: 24, margin: '32px 0',
              display: 'flex', gap: 20, alignItems: 'center',
              transition: 'all 0.3s', cursor: 'default',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--glow)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
            >
              <AuthorAvatar author={post.author} size={68} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{post.author.name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10 }}>{post.author.role}</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  A passionate writer exploring ideas at the intersection of technology, culture, and human experience.
                </p>
              </div>
            </div>

            {/* Comments */}
            <div className="comments-section reveal" id="comments">
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', marginBottom: 24 }}>
                💬 {comments.length} Comments
              </h2>
              <div className="comment-form">
                <textarea className="comment-input" placeholder="Share your thoughts..."
                  value={comment} onChange={e => setComment(e.target.value)}
                  rows={3} id="comment-input" />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <RippleBtn className="btn btn-primary"
                    style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                    onClick={handleComment} id="post-comment-btn">
                    Post Comment
                  </RippleBtn>
                </div>
              </div>
              {comments.map(c => (
                <div key={c.id} className="comment-item">
                  <AuthorAvatar author={c.author} size={40} />
                  <div className="comment-body">
                    <div className="comment-author">
                      {c.author.name}
                      <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.78rem' }}> · {c.time}</span>
                    </div>
                    <p className="comment-text">{c.text}</p>
                    <div className="comment-actions">
                      <button className="action-btn">👍 {c.likes}</button>
                      <button className="action-btn">↩️ Reply</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand reveal-left">
            <div className="footer-logo">✍️ Inkwell</div>
            <p className="footer-desc">
              A community for curious minds. Share your ideas, discover new perspectives,
              and connect with writers who inspire you.
            </p>
            <div className="footer-social">
              {['🐦', '💼', '📸', '🐙'].map((icon, i) => (
                <button key={i} className="social-btn" style={{ transitionDelay: `${i * 0.05}s` }}>{icon}</button>
              ))}
            </div>
          </div>
          {[
            { title: 'Explore', links: ['Technology', 'Design', 'Travel', 'Food', 'Health', 'Business'] },
            { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press', 'Partners', 'Contact'] },
            { title: 'Legal',   links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Accessibility', 'Sitemap'] },
          ].map((col, i) => (
            <div key={col.title} className={`footer-col reveal delay-${i + 1}`}>
              <h4>{col.title}</h4>
              <ul className="footer-links">
                {col.links.map(l => <li key={l}><a href="#">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom reveal">
          <span>© 2025 Inkwell. Made with ❤️ by Abhinash</span>
          <span>Built with React + Vite</span>
        </div>
      </div>
    </footer>
  )
}

// ─── CURSOR GLOW ──────────────────────────────────────────────────
function CursorGlow() {
  const glowRef = useRef(null)
  useEffect(() => {
    let animationFrameId;
    const fn = (e) => {
      if (!glowRef.current) return;
      animationFrameId = requestAnimationFrame(() => {
        if (glowRef.current) {
          glowRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
        }
      });
    }
    window.addEventListener('mousemove', fn, { passive: true })
    return () => {
      window.removeEventListener('mousemove', fn)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [])
  return <div className="cursor-glow" ref={glowRef} style={{ pointerEvents: 'none', zIndex: 0, top: 0, left: 0, willChange: 'transform' }} />
}

// ─── MAIN APP ─────────────────────────────────────────────────────
function App() {
  const [user, setUser]               = useState(() => {
    const saved = localStorage.getItem('inkwell_user')
    return saved ? JSON.parse(saved) : null
  })
  const [theme, setTheme]             = useState('light')
  const [posts, setPosts]             = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeTag, setActiveTag]     = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeView, setActiveView]   = useState('home')
  const [selectedPost, setSelectedPost] = useState(null)

  useEffect(() => {
    let url = '/api/posts';
    const params = new URLSearchParams();
    if (activeCategory !== 'all') params.append('category', activeCategory);
    if (activeView === 'explore' || activeView === 'trending') params.append('trending', 'true');
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    fetch(url)
      .then(async res => {
        if (!res.ok) throw new Error('Bad response');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setPosts(data);
      })
      .catch(err => console.error('Error fetching posts:', err));
  }, [activeCategory, activeView]);
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [toasts, setToasts]           = useState([])
  const [showBackTop, setShowBackTop] = useState(false)

  const navigate = useNavigate()

  useScrollReveal()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    let ticking = false;
    const fn = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowBackTop(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  const handleLike = async (id) => {
    const post = posts.find(p => p.id === id)
    const increment = !post.liked;
    setPosts(prev => prev.map(p => p.id === id
      ? { ...p, liked: increment, likes: increment ? p.likes + 1 : p.likes - 1 } : p))
    addToast(increment ? '❤️ You liked this post!' : 'Removed like', 'success')
    try {
      await fetch(`/api/posts/${id}/like`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ increment })
      });
    } catch(err) { console.error(err) }
  }

  const handleBookmark = async (id) => {
    const post = posts.find(p => p.id === id)
    const increment = !post.bookmarked;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, bookmarked: increment } : p))
    addToast(increment ? '🔖 Post saved to bookmarks!' : 'Bookmark removed', 'info')
    try {
      await fetch(`/api/posts/${id}/bookmark`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ increment })
      });
    } catch(err) { console.error(err) }
  }

  const handlePublish = async ({ title, excerpt, content, category, emoji, author }) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, excerpt, content, category, emoji, authorId: user?.id || 1 })
      });
      if (res.ok) {
        addToast('🎉 Your post has been published!', 'success');
        setShowWriteModal(false);
        const res2 = await fetch('/api/posts');
        const data = await res2.json();
        setPosts(data);
      }
    } catch(err) {
      addToast('❌ Failed to publish post', 'error');
    }
  }

  const handleComment = (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p))
  }

  const handleAuth = async (userInfo) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userInfo)
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('inkwell_user', JSON.stringify(data.user));
        addToast(`👋 Welcome back ${data.user.name}!`, 'success');
      } else {
        addToast('❌ ' + (data.error || 'Login failed'), 'error');
      }
    } catch(err) {
      addToast('❌ Network error during login', 'error');
    }
  }

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('inkwell_user');
    addToast('🔌 Logged out successfully.', 'info');
    navigate('/login')
  }

  const filteredPosts = posts.filter(p => {
    const matchCat    = activeCategory === 'all' || p.category === activeCategory
    const matchTag    = !activeTag || p.tags?.includes(activeTag)
    const matchSearch = !searchQuery
      || p.title.toLowerCase().includes(searchQuery.toLowerCase())
      || p.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchTag && matchSearch
  })

  const featuredPosts = filteredPosts.filter(p => p.featured)

  // Article view
  if (selectedPost) {
    const livePost = posts.find(p => p.id === selectedPost.id) || selectedPost
    return (
      <>
        <CursorGlow />
        <Navbar theme={theme} setTheme={setTheme}
          onWrite={user ? () => setShowWriteModal(true) : () => navigate('/login')}
          user={user} onSignIn={() => navigate('/login')} onLogout={handleLogout}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          activeView={activeView} setActiveView={v => { setActiveView(v); setSelectedPost(null) }} />
        <ArticleView post={livePost} onBack={() => setSelectedPost(null)}
          onLike={handleLike} onBookmark={handleBookmark} onComment={handleComment} />
        <ContactSection onMessageSent={(msg) => addToast(msg, 'success')} />
        <Footer />
        {showWriteModal && <WriteModal onClose={() => setShowWriteModal(false)} onPublish={handlePublish} />}
        <Toast toasts={toasts} />
        <RippleBtn
          className={`back-to-top ${showBackTop ? 'show' : ''}`}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          id="back-to-top-btn"
        >↑</RippleBtn>
      </>
    )
  }

  return (
    <>
      <CursorGlow />

      <Navbar theme={theme} setTheme={setTheme}
        onWrite={user ? () => setShowWriteModal(true) : () => navigate('/login')}
        user={user} onSignIn={() => navigate('/login')} onLogout={handleLogout}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        activeView={activeView} setActiveView={setActiveView} />

      <Routes>
        <Route path="/login" element={<LoginPage onAuth={handleAuth} user={user} />} />
        <Route path="/" element={
          <main>
            <HeroSection onWrite={user ? () => setShowWriteModal(true) : () => navigate('/login')} totalPosts={posts.length} />

            <div className="categories-bar">
              <div className="container">
                <div className="categories-scroll">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id}
                      className={`cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat.id)} id={`cat-${cat.id}`}>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {searchQuery && (
              <div style={{ padding: '14px 0', background: 'var(--accent-light)', borderBottom: '1px solid var(--border)', animation: 'slideUp 0.3s ease' }}>
                <div className="container" style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600 }}>
                  🔍 {filteredPosts.length} result(s) for "<em>{searchQuery}</em>"
                  <button onClick={() => setSearchQuery('')} style={{ marginLeft: 12, fontWeight: 400, color: 'var(--text-muted)', background: 'none', fontSize: '0.85rem' }}>
                    Clear ✕
                  </button>
                </div>
              </div>
            )}

            {featuredPosts.length > 0 && !searchQuery && activeCategory === 'all' && !activeTag && (
              <section className="featured-section">
                <div className="container">
                  <div className="section-header reveal">
                    <h2 className="section-title">Featured Stories</h2>
                    <RippleBtn className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>View all →</RippleBtn>
                  </div>
                  <div className="featured-grid">
                    <PostCard post={featuredPosts[0]} onClick={p => { setSelectedPost(p); window.scrollTo(0, 0) }}
                      onLike={handleLike} onBookmark={handleBookmark} isFeatured delay={0} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      {featuredPosts.slice(1, 3).map((post, i) => (
                        <PostCard key={post.id} post={post}
                          onClick={p => { setSelectedPost(p); window.scrollTo(0, 0) }}
                          onLike={handleLike} onBookmark={handleBookmark} delay={i * 0.1 + 0.1} />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="posts-section" id="posts-section">
              <div className="container">
                <div className="main-layout">
                  <div>
                    <div className="section-header reveal">
                      <h2 className="section-title">
                        {searchQuery ? 'Search Results'
                          : activeTag ? `#${activeTag}`
                          : activeCategory === 'all' ? 'Latest Posts'
                          : CATEGORIES.find(c => c.id === activeCategory)?.label}
                      </h2>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{filteredPosts.length} posts</span>
                    </div>

                    {filteredPosts.length === 0 ? (
                      <div className="reveal" style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '5rem', marginBottom: 16, animation: 'float 3s ease-in-out infinite' }}>🔍</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 8 }}>No posts found</div>
                        <div style={{ fontSize: '0.875rem' }}>Try a different search or category</div>
                      </div>
                    ) : (
                      <div className="posts-grid">
                        {filteredPosts.map((post, i) => (
                          <PostCard key={post.id} post={post}
                            onClick={p => { setSelectedPost(p); window.scrollTo(0, 0) }}
                            onLike={handleLike} onBookmark={handleBookmark}
                            delay={i * 0.07} />
                        ))}
                      </div>
                    )}
                  </div>

                  <Sidebar posts={posts} activeTag={activeTag} setActiveTag={setActiveTag}
                    onSubscribe={() => addToast("🎉 You've subscribed! Welcome to Inkwell.", 'success')} />
                </div>
              </div>
            </section>

            <ContactSection onMessageSent={(msg) => addToast(msg, 'success')} />
          </main>
        } />
      </Routes>

      <Footer />
      {showWriteModal && <WriteModal onClose={() => setShowWriteModal(false)} onPublish={handlePublish} />}
      <Toast toasts={toasts} />

      <RippleBtn
        className={`back-to-top ${showBackTop ? 'show' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        id="back-to-top-btn"
      >↑</RippleBtn>
    </>
  )
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  )
}
