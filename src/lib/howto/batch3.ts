import type { HowTo } from './types.ts';

/** Third batch of how-to guides. Verified by tests/howto.test.ts. */
export const HOW_TOS_BATCH_3: HowTo[] = [
  {
    slug: 'plc-program-pedestrian-crossing',
    title: 'PLC program for a pedestrian crossing (push-button traffic light)',
    description: 'Pelican-style crossing in PLC logic: a request button turns the car light yellow then red, shows WALK, then a clearance time before cars go again.',
    answer:
      'Latch the crossing request, then run three timers in a chain: car yellow, pedestrian walk, and an all-red clearance. Cars are green whenever there is no request, and walk is only ever shown while cars are red.',
    level: 'intermediate',
    explanation: `A **request latch** is set by the pedestrian button and reset at the end of the crossing cycle (through a one-scan delay).

While the request is latched, three on-delay timers run in a chain:

| Timer | Time | Phase |
|---|---|---|
| T1 | 2 s | cars yellow |
| T2 | 5 s | cars red, WALK |
| T3 | 2 s | cars red, DON'T WALK (clearance) |

- **Car green** = NOT request
- **Car yellow** = request AND NOT T1
- **Car red** = T1 done
- **Walk** = T1 AND NOT T2; **Don't walk** = NOT walk

Pressing the button again during the cycle does nothing: the request is already latched. The clearance phase gives slow walkers time to finish crossing before cars get green.`,
    circuit: `circuit "Pedestrian crossing" version 1 {
  button: INPUT(label="Pedestrian button")
  cycleEnd: SCAN_DELAY(label="Crossing finished")
  request: RS_LATCH(label="Crossing requested")
  t1: TON(label="Yellow time", duration=2000)
  t2: TON(label="Walk time", duration=5000)
  t3: TON(label="Clearance time", duration=2000)
  noRequest: NOT(label="No request")
  notT1: NOT(label="Yellow not done")
  notT2: NOT(label="Walk not done")
  yellowLogic: AND(label="Yellow")
  walkLogic: AND(label="Walk")
  noWalk: NOT(label="Don't walk")
  carGreen: OUTPUT(label="Car green")
  carYellow: OUTPUT(label="Car yellow")
  carRed: OUTPUT(label="Car red")
  walk: OUTPUT(label="WALK")
  dontWalk: OUTPUT(label="DON'T WALK")
  t3.Q -> cycleEnd.A
  button.Q -> request.S
  cycleEnd.Q -> request.R
  request.Q -> t1.A
  t1.Q -> t2.A
  t2.Q -> t3.A
  request.Q -> noRequest.A
  t1.Q -> notT1.A
  t2.Q -> notT2.A
  request.Q -> yellowLogic.A
  notT1.Q -> yellowLogic.B
  t1.Q -> walkLogic.A
  notT2.Q -> walkLogic.B
  walkLogic.Q -> noWalk.A
  noRequest.Q -> carGreen.A
  yellowLogic.Q -> carYellow.A
  t1.Q -> carRed.A
  walkLogic.Q -> walk.A
  noWalk.Q -> dontWalk.A
}`,
    inputs: [{ id: 'button', type: 'INPUT', label: 'Pedestrian button', device: 'Push button on the crossing pole' }],
    outputs: [
      { id: 'carGreen', type: 'OUTPUT', label: 'Car green', device: 'Traffic signal head' },
      { id: 'carYellow', type: 'OUTPUT', label: 'Car yellow', device: 'Traffic signal head' },
      { id: 'carRed', type: 'OUTPUT', label: 'Car red', device: 'Traffic signal head' },
      { id: 'walk', type: 'OUTPUT', label: 'WALK', device: 'Green pedestrian figure' },
      { id: 'dontWalk', type: 'OUTPUT', label: "DON'T WALK", device: 'Red pedestrian figure' },
    ],
    tryIt: ['Switch the Pedestrian button on and off.', 'Cars go yellow for 2 s, then red with WALK for 5 s, then a 2 s clearance.', 'Cars return to green at the end.'],
    steps: [
      { title: 'Latch the request', text: 'The button sets a latch, so a short press is enough.' },
      { title: 'Chain the phase timers', text: 'Yellow, walk and clearance timers, each started by the previous one.' },
      { title: 'Decode the lamps', text: 'Green when no request, yellow until T1, red after T1, walk between T1 and T2.' },
      { title: 'End the cycle', text: 'T3 done resets the request through a one-scan delay, which resets all timers.' },
    ],
    mistakes: [
      'Showing WALK before the cars are red, or keeping it on into the clearance time.',
      'No minimum green time for cars: a pedestrian pressing repeatedly can hold traffic almost permanently. Add a timer that must finish before a new request is served.',
      'Real crossings must follow the local traffic regulations for timings and flashing phases; this page shows the control logic only.',
    ],
    faq: [
      { q: 'How do I add a minimum green time for cars?', a: 'Start an on-delay (for example 20 s) when the cycle ends, and only allow the request latch to be served when it is done. The button can still be latched in the meantime.' },
      { q: 'How do I add a "wait" lamp?', a: 'Light it while the request is latched but WALK is not yet on: request AND NOT T1.' },
    ],
    blocks: ['RS_LATCH', 'TON', 'SCAN_DELAY', 'AND', 'NOT'],
    challenges: ['delayed-fan', 'start-stop'],
    never: [
      { when: { walk: true, carRed: false }, message: 'WALK was shown while cars were not red' },
      { when: { carGreen: true, walk: true }, message: 'Car green and WALK were on together' },
      { when: { walk: true, dontWalk: true }, message: "WALK and DON'T WALK were on together" },
    ],
    scenarios: [
      {
        name: 'One crossing',
        steps: [
          { action: 'Idle', waitMs: 500, expect: { carGreen: true, dontWalk: true, walk: false } },
          { action: 'Press the button', set: { button: true }, waitMs: 200, expect: { carGreen: false, carYellow: true } },
          { action: 'Release, wait to 1.5 s', set: { button: false }, waitMs: 1300, expect: { carYellow: true, walk: false } },
          { action: 'Wait to 3 s', waitMs: 1500, expect: { carRed: true, carYellow: false, walk: true } },
          { action: 'Press again during WALK', set: { button: true }, waitMs: 200, expect: { walk: true } },
          { action: 'Wait to 7.5 s (clearance)', set: { button: false }, waitMs: 4300, expect: { carRed: true, walk: false, dontWalk: true } },
          { action: 'Wait to 10 s', waitMs: 2500, expect: { carGreen: true, carRed: false } },
          { action: 'Stays green', waitMs: 3000, expect: { carGreen: true } },
        ],
      },
    ],
  },
  {
    slug: 'plc-program-washing-machine',
    title: 'PLC program for a washing machine (fill, wash, drain, spin)',
    description: 'Washing machine sequence in PLC logic: fill to level, wash with the drum reversing every 2 s, drain until empty, spin, and stop if the door opens.',
    answer:
      'Latch a wash cycle, then step through fill, wash, drain and spin with latches for "filled" and "emptied" and timers for the wash and spin times. During the wash, a pulse generator alternates the drum between forward and reverse.',
    level: 'advanced',
    explanation: `- **Cycle** latch: Start (door closed) sets it; Stop, door open or the end of the spin resets it.
- **Filled** latch: set when the water level switch makes during the cycle. **Fill valve** = cycle AND NOT filled.
- **Wash**: a 10 s on-delay runs while filled. During it, a 2 s on / 2 s off pulse generator drives **drum forward** when ON and **drum reverse** when OFF, which tumbles the laundry both ways.
- **Drain** opens when the wash time is done and stays open through the spin.
- **Emptied** latch: set when the level switch drops out while draining. It starts the **spin** (4 s).
- Spin done ends the cycle through a one-scan delay. All latches and timers reset.

Real machines put a short pause between forward and reverse; here the drum outputs are interlocked so they are never on together.`,
    circuit: `circuit "Washing machine" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  door: INPUT(label="Door closed", value=true)
  level: INPUT(label="Water level reached")
  doorOpen: NOT(label="Door open")
  canStart: AND(label="Start with door closed")
  finished: SCAN_DELAY(label="Cycle finished")
  stopOrOpen: OR(label="Stop or door open")
  endCycle: OR(label="End cycle")
  cycle: RS_LATCH(label="Cycle running")
  noCycle: NOT(label="No cycle")
  reachedLevel: AND(label="Level during cycle")
  filled: RS_LATCH(label="Filled")
  notFilled: NOT(label="Not filled")
  fillLogic: AND(label="Fill")
  washEnable: AND(label="Filled and running")
  washTime: TON(label="Wash time", duration=10000)
  notWashed: NOT(label="Still washing")
  washing: AND(label="Washing")
  reverse: CLOCK(label="Reverse every 2 s", onTime=2000, offTime=2000)
  notReverse: NOT(label="Other direction")
  fwdLogic: AND(label="Drum forward")
  revLogic: AND(label="Drum reverse")
  drainLogic: AND(label="Drain")
  noWater: NOT(label="No water")
  drained: AND(label="Empty while draining")
  emptied: RS_LATCH(label="Emptied")
  spinEnable: AND(label="Emptied and running")
  spinTime: TON(label="Spin time", duration=4000)
  notSpun: NOT(label="Still spinning")
  spinLogic: AND(label="Spin")
  fill: OUTPUT(label="Fill valve")
  drumFwd: OUTPUT(label="Drum forward")
  drumRev: OUTPUT(label="Drum reverse")
  drain: OUTPUT(label="Drain pump")
  spin: OUTPUT(label="Spin")
  door.Q -> doorOpen.A
  start.Q -> canStart.A
  door.Q -> canStart.B
  spinTime.Q -> finished.A
  stop.Q -> stopOrOpen.A
  doorOpen.Q -> stopOrOpen.B
  stopOrOpen.Q -> endCycle.A
  finished.Q -> endCycle.B
  canStart.Q -> cycle.S
  endCycle.Q -> cycle.R
  cycle.Q -> noCycle.A
  cycle.Q -> reachedLevel.A
  level.Q -> reachedLevel.B
  reachedLevel.Q -> filled.S
  noCycle.Q -> filled.R
  filled.Q -> notFilled.A
  cycle.Q -> fillLogic.A
  notFilled.Q -> fillLogic.B
  cycle.Q -> washEnable.A
  filled.Q -> washEnable.B
  washEnable.Q -> washTime.A
  washTime.Q -> notWashed.A
  washEnable.Q -> washing.A
  notWashed.Q -> washing.B
  reverse.Q -> notReverse.A
  washing.Q -> fwdLogic.A
  notReverse.Q -> fwdLogic.B
  washing.Q -> revLogic.A
  reverse.Q -> revLogic.B
  cycle.Q -> drainLogic.A
  washTime.Q -> drainLogic.B
  level.Q -> noWater.A
  drainLogic.Q -> drained.A
  noWater.Q -> drained.B
  drained.Q -> emptied.S
  noCycle.Q -> emptied.R
  cycle.Q -> spinEnable.A
  emptied.Q -> spinEnable.B
  spinEnable.Q -> spinTime.A
  spinTime.Q -> notSpun.A
  spinEnable.Q -> spinLogic.A
  notSpun.Q -> spinLogic.B
  fillLogic.Q -> fill.A
  fwdLogic.Q -> drumFwd.A
  revLogic.Q -> drumRev.A
  drainLogic.Q -> drain.A
  spinLogic.Q -> spin.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'door', type: 'INPUT', label: 'Door closed', device: 'Door lock switch' },
      { id: 'level', type: 'INPUT', label: 'Water level reached', device: 'Pressure (level) switch on the drum' },
    ],
    outputs: [
      { id: 'fill', type: 'OUTPUT', label: 'Fill valve', device: 'Water inlet solenoid valve' },
      { id: 'drumFwd', type: 'OUTPUT', label: 'Drum forward', device: 'Motor forward' },
      { id: 'drumRev', type: 'OUTPUT', label: 'Drum reverse', device: 'Motor reverse' },
      { id: 'drain', type: 'OUTPUT', label: 'Drain pump', device: 'Drain pump' },
      { id: 'spin', type: 'OUTPUT', label: 'Spin', device: 'Motor high speed' },
    ],
    tryIt: ['Switch Start on and off: the fill valve opens.', 'Switch Water level reached ON: the drum reverses every 2 s for 10 s.', 'When the drain starts, switch the level OFF: the machine spins for 4 s and stops.'],
    steps: [
      { title: 'Latch the cycle', text: 'Start with the door closed sets it; Stop, door open or the end of spin resets it.' },
      { title: 'Fill to level', text: 'A "filled" latch set by the level switch ends the fill step for good.' },
      { title: 'Wash with reversing', text: 'A wash timer runs while filled; a pulse generator alternates forward and reverse.' },
      { title: 'Drain, then spin', text: 'Drain opens after the wash; an "emptied" latch set when the level drops starts the spin timer.' },
      { title: 'Finish', text: 'Spin done resets the cycle, which resets every latch and timer.' },
    ],
    mistakes: [
      'Using the level switch directly as the "washing" condition: when the water is drained the sequence jumps back to filling.',
      'Switching the drum from forward to reverse instantly on a real motor: add a stop pause of about a second.',
      'Allowing the door to open while the drum turns. Real machines lock the door and unlock it only when the drum has stopped.',
    ],
    faq: [
      { q: 'How do I add a rinse?', a: 'Repeat fill, wash and drain with a second set of "filled" and "emptied" latches, or use a step counter that runs the fill-wash-drain pattern twice before the spin.' },
      { q: 'How do I heat the water?', a: 'Add a heating step after filling: heater on until a temperature switch (or an analog comparator) is reached, then start the wash timer.' },
    ],
    blocks: ['RS_LATCH', 'TON', 'CLOCK', 'SCAN_DELAY', 'AND', 'NOT', 'OR'],
    challenges: ['flashing-beacon', 'start-stop'],
    never: [
      { when: { drumFwd: true, drumRev: true }, message: 'The drum was driven both ways at once' },
      { when: { fill: true, drain: true }, message: 'Filling and draining at the same time' },
      { when: { spin: true, fill: true }, message: 'Spinning while filling' },
    ],
    scenarios: [
      {
        name: 'Full program',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 200, expect: { fill: true, drumFwd: false, drumRev: false } },
          { action: 'Release Start, filling', set: { start: false }, waitMs: 2000, expect: { fill: true } },
          { action: 'Water level reached', set: { level: true }, waitMs: 200, expect: { fill: false } },
          { action: 'Washing for 8 s', waitMs: 8000, during: [{ id: 'drumFwd', onShare: [0.3, 0.7], minChanges: 2 }, { id: 'drumRev', onShare: [0.3, 0.7], minChanges: 2 }] },
          { action: 'Wash over', waitMs: 2500, expect: { drumFwd: false, drumRev: false, drain: true, spin: false } },
          { action: 'Water drained', set: { level: false }, waitMs: 300, expect: { spin: true, drain: true, fill: false } },
          { action: 'Spinning', waitMs: 3000, expect: { spin: true } },
          { action: 'Spin over', waitMs: 1500, expect: { spin: false, drain: false, fill: false } },
          { action: 'Idle', waitMs: 2000, expect: { fill: false, spin: false } },
          { action: 'Next wash fills again', set: { start: true }, waitMs: 200, expect: { fill: true } },
        ],
      },
      {
        name: 'Door and Stop',
        steps: [
          { action: 'Door open, press Start', set: { door: false, start: true }, waitMs: 300, expect: { fill: false } },
          { action: 'Close door, press Start', set: { door: true }, waitMs: 200, expect: { fill: true } },
          { action: 'Door opened during the cycle', set: { start: false, door: false }, waitMs: 200, expect: { fill: false } },
          { action: 'Door closed again: stays stopped', set: { door: true }, waitMs: 500, expect: { fill: false } },
          { action: 'Start, fill, then Stop while washing', set: { start: true, level: true }, waitMs: 1000, expect: { fill: false } },
          { action: 'Press Stop', set: { start: false, stop: true }, waitMs: 200, expect: { drumFwd: false, drumRev: false, drain: false } },
        ],
      },
    ],
  },
  {
    slug: 'pneumatic-cylinder-extend-retract-plc',
    title: 'How to program a pneumatic cylinder to extend and retract (PLC)',
    description: 'Double-acting cylinder cycle in PLC logic: extend to the end switch, dwell, retract to home. With reed switch feedback, a start permissive and interlock.',
    answer:
      'On Start, energise the extend valve until the extended reed switch makes, wait a short dwell time, then energise the retract valve until the retracted switch makes. Remember "reached the end" in a latch so the cylinder does not extend again on the way back.',
    level: 'beginner',
    explanation: `A double-acting cylinder with a **5/3 or two-solenoid 5/2 valve** has an extend and a retract solenoid, and two **reed switches** that sense the piston magnet at each end.

- **Cycle** latch: Start sets it, only when the cylinder is home (retracted). Stop or the end of the cycle resets it.
- **Extended** latch: set when the extended switch makes during the cycle. Without it, the cylinder would extend again as soon as it leaves the end switch on the way back.
- **Extend valve** = cycle AND NOT extended latch.
- **Dwell** (1 s) runs at the end of the stroke, then **Retract valve** = cycle AND dwell done.
- **Done** = retracting AND home switch, which resets the cycle through a one-scan delay.`,
    circuit: `circuit "Cylinder cycle" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  home: INPUT(label="Retracted switch", value=true)
  out: INPUT(label="Extended switch")
  canStart: AND(label="Start when home")
  done: SCAN_DELAY(label="Cycle done")
  endCycle: OR(label="Stop or done")
  cycle: RS_LATCH(label="Cycle running")
  noCycle: NOT(label="No cycle")
  reachedEnd: AND(label="End reached in cycle")
  extended: RS_LATCH(label="Stroke complete")
  notExtended: NOT(label="Stroke not complete")
  extendLogic: AND(label="Extend")
  dwellEnable: AND(label="At end, running")
  dwell: TON(label="Dwell time", duration=1000)
  retractLogic: AND(label="Retract")
  backHome: AND(label="Back home")
  extend: OUTPUT(label="Extend solenoid")
  retract: OUTPUT(label="Retract solenoid")
  start.Q -> canStart.A
  home.Q -> canStart.B
  backHome.Q -> done.A
  stop.Q -> endCycle.A
  done.Q -> endCycle.B
  canStart.Q -> cycle.S
  endCycle.Q -> cycle.R
  cycle.Q -> noCycle.A
  cycle.Q -> reachedEnd.A
  out.Q -> reachedEnd.B
  reachedEnd.Q -> extended.S
  noCycle.Q -> extended.R
  extended.Q -> notExtended.A
  cycle.Q -> extendLogic.A
  notExtended.Q -> extendLogic.B
  cycle.Q -> dwellEnable.A
  extended.Q -> dwellEnable.B
  dwellEnable.Q -> dwell.A
  cycle.Q -> retractLogic.A
  dwell.Q -> retractLogic.B
  retractLogic.Q -> backHome.A
  home.Q -> backHome.B
  extendLogic.Q -> extend.A
  retractLogic.Q -> retract.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button or machine cycle start' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'home', type: 'INPUT', label: 'Retracted switch', device: 'Reed switch at the home (retracted) position' },
      { id: 'out', type: 'INPUT', label: 'Extended switch', device: 'Reed switch at full stroke' },
    ],
    outputs: [
      { id: 'extend', type: 'OUTPUT', label: 'Extend solenoid', device: 'Valve solenoid 14' },
      { id: 'retract', type: 'OUTPUT', label: 'Retract solenoid', device: 'Valve solenoid 12' },
    ],
    tryIt: ['Switch Start on and off: Extend turns on.', 'Switch Retracted OFF and Extended ON (the rod moves out): after 1 s Retract turns on.', 'Switch Extended OFF and Retracted ON: the cycle ends.'],
    steps: [
      { title: 'Start only from home', text: 'AND the Start button with the retracted switch.' },
      { title: 'Extend until the end switch', text: 'A latch remembers that full stroke was reached.' },
      { title: 'Dwell', text: 'An on-delay at the end of stroke, for pressing, clamping or marking.' },
      { title: 'Retract until home', text: 'Retracting AND home ends the cycle through a one-scan delay.' },
    ],
    mistakes: [
      'No "stroke complete" memory: the cylinder extends again as soon as the rod leaves the end switch.',
      'Energising both solenoids of a 5/2 double-solenoid valve at once: the valve stays where it was, and with a 5/3 valve the result depends on the valve type.',
      'No timeout: a stuck cylinder or a failed reed switch waits forever. Add an on-delay on each movement that raises a fault.',
    ],
    faq: [
      { q: 'What changes with a single-solenoid (spring return) valve?', a: 'There is only one output: energise it to extend and de-energise it to retract. Extend output = cycle AND NOT dwell done.' },
      { q: 'How do I run continuous cycles?', a: 'Replace the Start button with a "run" latch: when one cycle ends and the cylinder is home, the next one starts automatically until Stop is pressed.' },
    ],
    blocks: ['RS_LATCH', 'TON', 'SCAN_DELAY', 'AND', 'NOT', 'OR'],
    challenges: ['one-shot-valve', 'start-stop'],
    never: [{ when: { extend: true, retract: true }, message: 'Extend and retract were energised together' }],
    scenarios: [
      {
        name: 'One cycle',
        steps: [
          { action: 'Press Start at home', set: { home: true, start: true }, waitMs: 200, expect: { extend: true, retract: false } },
          { action: 'Rod leaves home', set: { start: false, home: false }, waitMs: 500, expect: { extend: true } },
          { action: 'Full stroke', set: { out: true }, waitMs: 200, expect: { extend: false, retract: false } },
          { action: 'Dwell', waitMs: 600, expect: { extend: false, retract: false } },
          { action: 'Dwell over', waitMs: 500, expect: { retract: true, extend: false } },
          { action: 'Rod leaves the end switch', set: { out: false }, waitMs: 500, expect: { retract: true, extend: false } },
          { action: 'Home', set: { home: true }, waitMs: 300, expect: { retract: false, extend: false } },
          { action: 'Next cycle', set: { start: true }, waitMs: 200, expect: { extend: true } },
        ],
      },
      {
        name: 'Not home, and Stop',
        steps: [
          { action: 'Start while not home', set: { home: false, start: true }, waitMs: 300, expect: { extend: false } },
          { action: 'Home, Start', set: { home: true }, waitMs: 200, expect: { extend: true } },
          { action: 'Stop during extend', set: { start: false, stop: true }, waitMs: 200, expect: { extend: false, retract: false } },
        ],
      },
    ],
  },
  {
    slug: 'plc-program-packaging-counter',
    title: 'PLC program to count items into a box (packaging counter)',
    description: 'Count products into a box with a sensor and counter, stop the conveyor when the box is full, and reset the count when a new box arrives.',
    answer:
      'Count the products passing a sensor with an up counter. When the count reaches the box quantity, stop the conveyor and signal "change box"; the rising edge of the box sensor (a new box arriving) resets the counter.',
    level: 'beginner',
    explanation: `- **Running** latch: Start and Stop.
- **Counter** (limit 6): the product sensor on **CU**. It counts rising edges, so each product counts once however long it blocks the beam.
- **Box full** = counter Q. The conveyor stops and the change-box lamp lights.
- **Conveyor** = running AND box present AND NOT box full.
- The counter is reset by the **rising edge of the box sensor**, so placing a new box starts a fresh count. Removing the full box alone does not reset it.`,
    circuit: `circuit "Packaging counter" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  product: INPUT(label="Product sensor")
  box: INPUT(label="Box in place")
  running: RS_LATCH(label="Running")
  newBox: R_TRIG(label="New box arrived")
  count: COUNTER(label="Products in box", limit=6)
  notFull: NOT(label="Box not full")
  runWithBox: AND(label="Running with box")
  conveyorLogic: AND(label="Convey")
  conveyor: OUTPUT(label="Conveyor")
  changeBox: OUTPUT(label="Change box lamp")
  start.Q -> running.S
  stop.Q -> running.R
  box.Q -> newBox.A
  product.Q -> count.CU
  newBox.Q -> count.R
  count.Q -> notFull.A
  running.Q -> runWithBox.A
  box.Q -> runWithBox.B
  runWithBox.Q -> conveyorLogic.A
  notFull.Q -> conveyorLogic.B
  conveyorLogic.Q -> conveyor.A
  count.Q -> changeBox.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'product', type: 'INPUT', label: 'Product sensor', device: 'Photoelectric sensor at the end of the conveyor' },
      { id: 'box', type: 'INPUT', label: 'Box in place', device: 'Sensor under the filling position' },
    ],
    outputs: [
      { id: 'conveyor', type: 'OUTPUT', label: 'Conveyor', device: 'Conveyor contactor' },
      { id: 'changeBox', type: 'OUTPUT', label: 'Change box lamp', device: 'Indicator lamp' },
    ],
    tryIt: ['Switch Box in place ON, then Start on and off.', 'Switch Product sensor on and off six times: the conveyor stops and the lamp lights.', 'Switch Box in place OFF and ON again (new box): the count restarts.'],
    steps: [
      { title: 'Count products', text: 'Product sensor to the counter\'s CU input; set the limit to the box quantity.' },
      { title: 'Stop when full', text: 'Conveyor = running AND box present AND NOT counter done.' },
      { title: 'Reset on a new box', text: 'A rising-edge trigger on the box sensor resets the counter.' },
    ],
    mistakes: [
      'Resetting the counter with the box sensor level: the count stays at zero while a box is present.',
      'Products touching each other: the sensor sees one long product. Space them out or use a different sensor position.',
      'The conveyor coasts after stopping, so one more product may fall in. Stop it a product early or use a brake motor.',
    ],
    faq: [
      { q: 'How do I let the operator change the quantity?', a: 'Make the counter limit an HMI setpoint, and do not apply a new value in the middle of a box.' },
      { q: 'How do I count total boxes too?', a: 'Add a second counter that counts the rising edges of "box full".' },
    ],
    blocks: ['COUNTER', 'R_TRIG', 'RS_LATCH', 'AND', 'NOT'],
    challenges: ['batch-counter'],
    scenarios: [
      {
        name: 'Fill a box and change it',
        steps: [
          { action: 'Box in place, press Start', set: { box: true, start: true }, waitMs: 200, expect: { conveyor: true, changeBox: false } },
          { action: 'Product 1', set: { start: false, product: true }, waitMs: 200 },
          { action: 'Gap', set: { product: false }, waitMs: 200 },
          { action: 'Product 2', set: { product: true }, waitMs: 200 },
          { action: 'Gap', set: { product: false }, waitMs: 200 },
          { action: 'Product 3', set: { product: true }, waitMs: 200 },
          { action: 'Gap', set: { product: false }, waitMs: 200 },
          { action: 'Product 4', set: { product: true }, waitMs: 200 },
          { action: 'Gap', set: { product: false }, waitMs: 200 },
          { action: 'Product 5', set: { product: true }, waitMs: 200 },
          { action: 'Gap', set: { product: false }, waitMs: 200, expect: { conveyor: true, changeBox: false } },
          { action: 'Product 6', set: { product: true }, waitMs: 200, expect: { conveyor: false, changeBox: true } },
          { action: 'Full box removed', set: { product: false, box: false }, waitMs: 500, expect: { conveyor: false, changeBox: true } },
          { action: 'New box placed', set: { box: true }, waitMs: 200, expect: { conveyor: true, changeBox: false } },
          { action: 'Press Stop', set: { stop: true }, waitMs: 200, expect: { conveyor: false } },
        ],
      },
    ],
  },
  {
    slug: 'motion-sensor-light-timer-plc',
    title: 'How to program a motion sensor light with an off-delay timer',
    description: 'Turn a light on when motion is detected in the dark and off a set time after the last motion, with a manual override. PLC/Arduino logic you can run.',
    answer:
      'Feed "motion AND dark" into an off-delay timer: the light turns on immediately and stays on until no motion has been seen for the set time. Every new movement restarts the delay.',
    level: 'beginner',
    explanation: `- **Trigger** = motion detected AND it is dark (from a light sensor or a time switch).
- An **off-delay timer (TOF, 5 s here)** turns its output on immediately with the trigger, and turns it off 5 s after the trigger goes away. While motion keeps being detected, the timer never starts counting.
- **Manual on** switch in parallel, for cleaning or maintenance.

Because darkness is only checked as part of the trigger, the light does not switch itself off when its own light makes the daylight sensor think it is day; it simply runs out its delay.`,
    circuit: `circuit "Motion sensor light" version 1 {
  motion: INPUT(label="Motion detected")
  dark: INPUT(label="It is dark")
  manual: INPUT(label="Manual on")
  trigger: AND(label="Motion in the dark")
  hold: TOF(label="Stay-on time", duration=5000)
  lightLogic: OR(label="Light on")
  light: OUTPUT(label="Light")
  motion.Q -> trigger.A
  dark.Q -> trigger.B
  trigger.Q -> hold.A
  hold.Q -> lightLogic.A
  manual.Q -> lightLogic.B
  lightLogic.Q -> light.A
}`,
    inputs: [
      { id: 'motion', type: 'INPUT', label: 'Motion detected', device: 'PIR motion sensor output' },
      { id: 'dark', type: 'INPUT', label: 'It is dark', device: 'Twilight switch or light sensor with threshold' },
      { id: 'manual', type: 'INPUT', label: 'Manual on', device: 'Key switch or selector' },
    ],
    outputs: [{ id: 'light', type: 'OUTPUT', label: 'Light', device: 'Lighting contactor or relay' }],
    tryIt: ['Switch It is dark ON, then Motion on and off: the light stays on for 5 s.', 'Switch Motion on again before the 5 s are over: the delay restarts.', 'Switch It is dark OFF: motion does nothing.'],
    steps: [
      { title: 'Combine motion and darkness', text: 'AND the two signals into a trigger.' },
      { title: 'Hold the light on', text: 'An off-delay timer keeps the output on for the set time after the last trigger.' },
      { title: 'Add the override', text: 'OR a manual switch with the timer output.' },
    ],
    mistakes: [
      'Using an on-delay instead of an off-delay: the light comes on late and goes off immediately.',
      'Using a non-retriggerable pulse timer: the light turns off in the middle of continuous movement.',
      'Mounting the light sensor where it sees the lamp it controls, which makes the light hunt on and off.',
    ],
    faq: [
      { q: 'How long should the delay be?', a: 'Long enough that people standing still are not left in the dark: 1–2 minutes in corridors, 5–15 minutes in offices and toilets.' },
      { q: 'Can I do this on an Arduino?', a: 'Yes. The generated sketch on this page uses millis() for the off-delay, so it does not block other code.' },
    ],
    blocks: ['TOF', 'AND', 'OR', 'EDGE_PULSE_TIMER'],
    challenges: ['stairwell-light'],
    scenarios: [
      {
        name: 'Motion at night',
        steps: [
          { action: 'Dark, no motion', set: { dark: true }, waitMs: 500, expect: { light: false } },
          { action: 'Motion', set: { motion: true }, waitMs: 200, expect: { light: true } },
          { action: 'Motion stops, 4 s later', set: { motion: false }, waitMs: 4000, expect: { light: true } },
          { action: 'Motion again', set: { motion: true }, waitMs: 200, expect: { light: true } },
          { action: 'Stops, 4 s later', set: { motion: false }, waitMs: 4000, expect: { light: true } },
          { action: '6 s after the last motion', waitMs: 2000, expect: { light: false } },
        ],
      },
      {
        name: 'Daytime and manual',
        steps: [
          { action: 'Day, motion', set: { dark: false, motion: true }, waitMs: 500, expect: { light: false } },
          { action: 'Manual on', set: { motion: false, manual: true }, waitMs: 200, expect: { light: true } },
          { action: 'Manual off', set: { manual: false }, waitMs: 200, expect: { light: false } },
        ],
      },
    ],
  },
  {
    slug: 'plc-run-hour-meter-maintenance',
    title: 'How to make a run-hour meter and maintenance alarm in a PLC',
    description: 'Accumulate motor running time with a retentive timer and count starts; raise a "service due" alarm at the limit and reset it after maintenance.',
    answer:
      'Use a retentive on-delay timer (TONR / RTO) that accumulates time while the motor runs and keeps it when the motor stops. When it reaches the service interval, light a "service due" lamp; the maintenance reset clears it. Count starts with a counter for equipment that wears per start.',
    level: 'beginner',
    explanation: `- A **retentive on-delay timer** runs while the motor's run feedback is ON and **keeps** its elapsed time when it goes OFF. A normal TON would reset at every stop. Its output turns on when the accumulated time reaches the interval.
- A **counter** counts starts (rising edges of the run feedback). Contactors, belts and soft starters often wear per start rather than per hour.
- **Service due** = run-time limit OR start-count limit.
- **Service reset** clears both after maintenance.

The demo uses 10 s and 5 starts so you can see it work. In a real program the interval is in hours (500 h = 1,800,000,000 ms, beyond what many timer instructions hold), so real hour meters count minutes or hours in an integer with a 1-minute pulse instead.`,
    circuit: `circuit "Run-hour meter" version 1 {
  running: INPUT(label="Motor running")
  serviceReset: INPUT(label="Service reset")
  runTime: RETENTIVE_TON(label="Run time since service", duration=10000)
  starts: COUNTER(label="Starts since service", limit=5)
  due: OR(label="Service due")
  serviceDue: OUTPUT(label="Service due lamp")
  running.Q -> runTime.A
  serviceReset.Q -> runTime.R
  running.Q -> starts.CU
  serviceReset.Q -> starts.R
  runTime.Q -> due.A
  starts.Q -> due.B
  due.Q -> serviceDue.A
}`,
    inputs: [
      { id: 'running', type: 'INPUT', label: 'Motor running', device: 'Contactor auxiliary or drive running signal' },
      { id: 'serviceReset', type: 'INPUT', label: 'Service reset', device: 'Key switch or password-protected HMI button' },
    ],
    outputs: [{ id: 'serviceDue', type: 'OUTPUT', label: 'Service due lamp', device: 'Indicator or HMI message' }],
    tryIt: ['Switch Motor running on for a few seconds and off, several times.', 'After 10 s of total running (or 5 starts) the lamp lights.', 'Pulse Service reset.'],
    steps: [
      { title: 'Accumulate run time', text: 'A retentive timer on the run feedback keeps its value across stops.' },
      { title: 'Count starts', text: 'A counter on the same signal counts rising edges.' },
      { title: 'Alarm at the limits', text: 'OR the two done bits into a service lamp.' },
      { title: 'Reset after service', text: 'One reset input clears both.' },
    ],
    mistakes: [
      'Using a normal on-delay timer, which resets every time the motor stops.',
      'Counting the run command instead of feedback: a motor that failed to start still collects hours.',
      'Losing the count at power loss. Store hour meters in retentive memory.',
    ],
    faq: [
      { q: 'How do I show hours on the HMI?', a: 'Divide the accumulated milliseconds by 3,600,000, or better, count a 1-minute pulse while running into an integer and divide by 60.' },
      { q: 'What is the retentive timer called on my PLC?', a: 'TONR in IEC 61131-3 and Siemens S7, RTO in Allen-Bradley, and "retentive on-delay" in many others.' },
    ],
    blocks: ['RETENTIVE_TON', 'COUNTER', 'OR'],
    challenges: ['batch-counter', 'delayed-fan'],
    scenarios: [
      {
        name: 'Run time accumulates across stops',
        steps: [
          { action: 'Run 4 s', set: { running: true }, waitMs: 4000, expect: { serviceDue: false } },
          { action: 'Stop 2 s', set: { running: false }, waitMs: 2000, expect: { serviceDue: false } },
          { action: 'Run 4 s', set: { running: true }, waitMs: 4000, expect: { serviceDue: false } },
          { action: 'Stop', set: { running: false }, waitMs: 1000, expect: { serviceDue: false } },
          { action: 'Run 3 s (11 s total)', set: { running: true }, waitMs: 3000, expect: { serviceDue: true } },
          { action: 'Stop', set: { running: false }, waitMs: 1000, expect: { serviceDue: true } },
          { action: 'Service reset', set: { serviceReset: true }, waitMs: 200, expect: { serviceDue: false } },
          { action: 'Run 4 s after service', set: { serviceReset: false, running: true }, waitMs: 4000, expect: { serviceDue: false } },
          { action: 'Stop', set: { running: false }, waitMs: 200 },
          { action: 'Short start (start 2 since service)', set: { running: true }, waitMs: 200 },
          { action: 'Stop', set: { running: false }, waitMs: 200, expect: { serviceDue: false } },
        ],
      },
      {
        name: 'Five short starts',
        steps: [
          { action: 'Start 1', set: { running: true }, waitMs: 200 },
          { action: 'Stop', set: { running: false }, waitMs: 200 },
          { action: 'Start 2', set: { running: true }, waitMs: 200 },
          { action: 'Stop', set: { running: false }, waitMs: 200 },
          { action: 'Start 3', set: { running: true }, waitMs: 200 },
          { action: 'Stop', set: { running: false }, waitMs: 200 },
          { action: 'Start 4', set: { running: true }, waitMs: 200 },
          { action: 'Stop', set: { running: false }, waitMs: 200, expect: { serviceDue: false } },
          { action: 'Start 5', set: { running: true }, waitMs: 200, expect: { serviceDue: true } },
        ],
      },
    ],
  },
  {
    slug: 'blinking-light-two-timers-plc',
    title: 'How to make a blinking light (flasher) with two timers in PLC ladder logic',
    description: 'Build an oscillator from two on-delay timers that reset each other: adjustable on and off times, enabled by a switch. Ladder logic you can run live.',
    answer:
      'Use two on-delay timers in a loop: timer 1 measures the OFF time and turns the lamp on when done, timer 2 measures the ON time and resets timer 1 when done. Each reset restarts the pair, so the lamp blinks for as long as it is enabled.',
    level: 'beginner',
    explanation: `This is the classic ladder-logic oscillator:

- **T1** (OFF time, 500 ms) runs while enabled AND NOT T2 done.
- **T2** (ON time, 500 ms) runs while T1 is done.
- **Lamp** = T1 done.

When T2 finishes, T1's input drops for one scan, T1 resets, which resets T2 too, and the cycle starts again. T2's done bit reaches T1 through a one-scan delay, which is exactly how the rung order makes it work in a PLC.

Many PLCs have a built-in clock bit or pulse generator that does the same; the two-timer version is portable to any PLC and gives independent on and off times.`,
    circuit: `circuit "Two-timer flasher" version 1 {
  enable: INPUT(label="Flash enable")
  t2Prev: SCAN_DELAY(label="On time done (last scan)")
  notT2: NOT(label="On time not done")
  run: AND(label="Time the off phase")
  t1: TON(label="Off time", duration=500)
  t2: TON(label="On time", duration=500)
  lamp: OUTPUT(label="Lamp")
  t2.Q -> t2Prev.A
  t2Prev.Q -> notT2.A
  enable.Q -> run.A
  notT2.Q -> run.B
  run.Q -> t1.A
  t1.Q -> t2.A
  t1.Q -> lamp.A
}`,
    inputs: [{ id: 'enable', type: 'INPUT', label: 'Flash enable', device: 'Any condition: an alarm, a selector switch' }],
    outputs: [{ id: 'lamp', type: 'OUTPUT', label: 'Lamp', device: 'Beacon or indicator lamp' }],
    tryIt: ['Switch Flash enable ON and press Run.', 'Watch the lamp coil blink.', 'Change the timer durations to make an asymmetric flash.'],
    steps: [
      { title: 'Time the OFF phase', text: 'T1 runs while enabled and T2 is not done.' },
      { title: 'Time the ON phase', text: 'T2 runs while T1 is done; the lamp follows T1.' },
      { title: 'Close the loop', text: 'T2 done stops T1 for one scan, which restarts both.' },
    ],
    mistakes: [
      'Times shorter than a few scan cycles give irregular flashing. Keep each phase well above the scan time.',
      'Driving the lamp from T2 instead of T1: the lamp only flashes for one scan.',
      'Several flashers built separately blink out of step. Use one flasher and AND it with each alarm.',
    ],
    faq: [
      { q: 'Why does the first flash start with OFF?', a: 'T1 times the OFF phase first. To start with the lamp ON, drive the lamp with NOT T1 instead and swap the meaning of the two times.' },
      { q: 'Is there an easier way?', a: 'Use the PLC\'s clock memory bits (for example Siemens clock memory) or a pulse generator block such as the one used in the flashing-beacon challenge.' },
    ],
    blocks: ['TON', 'SCAN_DELAY', 'AND', 'NOT', 'CLOCK'],
    challenges: ['flashing-beacon'],
    scenarios: [
      {
        name: 'Blinks while enabled',
        steps: [
          { action: 'Disabled', waitMs: 1000, expect: { lamp: false } },
          { action: 'Enabled for 6 s', set: { enable: true }, waitMs: 6000, during: [{ id: 'lamp', onShare: [0.35, 0.65], minChanges: 8 }] },
          { action: 'Disabled again', set: { enable: false }, waitMs: 1500, expect: { lamp: false }, during: [{ id: 'lamp', onShare: [0, 0.1] }] },
        ],
      },
    ],
  },
  {
    slug: 'debounce-noisy-input-plc',
    title: 'How to debounce or filter a noisy input in a PLC',
    description: 'Filter contact bounce and chattering sensors with an on/off-delay timer so counters and latches see one clean edge. Compare raw and filtered counts live.',
    answer:
      'Only accept a change of the input after it has been stable for a short time: an on-delay filters the switch-on and an off-delay filters the switch-off. Feed everything that counts or latches from the filtered signal.',
    level: 'beginner',
    explanation: `Mechanical contacts bounce for a few milliseconds, and sensors near their switching point (a float on a rippling surface, a photo-eye on a vibrating part) chatter for much longer.

An **on/off-delay** with 300 ms in both directions gives a clean signal:

- it turns ON only after the raw input has been ON for 300 ms;
- it turns OFF only after the raw input has been OFF for 300 ms.

The demo counts rising edges of both signals. The raw counter counts every chatter pulse; the filtered counter counts one.

Choose the filter time from the noise: 20–50 ms for push-button bounce, seconds for level switches. Many PLC input cards also have a configurable hardware input filter; use it for fast bounce and the timer for slow chatter.`,
    circuit: `circuit "Input debounce" version 1 {
  raw: INPUT(label="Raw sensor")
  clear: INPUT(label="Clear counts")
  filter: ON_OFF_DELAY(label="300 ms filter", onDelay=300, offDelay=300)
  rawCount: COUNTER(label="Raw edges", limit=100)
  cleanCount: COUNTER(label="Filtered edges", limit=100)
  clean: OUTPUT(label="Filtered signal")
  rawEdges: ANALOG_OUTPUT(label="Raw edge count")
  cleanEdges: ANALOG_OUTPUT(label="Filtered edge count")
  raw.Q -> filter.A
  raw.Q -> rawCount.CU
  filter.Q -> cleanCount.CU
  clear.Q -> rawCount.R
  clear.Q -> cleanCount.R
  filter.Q -> clean.A
  rawCount.CV -> rawEdges.A
  cleanCount.CV -> cleanEdges.A
}`,
    inputs: [
      { id: 'raw', type: 'INPUT', label: 'Raw sensor', device: 'Bouncing contact or chattering sensor' },
      { id: 'clear', type: 'INPUT', label: 'Clear counts', device: 'Push button' },
    ],
    outputs: [
      { id: 'clean', type: 'OUTPUT', label: 'Filtered signal', device: 'Use this signal in the rest of the program' },
      { id: 'rawEdges', type: 'ANALOG_OUTPUT', label: 'Raw edge count', device: 'Diagnostic value' },
      { id: 'cleanEdges', type: 'ANALOG_OUTPUT', label: 'Filtered edge count', device: 'Diagnostic value' },
    ],
    tryIt: ['Press Run and switch Raw sensor on and off quickly a few times, then leave it ON.', 'Compare the raw and filtered edge counts.'],
    steps: [
      { title: 'Measure the noise', text: 'Watch the raw input in the logic analyzer to see how long it chatters.' },
      { title: 'Add the filter', text: 'An on/off-delay with a time longer than the chatter.' },
      { title: 'Use the filtered signal everywhere', text: 'Counters, latches and edge triggers all read the filtered signal.' },
    ],
    mistakes: [
      'Filtering a safety input or a fast encoder: the delay slows the reaction.',
      'Filtering only one direction, so the signal still chatters off.',
      'Counting the raw signal while displaying the filtered one.',
    ],
    faq: [
      { q: 'Can I debounce on Arduino the same way?', a: 'Yes. The generated sketch on this page implements the filter with millis(), which is the non-blocking way to debounce a button.' },
      { q: 'What about analog noise?', a: 'Use a low-pass filter or a moving average on the analog value, and hysteresis on any threshold you derive from it.' },
    ],
    blocks: ['ON_OFF_DELAY', 'COUNTER', 'ANALOG_FILTER', 'ANALOG_DIFFERENTIAL'],
    challenges: ['batch-counter'],
    scenarios: [
      {
        name: 'Chatter then a real change',
        steps: [
          { action: 'Chatter 1', set: { raw: true }, waitMs: 100 },
          { action: 'Off', set: { raw: false }, waitMs: 100 },
          { action: 'Chatter 2', set: { raw: true }, waitMs: 100 },
          { action: 'Off', set: { raw: false }, waitMs: 100 },
          { action: 'Chatter 3', set: { raw: true }, waitMs: 100 },
          { action: 'Off', set: { raw: false }, waitMs: 100, expect: { clean: false } },
          { action: 'Stable ON', set: { raw: true }, waitMs: 800, expect: { clean: true, rawEdges: 4, cleanEdges: 1 } },
          { action: 'Short dropout', set: { raw: false }, waitMs: 100 },
          { action: 'Back ON', set: { raw: true }, waitMs: 500, expect: { clean: true, cleanEdges: 1 } },
          { action: 'Stable OFF', set: { raw: false }, waitMs: 800, expect: { clean: false } },
          { action: 'Clear', set: { clear: true }, waitMs: 200, expect: { rawEdges: 0, cleanEdges: 0 } },
        ],
      },
    ],
  },
  {
    slug: 'heater-thermostat-high-limit-plc',
    title: 'How to control a heater with a thermostat and a high-temperature limit (PLC)',
    description: 'On/off heater control with hysteresis (on below 19 °C, off at 21 °C) plus a latched over-temperature trip that needs a manual reset. Live PLC logic.',
    answer:
      'Switch the heater on below the lower setpoint and off above the upper setpoint, so it does not chatter. Add an independent high-temperature limit that latches a trip and turns the heater off until someone resets it after the temperature has come down.',
    level: 'intermediate',
    explanation: `- **Thermostat**: a hysteresis switch with *on threshold 19 °C* and *off threshold 21 °C* (low trigger): ON at 19 °C or below, OFF at 21 °C or above.
- **High limit**: a comparator at 30 °C sets an **over-temperature latch**.
- **Reset** clears the latch only when the temperature is back below the limit.
- **Heater** = enabled AND thermostat AND NOT over-temperature.

The high limit protects against a failed controller, a welded contactor or a sensor fault. In a real installation it is a separate, hardwired safety thermostat with its own manual reset; the PLC version adds the alarm and the information.`,
    circuit: `circuit "Heater with high limit" version 1 {
  temp: ANALOG_INPUT(label="Temperature °C", value=20)
  enable: INPUT(label="Heating enabled", value=true)
  reset: INPUT(label="Trip reset")
  thermostat: ANALOG_DIFFERENTIAL(label="On 19 / off 21 °C", onThreshold=19, offThreshold=21)
  limit: ANALOG_CONSTANT(label="High limit 30 °C", value=30)
  tooHot: ANALOG_COMPARATOR(label="At or above 30 °C", operation="gte")
  cooled: NOT(label="Below the limit")
  resetOk: AND(label="Reset permitted")
  trip: RS_LATCH(label="Over-temperature")
  noTrip: NOT(label="Not tripped")
  demand: AND(label="Heat demand")
  heaterLogic: AND(label="Heat")
  heater: OUTPUT(label="Heater contactor")
  tripLamp: OUTPUT(label="Over-temperature lamp")
  temp.Q -> thermostat.A
  temp.Q -> tooHot.A
  limit.Q -> tooHot.B
  tooHot.Q -> cooled.A
  reset.Q -> resetOk.A
  cooled.Q -> resetOk.B
  tooHot.Q -> trip.S
  resetOk.Q -> trip.R
  trip.Q -> noTrip.A
  enable.Q -> demand.A
  thermostat.Q -> demand.B
  demand.Q -> heaterLogic.A
  noTrip.Q -> heaterLogic.B
  heaterLogic.Q -> heater.A
  trip.Q -> tripLamp.A
}`,
    inputs: [
      { id: 'temp', type: 'ANALOG_INPUT', label: 'Temperature °C', device: 'PT100 or thermocouple via a transmitter or RTD input card' },
      { id: 'enable', type: 'INPUT', label: 'Heating enabled', device: 'Selector switch or schedule' },
      { id: 'reset', type: 'INPUT', label: 'Trip reset', device: 'Reset push button' },
    ],
    outputs: [
      { id: 'heater', type: 'OUTPUT', label: 'Heater contactor', device: 'Contactor or SSR for the heating element' },
      { id: 'tripLamp', type: 'OUTPUT', label: 'Over-temperature lamp', device: 'Alarm lamp' },
    ],
    tryIt: ['Press Run and set the temperature to 18 °C: the heater turns on.', 'Raise it to 20 °C (still on), then 21 °C (off).', 'Set 31 °C: the trip latches. Lower it and reset.'],
    steps: [
      { title: 'Add hysteresis', text: 'On at the lower setpoint, off at the upper one.' },
      { title: 'Add the high limit', text: 'A comparator sets a latch, independent of the thermostat.' },
      { title: 'Reset only when safe', text: 'Reset AND temperature below the limit.' },
      { title: 'Combine', text: 'Heater = enabled AND thermostat AND NOT tripped.' },
    ],
    mistakes: [
      'Using one setpoint: the contactor chatters around it.',
      'An auto-resetting high limit, which cycles the heater on a fault and hides the problem.',
      'Using the same sensor for control and for the high limit: a sensor that reads low defeats both.',
    ],
    faq: [
      { q: 'When should I use PID instead?', a: 'When the temperature must be held closely (within a fraction of a degree) or the process reacts slowly and overshoots. Then a PI or PID controller drives the heater through PWM or a thyristor unit.' },
      { q: 'How wide should the band be?', a: 'Wide enough that the contactor switches a few times per hour at most, narrow enough for the process. 1–2 °C is common for rooms; tanks often use more.' },
    ],
    blocks: ['ANALOG_DIFFERENTIAL', 'ANALOG_COMPARATOR', 'RS_LATCH', 'PI_CONTROLLER', 'PWM'],
    challenges: ['tank-level'],
    scenarios: [
      {
        name: 'Thermostat',
        steps: [
          { action: '20 °C', set: { temp: 20 }, waitMs: 200, expect: { heater: false } },
          { action: '18 °C', set: { temp: 18 }, waitMs: 200, expect: { heater: true } },
          { action: '20.5 °C', set: { temp: 20.5 }, waitMs: 200, expect: { heater: true } },
          { action: '21 °C', set: { temp: 21 }, waitMs: 200, expect: { heater: false } },
          { action: '19.5 °C', set: { temp: 19.5 }, waitMs: 200, expect: { heater: false } },
          { action: 'Disabled at 15 °C', set: { temp: 15, enable: false }, waitMs: 200, expect: { heater: false } },
        ],
      },
      {
        name: 'High limit',
        steps: [
          { action: 'Cold, heating', set: { temp: 15, enable: true }, waitMs: 200, expect: { heater: true } },
          { action: '31 °C', set: { temp: 31 }, waitMs: 200, expect: { heater: false, tripLamp: true } },
          { action: 'Reset while still hot', set: { reset: true }, waitMs: 200, expect: { tripLamp: true } },
          { action: 'Cooled to 15 °C, still tripped', set: { reset: false, temp: 15 }, waitMs: 200, expect: { heater: false, tripLamp: true } },
          { action: 'Reset', set: { reset: true }, waitMs: 200, expect: { tripLamp: false, heater: true } },
        ],
      },
    ],
  },
  {
    slug: 'sump-pump-lead-lag-high-level',
    title: 'How to program lead/lag sump pumps with a high-level alarm',
    description: 'Two sump pumps on a level transmitter: the lead pump starts at 60 %, the lag pump joins at 80 %, they alternate each cycle, and a high-high alarm.',
    answer:
      'Give the lead pump a start level and a lower stop level, give the lag pump a higher start level, and swap which pump is lead each time the lead pump stops. If the level keeps rising past the lag start, both pumps run.',
    level: 'advanced',
    explanation: `Two hysteresis switches on the sump level (high triggers: on threshold above off threshold):

- **Lead demand**: on at 60 %, off at 20 %.
- **Lag demand**: on at 80 %, off at 30 %.

A **falling-edge trigger** on the lead demand toggles a **pulse relay** each time the sump has been pumped down, so pumps A and B take turns as lead:

- **Pump A** = (lead demand AND A is lead) OR (lag demand AND B is lead)
- **Pump B** = (lead demand AND B is lead) OR (lag demand AND A is lead)

A **high-high alarm** at 90 % tells the operator that even two pumps cannot keep up, or that a pump failed.`,
    circuit: `circuit "Lead/lag sump pumps" version 1 {
  level: ANALOG_INPUT(label="Sump level %", value=10)
  lead: ANALOG_DIFFERENTIAL(label="Lead: on 60 / off 20", onThreshold=60, offThreshold=20)
  lag: ANALOG_DIFFERENTIAL(label="Lag: on 80 / off 30", onThreshold=80, offThreshold=30)
  hhLimit: ANALOG_CONSTANT(label="High-high 90 %", value=90)
  hh: ANALOG_COMPARATOR(label="At or above 90 %", operation="gte")
  leadDone: F_TRIG(label="Pumped down")
  bLead: PULSE_RELAY(label="Pump B is lead")
  aLead: NOT(label="Pump A is lead")
  aAsLead: AND(label="A as lead")
  aAsLag: AND(label="A as lag")
  bAsLead: AND(label="B as lead")
  bAsLag: AND(label="B as lag")
  aLogic: OR(label="Run A")
  bLogic: OR(label="Run B")
  pumpA: OUTPUT(label="Pump A")
  pumpB: OUTPUT(label="Pump B")
  alarm: OUTPUT(label="High-high alarm")
  level.Q -> lead.A
  level.Q -> lag.A
  level.Q -> hh.A
  hhLimit.Q -> hh.B
  lead.Q -> leadDone.A
  leadDone.Q -> bLead.A
  bLead.Q -> aLead.A
  lead.Q -> aAsLead.A
  aLead.Q -> aAsLead.B
  lag.Q -> aAsLag.A
  bLead.Q -> aAsLag.B
  lead.Q -> bAsLead.A
  bLead.Q -> bAsLead.B
  lag.Q -> bAsLag.A
  aLead.Q -> bAsLag.B
  aAsLead.Q -> aLogic.A
  aAsLag.Q -> aLogic.B
  bAsLead.Q -> bLogic.A
  bAsLag.Q -> bLogic.B
  aLogic.Q -> pumpA.A
  bLogic.Q -> pumpB.A
  hh.Q -> alarm.A
}`,
    inputs: [{ id: 'level', type: 'ANALOG_INPUT', label: 'Sump level %', device: 'Submersible level transmitter, 4–20 mA scaled to %' }],
    outputs: [
      { id: 'pumpA', type: 'OUTPUT', label: 'Pump A', device: 'Pump A contactor' },
      { id: 'pumpB', type: 'OUTPUT', label: 'Pump B', device: 'Pump B contactor' },
      { id: 'alarm', type: 'OUTPUT', label: 'High-high alarm', device: 'Alarm to the control room or a beacon' },
    ],
    tryIt: ['Press Run and raise the level to 65 %: pump A starts.', 'Raise it to 85 %: pump B joins.', 'Lower it to 15 %: both stop. Raise to 65 % again: now pump B is lead.'],
    steps: [
      { title: 'Two level bands', text: 'Lead and lag hysteresis switches with the lag band higher.' },
      { title: 'Alternate on pump-down', text: 'Falling edge of the lead demand toggles which pump is lead.' },
      { title: 'Map demands to pumps', text: 'Each pump runs as lead or as lag depending on the toggle.' },
      { title: 'Alarm', text: 'A comparator at the high-high level.' },
    ],
    mistakes: [
      'Starting both pumps at the same level, which doubles the starting current and wears both pumps equally fast for no benefit.',
      'Setting the lag stop level below the lead stop level, so the lag pump runs dry longer.',
      'No fault takeover: combine this with fault inputs so a tripped pump is skipped (see the duty/standby guide).',
    ],
    faq: [
      { q: 'Can I do this with float switches instead of a transmitter?', a: 'Yes: use four floats (stop, lead start, lag start, high-high). The stop float resets both pumps; the start floats set latches.' },
      { q: 'Why alternate on pump-down instead of on start?', a: 'The lead pump then never changes while it runs, and each pump does one complete pump-down at a time.' },
    ],
    blocks: ['ANALOG_DIFFERENTIAL', 'PULSE_RELAY', 'F_TRIG', 'ANALOG_COMPARATOR', 'OR', 'AND'],
    challenges: ['tank-level'],
    scenarios: [
      {
        name: 'Two pump-down cycles',
        steps: [
          { action: 'Level 40 %', set: { level: 40 }, waitMs: 200, expect: { pumpA: false, pumpB: false } },
          { action: 'Level 65 %', set: { level: 65 }, waitMs: 200, expect: { pumpA: true, pumpB: false } },
          { action: 'Level 85 %', set: { level: 85 }, waitMs: 200, expect: { pumpA: true, pumpB: true, alarm: false } },
          { action: 'Level 50 %', set: { level: 50 }, waitMs: 200, expect: { pumpA: true, pumpB: true } },
          { action: 'Level 25 %', set: { level: 25 }, waitMs: 200, expect: { pumpA: true, pumpB: false } },
          { action: 'Level 15 %', set: { level: 15 }, waitMs: 200, expect: { pumpA: false, pumpB: false } },
          { action: 'Level 65 %', set: { level: 65 }, waitMs: 200, expect: { pumpA: false, pumpB: true } },
          { action: 'Level 85 %', set: { level: 85 }, waitMs: 200, expect: { pumpA: true, pumpB: true } },
          { action: 'Level 95 %', set: { level: 95 }, waitMs: 200, expect: { alarm: true } },
        ],
      },
    ],
  },
];
