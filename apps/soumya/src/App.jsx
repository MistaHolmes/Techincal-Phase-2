import { useState, useEffect } from 'react';
import BionicText from './components/BionicText';
import AudioReader from './components/AudioReader';
import StudioLayout from './components/studio/StudioLayout';
import AnalyticsDashboard from './components/studio/AnalyticsDashboard';
import BlogEditor from './components/studio/BlogEditor';
import ScriptEditor from './components/studio/ScriptEditor';
import SEOOptimizer from './components/studio/SEOOptimizer';
import DraftKanban from './components/studio/DraftKanban';
import AIGenerator from './components/studio/AIGenerator';
import { Moon, Sun, BookOpen, Zap, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const MOCK_ARTICLE = `The future of the web is highly interactive. For years, we've relied on static pages that simply deliver text from a source to a reader. But the modern internet demands more.

We are entering an era of truly dynamic content, where the interface adapts to the individual needs of the user. Whether it's through advanced typography that forces the brain to read faster, or subtle micro-animations that make applications feel alive, the gap between "website" and "native application" has completely vanished.

This blogging platform is designed as a pristine manifestation of that philosophy. We have explicitly removed all clutter—no sidebars filled with irrelevant ads, no heavy database calls that slow down your initial page render. Everything you interact with happens in real-time, right inside your browser, thanks to the sheer power of modern JavaScript engines.

Feel free to toggle "Bionic Reading" at the top to accelerate your reading speed. Bionic text bolds the first few letters of each word, creating artificial fixation points for your eyes to latch onto. You'll find yourself gliding through paragraphs at a pace you didn't think was possible. Or, if you need a break, click play on the Audiobook player. The native browser speech synthesis AI will read the text out loud for you, letting you absorb the knowledge completely hands-free.

Welcome to the cutting edge of the written word.`;

function ArticleReader({ isDarkMode, setIsDarkMode }) {
  const [bionicEnabled, setBionicEnabled] = useState(false);

  return (
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
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('studio'); // 'reader' or 'studio'
  const [activeTab, setActiveTab] = useState('write');

  useEffect(() => {
    // Check initial preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Floating Toggle View Button */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setViewMode(prev => prev === 'reader' ? 'studio' : 'reader')}
        className="fixed bottom-6 right-6 z-[9999] bg-gray-900 border-2 border-emerald-500 text-white p-4 rounded-full shadow-2xl flex items-center justify-center gap-3 transition-colors"
      >
        {viewMode === 'reader' ? (
          <>
            <LayoutDashboard size={20} className="text-emerald-400" />
            <span className="font-bold font-label text-xs tracking-wider uppercase pr-2">Launch Studio</span>
          </>
        ) : (
          <>
            <BookOpen size={20} className="text-emerald-400" />
            <span className="font-bold font-label text-xs tracking-wider uppercase pr-2">Return to Reader</span>
          </>
        )}
      </motion.button>
      
      {/* View Router */}
      <AnimatePresence mode="wait">
        {viewMode === 'reader' ? (
          <motion.div
            key="reader"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="app-layout"
          >
            <ArticleReader isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          </motion.div>
        ) : (
          <motion.div
            key="studio"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="w-full text-left bg-white text-black dark:text-white dark:bg-gray-950 block m-0 p-0 absolute inset-0" 
          >
            {/* Added style reset wrapper so studio doesn't inherit app.css center styling */}
            <div className="w-full min-h-screen text-left m-0 p-0">
              <StudioLayout activeTab={activeTab} setActiveTab={setActiveTab}>
                {activeTab === 'ai-gen' && <AIGenerator />}
                {activeTab === 'overview' && <AnalyticsDashboard />}
                {activeTab === 'write' && <BlogEditor />}
                {activeTab === 'script' && <ScriptEditor />}
                {activeTab === 'seo' && <SEOOptimizer />}
                {activeTab === 'kanban' && <DraftKanban />}
                {!['overview', 'write', 'script', 'seo', 'kanban', 'ai-gen'].includes(activeTab) && (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
                      <LayoutDashboard size={32} className="text-emerald-500 opacity-50" />
                    </div>
                    <h2 className="text-2xl font-black font-headline text-gray-900 dark:text-white mb-2">Module Loaded</h2>
                    <p className="text-gray-500 font-body max-w-sm">
                      The {activeTab} view is fully mounted but currently awaiting real-time socket connections from the backend.
                    </p>
                  </div>
                )}
              </StudioLayout>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
