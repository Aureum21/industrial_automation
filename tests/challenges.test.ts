import assert from 'node:assert/strict';
import test from 'node:test';
import { CHALLENGES } from '../src/lib/challenges/catalog.ts';
import { gradeChallenge } from '../src/lib/challenges/grader.ts';
import { parseCircuitDSL } from '../src/lib/automation/dsl.ts';
import { BLOCK_CATALOG } from '../src/lib/automation/catalog.ts';

const parse = (code: string) => parseCircuitDSL(code, BLOCK_CATALOG);

/** Reference solutions. Kept out of the app bundle; they prove every challenge is solvable. */
const SOLUTIONS: Record<string, string> = {
  'light-switch': `circuit "s" version 1 {
    switch: INPUT()  lamp: OUTPUT()
    switch.Q -> lamp.A
  }`,
  'two-hand-start': `circuit "s" version 1 {
    left: INPUT()  right: INPUT()  both: AND()  stroke: OUTPUT()
    left.Q -> both.A  right.Q -> both.B  both.Q -> stroke.A
  }`,
  'door-alarm': `circuit "s" version 1 {
    doorA: INPUT()  doorB: INPUT()  any: OR()  alarm: OUTPUT()
    doorA.Q -> any.A  doorB.Q -> any.B  any.Q -> alarm.A
  }`,
  'empty-hopper': `circuit "s" version 1 {
    product: INPUT()  inv: NOT()  refill: OUTPUT()
    product.Q -> inv.A  inv.Q -> refill.A
  }`,
  'start-stop': `circuit "s" version 1 {
    start: INPUT()  stop: INPUT()  mem: RS_LATCH()  motor: OUTPUT()
    start.Q -> mem.S  stop.Q -> mem.R  mem.Q -> motor.A
  }`,
  'delayed-fan': `circuit "s" version 1 {
    switch: INPUT()  delay: TON(duration=3000)  fan: OUTPUT()
    switch.Q -> delay.A  delay.Q -> fan.A
  }`,
  'stairwell-light': `circuit "s" version 1 {
    button: INPUT()  hold: TOF(duration=5000)  light: OUTPUT()
    button.Q -> hold.A  hold.Q -> light.A
  }`,
  'batch-counter': `circuit "s" version 1 {
    eye: INPUT()  reset: INPUT()  count: COUNTER(limit=5)  full: OUTPUT()
    eye.Q -> count.CU  reset.Q -> count.R  count.Q -> full.A
  }`,
  'tank-level': `circuit "s" version 1 {
    level: ANALOG_INPUT(value=50)  band: ANALOG_DIFFERENTIAL(onThreshold=20, offThreshold=80)  pump: OUTPUT()
    level.Q -> band.A  band.Q -> pump.A
  }`,
  'one-shot-valve': `circuit "s" version 1 {
    button: INPUT()  dose: PULSE_TIMER(duration=1000)  valve: OUTPUT()
    button.Q -> dose.A  dose.Q -> valve.A
  }`,
  'guarded-machine': `circuit "s" version 1 {
    start: INPUT()  stop: INPUT()  guard: INPUT(value=true)
    permit: AND()  open: NOT()  trip: OR()  mem: RS_LATCH()  motor: OUTPUT()
    start.Q -> permit.A  guard.Q -> permit.B  guard.Q -> open.A
    stop.Q -> trip.A  open.Q -> trip.B
    permit.Q -> mem.S  trip.Q -> mem.R  mem.Q -> motor.A
  }`,
  'flashing-beacon': `circuit "s" version 1 {
    fault: INPUT()  clock: CLOCK(onTime=500, offTime=500)  gate: AND()  beacon: OUTPUT()
    fault.Q -> gate.A  clock.Q -> gate.B  gate.Q -> beacon.A
  }`,
  'sensor-scaling': `circuit "s" version 1 {
    current: ANALOG_INPUT(value=4)  scale: ANALOG_AMPLIFIER(gain=6.25, offset=-25)  high: ANALOG_THRESHOLD(threshold=80)
    percent: ANALOG_OUTPUT()  alarm: OUTPUT()
    current.Q -> scale.A  scale.Q -> percent.A  scale.Q -> high.A  high.Q -> alarm.A
  }`,
  'star-delta': `circuit "s" version 1 {
    start: INPUT()  stop: INPUT()  run: RS_LATCH()  transfer: TON(duration=3000)  notDone: NOT()
    starGate: AND()  deltaGate: AND()  star: OUTPUT()  delta: OUTPUT()
    start.Q -> run.S  stop.Q -> run.R  run.Q -> transfer.A  transfer.Q -> notDone.A
    run.Q -> starGate.A  notDone.Q -> starGate.B  run.Q -> deltaGate.A  transfer.Q -> deltaGate.B
    starGate.Q -> star.A  deltaGate.Q -> delta.A
  }`,
};

