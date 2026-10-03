import { createBlock } from './documents.ts';
import type { BlockType, CircuitBlock, CircuitConnection, CircuitDocument } from './types.ts';

const block = (type: BlockType, id: string, x: number, y: number, label: string, value?: boolean | number): CircuitBlock => ({ ...createBlock(type, id, { x, y }), label, ...(value !== undefined ? { value } : {}) });
const wire = (from: string, to: string, pin = 'A', output = 'Q'): CircuitConnection => ({ id: `${from}-${output}-${to}-${pin}`, fromBlockId: from, fromPin: output, toBlockId: to, toPin: pin });

export const EXAMPLES: { id: string; name: string; description: string; create: () => CircuitDocument }[] = [
  {
    id: 'start-stop', name: 'Start / stop interlock', description: 'Latch a run request; use a permissive to enable the motor.',
    create: () => ({ version: 1, name: 'Start / stop interlock', blocks: [
      block('INPUT', 'start', 0, 0, 'Start request'), block('INPUT', 'stop', 0, 210, 'Stop request'),
      block('RS_LATCH', 'memory', 280, 10, 'Run memory'), block('INPUT', 'permit', 280, 240, 'Permissive', true),
      block('AND', 'interlock', 560, 50, 'Run permitted'), block('OUTPUT', 'motor', 840, 50, 'Motor command'),
    ], connections: [wire('start', 'memory', 'S'), wire('stop', 'memory', 'R'), wire('memory', 'interlock'), wire('permit', 'interlock', 'B'), wire('interlock', 'motor')] }),
  },
  {
    id: 'ladder-basic', name: 'Basic Ladder Circuit', description: 'A simple series circuit on a ladder rung.',
    create: () => ({
      version: 1, format: 'ladder', name: 'Basic Ladder Circuit', blocks: [
        block('INPUT', 'start', 0, 0, 'Start Button'),
        block('NC_INPUT', 'stop', 150, 0, 'Stop Button'),
        block('OUTPUT', 'motor', 1050, 0, 'Motor Coil')
      ], connections: []
    }),
  },
  {
    id: 'and', name: 'Two-input AND', description: 'Both switches must be on to energize the output.',
    create: () => ({ version: 1, name: 'Two-input AND', blocks: [block('INPUT', 'a', 0, 0, 'Input A'), block('INPUT', 'b', 0, 220, 'Input B'), block('AND', 'gate', 280, 70, 'Both required'), block('OUTPUT', 'lamp', 560, 70, 'Indicator')], connections: [wire('a', 'gate'), wire('b', 'gate', 'B'), wire('gate', 'lamp')] }),
  },
  {
    id: 'analog', name: 'Analog scaling', description: 'Convert a 4–20 input range to 0–100 engineering units.',
    create: () => ({ version: 1, name: 'Analog scaling', blocks: [block('ANALOG_INPUT', 'sensor', 0, 60, 'Sensor · 4–20', 12), { ...block('ANALOG_AMPLIFIER', 'scale', 300, 60, 'Scale to 0–100'), params: { gain: 6.25, offset: -25 } }, block('ANALOG_OUTPUT', 'value', 600, 60, 'Engineering units')], connections: [wire('sensor', 'scale'), wire('scale', 'value')] }),
  },
];

export function getExample(id: string): CircuitDocument {
  return (EXAMPLES.find(example => example.id === id) ?? EXAMPLES[0]).create();
}
