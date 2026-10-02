'use client';
import { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import LabWorkspace from '@/components/lab/LabWorkspace';

type EditorBlock = {
  id: string;
  type: 'text' | 'simulation';
  content?: string;
};

export default function WritePage() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [fullscreenBlockId, setFullscreenBlockId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<EditorBlock[]>([
    { id: '1', type: 'text', content: '' }
  ]);

  const addSimulationBlock = (index: number) => {
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, { id: crypto.randomUUID(), type: 'simulation' });
    newBlocks.splice(index + 2, 0, { id: crypto.randomUUID(), type: 'text', content: '' });
    setBlocks(newBlocks);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const updateText = (id: string, content: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content } : b));
  };

  return (
    <main className="bg-white min-h-screen text-gray-900 pb-32 font-sans">
      <div className="mx-auto max-w-4xl px-5 sm:px-8 mt-16 relative">
        <input 
          type="text" 
          placeholder="Title" 
          className="w-full text-5xl font-serif font-bold outline-none placeholder:text-gray-300 mb-8 bg-transparent"
        />
        
        <div className="flex flex-col gap-8">
          {blocks.map((block, index) => (
            <div key={block.id} className="relative group flex items-start gap-4">
              
              {/* The [+] Button Toolbar */}
              <div className="relative pt-1 opacity-70 hover:opacity-100 transition-opacity">
                <button 
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => addSimulationBlock(index)}
                  className="text-gray-400 hover:text-black transition-colors"
                >
                  <PlusCircle size={32} strokeWidth={1} />
                </button>
                {showTooltip && (
                  <div className="absolute left-10 top-1 bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap z-50">
                    Add Simulation Workspace
                  </div>
                )}
              </div>

              {/* Block Content */}
              <div className="flex-grow w-full min-w-0">
                {block.type === 'text' ? (
                  <div className="relative group/text">
                    <textarea 
                      placeholder="Tell your story..." 
                      className="w-full text-xl font-serif text-gray-800 outline-none placeholder:text-gray-300 bg-transparent min-h-[100px] resize-none leading-relaxed pr-8"
                      value={block.content}
                      onChange={(e) => {
                        updateText(block.id, e.target.value);
                        // Auto-resize
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                    />
                    {blocks.length > 1 && (
                      <button 
                        onClick={() => removeBlock(block.id)} 
                        className="absolute right-0 top-2 opacity-0 group-hover/text:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                        title="Delete text block"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={fullscreenBlockId === block.id 
                    ? "fixed inset-0 z-[100] flex flex-col bg-white" 
                    : "relative rounded-xl overflow-hidden border border-gray-200 shadow-xl h-[600px] flex flex-col w-[calc(100vw-40px)] sm:w-full -ml-8 sm:ml-0 max-w-[1000px]"
                  }>
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center z-10 shrink-0">
                       <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Interactive Simulation</span>
                       <div className="flex items-center gap-3">
                         <button onClick={() => setFullscreenBlockId(fullscreenBlockId === block.id ? null : block.id)} className="text-gray-400 hover:text-gray-700 transition" title={fullscreenBlockId === block.id ? 'Minimize' : 'Maximize'}>
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             {fullscreenBlockId === block.id ? (
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 8h12v12H8z M4 16V4h12" />
                             ) : (
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
                             )}
                           </svg>
                         </button>
                         <button onClick={() => removeBlock(block.id)} className="text-red-500 hover:text-red-700 transition" title="Delete block">
                           <Trash2 size={16} />
                         </button>
                       </div>
                    </div>
                    <div className="flex-grow bg-[#0b1118] relative w-full h-full overflow-hidden">
                      <LabWorkspace />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
