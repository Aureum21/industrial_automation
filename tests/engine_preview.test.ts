import assert from 'node:assert/strict';
import test from 'node:test';
import { LogicEngine } from '../src/lib/LogicEngine.ts';
import { parseCircuitDSL } from '../src/lib/automation/dsl.ts';
import { BLOCK_CATALOG } from '../src/lib/automation/catalog.ts';

const load = (code: string) => {
  const engine = new LogicEngine();
  engine.load(parseCircuitDSL(code, BLOCK_CATALOG));
  return engine;
};

/** Mirrors the lab UI: change an input (which previews outputs), then run one scan. */
function press(engine: LogicEngine, id: string) {
  engine.setInput(id, true);
  engine.tick(100);
  engine.setInput(id, false);
  engine.tick(100);
}

test('edge blocks still fire when inputs are changed from the UI between scans', () => {
  for (const edgeBlock of ['AND_EDGE', 'R_TRIG']) {
    const engine = load(`circuit "edges" version 1 {
      a: INPUT()  hi: HIGH()  e: ${edgeBlock}()  c: COUNTER(limit=10)
      a.Q -> e.A  ${edgeBlock === 'AND_EDGE' ? 'hi.Q -> e.B' : ''}  e.Q -> c.CU
    }`);
    for (let i = 0; i < 3; i++) press(engine, 'a');
    assert.equal(engine.blocks.get('c')!.outputs.CV, 3, edgeBlock);
  }
});

test('pulse timers and toggles started from the UI behave like a real scan', () => {
  const engine = load(`circuit "pulse" version 1 {
    a: INPUT()  tp: PULSE_TIMER(duration=300)  tog: PULSE_RELAY()
    a.Q -> tp.A  a.Q -> tog.A
  }`);
  engine.setInput('a', true);
  engine.tick(100);
  assert.equal(engine.blocks.get('tp')!.outputs.Q, true);
  assert.equal(engine.blocks.get('tog')!.outputs.Q, true);
  engine.tick(100);
  engine.tick(100);
  assert.equal(engine.blocks.get('tp')!.outputs.Q, false, 'pulse ends after 300 ms of scans');
});

test('editing does not add samples to averaging blocks or advance time', () => {
  const engine = load(`circuit "avg" version 1 {
    x: ANALOG_INPUT(value=0)  avg: AVERAGE(samples=4)
    x.Q -> avg.A
  }`);
  engine.tick(100); // one real sample: 0
  for (const value of [100, 100, 100, 100, 100]) engine.setInput('x', value); // UI edits only
  engine.tick(100); // second real sample: 100
  assert.equal(engine.blocks.get('avg')!.outputs.Q, 50, 'average of the two scanned samples, not of UI edits');
  assert.equal(engine.timeMs, 200);
});

test('the preview still shows the immediate effect of an edit', () => {
  const engine = load(`circuit "latch" version 1 {
    s: INPUT()  r: INPUT()  rs: RS_LATCH()  q: OUTPUT()
    s.Q -> rs.S  r.Q -> rs.R  rs.Q -> q.A
  }`);
  engine.setInput('s', true);
  assert.equal(engine.blocks.get('q')!.outputs.Q, true, 'shown before the next scan');
});
