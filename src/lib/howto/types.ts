import type { BlockType } from '../automation/types.ts';
import type { Challenge, InterfacePin } from '../challenges/types.ts';

/**
 * A how-to guide answers one common search ("PLC program for a traffic light") with a working,
 * automatically verified circuit. The verification reuses the challenge grader: `circuit` must
 * pass every scenario.
 */
export interface HowTo extends Pick<Challenge, 'scenarios' | 'never'> {
  slug: string;
  /** H1 and title tag, phrased the way people search. */
  title: string;
  /** Meta description, at most ~155 characters. */
  description: string;
  /** Two-sentence direct answer, shown first. */
  answer: string;
  level: Challenge['level'];
  /** Markdown: how the circuit works. */
  explanation: string;
  /** Solution circuit (DSL). Interface block IDs must match `inputs` / `outputs`. */
  circuit: string;
  inputs: IoPin[];
  outputs: IoPin[];
  /** How to try it in the embedded simulator. */
  tryIt: string[];
  steps: { title: string; text: string }[];
  mistakes: string[];
  faq: { q: string; a: string }[];
  blocks: BlockType[];
  challenges?: string[];
  /** Shown above the generated sketch, e.g. when the circuit contains a simulated process. */
  arduinoNote?: string;
}

export interface IoPin extends InterfacePin {
  /** What the signal is in a real installation, e.g. "NO push button, green". */
  device: string;
}
