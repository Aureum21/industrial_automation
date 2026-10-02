'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, applyNodeChanges, applyEdgeChanges, useReactFlow, type Connection, type Edge, type NodeChange, type EdgeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LogicEngine } from '@/lib/LogicEngine';
import { BLOCK_CATALOG, getBlockDefinition } from '@/lib/automation/catalog';
import { createBlock, parseCircuitDocument, STORAGE_KEY } from '@/lib/automation/documents';
import { parseCircuitDSL, stringifyCircuitDSL } from '@/lib/automation/dsl';
import { applyLayout } from '@/lib/automation/layout';
import { EXAMPLES, getExample } from '@/lib/automation/examples';
import type { BlockType, CircuitBlock, CircuitConnection, CircuitDocument, ParameterValue, Signal } from '@/lib/automation/types';
import Sidebar from '@/components/Sidebar';
import CircuitNode, { type CircuitFlowNode } from './CircuitNode';
import HmiCanvas, { type HmiWidget } from './HmiCanvas';

const nodeTypes = { circuit: CircuitNode };
const toWire = (connection: Connection, id: string): CircuitConnection => ({ id, fromBlockId: connection.source, fromPin: connection.sourceHandle ?? '', toBlockId: connection.target, toPin: connection.targetHandle ?? '' });

