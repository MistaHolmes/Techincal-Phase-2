import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Languages, PenTool, CheckCircle2 } from 'lucide-react';

export const AIGenerator = () => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlog, setGeneratedBlog] = useState('');

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setGeneratedBlog('');
    
    // Simulate complex AI Streaming response
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedBlog(`## The Rise of ${topic || 'Modern Technology'}\n\nIn recent years, the landscape of technology has shifted dramatically. Gone are the days when static websites ruled the internet. Today, we are seeing an unprecedented level of integration between artificial intelligence and human-centric design patterns.\n\nWhen we investigate the core components of this evolution, it becomes painfully clear that developers who refuse to adapt will be left behind in the generative wave.\n\n### Why This Matters\n\nIf you are a creator, your tools determine your output. Agentic coding allows us to construct massive, highly interactive features in mere seconds.`);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 h-full flex flex-col pt-10">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bot size={32} className="text-emerald-500" />
        </div>
        <h1 className="font-headline text-4xl font-black text-gray-900 dark:text-white mb-3">AI Blog Ghostwriter</h1>
        <p className="font-body text-gray-500 max-w-lg mx-auto">
          Simply type a brief overview of what you want to write about, and our Agentic AI will instantly generate a highly humanized, SEO-optimized blog post for you.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl p-2 pl-6 border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 flex items-center mb-8 relative z-20">
        <input 
          type="text" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. A blog about the benefits of waking up early..."
          className="flex-1 bg-transparent border-none outline-none font-body text-lg text-gray-900 dark:text-white placeholder:text-gray-400"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2 transition-all"
        >
          {isGenerating ? <Sparkles size={20} className="animate-spin" /> : <PenTool size={20} />}
          {isGenerating ? 'Generating...' : 'Auto-Write'}
        </button>
      </div>

      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex-1 flex flex-col items-center justify-center mt-10"
          >
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="font-bold text-gray-500 animate-pulse">Consulting Neural Networks...</p>
          </motion.div>
        )}

        {generatedBlog && !isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-8 sm:p-12 border border-gray-200 dark:border-gray-800 shadow-sm relative"
          >
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
              <CheckCircle2 size={14} /> 100% Humanized
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none font-body whitespace-pre-wrap">
              {generatedBlog}
            </div>
            <div className="mt-10 flex gap-4">
              <button className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-3 rounded-xl hover:scale-[1.02] transition-transform">
                Send to Drafts
              </button>
              <button className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Regenerate
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIGenerator;
