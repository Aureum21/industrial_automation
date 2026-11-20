/**
 * Arduino C++ Code Generator for AutomationHub
 * Generates standalone, non-blocking, library-free .ino sketches from visual circuits.
 *
 * The sketch reproduces the browser simulator scan for scan: blocks run in the same order
 * (LogicEngine graph rules), every signal is a global that keeps its value between scans,
 * and each block is a direct port of its LogicEngine implementation. tests/arduino_parity.test.ts
 * compiles generated sketches with a host C++ compiler and compares them with the engine.
 */

import type { BlockType, CircuitBlock, CircuitDocument } from '../automation/types.ts';
import { BLOCK_CATALOG } from '../automation/catalog.ts';
import { parseExpression, type ExpressionNode } from '../automation/expression.ts';

export type ArduinoBoardId = 'uno' | 'nano' | 'mega' | 'esp32' | 'pico';

export interface BoardPreset {
  id: ArduinoBoardId;
  name: string;
  description: string;
  defaultBaudRate: number;
  adcResolutionBits: number;
  adcMaxRaw: number;
  operatingVoltage: number;
  availableDigitalPins: string[];
  availableAnalogInPins: string[];
  availablePwmPins: string[];
  builtinLedPin: string;
}

export const BOARD_PRESETS: Record<ArduinoBoardId, BoardPreset> = {
  uno: {
    id: 'uno',
    name: 'Arduino Uno (ATmega328P)',
    description: 'Standard 5V AVR microcontroller. 10-bit ADC (0-1023), 16MHz clock.',
    defaultBaudRate: 115200,
    adcResolutionBits: 10,
    adcMaxRaw: 1023,
    operatingVoltage: 5.0,
    availableDigitalPins: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
    availableAnalogInPins: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
    availablePwmPins: ['3', '5', '6', '9', '10', '11'],
    builtinLedPin: '13',
  },
  nano: {
    id: 'nano',
    name: 'Arduino Nano (ATmega328P)',
    description: 'Compact breadboard-friendly Uno equivalent with extra analog inputs A6/A7.',
    defaultBaudRate: 115200,
    adcResolutionBits: 10,
    adcMaxRaw: 1023,
    operatingVoltage: 5.0,
    availableDigitalPins: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
    availableAnalogInPins: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'],
    availablePwmPins: ['3', '5', '6', '9', '10', '11'],
    builtinLedPin: '13',
  },
  mega: {
    id: 'mega',
    name: 'Arduino Mega 2560 (ATmega2560)',
    description: 'High I/O capacity microcontroller. 54 digital I/O, 16 analog inputs, 4 UARTs.',
    defaultBaudRate: 115200,
    adcResolutionBits: 10,
    adcMaxRaw: 1023,
    operatingVoltage: 5.0,
    availableDigitalPins: [
      '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13',
      '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32',
      '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43',
      '44', '45', '46', '47', '48', '49', '50', '51', '52', '53',
    ],
    availableAnalogInPins: [
      'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7',
      'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15',
    ],
    availablePwmPins: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '44', '45', '46'],
    builtinLedPin: '13',
  },
  esp32: {
    id: 'esp32',
    name: 'ESP32 (NodeMCU / DevKit / WROOM)',
    description: '32-bit dual-core 240MHz MCU with 3.3V logic and 12-bit ADC.',
    defaultBaudRate: 115200,
    adcResolutionBits: 12,
    adcMaxRaw: 4095,
    operatingVoltage: 3.3,
    availableDigitalPins: ['4', '5', '12', '13', '14', '15', '18', '19', '21', '22', '23', '25', '26', '27', '32', '33'],
    availableAnalogInPins: ['32', '33', '34', '35', '36', '39'],
    availablePwmPins: ['4', '5', '12', '13', '14', '15', '18', '19', '21', '22', '23', '25', '26', '27'],
    builtinLedPin: '2',
  },
  pico: {
    id: 'pico',
    name: 'Raspberry Pi Pico (RP2040)',
    description: 'Dual-core Cortex-M0+ 133MHz MCU with 3.3V logic and 12-bit ADC.',
    defaultBaudRate: 115200,
    adcResolutionBits: 12,
    adcMaxRaw: 4095,
    operatingVoltage: 3.3,
    availableDigitalPins: [
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
      '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22',
    ],
    availableAnalogInPins: ['26', '27', '28'],
    availablePwmPins: [
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
      '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22',
    ],
    builtinLedPin: '25',
  },
};


export type PinElectricalMode = 'INPUT_PULLUP' | 'INPUT' | 'OUTPUT' | 'ANALOG_INPUT' | 'PWM_OUTPUT';

export interface PinAssignment {
  blockId: string;
  pinNumber: string;
  mode: PinElectricalMode;
  /** Digital: pin level is inverted (INPUT_PULLUP buttons, active-low relay modules). */
  invertLogic: boolean;
  comment?: string;
  /** Analog only: engineering range that maps to the ADC range (inputs) or PWM 0..255 (outputs). Default 0..100. */
  scaleMin?: number;
  scaleMax?: number;
}

export interface ArduinoExportConfig {
  board: ArduinoBoardId;
  scanCycleMs: number;
  enableSerialTelemetry: boolean;
  telemetryIntervalMs: number;
  pinAssignments: Record<string, PinAssignment>;
}

export interface ArduinoExportIssue {
  blockId: string;
  message: string;
}

const isReader = (type: BlockType) => type === 'INPUT' || type === 'NC_INPUT' || type === 'ANALOG_INPUT';
const isWriter = (type: BlockType) => type === 'OUTPUT' || type === 'FLAG' || type === 'ANALOG_OUTPUT' || type === 'ANALOG_FLAG';
/** Engine rule: inputs of these blocks do not create same-scan dependencies. */
const isDelayedInput = (type: BlockType) =>
  type === 'SCAN_DELAY' || type === 'ANALOG_SCAN_DELAY' || type === 'TRANSFER_FUNCTION' || type === 'ANALOG_RAMP';

const tagKey = (block: CircuitBlock) => `${BLOCK_CATALOG[block.type].outputs[0]?.kind}:${block.tag}`;

