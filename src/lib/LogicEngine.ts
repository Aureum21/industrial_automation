export type Connection = {
  fromBlockId: string;
  fromPin: string;
  toBlockId: string;
  toPin: string;
};

export type BlockType = 'INPUT' | 'OUTPUT' | 'AND' | 'OR' | 'NOT';

export interface BlockState {
  id: string;
  type: BlockType;
  inputs: Record<string, boolean>;
  outputs: Record<string, boolean>;
  value?: boolean;
}

export class LogicEngine {
  blocks: Map<string, BlockState> = new Map();
  connections: Connection[] = [];

  addBlock(block: BlockState) {
    this.blocks.set(block.id, block);
  }

  addConnection(conn: Connection) {
    this.connections.push(conn);
  }

  setInput(blockId: string, value: boolean) {
    const block = this.blocks.get(blockId);
    if (block && block.type === 'INPUT') {
      block.value = value;
      block.outputs['Q'] = value;
    }
  }

  tick() {
    // 1. Propagate signals across connections
    for (const conn of this.connections) {
      const sourceBlock = this.blocks.get(conn.fromBlockId);
      const targetBlock = this.blocks.get(conn.toBlockId);
      
      if (sourceBlock && targetBlock) {
        const signal = sourceBlock.outputs[conn.fromPin] ?? false;
        targetBlock.inputs[conn.toPin] = signal;
      }
    }

    // 2. Evaluate all blocks based on their new inputs
    for (const [id, block] of this.blocks.entries()) {
      switch (block.type) {
        case 'AND':
          block.outputs['Q'] = (block.inputs['A'] ?? false) && (block.inputs['B'] ?? false);
          break;
        case 'OR':
          block.outputs['Q'] = (block.inputs['A'] ?? false) || (block.inputs['B'] ?? false);
          break;
        case 'NOT':
          block.outputs['Q'] = !(block.inputs['A'] ?? false);
          break;
        case 'INPUT':
          break;
        case 'OUTPUT':
          block.outputs['Q'] = block.inputs['A'] ?? false;
          break;
      }
    }
  }
}
