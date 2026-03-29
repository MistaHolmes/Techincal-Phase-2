import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bold, Italic, Underline, Link, Image as ImageIcon, 
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, 
  Quote, Heading1, Heading2, Save, Send, Eye, Wand2, Volume2, CheckCircle2, Loader2, Languages, XCircle
} from 'lucide-react';

export const BlogEditor = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English');
  const fileInputRef = useRef(null);

  const handleAIGrammarCheck = () => {
    if (!content.trim()) return;
    setIsCheckingAI(true);
    setAiMessage('Agentic AI is analyzing semantics and grammar...');
    
    setTimeout(() => {
      // Simulate grammar fix
      const updated = content
        .replace(/ u /g, ' you ')
        .replace(/ ur /g, ' your ')
        .replace(/ teh /g, ' the ')
        .replace(/i am/g, 'I am')
        .replace(/\?\?\?/g, '?')
        .replace(/\!\!\!/g, '!');
      
      setContent(updated);
      setAiMessage('Grammar perfectly corrected!');
      
      setTimeout(() => {
        setIsCheckingAI(false);
        setAiMessage('');
      }, 3000);
    }, 2500);
  };

  const toggleTextToSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      if (!content.trim()) return;
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const publishPost = () => {
    if (!title || !content) return alert("Title and Content are required to publish!");
    setIsPublished(true);
    setTimeout(() => {
      setIsPublished(false);
    }, 5000);
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 relative">
      {isPublished && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="bg-white dark:bg-gray-900 p-8 rounded-3xl text-center shadow-2xl flex flex-col items-center border border-emerald-500"
          >
            <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
            <h2 className="text-3xl font-black font-headline text-gray-900 dark:text-white mb-2">Successfully Published!</h2>
            <p className="text-gray-500 font-body">Your blog post is now live across the platform.</p>
          </motion.div>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm sticky top-20 z-20">
        <div>
          <h1 className="font-headline text-2xl font-black text-gray-900 dark:text-white">Draft New Post</h1>
          <AnimatePresence mode="wait">
            {aiMessage ? (
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="font-body text-sm text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"
              >
                {isCheckingAI && aiMessage.includes('analyzing') ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                {aiMessage}
              </motion.p>
            ) : (
              <p className="font-body text-sm text-gray-500">Auto-saved 2 mins ago.</p>
            )}
          </AnimatePresence>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={toggleTextToSpeech}
            className={`px-4 py-2 flex items-center gap-2 text-sm font-bold rounded-xl transition-colors ${isPlaying ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            <Volume2 size={16} className={isPlaying ? "animate-pulse" : ""} /> {isPlaying ? 'Stop Audio' : 'Read Aloud'}
          </button>
          <button 
            onClick={handleAIGrammarCheck}
            disabled={isCheckingAI}
            className="px-4 py-2 flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-100/50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-xl transition-colors disabled:opacity-50"
          >
            <Wand2 size={16} className={isCheckingAI ? "animate-pulse" : ""} /> Fix Grammar (AI)
          </button>
          
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block" />

          <select 
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-sm px-3 py-2 rounded-xl border border-transparent focus:border-emerald-500 outline-none cursor-pointer appearance-none hiddden sm:block"
          >
            <option>English</option>
            <option>Hindi (हिंदी)</option>
            <option>Bengali (বাংলা)</option>
            <option>Telugu (తెలుగు)</option>
            <option>Marathi (मराठी)</option>
            <option>Tamil (தமிழ்)</option>
          </select>

          <button className="hidden sm:flex px-4 py-2 items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <Eye size={16} /> Preview
          </button>
          <button onClick={publishPost} className="px-4 py-2 flex items-center gap-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md shadow-emerald-500/20 transition-colors">
            <Send size={16} /> Publish
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden mb-6">
        
        {/* Cover Image Upload Area */}
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
        />
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={coverImagePreview ? { backgroundImage: `url(${coverImagePreview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          className="w-full h-48 sm:h-72 bg-emerald-50 dark:bg-emerald-900/10 border-b border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors group relative overflow-hidden"
        >
          {!coverImagePreview && (
            <>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 z-0" />
              <div className="z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 rounded-full shadow-sm text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform flex flex-col items-center">
                <ImageIcon size={32} className="mb-1" />
              </div>
              <span className="z-10 mt-3 font-label text-xs uppercase tracking-widest font-bold text-emerald-700 dark:text-emerald-300 bg-white/50 dark:bg-black/50 px-3 py-1 rounded-md">Add Cover Image</span>
            </>
          )}
          {coverImagePreview && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <span className="font-label text-white uppercase tracking-widest font-bold bg-black/60 px-4 py-2 rounded-xl flex items-center gap-2"><ImageIcon size={18}/> Change Cover</span>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-10">
          {/* Title Input */}
          <input 
            type="text" 
            placeholder="Post Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-4xl sm:text-5xl font-black font-headline text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700 bg-transparent border-none outline-none mb-6"
          />

          {/* Formatting Toolbar */}
          <div className="sticky top-[140px] z-10 flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl mb-6 shadow-sm">
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-emerald-500 rounded-lg transition-colors"><Heading1 size={18} /></button>
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-emerald-500 rounded-lg transition-colors"><Heading2 size={18} /></button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-emerald-500 rounded-lg transition-colors"><Bold size={18} /></button>
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-emerald-500 rounded-lg transition-colors"><Italic size={18} /></button>
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-emerald-500 rounded-lg transition-colors"><Underline size={18} /></button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-emerald-500 rounded-lg transition-colors"><AlignLeft size={18} /></button>
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-emerald-500 rounded-lg transition-colors"><AlignCenter size={18} /></button>
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-emerald-500 rounded-lg transition-colors"><AlignRight size={18} /></button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-emerald-500 rounded-lg transition-colors"><List size={18} /></button>
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-emerald-500 rounded-lg transition-colors"><ListOrdered size={18} /></button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-emerald-500 rounded-lg transition-colors"><Quote size={18} /></button>
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-emerald-500 rounded-lg transition-colors"><Link size={18} /></button>
          </div>

          {/* Main Content Area */}
          <textarea 
            placeholder="Start writing your amazing story..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[500px] font-body text-lg sm:text-xl text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 bg-transparent border-none outline-none resize-y leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;
