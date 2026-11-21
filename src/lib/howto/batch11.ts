import type { HowTo } from './types.ts';

/** Eleventh batch of how-to guides. Verified by tests/howto.test.ts. */
export const HOW_TOS_BATCH_11: HowTo[] = [
  {
    slug: 'first-out-alarm-trip-indication',
    title: 'How to program first-out (first-up) alarm indication for trips',
    description: 'When several trips follow each other in a shutdown, show which one came first: first-out latches that lock each other out, with a reset. Live PLC logic.',
    answer:
      'Give every trip its own "first" latch that can only be set while no other first latch is set. The trip that arrives first sets its latch and blocks the others, so the panel shows the root cause even after a cascade of follow-on trips. Reset clears the latches once all trips are healthy.',
    level: 'intermediate',
    explanation: `When a machine trips, one fault usually causes others within milliseconds: low oil pressure stops a compressor, which then shows low discharge pressure and high temperature too. The **first-out** shows what started it.

- **First A** latch: Set = trip A AND no first-out yet. Likewise for B and C.
- "No first-out yet" uses the first-out latches from the previous scan (one-scan delay), because the latches depend on each other.
- **Shutdown** latch: set by any trip, reset by Reset when all trips are healthy.
- **Reset** clears the first-out latches under the same condition.

Two trips in the very same scan both latch; the scan time is the resolution. Dedicated sequence-of-events recorders timestamp to the millisecond when that matters.`,
    circuit: `circuit "First-out indication" version 1 {
  tripA: INPUT(label="Trip A: low oil pressure")
  tripB: INPUT(label="Trip B: high temperature")
  tripC: INPUT(label="Trip C: vibration")
  reset: INPUT(label="Reset")
  ab: OR(label="A or B")
  any: OR(label="Any trip")
  healthy: NOT(label="All healthy")
  resetOk: AND(label="Reset allowed")
  firstPrev: SCAN_DELAY(label="First-out set (last scan)")
  noneYet: NOT(label="No first-out yet")
  setA: AND(label="A first")
  setB: AND(label="B first")
  setC: AND(label="C first")
  firstA: RS_LATCH(label="First-out A")
  firstB: RS_LATCH(label="First-out B")
  firstC: RS_LATCH(label="First-out C")
  fab: OR(label="First A or B")
  anyFirst: OR(label="Any first-out")
  shutdown: RS_LATCH(label="Shutdown")
  lampA: OUTPUT(label="First-out A lamp")
  lampB: OUTPUT(label="First-out B lamp")
  lampC: OUTPUT(label="First-out C lamp")
  stopped: OUTPUT(label="Machine tripped")
  tripA.Q -> ab.A
  tripB.Q -> ab.B
  ab.Q -> any.A
  tripC.Q -> any.B
  any.Q -> healthy.A
  reset.Q -> resetOk.A
  healthy.Q -> resetOk.B
  anyFirst.Q -> firstPrev.A
  firstPrev.Q -> noneYet.A
  tripA.Q -> setA.A
  noneYet.Q -> setA.B
  tripB.Q -> setB.A
  noneYet.Q -> setB.B
  tripC.Q -> setC.A
  noneYet.Q -> setC.B
  setA.Q -> firstA.S
  resetOk.Q -> firstA.R
  setB.Q -> firstB.S
  resetOk.Q -> firstB.R
  setC.Q -> firstC.S
  resetOk.Q -> firstC.R
  firstA.Q -> fab.A
  firstB.Q -> fab.B
  fab.Q -> anyFirst.A
  firstC.Q -> anyFirst.B
  any.Q -> shutdown.S
  resetOk.Q -> shutdown.R
  firstA.Q -> lampA.A
  firstB.Q -> lampB.A
  firstC.Q -> lampC.A
  shutdown.Q -> stopped.A
}`,
    inputs: [
      { id: 'tripA', type: 'INPUT', label: 'Trip A: low oil pressure', device: 'Trip contact' },
      { id: 'tripB', type: 'INPUT', label: 'Trip B: high temperature', device: 'Trip contact' },
      { id: 'tripC', type: 'INPUT', label: 'Trip C: vibration', device: 'Trip contact' },
      { id: 'reset', type: 'INPUT', label: 'Reset', device: 'Reset push button' },
    ],
    outputs: [
      { id: 'lampA', type: 'OUTPUT', label: 'First-out A lamp', device: 'Annunciator window' },
      { id: 'lampB', type: 'OUTPUT', label: 'First-out B lamp', device: 'Annunciator window' },
      { id: 'lampC', type: 'OUTPUT', label: 'First-out C lamp', device: 'Annunciator window' },
      { id: 'stopped', type: 'OUTPUT', label: 'Machine tripped', device: 'Shutdown command' },
    ],
    tryIt: ['Switch Trip B ON, then Trip A and C: only the B first-out lamp lights.', 'Clear all trips and pulse Reset.', 'Try a different order.'],
    steps: [
      { title: 'One latch per trip', text: 'Set by the trip, only if no first-out is set yet.' },
      { title: 'Block the others', text: 'The OR of all first-out latches, from the previous scan, blocks new ones.' },
      { title: 'Reset when healthy', text: 'Clear the latches and the shutdown when no trip is active.' },
    ],
    mistakes: [
      'Showing all active trips the same way, so the root cause is lost in the cascade.',
      'Allowing reset while a trip is still active.',
      'Slow scan times on fast cascades; use timestamped inputs where milliseconds matter.',
    ],
    faq: [
      { q: 'What is the difference with a normal alarm list?', a: 'An alarm list shows everything that is active; the first-out shows which trip started the shutdown, which is what the operator needs to fix first.' },
      { q: 'How many trips can this handle?', a: 'Any number: add a latch per trip and include it in the "any first-out" OR.' },
    ],
    blocks: ['RS_LATCH', 'SCAN_DELAY', 'AND', 'OR', 'NOT'],
    challenges: ['door-alarm', 'guarded-machine'],
    scenarios: [
      {
        name: 'Cascade starting with B',
        steps: [
          { action: 'Running', waitMs: 300, expect: { stopped: false, lampA: false, lampB: false, lampC: false } },
          { action: 'Trip B', set: { tripB: true }, waitMs: 200, expect: { stopped: true, lampB: true } },
          { action: 'Trip A follows', set: { tripA: true }, waitMs: 200, expect: { lampA: false, lampB: true } },
          { action: 'Trip C follows', set: { tripC: true }, waitMs: 200, expect: { lampC: false } },
          { action: 'Reset while tripped', set: { reset: true }, waitMs: 200, expect: { lampB: true, stopped: true } },
          { action: 'All clear', set: { reset: false, tripA: false, tripB: false, tripC: false }, waitMs: 200, expect: { lampB: true, stopped: true } },
          { action: 'Reset', set: { reset: true }, waitMs: 200, expect: { lampB: false, stopped: false } },
        ],
      },
      {
        name: 'Cascade starting with C, then A',
        steps: [
          { action: 'Trip C', set: { tripC: true }, waitMs: 200, expect: { lampC: true } },
          { action: 'Trip B', set: { tripB: true }, waitMs: 200, expect: { lampB: false } },
          { action: 'Clear and reset', set: { tripB: false, tripC: false, reset: true }, waitMs: 200, expect: { lampC: false } },
          { action: 'Trip A first', set: { reset: false, tripA: true }, waitMs: 200, expect: { lampA: true, lampC: false } },
          { action: 'Trip C after A', set: { tripC: true }, waitMs: 200, expect: { lampC: false } },
          { action: 'C clears, reset with A still active', set: { tripC: false, reset: true }, waitMs: 200, expect: { lampA: true, stopped: true } },
          { action: 'A clears, C returns, reset', set: { tripA: false, tripC: true }, waitMs: 200, expect: { lampA: true, stopped: true } },
          { action: 'All clear, reset', set: { tripC: false }, waitMs: 200, expect: { lampA: false, stopped: false } },
        ],
      },
    ],
  },
  {
    slug: 'quiz-buzzer-first-to-press-plc',
    title: 'Quiz buzzer (first to press wins) in PLC or Arduino logic',
    description: 'Game show buzzer: the first player to press lights their lamp, sounds the buzzer and locks out everyone else until the host resets. Logic you can run.',
    answer:
      'Give each player a latch that can only be set while no player has won yet. The first press sets that player\'s latch, sounds the buzzer briefly and locks out the others; the host\'s reset clears everything for the next question.',
    level: 'beginner',
    explanation: `This is the first-out pattern from industrial alarm panels, used for a game.

- **Player n wins** latch: Set = button n AND nobody has won yet. Reset = host reset.
- "Nobody has won yet" uses the winners from the previous scan (one-scan delay).
- **Buzzer**: a 1 s pulse on the rising edge of "someone won".

Players who press after the winner are ignored, and holding a button down before the question does not help, because a held button wins only if no one else has; to stop players from holding their button, many buzzers only accept a press after the host's "go" signal.`,
    circuit: `circuit "Quiz buzzer" version 1 {
  p1: INPUT(label="Player 1 button")
  p2: INPUT(label="Player 2 button")
  p3: INPUT(label="Player 3 button")
  host: INPUT(label="Host reset")
  wonPrev: SCAN_DELAY(label="Someone won (last scan)")
  open: NOT(label="Nobody has won")
  set1: AND(label="Player 1 first")
  set2: AND(label="Player 2 first")
  set3: AND(label="Player 3 first")
  win1: RS_LATCH(label="Player 1 wins")
  win2: RS_LATCH(label="Player 2 wins")
  win3: RS_LATCH(label="Player 3 wins")
  w12: OR(label="1 or 2 won")
  anyWin: OR(label="Someone won")
  newWin: R_TRIG(label="New winner")
  beep: PULSE_TIMER(label="Buzzer time", duration=1000)
  lamp1: OUTPUT(label="Player 1 lamp")
  lamp2: OUTPUT(label="Player 2 lamp")
  lamp3: OUTPUT(label="Player 3 lamp")
  buzzer: OUTPUT(label="Buzzer")
  anyWin.Q -> wonPrev.A
  wonPrev.Q -> open.A
  p1.Q -> set1.A
  open.Q -> set1.B
  p2.Q -> set2.A
  open.Q -> set2.B
  p3.Q -> set3.A
  open.Q -> set3.B
  set1.Q -> win1.S
  host.Q -> win1.R
  set2.Q -> win2.S
  host.Q -> win2.R
  set3.Q -> win3.S
  host.Q -> win3.R
  win1.Q -> w12.A
  win2.Q -> w12.B
  w12.Q -> anyWin.A
  win3.Q -> anyWin.B
  anyWin.Q -> newWin.A
  newWin.Q -> beep.A
  win1.Q -> lamp1.A
  win2.Q -> lamp2.A
  win3.Q -> lamp3.A
  beep.Q -> buzzer.A
}`,
    inputs: [
      { id: 'p1', type: 'INPUT', label: 'Player 1 button', device: 'Big push button' },
      { id: 'p2', type: 'INPUT', label: 'Player 2 button', device: 'Big push button' },
      { id: 'p3', type: 'INPUT', label: 'Player 3 button', device: 'Big push button' },
      { id: 'host', type: 'INPUT', label: 'Host reset', device: 'Host push button' },
    ],
    outputs: [
      { id: 'lamp1', type: 'OUTPUT', label: 'Player 1 lamp', device: 'Lamp or LED' },
      { id: 'lamp2', type: 'OUTPUT', label: 'Player 2 lamp', device: 'Lamp or LED' },
      { id: 'lamp3', type: 'OUTPUT', label: 'Player 3 lamp', device: 'Lamp or LED' },
      { id: 'buzzer', type: 'OUTPUT', label: 'Buzzer', device: 'Buzzer' },
    ],
    tryIt: ['Click Player 2: their lamp lights and the buzzer sounds.', 'Click Players 1 and 3: nothing happens.', 'Pulse Host reset for the next question.'],
    steps: [
      { title: 'One latch per player', text: 'Set by the button only while nobody has won.' },
      { title: 'Lock out the others', text: 'The OR of all winners (previous scan) blocks new winners.' },
      { title: 'Buzz once', text: 'Pulse timer on the rising edge of "someone won".' },
      { title: 'Reset', text: 'The host clears all latches.' },
    ],
    mistakes: [
      'Without the lockout, every player who presses lights up.',
      'Driving the buzzer from the winner latch: it sounds until the host resets.',
      'On Arduino, using delay() for the buzzer, which can miss presses.',
    ],
    faq: [
      { q: 'What if two players press at exactly the same time?', a: 'If both presses land in the same scan, both win. With a fast scan (an Arduino loop runs in microseconds) that is very rare; you can also break ties with a fixed priority.' },
      { q: 'How do I add more players?', a: 'Add a button, a set gate and a latch per player, and include the latch in the "someone won" OR.' },
    ],
    blocks: ['RS_LATCH', 'SCAN_DELAY', 'R_TRIG', 'PULSE_TIMER', 'AND', 'OR', 'NOT'],
    challenges: ['door-alarm'],
    scenarios: [
      {
        name: 'Two rounds',
        steps: [
          { action: 'Player 2 presses first', set: { p2: true }, waitMs: 200, expect: { lamp2: true, buzzer: true } },
          { action: 'Players 1 and 3 press later', set: { p1: true, p3: true }, waitMs: 300, expect: { lamp1: false, lamp3: false, lamp2: true } },
          { action: 'Buzzer stops after 1 s', set: { p1: false, p2: false, p3: false }, waitMs: 1000, expect: { buzzer: false, lamp2: true } },
          { action: 'Host reset', set: { host: true }, waitMs: 200, expect: { lamp2: false } },
          { action: 'Player 3 wins round 2', set: { host: false, p3: true }, waitMs: 200, expect: { lamp3: true, buzzer: true } },
          { action: 'Player 1 presses later', set: { p1: true }, waitMs: 200, expect: { lamp1: false } },
          { action: 'Host reset, player 1 wins round 3', set: { p3: false, p1: false, host: true }, waitMs: 200 },
          { action: 'Player 1', set: { host: false, p1: true }, waitMs: 200, expect: { lamp1: true } },
          { action: 'Player 2 presses later', set: { p2: true }, waitMs: 200, expect: { lamp2: false } },
          { action: 'Host reset', set: { p1: false, p2: false, host: true }, waitMs: 200, expect: { lamp1: false } },
        ],
      },
    ],
  },
  {
    slug: 'people-counter-direction-two-sensors',
    title: 'How to count people in and out with two sensors (direction detection)',
    description: 'Two light beams one after the other tell entering from leaving: count up when A breaks before B, down when B breaks before A, and light FULL at capacity.',
    answer:
      'Place two beams a short distance apart in the doorway. When the inner beam breaks while the outer beam is still broken, someone is entering; when the outer beam breaks while the inner one is still broken, someone is leaving. An up/down counter keeps the occupancy.',
    level: 'intermediate',
    explanation: `Beam **A** is outside, beam **B** inside, closer together than a person is deep.

- **Entering**: A breaks, then B breaks while A is still broken. Detect it as the **rising edge of B AND A**.
- **Leaving**: B breaks, then A breaks while B is still broken: **rising edge of A AND B**.
- An **up/down counter** counts entries on CU and exits on CD. Its limit (5 here) is the capacity; Q lights the **FULL** sign.

Using the edges makes each passage count once. Someone who steps into beam A and backs out never breaks B, so nothing is counted.`,
    circuit: `circuit "People counter" version 1 {
  a: INPUT(label="Outer beam A broken")
  b: INPUT(label="Inner beam B broken")
  reset: INPUT(label="Reset count")
  bEdge: R_TRIG(label="B just broke")
  aEdge: R_TRIG(label="A just broke")
  entering: AND(label="Entering")
  leaving: AND(label="Leaving")
  people: COUNTER(label="People inside", limit=5)
  occupancy: ANALOG_OUTPUT(label="People inside")
  full: OUTPUT(label="FULL sign")
  b.Q -> bEdge.A
  a.Q -> aEdge.A
  bEdge.Q -> entering.A
  a.Q -> entering.B
  aEdge.Q -> leaving.A
  b.Q -> leaving.B
  entering.Q -> people.CU
  leaving.Q -> people.CD
  reset.Q -> people.R
  people.CV -> occupancy.A
  people.Q -> full.A
}`,
    inputs: [
      { id: 'a', type: 'INPUT', label: 'Outer beam A broken', device: 'Through-beam or reflex sensor, outer' },
      { id: 'b', type: 'INPUT', label: 'Inner beam B broken', device: 'Through-beam or reflex sensor, inner' },
      { id: 'reset', type: 'INPUT', label: 'Reset count', device: 'Push button (e.g. at closing time)' },
    ],
    outputs: [
      { id: 'occupancy', type: 'ANALOG_OUTPUT', label: 'People inside', device: 'Display' },
      { id: 'full', type: 'OUTPUT', label: 'FULL sign', device: 'Illuminated sign' },
    ],
    tryIt: ['Switch to "Function blocks". Enter: A on, B on, A off, B off.', 'Leave: B on, A on, B off, A off.', 'Enter five times: FULL.'],
    steps: [
      { title: 'Two beams', text: 'Outer A and inner B, closer than a person is deep.' },
      { title: 'Detect direction', text: 'Which beam breaks while the other is already broken.' },
      { title: 'Count', text: 'Up/down counter with the capacity as the limit.' },
    ],
    mistakes: [
      'Beams too far apart: a person clears A before breaking B and no direction is seen.',
      'Counting on the beam level instead of the edge.',
      'Two people walking side by side count as one; wide doors need more sensors or a 3D sensor.',
    ],
    faq: [
      { q: 'How do I stop the count going negative?', a: 'Only count down when the count is above zero (AND the leaving pulse with "count > 0"), and reset the count at closing time.' },
      { q: 'Can I use this for a car park?', a: 'Yes, with induction loops instead of beams; the car park counter guide uses separate entry and exit lanes instead.' },
    ],
    blocks: ['R_TRIG', 'COUNTER', 'AND'],
    challenges: ['batch-counter'],
    scenarios: [
      {
        name: 'In and out',
        steps: [
          { action: 'Entering: A', set: { a: true }, waitMs: 200 },
          { action: 'Entering: B', set: { b: true }, waitMs: 200, expect: { occupancy: 1 } },
          { action: 'Entering: A clears', set: { a: false }, waitMs: 200 },
          { action: 'Entering: B clears', set: { b: false }, waitMs: 200, expect: { occupancy: 1 } },
          { action: 'Leaving: B', set: { b: true }, waitMs: 200 },
          { action: 'Leaving: A', set: { a: true }, waitMs: 200, expect: { occupancy: 0 } },
          { action: 'Leaving: B clears', set: { b: false }, waitMs: 200 },
          { action: 'Leaving: A clears', set: { a: false }, waitMs: 200, expect: { occupancy: 0 } },
          { action: 'Someone steps into A and backs out', set: { a: true }, waitMs: 300 },
          { action: 'Backs out', set: { a: false }, waitMs: 300, expect: { occupancy: 0 } },
        ],
      },
      {
        name: 'Capacity',
        steps: [
          { action: 'Entry 1', set: { a: true }, waitMs: 100 }, { action: 'B', set: { b: true }, waitMs: 100 }, { action: 'Clear', set: { a: false, b: false }, waitMs: 100 },
          { action: 'Entry 2', set: { a: true }, waitMs: 100 }, { action: 'B', set: { b: true }, waitMs: 100 }, { action: 'Clear', set: { a: false, b: false }, waitMs: 100 },
          { action: 'Entry 3', set: { a: true }, waitMs: 100 }, { action: 'B', set: { b: true }, waitMs: 100 }, { action: 'Clear', set: { a: false, b: false }, waitMs: 100 },
          { action: 'Entry 4', set: { a: true }, waitMs: 100 }, { action: 'B', set: { b: true }, waitMs: 100 }, { action: 'Clear', set: { a: false, b: false }, waitMs: 100, expect: { full: false, occupancy: 4 } },
          { action: 'Entry 5', set: { a: true }, waitMs: 100 }, { action: 'B', set: { b: true }, waitMs: 100, expect: { full: true, occupancy: 5 } },
          { action: 'Reset', set: { a: false, b: false, reset: true }, waitMs: 200, expect: { full: false, occupancy: 0 } },
        ],
      },
    ],
  },
  {
    slug: 'lamp-test-indicator-lights-plc',
    title: 'How to add a lamp test button to a control panel (PLC)',
    description: 'A lamp test button lights every indicator so operators can spot a dead bulb before it hides an alarm. Simple PLC pattern with a horn test.',
    answer:
      'OR a lamp test input into every indicator output: each lamp shows its normal status, and all of them light while the test button is held. Add a short horn pulse on the test so the audible alarm is checked too.',
    level: 'beginner',
    explanation: `A failed bulb or LED looks exactly like "no alarm". Pressing **Lamp test** regularly proves every indicator works.

- **Each lamp** = its normal status OR lamp test.
- **Horn** = a 1 s pulse on the rising edge of lamp test, so the test does not deafen anyone and a stuck button does not sound the horn for ever.

Put the lamp test in the program in one place (an OR on each output), not by forcing outputs, so it cannot be left active by accident. Many panels also feed the lamp test to field devices such as stack lights.`,
    circuit: `circuit "Lamp test" version 1 {
  running: INPUT(label="Machine running")
  fault: INPUT(label="Fault")
  high: INPUT(label="Level high")
  test: INPUT(label="Lamp test button")
  runL: OR(label="Running or test")
  faultL: OR(label="Fault or test")
  highL: OR(label="Level high or test")
  testEdge: R_TRIG(label="Test pressed")
  hornTest: PULSE_TIMER(label="Horn test time", duration=1000)
  runLamp: OUTPUT(label="Running lamp")
  faultLamp: OUTPUT(label="Fault lamp")
  highLamp: OUTPUT(label="Level high lamp")
  horn: OUTPUT(label="Horn")
  running.Q -> runL.A
  test.Q -> runL.B
  fault.Q -> faultL.A
  test.Q -> faultL.B
  high.Q -> highL.A
  test.Q -> highL.B
  test.Q -> testEdge.A
  testEdge.Q -> hornTest.A
  runL.Q -> runLamp.A
  faultL.Q -> faultLamp.A
  highL.Q -> highLamp.A
  hornTest.Q -> horn.A
}`,
    inputs: [
      { id: 'running', type: 'INPUT', label: 'Machine running', device: 'Status' },
      { id: 'fault', type: 'INPUT', label: 'Fault', device: 'Status' },
      { id: 'high', type: 'INPUT', label: 'Level high', device: 'Status' },
      { id: 'test', type: 'INPUT', label: 'Lamp test button', device: 'Push button on the panel' },
    ],
    outputs: [
      { id: 'runLamp', type: 'OUTPUT', label: 'Running lamp', device: 'Green pilot light' },
      { id: 'faultLamp', type: 'OUTPUT', label: 'Fault lamp', device: 'Red pilot light' },
      { id: 'highLamp', type: 'OUTPUT', label: 'Level high lamp', device: 'Amber pilot light' },
      { id: 'horn', type: 'OUTPUT', label: 'Horn', device: 'Panel horn' },
    ],
    tryIt: ['Hold Lamp test: every lamp lights and the horn sounds for 1 s.', 'Release it: the lamps show their real status again.'],
    steps: [
      { title: 'OR into every lamp', text: 'Status OR lamp test.' },
      { title: 'Short horn test', text: 'A pulse on the button\'s rising edge.' },
    ],
    mistakes: [
      'Forgetting some lamps, which then fail unnoticed.',
      'A horn that sounds as long as the button is held.',
      'Implementing the test with output forcing, which can be left on.',
    ],
    faq: [
      { q: 'How often should lamps be tested?', a: 'Many sites test once per shift. With LEDs it matters less than with bulbs, but the test also checks wiring and output cards.' },
      { q: 'Should the lamp test also cover HMI alarms?', a: 'HMIs usually have their own test; the lamp test is for hard-wired indicators and horns.' },
    ],
    blocks: ['OR', 'R_TRIG', 'PULSE_TIMER'],
    challenges: ['door-alarm'],
    scenarios: [
      {
        name: 'Normal and test',
        steps: [
          { action: 'Running', set: { running: true }, waitMs: 200, expect: { runLamp: true, faultLamp: false, highLamp: false, horn: false } },
          { action: 'Fault', set: { fault: true }, waitMs: 200, expect: { faultLamp: true } },
          { action: 'Level high', set: { high: true }, waitMs: 200, expect: { highLamp: true } },
          { action: 'All clear, stopped', set: { running: false, fault: false, high: false }, waitMs: 200, expect: { runLamp: false, faultLamp: false, highLamp: false } },
          { action: 'Hold lamp test', set: { test: true }, waitMs: 300, expect: { runLamp: true, faultLamp: true, highLamp: true, horn: true } },
          { action: 'Still held after 1.5 s', waitMs: 1500, expect: { runLamp: true, horn: false } },
          { action: 'Released', set: { test: false }, waitMs: 200, expect: { runLamp: false, faultLamp: false, highLamp: false } },
        ],
      },
    ],
  },
];
