import type { HowTo } from './types.ts';

/** Eighth batch of how-to guides. Verified by tests/howto.test.ts. */
export const HOW_TOS_BATCH_8: HowTo[] = [
  {
    slug: 'four-way-traffic-light-intersection-plc',
    title: 'PLC program for a 4-way traffic light intersection (with all-red clearance)',
    description: 'Two-direction traffic light sequence: north-south green, yellow, all-red, east-west green, yellow, all-red, repeat. Six chained timers, live.',
    answer:
      'Chain six on-delay timers: north-south green, north-south yellow, all red, east-west green, east-west yellow, all red. Each lamp is decoded from which timers are done, red is simply "not green and not yellow", and the last timer restarts the cycle.',
    level: 'intermediate',
    explanation: `| Timer | Time | Phase |
|---|---|---|
| T1 | 5 s | NS green |
| T2 | 2 s | NS yellow |
| T3 | 1 s | all red |
| T4 | 5 s | EW green |
| T5 | 2 s | EW yellow |
| T6 | 1 s | all red |

- **NS green** = enabled AND NOT T1; **NS yellow** = T1 AND NOT T2.
- **EW green** = T3 AND NOT T4; **EW yellow** = T4 AND NOT T5.
- **Each red** = NOT (its green OR its yellow). Red is never decoded on its own, so a direction can never be dark, and switching the system off shows red both ways.
- T6 done resets the chain through a one-scan delay.

The **all-red** phases give vehicles that entered on yellow time to clear the junction before the cross traffic gets green.`,
    circuit: `circuit "4-way intersection" version 1 {
  run: INPUT(label="Run")
  cycleEnd: SCAN_DELAY(label="Cycle finished")
  notEnd: NOT(label="Not finished")
  enable: AND(label="Cycle enabled")
  t1: TON(label="NS green", duration=5000)
  t2: TON(label="NS yellow", duration=2000)
  t3: TON(label="All red 1", duration=1000)
  t4: TON(label="EW green", duration=5000)
  t5: TON(label="EW yellow", duration=2000)
  t6: TON(label="All red 2", duration=1000)
  n1: NOT(label="T1 not done")
  n2: NOT(label="T2 not done")
  n4: NOT(label="T4 not done")
  n5: NOT(label="T5 not done")
  nsG: AND(label="NS green logic")
  nsY: AND(label="NS yellow logic")
  ewG: AND(label="EW green logic")
  ewY: AND(label="EW yellow logic")
  nsMoving: OR(label="NS green or yellow")
  ewMoving: OR(label="EW green or yellow")
  nsR: NOT(label="NS red logic")
  ewR: NOT(label="EW red logic")
  nsGreen: OUTPUT(label="NS green")
  nsYellow: OUTPUT(label="NS yellow")
  nsRed: OUTPUT(label="NS red")
  ewGreen: OUTPUT(label="EW green")
  ewYellow: OUTPUT(label="EW yellow")
  ewRed: OUTPUT(label="EW red")
  t6.Q -> cycleEnd.A
  cycleEnd.Q -> notEnd.A
  run.Q -> enable.A
  notEnd.Q -> enable.B
  enable.Q -> t1.A
  t1.Q -> t2.A
  t2.Q -> t3.A
  t3.Q -> t4.A
  t4.Q -> t5.A
  t5.Q -> t6.A
  t1.Q -> n1.A
  t2.Q -> n2.A
  t4.Q -> n4.A
  t5.Q -> n5.A
  enable.Q -> nsG.A
  n1.Q -> nsG.B
  t1.Q -> nsY.A
  n2.Q -> nsY.B
  t3.Q -> ewG.A
  n4.Q -> ewG.B
  t4.Q -> ewY.A
  n5.Q -> ewY.B
  nsG.Q -> nsMoving.A
  nsY.Q -> nsMoving.B
  ewG.Q -> ewMoving.A
  ewY.Q -> ewMoving.B
  nsMoving.Q -> nsR.A
  ewMoving.Q -> ewR.A
  nsG.Q -> nsGreen.A
  nsY.Q -> nsYellow.A
  nsR.Q -> nsRed.A
  ewG.Q -> ewGreen.A
  ewY.Q -> ewYellow.A
  ewR.Q -> ewRed.A
}`,
    inputs: [{ id: 'run', type: 'INPUT', label: 'Run', device: 'Selector switch' }],
    outputs: [
      { id: 'nsGreen', type: 'OUTPUT', label: 'NS green', device: 'Signal head north-south' },
      { id: 'nsYellow', type: 'OUTPUT', label: 'NS yellow', device: 'Signal head north-south' },
      { id: 'nsRed', type: 'OUTPUT', label: 'NS red', device: 'Signal head north-south' },
      { id: 'ewGreen', type: 'OUTPUT', label: 'EW green', device: 'Signal head east-west' },
      { id: 'ewYellow', type: 'OUTPUT', label: 'EW yellow', device: 'Signal head east-west' },
      { id: 'ewRed', type: 'OUTPUT', label: 'EW red', device: 'Signal head east-west' },
    ],
    tryIt: ['Switch Run ON and press Run in the toolbar.', 'Follow the cycle: NS green 5 s, yellow 2 s, all red 1 s, then EW.', 'Switch Run OFF: red both ways.'],
    steps: [
      { title: 'Chain six timers', text: 'Each one started by the previous one being done.' },
      { title: 'Decode greens and yellows', text: 'Between the end of one timer and the end of the next.' },
      { title: 'Red as the default', text: 'Red = NOT (green OR yellow) for each direction.' },
      { title: 'Repeat', text: 'The last timer restarts the chain through a one-scan delay.' },
    ],
    mistakes: [
      'No all-red phase: crossing traffic gets green while the junction is still occupied.',
      'Decoding red separately, which allows a dark or double-lit signal head after a mistake.',
      'Using one long timer with many comparators: fine on a PLC, but harder to read and to change.',
    ],
    faq: [
      { q: 'How do I add turning arrows or pedestrian phases?', a: 'Insert more timers in the chain and decode the extra lamps from them; keep red as "not green and not yellow" for every signal head.' },
      { q: 'How do I make it traffic-actuated?', a: 'Extend a green phase while vehicle detectors see traffic (up to a maximum), instead of a fixed time. Real controllers also need conflict monitoring hardware.' },
    ],
    blocks: ['TON', 'SCAN_DELAY', 'AND', 'OR', 'NOT'],
    challenges: ['delayed-fan'],
    never: [
      { when: { nsGreen: true, ewGreen: true }, message: 'Both directions were green' },
      { when: { nsGreen: true, ewYellow: true }, message: 'NS green with EW yellow' },
      { when: { ewGreen: true, nsYellow: true }, message: 'EW green with NS yellow' },
      { when: { nsRed: false, ewRed: false }, message: 'Neither direction showed red' },
    ],
    scenarios: [
      {
        name: 'One full cycle',
        steps: [
          { action: 'Switched off', waitMs: 300, expect: { nsRed: true, ewRed: true, nsGreen: false } },
          { action: 'Run, 2.5 s', set: { run: true }, waitMs: 2500, expect: { nsGreen: true, nsRed: false, ewRed: true } },
          { action: '6 s', waitMs: 3500, expect: { nsYellow: true, nsGreen: false, nsRed: false, ewRed: true } },
          { action: '7.5 s (all red)', waitMs: 1500, expect: { nsRed: true, ewRed: true } },
          { action: '10.5 s', waitMs: 3000, expect: { ewGreen: true, nsRed: true, ewRed: false } },
          { action: '14 s', waitMs: 3500, expect: { ewYellow: true, ewGreen: false, ewRed: false, nsRed: true } },
          { action: '15.5 s (all red)', waitMs: 1500, expect: { nsRed: true, ewRed: true } },
          { action: '17 s', waitMs: 1500, expect: { nsGreen: true, ewRed: true } },
          { action: 'Switched off', set: { run: false }, waitMs: 200, expect: { nsRed: true, ewRed: true, nsGreen: false } },
        ],
      },
    ],
  },
  {
    slug: 'plc-program-drilling-machine',
    title: 'PLC program for an automatic drilling machine (clamp, drill, retract)',
    description: 'Drilling station sequence: clamp the part, start the spindle, feed down to the bottom limit, retract to the top, unclamp. PLC logic with interlocks.',
    answer:
      'Start a cycle only with a part present and the drill at the top. Clamp first, run the spindle and feed down once the clamp is confirmed, remember that the bottom was reached, feed back up to the top limit, then unclamp and end the cycle.',
    level: 'intermediate',
    explanation: `- **Cycle** latch: Start AND part present AND drill at top sets it; Stop or "back at the top after drilling" resets it.
- **Clamp** = cycle. The spindle and feed only work once the **clamp switch** confirms.
- **Spindle** = cycle AND clamped.
- **Bottom reached** latch: set by the bottom limit during the cycle, cleared at the end. It makes the feed reverse and stay reversed even after the drill leaves the bottom switch.
- **Feed down** = cycle AND clamped AND NOT bottom reached.
- **Feed up** = cycle AND bottom reached AND NOT at top.
- **Done** = bottom reached AND at top, which ends the cycle through a one-scan delay and unclamps the part.`,
    circuit: `circuit "Drilling machine" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  part: INPUT(label="Part present")
  clamped: INPUT(label="Clamp closed")
  top: INPUT(label="Drill at top", value=true)
  bottom: INPUT(label="Drill at bottom")
  ready: AND(label="Part and drill at top")
  canStart: AND(label="Start allowed")
  done: SCAN_DELAY(label="Cycle done")
  endCycle: OR(label="Stop or done")
  cycle: RS_LATCH(label="Cycle")
  noCycle: NOT(label="No cycle")
  hitBottom: AND(label="Bottom in cycle")
  drilled: RS_LATCH(label="Bottom reached")
  notDrilled: NOT(label="Not drilled yet")
  working: AND(label="Clamped in cycle")
  downLogic: AND(label="Feed down")
  notTop: NOT(label="Not at top")
  returning: AND(label="Returning")
  upLogic: AND(label="Feed up")
  doneLogic: AND(label="Back at top")
  clamp: OUTPUT(label="Clamp")
  spindle: OUTPUT(label="Spindle motor")
  feedDown: OUTPUT(label="Feed down")
  feedUp: OUTPUT(label="Feed up")
  part.Q -> ready.A
  top.Q -> ready.B
  start.Q -> canStart.A
  ready.Q -> canStart.B
  doneLogic.Q -> done.A
  stop.Q -> endCycle.A
  done.Q -> endCycle.B
  canStart.Q -> cycle.S
  endCycle.Q -> cycle.R
  cycle.Q -> noCycle.A
  cycle.Q -> hitBottom.A
  bottom.Q -> hitBottom.B
  hitBottom.Q -> drilled.S
  noCycle.Q -> drilled.R
  drilled.Q -> notDrilled.A
  cycle.Q -> working.A
  clamped.Q -> working.B
  working.Q -> downLogic.A
  notDrilled.Q -> downLogic.B
  top.Q -> notTop.A
  cycle.Q -> returning.A
  drilled.Q -> returning.B
  returning.Q -> upLogic.A
  notTop.Q -> upLogic.B
  drilled.Q -> doneLogic.A
  top.Q -> doneLogic.B
  cycle.Q -> clamp.A
  working.Q -> spindle.A
  downLogic.Q -> feedDown.A
  upLogic.Q -> feedUp.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'part', type: 'INPUT', label: 'Part present', device: 'Proximity sensor in the fixture' },
      { id: 'clamped', type: 'INPUT', label: 'Clamp closed', device: 'Clamp cylinder reed switch' },
      { id: 'top', type: 'INPUT', label: 'Drill at top', device: 'Limit switch' },
      { id: 'bottom', type: 'INPUT', label: 'Drill at bottom', device: 'Limit switch (drilling depth)' },
    ],
    outputs: [
      { id: 'clamp', type: 'OUTPUT', label: 'Clamp', device: 'Clamp valve' },
      { id: 'spindle', type: 'OUTPUT', label: 'Spindle motor', device: 'Spindle contactor' },
      { id: 'feedDown', type: 'OUTPUT', label: 'Feed down', device: 'Feed cylinder or motor down' },
      { id: 'feedUp', type: 'OUTPUT', label: 'Feed up', device: 'Feed cylinder or motor up' },
    ],
    tryIt: ['Switch Part present ON, then Start: the clamp closes.', 'Switch Clamp closed ON: spindle and feed down. Switch Drill at top OFF, then Drill at bottom ON.', 'Feed up runs; switch bottom OFF and top ON: the part unclamps.'],
    steps: [
      { title: 'Check before starting', text: 'Part present and drill at the top.' },
      { title: 'Clamp first', text: 'Nothing moves until the clamp switch confirms.' },
      { title: 'Drill down', text: 'Feed down until the bottom limit; remember it in a latch.' },
      { title: 'Return and unclamp', text: 'Feed up to the top, then end the cycle.' },
    ],
    mistakes: [
      'Starting the feed on the clamp command instead of the clamp switch.',
      'No "bottom reached" memory: the feed goes down again as soon as it leaves the bottom switch.',
      'Stopping with the drill in the part. Real machines retract on Stop and keep the spindle running until the drill is out.',
    ],
    faq: [
      { q: 'How do I add peck drilling?', a: 'Use a counter: feed down for a set time or distance, retract a little to clear chips, repeat until the bottom limit, then return.' },
      { q: 'How do I detect a broken drill?', a: 'Monitor the feed time (an on-delay on feed down) and the spindle current; a feed that reaches the bottom far too fast suggests a broken or missing drill.' },
    ],
    blocks: ['RS_LATCH', 'SCAN_DELAY', 'AND', 'OR', 'NOT'],
    challenges: ['guarded-machine', 'start-stop'],
    never: [
      { when: { feedDown: true, feedUp: true }, message: 'Feed down and up together' },
      { when: { spindle: true, clamped: false }, message: 'The spindle ran with the part unclamped' },
    ],
    scenarios: [
      {
        name: 'One drilling cycle',
        steps: [
          { action: 'Start without a part', set: { top: true, start: true }, waitMs: 300, expect: { clamp: false } },
          { action: 'Part loaded, Start', set: { part: true }, waitMs: 200, expect: { clamp: true, spindle: false, feedDown: false } },
          { action: 'Clamp closed', set: { start: false, clamped: true }, waitMs: 200, expect: { spindle: true, feedDown: true } },
          { action: 'Drill leaves the top', set: { top: false }, waitMs: 1000, expect: { feedDown: true } },
          { action: 'Bottom reached', set: { bottom: true }, waitMs: 200, expect: { feedDown: false, feedUp: true, spindle: true } },
          { action: 'Drill leaves the bottom', set: { bottom: false }, waitMs: 1000, expect: { feedUp: true, feedDown: false } },
          { action: 'Back at the top', set: { top: true }, waitMs: 300, expect: { feedUp: false, clamp: false } },
          { action: 'Clamp opens', set: { clamped: false }, waitMs: 300, expect: { spindle: false, clamp: false } },
          { action: 'Next part: Start', set: { start: true }, waitMs: 200, expect: { clamp: true } },
          { action: 'Clamped: drills down again', set: { start: false, clamped: true }, waitMs: 200, expect: { feedDown: true, feedUp: false } },
        ],
      },
      {
        name: 'Stop',
        steps: [
          { action: 'Start a cycle', set: { top: true, part: true, start: true }, waitMs: 200, expect: { clamp: true } },
          { action: 'Clamped, feeding', set: { start: false, clamped: true }, waitMs: 300, expect: { feedDown: true } },
          { action: 'Stop', set: { stop: true }, waitMs: 200, expect: { feedDown: false, spindle: false, clamp: false } },
        ],
      },
    ],
  },
  {
    slug: 'plc-program-hydraulic-press',
    title: 'PLC program for a hydraulic press (fast approach, slow press, dwell, return)',
    description: 'Hydraulic press cycle: rapid approach to the slow-down point, slow pressing until pressure is reached, a dwell time, then return to the top.',
    answer:
      'Run the ram down at rapid speed until a slow-down sensor, continue at pressing speed until the pressure switch confirms the force, hold for a dwell time, then return to the top limit. Latches remember each stage so the ram never reverses direction by mistake.',
    level: 'advanced',
    explanation: `- **Cycle** latch: Start (ram at top) sets it; Stop or "back at top" resets it. In a real press Start comes from a two-hand control or a guard interlock (see the two-hand guide).
- **Slow zone** latch: set when the slow-down sensor is reached during the cycle.
- **Pressed** latch: set when the pressure switch confirms the force.
- **Down** = cycle AND NOT pressed: **fast** while NOT in the slow zone, **slow** after.
- **Dwell** (1 s) runs once pressed; then **Return** = cycle AND dwell done.
- **Done** = returning AND top → ends the cycle through a one-scan delay.`,
    circuit: `circuit "Hydraulic press" version 1 {
  start: INPUT(label="Start (two-hand OK)")
  stop: INPUT(label="Stop")
  top: INPUT(label="Ram at top", value=true)
  slow: INPUT(label="Slow-down point")
  pressure: INPUT(label="Pressure reached")
  canStart: AND(label="Start at top")
  done: SCAN_DELAY(label="Cycle done")
  endCycle: OR(label="Stop or done")
  cycle: RS_LATCH(label="Cycle")
  noCycle: NOT(label="No cycle")
  enterSlow: AND(label="Slow point in cycle")
  slowZone: RS_LATCH(label="In slow zone")
  hitPressure: AND(label="Pressure in cycle")
  pressed: RS_LATCH(label="Pressed")
  notPressed: NOT(label="Not pressed yet")
  down: AND(label="Moving down")
  notSlow: NOT(label="Not in slow zone")
  fastLogic: AND(label="Fast")
  slowLogic: AND(label="Slow")
  dwellEnable: AND(label="Holding")
  dwell: TON(label="Dwell time", duration=1000)
  returnLogic: AND(label="Return")
  doneLogic: AND(label="Back at top")
  fastDown: OUTPUT(label="Fast down")
  slowDown: OUTPUT(label="Slow down")
  returnUp: OUTPUT(label="Return up")
  start.Q -> canStart.A
  top.Q -> canStart.B
  doneLogic.Q -> done.A
  stop.Q -> endCycle.A
  done.Q -> endCycle.B
  canStart.Q -> cycle.S
  endCycle.Q -> cycle.R
  cycle.Q -> noCycle.A
  cycle.Q -> enterSlow.A
  slow.Q -> enterSlow.B
  enterSlow.Q -> slowZone.S
  noCycle.Q -> slowZone.R
  cycle.Q -> hitPressure.A
  pressure.Q -> hitPressure.B
  hitPressure.Q -> pressed.S
  noCycle.Q -> pressed.R
  pressed.Q -> notPressed.A
  cycle.Q -> down.A
  notPressed.Q -> down.B
  slowZone.Q -> notSlow.A
  down.Q -> fastLogic.A
  notSlow.Q -> fastLogic.B
  down.Q -> slowLogic.A
  slowZone.Q -> slowLogic.B
  cycle.Q -> dwellEnable.A
  pressed.Q -> dwellEnable.B
  dwellEnable.Q -> dwell.A
  cycle.Q -> returnLogic.A
  dwell.Q -> returnLogic.B
  returnLogic.Q -> doneLogic.A
  top.Q -> doneLogic.B
  fastLogic.Q -> fastDown.A
  slowLogic.Q -> slowDown.A
  returnLogic.Q -> returnUp.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start (two-hand OK)', device: 'Output of the two-hand control relay' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'top', type: 'INPUT', label: 'Ram at top', device: 'Limit switch' },
      { id: 'slow', type: 'INPUT', label: 'Slow-down point', device: 'Proximity sensor or cam' },
      { id: 'pressure', type: 'INPUT', label: 'Pressure reached', device: 'Pressure switch on the cylinder' },
    ],
    outputs: [
      { id: 'fastDown', type: 'OUTPUT', label: 'Fast down', device: 'Rapid approach valve' },
      { id: 'slowDown', type: 'OUTPUT', label: 'Slow down', device: 'Pressing valve' },
      { id: 'returnUp', type: 'OUTPUT', label: 'Return up', device: 'Return valve' },
    ],
    tryIt: ['Switch Start on and off: fast down. Switch Ram at top OFF.', 'Switch Slow-down point ON: slow down. Switch Pressure reached ON: hold 1 s, then return.', 'Switch the sensors OFF and Ram at top ON: the cycle ends.'],
    steps: [
      { title: 'Start at the top', text: 'Only start a cycle from the top position.' },
      { title: 'Two speeds down', text: 'A latch for the slow zone keeps the speed slow once reached.' },
      { title: 'Press and hold', text: 'A latch for "pressed" and a dwell timer.' },
      { title: 'Return', text: 'After the dwell, up to the top limit.' },
    ],
    mistakes: [
      'Approaching at rapid speed all the way: impact and poor quality.',
      'Returning as soon as the pressure switch makes, without a dwell: the part springs back.',
      'Press safety (guards, two-hand control, stopping time) must be built with safety-rated components; this page covers only the cycle logic.',
    ],
    faq: [
      { q: 'How do I press to a position instead of a pressure?', a: 'Replace the pressure switch with a bottom position sensor or a comparator on a linear transducer.' },
      { q: 'How do I add a pressure timeout?', a: 'Put an on-delay on "slow down"; if pressure is not reached in time (no part, leaking cylinder), stop and return with a fault.' },
    ],
    blocks: ['RS_LATCH', 'TON', 'SCAN_DELAY', 'AND', 'OR', 'NOT'],
    challenges: ['two-hand-start', 'one-shot-valve'],
    never: [
      { when: { fastDown: true, returnUp: true }, message: 'Down and return together' },
      { when: { slowDown: true, returnUp: true }, message: 'Down and return together' },
      { when: { fastDown: true, slowDown: true }, message: 'Fast and slow down together' },
    ],
    scenarios: [
      {
        name: 'One press cycle',
        steps: [
          { action: 'Start at the top', set: { top: true, start: true }, waitMs: 200, expect: { fastDown: true } },
          { action: 'Ram leaves the top', set: { start: false, top: false }, waitMs: 800, expect: { fastDown: true, slowDown: false } },
          { action: 'Slow-down point', set: { slow: true }, waitMs: 200, expect: { fastDown: false, slowDown: true } },
          { action: 'Past the sensor', set: { slow: false }, waitMs: 800, expect: { slowDown: true } },
          { action: 'Pressure reached', set: { pressure: true }, waitMs: 200, expect: { slowDown: false, returnUp: false } },
          { action: 'Dwell over', waitMs: 1000, expect: { returnUp: true } },
          { action: 'Pressure drops while returning', set: { pressure: false }, waitMs: 800, expect: { returnUp: true, slowDown: false, fastDown: false } },
          { action: 'Top reached', set: { top: true }, waitMs: 300, expect: { returnUp: false, fastDown: false } },
          { action: 'Next cycle', set: { start: true }, waitMs: 200, expect: { fastDown: true } },
        ],
      },
      {
        name: 'Not at top, and Stop',
        steps: [
          { action: 'Start below the top', set: { top: false, start: true }, waitMs: 300, expect: { fastDown: false } },
          { action: 'At top, Start', set: { top: true }, waitMs: 200, expect: { fastDown: true } },
          { action: 'Stop', set: { start: false, stop: true }, waitMs: 200, expect: { fastDown: false, slowDown: false, returnUp: false } },
        ],
      },
    ],
  },
  {
    slug: 'filter-backwash-sequence-plc',
    title: 'How to program an automatic filter backwash (differential pressure or timer)',
    description: 'Water filter backwash in PLC logic: start on high differential pressure, on a timer or by hand; backwash, rinse, return to service. Live simulator.',
    answer:
      'Start a backwash when the differential pressure across the filter is high, when the interval since the last backwash has expired, or on demand. Take the filter out of service, backwash for a set time, rinse to drain, then return it to service and restart the interval timer.',
    level: 'intermediate',
    explanation: `- **Interval timer**: runs while the filter is in service (20 s in the demo, typically 24–72 hours).
- **Backwash request** = high dP OR interval expired OR manual. It sets the **backwash** latch.
- **Backwash step** (5 s): service valve closed, drain open, backwash pump on.
- **Rinse step** (3 s): rinse valve and drain open, so the first dirty filtrate goes to drain.
- The end of the rinse resets the latch (one-scan delay), the filter returns to service and the interval starts again.

The interval timer reads "in service" from the previous scan, because the backwash latch depends on it.`,
    circuit: `circuit "Filter backwash" version 1 {
  dpHigh: INPUT(label="High differential pressure")
  manual: INPUT(label="Manual backwash")
  bwPrev: SCAN_DELAY(label="Backwashing (last scan)")
  inServicePrev: NOT(label="In service (last scan)")
  interval: TON(label="Backwash interval", duration=20000)
  req1: OR(label="dP or interval")
  request: OR(label="Backwash request")
  finished: SCAN_DELAY(label="Rinse finished")
  bw: RS_LATCH(label="Backwashing")
  bwTime: TON(label="Backwash time", duration=5000)
  rinseTime: TON(label="Rinse time", duration=3000)
  notBwDone: NOT(label="Backwash running")
  notRinseDone: NOT(label="Rinse running")
  pumpLogic: AND(label="Backwash step")
  rinseLogic: AND(label="Rinse step")
  inService: NOT(label="In service")
  service: OUTPUT(label="Service valve")
  pump: OUTPUT(label="Backwash pump")
  drain: OUTPUT(label="Drain valve")
  rinse: OUTPUT(label="Rinse valve")
  bw.Q -> bwPrev.A
  bwPrev.Q -> inServicePrev.A
  inServicePrev.Q -> interval.A
  dpHigh.Q -> req1.A
  interval.Q -> req1.B
  req1.Q -> request.A
  manual.Q -> request.B
  rinseTime.Q -> finished.A
  request.Q -> bw.S
  finished.Q -> bw.R
  bw.Q -> bwTime.A
  bwTime.Q -> rinseTime.A
  bwTime.Q -> notBwDone.A
  rinseTime.Q -> notRinseDone.A
  bw.Q -> pumpLogic.A
  notBwDone.Q -> pumpLogic.B
  bwTime.Q -> rinseLogic.A
  notRinseDone.Q -> rinseLogic.B
  bw.Q -> inService.A
  inService.Q -> service.A
  pumpLogic.Q -> pump.A
  bw.Q -> drain.A
  rinseLogic.Q -> rinse.A
}`,
    inputs: [
      { id: 'dpHigh', type: 'INPUT', label: 'High differential pressure', device: 'Differential pressure switch across the filter' },
      { id: 'manual', type: 'INPUT', label: 'Manual backwash', device: 'Push button or HMI' },
    ],
    outputs: [
      { id: 'service', type: 'OUTPUT', label: 'Service valve', device: 'Filter outlet valve' },
      { id: 'pump', type: 'OUTPUT', label: 'Backwash pump', device: 'Backwash pump contactor' },
      { id: 'drain', type: 'OUTPUT', label: 'Drain valve', device: 'Backwash waste valve' },
      { id: 'rinse', type: 'OUTPUT', label: 'Rinse valve', device: 'Rinse-to-waste valve' },
    ],
    tryIt: ['Press Run: the filter is in service.', 'Switch High differential pressure on and off: backwash 5 s, rinse 3 s, back in service.', 'Wait 20 s: an interval backwash starts by itself.'],
    steps: [
      { title: 'Three triggers', text: 'dP, interval and manual, ORed into one request.' },
      { title: 'Latch the backwash', text: 'Reset at the end of the rinse.' },
      { title: 'Two timed steps', text: 'Backwash, then rinse, each with its valves.' },
      { title: 'Restart the interval', text: 'The interval timer only runs in service.' },
    ],
    mistakes: [
      'Backwashing only on a timer: dirty filters break through, clean ones waste water.',
      'Opening the backwash pump against a closed drain valve. Real sequences open valves first and confirm their positions.',
      'Several filters backwashing at once, starving the backwash pump; queue them so only one runs at a time.',
    ],
    faq: [
      { q: 'How do I handle several filters?', a: 'Give each filter its own sequence and a "permission" token so only one backwashes at a time; queue requests in order.' },
      { q: 'Should I add an air scour step?', a: 'Many media filters use an air scour before the water backwash. Add it as another timed step with the blower output.' },
    ],
    blocks: ['TON', 'RS_LATCH', 'SCAN_DELAY', 'AND', 'OR', 'NOT'],
    challenges: ['delayed-fan', 'start-stop'],
    never: [
      { when: { service: true, pump: true }, message: 'In service while backwashing' },
      { when: { pump: true, drain: false }, message: 'Backwash pump on with the drain closed' },
    ],
    scenarios: [
      {
        name: 'Backwash on dP',
        steps: [
          { action: 'In service', waitMs: 1000, expect: { service: true, pump: false, drain: false } },
          { action: 'High dP', set: { dpHigh: true }, waitMs: 200, expect: { service: false, pump: true, drain: true } },
          { action: 'dP falls during backwash', set: { dpHigh: false }, waitMs: 3000, expect: { pump: true } },
          { action: 'Rinse', waitMs: 2500, expect: { pump: false, rinse: true, drain: true } },
          { action: 'Back in service', waitMs: 3000, expect: { service: true, drain: false, rinse: false } },
          { action: 'Manual backwash', set: { manual: true }, waitMs: 200, expect: { pump: true } },
        ],
      },
      {
        name: 'Interval backwash',
        steps: [
          { action: 'In service for 19 s', waitMs: 19000, expect: { service: true } },
          { action: 'Interval expired', waitMs: 1500, expect: { service: false, pump: true } },
          { action: 'Backwash and rinse', waitMs: 8500, expect: { service: true } },
          { action: 'Interval restarted: 15 s later still in service', waitMs: 15000, expect: { service: true } },
        ],
      },
    ],
  },
  {
    slug: 'generator-load-shedding-plc',
    title: 'How to program load shedding on a generator (priority loads)',
    description: 'Shed low-priority loads when generator load is too high and restore them in steps when it drops, with delays to avoid hunting. PLC logic you can run.',
    answer:
      'When the load stays above a high limit for a short time, disconnect the lowest-priority feeder; if it rises further, disconnect the next. Restore feeders one at a time, highest priority first, only after the load has stayed well below the limit for a while.',
    level: 'advanced',
    explanation: `- **Shed priority 3** (least important) when load ≥ **90 %** for 2 s.
- **Shed priority 2** when load ≥ **95 %** for 2 s.
- **Restore priority 2** when load ≤ **70 %** for 5 s; **restore priority 3** when load ≤ 70 % for 10 s. The higher priority comes back first, and the gap between restores lets the generator settle.
- Priority 1 (critical loads) is never shed.

Each shed decision is a latch: set by its high-load timer, reset by its restore timer. The gap between 90 % and 70 % plus the delays stops the system from shedding and restoring in a loop.`,
    circuit: `circuit "Load shedding" version 1 {
  load: ANALOG_INPUT(label="Generator load %", value=60)
  l90: ANALOG_CONSTANT(label="90 %", value=90)
  l95: ANALOG_CONSTANT(label="95 %", value=95)
  l70: ANALOG_CONSTANT(label="70 %", value=70)
  over90: ANALOG_COMPARATOR(label="Load at or above 90 %", operation="gte")
  over95: ANALOG_COMPARATOR(label="Load at or above 95 %", operation="gte")
  under70: ANALOG_COMPARATOR(label="Load at or below 70 %", operation="lte")
  shed3Delay: TON(label="Shed 3 delay", duration=2000)
  shed2Delay: TON(label="Shed 2 delay", duration=2000)
  restore2Delay: TON(label="Restore 2 delay", duration=5000)
  restore3Delay: TON(label="Restore 3 delay", duration=10000)
  shed3: RS_LATCH(label="Priority 3 shed")
  shed2: RS_LATCH(label="Priority 2 shed")
  on3: NOT(label="Feeder 3 on")
  on2: NOT(label="Feeder 2 on")
  feeder2: OUTPUT(label="Feeder 2 (priority 2)")
  feeder3: OUTPUT(label="Feeder 3 (priority 3)")
  load.Q -> over90.A
  l90.Q -> over90.B
  load.Q -> over95.A
  l95.Q -> over95.B
  load.Q -> under70.A
  l70.Q -> under70.B
  over90.Q -> shed3Delay.A
  over95.Q -> shed2Delay.A
  under70.Q -> restore2Delay.A
  under70.Q -> restore3Delay.A
  shed3Delay.Q -> shed3.S
  restore3Delay.Q -> shed3.R
  shed2Delay.Q -> shed2.S
  restore2Delay.Q -> shed2.R
  shed3.Q -> on3.A
  shed2.Q -> on2.A
  on2.Q -> feeder2.A
  on3.Q -> feeder3.A
}`,
    inputs: [{ id: 'load', type: 'ANALOG_INPUT', label: 'Generator load %', device: 'Power meter or generator controller (kW as % of rating)' }],
    outputs: [
      { id: 'feeder2', type: 'OUTPUT', label: 'Feeder 2 (priority 2)', device: 'Feeder breaker or contactor' },
      { id: 'feeder3', type: 'OUTPUT', label: 'Feeder 3 (priority 3)', device: 'Feeder breaker or contactor' },
    ],
    tryIt: ['Press Run and set the load to 92 %: after 2 s feeder 3 is shed.', 'Set 96 %: feeder 2 is shed too.', 'Set 60 %: feeder 2 returns after 5 s, feeder 3 after 10 s.'],
    steps: [
      { title: 'Shed thresholds', text: 'A comparator and a delay per priority level.' },
      { title: 'Latch each shed', text: 'Set by the shed delay, reset by the restore delay.' },
      { title: 'Restore in order', text: 'Higher priority first, with longer delays for lower priorities.' },
    ],
    mistakes: [
      'Restoring all loads at once, which overloads the generator again.',
      'Restore threshold too close to the shed threshold: loads cycle on and off.',
      'Shedding on a single instantaneous reading; motor starts cause short peaks.',
    ],
    faq: [
      { q: 'Should I shed on frequency instead of load?', a: 'Frequency drop is the fastest sign of overload on an island generator; many schemes shed on under-frequency as well, in stages, with very short delays.' },
      { q: 'How do I pick priorities?', a: 'Life safety and critical process first, then production, then comfort loads (HVAC, water heaters) last.' },
    ],
    blocks: ['ANALOG_COMPARATOR', 'ANALOG_CONSTANT', 'TON', 'RS_LATCH', 'NOT'],
    challenges: ['tank-level', 'delayed-fan'],
    never: [{ when: { feeder2: false, feeder3: true }, message: 'A lower-priority feeder was on while a higher one was shed' }],
    scenarios: [
      {
        name: 'Overload and recovery',
        steps: [
          { action: 'Normal 60 %', set: { load: 60 }, waitMs: 500, expect: { feeder2: true, feeder3: true } },
          { action: 'Short peak 92 % for 1 s', set: { load: 92 }, waitMs: 1000, expect: { feeder3: true } },
          { action: 'Back to 80 %', set: { load: 80 }, waitMs: 500, expect: { feeder3: true } },
          { action: '92 % for 2.5 s', set: { load: 92 }, waitMs: 2500, expect: { feeder3: false, feeder2: true } },
          { action: '96 % for 2.5 s', set: { load: 96 }, waitMs: 2500, expect: { feeder2: false } },
          { action: '80 %: not low enough to restore', set: { load: 80 }, waitMs: 6000, expect: { feeder2: false, feeder3: false } },
          { action: '60 % for 5.5 s', set: { load: 60 }, waitMs: 5500, expect: { feeder2: true, feeder3: false } },
          { action: '60 % for 10.5 s', waitMs: 5000, expect: { feeder3: true } },
        ],
      },
    ],
  },
  {
    slug: 'batch-reactor-heat-hold-cool',
    title: 'How to program a batch heat, hold and cool sequence (reactor or pasteuriser)',
    description: 'Heat to 80 °C, hold at temperature for a set time with hysteresis, then cool to 40 °C and finish. Batch temperature sequence in PLC logic.',
    answer:
      'Heat at full power until the setpoint is reached, then hold it with an on/off band for the hold time, then open the cooling valve until the end temperature. Latches for "reached" and timers for the hold make each phase happen once.',
    level: 'advanced',
    explanation: `| Phase | Heater | Cooling | Ends when |
|---|---|---|---|
| Heat-up | on | off | temperature ≥ 80 °C |
| Hold | on at ≤ 78 °C, off at ≥ 80 °C | off | 5 s have passed (minutes in reality) |
| Cool-down | off | on | temperature ≤ 40 °C |

- **Batch** latch: Start sets, Stop or the end of cooling resets.
- **Reached** latch: set when 80 °C is reached during the batch. Without it, the heat-up phase would return every time the temperature dipped during the hold.
- **Hold timer** runs while reached. When it is done, the **cool-down** phase begins.
- **Done** = cooling AND ≤ 40 °C → resets the batch (one-scan delay).

Pasteurisation uses exactly this pattern: the hold time at temperature is what kills the bacteria, so it is often recorded for every batch.`,
    circuit: `circuit "Heat, hold, cool" version 1 {
  temp: ANALOG_INPUT(label="Temperature °C", value=20)
  start: INPUT(label="Start batch")
  stop: INPUT(label="Stop")
  setpoint: ANALOG_CONSTANT(label="80 °C", value=80)
  endTemp: ANALOG_CONSTANT(label="40 °C", value=40)
  atSetpoint: ANALOG_COMPARATOR(label="At or above 80 °C", operation="gte")
  cool: ANALOG_COMPARATOR(label="At or below 40 °C", operation="lte")
  holdBand: ANALOG_DIFFERENTIAL(label="Hold: on 78 / off 80 °C", onThreshold=78, offThreshold=80)
  finished: SCAN_DELAY(label="Batch finished")
  endBatch: OR(label="Stop or finished")
  batch: RS_LATCH(label="Batch running")
  noBatch: NOT(label="No batch")
  reach: AND(label="Setpoint in batch")
  reached: RS_LATCH(label="Setpoint reached")
  notReached: NOT(label="Heating up")
  heatUp: AND(label="Heat-up phase")
  holding: AND(label="Reached in batch")
  holdTime: TON(label="Hold time", duration=5000)
  notHeld: NOT(label="Hold running")
  holdPhase: AND(label="Hold phase")
  holdHeat: AND(label="Hold heating")
  heatLogic: OR(label="Heat")
  coolPhase: AND(label="Cool-down phase")
  doneLogic: AND(label="Cooled")
  heater: OUTPUT(label="Heater")
  cooling: OUTPUT(label="Cooling valve")
  holdLamp: OUTPUT(label="Holding lamp")
  temp.Q -> atSetpoint.A
  setpoint.Q -> atSetpoint.B
  temp.Q -> cool.A
  endTemp.Q -> cool.B
  temp.Q -> holdBand.A
  doneLogic.Q -> finished.A
  stop.Q -> endBatch.A
  finished.Q -> endBatch.B
  start.Q -> batch.S
  endBatch.Q -> batch.R
  batch.Q -> noBatch.A
  batch.Q -> reach.A
  atSetpoint.Q -> reach.B
  reach.Q -> reached.S
  noBatch.Q -> reached.R
  reached.Q -> notReached.A
  batch.Q -> heatUp.A
  notReached.Q -> heatUp.B
  batch.Q -> holding.A
  reached.Q -> holding.B
  holding.Q -> holdTime.A
  holdTime.Q -> notHeld.A
  holding.Q -> holdPhase.A
  notHeld.Q -> holdPhase.B
  holdPhase.Q -> holdHeat.A
  holdBand.Q -> holdHeat.B
  heatUp.Q -> heatLogic.A
  holdHeat.Q -> heatLogic.B
  batch.Q -> coolPhase.A
  holdTime.Q -> coolPhase.B
  coolPhase.Q -> doneLogic.A
  cool.Q -> doneLogic.B
  heatLogic.Q -> heater.A
  coolPhase.Q -> cooling.A
  holdPhase.Q -> holdLamp.A
}`,
    inputs: [
      { id: 'temp', type: 'ANALOG_INPUT', label: 'Temperature °C', device: 'PT100 in the vessel' },
      { id: 'start', type: 'INPUT', label: 'Start batch', device: 'Push button or batch system' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
    ],
    outputs: [
      { id: 'heater', type: 'OUTPUT', label: 'Heater', device: 'Steam valve or heater contactor' },
      { id: 'cooling', type: 'OUTPUT', label: 'Cooling valve', device: 'Cooling water valve' },
      { id: 'holdLamp', type: 'OUTPUT', label: 'Holding lamp', device: 'Indicator / batch record' },
    ],
    tryIt: ['Press Run, switch Start on and off: heating.', 'Set 80 °C: holding for 5 s (try 78 °C to see the heater return).', 'After the hold, cooling: set 40 °C to finish.'],
    steps: [
      { title: 'Latch the batch', text: 'Start / Stop / finished.' },
      { title: 'Heat up', text: 'Full heat until the setpoint; remember it was reached.' },
      { title: 'Hold', text: 'On/off band and a hold timer.' },
      { title: 'Cool down', text: 'Cooling valve until the end temperature, then finish.' },
    ],
    mistakes: [
      'Starting the hold timer before the setpoint is reached, which shortens the real hold.',
      'Letting the hold timer keep running while the temperature has dropped far below the setpoint; strict processes pause or restart the hold when the temperature falls out of the band.',
      'Heating and cooling at the same time at a phase change.',
    ],
    faq: [
      { q: 'How do I pause the hold when the temperature drops?', a: 'Use a retentive timer whose input is "holding AND temperature ≥ 78 °C", so it only counts while the product is really at temperature.' },
      { q: 'Should I use PID for the hold?', a: 'For tight bands and large vessels, yes: a PI controller on the steam valve holds the temperature far better than on/off control.' },
    ],
    blocks: ['ANALOG_COMPARATOR', 'ANALOG_DIFFERENTIAL', 'TON', 'RS_LATCH', 'SCAN_DELAY', 'AND', 'OR', 'NOT'],
    challenges: ['tank-level', 'star-delta'],
    never: [{ when: { heater: true, cooling: true }, message: 'Heating and cooling together' }],
    scenarios: [
      {
        name: 'One batch',
        steps: [
          { action: 'Start at 20 °C', set: { temp: 20, start: true }, waitMs: 200, expect: { heater: true, cooling: false, holdLamp: false } },
          { action: '79 °C', set: { start: false, temp: 79 }, waitMs: 500, expect: { heater: true } },
          { action: '80 °C reached', set: { temp: 80 }, waitMs: 200, expect: { heater: false, holdLamp: true } },
          { action: 'Dips to 79 °C (inside the band)', set: { temp: 79 }, waitMs: 500, expect: { heater: false } },
          { action: 'Dips to 78 °C', set: { temp: 78 }, waitMs: 500, expect: { heater: true, holdLamp: true } },
          { action: 'Back at 80 °C', set: { temp: 80 }, waitMs: 500, expect: { heater: false } },
          { action: 'Hold time over', waitMs: 3500, expect: { holdLamp: false, cooling: true, heater: false } },
          { action: 'Cooling to 60 °C', set: { temp: 60 }, waitMs: 1000, expect: { cooling: true, heater: false } },
          { action: '40 °C', set: { temp: 40 }, waitMs: 300, expect: { cooling: false, heater: false } },
          { action: 'Next batch heats again', set: { temp: 20, start: true }, waitMs: 200, expect: { heater: true, holdLamp: false } },
        ],
      },
      {
        name: 'Stop',
        steps: [
          { action: 'Start', set: { temp: 20, start: true }, waitMs: 200, expect: { heater: true } },
          { action: 'Stop', set: { start: false, stop: true }, waitMs: 200, expect: { heater: false, cooling: false } },
        ],
      },
    ],
  },
  {
    slug: 'automatic-soap-dispenser-sensor',
    title: 'Automatic soap or sanitiser dispenser logic (sensor, one dose per hand)',
    description: 'Give exactly one dose per hand: a pulse on the sensor edge, no repeat until the hand is removed, and a low-level lockout. Arduino/PLC logic you can run.',
    answer:
      'Trigger the pump with the rising edge of the hand sensor and run it for a fixed time with a pulse timer. Because it reacts to the edge, holding the hand under the sensor gives one dose; the hand must leave and come back for another.',
    level: 'beginner',
    explanation: `- **Pulse timer** (0.5 s) on the hand sensor: it starts on the rising edge and runs its fixed time, however long the hand stays.
- **Low level** blocks dispensing and lights a refill lamp, so the pump never runs dry.

The same "one action per detection" pattern is used for hand dryers with a maximum run time, automatic taps and vending machine coin acceptors.`,
    circuit: `circuit "Soap dispenser" version 1 {
  hand: INPUT(label="Hand detected")
  low: INPUT(label="Soap level low")
  hasSoap: NOT(label="Soap available")
  request: AND(label="Hand and soap")
  dose: PULSE_TIMER(label="Dose time", duration=500)
  pump: OUTPUT(label="Pump")
  refill: OUTPUT(label="Refill lamp")
  low.Q -> hasSoap.A
  hand.Q -> request.A
  hasSoap.Q -> request.B
  request.Q -> dose.A
  dose.Q -> pump.A
  low.Q -> refill.A
}`,
    inputs: [
      { id: 'hand', type: 'INPUT', label: 'Hand detected', device: 'IR proximity sensor' },
      { id: 'low', type: 'INPUT', label: 'Soap level low', device: 'Level switch in the reservoir' },
    ],
    outputs: [
      { id: 'pump', type: 'OUTPUT', label: 'Pump', device: 'Small pump or solenoid' },
      { id: 'refill', type: 'OUTPUT', label: 'Refill lamp', device: 'LED' },
    ],
    tryIt: ['Switch Hand detected ON and keep it on: one 0.5 s dose.', 'Switch it OFF and ON: another dose.', 'Switch Soap level low ON: no dose, refill lamp.'],
    steps: [
      { title: 'Edge-triggered dose', text: 'A pulse timer gives a fixed dose per detection.' },
      { title: 'Low-level lockout', text: 'AND with NOT low.' },
    ],
    mistakes: [
      'Running the pump while the sensor is covered: a hand left under it empties the reservoir.',
      'A retriggerable timer: moving the hand slightly gives several doses.',
      'IR sensors seeing reflections from the basin; adjust the range.',
    ],
    faq: [
      { q: 'How do I build it on an Arduino?', a: 'Read the IR sensor on a digital pin, drive the pump through a MOSFET or relay, and use the generated sketch; it times the dose with millis().' },
      { q: 'How do I count doses for maintenance?', a: 'Count the rising edges of the pump output with a counter and alert after a number of doses.' },
    ],
    blocks: ['PULSE_TIMER', 'AND', 'NOT'],
    challenges: ['one-shot-valve'],
    scenarios: [
      {
        name: 'Doses',
        steps: [
          { action: 'Hand under the sensor', set: { hand: true }, waitMs: 200, expect: { pump: true } },
          { action: 'Hand stays 2 s', waitMs: 2000, expect: { pump: false } },
          { action: 'Hand removed', set: { hand: false }, waitMs: 300 },
          { action: 'Hand again', set: { hand: true }, waitMs: 200, expect: { pump: true } },
          { action: 'Removed', set: { hand: false }, waitMs: 600 },
          { action: 'Soap low, hand', set: { low: true, hand: true }, waitMs: 300, expect: { pump: false, refill: true } },
        ],
      },
    ],
  },
  {
    slug: 'flow-meter-pulse-totalizer-batch',
    title: 'How to totalise a pulse flow meter and stop at a batch volume',
    description: 'Count flow meter pulses, convert them to litres with a math block, and close the valve when the batch volume is reached. PLC logic with a live demo.',
    answer:
      'Count the pulses from the flow meter, multiply the count by the volume per pulse, and close the valve when the total reaches the batch volume. Reset the count at the start of every batch.',
    level: 'intermediate',
    explanation: `A pulse-output flow meter gives one pulse per fixed volume (here **10 L per pulse**).

- **Counter**: counts pulses; its value is reset at the start of each batch.
- **Litres** = count × 10 (math block).
- **Batch** latch: Start sets it, Stop or "volume reached" resets it.
- **Valve** = batch.
- **Reached** = litres ≥ 100.

The counter is reset by the rising edge of Start, so the new batch begins from zero in the same scan that opens the valve.`,
    circuit: `circuit "Flow totaliser" version 1 {
  pulse: INPUT(label="Flow meter pulse")
  start: INPUT(label="Start batch")
  stop: INPUT(label="Stop")
  newBatch: R_TRIG(label="New batch")
  pulses: COUNTER(label="Pulses", limit=100000)
  litres: MATH_EXPRESSION(label="Litres", expr="A * 10")
  target: ANALOG_CONSTANT(label="Batch 100 L", value=100)
  reached: ANALOG_COMPARATOR(label="Batch reached", operation="gte")
  stopOrDone: OR(label="Stop or reached")
  batch: RS_LATCH(label="Batch running")
  valve: OUTPUT(label="Batch valve")
  volume: ANALOG_OUTPUT(label="Volume (L)")
  done: OUTPUT(label="Batch done")
  start.Q -> newBatch.A
  pulse.Q -> pulses.CU
  newBatch.Q -> pulses.R
  pulses.CV -> litres.A
  litres.Q -> reached.A
  target.Q -> reached.B
  stop.Q -> stopOrDone.A
  reached.Q -> stopOrDone.B
  newBatch.Q -> batch.S
  stopOrDone.Q -> batch.R
  batch.Q -> valve.A
  litres.Q -> volume.A
  reached.Q -> done.A
}`,
    inputs: [
      { id: 'pulse', type: 'INPUT', label: 'Flow meter pulse', device: 'Pulse output of the flow meter (10 L/pulse)' },
      { id: 'start', type: 'INPUT', label: 'Start batch', device: 'Push button or batch system' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
    ],
    outputs: [
      { id: 'valve', type: 'OUTPUT', label: 'Batch valve', device: 'Solenoid or actuated valve' },
      { id: 'volume', type: 'ANALOG_OUTPUT', label: 'Volume (L)', device: 'HMI value' },
      { id: 'done', type: 'OUTPUT', label: 'Batch done', device: 'Indicator' },
    ],
    tryIt: ['Switch to "Function blocks". Switch Start on and off: the valve opens.', 'Pulse the flow meter input ten times: 100 L, the valve closes.'],
    steps: [
      { title: 'Count pulses', text: 'Up counter on the meter pulse.' },
      { title: 'Scale', text: 'Volume = count × litres per pulse.' },
      { title: 'Stop at the target', text: 'A comparator resets the batch latch.' },
      { title: 'Reset per batch', text: 'The start edge clears the count.' },
    ],
    mistakes: [
      'Pulses faster than the scan time are lost: use a high-speed counter input for fast meters.',
      'Not accounting for the volume that flows while the valve closes; stop a little early or learn the overrun.',
      'Resetting the totaliser that the plant uses for accounting; keep a separate, never-reset total.',
    ],
    faq: [
      { q: 'How do I get the flow rate?', a: 'Count pulses over a fixed time window (for example per second) or measure the time between pulses, then scale.' },
      { q: 'Can I use a 4–20 mA flow meter instead?', a: 'Then integrate the flow: add flow × scan time to a total every scan, or let the meter totalise and read its pulse output.' },
    ],
    blocks: ['COUNTER', 'MATH_EXPRESSION', 'ANALOG_COMPARATOR', 'R_TRIG', 'RS_LATCH', 'OR'],
    challenges: ['batch-counter', 'sensor-scaling'],
    scenarios: [
      {
        name: 'One 100 L batch',
        steps: [
          { action: 'Start', set: { start: true }, waitMs: 200, expect: { valve: true, volume: 0 } },
          { action: 'Pulse 1', set: { start: false, pulse: true }, waitMs: 100 },
          { action: 'Gap', set: { pulse: false }, waitMs: 100 },
          { action: 'Pulse 2', set: { pulse: true }, waitMs: 100 },
          { action: 'Gap', set: { pulse: false }, waitMs: 100 },
          { action: 'Pulse 3', set: { pulse: true }, waitMs: 100 },
          { action: 'Gap', set: { pulse: false }, waitMs: 100 },
          { action: 'Pulse 4', set: { pulse: true }, waitMs: 100 },
          { action: 'Gap', set: { pulse: false }, waitMs: 100 },
          { action: 'Pulse 5', set: { pulse: true }, waitMs: 100 },
          { action: 'Gap', set: { pulse: false }, waitMs: 100 },
          { action: 'Pulse 6', set: { pulse: true }, waitMs: 100 },
          { action: 'Gap', set: { pulse: false }, waitMs: 100 },
          { action: 'Pulse 7', set: { pulse: true }, waitMs: 100 },
          { action: 'Gap', set: { pulse: false }, waitMs: 100 },
          { action: 'Pulse 8', set: { pulse: true }, waitMs: 100 },
          { action: 'Gap', set: { pulse: false }, waitMs: 100 },
          { action: 'Pulse 9', set: { pulse: true }, waitMs: 100 },
          { action: 'Gap', set: { pulse: false }, waitMs: 100, expect: { volume: 90, valve: true, done: false } },
          { action: 'Pulse 10', set: { pulse: true }, waitMs: 100, expect: { volume: 100, valve: false, done: true } },
          { action: 'Next batch starts from zero', set: { pulse: false, start: true }, waitMs: 200, expect: { volume: 0, valve: true, done: false } },
          { action: 'Stop', set: { start: false, stop: true }, waitMs: 200, expect: { valve: false } },
        ],
      },
    ],
  },
  {
    slug: 'co2-demand-controlled-ventilation',
    title: 'How to program CO2 demand-controlled ventilation (two-speed fan)',
    description: 'Run a ventilation fan at low speed above 800 ppm CO2 and high speed above 1200 ppm, with hysteresis and a speed interlock. Building automation logic.',
    answer:
      'Measure CO2 in the room and ventilate only as much as needed: low speed from 800 ppm, high speed from 1200 ppm, each switching off a little lower. The two speed outputs of the motor are interlocked so they are never energised together.',
    level: 'beginner',
    explanation: `CO2 is a good indicator of how many people are in a room and how stale the air is. Ventilating on demand saves a lot of heating and cooling energy compared with running the fan all day.

- **Low band**: on at **800 ppm** or above, off at **700 ppm** or below.
- **High band**: on at **1200 ppm** or above, off at **1000 ppm** or below.
- **High speed** = high band. **Low speed** = low band AND NOT high band.

A two-speed motor (Dahlander or separate windings) must never have both speed contactors closed, which the logic guarantees: low speed is blocked while high speed is requested.`,
    circuit: `circuit "CO2 ventilation" version 1 {
  co2: ANALOG_INPUT(label="CO2 (ppm)", value=600)
  lowBand: ANALOG_DIFFERENTIAL(label="Low: on 800 / off 700", onThreshold=800, offThreshold=700)
  highBand: ANALOG_DIFFERENTIAL(label="High: on 1200 / off 1000", onThreshold=1200, offThreshold=1000)
  notHigh: NOT(label="Not high speed")
  lowLogic: AND(label="Low speed")
  fanLow: OUTPUT(label="Fan low speed")
  fanHigh: OUTPUT(label="Fan high speed")
  co2.Q -> lowBand.A
  co2.Q -> highBand.A
  highBand.Q -> notHigh.A
  lowBand.Q -> lowLogic.A
  notHigh.Q -> lowLogic.B
  lowLogic.Q -> fanLow.A
  highBand.Q -> fanHigh.A
}`,
    inputs: [{ id: 'co2', type: 'ANALOG_INPUT', label: 'CO2 (ppm)', device: 'NDIR CO2 sensor, 0–10 V or 4–20 mA' }],
    outputs: [
      { id: 'fanLow', type: 'OUTPUT', label: 'Fan low speed', device: 'Low-speed contactor' },
      { id: 'fanHigh', type: 'OUTPUT', label: 'Fan high speed', device: 'High-speed contactor' },
    ],
    tryIt: ['Press Run and raise CO2 to 850 ppm: low speed.', 'Raise to 1250 ppm: high speed (low speed drops out).', 'Lower to 900 ppm: back to low speed; 650 ppm: off.'],
    steps: [
      { title: 'Two bands', text: 'High triggers with a gap between on and off.' },
      { title: 'Interlock the speeds', text: 'Low speed only when high speed is not requested.' },
    ],
    mistakes: [
      'Switching from high to low speed instantly on a large motor: add a short pause so it slows down first.',
      'A CO2 sensor placed near a window or the air supply, which reads too low.',
      'No minimum fresh air: many codes require a base ventilation rate whenever the building is occupied.',
    ],
    faq: [
      { q: 'What CO2 level is acceptable?', a: 'Outdoor air is about 420 ppm. Below roughly 1000 ppm indoors is generally considered good; many standards aim for 800–1000 ppm in classrooms and offices.' },
      { q: 'Can I use a VFD instead of two speeds?', a: 'Yes: map CO2 to a speed reference (for example 800 ppm = 30 %, 1200 ppm = 100 %) with a scaling block, or use a PI controller.' },
    ],
    blocks: ['ANALOG_DIFFERENTIAL', 'AND', 'NOT', 'ANALOG_AMPLIFIER'],
    challenges: ['tank-level'],
    never: [{ when: { fanLow: true, fanHigh: true }, message: 'Both speeds were energised' }],
    scenarios: [
      {
        name: 'Occupancy rising and falling',
        steps: [
          { action: '600 ppm', set: { co2: 600 }, waitMs: 200, expect: { fanLow: false, fanHigh: false } },
          { action: '850 ppm', set: { co2: 850 }, waitMs: 200, expect: { fanLow: true, fanHigh: false } },
          { action: '1250 ppm', set: { co2: 1250 }, waitMs: 200, expect: { fanLow: false, fanHigh: true } },
          { action: '1100 ppm', set: { co2: 1100 }, waitMs: 200, expect: { fanHigh: true } },
          { action: '900 ppm', set: { co2: 900 }, waitMs: 200, expect: { fanHigh: false, fanLow: true } },
          { action: '750 ppm', set: { co2: 750 }, waitMs: 200, expect: { fanLow: true } },
          { action: '650 ppm', set: { co2: 650 }, waitMs: 200, expect: { fanLow: false } },
        ],
      },
    ],
  },
  {
    slug: 'conveyor-pre-start-warning-horn',
    title: 'How to add a pre-start warning horn and pull-cord stop to a conveyor',
    description: 'Sound a warning horn for 3 s before a conveyor starts, stop it with a latched pull-cord switch, and require a reset. Conveyor safety logic you can run.',
    answer:
      'When Start is pressed, sound the warning horn for a few seconds first and only then start the conveyor, so anyone near it can step away. A pull-cord along the conveyor stops it at once and stays tripped until the cord is reset and the fault acknowledged.',
    level: 'intermediate',
    explanation: `- **Pull cord** latch: set when the cord is pulled; reset only with the Reset button *and* the cord switch back in its normal position.
- **Start request** latch: Start sets it (not while tripped); Stop or the pull cord resets it.
- **Warning time**: an on-delay (3 s) on the start request. **Horn** = request AND NOT warning done; **conveyor** = request AND warning done.

Long conveyors where the operator cannot see the whole belt require a start warning in many regulations (for example in mining and bulk handling), and pull-cord switches along the full length.`,
    circuit: `circuit "Conveyor start warning" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  cord: INPUT(label="Pull cord pulled")
  reset: INPUT(label="Reset")
  cordOk: NOT(label="Cord in normal position")
  resetOk: AND(label="Reset allowed")
  tripped: RS_LATCH(label="Pull cord tripped")
  notTripped: NOT(label="Not tripped")
  canStart: AND(label="Start allowed")
  stopOrCord: OR(label="Stop or tripped")
  request: RS_LATCH(label="Start request")
  warning: TON(label="Warning time", duration=3000)
  notWarned: NOT(label="Warning running")
  hornLogic: AND(label="Horn")
  runLogic: AND(label="Run")
  horn: OUTPUT(label="Warning horn")
  conveyor: OUTPUT(label="Conveyor")
  cordLamp: OUTPUT(label="Pull cord tripped lamp")
  cord.Q -> cordOk.A
  reset.Q -> resetOk.A
  cordOk.Q -> resetOk.B
  cord.Q -> tripped.S
  resetOk.Q -> tripped.R
  tripped.Q -> notTripped.A
  start.Q -> canStart.A
  notTripped.Q -> canStart.B
  stop.Q -> stopOrCord.A
  tripped.Q -> stopOrCord.B
  canStart.Q -> request.S
  stopOrCord.Q -> request.R
  request.Q -> warning.A
  warning.Q -> notWarned.A
  request.Q -> hornLogic.A
  notWarned.Q -> hornLogic.B
  request.Q -> runLogic.A
  warning.Q -> runLogic.B
  hornLogic.Q -> horn.A
  runLogic.Q -> conveyor.A
  tripped.Q -> cordLamp.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'cord', type: 'INPUT', label: 'Pull cord pulled', device: 'Pull-cord switch status (via the safety relay)' },
      { id: 'reset', type: 'INPUT', label: 'Reset', device: 'Reset push button' },
    ],
    outputs: [
      { id: 'horn', type: 'OUTPUT', label: 'Warning horn', device: 'Horn or siren along the conveyor' },
      { id: 'conveyor', type: 'OUTPUT', label: 'Conveyor', device: 'Conveyor starter' },
      { id: 'cordLamp', type: 'OUTPUT', label: 'Pull cord tripped lamp', device: 'Indicator' },
    ],
    tryIt: ['Switch Start on and off: the horn sounds 3 s, then the conveyor runs.', 'Switch Pull cord pulled ON: the conveyor stops. Switch it OFF: still stopped.', 'Pulse Reset, then Start again.'],
    steps: [
      { title: 'Latch the start request', text: 'Not while the pull cord is tripped.' },
      { title: 'Warn first', text: 'Horn during the warning time, conveyor after.' },
      { title: 'Latch the pull cord', text: 'Reset only with the cord back to normal.' },
    ],
    mistakes: [
      'Starting the conveyor together with the horn instead of after it.',
      'A pull cord that resets itself: the conveyor restarts while someone is still working on it.',
      'Pull-cord and emergency stop circuits are safety functions and need safety-rated hardware; the PLC handles the sequence and indication.',
    ],
    faq: [
      { q: 'How long should the warning be?', a: 'Long enough for a person to hear it and move away; 5–10 seconds is common on long conveyors, sometimes with a flashing beacon as well.' },
      { q: 'Should the horn sound again after a short stop?', a: 'Yes: every start, including restarts after a fault, should go through the warning.' },
    ],
    blocks: ['TON', 'RS_LATCH', 'AND', 'OR', 'NOT'],
    challenges: ['delayed-fan', 'guarded-machine'],
    never: [{ when: { conveyor: true, horn: true }, message: 'The horn and conveyor were on together' }],
    scenarios: [
      {
        name: 'Start with warning, pull cord',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 200, expect: { horn: true, conveyor: false } },
          { action: 'Warning 2.5 s', set: { start: false }, waitMs: 2300, expect: { horn: true, conveyor: false } },
          { action: 'Warning over', waitMs: 700, expect: { horn: false, conveyor: true } },
          { action: 'Pull cord', set: { cord: true }, waitMs: 200, expect: { conveyor: false, cordLamp: true } },
          { action: 'Reset while the cord is still pulled', set: { reset: true }, waitMs: 200, expect: { cordLamp: true } },
          { action: 'Cord back, Start without reset', set: { reset: false, cord: false, start: true }, waitMs: 300, expect: { conveyor: false, horn: false } },
          { action: 'Reset', set: { start: false, reset: true }, waitMs: 200, expect: { cordLamp: false, conveyor: false } },
          { action: 'Start: warning again', set: { reset: false, start: true }, waitMs: 200, expect: { horn: true } },
          { action: 'Stop during the warning', set: { start: false, stop: true }, waitMs: 200, expect: { horn: false, conveyor: false } },
        ],
      },
    ],
  },
];
