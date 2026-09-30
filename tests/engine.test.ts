import assert from 'node:assert/strict';
import test from 'node:test';
import { LogicEngine } from '../src/lib/LogicEngine.ts';
import { BLOCK_DEFINITIONS } from '../src/lib/automation/catalog.ts';
import type { BlockType, CircuitBlock, Signal } from '../src/lib/automation/types.ts';

function add(engine: LogicEngine, id: string, type: BlockType, overrides: Partial<CircuitBlock> = {}) {
  engine.addBlock({ id, type, position: { x: 0, y: 0 }, params: {}, ...overrides });
}

function wire(engine: LogicEngine, from: string, to: string, input = 'A', output = 'Q', id = `${from}.${output}-${to}.${input}`) {
  engine.addConnection({ id, fromBlockId: from, fromPin: output, toBlockId: to, toPin: input });
  return id;
}

function output(engine: LogicEngine, id: string, pin = 'Q'): Signal {
  return engine.blocks.get(id)!.outputs[pin];
}

test('all ready catalog blocks execute and planned blocks cannot masquerade as working blocks', () => {
  for (const definition of BLOCK_DEFINITIONS) {
    const engine = new LogicEngine();
    if (definition.status === 'ready') {
      add(engine, 'block', definition.type);
      engine.tick();
      for (const pin of definition.outputs) {
        assert.equal(typeof output(engine, 'block', pin.id), pin.kind === 'digital' ? 'boolean' : pin.kind === 'analog' ? 'number' : 'string');
      }
    } else assert.throws(() => add(engine, 'block', definition.type), /not available/);
  }
});

test('long combinational paths settle regardless of block insertion order', () => {
  const engine = new LogicEngine();
  add(engine, 'out', 'OUTPUT');
  add(engine, 'not2', 'NOT');
  add(engine, 'not1', 'NOT');
  add(engine, 'source', 'INPUT');
  wire(engine, 'source', 'not1');
  wire(engine, 'not1', 'not2');
  wire(engine, 'not2', 'out');
  engine.setInput('source', true);
  engine.tick();
  assert.equal(output(engine, 'out'), true);
  engine.setInput('source', false);
  engine.tick();
  assert.equal(output(engine, 'out'), false);
});

test('deleting an edge or block clears downstream inputs and permits reconnecting', () => {
  const engine = new LogicEngine();
  add(engine, 'high', 'HIGH');
  add(engine, 'out', 'OUTPUT');
  const connection = wire(engine, 'high', 'out');
  assert.equal(output(engine, 'out'), true);
  engine.removeConnection(connection);
  assert.equal(output(engine, 'out'), false);
  assert.equal(engine.blocks.get('out')!.inputs.A, false);
  wire(engine, 'high', 'out');
  engine.removeBlock('high');
  assert.equal(engine.connections.length, 0);
  assert.equal(output(engine, 'out'), false);
  add(engine, 'replacement', 'HIGH');
  wire(engine, 'replacement', 'out');
  assert.equal(output(engine, 'out'), true);
});

test('tag links propagate in dependency order and leave no stale value after rename or deletion', () => {
  const engine = new LogicEngine();
  add(engine, 'reader', 'INPUT', { tag: 'motor', value: false });
  add(engine, 'indicator', 'OUTPUT');
  add(engine, 'writer', 'FLAG', { tag: 'motor' });
  add(engine, 'source', 'HIGH');
  wire(engine, 'reader', 'indicator');
  wire(engine, 'source', 'writer');
  engine.tick();
  assert.equal(output(engine, 'indicator'), true);
  assert.equal(engine.blocks.get('reader')!.value, false, 'tag reads preserve the manual fallback');
  engine.setTag('writer', 'other');
  assert.equal(output(engine, 'reader'), false);
  engine.setTag('writer', 'motor');
  assert.equal(output(engine, 'reader'), true);
  engine.removeBlock('writer');
  assert.equal(output(engine, 'reader'), false);
  assert.equal(output(engine, 'indicator'), false);
});

