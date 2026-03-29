import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  BarChart, 
  Users, 
  Settings, 
  MessageCircle, 
  ChevronRight,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Database,
  Globe,
  PieChart,
  Activity,
  Zap,
  PenBox,
  Clapperboard,
  SearchCheck,
  KanbanSquare,
  Bot
} from 'lucide-react';

const MENU_ITEMS = [
  { icon: Bot, label: 'Auto AI Generator', id: 'ai-gen' },
  { icon: PenBox, label: 'Write Blog', id: 'write' },
  { icon: Clapperboard, label: 'Movie Scriptwriter', id: 'script' },
  { icon: SearchCheck, label: 'SEO Optimizer', id: 'seo' },
  { icon: KanbanSquare, label: 'Drafts Pipeline', id: 'kanban' },
  { icon: LayoutDashboard, label: 'Overview', id: 'overview' },
  { icon: Activity, label: 'Real-time Analytics', id: 'realtime' },
];

export const StudioSidebar = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen }) => {
  const [isHovered, setIsHovered] = useState(false);

  const sidebarVariants = {
    expanded: { width: '280px' },
    collapsed: { width: '80px' }
  };

  const mobileVariants = {
    open: { x: 0 },
    closed: { x: '-100%' }
  };

  const NavItem = ({ item }) => {
    const isActive = activeTab === item.id;
    return (
      <motion.div
        whileHover={{ scale: 1.02, x: 5 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setActiveTab(item.id);
          setIsMobileOpen(false);
        }}
        className={`flex items-center min-h-[44px] px-3 my-1.5 rounded-xl cursor-pointer transition-all duration-300 flex-shrink-0 ${
          isActive 
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
        }`}
      >
        <item.icon size={22} className={`min-w-[22px] flex-shrink-0 ${isActive ? 'stroke-[2.5px]' : ''}`} />
        <AnimatePresence>
          {(isHovered || isMobileOpen) && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="ml-4 font-body font-bold text-sm whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        
        {isActive && (isHovered || isMobileOpen) && (
          <motion.div 
            layoutId="activeIndicator"
            className="ml-auto w-1.5 h-1.5 flex-shrink-0 rounded-full bg-emerald-500"
          />
        )}
      </motion.div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        variants={window.innerWidth >= 768 ? sidebarVariants : mobileVariants}
        initial={window.innerWidth >= 768 ? "collapsed" : "closed"}
        animate={
          window.innerWidth >= 768 
            ? (isHovered ? "expanded" : "collapsed")
            : (isMobileOpen ? "open" : "closed")
        }
        onMouseEnter={() => window.innerWidth >= 768 && setIsHovered(true)}
        onMouseLeave={() => window.innerWidth >= 768 && setIsHovered(false)}
        className="fixed md:sticky top-0 left-0 h-screen z-50 bg-white dark:bg-gray-950 border-r border-gray-200/50 dark:border-gray-800 flex flex-col pt-6 pb-6 px-4 shadow-2xl md:shadow-none overflow-hidden"
      >
        <div className="flex items-center gap-4 px-2 mb-10 overflow-hidden">
          <div className="min-w-[40px] h-[40px] rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <Zap size={20} className="fill-white stroke-2" />
          </div>
          <AnimatePresence>
            {(isHovered || isMobileOpen) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="whitespace-nowrap"
              >
                <h2 className="font-headline font-black text-xl tracking-tight text-gray-900 dark:text-white">Studio Platform</h2>
                <p className="font-label text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-black">Creator Tools</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-2 space-y-1">
          <p className={`font-label text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mb-4 px-2 transition-all ${(!isHovered && !isMobileOpen) ? 'opacity-0' : 'opacity-100'}`}>
            Analytics Core
          </p>
          {MENU_ITEMS.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </nav>

        <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
          <NavItem item={{ icon: Settings, label: 'Platform Settings', id: 'settings' }} />
          <NavItem item={{ icon: MessageCircle, label: 'Help & Resources', id: 'help' }} />
          
          <AnimatePresence>
            {(isHovered || isMobileOpen) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-6 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/30"
              >
                <p className="font-body text-xs text-gray-600 dark:text-gray-400 mb-3">Using 45% of platform compute resources.</p>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 mb-1 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '45%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-emerald-500 h-1.5 rounded-full"
                  />
                </div>
                <p className="text-[10px] text-emerald-600 font-bold tracking-wider uppercase mt-2">Upgrade Instance</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
};

export default StudioSidebar;
