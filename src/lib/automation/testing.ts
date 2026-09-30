import { LogicEngine } from '../LogicEngine.ts';
import { BLOCK_CATALOG } from './catalog.ts';
import type { CircuitDocument, CircuitTest, Signal } from './types.ts';

export interface CircuitAssertionResult {
  /** One-based scenario step number. */
  step: number;
  blockId: string;
  pin: string;
  expected: Signal;
  actual: Signal;
  passed: boolean;
  timeMs: number;
}

export interface CircuitTestResult {
  name: string;
  passed: boolean;
  assertions: CircuitAssertionResult[];
  timeMs: number;
}

const MAX_SCANS = 100_000;

/**
 * Runs an isolated circuit from its initial state. Each step applies its inputs,
 * advances by afterMs relative to the preceding step, then checks its outputs.
 * The last scan of a step may be shorter than scanMs. A zero-duration step checks
 * the current state without advancing timers, edges, counters, or other memory.
 * Malformed scenarios throw; valid scenarios with mismatches return a failure.
 */
export function runCircuitTest(document: CircuitDocument, scenario: CircuitTest, scanMs = 100): CircuitTestResult {
  if (!Number.isFinite(scanMs) || scanMs <= 0) throw new Error('The test scan interval must be a positive finite number.');
  if (!scenario || typeof scenario.name !== 'string' || !Array.isArray(scenario.steps)) throw new Error('A scenario needs a name and an array of steps.');

  let totalScans = 0;
  let totalMs = 0;
  for (const [index, step] of scenario.steps.entries()) {
    if (!step || !Number.isFinite(step.afterMs) || step.afterMs < 0) throw new Error(`Step ${index + 1} needs a nonnegative finite duration.`);
    if (!step.inputs || typeof step.inputs !== 'object' || Array.isArray(step.inputs)) throw new Error(`Step ${index + 1} needs an input map.`);
    if (!Array.isArray(step.expect)) throw new Error(`Step ${index + 1} needs an array of expectations.`);
    totalScans += Math.ceil(step.afterMs / scanMs);
    totalMs += step.afterMs;
    if (totalScans > MAX_SCANS || !Number.isFinite(totalMs)) throw new Error(`A scenario may run at most ${MAX_SCANS} scans with a finite total duration.`);
  }

  const engine = new LogicEngine();
  engine.load(document);
  const assertions: CircuitAssertionResult[] = [];
  for (const [index, step] of scenario.steps.entries()) {
    for (const expectation of step.expect) {
      if (!expectation || typeof expectation.blockId !== 'string' || typeof expectation.pin !== 'string') throw new Error(`Step ${index + 1} contains an invalid expectation.`);
      const block = engine.blocks.get(expectation.blockId);
      if (!block) throw new Error(`Expected block "${expectation.blockId}" does not exist.`);
      const pin = BLOCK_CATALOG[block.type].outputs.find(item => item.id === expectation.pin);
      if (!pin) throw new Error(`Block "${expectation.blockId}" has no output pin "${expectation.pin}".`);
      const valid = pin.kind === 'digital' ? typeof expectation.value === 'boolean'
        : pin.kind === 'analog' ? typeof expectation.value === 'number' && Number.isFinite(expectation.value)
          : typeof expectation.value === 'string';
      if (!valid) throw new Error(`Expected value for ${expectation.blockId}.${expectation.pin} must be ${pin.kind}.`);
    }
    for (const [id, value] of Object.entries(step.inputs)) engine.setInput(id, value);

    const fullScans = Math.floor(step.afterMs / scanMs);
    for (let scan = 0; scan < fullScans; scan++) engine.tick(scanMs);
    const remainder = step.afterMs - fullScans * scanMs;
    if (remainder > 0) engine.tick(remainder);

    for (const expectation of step.expect) {
      const actual = engine.blocks.get(expectation.blockId)!.outputs[expectation.pin];
      assertions.push({
        step: index + 1, blockId: expectation.blockId, pin: expectation.pin,
        expected: expectation.value, actual, passed: actual === expectation.value, timeMs: engine.timeMs,
      });
    }
  }
  return { name: scenario.name, passed: assertions.every(assertion => assertion.passed), assertions, timeMs: engine.timeMs };
}
