/**
 * Simulator ↔ Arduino parity: each circuit is exported, compiled with the host C++ compiler
 * against a minimal fake Arduino core, driven with the same inputs as the LogicEngine, and every
 * output signal of every block is compared after every scan. Skipped when g++ is unavailable.
 */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { LogicEngine } from '../src/lib/LogicEngine.ts';
import { BLOCK_CATALOG } from '../src/lib/automation/catalog.ts';
import { parseCircuitDSL } from '../src/lib/automation/dsl.ts';
import type { CircuitDocument, Signal } from '../src/lib/automation/types.ts';
import { arduinoSignalName, autoAssignPins, generateArduinoSketch, type PinAssignment } from '../src/lib/codegen/arduinoGenerator.ts';

const hasCompiler = spawnSync('g++', ['--version']).status === 0;
const SCAN_MS = 100;

const FAKE_ARDUINO = `
#include <cstdio>
#include <cstdint>
#include <cmath>
#include <math.h>
#define HIGH 1
#define LOW 0
#define INPUT 0
#define OUTPUT 1
#define INPUT_PULLUP 2
#ifndef PI
#define PI 3.14159265358979323846
#endif
enum { A0 = 100, A1, A2, A3, A4, A5, A6, A7 };
static unsigned long fake_millis = 0;
static int fake_pin[256];
unsigned long millis() { return fake_millis; }
void pinMode(int, int) {}
int digitalRead(int pin) { return fake_pin[pin]; }
void digitalWrite(int pin, int value) { fake_pin[pin] = value; }
int analogRead(int pin) { return fake_pin[pin]; }
void analogWrite(int pin, int value) { fake_pin[pin] = value; }
template <class T> T constrain(T x, T lo, T hi) { return x < lo ? lo : (x > hi ? hi : x); }
struct FakeSerial { void begin(long) {} template <class T> void print(T) {} template <class T> void print(T, int) {} void println() {} template <class T> void println(T) {} template <class T> void println(T, int) {} } Serial;
#define F(x) x
`;

interface Step {
  set?: Record<string, Signal>;
  scans: number;
}

function runEngine(doc: CircuitDocument, steps: Step[], signals: { block: string; pin: string }[]): number[][] {
  const engine = new LogicEngine();
  engine.load(doc);
  const rows: number[][] = [];
  for (const step of steps) {
    for (const [id, value] of Object.entries(step.set ?? {})) engine.setInput(id, value);
    for (let i = 0; i < step.scans; i++) {
      engine.tick(SCAN_MS);
      rows.push(signals.map(({ block, pin }) => Number(engine.blocks.get(block)!.outputs[pin])));
    }
  }
  return rows;
}