/** Plausible wrong answers that the grader must reject, with the reason we expect to see. */
const WRONG: { slug: string; code: string; reason: RegExp }[] = [
  {
    slug: 'start-stop',
    reason: /Release Start.*Motor should be ON but was OFF/,
    code: `circuit "w" version 1 { start: INPUT()  stop: INPUT()  motor: OUTPUT()  start.Q -> motor.A }`,
  },
  {
    slug: 'delayed-fan',
    reason: /Fan should be OFF but was ON/,
    code: `circuit "w" version 1 { switch: INPUT()  fan: OUTPUT()  switch.Q -> fan.A }`,
  },
  {
    slug: 'batch-counter',
    reason: /Box full should be OFF but was ON/,
    code: `circuit "w" version 1 { eye: INPUT()  reset: INPUT()  count: COUNTER(limit=4)  full: OUTPUT()  eye.Q -> count.CU  reset.Q -> count.R  count.Q -> full.A }`,
  },
  {
    slug: 'tank-level',
    reason: /Filling: 50 %.*Fill pump should be ON but was OFF/,
    code: `circuit "w" version 1 { level: ANALOG_INPUT(value=50)  low: ANALOG_COMPARATOR(operation="lte")  limit: ANALOG_CONSTANT(value=20)  pump: OUTPUT()  level.Q -> low.A  limit.Q -> low.B  low.Q -> pump.A }`,
  },
  {
    slug: 'guarded-machine',
    reason: /Close the guard.*Machine motor should be OFF but was ON/,
    code: `circuit "w" version 1 { start: INPUT()  stop: INPUT()  guard: INPUT(value=true)  mem: RS_LATCH()  gate: AND()  motor: OUTPUT()
      start.Q -> mem.S  stop.Q -> mem.R  mem.Q -> gate.A  guard.Q -> gate.B  gate.Q -> motor.A }`,
  },
  {
    slug: 'flashing-beacon',
    reason: /Beacon changed \d+ times?; expected at least 6/,
    code: `circuit "w" version 1 { fault: INPUT()  clock: CLOCK()  gate: AND()  beacon: OUTPUT()  fault.Q -> gate.A  clock.Q -> gate.B  gate.Q -> beacon.A }`,
  },
  {
    slug: 'star-delta',
    reason: /Star and delta were on together/,
    code: `circuit "w" version 1 { start: INPUT()  stop: INPUT()  run: RS_LATCH()  t: TON(duration=3000)  star: OUTPUT()  delta: OUTPUT()
      start.Q -> run.S  stop.Q -> run.R  run.Q -> t.A  run.Q -> star.A  t.Q -> delta.A }`,
  },
  {
    slug: 'one-shot-valve',
    reason: /Press again while dosing.*|Release.*Dosing valve should be OFF but was ON/,
    code: `circuit "w" version 1 { button: INPUT()  edge: R_TRIG()  hold: TOF(duration=1000)  valve: OUTPUT()  button.Q -> edge.A  edge.Q -> hold.A  hold.Q -> valve.A }`,
  },
];

