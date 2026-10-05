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
  format?: 'fbd' | 'ladder';
}
export type CircuitFlowNode = Node<CircuitNodeData, 'circuit'>;
export function formatSignal(value: Signal | undefined): string {
  if (typeof value === 'boolean') return value ? 'ON' : 'OFF';
  if (typeof value === 'number') return Number.isFinite(value) ? Number(value.toFixed(3)).toString() : '—';
  return value ?? '—';
}

import { BlockIcon } from './BlockIcons';

export default function CircuitNode({ id, data, selected }: NodeProps<CircuitFlowNode>) {
  const definition = BLOCK_CATALOG[data.blockType];
  const active = data.outputs.Q === true;
  const analog = definition.outputs[0]?.kind === 'analog';
  const input = data.blockType === 'INPUT' || data.blockType === 'ANALOG_INPUT';
  
  if (data.format === 'ladder' && (data.blockType === 'INPUT' || data.blockType === 'NC_INPUT' || data.blockType === 'OUTPUT' || data.blockType === 'POWER_RAIL')) {
    const type = data.blockType;
    const label = data.tag || data.label || definition.name;
    const isPowered = data.outputs?.Q === true;
    const wireColor = isPowered ? 'bg-green-500' : 'bg-gray-800';
    const borderColor = isPowered ? 'border-green-500' : 'border-gray-800';
    const textColor = isPowered ? 'text-green-600' : 'text-gray-700';

    if (type === 'POWER_RAIL') {
      if (id === 'sys-power-rail') {
        return (
          <div className="relative w-[6px] h-[5000px]">
            <div className="absolute inset-0 bg-red-600 rounded-sm shadow-[2px_0_6px_rgba(239,68,68,0.4)]" />
            <Handle type="source" id="Q" position={Position.Right} className="!h-[5000px] !w-6 !-right-3 !top-0 !bg-transparent !border-none !rounded-none cursor-crosshair" style={{ background: 'transparent' }} />
            <Handle type="target" id="A" position={Position.Right} className="!h-[5000px] !w-6 !-right-3 !top-0 !bg-transparent !border-none !rounded-none cursor-crosshair" style={{ background: 'transparent' }} />
          </div>
        );
      }
      return (
        <div className={`flex items-center justify-center relative w-4 h-32 ${selected ? 'ring-2 ring-blue-400 rounded' : ''}`}>
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-red-600 -translate-x-1/2" />
          <Handle type="source" id="Q" position={Position.Right} className="!w-2 !h-2 !bg-gray-400 !border-none rounded-none" />
        </div>
      );
    }

    return (
      <div className={`flex items-center justify-center relative w-16 h-12 ${selected ? 'ring-2 ring-blue-400 rounded' : ''}`}>
        <div className={`absolute left-0 right-0 top-1/2 h-0.5 ${wireColor} -translate-y-1/2 z-0`} />
        
        {type === 'OUTPUT' ? (
          <div className={`relative z-10 w-8 h-8 rounded-full border-2 ${borderColor} bg-white flex items-center justify-center`}>
             <Handle type="target" id="A" position={Position.Left} className="!w-2 !h-2 !-left-2 !bg-gray-400 !border-none rounded-none" />
          </div>
        ) : (
          <div className="relative z-10 w-6 h-8 bg-white flex justify-between px-[1px]">
            <div className={`w-0.5 h-full ${wireColor}`} />
            {type === 'NC_INPUT' && <div className={`absolute left-1/2 top-1/2 w-8 h-0.5 ${wireColor} -translate-x-1/2 -translate-y-1/2 -rotate-45`} />}
            <div className={`w-0.5 h-full ${wireColor}`} />
            <Handle type="target" id="A" position={Position.Left} className="!w-2 !h-2 !-left-5 !bg-gray-400 !border-none rounded-none" />
            <Handle type="source" id="Q" position={Position.Right} className="!w-2 !h-2 !-right-5 !bg-gray-400 !border-none rounded-none" />
          </div>
        )}
        
        <span className={`absolute -top-4 whitespace-nowrap text-[10px] font-bold ${textColor}`}>{label}</span>
        
        {type !== 'OUTPUT' && !data.tag && (
          <button className="absolute -bottom-6 text-[8px] font-bold uppercase bg-white border border-gray-200 px-1 py-0.5 rounded text-gray-500 shadow-sm" onClick={() => data.onInput(id, !data.inputValue)}>
            {data.inputValue ? 'Turn OFF' : 'Turn ON'}
          </button>
        )}
      </div>
    );
  }
  return <div className={`circuit-node ${selected ? 'is-selected' : ''} ${active ? 'is-active' : ''}`}>
    <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`shrink-0 ${active ? 'text-green-600' : analog ? 'text-cyan-600' : 'text-gray-400'}`}><BlockIcon type={data.blockType} /></div>
        <div className="min-w-0"><p className="text-[9px] uppercase tracking-[.16em] text-gray-500">{definition.shortName}</p><p className="mt-0.5 truncate text-xs font-semibold text-gray-900" title={data.label || definition.name}>{data.label || definition.name}</p></div>
      </div>
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
