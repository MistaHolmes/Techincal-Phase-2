import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Music, 
  UploadCloud,
  MoreVertical,
  Plus,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react';

const MOCK_ASSETS = Array.from({ length: 42 }).map((_, i) => ({
  id: \`asset_\${i}\`,
  name: i % 5 === 0 ? \`Banner_Image_V\${i}.png\` : i % 3 === 0 ? \`Intro_Audio_\${i}.mp3\` : \`Document_Draft_\${i}.pdf\`,
  type: i % 5 === 0 ? 'image' : i % 3 === 0 ? 'audio' : 'document',
  size: \`\${(Math.random() * 15 + 1).toFixed(1)} MB\`,
  date: \`\${Math.floor(Math.random() * 28 + 1)} Mar 2026\`,
  color: i % 5 === 0 ? 'bg-blue-100 text-blue-500' : i % 3 === 0 ? 'bg-purple-100 text-purple-500' : 'bg-orange-100 text-orange-500'
}));

const FOLDERS = ['Blog Assets', 'Podcast Audio', 'Drafts', 'Marketing', 'Archive'];

export const MediaLibrary = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [activeFolder, setActiveFolder] = useState('All Files');

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h2 className="font-headline text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white">Media Library</h2>
          <p className="font-body text-gray-500 mt-1 text-sm">Manage all your uploaded assets, images, and audio files securely.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold shadow-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-all">
            <UploadCloud size={18} /> Upload Files
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        {/* Left Sidebar for Folders */}
        <div className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-y-auto p-4">
          <div className="font-label text-xs uppercase tracking-widest text-gray-400 font-black mb-4 px-2">Storage</div>
          
          <div className="mb-6 px-2">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">42GB / 100GB</span>
              <span className="text-[10px] font-black text-emerald-500">42% Used</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '42%' }} />
            </div>
          </div>

          <div className="font-label text-xs uppercase tracking-widest text-gray-400 font-black mb-2 px-2 mt-4">Folders</div>
          <button 
            onClick={() => setActiveFolder('All Files')}
            className={\`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-colors \${activeFolder === 'All Files' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}\`}
          >
            <Folder size={18} className={activeFolder === 'All Files' ? 'fill-emerald-200 dark:fill-emerald-900/50' : ''} />
            All Files
          </button>
          
          {FOLDERS.map(folder => (
            <button 
              key={folder}
              onClick={() => setActiveFolder(folder)}
              className={\`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-colors \${activeFolder === folder ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}\`}
            >
              <Folder size={18} className={activeFolder === folder ? 'fill-emerald-200 dark:fill-emerald-900/50' : ''} />
              {folder}
            </button>
          ))}
          
          <button className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mt-2 border border-dashed border-gray-200 dark:border-gray-800">
            <Plus size={18} /> New Folder
          </button>
        </div>

        {/* Main Grid Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search files..." 
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
                <Filter size={16} />
              </button>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={\`p-1.5 rounded-md transition-all \${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}\`}
                >
                  <Grid size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={\`p-1.5 rounded-md transition-all \${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}\`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
            {viewMode === 'grid' ? (
              <motion.div 
                layout
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              >
                <AnimatePresence>
                  {MOCK_ASSETS.map((asset, i) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02 }}
                      key={asset.id}
                      className="group relative flex flex-col bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 p-3 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all cursor-pointer"
                    >
                      <div className={\`w-full aspect-square rounded-lg flex items-center justify-center mb-3 \${asset.color} bg-opacity-20 dark:bg-opacity-10\`}>
                        {asset.type === 'image' && <ImageIcon size={32} />}
                        {asset.type === 'audio' && <Music size={32} />}
                        {asset.type === 'document' && <FileText size={32} />}
                      </div>
                      <div className="flex-1 flex flex-col min-w-0">
                        <p className="font-body text-xs font-bold text-gray-900 dark:text-white truncate" title={asset.name}>{asset.name}</p>
                        <p className="font-body text-[10px] text-gray-500 mt-1">{asset.size}</p>
                      </div>
                      
                      {/* Hover Action Menu */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded shadow-sm text-gray-600 hover:text-emerald-500">
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-2">
                {MOCK_ASSETS.map((asset, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    key={asset.id}
                    className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={\`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 \${asset.color} bg-opacity-20 dark:bg-opacity-10\`}>
                        {asset.type === 'image' && <ImageIcon size={18} />}
                        {asset.type === 'audio' && <Music size={18} />}
                        {asset.type === 'document' && <FileText size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-sm font-bold text-gray-900 dark:text-white truncate">{asset.name}</p>
                        <p className="font-body text-xs text-gray-500">{asset.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-gray-500 hidden sm:block whitespace-nowrap">{asset.size}</span>
                      <button className="p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaLibrary;