/** Readers with a tag that some writer publishes are internal signals, not physical pins. */
function tagWriterFor(doc: CircuitDocument, block: CircuitBlock): CircuitBlock | undefined {
  if (!block.tag || !isReader(block.type)) return undefined;
  return doc.blocks.find((other) => other.id !== block.id && other.tag === block.tag && isWriter(other.type) && tagKey(other) === tagKey(block));
}

/** Blocks that need a physical pin: untagged-reader inputs and all outputs. */
export function needsPhysicalPin(doc: CircuitDocument, block: CircuitBlock): boolean {
  if (isReader(block.type)) return !tagWriterFor(doc, block);
  return block.type === 'OUTPUT' || block.type === 'ANALOG_OUTPUT';
}

/**
 * Auto-allocates pins. Analog outputs are placed first so PWM-capable pins are not used up by
 * plain digital I/O, and digital I/O prefers pins without PWM. Blocks that cannot get a pin are
 * left unassigned and reported by analyzeArduinoExport.
 */
export function autoAssignPins(doc: CircuitDocument, boardId: ArduinoBoardId): Record<string, PinAssignment> {
  const preset = BOARD_PRESETS[boardId] ?? BOARD_PRESETS.uno;
  const used = new Set<string>();
  const take = (pool: string[]) => {
    const pin = pool.find((candidate) => !used.has(candidate));
    if (pin) used.add(pin);
    return pin;
  };
  const pwm = new Set(preset.availablePwmPins);
  const digitalPool = [...preset.availableDigitalPins.filter((pin) => !pwm.has(pin)), ...preset.availableDigitalPins.filter((pin) => pwm.has(pin))];
  const assignments: Record<string, PinAssignment> = {};
  const physical = doc.blocks.filter((block) => needsPhysicalPin(doc, block));
  const ordered = [...physical.filter((b) => b.type === 'ANALOG_OUTPUT'), ...physical.filter((b) => b.type !== 'ANALOG_OUTPUT')];

  for (const block of ordered) {
    const comment = block.label || block.id;
    let pin: string | undefined;
    let mode: PinElectricalMode;
    let invertLogic = false;
    switch (block.type) {
      case 'INPUT':
      case 'NC_INPUT':
        pin = take(digitalPool);
        mode = 'INPUT_PULLUP';
        invertLogic = true; // pushbutton to GND: pressed reads LOW
        break;
      case 'OUTPUT':
        pin = take(digitalPool);
        mode = 'OUTPUT';
        break;
      case 'ANALOG_INPUT':
        pin = take(preset.availableAnalogInPins);
        mode = 'ANALOG_INPUT';
        break;
      default:
        pin = take(preset.availablePwmPins);
        mode = 'PWM_OUTPUT';
    }
    if (!pin) continue;
    assignments[block.id] = {
      blockId: block.id,
      pinNumber: pin,
      mode,
      invertLogic,
      comment,
      ...(mode === 'ANALOG_INPUT' || mode === 'PWM_OUTPUT' ? { scaleMin: 0, scaleMax: 100 } : {}),
    };
  }
  return assignments;
}

/** Name of the global variable holding `pin` of `blockId` in the generated sketch (used by tests). */
export function arduinoSignalName(doc: CircuitDocument, blockId: string, pin: string): string {
  return `sig_${buildIdentifiers(doc).get(blockId)}_${pin}`;
}

/** C++ identifiers for block IDs, unique within the document. */
function buildIdentifiers(doc: CircuitDocument): Map<string, string> {
  const result = new Map<string, string>();
  const taken = new Set<string>();
  for (const block of doc.blocks) {
    const base = sanitizeCppIdent(block.id);
    let ident = base;
    for (let n = 2; taken.has(ident); n++) ident = `${base}_${n}`;
    taken.add(ident);
    result.set(block.id, ident);
  }
  return result;
}

export function sanitizeCppIdent(id: string): string {
  const clean = id.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[a-zA-Z_]/.test(clean) ? clean : `b_${clean}`;
}

/** Execution order, using exactly the LogicEngine graph rules (Kahn's algorithm, same tie-breaking). */
export function sortBlocksTopologically(doc: CircuitDocument): CircuitBlock[] {
  const byId = new Map(doc.blocks.map((block) => [block.id, block]));
  const outgoing = new Map<string, Set<string>>();
  const counts = new Map<string, number>();
  for (const block of doc.blocks) {
    outgoing.set(block.id, new Set());
    counts.set(block.id, 0);
  }
  const depend = (from: string, to: string) => {
    const target = byId.get(to);
    if (!target || isDelayedInput(target.type)) return;
    const next = outgoing.get(from);
    if (next && !next.has(to)) {
      next.add(to);
      counts.set(to, (counts.get(to) ?? 0) + 1);
    }
  };
  for (const connection of doc.connections) {
    if (byId.has(connection.fromBlockId)) depend(connection.fromBlockId, connection.toBlockId);
  }
  for (const block of doc.blocks) {
    const writer = tagWriterFor(doc, block);
    if (writer) depend(writer.id, block.id);
  }
  const order = [...counts].filter(([, count]) => count === 0).map(([id]) => id);
  for (let index = 0; index < order.length; index++) {
    for (const next of outgoing.get(order[index]) ?? []) {
      const count = (counts.get(next) ?? 0) - 1;
      counts.set(next, count);
      if (count === 0) order.push(next);
    }
  }
  if (order.length !== doc.blocks.length) {
    throw new Error('The circuit contains a feedback loop without a scan delay; it cannot be exported.');
  }
  return order.map((id) => byId.get(id)!);
}

// ---------------------------------------------------------------------------
// Support matrix
// ---------------------------------------------------------------------------

