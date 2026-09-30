'use client';
import { useState } from 'react';
import { PlusCircle } from 'lucide-react';

export default function WritePage() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <main className="bg-white min-h-screen text-gray-900 pb-32">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 mt-16 relative">
        <input 
          type="text" 
          placeholder="Title" 
          className="w-full text-5xl font-serif font-medium outline-none placeholder:text-gray-300 mb-6 bg-transparent"
        />
        
        <div className="relative group flex items-start gap-4">
          <div className="relative pt-1">
            <button 
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => alert("In a real app, this would insert the <LabWorkspace /> component into your article!")}
              className="text-gray-400 hover:text-black transition-colors"
            >
              <PlusCircle size={32} strokeWidth={1} />
            </button>
            {showTooltip && (
              <div className="absolute left-10 top-1 bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                Add Simulation Workspace
              </div>
            )}
          </div>
          <textarea 
            placeholder="Tell your story..." 
            className="w-full text-xl font-serif text-gray-800 outline-none placeholder:text-gray-300 bg-transparent min-h-[300px] resize-none leading-relaxed"
          ></textarea>
        </div>
      </div>
    </main>
  );
}
