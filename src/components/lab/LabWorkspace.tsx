'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls, MiniMap, applyNodeChanges, applyEdgeChanges, useReactFlow, useNodesInitialized, ConnectionLineType, type Connection, type Edge, type NodeChange, type EdgeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LogicEngine } from '@/lib/LogicEngine';
import { BLOCK_CATALOG, getBlockDefinition } from '@/lib/automation/catalog';
import { createBlock, parseCircuitDocument, STORAGE_KEY } from '@/lib/automation/documents';
import { parseCircuitDSL, stringifyCircuitDSL } from '@/lib/automation/dsl';
import { applyLayout } from '@/lib/automation/layout';
import { EXAMPLES, getExample } from '@/lib/automation/examples';
import type { BlockType, CircuitBlock, CircuitConnection, CircuitDocument, ParameterValue, Signal, HmiWidget } from '@/lib/automation/types';
import Sidebar from '@/components/Sidebar';
import CircuitNode, { type CircuitFlowNode } from './CircuitNode';
import HmiCanvas from './HmiCanvas';
import Oscilloscope from './oscilloscope/Oscilloscope';


const nodeTypes = { circuit: CircuitNode };
const toWire = (connection: Connection, id: string): CircuitConnection => ({ id, fromBlockId: connection.source, fromPin: connection.sourceHandle ?? '', toBlockId: connection.target, toPin: connection.targetHandle ?? '' });

