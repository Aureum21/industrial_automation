import type { CircuitBlock, CircuitConnection } from './types';
import { getBlockDefinition } from './catalog';

/**
 * Compiles a grid of user-placed ladder components into a standard FBD circuit.
 * It generates hidden AND/OR blocks and wires to represent the electrical flow.
 */
export function compileLadderGrid(userNodes: CircuitBlock[]): { generatedNodes: CircuitBlock[], connections: CircuitConnection[] } {
  const generatedNodes: CircuitBlock[] = [];
  const connections: CircuitConnection[] = [];
  let nextId = 1;

  // Group user nodes by rung (y / 100)
  const rungs = new Map<number, CircuitBlock[]>();
  for (const node of userNodes) {
    const rungIdx = Math.round(node.position.y / 100);
    if (!rungs.has(rungIdx)) rungs.set(rungIdx, []);
    rungs.get(rungIdx)!.push(node);
  }

  for (const [rungIdx, nodes] of rungs.entries()) {
    // Sort left to right
    nodes.sort((a, b) => a.position.x - b.position.x);

    let currentSignal: { blockId: string, pin: string } | null = null;

    for (const node of nodes) {
      const type = node.type;
      const isInput = type === 'INPUT' || type === 'NC_INPUT';
      const isOutput = type === 'OUTPUT';

      if (isInput) {
        if (!currentSignal) {
          // First contact in the rung, just start the signal here
          currentSignal = { blockId: node.id, pin: 'Q' };
        } else {
          // Series contact: generate an AND block to combine currentSignal with this contact
          const andId = `ladder-gen-and-${rungIdx}-${nextId++}`;
          generatedNodes.push({
            id: andId,
            type: 'AND',
            label: 'AND',
            position: { x: node.position.x - 50, y: node.position.y + 50 },
            params: {}
          });

          // Wire currentSignal -> AND.A
          connections.push({
            id: `ladder-gen-wire-${nextId++}`,
            fromBlockId: currentSignal.blockId,
            fromPin: currentSignal.pin,
            toBlockId: andId,
            toPin: 'A'
          });

          // Wire contact -> AND.B
          connections.push({
            id: `ladder-gen-wire-${nextId++}`,
            fromBlockId: node.id,
            fromPin: 'Q',
            toBlockId: andId,
            toPin: 'B'
          });

          // The new signal is the output of the AND block
          currentSignal = { blockId: andId, pin: 'Q' };
        }
      } 
      else if (isOutput) {
        // Output coil receives the current signal
        if (currentSignal) {
          connections.push({
            id: `ladder-gen-wire-${nextId++}`,
            fromBlockId: currentSignal.blockId,
            fromPin: currentSignal.pin,
            toBlockId: node.id,
            toPin: 'A'
          });
        }
      } 
      else {
        // Complex block (e.g. Timer)
        // Assume it receives power on 'A' or 'EN', and outputs on 'Q'
        const def = getBlockDefinition(type);
        if (def && def.status === 'ready') {
          const inPin = def.inputs.find(i => i.id === 'A' || i.id === 'EN')?.id;
          const outPin = def.outputs.find(o => o.id === 'Q' || o.id === 'CV')?.id;

          if (inPin && currentSignal) {
            connections.push({
              id: `ladder-gen-wire-${nextId++}`,
              fromBlockId: currentSignal.blockId,
              fromPin: currentSignal.pin,
              toBlockId: node.id,
              toPin: inPin
            });
          }

          if (outPin) {
            currentSignal = { blockId: node.id, pin: outPin };
          } else {
            currentSignal = null;
          }
        }
      }
    }
  }

  return { generatedNodes, connections };
}
