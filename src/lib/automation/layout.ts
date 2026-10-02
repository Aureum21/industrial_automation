import dagre from 'dagre';
import type { CircuitDocument } from './types.ts';

export function applyLayout(document: CircuitDocument): void {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 200 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const block of document.blocks) {
    g.setNode(block.id, { width: 160, height: 100 });
  }

  for (const conn of document.connections) {
    g.setEdge(conn.fromBlockId, conn.toBlockId);
  }

  dagre.layout(g);

  for (const block of document.blocks) {
    const node = g.node(block.id);
    if (node) {
      block.position = { x: Math.round(node.x - node.width / 2), y: Math.round(node.y - node.height / 2) };
    }
  }
}
