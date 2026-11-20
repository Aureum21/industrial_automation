import { BLOCK_CATALOG, BLOCK_DEFINITIONS } from './catalog.ts';
import type { BlockDefinition, BlockType, CircuitBlock, CircuitConnection, CircuitDocument } from './types.ts';

/** URL slug for a block page, e.g. RS_LATCH → "rs-latch". */
export const blockSlug = (type: BlockType) => type.toLowerCase().replace(/_/g, '-');

export function blockFromSlug(slug: string): BlockDefinition | undefined {
  const definition = BLOCK_DEFINITIONS.find((block) => blockSlug(block.type) === slug);
  return definition?.status === 'ready' ? definition : undefined;
}

/** Blocks that get a public page (everything that runs in the simulator). */
export const DOCUMENTED_BLOCKS = BLOCK_DEFINITIONS.filter((block) => block.status === 'ready');

const DEMO_ANALOG_VALUES: Partial<Record<string, number>> = { SP: 60, PV: 40, SPEED: 30, V: 12, LOAD: 2, THETA1: 30, THETA2: 45, X: 120, Y: 80 };

/**
 * A ready-to-run circuit showing one block: an input for every input pin and an output for every
 * output pin, so readers can toggle inputs and watch the block react.
 */
export function demoCircuit(type: BlockType): CircuitDocument {
  const definition = BLOCK_CATALOG[type];
  const blocks: CircuitBlock[] = [];
  const connections: CircuitConnection[] = [];
  const params = Object.fromEntries(definition.parameters.map((parameter) => [parameter.key, parameter.defaultValue]));
  const main: CircuitBlock = { id: 'block', type, position: { x: 0, y: 0 }, label: definition.name, params };
  blocks.push(main);

  definition.inputs.forEach((pin) => {
    if (pin.kind === 'text') return;
    const id = `in_${pin.id}`;
    const analog = pin.kind === 'analog';
    const value = analog ? (DEMO_ANALOG_VALUES[pin.id] ?? (type === 'PWM' ? 30 : 50)) : false;
    blocks.push({
      id,
      type: analog ? 'ANALOG_INPUT' : 'INPUT',
      position: { x: 0, y: 0 },
      label: `${pin.label}`,
      value,
      params: analog ? { value } : {},
    });
    connections.push({ id: `w_${id}`, fromBlockId: id, fromPin: 'Q', toBlockId: 'block', toPin: pin.id });
  });

  // Input-type blocks are demonstrated by wiring them to a lamp.
  const outputs = definition.outputs.filter((pin) => pin.kind !== 'text');
  outputs.forEach((pin) => {
    const id = `out_${pin.id}`;
    const analog = pin.kind === 'analog';
    blocks.push({ id, type: analog ? 'ANALOG_OUTPUT' : 'OUTPUT', position: { x: 0, y: 0 }, label: pin.label, params: {} });
    connections.push({ id: `w_${id}`, fromBlockId: 'block', fromPin: pin.id, toBlockId: id, toPin: 'A' });
  });

  return { version: 1, name: `${definition.name} demo`, blocks, connections };
}