test('duplicate tag writers and tag-created cycles are rejected atomically', () => {
  const engine = new LogicEngine();
  add(engine, 'reader', 'INPUT', { tag: 'bus' });
  add(engine, 'writer', 'OUTPUT');
  wire(engine, 'reader', 'writer');
  assert.throws(() => engine.setTag('writer', 'bus'), /feedback loop/);
  assert.equal(engine.blocks.get('writer')!.tag, undefined);
  engine.setTag('writer', 'unrelated');
  assert.throws(() => add(engine, 'duplicate', 'FLAG', { tag: 'unrelated' }), /already has a writer/);
  assert.equal(engine.blocks.has('duplicate'), false);
});

test('connection validation rejects invalid pins, mixed signal types, duplicates and multiple drivers', () => {
  const engine = new LogicEngine();
  add(engine, 'digital', 'HIGH');
  add(engine, 'analog', 'ANALOG_INPUT');
  add(engine, 'target', 'OUTPUT');
  const edge = { id: 'edge', fromBlockId: 'digital', fromPin: 'Q', toBlockId: 'target', toPin: 'A' };
  assert.match(engine.validateConnection({ ...edge, fromPin: 'missing' })!, /Unknown output/);
  assert.match(engine.validateConnection({ ...edge, toPin: 'missing' })!, /Unknown input/);
  assert.match(engine.validateConnection({ ...edge, fromBlockId: 'missing' })!, /Both blocks/);
  assert.match(engine.validateConnection({ ...edge, fromBlockId: 'analog' })!, /analog output to a digital input/);
  engine.addConnection(edge);
  assert.match(engine.validateConnection(edge)!, /ID already exists/);
  assert.match(engine.validateConnection({ ...edge, id: 'second' })!, /already has a connection/);
  assert.equal(engine.connections.length, 1);
});

test('on-delay uses elapsed simulation time, resets on false and resets all runtime memory', () => {
  const engine = new LogicEngine();
  add(engine, 'input', 'INPUT', { value: true });
  add(engine, 'timer', 'TON', { params: { duration: 300 } });
  add(engine, 'out', 'OUTPUT');
  wire(engine, 'input', 'timer');
  wire(engine, 'timer', 'out');
  engine.tick(100);
  assert.equal(output(engine, 'timer', 'ET'), 100);
  assert.equal(output(engine, 'out'), false);
  engine.setInput('input', true);
  assert.equal(output(engine, 'timer', 'ET'), 100, 'editing while paused does not advance time');
  engine.tick(200);
  assert.equal(output(engine, 'out'), true);
  assert.equal(engine.timeMs, 300);
  engine.setInput('input', false);
  engine.tick(100);
  assert.equal(output(engine, 'timer', 'ET'), 0);
  assert.equal(output(engine, 'timer'), false);
  engine.setInput('input', true);
  engine.tick(300);
  engine.reset();
  assert.equal(engine.timeMs, 0);
  assert.equal(output(engine, 'timer', 'ET'), 0);
  assert.equal(output(engine, 'out'), false);
  assert.equal(output(engine, 'input'), true, 'reset preserves configured manual inputs');
  engine.tick(100);
  assert.equal(output(engine, 'timer', 'ET'), 100);
});

test('off-delay holds for the configured interval and handles retriggering', () => {
  const engine = new LogicEngine();
  add(engine, 'input', 'INPUT');
  add(engine, 'timer', 'TOF', { params: { duration: 200 } });
  wire(engine, 'input', 'timer');
  engine.tick();
  assert.equal(output(engine, 'timer'), false);
  engine.setInput('input', true);
  engine.tick();
  assert.equal(output(engine, 'timer'), true);
  engine.setInput('input', false);
  engine.tick();
  assert.equal(output(engine, 'timer'), true);
  assert.equal(output(engine, 'timer', 'ET'), 100);
  engine.setInput('input', true);
  engine.tick();
  assert.equal(output(engine, 'timer', 'ET'), 0);
  engine.setInput('input', false);
  engine.tick(200);
  assert.equal(output(engine, 'timer'), false);
  engine.reset();
  engine.tick();
  assert.equal(output(engine, 'timer'), false);
});

