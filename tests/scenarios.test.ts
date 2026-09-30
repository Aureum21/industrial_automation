import assert from 'node:assert/strict';
import test from 'node:test';
import { LogicEngine } from '../src/lib/LogicEngine.ts';
import { runCircuitTest } from '../src/lib/automation/testing.ts';
import type { CircuitDocument, CircuitTest } from '../src/lib/automation/types.ts';

const timerCircuit: CircuitDocument = {
  version: 1, name: 'On-delay example',
  blocks: [
    { id: 'start', type: 'INPUT', position: { x: 0, y: 0 }, params: {} },
    { id: 'delay', type: 'TON', position: { x: 200, y: 0 }, params: { duration: 250 } },
  ],
  connections: [{ id: 'start-delay', fromBlockId: 'start', fromPin: 'Q', toBlockId: 'delay', toPin: 'A' }],
};

const timerScenario: CircuitTest = {
  name: 'Starts at exactly 250 ms and resets on false',
  steps: [
    { inputs: { start: true }, afterMs: 150, expect: [{ blockId: 'delay', pin: 'Q', value: false }, { blockId: 'delay', pin: 'ET', value: 150 }] },
    { inputs: {}, afterMs: 100, expect: [{ blockId: 'delay', pin: 'Q', value: true }, { blockId: 'delay', pin: 'ET', value: 250 }] },
    { inputs: { start: false }, afterMs: 100, expect: [{ blockId: 'delay', pin: 'Q', value: false }, { blockId: 'delay', pin: 'ET', value: 0 }] },
  ],
};

test('temporal scenarios report exact relative timing including partial scans', () => {
  const result = runCircuitTest(timerCircuit, timerScenario);
  assert.equal(result.passed, true);
  assert.equal(result.name, timerScenario.name);
  assert.equal(result.timeMs, 350);
  assert.equal(result.assertions.length, 6);
  assert.deepEqual(result.assertions[2], {
    step: 2, blockId: 'delay', pin: 'Q', expected: true, actual: true, passed: true, timeMs: 250,
  });
  assert.deepEqual(runCircuitTest(timerCircuit, timerScenario), result, 'each run starts fresh and is deterministic');
});

test('assertion mismatches return detailed failure results and continue through later steps', () => {
  const scenario = structuredClone(timerScenario);
  scenario.steps[0].expect[0].value = true;
  const result = runCircuitTest(timerCircuit, scenario);
  assert.equal(result.passed, false);
  assert.deepEqual(result.assertions[0], {
    step: 1, blockId: 'delay', pin: 'Q', expected: true, actual: false, passed: false, timeMs: 150,
  });
  assert.equal(result.assertions[5].passed, true);
  assert.equal(result.timeMs, 350);
});

test('scenario execution preserves its document, scenario and a separately running engine', () => {
  const engine = new LogicEngine();
  engine.load(timerCircuit);
  engine.setInput('start', true);
  engine.tick(100);
  const document = engine.toDocument('Live circuit');
  const originalDocument = structuredClone(document);
  const originalScenario = structuredClone(timerScenario);
  const state = structuredClone([...engine.blocks]);
  runCircuitTest(document, timerScenario);
  assert.deepEqual(document, originalDocument);
  assert.deepEqual(timerScenario, originalScenario);
  assert.deepEqual([...engine.blocks], state);
  assert.equal(engine.timeMs, 100);
});

test('zero elapsed time can inspect input changes without advancing timer memory', () => {
  const result = runCircuitTest(timerCircuit, {
    name: 'Paused input change',
    steps: [{ inputs: { start: true }, afterMs: 0, expect: [
      { blockId: 'start', pin: 'Q', value: true },
      { blockId: 'delay', pin: 'ET', value: 0 },
    ] }],
  });
  assert.equal(result.passed, true);
  assert.equal(result.timeMs, 0);
});

test('unknown input blocks, invalid input values and invalid output expectations throw', () => {
  const base = { name: 'Invalid scenario', steps: [{ inputs: {}, afterMs: 0, expect: [] }] } satisfies CircuitTest;
  assert.throws(() => runCircuitTest(timerCircuit, { ...base, steps: [{ ...base.steps[0], inputs: { missing: true } }] }), /does not exist/);
  assert.throws(() => runCircuitTest(timerCircuit, { ...base, steps: [{ ...base.steps[0], inputs: { start: 12 } }] }), /digital/);
  assert.throws(() => runCircuitTest(timerCircuit, { ...base, steps: [{ ...base.steps[0], inputs: { delay: true } }] }), /Only input/);
  assert.throws(() => runCircuitTest(timerCircuit, { ...base, steps: [{ ...base.steps[0], expect: [{ blockId: 'missing', pin: 'Q', value: true }] }] }), /does not exist/);
  assert.throws(() => runCircuitTest(timerCircuit, { ...base, steps: [{ ...base.steps[0], expect: [{ blockId: 'delay', pin: 'missing', value: true }] }] }), /no output pin/);
  assert.throws(() => runCircuitTest(timerCircuit, { ...base, steps: [{ ...base.steps[0], expect: [{ blockId: 'delay', pin: 'ET', value: true }] }] }), /must be analog/);
  assert.throws(() => runCircuitTest(timerCircuit, { ...base, steps: [{ ...base.steps[0], expect: [{ blockId: 'delay', pin: 'ET', value: Number.NaN }] }] }), /must be analog/);
});

test('invalid durations, scan intervals and excessive total scans fail before execution', () => {
  for (const scanMs of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => runCircuitTest(timerCircuit, timerScenario, scanMs), /positive finite/);
  }
  for (const afterMs of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => runCircuitTest(timerCircuit, { name: 'Bad duration', steps: [{ inputs: {}, afterMs, expect: [] }] }), /nonnegative finite/);
  }
  assert.throws(() => runCircuitTest(timerCircuit, {
    name: 'Too many scans', steps: [
      { inputs: {}, afterMs: 5_000_001, expect: [] },
      { inputs: {}, afterMs: 5_000_001, expect: [] },
    ],
  }), /at most 100000 scans/);
  assert.throws(() => runCircuitTest(timerCircuit, timerScenario, Number.MIN_VALUE), /at most 100000 scans/);
});
