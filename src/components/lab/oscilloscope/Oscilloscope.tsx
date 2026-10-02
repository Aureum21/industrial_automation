import React, { useMemo, useRef, useState } from 'react';
import type { LogicEngine } from '@/lib/LogicEngine';


interface OscilloscopeProps {
  engine: LogicEngine;
  onScrub?: (timeMs: number | null) => void;
  scrubTime?: number | null;
}

export default function Oscilloscope({ engine, onScrub, scrubTime }: OscilloscopeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Find all tagged blocks to trace
  const traces = useMemo(() => {
    const tagged = Array.from(engine.blocks.values()).filter(b => b.tag);
    return tagged.map(b => ({
      id: b.id,
      tag: b.tag!,
      color: b.type.includes('ANALOG') ? '#3b82f6' : '#22c55e',
      isAnalog: b.type.includes('ANALOG') || typeof (b.outputs.Q ?? b.outputs.CV ?? b.outputs.RPM) === 'number'
    }));
  }, [engine.blocks]);

  if (collapsed) {
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-300 p-1 flex justify-center z-50">
        <button onClick={() => setCollapsed(false)} className="text-xs font-bold text-gray-500 hover:text-gray-800 uppercase tracking-widest">
          ▲ Open Logic Analyzer
        </button>
      </div>
    );
  }

  const history = engine.history;
  const timeWindow = 30000; // 30 seconds
  const latestTime = history.length > 0 ? history[history.length - 1].timeMs : 0;
  const minTime = Math.max(0, latestTime - timeWindow);

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 h-64 flex flex-col z-50 shadow-2xl">
      <div className="flex justify-between items-center bg-gray-800 px-4 py-1 border-b border-gray-700">
        <div className="text-xs font-bold text-gray-300 flex items-center gap-4">
          <span>LOGIC ANALYZER</span>
          <span className="text-gray-500 font-mono">{traces.length} Traces (30s buffer)</span>
        </div>
        <button onClick={() => setCollapsed(true)} className="text-gray-400 hover:text-white">▼</button>
      </div>
      
      <div className="flex-1 relative overflow-hidden flex flex-col" ref={containerRef}>
        {traces.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
            Add Tags to your blocks to monitor them in the logic analyzer.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
            {traces.map(trace => {
              return (
                <div key={trace.id} className="h-12 border-b border-gray-800 flex relative group">
                  <div className="w-32 shrink-0 bg-gray-800 border-r border-gray-700 flex items-center px-2 z-10">
                    <span className="text-xs font-mono font-bold text-gray-300 truncate" style={{ color: trace.color }}>{trace.tag}</span>
                  </div>
                  <div className="flex-1 relative">
                    <svg className="w-full h-full" preserveAspectRatio="none">
                      {/* Grid */}
                      <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#374151" strokeWidth="1" strokeDasharray="2,4" />
                      
                      {/* Trace */}
                      <TracePath history={history} blockId={trace.id} minTime={minTime} maxTime={Math.max(30000, latestTime)} isAnalog={trace.isAnalog} color={trace.color} />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Scrubber overlay */}
        {history.length > 0 && onScrub && (
          <input 
            type="range" 
            className="absolute bottom-0 left-32 right-0 opacity-0 group-hover:opacity-100 cursor-ew-resize h-full z-20"
            min={minTime} 
            max={Math.max(30000, latestTime)}
            value={scrubTime ?? Math.max(30000, latestTime)}
            onChange={e => onScrub(Number(e.target.value))}
            onMouseUp={() => onScrub(null)}
            onMouseLeave={() => onScrub(null)}
          />
        )}
      </div>
    </div>
  );
}

function TracePath({ history, blockId, minTime, maxTime, isAnalog, color }: { history: import('@/lib/automation/types').EngineSnapshot[], blockId: string, minTime: number, maxTime: number, isAnalog: boolean, color: string }) {
  if (history.length === 0) return null;
  
  const widthMs = maxTime - minTime;
  if (widthMs <= 0) return null;

  let path = '';
  
  if (isAnalog) {
    // Find min and max for scaling
    let vMin = 0;
    let vMax = 100; // Default
    let hasData = false;
    for (const snap of history) {
      const val = snap.outputs[blockId]?.Q ?? snap.outputs[blockId]?.CV ?? snap.outputs[blockId]?.RPM;
      if (typeof val === 'number') {
        if (!hasData) { vMin = val; vMax = val; hasData = true; }
        else { vMin = Math.min(vMin, val); vMax = Math.max(vMax, val); }
      }
    }
    if (vMax === vMin) { vMax += 1; vMin -= 1; }
    
    // Draw line chart
    history.forEach((snap, i) => {
      const x = ((snap.timeMs - minTime) / widthMs) * 100;
      const val = snap.outputs[blockId]?.Q ?? snap.outputs[blockId]?.CV ?? snap.outputs[blockId]?.RPM ?? 0;
      const y = 100 - (((Number(val) - vMin) / (vMax - vMin)) * 80 + 10); // Leave 10% padding
      
      if (i === 0) path += `M ${x} ${y} `;
      else path += `L ${x} ${y} `;
    });
    
    return <path d={path} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />;
  } else {
    // Draw digital square wave
    let lastY = -1;
    history.forEach((snap, i) => {
      const x = ((snap.timeMs - minTime) / widthMs) * 100;
      const val = snap.outputs[blockId]?.Q === true;
      const y = val ? 20 : 80;
      
      if (i === 0) {
        path += `M ${x} ${y} `;
        lastY = y;
      } else {
        if (y !== lastY) {
          path += `L ${x} ${lastY} `; // Draw vertical line to step
        }
        path += `L ${x} ${y} `;
        lastY = y;
      }
    });
    
    return <path d={path} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />;
  }
}
