import React, { useState } from 'react';
import { StudioSidebar } from './StudioSidebar';
import { StudioHeader } from './StudioHeader';
import { motion, AnimatePresence } from 'framer-motion';

export const StudioLayout = ({ children, activeTab, setActiveTab }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 flex transition-colors duration-500">
      <StudioSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <StudioHeader setIsMobileOpen={setIsMobileOpen} />
        
        <main className="flex-1 overflow-x-hidden pt-6 pb-20 px-4 md:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[1400px] mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default StudioLayout;