const SIMULATION_ONLY = new Set<BlockType>(['SERVO_AXIS', 'DC_MOTOR', 'KINEMATICS_2D', 'INV_KINEMATICS_2D']);
const NOT_YET_EXPORTABLE = new Set<BlockType>([
  'RANDOM', 'STAIRWAY_SWITCH', 'MULTIFUNCTION_SWITCH', 'WEEKLY_TIMER', 'YEARLY_TIMER', 'ASTRONOMICAL_CLOCK',
  'FREQUENCY_TRIGGER', 'SHIFT_REGISTER_BIT', 'MESSAGE_TEXT', 'SOFTKEY',
  'CURSOR_KEY', 'TD_FUNCTION_KEY', 'MATH_ERROR', 'UDF', 'NETWORK_INPUT', 'NETWORK_ANALOG_INPUT',
  'NETWORK_OUTPUT', 'NETWORK_ANALOG_OUTPUT',
]);
const MAX_AVERAGE_SAMPLES = 256;

export type ArduinoSupport = 'supported' | 'simulation-only' | 'not-yet';
export function arduinoSupport(type: BlockType): ArduinoSupport {
  return SIMULATION_ONLY.has(type) ? 'simulation-only' : NOT_YET_EXPORTABLE.has(type) ? 'not-yet' : 'supported';
}

