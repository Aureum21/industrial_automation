import React, { useState } from 'react';
import type { LogicEngine } from '@/lib/LogicEngine';
import type { RuntimeBlock } from '@/lib/automation/types';

export type HmiWidget = {
  id: string;
  type: 'switch' | 'button' | 'light' | 'gauge';
  tag: string;
  x: number;
  y: number;
};

interface HmiCanvasProps {
  widgets: HmiWidget[];
  setWidgets: React.Dispatch<React.SetStateAction<HmiWidget[]>>;
  engine: LogicEngine;
  sync: () => void;
}

export default function HmiCanvas({ widgets, setWidgets, engine, sync }: HmiCanvasProps) {
  const [dragging, setDragging] = useState<string | null>(null);

  const addWidget = (type: HmiWidget['type']) => {
    const tag = prompt(`Enter the tag this ${type} binds to:`, 'Motor_1');
    if (!tag) return;
    setWidgets([...widgets, { id: crypto.randomUUID(), type, tag, x: 50, y: 50 }]);
  };

  const getTagValue = (tag: string) => {
    const block = Array.from(engine.blocks.values()).find((b) => b.tag === tag);
    if (!block) return 0;
    // Guess the primary output based on what's available
    return block.outputs.Q ?? block.outputs.RPM ?? block.outputs.X ?? block.value ?? 0;
  };

  const setTagValue = (tag: string, value: boolean | number) => {
    const block = Array.from(engine.blocks.values()).find((b) => b.tag === tag);
    if (block && block.type.includes('INPUT')) {
      engine.setInput(block.id, value);
      sync();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 relative overflow-hidden">
      <div className="bg-white border-b border-gray-200 p-2 flex gap-2 z-10 shadow-sm">
        <span className="text-xs font-bold text-gray-500 py-1.5 px-2">SCADA WIDGETS:</span>
        <button className="lab-button" onClick={() => addWidget('switch')}>+ Switch</button>
        <button className="lab-button" onClick={() => addWidget('button')}>+ Push Button</button>
        <button className="lab-button" onClick={() => addWidget('light')}>+ Light</button>
        <button className="lab-button" onClick={() => addWidget('gauge')}>+ Gauge</button>
      </div>
      
      <div 
        className="flex-1 relative"
        onPointerMove={e => {
          if (!dragging) return;
          setWidgets(ws => ws.map(w => w.id === dragging ? { ...w, x: w.x + e.movementX, y: w.y + e.movementY } : w));
        }}
        onPointerUp={() => setDragging(null)}
        onPointerLeave={() => setDragging(null)}
      >
        {widgets.map(w => {
          const val = getTagValue(w.tag);
          return (
            <div 
              key={w.id} 
              className="absolute bg-white border border-gray-300 shadow-md rounded-md p-3 select-none flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing"
              style={{ left: w.x, top: w.y }}
              onPointerDown={(e) => { e.stopPropagation(); setDragging(w.id); }}
            >
              <div className="text-[10px] font-mono font-bold text-gray-500 uppercase">{w.tag}</div>
              
              {w.type === 'switch' && (
                <label className="flex items-center cursor-pointer pointer-events-auto">
                  <input type="checkbox" className="sr-only peer" checked={Boolean(val)} onChange={e => setTagValue(w.tag, e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[26px] after:left-[14px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              )}

              {w.type === 'button' && (
                <button 
                  className="w-12 h-12 bg-red-500 rounded-full shadow-inner border-4 border-red-700 active:bg-red-600 active:border-red-800 pointer-events-auto transition-colors"
                  onPointerDown={(e) => { e.stopPropagation(); setTagValue(w.tag, true); }}
                  onPointerUp={(e) => { e.stopPropagation(); setTagValue(w.tag, false); }}
                  onPointerLeave={(e) => { e.stopPropagation(); setTagValue(w.tag, false); }}
                />
              )}

              {w.type === 'light' && (
                <div className={`w-10 h-10 rounded-full border-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] ${val ? 'bg-green-400 border-green-200 shadow-[0_0_15px_rgba(74,222,128,0.8)]' : 'bg-gray-700 border-gray-600'}`} />
              )}

              {w.type === 'gauge' && (
                <div className="w-20 h-10 overflow-hidden relative mt-2">
                  <div className="w-20 h-20 border-4 border-gray-200 rounded-full absolute top-0" />
                  <div className="w-20 h-20 border-4 border-blue-500 rounded-full absolute top-0" style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)', transform: `rotate(${-180 + (Math.min(100, Math.max(0, Number(val))) / 100) * 180}deg)`, transition: 'transform 0.1s' }} />
                  <div className="absolute bottom-0 w-full text-center text-xs font-bold font-mono">{Number(val).toFixed(1)}</div>
                </div>
              )}
            </div>
          );
        })}
        {widgets.length === 0 && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="text-center">
              <p className="text-gray-400 mb-2">SCADA Dashboard is empty.</p>
              <p className="text-xs text-gray-400">Add a widget from the toolbar above and bind it to a Tag.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
