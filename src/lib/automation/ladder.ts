import { BLOCK_CATALOG } from './catalog.ts';
import type { BlockType, CircuitBlock, CircuitDocument } from './types.ts';

/**
 * Converts a function-block circuit into ladder rungs (IEC 61131-3 LD style).
 *
 * Pure boolean gates are folded into contacts: AND → series, OR → parallel, NOT → normally
 * closed contact (De Morgan pushes negation down to the contacts). Every other block becomes a
 * rung of its own: OUTPUT and FLAG as coils, everything else as a function box with one line per
 * input pin. Their outputs then appear as contacts on the rungs that use them.
 */

export interface SignalRef {
  blockId: string;
  pin: string;
}

export type LadderNode =
  | { kind: 'contact'; ref: SignalRef; label: string; negated: boolean }
  | { kind: 'series'; items: LadderNode[] }
  | { kind: 'parallel'; branches: LadderNode[] }
  | { kind: 'open' };

export interface RungInput {
  pin: string;
  /** Digital pins: the logic driving the pin. */
  logic?: LadderNode;
  /** Analog pins: the label of the value wired in, if any. */
  value?: { ref: SignalRef; label: string };
}

export interface Rung {
  id: string;
  blockId: string;
  type: BlockType;
  label: string;
  kind: 'coil' | 'box';
  inputs: RungInput[];
  outputs: string[];
}

const GATES = new Set<BlockType>(['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR']);
const COILS = new Set<BlockType>(['OUTPUT', 'FLAG']);
const MAX_DEPTH = 12;

export function blockLabel(block: CircuitBlock): string {
  const definition = BLOCK_CATALOG[block.type];
  return (block.label?.trim() || block.tag?.trim() || `${definition?.shortName ?? block.type} ${block.id}`).slice(0, 40);
}

export function negate(node: LadderNode): LadderNode {
  switch (node.kind) {
    case 'contact': return { ...node, negated: !node.negated };
    case 'series': return { kind: 'parallel', branches: node.items.map(negate) };
    case 'parallel': return { kind: 'series', items: node.branches.map(negate) };
    case 'open': return { kind: 'series', items: [] }; // NOT(open) = closed wire
  }
}

const series = (...items: LadderNode[]): LadderNode => ({ kind: 'series', items: items.flatMap((item) => (item.kind === 'series' ? item.items : [item])) });
const parallel = (...branches: LadderNode[]): LadderNode => ({ kind: 'parallel', branches: branches.flatMap((branch) => (branch.kind === 'parallel' ? branch.branches : [branch])) });

export function buildLadder(doc: CircuitDocument, order: CircuitBlock[] = doc.blocks): Rung[] {
  const byId = new Map(doc.blocks.map((block) => [block.id, block]));
  const driver = new Map<string, SignalRef>();
  for (const connection of doc.connections) driver.set(`${connection.toBlockId}:${connection.toPin}`, { blockId: connection.fromBlockId, pin: connection.fromPin });

  const contact = (ref: SignalRef): LadderNode => {
    const source = byId.get(ref.blockId);
    const label = source ? blockLabel(source) + (ref.pin === 'Q' ? '' : `.${ref.pin}`) : ref.blockId;
    return { kind: 'contact', ref, label, negated: false };
  };

  const logicOf = (blockId: string, pin: string, depth: number): LadderNode => {
    const ref = driver.get(`${blockId}:${pin}`);
    if (!ref) return { kind: 'open' };
    const source = byId.get(ref.blockId);
    if (!source || !GATES.has(source.type) || ref.pin !== 'Q' || depth >= MAX_DEPTH) return contact(ref);
    const a = () => logicOf(source.id, 'A', depth + 1);
    const b = () => logicOf(source.id, 'B', depth + 1);
    switch (source.type) {
      case 'AND': return series(a(), b());
      case 'OR': return parallel(a(), b());
      case 'NOT': return negate(a());
      case 'NAND': return negate(series(a(), b()));
      case 'NOR': return negate(parallel(a(), b()));
      case 'XOR': return parallel(series(a(), negate(b())), series(negate(a()), b()));
      case 'XNOR': return parallel(series(a(), b()), series(negate(a()), negate(b())));
      default: return contact(ref);
    }
  };

  const rungs: Rung[] = [];
  for (const block of order) {
    const definition = BLOCK_CATALOG[block.type];
    if (!definition || GATES.has(block.type) || !definition.inputs.length) continue;
    const inputs: RungInput[] = definition.inputs
      .filter((pin) => pin.kind !== 'text')
      .map((pin) => {
        if (pin.kind === 'digital') return { pin: pin.id, logic: logicOf(block.id, pin.id, 0) };
        const ref = driver.get(`${block.id}:${pin.id}`);
        const source = ref && byId.get(ref.blockId);
        return { pin: pin.id, value: ref && source ? { ref, label: blockLabel(source) + (ref.pin === 'Q' ? '' : `.${ref.pin}`) } : undefined };
      });
    rungs.push({
      id: `rung-${block.id}`,
      blockId: block.id,
      type: block.type,
      label: blockLabel(block),
      kind: COILS.has(block.type) ? 'coil' : 'box',
      inputs,
      outputs: definition.outputs.filter((pin) => pin.kind !== 'text').map((pin) => pin.id),
    });
  }
  // Coils last, like the output section of a PLC program.
  return [...rungs.filter((rung) => rung.kind === 'box'), ...rungs.filter((rung) => rung.kind === 'coil')];
}

/** Whether power flows through a node, given the current signal values. */
export function conducts(node: LadderNode, read: (ref: SignalRef) => unknown): boolean {
  switch (node.kind) {
    case 'contact': return Boolean(read(node.ref)) !== node.negated;
    case 'series': return node.items.every((item) => conducts(item, read));
    case 'parallel': return node.branches.some((branch) => conducts(branch, read));
    case 'open': return false;
  }
}
