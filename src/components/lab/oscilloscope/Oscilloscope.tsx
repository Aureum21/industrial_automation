import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import type { LogicEngine, RuntimeBlock } from '@/lib/LogicEngine';
import { BLOCK_CATALOG } from '@/lib/automation/catalog';
import type { Signal } from '@/lib/automation/types';

interface OscilloscopeProps {
  engine: LogicEngine;
  onScrub?: (timeMs: number | null) => void;
  scrubTime?: number | null;
  timeMs?: number;
}

const TRACE_PALETTE = [
  '#0284c7', // Sky Blue
  '#16a34a', // Emerald Green
  '#d97706', // Amber
  '#9333ea', // Purple
  '#e11d48', // Rose
  '#0d9488', // Teal
  '#ea580c', // Dark Orange
  '#4f46e5', // Indigo
  '#059669', // Mint
  '#db2777', // Pink
];

// Helper to determine if a block output is analog
function isBlockAnalog(block: RuntimeBlock): boolean {
  if (block.type.includes('ANALOG')) return true;
  if (['PI_CONTROLLER', 'PID_CONTROLLER', 'MATH', 'FLOAT_TO_INT', 'INT_TO_FLOAT', 'AVERAGE', 'MIN_MAX', 'DC_MOTOR', 'SERVO_AXIS', 'HOURS_COUNTER', 'FREQUENCY_TRIGGER', 'COUNTER', 'STOPWATCH', 'DATA_LOG'].includes(block.type)) {
    return true;
  }
  const val = block.outputs.Q ?? block.outputs.CV ?? block.outputs.RPM ?? block.outputs.ET ?? block.outputs.OUT;
  return typeof val === 'number';
}

// Helper to extract the primary output value
function extractValue(block: RuntimeBlock, outputs?: Record<string, Signal>): Signal | undefined {
  const o = outputs || block.outputs;
  if (o) {
    if ('Q' in o) return o.Q;
    if ('CV' in o) return o.CV;
    if ('RPM' in o) return o.RPM;
    if ('ET' in o) return o.ET;
    if ('OUT' in o) return o.OUT;
    if ('POS' in o) return o.POS;
    if ('MIN' in o) return o.MIN;
    const keys = Object.keys(o);
    if (keys.length > 0) return o[keys[0]];
  }
  return block.value;
}

// Compute block interest score for auto-selection
function getBlockScore(b: RuntimeBlock): number {
  if (b.tag) return 100;
  if (b.type.includes('OUTPUT') || b.type === 'DC_MOTOR' || b.type === 'SERVO_AXIS') return 90;
  if (b.type.includes('CONTROLLER') || b.type === 'RS_LATCH' || b.type === 'PULSE_RELAY') return 80;
  if (b.type.includes('TIMER') || b.type === 'TON' || b.type === 'TOF' || b.type === 'COUNTER') return 70;
  if (b.type.includes('INPUT') || b.type === 'CLOCK') return 60;
  if (b.type.includes('COMPARATOR') || b.type.includes('THRESHOLD')) return 50;
  return 10;
}

