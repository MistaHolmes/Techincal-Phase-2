import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Globe, Target, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';

export const SEOOptimizer = () => {
  const [keyword, setKeyword] = useState('modern web development');
  
  const score = 82;

  const checks = [
    { title: "Target Keyword in H1", passed: true, detail: "Your primary keyword was found in the main heading." },
    { title: "Meta Description Length", passed: false, detail: "Currently 42 chars. Recommended is 120-150 chars." },
    { title: "Keyword Density", passed: true, detail: "Keyword appears 4 times (1.2% density), which is optimal." },
    { title: "Image Alt Tags", passed: true, detail: "All 3 images have descriptive alt attributes." },
    { title: "Internal Links", passed: false, detail: "No internal links found. Add at least 2 to improve crawlability." }
  ];

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <h1 className="font-headline text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
        <Target className="text-emerald-500" size={32} /> Search Engine Optimization
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 col-span-1 md:col-span-2 shadow-sm">
          <label className="font-label text-xs uppercase tracking-widest font-bold text-gray-500 mb-2 block">Focus Keyword</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-4 pl-12 pr-4 text-lg font-bold focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <p className="font-body text-sm text-gray-500 mt-4">We'll automatically scan your drafted blogs against this primary keyword to estimate ranking difficulty.</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white flex flex-col items-center justify-center text-center shadow-lg shadow-emerald-500/20">
          <h3 className="font-label text-xs uppercase tracking-widest font-bold text-emerald-100 mb-2">Overall SEO Score</h3>
          <div className="text-6xl font-black font-headline tracking-tighter mb-2">{score}<span className="text-2xl text-emerald-200">/100</span></div>
          <p className="text-sm font-bold text-emerald-100 bg-emerald-900/30 px-3 py-1 rounded-full">Good Rating</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-800 p-6 bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="font-headline text-xl font-bold flex items-center gap-2">
            <Globe className="text-gray-400" /> Automated On-Page Analysis
          </h2>
        </div>
        <div className="p-0">
          {checks.map((check, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="flex items-start gap-4 p-6 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="mt-1">
                {check.passed ? 
                  <CheckCircle className="text-emerald-500" size={24} /> : 
                  <AlertTriangle className="text-rose-500" size={24} />
                }
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{check.title}</h4>
                <p className="font-body text-gray-500 mt-1">{check.detail}</p>
              </div>
              <div className="ml-auto">
                <button className="text-sm font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
                  {check.passed ? 'View Details' : 'Fix Automatically'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SEOOptimizer;
