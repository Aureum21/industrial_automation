import assert from 'node:assert/strict';
import test from 'node:test';
import { HOW_TOS } from '../src/lib/howto/catalog.ts';
import { gradeChallenge } from '../src/lib/challenges/grader.ts';
import { parseCircuitDSL } from '../src/lib/automation/dsl.ts';
import { BLOCK_CATALOG } from '../src/lib/automation/catalog.ts';
import { CHALLENGES } from '../src/lib/challenges/catalog.ts';
import { analyzeArduinoExport, autoAssignPins } from '../src/lib/codegen/arduinoGenerator.ts';
import type { Challenge } from '../src/lib/challenges/types.ts';

const asChallenge = (guide: (typeof HOW_TOS)[number]): Challenge => ({
  slug: guide.slug, title: guide.title, level: guide.level, summary: guide.answer, brief: '', requirements: [], hints: [],
  starter: guide.circuit, inputs: guide.inputs, outputs: guide.outputs, scenarios: guide.scenarios, never: guide.never, concepts: [],
});

for (const guide of HOW_TOS) {
  test(`how-to "${guide.slug}": the circuit passes every scenario`, () => {
    const doc = parseCircuitDSL(guide.circuit, BLOCK_CATALOG);
    const result = gradeChallenge(asChallenge(guide), doc);
    assert.deepEqual(result.setupErrors, []);
    for (const scenario of result.scenarios) assert.ok(scenario.passed, `${scenario.name}: ${scenario.failure}`);
  });

  test(`how-to "${guide.slug}": exports to Arduino and has valid metadata`, () => {
    const doc = parseCircuitDSL(guide.circuit, BLOCK_CATALOG);
    assert.deepEqual(analyzeArduinoExport(doc, { pinAssignments: autoAssignPins(doc, 'uno') }), []);
    assert.match(guide.slug, /^[a-z0-9-]+$/);
    assert.ok(guide.description.length <= 160, `description is ${guide.description.length} chars`);
    for (const type of guide.blocks) assert.equal(BLOCK_CATALOG[type]?.status, 'ready', `block ${type}`);
    for (const slug of guide.challenges ?? []) assert.ok(CHALLENGES.some((c) => c.slug === slug), `challenge ${slug}`);
  });
}

test('how-to slugs are unique', () => {
  assert.equal(new Set(HOW_TOS.map((guide) => guide.slug)).size, HOW_TOS.length);
});

/**
 * Mutation check: removing any single wire must make at least one scenario fail, so every wire
 * corresponds to a tested requirement. The exceptions are deliberate defence-in-depth wiring
 * whose effect is already guaranteed by another path.
 */
const REDUNDANT_BY_DESIGN = new Set([
  'plc-program-car-wash t4.Q->n4.A', // the finished cycle also resets the latch
  'tank-level-control-pump-hysteresis hh.Q->notHH.A', // high-high trip backs up the 80 % stop
  'sequential-conveyor-start-stop fault3.Q->stopOrFault.B', // the trip latch already stops the line
  'plc-program-two-floor-elevator floor2.Q->notAt2.A', // reset-dominant latch already ignores it
  'plc-program-two-floor-elevator floor1.Q->notAt1.A',
  'motor-fail-to-start-feedback-alarm fault.Q->healthy.A', // the run latch drops one scan later anyway
  'plc-program-washing-machine spinTime.Q->notSpun.A', // the finished cycle also stops the spin
  'emergency-stop-reset-plc-program estop.Q->released.A', // reset-dominant latch already refuses it
  'conveyor-jam-detection-plc jam.Q->noJam.A', // the run latch drops one scan later anyway
]);

test('every wire in every how-to circuit is covered by a scenario', () => {
  const untested: string[] = [];
  for (const guide of HOW_TOS) {
    const doc = parseCircuitDSL(guide.circuit, BLOCK_CATALOG);
    for (const wire of doc.connections) {
      const key = `${guide.slug} ${wire.fromBlockId}.${wire.fromPin}->${wire.toBlockId}.${wire.toPin}`;
      if (REDUNDANT_BY_DESIGN.has(key)) continue;
      const result = gradeChallenge(asChallenge(guide), { ...doc, connections: doc.connections.filter((other) => other !== wire) });
      if (result.passed) untested.push(key);
    }
  }
  assert.deepEqual(untested, []);
});
