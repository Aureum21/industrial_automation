/**
 * Arduino C++ Code Generator for AutomationHub
 * Generates standalone, non-blocking, library-free .ino sketches from visual circuits.
 */

import type { CircuitBlock, CircuitConnection, CircuitDocument, SignalKind } from '../automation/types.ts';
import { BLOCK_CATALOG } from '../automation/catalog.ts';

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
  invertLogic: boolean;
  comment?: string;
}

export interface ArduinoExportConfig {
  board: ArduinoBoardId;
  scanCycleMs: number;
  enableSerialTelemetry: boolean;
  telemetryIntervalMs: number;
  pinAssignments: Record<string, PinAssignment>;
}

/**
 * Auto-allocates available physical pins for input and output blocks in the circuit.
 */
export function autoAssignPins(doc: CircuitDocument, boardId: ArduinoBoardId): Record<string, PinAssignment> {
  const preset = BOARD_PRESETS[boardId] ?? BOARD_PRESETS.uno;
  const assignments: Record<string, PinAssignment> = {};

  const usedPins = new Set<string>();
  const digitalPool = [...preset.availableDigitalPins];
  const analogInPool = [...preset.availableAnalogInPins];
  const pwmPool = [...preset.availablePwmPins];

  // Helper to pick next unused pin
  const pick = (pool: string[], fallbackPrefix: string, counter: { val: number }): string => {
    while (pool.length > 0) {
      const p = pool.shift()!;
      if (!usedPins.has(p)) {
        usedPins.add(p);
        return p;
      }
    }
    const synthetic = `${fallbackPrefix}${counter.val++}`;
    usedPins.add(synthetic);
    return synthetic;
  };

  const digCounter = { val: 2 };
  const anaCounter = { val: 0 };

  for (const block of doc.blocks) {
    if (block.type === 'INPUT') {
      const pin = pick(digitalPool, 'D', digCounter);
      assignments[block.id] = {
        blockId: block.id,
        pinNumber: pin,
        mode: 'INPUT_PULLUP',
        invertLogic: true, // Pressed to GND = true (standard momentary switch)
        comment: block.label || `Digital Input (${block.id})`,
      };
    } else if (block.type === 'NC_INPUT') {
      const pin = pick(digitalPool, 'D', digCounter);
      assignments[block.id] = {
        blockId: block.id,
        pinNumber: pin,
        mode: 'INPUT_PULLUP',
        invertLogic: false, // Closed to GND = normal, open = tripped
        comment: block.label || `Normally Closed Input (${block.id})`,
      };
    } else if (block.type === 'OUTPUT') {
      const pin = pick(digitalPool, 'D', digCounter);
      assignments[block.id] = {
        blockId: block.id,
        pinNumber: pin,
        mode: 'OUTPUT',
        invertLogic: false,
        comment: block.label || `Digital Output (${block.id})`,
      };
    } else if (block.type === 'ANALOG_INPUT') {
      const pin = pick(analogInPool, 'A', anaCounter);
      assignments[block.id] = {
        blockId: block.id,
        pinNumber: pin,
        mode: 'ANALOG_INPUT',
        invertLogic: false,
        comment: block.label || `Analog Input (${block.id})`,
      };
    } else if (block.type === 'ANALOG_OUTPUT') {
      const pin = pick(pwmPool, 'PWM', digCounter);
      assignments[block.id] = {
        blockId: block.id,
        pinNumber: pin,
        mode: 'PWM_OUTPUT',
        invertLogic: false,
        comment: block.label || `PWM Output (${block.id})`,
      };
    }
  }

  return assignments;
}

/**
 * Sanitizes an ID to a valid C++ identifier name
 */
export function sanitizeCppIdent(id: string): string {
  const clean = id.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[a-zA-Z_]/.test(clean) ? clean : `b_${clean}`;
}

/**
 * Performs topological sort on circuit blocks.
 * SCAN_DELAY and ANALOG_SCAN_DELAY do NOT create forward dependencies in the current cycle,
 * exactly like PLC scan memory.
 */
export function sortBlocksTopologically(doc: CircuitDocument): CircuitBlock[] {
  const blockMap = new Map<string, CircuitBlock>();
  const inDegree = new Map<string, number>();
  const adj = new Map<string, Set<string>>();

  for (const block of doc.blocks) {
    blockMap.set(block.id, block);
    inDegree.set(block.id, 0);
    adj.set(block.id, new Set());
  }

  // Tag writers mapping
  const tagWriters = new Map<string, CircuitBlock>();
  for (const block of doc.blocks) {
    if (block.tag && (block.type === 'OUTPUT' || block.type === 'FLAG' || block.type === 'ANALOG_FLAG' || block.type === 'ANALOG_OUTPUT')) {
      tagWriters.set(block.tag, block);
    }
  }

  // Add edges
  for (const conn of doc.connections) {
    const fromBlock = blockMap.get(conn.fromBlockId);
    const toBlock = blockMap.get(conn.toBlockId);
    if (!fromBlock || !toBlock) continue;

    // Scan delay blocks break dependency cycles by taking input from previous scan
    if (toBlock.type === 'SCAN_DELAY' || toBlock.type === 'ANALOG_SCAN_DELAY') {
      continue;
    }

    const set = adj.get(conn.fromBlockId)!;
    if (!set.has(conn.toBlockId)) {
      set.add(conn.toBlockId);
      inDegree.set(conn.toBlockId, (inDegree.get(conn.toBlockId) ?? 0) + 1);
    }
  }

  // Tag reader dependencies
  for (const block of doc.blocks) {
    if (block.tag && (block.type === 'INPUT' || block.type === 'FLAG' || block.type === 'ANALOG_FLAG')) {
      const writer = tagWriters.get(block.tag);
      if (writer && writer.id !== block.id) {
        const set = adj.get(writer.id)!;
        if (!set.has(block.id)) {
          set.add(block.id);
          inDegree.set(block.id, (inDegree.get(block.id) ?? 0) + 1);
        }
      }
    }
  }

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const sorted: CircuitBlock[] = [];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const block = blockMap.get(currentId);
    if (block) sorted.push(block);

    for (const neighborId of adj.get(currentId) ?? []) {
      const newDeg = (inDegree.get(neighborId) ?? 1) - 1;
      inDegree.set(neighborId, newDeg);
      if (newDeg === 0) {
        queue.push(neighborId);
      }
    }
  }

  // Fallback: If there are unvisited nodes (e.g. unbroken circular dependency), append them
  if (sorted.length < doc.blocks.length) {
    const visited = new Set(sorted.map(b => b.id));
    for (const block of doc.blocks) {
      if (!visited.has(block.id)) {
        sorted.push(block);
      }
    }
  }

  return sorted;
}

