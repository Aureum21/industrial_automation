import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLadder, conducts, type LadderNode } from '../src/lib/automation/ladder.ts';
import { LogicEngine } from '../src/lib/LogicEngine.ts';
import { EXAMPLES } from '../src/lib/automation/examples.ts';
import type { CircuitDocument } from '../src/lib/automation/types.ts';

function shape(node: LadderNode): string {
  switch (node.kind) {
    case 'contact': return `${node.negated ? '/' : ''}${node.label}`;
    case 'series': return `(${node.items.map(shape).join(' ')})`;
    case 'parallel': return `[${node.branches.map(shape).join(' | ')}]`;
    case 'open': return 'OPEN';
  }
}

const doc = (blocks: CircuitDocument['blocks'], wires: [string, string, string, string][]): CircuitDocument => ({
  version: 1, name: 't', blocks,
  connections: wires.map(([f, fp, t, tp], i) => ({ id: `w${i}`, fromBlockId: f, fromPin: fp, toBlockId: t, toPin: tp })),
});
const b = (id: string, type: string, label = id) => ({ id, type: type as never, position: { x: 0, y: 0 }, label, params: {} });

test('gates fold into series, parallel and normally closed contacts', () => {
  const circuit = doc(
    [b('s', 'INPUT', 'Start'), b('g', 'INPUT', 'Guard'), b('x', 'INPUT', 'Stop'), b('and', 'AND'), b('not', 'NOT'), b('nand', 'NAND'), b('m', 'OUTPUT', 'Motor')],
    [['s', 'Q', 'and', 'A'], ['g', 'Q', 'and', 'B'], ['x', 'Q', 'not', 'A'], ['and', 'Q', 'nand', 'A'], ['not', 'Q', 'nand', 'B'], ['nand', 'Q', 'm', 'A']],
  );
  const [rung] = buildLadder(circuit);
  assert.equal(rung.kind, 'coil');
  // NAND(AND(s,g), NOT x) = NOT s OR NOT g OR x
  assert.equal(shape(rung.inputs[0].logic!), '[/Start | /Guard | Stop]');
});

test('unwired inputs are open and non-gate blocks become boxes referenced by contacts', () => {
  const circuit = doc([b('i', 'INPUT', 'Switch'), b('t', 'TON', 'Delay'), b('o', 'OUTPUT', 'Fan'), b('o2', 'OUTPUT', 'Idle')], [['i', 'Q', 't', 'A'], ['t', 'Q', 'o', 'A']]);
  const rungs = buildLadder(circuit);
  assert.deepEqual(rungs.map((r) => `${r.kind}:${r.label}`), ['box:Delay', 'coil:Fan', 'coil:Idle']);
  assert.equal(shape(rungs[1].inputs[0].logic!), 'Delay');
  assert.equal(rungs[2].inputs[0].logic!.kind, 'open');
});

test('ladder power flow matches the simulator for every example circuit', () => {
  for (const example of EXAMPLES) {
    const circuit = example.create();
    const engine = new LogicEngine();
    engine.load(circuit);
    const inputs = circuit.blocks.filter((block) => block.type === 'INPUT');
    for (let step = 0; step < 40; step++) {
      inputs.forEach((input, index) => { if ((step >> index) % 3 === 0) engine.setInput(input.id, step % (index + 2) === 0); });
      engine.tick(100);
      const read = (ref: { blockId: string; pin: string }) => engine.blocks.get(ref.blockId)?.outputs[ref.pin];
      for (const rung of buildLadder(engine.toDocument())) {
        if (rung.type === 'SCAN_DELAY') continue; // reads last scan's value by design
        for (const input of rung.inputs) {
          if (!input.logic) continue;
          // The rung line must carry exactly the value the block saw on that pin this scan.
          const expected = Boolean(engine.blocks.get(rung.blockId)!.inputs[input.pin]);
          assert.equal(conducts(input.logic, read), expected, `${example.id} ${rung.label}.${input.pin} at step ${step}`);
        }
      }
    }
  }
});
