import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, ScrollText, Play, Save, Download, Users, PlusCircle } from 'lucide-react';

export const ScriptEditor = () => {
  const [elements, setElements] = useState([
    { type: 'SCENE HEADING', text: 'INT. STUDIO - DAY' },
    { type: 'ACTION', text: 'A young developer sits in front of a glowing monitor, typing furiously. The coffee next to them is entirely cold.' },
    { type: 'CHARACTER', text: 'SOUMYA' },
    { type: 'DIALOGUE', text: 'If I can just implement these ten features, I will secure the twenty thousand contribution block.' }
  ]);

  const [activeFormat, setActiveFormat] = useState('ACTION');

  const addElement = () => {
    setElements([...elements, { type: activeFormat, text: '' }]);
  };

  const updateElement = (index, text) => {
    const newElements = [...elements];
    newElements[index].text = text;
    setElements(newElements);
  };

  const getStyleForType = (type) => {
    switch (type) {
      case 'SCENE HEADING': return 'uppercase font-bold pt-6 text-left ml-[10%]';
      case 'ACTION': return 'pt-4 text-left ml-[10%] mr-[10%]';
      case 'CHARACTER': return 'uppercase text-center w-full pt-6';
      case 'PARENTHETICAL': return 'text-center w-full pt-1 italic';
      case 'DIALOGUE': return 'text-left mx-[25%] pt-1';
      default: return 'ml-[10%]';
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto pb-24 pt-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-gray-900 border border-indigo-500/30 p-4 sm:p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="z-10">
          <h1 className="font-headline text-2xl font-black text-white flex items-center gap-2">
            <Video className="text-indigo-400" /> Professional Scriptwriter
          </h1>
          <p className="font-body text-sm text-indigo-200">Industry-standard cinematic formatting.</p>
        </div>
      </div>

      {/* Script Format Toolbar - Absolutely positioned or sticky */}
      <div className="sticky top-[80px] z-50 flex flex-wrap gap-2 p-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-xl mb-6 shadow-md justify-center w-full max-w-3xl mx-auto">
        {['SCENE HEADING', 'ACTION', 'CHARACTER', 'PARENTHETICAL', 'DIALOGUE'].map((format) => (
          <button
            key={format}
            onClick={() => setActiveFormat(format)}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all flex-shrink-0 ${
              activeFormat === format 
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {format}
          </button>
        ))}
      </div>

      {/* Hollywood Standard A4 Page Simulator */}
      <div className="flex justify-center w-full">
        {/* The Page */}
        <div className="bg-[#fcfcfc] text-black shadow-2xl w-full max-w-[850px] min-h-[1100px] p-8 sm:p-16 mb-8 font-mono text-[16px] md:text-[18px] leading-relaxed relative border border-gray-300" style={{ fontFamily: '"Courier Prime", Courier, monospace' }}>
          
          <div className="absolute top-8 right-16 text-gray-400 text-sm">1.</div>

          {elements.map((el, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mb-1 relative group w-full ${getStyleForType(el.type)}`}
            >
              <div className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 text-[10px] text-gray-400 font-sans tracking-widest pointer-events-none">
                {el.type.slice(0,3)}
              </div>
              <textarea
                value={el.text}
                onChange={(e) => updateElement(i, e.target.value)}
                placeholder={`${el.type}...`}
                autoFocus={i === elements.length - 1}
                className="w-full bg-transparent border-none outline-none resize-none overflow-hidden hover:bg-black/5 focus:bg-indigo-50/50 rounded transition-colors"
                style={{ height: 'auto', minHeight: '32px' }}
                rows={el.text.split('\n').length || 1}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (el.type === 'CHARACTER') setActiveFormat('DIALOGUE');
                    else if (el.type === 'DIALOGUE') setActiveFormat('ACTION');
                    addElement();
                  }
                }}
              />
            </motion.div>
          ))}
          
          <button 
            onClick={addElement}
            className="mt-12 flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 text-gray-400 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 rounded-xl transition-all font-sans font-bold text-sm"
          >
            <PlusCircle size={18} className="mr-2" /> Add Next Line ({activeFormat})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditor;
