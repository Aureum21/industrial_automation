import assert from 'node:assert/strict';
import test from 'node:test';
import {
  autoAssignPins,
  BOARD_PRESETS,
  generateArduinoSketch,
  sortBlocksTopologically,
  type ArduinoExportConfig,
} from '../src/lib/codegen/arduinoGenerator.ts';
import type { CircuitDocument } from '../src/lib/automation/types.ts';

test('Board presets have valid pin configurations', () => {
  const boards = ['uno', 'nano', 'mega', 'esp32', 'pico'] as const;
  for (const b of boards) {
    const preset = BOARD_PRESETS[b];
    assert.ok(preset, `Preset exists for ${b}`);
    assert.ok(preset.availableDigitalPins.length >= 8, `${b} has sufficient digital pins`);
    assert.ok(preset.availableAnalogInPins.length >= 3, `${b} has analog inputs`);
    assert.ok(preset.availablePwmPins.length >= 2, `${b} has PWM pins`);
    assert.ok(preset.adcMaxRaw > 0, `${b} has valid ADC resolution`);
  }
});

test('Auto-pin allocator assigns appropriate pins for inputs, outputs, and analog', () => {
  const doc: CircuitDocument = {
    version: 1,
    name: 'Test Setup',
    blocks: [
      { id: 'btn_start', type: 'INPUT', position: { x: 0, y: 0 }, params: {}, label: 'Start Button' },
      { id: 'btn_stop', type: 'INPUT', position: { x: 0, y: 50 }, params: {}, label: 'Stop Button' },
      { id: 'pot', type: 'ANALOG_INPUT', position: { x: 0, y: 100 }, params: { min: 0, max: 100 } },
      { id: 'motor', type: 'OUTPUT', position: { x: 200, y: 0 }, params: {}, label: 'Motor Contactor' },
      { id: 'speed_out', type: 'ANALOG_OUTPUT', position: { x: 200, y: 100 }, params: { min: 0, max: 100 } },
    ],
    connections: [],
  };

  const assignments = autoAssignPins(doc, 'uno');

  // Both digital inputs should be INPUT_PULLUP with invertLogic true
  assert.equal(assignments.btn_start.mode, 'INPUT_PULLUP');
  assert.equal(assignments.btn_start.invertLogic, true);
  assert.equal(assignments.btn_stop.mode, 'INPUT_PULLUP');
  assert.equal(assignments.btn_stop.invertLogic, true);
  assert.notEqual(assignments.btn_start.pinNumber, assignments.btn_stop.pinNumber);

  // Analog input should be ANALOG_INPUT (e.g. A0)
  assert.equal(assignments.pot.mode, 'ANALOG_INPUT');
  assert.match(assignments.pot.pinNumber, /^A\d+$/);

  // Motor should be OUTPUT
  assert.equal(assignments.motor.mode, 'OUTPUT');

  // Analog output should be PWM_OUTPUT on a PWM-capable pin (3, 5, 6, 9, 10, 11)
  assert.equal(assignments.speed_out.mode, 'PWM_OUTPUT');
  assert.ok(BOARD_PRESETS.uno.availablePwmPins.includes(assignments.speed_out.pinNumber));
});

test('Topological sorter orders blocks so inputs precede dependent logic', () => {
  const doc: CircuitDocument = {
    version: 1,
    name: 'Topological Test',
    blocks: [
      { id: 'out1', type: 'OUTPUT', position: { x: 300, y: 0 }, params: {} },
      { id: 'and1', type: 'AND', position: { x: 200, y: 0 }, params: {} },
      { id: 'in1', type: 'INPUT', position: { x: 0, y: 0 }, params: {} },
      { id: 'in2', type: 'INPUT', position: { x: 0, y: 50 }, params: {} },
    ],
    connections: [
      { id: 'w1', fromBlockId: 'in1', fromPin: 'Q', toBlockId: 'and1', toPin: 'A' },
      { id: 'w2', fromBlockId: 'in2', fromPin: 'Q', toBlockId: 'and1', toPin: 'B' },
      { id: 'w3', fromBlockId: 'and1', fromPin: 'Q', toBlockId: 'out1', toPin: 'A' },
    ],
  };

  const sorted = sortBlocksTopologically(doc);
  const ids = sorted.map(b => b.id);

  // in1 and in2 must appear before and1, and and1 must appear before out1
  assert.ok(ids.indexOf('in1') < ids.indexOf('and1'));
  assert.ok(ids.indexOf('in2') < ids.indexOf('and1'));
  assert.ok(ids.indexOf('and1') < ids.indexOf('out1'));
});

