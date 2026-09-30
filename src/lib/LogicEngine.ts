export type Connection = {
  fromBlockId: string;
  fromPin: string;
  toBlockId: string;
  toPin: string;
};

export type BlockType = 
  | 'INPUT' | 'OUTPUT' 
  | 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR' | 'XNOR'
  | 'RS_LATCH' | 'PULSE_RELAY'
  | 'R_TRIG' | 'F_TRIG'
  | 'TON' | 'TOF' | 'CLOCK'
  | 'HIGH' | 'LOW'
  | 'COUNTER';

export interface BlockState {
  id: string;
  type: BlockType;
  inputs: Record<string, boolean>;
  outputs: Record<string, boolean>;
  value?: boolean;
  state?: any; 
  tag?: string; 
  params?: Record<string, any>; 
}

export class LogicEngine {
  blocks: Map<string, BlockState> = new Map();
  connections: Connection[] = [];
  tags: Map<string, boolean> = new Map(); 

  addBlock(block: BlockState) {
    if (block.type === 'RS_LATCH') block.state = false;
    if (block.type === 'PULSE_RELAY') block.state = { q: false, lastA: false };
    if (block.type === 'R_TRIG' || block.type === 'F_TRIG') block.state = false;
    if (block.type === 'TON' || block.type === 'TOF') block.state = { startTime: null };
    if (block.type === 'CLOCK') block.state = { lastSwitch: Date.now() };
    if (block.type === 'COUNTER') block.state = { count: 0, lastCU: false, lastCD: false };
    if (block.type === 'HIGH') block.outputs['Q'] = true;
    if (block.type === 'LOW') block.outputs['Q'] = false;
    
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
        case 'HIGH': block.outputs['Q'] = true; break;
        case 'LOW': block.outputs['Q'] = false; break;

        case 'AND': block.outputs['Q'] = A && B; break;
        case 'OR': block.outputs['Q'] = A || B; break;
        case 'NOT': block.outputs['Q'] = !A; break;
        case 'XOR': block.outputs['Q'] = A !== B; break;
        case 'NAND': block.outputs['Q'] = !(A && B); break;
        case 'NOR': block.outputs['Q'] = !(A || B); break;
        case 'XNOR': block.outputs['Q'] = A === B; break;
        
        case 'RS_LATCH': {
          const S = block.inputs['S'] ?? false;
          const R = block.inputs['R'] ?? false;
          if (R) block.state = false;
          else if (S) block.state = true;
          block.outputs['Q'] = block.state;
          break;
        }

        case 'PULSE_RELAY': {
          if (A && !block.state.lastA) block.state.q = !block.state.q;
          block.state.lastA = A;
          block.outputs['Q'] = block.state.q;
          break;
        }

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

        case 'CLOCK': {
          const onTime = block.params?.onTime ?? 1000;
          const offTime = block.params?.offTime ?? 1000;
          const now = Date.now();
          
          if (block.outputs['Q']) {
            if (now - block.state.lastSwitch >= onTime) {
              block.outputs['Q'] = false;
              block.state.lastSwitch = now;
            }
          } else {
            if (now - block.state.lastSwitch >= offTime) {
              block.outputs['Q'] = true;
              block.state.lastSwitch = now;
            }
          }
          break;
        }

        case 'COUNTER': {
          const CU = block.inputs['CU'] ?? false;
          const CD = block.inputs['CD'] ?? false;
          const R = block.inputs['R'] ?? false;
          const limit = block.params?.limit ?? 5;
          
          if (R) {
            block.state.count = 0;
          } else {
            if (CU && !block.state.lastCU) block.state.count++;
            if (CD && !block.state.lastCD) block.state.count--;
          }
          
          block.state.lastCU = CU;
          block.state.lastCD = CD;
          
          block.outputs['Q'] = block.state.count >= limit;
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