/**
 * Formats a pin identifier for Arduino C++ code (e.g. A0 -> A0, 2 -> 2)
 */
function formatPinRef(pinStr: string): string {
  const trimmed = pinStr.trim();
  if (/^A\d+$/i.test(trimmed)) return trimmed.toUpperCase();
  if (/^\d+$/.test(trimmed)) return trimmed;
  // ESP32 or Pico GPIO string
  return trimmed;
}

/**
 * Main Arduino Sketch Generator
 */
export function generateArduinoSketch(doc: CircuitDocument, config: ArduinoExportConfig): string {
  const preset = BOARD_PRESETS[config.board] ?? BOARD_PRESETS.uno;
  const sortedBlocks = sortBlocksTopologically(doc);

  // Index connections by target block and target pin: toBlockId -> { toPin -> { fromBlockId, fromPin } }
  const incomingMap = new Map<string, Map<string, { fromBlockId: string; fromPin: string }>>();
  for (const conn of doc.connections) {
    if (!incomingMap.has(conn.toBlockId)) {
      incomingMap.set(conn.toBlockId, new Map());
    }
    incomingMap.get(conn.toBlockId)!.set(conn.toPin, {
      fromBlockId: conn.fromBlockId,
      fromPin: conn.fromPin,
    });
  }

  // Tag writers
  const tagWriters = new Map<string, { blockId: string; outputPin: string; kind: SignalKind }>();
  for (const b of doc.blocks) {
    if (b.tag && (b.type === 'OUTPUT' || b.type === 'FLAG' || b.type === 'ANALOG_FLAG' || b.type === 'ANALOG_OUTPUT')) {
      const kind: SignalKind = b.type.startsWith('ANALOG') ? 'analog' : 'digital';
      tagWriters.set(b.tag, { blockId: b.id, outputPin: 'Q', kind });
    }
  }

  // Helper to resolve an input signal expression
  const resolveInput = (
    block: CircuitBlock,
    pinId: string,
    defaultVal: string = 'false',
    kind: 'digital' | 'analog' = 'digital'
  ): string => {
    const inConn = incomingMap.get(block.id)?.get(pinId);
    if (inConn) {
      const srcIdent = sanitizeCppIdent(inConn.fromBlockId);
      return `sig_${srcIdent}_${inConn.fromPin}`;
    }

    // Check if block has tag reader
    if (block.tag && tagWriters.has(block.tag)) {
      const writer = tagWriters.get(block.tag)!;
      const srcIdent = sanitizeCppIdent(writer.blockId);
      return `sig_${srcIdent}_${writer.outputPin}`;
    }

    return defaultVal;
  };

  // State instances to declare
  const statefulDeclarations: string[] = [];
  const scanDelayBlocks: CircuitBlock[] = [];

  for (const block of sortedBlocks) {
    const ident = sanitizeCppIdent(block.id);
    switch (block.type) {
      case 'TON':
        statefulDeclarations.push(`TON_Timer timer_${ident};`);
        break;
      case 'TOF':
        statefulDeclarations.push(`TOF_Timer timer_${ident};`);
        break;
      case 'PULSE_TIMER':
      case 'EDGE_PULSE_TIMER':
        statefulDeclarations.push(`TP_Timer timer_${ident};`);
        break;
      case 'ON_OFF_DELAY':
        statefulDeclarations.push(`ON_OFF_Delay delay_${ident};`);
        break;
      case 'RETENTIVE_TON':
        statefulDeclarations.push(`RetentiveTON rton_${ident};`);
        break;
      case 'CLOCK':
        statefulDeclarations.push(`ClockGen clock_${ident};`);
        break;
      case 'R_TRIG':
        statefulDeclarations.push(`R_Trig rtrig_${ident};`);
        break;
      case 'F_TRIG':
        statefulDeclarations.push(`F_Trig ftrig_${ident};`);
        break;
      case 'AND_EDGE':
      case 'NAND_EDGE':
        statefulDeclarations.push(`R_Trig edge_${ident};`);
        break;
      case 'RS_LATCH':
        statefulDeclarations.push(`RS_Latch latch_${ident};`);
        break;
      case 'PULSE_RELAY':
        statefulDeclarations.push(`PulseRelay relay_${ident};`);
        break;
      case 'COUNTER':
        statefulDeclarations.push(`UpDownCounter counter_${ident};`);
        break;
      case 'ANALOG_DIFFERENTIAL':
        statefulDeclarations.push(`HysteresisTrigger hyst_${ident};`);
        break;
      case 'ANALOG_RAMP':
        statefulDeclarations.push(`AnalogRamp ramp_${ident};`);
        break;
      case 'PI_CONTROLLER':
      case 'PID_CONTROLLER':
        statefulDeclarations.push(`PIController pi_${ident};`);
        break;
      case 'ANALOG_FILTER':
        statefulDeclarations.push(`AnalogFilter filter_${ident};`);
        break;
      case 'AVERAGE':
        statefulDeclarations.push(`MovingAverage avg_${ident};`);
        break;
      case 'MIN_MAX':
        statefulDeclarations.push(`MinMaxTracker minmax_${ident};`);
        break;
      case 'HOURS_COUNTER':
        statefulDeclarations.push(`HoursCounter hours_${ident};`);
        break;
      case 'SCAN_DELAY':
        statefulDeclarations.push(`bool scan_delay_${ident} = false;`);
        scanDelayBlocks.push(block);
        break;
      case 'ANALOG_SCAN_DELAY':
        statefulDeclarations.push(`float scan_delay_${ident} = 0.0f;`);
        scanDelayBlocks.push(block);
        break;
      default:
        break;
    }
  }

  // Pin assignments and constant definitions
  const pinConstants: string[] = [];
  const pinModeStatements: string[] = [];
  const telemetryPrintStatements: string[] = [];

  for (const block of sortedBlocks) {
    const assignment = config.pinAssignments[block.id];
    if (!assignment) continue;

    const ident = sanitizeCppIdent(block.id);
    const constPinName = `PIN_${ident.toUpperCase()}`;
    const pinRef = formatPinRef(assignment.pinNumber);

    pinConstants.push(`const int ${constPinName} = ${pinRef}; // ${assignment.comment ?? block.label ?? block.type}`);

    if (assignment.mode === 'INPUT_PULLUP') {
      pinModeStatements.push(`  pinMode(${constPinName}, INPUT_PULLUP);`);
    } else if (assignment.mode === 'INPUT') {
      pinModeStatements.push(`  pinMode(${constPinName}, INPUT);`);
    } else if (assignment.mode === 'OUTPUT') {
      pinModeStatements.push(`  pinMode(${constPinName}, OUTPUT);`);
      pinModeStatements.push(`  digitalWrite(${constPinName}, ${assignment.invertLogic ? 'HIGH' : 'LOW'});`);
    } else if (assignment.mode === 'PWM_OUTPUT') {
      pinModeStatements.push(`  pinMode(${constPinName}, OUTPUT);`);
    }
  }

  // Build the code lines for step 2 (logic evaluation)
  const logicLines: string[] = [];

  for (const block of sortedBlocks) {
    const ident = sanitizeCppIdent(block.id);
    const assignment = config.pinAssignments[block.id];
    const def = BLOCK_CATALOG[block.type];

    logicLines.push(`    // [${block.type}] ${block.label ? `"${block.label}"` : block.id}`);

    switch (block.type) {
      case 'INPUT': {
        const pinConst = `PIN_${ident.toUpperCase()}`;
        if (assignment) {
          const inv = assignment.invertLogic;
          // Invert logic: reading LOW when pressed with INPUT_PULLUP yields true!
          logicLines.push(`    bool sig_${ident}_Q = (digitalRead(${pinConst}) == ${inv ? 'LOW' : 'HIGH'});`);
        } else {
          // Unassigned fallback: defaults to static value or false
          const val = block.value ? 'true' : 'false';
          logicLines.push(`    bool sig_${ident}_Q = ${val}; // Pin unassigned, default value`);
        }
        break;
      }

      case 'NC_INPUT': {
        const pinConst = `PIN_${ident.toUpperCase()}`;
        if (assignment) {
          const inv = assignment.invertLogic;
          logicLines.push(`    bool sig_${ident}_Q = (digitalRead(${pinConst}) == ${inv ? 'LOW' : 'HIGH'});`);
        } else {
          logicLines.push(`    bool sig_${ident}_Q = ${block.value ? 'true' : 'false'};`);
        }
        break;
      }

      case 'HIGH':
        logicLines.push(`    bool sig_${ident}_Q = true;`);
        break;

      case 'LOW':
        logicLines.push(`    bool sig_${ident}_Q = false;`);
        break;

      case 'FLAG': {
        const inA = resolveInput(block, 'A', 'false', 'digital');
        logicLines.push(`    bool sig_${ident}_Q = ${inA};`);
        break;
      }

      case 'OUTPUT': {
        const inA = resolveInput(block, 'A', 'false', 'digital');
        logicLines.push(`    bool sig_${ident}_Q = ${inA};`);
        if (assignment) {
          const pinConst = `PIN_${ident.toUpperCase()}`;
          const inv = assignment.invertLogic;
          logicLines.push(`    digitalWrite(${pinConst}, sig_${ident}_Q ? ${inv ? 'LOW' : 'HIGH'} : ${inv ? 'HIGH' : 'LOW'});`);
        }
        break;
      }

      case 'ANALOG_INPUT': {
        if (assignment) {
          const pinConst = `PIN_${ident.toUpperCase()}`;
          const minVal = Number(block.params.min ?? 0);
          const maxVal = Number(block.params.max ?? 100);
          const adcMax = preset.adcMaxRaw;
          logicLines.push(`    int raw_${ident} = analogRead(${pinConst});`);
          logicLines.push(`    float sig_${ident}_Q = ((float)raw_${ident} / ${adcMax}.0f) * (${maxVal.toFixed(2)}f - ${minVal.toFixed(2)}f) + ${minVal.toFixed(2)}f;`);
        } else {
          const defaultVal = Number(block.value ?? block.params.value ?? 0);
          logicLines.push(`    float sig_${ident}_Q = ${defaultVal.toFixed(2)}f; // Pin unassigned`);
        }
        break;
      }

      case 'ANALOG_OUTPUT': {
        const inA = resolveInput(block, 'A', '0.0f', 'analog');
        const minVal = Number(block.params.min ?? 0);
        const maxVal = Number(block.params.max ?? 100);
        logicLines.push(`    float sig_${ident}_Q = ${inA};`);
        if (assignment) {
          const pinConst = `PIN_${ident.toUpperCase()}`;
          logicLines.push(`    int pwm_${ident} = (int)constrain(((sig_${ident}_Q - ${minVal.toFixed(2)}f) / (${maxVal.toFixed(2)}f - ${minVal.toFixed(2)}f)) * 255.0f, 0, 255);`);
          logicLines.push(`    analogWrite(${pinConst}, pwm_${ident});`);
        }
        break;
      }

      case 'ANALOG_FLAG': {
        const inA = resolveInput(block, 'A', '0.0f', 'analog');
        logicLines.push(`    float sig_${ident}_Q = ${inA};`);
        break;
      }

      case 'ANALOG_CONSTANT': {
        const val = Number(block.params.value ?? 0);
        logicLines.push(`    float sig_${ident}_Q = ${val.toFixed(2)}f;`);
        break;
      }

      case 'AND': {
        const inA = resolveInput(block, 'A', 'false', 'digital');
        const inB = resolveInput(block, 'B', 'false', 'digital');
        const inC = incomingMap.get(block.id)?.has('C') ? resolveInput(block, 'C', 'true', 'digital') : null;
        const inD = incomingMap.get(block.id)?.has('D') ? resolveInput(block, 'D', 'true', 'digital') : null;
        let expr = `(${inA} && ${inB})`;
        if (inC) expr += ` && ${inC}`;
        if (inD) expr += ` && ${inD}`;
        logicLines.push(`    bool sig_${ident}_Q = ${expr};`);
        break;
      }

      case 'OR': {
        const inA = resolveInput(block, 'A', 'false', 'digital');
        const inB = resolveInput(block, 'B', 'false', 'digital');
        const inC = incomingMap.get(block.id)?.has('C') ? resolveInput(block, 'C', 'false', 'digital') : null;
        const inD = incomingMap.get(block.id)?.has('D') ? resolveInput(block, 'D', 'false', 'digital') : null;
        let expr = `(${inA} || ${inB})`;
        if (inC) expr += ` || ${inC}`;
        if (inD) expr += ` || ${inD}`;
        logicLines.push(`    bool sig_${ident}_Q = ${expr};`);
        break;
      }

      case 'NOT': {
        const inA = resolveInput(block, 'A', 'false', 'digital');
        logicLines.push(`    bool sig_${ident}_Q = !(${inA});`);
        break;
      }

      case 'XOR': {
        const inA = resolveInput(block, 'A', 'false', 'digital');
        const inB = resolveInput(block, 'B', 'false', 'digital');
        logicLines.push(`    bool sig_${ident}_Q = ((${inA}) != (${inB}));`);
        break;
      }

      case 'NAND': {
        const inA = resolveInput(block, 'A', 'false', 'digital');
        const inB = resolveInput(block, 'B', 'false', 'digital');
        logicLines.push(`    bool sig_${ident}_Q = !(${inA} && ${inB});`);
        break;
      }

      case 'NOR': {
        const inA = resolveInput(block, 'A', 'false', 'digital');
        const inB = resolveInput(block, 'B', 'false', 'digital');
        logicLines.push(`    bool sig_${ident}_Q = !(${inA} || ${inB});`);
        break;
      }

      case 'XNOR': {
        const inA = resolveInput(block, 'A', 'false', 'digital');
        const inB = resolveInput(block, 'B', 'false', 'digital');
        logicLines.push(`    bool sig_${ident}_Q = ((${inA}) == (${inB}));`);
        break;
      }

      case 'AND_EDGE': {
        const inA = resolveInput(block, 'A', 'false', 'digital');
        const inB = resolveInput(block, 'B', 'false', 'digital');
        logicLines.push(`    edge_${ident}.update(${inA} && ${inB});`);
        logicLines.push(`    bool sig_${ident}_Q = edge_${ident}.Q;`);
        break;
      }

      case 'NAND_EDGE': {
        const inA = resolveInput(block, 'A', 'false', 'digital');
        const inB = resolveInput(block, 'B', 'false', 'digital');
        logicLines.push(`    edge_${ident}.update(!(${inA} && ${inB}));`);
        logicLines.push(`    bool sig_${ident}_Q = edge_${ident}.Q;`);
        break;
      }

      case 'RS_LATCH': {
        const inS = resolveInput(block, 'S', 'false', 'digital');
        const inR = resolveInput(block, 'R', 'false', 'digital');
        logicLines.push(`    latch_${ident}.update(${inS}, ${inR});`);
        logicLines.push(`    bool sig_${ident}_Q = latch_${ident}.Q;`);
        logicLines.push(`    bool sig_${ident}_nQ = !latch_${ident}.Q;`);
        break;
      }

      case 'PULSE_RELAY': {
        const inTrig = resolveInput(block, 'Trig', 'false', 'digital');
        const inR = resolveInput(block, 'R', 'false', 'digital');
        logicLines.push(`    relay_${ident}.update(${inTrig}, ${inR});`);
        logicLines.push(`    bool sig_${ident}_Q = relay_${ident}.Q;`);
        break;
      }

      case 'R_TRIG': {
        const inClk = resolveInput(block, 'CLK', 'false', 'digital');
        logicLines.push(`    rtrig_${ident}.update(${inClk});`);
        logicLines.push(`    bool sig_${ident}_Q = rtrig_${ident}.Q;`);
        break;
      }

      case 'F_TRIG': {
        const inClk = resolveInput(block, 'CLK', 'false', 'digital');
        logicLines.push(`    ftrig_${ident}.update(${inClk});`);
        logicLines.push(`    bool sig_${ident}_Q = ftrig_${ident}.Q;`);
        break;
      }

      case 'TON': {
        const inIN = resolveInput(block, 'IN', 'false', 'digital');
        const ptMs = Number(block.params.duration ?? block.params.PT ?? 1000);
        logicLines.push(`    timer_${ident}.update(${inIN}, ${ptMs}UL, now);`);
        logicLines.push(`    bool sig_${ident}_Q = timer_${ident}.Q;`);
        logicLines.push(`    unsigned long sig_${ident}_ET = timer_${ident}.ET;`);
        break;
      }

      case 'TOF': {
        const inIN = resolveInput(block, 'IN', 'false', 'digital');
        const ptMs = Number(block.params.duration ?? block.params.PT ?? 1000);
        logicLines.push(`    timer_${ident}.update(${inIN}, ${ptMs}UL, now);`);
        logicLines.push(`    bool sig_${ident}_Q = timer_${ident}.Q;`);
        logicLines.push(`    unsigned long sig_${ident}_ET = timer_${ident}.ET;`);
        break;
      }

      case 'PULSE_TIMER':
      case 'EDGE_PULSE_TIMER': {
        const inA = resolveInput(block, 'A', 'false', 'digital');
        const ptMs = Number(block.params.duration ?? 1000);
        logicLines.push(`    timer_${ident}.update(${inA}, ${ptMs}UL, now);`);
        logicLines.push(`    bool sig_${ident}_Q = timer_${ident}.Q;`);
        logicLines.push(`    unsigned long sig_${ident}_ET = timer_${ident}.ET;`);
        break;
      }

      case 'ON_OFF_DELAY': {
        const inA = resolveInput(block, 'A', 'false', 'digital');
        const onMs = Number(block.params.onDelay ?? 1000);
        const offMs = Number(block.params.offDelay ?? 1000);
        logicLines.push(`    delay_${ident}.update(${inA}, ${onMs}UL, ${offMs}UL, now);`);
        logicLines.push(`    bool sig_${ident}_Q = delay_${ident}.Q;`);
        break;
      }

      case 'RETENTIVE_TON': {
        const inA = resolveInput(block, 'A', 'false', 'digital');
        const inR = resolveInput(block, 'R', 'false', 'digital');
        const ptMs = Number(block.params.duration ?? 1000);
        logicLines.push(`    rton_${ident}.update(${inA}, ${inR}, ${ptMs}UL, dt);`);
        logicLines.push(`    bool sig_${ident}_Q = rton_${ident}.Q;`);
        logicLines.push(`    unsigned long sig_${ident}_ET = rton_${ident}.ET;`);
        break;
      }

      case 'CLOCK': {
        const periodMs = Number(block.params.period ?? 1000);
        logicLines.push(`    clock_${ident}.update(${periodMs}UL, now);`);
        logicLines.push(`    bool sig_${ident}_Q = clock_${ident}.state;`);
        break;
      }

      case 'COUNTER': {
        const inCU = resolveInput(block, 'CU', 'false', 'digital');
        const inCD = resolveInput(block, 'CD', 'false', 'digital');
        const inR = resolveInput(block, 'R', 'false', 'digital');
        const inLD = resolveInput(block, 'LD', 'false', 'digital');
        const limitVal = Number(block.params.limit ?? 10);
        logicLines.push(`    counter_${ident}.update(${inCU}, ${inCD}, ${inR}, ${inLD}, ${limitVal}L);`);
        logicLines.push(`    bool sig_${ident}_Q = counter_${ident}.Q;`);
        logicLines.push(`    long sig_${ident}_CV = counter_${ident}.CV;`);
        break;
      }

      case 'MATH': {
        const inA = resolveInput(block, 'A', '0.0f', 'analog');
        const inB = resolveInput(block, 'B', '0.0f', 'analog');
        const op = String(block.params.operation ?? 'ADD');
        let expr = `(${inA} + ${inB})`;
        if (op === 'SUB') expr = `(${inA} - ${inB})`;
        else if (op === 'MUL') expr = `(${inA} * ${inB})`;
        else if (op === 'DIV') expr = `(${inB} != 0.0f ? (${inA} / ${inB}) : 0.0f)`;
        else if (op === 'MOD') expr = `((long)${inB} != 0 ? ((long)${inA} % (long)${inB}) : 0)`;
        else if (op === 'MIN') expr = `min(${inA}, ${inB})`;
        else if (op === 'MAX') expr = `max(${inA}, ${inB})`;
        else if (op === 'ABS') expr = `abs(${inA})`;
        logicLines.push(`    float sig_${ident}_Q = (float)(${expr});`);
        break;
      }

      case 'ANALOG_COMPARATOR': {
        const inA = resolveInput(block, 'A', '0.0f', 'analog');
        const inB = resolveInput(block, 'B', '0.0f', 'analog');
        const op = String(block.params.operator ?? 'GT');
        let cond = `${inA} > ${inB}`;
        if (op === 'GE') cond = `${inA} >= ${inB}`;
        else if (op === 'EQ') cond = `abs(${inA} - ${inB}) < 0.0001f`;
        else if (op === 'LE') cond = `${inA} <= ${inB}`;
        else if (op === 'LT') cond = `${inA} < ${inB}`;
        else if (op === 'NE') cond = `abs(${inA} - ${inB}) >= 0.0001f`;
        logicLines.push(`    bool sig_${ident}_Q = (${cond});`);
        break;
      }

      case 'ANALOG_THRESHOLD': {
        const inA = resolveInput(block, 'A', '0.0f', 'analog');
        const low = Number(block.params.lowThreshold ?? 0);
        const high = Number(block.params.highThreshold ?? 100);
        logicLines.push(`    bool sig_${ident}_Q = (${inA} >= ${low.toFixed(2)}f && ${inA} <= ${high.toFixed(2)}f);`);
        break;
      }

      case 'ANALOG_AMPLIFIER': {
        const inA = resolveInput(block, 'A', '0.0f', 'analog');
        const gain = Number(block.params.gain ?? 1.0);
        const offset = Number(block.params.offset ?? 0.0);
        logicLines.push(`    float sig_${ident}_Q = (${inA}) * ${gain.toFixed(4)}f + ${offset.toFixed(4)}f;`);
        break;
      }

      case 'ANALOG_MUX': {
        const inA = resolveInput(block, 'A', '0.0f', 'analog');
        const inB = resolveInput(block, 'B', '0.0f', 'analog');
        const inS = resolveInput(block, 'S', 'false', 'digital');
        logicLines.push(`    float sig_${ident}_Q = (${inS}) ? (${inB}) : (${inA});`);
        break;
      }

      case 'ANALOG_DIFFERENTIAL': {
        const inA = resolveInput(block, 'A', '0.0f', 'analog');
        const onThresh = Number(block.params.onThreshold ?? 50);
        const offThresh = Number(block.params.offThreshold ?? 20);
        logicLines.push(`    hyst_${ident}.update(${inA}, ${onThresh.toFixed(2)}f, ${offThresh.toFixed(2)}f);`);
        logicLines.push(`    bool sig_${ident}_Q = hyst_${ident}.Q;`);
        break;
      }

      case 'ANALOG_RAMP': {
        const inA = resolveInput(block, 'A', '0.0f', 'analog');
        const rise = Number(block.params.riseRate ?? 10.0);
        const fall = Number(block.params.fallRate ?? 10.0);
        logicLines.push(`    ramp_${ident}.update(${inA}, ${rise.toFixed(2)}f, ${fall.toFixed(2)}f, (float)dt / 1000.0f);`);
        logicLines.push(`    float sig_${ident}_Q = ramp_${ident}.current;`);
        break;
      }

      case 'PI_CONTROLLER':
      case 'PID_CONTROLLER': {
        const inSP = resolveInput(block, 'SP', '0.0f', 'analog');
        const inPV = resolveInput(block, 'PV', '0.0f', 'analog');
        const inR = resolveInput(block, 'R', 'false', 'digital');
        const kp = Number(block.params.kp ?? 1.0);
        const ki = Number(block.params.ki ?? 0.1);
        const minOut = Number(block.params.min ?? 0.0);
        const maxOut = Number(block.params.max ?? 100.0);
        logicLines.push(`    float sig_${ident}_Q = pi_${ident}.update(${inSP}, ${inPV}, ${kp.toFixed(4)}f, ${ki.toFixed(4)}f, ${minOut.toFixed(2)}f, ${maxOut.toFixed(2)}f, (float)dt / 1000.0f, ${inR});`);
        break;
      }

      case 'ANALOG_FILTER': {
        const inA = resolveInput(block, 'A', '0.0f', 'analog');
        const tc = Number(block.params.timeConstant ?? 500);
        logicLines.push(`    filter_${ident}.update(${inA}, ${tc.toFixed(2)}f, (float)dt);`);
        logicLines.push(`    float sig_${ident}_Q = filter_${ident}.filtered;`);
        break;
      }

      case 'AVERAGE': {
        const inA = resolveInput(block, 'A', '0.0f', 'analog');
        logicLines.push(`    avg_${ident}.update(${inA});`);
        logicLines.push(`    float sig_${ident}_Q = avg_${ident}.average;`);
        break;
      }

      case 'MIN_MAX': {
        const inA = resolveInput(block, 'A', '0.0f', 'analog');
        const inR = resolveInput(block, 'R', 'false', 'digital');
        logicLines.push(`    minmax_${ident}.update(${inA}, ${inR});`);
        logicLines.push(`    float sig_${ident}_MIN = minmax_${ident}.minVal;`);
        logicLines.push(`    float sig_${ident}_MAX = minmax_${ident}.maxVal;`);
        break;
      }

      case 'FLOAT_TO_INT': {
        const inA = resolveInput(block, 'A', '0.0f', 'analog');
        logicLines.push(`    long sig_${ident}_Q = (long)round(${inA});`);
        break;
      }

      case 'INT_TO_FLOAT': {
        const inA = resolveInput(block, 'A', '0', 'analog');
        logicLines.push(`    float sig_${ident}_Q = (float)(${inA});`);
        break;
      }

      case 'SCAN_DELAY': {
        // Output is the previous scan cycle's value!
        logicLines.push(`    bool sig_${ident}_Q = scan_delay_${ident};`);
        break;
      }

      case 'ANALOG_SCAN_DELAY': {
        logicLines.push(`    float sig_${ident}_Q = scan_delay_${ident};`);
        break;
      }

      case 'HOURS_COUNTER': {
        const inA = resolveInput(block, 'A', 'false', 'digital');
        const inR = resolveInput(block, 'R', 'false', 'digital');
        const limitVal = Number(block.params.limit ?? 100);
        logicLines.push(`    hours_${ident}.update(${inA}, ${inR}, dt, ${limitVal}.0f);`);
        logicLines.push(`    bool sig_${ident}_Q = hours_${ident}.Q;`);
        logicLines.push(`    float sig_${ident}_CV = hours_${ident}.hours;`);
        break;
      }

      case 'OPEN_CONNECTOR':
        // No-op
        break;

      default: {
        // Safe generic fallback for any other block
        const kind = def?.outputs[0]?.kind ?? 'digital';
        if (kind === 'analog') {
          logicLines.push(`    float sig_${ident}_Q = 0.0f; // Unsupported block fallback`);
        } else {
          logicLines.push(`    bool sig_${ident}_Q = false; // Unsupported block fallback`);
        }
        break;
      }
    }

    // Telemetry print item
    const isOut = block.type === 'OUTPUT' || block.type === 'ANALOG_OUTPUT';
    const isIn = block.type === 'INPUT' || block.type === 'NC_INPUT' || block.type === 'ANALOG_INPUT';
    if (isOut || isIn) {
      const label = block.label || block.id;
      const isAnalog = block.type.includes('ANALOG');
      telemetryPrintStatements.push(`    Serial.print(F(" ${label}="));`);
      if (isAnalog) {
        telemetryPrintStatements.push(`    Serial.print(sig_${ident}_Q, 2);`);
      } else {
        telemetryPrintStatements.push(`    Serial.print(sig_${ident}_Q ? F("ON") : F("OFF"));`);
      }
    }
  }

  // Update scan delay values for the subsequent scan
  const scanDelayUpdates: string[] = [];
  for (const block of scanDelayBlocks) {
    const ident = sanitizeCppIdent(block.id);
    const inA = resolveInput(block, 'A', block.type === 'SCAN_DELAY' ? 'false' : '0.0f', block.type === 'SCAN_DELAY' ? 'digital' : 'analog');
    scanDelayUpdates.push(`    scan_delay_${ident} = ${inA};`);
  }

  // Generate complete sketch text
  return `/*
 * =====================================================================
 *  AutomationHub - Standalone PLC Sketch for Arduino
 * =====================================================================
 *  Circuit Name: ${doc.name || 'Untitled Circuit'}
 *  Target Board: ${preset.name}
 *  Scan Cycle:   ${config.scanCycleMs} ms (deterministic non-blocking timing)
 *  Telemetry:    ${config.enableSerialTelemetry ? `Enabled @ ${preset.defaultBaudRate} baud` : 'Disabled'}
 *  Generated by: AutomationHub Studio
 *
 *  HARDWARE WIRING DIRECTORY:
${Object.entries(config.pinAssignments)
  .map(([bId, a]) => {
    const b = doc.blocks.find(item => item.id === bId);
    return ` *    Pin ${a.pinNumber.padEnd(5)} -> [${b?.type ?? 'IO'}] "${a.comment || b?.label || bId}" (${a.mode}${a.invertLogic ? ', inverted' : ''})`;
  })
  .join('\n')}
 * =====================================================================
 */

#define ENABLE_SERIAL_TELEMETRY ${config.enableSerialTelemetry ? '1' : '0'}
#define SCAN_CYCLE_MS           ${config.scanCycleMs}UL
#define TELEMETRY_INTERVAL_MS   ${config.telemetryIntervalMs}UL

// ---------------------------------------------------------------------
// HARDWARE PIN ASSIGNMENTS
// ---------------------------------------------------------------------
${pinConstants.length > 0 ? pinConstants.join('\n') : '// No physical I/O blocks assigned.'}

// ---------------------------------------------------------------------
// ZERO-DEPENDENCY INDUSTRIAL PLC RUNTIME STRUCTS
// ---------------------------------------------------------------------

// On-Delay Timer (TON)
struct TON_Timer {
  unsigned long startTime = 0;
  bool running = false;
  bool Q = false;
  unsigned long ET = 0;
  void update(bool IN, unsigned long PT, unsigned long now) {
    if (IN) {
      if (!running) {
        running = true;
        startTime = now;
        ET = 0;
      } else {
        ET = now - startTime;
        if (ET >= PT) {
          ET = PT;
          Q = true;
        }
      }
    } else {
      running = false;
      Q = false;
      ET = 0;
    }
  }
};

// Off-Delay Timer (TOF)
struct TOF_Timer {
  unsigned long startTime = 0;
  bool running = false;
  bool Q = false;
  unsigned long ET = 0;
  void update(bool IN, unsigned long PT, unsigned long now) {
    if (IN) {
      Q = true;
      running = false;
      ET = 0;
    } else {
      if (Q) {
        if (!running) {
          running = true;
          startTime = now;
          ET = 0;
        } else {
          ET = now - startTime;
          if (ET >= PT) {
            ET = PT;
            Q = false;
            running = false;
          }
        }
      }
    }
  }
};

// Pulse Timer (TP)
struct TP_Timer {
  unsigned long startTime = 0;
  bool running = false;
  bool Q = false;
  unsigned long ET = 0;
  void update(bool IN, unsigned long PT, unsigned long now) {
    if (IN && !running && !Q) {
      running = true;
      startTime = now;
      Q = true;
      ET = 0;
    }
    if (running) {
      ET = now - startTime;
      if (ET >= PT) {
        ET = PT;
        Q = false;
      }
    }
    if (!IN && !Q) {
      running = false;
      ET = 0;
    }
  }
};

// Dual On-Off Delay
struct ON_OFF_Delay {
  unsigned long onStart = 0;
  unsigned long offStart = 0;
  bool onRunning = false;
  bool offRunning = false;
  bool Q = false;
  void update(bool IN, unsigned long onDelay, unsigned long offDelay, unsigned long now) {
    if (IN) {
      offRunning = false;
      if (!Q) {
        if (!onRunning) { onRunning = true; onStart = now; }
        else if (now - onStart >= onDelay) { Q = true; onRunning = false; }
      }
    } else {
      onRunning = false;
      if (Q) {
        if (!offRunning) { offRunning = true; offStart = now; }
        else if (now - offStart >= offDelay) { Q = false; offRunning = false; }
      }
    }
  }
};

// Retentive Timer (RTO)
struct RetentiveTON {
  unsigned long ET = 0;
  bool Q = false;
  void update(bool IN, bool R, unsigned long PT, unsigned long dt) {
    if (R) {
      ET = 0;
      Q = false;
    } else if (IN && !Q) {
      ET += dt;
      if (ET >= PT) {
        ET = PT;
        Q = true;
      }
    }
  }
};

// Edge Detectors (R_TRIG & F_TRIG)
struct R_Trig {
  bool lastClk = false;
  bool Q = false;
  void update(bool clk) {
    Q = (clk && !lastClk);
    lastClk = clk;
  }
};

struct F_Trig {
  bool lastClk = false;
  bool Q = false;
  void update(bool clk) {
    Q = (!clk && lastClk);
    lastClk = clk;
  }
};

// Set-Reset Latch (Reset dominant)
struct RS_Latch {
  bool Q = false;
  void update(bool S, bool R) {
    if (R) Q = false;
    else if (S) Q = true;
  }
};

// Pulse Relay (Toggle Flip-Flop)
struct PulseRelay {
  bool lastTrig = false;
  bool Q = false;
  void update(bool trig, bool reset) {
    if (reset) {
      Q = false;
    } else if (trig && !lastTrig) {
      Q = !Q;
    }
    lastTrig = trig;
  }
};

// Up-Down Counter
struct UpDownCounter {
  long CV = 0;
  bool Q = false;
  bool lastCU = false;
  bool lastCD = false;
  void update(bool CU, bool CD, bool R, bool LD, long PV) {
    if (R) {
      CV = 0;
    } else if (LD) {
      CV = PV;
    } else {
      if (CU && !lastCU) CV++;
      if (CD && !lastCD) CV--;
    }
    lastCU = CU;
    lastCD = CD;
    Q = (CV >= PV);
  }
};

// Square-Wave Clock Generator
struct ClockGen {
  unsigned long lastToggle = 0;
  bool state = false;
  void update(unsigned long periodMs, unsigned long now) {
    if (periodMs == 0) periodMs = 100;
    if (now - lastToggle >= (periodMs / 2)) {
      lastToggle = now;
      state = !state;
    }
  }
};

// Analog Schmitt Trigger / Hysteresis
struct HysteresisTrigger {
  bool Q = false;
  void update(float input, float onThresh, float offThresh) {
    if (input >= onThresh) Q = true;
    else if (input <= offThresh) Q = false;
  }
};

// Analog Slew Rate Limiter / Ramp
struct AnalogRamp {
  float current = 0.0f;
  void update(float target, float riseRate, float fallRate, float dtSec) {
    if (target > current) {
      current += riseRate * dtSec;
      if (current > target) current = target;
    } else if (target < current) {
      current -= fallRate * dtSec;
      if (current < target) current = target;
    }
  }
};

// Proportional-Integral Controller (Anti-windup)
struct PIController {
  float integral = 0.0f;
  float update(float SP, float PV, float Kp, float Ki, float minOut, float maxOut, float dtSec, bool reset) {
    if (reset) {
      integral = 0.0f;
      return 0.0f;
    }
    float error = SP - PV;
    float P = Kp * error;
    integral += Ki * error * dtSec;
    if (integral > maxOut) integral = maxOut;
    if (integral < minOut) integral = minOut;
    float out = P + integral;
    if (out > maxOut) out = maxOut;
    if (out < minOut) out = minOut;
    return out;
  }
};

// Low-Pass Filter (EMA)
struct AnalogFilter {
  float filtered = 0.0f;
  bool initialized = false;
  void update(float input, float timeConstantMs, float dtMs) {
    if (!initialized) {
      filtered = input;
      initialized = true;
      return;
    }
    float alpha = dtMs / (timeConstantMs + dtMs);
    filtered = alpha * input + (1.0f - alpha) * filtered;
  }
};

// Rolling Moving Average
struct MovingAverage {
  float buffer[16] = {0};
  int head = 0;
  int count = 0;
  float average = 0.0f;
  void update(float input) {
    buffer[head] = input;
    head = (head + 1) % 16;
    if (count < 16) count++;
    float sum = 0.0f;
    for (int i = 0; i < count; i++) sum += buffer[i];
    average = sum / (float)count;
  }
};

// Min-Max Tracker
struct MinMaxTracker {
  float minVal = 999999.0f;
  float maxVal = -999999.0f;
  bool initialized = false;
  void update(float input, bool reset) {
    if (reset || !initialized) {
      minVal = input;
      maxVal = input;
      initialized = true;
    } else {
      if (input < minVal) minVal = input;
      if (input > maxVal) maxVal = input;
    }
  }
};

// Running Hours Counter
struct HoursCounter {
  float hours = 0.0f;
  bool Q = false;
  void update(bool run, bool reset, unsigned long dtMs, float limit) {
    if (reset) {
      hours = 0.0f;
      Q = false;
    } else if (run) {
      hours += ((float)dtMs / 3600000.0f);
      Q = (hours >= limit);
    }
  }
};

// ---------------------------------------------------------------------
// STATEFUL INSTANCES
// ---------------------------------------------------------------------
${statefulDeclarations.length > 0 ? statefulDeclarations.join('\n') : '// No stateful timers or latches required.'}

// ---------------------------------------------------------------------
// SETUP
// ---------------------------------------------------------------------
void setup() {
#if ENABLE_SERIAL_TELEMETRY
  Serial.begin(${preset.defaultBaudRate});
  while (!Serial && millis() < 1000) { /* wait for USB Serial on 32u4 / Pico */ }
  Serial.println(F("=================================================="));
  Serial.println(F(" AutomationHub PLC Engine Starting..."));
  Serial.println(F(" Circuit: ${doc.name.replace(/"/g, '\\"')}"));
  Serial.println(F(" Board:   ${preset.name}"));
  Serial.println(F("=================================================="));
#endif

${pinModeStatements.length > 0 ? pinModeStatements.join('\n') : '  // No hardware pin modes to configure.'}
}

// ---------------------------------------------------------------------
// DETERMINISTIC SCAN CYCLE LOOP
// ---------------------------------------------------------------------
void loop() {
  unsigned long now = millis();
  static unsigned long lastScan = 0;
  static unsigned long lastTelemetry = 0;

  // Scan cycle delta rate limiting
  unsigned long dt = now - lastScan;
  if (dt < SCAN_CYCLE_MS) {
    return; // Yield CPU to maintain non-blocking determinism
  }
  lastScan = now;

  // -------------------------------------------------------------------
  // TOPOLOGICAL LOGIC EVALUATION
  // -------------------------------------------------------------------
${logicLines.join('\n')}

  // -------------------------------------------------------------------
  // UPDATE SCAN-DELAY MEMORY (FOR PREVIOUS-SCAN FEEDBACK)
  // -------------------------------------------------------------------
${scanDelayUpdates.length > 0 ? scanDelayUpdates.join('\n') : '    // No scan delay feedback blocks.'}

  // -------------------------------------------------------------------
  // NON-BLOCKING SERIAL TELEMETRY MONITOR
  // -------------------------------------------------------------------
#if ENABLE_SERIAL_TELEMETRY
  if (now - lastTelemetry >= TELEMETRY_INTERVAL_MS) {
    lastTelemetry = now;
    Serial.print(F("[PLC SCAN] t="));
    Serial.print(now);
    Serial.print(F("ms |"));
${telemetryPrintStatements.length > 0 ? telemetryPrintStatements.join('\n') : '    Serial.print(F(" Active"));'}
    Serial.println();
  }
#endif
}
`;
}