function Workspace() {
  const [engine] = useState(() => new LogicEngine());
  const [nodes, setNodes] = useState<CircuitFlowNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [name, setName] = useState('Untitled circuit');
  const [running, setRunning] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const [notice, setNotice] = useState('Loading workspace…');
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [mode, setMode] = useState<'visual' | 'code' | 'hmi'>('visual');
  const [dslCode, setDslCode] = useState('');
  const [widgets, setWidgets] = useState<HmiWidget[]>([]);
  const [pending, setPending] = useState<{ document: CircuitDocument; label: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow<CircuitFlowNode>();

  const sync = useCallback(() => {
    setNodes(previous => previous.map(node => {
      const block = engine.blocks.get(node.id);
      return block ? { ...node, data: { ...node.data, outputs: { ...block.outputs }, inputValue: block.value ?? false, tag: block.tag ?? '', params: { ...block.params } } } : node;
    }));
    setEdges(previous => previous.map(edge => {
      const value = engine.blocks.get(edge.source)?.outputs[edge.sourceHandle ?? 'Q'];
      const active = value === true;
      const analog = typeof value === 'number';
      return { ...edge, animated: active, style: { stroke: active ? '#c4ef72' : analog ? '#72d9e5' : '#4a5c70', strokeWidth: active ? 2.5 : 1.5 } };
    }));
    setTimeMs(engine.timeMs);
    setDiagnostics([...engine.diagnostics]);
  }, [engine]);

  const mutate = useCallback((operation: () => void) => {
    try { operation(); setDirty(true); sync(); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'That change could not be applied.'); }
  }, [sync]);

  const onInput = useCallback((id: string, value: Signal) => mutate(() => engine.setInput(id, value)), [engine, mutate]);
  const onTag = useCallback((id: string, tag: string) => mutate(() => engine.setTag(id, tag)), [engine, mutate]);
  const onParam = useCallback((id: string, key: string, value: ParameterValue) => mutate(() => engine.setParam(id, key, value)), [engine, mutate]);

  const makeNode = useCallback((block: CircuitBlock): CircuitFlowNode => ({ id: block.id, type: 'circuit', position: block.position, data: { blockType: block.type, label: block.label, tag: block.tag ?? '', params: block.params, inputValue: block.value ?? false, outputs: { ...engine.blocks.get(block.id)?.outputs }, onInput, onTag, onParam } }), [engine, onInput, onTag, onParam]);

  const load = useCallback((document: CircuitDocument, message: string) => {
    try {
      engine.load(document);
      setRunning(false);
      setNodes(document.blocks.map(makeNode));
      setEdges(document.connections.map(wire => ({ id: wire.id, source: wire.fromBlockId, sourceHandle: wire.fromPin, target: wire.toBlockId, targetHandle: wire.toPin, style: { stroke: '#9ca3af', strokeWidth: 1.5 } })));
      setName(document.name);
      setDirty(false);
      setTimeMs(0);
      setDiagnostics([]);
      setNotice(message);
      setPending(null);
      sync();
      requestAnimationFrame(() => { void fitView({ padding: 0.18, duration: 200, maxZoom: 1 }); });
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to load this circuit.'); }
  }, [engine, makeNode, fitView, sync]);

  useEffect(() => {
    // Deferring initialization keeps browser storage out of server rendering.
    const timer = setTimeout(() => {
      const example = new URLSearchParams(window.location.search).get('example');
      if (example) { load(getExample(example), 'Example loaded. Press Run or Step to simulate.'); return; }
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) { load(parseCircuitDocument(saved), 'Restored your saved circuit.'); return; }
      } catch { load(getExample('start-stop'), 'Saved circuit could not be restored. A starter example is open.'); return; }
      load(getExample('start-stop'), 'Starter example loaded. Press Run to explore.');
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

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
    const ids = new Set(nodes.filter(node => node.selected).map(node => node.id));
    const wires = edges.filter(edge => edge.selected || ids.has(edge.source) || ids.has(edge.target));
    ids.forEach(id => engine.removeBlock(id));
    wires.forEach(wire => engine.removeConnection(wire.id));
    setNodes(previous => previous.filter(node => !ids.has(node.id)));
    setEdges(previous => previous.filter(edge => !wires.some(wire => wire.id === edge.id)));
    setDirty(true); sync(); setNotice('Selection deleted from the circuit.');
  };

  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(engine.toDocument(name))); setDirty(false); setNotice('Circuit saved in this browser. Export a file to keep a portable copy.'); }
    catch { setNotice('Browser storage is unavailable. Use Export to save a circuit file.'); }
  };

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(engine.toDocument(name), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${name.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase() || 'circuit'}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Circuit exported. The file stores wiring and settings; simulation memory starts fresh when loaded.');
  };

  const selectedCount = nodes.filter(node => node.selected).length + edges.filter(edge => edge.selected).length;

  const changeMode = (newMode: 'visual' | 'code' | 'hmi') => {
    if (mode === newMode) return;
    if (mode === 'code') {
      try {
        const doc = parseCircuitDSL(dslCode, BLOCK_CATALOG);
        applyLayout(doc);
        load(doc, 'Parsed DSL and applied layout.');
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Invalid DSL syntax.');
        return;
      }
    }
    if (newMode === 'code') {
      const doc = engine.toDocument(name);
      setDslCode(stringifyCircuitDSL(doc));
    }
    setMode(newMode);
  };

  return <main id="main-content" className="lab-workspace flex min-h-0 flex-col bg-gray-50 text-gray-900 h-full w-full relative">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-3"><span className="rounded border border-green-200 bg-green-50 px-2 py-1 font-mono text-[10px] text-green-600">LAB / 01</span><input aria-label="Circuit name" value={name} maxLength={120} onChange={event => { setName(event.target.value); setDirty(true); }} className="w-48 bg-transparent text-sm font-semibold outline-none focus:text-green-600" /><span className="text-[10px] text-gray-400">{dirty ? 'Unsaved' : 'Workspace'}</span></div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-gray-100 p-0.5 rounded border border-gray-200 mr-2">
          <button className={`px-3 py-1 text-xs font-semibold rounded-sm transition ${mode === 'visual' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => changeMode('visual')}>Visual</button>
          <button className={`px-3 py-1 text-xs font-semibold rounded-sm transition ${mode === 'hmi' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => changeMode('hmi')}>HMI 🎛️</button>
          <button className={`px-3 py-1 text-xs font-semibold rounded-sm transition ${mode === 'code' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => changeMode('code')}>Code {`{}`}</button>
        </div>
        <button className="lab-button" onClick={save}>Save</button>
        <button className="lab-button" onClick={exportFile}>Export</button>
        <button className="lab-button" onClick={() => fileRef.current?.click()}>Import</button>
        <button className="lab-button" onClick={() => requestLoad({ version: 1, name: 'Untitled circuit', blocks: [], connections: [] }, 'New circuit ready.')}>New circuit</button>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex items-center gap-2"><button className="lab-button" onClick={() => setLibraryOpen(value => !value)} aria-expanded={libraryOpen}>Components</button><button className={`lab-button ${running ? '' : 'primary'}`} onClick={() => setRunning(value => !value)}>{running ? 'Ⅱ Pause' : '▶ Run'}</button><button className="lab-button" disabled={running} onClick={() => { engine.tick(100); sync(); }}>Step +100 ms</button><button className="lab-button" onClick={() => { setRunning(false); engine.reset(); sync(); setNotice('Simulation reset. Input settings are preserved.'); }}>Reset</button><span className="ml-2 font-mono text-[11px] text-gray-500">{(timeMs / 1000).toFixed(1)} s</span></div>
      <div className="flex items-center gap-2">
        <select aria-label="Load example circuit" className="lab-button max-w-48" value="" onChange={event => requestLoad(getExample(event.target.value), 'Example loaded. Press Run or Step to simulate.')}><option value="" disabled>Load an example</option>{EXAMPLES.map(example => <option key={example.id} value={example.id}>{example.name}</option>)}</select>
        <button className="lab-button danger" disabled={!selectedCount} onClick={deleteSelected}>Delete {selectedCount ? `(${selectedCount})` : ''}</button>
      </div>
    </div>
    <div className="relative flex min-h-0 flex-1">
      {libraryOpen && mode === 'visual' && <Sidebar onAdd={addBlock} />}
      <div className="relative min-w-0 flex-1 flex flex-col h-full bg-white overflow-hidden">
        {mode === 'visual' ? (
          <ReactFlow<CircuitFlowNode> nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={connection => mutate(() => {
            const wire = toWire(connection, crypto.randomUUID()); engine.addConnection(wire);
            setEdges(previous => [...previous, { id: wire.id, source: wire.fromBlockId, sourceHandle: wire.fromPin, target: wire.toBlockId, targetHandle: wire.toPin, style: { stroke: '#9ca3af', strokeWidth: 1.5 } }]); setNotice('Connection added.');
          })} isValidConnection={connection => engine.validateConnection(toWire({ source: connection.source, target: connection.target, sourceHandle: connection.sourceHandle ?? null, targetHandle: connection.targetHandle ?? null }, 'preview')) === null} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }} onDrop={event => { event.preventDefault(); const type = event.dataTransfer.getData('application/fieldnotes-block'); const definition = getBlockDefinition(type); if (definition?.status === 'ready') addBlock(definition.type, screenToFlowPosition({ x: event.clientX, y: event.clientY })); }} deleteKeyCode={['Backspace', 'Delete']} fitView fitViewOptions={{ maxZoom: 1, padding: 0.18 }} minZoom={0.15} maxZoom={2} colorMode="light" proOptions={{ hideAttribution: false }}>
            <Background color="#e5e7eb" gap={24} size={1} /><Controls /><MiniMap nodeColor="#d1d5db" maskColor="#f9fafbb0" pannable zoomable />
          </ReactFlow>
        ) : mode === 'hmi' ? (
          <HmiCanvas widgets={widgets} setWidgets={setWidgets} engine={engine} sync={sync} />
        ) : (
          <textarea
            value={dslCode}
            onChange={(e) => { setDslCode(e.target.value); setDirty(true); }}
            spellCheck={false}
            className="flex-1 w-full h-full p-6 font-mono text-sm leading-relaxed text-gray-800 bg-gray-50 border-none outline-none resize-none focus:ring-2 focus:ring-inset focus:ring-green-500"
          />
        )}
        {mode === 'visual' && !nodes.length && <div className="pointer-events-none absolute inset-0 grid place-items-center z-10"><div className="max-w-xs text-center"><p className="font-mono text-xs tracking-widest text-green-600">YOUR NEXT EXPERIMENT</p><h2 className="mt-4 text-2xl font-semibold">Start with a signal.</h2><p className="mt-3 text-sm leading-6 text-gray-400">Add an input from the component library, connect a block, and press Run.</p></div></div>}
        <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-gray-200 bg-gray-50/90 px-3 py-2 text-[10px] text-gray-500"><span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${running ? 'bg-green-500' : 'bg-slate-500'}`} />{running ? 'SIMULATION RUNNING' : 'SIMULATION PAUSED'}<span className="ml-4 text-gray-400">100 ms / scan</span></div>
      </div>
    </div>
    <div className="flex min-h-9 flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-white px-4 py-2 text-[10px]"><p role="status" className={diagnostics.length ? 'text-amber-500 font-semibold' : notice.includes('Invalid DSL') ? 'text-red-500 font-semibold' : 'text-gray-500'}>{diagnostics[0] ?? notice}</p><span className="font-mono text-gray-400">{nodes.length} blocks · {edges.length} wires <span className="ml-3 hidden sm:inline">Select + Delete · Green: digital · Cyan: analog</span></span></div>
    <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" aria-label="Import circuit file" onChange={async event => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; try { if (file.size > 2_000_000) throw new Error('Circuit files must be smaller than 2 MB.'); requestLoad(parseCircuitDocument(await file.text()), `Imported ${file.name}.`); } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to read this file.'); } }} />
    {pending && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-6" role="dialog" aria-modal="true" aria-labelledby="replace-title"><div className="max-w-sm rounded-xl border border-green-200 bg-white p-6"><h2 id="replace-title" className="text-lg font-semibold">Replace this circuit?</h2><p className="mt-3 text-sm leading-6 text-gray-500">There are unsaved changes. Save your current circuit or export a copy before replacing it.</p><div className="mt-5 flex flex-wrap gap-2"><button autoFocus className="lab-button" onClick={() => setPending(null)}>Keep editing</button><button className="lab-button" onClick={save}>Save current</button><button className="lab-button primary" onClick={() => load(pending.document, pending.label)}>Replace</button></div></div></div>}
  </main>;
}

export default function LabWorkspace() { return <ReactFlowProvider><Workspace /></ReactFlowProvider>; }
