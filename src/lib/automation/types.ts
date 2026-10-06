export type SignalKind = 'digital' | 'analog' | 'text';
export type Signal = boolean | number | string;
export type ParameterValue = number | string | boolean;

export type BlockType =
  | 'INPUT' | 'NC_INPUT' | 'CURSOR_KEY' | 'TD_FUNCTION_KEY' | 'SHIFT_REGISTER_BIT'
  | 'HIGH' | 'LOW' | 'OUTPUT' | 'OPEN_CONNECTOR' | 'FLAG'
  | 'ANALOG_INPUT' | 'ANALOG_OUTPUT' | 'ANALOG_FLAG' | 'ANALOG_CONSTANT'
  | 'NETWORK_INPUT' | 'NETWORK_ANALOG_INPUT' | 'NETWORK_OUTPUT' | 'NETWORK_ANALOG_OUTPUT'
  | 'AND' | 'AND_EDGE' | 'NAND' | 'NAND_EDGE' | 'OR' | 'NOR' | 'XOR' | 'XNOR' | 'NOT'
  | 'TON' | 'TOF' | 'ON_OFF_DELAY' | 'RETENTIVE_TON' | 'PULSE_TIMER' | 'EDGE_PULSE_TIMER'
  | 'CLOCK' | 'RANDOM' | 'STAIRWAY_SWITCH' | 'MULTIFUNCTION_SWITCH' | 'WEEKLY_TIMER'
  | 'YEARLY_TIMER' | 'ASTRONOMICAL_CLOCK' | 'STOPWATCH'
  | 'COUNTER' | 'HOURS_COUNTER' | 'FREQUENCY_TRIGGER'
  | 'MATH' | 'ANALOG_COMPARATOR' | 'ANALOG_THRESHOLD' | 'ANALOG_AMPLIFIER'
  | 'ANALOG_WATCHDOG' | 'ANALOG_DIFFERENTIAL' | 'ANALOG_MUX' | 'ANALOG_RAMP'
  | 'PI_CONTROLLER' | 'PWM' | 'ANALOG_FILTER' | 'MIN_MAX' | 'AVERAGE'
  | 'RS_LATCH' | 'PULSE_RELAY' | 'MESSAGE_TEXT' | 'SOFTKEY' | 'SHIFT_REGISTER'
  | 'MATH_ERROR' | 'FLOAT_TO_INT' | 'INT_TO_FLOAT' | 'DATA_LOG' | 'UDF'
  | 'R_TRIG' | 'F_TRIG' | 'SCAN_DELAY'
  | 'SERVO_AXIS' | 'DC_MOTOR' | 'KINEMATICS_2D' | 'INV_KINEMATICS_2D'
  | 'PID_CONTROLLER' | 'TRANSFER_FUNCTION' | 'SIGNAL_GENERATOR' | 'MATH_EXPRESSION';

export interface PinDefinition {
  id: string;
  label: string;
  kind: SignalKind;
}

export interface ParameterDefinition {
  key: string;
  label: string;
  defaultValue: ParameterValue;
  type: 'number' | 'text' | 'select' | 'boolean';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { label: string; value: string }[];
}

export interface BlockDefinition {
  type: BlockType;
  name: string;
  shortName: string;
  category: string;
  description: string;
  status: 'ready' | 'planned';
  phase: 1 | 2 | 3 | 4;
  inputs: PinDefinition[];
  outputs: PinDefinition[];
  parameters: ParameterDefinition[];
  stateful?: boolean;
  source?: boolean;
  tagged?: boolean;

}

export interface CircuitBlock {
  id: string;
  type: BlockType;
  position: { x: number; y: number };
  label?: string;
  tag?: string;
  value?: Signal;
  params: Record<string, ParameterValue>;
}

export interface CircuitConnection {
  id: string;
  fromBlockId: string;
  fromPin: string;
  toBlockId: string;
  toPin: string;
}

export interface HmiWidget {
  id: string;
  type: 'switch' | 'button' | 'light' | 'gauge' | 'slider' | 'bar' | 'value';
  tag: string;
  x: number;
  y: number;
  options?: Record<string, string | number | boolean>;
}

export interface CircuitDocument {
  version: 1;
  name: string;
  blocks: CircuitBlock[];
  connections: CircuitConnection[];
  widgets?: HmiWidget[];
}

export interface EngineSnapshot {
  timeMs: number;
  outputs: Record<string, Record<string, Signal>>;
}

export interface RuntimeBlock extends CircuitBlock {
  inputs: Record<string, Signal>;
  outputs: Record<string, Signal>;
  state: Record<string, Signal>;
}

export interface TestStep {
  afterMs: number;
  inputs: Record<string, Signal>;
  expect: { blockId: string; pin: string; value: Signal }[];
}

export interface CircuitTest {
  name: string;
  steps: TestStep[];
}