function Workspace({ readOnly, initialDocument, isFullscreen }: { readOnly?: boolean; initialDocument?: CircuitDocument; isFullscreen?: boolean }) {
  const [engine] = useState(() => new LogicEngine());
  const [nodes, setNodes] = useState<CircuitFlowNode[]>(() => {
    if (initialDocument) {
      try {
        engine.load(initialDocument);
        return initialDocument.blocks.map(b => ({
          id: b.id,
          type: 'circuit',
          position: b.position,
          initialWidth: 210,
          initialHeight: 180,
          data: {
            blockType: b.type,
            label: b.label,
            tag: b.tag ?? '',
            params: b.params,
            inputValue: b.value ?? false,
            outputs: { ...engine.blocks.get(b.id)?.outputs },
            onInput: () => {},
            onTag: () => {},
            onParam: () => {},
          },
        }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [edges, setEdges] = useState<Edge[]>(() => {
    if (initialDocument) {
      return initialDocument.connections.map(wire => ({
        id: wire.id,
        source: wire.fromBlockId,
        sourceHandle: wire.fromPin,
        target: wire.toBlockId,
        targetHandle: wire.toPin,
        type: 'default',
        style: { stroke: '#9ca3af', strokeWidth: 1.5 }
      }));
    }
    return [];
  });
  const [name, setName] = useState('Untitled circuit');
  const [running, setRunning] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const [notice, setNotice] = useState('Loading workspace…');
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(!readOnly);
  const [mode, setMode] = useState<'visual' | 'code' | 'hmi'>('visual');
  const [dslCode, setDslCode] = useState('');
  const [widgets, setWidgets] = useState<HmiWidget[]>([]);
  const [pending, setPending] = useState<{ document: CircuitDocument; label: string } | null>(null);
  const [timeScrub, setTimeScrub] = useState<number | null>(null);
  const [syncKey, setSyncKey] = useState(0);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const flowWrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView, getNodes } = useReactFlow<CircuitFlowNode>();
  const nodesInitialized = useNodesInitialized();

  const centerView = useCallback((duration = 200) => {
    void fitView({ padding: 0.16, duration, maxZoom: 0.95, minZoom: 0.1 });
  }, [fitView]);

  const sync = useCallback((scrubTime: number | null = null) => {
    let getOutputs = (id: string) => engine.blocks.get(id)?.outputs;
    if (scrubTime !== null && engine.history.length > 0) {
      const snapshot = engine.history.find(h => h.timeMs >= scrubTime) ?? engine.history[engine.history.length - 1];
      if (snapshot) getOutputs = (id: string) => snapshot.outputs[id];
    }
    
    setNodes(previous => previous.map(node => {
      const block = engine.blocks.get(node.id);
      const outputs = getOutputs(node.id);
      return block ? { ...node, data: { ...node.data, outputs: { ...(outputs || block.outputs) }, inputValue: block.value ?? false, tag: block.tag ?? '', params: { ...block.params } } } : node;
    }));
    setEdges(previous => previous.map(edge => {
      const outputs = getOutputs(edge.source);
      const value = outputs ? outputs[edge.sourceHandle ?? 'Q'] : undefined;
      const active = value === true;
      const analog = typeof value === 'number';
      return { ...edge, animated: active, style: { stroke: active ? '#c4ef72' : analog ? '#72d9e5' : '#4a5c70', strokeWidth: active ? 2.5 : 1.5 } };
    }));
    setTimeMs(engine.timeMs);
    setDiagnostics([...engine.diagnostics]);
    setSyncKey(k => k + 1);
  }, [engine]);

  const runningRef = useRef(running);
  runningRef.current = running;

  const mutate = useCallback((operation: () => void) => {
    try { operation(); if (!readOnly) setDirty(true); sync(); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'That change could not be applied.'); }
  }, [sync, readOnly]);

  const handleScrub = useCallback((time: number | null) => {
    setTimeScrub(time);
    if (time !== null && runningRef.current) setRunning(false);
    sync(time);
  }, [sync]);

  const onInput = useCallback((id: string, value: Signal) => mutate(() => engine.setInput(id, value, true)), [engine, mutate]);
  const onTag = useCallback((id: string, tag: string) => mutate(() => engine.setTag(id, tag)), [engine, mutate]);
  const onParam = useCallback((id: string, key: string, value: ParameterValue) => mutate(() => engine.setParam(id, key, value)), [engine, mutate]);

  const makeNode = useCallback(
    (block: CircuitBlock): CircuitFlowNode => ({
      id: block.id,
      type: 'circuit',
      position: block.position,
      width: 220,
      height: 190,
      initialWidth: 220,
      initialHeight: 190,
      data: {
        blockType: block.type,
        label: block.label,
        tag: block.tag ?? '',
        params: block.params,
        inputValue: block.value ?? false,
        outputs: { ...engine.blocks.get(block.id)?.outputs },
        onInput,
        onTag,
        onParam,
      },
    }),
    [engine, onInput, onTag, onParam]
  );

  const load = useCallback((document: CircuitDocument, message: string) => {
    try {
      engine.load(document);
      setRunning(false);
      setNodes(document.blocks.map(makeNode));
      setEdges(document.connections.map(wire => ({ id: wire.id, source: wire.fromBlockId, sourceHandle: wire.fromPin, target: wire.toBlockId, targetHandle: wire.toPin, type: 'default', style: { stroke: '#9ca3af', strokeWidth: 1.5 } })));
      setWidgets((document.widgets as HmiWidget[]) || []);
      setName(document.name);
      setDirty(false);
      setTimeMs(0);
      setDiagnostics([]);
      setNotice(message);
      setPending(null);
      sync();
      requestAnimationFrame(() => centerView(0));
      setTimeout(() => centerView(0), 40);
      setTimeout(() => centerView(150), 120);
      setTimeout(() => centerView(200), 300);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to load this circuit.'); }
  }, [engine, makeNode, centerView, sync]);

  const loadRef = useRef(load);
  loadRef.current = load;
  const loadedCircuitKeyRef = useRef<string | null>(null);

  // Auto-center whenever nodes are initialized or change
  useEffect(() => {
    if (nodes.length > 0) {
      requestAnimationFrame(() => centerView(0));
      const t1 = setTimeout(() => centerView(0), 50);
      const t2 = setTimeout(() => centerView(150), 150);
      const t3 = setTimeout(() => centerView(200), 350);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [nodesInitialized, nodes.length, centerView]);

  // Auto-center when toggling between fullscreen and minimized
  useEffect(() => {
    const timer1 = setTimeout(() => centerView(150), 80);
    const timer2 = setTimeout(() => centerView(200), 250);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isFullscreen, centerView]);

  // Auto-center when container dimensions change (resize observer)
  useEffect(() => {
    const el = flowWrapperRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let resizeTimer: NodeJS.Timeout;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || entry.contentRect.width === 0 || entry.contentRect.height === 0) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (nodes.length > 0) {
          centerView(150);
        }
      }, 50);
    });
    observer.observe(el);
    return () => {
      clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [centerView, nodes.length]);

  useEffect(() => {
    if (initialDocument) {
      const circuitKey = `${initialDocument.name ?? ''}::${initialDocument.blocks.length}::${initialDocument.connections.length}`;
      if (loadedCircuitKeyRef.current === circuitKey) return;
      loadedCircuitKeyRef.current = circuitKey;
      loadRef.current(initialDocument, `${initialDocument.name ?? 'Circuit'} loaded.`);
      return;
    }
    // Deferring initialization keeps browser storage out of server rendering.
    const timer = setTimeout(() => {
      const example = new URLSearchParams(window.location.search).get('example');
      if (example) { loadRef.current(getExample(example), 'Example loaded. Press Run or Step to simulate.'); return; }
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) { loadRef.current(parseCircuitDocument(saved), 'Restored your saved circuit.'); return; }
      } catch { loadRef.current(getExample('start-stop'), 'Saved circuit could not be restored. A starter example is open.'); return; }
      loadRef.current(getExample('start-stop'), 'Starter example loaded. Press Run to explore.');
    }, 0);
    return () => clearTimeout(timer);
  }, [initialDocument]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => { engine.tick(100); sync(); }, 100);
    return () => clearInterval(interval);
  }, [engine, running, sync]);

  useEffect(() => {
    if (!dirty) return;
    const onLeave = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [dirty]);

  const requestLoad = (document: CircuitDocument, label: string) => {
    if (dirty) setPending({ document, label });
    else load(document, label);
  };

  const addBlock = (type: BlockType, position?: { x: number; y: number }) => {
    if (readOnly) return;
    mutate(() => {
      const canvas = document.querySelector('.react-flow')?.getBoundingClientRect();
      const block = createBlock(type, crypto.randomUUID(), position ?? screenToFlowPosition({ x: (canvas?.left ?? 300) + (canvas?.width ?? 800) / 2 + Math.random() * 60, y: (canvas?.top ?? 160) + (canvas?.height ?? 500) / 2 + Math.random() * 60 }));
      engine.addBlock(block);
      
      setNodes(previous => [...previous, makeNode(block)]);
      
      setNotice(`${getBlockDefinition(type)?.name} added.`);
    });
  };

  const onNodesChange = useCallback((changes: NodeChange<CircuitFlowNode>[]) => {
    for (const change of changes) {
      if (change.type === 'remove') engine.removeBlock(change.id);
      if (change.type === 'position' && change.position) { const block = engine.blocks.get(change.id); if (block) block.position = change.position; }
    }
    setNodes(previous => applyNodeChanges(changes, previous));
    const valid = new Set(engine.connections.map(connection => connection.id));
    setEdges(previous => previous.filter(edge => valid.has(edge.id)));
    if (changes.some(change => change.type === 'remove' || change.type === 'position')) setDirty(true);
    if (changes.some(change => change.type === 'remove')) sync();
  }, [engine, sync]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    for (const change of changes) if (change.type === 'remove') engine.removeConnection(change.id);
    setEdges(previous => applyEdgeChanges(changes, previous));
    if (changes.some(change => change.type === 'remove')) { setDirty(true); sync(); }
  }, [engine, sync]);

  const deleteSelected = () => {
    if (readOnly) return;
    const ids = new Set(nodes.filter(node => node.selected).map(node => node.id));
    const wires = edges.filter(edge => edge.selected || ids.has(edge.source) || ids.has(edge.target));
    ids.forEach(id => engine.removeBlock(id));
    wires.forEach(wire => engine.removeConnection(wire.id));
    setNodes(previous => previous.filter(node => !ids.has(node.id)));
    setEdges(previous => previous.filter(edge => !wires.some(wire => wire.id === edge.id)));
    setDirty(true); sync(); setNotice('Selection deleted from the circuit.');
  };



  const save = () => {
    if (readOnly) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(engine.toDocument(name, widgets))); setDirty(false); setNotice('Circuit saved in this browser. Export a file to keep a portable copy.'); }
    catch { setNotice('Browser storage is unavailable. Use Export to save a circuit file.'); }
  };

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(engine.toDocument(name, widgets), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${name.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase() || 'circuit'}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Circuit exported. The file stores wiring and settings; simulation memory starts fresh when loaded.');
  };

  const selectedCount = nodes.filter(node => node.selected).length + edges.filter(edge => edge.selected).length;

  const changeMode = (newMode: 'visual' | 'code' | 'hmi') => {
    if (mode === newMode) return;
    if (mode === 'code') {
      if (readOnly) {
        setNotice('Cannot apply code changes in view-only mode.');
      } else {
        try {
          const doc = parseCircuitDSL(dslCode, BLOCK_CATALOG);
          doc.widgets = widgets; // Preserve widgets since DSL doesn't store them
          applyLayout(doc);
          load(doc, 'Parsed DSL and applied layout.');
        } catch (error) {
          setNotice(error instanceof Error ? error.message : 'Invalid DSL syntax.');
          return;
        }
      }
    }
    if (newMode === 'code') {
      const doc = engine.toDocument(name);
      setDslCode(stringifyCircuitDSL(doc));
    }
    setMode(newMode);
  };

  return <main id="main-content" className="lab-workspace flex min-h-0 flex-col bg-[#fbfbfd] text-[#1d1d1f] h-full w-full relative">
    {!readOnly && (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e5ea] px-4 py-2.5 bg-white">
        <div className="flex items-center gap-3">
          <span className="rounded-md border border-[#e5e5ea] bg-[#f5f5f7] px-2 py-0.5 font-mono text-[10px] text-[#1d1d1f]">LAB / 01</span>
          <input aria-label="Circuit name" value={name} maxLength={120} onChange={event => { setName(event.target.value); setDirty(true); }} className="w-48 bg-transparent text-sm font-semibold text-[#1d1d1f] outline-none focus:text-[#0071e3]" />
          <span className="text-[10px] text-[#86868b]">{dirty ? 'Unsaved' : 'Workspace'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-[#f5f5f7] p-1 rounded-xl border border-[#e5e5ea] mr-2">
            <button className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${mode === 'visual' ? 'bg-white shadow-xs text-[#1d1d1f]' : 'text-[#86868b] hover:text-[#1d1d1f]'}`} onClick={() => changeMode('visual')}>Visual (FBD)</button>
            <button className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${mode === 'hmi' ? 'bg-white shadow-xs text-[#1d1d1f]' : 'text-[#86868b] hover:text-[#1d1d1f]'}`} onClick={() => changeMode('hmi')}>HMI 🎛️</button>
            <button className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${mode === 'code' ? 'bg-white shadow-xs text-[#1d1d1f]' : 'text-[#86868b] hover:text-[#1d1d1f]'}`} onClick={() => changeMode('code')}>Code {`{}`}</button>
          </div>
          <button className="lab-button" onClick={save}>Save</button>
          <button className="lab-button" onClick={exportFile}>Export</button>
          <button className="lab-button" onClick={() => fileRef.current?.click()}>Import</button>
          <button className="lab-button" onClick={() => setShowNewDialog(true)}>New circuit</button>
        </div>
      </div>
    )}
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e5ea] bg-white px-4 py-2">
      <div className="flex items-center gap-2">
        {!readOnly && <button className="lab-button" onClick={() => setLibraryOpen(value => !value)} aria-expanded={libraryOpen}>Components</button>}
        <button className={`lab-button ${running ? '' : 'primary'}`} onClick={() => setRunning(value => !value)}>{running ? 'Ⅱ Pause' : '▶ Run'}</button>
        <button className="lab-button" disabled={running} onClick={() => { engine.tick(100); sync(); }}>Step +100 ms</button>
        <button className="lab-button" onClick={() => { setRunning(false); engine.reset(); sync(); setNotice('Simulation reset. All switches turned off.'); }}>Reset</button>
        <button className="lab-button" onClick={() => centerView(200)} title="Center circuit in view">⛶ Center</button>
        <span className="ml-2 font-mono text-[11px] text-[#86868b]">{(timeMs / 1000).toFixed(1)} s</span>
      </div>
      <div className="flex items-center gap-2">
        {!readOnly && <select aria-label="Load example circuit" className="lab-button max-w-48" value="" onChange={event => requestLoad(getExample(event.target.value), 'Example loaded. Press Run or Step to simulate.')}><option value="" disabled>Load an example</option>{EXAMPLES.map(example => <option key={example.id} value={example.id}>{example.name}</option>)}</select>}
        {!readOnly && <button className="lab-button danger" disabled={!selectedCount} onClick={deleteSelected}>Delete {selectedCount ? `(${selectedCount})` : ''}</button>}
      </div>
    </div>
    <div className="relative flex min-h-0 flex-1">
      {!readOnly && libraryOpen && mode === 'visual' && <Sidebar onAdd={addBlock} />}
      <div ref={flowWrapperRef} className="relative min-w-0 flex-1 flex flex-col h-full bg-white overflow-hidden">
        {mode === 'visual' ? (
          <ReactFlow<CircuitFlowNode> nodes={nodes} edges={edges} nodeTypes={nodeTypes} connectionLineType={ConnectionLineType.Bezier} onNodesChange={readOnly ? undefined : onNodesChange} onEdgesChange={readOnly ? undefined : onEdgesChange} onConnect={readOnly ? undefined : connection => mutate(() => {
            const wire = toWire(connection, crypto.randomUUID()); engine.addConnection(wire);
            setEdges(previous => [...previous, { id: wire.id, source: wire.fromBlockId, sourceHandle: wire.fromPin, target: wire.toBlockId, targetHandle: wire.toPin, type: 'default', style: { stroke: '#9ca3af', strokeWidth: 1.5 } }]); setNotice('Connection added.');
          })} isValidConnection={connection => engine.validateConnection(toWire({ source: connection.source, target: connection.target, sourceHandle: connection.sourceHandle ?? null, targetHandle: connection.targetHandle ?? null }, 'preview')) === null} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }} onDrop={event => { if (readOnly) return; event.preventDefault(); const type = event.dataTransfer.getData('application/fieldnotes-block'); const definition = getBlockDefinition(type); if (definition?.status === 'ready') addBlock(definition.type, screenToFlowPosition({ x: event.clientX, y: event.clientY })); }} deleteKeyCode={readOnly ? null : ['Backspace', 'Delete']} fitView fitViewOptions={{ maxZoom: 0.95, padding: 0.16, minZoom: 0.1 }} minZoom={0.1} maxZoom={2} colorMode="light" proOptions={{ hideAttribution: false }} nodesDraggable={!readOnly} nodesConnectable={!readOnly} elementsSelectable={!readOnly}>
            <Background color="#e5e7eb" gap={24} size={1} variant={BackgroundVariant.Dots} />
            <Controls />
            <MiniMap nodeColor="#d1d5db" maskColor="#f9fafbb0" pannable zoomable />
          </ReactFlow>
        ) : mode === 'hmi' ? (
          <HmiCanvas widgets={widgets} setWidgets={setWidgets} engine={engine} sync={sync} running={running} />
        ) : (
          <textarea
            value={dslCode}
            onChange={(e) => { if (!readOnly) { setDslCode(e.target.value); setDirty(true); } }}
            readOnly={readOnly}
            spellCheck={false}
            className="flex-1 w-full h-full p-6 font-mono text-sm leading-relaxed text-gray-800 bg-gray-50 border-none outline-none resize-none focus:ring-2 focus:ring-inset focus:ring-green-500"
          />
        )}
        {mode === 'visual' && !nodes.length && <div className="pointer-events-none absolute inset-0 grid place-items-center z-10"><div className="max-w-xs text-center"><p className="font-mono text-xs tracking-widest text-green-600">YOUR NEXT EXPERIMENT</p><h2 className="mt-4 text-2xl font-semibold">Start with a signal.</h2><p className="mt-3 text-sm leading-6 text-gray-400">Add an input from the component library, connect a block, and press Run.</p></div></div>}
        <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-gray-200 bg-gray-50/90 px-3 py-2 text-[10px] text-gray-500"><span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${running ? 'bg-green-500' : 'bg-slate-500'}`} />{running ? 'SIMULATION RUNNING' : 'SIMULATION PAUSED'}<span className="ml-4 text-gray-400">100 ms / scan</span></div>
        {(!readOnly || isFullscreen) && <Oscilloscope engine={engine} onScrub={handleScrub} scrubTime={timeScrub} timeMs={timeMs} syncKey={syncKey} />}
      </div>
    </div>
    {!readOnly && (
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-white px-4 py-2 text-[10px]"><p role="status" className={diagnostics.length ? 'text-amber-500 font-semibold' : notice.includes('Invalid DSL') ? 'text-red-500 font-semibold' : 'text-gray-500'}>{diagnostics[0] ?? notice}</p><span className="font-mono text-gray-400">{nodes.length} blocks · {edges.length} wires <span className="ml-3 hidden sm:inline">Select + Delete · Green: digital · Cyan: analog</span></span></div>
    )}
    <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" aria-label="Import circuit file" onChange={async event => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; try { if (file.size > 2_000_000) throw new Error('Circuit files must be smaller than 2 MB.'); requestLoad(parseCircuitDocument(await file.text()), `Imported ${file.name}.`); } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to read this file.'); } }} />
    {pending && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-6" role="dialog" aria-modal="true" aria-labelledby="replace-title"><div className="max-w-sm rounded-xl border border-green-200 bg-white p-6"><h2 id="replace-title" className="text-lg font-semibold">Replace this circuit?</h2><p className="mt-3 text-sm leading-6 text-gray-500">There are unsaved changes. Save your current circuit or export a copy before replacing it.</p><div className="mt-5 flex flex-wrap gap-2"><button autoFocus className="lab-button" onClick={() => setPending(null)}>Keep editing</button><button className="lab-button" onClick={save}>Save current</button><button className="lab-button primary" onClick={() => load(pending.document, pending.label)}>Replace</button></div></div></div>}
    {showNewDialog && (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-6" role="dialog" aria-modal="true">
        <div className="max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold mb-2">Create New Project</h2>
          <p className="text-sm text-gray-500 mb-6">Start a blank workspace to build your logic.</p>
          <div className="flex justify-end gap-2 mt-6">
            <button className="lab-button" onClick={() => setShowNewDialog(false)}>Cancel</button>
            <button 
              className="lab-button primary"
              onClick={() => { setShowNewDialog(false); requestLoad({ version: 1, name: 'Untitled circuit', blocks: [], connections: [] }, 'New circuit ready.'); }}
            >
              Create New Circuit
            </button>
          </div>
        </div>
      </div>
    )}
  </main>;
}

export default function LabWorkspace({ readOnly, document, isFullscreen }: { readOnly?: boolean; document?: CircuitDocument; isFullscreen?: boolean }) { return <ReactFlowProvider><Workspace readOnly={readOnly} initialDocument={document} isFullscreen={isFullscreen} /></ReactFlowProvider>; }
