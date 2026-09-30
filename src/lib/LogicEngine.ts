import { BLOCK_CATALOG, getBlockDefinition } from './automation/catalog.ts';
import type {
  BlockDefinition, CircuitBlock, CircuitConnection, CircuitDocument,
  ParameterValue, RuntimeBlock, Signal, SignalKind,
} from './automation/types.ts';

export type { BlockType, CircuitBlock, CircuitConnection, CircuitDocument, RuntimeBlock, Signal } from './automation/types.ts';

const readers = new Set(['INPUT', 'ANALOG_INPUT']);
const writers = new Set(['OUTPUT', 'FLAG', 'ANALOG_OUTPUT', 'ANALOG_FLAG']);
const defaultSignal = (kind: SignalKind): Signal => kind === 'analog' ? 0 : kind === 'text' ? '' : false;
const isSignal = (value: Signal, kind: SignalKind) => kind === 'digital'
  ? typeof value === 'boolean'
  : kind === 'analog' ? typeof value === 'number' && Number.isFinite(value) : typeof value === 'string';

/**
 * Deterministic educational simulator. A tick represents an elapsed interval.
 * Blocks run in dependency order, including tag links; memory updates once per
 * tick. Feedback must cross SCAN_DELAY, whose output is the preceding scan's
 * sampled input. Editing a circuit never advances its simulation time.
 */
export class LogicEngine {
  public blocks = new Map<string, RuntimeBlock>();
  public connections: CircuitConnection[] = [];
  public timeMs = 0;
  public diagnostics: string[] = [];

  private order: string[] = [];
  private incoming = new Map<string, CircuitConnection[]>();
  private tagWriters = new Map<string, RuntimeBlock>();

  addBlock(block: CircuitBlock): void {
    if (!block.id.trim()) throw new Error('A block needs an ID.');
    if (this.blocks.has(block.id)) throw new Error(`Block ID "${block.id}" already exists.`);
    const definition = getBlockDefinition(block.type);
    if (!definition || definition.status !== 'ready') throw new Error(`Block ${block.type} is not available for simulation yet.`);
    if (!Number.isFinite(block.position.x) || !Number.isFinite(block.position.y)) throw new Error('Block coordinates must be finite numbers.');

    const params: Record<string, ParameterValue> = {};
    for (const parameter of definition.parameters) params[parameter.key] = parameter.defaultValue;
    for (const [key, value] of Object.entries(block.params ?? {})) {
      this.validateParameter(definition, key, value);
      params[key] = value;
    }
    const valueKind = definition.outputs[0]?.kind;
    if (block.value !== undefined && valueKind && !isSignal(block.value, valueKind)) throw new Error(`${definition.name} requires a ${valueKind} value.`);
    if (block.tag?.trim() && !definition.tagged) throw new Error(`${definition.name} does not support tags.`);

    const runtime: RuntimeBlock = {
      ...block, position: { ...block.position }, tag: block.tag?.trim() || undefined,
      params, inputs: {}, outputs: {}, state: {},
    };
    this.initialize(runtime);
    this.blocks.set(block.id, runtime);
    try { this.rebuildGraph(); }
    catch (error) {
      this.blocks.delete(block.id);
      this.rebuildGraph();
      throw error;
    }
    this.refresh();
  }

  removeBlock(id: string): void {
    this.blocks.delete(id);
    this.connections = this.connections.filter(edge => edge.fromBlockId !== id && edge.toBlockId !== id);
    this.rebuildGraph();
    this.refresh();
  }

  validateConnection(connection: CircuitConnection): string | null {
    if (!connection.id.trim()) return 'A connection needs an ID.';
    if (this.connections.some(edge => edge.id === connection.id)) return 'This connection ID already exists.';
    const source = this.blocks.get(connection.fromBlockId);
    const target = this.blocks.get(connection.toBlockId);
    if (!source || !target) return 'Both blocks must exist before they can be connected.';
    const fromPin = BLOCK_CATALOG[source.type].outputs.find(pin => pin.id === connection.fromPin);
    const toPin = BLOCK_CATALOG[target.type].inputs.find(pin => pin.id === connection.toPin);
    if (!fromPin) return `Unknown output pin ${connection.fromPin}.`;
    if (!toPin) return `Unknown input pin ${connection.toPin}.`;
    if (fromPin.kind !== toPin.kind) return `Cannot connect a ${fromPin.kind} output to a ${toPin.kind} input.`;
    if (this.connections.some(edge => edge.toBlockId === connection.toBlockId && edge.toPin === connection.toPin)) return 'This input already has a connection. Remove it before connecting another source.';
    try { this.buildGraph([...this.connections, connection]); }
    catch (error) { return error instanceof Error ? error.message : 'Invalid connection.'; }
    return null;
  }

