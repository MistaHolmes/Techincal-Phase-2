import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Edit3, MoreHorizontal } from 'lucide-react';

export const DraftKanban = () => {
  const [columns] = useState([
    {
      id: 'drafts',
      title: 'Ideas & Drafts',
      color: 'bg-gray-500',
      cards: [
        { id: 1, title: 'The Future of AI in Web Design', date: 'Oct 12' },
        { id: 2, title: 'Why Framer Motion is Superior', date: 'Oct 15' },
        { id: 3, title: 'Building a Creator Studio from Scratch', date: 'Yesterday' }
      ]
    },
    {
      id: 'review',
      title: 'In Review / Editing',
      color: 'bg-amber-500',
      cards: [
        { id: 4, title: 'Top 10 VS Code Extensions for 2026', date: 'Today' }
      ]
    },
    {
      id: 'published',
      title: 'Published',
      color: 'bg-emerald-500',
      cards: [
        { id: 5, title: 'My Journey into Advanced Agentic Coding', date: 'Last Week' },
        { id: 6, title: 'The Evolution of Modern Web Consumption', date: 'Last Month' }
      ]
    }
  ]);

  return (
    <div className="max-w-7xl mx-auto h-full pb-20">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="font-headline text-3xl font-black text-gray-900 dark:text-white">Content Pipeline</h1>
          <p className="font-body text-gray-500 mt-1">Manage your writing lifecycle with Kanban boards.</p>
        </div>
        <button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 rounded-xl font-bold shadow-md hover:scale-105 transition-transform">
          New Workspace
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
        {columns.map((col, index) => (
          <div key={col.id} className="bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${col.color}`} />
                <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">{col.title}</h3>
                <span className="bg-gray-200 dark:bg-gray-800 text-xs font-black px-2 py-0.5 rounded-full">{col.cards.length}</span>
              </div>
              <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><MoreHorizontal size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
              {col.cards.map((card, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (index * 0.1) + (i * 0.05) }}
                  key={card.id}
                  className="bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-200/60 dark:border-gray-800 shadow-sm cursor-grab hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-800 transition-all group"
                >
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-lg leading-tight group-hover:text-emerald-600 transition-colors">{card.title}</h4>
                  <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
                    <span className="flex items-center gap-1"><Clock size={12} /> {card.date}</span>
                    <div className="flex -space-x-2">
                      <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Soumya" className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white dark:border-gray-900" />
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <button className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-gray-400 font-bold hover:bg-white dark:hover:bg-gray-950 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex items-center justify-center gap-2">
                <Edit3 size={16} /> Add Card
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DraftKanban;