test('clock supports uneven and large steps and deterministic reset', () => {
  const engine = new LogicEngine();
  add(engine, 'clock', 'CLOCK', { params: { onTime: 200, offTime: 100 } });
  engine.tick(99);
  assert.equal(output(engine, 'clock'), false);
  engine.tick(1);
  assert.equal(output(engine, 'clock'), true);
  engine.tick(800);
  assert.equal(output(engine, 'clock'), false);
  engine.reset();
  assert.equal(output(engine, 'clock'), false);
  engine.tick(100);
  assert.equal(output(engine, 'clock'), true);
  assert.throws(() => engine.tick(0), /positive finite/);
  assert.throws(() => engine.tick(Number.NaN), /positive finite/);
});

test('stateful edges run once per scan even when connected to a downstream counter', () => {
  const engine = new LogicEngine();
  add(engine, 'counter', 'COUNTER', { params: { limit: 2 } });
  add(engine, 'trigger', 'R_TRIG');
  add(engine, 'input', 'INPUT');
  wire(engine, 'input', 'trigger');
  wire(engine, 'trigger', 'counter', 'CU');
  engine.setInput('input', true);
  engine.tick();
  assert.equal(output(engine, 'trigger'), true);
  assert.equal(output(engine, 'counter', 'CV'), 1);
  engine.tick();
  assert.equal(output(engine, 'trigger'), false);
  assert.equal(output(engine, 'counter', 'CV'), 1);
  engine.setInput('input', false);
  engine.tick();
  engine.setInput('input', true);
  engine.tick();
  assert.equal(output(engine, 'counter', 'CV'), 2);
  assert.equal(output(engine, 'counter'), true);
  engine.reset();
  assert.equal(output(engine, 'counter', 'CV'), 0);
  engine.tick();
  assert.equal(output(engine, 'counter', 'CV'), 1);
});

test('reset dominates simultaneous counter edges and latch inputs', () => {
  const engine = new LogicEngine();
  add(engine, 'high', 'HIGH');
  add(engine, 'counter', 'COUNTER');
  add(engine, 'latch', 'RS_LATCH');
  wire(engine, 'high', 'counter', 'CU');
  wire(engine, 'high', 'counter', 'R');
  wire(engine, 'high', 'latch', 'S');
  wire(engine, 'high', 'latch', 'R');
  engine.tick();
  assert.equal(output(engine, 'counter', 'CV'), 0);
  assert.equal(output(engine, 'latch'), false);
  engine.removeConnection('high.Q-latch.R');
  engine.tick();
  assert.equal(output(engine, 'latch'), true);
});

test('analog paths remain numeric, support typed tags and report division errors', () => {
  const engine = new LogicEngine();
  add(engine, 'input', 'ANALOG_INPUT', { params: { value: 3.5 } });
  add(engine, 'gain', 'ANALOG_AMPLIFIER', { params: { gain: 2, offset: 1 } });
  add(engine, 'writer', 'ANALOG_FLAG', { tag: 'pressure' });
  add(engine, 'reader', 'ANALOG_INPUT', { tag: 'pressure' });
  add(engine, 'threshold', 'ANALOG_THRESHOLD', { params: { threshold: 8 } });
  add(engine, 'math', 'MATH', { params: { operation: 'divide' } });
  wire(engine, 'input', 'gain');
  wire(engine, 'gain', 'writer');
  wire(engine, 'reader', 'threshold');
  wire(engine, 'reader', 'math');
  engine.tick();
  assert.equal(output(engine, 'reader'), 8);
  assert.equal(output(engine, 'threshold'), true);
  assert.equal(output(engine, 'math'), 0);
  assert.match(engine.diagnostics.join(' '), /division by zero/);
  engine.setInput('input', -2.5);
  engine.tick();
  assert.equal(output(engine, 'reader'), -4);
  assert.equal(output(engine, 'threshold'), false);
  engine.removeBlock('writer');
  assert.equal(output(engine, 'reader'), 0);
  assert.throws(() => engine.setInput('input', true), /analog/);
  assert.throws(() => engine.setInput('input', Number.POSITIVE_INFINITY), /finite/);
  assert.throws(() => engine.setParam('gain', 'gain', Number.NaN), /finite/);
  assert.throws(() => engine.setParam('math', 'operation', 'unsupported'), /Invalid choice/);
});

