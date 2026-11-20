import { LogicEngine } from '../LogicEngine.ts';
import type { CircuitDocument, Signal } from '../automation/types.ts';
import type { Challenge, GradeResult, ScenarioResult } from './types.ts';

const SCAN_MS = 100;

const show = (value: Signal | undefined) =>
  value === true ? 'ON' : value === false ? 'OFF' : typeof value === 'number' ? String(Number(value.toFixed(3))) : String(value);

const seconds = (ms: number) => `${Number((ms / 1000).toFixed(1))} s`;

function sameSignal(expected: Signal, actual: Signal | undefined): boolean {
  if (typeof expected === 'number' && typeof actual === 'number') return Math.abs(expected - actual) <= 1e-6 * Math.max(1, Math.abs(expected));
  return expected === actual;
}

/** Checks that the learner kept the interface blocks the grader needs. */
function checkInterface(challenge: Challenge, doc: CircuitDocument): string[] {
  const errors: string[] = [];
  for (const pin of [...challenge.inputs, ...challenge.outputs]) {
    const block = doc.blocks.find((candidate) => candidate.id === pin.id);
    if (!block) errors.push(`The "${pin.label}" block (${pin.id}) is missing. Use "Start over" to restore it.`);
    else if (block.type !== pin.type) errors.push(`"${pin.label}" (${pin.id}) must stay a ${pin.type} block.`);
  }
  return errors;
}

/**
 * Runs every scenario of a challenge against a circuit, each from a fresh start, and reports the
 * first failing expectation per scenario in plain language.
 */
export function gradeChallenge(challenge: Challenge, doc: CircuitDocument): GradeResult {
  const setupErrors = checkInterface(challenge, doc);
  if (setupErrors.length) return { passed: false, setupErrors, scenarios: [] };

  const labelOf = (id: string) => [...challenge.inputs, ...challenge.outputs].find((pin) => pin.id === id)?.label ?? id;
  const scenarios: ScenarioResult[] = [];

  for (const scenario of challenge.scenarios) {
    const engine = new LogicEngine();
    try {
      engine.load(doc);
    } catch (error) {
      return { passed: false, setupErrors: [`The circuit cannot run: ${(error as Error).message}`], scenarios: [] };
    }

    let failure: string | undefined;
    let elapsed = 0;
    const read = (id: string) => engine.blocks.get(id)?.outputs.Q;

    const checkNever = (): string | undefined => {
      for (const rule of challenge.never ?? []) {
        if (Object.entries(rule.when).every(([id, value]) => sameSignal(value, read(id)))) return `${rule.message} (at ${seconds(elapsed)})`;
      }
      return undefined;
    };

    steps: for (const [index, step] of scenario.steps.entries()) {
      for (const [id, value] of Object.entries(step.set ?? {})) engine.setInput(id, value);
      const scans = Math.round(step.waitMs / SCAN_MS);
      const watched = (step.during ?? []).map((rule) => ({ rule, on: 0, changes: 0, last: read(rule.id) }));
      for (let scan = 0; scan < scans; scan++) {
        engine.tick(SCAN_MS);
        elapsed += SCAN_MS;
        const broken = checkNever();
        if (broken) {
          failure = `During "${step.action}": ${broken}.`;
          break steps;
        }
        for (const watch of watched) {
          const value = read(watch.rule.id);
          if (value === true) watch.on++;
          if (value !== watch.last) watch.changes++;
          watch.last = value;
        }
      }
      for (const { rule, on, changes } of watched) {
        const share = scans ? on / scans : 0;
        const label = labelOf(rule.id);
        if (rule.onShare && (share < rule.onShare[0] || share > rule.onShare[1])) {
          failure = `Step ${index + 1}: during "${step.action}", ${label} was ON ${Math.round(share * 100)}% of the time; expected ${Math.round(rule.onShare[0] * 100)}–${Math.round(rule.onShare[1] * 100)}%.`;
          break steps;
        }
        if (rule.minChanges !== undefined && changes < rule.minChanges) {
          failure = `Step ${index + 1}: during "${step.action}", ${label} changed ${changes} time${changes === 1 ? '' : 's'}; expected at least ${rule.minChanges}.`;
          break steps;
        }
      }
      for (const [id, expected] of Object.entries(step.expect ?? {})) {
        const actual = read(id);
        if (!sameSignal(expected, actual)) {
          const when = step.waitMs ? `${seconds(step.waitMs)} after "${step.action}"` : `Right after "${step.action}"`;
          failure = `Step ${index + 1}: ${when}, ${labelOf(id)} should be ${show(expected)} but was ${show(actual)}.`;
          break steps;
        }
      }
    }
    scenarios.push({ name: scenario.name, passed: !failure, ...(failure ? { failure } : {}) });
  }

  return { passed: scenarios.every((result) => result.passed), setupErrors: [], scenarios };
}
