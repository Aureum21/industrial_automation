import type { HowTo } from './types.ts';
import { HOW_TOS_BATCH_2 } from './batch2.ts';

/**
 * How-to guides for the classic PLC exercises. Every circuit is verified by tests/howto.test.ts
 * against its scenarios, so the text must describe what the circuit really does.
 */
const BATCH_1: HowTo[] = [
  {
    slug: 'start-stop-motor-control-seal-in',
    title: 'How to make a start/stop motor control circuit (seal-in) in PLC ladder logic',
    description: 'Build a 3-wire start/stop motor circuit with a seal-in contact and overload trip. Live simulator, ladder diagram and Arduino code.',
    answer:
      'A start/stop circuit keeps a motor running after the Start button is released by "sealing in": the motor\'s own contact is wired in parallel with Start. Stop and the overload trip are normally closed contacts in series, so either one breaks the rung and drops the motor out.',
    level: 'beginner',
    explanation: `The rung reads: **Motor = (Start OR Motor) AND NOT Stop AND NOT Overload.**

- Pressing **Start** closes the first branch, so the motor energises.
- On the next scan the **Motor** contact in the parallel branch is closed too, so releasing Start changes nothing. That is the seal-in (also called latching or holding contact).
- **Stop** and **Overload** are in series. Opening either one de-energises the coil, which also opens the seal-in contact, so the motor stays off until Start is pressed again.
- If Start and Stop are pressed together, the motor stays off: Stop wins. That is the safe behaviour.

In a function block diagram, the seal-in feedback passes through a **one-scan delay** block. The simulator evaluates blocks in signal order, so feedback must be explicit; a PLC does the same thing when a rung reads a coil written on the previous scan.`,
    circuit: `circuit "Start/stop motor with seal-in" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  overload: INPUT(label="Overload tripped")
  sealed: OR(label="Start or running")
  trips: OR(label="Stop or overload")
  healthy: NOT(label="No stop request")
  run: AND(label="Run")
  holding: SCAN_DELAY(label="Motor")
  motor: OUTPUT(label="Motor contactor")
  start.Q -> sealed.A
  holding.Q -> sealed.B
  stop.Q -> trips.A
  overload.Q -> trips.B
  trips.Q -> healthy.A
  sealed.Q -> run.A
  healthy.Q -> run.B
  run.Q -> holding.A
  run.Q -> motor.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Normally open push button (green)' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Push button (red); ON means pressed' },
      { id: 'overload', type: 'INPUT', label: 'Overload tripped', device: 'Thermal overload relay auxiliary contact; ON means tripped' },
    ],
    outputs: [{ id: 'motor', type: 'OUTPUT', label: 'Motor contactor', device: 'Contactor coil K1' }],
    tryIt: ['Switch Start on and off again: the motor keeps running.', 'Toggle Stop on: the motor stops and stays stopped after Stop is released.', 'Try Overload tripped while running.'],
    steps: [
      { title: 'Wire Start to an OR block', text: 'The OR is the parallel branch of the rung: Start on one input, the seal-in contact on the other.' },
      { title: 'Combine Stop and Overload', text: 'OR them together and invert with NOT. This is the same as two normally closed contacts in series: if either is active, the rung is broken.' },
      { title: 'AND the two halves', text: 'Run = (Start OR Motor) AND NOT (Stop OR Overload). Wire the AND output to the motor output.' },
      { title: 'Feed the result back', text: 'Connect Run through a one-scan delay into the second OR input. That is the seal-in contact.' },
      { title: 'Test every case', text: 'Start, release, Stop, release, Start while Stop is held, and an overload trip while running.' },
    ],
    mistakes: [
      'Wiring Stop as a normally open contact in the PLC while the field device is normally closed. Decide what ON means for each input and invert once.',
      'Using a hardwired Stop only as a PLC input. For safety, a real stop circuit must also break the contactor coil directly, not only through the PLC.',
      'Forgetting the overload, so a motor that tripped restarts as soon as the relay resets with Start still held.',
    ],
    faq: [
      { q: 'Why is it called a 3-wire control circuit?', a: 'In hardwired control, the start/stop station needs three wires to the starter: the supply, the start contact and the seal-in point. A 2-wire circuit uses a maintained switch instead and restarts automatically after a power failure.' },
      { q: 'Can I use a set/reset latch instead of a seal-in?', a: 'Yes. An RS latch with Start on S and Stop on R behaves the same, and reset-dominant latches also make Stop win. The seal-in rung is what you will find in most existing ladder programs.' },
      { q: 'What happens after a power failure?', a: 'The seal-in drops out, so the motor stays off until someone presses Start. That is why this circuit is preferred for machines.' },
    ],
    blocks: ['OR', 'AND', 'NOT', 'SCAN_DELAY', 'RS_LATCH'],
    challenges: ['start-stop', 'guarded-machine'],
    scenarios: [
      {
        name: 'Start, hold running, stop',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 200, expect: { motor: true } },
          { action: 'Release Start', set: { start: false }, waitMs: 1000, expect: { motor: true } },
          { action: 'Press Stop', set: { stop: true }, waitMs: 200, expect: { motor: false } },
          { action: 'Release Stop', set: { stop: false }, waitMs: 1000, expect: { motor: false } },
        ],
      },
      {
        name: 'Stop wins and overload trips',
        steps: [
          { action: 'Hold Stop and press Start', set: { stop: true, start: true }, waitMs: 300, expect: { motor: false } },
          { action: 'Release both', set: { stop: false, start: false }, waitMs: 300, expect: { motor: false } },
          { action: 'Start the motor', set: { start: true }, waitMs: 200 },
          { action: 'Release Start', set: { start: false }, waitMs: 200, expect: { motor: true } },
          { action: 'Overload trips', set: { overload: true }, waitMs: 200, expect: { motor: false } },
          { action: 'Overload resets', set: { overload: false }, waitMs: 500, expect: { motor: false } },
        ],
      },
    ],
  },
  {
    slug: 'plc-program-traffic-light',
    title: 'PLC program for a traffic light (with timers)',
    description: 'A traffic light sequence in PLC logic: green, yellow and red with on-delay timers that repeat. Run it live, see the ladder and get Arduino code.',
    answer:
      'A traffic light is a timed sequence: three on-delay timers in a chain measure green, yellow and red, and the last timer restarts the cycle. Each lamp is ON between the moment one timer finishes and the next one does.',
    level: 'intermediate',
    explanation: `Three TON timers are chained: **T1** (green, 5 s) runs while the cycle is enabled, **T2** (yellow, 2 s) starts when T1 is done, and **T3** (red, 5 s) starts when T2 is done.

- **Green** = enabled AND NOT T1 done
- **Yellow** = T1 done AND NOT T2 done
- **Red** = T2 done, or the end-of-cycle scan, or the light is switched off

When T3 finishes, a one-scan delay turns the enable OFF for exactly one scan. That resets all three timers and the sequence starts again with green. Red stays on during that reset scan so the junction is never dark, and when the Run switch is OFF the light shows red.`,
    circuit: `circuit "Traffic light" version 1 {
  run: INPUT(label="Run")
  endOfCycle: SCAN_DELAY(label="Cycle finished")
  notEnd: NOT(label="Not finished")
  enable: AND(label="Cycle enabled")
  t1: TON(label="Green time", duration=5000)
  t2: TON(label="Yellow time", duration=2000)
  t3: TON(label="Red time", duration=5000)
  notT1: NOT(label="Green not done")
  notT2: NOT(label="Yellow not done")
  greenLogic: AND(label="Green")
  yellowLogic: AND(label="Yellow")
  stopped: NOT(label="Switched off")
  redHold: OR(label="Reset or off")
  redLogic: OR(label="Red")
  green: OUTPUT(label="Green lamp")
  yellow: OUTPUT(label="Yellow lamp")
  red: OUTPUT(label="Red lamp")
  t3.Q -> endOfCycle.A
  endOfCycle.Q -> notEnd.A
  run.Q -> enable.A
  notEnd.Q -> enable.B
  enable.Q -> t1.A
  t1.Q -> t2.A
  t2.Q -> t3.A
  t1.Q -> notT1.A
  t2.Q -> notT2.A
  enable.Q -> greenLogic.A
  notT1.Q -> greenLogic.B
  t1.Q -> yellowLogic.A
  notT2.Q -> yellowLogic.B
  run.Q -> stopped.A
  endOfCycle.Q -> redHold.A
  stopped.Q -> redHold.B
  t2.Q -> redLogic.A
  redHold.Q -> redLogic.B
  greenLogic.Q -> green.A
  yellowLogic.Q -> yellow.A
  redLogic.Q -> red.A
}`,
    inputs: [{ id: 'run', type: 'INPUT', label: 'Run', device: 'Selector switch: ON runs the sequence' }],
    outputs: [
      { id: 'green', type: 'OUTPUT', label: 'Green lamp', device: 'Green signal head' },
      { id: 'yellow', type: 'OUTPUT', label: 'Yellow lamp', device: 'Yellow (amber) signal head' },
      { id: 'red', type: 'OUTPUT', label: 'Red lamp', device: 'Red signal head' },
    ],
    tryIt: ['Switch the Run input ON.', 'Watch the coils: green 5 s, yellow 2 s, red 5 s, repeating.', 'Switch Run OFF at any time: the light goes to red.'],
    steps: [
      { title: 'Chain three on-delay timers', text: 'T1 (5 s) gets the enable signal, T2 (2 s) gets T1.Q, T3 (5 s) gets T2.Q. Each starts when the previous one is done.' },
      { title: 'Decode the lamps', text: 'Green = enable AND NOT T1. Yellow = T1 AND NOT T2. Red = T2 (it stays on while T3 times).' },
      { title: 'Restart the cycle', text: 'Feed T3.Q through a one-scan delay and NOT into the enable AND. When red time ends, every timer resets for one scan.' },
      { title: 'Make the safe state red', text: 'OR the reset scan and "Run is OFF" into the red lamp, so the junction is never dark.' },
      { title: 'Check the overlaps', text: 'Green and red must never be on together; neither may green and yellow. The tests for this page check that on every scan.' },
    ],
    mistakes: [
      'Resetting the first timer directly from the last one without a scan delay. That makes a loop the simulator rejects, and in a PLC the order of rungs decides whether the reset is seen.',
      'Leaving all lamps off in the reset scan or when stopped. Use red (or flashing yellow) as the safe state.',
      'Building the second direction by copying the timers. Use the same timers: the cross street is green while this street is red, plus an all-red clearance time.',
    ],
    faq: [
      { q: 'How do I add the second direction?', a: 'Use the same timer chain with a longer cycle: street A green, yellow, then an all-red clearance, then street B green, yellow, all-red. Each lamp is decoded from which timers are done, exactly like here.' },
      { q: 'Should I use a sequencer or a counter instead?', a: 'For many steps a step counter or sequencer instruction is shorter. The timer chain shown here is the version taught first and works on every PLC and on Arduino.' },
      { q: 'Why does red last 100 ms longer?', a: 'Red also covers the one reset scan at the end of the cycle. With a 100 ms scan, red is on for 5.1 s.' },
    ],
    blocks: ['TON', 'SCAN_DELAY', 'AND', 'NOT', 'OR'],
    challenges: ['delayed-fan', 'star-delta'],
    never: [
      { when: { green: true, red: true }, message: 'Green and red were on together' },
      { when: { green: true, yellow: true }, message: 'Green and yellow were on together' },
      { when: { green: false, yellow: false, red: false }, message: 'All lamps were dark' },
    ],
    scenarios: [
      {
        name: 'One full cycle and back to green',
        steps: [
          { action: 'Switch Run on', set: { run: true }, waitMs: 100, expect: { green: true, yellow: false, red: false } },
          { action: 'Wait until 2.5 s', waitMs: 2400, expect: { green: true } },
          { action: 'Wait until 6 s', waitMs: 3500, expect: { green: false, yellow: true, red: false } },
          { action: 'Wait until 8.5 s', waitMs: 2500, expect: { yellow: false, red: true } },
          { action: 'Wait until 11.5 s', waitMs: 3000, expect: { red: true, green: false } },
          { action: 'Wait until 13.5 s', waitMs: 2000, expect: { green: true, red: false } },
        ],
      },
      {
        name: 'Switching off shows red',
        steps: [
          { action: 'Run for 3 s', set: { run: true }, waitMs: 3000, expect: { green: true } },
          { action: 'Switch Run off', set: { run: false }, waitMs: 200, expect: { green: false, yellow: false, red: true } },
        ],
      },
    ],
  },
  {
    slug: 'plc-program-car-wash',
    title: 'PLC program for an automatic car wash',
    description: 'Car wash sequence in PLC logic: soap, brushes, rinse and dryer timed in order, with stop and car-position interlocks. Simulate it and get the ladder.',
    answer:
      'A car wash is a start/stop latch that enables a chain of timers: soap, brushes, rinse, dryer. The cycle starts only when a car is in position, ends by itself after the dryer, and stops at once if the car moves or Stop is pressed.',
    level: 'intermediate',
    explanation: `A **reset-dominant RS latch** remembers that a wash is in progress.

- **Set**: Start pressed AND car in position.
- **Reset**: Stop, OR the car leaves its position, OR the cycle has finished.

While the latch is ON, four on-delay timers run in a chain (soap 4 s, brushes 6 s, rinse 4 s, dryer 4 s measured from the previous step). Each output is ON from the end of the previous step to the end of its own:

- Soap = washing AND NOT T1
- Brushes = T1 AND NOT T2
- Rinse = T2 AND NOT T3
- Dryer = T3 AND NOT T4

T4 finishing resets the latch through a one-scan delay, so the cycle ends by itself and every timer resets for the next car.`,
    circuit: `circuit "Car wash" version 1 {
  start: INPUT(label="Start (coin accepted)")
  stop: INPUT(label="Stop")
  car: INPUT(label="Car in position")
  canStart: AND(label="Start with car present")
  carGone: NOT(label="Car not in position")
  done: SCAN_DELAY(label="Cycle finished")
  stopOrGone: OR(label="Stop or car moved")
  resetAll: OR(label="Reset wash")
  washing: RS_LATCH(label="Washing")
  t1: TON(label="Soap time", duration=4000)
  t2: TON(label="Brush time", duration=6000)
  t3: TON(label="Rinse time", duration=4000)
  t4: TON(label="Dry time", duration=4000)
  n1: NOT(label="Soap not done")
  n2: NOT(label="Brushes not done")
  n3: NOT(label="Rinse not done")
  n4: NOT(label="Dryer not done")
  soapLogic: AND(label="Soap step")
  brushLogic: AND(label="Brush step")
  rinseLogic: AND(label="Rinse step")
  dryLogic: AND(label="Dry step")
  soap: OUTPUT(label="Soap pump")
  brushes: OUTPUT(label="Brush motors")
  rinse: OUTPUT(label="Rinse valve")
  dryer: OUTPUT(label="Dryer fan")
  start.Q -> canStart.A
  car.Q -> canStart.B
  car.Q -> carGone.A
  t4.Q -> done.A
  stop.Q -> stopOrGone.A
  carGone.Q -> stopOrGone.B
  stopOrGone.Q -> resetAll.A
  done.Q -> resetAll.B
  canStart.Q -> washing.S
  resetAll.Q -> washing.R
  washing.Q -> t1.A
  t1.Q -> t2.A
  t2.Q -> t3.A
  t3.Q -> t4.A
  t1.Q -> n1.A
  t2.Q -> n2.A
  t3.Q -> n3.A
  t4.Q -> n4.A
  washing.Q -> soapLogic.A
  n1.Q -> soapLogic.B
  t1.Q -> brushLogic.A
  n2.Q -> brushLogic.B
  t2.Q -> rinseLogic.A
  n3.Q -> rinseLogic.B
  t3.Q -> dryLogic.A
  n4.Q -> dryLogic.B
  soapLogic.Q -> soap.A
  brushLogic.Q -> brushes.A
  rinseLogic.Q -> rinse.A
  dryLogic.Q -> dryer.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start (coin accepted)', device: 'Push button or coin acceptor pulse' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'car', type: 'INPUT', label: 'Car in position', device: 'Photoelectric sensor or treadle at the wash position' },
    ],
    outputs: [
      { id: 'soap', type: 'OUTPUT', label: 'Soap pump', device: 'Pump contactor' },
      { id: 'brushes', type: 'OUTPUT', label: 'Brush motors', device: 'Brush motor contactor' },
      { id: 'rinse', type: 'OUTPUT', label: 'Rinse valve', device: 'Solenoid valve' },
      { id: 'dryer', type: 'OUTPUT', label: 'Dryer fan', device: 'Blower contactor' },
    ],
    tryIt: ['Switch Car in position ON, then switch Start on and off.', 'Watch the steps follow each other.', 'Turn Car in position OFF during the wash: everything stops.'],
    steps: [
      { title: 'Latch the wash cycle', text: 'RS latch: Set = Start AND car present. Reset = Stop OR car gone OR cycle finished. Reset wins if both are active.' },
      { title: 'Chain the step timers', text: 'Each TON starts when the previous one is done, so the durations add up: 4 + 6 + 4 + 4 = 18 s.' },
      { title: 'Decode each step', text: 'A step output is "previous timer done AND own timer not done". Only one step can be on at a time.' },
      { title: 'End the cycle automatically', text: 'The last timer resets the latch through a one-scan delay, which also resets every timer.' },
      { title: 'Add the interlocks', text: 'The car leaving the position and the Stop button both reset the latch immediately.' },
    ],
    mistakes: [
      'Allowing Start without a car in position, so the brushes run into an empty bay or a car that is still driving in.',
      'Using off-delay timers for the steps: a step would stay on after the next one begins.',
      'Forgetting to reset the timers at the end, so the next car starts in the dryer step.',
    ],
    faq: [
      { q: 'How do I make the steps adjustable?', a: 'Change the timer durations. On a real PLC, move the presets to HMI-adjustable registers with sensible limits.' },
      { q: 'How would I add a gantry that moves along the car?', a: 'Add forward and reverse outputs with limit switches, like the garage door example, and move to the next step when the end limit is reached instead of when a timer is done.' },
    ],
    blocks: ['RS_LATCH', 'TON', 'SCAN_DELAY', 'AND', 'NOT', 'OR'],
    challenges: ['start-stop', 'star-delta'],
    never: [
      { when: { soap: true, brushes: true }, message: 'Soap and brushes were on together' },
      { when: { brushes: true, rinse: true }, message: 'Brushes and rinse were on together' },
      { when: { rinse: true, dryer: true }, message: 'Rinse and dryer were on together' },
    ],
    scenarios: [
      {
        name: 'Full wash',
        steps: [
          { action: 'Car drives in', set: { car: true }, waitMs: 500, expect: { soap: false } },
          { action: 'Press Start', set: { start: true }, waitMs: 200, expect: { soap: true } },
          { action: 'Release Start, wait to 2 s', set: { start: false }, waitMs: 1800, expect: { soap: true } },
          { action: 'Wait to 7 s', waitMs: 5000, expect: { soap: false, brushes: true } },
          { action: 'Wait to 12 s', waitMs: 5000, expect: { brushes: false, rinse: true } },
          { action: 'Wait to 16 s', waitMs: 4000, expect: { rinse: false, dryer: true } },
          { action: 'Wait to 20 s', waitMs: 4000, expect: { soap: false, brushes: false, rinse: false, dryer: false } },
          { action: 'Wait longer', waitMs: 3000, expect: { soap: false, dryer: false } },
          { action: 'Next car: press Start', set: { start: true }, waitMs: 200, expect: { soap: true } },
        ],
      },
      {
        name: 'Interlocks',
        steps: [
          { action: 'Press Start with no car', set: { start: true }, waitMs: 300, expect: { soap: false } },
          { action: 'Release Start, car drives in, press Start', set: { start: true, car: true }, waitMs: 200, expect: { soap: true } },
          { action: 'Release Start, wait 6 s', set: { start: false }, waitMs: 6000, expect: { brushes: true } },
          { action: 'Car moves out of position', set: { car: false }, waitMs: 200, expect: { brushes: false, soap: false } },
          { action: 'Car back, start again', set: { car: true, start: true }, waitMs: 200, expect: { soap: true } },
          { action: 'Release Start and press Stop', set: { start: false, stop: true }, waitMs: 200, expect: { soap: false } },
        ],
      },
    ],
  },
  {
    slug: 'plc-program-garage-door',
    title: 'PLC program for a garage door (open, close, limit switches, safety eye)',
    description: 'Garage door control in PLC logic: open/close/stop buttons, limit switches, a photo-eye that reopens the door, and a motor interlock. Simulator included.',
    answer:
      'A garage door uses two latches, one for opening and one for closing, each reset by its limit switch, by Stop and by the opposite command. A photo-eye that sees an obstacle while closing resets the close latch and sets the open latch, so the door reverses.',
    level: 'intermediate',
    explanation: `Two **reset-dominant RS latches** drive the motor:

- **Opening**: Set = Open button, or an obstacle while closing. Reset = Stop, OR upper limit, OR Close button.
- **Closing**: Set = Close button. Reset = Stop, OR lower limit, OR obstacle, OR Open button.

Because each direction's command resets the other latch, pressing Open while the door is closing reverses it. If both buttons are pressed together, both latches see Set and Reset at once and reset wins, so the motor does not move.

The **photo-eye** is checked against the *previous* scan's closing state (a one-scan delay), which reverses the door exactly when an obstacle appears during closing and not while it is opening.`,
    circuit: `circuit "Garage door" version 1 {
  open: INPUT(label="Open button")
  close: INPUT(label="Close button")
  stop: INPUT(label="Stop button")
  upper: INPUT(label="Upper limit (fully open)")
  lower: INPUT(label="Lower limit (fully closed)")
  eye: INPUT(label="Photo-eye blocked")
  wasClosing: SCAN_DELAY(label="Was closing")
  reverse: AND(label="Obstacle while closing")
  openRequest: OR(label="Open request")
  openStop1: OR(label="Stop or upper limit")
  openStop: OR(label="Stop opening")
  closeStop1: OR(label="Stop or lower limit")
  closeStop2: OR(label="Eye or open button")
  closeStop: OR(label="Stop closing")
  opening: RS_LATCH(label="Opening")
  closing: RS_LATCH(label="Closing")
  motorUp: OUTPUT(label="Motor up")
  motorDown: OUTPUT(label="Motor down")
  closing.Q -> wasClosing.A
  eye.Q -> reverse.A
  wasClosing.Q -> reverse.B
  open.Q -> openRequest.A
  reverse.Q -> openRequest.B
  stop.Q -> openStop1.A
  upper.Q -> openStop1.B
  openStop1.Q -> openStop.A
  close.Q -> openStop.B
  stop.Q -> closeStop1.A
  lower.Q -> closeStop1.B
  eye.Q -> closeStop2.A
  open.Q -> closeStop2.B
  closeStop1.Q -> closeStop.A
  closeStop2.Q -> closeStop.B
  openRequest.Q -> opening.S
  openStop.Q -> opening.R
  close.Q -> closing.S
  closeStop.Q -> closing.R
  opening.Q -> motorUp.A
  closing.Q -> motorDown.A
}`,
    inputs: [
      { id: 'open', type: 'INPUT', label: 'Open button', device: 'Push button or remote receiver output' },
      { id: 'close', type: 'INPUT', label: 'Close button', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop button', device: 'Stop push button; ON means pressed' },
      { id: 'upper', type: 'INPUT', label: 'Upper limit (fully open)', device: 'Limit switch at the top of travel' },
      { id: 'lower', type: 'INPUT', label: 'Lower limit (fully closed)', device: 'Limit switch at the bottom of travel' },
      { id: 'eye', type: 'INPUT', label: 'Photo-eye blocked', device: 'Safety photo-eye across the opening; ON means blocked' },
    ],
    outputs: [
      { id: 'motorUp', type: 'OUTPUT', label: 'Motor up', device: 'Contactor for the opening direction' },
      { id: 'motorDown', type: 'OUTPUT', label: 'Motor down', device: 'Contactor for the closing direction' },
    ],
    tryIt: ['Switch Close on and off: Motor down turns on.', 'Turn Photo-eye blocked ON: the door reverses and opens.', 'Turn Upper limit ON: the motor stops.'],
    steps: [
      { title: 'One latch per direction', text: 'Opening and Closing are RS latches. Reset-dominant latches make every stop condition win over a held button.' },
      { title: 'Stop at the limits', text: 'Each latch is reset by its own end limit switch, so the motor stops at the end of travel.' },
      { title: 'Interlock the directions', text: 'Each direction button resets the other latch. Both buttons together reset both, so the two contactors are never on at once.' },
      { title: 'Reverse on an obstacle', text: 'Photo-eye AND "was closing" sets the opening latch; the photo-eye also resets the closing latch.' },
      { title: 'Test the edge cases', text: 'Both buttons at once, an obstacle while opening (no effect), Stop in the middle of travel.' },
    ],
    mistakes: [
      'Only interlocking in software. Real reversing starters also use an electrical interlock (each contactor\'s NC auxiliary in the other coil circuit) and often a mechanical one.',
      'Letting the photo-eye stop the door while it is opening, which can trap someone under a door that stops half-open.',
      'Forgetting that a limit switch that never makes (broken) lets the motor run forever. Add a maximum travel time with an on-delay timer.',
    ],
    faq: [
      { q: 'How do I add a single remote button (open/stop/close)?', a: 'Use a pulse relay (toggle) or a small step counter that cycles open → stop → close → stop on every press, and feed its states into the Open and Close requests.' },
      { q: 'How do I add a travel timeout?', a: 'Put an on-delay timer on "motor up OR motor down" (for example 30 s) and add its output to both reset conditions, plus a fault lamp.' },
    ],
    blocks: ['RS_LATCH', 'SCAN_DELAY', 'OR', 'AND'],
    challenges: ['guarded-machine', 'start-stop'],
    never: [{ when: { motorUp: true, motorDown: true }, message: 'Both motor directions were on together' }],
    scenarios: [
      {
        name: 'Close, obstacle reverses, open to the limit',
        steps: [
          { action: 'Press Close', set: { close: true }, waitMs: 200, expect: { motorDown: true, motorUp: false } },
          { action: 'Release Close', set: { close: false }, waitMs: 1000, expect: { motorDown: true } },
          { action: 'Obstacle in the photo-eye', set: { eye: true }, waitMs: 300, expect: { motorDown: false, motorUp: true } },
          { action: 'Obstacle clears', set: { eye: false }, waitMs: 1000, expect: { motorUp: true } },
          { action: 'Door reaches the upper limit', set: { upper: true }, waitMs: 200, expect: { motorUp: false, motorDown: false } },
        ],
      },
      {
        name: 'Lower limit, stop and both buttons',
        steps: [
          { action: 'Upper limit releases, press Close', set: { upper: false, close: true }, waitMs: 200, expect: { motorDown: true } },
          { action: 'Release Close, reach the lower limit', set: { close: false, lower: true }, waitMs: 200, expect: { motorDown: false } },
          { action: 'Press Open', set: { open: true }, waitMs: 200, expect: { motorUp: true } },
          { action: 'Release Open, lower limit releases, press Stop', set: { open: false, lower: false, stop: true }, waitMs: 200, expect: { motorUp: false } },
          { action: 'Release Stop, press Close', set: { stop: false, close: true }, waitMs: 200, expect: { motorDown: true } },
          { action: 'Release Close, press Stop while closing', set: { close: false, stop: true }, waitMs: 200, expect: { motorDown: false } },
          { action: 'Release Stop, press both buttons', set: { stop: false, open: true, close: true }, waitMs: 300, expect: { motorUp: false, motorDown: false } },
          { action: 'Obstacle while opening has no effect', set: { close: false, eye: true }, waitMs: 300, expect: { motorUp: true, motorDown: false } },
        ],
      },
    ],
  },
  {
    slug: 'plc-program-bottle-filling',
    title: 'PLC program for a bottle filling conveyor',
    description: 'Bottle filling in PLC logic: the conveyor stops at the sensor, the valve fills for a set time, then the bottle moves on. Simulator, ladder and Arduino code.',
    answer:
      'The conveyor runs until a bottle reaches the filling sensor, then stops while an on-delay timer holds the fill valve open. When the timer is done, the conveyor restarts and the timer resets as soon as the bottle has left the sensor.',
    level: 'beginner',
    explanation: `A start/stop latch gives **System running**. An on-delay timer (3 s) runs while *running AND bottle detected*.

- **Fill valve** = running AND bottle detected AND NOT timer done
- **Conveyor** = running AND (no bottle OR timer done)

When a bottle arrives, the conveyor stops and the valve opens. After 3 s the valve closes and the conveyor moves the full bottle away. While it moves, the sensor still sees the bottle, but the timer stays done, so the valve stays shut. As soon as the bottle leaves, the timer resets and is ready for the next one.`,
    circuit: `circuit "Bottle filling" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  bottle: INPUT(label="Bottle at filler")
  running: RS_LATCH(label="System running")
  atFiller: AND(label="Running with bottle")
  fillTime: TON(label="Fill time", duration=3000)
  notFull: NOT(label="Still filling")
  valveLogic: AND(label="Fill")
  noBottle: NOT(label="No bottle")
  canMove: OR(label="Clear to move")
  conveyorLogic: AND(label="Move")
  valve: OUTPUT(label="Fill valve")
  conveyor: OUTPUT(label="Conveyor motor")
  start.Q -> running.S
  stop.Q -> running.R
  running.Q -> atFiller.A
  bottle.Q -> atFiller.B
  atFiller.Q -> fillTime.A
  fillTime.Q -> notFull.A
  atFiller.Q -> valveLogic.A
  notFull.Q -> valveLogic.B
  bottle.Q -> noBottle.A
  noBottle.Q -> canMove.A
  fillTime.Q -> canMove.B
  running.Q -> conveyorLogic.A
  canMove.Q -> conveyorLogic.B
  valveLogic.Q -> valve.A
  conveyorLogic.Q -> conveyor.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'bottle', type: 'INPUT', label: 'Bottle at filler', device: 'Photoelectric or capacitive sensor under the nozzle' },
    ],
    outputs: [
      { id: 'valve', type: 'OUTPUT', label: 'Fill valve', device: 'Solenoid valve on the filling nozzle' },
      { id: 'conveyor', type: 'OUTPUT', label: 'Conveyor motor', device: 'Conveyor contactor or VFD run command' },
    ],
    tryIt: ['Switch Start on and off: the conveyor runs.', 'Turn Bottle at filler ON: the conveyor stops and the valve opens for 3 s.', 'After the fill the conveyor moves; turn the bottle sensor OFF to get ready for the next bottle.'],
    steps: [
      { title: 'Latch the system on', text: 'RS latch with Start on S and Stop on R gives "System running".' },
      { title: 'Time the fill', text: 'An on-delay timer runs while running AND bottle present. Its Q means "this bottle is full".' },
      { title: 'Open the valve', text: 'Valve = running AND bottle AND NOT full.' },
      { title: 'Move the conveyor', text: 'Conveyor = running AND (NOT bottle OR full). It stops only while a bottle is filling.' },
      { title: 'Check stopping mid-fill', text: 'Stop closes the valve immediately and resets the fill timer, so the bottle is filled for the full time after a restart.' },
    ],
    mistakes: [
      'Opening the valve on the bottle sensor alone: the valve opens again while the full bottle is moving away.',
      'Using a pulse timer started by the sensor: a stop in the middle of a fill would not close the valve.',
      'Placing the sensor so the bottle stops before it is under the nozzle. On real lines, the conveyor also needs time to coast to a stop.',
    ],
    faq: [
      { q: 'How do I fill by level instead of time?', a: 'Replace the timer with a level or weight signal: "full" becomes a level switch or an analog comparator, and the rest of the logic stays the same.' },
      { q: 'How do I count filled bottles?', a: 'Feed the timer output into a counter. Because a counter counts rising edges, each bottle counts once even though "full" stays on while it moves away.' },
    ],
    blocks: ['RS_LATCH', 'TON', 'AND', 'NOT', 'OR', 'COUNTER'],
    challenges: ['batch-counter', 'one-shot-valve'],
    never: [{ when: { valve: true, conveyor: true }, message: 'The valve was open while the conveyor was moving' }],
    scenarios: [
      {
        name: 'Fill two bottles',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 200, expect: { conveyor: true, valve: false } },
          { action: 'Release Start', set: { start: false }, waitMs: 500, expect: { conveyor: true } },
          { action: 'Bottle arrives', set: { bottle: true }, waitMs: 200, expect: { conveyor: false, valve: true } },
          { action: 'Filling', waitMs: 2500, expect: { valve: true, conveyor: false } },
          { action: 'Fill time over', waitMs: 500, expect: { valve: false, conveyor: true } },
          { action: 'Full bottle still at the sensor', waitMs: 500, expect: { valve: false, conveyor: true } },
          { action: 'Bottle leaves', set: { bottle: false }, waitMs: 500, expect: { conveyor: true } },
          { action: 'Next bottle arrives', set: { bottle: true }, waitMs: 200, expect: { valve: true, conveyor: false } },
        ],
      },
      {
        name: 'Stop during a fill',
        steps: [
          { action: 'Start with a bottle at the filler', set: { start: true, bottle: true }, waitMs: 1000, expect: { valve: true } },
          { action: 'Release Start, press Stop', set: { start: false, stop: true }, waitMs: 200, expect: { valve: false, conveyor: false } },
          { action: 'Release Stop and restart', set: { stop: false, start: true }, waitMs: 2000, expect: { valve: true } },
          { action: 'Full time again after restart', set: { start: false }, waitMs: 1200, expect: { valve: false, conveyor: true } },
        ],
      },
    ],
  },
  {
    slug: 'plc-program-conveyor-sorting-boxes',
    title: 'PLC program for sorting boxes by size on a conveyor',
    description: 'Sort tall and short boxes with two sensors, a pusher pulse and a counter that signals when the bin is full. PLC logic you can run in the browser.',
    answer:
      'When the box sensor and the height sensor are both ON, the box is tall: a pulse timer drives the pusher for a fixed time. A counter counts the tall boxes and turns on a "bin full" lamp at the limit until it is reset.',
    level: 'intermediate',
    explanation: `- **Tall box** = box sensor AND height sensor (the height sensor is mounted above short boxes).
- A **pulse timer** (1 s) drives the pusher on the rising edge of "tall box". It ignores the box staying in front of the sensors and cannot be retriggered while the pusher is out.
- A **counter** counts rising edges of "tall box". At 5 its output turns on the bin-full lamp, and the reset button empties it.
- The pusher only fires while the conveyor runs, and the conveyor stops while the bin is full so no box is pushed into a full bin.`,
    circuit: `circuit "Box sorting" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  box: INPUT(label="Box at pusher")
  tall: INPUT(label="Height sensor")
  binReset: INPUT(label="Bin emptied")
  running: RS_LATCH(label="Line running")
  isTall: AND(label="Tall box")
  sortable: AND(label="Tall box while running")
  push: PULSE_TIMER(label="Push time", duration=1000)
  bin: COUNTER(label="Boxes in bin", limit=5)
  binOk: NOT(label="Bin not full")
  moveLogic: AND(label="Move")
  pusher: OUTPUT(label="Pusher cylinder")
  conveyor: OUTPUT(label="Conveyor motor")
  binFull: OUTPUT(label="Bin full lamp")
  start.Q -> running.S
  stop.Q -> running.R
  box.Q -> isTall.A
  tall.Q -> isTall.B
  isTall.Q -> sortable.A
  running.Q -> sortable.B
  sortable.Q -> push.A
  sortable.Q -> bin.CU
  binReset.Q -> bin.R
  bin.Q -> binOk.A
  running.Q -> moveLogic.A
  binOk.Q -> moveLogic.B
  push.Q -> pusher.A
  moveLogic.Q -> conveyor.A
  bin.Q -> binFull.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'box', type: 'INPUT', label: 'Box at pusher', device: 'Photoelectric sensor at conveyor height' },
      { id: 'tall', type: 'INPUT', label: 'Height sensor', device: 'Photoelectric sensor mounted above short boxes' },
      { id: 'binReset', type: 'INPUT', label: 'Bin emptied', device: 'Push button pressed after emptying the bin' },
    ],
    outputs: [
      { id: 'pusher', type: 'OUTPUT', label: 'Pusher cylinder', device: 'Solenoid valve of the pneumatic pusher' },
      { id: 'conveyor', type: 'OUTPUT', label: 'Conveyor motor', device: 'Conveyor contactor' },
      { id: 'binFull', type: 'OUTPUT', label: 'Bin full lamp', device: 'Indicator lamp' },
    ],
    tryIt: ['Switch Start on and off.', 'Turn Box at pusher and Height sensor ON together: the pusher fires for 1 s.', 'Repeat five times: the bin-full lamp turns on and the conveyor stops. Pulse Bin emptied.'],
    steps: [
      { title: 'Detect a tall box', text: 'AND the box sensor with the height sensor. A short box only covers the lower sensor.' },
      { title: 'Fire the pusher once', text: 'A pulse timer gives a fixed 1 s stroke on the rising edge, however long the box stays in front of the sensors.' },
      { title: 'Count what was pushed', text: 'Wire the same signal to the counter\'s CU input. It counts edges, so each box counts once.' },
      { title: 'Stop when the bin is full', text: 'Counter Q lights the lamp and, inverted, removes the conveyor permission. The reset button empties the count.' },
    ],
    mistakes: [
      'Driving the pusher directly from the sensors: the stroke lasts as long as the box is detected and the cylinder may not extend fully.',
      'Counting with a level instead of an edge, which adds 1 on every scan.',
      'Placing the height sensor so the gap between boxes looks like a short box. Sample the height only while the box sensor is ON.',
    ],
    faq: [
      { q: 'What if the pusher is further down the line than the sensors?', a: 'Then the decision must travel with the box. Use a shift register clocked by a conveyor encoder or by each box, and fire the pusher when the bit reaches the pusher position.' },
      { q: 'How do I sort into three sizes?', a: 'Add a second height sensor. Tall = both height sensors, medium = only the lower one, and give each size its own pusher and counter.' },
    ],
    blocks: ['PULSE_TIMER', 'COUNTER', 'AND', 'RS_LATCH', 'SHIFT_REGISTER'],
    challenges: ['batch-counter', 'one-shot-valve'],
    scenarios: [
      {
        name: 'Tall boxes are pushed, short ones pass',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 200, expect: { conveyor: true } },
          { action: 'Release Start; a short box passes', set: { start: false, box: true }, waitMs: 500, expect: { pusher: false } },
          { action: 'Gap', set: { box: false }, waitMs: 300 },
          { action: 'Tall box arrives', set: { box: true, tall: true }, waitMs: 300, expect: { pusher: true } },
          { action: 'Box held in front of the sensors', waitMs: 1200, expect: { pusher: false } },
          { action: 'Box gone', set: { box: false, tall: false }, waitMs: 300, expect: { binFull: false } },
          { action: 'Press Stop', set: { stop: true }, waitMs: 200, expect: { conveyor: false } },
          { action: 'Tall box while stopped is not pushed', set: { stop: false, box: true, tall: true }, waitMs: 300, expect: { pusher: false } },
        ],
      },
      {
        name: 'Bin full after five tall boxes',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 200 },
          { action: 'Tall box 1', set: { start: false, box: true, tall: true }, waitMs: 200 },
          { action: 'Gap', set: { box: false, tall: false }, waitMs: 1200 },
          { action: 'Tall box 2', set: { box: true, tall: true }, waitMs: 200 },
          { action: 'Gap', set: { box: false, tall: false }, waitMs: 1200 },
          { action: 'Tall box 3', set: { box: true, tall: true }, waitMs: 200 },
          { action: 'Gap', set: { box: false, tall: false }, waitMs: 1200 },
          { action: 'Tall box 4', set: { box: true, tall: true }, waitMs: 200 },
          { action: 'Gap', set: { box: false, tall: false }, waitMs: 1200, expect: { binFull: false, conveyor: true } },
          { action: 'Tall box 5', set: { box: true, tall: true }, waitMs: 200, expect: { binFull: true, conveyor: false } },
          { action: 'Bin emptied', set: { box: false, tall: false, binReset: true }, waitMs: 200, expect: { binFull: false, conveyor: true } },
        ],
      },
    ],
  },
  {
    slug: 'tank-level-control-pump-hysteresis',
    title: 'How to control a tank level with a pump (hysteresis and alarms)',
    description: 'Tank level control in PLC logic: start the fill pump at 20 %, stop at 80 %, with high-high and low-low alarms. Run it live and get Arduino code.',
    answer:
      'Use two thresholds, not one: start the fill pump when the level falls to 20 % and stop it when the level reaches 80 %. Between the two the pump keeps its last state, which stops it from switching on and off every few seconds.',
    level: 'beginner',
    explanation: `A **hysteresis switch** (analog differential trigger) with *on threshold 20* and *off threshold 80* is a "low trigger": its output turns ON when the level falls to 20 % or below, and OFF when it rises to 80 % or above. Between 20 and 80 it remembers its state.

Two independent alarms use comparators against fixed setpoints:

- **High-high alarm** at 95 % or above. It also stops the pump, in case the level transmitter or the hysteresis logic fails high.
- **Low-low alarm** at 5 % or below, used to protect pumps that draw from the tank.

A single comparator at 50 % would switch the pump on and off continuously as the surface ripples. That is the classic mistake hysteresis solves.`,
    circuit: `circuit "Tank level control" version 1 {
  level: ANALOG_INPUT(label="Tank level %", value=50)
  band: ANALOG_DIFFERENTIAL(label="Fill between 20 and 80 %", onThreshold=20, offThreshold=80)
  hhLimit: ANALOG_CONSTANT(label="High-high 95 %", value=95)
  llLimit: ANALOG_CONSTANT(label="Low-low 5 %", value=5)
  hh: ANALOG_COMPARATOR(label="Level >= 95 %", operation="gte")
  ll: ANALOG_COMPARATOR(label="Level <= 5 %", operation="lte")
  notHH: NOT(label="Not high-high")
  pumpLogic: AND(label="Fill permitted")
  pump: OUTPUT(label="Fill pump")
  hhAlarm: OUTPUT(label="High-high alarm")
  llAlarm: OUTPUT(label="Low-low alarm")
  level.Q -> band.A
  level.Q -> hh.A
  hhLimit.Q -> hh.B
  level.Q -> ll.A
  llLimit.Q -> ll.B
  hh.Q -> notHH.A
  band.Q -> pumpLogic.A
  notHH.Q -> pumpLogic.B
  pumpLogic.Q -> pump.A
  hh.Q -> hhAlarm.A
  ll.Q -> llAlarm.A
}`,
    inputs: [{ id: 'level', type: 'ANALOG_INPUT', label: 'Tank level %', device: 'Level transmitter, 4-20 mA scaled to 0-100 %' }],
    outputs: [
      { id: 'pump', type: 'OUTPUT', label: 'Fill pump', device: 'Pump contactor' },
      { id: 'hhAlarm', type: 'OUTPUT', label: 'High-high alarm', device: 'Alarm lamp or horn' },
      { id: 'llAlarm', type: 'OUTPUT', label: 'Low-low alarm', device: 'Alarm lamp or horn' },
    ],
    tryIt: ['Press Run and set the Tank level to 20 %: the pump starts.', 'Raise the level: the pump keeps running until 80 %.', 'Lower it to 60 %: the pump stays off until the level reaches 20 % again.'],
    steps: [
      { title: 'Scale the level', text: 'Convert the transmitter signal to 0–100 %. For 4–20 mA: percent = (mA − 4) × 6.25.' },
      { title: 'Add the hysteresis switch', text: 'On threshold 20, off threshold 80. Because on is below off, it switches ON when the level falls, which is what a fill pump needs.' },
      { title: 'Add independent alarms', text: 'Comparators against 95 % and 5 %. Do not derive alarms from the pump logic.' },
      { title: 'Stop the pump on high-high', text: 'AND the pump demand with NOT high-high as a last line of defence.' },
    ],
    mistakes: [
      'Using a single threshold: the pump chatters and the contactor wears out.',
      'Setting the thresholds the wrong way round, which turns the fill pump into an empty pump.',
      'Relying on the same transmitter for control and for the safety trip. Critical overfill protection uses a separate level switch.',
    ],
    faq: [
      { q: 'How do I empty a tank instead of filling it?', a: 'Swap the thresholds: on threshold 80 and off threshold 20 make a "high trigger" that starts the pump when the level rises to 80 % and stops it at 20 %.' },
      { q: 'How wide should the band be?', a: 'Wide enough that the pump runs for minutes, not seconds. Check how many starts per hour the motor allows and size the band from the tank volume and the flow.' },
    ],
    blocks: ['ANALOG_DIFFERENTIAL', 'ANALOG_COMPARATOR', 'ANALOG_THRESHOLD', 'ANALOG_AMPLIFIER'],
    challenges: ['tank-level', 'sensor-scaling'],
    scenarios: [
      {
        name: 'Fill cycle',
        steps: [
          { action: 'Level 50 %', set: { level: 50 }, waitMs: 200, expect: { pump: false } },
          { action: 'Level falls to 20 %', set: { level: 20 }, waitMs: 200, expect: { pump: true } },
          { action: 'Level rises to 60 %', set: { level: 60 }, waitMs: 200, expect: { pump: true } },
          { action: 'Level reaches 80 %', set: { level: 80 }, waitMs: 200, expect: { pump: false } },
          { action: 'Level falls to 40 %', set: { level: 40 }, waitMs: 200, expect: { pump: false } },
        ],
      },
      {
        name: 'Alarms',
        steps: [
          { action: 'Level 3 %', set: { level: 3 }, waitMs: 200, expect: { llAlarm: true, pump: true, hhAlarm: false } },
          { action: 'Level 50 %', set: { level: 50 }, waitMs: 200, expect: { llAlarm: false, pump: true } },
          { action: 'Level 97 %', set: { level: 97 }, waitMs: 200, expect: { hhAlarm: true, pump: false } },
        ],
      },
    ],
  },
  {
    slug: 'duty-standby-pump-alternation',
    title: 'How to alternate two pumps (duty/standby lead-lag) in PLC logic',
    description: 'Alternate duty and standby pumps on every start so they wear evenly, and switch to the standby pump on a fault. PLC logic with a live simulator.',
    answer:
      'Toggle a pulse relay each time the demand stops, and use its state to pick which pump runs on the next demand. If the selected pump has a fault, the other pump runs instead.',
    level: 'intermediate',
    explanation: `- A **falling-edge trigger** gives one pulse each time the demand ends.
- That pulse toggles a **pulse relay** (flip-flop). Its output says which pump is "lead" for the next run: OFF = pump A, ON = pump B.
- Toggling on the falling edge means the lead pump never changes while a pump is running.
- **Pump A** = demand AND (A is lead AND A is healthy, OR B has a fault).
- **Pump B** = demand AND (B is lead AND B is healthy, OR A has a fault).

When both pumps have a fault, neither runs, and the fault lamps should be checked.`,
    circuit: `circuit "Duty/standby pumps" version 1 {
  demand: INPUT(label="Pump demand")
  faultA: INPUT(label="Pump A fault")
  faultB: INPUT(label="Pump B fault")
  demandEnded: F_TRIG(label="Demand ended")
  leadB: PULSE_RELAY(label="Pump B is lead")
  leadA: NOT(label="Pump A is lead")
  okA: NOT(label="Pump A healthy")
  okB: NOT(label="Pump B healthy")
  aSelected: AND(label="A lead and healthy")
  bSelected: AND(label="B lead and healthy")
  aWanted: OR(label="A selected or B faulted")
  bWanted: OR(label="B selected or A faulted")
  aRun: AND(label="Run A")
  bRun: AND(label="Run B")
  aSafe: AND(label="Run A if healthy")
  bSafe: AND(label="Run B if healthy")
  pumpA: OUTPUT(label="Pump A")
  pumpB: OUTPUT(label="Pump B")
  demand.Q -> demandEnded.A
  demandEnded.Q -> leadB.A
  leadB.Q -> leadA.A
  faultA.Q -> okA.A
  faultB.Q -> okB.A
  leadA.Q -> aSelected.A
  okA.Q -> aSelected.B
  leadB.Q -> bSelected.A
  okB.Q -> bSelected.B
  aSelected.Q -> aWanted.A
  faultB.Q -> aWanted.B
  bSelected.Q -> bWanted.A
  faultA.Q -> bWanted.B
  demand.Q -> aRun.A
  aWanted.Q -> aRun.B
  demand.Q -> bRun.A
  bWanted.Q -> bRun.B
  aRun.Q -> aSafe.A
  okA.Q -> aSafe.B
  bRun.Q -> bSafe.A
  okB.Q -> bSafe.B
  aSafe.Q -> pumpA.A
  bSafe.Q -> pumpB.A
}`,
    inputs: [
      { id: 'demand', type: 'INPUT', label: 'Pump demand', device: 'Level switch, pressure switch or control output' },
      { id: 'faultA', type: 'INPUT', label: 'Pump A fault', device: 'Overload or VFD fault contact; ON means faulted' },
      { id: 'faultB', type: 'INPUT', label: 'Pump B fault', device: 'Overload or VFD fault contact; ON means faulted' },
    ],
    outputs: [
      { id: 'pumpA', type: 'OUTPUT', label: 'Pump A', device: 'Pump A contactor' },
      { id: 'pumpB', type: 'OUTPUT', label: 'Pump B', device: 'Pump B contactor' },
    ],
    tryIt: ['Switch Pump demand ON: pump A runs.', 'Switch demand OFF and ON again: now pump B runs.', 'Turn Pump B fault ON while B is lead: pump A takes over.'],
    steps: [
      { title: 'Detect the end of each run', text: 'A falling-edge trigger on the demand gives a one-scan pulse when the demand drops.' },
      { title: 'Toggle the lead pump', text: 'The pulse relay flips on each pulse. Its output is "B is lead"; NOT of it is "A is lead".' },
      { title: 'Select the pump', text: 'Each pump runs when it is lead and healthy, or when the other pump has a fault.' },
      { title: 'Never run a faulted pump', text: 'AND each output with its own "healthy" signal, so a double fault stops both.' },
    ],
    mistakes: [
      'Alternating on the rising edge: the lead changes at the moment the pump should start, which is harder to follow and test.',
      'Alternating on a timer while running, which stops one pump and starts the other mid-duty.',
      'Not latching faults: a pump whose overload resets itself can run, trip and run again. Latch faults until someone acknowledges them.',
    ],
    faq: [
      { q: 'How do I run both pumps at high demand?', a: 'Add a second demand signal (for example a higher level switch) that starts the lag pump as well: lag = high demand AND the pump that is not lead.' },
      { q: 'Should I alternate by run hours instead?', a: 'Alternating on every start is simple and evens out wear well when runs are similar. For long, irregular runs, compare run-hour counters and make the pump with fewer hours the lead.' },
    ],
    blocks: ['PULSE_RELAY', 'F_TRIG', 'AND', 'OR', 'NOT'],
    challenges: ['batch-counter'],
    never: [{ when: { pumpA: true, pumpB: true }, message: 'Both pumps ran at the same time' }],
    scenarios: [
      {
        name: 'Alternate on every demand',
        steps: [
          { action: 'Demand 1', set: { demand: true }, waitMs: 500, expect: { pumpA: true, pumpB: false } },
          { action: 'Demand ends', set: { demand: false }, waitMs: 500, expect: { pumpA: false, pumpB: false } },
          { action: 'Demand 2', set: { demand: true }, waitMs: 500, expect: { pumpA: false, pumpB: true } },
          { action: 'Demand ends', set: { demand: false }, waitMs: 500 },
          { action: 'Demand 3', set: { demand: true }, waitMs: 500, expect: { pumpA: true, pumpB: false } },
        ],
      },
      {
        name: 'Standby takes over on a fault',
        steps: [
          { action: 'Pump A faulted, demand', set: { faultA: true, demand: true }, waitMs: 500, expect: { pumpA: false, pumpB: true } },
          { action: 'Demand ends; lead becomes B', set: { demand: false }, waitMs: 300 },
          { action: 'Pump A repaired, B faulted, demand', set: { faultA: false, faultB: true, demand: true }, waitMs: 500, expect: { pumpA: true, pumpB: false } },
          { action: 'Both faulted', set: { faultA: true }, waitMs: 300, expect: { pumpA: false, pumpB: false } },
        ],
      },
    ],
  },
  {
    slug: 'parking-lot-counter-plc',
    title: 'PLC program for a car park counter with a "full" sign',
    description: 'Count cars in and out of a car park with an up/down counter, show a FULL sign at capacity and keep the barrier closed. Try the PLC logic live.',
    answer:
      'An up/down counter adds one for every car through the entry sensor and subtracts one at the exit. When the count reaches the capacity, its output lights the FULL sign and blocks the entry barrier.',
    level: 'beginner',
    explanation: `The **up/down counter** counts rising edges: entry sensor on **CU**, exit sensor on **CD**. Its *limit* parameter is the capacity (5 here, to keep the demo short).

- **FULL sign** = counter Q (count at or above the limit).
- **Entry barrier** opens for 4 s with a pulse timer when a driver presses the ticket button, but only while the car park is not full.
- **Reset** sets the count to zero, for example at night when the car park is known to be empty.

Because the counter reacts to edges, a car standing on the sensor counts once.`,
    circuit: `circuit "Car park counter" version 1 {
  ticket: INPUT(label="Ticket button")
  entry: INPUT(label="Entry sensor")
  exit: INPUT(label="Exit sensor")
  reset: INPUT(label="Reset count")
  cars: COUNTER(label="Cars inside", limit=5)
  space: NOT(label="Spaces free")
  allowed: AND(label="Entry allowed")
  barrierTime: PULSE_TIMER(label="Barrier open time", duration=4000)
  barrier: OUTPUT(label="Entry barrier")
  full: OUTPUT(label="FULL sign")
  entry.Q -> cars.CU
  exit.Q -> cars.CD
  reset.Q -> cars.R
  cars.Q -> space.A
  ticket.Q -> allowed.A
  space.Q -> allowed.B
  allowed.Q -> barrierTime.A
  barrierTime.Q -> barrier.A
  cars.Q -> full.A
}`,
    inputs: [
      { id: 'ticket', type: 'INPUT', label: 'Ticket button', device: 'Push button on the ticket machine' },
      { id: 'entry', type: 'INPUT', label: 'Entry sensor', device: 'Induction loop or photo-eye after the entry barrier' },
      { id: 'exit', type: 'INPUT', label: 'Exit sensor', device: 'Induction loop or photo-eye at the exit' },
      { id: 'reset', type: 'INPUT', label: 'Reset count', device: 'Key switch for the attendant' },
    ],
    outputs: [
      { id: 'barrier', type: 'OUTPUT', label: 'Entry barrier', device: 'Barrier motor open command' },
      { id: 'full', type: 'OUTPUT', label: 'FULL sign', device: 'Illuminated sign' },
    ],
    tryIt: ['Switch Entry sensor on and off five times: the FULL sign lights.', 'Press Ticket button: the barrier stays closed.', 'Pulse Exit sensor once: FULL turns off and the ticket button works again.'],
    steps: [
      { title: 'Count up at the entry', text: 'Wire the entry sensor to CU. Each car makes one rising edge.' },
      { title: 'Count down at the exit', text: 'Wire the exit sensor to CD.' },
      { title: 'Set the capacity', text: 'The counter limit is the number of spaces. Q turns on at or above it.' },
      { title: 'Block entry when full', text: 'Barrier pulse = ticket AND NOT full.' },
    ],
    mistakes: [
      'Counting on the ticket button instead of the sensor: a driver who presses twice counts twice, one who turns back is still counted.',
      'No way to correct the count. Sensors miss cars sometimes; provide a reset or manual +1/−1 for the attendant.',
      'Letting the count go below zero at the exit. Check the counter\'s behaviour, or only count down while the count is above zero.',
    ],
    faq: [
      { q: 'How do I show the number of free spaces?', a: 'Subtract the count (CV output) from the capacity with a math block and send it to a display.' },
      { q: 'How do I handle several levels?', a: 'Use one counter per level with its own entry and exit sensors, and a total counter at the main entrance and exit.' },
    ],
    blocks: ['COUNTER', 'PULSE_TIMER', 'AND', 'NOT'],
    challenges: ['batch-counter', 'one-shot-valve'],
    scenarios: [
      {
        name: 'Fill up and free a space',
        steps: [
          { action: 'Ticket button', set: { ticket: true }, waitMs: 200, expect: { barrier: true } },
          { action: 'Car 1 enters', set: { ticket: false, entry: true }, waitMs: 200 },
          { action: 'Gap', set: { entry: false }, waitMs: 200 },
          { action: 'Car 2 enters', set: { entry: true }, waitMs: 200 },
          { action: 'Gap', set: { entry: false }, waitMs: 200 },
          { action: 'Car 3 enters', set: { entry: true }, waitMs: 200 },
          { action: 'Gap', set: { entry: false }, waitMs: 200 },
          { action: 'Car 4 enters', set: { entry: true }, waitMs: 200 },
          { action: 'Gap', set: { entry: false }, waitMs: 200, expect: { full: false } },
          { action: 'Car 5 enters', set: { entry: true }, waitMs: 200, expect: { full: true } },
          { action: 'Wait for the barrier to close', set: { entry: false }, waitMs: 4000, expect: { barrier: false } },
          { action: 'Ticket button while full', set: { ticket: true }, waitMs: 300, expect: { barrier: false } },
          { action: 'A car leaves', set: { ticket: false, exit: true }, waitMs: 200, expect: { full: false } },
          { action: 'Ticket button again', set: { exit: false, ticket: true }, waitMs: 200, expect: { barrier: true } },
        ],
      },
      {
        name: 'Reset',
        steps: [
          { action: 'Car enters five times', set: { entry: true }, waitMs: 100 },
          { action: 'Gap', set: { entry: false }, waitMs: 100 },
          { action: 'Car', set: { entry: true }, waitMs: 100 },
          { action: 'Gap', set: { entry: false }, waitMs: 100 },
          { action: 'Car', set: { entry: true }, waitMs: 100 },
          { action: 'Gap', set: { entry: false }, waitMs: 100 },
          { action: 'Car', set: { entry: true }, waitMs: 100 },
          { action: 'Gap', set: { entry: false }, waitMs: 100 },
          { action: 'Car', set: { entry: true }, waitMs: 100, expect: { full: true } },
          { action: 'Attendant resets', set: { entry: false, reset: true }, waitMs: 200, expect: { full: false } },
        ],
      },
    ],
  },
  {
    slug: 'alarm-horn-acknowledge-flashing-light',
    title: 'How to program an alarm with horn silence and a flashing light (acknowledge)',
    description: 'Classic alarm sequence in PLC logic: new alarm flashes and sounds the horn, acknowledge silences it and makes the light steady. Live simulator and ladder.',
    answer:
      'Latch an "unacknowledged" bit on the rising edge of the alarm and clear it with the Acknowledge button. The horn sounds and the light flashes while the alarm is unacknowledged; after acknowledgement the light stays steady until the condition clears.',
    level: 'intermediate',
    explanation: `This is the basic alarm sequence used on control panels (similar to ISA-18.1 sequence A):

| State | Horn | Light |
|---|---|---|
| Normal | off | off |
| New alarm, not acknowledged | on | flashing |
| Acknowledged, still active | off | steady |
| Condition cleared | off | off |

- A **rising-edge trigger** on the alarm condition sets an **RS latch** "unacknowledged". The **Acknowledge** button resets it.
- **Horn** = condition AND unacknowledged.
- **Light** = condition AND (flash clock OR acknowledged). The clock is a 0.5 s on / 0.5 s off pulse generator.

Because the latch is set by an edge, a condition that comes back after it cleared starts a new alarm, but holding Acknowledge cannot hide an alarm that is still active: the light stays on.`,
    circuit: `circuit "Alarm with acknowledge" version 1 {
  condition: INPUT(label="Alarm condition")
  ack: INPUT(label="Acknowledge")
  newAlarm: R_TRIG(label="New alarm")
  unacked: RS_LATCH(label="Unacknowledged")
  acked: NOT(label="Acknowledged")
  flash: CLOCK(label="Flash 1 Hz", onTime=500, offTime=500)
  hornLogic: AND(label="Sound horn")
  pattern: OR(label="Flash or steady")
  lightLogic: AND(label="Light on")
  horn: OUTPUT(label="Horn")
  light: OUTPUT(label="Alarm light")
  condition.Q -> newAlarm.A
  newAlarm.Q -> unacked.S
  ack.Q -> unacked.R
  unacked.Q -> acked.A
  condition.Q -> hornLogic.A
  unacked.Q -> hornLogic.B
  flash.Q -> pattern.A
  acked.Q -> pattern.B
  condition.Q -> lightLogic.A
  pattern.Q -> lightLogic.B
  hornLogic.Q -> horn.A
  lightLogic.Q -> light.A
}`,
    inputs: [
      { id: 'condition', type: 'INPUT', label: 'Alarm condition', device: 'Any alarm signal: high temperature switch, fault contact, comparator output' },
      { id: 'ack', type: 'INPUT', label: 'Acknowledge', device: 'Push button on the panel or HMI' },
    ],
    outputs: [
      { id: 'horn', type: 'OUTPUT', label: 'Horn', device: 'Panel horn or buzzer' },
      { id: 'light', type: 'OUTPUT', label: 'Alarm light', device: 'Indicator lamp or beacon' },
    ],
    tryIt: ['Turn Alarm condition ON: the horn sounds and the light flashes.', 'Switch Acknowledge on and off: the horn stops and the light turns steady.', 'Turn the condition OFF: the light goes out.'],
    steps: [
      { title: 'Detect a new alarm', text: 'A rising-edge trigger on the condition gives one pulse when the alarm appears.' },
      { title: 'Remember it is unacknowledged', text: 'The pulse sets an RS latch; the Acknowledge button resets it.' },
      { title: 'Drive the horn', text: 'Horn = condition AND unacknowledged.' },
      { title: 'Flash, then steady', text: 'Light = condition AND (clock OR acknowledged). The clock makes it flash until acknowledged.' },
    ],
    mistakes: [
      'Setting the latch with the condition level instead of its edge: then Acknowledge cannot silence a standing alarm.',
      'One acknowledge for all alarms with one shared latch. Each alarm needs its own unacknowledged bit; the horn is the OR of all of them.',
      'Flashing with a clock that is not gated by the condition, so the light keeps blinking after the alarm cleared.',
    ],
    faq: [
      { q: 'How do I make the light keep flashing slowly after the condition clears until reset (ring-back)?', a: 'Add a second latch set by the condition clearing (falling edge) and reset by a Reset button, and drive the light with a slower clock while it is set.' },
      { q: 'How do I handle many alarms with one horn?', a: 'Give each alarm its own edge, latch and light logic, OR all the "horn" signals into one horn output, and wire one Acknowledge button to every latch\'s reset.' },
    ],
    blocks: ['R_TRIG', 'RS_LATCH', 'CLOCK', 'AND', 'OR', 'NOT'],
    challenges: ['flashing-beacon'],
    scenarios: [
      {
        name: 'Alarm, acknowledge, clear',
        steps: [
          { action: 'Normal', waitMs: 500, expect: { horn: false, light: false } },
          { action: 'Alarm appears', set: { condition: true }, waitMs: 200, expect: { horn: true } },
          { action: 'Light flashes for 3 s', waitMs: 3000, expect: { horn: true }, during: [{ id: 'light', onShare: [0.3, 0.7], minChanges: 4 }] },
          { action: 'Acknowledge', set: { ack: true }, waitMs: 200, expect: { horn: false, light: true } },
          { action: 'Light steady for 2 s', set: { ack: false }, waitMs: 2000, expect: { horn: false, light: true }, during: [{ id: 'light', onShare: [1, 1] }] },
          { action: 'Condition clears', set: { condition: false }, waitMs: 200, expect: { horn: false, light: false } },
          { action: 'Alarm comes back', set: { condition: true }, waitMs: 200, expect: { horn: true } },
        ],
      },
    ],
  },
];

export const HOW_TOS: HowTo[] = [...BATCH_1, ...HOW_TOS_BATCH_2];

export const getHowTo = (slug: string) => HOW_TOS.find((guide) => guide.slug === slug);
