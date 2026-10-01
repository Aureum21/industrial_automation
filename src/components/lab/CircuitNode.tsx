'use client';

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { BLOCK_CATALOG } from '@/lib/automation/catalog';
import type { BlockType, ParameterValue, Signal } from '@/lib/automation/types';

export interface CircuitNodeData extends Record<string, unknown> {
  blockType: BlockType;
  label?: string;
  tag: string;
  inputValue: Signal;
  params: Record<string, ParameterValue>;
  outputs: Record<string, Signal>;
  onInput: (id: string, value: Signal) => void;
  onTag: (id: string, tag: string) => void;
  onParam: (id: string, key: string, value: ParameterValue) => void;
}
export type CircuitFlowNode = Node<CircuitNodeData, 'circuit'>;
export function formatSignal(value: Signal | undefined): string {
  if (typeof value === 'boolean') return value ? 'ON' : 'OFF';
  if (typeof value === 'number') return Number.isFinite(value) ? Number(value.toFixed(3)).toString() : '—';
  return value ?? '—';
}

export default function CircuitNode({ id, data, selected }: NodeProps<CircuitFlowNode>) {
  const definition = BLOCK_CATALOG[data.blockType];
  const active = data.outputs.Q === true;
  const analog = definition.outputs[0]?.kind === 'analog';
  const input = data.blockType === 'INPUT' || data.blockType === 'ANALOG_INPUT';
  return <div className={`circuit-node ${selected ? 'is-selected' : ''} ${active ? 'is-active' : ''}`}>
    <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-2.5">
      <div className="min-w-0"><p className="text-[9px] uppercase tracking-[.16em] text-gray-500">{definition.shortName}</p><p className="mt-1 truncate text-xs font-semibold text-gray-900" title={data.label || definition.name}>{data.label || definition.name}</p></div>
      <span className={`h-2 w-2 shrink-0 rounded-full ${active ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]' : analog ? 'bg-cyan-500' : 'bg-gray-300'}`} />
    </div>
    <div className="py-2">{Array.from({ length: Math.max(definition.inputs.length, definition.outputs.length) }, (_, index) => {
      const pinIn = definition.inputs[index], pinOut = definition.outputs[index];
      return <div key={index} className="relative flex h-7 items-center justify-between px-4 text-[10px] font-mono text-gray-500">
        <span>{pinIn && <><Handle type="target" id={pinIn.id} position={Position.Left} className={`signal-handle ${pinIn.kind}`} title={`${pinIn.label} · ${pinIn.kind}`} />{pinIn.label}</>}</span>
        <span>{pinOut && <><span className="mr-2 text-gray-800">{formatSignal(data.outputs[pinOut.id])}</span>{pinOut.label}<Handle type="source" id={pinOut.id} position={Position.Right} className={`signal-handle ${pinOut.kind}`} title={`${pinOut.label} · ${pinOut.kind}`} /></>}</span>
      </div>;
    })}</div>
    {(input || definition.tagged || definition.parameters.length > 0) && <div className="nodrag nowheel space-y-2 border-t border-gray-200 p-3">
      {input && !data.tag && (analog ? <label className="flex items-center justify-between gap-2 text-[10px] text-gray-500">Input value<input aria-label={`${data.label || definition.name} value`} className="node-field w-24" type="number" step="any" value={typeof data.inputValue === 'number' ? data.inputValue : 0} onChange={event => { if (event.target.value !== '' && Number.isFinite(event.target.valueAsNumber)) data.onInput(id, event.target.valueAsNumber); }} /></label> : <button aria-label={`Toggle ${data.label || definition.name}`} aria-pressed={data.inputValue === true} onClick={() => data.onInput(id, !data.inputValue)} className={`w-full rounded py-1.5 text-[10px] font-bold tracking-widest ${data.inputValue ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{data.inputValue ? 'ON' : 'OFF'} <span className="ml-2 opacity-60">TOGGLE</span></button>)}
      {definition.tagged && <input key={`tag-${data.tag}`} className="node-field w-full" aria-label={`${data.label || definition.name} tag`} placeholder={input ? 'Read tag (optional)' : 'Write tag (optional)'} defaultValue={data.tag} onBlur={event => { data.onTag(id, event.target.value.trim()); event.target.value = data.tag; }} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} />}
      {definition.parameters.filter(parameter => !(input && parameter.key === 'value')).map(parameter => <label key={parameter.key} className="flex items-center justify-between gap-2 text-[10px] text-gray-500"><span>{parameter.label}{parameter.unit ? ` · ${parameter.unit}` : ''}</span>{parameter.type === 'select' ? <select className="node-field w-24" aria-label={parameter.label} value={String(data.params[parameter.key] ?? parameter.defaultValue)} onChange={event => data.onParam(id, parameter.key, event.target.value)}>{parameter.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input key={String(data.params[parameter.key])} className="node-field w-20" aria-label={parameter.label} type={parameter.type === 'number' ? 'number' : 'text'} min={parameter.min} max={parameter.max} step={parameter.step ?? 'any'} defaultValue={String(data.params[parameter.key] ?? parameter.defaultValue)} onBlur={event => {
        const value = parameter.type === 'number' ? event.target.valueAsNumber : event.target.value;
        if (typeof value === 'number' && (!Number.isFinite(value) || (parameter.min !== undefined && value < parameter.min) || (parameter.max !== undefined && value > parameter.max))) { event.target.value = String(data.params[parameter.key]); return; }
        data.onParam(id, parameter.key, value);
      }} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} />}</label>)}
    </div>}
  </div>;
}
