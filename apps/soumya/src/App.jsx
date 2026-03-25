import { useState, useEffect } from 'react';
import BionicText from './components/BionicText';
import AudioReader from './components/AudioReader';
import { Moon, Sun, BookOpen, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const MOCK_ARTICLE = `The future of the web is highly interactive. For years, we've relied on static pages that simply deliver text from a source to a reader. But the modern internet demands more.

We are entering an era of truly dynamic content, where the interface adapts to the individual needs of the user. Whether it's through advanced typography that forces the brain to read faster, or subtle micro-animations that make applications feel alive, the gap between "website" and "native application" has completely vanished.

This blogging platform is designed as a pristine manifestation of that philosophy. We have explicitly removed all clutter—no sidebars filled with irrelevant ads, no heavy database calls that slow down your initial page render. Everything you interact with happens in real-time, right inside your browser, thanks to the sheer power of modern JavaScript engines.

Feel free to toggle "Bionic Reading" at the top to accelerate your reading speed. Bionic text bolds the first few letters of each word, creating artificial fixation points for your eyes to latch onto. You'll find yourself gliding through paragraphs at a pace you didn't think was possible. Or, if you need a break, click play on the Audiobook player. The native browser speech synthesis AI will read the text out loud for you, letting you absorb the knowledge completely hands-free.

Welcome to the cutting edge of the written word.`;

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [bionicEnabled, setBionicEnabled] = useState(false);

  useEffect(() => {
    // Check initial preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  return (
    <div className="app-layout">
      <div className="container">
        <header className="blog-header">
          <div className="branding">Nexlog.</div>
          <button 
            className="theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </header>

        <main>
          <motion.div 
            className="hero-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="article-title">
              The Evolution of Modern Web Consumption
            </h1>
            <div className="article-meta">
              <span>By Soumya</span>
              <span>•</span>
              <span>4 minute read</span>
            </div>
          </motion.div>

          <div className="features-panel">
            <AudioReader text={MOCK_ARTICLE} />
            
            <div className="switches">
              <label className={`switch-label ${bionicEnabled ? 'active' : ''}`}>
                <Zap size={18} color={bionicEnabled ? 'var(--primary)' : 'var(--muted-foreground)'} />
                <input 
                  type="checkbox" 
                  checked={bionicEnabled}
                  onChange={(e) => setBionicEnabled(e.target.checked)}
                  className="switch-input" 
                />
                Bionic Speed Reading
              </label>
            </div>
          </div>

          <motion.article 
            className="article-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={bionicEnabled ? 'bionic' : 'normal'}
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(4px)' }}
                transition={{ duration: 0.3 }}
              >
                {bionicEnabled ? (
                  <BionicText text={MOCK_ARTICLE} isActive={true} />
                ) : (
                  <div className="prose">
                    {MOCK_ARTICLE.split('\n\n').map((para, idx) => (
                      <p key={idx}>{para}</p>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.article>
        </main>
      </div>
    </div>
  );
}

export default App;