export default function Oscilloscope({ engine, onScrub, scrubTime, timeMs = 0 }: OscilloscopeProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [timeWindow, setTimeWindow] = useState(30000);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [userSelectedIds, setUserSelectedIds] = useState<string[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allBlocks = useMemo(() => Array.from(engine.blocks.values()), [engine.blocks]);

  // Determine which blocks to trace
  const activeBlockIds = useMemo(() => {
    if (userSelectedIds !== null) {
      // Filter out any IDs that no longer exist
      const valid = userSelectedIds.filter(id => engine.blocks.has(id));
      if (valid.length > 0) return valid;
    }

    // Default auto-selection
    const tagged = allBlocks.filter(b => b.tag).map(b => b.id);
    if (tagged.length >= 2) return tagged;

    // Pick top scored blocks (up to 5)
    const sorted = [...allBlocks].sort((a, b) => getBlockScore(b) - getBlockScore(a));
    const defaultSelection = sorted.slice(0, 5).map(b => b.id);
    return defaultSelection;
  }, [allBlocks, userSelectedIds, engine.blocks]);

  const traces = useMemo(() => {
    return activeBlockIds.map((id, index) => {
      const b = engine.blocks.get(id);
      if (!b) return null;
      const isAnalog = isBlockAnalog(b);
      const color = TRACE_PALETTE[index % TRACE_PALETTE.length];
      const name = b.label || BLOCK_CATALOG[b.type]?.name || b.id;
      return {
        id: b.id,
        tag: b.tag,
        label: name,
        type: b.type,
        color,
        isAnalog,
        block: b,
      };
    }).filter(Boolean) as Array<{
      id: string;
      tag?: string;
      label: string;
      type: string;
      color: string;
      isAnalog: boolean;
      block: RuntimeBlock;
    }>;
  }, [activeBlockIds, engine.blocks]);

  const history = engine.history;
  const latestTime = history.length > 0 ? history[history.length - 1].timeMs : (timeMs || 0);
  const maxTime = Math.max(timeWindow, latestTime);
  const minTime = Math.max(0, latestTime - timeWindow);

  // Playhead scrub handler
  const handlePointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!onScrub || history.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = minTime + percent * (maxTime - minTime);
    onScrub(time);
  }, [minTime, maxTime, onScrub, history.length]);

  const toggleBlockTrace = useCallback((blockId: string) => {
    setUserSelectedIds(current => {
      const active = current !== null ? current : activeBlockIds;
      if (active.includes(blockId)) {
        return active.filter(id => id !== blockId);
      } else {
        return [...active, blockId];
      }
    });
  }, [activeBlockIds]);

  const selectAllBlocks = useCallback(() => {
    setUserSelectedIds(allBlocks.map(b => b.id));
  }, [allBlocks]);

  const selectOutputsOnly = useCallback(() => {
    const outs = allBlocks.filter(b => b.type.includes('OUTPUT') || b.type === 'DC_MOTOR' || b.type === 'SERVO_AXIS' || b.type.includes('CONTROLLER'));
    setUserSelectedIds(outs.map(b => b.id));
  }, [allBlocks]);

  const resetDefaultSelection = useCallback(() => {
    setUserSelectedIds(null);
  }, []);

  // Time grid divisions (5 intervals)
  const timeGridIntervals = useMemo(() => {
    const count = 5;
    const step = (maxTime - minTime) / count;
    return Array.from({ length: count + 1 }, (_, i) => minTime + i * step);
  }, [minTime, maxTime]);

  if (collapsed) {
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-300 px-3 py-1.5 flex items-center justify-between z-40 shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCollapsed(false)} 
            className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-green-700 uppercase tracking-wider transition-colors"
          >
            <span className="text-green-600 font-mono text-sm">▲</span>
            <span>Logic Analyzer</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-gray-100 text-gray-600 border border-gray-200">
              {traces.length} {traces.length === 1 ? 'channel' : 'channels'}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
          <span>Live trace & playhead inspection</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-300 h-72 flex flex-col z-40 shadow-[0_-10px_35px_rgba(0,0,0,0.12)]">
      {/* Top Toolbar */}
      <div className="flex justify-between items-center bg-white px-3 py-1.5 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-800 tracking-wider">LOGIC ANALYZER</span>
          </div>

          {/* Channel Selector Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1.5 font-medium transition-colors ${
                isPickerOpen 
                  ? 'bg-green-50 border-green-300 text-green-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="font-bold">+ Signals</span>
              <span className="font-mono text-[10px] text-gray-400">({traces.length})</span>
              <span className="text-[9px]">▾</span>
            </button>

            {/* Channel Picker Popover */}
            {isPickerOpen && (
              <div 
                className="absolute left-0 top-full mt-1.5 w-80 bg-white border border-gray-300 rounded-lg shadow-2xl p-3 z-50 text-xs flex flex-col max-h-72"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="font-bold text-gray-700">Select Signals to Trace</span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button 
                      onClick={selectOutputsOnly} 
                      className="px-1.5 py-0.5 rounded text-blue-600 hover:bg-blue-50 font-medium"
                    >
                      Outputs
                    </button>
                    <button 
                      onClick={selectAllBlocks} 
                      className="px-1.5 py-0.5 rounded text-gray-600 hover:bg-gray-100 font-medium"
                    >
                      All
                    </button>
                    <button 
                      onClick={resetDefaultSelection} 
                      className="px-1.5 py-0.5 rounded text-gray-500 hover:bg-gray-100"
                    >
                      Default
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 py-1.5 space-y-1 pr-1">
                  {allBlocks.map(b => {
                    const checked = activeBlockIds.includes(b.id);
                    const isAnalog = isBlockAnalog(b);
                    const name = b.label || BLOCK_CATALOG[b.type]?.name || b.id;
                    const val = extractValue(b);
                    return (
                      <label 
                        key={b.id} 
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${
                          checked ? 'bg-green-50/70 border border-green-200' : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <input 
                            type="checkbox" 
                            checked={checked} 
                            onChange={() => toggleBlockTrace(b.id)}
                            className="rounded text-green-600 focus:ring-0 cursor-pointer"
                          />
                          <span className={`text-[9px] font-mono font-bold px-1 rounded ${
                            isAnalog ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {isAnalog ? 'ANA' : 'DIG'}
                          </span>
                          <span className="truncate font-medium text-gray-700 text-[11px]" title={name}>
                            {name}
                          </span>
                        </div>
                        <div className="shrink-0 text-[10px] font-mono text-gray-400">
                          {typeof val === 'boolean' ? (val ? 'HIGH' : 'LOW') : (val !== undefined ? String(val) : '-')}
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <button 
                    onClick={() => setIsPickerOpen(false)}
                    className="px-2.5 py-1 rounded bg-gray-800 text-white font-medium text-[11px] hover:bg-black"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Time Window Selector */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="text-[11px] text-gray-400">Window:</span>
            <select 
              className="text-xs border border-gray-200 rounded bg-gray-50 text-gray-700 font-mono focus:ring-0 cursor-pointer px-1.5 py-0.5 outline-none hover:bg-gray-100"
              value={timeWindow}
              onChange={(e) => setTimeWindow(Number(e.target.value))}
            >
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>60s</option>
              <option value={120000}>2 min</option>
              <option value={300000}>5 min</option>
            </select>
          </div>
        </div>

        {/* Right Controls: Scrub Status & Collapse */}
        <div className="flex items-center gap-3">
          {scrubTime !== null && scrubTime !== undefined ? (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-mono font-semibold">
                Scrub: {(scrubTime / 1000).toFixed(2)}s
              </span>
              {onScrub && (
                <button
                  onClick={() => onScrub(null)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-900 underline"
                >
                  Return to LIVE
                </button>
              )}
            </div>
          ) : (
            <span className="text-[11px] font-mono text-gray-400">
              T = {(latestTime / 1000).toFixed(2)}s
            </span>
          )}

          <button 
            onClick={() => setCollapsed(true)} 
            className="text-gray-400 hover:text-gray-800 px-1 py-0.5 text-sm"
            title="Collapse Logic Analyzer"
          >
            ▼
          </button>
        </div>
      </div>
      
      {/* Main Analyzer Body */}
      <div className="flex-1 relative flex flex-col min-h-0 bg-white" ref={containerRef}>
        {traces.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs p-6 text-center">
            <p className="font-medium text-gray-600 mb-1">No signals selected for analysis.</p>
            <p className="text-gray-400 mb-3">Click "+ Signals" above to choose inputs, outputs, or controllers to inspect.</p>
            <button 
              onClick={selectAllBlocks}
              className="px-3 py-1 rounded bg-green-600 text-white font-semibold text-xs hover:bg-green-700"
            >
              Trace All Signals
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 relative select-none">
            {/* Timeline Header Ruler */}
            <div className="h-6 border-b border-gray-200 bg-gray-50/80 flex shrink-0 text-[10px] font-mono text-gray-400">
              <div className="w-44 shrink-0 px-3 flex items-center border-r border-gray-200 font-semibold text-gray-500 uppercase tracking-wider">
                Signal Channel
              </div>
              <div className="flex-1 relative flex items-center justify-between px-2">
                {timeGridIntervals.map((t, idx) => {
                  const pct = ((t - minTime) / (maxTime - minTime)) * 100;
                  return (
                    <div 
                      key={idx}
                      className="absolute top-0 bottom-0 flex flex-col items-center"
                      style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="h-1.5 w-px bg-gray-300" />
                      <span className="text-[9px] text-gray-500">{(t / 1000).toFixed(1)}s</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trace Rows List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative divide-y divide-gray-100">
              {traces.map(trace => {
                // Determine current/scrubbed value for header
                let displayVal: Signal | undefined;
                if (scrubTime !== null && scrubTime !== undefined && history.length > 0) {
                  const snap = history.find(h => h.timeMs >= scrubTime) || history[history.length - 1];
                  displayVal = snap.outputs[trace.id] ? extractValue(trace.block, snap.outputs[trace.id]) : extractValue(trace.block);
                } else {
                  displayVal = extractValue(trace.block);
                }

                return (
                  <div key={trace.id} className="min-h-12 h-12 flex relative group hover:bg-gray-50/50 transition-colors">
                    {/* Channel Header (Left Column) */}
                    <div className="w-44 shrink-0 bg-white border-r border-gray-200 flex items-center justify-between px-2.5 z-10 shadow-sm relative group-hover:bg-gray-50/60">
                      {/* Color accent bar */}
                      <div 
                        className="absolute left-0 top-1 bottom-1 w-1 rounded-r"
                        style={{ backgroundColor: trace.color }} 
                      />

                      <div className="flex flex-col min-w-0 pr-1 pl-1">
                        <span 
                          className="text-[11px] font-bold font-mono truncate text-gray-800" 
                          title={trace.label}
                        >
                          {trace.label}
                        </span>
                        {trace.tag && (
                          <span className="text-[9px] font-mono text-gray-400 truncate">
                            #{trace.tag}
                          </span>
                        )}
                      </div>

                      {/* Value Badge & Quick Remove */}
                      <div className="flex items-center gap-1 shrink-0">
                        {trace.isAnalog ? (
                          <span 
                            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200"
                            title="Signal Value"
                          >
                            {typeof displayVal === 'number' ? displayVal.toFixed(1) : String(displayVal ?? 0)}
                          </span>
                        ) : (
                          <span 
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border transition-colors ${
                              displayVal === true 
                                ? 'bg-green-100 text-green-800 border-green-300' 
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}
                          >
                            {displayVal === true ? 'HIGH' : 'LOW'}
                          </span>
                        )}

                        <button
                          onClick={() => toggleBlockTrace(trace.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity ml-0.5 text-xs font-bold"
                          title="Remove from Logic Analyzer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Waveform Drawing Area */}
                    <div className="flex-1 relative bg-white">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Vertical time grid lines */}
                        {timeGridIntervals.map((t, idx) => {
                          const x = ((t - minTime) / (maxTime - minTime)) * 100;
                          return (
                            <line 
                              key={idx} 
                              x1={x} 
                              y1="0" 
                              x2={x} 
                              y2="100" 
                              stroke="#f3f4f6" 
                              strokeWidth="1" 
                              vectorEffect="non-scaling-stroke" 
                            />
                          );
                        })}

                        {/* Midline */}
                        <line 
                          x1="0" 
                          y1="50" 
                          x2="100" 
                          y2="50" 
                          stroke="#f3f4f6" 
                          strokeWidth="1" 
                          strokeDasharray="2,4" 
                          vectorEffect="non-scaling-stroke" 
                        />
                        
                        {/* Trace Waveform */}
                        <TracePath 
                          history={history} 
                          block={trace.block}
                          minTime={minTime} 
                          maxTime={maxTime} 
                          latestTime={latestTime}
                          isAnalog={trace.isAnalog} 
                          color={trace.color} 
                          scrubTime={scrubTime} 
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}

              {/* Playhead Interactive Overlay across all waveforms */}
              <div 
                className="absolute inset-y-0 right-0 left-44 cursor-ew-resize z-30 group"
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handlePointer(e); }}
                onPointerMove={(e) => { if (e.buttons > 0) handlePointer(e); }}
                onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); }}
              >
                {/* Scrub Playhead Hairline */}
                {scrubTime !== null && scrubTime !== undefined && (
                  <div 
                    className="absolute top-0 bottom-0 w-px bg-blue-600 pointer-events-none before:absolute before:left-1/2 before:-translate-x-1/2 before:top-0 before:border-[6px] before:border-transparent before:border-t-blue-600"
                    style={{ left: `${((scrubTime - minTime) / (maxTime - minTime)) * 100}%` }}
                  >
                    <div className="absolute top-1 left-2 bg-blue-600 text-white font-mono text-[9px] px-1 py-0.2 rounded shadow whitespace-nowrap pointer-events-none font-bold">
                      {(scrubTime / 1000).toFixed(2)}s
                    </div>
                  </div>
                )}

                {/* Live Head Line (if not scrubbing) */}
                {(scrubTime === null || scrubTime === undefined) && latestTime > minTime && (
                  <div 
                    className="absolute top-0 bottom-0 w-px bg-gray-300 pointer-events-none"
                    style={{ left: `${((latestTime - minTime) / (maxTime - minTime)) * 100}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TracePathProps {
  history: import('@/lib/automation/types').EngineSnapshot[];
  block: RuntimeBlock;
  minTime: number;
  maxTime: number;
  latestTime: number;
  isAnalog: boolean;
  color: string;
  scrubTime?: number | null;
}

function TracePath({ history, block, minTime, maxTime, latestTime, isAnalog, color, scrubTime }: TracePathProps) {
  const widthMs = maxTime - minTime;
  if (widthMs <= 0) return null;

  const blockId = block.id;

  // If history is empty, draw a baseline using current value
  if (history.length === 0) {
    const liveVal = extractValue(block);
    if (isAnalog) {
      return (
        <line 
          x1="0" 
          y1="50" 
          x2="100" 
          y2="50" 
          stroke={color} 
          strokeWidth="1.5" 
          strokeDasharray="4,4" 
          vectorEffect="non-scaling-stroke" 
        />
      );
    } else {
      const y = liveVal === true ? 20 : 80;
      return (
        <line 
          x1="0" 
          y1={y} 
          x2="100" 
          y2={y} 
          stroke={color} 
          strokeWidth="2" 
          vectorEffect="non-scaling-stroke" 
        />
      );
    }
  }

  let pointX = -1;
  let pointY = -1;

  if (isAnalog) {
    // Find min and max for scaling
    let vMin = 0;
    let vMax = 100;
    let hasData = false;
    for (const snap of history) {
      const val = snap.outputs[blockId] ? extractValue(block, snap.outputs[blockId]) : undefined;
      if (typeof val === 'number' && Number.isFinite(val)) {
        if (!hasData) { vMin = val; vMax = val; hasData = true; }
        else { vMin = Math.min(vMin, val); vMax = Math.max(vMax, val); }
      }
    }
    if (vMax === vMin) { vMax += 1; vMin -= 1; }

    let path = '';
    history.forEach((snap, i) => {
      const x = ((snap.timeMs - minTime) / widthMs) * 100;
      const rawVal = snap.outputs[blockId] ? extractValue(block, snap.outputs[blockId]) : 0;
      const num = typeof rawVal === 'number' && Number.isFinite(rawVal) ? rawVal : 0;
      const y = 100 - (((num - vMin) / (vMax - vMin)) * 74 + 13);

      if (i === 0) path += `M ${x} ${y} `;
      else path += `L ${x} ${y} `;
    });

    // If only one snapshot or latestTime exceeds last snapshot, extend line
    const lastSnap = history[history.length - 1];
    if (latestTime > lastSnap.timeMs) {
      const endX = ((latestTime - minTime) / widthMs) * 100;
      const rawVal = lastSnap.outputs[blockId] ? extractValue(block, lastSnap.outputs[blockId]) : 0;
      const num = typeof rawVal === 'number' && Number.isFinite(rawVal) ? rawVal : 0;
      const y = 100 - (((num - vMin) / (vMax - vMin)) * 74 + 13);
      path += `L ${endX} ${y} `;
    }

    if (scrubTime !== null && scrubTime !== undefined) {
      const snap = history.find(h => h.timeMs >= scrubTime) || lastSnap;
      const rawVal = snap.outputs[blockId] ? extractValue(block, snap.outputs[blockId]) : 0;
      const num = typeof rawVal === 'number' && Number.isFinite(rawVal) ? rawVal : 0;
      pointY = 100 - (((num - vMin) / (vMax - vMin)) * 74 + 13);
      pointX = ((scrubTime - minTime) / widthMs) * 100;
    }

    return (
      <>
        <path d={path} fill="none" stroke={color} strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
        {pointX >= 0 && (
          <circle cx={pointX} cy={pointY} r="3.5" fill="white" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        )}
      </>
    );
  } else {
    // Draw digital square wave
    let path = '';
    let areaPath = '';
    let lastY = -1;
    let startX = 0;

    history.forEach((snap, i) => {
      const x = ((snap.timeMs - minTime) / widthMs) * 100;
      const rawVal = snap.outputs[blockId] ? extractValue(block, snap.outputs[blockId]) : false;
      const val = rawVal === true;
      const y = val ? 20 : 80;

      if (i === 0) {
        startX = x;
        path += `M ${x} ${y} `;
        areaPath += `M ${x} 80 L ${x} ${y} `;
        lastY = y;
      } else {
        if (y !== lastY) {
          path += `L ${x} ${lastY} `;
          areaPath += `L ${x} ${lastY} `;
        }
        path += `L ${x} ${y} `;
        areaPath += `L ${x} ${y} `;
        lastY = y;
      }
    });

    // Extend to latestTime if needed
    const lastSnap = history[history.length - 1];
    let finalX = ((lastSnap.timeMs - minTime) / widthMs) * 100;
    if (latestTime > lastSnap.timeMs) {
      finalX = ((latestTime - minTime) / widthMs) * 100;
      path += `L ${finalX} ${lastY} `;
      areaPath += `L ${finalX} ${lastY} `;
    }

    // Close area under curve for HIGH state shading
    areaPath += `L ${finalX} 80 L ${startX} 80 Z`;

    if (scrubTime !== null && scrubTime !== undefined) {
      const snap = history.find(h => h.timeMs >= scrubTime) || lastSnap;
      const rawVal = snap.outputs[blockId] ? extractValue(block, snap.outputs[blockId]) : false;
      const val = rawVal === true;
      pointY = val ? 20 : 80;
      pointX = ((scrubTime - minTime) / widthMs) * 100;
    }

    return (
      <>
        {/* Subtle pulse fill for HIGH state */}
        <path d={areaPath} fill={color} fillOpacity="0.10" />
        {/* Crisp square wave stroke */}
        <path d={path} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {pointX >= 0 && (
          <circle cx={pointX} cy={pointY} r="3.5" fill="white" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        )}
      </>
    );
  }
}
