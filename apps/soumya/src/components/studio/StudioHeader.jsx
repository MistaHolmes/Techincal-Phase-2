import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, Menu, Command } from 'lucide-react';

export const StudioHeader = ({ setIsMobileOpen }) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <Menu size={24} />
          </button>
          
          <div className="hidden md:flex relative w-full max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search analytics, traffic sources, or users..." 
              className="w-full py-2.5 pl-10 pr-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 dark:text-white"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50">
              <span className="p-1 min-w-[20px] h-[20px] flex items-center justify-center rounded bg-gray-200 dark:bg-gray-800 text-[10px] font-bold text-gray-500"><Command size={10} /></span>
              <span className="p-1 min-w-[20px] h-[20px] flex items-center justify-center rounded bg-gray-200 dark:bg-gray-800 text-[10px] font-bold text-gray-500">K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-gray-950"></span>
          </motion.button>
          
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-2 hidden sm:block"></div>
          
          <button className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-gray-50 dark:hover:bg-gray-900 border border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition-all">
            <img 
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Soumya" 
              alt="User Avatar" 
              className="w-8 h-8 rounded-full bg-emerald-100"
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-white font-headline leading-tight">Soumya</p>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Admin Pro</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default StudioHeader;
