import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeArduinoExport,
  autoAssignPins,
  BOARD_PRESETS,
  generateArduinoSketch,
  sortBlocksTopologically,
  type ArduinoExportConfig,
} from '../src/lib/codegen/arduinoGenerator.ts';
import { parseCircuitDSL } from '../src/lib/automation/dsl.ts';
import { BLOCK_CATALOG } from '../src/lib/automation/catalog.ts';
import { LogicEngine } from '../src/lib/LogicEngine.ts';

const dsl = (code: string) => parseCircuitDSL(code, BLOCK_CATALOG);
const config = (doc: ReturnType<typeof dsl>, board: ArduinoExportConfig['board'] = 'uno', overrides: Partial<ArduinoExportConfig> = {}): ArduinoExportConfig => ({
  board,
  scanCycleMs: 10,
  enableSerialTelemetry: true,
  telemetryIntervalMs: 250,
  pinAssignments: autoAssignPins(doc, board),
  ...overrides,
});

const START_STOP = dsl(`circuit "Start/stop" version 1 {
  start: INPUT(label="Start PB")
  stop: INPUT(label="Stop PB")
  latch: RS_LATCH()
  timer: TON(duration=5000)
  main: OUTPUT(label="Main contactor")
  delta: OUTPUT(label="Delta contactor")
  pot: ANALOG_INPUT(label="Speed pot")
  drive: ANALOG_OUTPUT(label="Drive speed")
  start.Q -> latch.S
  stop.Q -> latch.R
  latch.Q -> main.A
  latch.Q -> timer.A
  timer.Q -> delta.A
  pot.Q -> drive.A
}`);

test('board presets have usable pin sets', () => {
  for (const preset of Object.values(BOARD_PRESETS)) {
    assert.ok(preset.availableDigitalPins.length >= 8, preset.id);
    assert.ok(preset.availableAnalogInPins.length >= 3, preset.id);
    assert.ok(preset.availablePwmPins.length >= 2, preset.id);
    for (const pin of preset.availablePwmPins) {
      assert.ok(preset.availableDigitalPins.includes(pin) || preset.id === 'pico' || preset.id === 'mega', `${preset.id} PWM pin ${pin} is a digital pin`);
    }
  }
});

test('pin allocation: buttons use pull-ups, analog outputs get PWM pins first, no pin is reused', () => {
  const pins = autoAssignPins(START_STOP, 'uno');
  assert.equal(pins.start.mode, 'INPUT_PULLUP');
  assert.equal(pins.start.invertLogic, true);
  assert.equal(pins.main.mode, 'OUTPUT');
  assert.equal(pins.pot.mode, 'ANALOG_INPUT');
  assert.match(pins.pot.pinNumber, /^A\d$/);
  assert.equal(pins.drive.mode, 'PWM_OUTPUT');
  assert.ok(BOARD_PRESETS.uno.availablePwmPins.includes(pins.drive.pinNumber));
  // Plain digital I/O avoids PWM pins while non-PWM pins remain.
  for (const id of ['start', 'stop', 'main', 'delta']) assert.ok(!BOARD_PRESETS.uno.availablePwmPins.includes(pins[id].pinNumber), id);
  const all = Object.values(pins).map((pin) => pin.pinNumber);
  assert.equal(new Set(all).size, all.length);
});

test('running out of pins is reported instead of inventing pin names', () => {
  const many = dsl(`circuit "many" version 1 {\n${Array.from({ length: 14 }, (_, i) => `  i${i}: INPUT()`).join('\n')}\n}`);
  const pins = autoAssignPins(many, 'uno');
  assert.equal(Object.keys(pins).length, BOARD_PRESETS.uno.availableDigitalPins.length);
  const issues = analyzeArduinoExport(many, { pinAssignments: pins });
  assert.equal(issues.length, 14 - BOARD_PRESETS.uno.availableDigitalPins.length);
  assert.match(generateArduinoSketch(many, config(many)), /#error ".*no pin assigned/);
});

test('tag readers are wired internally, not given a physical pin', () => {
  const doc = dsl(`circuit "tags" version 1 {
    b: INPUT()
    run: OUTPUT(tag="Run")
    echo: INPUT(tag="Run")
    lamp: OUTPUT()
    b.Q -> run.A
    echo.Q -> lamp.A
  }`);
  const pins = autoAssignPins(doc, 'uno');
  assert.equal(pins.echo, undefined);
  const code = generateArduinoSketch(doc, config(doc));
  assert.match(code, /sig_echo_Q = sig_run_Q;/);
});

test('execution order matches the simulator exactly', () => {
  const engine = new LogicEngine();
  engine.load(START_STOP);
  const engineOrder = (engine as unknown as { order: string[] }).order;
  assert.deepEqual(sortBlocksTopologically(START_STOP).map((block) => block.id), engineOrder);
});

test('sketch structure: non-blocking scan, pull-ups, telemetry, escaped labels', () => {
  const doc = dsl(`circuit "Quote \\"*/ test" version 1 {
    b: INPUT(label="Say \\"hi\\" \\\\ */")
    q: OUTPUT()
    b.Q -> q.A
  }`);
  const code = generateArduinoSketch(doc, config(doc));
  assert.ok(!code.includes('delay('), 'never blocks');
  assert.match(code, /if \(dt < SCAN_CYCLE_MS\) return;/);
  assert.match(code, /pinMode\(PIN_B, INPUT_PULLUP\);/);
  assert.match(code, /digitalRead\(PIN_B\) == LOW/);
  assert.match(code, /Serial\.begin\(115200\)/);
  assert.ok(code.includes('F(" Say \\"hi\\" \\\\ */=")'), 'label escaped inside the string literal');
  const header = code.slice(0, code.indexOf('*/'));
  assert.ok(header.includes('Quote "* / test'), 'circuit name cannot close the header comment early');
});

test('ESP32 sketches scale the 12-bit ADC', () => {
  const code = generateArduinoSketch(START_STOP, config(START_STOP, 'esp32', { enableSerialTelemetry: false }));
  assert.match(code, /analogRead\(PIN_POT\) \/ 4095\.0f/);
  assert.match(code, /ENABLE_SERIAL_TELEMETRY 0/);
});

test('simulation-only and unsupported blocks stop compilation with a clear message', () => {
  const doc = dsl(`circuit "plant" version 1 {
    v: ANALOG_INPUT()
    m: DC_MOTOR()
    r: RANDOM()
    v.Q -> m.V
  }`);
  const issues = analyzeArduinoExport(doc);
  assert.equal(issues.length, 2);
  const code = generateArduinoSketch(doc, config(doc));
  assert.match(code, /#error ".*DC_MOTOR.*no hardware equivalent/);
  assert.match(code, /#error ".*RANDOM.*not supported/);
});