test('analog multiplexer, comparison and conversion compose correctly', () => {
  const engine = new LogicEngine();
  add(engine, 'a', 'ANALOG_INPUT', { value: -3.75 });
  add(engine, 'b', 'ANALOG_CONSTANT', { params: { value: 12.8 } });
  add(engine, 'select', 'INPUT');
  add(engine, 'mux', 'ANALOG_MUX');
  add(engine, 'int', 'FLOAT_TO_INT');
  add(engine, 'float', 'INT_TO_FLOAT');
  add(engine, 'compare', 'ANALOG_COMPARATOR', { params: { operation: 'lt' } });
  wire(engine, 'a', 'mux', 'A');
  wire(engine, 'b', 'mux', 'B');
  wire(engine, 'select', 'mux', 'S');
  wire(engine, 'mux', 'int');
  wire(engine, 'int', 'float');
  wire(engine, 'float', 'compare');
  engine.tick();
  assert.equal(output(engine, 'float'), -3);
  assert.equal(output(engine, 'compare'), true);
  engine.setInput('select', true);
  engine.tick();
  assert.equal(output(engine, 'float'), 12);
  assert.equal(output(engine, 'compare'), false);
});

test('feedback is rejected unless it passes through an explicit scan delay', () => {
  const engine = new LogicEngine();
  add(engine, 'not', 'NOT');
  assert.throws(() => wire(engine, 'not', 'not'), /feedback loop/);
  add(engine, 'delay', 'SCAN_DELAY');
  wire(engine, 'not', 'delay');
  wire(engine, 'delay', 'not');
  engine.tick();
  assert.equal(output(engine, 'delay'), false);
  assert.equal(output(engine, 'not'), true);
  engine.tick();
  assert.equal(output(engine, 'delay'), true);
  assert.equal(output(engine, 'not'), false);
  engine.tick();
  assert.equal(output(engine, 'delay'), false);
  engine.reset();
  engine.tick();
  assert.equal(output(engine, 'delay'), false);
});

test('document round trips omit runtime memory and failed imports are atomic', () => {
  const engine = new LogicEngine();
  add(engine, 'input', 'INPUT', { value: true, position: { x: 100, y: 20 } });
  add(engine, 'timer', 'TON', { params: { duration: 200 } });
  wire(engine, 'input', 'timer');
  engine.tick(200);
  const document = engine.toDocument('Example');
  assert.equal('state' in document.blocks[1], false);
  const restored = new LogicEngine();
  restored.load(document);
  assert.deepEqual(restored.toDocument('Example'), document);
  assert.equal(restored.timeMs, 0);
  assert.equal(output(restored, 'timer'), false);
  restored.tick(200);
  assert.equal(output(restored, 'timer'), true);
  document.blocks[0].position.x = 999;
  assert.equal(engine.blocks.get('input')!.position.x, 100);
  const before = engine.toDocument();
  assert.throws(() => engine.load({ ...before, connections: [{ id: 'invalid', fromBlockId: 'missing', fromPin: 'Q', toBlockId: 'timer', toPin: 'A' }] }), /Both blocks/);
  assert.deepEqual(engine.toDocument(), before);
  assert.equal(engine.timeMs, 200);
});
