/* eslint-disable @typescript-eslint/no-explicit-any */
import { BLOCK_CATALOG, getBlockDefinition } from './automation/catalog.ts';
import type {
  BlockDefinition, CircuitBlock, CircuitConnection, CircuitDocument,
  ParameterValue, RuntimeBlock, Signal, SignalKind,
} from './automation/types.ts';

export type { BlockType, CircuitBlock, CircuitConnection, CircuitDocument, RuntimeBlock, Signal } from './automation/types.ts';

const readers = new Set(['INPUT', 'NC_INPUT', 'ANALOG_INPUT']);
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
  public history: import('./automation/types.ts').EngineSnapshot[] = [];

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

  clearConnections(): void {
    this.connections = [];
    this.rebuildGraph();
    this.refresh();
  }

  setInput(id: string, value: Signal, propagate = true): void {
    const block = this.requireBlock(id);
    if (!readers.has(block.type) && !block.type.includes('CONSTANT') && block.type !== 'FLAG') {
      throw new Error('Only inputs and constants accept manual input values.');
    }
    const kind = BLOCK_CATALOG[block.type]?.outputs[0]?.kind;
    if (kind && !isSignal(value, kind)) throw new Error(`This input requires a finite ${kind} value.`);
    block.value = value;
    
    if (propagate) {
      this.refresh();
    } else {
      // Just update this specific block's outputs so the UI shows the new value
      this.readInputs(block);
      this.evaluate(block, 0, false);
    }
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
  }

  tick(deltaMs = 100): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) throw new Error('A scan interval must be a positive finite number.');
    this.timeMs += deltaMs;
    this.diagnostics = [];
    for (const block of this.blocks.values()) {
      if (block.type === 'SCAN_DELAY') block.outputs.Q = block.state.previous ?? false;
      if (block.type === 'ANALOG_SCAN_DELAY') block.outputs.Q = Number(block.state.previous ?? 0);
    }
    for (const id of this.order) {
      const block = this.requireBlock(id);
      this.readInputs(block);
      this.evaluate(block, deltaMs, true);
    }
    for (const block of this.blocks.values()) {
      if (block.type === 'SCAN_DELAY' || block.type === 'ANALOG_SCAN_DELAY') {
        this.readInputs(block);
        block.state.previous = block.inputs.A;
      }
    }
    this.recordSnapshot();
  }

  private recordSnapshot(): void {
    const outputs: Record<string, Record<string, Signal>> = {};
    for (const block of this.blocks.values()) {
      outputs[block.id] = { ...block.outputs };
    }
    this.history.push({ timeMs: this.timeMs, outputs });
    if (this.history.length > 3000) this.history.shift(); // Keep last 5 minutes (at 100ms ticks)
  }

  reset(): void {
    this.timeMs = 0;
    this.history = [];
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

  toDocument(name = 'Untitled circuit', widgets?: any[]): CircuitDocument {
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
      ...(widgets ? { widgets } : {})
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
    if (readers.has(block.type)) {
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
      const toType = this.requireBlock(to).type;
      if (toType === 'SCAN_DELAY' || toType === 'ANALOG_SCAN_DELAY' || toType === 'TRANSFER_FUNCTION' || toType === 'ANALOG_RAMP') return;
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
    for (const block of this.blocks.values()) if (block.type === 'SCAN_DELAY' || block.type === 'ANALOG_SCAN_DELAY') this.readInputs(block);
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
      case 'INPUT': case 'ANALOG_INPUT': case 'NC_INPUT': {
        const writer = block.tag ? this.tagWriters.get(this.tagKey(block)) : undefined;
        let val = writer ? writer.outputs.Q : block.value ?? defaultSignal(definition.outputs[0].kind);
        if (block.type === 'NC_INPUT') val = !val;
        

        block.outputs.Q = val;
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
      case 'ANALOG_WATCHDOG': {
        const en = digital('EN');
        const a = analog('A');
        if (en && !block.state.lastEN) block.state.reference = a;
        block.state.lastEN = en;
        block.outputs.Q = en && Math.abs(a - Number(block.state.reference ?? a)) > parameter('tolerance');
        break;
      }
      case 'ANALOG_DIFFERENTIAL': {
        const a = analog('A');
        if (a >= parameter('onThreshold')) block.state.q = true;
        else if (a < parameter('offThreshold')) block.state.q = false;
        block.outputs.Q = block.state.q ?? false;
        break;
      }
      case 'ANALOG_RAMP': {
        const a = analog('A');
        let current = Number(block.state.current ?? a);
        if (a > current) current = Math.min(a, current + parameter('riseRate') * (deltaMs / 1000));
        else if (a < current) current = Math.max(a, current - parameter('fallRate') * (deltaMs / 1000));
        block.state.current = current;
        block.outputs.Q = current;
        break;
      }
      case 'PI_CONTROLLER': {
        const sp = analog('SP');
        const pv = analog('PV');
        const reset = digital('R');
        const error = sp - pv;
        const p = parameter('kp') * error;
        let integral = reset ? 0 : Number(block.state.integral ?? 0) + parameter('ki') * error * (deltaMs / 1000);
        const min = parameter('min');
        const max = parameter('max');
        integral = Math.max(min - p, Math.min(max - p, integral));
        block.state.integral = integral;
        block.outputs.Q = Math.max(min, Math.min(max, p + integral));
        break;
      }
      case 'PWM': {
        const a = Math.max(0, Math.min(100, analog('A')));
        const period = parameter('period');
        const phase = (Number(block.state.phase ?? 0) + deltaMs) % period;
        block.state.phase = phase;
        block.outputs.Q = phase < (a / 100 * period);
        break;
      }
      case 'ANALOG_FILTER': {
        const a = analog('A');
        const timeConstant = parameter('timeConstant');
        const alpha = timeConstant + deltaMs > 0 ? deltaMs / (timeConstant + deltaMs) : 1;
        const prev = Number(block.state.filtered ?? a);
        const filtered = alpha * a + (1 - alpha) * prev;
        block.state.filtered = filtered;
        block.outputs.Q = filtered;
        break;
      }
      case 'MIN_MAX': {
        const a = analog('A');
        const r = digital('R');
        let minVal = Number(block.state.min ?? a);
        let maxVal = Number(block.state.max ?? a);
        if (r || block.state.min === undefined) {
          minVal = a;
          maxVal = a;
        } else {
          minVal = Math.min(minVal, a);
          maxVal = Math.max(maxVal, a);
        }
        block.state.min = minVal;
        block.state.max = maxVal;
        block.outputs.MIN = minVal;
        block.outputs.MAX = maxVal;
        break;
      }
      case 'AVERAGE': {
        const a = analog('A');
        const samplesCount = parameter('samples');
        const buffer: number[] = ((block.state as any).buffer) ?? [];
        buffer.push(a);
        while (buffer.length > samplesCount) buffer.shift();
        (block.state as any).buffer = buffer;
        const sum = buffer.reduce((acc, val) => acc + val, 0);
        block.outputs.Q = buffer.length > 0 ? sum / buffer.length : 0;
        break;
      }
      case 'MATH_ERROR': {
        const target = block.params.targetBlock as string;
        block.outputs.Q = target ? this.diagnostics.some(d => d.includes(target)) : false;
        break;
      }
      case 'DATA_LOG': {
        const a = analog('A');
        const en = digital('EN');
        const r = digital('R');
        const interval = parameter('interval');
        const maxSamples = parameter('maxSamples');
        
        let samples: {t: number, v: number}[] = ((block.state as any).samples) ?? [];
        if (r) samples = [];
        
        if (en) {
          const lastSample = Number(block.state.lastSample ?? -interval);
          if (this.timeMs - lastSample >= interval) {
            samples.push({ t: this.timeMs, v: a });
            if (samples.length > maxSamples) samples.shift();
            block.state.lastSample = this.timeMs;
          }
        }
        
        (block.state as any).samples = samples;
        block.outputs.Q = en;
        break;
      }
      case 'ON_OFF_DELAY': {
        let q = block.state.q ?? false;
        let et = 0;
        if (A) {
          block.state.offElapsed = 0;
          if (!q) {
            const elapsed = Math.min(parameter('onDelay'), Number(block.state.onElapsed ?? 0) + deltaMs);
            block.state.onElapsed = elapsed;
            et = elapsed;
            if (elapsed >= parameter('onDelay')) q = true;
          }
        } else {
          block.state.onElapsed = 0;
          if (q) {
            const elapsed = Math.min(parameter('offDelay'), Number(block.state.offElapsed ?? 0) + deltaMs);
            block.state.offElapsed = elapsed;
            et = elapsed;
            if (elapsed >= parameter('offDelay')) q = false;
          }
        }
        block.state.q = q;
        block.outputs.Q = q;
        block.outputs.ET = et;
        break;
      }
      case 'RETENTIVE_TON': {
        if (digital('R')) {
          block.state.elapsed = 0;
        } else if (A) {
          block.state.elapsed = Math.min(parameter('duration'), Number(block.state.elapsed ?? 0) + deltaMs);
        }
        block.outputs.ET = block.state.elapsed ?? 0;
        block.outputs.Q = Number(block.outputs.ET) >= parameter('duration');
        break;
      }
      case 'PULSE_TIMER': {
        if (A && !block.state.lastA && !block.state.active) {
          block.state.active = true;
          block.state.elapsed = 0;
        }
        if (block.state.active) {
          block.state.elapsed = Math.min(parameter('duration'), Number(block.state.elapsed ?? 0) + deltaMs);
          if (block.state.elapsed >= parameter('duration')) block.state.active = false;
        }
        block.state.lastA = A;
        block.outputs.Q = block.state.active === true;
        break;
      }
      case 'EDGE_PULSE_TIMER': {
        if (digital('R')) {
          block.state.active = false;
        } else if (A && !block.state.lastA) {
          block.state.active = true;
          block.state.elapsed = 0;
        }
        if (block.state.active) {
          block.state.elapsed = Math.min(parameter('duration'), Number(block.state.elapsed ?? 0) + deltaMs);
          if (block.state.elapsed >= parameter('duration')) block.state.active = false;
        }
        block.state.lastA = A;
        block.outputs.Q = block.state.active === true;
        break;
      }
      case 'RANDOM': {
        if (!A) {
          block.state.active = false;
          block.outputs.Q = false;
        } else {
          if (block.state.rng === undefined) {
            block.state.rng = parameter('seed');
            block.state.nextSwitch = 0;
            block.state.elapsed = 0;
            block.outputs.Q = false;
          }
          if (!block.state.active) {
            block.state.active = true;
            block.state.elapsed = 0;
            block.state.nextSwitch = 0;
          }
          block.state.elapsed = Number(block.state.elapsed ?? 0) + deltaMs;
          if (Number(block.state.elapsed) >= Number(block.state.nextSwitch)) {
            block.outputs.Q = !block.outputs.Q;
            block.state.elapsed = 0;
            block.state.rng = (Number(block.state.rng) * 1103515245 + 12345) & 0x7fffffff;
            const fraction = Number(block.state.rng) / 0x7fffffff;
            const minD = parameter('minDelay');
            const maxD = parameter('maxDelay');
            block.state.nextSwitch = minD + fraction * (maxD - minD);
          }
        }
        break;
      }
      case 'STAIRWAY_SWITCH': {
        if (A && !block.state.lastA) {
          block.state.remaining = parameter('duration');
        }
        if (Number(block.state.remaining ?? 0) > 0) {
          block.state.remaining = Number(block.state.remaining) - deltaMs;
          block.outputs.Q = true;
        } else {
          block.state.remaining = 0;
          block.outputs.Q = false;
        }
        block.state.lastA = A;
        break;
      }
      case 'MULTIFUNCTION_SWITCH': {
        if (digital('R')) {
          block.state.mode = 'idle';
          block.state.held = 0;
          block.outputs.Q = false;
        } else {
          if (A) {
            block.state.held = Number(block.state.held ?? 0) + deltaMs;
            if (block.state.mode !== 'maintained' && block.state.held >= parameter('holdTime')) {
              block.state.mode = 'maintained';
            }
          } else {
            if (Number(block.state.held ?? 0) > 0 && Number(block.state.held ?? 0) < parameter('holdTime') && block.state.mode !== 'maintained') {
              block.state.mode = 'timed';
              block.state.remaining = parameter('duration');
            }
            block.state.held = 0;
            if (block.state.mode === 'maintained') {
              block.state.mode = 'idle';
            }
          }
          if (block.state.mode === 'timed') {
            block.state.remaining = Number(block.state.remaining ?? 0) - deltaMs;
            if (block.state.remaining <= 0) block.state.mode = 'idle';
          }
          block.outputs.Q = block.state.mode === 'maintained' || block.state.mode === 'timed';
        }
        break;
      }
      case 'WEEKLY_TIMER': {
        const weekMs = 604800000;
        const dayMs = 86400000;
        const currentMs = this.timeMs % weekMs;
        const currentDay = Math.floor(currentMs / dayMs) + 1;
        const timeOfDay = currentMs % dayMs;
        const days = String(block.params.days).split(',').map(Number);
        
        const parseTime = (timeStr: string) => {
          const [h, m] = timeStr.split(':').map(Number);
          return (h * 60 + m) * 60000;
        };
        const start = parseTime(String(block.params.startTime));
        const end = parseTime(String(block.params.endTime));
        
        block.outputs.Q = days.includes(currentDay) && timeOfDay >= start && timeOfDay < end;
        break;
      }
      case 'YEARLY_TIMER': {
        const yearMs = 31536000000;
        const dayMs = 86400000;
        const currentMs = this.timeMs % yearMs;
        const currentDay = Math.floor(currentMs / dayMs);
        
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const parseDate = (dateStr: string) => {
          const [m, d] = dateStr.split('-').map(Number);
          let days = 0;
          for (let i = 0; i < m - 1; i++) days += daysInMonth[i];
          return days + d - 1;
        };
        const startDay = parseDate(String(block.params.startDate));
        const endDay = parseDate(String(block.params.endDate));
        
        if (startDay <= endDay) {
          block.outputs.Q = currentDay >= startDay && currentDay <= endDay;
        } else {
          block.outputs.Q = currentDay >= startDay || currentDay <= endDay;
        }
        break;
      }
      case 'STOPWATCH': {
        if (digital('R')) {
          block.state.elapsed = 0;
        } else if (A) {
          block.state.elapsed = Number(block.state.elapsed ?? 0) + deltaMs;
        }
        block.outputs.ET = block.state.elapsed ?? 0;
        break;
      }
      case 'AND_EDGE': {
        const result = A && B;
        block.outputs.Q = result && !block.state.lastResult;
        block.state.lastResult = result;
        break;
      }
      case 'NAND_EDGE': {
        const result = !(A && B);
        block.outputs.Q = result && !block.state.lastResult;
        block.state.lastResult = result;
        break;
      }
      case 'CURSOR_KEY':
      case 'TD_FUNCTION_KEY':
      case 'SHIFT_REGISTER_BIT':
        block.outputs.Q = block.value ?? false;
        break;
      case 'OPEN_CONNECTOR':
        break;
      case 'MESSAGE_TEXT':
        block.outputs.TEXT = digital('EN') ? (block.params.message as string) : '';
        break;
      case 'SOFTKEY':
        if (block.params.mode === 'toggle') {
          const val = block.value ?? false;
          if (val && !block.state.lastValue) {
            block.state.q = !(block.state.q ?? false);
          }
          block.state.lastValue = val;
          block.outputs.Q = block.state.q ?? false;
        } else {
          block.outputs.Q = block.value ?? false;
        }
        break;
      case 'SHIFT_REGISTER': {
        const clk = digital('CLK');
        let bits = (block.state.bits as number) ?? 0;
        const length = parameter('length') || 8;
        if (clk && !block.state.lastClk) {
          const dir = digital('DIR');
          const d = digital('D');
          if (dir) {
            bits = ((bits << 1) | (d ? 1 : 0)) & ((1 << length) - 1);
          } else {
            bits = (bits >>> 1) | (d ? (1 << (length - 1)) : 0);
          }
        }
        block.state.lastClk = clk;
        if (digital('R')) {
          bits = 0;
        }
        block.state.bits = bits;
        
        const dir = digital('DIR');
        block.outputs.Q = dir ? ((bits & (1 << (length - 1))) !== 0) : ((bits & 1) !== 0);
        break;
      }
      case 'HOURS_COUNTER': {
        if (digital('R')) {
          block.state.elapsed = 0;
        } else if (A) {
          block.state.elapsed = (Number(block.state.elapsed) || 0) + deltaMs;
        }
        const cv = (Number(block.state.elapsed) || 0) / 3600000;
        block.outputs.CV = cv;
        block.outputs.Q = cv >= parameter('limit');
        break;
      }
      case 'FREQUENCY_TRIGGER': {
        const edges: number[] = ((block.state as any).edges) ?? [];
        if (A && !block.state.lastA) {
          edges.push(this.timeMs);
        }
        block.state.lastA = A;
        
        const windowMs = parameter('window');
        const threshold = parameter('threshold');
        const cutoff = this.timeMs - windowMs;
        
        while (edges.length > 0 && edges[0] < cutoff) {
          edges.shift();
        }
        (block.state as any).edges = edges;
        
        const cv = edges.length / (windowMs / 1000);
        block.outputs.CV = cv;
        block.outputs.Q = cv >= threshold;
        break;
      }
      case 'ASTRONOMICAL_CLOCK': {
        const lat = parameter('latitude') || 0;
        const msInDay = 24 * 60 * 60 * 1000;
        const currentHour = ((this.timeMs % msInDay) / msInDay) * 24;
        const sunrise = 6 - (lat / 15);
        const sunset = 18 + (lat / 15);
        block.outputs.Q = currentHour >= sunrise && currentHour < sunset;
        break;
      }
      case 'SERVO_AXIS': {
        const target = analog('A');
        const speed = analog('SPEED');
        let current = Number(block.state.current ?? 0);
        const maxStep = speed * (deltaMs / 1000);
        if (current < target) current = Math.min(target, current + maxStep);
        else if (current > target) current = Math.max(target, current - maxStep);
        block.state.current = current;
        block.outputs.Q = current;
        break;
      }
      case 'DC_MOTOR': {
        const voltage = analog('V');
        const load = analog('LOAD');
        const inertia = parameter('inertia') || 0.1;
        const friction = parameter('friction') || 0.01;
        let rpm = Number(block.state.rpm ?? 0);
        let pos = Number(block.state.pos ?? 0);
        const torque = voltage - load - friction * rpm;
        const alpha = torque / inertia;
        rpm = rpm + alpha * (deltaMs / 1000);
        pos = pos + (rpm / 60) * (deltaMs / 1000) * 360;
        block.state.rpm = rpm;
        block.state.pos = pos;
        block.outputs.RPM = rpm;
        block.outputs.POS = pos;
        break;
      }
      case 'KINEMATICS_2D': {
        const theta1 = analog('THETA1') * (Math.PI / 180);
        const theta2 = analog('THETA2') * (Math.PI / 180);
        const l1 = parameter('L1');
        const l2 = parameter('L2');
        block.outputs.X = l1 * Math.cos(theta1) + l2 * Math.cos(theta1 + theta2);
        block.outputs.Y = l1 * Math.sin(theta1) + l2 * Math.sin(theta1 + theta2);
        break;
      }
      case 'INV_KINEMATICS_2D': {
        const x = analog('X');
        const y = analog('Y');
        const l1 = parameter('L1');
        const l2 = parameter('L2');
        const distSq = x*x + y*y;
        const theta2 = Math.acos(Math.max(-1, Math.min(1, (distSq - l1*l1 - l2*l2) / (2 * l1 * l2))));
        const theta1 = Math.atan2(y, x) - Math.atan2(l2 * Math.sin(theta2), l1 + l2 * Math.cos(theta2));
        block.outputs.THETA1 = (isNaN(theta1) ? 0 : theta1) * (180 / Math.PI);
        block.outputs.THETA2 = (isNaN(theta2) ? 0 : theta2) * (180 / Math.PI);
        break;
      }
      case 'PID_CONTROLLER': {
        const enConnected = (this.incoming.get(block.id) ?? []).some(c => c.toPin === 'EN');
        const en = enConnected ? digital('EN') : true;
        if (!en) {
          block.state.integral = 0;
          block.state.lastError = 0;
          block.outputs.CV = 0;
          break;
        }
        const error = analog('SP') - analog('PV');
        const dt = deltaMs / 1000;
        let integral = Number(block.state.integral ?? 0);
        const lastError = Number(block.state.lastError ?? 0);
        const p = parameter('kp') * error;
        const d = parameter('kd') * (dt > 0 ? (error - lastError) / dt : 0);
        const ki = parameter('ki');
        const min = parameter('min');
        const max = parameter('max');
        let cv = p + (ki * integral) + d;
        if (cv > max) cv = max;
        else if (cv < min) cv = min;
        else integral += error * dt;
        block.state.integral = integral;
        block.state.lastError = error;
        block.outputs.CV = cv;
        break;
      }
      case 'TRANSFER_FUNCTION': {
        const a = analog('A');
        const k = parameter('gain');
        const tau = parameter('tau');
        const dt = deltaMs;
        const alpha = tau + dt > 0 ? dt / (tau + dt) : 1;
        const prev = Number(block.state.filtered ?? 0);
        const filtered = alpha * (a * k) + (1 - alpha) * prev;
        block.state.filtered = filtered;
        block.outputs.Q = filtered;
        break;
      }
      case 'SIGNAL_GENERATOR': {
        const en = digital('EN');
        if (!en) { block.outputs.Q = 0; break; }
        const type = (block.params.type as string) || 'sine';
        let phase = Number(block.state.phase ?? 0) + (parameter('freq') * deltaMs / 1000);
        phase = phase % 1;
        block.state.phase = phase;
        let out = 0;
        if (type === 'square') out = phase < 0.5 ? 1 : -1;
        else if (type === 'tri') out = phase < 0.5 ? (phase * 4 - 1) : (3 - phase * 4);
        else out = Math.sin(phase * 2 * Math.PI);
        block.outputs.Q = (out * parameter('amp')) + parameter('offset');
        break;
      }
      case 'MATH_EXPRESSION': {
        const expr = (block.params.expr as string) || 'A + B';
        try {
          if (!(block.state as any).func || (block.state as any).lastExpr !== expr) {
            (block.state as any).func = new Function('A', 'B', 'C', 'Math', `
              const {sin, cos, tan, abs, sqrt, min, max, PI, pow, round} = Math;
              return ${expr};
            `);
            (block.state as any).lastExpr = expr;
          }
          block.outputs.Q = (block.state as any).func(analog('A'), analog('B'), analog('C'), Math);
        } catch(e) {
          block.outputs.Q = 0;
          if (this.timeMs % 1000 === 0) this.diagnostics.push(`Math Expr error: ${e instanceof Error ? e.message : 'Invalid formula'}`);
        }
        break;
      }
      case 'SCAN_DELAY':
      case 'ANALOG_SCAN_DELAY': break;
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
