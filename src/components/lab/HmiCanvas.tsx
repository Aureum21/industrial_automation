import React, { useState } from 'react';
import type { LogicEngine } from '@/lib/LogicEngine';
import type { HmiWidget } from '@/lib/automation/types';

interface HmiCanvasProps {
  widgets: HmiWidget[];
  setWidgets: React.Dispatch<React.SetStateAction<HmiWidget[]>>;
  engine: LogicEngine;
  sync: () => void;
}

export default function HmiCanvas({ widgets, setWidgets, engine, sync }: HmiCanvasProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const addWidget = (type: HmiWidget['type']) => {
    const id = crypto.randomUUID();
    setWidgets([...widgets, { id, type, tag: 'New_Tag', x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100, options: { label: 'Widget', min: 0, max: 100 } }]);
    setSelected(id);
  };

  const getTagValue = (tag: string) => {
    if (!tag) return 0;
    const block = Array.from(engine.blocks.values()).find((b) => b.tag === tag);
    if (!block) return 0;
    return block.outputs.Q ?? block.outputs.RPM ?? block.outputs.X ?? block.value ?? 0;
  };

  const setTagValue = (tag: string, value: boolean | number) => {
    if (!tag) return;
    const block = Array.from(engine.blocks.values()).find((b) => b.tag === tag);
    if (block && (block.type.includes('INPUT') || block.type.includes('CONSTANT') || block.type === 'FLAG')) {
      engine.setInput(block.id, value);
      sync();
    }
  };

  const updateWidget = (id: string, updates: Partial<HmiWidget>) => {
    setWidgets(ws => ws.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const updateOptions = (id: string, options: Record<string, string | number | boolean>) => {
    setWidgets(ws => ws.map(w => w.id === id ? { ...w, options: { ...w.options, ...options } } : w));
  };

  const deleteWidget = (id: string) => {
    setWidgets(ws => ws.filter(w => w.id !== id));
    if (selected === id) setSelected(null);
  };

  const selectedWidget = widgets.find(w => w.id === selected);

  return (
    <div className="flex-1 flex h-full bg-slate-50 relative overflow-hidden font-sans">
      
      {/* LEFT TOOLBOX */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm shrink-0">
        <div className="p-4 border-b border-gray-100 font-bold text-xs tracking-wider text-gray-500 uppercase">Widgets</div>
        <div className="p-3 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-bold text-gray-400 mt-2 mb-1">DIGITAL CONTROLS</div>
          <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-green-50 hover:border-green-300 transition" onClick={() => addWidget('switch')}>+ Toggle Switch</button>
          <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-green-50 hover:border-green-300 transition" onClick={() => addWidget('button')}>+ Push Button</button>
          
          <div className="text-[10px] font-bold text-gray-400 mt-4 mb-1">ANALOG CONTROLS</div>
          <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-green-50 hover:border-green-300 transition" onClick={() => addWidget('slider')}>+ Slider</button>
          
          <div className="text-[10px] font-bold text-gray-400 mt-4 mb-1">DISPLAYS & INDICATORS</div>
          <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-green-50 hover:border-green-300 transition" onClick={() => addWidget('light')}>+ Indicator Light</button>
          <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-green-50 hover:border-green-300 transition" onClick={() => addWidget('gauge')}>+ Analog Gauge</button>
          <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-green-50 hover:border-green-300 transition" onClick={() => addWidget('bar')}>+ Bar Graph</button>
          <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-green-50 hover:border-green-300 transition" onClick={() => addWidget('value')}>+ Value Text</button>
        </div>
      </div>

      {/* CANVAS */}
      <div 
        className="flex-1 relative cursor-crosshair"
        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 0)', backgroundSize: '24px 24px' }}
        onPointerDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        onPointerMove={e => {
          if (!dragging) return;
          setWidgets(ws => ws.map(w => w.id === dragging ? { ...w, x: w.x + e.movementX, y: w.y + e.movementY } : w));
        }}
        onPointerUp={() => setDragging(null)}
        onPointerLeave={() => setDragging(null)}
      >
        {widgets.map(w => {
          const val = getTagValue(w.tag);
          const isSelected = selected === w.id;
          const label = String(w.options?.label || w.tag || 'Widget');
          const min = Number(w.options?.min ?? 0);
          const max = Number(w.options?.max ?? 100);
          const unit = String(w.options?.unit || '');
          const color = String(w.options?.color || 'green');
          
          return (
            <div 
              key={w.id} 
              className={`absolute shadow-md rounded-md p-3 select-none flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50' : 'bg-white border border-gray-300'}`}
              style={{ left: w.x, top: w.y, minWidth: 120 }}
              onPointerDown={(e) => { e.stopPropagation(); setSelected(w.id); setDragging(w.id); }}
            >
              <div className="text-[11px] font-bold text-gray-700 w-full text-center truncate px-1 pb-1 border-b border-gray-100">{label}</div>
              
              <div className="py-2 px-1 flex flex-col items-center justify-center min-h-[60px] w-full">
                {w.type === 'switch' && (
                  <label className="flex items-center cursor-pointer pointer-events-auto">
                    <input type="checkbox" className="sr-only peer" checked={Boolean(val)} onChange={e => setTagValue(w.tag, e.target.checked)} />
                    <div className={`w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[42px] after:left-[22px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all ${color === 'green' ? 'peer-checked:bg-green-500' : color === 'red' ? 'peer-checked:bg-red-500' : 'peer-checked:bg-blue-500'}`}></div>
                  </label>
                )}

                {w.type === 'button' && (
                  <button 
                    className={`w-14 h-14 rounded-full shadow-inner border-4 pointer-events-auto transition-colors ${val ? (color === 'red' ? 'bg-red-600 border-red-800' : 'bg-green-600 border-green-800') : (color === 'red' ? 'bg-red-500 border-red-700' : 'bg-green-500 border-green-700')}`}
                    onPointerDown={(e) => { e.stopPropagation(); setTagValue(w.tag, true); }}
                    onPointerUp={(e) => { e.stopPropagation(); setTagValue(w.tag, false); }}
                    onPointerLeave={(e) => { e.stopPropagation(); setTagValue(w.tag, false); }}
                  />
                )}

                {w.type === 'light' && (
                  <div className={`w-12 h-12 rounded-full border-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-colors duration-200 ${val ? (color === 'red' ? 'bg-red-500 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : color === 'blue' ? 'bg-blue-500 border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.8)]' : color === 'yellow' ? 'bg-yellow-400 border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'bg-green-400 border-green-200 shadow-[0_0_15px_rgba(74,222,128,0.8)]') : 'bg-gray-800 border-gray-600'}`} />
                )}

                {w.type === 'slider' && (
                  <input 
                    type="range" 
                    min={min} max={max} step={(max-min)/100 || 1} 
                    value={Number(val) || 0} 
                    onChange={e => setTagValue(w.tag, Number(e.target.value))}
                    className="w-full pointer-events-auto accent-blue-500"
                    onPointerDown={e => e.stopPropagation()} 
                  />
                )}

                {w.type === 'gauge' && (
                  <div className="w-24 h-12 overflow-hidden relative">
                    <div className="w-24 h-24 border-[6px] border-gray-200 rounded-full absolute top-0" />
                    <div className="w-24 h-24 border-[6px] rounded-full absolute top-0" style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)', borderColor: color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#22c55e', transform: `rotate(${-180 + (Math.min(max, Math.max(min, Number(val))) - min) / (max - min) * 180}deg)`, transition: 'transform 0.1s linear' }} />
                    <div className="absolute bottom-0 w-full text-center text-sm font-bold font-mono">{Number(val).toFixed(1)}{unit}</div>
                  </div>
                )}

                {w.type === 'bar' && (
                  <div className="w-8 h-24 bg-gray-200 rounded-sm relative overflow-hidden border border-gray-300">
                    <div className={`absolute bottom-0 w-full transition-all duration-100 ${color === 'red' ? 'bg-red-500' : color === 'blue' ? 'bg-blue-500' : 'bg-green-500'}`} style={{ height: `${Math.max(0, Math.min(100, (Number(val) - min) / (max - min) * 100))}%` }} />
                  </div>
                )}

                {w.type === 'value' && (
                  <div className="font-mono text-2xl font-bold tracking-tight text-gray-800">
                    {typeof val === 'number' ? Number(val).toFixed(1) : String(val)}
                    <span className="text-xs text-gray-500 ml-1">{unit}</span>
                  </div>
                )}
              </div>

              <div className="text-[9px] font-mono font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded w-full text-center truncate mt-1">TAG: {w.tag}</div>
            </div>
          );
        })}
      </div>

      {/* RIGHT PROPERTIES PANEL */}
      {selectedWidget && (
        <div className="w-72 bg-white border-l border-gray-200 flex flex-col z-10 shadow-sm shrink-0">
          <div className="p-4 border-b border-gray-100 font-bold text-xs tracking-wider text-gray-500 uppercase">Properties</div>
          <div className="p-4 space-y-4 overflow-y-auto flex-1 text-sm">
            
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Widget Label</label>
              <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none" value={String(selectedWidget.options?.label || '')} onChange={e => updateOptions(selectedWidget.id, { label: e.target.value })} placeholder="Label..." />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Bound Tag (Logic Engine)</label>
              <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-xs" value={selectedWidget.tag} onChange={e => updateWidget(selectedWidget.id, { tag: e.target.value })} placeholder="Motor_Speed" />
            </div>

            {(selectedWidget.type === 'gauge' || selectedWidget.type === 'slider' || selectedWidget.type === 'bar') && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Min Value</label>
                  <input type="number" className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none" value={Number(selectedWidget.options?.min ?? 0)} onChange={e => updateOptions(selectedWidget.id, { min: Number(e.target.value) })} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Max Value</label>
                  <input type="number" className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none" value={Number(selectedWidget.options?.max ?? 100)} onChange={e => updateOptions(selectedWidget.id, { max: Number(e.target.value) })} />
                </div>
              </div>
            )}

            {(selectedWidget.type === 'gauge' || selectedWidget.type === 'value') && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Unit string (e.g. RPM)</label>
                <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none" value={String(selectedWidget.options?.unit || '')} onChange={e => updateOptions(selectedWidget.id, { unit: e.target.value })} />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Color Theme</label>
              <select className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none" value={String(selectedWidget.options?.color || 'green')} onChange={e => updateOptions(selectedWidget.id, { color: e.target.value })}>
                <option value="green">Green (Standard)</option>
                <option value="red">Red (Warning/Stop)</option>
                <option value="blue">Blue (Info/Cold)</option>
                <option value="yellow">Yellow (Caution)</option>
              </select>
            </div>
            
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button className="w-full px-3 py-2 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded shadow-sm hover:bg-red-50 hover:border-red-300 transition" onClick={() => deleteWidget(selectedWidget.id)}>Delete Widget</button>
          </div>
        </div>
      )}
    </div>
  );
}
