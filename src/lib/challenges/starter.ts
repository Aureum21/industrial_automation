import { BLOCK_CATALOG } from '../automation/catalog.ts';
import { parseCircuitDSL } from '../automation/dsl.ts';
import type { CircuitDocument } from '../automation/types.ts';
import type { Challenge } from './types.ts';

/** The starter circuit with inputs in a column on the left and outputs on the right, leaving room in between. */
export function starterDocument(challenge: Challenge): CircuitDocument {
  const doc = parseCircuitDSL(challenge.starter, BLOCK_CATALOG);
  const inputIds = challenge.inputs.map((pin) => pin.id);
  const outputIds = challenge.outputs.map((pin) => pin.id);
  const rowHeight = 230;
  for (const block of doc.blocks) {
    const inputIndex = inputIds.indexOf(block.id);
    const outputIndex = outputIds.indexOf(block.id);
    if (inputIndex >= 0) block.position = { x: 0, y: inputIndex * rowHeight };
    else if (outputIndex >= 0) block.position = { x: 760, y: outputIndex * rowHeight };
  }
  return doc;
}

export const PROGRESS_KEY = 'automationhub.challenges.progress.v1';
export const workKey = (slug: string) => `automationhub.challenge.${slug}.v1`;

export type ChallengeProgress = Record<string, { solvedAt: string }>;