  addConnection(connection: CircuitConnection): void {
    const error = this.validateConnection(connection);
    if (error) throw new Error(error);
    this.connections.push({ ...connection });
    this.rebuildGraph();
    this.refresh();
  }

  removeConnection(id: string): void {
    this.connections = this.connections.filter(edge => edge.id !== id);
    this.rebuildGraph();
    this.refresh();
  }

  setInput(id: string, value: Signal): void {
    const block = this.requireBlock(id);
    if (!readers.has(block.type)) throw new Error('Only input blocks accept manual input values.');
    const kind = BLOCK_CATALOG[block.type].outputs[0].kind;
    if (!isSignal(value, kind)) throw new Error(`This input requires a finite ${kind} value.`);
    block.value = value;
    this.refresh();
  }

  setTag(id: string, tag: string): void {
    const block = this.requireBlock(id);
    if (!BLOCK_CATALOG[block.type].tagged) throw new Error('This block does not support tags.');
    const previous = block.tag;
    block.tag = tag.trim() || undefined;
    try { this.rebuildGraph(); }
    catch (error) {
      block.tag = previous;
      this.rebuildGraph();
      throw error;
    }
    this.refresh();
  }

  setParam(id: string, key: string, value: ParameterValue): void {
    const block = this.requireBlock(id);
    this.validateParameter(BLOCK_CATALOG[block.type], key, value);
    block.params[key] = value;
    if (block.type === 'ANALOG_INPUT' && key === 'value') block.value = value;
    this.refresh();
  }