test('catalog is well formed', () => {
  const slugs = CHALLENGES.map((challenge) => challenge.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'unique slugs');
  for (const challenge of CHALLENGES) {
    assert.match(challenge.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    const starter = parse(challenge.starter);
    for (const pin of [...challenge.inputs, ...challenge.outputs]) {
      const block = starter.blocks.find((candidate) => candidate.id === pin.id);
      assert.ok(block, `${challenge.slug}: starter has ${pin.id}`);
      assert.equal(block.type, pin.type, `${challenge.slug}: ${pin.id} type`);
      assert.equal(block.label, pin.label, `${challenge.slug}: ${pin.id} label matches`);
    }
    for (const scenario of challenge.scenarios) {
      for (const step of scenario.steps) {
        assert.equal(step.waitMs % 100, 0, `${challenge.slug}: waits are whole scans`);
        for (const id of Object.keys(step.set ?? {})) assert.ok(challenge.inputs.some((pin) => pin.id === id), `${challenge.slug}: sets interface input ${id}`);
        for (const id of Object.keys(step.expect ?? {})) assert.ok(challenge.outputs.some((pin) => pin.id === id), `${challenge.slug}: expects interface output ${id}`);
      }
    }
    assert.ok(SOLUTIONS[challenge.slug], `${challenge.slug} has a reference solution`);
  }
});

test('every reference solution passes', () => {
  for (const challenge of CHALLENGES) {
    const result = gradeChallenge(challenge, parse(SOLUTIONS[challenge.slug]));
    const failures = [...result.setupErrors, ...result.scenarios.filter((s) => !s.passed).map((s) => `${s.name}: ${s.failure}`)];
    assert.ok(result.passed, `${challenge.slug}:\n  ${failures.join('\n  ')}`);
  }
});

test('the untouched starter never passes', () => {
  for (const challenge of CHALLENGES) {
    assert.equal(gradeChallenge(challenge, parse(challenge.starter)).passed, false, challenge.slug);
  }
});

test('plausible wrong answers are rejected with a helpful message', () => {
  for (const wrong of WRONG) {
    const challenge = CHALLENGES.find((candidate) => candidate.slug === wrong.slug)!;
    const result = gradeChallenge(challenge, parse(wrong.code));
    assert.equal(result.passed, false, wrong.slug);
    const messages = result.scenarios.map((scenario) => scenario.failure ?? '').join('\n');
    assert.match(messages, wrong.reason, `${wrong.slug}:\n${messages}`);
  }
});

test('missing or replaced interface blocks are reported before running', () => {
  const challenge = CHALLENGES.find((candidate) => candidate.slug === 'start-stop')!;
  const missing = gradeChallenge(challenge, parse(`circuit "x" version 1 { start: INPUT()  motor: OUTPUT() }`));
  assert.equal(missing.passed, false);
  assert.match(missing.setupErrors.join('\n'), /"Stop button" block \(stop\) is missing/);
  const replaced = gradeChallenge(challenge, parse(`circuit "x" version 1 { start: INPUT()  stop: NC_INPUT()  motor: OUTPUT() }`));
  assert.match(replaced.setupErrors.join('\n'), /must stay a INPUT block/);
});

test('alternative correct designs are accepted (not just the reference)', () => {
  const startStop = CHALLENGES.find((candidate) => candidate.slug === 'start-stop')!;
  // Classic seal-in rung: run = (start OR run_prev) AND NOT stop, with an explicit scan delay.
  const sealIn = `circuit "seal" version 1 {
    start: INPUT()  stop: INPUT()  seal: OR()  notStop: NOT()  run: AND()  prev: SCAN_DELAY()  motor: OUTPUT()
    start.Q -> seal.A  prev.Q -> seal.B  stop.Q -> notStop.A  seal.Q -> run.A  notStop.Q -> run.B  run.Q -> prev.A  run.Q -> motor.A
  }`;
  assert.equal(gradeChallenge(startStop, parse(sealIn)).passed, true);

  const tank = CHALLENGES.find((candidate) => candidate.slug === 'tank-level')!;
  const comparators = `circuit "cmp" version 1 {
    level: ANALOG_INPUT(value=50)  lo: ANALOG_CONSTANT(value=20)  hi: ANALOG_CONSTANT(value=80)
    isLow: ANALOG_COMPARATOR(operation="lte")  isHigh: ANALOG_COMPARATOR(operation="gte")  mem: RS_LATCH()  pump: OUTPUT()
    level.Q -> isLow.A  lo.Q -> isLow.B  level.Q -> isHigh.A  hi.Q -> isHigh.B  isLow.Q -> mem.S  isHigh.Q -> mem.R  mem.Q -> pump.A
  }`;
  assert.equal(gradeChallenge(tank, parse(comparators)).passed, true);
});
