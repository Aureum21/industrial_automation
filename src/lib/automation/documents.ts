import { LogicEngine } from '../LogicEngine.ts';
import { getBlockDefinition } from './catalog.ts';
import type { BlockType, CircuitBlock, CircuitDocument, ParameterValue, HmiWidget } from './types.ts';

export const STORAGE_KEY = 'fieldnotes.circuit.v1';

export function createBlock(type: BlockType, id: string, position: CircuitBlock['position']): CircuitBlock {
  const definition = getBlockDefinition(type);
  if (!definition || definition.status !== 'ready') throw new Error('This component is scheduled for a later phase.');
  
  const block: CircuitBlock = {
    id, type, position,
    params: Object.fromEntries(definition.parameters.map(p => [p.key, p.defaultValue])),
  };
  
  if (definition.source || type === 'INPUT' || type === 'ANALOG_INPUT') {
    block.value = definition.outputs[0]?.kind === 'text' ? '' : definition.outputs[0]?.kind === 'analog' ? 0 : false;
  }
  
  return block;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseCircuitDocument(text: string): CircuitDocument {
  if (text.length > 2_000_000) throw new Error('Circuit files must be smaller than 2 MB.');
  const raw: unknown = JSON.parse(text);
  if (!record(raw) || raw.version !== 1 || typeof raw.name !== 'string' || !Array.isArray(raw.blocks) || !Array.isArray(raw.connections)) {
    throw new Error('Expected a Fieldnotes circuit with version 1, a name, blocks, and connections.');
  }
  if (raw.blocks.length > 500 || raw.connections.length > 2000) throw new Error('This workspace supports up to 500 blocks and 2,000 wires.');
  const blocks: CircuitBlock[] = raw.blocks.map((item: unknown) => {
    if (!record(item) || typeof item.id !== 'string' || !item.id.trim() || typeof item.type !== 'string' || !record(item.position) || !record(item.params)) {
      throw new Error('A block is missing its ID, type, position, or parameters.');
    }
    const definition = getBlockDefinition(item.type);
    if (!definition || definition.status !== 'ready') throw new Error(`Unsupported component: ${item.type}`);
    const { x, y } = item.position;
    if (typeof x !== 'number' || !Number.isFinite(x) || typeof y !== 'number' || !Number.isFinite(y)) throw new Error('Block positions must be finite numbers.');
    if (item.tag !== undefined && typeof item.tag !== 'string') throw new Error('Tags must be text.');
    if (item.label !== undefined && typeof item.label !== 'string') throw new Error('Labels must be text.');
    if (item.value !== undefined && typeof item.value !== 'boolean' && typeof item.value !== 'string' && (typeof item.value !== 'number' || !Number.isFinite(item.value))) throw new Error('Input values must be booleans, strings, or finite numbers.');
    const params: Record<string, ParameterValue> = {};
    for (const p of definition.parameters) {
      const value = item.params[p.key] === undefined ? p.defaultValue : item.params[p.key];
      if (p.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value) || (p.min !== undefined && value < p.min) || (p.max !== undefined && value > p.max))) throw new Error(`Invalid ${p.label} on ${definition.name}.`);
      if ((p.type === 'text' || p.type === 'select') && typeof value !== 'string') throw new Error(`Invalid ${p.label}.`);
      if (p.type === 'select' && !p.options?.some(o => o.value === value)) throw new Error(`Unknown choice for ${p.label}.`);
      if (p.type === 'boolean' && typeof value !== 'boolean') throw new Error(`Invalid ${p.label}.`);
      params[p.key] = value as ParameterValue;
    }
    return { id: item.id, type: definition.type, position: { x, y }, params, tag: item.tag as string | undefined, label: item.label as string | undefined, value: item.value as boolean | number | string | undefined };
  });
  const connections = raw.connections.map((item: unknown) => {
    if (!record(item) || !['id', 'fromBlockId', 'fromPin', 'toBlockId', 'toPin'].every(key => typeof item[key] === 'string' && (item[key] as string).length > 0)) throw new Error('A wire has invalid endpoints.');
    return { id: item.id as string, fromBlockId: item.fromBlockId as string, fromPin: item.fromPin as string, toBlockId: item.toBlockId as string, toPin: item.toPin as string };
  });
  if (new Set(blocks.map(b => b.id)).size !== blocks.length || new Set(connections.map(c => c.id)).size !== connections.length) throw new Error('Circuit IDs must be unique.');
  
  let widgets;
  if (Array.isArray(raw.widgets)) {
    widgets = raw.widgets.map((item: unknown) => {
      if (!record(item) || typeof item.id !== 'string' || typeof item.type !== 'string' || typeof item.tag !== 'string' || typeof item.x !== 'number' || typeof item.y !== 'number') {
        throw new Error('A SCADA widget is missing required fields.');
      }
      return { id: item.id, type: item.type, tag: item.tag, x: item.x, y: item.y, options: record(item.options) ? item.options : undefined } as unknown as HmiWidget;
    });
  }

  const document: CircuitDocument = { version: 1, name: raw.name.slice(0, 120), blocks, connections, widgets };
  const verifier = new LogicEngine();
  verifier.load(document);
  return document;
}