test('Generates complete, non-blocking Arduino sketch for Industrial Start/Stop Latch with TON Timer', () => {
  const doc: CircuitDocument = {
    version: 1,
    name: 'Start Stop Motor with Star-Delta TON',
    blocks: [
      { id: 'start_btn', type: 'INPUT', position: { x: 50, y: 50 }, params: {}, label: 'Start PB' },
      { id: 'stop_btn', type: 'INPUT', position: { x: 50, y: 150 }, params: {}, label: 'Stop PB' },
      { id: 'latch', type: 'RS_LATCH', position: { x: 200, y: 100 }, params: {} },
      { id: 'timer', type: 'TON', position: { x: 350, y: 100 }, params: { duration: 5000 } },
      { id: 'main_contactor', type: 'OUTPUT', position: { x: 500, y: 50 }, params: {}, label: 'Main Contactor' },
      { id: 'delta_contactor', type: 'OUTPUT', position: { x: 500, y: 150 }, params: {}, label: 'Delta Contactor' },
    ],
    connections: [
      { id: 'w1', fromBlockId: 'start_btn', fromPin: 'Q', toBlockId: 'latch', toPin: 'S' },
      { id: 'w2', fromBlockId: 'stop_btn', fromPin: 'Q', toBlockId: 'latch', toPin: 'R' },
      { id: 'w3', fromBlockId: 'latch', fromPin: 'Q', toBlockId: 'main_contactor', toPin: 'A' },
      { id: 'w4', fromBlockId: 'latch', fromPin: 'Q', toBlockId: 'timer', toPin: 'IN' },
      { id: 'w5', fromBlockId: 'timer', fromPin: 'Q', toBlockId: 'delta_contactor', toPin: 'A' },
    ],
  };

  const pinAssignments = autoAssignPins(doc, 'uno');
  const config: ArduinoExportConfig = {
    board: 'uno',
    scanCycleMs: 10,
    enableSerialTelemetry: true,
    telemetryIntervalMs: 250,
    pinAssignments,
  };

  const code = generateArduinoSketch(doc, config);

  // 1. Check zero-dependency runtime structs are present
  assert.match(code, /struct TON_Timer/);
  assert.match(code, /struct RS_Latch/);

  // 2. Check pin configurations and setup
  assert.match(code, /pinMode\(PIN_START_BTN, INPUT_PULLUP\);/);
  assert.match(code, /pinMode\(PIN_STOP_BTN, INPUT_PULLUP\);/);
  assert.match(code, /pinMode\(PIN_MAIN_CONTACTOR, OUTPUT\);/);
  assert.match(code, /pinMode\(PIN_DELTA_CONTACTOR, OUTPUT\);/);

  // 3. Check non-blocking execution (no delay() allowed)
  assert.ok(!code.includes('delay('), 'Generated sketch must never call blocking delay()');
  assert.match(code, /millis\(\)/);
  assert.match(code, /SCAN_CYCLE_MS\s+10UL/);

  // 4. Check inverted digitalRead logic for INPUT_PULLUP
  assert.match(code, /digitalRead\(PIN_START_BTN\) == LOW/);

  // 5. Check latch and timer evaluation
  assert.match(code, /latch_latch\.update/);
  assert.match(code, /timer_timer\.update/);

  // 6. Check serial telemetry
  assert.match(code, /ENABLE_SERIAL_TELEMETRY 1/);
  assert.match(code, /Serial\.begin\(115200\)/);
  assert.match(code, /\[PLC SCAN\]/);
});

test('Generates ESP32 sketch with 12-bit ADC scaling (4095)', () => {
  const doc: CircuitDocument = {
    version: 1,
    name: 'Analog Tank Monitor',
    blocks: [
      { id: 'pressure_sensor', type: 'ANALOG_INPUT', position: { x: 50, y: 50 }, params: { min: 0, max: 100 }, label: 'Pressure' },
      { id: 'comp', type: 'ANALOG_COMPARATOR', position: { x: 200, y: 50 }, params: { operator: 'GT' } },
      { id: 'setpoint', type: 'ANALOG_CONSTANT', position: { x: 50, y: 150 }, params: { value: 75 } },
      { id: 'alarm_led', type: 'OUTPUT', position: { x: 350, y: 50 }, params: {}, label: 'High Alarm' },
    ],
    connections: [
      { id: 'w1', fromBlockId: 'pressure_sensor', fromPin: 'Q', toBlockId: 'comp', toPin: 'A' },
      { id: 'w2', fromBlockId: 'setpoint', fromPin: 'Q', toBlockId: 'comp', toPin: 'B' },
      { id: 'w3', fromBlockId: 'comp', fromPin: 'Q', toBlockId: 'alarm_led', toPin: 'A' },
    ],
  };

  const pinAssignments = autoAssignPins(doc, 'esp32');
  const config: ArduinoExportConfig = {
    board: 'esp32',
    scanCycleMs: 20,
    enableSerialTelemetry: false,
    telemetryIntervalMs: 500,
    pinAssignments,
  };

  const code = generateArduinoSketch(doc, config);

  // ESP32 ADC is 12-bit (4095)
  assert.match(code, /4095\.0f/);
  assert.match(code, /ENABLE_SERIAL_TELEMETRY 0/);
  assert.match(code, /ESP32/);
});
