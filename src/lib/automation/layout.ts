import dagre from 'dagre';
import type { CircuitDocument } from './types.ts';

export function applyLayout(document: CircuitDocument): void {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 130 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const block of document.blocks) {
    g.setNode(block.id, { width: 220, height: 190 });
  }

  for (const conn of document.connections) {
    g.setEdge(conn.fromBlockId, conn.toBlockId);
  }

  dagre.layout(g);

  let minX = Infinity;
  let minY = Infinity;
  for (const block of document.blocks) {
    const node = g.node(block.id);
    if (node) {
      const x = Math.round(node.x - node.width / 2);
      const y = Math.round(node.y - node.height / 2);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
    }
  }

  for (const block of document.blocks) {
    const node = g.node(block.id);
    if (node) {
      block.position = {
        x: Math.round(node.x - node.width / 2) - (minX !== Infinity ? minX : 0),
        y: Math.round(node.y - node.height / 2) - (minY !== Infinity ? minY : 0),
      };
    }
  }
}
