import type { HowTo } from './types.ts';

/** Fourth batch of how-to guides. Verified by tests/howto.test.ts. */
export const HOW_TOS_BATCH_4: HowTo[] = [
  {
    slug: 'pump-control-two-float-switches',
    title: 'How to control a pump with two float switches (high and low level)',
    description: 'Fill a tank with a pump between a low and a high float switch, protect the pump from running dry and detect a stuck float. PLC logic you can run.',
    answer:
      'Start the pump when the low float drops (tank low) and stop it when the high float rises (tank full); a latch remembers the pump state in between. Add a dry-run interlock from the source and a fault when the high float is up while the low float is down, which is physically impossible.',
    level: 'beginner',
    explanation: `Two floats give the pump a **hysteresis band**, like a thermostat:

- **Pump latch**: Set = low float NOT covered (level below the low float). Reset = high float covered (tank full).
- Between the floats the latch keeps its state, so the pump fills all the way up and then rests until the level drops to the low float again.

Two protections:

- **Dry-run interlock**: the pump only runs while the source has water (a float or pressure switch on the suction side).
- **Float fault**: high float covered while the low float is not is impossible in a healthy tank, so one of the floats is stuck. The fault lamp lights, and the pump stays off because the high float resets the reset-dominant latch.`,
    circuit: `circuit "Two-float pump control" version 1 {
  low: INPUT(label="Low float covered")
  high: INPUT(label="High float covered")
  source: INPUT(label="Source has water", value=true)
  tankLow: NOT(label="Below low float")
  pumpMem: RS_LATCH(label="Filling")
  lowDry: NOT(label="Low float dry")
  floatFault: AND(label="Float fault")
  pumpLogic: AND(label="Run pump")
  pump: OUTPUT(label="Pump")
  fault: OUTPUT(label="Float fault lamp")
  low.Q -> tankLow.A
  tankLow.Q -> pumpMem.S
  high.Q -> pumpMem.R
  low.Q -> lowDry.A
  high.Q -> floatFault.A
  lowDry.Q -> floatFault.B
  pumpMem.Q -> pumpLogic.A
  source.Q -> pumpLogic.B
  pumpLogic.Q -> pump.A
  floatFault.Q -> fault.A
}`,
    inputs: [
      { id: 'low', type: 'INPUT', label: 'Low float covered', device: 'Float switch near the bottom; ON when in liquid' },
      { id: 'high', type: 'INPUT', label: 'High float covered', device: 'Float switch near the top; ON when in liquid' },
      { id: 'source', type: 'INPUT', label: 'Source has water', device: 'Float or pressure switch on the suction side' },
    ],
    outputs: [
      { id: 'pump', type: 'OUTPUT', label: 'Pump', device: 'Pump contactor' },
      { id: 'fault', type: 'OUTPUT', label: 'Float fault lamp', device: 'Indicator lamp' },
    ],
    tryIt: ['With both floats OFF (empty tank), the pump runs.', 'Switch Low float ON (level rising): still running. Switch High float ON: the pump stops.', 'Switch High OFF: the pump stays off until Low goes OFF too.'],
    steps: [
      { title: 'Set on low', text: 'NOT low float sets the pump latch.' },
      { title: 'Reset on high', text: 'The high float resets it; a reset-dominant latch makes "full" win.' },
      { title: 'Protect the pump', text: 'AND the latch with "source has water".' },
      { title: 'Check the floats', text: 'High without low is impossible: raise a fault.' },
    ],
    mistakes: [
      'Running the pump from the low float alone: it stops as soon as the level covers the float, and starts again seconds later.',
      'Floats that can tangle with each other or with the cable. Mount them on a guide tube.',
      'Using the same pair of floats for an emptying pump without swapping the logic: for draining, set on high and reset on low.',
    ],
    faq: [
      { q: 'How do I wire it for emptying (sump) instead of filling?', a: 'Swap the roles: Set = high float covered, Reset = low float NOT covered (dry). The pump starts when the sump is full and stops when it is empty.' },
      { q: 'Can I do it with one float?', a: 'Only with a float that has a built-in band (a cable float with a long tether). With one fixed switch you need a timer, and the pump short-cycles.' },
    ],
    blocks: ['RS_LATCH', 'AND', 'NOT'],
    challenges: ['tank-level', 'start-stop'],
    scenarios: [
      {
        name: 'Fill cycle',
        steps: [
          { action: 'Empty tank', set: { low: false, high: false, source: true }, waitMs: 200, expect: { pump: true, fault: false } },
          { action: 'Level covers the low float', set: { low: true }, waitMs: 1000, expect: { pump: true } },
          { action: 'Level reaches the high float', set: { high: true }, waitMs: 200, expect: { pump: false, fault: false } },
          { action: 'Level drops below the high float', set: { high: false }, waitMs: 1000, expect: { pump: false } },
          { action: 'Level drops below the low float', set: { low: false }, waitMs: 200, expect: { pump: true } },
        ],
      },
      {
        name: 'Protections',
        steps: [
          { action: 'Empty tank, source dry', set: { low: false, high: false, source: false }, waitMs: 300, expect: { pump: false } },
          { action: 'Source back', set: { source: true }, waitMs: 200, expect: { pump: true } },
          { action: 'High float stuck up while low is dry', set: { high: true }, waitMs: 200, expect: { pump: false, fault: true } },
        ],
      },
    ],
  },
  {
    slug: 'water-level-indicator-plc',
    title: 'Water level indicator with probes in a PLC (with probe fault check)',
    description: 'Show tank level on four lamps from four level probes, sound a buzzer when full and detect a faulty probe. Beginner PLC logic with a live simulator.',
    answer:
      'Each probe lights its lamp, but only if every probe below it is also wet; a wet probe above a dry one means a probe or wire fault. A buzzer sounds when the top probe is reached.',
    level: 'beginner',
    explanation: `Four probes at 25, 50, 75 and 100 % switch ON when they touch water.

- **Lamp 25 %** = probe 25.
- **Lamp 50 %** = probe 50 AND lamp 25, and so on upward. Lamps therefore always form a solid bar, even with a faulty probe.
- **Full buzzer** = lamp 100 %.
- **Probe fault** = any probe wet while the probe below it is dry. Water cannot skip a probe, so this is a fouled probe, a short or a broken wire.`,
    circuit: `circuit "Water level indicator" version 1 {
  p25: INPUT(label="Probe 25 %")
  p50: INPUT(label="Probe 50 %")
  p75: INPUT(label="Probe 75 %")
  p100: INPUT(label="Probe 100 %")
  l50: AND(label="50 % valid")
  l75: AND(label="75 % valid")
  l100: AND(label="100 % valid")
  dry25: NOT(label="25 % dry")
  dry50: NOT(label="50 % dry")
  dry75: NOT(label="75 % dry")
  bad50: AND(label="50 wet, 25 dry")
  bad75: AND(label="75 wet, 50 dry")
  bad100: AND(label="100 wet, 75 dry")
  bad1: OR(label="Fault low")
  badAll: OR(label="Probe fault")
  lamp25: OUTPUT(label="Lamp 25 %")
  lamp50: OUTPUT(label="Lamp 50 %")
  lamp75: OUTPUT(label="Lamp 75 %")
  lamp100: OUTPUT(label="Lamp 100 %")
  buzzer: OUTPUT(label="Full buzzer")
  fault: OUTPUT(label="Probe fault")
  p50.Q -> l50.A
  p25.Q -> l50.B
  p75.Q -> l75.A
  l50.Q -> l75.B
  p100.Q -> l100.A
  l75.Q -> l100.B
  p25.Q -> dry25.A
  p50.Q -> dry50.A
  p75.Q -> dry75.A
  p50.Q -> bad50.A
  dry25.Q -> bad50.B
  p75.Q -> bad75.A
  dry50.Q -> bad75.B
  p100.Q -> bad100.A
  dry75.Q -> bad100.B
  bad50.Q -> bad1.A
  bad75.Q -> bad1.B
  bad1.Q -> badAll.A
  bad100.Q -> badAll.B
  p25.Q -> lamp25.A
  l50.Q -> lamp50.A
  l75.Q -> lamp75.A
  l100.Q -> lamp100.A
  l100.Q -> buzzer.A
  badAll.Q -> fault.A
}`,
    inputs: [
      { id: 'p25', type: 'INPUT', label: 'Probe 25 %', device: 'Conductive probe via a level relay' },
      { id: 'p50', type: 'INPUT', label: 'Probe 50 %', device: 'Conductive probe via a level relay' },
      { id: 'p75', type: 'INPUT', label: 'Probe 75 %', device: 'Conductive probe via a level relay' },
      { id: 'p100', type: 'INPUT', label: 'Probe 100 %', device: 'Conductive probe via a level relay' },
    ],
    outputs: [
      { id: 'lamp25', type: 'OUTPUT', label: 'Lamp 25 %', device: 'Indicator lamp' },
      { id: 'lamp50', type: 'OUTPUT', label: 'Lamp 50 %', device: 'Indicator lamp' },
      { id: 'lamp75', type: 'OUTPUT', label: 'Lamp 75 %', device: 'Indicator lamp' },
      { id: 'lamp100', type: 'OUTPUT', label: 'Lamp 100 %', device: 'Indicator lamp' },
      { id: 'buzzer', type: 'OUTPUT', label: 'Full buzzer', device: 'Buzzer' },
      { id: 'fault', type: 'OUTPUT', label: 'Probe fault', device: 'Fault lamp' },
    ],
    tryIt: ['Switch the probes ON from the bottom up: the lamps follow, and the buzzer sounds at 100 %.', 'Switch only Probe 75 % ON: probe fault, and no lamp above 25 %.'],
    steps: [
      { title: 'Chain the lamps', text: 'Each lamp = its probe AND the lamp below.' },
      { title: 'Detect impossible states', text: 'A wet probe above a dry one is a fault.' },
      { title: 'Add the alarm', text: 'Buzzer on the top lamp.' },
    ],
    mistakes: [
      'Driving each lamp straight from its probe: a fouled probe shows a level that is not there.',
      'Using DC on conductive probes, which corrodes them quickly. Use a level relay that feeds AC to the probes.',
      'Forgetting that some liquids (oil, pure water) do not conduct; use float or capacitive sensors there.',
    ],
    faq: [
      { q: 'How do I get a percentage value instead of lamps?', a: 'Count the valid lamps (each is 25 %), or use a continuous level transmitter with 4–20 mA scaling.' },
      { q: 'Can the buzzer be silenced?', a: 'Yes: use the alarm acknowledge pattern from the alarm guide, with "lamp 100 %" as the alarm condition.' },
    ],
    blocks: ['AND', 'OR', 'NOT'],
    challenges: ['door-alarm', 'empty-hopper'],
    scenarios: [
      {
        name: 'Filling',
        steps: [
          { action: 'Empty', waitMs: 200, expect: { lamp25: false, buzzer: false, fault: false } },
          { action: '25 %', set: { p25: true }, waitMs: 200, expect: { lamp25: true, lamp50: false } },
          { action: '50 %', set: { p50: true }, waitMs: 200, expect: { lamp50: true, lamp75: false } },
          { action: '75 %', set: { p75: true }, waitMs: 200, expect: { lamp75: true, lamp100: false, buzzer: false } },
          { action: 'Full', set: { p100: true }, waitMs: 200, expect: { lamp100: true, buzzer: true, fault: false } },
        ],
      },
      {
        name: 'Probe faults',
        steps: [
          { action: 'Only 50 % wet', set: { p50: true }, waitMs: 200, expect: { lamp50: false, fault: true } },
          { action: 'Only 75 % wet', set: { p50: false, p75: true }, waitMs: 200, expect: { lamp75: false, fault: true } },
          { action: '25 and 75 wet', set: { p25: true }, waitMs: 200, expect: { lamp25: true, lamp75: false, fault: true } },
          { action: 'Only 100 % wet with 25-75 dry', set: { p25: false, p75: false, p100: true }, waitMs: 200, expect: { lamp100: false, buzzer: false, fault: true } },
          { action: '25, 50 and 100 wet', set: { p25: true, p50: true }, waitMs: 200, expect: { lamp50: true, lamp100: false, fault: true } },
        ],
      },
    ],
  },
  {
    slug: 'machine-stack-light-tower-plc',
    title: 'How to program a machine stack light (tower light) with buzzer',
    description: 'Green running, yellow warning, red flashing on a new fault and steady after acknowledge, plus a buzzer. Stack light logic you can run in the browser.',
    answer:
      'Drive green from "running and no fault", yellow from a warning, and red from the fault: flashing with the buzzer while the fault is unacknowledged, steady after acknowledge until it clears.',
    level: 'intermediate',
    explanation: `A common colour scheme (check your plant standard and IEC 60204-1):

| Lamp | Meaning |
|---|---|
| Green | Running normally |
| Yellow | Warning: attention needed soon (low material, door open in setup mode) |
| Red flashing + buzzer | New fault, not yet acknowledged |
| Red steady | Fault acknowledged but still present |

- **Unacknowledged** latch: set by the rising edge of the fault, reset by Acknowledge.
- **Red** = fault AND (flash OR acknowledged). **Buzzer** = fault AND unacknowledged.
- **Green** = running AND NOT fault. **Yellow** = warning AND NOT fault, so the tower never shows a mixed message during a fault.`,
    circuit: `circuit "Stack light" version 1 {
  running: INPUT(label="Machine running")
  warning: INPUT(label="Warning")
  fault: INPUT(label="Fault")
  ack: INPUT(label="Acknowledge")
  newFault: R_TRIG(label="New fault")
  unacked: RS_LATCH(label="Unacknowledged")
  acked: NOT(label="Acknowledged")
  flash: CLOCK(label="Flash", onTime=500, offTime=500)
  noFault: NOT(label="No fault")
  pattern: OR(label="Flash or steady")
  redLogic: AND(label="Red")
  buzzLogic: AND(label="Buzz")
  greenLogic: AND(label="Green")
  yellowLogic: AND(label="Yellow")
  green: OUTPUT(label="Green lamp")
  yellow: OUTPUT(label="Yellow lamp")
  red: OUTPUT(label="Red lamp")
  buzzer: OUTPUT(label="Buzzer")
  fault.Q -> newFault.A
  newFault.Q -> unacked.S
  ack.Q -> unacked.R
  unacked.Q -> acked.A
  fault.Q -> noFault.A
  flash.Q -> pattern.A
  acked.Q -> pattern.B
  fault.Q -> redLogic.A
  pattern.Q -> redLogic.B
  fault.Q -> buzzLogic.A
  unacked.Q -> buzzLogic.B
  running.Q -> greenLogic.A
  noFault.Q -> greenLogic.B
  warning.Q -> yellowLogic.A
  noFault.Q -> yellowLogic.B
  greenLogic.Q -> green.A
  yellowLogic.Q -> yellow.A
  redLogic.Q -> red.A
  buzzLogic.Q -> buzzer.A
}`,
    inputs: [
      { id: 'running', type: 'INPUT', label: 'Machine running', device: 'Internal status from the machine program' },
      { id: 'warning', type: 'INPUT', label: 'Warning', device: 'Low material, maintenance due, setup mode' },
      { id: 'fault', type: 'INPUT', label: 'Fault', device: 'Any machine fault (OR of all faults)' },
      { id: 'ack', type: 'INPUT', label: 'Acknowledge', device: 'Push button or HMI' },
    ],
    outputs: [
      { id: 'green', type: 'OUTPUT', label: 'Green lamp', device: 'Stack light green segment' },
      { id: 'yellow', type: 'OUTPUT', label: 'Yellow lamp', device: 'Stack light amber segment' },
      { id: 'red', type: 'OUTPUT', label: 'Red lamp', device: 'Stack light red segment' },
      { id: 'buzzer', type: 'OUTPUT', label: 'Buzzer', device: 'Stack light buzzer module' },
    ],
    tryIt: ['Switch Machine running ON: green.', 'Switch Fault ON: red flashes and the buzzer sounds; green goes off.', 'Switch Acknowledge on and off: red steady, buzzer off. Clear the fault.'],
    steps: [
      { title: 'Latch new faults', text: 'Rising edge of the fault sets "unacknowledged"; Acknowledge resets it.' },
      { title: 'Red pattern', text: 'Flash while unacknowledged, steady after.' },
      { title: 'Buzzer', text: 'Only while unacknowledged.' },
      { title: 'Green and yellow', text: 'Suppressed during a fault so the tower shows one message.' },
    ],
    mistakes: [
      'Letting green stay on during a fault because the machine is "still running".',
      'A buzzer that cannot be silenced: people disconnect it.',
      'Flashing red for warnings: keep red for faults so it keeps its meaning.',
    ],
    faq: [
      { q: 'What about blue and white segments?', a: 'Blue usually means "operator action required" (load material, confirm), white "other information". Drive them like yellow.' },
      { q: 'How do I show several faults?', a: 'OR all fault bits into the Fault input and give each its own HMI alarm text. The tower only needs to say that something is wrong.' },
    ],
    blocks: ['R_TRIG', 'RS_LATCH', 'CLOCK', 'AND', 'OR', 'NOT'],
    challenges: ['flashing-beacon'],
    never: [{ when: { green: true, red: true }, message: 'Green and red were on together' }],
    scenarios: [
      {
        name: 'Running, warning, fault, acknowledge',
        steps: [
          { action: 'Running', set: { running: true }, waitMs: 300, expect: { green: true, yellow: false, red: false } },
          { action: 'Warning', set: { warning: true }, waitMs: 300, expect: { green: true, yellow: true } },
          { action: 'Fault', set: { warning: false, fault: true }, waitMs: 200, expect: { green: false, buzzer: true } },
          { action: 'Red flashes for 3 s', waitMs: 3000, expect: { buzzer: true }, during: [{ id: 'red', onShare: [0.3, 0.7], minChanges: 4 }] },
          { action: 'Warning during the fault', set: { warning: true }, waitMs: 200, expect: { yellow: false } },
          { action: 'Acknowledge', set: { ack: true }, waitMs: 200, expect: { buzzer: false, red: true } },
          { action: 'Steady red', set: { ack: false }, waitMs: 2000, during: [{ id: 'red', onShare: [1, 1] }] },
          { action: 'Fault cleared', set: { fault: false, warning: false }, waitMs: 200, expect: { red: false, green: true } },
        ],
      },
    ],
  },
  {
    slug: 'emergency-stop-reset-plc-program',
    title: 'How to program an emergency stop with reset (PLC logic)',
    description: 'E-stop logic that stops the machine, needs the E-stop released and a reset before a restart, and never restarts by itself. With safety notes.',
    answer:
      'An emergency stop must drop all motion at once and keep it off until the E-stop is released AND a deliberate Reset is pressed; even then the machine only runs after a new Start. In practice the E-stop is wired through a safety relay or safety PLC, and the standard PLC only mirrors this logic for indication and sequencing.',
    level: 'beginner',
    explanation: `**Safety first:** an emergency stop function must be implemented with safety-rated components (a safety relay or a safety PLC, to the performance level from your risk assessment). A standard PLC program like this one is for learning and for the *non-safety* part: showing the status, blocking restarts in the program and guiding the operator.

The logic:

- **Safety OK** latch: Set = Reset pressed AND E-stop released. Reset = E-stop pressed (reset-dominant, so a held E-stop always wins).
- **Run** latch: Set = Start AND safety OK. Reset = Stop OR NOT safety OK.
- **Motor** = run AND safety OK.
- **Reset required** lamp = NOT safety OK.

Releasing the E-stop alone does nothing. Pressing Reset re-arms the system but does not start anything: the machine needs a new Start. That two-step restart is required by IEC 60204-1 / ISO 13850.`,
    circuit: `circuit "Emergency stop with reset" version 1 {
  estop: INPUT(label="E-stop pressed")
  reset: INPUT(label="Reset")
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  released: NOT(label="E-stop released")
  canReset: AND(label="Reset permitted")
  safety: RS_LATCH(label="Safety OK")
  notSafe: NOT(label="Not safe")
  canStart: AND(label="Start permitted")
  stopRun: OR(label="Stop or unsafe")
  run: RS_LATCH(label="Run")
  motorLogic: AND(label="Run motor")
  motor: OUTPUT(label="Motor")
  resetLamp: OUTPUT(label="Reset required lamp")
  estop.Q -> released.A
  reset.Q -> canReset.A
  released.Q -> canReset.B
  canReset.Q -> safety.S
  estop.Q -> safety.R
  safety.Q -> notSafe.A
  start.Q -> canStart.A
  safety.Q -> canStart.B
  stop.Q -> stopRun.A
  notSafe.Q -> stopRun.B
  canStart.Q -> run.S
  stopRun.Q -> run.R
  run.Q -> motorLogic.A
  safety.Q -> motorLogic.B
  motorLogic.Q -> motor.A
  notSafe.Q -> resetLamp.A
}`,
    inputs: [
      { id: 'estop', type: 'INPUT', label: 'E-stop pressed', device: 'Status from the safety relay (the E-stop itself is wired to the safety relay)' },
      { id: 'reset', type: 'INPUT', label: 'Reset', device: 'Blue reset push button' },
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
    ],
    outputs: [
      { id: 'motor', type: 'OUTPUT', label: 'Motor', device: 'Run command (power is removed by the safety relay)' },
      { id: 'resetLamp', type: 'OUTPUT', label: 'Reset required lamp', device: 'Illuminated reset button' },
    ],
    tryIt: ['At power-up the reset lamp is on: pulse Reset, then Start.', 'Switch E-stop pressed ON: the motor stops. Switch it OFF again: still stopped.', 'Pulse Reset, then Start.'],
    steps: [
      { title: 'Latch "safety OK"', text: 'Set by Reset with the E-stop released; reset by the E-stop. Reset wins if both.' },
      { title: 'Gate the run latch', text: 'Start only when safe; losing "safe" resets the run latch.' },
      { title: 'Require a new Start', text: 'Reset re-arms, it never starts the machine.' },
      { title: 'Show the state', text: 'Light the reset button while a reset is needed.' },
    ],
    mistakes: [
      'Building the E-stop only in a standard PLC program. A software bug or a stuck output must not prevent stopping: use a safety relay or safety PLC.',
      'Letting the machine restart when the E-stop is released.',
      'Making Reset start the machine, or accepting Reset while the E-stop is still pressed.',
    ],
    faq: [
      { q: 'What is the difference between Stop and E-stop?', a: 'Stop is an operational stop, usually controlled (stop category 1 or 2). The E-stop is a safety function for emergencies: it is always available, overrides everything and is typically category 0 or 1 according to IEC 60204-1.' },
      { q: 'Should the E-stop input be normally closed?', a: 'Yes. E-stop contacts are normally closed and monitored by the safety relay, so a broken wire causes a stop. This page uses "E-stop pressed" (ON = pressed) to make the logic easy to read.' },
    ],
    blocks: ['RS_LATCH', 'AND', 'OR', 'NOT'],
    challenges: ['guarded-machine', 'start-stop'],
    never: [{ when: { motor: true, resetLamp: true }, message: 'The motor ran while a reset was required' }],
    scenarios: [
      {
        name: 'E-stop, release, reset, start',
        steps: [
          { action: 'Power-up', waitMs: 300, expect: { resetLamp: true, motor: false } },
          { action: 'Start without reset', set: { start: true }, waitMs: 300, expect: { motor: false } },
          { action: 'Release Start, Reset', set: { start: false, reset: true }, waitMs: 200, expect: { resetLamp: false, motor: false } },
          { action: 'Release Reset, Start', set: { reset: false, start: true }, waitMs: 200, expect: { motor: true } },
          { action: 'Release Start, E-stop', set: { start: false, estop: true }, waitMs: 200, expect: { motor: false, resetLamp: true } },
          { action: 'Reset while E-stop pressed', set: { reset: true }, waitMs: 200, expect: { resetLamp: true } },
          { action: 'Release E-stop and Reset', set: { reset: false, estop: false }, waitMs: 500, expect: { motor: false, resetLamp: true } },
          { action: 'Reset', set: { reset: true }, waitMs: 200, expect: { resetLamp: false, motor: false } },
          { action: 'Start', set: { reset: false, start: true }, waitMs: 200, expect: { motor: true } },
          { action: 'Stop', set: { start: false, stop: true }, waitMs: 200, expect: { motor: false, resetLamp: false } },
        ],
      },
    ],
  },
  {
    slug: 'airlock-door-interlock-plc',
    title: 'How to program an airlock door interlock (only one door open)',
    description: 'Cleanroom or airlock interlock: a door unlocks on request only while the other door is closed and locked. Two-door interlock logic you can run.',
    answer:
      'Unlock a door only on request, only while the other door is closed, and only while the other door is not unlocked. Each unlock lasts a few seconds, so a door that is not opened locks again by itself.',
    level: 'intermediate',
    explanation: `Each door has a **closed switch** and an electric **lock**; each side has a **request button**.

- **Door A may unlock** = request A AND door B closed AND door B not unlocked.
- A **pulse timer** (5 s) keeps the lock released long enough to open the door.
- Door B is the mirror image.

Because each permission depends on the other door's lock, one of them reads the other through a one-scan delay. If both buttons are pressed in the same scan, door A wins and door B stays locked.

While door A is open, its closed switch is OFF, so door B cannot be released however often its button is pressed.`,
    circuit: `circuit "Airlock interlock" version 1 {
  reqA: INPUT(label="Request door A")
  reqB: INPUT(label="Request door B")
  closedA: INPUT(label="Door A closed", value=true)
  closedB: INPUT(label="Door B closed", value=true)
  unlockBPrev: SCAN_DELAY(label="Door B unlocked")
  bLocked: NOT(label="Door B locked")
  bSecure: AND(label="Door B closed and locked")
  permitA: AND(label="Release A")
  pulseA: PULSE_TIMER(label="Door A release time", duration=5000)
  aLocked: NOT(label="Door A locked")
  aSecure: AND(label="Door A closed and locked")
  permitB: AND(label="Release B")
  pulseB: PULSE_TIMER(label="Door B release time", duration=5000)
  unlockA: OUTPUT(label="Door A unlocked")
  unlockB: OUTPUT(label="Door B unlocked")
  pulseB.Q -> unlockBPrev.A
  unlockBPrev.Q -> bLocked.A
  closedB.Q -> bSecure.A
  bLocked.Q -> bSecure.B
  reqA.Q -> permitA.A
  bSecure.Q -> permitA.B
  permitA.Q -> pulseA.A
  pulseA.Q -> aLocked.A
  closedA.Q -> aSecure.A
  aLocked.Q -> aSecure.B
  reqB.Q -> permitB.A
  aSecure.Q -> permitB.B
  permitB.Q -> pulseB.A
  pulseA.Q -> unlockA.A
  pulseB.Q -> unlockB.A
}`,
    inputs: [
      { id: 'reqA', type: 'INPUT', label: 'Request door A', device: 'Push button or card reader at door A' },
      { id: 'reqB', type: 'INPUT', label: 'Request door B', device: 'Push button or card reader at door B' },
      { id: 'closedA', type: 'INPUT', label: 'Door A closed', device: 'Magnetic door contact' },
      { id: 'closedB', type: 'INPUT', label: 'Door B closed', device: 'Magnetic door contact' },
    ],
    outputs: [
      { id: 'unlockA', type: 'OUTPUT', label: 'Door A unlocked', device: 'Electric strike or maglock release' },
      { id: 'unlockB', type: 'OUTPUT', label: 'Door B unlocked', device: 'Electric strike or maglock release' },
    ],
    tryIt: ['Pulse Request door A: door A unlocks for 5 s.', 'Switch Door A closed OFF (door open) and pulse Request door B: B stays locked.', 'Close door A and request B again.'],
    steps: [
      { title: 'Check the other door', text: 'Closed switch AND not unlocked.' },
      { title: 'Release on request', text: 'A pulse timer keeps the lock released for a few seconds.' },
      { title: 'Break the loop', text: 'One side reads the other\'s lock through a one-scan delay; simultaneous requests favour door A.' },
    ],
    mistakes: [
      'Checking only "closed" and not "unlocked": both doors can be released at once if requested together.',
      'Life safety: escape routes must open in an emergency. Fire alarm and emergency release override the interlock in hardware.',
      'A door contact that reads "closed" while the door is ajar. Mount it so the door must be fully closed and latched.',
    ],
    faq: [
      { q: 'How do I add a "door open too long" alarm?', a: 'Put an on-delay (for example 30 s) on NOT door closed and sound a buzzer when it is done.' },
      { q: 'How do I show availability to people?', a: 'Light a green lamp at door A when door B is closed and locked (the same condition as the permission), and red otherwise.' },
    ],
    blocks: ['PULSE_TIMER', 'SCAN_DELAY', 'AND', 'NOT'],
    challenges: ['two-hand-start', 'guarded-machine'],
    never: [{ when: { unlockA: true, unlockB: true }, message: 'Both doors were unlocked together' }],
    scenarios: [
      {
        name: 'One door at a time',
        steps: [
          { action: 'Request A', set: { closedA: true, closedB: true, reqA: true }, waitMs: 200, expect: { unlockA: true, unlockB: false } },
          { action: 'Door A opened; request B', set: { reqA: false, closedA: false, reqB: true }, waitMs: 300, expect: { unlockB: false } },
          { action: 'Door A closes, A lock times out', set: { reqB: false, closedA: true }, waitMs: 5000, expect: { unlockA: false } },
          { action: 'Request B', set: { reqB: true }, waitMs: 200, expect: { unlockB: true, unlockA: false } },
          { action: 'Request A while B is unlocked', set: { reqB: false, reqA: true }, waitMs: 300, expect: { unlockA: false } },
          { action: 'B times out, door B opened', set: { reqA: false }, waitMs: 5000, expect: { unlockB: false } },
          { action: 'Door B open, request A', set: { closedB: false, reqA: true }, waitMs: 300, expect: { unlockA: false } },
        ],
      },
      {
        name: 'Simultaneous requests',
        steps: [{ action: 'Both requests at once', set: { closedA: true, closedB: true, reqA: true, reqB: true }, waitMs: 500, expect: { unlockA: true, unlockB: false } }],
      },
    ],
  },
  {
    slug: 'automatic-transfer-switch-ats-plc',
    title: 'Automatic transfer switch (ATS) logic for a generator in a PLC',
    description: 'Mains failure detection, generator start delay, transfer, retransfer after mains is stable, generator cool-down, and a contactor interlock. Run it live.',
    answer:
      'When mains has been missing for a few seconds, start the generator and transfer the load once the generator is healthy. When mains returns, wait until it has been stable, transfer back, and let the generator run a cool-down period before stopping it. The mains and generator contactors must never close together.',
    level: 'advanced',
    explanation: `- **Mains failed** = on-delay (2 s) on NOT mains healthy. Short dips are ignored.
- **On generator** latch: Set = mains failed AND generator healthy. Reset = mains stable.
- **Mains stable** = on-delay (5 s) on mains healthy, so a flickering mains does not cause repeated transfers.
- **Mains contactor** = mains healthy AND NOT on generator.
- **Generator contactor** = on generator AND generator healthy.
- **Generator start** = off-delay (5 s) on (mains failed OR on generator), which gives the generator a cool-down run after retransfer.

The contactors are exclusive by construction: one needs "on generator", the other needs its opposite. Real ATS panels also use mechanically interlocked contactors or a changeover switch.`,
    circuit: `circuit "Automatic transfer switch" version 1 {
  mainsOk: INPUT(label="Mains healthy", value=true)
  genOk: INPUT(label="Generator healthy")
  mainsLost: NOT(label="Mains lost")
  failDelay: TON(label="Mains fail delay", duration=2000)
  stableDelay: TON(label="Mains stable delay", duration=5000)
  canTransfer: AND(label="Failed and gen ready")
  onGen: RS_LATCH(label="On generator")
  notOnGen: NOT(label="On mains")
  mainsLogic: AND(label="Mains contactor logic")
  genLogic: AND(label="Generator contactor logic")
  needGen: OR(label="Generator needed")
  cooldown: TOF(label="Cool-down", duration=5000)
  mainsC: OUTPUT(label="Mains contactor")
  genC: OUTPUT(label="Generator contactor")
  genStart: OUTPUT(label="Generator start")
  mainsOk.Q -> mainsLost.A
  mainsLost.Q -> failDelay.A
  mainsOk.Q -> stableDelay.A
  failDelay.Q -> canTransfer.A
  genOk.Q -> canTransfer.B
  canTransfer.Q -> onGen.S
  stableDelay.Q -> onGen.R
  onGen.Q -> notOnGen.A
  mainsOk.Q -> mainsLogic.A
  notOnGen.Q -> mainsLogic.B
  onGen.Q -> genLogic.A
  genOk.Q -> genLogic.B
  failDelay.Q -> needGen.A
  onGen.Q -> needGen.B
  needGen.Q -> cooldown.A
  mainsLogic.Q -> mainsC.A
  genLogic.Q -> genC.A
  cooldown.Q -> genStart.A
}`,
    inputs: [
      { id: 'mainsOk', type: 'INPUT', label: 'Mains healthy', device: 'Phase/voltage monitoring relay on the mains supply' },
      { id: 'genOk', type: 'INPUT', label: 'Generator healthy', device: 'Voltage/frequency OK from the generator controller' },
    ],
    outputs: [
      { id: 'mainsC', type: 'OUTPUT', label: 'Mains contactor', device: 'Mains-side contactor (mechanically interlocked)' },
      { id: 'genC', type: 'OUTPUT', label: 'Generator contactor', device: 'Generator-side contactor' },
      { id: 'genStart', type: 'OUTPUT', label: 'Generator start', device: 'Remote start input of the generator controller' },
    ],
    tryIt: ['Switch Mains healthy OFF: after 2 s the generator start turns on.', 'Switch Generator healthy ON: the load transfers.', 'Switch Mains healthy ON: after 5 s it transfers back, and the generator runs 5 s more.'],
    steps: [
      { title: 'Confirm the mains failure', text: 'An on-delay ignores short dips.' },
      { title: 'Start and transfer', text: 'Start the generator, transfer when it reports healthy.' },
      { title: 'Retransfer when stable', text: 'An on-delay on mains healthy resets the "on generator" latch.' },
      { title: 'Cool down', text: 'An off-delay keeps the generator start on after retransfer.' },
    ],
    mistakes: [
      'Transferring before the generator voltage and frequency are stable.',
      'Retransferring on the first sign of mains, which can bounce the load several times.',
      'Relying on PLC logic alone to keep the contactors apart. Use mechanically and electrically interlocked contactors or a transfer switch.',
    ],
    faq: [
      { q: 'What delays are typical?', a: 'Mains fail confirmation 1–5 s, retransfer after 1–30 minutes of stable mains, cool-down 2–5 minutes. The demo uses seconds.' },
      { q: 'What about a closed-transition (no-break) transfer?', a: 'That needs synchronising the generator to the mains before briefly paralleling them, and is done by a dedicated controller, not by simple logic.' },
    ],
    blocks: ['TON', 'TOF', 'RS_LATCH', 'AND', 'OR', 'NOT'],
    challenges: ['delayed-fan', 'stairwell-light'],
    never: [{ when: { mainsC: true, genC: true }, message: 'Mains and generator contactors were closed together' }],
    scenarios: [
      {
        name: 'Mains failure and return',
        steps: [
          { action: 'Normal', set: { mainsOk: true }, waitMs: 500, expect: { mainsC: true, genC: false, genStart: false } },
          { action: 'Mains fails', set: { mainsOk: false }, waitMs: 1000, expect: { mainsC: false, genStart: false } },
          { action: 'Confirmed after 2 s', waitMs: 1200, expect: { genStart: true, genC: false } },
          { action: 'Generator healthy', set: { genOk: true }, waitMs: 200, expect: { genC: true, mainsC: false } },
          { action: 'Mains returns', set: { mainsOk: true }, waitMs: 3000, expect: { genC: true, mainsC: false } },
          { action: 'Mains stable for 5 s', waitMs: 2500, expect: { genC: false, mainsC: true, genStart: true } },
          { action: 'Cool-down over', waitMs: 5500, expect: { genStart: false } },
        ],
      },
      {
        name: 'Short dip',
        steps: [
          { action: 'Mains dips for 1 s', set: { mainsOk: false }, waitMs: 1000 },
          { action: 'Mains back', set: { mainsOk: true }, waitMs: 500, expect: { mainsC: true, genStart: false } },
        ],
      },
    ],
  },
  {
    slug: 'air-compressor-control-plc',
    title: 'How to control an air compressor with pressure hysteresis and anti-short-cycle delay',
    description: 'Compressor control in PLC logic: start at 6 bar, stop at 8 bar, a minimum off time against short cycling, and a waiting lamp. Run it live.',
    answer:
      'Run the compressor between a cut-in and a cut-out pressure with a hysteresis switch, and block a restart until a minimum off time has passed since the last stop. That protects the motor from too many starts per hour.',
    level: 'intermediate',
    explanation: `- **Pressure switch logic**: a hysteresis switch with *on threshold 6 bar* and *off threshold 8 bar* (low trigger): demand ON at 6 bar or below, OFF at 8 bar or above.
- **Anti-short-cycle**: an on-delay (3 s in the demo, typically minutes) measures how long the motor has been stopped. A restart is allowed when it is done, or while the motor is already running.
- **Motor** = enabled AND demand AND restart allowed.
- **Waiting** lamp = demand AND NOT restart allowed, so operators know why the compressor does not start.

The off-time timer reads the motor state from the previous scan (one-scan delay), because the motor output depends on it. At power-up the timer also has to run once, which avoids every compressor on a site restarting at the same moment after a power cut.`,
    circuit: `circuit "Compressor control" version 1 {
  pressure: ANALOG_INPUT(label="Pressure (bar)", value=7)
  enable: INPUT(label="Compressor enabled", value=true)
  demand: ANALOG_DIFFERENTIAL(label="Cut-in 6 / cut-out 8 bar", onThreshold=6, offThreshold=8)
  wasRunning: SCAN_DELAY(label="Motor (last scan)")
  stopped: NOT(label="Motor stopped")
  offTime: TON(label="Minimum off time", duration=3000)
  restartOk: OR(label="Restart allowed")
  want: AND(label="Demand and enabled")
  motorLogic: AND(label="Run")
  waitingLogic: AND(label="Waiting")
  blocked: NOT(label="Restart blocked")
  motor: OUTPUT(label="Compressor motor")
  waiting: OUTPUT(label="Waiting lamp")
  pressure.Q -> demand.A
  motorLogic.Q -> wasRunning.A
  wasRunning.Q -> stopped.A
  stopped.Q -> offTime.A
  offTime.Q -> restartOk.A
  wasRunning.Q -> restartOk.B
  enable.Q -> want.A
  demand.Q -> want.B
  want.Q -> motorLogic.A
  restartOk.Q -> motorLogic.B
  restartOk.Q -> blocked.A
  want.Q -> waitingLogic.A
  blocked.Q -> waitingLogic.B
  motorLogic.Q -> motor.A
  waitingLogic.Q -> waiting.A
}`,
    inputs: [
      { id: 'pressure', type: 'ANALOG_INPUT', label: 'Pressure (bar)', device: 'Pressure transmitter on the receiver' },
      { id: 'enable', type: 'INPUT', label: 'Compressor enabled', device: 'Selector switch or schedule' },
    ],
    outputs: [
      { id: 'motor', type: 'OUTPUT', label: 'Compressor motor', device: 'Motor starter' },
      { id: 'waiting', type: 'OUTPUT', label: 'Waiting lamp', device: 'Indicator: restart delay active' },
    ],
    tryIt: ['Press Run and set the pressure to 5 bar: after the 3 s minimum off time, the motor starts.', 'Raise to 8 bar: it stops. Drop to 5 bar right away: the waiting lamp lights for 3 s, then it starts.'],
    steps: [
      { title: 'Pressure band', text: 'Hysteresis switch: cut-in 6 bar, cut-out 8 bar.' },
      { title: 'Measure the off time', text: 'On-delay on "motor stopped (last scan)".' },
      { title: 'Allow restart', text: 'Off time done OR already running.' },
      { title: 'Tell the operator', text: 'Light a lamp while the delay blocks a start.' },
    ],
    mistakes: [
      'A narrow pressure band: the compressor starts too often and the motor overheats.',
      'No restart delay after a power cut: all compressors start together and trip the supply.',
      'Starting a piston compressor against full head pressure. Real controls also unload the compressor during start (an unloader valve) and protect it with a hardwired high-pressure switch.',
    ],
    faq: [
      { q: 'How many starts per hour are allowed?', a: 'Check the motor and compressor data. Small motors often allow 10–15 starts per hour, large ones far fewer. Size the off time and the pressure band from that.' },
      { q: 'How do I add load/unload control?', a: 'For screw compressors, keep the motor running and switch a load valve between the pressures instead, and stop the motor only after it has run unloaded for a set time.' },
    ],
    blocks: ['ANALOG_DIFFERENTIAL', 'TON', 'SCAN_DELAY', 'AND', 'OR', 'NOT'],
    challenges: ['tank-level', 'delayed-fan'],
    scenarios: [
      {
        name: 'Cycle with restart delay',
        steps: [
          { action: 'Power-up at 5 bar', set: { pressure: 5, enable: true }, waitMs: 1000, expect: { motor: false, waiting: true } },
          { action: 'Minimum off time over', waitMs: 2500, expect: { motor: true, waiting: false } },
          { action: 'Pressure 7 bar', set: { pressure: 7 }, waitMs: 500, expect: { motor: true } },
          { action: 'Cut-out at 8 bar', set: { pressure: 8 }, waitMs: 200, expect: { motor: false } },
          { action: 'Pressure drops to 5 bar at once', set: { pressure: 5 }, waitMs: 1000, expect: { motor: false, waiting: true } },
          { action: 'Delay over', waitMs: 2500, expect: { motor: true, waiting: false } },
          { action: 'Disabled', set: { enable: false }, waitMs: 200, expect: { motor: false, waiting: false } },
        ],
      },
    ],
  },
  {
    slug: 'automatic-sliding-door-plc',
    title: 'PLC program for an automatic sliding door',
    description: 'Automatic door logic: open on presence, stay open a few seconds after the last person, reverse if someone steps in while closing, and a night lock.',
    answer:
      'Hold an "open request" with an off-delay timer fed by the presence sensor: the door opens immediately and closes a few seconds after the last detection. If someone is detected while it closes, the request comes back and the door reopens. Limit switches stop the motor at each end.',
    level: 'beginner',
    explanation: `- **Open request** = off-delay (3 s) on (presence AND NOT night lock).
- **Motor open** = open request AND NOT fully open.
- **Motor close** = NOT open request AND NOT fully closed.

The two motor directions use opposite conditions on the same signal, so they can never be on together. A person stepping into the doorway while it closes immediately turns the request back on and reverses the door, which is the most important safety behaviour of an automatic door. Real doors add a safety sensor in the closing edge and force limiting, typically required by EN 16005.

**Night lock** ignores the presence sensor so the door closes and stays closed.`,
    circuit: `circuit "Automatic sliding door" version 1 {
  presence: INPUT(label="Person detected")
  night: INPUT(label="Night lock")
  isOpen: INPUT(label="Fully open")
  isClosed: INPUT(label="Fully closed", value=true)
  dayMode: NOT(label="Not locked")
  wanted: AND(label="Person, door in service")
  hold: TOF(label="Hold open time", duration=3000)
  noRequest: NOT(label="No open request")
  notOpen: NOT(label="Not fully open")
  notClosed: NOT(label="Not fully closed")
  openLogic: AND(label="Open")
  closeLogic: AND(label="Close")
  motorOpen: OUTPUT(label="Motor open")
  motorClose: OUTPUT(label="Motor close")
  night.Q -> dayMode.A
  presence.Q -> wanted.A
  dayMode.Q -> wanted.B
  wanted.Q -> hold.A
  hold.Q -> noRequest.A
  isOpen.Q -> notOpen.A
  isClosed.Q -> notClosed.A
  hold.Q -> openLogic.A
  notOpen.Q -> openLogic.B
  noRequest.Q -> closeLogic.A
  notClosed.Q -> closeLogic.B
  openLogic.Q -> motorOpen.A
  closeLogic.Q -> motorClose.A
}`,
    inputs: [
      { id: 'presence', type: 'INPUT', label: 'Person detected', device: 'Radar motion and presence sensor' },
      { id: 'night', type: 'INPUT', label: 'Night lock', device: 'Key switch or schedule' },
      { id: 'isOpen', type: 'INPUT', label: 'Fully open', device: 'Limit switch or encoder position' },
      { id: 'isClosed', type: 'INPUT', label: 'Fully closed', device: 'Limit switch or encoder position' },
    ],
    outputs: [
      { id: 'motorOpen', type: 'OUTPUT', label: 'Motor open', device: 'Door drive, open direction' },
      { id: 'motorClose', type: 'OUTPUT', label: 'Motor close', device: 'Door drive, close direction' },
    ],
    tryIt: ['Switch Person detected ON: Motor open runs. Switch Fully closed OFF and Fully open ON: the motor stops.', 'Switch Person detected OFF: after 3 s the door closes.', 'Switch Person detected ON while closing: it reverses.'],
    steps: [
      { title: 'Hold the request', text: 'Off-delay on the presence sensor.' },
      { title: 'Open and close', text: 'Open while requested, close while not, each until its limit.' },
      { title: 'Reverse on presence', text: 'Comes for free: presence turns the request back on.' },
      { title: 'Night mode', text: 'AND the presence with NOT night lock.' },
    ],
    mistakes: [
      'Closing on a timer started at the first detection: the door closes on people who are still in the doorway.',
      'No reaction to presence while closing.',
      'Relying on the PLC alone for safety: door safety sensors and force limits are part of the certified door drive.',
    ],
    faq: [
      { q: 'How do I add a one-way (exit only) mode?', a: 'Use two sensors, inside and outside, and in exit-only mode AND the outside sensor with false (ignore it) while still using it as a safety sensor during closing.' },
      { q: 'What if a limit switch fails?', a: 'Add a maximum run time (on-delay on each motor direction) that stops the motor and raises a fault.' },
    ],
    blocks: ['TOF', 'AND', 'NOT'],
    challenges: ['stairwell-light'],
    never: [{ when: { motorOpen: true, motorClose: true }, message: 'The door motor was driven both ways' }],
    scenarios: [
      {
        name: 'Open, hold, close, reverse',
        steps: [
          { action: 'Closed and idle', set: { isClosed: true }, waitMs: 500, expect: { motorOpen: false, motorClose: false } },
          { action: 'Person arrives', set: { presence: true }, waitMs: 200, expect: { motorOpen: true } },
          { action: 'Door leaves closed and reaches open', set: { isClosed: false, isOpen: true }, waitMs: 200, expect: { motorOpen: false, motorClose: false } },
          { action: 'Person passes, 2 s later', set: { presence: false }, waitMs: 2000, expect: { motorClose: false } },
          { action: 'Hold time over', waitMs: 1500, expect: { motorClose: true } },
          { action: 'Door moving', set: { isOpen: false }, waitMs: 500, expect: { motorClose: true } },
          { action: 'Someone steps in', set: { presence: true }, waitMs: 200, expect: { motorClose: false, motorOpen: true } },
          { action: 'Fully open', set: { isOpen: true }, waitMs: 200, expect: { motorOpen: false } },
          { action: 'Leaves, door closes to the limit', set: { presence: false, isOpen: false }, waitMs: 3500, expect: { motorClose: true } },
          { action: 'Fully closed', set: { isClosed: true }, waitMs: 200, expect: { motorClose: false } },
        ],
      },
      {
        name: 'Night lock',
        steps: [{ action: 'Night lock, person', set: { night: true, presence: true, isClosed: true }, waitMs: 1000, expect: { motorOpen: false } }],
      },
    ],
  },
  {
    slug: 'conveyor-jam-detection-plc',
    title: 'How to detect a jam on a conveyor (PLC program)',
    description: 'Stop a conveyor when a product blocks the sensor too long, warn when no product arrives, and require reset and restart. Jam detection logic you can run.',
    answer:
      'Time how long the product sensor stays blocked while the conveyor runs: a product normally passes in a second or two, so a longer blockage is a jam. Latch the jam, stop the conveyor, and require the jam to be cleared, reset and the line restarted.',
    level: 'intermediate',
    explanation: `- **Jam timer**: on-delay (3 s) on running AND sensor blocked. Products moving normally pass well within that time.
- The timer sets a **jam latch**. Reset only works once the sensor is clear.
- The jam also resets the **run latch** (through a one-scan delay), so after the reset the operator presses Start deliberately.
- **No product** warning: on-delay (5 s) on running AND sensor clear. It restarts every time a product passes, so it only fires when the flow has stopped upstream.`,
    circuit: `circuit "Conveyor jam detection" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  sensor: INPUT(label="Product sensor blocked")
  reset: INPUT(label="Jam reset")
  jamPrev: SCAN_DELAY(label="Jammed (last scan)")
  stopOrJam: OR(label="Stop or jam")
  running: RS_LATCH(label="Running")
  blocked: AND(label="Blocked while running")
  jamTime: TON(label="Jam time", duration=3000)
  clear: NOT(label="Sensor clear")
  resetOk: AND(label="Reset with sensor clear")
  jam: RS_LATCH(label="Jammed")
  noJam: NOT(label="Not jammed")
  conveyorLogic: AND(label="Convey")
  idle: AND(label="Running, nothing seen")
  gapTime: TON(label="No product time", duration=5000)
  conveyor: OUTPUT(label="Conveyor")
  jamLamp: OUTPUT(label="Jam lamp")
  noProduct: OUTPUT(label="No product warning")
  jam.Q -> jamPrev.A
  stop.Q -> stopOrJam.A
  jamPrev.Q -> stopOrJam.B
  start.Q -> running.S
  stopOrJam.Q -> running.R
  running.Q -> blocked.A
  sensor.Q -> blocked.B
  blocked.Q -> jamTime.A
  sensor.Q -> clear.A
  reset.Q -> resetOk.A
  clear.Q -> resetOk.B
  jamTime.Q -> jam.S
  resetOk.Q -> jam.R
  jam.Q -> noJam.A
  running.Q -> conveyorLogic.A
  noJam.Q -> conveyorLogic.B
  running.Q -> idle.A
  clear.Q -> idle.B
  idle.Q -> gapTime.A
  conveyorLogic.Q -> conveyor.A
  jam.Q -> jamLamp.A
  gapTime.Q -> noProduct.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'sensor', type: 'INPUT', label: 'Product sensor blocked', device: 'Photoelectric sensor across the belt' },
      { id: 'reset', type: 'INPUT', label: 'Jam reset', device: 'Reset push button' },
    ],
    outputs: [
      { id: 'conveyor', type: 'OUTPUT', label: 'Conveyor', device: 'Conveyor contactor' },
      { id: 'jamLamp', type: 'OUTPUT', label: 'Jam lamp', device: 'Alarm lamp' },
      { id: 'noProduct', type: 'OUTPUT', label: 'No product warning', device: 'Warning lamp or HMI message' },
    ],
    tryIt: ['Switch Start on and off. Pass products by switching the sensor on and off quickly.', 'Leave the sensor ON for 3 s: jam, conveyor stops.', 'Clear the sensor, pulse Jam reset, then Start again.'],
    steps: [
      { title: 'Time the blockage', text: 'On-delay on running AND sensor blocked.' },
      { title: 'Latch the jam', text: 'Reset only with the sensor clear.' },
      { title: 'Stop and require Start', text: 'The jam resets the run latch.' },
      { title: 'Watch for no flow', text: 'On-delay on running AND sensor clear.' },
    ],
    mistakes: [
      'A jam time shorter than the longest product at the slowest speed: long products trip the alarm.',
      'Detecting jams while the conveyor is stopped (a product parked on the sensor is not a jam).',
      'Restarting automatically after the reset, with someone\'s hands still near the belt.',
    ],
    faq: [
      { q: 'How do I detect a jam between two sensors?', a: 'Count products in at the first sensor and out at the second with an up/down counter; if a product enters and none leaves within the travel time, the conveyor is jammed in between.' },
      { q: 'Should the jam stop upstream conveyors too?', a: 'Yes: combine with the sequential conveyor guide so every conveyor feeding the jammed one stops.' },
    ],
    blocks: ['TON', 'RS_LATCH', 'SCAN_DELAY', 'AND', 'OR', 'NOT'],
    challenges: ['delayed-fan', 'start-stop'],
    scenarios: [
      {
        name: 'Normal flow, then a jam',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 200, expect: { conveyor: true } },
          { action: 'Product passes', set: { start: false, sensor: true }, waitMs: 1000, expect: { jamLamp: false } },
          { action: 'Gap', set: { sensor: false }, waitMs: 2000, expect: { noProduct: false } },
          { action: 'Product stuck', set: { sensor: true }, waitMs: 3300, expect: { conveyor: false, jamLamp: true } },
          { action: 'Reset while still blocked', set: { reset: true }, waitMs: 200, expect: { jamLamp: true } },
          { action: 'Clear and reset', set: { reset: true, sensor: false }, waitMs: 200, expect: { jamLamp: false, conveyor: false } },
          { action: 'Press Start', set: { reset: false, start: true }, waitMs: 200, expect: { conveyor: true } },
        ],
      },
      {
        name: 'No product, and Stop',
        steps: [
          { action: 'Running with no product', set: { start: true }, waitMs: 5500, expect: { noProduct: true, conveyor: true } },
          { action: 'Product arrives', set: { start: false, sensor: true }, waitMs: 300, expect: { noProduct: false } },
          { action: 'Press Stop', set: { sensor: false, stop: true }, waitMs: 200, expect: { conveyor: false } },
          { action: 'Stopped with the sensor blocked: no jam', set: { stop: false, sensor: true }, waitMs: 4000, expect: { jamLamp: false } },
        ],
      },
    ],
  },
  {
    slug: 'hand-off-auto-hoa-switch-plc',
    title: 'How to program a Hand-Off-Auto (HOA) selector switch',
    description: 'Hand runs the motor regardless of the controller, Auto follows the automatic demand, Off stops it; overload always wins. HOA logic you can run live.',
    answer:
      'Read the selector as two inputs, Hand and Auto (both off means Off). The motor runs in Hand, or in Auto when the automatic logic asks for it, and never with the overload tripped. Treat both inputs on at once as a faulty switch and stop.',
    level: 'beginner',
    explanation: `A 3-position selector has two contacts: **Hand** and **Auto**. In the middle position (**Off**) neither is closed.

- **Hand mode** = Hand AND NOT Auto.
- **Auto mode** = Auto AND NOT Hand.
- **Motor** = (Hand mode OR (Auto mode AND auto demand)) AND NOT overload.
- **Auto lamp** shows that the plant control system is in charge.
- **Selector fault**: both contacts closed is impossible with a healthy switch, so the motor stops and a fault is shown.

In many plants, Hand bypasses the PLC entirely (hardwired) so a motor can be run even with the PLC down; the PLC then only reads the selector position.`,
    circuit: `circuit "Hand-Off-Auto" version 1 {
  hand: INPUT(label="Selector: Hand")
  auto: INPUT(label="Selector: Auto")
  demand: INPUT(label="Automatic demand")
  overload: INPUT(label="Overload tripped")
  notAuto: NOT(label="Not Auto contact")
  notHand: NOT(label="Not Hand contact")
  handMode: AND(label="Hand mode")
  autoMode: AND(label="Auto mode")
  autoRun: AND(label="Auto demand")
  wanted: OR(label="Run wanted")
  healthy: NOT(label="No overload")
  motorLogic: AND(label="Run")
  bad: AND(label="Both contacts")
  motor: OUTPUT(label="Motor")
  autoLamp: OUTPUT(label="Auto lamp")
  selectorFault: OUTPUT(label="Selector fault")
  auto.Q -> notAuto.A
  hand.Q -> notHand.A
  hand.Q -> handMode.A
  notAuto.Q -> handMode.B
  auto.Q -> autoMode.A
  notHand.Q -> autoMode.B
  autoMode.Q -> autoRun.A
  demand.Q -> autoRun.B
  handMode.Q -> wanted.A
  autoRun.Q -> wanted.B
  overload.Q -> healthy.A
  wanted.Q -> motorLogic.A
  healthy.Q -> motorLogic.B
  hand.Q -> bad.A
  auto.Q -> bad.B
  motorLogic.Q -> motor.A
  autoMode.Q -> autoLamp.A
  bad.Q -> selectorFault.A
}`,
    inputs: [
      { id: 'hand', type: 'INPUT', label: 'Selector: Hand', device: 'HOA selector, Hand contact' },
      { id: 'auto', type: 'INPUT', label: 'Selector: Auto', device: 'HOA selector, Auto contact' },
      { id: 'demand', type: 'INPUT', label: 'Automatic demand', device: 'Output of the control logic (level, pressure, schedule)' },
      { id: 'overload', type: 'INPUT', label: 'Overload tripped', device: 'Overload relay auxiliary contact' },
    ],
    outputs: [
      { id: 'motor', type: 'OUTPUT', label: 'Motor', device: 'Motor contactor' },
      { id: 'autoLamp', type: 'OUTPUT', label: 'Auto lamp', device: 'Indicator: in automatic' },
      { id: 'selectorFault', type: 'OUTPUT', label: 'Selector fault', device: 'Fault lamp or HMI alarm' },
    ],
    tryIt: ['Switch Selector: Hand ON: the motor runs.', 'Switch Hand OFF and Auto ON: the motor follows Automatic demand.', 'Switch both ON: selector fault, motor off.'],
    steps: [
      { title: 'Decode the selector', text: 'Hand mode = Hand AND NOT Auto; Auto mode = Auto AND NOT Hand.' },
      { title: 'Combine', text: 'Run in Hand, or in Auto with demand.' },
      { title: 'Protect', text: 'Overload always stops the motor.' },
      { title: 'Check the switch', text: 'Both contacts at once is a fault.' },
    ],
    mistakes: [
      'Leaving a motor in Hand permanently: it ignores levels and interlocks. Show Hand mode on the HMI and alarm if it lasts too long.',
      'Bypassing safety interlocks in Hand. Safety functions must work in every mode.',
      'Using only one input (Auto) and treating "not Auto" as Hand, which makes Off impossible to detect.',
    ],
    faq: [
      { q: 'Should Hand go through the PLC?', a: 'Both ways are common. Through the PLC you keep interlocks in Hand; hardwired, the motor can run with the PLC down. Many plants hardwire Hand and still read it into the PLC.' },
      { q: 'What is "Local-Remote"?', a: 'A similar selector that decides whether the motor is controlled from the local push buttons or from the control room. Decode it the same way.' },
    ],
    blocks: ['AND', 'OR', 'NOT'],
    challenges: ['guarded-machine', 'door-alarm'],
    scenarios: [
      {
        name: 'Modes',
        steps: [
          { action: 'Off', waitMs: 200, expect: { motor: false, autoLamp: false } },
          { action: 'Off with demand', set: { demand: true }, waitMs: 200, expect: { motor: false } },
          { action: 'Hand', set: { demand: false, hand: true }, waitMs: 200, expect: { motor: true, autoLamp: false } },
          { action: 'Auto, no demand', set: { hand: false, auto: true }, waitMs: 200, expect: { motor: false, autoLamp: true } },
          { action: 'Auto with demand', set: { demand: true }, waitMs: 200, expect: { motor: true } },
          { action: 'Overload in Auto', set: { overload: true }, waitMs: 200, expect: { motor: false } },
          { action: 'Overload in Hand', set: { auto: false, hand: true }, waitMs: 200, expect: { motor: false } },
          { action: 'Both contacts', set: { overload: false, auto: true }, waitMs: 200, expect: { motor: false, selectorFault: true, autoLamp: false } },
        ],
      },
    ],
  },
];