  tick(deltaMs = 100): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) throw new Error('A scan interval must be a positive finite number.');
    this.timeMs += deltaMs;
    this.diagnostics = [];
    for (const block of this.blocks.values()) {
      if (block.type === 'SCAN_DELAY') block.outputs.Q = block.state.previous ?? false;
    }
    for (const id of this.order) {
      const block = this.requireBlock(id);
      this.readInputs(block);
      this.evaluate(block, deltaMs, true);
    }
    for (const block of this.blocks.values()) {
      if (block.type === 'SCAN_DELAY') {
        this.readInputs(block);
        block.state.previous = block.inputs.A;
      }
    }
  }

  reset(): void {
    this.timeMs = 0;
    this.diagnostics = [];
    for (const block of this.blocks.values()) this.initialize(block);
    this.refresh();
  }

  /** Validate in a temporary engine so failed imports leave this circuit intact. */
  load(document: CircuitDocument): void {
    if (document.version !== 1 || !Array.isArray(document.blocks) || !Array.isArray(document.connections)) throw new Error('Unsupported circuit document.');
    const replacement = new LogicEngine();
    for (const block of document.blocks) replacement.addBlock(block);
    for (const connection of document.connections) replacement.addConnection(connection);
    this.blocks = replacement.blocks;
    this.connections = replacement.connections;
    this.timeMs = 0;
    this.rebuildGraph();
    this.refresh();
  }

  toDocument(name = 'Untitled circuit'): CircuitDocument {
    return {
      version: 1, name,
      blocks: [...this.blocks.values()].map(block => ({
        id: block.id, type: block.type, position: { ...block.position },
        ...(block.label !== undefined ? { label: block.label } : {}),
        ...(block.tag ? { tag: block.tag } : {}),
        ...(block.value !== undefined ? { value: block.value } : {}),
        params: { ...block.params },
      })),
      connections: this.connections.map(connection => ({ ...connection })),
    };
  }

  private requireBlock(id: string): RuntimeBlock {
    const block = this.blocks.get(id);
    if (!block) throw new Error(`Block "${id}" does not exist.`);
    return block;
  }

  private initialize(block: RuntimeBlock): void {
    const definition = BLOCK_CATALOG[block.type];
    block.inputs = Object.fromEntries(definition.inputs.map(pin => [pin.id, defaultSignal(pin.kind)]));
    block.outputs = Object.fromEntries(definition.outputs.map(pin => [pin.id, defaultSignal(pin.kind)]));
    block.state = {};
    if (readers.has(block.type) && block.value === undefined) {
      block.value = block.type === 'ANALOG_INPUT' ? Number(block.params.value) : false;
    }
    if (block.type === 'COUNTER') block.outputs.Q = 0 >= Number(block.params.limit);
  }

  private validateParameter(definition: BlockDefinition, key: string, value: ParameterValue): void {
    const parameter = definition.parameters.find(item => item.key === key);
    if (!parameter) throw new Error(`Unknown parameter "${key}" for ${definition.name}.`);
    if (parameter.type === 'number') {
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${parameter.label} must be a finite number.`);
      if (parameter.min !== undefined && value < parameter.min) throw new Error(`${parameter.label} must be at least ${parameter.min}.`);
      if (parameter.max !== undefined && value > parameter.max) throw new Error(`${parameter.label} must be at most ${parameter.max}.`);
    } else if (parameter.type === 'boolean') {
      if (typeof value !== 'boolean') throw new Error(`${parameter.label} must be true or false.`);
    } else {
      if (typeof value !== 'string') throw new Error(`${parameter.label} must be text.`);
      if (parameter.type === 'select' && !parameter.options?.some(option => option.value === value)) throw new Error(`Invalid choice for ${parameter.label}.`);
    }
  }

  private tagKey(block: RuntimeBlock): string {
    return `${BLOCK_CATALOG[block.type].outputs[0].kind}:${block.tag}`;
  }

  private buildGraph(connections: CircuitConnection[]) {
    const tagWriters = new Map<string, RuntimeBlock>();
    for (const block of this.blocks.values()) {
      if (!writers.has(block.type) || !block.tag) continue;
      const key = this.tagKey(block);
      if (tagWriters.has(key)) throw new Error(`Tag "${block.tag}" already has a writer for this signal type.`);
      tagWriters.set(key, block);
    }
    const outgoing = new Map<string, Set<string>>();
    const counts = new Map<string, number>();
    const incoming = new Map<string, CircuitConnection[]>();
    for (const id of this.blocks.keys()) {
      outgoing.set(id, new Set());
      counts.set(id, 0);
      incoming.set(id, []);
    }
    const depend = (from: string, to: string) => {
      if (this.requireBlock(to).type === 'SCAN_DELAY') return;
      const next = outgoing.get(from)!;
      if (!next.has(to)) {
        next.add(to);
        counts.set(to, counts.get(to)! + 1);
      }
    };
    for (const connection of connections) {
      if (!this.blocks.has(connection.fromBlockId) || !this.blocks.has(connection.toBlockId)) throw new Error('A connection refers to a missing block.');
      incoming.get(connection.toBlockId)!.push(connection);
      depend(connection.fromBlockId, connection.toBlockId);
    }
    for (const block of this.blocks.values()) {
      if (!readers.has(block.type) || !block.tag) continue;
      const writer = tagWriters.get(this.tagKey(block));
      if (writer) depend(writer.id, block.id);
    }
    const order = [...counts].filter(([, count]) => count === 0).map(([id]) => id);
    for (let index = 0; index < order.length; index++) {
      for (const next of outgoing.get(order[index])!) {
        const count = counts.get(next)! - 1;
        counts.set(next, count);
        if (count === 0) order.push(next);
      }
    }
    if (order.length !== this.blocks.size) throw new Error('This connection creates a feedback loop. Insert a Scan delay block to make the previous scan explicit.');
    return { order, incoming, tagWriters };
  }

  private rebuildGraph(): void {
    const graph = this.buildGraph(this.connections);
    this.order = graph.order;
    this.incoming = graph.incoming;
    this.tagWriters = graph.tagWriters;
  }

  private readInputs(block: RuntimeBlock): void {
    for (const pin of BLOCK_CATALOG[block.type].inputs) block.inputs[pin.id] = defaultSignal(pin.kind);
    for (const connection of this.incoming.get(block.id) ?? []) {
      block.inputs[connection.toPin] = this.requireBlock(connection.fromBlockId).outputs[connection.fromPin];
    }
  }

  private refresh(): void {
    this.diagnostics = [];
    for (const id of this.order) {
      const block = this.requireBlock(id);
      this.readInputs(block);
      this.evaluate(block, 0, false);
    }
    // Delayed inputs may precede their drivers in the execution order.
    for (const block of this.blocks.values()) if (block.type === 'SCAN_DELAY') this.readInputs(block);
  }

  private evaluate(block: RuntimeBlock, deltaMs: number, advance: boolean): void {
    const definition = BLOCK_CATALOG[block.type];
    if (definition.stateful && !advance) return;
    const digital = (pin: string) => block.inputs[pin] === true;
    const analog = (pin: string) => Number(block.inputs[pin] ?? 0);
    const parameter = (key: string) => Number(block.params[key]);
    const A = digital('A');
    const B = digital('B');
    switch (block.type) {
      case 'INPUT': case 'ANALOG_INPUT': {
        const writer = block.tag ? this.tagWriters.get(this.tagKey(block)) : undefined;
        block.outputs.Q = writer ? writer.outputs.Q : block.value ?? defaultSignal(definition.outputs[0].kind);
        break;
      }
      case 'HIGH': block.outputs.Q = true; break;
      case 'LOW': block.outputs.Q = false; break;
      case 'ANALOG_CONSTANT': block.outputs.Q = parameter('value'); break;
      case 'OUTPUT': case 'FLAG': block.outputs.Q = A; break;
      case 'ANALOG_OUTPUT': case 'ANALOG_FLAG': block.outputs.Q = analog('A'); break;
      case 'AND': block.outputs.Q = A && B; break;
      case 'OR': block.outputs.Q = A || B; break;
      case 'NOT': block.outputs.Q = !A; break;
      case 'XOR': block.outputs.Q = A !== B; break;
      case 'NAND': block.outputs.Q = !(A && B); break;
      case 'NOR': block.outputs.Q = !(A || B); break;
      case 'XNOR': block.outputs.Q = A === B; break;
      case 'RS_LATCH':
        block.state.q = digital('R') ? false : digital('S') || block.state.q === true;
        block.outputs.Q = block.state.q;
        break;
      case 'PULSE_RELAY':
        if (A && !block.state.lastA) block.state.q = !block.state.q;
        block.state.lastA = A;
        block.outputs.Q = block.state.q ?? false;
        break;
      case 'R_TRIG': case 'F_TRIG':
        block.outputs.Q = block.type === 'R_TRIG' ? A && !block.state.lastA : !A && block.state.lastA === true;
        block.state.lastA = A;
        break;
      case 'TON': {
        const elapsed = A ? Math.min(parameter('duration'), Number(block.state.elapsed ?? 0) + deltaMs) : 0;
        block.state.elapsed = elapsed;
        block.outputs.ET = elapsed;
        block.outputs.Q = A && elapsed >= parameter('duration');
        break;
      }
      case 'TOF': {
        if (A) {
          block.state.armed = true;
          block.state.elapsed = 0;
          block.outputs.Q = true;
        } else if (block.state.armed) {
          block.state.elapsed = Math.min(parameter('duration'), Number(block.state.elapsed ?? 0) + deltaMs);
          block.outputs.Q = Number(block.state.elapsed) < parameter('duration');
          if (!block.outputs.Q) block.state.armed = false;
        } else block.outputs.Q = false;
        block.outputs.ET = block.state.elapsed ?? 0;
        break;
      }
      case 'CLOCK': {
        const phase = (Number(block.state.phase ?? 0) + deltaMs) % (parameter('onTime') + parameter('offTime'));
        block.state.phase = phase;
        block.outputs.Q = phase >= parameter('offTime');
        break;
      }
      case 'COUNTER': {
        const up = digital('CU');
        const down = digital('CD');
        const reset = digital('R');
        let count = Number(block.state.count ?? 0);
        if (reset) count = 0;
        else count += Number(up && !block.state.lastCU) - Number(down && !block.state.lastCD);
        block.state.count = count;
        block.state.lastCU = up;
        block.state.lastCD = down;
        block.outputs.CV = count;
        block.outputs.Q = count >= parameter('limit');
        break;
      }
      case 'MATH': {
        const first = analog('A');
        const second = analog('B');
        let result = 0;
        switch (block.params.operation) {
          case 'subtract': result = first - second; break;
          case 'multiply': result = first * second; break;
          case 'divide':
            if (second === 0) this.diagnostics.push(`${block.label || definition.name}: division by zero; output set to 0.`);
            else result = first / second;
            break;
          default: result = first + second;
        }
        block.outputs.Q = result;
        break;
      }
      case 'ANALOG_COMPARATOR': {
        const first = analog('A');
        const second = analog('B');
        switch (block.params.operation) {
          case 'gte': block.outputs.Q = first >= second; break;
          case 'lt': block.outputs.Q = first < second; break;
          case 'lte': block.outputs.Q = first <= second; break;
          case 'eq': block.outputs.Q = first === second; break;
          case 'ne': block.outputs.Q = first !== second; break;
          default: block.outputs.Q = first > second;
        }
        break;
      }
      case 'ANALOG_THRESHOLD': block.outputs.Q = analog('A') >= parameter('threshold'); break;
      case 'ANALOG_AMPLIFIER': block.outputs.Q = analog('A') * parameter('gain') + parameter('offset'); break;
      case 'ANALOG_MUX': block.outputs.Q = digital('S') ? analog('B') : analog('A'); break;
      case 'FLOAT_TO_INT': block.outputs.Q = Math.trunc(analog('A')); break;
      case 'INT_TO_FLOAT': block.outputs.Q = analog('A'); break;
      case 'SCAN_DELAY': break;
      default: throw new Error(`Simulation is not implemented for ${block.type}.`);
    }
    for (const [pin, signal] of Object.entries(block.outputs)) {
      if (typeof signal === 'number' && !Number.isFinite(signal)) {
        block.outputs[pin] = 0;
        this.diagnostics.push(`${block.label || definition.name}: numeric overflow on ${pin}; output set to 0.`);
      }
    }
  }
}
