export type Connection = {
  fromBlockId: string;
  fromPin: string;
  toBlockId: string;
  toPin: string;
};

export type BlockType = 
  | 'INPUT' | 'OUTPUT' 
  | 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR' | 'XNOR'
  | 'RS_LATCH' 
  | 'R_TRIG' | 'F_TRIG'
  | 'TON' | 'TOF';

export interface BlockState {
  id: string;
  type: BlockType;
  inputs: Record<string, boolean>;
  outputs: Record<string, boolean>;
  value?: boolean;
  state?: any; 
  tag?: string; 
  params?: Record<string, any>; // Used for things like Timer duration
}

export class LogicEngine {
  blocks: Map<string, BlockState> = new Map();
  connections: Connection[] = [];
  tags: Map<string, boolean> = new Map(); 

  addBlock(block: BlockState) {
    if (block.type === 'RS_LATCH') block.state = false;
    if (block.type === 'R_TRIG' || block.type === 'F_TRIG') block.state = false;
    if (block.type === 'TON' || block.type === 'TOF') block.state = { startTime: null };
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

  setTag(blockId: string, tag: string) {
    const block = this.blocks.get(blockId);
    if (block) {
      block.tag = tag;
    }
  }
  
  setParam(blockId: string, paramKey: string, paramVal: any) {
    const block = this.blocks.get(blockId);
    if (block) {
      if (!block.params) block.params = {};
      block.params[paramKey] = paramVal;
    }
  }

  tick() {
    for (const conn of this.connections) {
      const sourceBlock = this.blocks.get(conn.fromBlockId);
      const targetBlock = this.blocks.get(conn.toBlockId);
      
      if (sourceBlock && targetBlock) {
        const signal = sourceBlock.outputs[conn.fromPin] ?? false;
        targetBlock.inputs[conn.toPin] = signal;
      }
    }

    for (const [id, block] of this.blocks.entries()) {
      const A = block.inputs['A'] ?? false;
      const B = block.inputs['B'] ?? false;
      
      switch (block.type) {
        case 'AND': block.outputs['Q'] = A && B; break;
        case 'OR': block.outputs['Q'] = A || B; break;
        case 'NOT': block.outputs['Q'] = !A; break;
        case 'XOR': block.outputs['Q'] = A !== B; break;
        case 'NAND': block.outputs['Q'] = !(A && B); break;
        case 'NOR': block.outputs['Q'] = !(A || B); break;
        case 'XNOR': block.outputs['Q'] = A === B; break;
        
        case 'RS_LATCH':
          const S = block.inputs['S'] ?? false;
          const R = block.inputs['R'] ?? false;
          if (R) block.state = false;
          else if (S) block.state = true;
          block.outputs['Q'] = block.state;
          break;

        case 'R_TRIG':
          block.outputs['Q'] = A && !block.state;
          block.state = A;
          break;

        case 'F_TRIG':
          block.outputs['Q'] = !A && block.state;
          block.state = A;
          break;
          
        case 'TON': {
          const delayMs = block.params?.duration ?? 2000;
          if (A) {
            if (block.state.startTime === null) {
              block.state.startTime = Date.now();
            } else if (Date.now() - block.state.startTime >= delayMs) {
              block.outputs['Q'] = true;
            }
          } else {
            block.state.startTime = null;
            block.outputs['Q'] = false;
          }
          break;
        }

        case 'TOF': {
          const delayMs = block.params?.duration ?? 2000;
          if (A) {
            block.state.startTime = null;
            block.outputs['Q'] = true;
          } else {
            if (block.outputs['Q'] === true) {
               if (block.state.startTime === null) {
                 block.state.startTime = Date.now();
               } else if (Date.now() - block.state.startTime >= delayMs) {
                 block.outputs['Q'] = false;
               }
            } else {
               block.state.startTime = null;
               block.outputs['Q'] = false;
            }
          }
          break;
        }

        case 'INPUT':
          if (block.tag && this.tags.has(block.tag)) {
            block.outputs['Q'] = this.tags.get(block.tag)!;
            block.value = block.outputs['Q'];
          }
          break;

        case 'OUTPUT':
          block.outputs['Q'] = A;
          if (block.tag) {
            this.tags.set(block.tag, A);
          }
          break;
      }
    }
  }
}
