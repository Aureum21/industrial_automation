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
  const [blocks, setBlocks] = useState<EditorBlock[]>([
    { id: '1', type: 'text', content: '' }
  ]);

  const addSimulationBlock = (index: number) => {
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, { id: Math.random().toString(), type: 'simulation' });
    newBlocks.splice(index + 2, 0, { id: Math.random().toString(), type: 'text', content: '' });
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
                  <textarea 
                    placeholder="Tell your story..." 
                    className="w-full text-xl font-serif text-gray-800 outline-none placeholder:text-gray-300 bg-transparent min-h-[100px] resize-none leading-relaxed"
                    value={block.content}
                    onChange={(e) => {
                      updateText(block.id, e.target.value);
                      // Auto-resize
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                  />
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-xl h-[600px] flex flex-col w-[calc(100vw-40px)] sm:w-full -ml-8 sm:ml-0 max-w-[1000px]">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center z-10">
                       <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Interactive Simulation</span>
                       <button onClick={() => removeBlock(block.id)} className="text-red-500 hover:text-red-700 transition">
                         <Trash2 size={16} />
                       </button>
                    </div>
                    <div className="flex-grow bg-[#0b1118] relative w-full h-full">
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
