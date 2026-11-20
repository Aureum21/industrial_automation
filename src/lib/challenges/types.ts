import type { BlockType, Signal } from '../automation/types.ts';

/**
 * An auto-graded exercise. The starter circuit contains the fixed interface blocks (inputs the
 * grader drives and outputs it checks); the learner adds the logic in between.
 */
export interface Challenge {
  slug: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  /** One sentence for listings. */
  summary: string;
  /** Markdown problem statement. */
  brief: string;
  requirements: string[];
  hints: string[];
  /** Circuit DSL with the interface blocks (and nothing that gives the answer away). */
  starter: string;
  /** Interface blocks the grader uses. IDs must exist in the starter with these types. */
  inputs: InterfacePin[];
  outputs: InterfacePin[];
  scenarios: Scenario[];
  /** Conditions that must never happen on any scan of any scenario. */
  never?: { when: Record<string, Signal>; message: string }[];
  /** Concepts practised, shown as tags. */
  concepts: string[];
}

export interface InterfacePin {
  id: string;
  type: BlockType;
  label: string;
}

export interface Scenario {
  name: string;
  steps: ScenarioStep[];
}

export interface ScenarioStep {
  /** Plain-language description used in feedback, e.g. "Press Start". */
  action: string;
  /** Input values to apply (by interface block ID) before waiting. */
  set?: Record<string, Signal>;
  /** Simulated time to run after applying inputs. */
  waitMs: number;
  /** Output values expected after waiting (by interface block ID). */
  expect?: Record<string, Signal>;
  /**
   * Checks over the whole wait, for behaviour that is correct at any phase (e.g. flashing):
   * share of scans the output was ON, and how many times it changed.
   */
  during?: { id: string; onShare?: [min: number, max: number]; minChanges?: number }[];
}

export interface ScenarioResult {
  name: string;
  passed: boolean;
  /** First failure in readable form, if any. */
  failure?: string;
}

export interface GradeResult {
  passed: boolean;
  /** Problems with the circuit itself (missing interface blocks, invalid wiring). */
  setupErrors: string[];
  scenarios: ScenarioResult[];
}
