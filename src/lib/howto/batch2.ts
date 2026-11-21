import type { HowTo } from './types.ts';

/** Second batch of how-to guides. Verified by tests/howto.test.ts like the first. */
export const HOW_TOS_BATCH_2: HowTo[] = [
  {
    slug: 'motor-forward-reverse-interlock',
    title: 'How to program motor forward/reverse control with an interlock',
    description: 'Forward/reverse motor control in PLC logic: two latches, a stop and overload circuit, and an interlock so both contactors can never close.',
    answer:
      'Use one latch per direction and let each direction start only while the other is off. Stop and the overload reset both latches, so the operator must stop the motor before reversing it.',
    level: 'beginner',
    explanation: `Two **reset-dominant RS latches** remember the direction:

- **Forward**: Set = Forward button AND NOT reverse running. Reset = Stop OR overload.
- **Reverse**: Set = Reverse button AND NOT forward running. Reset = Stop OR overload.

The interlock means a direction button is ignored while the motor runs the other way. Reversing a running motor directly causes a huge current peak and mechanical shock, so the operator presses Stop first.

The forward latch reads "reverse running" from the previous scan (a one-scan delay), because the reverse latch is evaluated after it. If both buttons are pressed together from standstill, forward wins and reverse stays blocked.`,
    circuit: `circuit "Forward/reverse motor" version 1 {
  fwdBtn: INPUT(label="Forward")
  revBtn: INPUT(label="Reverse")
  stop: INPUT(label="Stop")
  overload: INPUT(label="Overload tripped")
  trip: OR(label="Stop or overload")
  revPrev: SCAN_DELAY(label="Reverse running")
  notRev: NOT(label="Not reversing")
  fwdPermit: AND(label="Forward allowed")
  fwd: RS_LATCH(label="Forward")
  notFwd: NOT(label="Not forward")
  revPermit: AND(label="Reverse allowed")
  rev: RS_LATCH(label="Reverse")
  motorFwd: OUTPUT(label="Forward contactor")
  motorRev: OUTPUT(label="Reverse contactor")
  stop.Q -> trip.A
  overload.Q -> trip.B
  rev.Q -> revPrev.A
  revPrev.Q -> notRev.A
  fwdBtn.Q -> fwdPermit.A
  notRev.Q -> fwdPermit.B
  fwdPermit.Q -> fwd.S
  trip.Q -> fwd.R
  fwd.Q -> notFwd.A
  revBtn.Q -> revPermit.A
  notFwd.Q -> revPermit.B
  revPermit.Q -> rev.S
  trip.Q -> rev.R
  fwd.Q -> motorFwd.A
  rev.Q -> motorRev.A
}`,
    inputs: [
      { id: 'fwdBtn', type: 'INPUT', label: 'Forward', device: 'Push button' },
      { id: 'revBtn', type: 'INPUT', label: 'Reverse', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'overload', type: 'INPUT', label: 'Overload tripped', device: 'Overload relay auxiliary contact; ON means tripped' },
    ],
    outputs: [
      { id: 'motorFwd', type: 'OUTPUT', label: 'Forward contactor', device: 'Contactor K1 (forward)' },
      { id: 'motorRev', type: 'OUTPUT', label: 'Reverse contactor', device: 'Contactor K2 (swaps two phases)' },
    ],
    tryIt: ['Switch Forward on and off: the forward contactor latches.', 'Switch Reverse on: nothing happens while running forward.', 'Switch Stop on and off, then Reverse: the motor runs in reverse.'],
    steps: [
      { title: 'Latch each direction', text: 'An RS latch per direction, set by its push button and reset by Stop OR overload.' },
      { title: 'Interlock the set inputs', text: 'Forward may only set while reverse is off, and the other way round.' },
      { title: 'Break the evaluation loop', text: 'Each latch depends on the other, so one of them reads the other\'s previous scan through a one-scan delay.' },
      { title: 'Test both buttons at once', text: 'Only one direction may ever start, and the never-both rule must hold on every scan.' },
    ],
    mistakes: [
      'Relying on the PLC interlock alone. Reversing contactors must also be interlocked electrically (NC auxiliary contacts) and ideally mechanically.',
      'Letting a direction button reverse a running motor directly, which plugs the motor and stresses the gearbox.',
      'Swapping all three phases instead of two: the direction does not change.',
    ],
    faq: [
      { q: 'How do I allow reversing without pressing Stop?', a: 'Make each direction button also reset the opposite latch, then start the new direction only after a short dead time (an on-delay of a few hundred milliseconds), so the first contactor is open before the second closes.' },
      { q: 'Is this the same as a VFD forward/reverse?', a: 'The logic is the same, but with a drive you switch its direction input and the drive ramps down and up for you, so no contactor interlock is needed.' },
    ],
    blocks: ['RS_LATCH', 'SCAN_DELAY', 'AND', 'NOT', 'OR'],
    challenges: ['start-stop', 'guarded-machine'],
    never: [{ when: { motorFwd: true, motorRev: true }, message: 'Forward and reverse contactors were on together' }],
    scenarios: [
      {
        name: 'Forward, blocked reverse, stop, reverse',
        steps: [
          { action: 'Press Forward', set: { fwdBtn: true }, waitMs: 200, expect: { motorFwd: true, motorRev: false } },
          { action: 'Release Forward', set: { fwdBtn: false }, waitMs: 500, expect: { motorFwd: true } },
          { action: 'Press Reverse while running forward', set: { revBtn: true }, waitMs: 300, expect: { motorFwd: true, motorRev: false } },
          { action: 'Release Reverse, press Stop', set: { revBtn: false, stop: true }, waitMs: 200, expect: { motorFwd: false, motorRev: false } },
          { action: 'Release Stop, press Reverse', set: { stop: false, revBtn: true }, waitMs: 200, expect: { motorFwd: false, motorRev: true } },
          { action: 'Release Reverse, press Forward', set: { revBtn: false, fwdBtn: true }, waitMs: 300, expect: { motorFwd: false, motorRev: true } },
          { action: 'Overload trips', set: { fwdBtn: false, overload: true }, waitMs: 200, expect: { motorFwd: false, motorRev: false } },
        ],
      },
      {
        name: 'Both buttons at once',
        steps: [{ action: 'Press both directions', set: { fwdBtn: true, revBtn: true }, waitMs: 500, expect: { motorFwd: true, motorRev: false } }],
      },
    ],
  },
  {
    slug: 'star-delta-starter-plc-program',
    title: 'Star-delta starter PLC program (with changeover dead time)',
    description: 'Star-delta (wye-delta) motor starter in PLC logic: main, star and delta contactors, a 3 s changeover timer, a dead time and the interlock.',
    answer:
      'Close the main and star contactors on Start, open star after the run-up time, and close delta after a short dead time. Star and delta must never be closed together, and Stop or the overload opens everything.',
    level: 'intermediate',
    explanation: `A start/stop latch gives **Running**. Two on-delay timers sequence the changeover:

- **Run-up timer** (3 s) starts with Running.
- **Dead time** (300 ms timer) starts when the run-up timer is done.

Then:

- **Main contactor** = Running
- **Star contactor** = Running AND NOT run-up done
- **Delta contactor** = Running AND dead time done

During the dead time between star opening and delta closing, neither is closed. That gap lets the arc in the star contactor extinguish before delta closes; without it, the two contactors can briefly short the supply.

Starting in star puts only 1/√3 of the line voltage across each winding, so the starting current and torque drop to about one third.`,
    circuit: `circuit "Star-delta starter" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  overload: INPUT(label="Overload tripped")
  trip: OR(label="Stop or overload")
  running: RS_LATCH(label="Running")
  runUp: TON(label="Run-up time", duration=3000)
  deadTime: TON(label="Dead time", duration=300)
  notRunUp: NOT(label="Still running up")
  starLogic: AND(label="Star")
  deltaLogic: AND(label="Delta")
  main: OUTPUT(label="Main contactor")
  star: OUTPUT(label="Star contactor")
  delta: OUTPUT(label="Delta contactor")
  stop.Q -> trip.A
  overload.Q -> trip.B
  start.Q -> running.S
  trip.Q -> running.R
  running.Q -> runUp.A
  runUp.Q -> deadTime.A
  runUp.Q -> notRunUp.A
  running.Q -> starLogic.A
  notRunUp.Q -> starLogic.B
  running.Q -> deltaLogic.A
  deadTime.Q -> deltaLogic.B
  running.Q -> main.A
  starLogic.Q -> star.A
  deltaLogic.Q -> delta.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'overload', type: 'INPUT', label: 'Overload tripped', device: 'Overload relay auxiliary contact' },
    ],
    outputs: [
      { id: 'main', type: 'OUTPUT', label: 'Main contactor', device: 'K1, supplies the winding starts' },
      { id: 'star', type: 'OUTPUT', label: 'Star contactor', device: 'K3, joins the winding ends' },
      { id: 'delta', type: 'OUTPUT', label: 'Delta contactor', device: 'K2, connects the winding ends to the other phases' },
    ],
    tryIt: ['Switch Start on and off: main and star close.', 'After 3 s, star opens; a moment later delta closes.', 'Switch Stop on: everything opens.'],
    steps: [
      { title: 'Latch Running', text: 'RS latch: Start on S, Stop OR overload on R.' },
      { title: 'Time the run-up', text: 'An on-delay on Running, typically 3–10 s depending on the load.' },
      { title: 'Add the dead time', text: 'A second on-delay of 100–300 ms that starts when the run-up is done.' },
      { title: 'Decode the contactors', text: 'Main = Running, Star = Running AND NOT run-up done, Delta = Running AND dead time done.' },
    ],
    mistakes: [
      'No dead time: star and delta overlap for a few milliseconds while the star contactor\'s contacts open, causing a phase-to-phase short.',
      'Changing over too early, before the motor is near full speed: the current peak at changeover can be as high as a direct-on-line start.',
      'No electrical interlock between star and delta contactors in the hardwired circuit.',
    ],
    faq: [
      { q: 'How long should the star time be?', a: 'Long enough for the motor to reach about 80–90 % of rated speed under its real load. Measure it, or watch the current settle, and add a margin.' },
      { q: 'Can every motor be started star-delta?', a: 'Only motors whose windings are rated for the line voltage in delta and have all six winding ends brought out (for example a 400/690 V motor on a 400 V supply).' },
    ],
    blocks: ['RS_LATCH', 'TON', 'AND', 'NOT', 'OR'],
    challenges: ['star-delta', 'delayed-fan'],
    never: [{ when: { star: true, delta: true }, message: 'Star and delta were on together' }],
    scenarios: [
      {
        name: 'Start, changeover, stop',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 200, expect: { main: true, star: true, delta: false } },
          { action: 'Release Start, wait to 2.5 s', set: { start: false }, waitMs: 2300, expect: { star: true, delta: false } },
          { action: 'Wait to 3.0 s (dead time)', waitMs: 500, expect: { main: true, star: false, delta: false } },
          { action: 'Wait to 3.5 s', waitMs: 400, expect: { star: false, delta: true } },
          { action: 'Press Stop', set: { stop: true }, waitMs: 200, expect: { main: false, star: false, delta: false } },
        ],
      },
      {
        name: 'Overload during star',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 1000, expect: { star: true } },
          { action: 'Overload trips', set: { start: false, overload: true }, waitMs: 200, expect: { main: false, star: false, delta: false } },
          { action: 'Wait', waitMs: 4000, expect: { delta: false } },
        ],
      },
    ],
  },
  {
    slug: 'sequential-conveyor-start-stop',
    title: 'How to start and stop conveyors in sequence (PLC program)',
    description: 'Start conveyors from the discharge end with delays and stop them from the feed end so belts empty. PLC logic with on-delay, off-delay and fault interlock.',
    answer:
      'Start the conveyors from the discharge end back to the feed end, each a few seconds after the one it feeds onto, and stop them in the opposite order so each belt can empty. If a downstream conveyor stops, everything feeding it must stop too.',
    level: 'intermediate',
    explanation: `Three conveyors in a line: **C1** (feed) → **C2** → **C3** (discharge). A start/stop latch gives **Line running**.

- **C3** uses an **off-delay** (6 s): it starts at once and keeps running 6 s after Stop.
- **C2** uses an **on/off-delay**: it starts 2 s after Start and stops 3 s after Stop.
- **C1** uses an **on-delay** (4 s): it starts last and stops first.

Each conveyor is also ANDed with the one after it, so **C2 only runs while C3 runs** and **C1 only while C2 runs**. A C3 fault therefore stops all three at once: it sets a **Line tripped** latch that overrides the run-on delays, and it resets the line latch, so nothing restarts until the fault has cleared and Start is pressed again.`,
    circuit: `circuit "Sequential conveyors" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  fault3: INPUT(label="C3 fault")
  stopOrFault: OR(label="Stop or fault")
  line: RS_LATCH(label="Line running")
  t3: TOF(label="C3 run-on", duration=6000)
  t2: ON_OFF_DELAY(label="C2 delays", onDelay=2000, offDelay=3000)
  t1: TON(label="C1 start delay", duration=4000)
  faultNow: NOT(label="No C3 fault now")
  clearFault: AND(label="Restart without fault")
  tripped: RS_LATCH(label="Line tripped")
  healthy: NOT(label="Not tripped")
  c3Logic: AND(label="C3 run")
  c2Logic: AND(label="C2 run")
  c1Logic: AND(label="C1 run")
  c3: OUTPUT(label="C3 discharge conveyor")
  c2: OUTPUT(label="C2 middle conveyor")
  c1: OUTPUT(label="C1 feed conveyor")
  stop.Q -> stopOrFault.A
  fault3.Q -> stopOrFault.B
  start.Q -> line.S
  stopOrFault.Q -> line.R
  line.Q -> t3.A
  line.Q -> t2.A
  line.Q -> t1.A
  fault3.Q -> faultNow.A
  start.Q -> clearFault.A
  faultNow.Q -> clearFault.B
  fault3.Q -> tripped.S
  clearFault.Q -> tripped.R
  tripped.Q -> healthy.A
  t3.Q -> c3Logic.A
  healthy.Q -> c3Logic.B
  t2.Q -> c2Logic.A
  c3Logic.Q -> c2Logic.B
  t1.Q -> c1Logic.A
  c2Logic.Q -> c1Logic.B
  c3Logic.Q -> c3.A
  c2Logic.Q -> c2.A
  c1Logic.Q -> c1.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'fault3', type: 'INPUT', label: 'C3 fault', device: 'Overload, pull-cord or belt-slip switch on C3' },
    ],
    outputs: [
      { id: 'c3', type: 'OUTPUT', label: 'C3 discharge conveyor', device: 'Motor contactor' },
      { id: 'c2', type: 'OUTPUT', label: 'C2 middle conveyor', device: 'Motor contactor' },
      { id: 'c1', type: 'OUTPUT', label: 'C1 feed conveyor', device: 'Motor contactor' },
    ],
    tryIt: ['Switch Start on and off: C3 starts, then C2 after 2 s, then C1 after 4 s.', 'Switch Stop on and off: C1 stops at once, C2 after 3 s, C3 after 6 s.', 'Try C3 fault while running.'],
    steps: [
      { title: 'Latch the line', text: 'RS latch: Start sets, Stop OR any fault resets.' },
      { title: 'Delay each start', text: 'The discharge conveyor starts first, then each upstream conveyor after a delay.' },
      { title: 'Delay each stop', text: 'Off-delays keep downstream conveyors running long enough to empty, in the reverse order.' },
      { title: 'Interlock downstream to upstream', text: 'AND each conveyor with the running state of the one it feeds, so a stopped belt never receives material.' },
    ],
    mistakes: [
      'Starting the feed conveyor first: material lands on a stopped belt and spills.',
      'Stopping everything at once on a normal stop, which leaves belts loaded and makes the next start heavy.',
      'Interlocking on the PLC output instead of on real feedback. Use a speed or motion sensor on each conveyor when a belt can slip or break.',
    ],
    faq: [
      { q: 'How long should the stop delays be?', a: 'At least the time a piece of material needs to travel the full length of the belt at running speed, plus a margin.' },
      { q: 'How do I scale this to ten conveyors?', a: 'Use the same pattern for each conveyor, or a step counter that starts one conveyor per step. Keep the downstream interlock on every one.' },
    ],
    blocks: ['TON', 'TOF', 'ON_OFF_DELAY', 'RS_LATCH', 'AND'],
    challenges: ['delayed-fan', 'stairwell-light'],
    never: [
      { when: { c1: true, c2: false }, message: 'C1 ran while C2 was stopped' },
      { when: { c2: true, c3: false }, message: 'C2 ran while C3 was stopped' },
    ],
    scenarios: [
      {
        name: 'Start sequence and stop sequence',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 200, expect: { c3: true, c2: false, c1: false } },
          { action: 'Release Start, wait to 3 s', set: { start: false }, waitMs: 2800, expect: { c3: true, c2: true, c1: false } },
          { action: 'Wait to 5 s', waitMs: 2000, expect: { c1: true } },
          { action: 'Press Stop', set: { stop: true }, waitMs: 200, expect: { c1: false, c2: true, c3: true } },
          { action: 'Release Stop, wait to 4 s after Stop', set: { stop: false }, waitMs: 3800, expect: { c2: false, c3: true } },
          { action: 'Wait to 7 s after Stop', waitMs: 3000, expect: { c3: false } },
        ],
      },
      {
        name: 'C3 fault stops everything',
        steps: [
          { action: 'Start and run 5 s', set: { start: true }, waitMs: 5000, expect: { c1: true, c2: true, c3: true } },
          { action: 'C3 faults', set: { start: false, fault3: true }, waitMs: 200, expect: { c1: false, c2: false, c3: false } },
          { action: 'Fault cleared', set: { fault3: false }, waitMs: 1000, expect: { c1: false, c2: false, c3: false } },
          { action: 'Fault returns; Start is refused', set: { fault3: true, start: true }, waitMs: 300, expect: { c3: false } },
          { action: 'Fault cleared, press Start again', set: { fault3: false, start: true }, waitMs: 200, expect: { c3: true } },
        ],
      },
    ],
  },
  {
    slug: '4-20ma-scaling-plc',
    title: 'How to scale a 4-20 mA signal in a PLC (formula and wire-break alarm)',
    description: 'Convert 4-20 mA to engineering units with gain and offset, detect a broken wire below 3.8 mA, and raise a high alarm. Formula plus a live PLC circuit.',
    answer:
      'Use a straight line through the two end points: value = (mA − 4) × (span / 16) + low. For 0–100 %, that is mA × 6.25 − 25. Treat anything below about 3.8 mA or above 20.5 mA as a sensor or wiring fault, not as a real value.',
    level: 'beginner',
    explanation: `A 4–20 mA transmitter sends **4 mA at the bottom of its range** and **20 mA at the top**. The live zero at 4 mA is what lets you tell "0 %" apart from "broken wire" (0 mA).

**Scaling.** For a range from *low* to *high*:

- gain = (high − low) / 16
- offset = low − 4 × gain

For 0–100 %: gain = 6.25 and offset = −25, so 12 mA reads 50 %. For a 0–10 bar transmitter: gain = 0.625 and offset = −2.5.

**Fault detection** (NAMUR NE 43 limits): below **3.8 mA** or above **20.5 mA** the signal is out of range. Raise a fault and do not trust the value. Here the high alarm at 80 % is suppressed while the signal is faulty, so a broken wire cannot hide or fake an alarm without anyone noticing.`,
    circuit: `circuit "4-20 mA scaling" version 1 {
  mA: ANALOG_INPUT(label="Transmitter current (mA)", value=12)
  scale: ANALOG_AMPLIFIER(label="Scale to %", gain=6.25, offset=-25)
  lowLimit: ANALOG_CONSTANT(label="3.8 mA", value=3.8)
  highLimit: ANALOG_CONSTANT(label="20.5 mA", value=20.5)
  alarmLimit: ANALOG_CONSTANT(label="80 %", value=80)
  tooLow: ANALOG_COMPARATOR(label="Below 3.8 mA", operation="lt")
  tooHigh: ANALOG_COMPARATOR(label="Above 20.5 mA", operation="gt")
  high: ANALOG_COMPARATOR(label="At or above 80 %", operation="gte")
  badSignal: OR(label="Signal fault")
  goodSignal: NOT(label="Signal healthy")
  alarmLogic: AND(label="Valid high alarm")
  level: ANALOG_OUTPUT(label="Level %")
  fault: OUTPUT(label="Sensor fault")
  highAlarm: OUTPUT(label="High level alarm")
  mA.Q -> scale.A
  scale.Q -> level.A
  mA.Q -> tooLow.A
  lowLimit.Q -> tooLow.B
  mA.Q -> tooHigh.A
  highLimit.Q -> tooHigh.B
  scale.Q -> high.A
  alarmLimit.Q -> high.B
  tooLow.Q -> badSignal.A
  tooHigh.Q -> badSignal.B
  badSignal.Q -> goodSignal.A
  high.Q -> alarmLogic.A
  goodSignal.Q -> alarmLogic.B
  badSignal.Q -> fault.A
  alarmLogic.Q -> highAlarm.A
}`,
    inputs: [{ id: 'mA', type: 'ANALOG_INPUT', label: 'Transmitter current (mA)', device: '2-wire 4–20 mA level transmitter' }],
    outputs: [
      { id: 'level', type: 'ANALOG_OUTPUT', label: 'Level %', device: 'Value for the HMI, trends and control' },
      { id: 'fault', type: 'OUTPUT', label: 'Sensor fault', device: 'Alarm: wire break or transmitter failure' },
      { id: 'highAlarm', type: 'OUTPUT', label: 'High level alarm', device: 'Alarm lamp or horn' },
    ],
    tryIt: ['Press Run and set the transmitter current to 4, 12 and 20 mA: the level reads 0, 50 and 100 %.', 'Set 17 mA: the high alarm turns on (81.25 %).', 'Set 0 mA (broken wire): sensor fault, and the alarm is suppressed.'],
    steps: [
      { title: 'Work out gain and offset', text: 'gain = span / 16, offset = low − 4 × gain. Check at 4 and 20 mA.' },
      { title: 'Scale the signal', text: 'Feed the raw mA value through a gain/offset (scaling) block.' },
      { title: 'Detect out-of-range signals', text: 'Compare the raw current with 3.8 and 20.5 mA and OR the results into a fault.' },
      { title: 'Use only healthy values', text: 'Gate alarms and control actions with "signal healthy".' },
    ],
    mistakes: [
      'Scaling from 0 instead of 4 mA, which makes every reading 25 % too high at the bottom of the range.',
      'Treating 0 mA as "empty": a broken wire then looks like an empty tank and can start a pump into a full one.',
      'Scaling the raw ADC counts with the wrong range. Most PLC analog cards give 0–27648 or similar; divide to mA first or scale counts directly.',
    ],
    faq: [
      { q: 'What is the formula for 4-20 mA to engineering units?', a: 'value = (mA − 4) / 16 × (high − low) + low. For 0–100 %: (mA − 4) × 6.25.' },
      { q: 'What is the formula the other way round?', a: 'mA = 4 + 16 × (value − low) / (high − low). For 50 %: 4 + 16 × 0.5 = 12 mA.' },
      { q: 'Why 3.8 and 20.5 mA?', a: 'NAMUR NE 43 reserves 3.8–20.5 mA for valid measurements (including slight over- and under-range). Transmitters signal internal failures below 3.6 or above 21 mA.' },
    ],
    blocks: ['ANALOG_AMPLIFIER', 'ANALOG_COMPARATOR', 'ANALOG_CONSTANT', 'OR', 'AND'],
    challenges: ['sensor-scaling', 'tank-level'],
    scenarios: [
      {
        name: 'Scaling',
        steps: [
          { action: '4 mA', set: { mA: 4 }, waitMs: 200, expect: { level: 0, fault: false } },
          { action: '12 mA', set: { mA: 12 }, waitMs: 200, expect: { level: 50, highAlarm: false } },
          { action: '20 mA', set: { mA: 20 }, waitMs: 200, expect: { level: 100, highAlarm: true, fault: false } },
          { action: '16 mA', set: { mA: 16 }, waitMs: 200, expect: { level: 75, highAlarm: false } },
        ],
      },
      {
        name: 'Faults',
        steps: [
          { action: 'Broken wire, 0 mA', set: { mA: 0 }, waitMs: 200, expect: { fault: true, highAlarm: false } },
          { action: 'Shorted transmitter, 22 mA', set: { mA: 22 }, waitMs: 200, expect: { fault: true, highAlarm: false } },
          { action: '3.9 mA is still valid', set: { mA: 3.9 }, waitMs: 200, expect: { fault: false } },
        ],
      },
    ],
  },
  {
    slug: 'jog-and-run-motor-control',
    title: 'How to program jog and run (inching) for a motor',
    description: 'Jog runs the motor only while the button is held; Start latches it. PLC logic for jog/run with stop priority, plus a live simulator.',
    answer:
      'Run is a normal start/stop latch. Jog drives the motor directly while it is held and never sets the latch, so the motor stops as soon as Jog is released. Stop overrides both.',
    level: 'beginner',
    explanation: `- **Run latch**: RS latch with Start on S and Stop on R.
- **Motor** = Run latch OR (Jog AND NOT Stop).

Jog is used to position a machine, a belt or a tool by small movements. The essential point is that **Jog must not seal in**: if the jog path went through the latch, a quick tap could leave the motor running.

Stop is checked in the jog path too, so pressing Stop and Jog together does nothing.`,
    circuit: `circuit "Jog and run" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  jog: INPUT(label="Jog")
  run: RS_LATCH(label="Run latch")
  notStop: NOT(label="Stop not pressed")
  jogging: AND(label="Jogging")
  motorLogic: OR(label="Run or jog")
  motor: OUTPUT(label="Motor")
  start.Q -> run.S
  stop.Q -> run.R
  stop.Q -> notStop.A
  jog.Q -> jogging.A
  notStop.Q -> jogging.B
  run.Q -> motorLogic.A
  jogging.Q -> motorLogic.B
  motorLogic.Q -> motor.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'jog', type: 'INPUT', label: 'Jog', device: 'Push button (hold to run)' },
    ],
    outputs: [{ id: 'motor', type: 'OUTPUT', label: 'Motor', device: 'Motor contactor or drive run command' }],
    tryIt: ['Switch Jog on: the motor runs. Switch it off: the motor stops.', 'Switch Start on and off: the motor keeps running.', 'Switch Stop on: everything stops.'],
    steps: [
      { title: 'Build the run latch', text: 'Start sets, Stop resets.' },
      { title: 'Add the jog path', text: 'Jog AND NOT Stop, in parallel with the latch.' },
      { title: 'Keep jog out of the latch', text: 'Jog must never set the latch.' },
      { title: 'Test a quick tap', text: 'Tap Jog: the motor runs only for the tap.' },
    ],
    mistakes: [
      'Wiring Jog in parallel with Start, so it seals in.',
      'Allowing jog at full speed on a drive. Most applications use a separate, slower jog speed.',
      'Forgetting that jog is often used with guards open; safety functions such as hold-to-run at reduced speed belong in the safety system, not only in the PLC.',
    ],
    faq: [
      { q: 'How do I jog in both directions?', a: 'Combine this with forward/reverse control: a Jog Forward and a Jog Reverse button, each driving its direction directly and interlocked against the other.' },
      { q: 'What is the difference between jog and inch?', a: 'They are mostly used as synonyms. Some industries use "inch" for very slow, short movements.' },
    ],
    blocks: ['RS_LATCH', 'AND', 'OR', 'NOT'],
    challenges: ['start-stop'],
    scenarios: [
      {
        name: 'Jog then run',
        steps: [
          { action: 'Hold Jog', set: { jog: true }, waitMs: 500, expect: { motor: true } },
          { action: 'Release Jog', set: { jog: false }, waitMs: 300, expect: { motor: false } },
          { action: 'Press Start', set: { start: true }, waitMs: 200, expect: { motor: true } },
          { action: 'Release Start', set: { start: false }, waitMs: 500, expect: { motor: true } },
          { action: 'Tap Jog while running', set: { jog: true }, waitMs: 100 },
          { action: 'Release Jog', set: { jog: false }, waitMs: 300, expect: { motor: true } },
          { action: 'Press Stop', set: { stop: true }, waitMs: 200, expect: { motor: false } },
        ],
      },
      {
        name: 'Stop beats Jog',
        steps: [{ action: 'Hold Stop and Jog', set: { stop: true, jog: true }, waitMs: 500, expect: { motor: false } }],
      },
    ],
  },
  {
    slug: 'plc-program-mixing-tank-batch',
    title: 'PLC program for a mixing tank (fill, mix, drain)',
    description: 'Batch mixing tank sequence in PLC logic: fill to the high level switch, mix for a set time, drain until empty. Live simulator, ladder and Arduino code.',
    answer:
      'Latch a batch cycle on Start, open the fill valve until the high level switch makes, run the mixer for a set time, then open the drain until the low level switch shows the tank is empty. The end of the drain resets the cycle.',
    level: 'intermediate',
    explanation: `The cycle is remembered by a **Batch running** latch, set by Start (only when the tank is empty) and reset by Stop or by the end of the drain.

A second latch, **Filled**, is set when the high level switch makes during the batch and is reset when the batch ends. It keeps the sequence in the "full" part even after the level drops below the high switch during draining.

- **Fill valve** = batch AND NOT filled
- **Mixer** = batch AND filled AND NOT mix time done (5 s)
- **Drain valve** = batch AND mix time done
- **Batch finished** = draining AND low level switch OFF (tank empty), fed back through a one-scan delay to reset the batch latch.`,
    circuit: `circuit "Mixing tank" version 1 {
  start: INPUT(label="Start batch")
  stop: INPUT(label="Stop")
  high: INPUT(label="High level switch")
  low: INPUT(label="Low level switch")
  empty: NOT(label="Tank empty")
  canStart: AND(label="Start when empty")
  finished: SCAN_DELAY(label="Batch finished")
  endBatch: OR(label="Stop or finished")
  batch: RS_LATCH(label="Batch running")
  notBatch: NOT(label="No batch")
  reachedTop: AND(label="Full during batch")
  filled: RS_LATCH(label="Filled")
  notFilled: NOT(label="Not yet full")
  fillLogic: AND(label="Fill")
  mixing: AND(label="Full and running")
  mixTime: TON(label="Mix time", duration=5000)
  notMixed: NOT(label="Still mixing")
  mixLogic: AND(label="Mix")
  drainLogic: AND(label="Drain")
  doneLogic: AND(label="Drained")
  fill: OUTPUT(label="Fill valve")
  mixer: OUTPUT(label="Mixer motor")
  drain: OUTPUT(label="Drain valve")
  low.Q -> empty.A
  start.Q -> canStart.A
  empty.Q -> canStart.B
  doneLogic.Q -> finished.A
  stop.Q -> endBatch.A
  finished.Q -> endBatch.B
  canStart.Q -> batch.S
  endBatch.Q -> batch.R
  batch.Q -> notBatch.A
  batch.Q -> reachedTop.A
  high.Q -> reachedTop.B
  reachedTop.Q -> filled.S
  notBatch.Q -> filled.R
  filled.Q -> notFilled.A
  batch.Q -> fillLogic.A
  notFilled.Q -> fillLogic.B
  batch.Q -> mixing.A
  filled.Q -> mixing.B
  mixing.Q -> mixTime.A
  mixTime.Q -> notMixed.A
  mixing.Q -> mixLogic.A
  notMixed.Q -> mixLogic.B
  batch.Q -> drainLogic.A
  mixTime.Q -> drainLogic.B
  drainLogic.Q -> doneLogic.A
  empty.Q -> doneLogic.B
  fillLogic.Q -> fill.A
  mixLogic.Q -> mixer.A
  drainLogic.Q -> drain.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start batch', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'high', type: 'INPUT', label: 'High level switch', device: 'Float or vibrating fork switch near the top; ON when covered' },
      { id: 'low', type: 'INPUT', label: 'Low level switch', device: 'Switch near the bottom; ON when covered' },
    ],
    outputs: [
      { id: 'fill', type: 'OUTPUT', label: 'Fill valve', device: 'Solenoid or actuated valve' },
      { id: 'mixer', type: 'OUTPUT', label: 'Mixer motor', device: 'Agitator contactor' },
      { id: 'drain', type: 'OUTPUT', label: 'Drain valve', device: 'Solenoid or actuated valve' },
    ],
    tryIt: ['Switch Start on and off: the fill valve opens.', 'Switch Low, then High level ON (the tank fills): the mixer runs for 5 s.', 'Then switch High and Low OFF as the tank drains: the batch ends.'],
    steps: [
      { title: 'Latch the batch', text: 'Start sets it, only when the tank is empty. Stop or "drained" resets it.' },
      { title: 'Remember "filled"', text: 'A latch set by the high switch during the batch, reset when the batch ends.' },
      { title: 'Decode the steps', text: 'Fill until filled, mix for a set time, then drain.' },
      { title: 'End the batch', text: 'Draining AND low switch OFF means empty: feed it back through a one-scan delay to reset the batch.' },
    ],
    mistakes: [
      'Using the high switch directly to stop filling and start mixing: as soon as the level drops below the switch during draining, the sequence jumps back to filling.',
      'Starting the mixer with the tank empty or nearly empty. Many agitators must not run uncovered.',
      'No fill timeout: if the high switch fails, the tank overflows. Add an on-delay on the fill valve as a watchdog and an independent high-high switch.',
    ],
    faq: [
      { q: 'How do I add a second ingredient?', a: 'Split filling into two steps with two valves: fill ingredient A to a middle switch (or a weight), then ingredient B to the high switch, each with its own "done" latch.' },
      { q: 'Should I use a step sequencer?', a: 'For more than four or five steps, a step number (counter or integer) with one rung per step is easier to maintain and to show on an HMI.' },
    ],
    blocks: ['RS_LATCH', 'TON', 'SCAN_DELAY', 'AND', 'NOT', 'OR'],
    challenges: ['start-stop', 'tank-level'],
    never: [
      { when: { fill: true, drain: true }, message: 'Fill and drain were open together' },
      { when: { mixer: true, fill: true }, message: 'The mixer ran while filling' },
    ],
    scenarios: [
      {
        name: 'One batch',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 200, expect: { fill: true, mixer: false, drain: false } },
          { action: 'Release Start; level covers the low switch', set: { start: false, low: true }, waitMs: 1000, expect: { fill: true } },
          { action: 'Level reaches the high switch', set: { high: true }, waitMs: 200, expect: { fill: false, mixer: true } },
          { action: 'Mixing', waitMs: 4000, expect: { mixer: true, drain: false } },
          { action: 'Mix time over', waitMs: 1000, expect: { mixer: false, drain: true } },
          { action: 'Level drops below the high switch', set: { high: false }, waitMs: 1000, expect: { drain: true, fill: false } },
          { action: 'Tank empty', set: { low: false }, waitMs: 300, expect: { drain: false, fill: false, mixer: false } },
          { action: 'Stays idle', waitMs: 2000, expect: { fill: false } },
          { action: 'Next batch fills again', set: { start: true }, waitMs: 200, expect: { fill: true, mixer: false } },
        ],
      },
      {
        name: 'Start refused when not empty; Stop',
        steps: [
          { action: 'Tank partly full, press Start', set: { low: true, start: true }, waitMs: 300, expect: { fill: false } },
          { action: 'Tank empty, press Start', set: { low: false, start: true }, waitMs: 200, expect: { fill: true } },
          { action: 'Press Stop', set: { start: false, stop: true }, waitMs: 200, expect: { fill: false, mixer: false, drain: false } },
        ],
      },
    ],
  },
  {
    slug: '2oo3-voting-logic-plc',
    title: 'How to program 2-out-of-3 (2oo3) voting logic for a trip',
    description: 'Trip only when two of three sensors agree: 2oo3 voting in PLC logic with a latched trip, reset permissive and a 1oo3 pre-alarm. Run it live.',
    answer:
      '2-out-of-3 voting trips when any two of three sensors are in the trip state: (A AND B) OR (A AND C) OR (B AND C). One faulty sensor can neither cause a spurious trip nor prevent a real one.',
    level: 'intermediate',
    explanation: `Three independent sensors measure the same thing, for example three pressure switches on a vessel.

- **Vote** = (A AND B) OR (A AND C) OR (B AND C).
- The vote sets a **trip latch** that closes the shutdown valve. It stays tripped until someone presses **Reset**, and Reset only works when the vote has cleared.
- **Pre-alarm (1oo3)**: one sensor in the trip state without a vote. It tells the operator that a sensor disagrees, which is either an early warning or a failed sensor that needs attention.

Compared with 1oo1 (one sensor), 2oo3 avoids most spurious trips; compared with 1oo2, it still trips when one sensor has failed safe or dangerous.`,
    circuit: `circuit "2oo3 voting trip" version 1 {
  a: INPUT(label="Sensor A trip")
  b: INPUT(label="Sensor B trip")
  c: INPUT(label="Sensor C trip")
  reset: INPUT(label="Reset")
  ab: AND(label="A and B")
  ac: AND(label="A and C")
  bc: AND(label="B and C")
  abac: OR(label="AB or AC")
  vote: OR(label="2oo3 vote")
  anyAB: OR(label="A or B")
  any: OR(label="Any sensor")
  noVote: NOT(label="No vote")
  resetOk: AND(label="Reset permitted")
  preLogic: AND(label="One sensor only")
  trip: RS_LATCH(label="Tripped")
  shutdown: OUTPUT(label="Shutdown valve closed")
  preAlarm: OUTPUT(label="Sensor disagreement")
  a.Q -> ab.A
  b.Q -> ab.B
  a.Q -> ac.A
  c.Q -> ac.B
  b.Q -> bc.A
  c.Q -> bc.B
  ab.Q -> abac.A
  ac.Q -> abac.B
  abac.Q -> vote.A
  bc.Q -> vote.B
  a.Q -> anyAB.A
  b.Q -> anyAB.B
  anyAB.Q -> any.A
  c.Q -> any.B
  vote.Q -> noVote.A
  reset.Q -> resetOk.A
  noVote.Q -> resetOk.B
  any.Q -> preLogic.A
  noVote.Q -> preLogic.B
  vote.Q -> trip.S
  resetOk.Q -> trip.R
  trip.Q -> shutdown.A
  preLogic.Q -> preAlarm.A
}`,
    inputs: [
      { id: 'a', type: 'INPUT', label: 'Sensor A trip', device: 'Pressure switch or transmitter trip, ON means trip state' },
      { id: 'b', type: 'INPUT', label: 'Sensor B trip', device: 'Second independent sensor' },
      { id: 'c', type: 'INPUT', label: 'Sensor C trip', device: 'Third independent sensor' },
      { id: 'reset', type: 'INPUT', label: 'Reset', device: 'Reset push button' },
    ],
    outputs: [
      { id: 'shutdown', type: 'OUTPUT', label: 'Shutdown valve closed', device: 'De-energise-to-trip solenoid on the shutdown valve' },
      { id: 'preAlarm', type: 'OUTPUT', label: 'Sensor disagreement', device: 'Alarm to the operator' },
    ],
    tryIt: ['Switch Sensor A on: only the disagreement alarm.', 'Switch Sensor C on as well: the trip latches.', 'Switch both off and pulse Reset.'],
    steps: [
      { title: 'Build the three pairs', text: 'A AND B, A AND C, B AND C.' },
      { title: 'OR the pairs', text: 'Any pair true means two sensors agree: that is the vote.' },
      { title: 'Latch the trip', text: 'The vote sets a latch; Reset clears it only when the vote is gone.' },
      { title: 'Alarm on disagreement', text: 'Any sensor AND NOT vote: one sensor alone in the trip state.' },
    ],
    mistakes: [
      'Implementing safety trips in a standard PLC. A safety instrumented function belongs in a certified safety PLC with a SIL assessment; this page shows the logic only.',
      'Allowing reset while the vote is still active, which makes the trip "pump" on and off.',
      'Sharing the impulse line or power supply between the three sensors, which defeats the redundancy.',
    ],
    faq: [
      { q: 'What does "de-energise to trip" mean?', a: 'The safe state is the unpowered state: the shutdown valve closes when the solenoid loses power, so a cut wire or a power loss also leads to a trip.' },
      { q: 'How do I handle a sensor in bypass for maintenance?', a: 'Degrade the vote: with one sensor bypassed, 2oo3 becomes 1oo2 on the remaining two. Show the bypass to the operator and limit how long it can stay active.' },
    ],
    blocks: ['AND', 'OR', 'NOT', 'RS_LATCH'],
    challenges: ['guarded-machine', 'door-alarm'],
    scenarios: [
      {
        name: 'Single sensor, vote, reset',
        steps: [
          { action: 'Sensor A trips', set: { a: true }, waitMs: 200, expect: { shutdown: false, preAlarm: true } },
          { action: 'Sensor C trips too', set: { c: true }, waitMs: 200, expect: { shutdown: true, preAlarm: false } },
          { action: 'Reset while still voting', set: { reset: true }, waitMs: 200, expect: { shutdown: true } },
          { action: 'Sensors clear', set: { reset: false, a: false, c: false }, waitMs: 200, expect: { shutdown: true, preAlarm: false } },
          { action: 'Reset', set: { reset: true }, waitMs: 200, expect: { shutdown: false } },
        ],
      },
      {
        name: 'Every pair trips',
        steps: [
          { action: 'A and B', set: { reset: false, a: true, b: true }, waitMs: 200, expect: { shutdown: true } },
          { action: 'Clear and reset', set: { a: false, b: false, reset: true }, waitMs: 200, expect: { shutdown: false } },
          { action: 'B and C', set: { reset: false, b: true, c: true }, waitMs: 200, expect: { shutdown: true } },
          { action: 'Clear and reset', set: { b: false, c: false, reset: true }, waitMs: 200, expect: { shutdown: false } },
          { action: 'Only B', set: { reset: false, b: true }, waitMs: 200, expect: { shutdown: false, preAlarm: true } },
          { action: 'Only C', set: { b: false, c: true }, waitMs: 200, expect: { shutdown: false, preAlarm: true } },
        ],
      },
    ],
  },
  {
    slug: 'plc-program-two-floor-elevator',
    title: 'PLC program for a two-floor elevator (lift)',
    description: 'Two-floor elevator logic: call buttons, floor limit switches, a door interlock and up/down motor interlock. Simulate the PLC program in the browser.',
    answer:
      'Latch "travel up" when floor 2 is called and the car is not there, and "travel down" for floor 1, each reset by its floor limit switch. The motor only runs while the door is closed, and the two directions are interlocked.',
    level: 'intermediate',
    explanation: `- **Up latch**: Set = call floor 2 AND NOT at floor 2 AND NOT travelling down. Reset = at floor 2.
- **Down latch**: Set = call floor 1 AND NOT at floor 1 AND NOT travelling up. Reset = at floor 1.
- **Motor up** = up latch AND door closed. **Motor down** = down latch AND door closed.

If the door opens during travel, the motor stops but the latch remembers the trip, so the car continues when the door closes again. The up latch reads the down latch from the previous scan (one-scan delay) to break the mutual interlock loop.`,
    circuit: `circuit "Two-floor elevator" version 1 {
  call1: INPUT(label="Call floor 1")
  call2: INPUT(label="Call floor 2")
  floor1: INPUT(label="At floor 1")
  floor2: INPUT(label="At floor 2")
  door: INPUT(label="Door closed", value=true)
  notAt2: NOT(label="Not at floor 2")
  notAt1: NOT(label="Not at floor 1")
  downPrev: SCAN_DELAY(label="Travelling down")
  notDown: NOT(label="Not travelling down")
  want2: AND(label="Floor 2 wanted")
  upSet: AND(label="Go up")
  up: RS_LATCH(label="Travel up")
  notUp: NOT(label="Not travelling up")
  want1: AND(label="Floor 1 wanted")
  downSet: AND(label="Go down")
  down: RS_LATCH(label="Travel down")
  upMotor: AND(label="Up with door closed")
  downMotor: AND(label="Down with door closed")
  motorUp: OUTPUT(label="Motor up")
  motorDown: OUTPUT(label="Motor down")
  floor2.Q -> notAt2.A
  floor1.Q -> notAt1.A
  down.Q -> downPrev.A
  downPrev.Q -> notDown.A
  call2.Q -> want2.A
  notAt2.Q -> want2.B
  want2.Q -> upSet.A
  notDown.Q -> upSet.B
  upSet.Q -> up.S
  floor2.Q -> up.R
  up.Q -> notUp.A
  call1.Q -> want1.A
  notAt1.Q -> want1.B
  want1.Q -> downSet.A
  notUp.Q -> downSet.B
  downSet.Q -> down.S
  floor1.Q -> down.R
  up.Q -> upMotor.A
  door.Q -> upMotor.B
  down.Q -> downMotor.A
  door.Q -> downMotor.B
  upMotor.Q -> motorUp.A
  downMotor.Q -> motorDown.A
}`,
    inputs: [
      { id: 'call1', type: 'INPUT', label: 'Call floor 1', device: 'Hall button at floor 1 or car button "1"' },
      { id: 'call2', type: 'INPUT', label: 'Call floor 2', device: 'Hall button at floor 2 or car button "2"' },
      { id: 'floor1', type: 'INPUT', label: 'At floor 1', device: 'Floor limit switch or magnetic sensor' },
      { id: 'floor2', type: 'INPUT', label: 'At floor 2', device: 'Floor limit switch or magnetic sensor' },
      { id: 'door', type: 'INPUT', label: 'Door closed', device: 'Door lock switch (part of the safety circuit)' },
    ],
    outputs: [
      { id: 'motorUp', type: 'OUTPUT', label: 'Motor up', device: 'Up contactor' },
      { id: 'motorDown', type: 'OUTPUT', label: 'Motor down', device: 'Down contactor' },
    ],
    tryIt: ['Switch At floor 1 ON (the car is at floor 1).', 'Switch Call floor 2 on and off, then At floor 1 OFF: the car travels up.', 'Switch At floor 2 ON: the motor stops. Open the door during travel to see the interlock.'],
    steps: [
      { title: 'One latch per direction', text: 'Set by the call for the other floor, reset by the destination floor switch.' },
      { title: 'Ignore calls to the current floor', text: 'AND each call with NOT at that floor.' },
      { title: 'Interlock the directions', text: 'Up may only set while not travelling down and the other way round.' },
      { title: 'Gate the motor with the door', text: 'The latches remember the trip; the door switch only allows movement.' },
    ],
    mistakes: [
      'Implementing door and overtravel safety in the PLC only. Real lifts have a hardwired safety chain (door locks, final limits, overspeed governor) that cuts the motor independently.',
      'Resetting the latch when the door opens, so a passenger opening the door strands the car between floors.',
      'No travel timeout: a failed floor switch lets the motor drive into the final limit.',
    ],
    faq: [
      { q: 'How do I extend this to three or more floors?', a: 'Store calls in latches per floor, compare the requested floor with the current floor (from floor sensors or a position counter), and travel up or down toward the nearest call. A state machine with a current-floor number scales better than one latch pair.' },
      { q: 'How do I slow down before the floor?', a: 'Add slow-down sensors before each floor and switch the drive to a creep speed when the slow-down sensor for the destination floor is reached.' },
    ],
    blocks: ['RS_LATCH', 'SCAN_DELAY', 'AND', 'NOT'],
    challenges: ['guarded-machine', 'start-stop'],
    never: [{ when: { motorUp: true, motorDown: true }, message: 'Motor up and down were on together' }],
    scenarios: [
      {
        name: 'Up, door interruption, down',
        steps: [
          { action: 'Car at floor 1', set: { floor1: true, door: true }, waitMs: 300, expect: { motorUp: false, motorDown: false } },
          { action: 'Call floor 1 while there', set: { call1: true }, waitMs: 300, expect: { motorDown: false } },
          { action: 'Call floor 2', set: { call1: false, call2: true }, waitMs: 200, expect: { motorUp: true } },
          { action: 'Car leaves floor 1', set: { call2: false, floor1: false }, waitMs: 1000, expect: { motorUp: true } },
          { action: 'Door opens', set: { door: false }, waitMs: 300, expect: { motorUp: false } },
          { action: 'Door closes', set: { door: true }, waitMs: 300, expect: { motorUp: true } },
          { action: 'Arrives at floor 2', set: { floor2: true }, waitMs: 200, expect: { motorUp: false, motorDown: false } },
          { action: 'Call floor 1', set: { call1: true }, waitMs: 200, expect: { motorDown: true } },
          { action: 'Leaves floor 2', set: { call1: false, floor2: false }, waitMs: 1000, expect: { motorDown: true } },
          { action: 'Call floor 2 while travelling down', set: { call2: true }, waitMs: 300, expect: { motorDown: true, motorUp: false } },
          { action: 'Arrives at floor 1', set: { call2: false, floor1: true }, waitMs: 200, expect: { motorDown: false } },
        ],
      },
      {
        name: 'Both calls between floors',
        steps: [{ action: 'Both calls, car between floors', set: { call1: true, call2: true }, waitMs: 500, expect: { motorUp: true, motorDown: false } }],
      },
    ],
  },
  {
    slug: 'one-push-button-on-off-toggle',
    title: 'How to turn a light on and off with one push button (PLC toggle)',
    description: 'Use a single push button to switch an output on and off: the flip-flop (toggle, pulse relay) in PLC logic, plus how to do it in ladder with an edge.',
    answer:
      'Detect the rising edge of the push button and flip the output on every edge. Most PLCs have a ready-made toggle (flip-flop or pulse relay); in plain ladder you build it from a one-shot and the output\'s own state.',
    level: 'beginner',
    explanation: `A **pulse relay** (toggle flip-flop) changes its output every time its input goes from OFF to ON. Holding the button does nothing more; it has to be released and pressed again.

Building it by hand in ladder logic needs an **edge** (one-shot):

1. ONS = button AND NOT button-last-scan (a one-scan pulse when the button is pressed).
2. Light = (ONS AND NOT Light) OR (NOT ONS AND Light).

Without the edge, the output would flip on every scan while the button is held, so it would end up randomly ON or OFF.

The circuit here adds an **All off** input (for example a "leaving the building" switch) that turns the light off whatever its state.`,
    circuit: `circuit "One-button toggle" version 1 {
  button: INPUT(label="Push button")
  allOff: INPUT(label="All off")
  toggle: PULSE_RELAY(label="Toggle")
  notAllOff: NOT(label="Not all off")
  lightLogic: AND(label="Light allowed")
  light: OUTPUT(label="Light")
  button.Q -> toggle.A
  allOff.Q -> notAllOff.A
  toggle.Q -> lightLogic.A
  notAllOff.Q -> lightLogic.B
  lightLogic.Q -> light.A
}`,
    inputs: [
      { id: 'button', type: 'INPUT', label: 'Push button', device: 'Momentary push button' },
      { id: 'allOff', type: 'INPUT', label: 'All off', device: 'Central off switch' },
    ],
    outputs: [{ id: 'light', type: 'OUTPUT', label: 'Light', device: 'Lighting contactor or relay' }],
    tryIt: ['Switch Push button on and off: the light turns on.', 'Do it again: the light turns off.', 'Hold the button on: nothing more happens until it is released.'],
    steps: [
      { title: 'Use the edge', text: 'React to OFF→ON of the button, not to its level.' },
      { title: 'Flip the state', text: 'A pulse relay does it in one block; in ladder, use a one-shot and an XOR-style rung.' },
      { title: 'Add an override', text: 'AND the output with NOT All off, or reset the state, for central switching.' },
    ],
    mistakes: [
      'Toggling on the button level: the output flickers every scan while the button is held.',
      'Bouncing contacts: a cheap button can make several edges per press. Debounce with a short on-delay (20–50 ms) before the toggle.',
      'Forgetting what happens after a power cut: a plain toggle restarts OFF. Use a retentive bit if the state must survive.',
    ],
    faq: [
      { q: 'What is this block called on different PLCs?', a: 'Flip-flop, toggle, alternate, impulse relay or pulse relay (Siemens LOGO!). In Allen-Bradley ladder it is usually built with an ONS instruction and a seal-in.' },
      { q: 'How do I add a long press for "all off"?', a: 'Put an on-delay (for example 2 s) on the button; when it is done, reset the light. A short press still toggles.' },
    ],
    blocks: ['PULSE_RELAY', 'R_TRIG', 'AND', 'NOT', 'XOR'],
    challenges: ['light-switch', 'batch-counter'],
    scenarios: [
      {
        name: 'Toggle on and off',
        steps: [
          { action: 'Press', set: { button: true }, waitMs: 200, expect: { light: true } },
          { action: 'Release', set: { button: false }, waitMs: 300, expect: { light: true } },
          { action: 'Press again', set: { button: true }, waitMs: 200, expect: { light: false } },
          { action: 'Hold for 2 s', waitMs: 2000, expect: { light: false } },
          { action: 'Release and press', set: { button: false }, waitMs: 200 },
          { action: 'Press', set: { button: true }, waitMs: 200, expect: { light: true } },
          { action: 'All off', set: { button: false, allOff: true }, waitMs: 200, expect: { light: false } },
        ],
      },
    ],
  },
  {
    slug: 'motor-fail-to-start-feedback-alarm',
    title: 'How to detect a motor that fails to start (run feedback alarm)',
    description: 'Compare the run command with the contactor or flow feedback: if they disagree for 3 s, latch a fault and stop the motor. PLC logic with a live simulator.',
    answer:
      'Start an on-delay timer whenever the motor is commanded to run but the feedback is missing. If the timer finishes, latch a fault, drop the run command and require a reset. The same check catches a motor that stops while running.',
    level: 'intermediate',
    explanation: `The PLC only knows what it *commands*. The **feedback** (contactor auxiliary contact, drive "running" signal, flow or speed switch) tells it what really happens.

- **Mismatch** = run command AND NOT feedback.
- An **on-delay (3 s)** on the mismatch allows for normal start-up time.
- When it finishes, a **fault latch** sets, the motor output drops, and the run latch is reset (through a one-scan delay), so the motor will not restart by itself after the fault is reset.
- **Reset** clears the fault. The operator then starts the motor again.

Choose the feedback that proves what matters: a contactor auxiliary proves the contactor closed, a flow switch proves the pump actually moves liquid.`,
    circuit: `circuit "Fail-to-start alarm" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  feedback: INPUT(label="Run feedback")
  reset: INPUT(label="Fault reset")
  faultPrev: SCAN_DELAY(label="Fault (last scan)")
  stopOrFault: OR(label="Stop or fault")
  run: RS_LATCH(label="Run command")
  noFeedback: NOT(label="No feedback")
  mismatch: AND(label="Commanded, not running")
  delay: TON(label="Feedback time", duration=3000)
  fault: RS_LATCH(label="Fault")
  healthy: NOT(label="No fault")
  motorLogic: AND(label="Run motor")
  motor: OUTPUT(label="Motor contactor")
  faultLamp: OUTPUT(label="Fault lamp")
  fault.Q -> faultPrev.A
  stop.Q -> stopOrFault.A
  faultPrev.Q -> stopOrFault.B
  start.Q -> run.S
  stopOrFault.Q -> run.R
  feedback.Q -> noFeedback.A
  run.Q -> mismatch.A
  noFeedback.Q -> mismatch.B
  mismatch.Q -> delay.A
  delay.Q -> fault.S
  reset.Q -> fault.R
  fault.Q -> healthy.A
  run.Q -> motorLogic.A
  healthy.Q -> motorLogic.B
  motorLogic.Q -> motor.A
  fault.Q -> faultLamp.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'feedback', type: 'INPUT', label: 'Run feedback', device: 'Contactor auxiliary, drive running output or flow switch' },
      { id: 'reset', type: 'INPUT', label: 'Fault reset', device: 'Reset push button' },
    ],
    outputs: [
      { id: 'motor', type: 'OUTPUT', label: 'Motor contactor', device: 'Contactor coil or drive run command' },
      { id: 'faultLamp', type: 'OUTPUT', label: 'Fault lamp', device: 'Indicator or alarm to the HMI' },
    ],
    tryIt: ['Switch Start on and off and then Run feedback ON within 3 s: no fault.', 'Switch Run feedback OFF: after 3 s the fault lamp lights and the motor stops.', 'Pulse Fault reset, then start again.'],
    steps: [
      { title: 'Compare command and feedback', text: 'Mismatch = commanded AND NOT feedback.' },
      { title: 'Allow the start-up time', text: 'An on-delay on the mismatch, longer than the normal time to see feedback.' },
      { title: 'Latch the fault', text: 'The timer sets a fault latch; a reset button clears it.' },
      { title: 'Stop and require a restart', text: 'The fault removes the motor output and resets the run command.' },
    ],
    mistakes: [
      'Monitoring the output you wrote instead of a real feedback signal: it always agrees.',
      'Setting the delay shorter than the start-up time of a drive with a long ramp, which gives nuisance faults.',
      'Auto-resetting the fault, which can make a pump with a broken coupling start and stop forever.',
    ],
    faq: [
      { q: 'Should I also check "running without command"?', a: 'Yes. Feedback present while not commanded (a welded contactor, a drive in local mode) deserves its own alarm, usually without stopping anything since the PLC is not in control.' },
      { q: 'How do I start the standby pump on this fault?', a: 'Combine this page with duty/standby alternation: feed each pump\'s fault latch into the fault inputs of the alternation logic.' },
    ],
    blocks: ['TON', 'RS_LATCH', 'SCAN_DELAY', 'AND', 'NOT', 'OR'],
    challenges: ['delayed-fan', 'start-stop'],
    scenarios: [
      {
        name: 'Normal start, then feedback lost',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 200, expect: { motor: true, faultLamp: false } },
          { action: 'Feedback after 1 s', set: { start: false }, waitMs: 1000 },
          { action: 'Feedback present', set: { feedback: true }, waitMs: 4000, expect: { motor: true, faultLamp: false } },
          { action: 'Feedback lost', set: { feedback: false }, waitMs: 2500, expect: { motor: true, faultLamp: false } },
          { action: '3 s without feedback', waitMs: 800, expect: { motor: false, faultLamp: true } },
          { action: 'Reset', set: { reset: true }, waitMs: 200, expect: { faultLamp: false, motor: false } },
          { action: 'Stays stopped', set: { reset: false }, waitMs: 2000, expect: { motor: false } },
        ],
      },
      {
        name: 'Fails to start',
        steps: [
          { action: 'Press Start, no feedback ever', set: { start: true }, waitMs: 200, expect: { motor: true } },
          { action: 'Wait 3.5 s', set: { start: false }, waitMs: 3500, expect: { motor: false, faultLamp: true } },
          { action: 'Reset, start, feedback, then Stop', set: { reset: true }, waitMs: 200 },
          { action: 'Start with feedback', set: { reset: false, start: true, feedback: true }, waitMs: 200, expect: { motor: true } },
          { action: 'Press Stop', set: { start: false, stop: true }, waitMs: 200, expect: { motor: false, faultLamp: false } },
        ],
      },
    ],
  },
];