/** Problems that would make the exported sketch wrong. Each one becomes a #error in the sketch. */
export function analyzeArduinoExport(doc: CircuitDocument, config?: Pick<ArduinoExportConfig, 'pinAssignments'>): ArduinoExportIssue[] {
  const issues: ArduinoExportIssue[] = [];
  for (const block of doc.blocks) {
    const name = `${block.label || block.id} (${block.type})`;
    if (SIMULATION_ONLY.has(block.type)) {
      issues.push({ blockId: block.id, message: `${name} models a physical machine for simulation; it has no hardware equivalent. Remove it before exporting.` });
    } else if (NOT_YET_EXPORTABLE.has(block.type)) {
      issues.push({ blockId: block.id, message: `${name} is not supported by the Arduino exporter yet.` });
    } else if (block.type === 'AVERAGE' && Number(block.params.samples) > MAX_AVERAGE_SAMPLES) {
      issues.push({ blockId: block.id, message: `${name} averages ${block.params.samples} samples; the Arduino export allows at most ${MAX_AVERAGE_SAMPLES} to fit in RAM.` });
    } else if (block.type === 'MATH_EXPRESSION') {
      try {
        parseExpression(String(block.params.expr || 'A + B'));
      } catch (error) {
        issues.push({ blockId: block.id, message: `${name} has an invalid formula: ${(error as Error).message}` });
      }
    }
    if (config && needsPhysicalPin(doc, block) && !config.pinAssignments[block.id]?.pinNumber) {
      issues.push({ blockId: block.id, message: `${name} has no pin assigned (the board may be out of suitable pins).` });
    }
  }
  try {
    sortBlocksTopologically(doc);
  } catch (error) {
    issues.push({ blockId: '', message: (error as Error).message });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// C++ emission helpers
// ---------------------------------------------------------------------------

/** A finite C++ float literal. */
function f(value: unknown): string {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0.0f';
  const text = String(number);
  return /[.eE]/.test(text) ? `${text}f` : `${text}.0f`;
}

function ul(value: unknown): string {
  return `${Math.max(0, Math.round(Number(value) || 0))}UL`;
}

/** Text safe inside a C string literal. */
function cString(text: string): string {
  return text.replace(/[\r\n]+/g, ' ').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Text safe inside a C block comment. */
function cComment(text: string): string {
  return text.replace(/[\r\n]+/g, ' ').replace(/\*\//g, '* /');
}

const MATH_FUNCTIONS: Record<string, (args: string[]) => string> = {
  abs: ([x]) => `fabs(${x})`,
  sqrt: ([x]) => `sqrt(${x})`,
  cbrt: ([x]) => `cbrt(${x})`,
  exp: ([x]) => `exp(${x})`,
  log: ([x]) => `log(${x})`,
  log10: ([x]) => `log10(${x})`,
  log2: ([x]) => `(log(${x}) / log(2.0))`,
  sin: ([x]) => `sin(${x})`,
  cos: ([x]) => `cos(${x})`,
  tan: ([x]) => `tan(${x})`,
  asin: ([x]) => `asin(${x})`,
  acos: ([x]) => `acos(${x})`,
  atan: ([x]) => `atan(${x})`,
  atan2: ([y, x]) => `atan2(${y}, ${x})`,
  round: ([x]) => `ah_round(${x})`,
  floor: ([x]) => `floor(${x})`,
  ceil: ([x]) => `ceil(${x})`,
  sign: ([x]) => `ah_sign(${x})`,
  pow: ([a, b]) => `pow(${a}, ${b})`,
  min: (args) => args.reduce((acc, arg) => `ah_min(${acc}, ${arg})`),
  max: (args) => args.reduce((acc, arg) => `ah_max(${acc}, ${arg})`),
  hypot: (args) => `sqrt(${args.map((arg) => `ah_sq(${arg})`).join(' + ')})`,
  clamp: ([x, lo, hi]) => `ah_min(ah_max(${x}, ${lo}), ${hi})`,
};

/** Translates a parsed MATH_EXPRESSION into a C++ float expression. */
function expressionToCpp(node: ExpressionNode, vars: { A: string; B: string; C: string }): string {
  const go = (n: ExpressionNode) => expressionToCpp(n, vars);
  switch (node.kind) {
    case 'number':
      return f(node.value);
    case 'variable':
      return `(${vars[node.name]})`;
    case 'unary':
      return node.op === '!' ? `((${go(node.operand)}) == 0.0f ? 1.0f : 0.0f)` : `(${node.op}${go(node.operand)})`;
    case 'conditional':
      return `((${go(node.test)}) != 0.0f ? (${go(node.then)}) : (${go(node.otherwise)}))`;
    case 'call':
      return MATH_FUNCTIONS[node.name](node.args.map(go));
    case 'binary': {
      const a = go(node.left);
      const b = go(node.right);
      switch (node.op) {
        case '^': return `pow(${a}, ${b})`;
        case '%': return `fmod(${a}, ${b})`;
        case '&&': return `(((${a}) != 0.0f && (${b}) != 0.0f) ? 1.0f : 0.0f)`;
        case '||': return `(((${a}) != 0.0f || (${b}) != 0.0f) ? 1.0f : 0.0f)`;
        case '<': case '<=': case '>': case '>=': case '==': case '!=':
          return `((${a}) ${node.op} (${b}) ? 1.0f : 0.0f)`;
        default:
          return `(${a} ${node.op} ${b})`;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Sketch generation
// ---------------------------------------------------------------------------

export function generateArduinoSketch(doc: CircuitDocument, config: ArduinoExportConfig): string {
  const preset = BOARD_PRESETS[config.board] ?? BOARD_PRESETS.uno;
  const issues = analyzeArduinoExport(doc, config);
  const idents = buildIdentifiers(doc);
  const id = (blockId: string) => idents.get(blockId)!;
  const sig = (blockId: string, pin: string) => `sig_${id(blockId)}_${pin}`;
  const blocks = issues.some((issue) => issue.message.includes('feedback loop')) ? doc.blocks : sortBlocksTopologically(doc);

  const incoming = new Map<string, Map<string, { fromBlockId: string; fromPin: string }>>();
  for (const connection of doc.connections) {
    if (!incoming.has(connection.toBlockId)) incoming.set(connection.toBlockId, new Map());
    incoming.get(connection.toBlockId)!.set(connection.toPin, connection);
  }
  const connected = (block: CircuitBlock, pin: string) => incoming.get(block.id)?.has(pin) ?? false;
  /** Current value of an input pin: the driving signal, or the engine default for an unwired pin. */
  const input = (block: CircuitBlock, pin: string): string => {
    const source = incoming.get(block.id)?.get(pin);
    if (source) return sig(source.fromBlockId, source.fromPin);
    const kind = BLOCK_CATALOG[block.type].inputs.find((candidate) => candidate.id === pin)?.kind;
    return kind === 'analog' ? '0.0f' : 'false';
  };
  const num = (block: CircuitBlock, key: string) => {
    const definition = BLOCK_CATALOG[block.type].parameters.find((parameter) => parameter.key === key);
    return Number(block.params[key] ?? definition?.defaultValue ?? 0);
  };

  const globals: string[] = [];
  const state: string[] = [];
  const logic: string[] = [];
  const scanStart: string[] = [];
  const scanEnd: string[] = [];
  const pinConstants: string[] = [];
  const pinSetup: string[] = [];
  const telemetry: string[] = [];

  // Signal globals with the engine's initial values.
  for (const block of doc.blocks) {
    const definition = BLOCK_CATALOG[block.type];
    for (const pin of definition.outputs) {
      if (pin.kind === 'text') continue;
      let initial = pin.kind === 'analog' ? '0.0f' : 'false';
      if (block.type === 'COUNTER' && pin.id === 'Q') initial = num(block, 'limit') <= 0 ? 'true' : 'false';
      globals.push(`${pin.kind === 'analog' ? 'float' : 'bool '} ${sig(block.id, pin.id)} = ${initial};`);
    }
  }

  for (const block of blocks) {
    const ident = id(block.id);
    const Q = sig(block.id, 'Q');
    const A = () => input(block, 'A');
    const B = () => input(block, 'B');
    const assignment = config.pinAssignments[block.id];
    const pinConst = `PIN_${ident.toUpperCase()}`;
    const emitPin = () => {
      if (!assignment?.pinNumber) return false;
      pinConstants.push(`const int ${pinConst} = ${assignment.pinNumber}; // ${cComment(assignment.comment || block.label || block.id)}`);
      return true;
    };
    logic.push(`  // ${block.type} ${cComment(block.label ? `"${block.label}"` : block.id)}`);

    switch (block.type) {
      case 'INPUT':
      case 'NC_INPUT':
      case 'ANALOG_INPUT': {
        const writer = tagWriterFor(doc, block);
        const invert = block.type === 'NC_INPUT' ? '!' : '';
        if (writer) {
          logic.push(`  ${Q} = ${invert}${sig(writer.id, 'Q')}; // tag "${cComment(block.tag ?? '')}"`);
        } else if (block.type === 'ANALOG_INPUT') {
          if (emitPin()) {
            const lo = assignment!.scaleMin ?? 0;
            const hi = assignment!.scaleMax ?? 100;
            pinSetup.push(`  pinMode(${pinConst}, INPUT);`);
            logic.push(`  ${Q} = (float)analogRead(${pinConst}) / ${f(preset.adcMaxRaw)} * (${f(hi)} - ${f(lo)}) + ${f(lo)};`);
          } else {
            logic.push(`  ${Q} = ${f(block.value ?? block.params.value ?? 0)}; // no pin: fixed value`);
          }
        } else if (emitPin()) {
          pinSetup.push(`  pinMode(${pinConst}, ${assignment!.mode === 'INPUT' ? 'INPUT' : 'INPUT_PULLUP'});`);
          logic.push(`  ${Q} = ${invert}(digitalRead(${pinConst}) == ${assignment!.invertLogic ? 'LOW' : 'HIGH'}); // pressed = ${assignment!.invertLogic ? 'LOW' : 'HIGH'}`);
        } else {
          logic.push(`  ${Q} = ${invert}${block.value === true ? 'true' : 'false'}; // no pin: fixed value`);
        }
        if (isReader(block.type)) telemetry.push(`  Serial.print(F(" ${cString(block.label || block.id)}=")); Serial.print(${block.type === 'ANALOG_INPUT' ? `${Q}, 2` : `${Q} ? F("ON") : F("OFF")`});`);
        break;
      }
      case 'OUTPUT':
      case 'ANALOG_OUTPUT': {
        const analog = block.type === 'ANALOG_OUTPUT';
        logic.push(`  ${Q} = ${A()};`);
        if (emitPin()) {
          pinSetup.push(`  pinMode(${pinConst}, OUTPUT);`);
          if (analog) {
            const lo = assignment!.scaleMin ?? 0;
            const hi = assignment!.scaleMax ?? 100;
            logic.push(`  analogWrite(${pinConst}, (int)constrain((${Q} - ${f(lo)}) / (${f(hi)} - ${f(lo)}) * 255.0f, 0.0f, 255.0f));`);
          } else {
            const on = assignment!.invertLogic ? 'LOW' : 'HIGH';
            const off = assignment!.invertLogic ? 'HIGH' : 'LOW';
            pinSetup.push(`  digitalWrite(${pinConst}, ${off});`);
            logic.push(`  digitalWrite(${pinConst}, ${Q} ? ${on} : ${off});`);
          }
        }
        telemetry.push(`  Serial.print(F(" ${cString(block.label || block.id)}=")); Serial.print(${analog ? `${Q}, 2` : `${Q} ? F("ON") : F("OFF")`});`);
        break;
      }
      case 'FLAG':
      case 'ANALOG_FLAG':
        logic.push(`  ${Q} = ${A()};`);
        break;
      case 'HIGH':
        logic.push(`  ${Q} = true;`);
        break;
      case 'LOW':
        logic.push(`  ${Q} = false;`);
        break;
      case 'ANALOG_CONSTANT':
        logic.push(`  ${Q} = ${f(block.value ?? block.params.value ?? 0)};`);
        break;
      case 'AND': logic.push(`  ${Q} = ${A()} && ${B()};`); break;
      case 'OR': logic.push(`  ${Q} = ${A()} || ${B()};`); break;
      case 'NOT': logic.push(`  ${Q} = !${A()};`); break;
      case 'XOR': logic.push(`  ${Q} = ${A()} != ${B()};`); break;
      case 'NAND': logic.push(`  ${Q} = !(${A()} && ${B()});`); break;
      case 'NOR': logic.push(`  ${Q} = !(${A()} || ${B()});`); break;
      case 'XNOR': logic.push(`  ${Q} = ${A()} == ${B()};`); break;
      case 'AND_EDGE':
      case 'NAND_EDGE': {
        state.push(`bool last_${ident} = false;`);
        const result = block.type === 'AND_EDGE' ? `(${A()} && ${B()})` : `!(${A()} && ${B()})`;
        logic.push(`  { bool r = ${result}; ${Q} = r && !last_${ident}; last_${ident} = r; }`);
        break;
      }
      case 'RS_LATCH':
        logic.push(`  ${Q} = ${input(block, 'R')} ? false : (${input(block, 'S')} || ${Q});`);
        break;
      case 'PULSE_RELAY':
        state.push(`bool last_${ident} = false;`);
        logic.push(`  if (${A()} && !last_${ident}) ${Q} = !${Q};`, `  last_${ident} = ${A()};`);
        break;
      case 'R_TRIG':
      case 'F_TRIG':
        state.push(`bool last_${ident} = false;`);
        logic.push(
          block.type === 'R_TRIG' ? `  ${Q} = ${A()} && !last_${ident};` : `  ${Q} = !${A()} && last_${ident};`,
          `  last_${ident} = ${A()};`,
        );
        break;
      case 'TON':
        state.push(`TON_Timer ton_${ident};`);
        logic.push(`  ton_${ident}.update(${A()}, ${ul(num(block, 'duration'))}, dt);`, `  ${Q} = ton_${ident}.Q;`, `  ${sig(block.id, 'ET')} = (float)ton_${ident}.ET;`);
        break;
      case 'TOF':
        state.push(`TOF_Timer tof_${ident};`);
        logic.push(`  tof_${ident}.update(${A()}, ${ul(num(block, 'duration'))}, dt);`, `  ${Q} = tof_${ident}.Q;`, `  ${sig(block.id, 'ET')} = (float)tof_${ident}.ET;`);
        break;
      case 'ON_OFF_DELAY':
        state.push(`OnOffDelay onoff_${ident};`);
        logic.push(
          `  onoff_${ident}.update(${A()}, ${ul(num(block, 'onDelay'))}, ${ul(num(block, 'offDelay'))}, dt);`,
          `  ${Q} = onoff_${ident}.Q;`,
          `  ${sig(block.id, 'ET')} = (float)onoff_${ident}.ET;`,
        );
        break;
      case 'RETENTIVE_TON':
        state.push(`RetentiveTON rton_${ident};`);
        logic.push(`  rton_${ident}.update(${A()}, ${input(block, 'R')}, ${ul(num(block, 'duration'))}, dt);`, `  ${Q} = rton_${ident}.Q;`, `  ${sig(block.id, 'ET')} = (float)rton_${ident}.ET;`);
        break;
      case 'PULSE_TIMER':
      case 'EDGE_PULSE_TIMER': {
        const edge = block.type === 'EDGE_PULSE_TIMER';
        state.push(`PulseTimer tp_${ident};`);
        logic.push(`  tp_${ident}.update(${A()}, ${edge ? input(block, 'R') : 'false'}, ${edge ? 'true' : 'false'}, ${ul(num(block, 'duration'))}, dt);`, `  ${Q} = tp_${ident}.Q;`);
        break;
      }
      case 'CLOCK':
        state.push(`unsigned long phase_${ident} = 0;`);
        logic.push(
          `  phase_${ident} = (phase_${ident} + dt) % (${ul(num(block, 'onTime'))} + ${ul(num(block, 'offTime'))});`,
          `  ${Q} = phase_${ident} >= ${ul(num(block, 'offTime'))};`,
        );
        break;
      case 'STOPWATCH':
        state.push(`unsigned long elapsed_${ident} = 0;`);
        logic.push(`  if (${input(block, 'R')}) elapsed_${ident} = 0; else if (${A()}) elapsed_${ident} += dt;`, `  ${sig(block.id, 'ET')} = (float)elapsed_${ident};`);
        break;
      case 'COUNTER':
        state.push(`long count_${ident} = 0;`, `bool lastCU_${ident} = false;`, `bool lastCD_${ident} = false;`);
        logic.push(
          `  { bool cu = ${input(block, 'CU')}; bool cd = ${input(block, 'CD')};`,
          `    if (${input(block, 'R')}) count_${ident} = 0; else count_${ident} += (cu && !lastCU_${ident} ? 1 : 0) - (cd && !lastCD_${ident} ? 1 : 0);`,
          `    lastCU_${ident} = cu; lastCD_${ident} = cd; }`,
          `  ${sig(block.id, 'CV')} = (float)count_${ident};`,
          `  ${Q} = count_${ident} >= ${Math.round(num(block, 'limit'))}L;`,
        );
        break;
      case 'HOURS_COUNTER':
        state.push(`unsigned long runMs_${ident} = 0;`);
        logic.push(
          `  if (${input(block, 'R')}) runMs_${ident} = 0; else if (${A()}) runMs_${ident} += dt;`,
          `  ${sig(block.id, 'CV')} = (float)runMs_${ident} / 3600000.0f;`,
          `  ${Q} = ${sig(block.id, 'CV')} >= ${f(num(block, 'limit'))};`,
        );
        break;
      case 'MATH': {
        const op = String(block.params.operation ?? 'add');
        const a = input(block, 'A');
        const b = input(block, 'B');
        const expr =
          op === 'subtract' ? `${a} - ${b}` : op === 'multiply' ? `${a} * ${b}` : op === 'divide' ? `(${b} == 0.0f ? 0.0f : ${a} / ${b})` : `${a} + ${b}`;
        logic.push(`  ${Q} = ah_finite(${expr});`);
        break;
      }
      case 'ANALOG_COMPARATOR': {
        const ops: Record<string, string> = { gt: '>', gte: '>=', lt: '<', lte: '<=', eq: '==', ne: '!=' };
        logic.push(`  ${Q} = ${input(block, 'A')} ${ops[String(block.params.operation)] ?? '>'} ${input(block, 'B')};`);
        break;
      }
      case 'ANALOG_THRESHOLD':
        logic.push(`  ${Q} = ${A()} >= ${f(num(block, 'threshold'))};`);
        break;
      case 'ANALOG_AMPLIFIER':
        logic.push(`  ${Q} = ah_finite(${A()} * ${f(num(block, 'gain'))} + ${f(num(block, 'offset'))});`);
        break;
      case 'ANALOG_MUX':
        logic.push(`  ${Q} = ${input(block, 'S')} ? ${input(block, 'B')} : ${input(block, 'A')};`);
        break;
      case 'FLOAT_TO_INT':
        logic.push(`  ${Q} = trunc(${A()});`);
        break;
      case 'INT_TO_FLOAT':
        logic.push(`  ${Q} = ${A()};`);
        break;
      case 'ANALOG_WATCHDOG':
        state.push(`bool lastEN_${ident} = false;`, `float ref_${ident} = 0.0f;`, `bool hasRef_${ident} = false;`);
        logic.push(
          `  { bool en = ${input(block, 'EN')}; float a = ${A()};`,
          `    if (en && !lastEN_${ident}) { ref_${ident} = a; hasRef_${ident} = true; }`,
          `    lastEN_${ident} = en;`,
          `    ${Q} = en && fabs(a - (hasRef_${ident} ? ref_${ident} : a)) > ${f(num(block, 'tolerance'))}; }`,
        );
        break;
      case 'ANALOG_DIFFERENTIAL': {
        const on = num(block, 'onThreshold');
        const off = num(block, 'offThreshold');
        logic.push(
          on <= off
            ? `  if (${A()} <= ${f(on)}) ${Q} = true; else if (${A()} >= ${f(off)}) ${Q} = false; // low trigger`
            : `  if (${A()} >= ${f(on)}) ${Q} = true; else if (${A()} <= ${f(off)}) ${Q} = false; // high trigger`,
        );
        break;
      }
      case 'ANALOG_RAMP':
        state.push(`bool init_${ident} = false;`);
        logic.push(
          `  { float target = ${A()}; if (!init_${ident}) { ${Q} = target; init_${ident} = true; }`,
          `    if (target > ${Q}) ${Q} = ah_min(target, ${Q} + ${f(num(block, 'riseRate'))} * (float)dt / 1000.0f);`,
          `    else if (target < ${Q}) ${Q} = ah_max(target, ${Q} - ${f(num(block, 'fallRate'))} * (float)dt / 1000.0f); }`,
        );
        break;
      case 'PI_CONTROLLER':
        state.push(`float integral_${ident} = 0.0f;`);
        logic.push(
          `  { float e = ${input(block, 'SP')} - ${input(block, 'PV')}; float p = ${f(num(block, 'kp'))} * e;`,
          `    float i = ${input(block, 'R')} ? 0.0f : integral_${ident} + ${f(num(block, 'ki'))} * e * (float)dt / 1000.0f;`,
          `    i = ah_max(${f(num(block, 'min'))} - p, ah_min(${f(num(block, 'max'))} - p, i));`,
          `    integral_${ident} = i;`,
          `    ${Q} = ah_finite(ah_max(${f(num(block, 'min'))}, ah_min(${f(num(block, 'max'))}, p + i))); }`,
        );
        break;
      case 'PID_CONTROLLER': {
        const CV = sig(block.id, 'CV');
        state.push(`float integral_${ident} = 0.0f;`, `float lastError_${ident} = 0.0f;`);
        logic.push(
          `  if (!${connected(block, 'EN') ? input(block, 'EN') : 'true'}) { integral_${ident} = 0.0f; lastError_${ident} = 0.0f; ${CV} = 0.0f; }`,
          `  else { float e = ${input(block, 'SP')} - ${input(block, 'PV')}; float dts = (float)dt / 1000.0f;`,
          `    float cv = ${f(num(block, 'kp'))} * e + ${f(num(block, 'ki'))} * integral_${ident} + ${f(num(block, 'kd'))} * (dts > 0.0f ? (e - lastError_${ident}) / dts : 0.0f);`,
          `    if (cv > ${f(num(block, 'max'))}) cv = ${f(num(block, 'max'))}; else if (cv < ${f(num(block, 'min'))}) cv = ${f(num(block, 'min'))}; else integral_${ident} += e * dts;`,
          `    lastError_${ident} = e; ${CV} = ah_finite(cv); }`,
        );
        break;
      }
      case 'PWM':
        if (num(block, 'period') <= 0) {
          logic.push(`  ${Q} = false; // period 0: no pulses (same as the simulator)`);
          break;
        }
        state.push(`unsigned long phase_${ident} = 0;`);
        logic.push(
          `  { float duty = ah_max(0.0f, ah_min(100.0f, ${A()})); phase_${ident} = (phase_${ident} + dt) % ${ul(num(block, 'period'))};`,
          `    ${Q} = (float)phase_${ident} < duty / 100.0f * ${f(num(block, 'period'))}; }`,
        );
        break;
      case 'ANALOG_FILTER':
        state.push(`bool init_${ident} = false;`);
        logic.push(
          `  { float a = ${A()}; float alpha = ${f(num(block, 'timeConstant'))} + (float)dt > 0.0f ? (float)dt / (${f(num(block, 'timeConstant'))} + (float)dt) : 1.0f;`,
          `    float prev = init_${ident} ? ${Q} : a; init_${ident} = true;`,
          `    ${Q} = ah_finite(alpha * a + (1.0f - alpha) * prev); }`,
        );
        break;
      case 'MIN_MAX': {
        const MIN = sig(block.id, 'MIN');
        const MAX = sig(block.id, 'MAX');
        state.push(`bool init_${ident} = false;`);
        logic.push(
          `  { float a = ${A()};`,
          `    if (${input(block, 'R')} || !init_${ident}) { ${MIN} = a; ${MAX} = a; init_${ident} = true; }`,
          `    else { ${MIN} = ah_min(${MIN}, a); ${MAX} = ah_max(${MAX}, a); } }`,
        );
        break;
      }
      case 'AVERAGE': {
        const n = Math.max(1, Math.min(MAX_AVERAGE_SAMPLES, Math.round(num(block, 'samples'))));
        state.push(`MovingAverage<${n}> avg_${ident};`);
        logic.push(`  ${Q} = avg_${ident}.update(${A()});`);
        break;
      }
      case 'SCAN_DELAY':
      case 'ANALOG_SCAN_DELAY': {
        const analog = block.type === 'ANALOG_SCAN_DELAY';
        state.push(`${analog ? 'float' : 'bool '} prev_${ident} = ${analog ? '0.0f' : 'false'};`);
        scanStart.push(`  ${Q} = prev_${ident};`);
        scanEnd.push(`  prev_${ident} = ${A()};`);
        logic.push(`  // output was set at the start of the scan`);
        break;
      }
      case 'TRANSFER_FUNCTION':
        logic.push(
          `  { float alpha = ${f(num(block, 'tau'))} + (float)dt > 0.0f ? (float)dt / (${f(num(block, 'tau'))} + (float)dt) : 1.0f;`,
          `    ${Q} = ah_finite(alpha * (${A()} * ${f(num(block, 'gain'))}) + (1.0f - alpha) * ${Q}); }`,
        );
        break;
      case 'SIGNAL_GENERATOR': {
        const wave = String(block.params.type || 'sine');
        state.push(`float phase_${ident} = 0.0f;`);
        const shape =
          wave === 'square' ? `(phase_${ident} < 0.5f ? 1.0f : -1.0f)` : wave === 'tri' ? `(phase_${ident} < 0.5f ? phase_${ident} * 4.0f - 1.0f : 3.0f - phase_${ident} * 4.0f)` : `sin(phase_${ident} * 2.0f * PI)`;
        logic.push(
          `  if (!${input(block, 'EN')}) ${Q} = 0.0f;`,
          `  else { phase_${ident} = fmod(phase_${ident} + ${f(num(block, 'freq'))} * (float)dt / 1000.0f, 1.0f);`,
          `    ${Q} = ${shape} * ${f(num(block, 'amp'))} + ${f(num(block, 'offset'))}; }`,
        );
        break;
      }
      case 'MATH_EXPRESSION': {
        let tree: ExpressionNode | null = null;
        try {
          tree = parseExpression(String(block.params.expr || 'A + B'));
        } catch {
          tree = null; // reported by analyzeArduinoExport
        }
        logic.push(tree ? `  ${Q} = ah_finite(${expressionToCpp(tree, { A: input(block, 'A'), B: input(block, 'B'), C: input(block, 'C') })});` : `  ${Q} = 0.0f;`);
        break;
      }
      case 'SHIFT_REGISTER': {
        const length = Math.min(32, Math.max(1, Math.round(num(block, 'length')) || 8));
        const mask = length >= 32 ? '0xFFFFFFFFUL' : `0x${(2 ** length - 1).toString(16).toUpperCase()}UL`;
        const msb = `0x${(2 ** (length - 1)).toString(16).toUpperCase()}UL`;
        state.push(`uint32_t bits_${ident} = 0;`, `bool lastClk_${ident} = false;`);
        logic.push(
          `  { bool clk = ${input(block, 'CLK')}; bool dir = ${input(block, 'DIR')};`,
          `    if (clk && !lastClk_${ident}) bits_${ident} = dir ? (((bits_${ident} << 1) | (${input(block, 'D')} ? 1UL : 0UL)) & ${mask}) : ((bits_${ident} >> 1) | (${input(block, 'D')} ? ${msb} : 0UL));`,
          `    lastClk_${ident} = clk;`,
          `    if (${input(block, 'R')}) bits_${ident} = 0;`,
          `    ${Q} = dir ? (bits_${ident} & ${msb}) != 0 : (bits_${ident} & 1UL) != 0; }`,
        );
        break;
      }
      case 'DATA_LOG': {
        // On hardware the samples are printed to the serial port (CSV: block,time_ms,value).
        const interval = Math.max(0, Math.round(num(block, 'interval')));
        state.push(`bool logged_${ident} = false;`, `unsigned long lastLog_${ident} = 0;`);
        logic.push(
          `  ${Q} = ${input(block, 'EN')};`,
          `  if (${Q} && (!logged_${ident} || now - lastLog_${ident} >= ${interval}UL)) {`,
          `    logged_${ident} = true; lastLog_${ident} = now;`,
          `#if ENABLE_SERIAL_TELEMETRY`,
          `    Serial.print(F("LOG,${cString(block.label || block.id)},")); Serial.print(now); Serial.print(F(",")); Serial.println(${input(block, 'A')}, 3);`,
          `#endif`,
          `  }`,
        );
        break;
      }
      case 'OPEN_CONNECTOR':
        break;
      default:
        logic.push(`  // not exported (see #error above)`);
    }
  }

  const issueLines = issues.map((issue) => `#error "${cString(issue.message)}"`);
  const wiring = doc.blocks
    .filter((block) => config.pinAssignments[block.id]?.pinNumber)
    .map((block) => {
      const a = config.pinAssignments[block.id];
      return ` *   Pin ${a.pinNumber.padEnd(4)} ${cComment(block.label || block.id)} [${block.type}, ${a.mode}${a.invertLogic ? ', inverted' : ''}]`;
    });

  return `/*
 * AutomationHub circuit: ${cComment(doc.name || 'Untitled circuit')}
 * Board: ${preset.name}
 * Scan cycle: ${config.scanCycleMs} ms (non-blocking, millis()-based)
 *
 * Wiring:
${wiring.length ? wiring.join('\n') : ' *   (no physical I/O)'}
 *
 * Generated by AutomationHub. Behaves scan-for-scan like the browser simulator.
 */
${issueLines.length ? `\n// The circuit uses features this exporter cannot reproduce on hardware:\n${issueLines.join('\n')}\n` : ''}
#include <math.h>

#define ENABLE_SERIAL_TELEMETRY ${config.enableSerialTelemetry ? 1 : 0}
#define SCAN_CYCLE_MS ${ul(config.scanCycleMs)}
#define TELEMETRY_INTERVAL_MS ${ul(config.telemetryIntervalMs)}

// ---- Pins ----
${pinConstants.length ? pinConstants.join('\n') : '// No physical I/O.'}

// ---- Runtime (ports of the simulator blocks; times in ms) ----
static inline float ah_min(float a, float b) { return a < b ? a : b; }
static inline float ah_max(float a, float b) { return a > b ? a : b; }
static inline float ah_sq(float a) { return a * a; }
static inline float ah_sign(float a) { return a > 0.0f ? 1.0f : (a < 0.0f ? -1.0f : 0.0f); }
static inline float ah_round(float a) { return floor(a + 0.5f); }
static inline float ah_finite(float a) { return isfinite(a) ? a : 0.0f; }

struct TON_Timer {
  unsigned long ET = 0; bool Q = false;
  void update(bool in, unsigned long pt, unsigned long dt) {
    ET = in ? (ET + dt > pt ? pt : ET + dt) : 0;
    Q = in && ET >= pt;
  }
};

struct TOF_Timer {
  unsigned long ET = 0; bool Q = false; bool armed = false;
  void update(bool in, unsigned long pt, unsigned long dt) {
    if (in) { armed = true; ET = 0; Q = true; }
    else if (armed) { ET = ET + dt > pt ? pt : ET + dt; Q = ET < pt; if (!Q) armed = false; }
    else Q = false;
  }
};

struct OnOffDelay {
  unsigned long onElapsed = 0, offElapsed = 0, ET = 0; bool Q = false;
  void update(bool in, unsigned long onDelay, unsigned long offDelay, unsigned long dt) {
    ET = 0;
    if (in) {
      offElapsed = 0;
      if (!Q) { onElapsed = onElapsed + dt > onDelay ? onDelay : onElapsed + dt; ET = onElapsed; if (onElapsed >= onDelay) Q = true; }
    } else {
      onElapsed = 0;
      if (Q) { offElapsed = offElapsed + dt > offDelay ? offDelay : offElapsed + dt; ET = offElapsed; if (offElapsed >= offDelay) Q = false; }
    }
  }
};

struct RetentiveTON {
  unsigned long ET = 0; bool Q = false;
  void update(bool in, bool reset, unsigned long pt, unsigned long dt) {
    if (reset) ET = 0; else if (in) ET = ET + dt > pt ? pt : ET + dt;
    Q = ET >= pt;
  }
};

struct PulseTimer {
  unsigned long ET = 0; bool Q = false; bool lastIn = false;
  void update(bool in, bool reset, bool retrigger, unsigned long pt, unsigned long dt) {
    if (reset) Q = false;
    else if (in && !lastIn && (retrigger || !Q)) { Q = true; ET = 0; }
    if (Q) { ET = ET + dt > pt ? pt : ET + dt; if (ET >= pt) Q = false; }
    lastIn = in;
  }
};

template <int N> struct MovingAverage {
  float buf[N]; int count = 0; int head = 0;
  float update(float x) {
    buf[head] = x; head = (head + 1) % N; if (count < N) count++;
    float sum = 0.0f; for (int i = 0; i < count; i++) sum += buf[i];
    return sum / (float)count;
  }
};

// ---- Signals (keep their value between scans, like the simulator) ----
${globals.join('\n')}

// ---- Block state ----
${state.length ? state.join('\n') : '// (none)'}

void setup() {
#if ENABLE_SERIAL_TELEMETRY
  Serial.begin(${preset.defaultBaudRate});
  Serial.println(F("AutomationHub: ${cString(doc.name || 'circuit')}"));
#endif
${pinSetup.length ? pinSetup.join('\n') : '  // No pins to configure.'}
}

void loop() {
  static unsigned long lastScan = 0;
  static unsigned long lastTelemetry = 0;
  unsigned long now = millis();
  unsigned long dt = now - lastScan;
  if (dt < SCAN_CYCLE_MS) return; // non-blocking: come back on the next loop()
  lastScan = now;

${scanStart.length ? `  // Scan delays release last scan's value\n${scanStart.join('\n')}\n` : ''}${logic.join('\n')}
${scanEnd.length ? `\n  // Scan delays sample their input for the next scan\n${scanEnd.join('\n')}` : ''}

#if ENABLE_SERIAL_TELEMETRY
  if (now - lastTelemetry >= TELEMETRY_INTERVAL_MS) {
    lastTelemetry = now;
    Serial.print(F("t=")); Serial.print(now);
${telemetry.length ? telemetry.join('\n') : ''}
    Serial.println();
  }
#endif
}
`;
}