function runSketch(doc: CircuitDocument, steps: Step[], signals: { block: string; pin: string }[]): number[][] {
  // Analog pins use an identity scale (raw ADC counts = engineering value) so tests can use integers.
  const pins = autoAssignPins(doc, 'mega');
  for (const assignment of Object.values(pins) as PinAssignment[]) {
    if (assignment.mode === 'ANALOG_INPUT') Object.assign(assignment, { scaleMin: 0, scaleMax: 1023 });
  }
  const sketch = generateArduinoSketch(doc, { board: 'mega', scanCycleMs: SCAN_MS, enableSerialTelemetry: false, telemetryIntervalMs: 1000, pinAssignments: pins });
  const pinRef = (id: string) => {
    const pin = pins[id].pinNumber;
    return /^A\d+$/.test(pin) ? pin : pin;
  };

  const body: string[] = ['int main() {', '  setup();'];
  for (const step of steps) {
    for (const [id, value] of Object.entries(step.set ?? {})) {
      const assignment = pins[id];
      assert.ok(assignment, `input ${id} has a pin`);
      const level = assignment.mode === 'ANALOG_INPUT' ? Number(value) : (value === true) !== assignment.invertLogic ? 1 : 0;
      body.push(`  fake_pin[${pinRef(id)}] = ${level};`);
    }
    body.push(`  for (int i = 0; i < ${step.scans}; i++) {`, `    fake_millis += ${SCAN_MS}; loop();`);
    body.push(`    printf("${signals.map(() => '%.9g').join(' ')}\\n", ${signals.map(({ block, pin }) => `(double)${arduinoSignalName(doc, block, pin)}`).join(', ')});`, '  }');
  }
  body.push('  return 0;', '}');

  // Pull-up inputs idle HIGH before the first step.
  const idle = Object.values(pins)
    .filter((assignment) => assignment.mode === 'INPUT_PULLUP')
    .map((assignment) => `  fake_pin[${assignment.pinNumber}] = 1;`);
  body.splice(1, 0, ...idle);

  const dir = mkdtempSync(join(tmpdir(), 'ah-parity-'));
  try {
    const source = join(dir, 'sketch.cpp');
    writeFileSync(source, `${FAKE_ARDUINO}\n${sketch}\n${body.join('\n')}\n`);
    execFileSync('g++', ['-std=c++17', '-O0', '-w', source, '-o', join(dir, 'sketch')], { stdio: 'pipe' });
    const output = execFileSync(join(dir, 'sketch'), { encoding: 'utf8' });
    return output.trim().split('\n').map((line) => line.split(' ').map(Number));
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? '';
    throw new Error(`Sketch failed to build or run:\n${stderr.slice(0, 2000)}\n---\n${sketch}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function assertParity(name: string, code: string, steps: Step[]) {
  const doc = parseCircuitDSL(code, BLOCK_CATALOG);
  const signals = doc.blocks.flatMap((block) =>
    BLOCK_CATALOG[block.type].outputs.filter((pin) => pin.kind !== 'text').map((pin) => ({ block: block.id, pin: pin.id })),
  );
  const expected = runEngine(doc, steps, signals);
  const actual = runSketch(doc, steps, signals);
  assert.equal(actual.length, expected.length, `${name}: scan count`);
  for (let scan = 0; scan < expected.length; scan++) {
    for (let i = 0; i < signals.length; i++) {
      const e = expected[scan][i];
      const a = actual[scan][i];
      const tolerance = 1e-4 * Math.max(1, Math.abs(e));
      if (!(Math.abs(e - a) <= tolerance)) {
        assert.fail(`${name}: ${signals[i].block}.${signals[i].pin} differs at scan ${scan + 1} (t=${(scan + 1) * SCAN_MS} ms): simulator ${e}, Arduino ${a}`);
      }
    }
  }
}

const opts = { skip: hasCompiler ? false : 'g++ not available' };

test('parity: logic, edges, latches and counters', opts, () => {
  assertParity('logic', `circuit "logic" version 1 {
    a: INPUT()  b: INPUT()  nc: NC_INPUT()
    and1: AND()  or1: OR()  not1: NOT()  xor1: XOR()  nand1: NAND()  nor1: NOR()  xnor1: XNOR()
    ae: AND_EDGE()  ne: NAND_EDGE()  rt: R_TRIG()  ft: F_TRIG()  tog: PULSE_RELAY()  rs: RS_LATCH()
    cnt: COUNTER(limit=3)  hi: HIGH()  lo: LOW()  q: OUTPUT()
    a.Q -> and1.A  b.Q -> and1.B  a.Q -> or1.A  nc.Q -> or1.B  a.Q -> not1.A  a.Q -> xor1.A  b.Q -> xor1.B
    a.Q -> nand1.A  b.Q -> nand1.B  a.Q -> nor1.A  b.Q -> nor1.B  a.Q -> xnor1.A  b.Q -> xnor1.B
    a.Q -> ae.A  hi.Q -> ae.B  a.Q -> ne.A  b.Q -> ne.B  a.Q -> rt.A  a.Q -> ft.A  rt.Q -> tog.A
    a.Q -> rs.S  b.Q -> rs.R  ae.Q -> cnt.CU  ft.Q -> cnt.CD  lo.Q -> cnt.R  tog.Q -> q.A
  }`, [
    { scans: 2 },
    { set: { a: true }, scans: 2 }, { set: { a: false }, scans: 1 },
    { set: { a: true }, scans: 1 }, { set: { a: false, b: true }, scans: 2 },
    { set: { a: true }, scans: 1 }, { set: { a: false, nc: true }, scans: 1 },
    { set: { a: true, b: false }, scans: 3 }, { set: { a: false }, scans: 2 },
  ]);
});

test('parity: timers', opts, () => {
  assertParity('timers', `circuit "timers" version 1 {
    a: INPUT()  r: INPUT()
    ton: TON(duration=500)  tof: TOF(duration=300)  onoff: ON_OFF_DELAY(onDelay=400, offDelay=200)
    rton: RETENTIVE_TON(duration=700)  tp: PULSE_TIMER(duration=300)  etp: EDGE_PULSE_TIMER(duration=400)
    clk: CLOCK(onTime=300, offTime=500)  sw: STOPWATCH()  hours: HOURS_COUNTER(limit=0.0002)
    duty: ANALOG_CONSTANT(value=30)  pwm: PWM(period=1000)
    a.Q -> ton.A  a.Q -> tof.A  a.Q -> onoff.A  a.Q -> rton.A  r.Q -> rton.R  a.Q -> tp.A  a.Q -> etp.A  r.Q -> etp.R
    a.Q -> sw.A  r.Q -> sw.R  a.Q -> hours.A  r.Q -> hours.R  duty.Q -> pwm.A
  }`, [
    { scans: 3 },
    { set: { a: true }, scans: 7 }, { set: { a: false }, scans: 4 },
    { set: { a: true }, scans: 2 }, { set: { a: false }, scans: 1 }, { set: { a: true }, scans: 6 },
    { set: { r: true }, scans: 1 }, { set: { r: false, a: false }, scans: 8 },
    { set: { a: true }, scans: 1 }, { set: { a: false }, scans: 1 }, { set: { a: true }, scans: 3 },
  ]);
});

test('parity: analog processing and control', opts, () => {
  assertParity('analog', `circuit "analog" version 1 {
    x: ANALOG_INPUT()  y: ANALOG_INPUT()  sp: ANALOG_CONSTANT(value=60)  en: INPUT()  sel: INPUT()
    add: MATH(operation="add")  sub: MATH(operation="subtract")  mul: MATH(operation="multiply")  div: MATH(operation="divide")
    gt: ANALOG_COMPARATOR(operation="gt")  lte: ANALOG_COMPARATOR(operation="lte")  eq: ANALOG_COMPARATOR(operation="eq")
    th: ANALOG_THRESHOLD(threshold=50)  amp: ANALOG_AMPLIFIER(gain=1.5, offset=-4)  mux: ANALOG_MUX()
    trunc: FLOAT_TO_INT()  real: INT_TO_FLOAT()
    filt: ANALOG_FILTER(timeConstant=400)  ramp: ANALOG_RAMP(riseRate=40, fallRate=25)  mm: MIN_MAX()  avg: AVERAGE(samples=4)
    wd: ANALOG_WATCHDOG(tolerance=5)  hyst: ANALOG_DIFFERENTIAL(onThreshold=70, offThreshold=40)  low: ANALOG_DIFFERENTIAL(onThreshold=20, offThreshold=35)
    pi: PI_CONTROLLER(kp=0.8, ki=0.5, min=0, max=100)  pid: PID_CONTROLLER(kp=1.2, ki=0.3, kd=0.05, min=-50, max=50)
    tf: TRANSFER_FUNCTION(gain=2, tau=600)  sq: SIGNAL_GENERATOR(type="square", freq=0.7, amp=10, offset=1)  tri: SIGNAL_GENERATOR(type="tri", freq=0.3, amp=5)
    sine: SIGNAL_GENERATOR(freq=0.5, amp=3)
    expr: MATH_EXPRESSION(expr="A > 50 ? clamp(A * 2 - B, 0, 150) : max(A, B) % 7 + sqrt(abs(B - A)) + (A >= B && !(B == 0))")
    x.Q -> add.A  y.Q -> add.B  x.Q -> sub.A  y.Q -> sub.B  x.Q -> mul.A  y.Q -> mul.B  x.Q -> div.A  y.Q -> div.B
    x.Q -> gt.A  y.Q -> gt.B  x.Q -> lte.A  y.Q -> lte.B  x.Q -> eq.A  y.Q -> eq.B
    x.Q -> th.A  x.Q -> amp.A  x.Q -> mux.A  y.Q -> mux.B  sel.Q -> mux.S  div.Q -> trunc.A  trunc.Q -> real.A
    x.Q -> filt.A  x.Q -> ramp.A  x.Q -> mm.A  sel.Q -> mm.R  x.Q -> avg.A  x.Q -> wd.A  en.Q -> wd.EN  x.Q -> hyst.A  x.Q -> low.A
    sp.Q -> pi.SP  x.Q -> pi.PV  en.Q -> pi.R  sp.Q -> pid.SP  y.Q -> pid.PV  en.Q -> pid.EN
    x.Q -> tf.A  en.Q -> sq.EN  en.Q -> tri.EN  en.Q -> sine.EN  x.Q -> expr.A  y.Q -> expr.B
  }`, [
    { set: { x: 10, y: 0 }, scans: 3 },
    { set: { x: 75, y: 4, en: true }, scans: 6 },
    { set: { x: 30, sel: true }, scans: 4 },
    { set: { x: 30, y: 30, sel: false }, scans: 3 },
    { set: { x: 90, y: 13, en: false }, scans: 6 },
    { set: { x: 15, y: 3, en: true }, scans: 8 },
  ]);
});

test('parity: shift register (8 and 32 bits) and data log', opts, () => {
  assertParity('shift', `circuit "shift" version 1 {
    d: INPUT()  clk: INPUT()  dir: INPUT()  r: INPUT()  v: ANALOG_INPUT()
    sr8: SHIFT_REGISTER(length=8)  sr32: SHIFT_REGISTER(length=32)  log: DATA_LOG(interval=300)
    d.Q -> sr8.D  clk.Q -> sr8.CLK  dir.Q -> sr8.DIR  r.Q -> sr8.R
    d.Q -> sr32.D  clk.Q -> sr32.CLK  dir.Q -> sr32.DIR  r.Q -> sr32.R
    v.Q -> log.A  d.Q -> log.EN
  }`, [
    ...Array.from({ length: 34 }, (_, i): Step[] => [
      { set: { d: i % 3 === 0, dir: i < 20, clk: true, v: i }, scans: 1 },
      { set: { clk: false }, scans: 1 },
    ]).flat(),
    { set: { r: true }, scans: 1 },
    { set: { r: false, dir: true }, scans: 1 },
  ]);
});

test('parity: tags, scan-delay feedback and analog outputs', opts, () => {
  assertParity('feedback', `circuit "feedback" version 1 {
    start: INPUT()  stop: INPUT()
    seal: OR()  run: AND()  nstop: NOT()  mem: SCAN_DELAY()  motor: OUTPUT(tag="Motor")
    echo: INPUT(tag="Motor")  echoNc: NC_INPUT(tag="Motor")  lamp: OUTPUT()  lampOff: OUTPUT()
    level: ANALOG_INPUT()  integ: MATH(operation="add")  amem: ANALOG_SCAN_DELAY()  aout: ANALOG_OUTPUT(tag="Total")  total: ANALOG_INPUT(tag="Total")
    start.Q -> seal.A  mem.Q -> seal.B  stop.Q -> nstop.A  seal.Q -> run.A  nstop.Q -> run.B  run.Q -> mem.A  run.Q -> motor.A
    echo.Q -> lamp.A  echoNc.Q -> lampOff.A
    level.Q -> integ.A  amem.Q -> integ.B  integ.Q -> amem.A  integ.Q -> aout.A
  }`, [
    { set: { level: 2 }, scans: 2 },
    { set: { start: true }, scans: 2 }, { set: { start: false }, scans: 3 },
    { set: { stop: true, level: 0 }, scans: 2 }, { set: { stop: false, level: 5 }, scans: 3 },
  ]);
});

test('every built-in masterclass lab exports to a sketch that compiles, or explains why not', opts, async () => {
  const { DEFAULT_MASTERCLASSES } = await import('../src/lib/defaultArticlesData.ts');
  const { analyzeArduinoExport } = await import('../src/lib/codegen/arduinoGenerator.ts');
  const dir = mkdtempSync(join(tmpdir(), 'ah-labs-'));
  const blocked: string[] = [];
  try {
    for (const post of DEFAULT_MASTERCLASSES) {
      for (const section of post.sections) {
        if (section.type !== 'lab') continue;
        const doc = parseCircuitDSL(section.dsl, BLOCK_CATALOG);
        const pins = autoAssignPins(doc, 'mega');
        const issues = analyzeArduinoExport(doc, { pinAssignments: pins });
        if (issues.length) {
          blocked.push(`${post.slug} / ${section.title}: ${issues.map((issue) => issue.message).join('; ')}`);
          continue;
        }
        const source = join(dir, 'lab.cpp');
        const sketch = generateArduinoSketch(doc, { board: 'mega', scanCycleMs: 10, enableSerialTelemetry: true, telemetryIntervalMs: 250, pinAssignments: pins });
        writeFileSync(source, `${FAKE_ARDUINO}\n${sketch}\nint main() { setup(); fake_millis = 10; loop(); return 0; }\n`);
        const result = spawnSync('g++', ['-std=c++17', '-fsyntax-only', '-w', source], { encoding: 'utf8' });
        assert.equal(result.status, 0, `${post.slug} / ${section.title} does not compile:\n${result.stderr.slice(0, 1500)}`);
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  if (blocked.length) console.log(`Labs that cannot be exported (by design):\n  ${blocked.join('\n  ')}`);
});
