import type { HowTo } from './types.ts';

/** Seventh batch: core concepts with live examples, plus more classic programs. */
export const HOW_TOS_BATCH_7: HowTo[] = [
  {
    slug: 'what-is-ladder-logic-basics',
    title: 'What is ladder logic? Contacts, coils, series and parallel explained',
    description: 'Ladder logic basics with a live example: normally open and closed contacts, series (AND), parallel (OR) and coils, and how a PLC reads a rung.',
    answer:
      'Ladder logic is a PLC programming language drawn like an electrical relay diagram: two vertical power rails with horizontal rungs between them. Each rung has contacts (conditions) on the left and a coil (an output) on the right; the coil turns on when the contacts make a closed path.',
    level: 'beginner',
    explanation: `Ladder logic comes from relay control panels, which is why electricians can read it. In a PLC, nothing is wired: each symbol is an instruction.

| Symbol | Name | True when |
|---|---|---|
| ⊣ ⊢ | Normally open (NO) contact, XIC | the bit is ON |
| ⊣/⊢ | Normally closed (NC) contact, XIO | the bit is OFF |
| ( ) | Coil, OTE | written ON if the rung is true |

- Contacts **in series** form an **AND**: every one must be closed.
- Contacts **in parallel** form an **OR**: any branch can carry the power.
- An NC contact on a bit is a **NOT**.

The example has four rungs:

1. Lamp 1 = A AND B (series)
2. Lamp 2 = A OR B (parallel)
3. Lamp 3 = NOT A (NC contact)
4. Lamp 4 = A AND NOT B

The simulator opens in ladder view: click the contacts A and B and watch which rungs conduct.`,
    circuit: `circuit "Ladder logic basics" version 1 {
  a: INPUT(label="A")
  b: INPUT(label="B")
  series: AND(label="A and B")
  parallel: OR(label="A or B")
  notA: NOT(label="Not A")
  notB: NOT(label="Not B")
  aNotB: AND(label="A and not B")
  lamp1: OUTPUT(label="Lamp 1 (series)")
  lamp2: OUTPUT(label="Lamp 2 (parallel)")
  lamp3: OUTPUT(label="Lamp 3 (NC contact)")
  lamp4: OUTPUT(label="Lamp 4 (A and not B)")
  a.Q -> series.A
  b.Q -> series.B
  a.Q -> parallel.A
  b.Q -> parallel.B
  a.Q -> notA.A
  b.Q -> notB.A
  a.Q -> aNotB.A
  notB.Q -> aNotB.B
  series.Q -> lamp1.A
  parallel.Q -> lamp2.A
  notA.Q -> lamp3.A
  aNotB.Q -> lamp4.A
}`,
    inputs: [
      { id: 'a', type: 'INPUT', label: 'A', device: 'Any switch or sensor' },
      { id: 'b', type: 'INPUT', label: 'B', device: 'Any switch or sensor' },
    ],
    outputs: [
      { id: 'lamp1', type: 'OUTPUT', label: 'Lamp 1 (series)', device: 'Indicator' },
      { id: 'lamp2', type: 'OUTPUT', label: 'Lamp 2 (parallel)', device: 'Indicator' },
      { id: 'lamp3', type: 'OUTPUT', label: 'Lamp 3 (NC contact)', device: 'Indicator' },
      { id: 'lamp4', type: 'OUTPUT', label: 'Lamp 4 (A and not B)', device: 'Indicator' },
    ],
    tryIt: ['Lamp 3 is on with nothing pressed: that is the NC contact.', 'Click A: lamps 2 and 4 turn on, lamp 3 off.', 'Click B too: lamp 1 turns on, lamp 4 off.'],
    steps: [
      { title: 'Draw the rails', text: 'Left rail is power, right rail is return.' },
      { title: 'Add conditions', text: 'Contacts in series for AND, branches in parallel for OR.' },
      { title: 'End with a coil', text: 'One output coil per rung, at the right.' },
      { title: 'Read left to right, top to bottom', text: 'That is the order the PLC executes rungs in.' },
    ],
    mistakes: [
      'Confusing the program contact with the field device: an NC push button wired to an input makes the input ON when not pressed, so in the program you use an NO contact to mean "not pressed".',
      'Writing the same coil on two rungs: only the last one counts.',
      'Thinking rungs run at the same time: they run one after another in each scan.',
    ],
    faq: [
      { q: 'Is ladder logic still used?', a: 'Yes, it is the most common PLC language in North America and widely used everywhere for machine logic. IEC 61131-3 defines it together with function block diagram, structured text and sequential function chart.' },
      { q: 'What is the difference between ladder and function block diagram?', a: 'They express the same logic: ladder uses contacts and coils, FBD uses AND/OR blocks. This simulator lets you switch between the two views of the same circuit.' },
    ],
    blocks: ['AND', 'OR', 'NOT'],
    challenges: ['light-switch', 'two-hand-start', 'door-alarm', 'empty-hopper'],
    scenarios: [
      {
        name: 'Truth table',
        steps: [
          { action: 'A off, B off', waitMs: 200, expect: { lamp1: false, lamp2: false, lamp3: true, lamp4: false } },
          { action: 'A on, B off', set: { a: true }, waitMs: 200, expect: { lamp1: false, lamp2: true, lamp3: false, lamp4: true } },
          { action: 'A on, B on', set: { b: true }, waitMs: 200, expect: { lamp1: true, lamp2: true, lamp3: false, lamp4: false } },
          { action: 'A off, B on', set: { a: false }, waitMs: 200, expect: { lamp1: false, lamp2: true, lamp3: true, lamp4: false } },
        ],
      },
    ],
  },
  {
    slug: 'plc-scan-cycle-explained',
    title: 'PLC scan cycle explained: inputs, program, outputs (with a one-scan pulse)',
    description: 'How a PLC scan works: read inputs, execute the program top to bottom, write outputs. See a one-scan edge pulse and why scan time matters.',
    answer:
      'A PLC repeats the same cycle endlessly: it reads all inputs into memory, executes the program from top to bottom using that snapshot, then writes all outputs at once. One full cycle is the scan time, typically 1 to 50 ms; this simulator uses 100 ms so you can follow it.',
    level: 'beginner',
    explanation: `**1. Input scan.** The PLC copies every physical input into the input image. During the rest of the cycle the program sees this snapshot, even if a switch changes meanwhile.

**2. Program scan.** Rungs (or blocks) execute in order. A rung can use a bit that an earlier rung wrote in the same scan, but a bit written by a *later* rung still has the previous scan's value.

**3. Output scan.** The output image is written to the physical outputs.

Two consequences you meet constantly:

- An **edge (one-shot)** is ON for exactly **one scan**. Here a rising-edge trigger on the button increments a counter by exactly one per press, however long the button is held. A lamp driven directly by the edge would flash for only 100 ms.
- A **feedback** signal (a rung reading its own output, a seal-in) sees the value from the previous scan. The simulator makes this explicit with a one-scan delay block.

Signals shorter than one scan can be missed entirely; fast pulses need interrupt inputs or high-speed counters.`,
    circuit: `circuit "Scan cycle demo" version 1 {
  button: INPUT(label="Button")
  reset: INPUT(label="Reset count")
  edge: R_TRIG(label="Rising edge (one scan)")
  presses: COUNTER(label="Presses", limit=1000)
  levelCount: COUNTER(label="Scans counted on the level", limit=1000)
  pulse: OUTPUT(label="Edge pulse")
  count: ANALOG_OUTPUT(label="Press count")
  scans: ANALOG_OUTPUT(label="Count on every scan")
  everyScan: CLOCK(label="Scan clock", onTime=100, offTime=100)
  whileHeld: AND(label="Clock while held")
  button.Q -> edge.A
  edge.Q -> presses.CU
  reset.Q -> presses.R
  reset.Q -> levelCount.R
  button.Q -> whileHeld.A
  everyScan.Q -> whileHeld.B
  whileHeld.Q -> levelCount.CU
  edge.Q -> pulse.A
  presses.CV -> count.A
  levelCount.CV -> scans.A
}`,
    inputs: [
      { id: 'button', type: 'INPUT', label: 'Button', device: 'Push button' },
      { id: 'reset', type: 'INPUT', label: 'Reset count', device: 'Push button' },
    ],
    outputs: [
      { id: 'pulse', type: 'OUTPUT', label: 'Edge pulse', device: 'Diagnostic' },
      { id: 'count', type: 'ANALOG_OUTPUT', label: 'Press count', device: 'Diagnostic' },
      { id: 'scans', type: 'ANALOG_OUTPUT', label: 'Count on every scan', device: 'Diagnostic' },
    ],
    tryIt: ['Switch to "Function blocks" and press Run.', 'Hold the button for 2 s: the press count goes up by one, the level-based count by about ten.', 'Use "Step +100 ms" to execute one scan at a time.'],
    steps: [
      { title: 'Read inputs', text: 'A snapshot of all inputs at the start of the scan.' },
      { title: 'Execute the program', text: 'Top to bottom, using the snapshot.' },
      { title: 'Write outputs', text: 'All outputs updated together at the end.' },
      { title: 'Repeat', text: 'The scan time is the time for one loop.' },
    ],
    mistakes: [
      'Counting on a level instead of an edge, which counts once per scan.',
      'Expecting a later rung\'s result in an earlier rung in the same scan.',
      'Signals shorter than the scan time (fast encoders, short pulses): use high-speed inputs.',
    ],
    faq: [
      { q: 'What is a typical scan time?', a: 'A few milliseconds for small programs on modern PLCs, up to tens of milliseconds for large ones. The PLC watchdog faults the CPU if a scan takes too long.' },
      { q: 'What does the level-based count show?', a: 'It counts the rising edges of a clock that changes every scan while the button is held: about five per second here. It shows how often an instruction triggered by a level, instead of an edge, would act while a button is held.' },
    ],
    blocks: ['R_TRIG', 'F_TRIG', 'COUNTER', 'SCAN_DELAY', 'CLOCK'],
    challenges: ['batch-counter'],
    scenarios: [
      {
        name: 'Edge versus level',
        steps: [
          { action: 'Idle', waitMs: 300, expect: { count: 0, pulse: false } },
          { action: 'Hold the button for 2 s', set: { button: true }, waitMs: 2000, expect: { count: 1, pulse: false, scans: 10 }, during: [{ id: 'pulse', onShare: [0.04, 0.06] }] },
          { action: 'Release', set: { button: false }, waitMs: 300, expect: { count: 1 } },
          { action: 'Press again', set: { button: true }, waitMs: 300, expect: { count: 2 } },
          { action: 'Reset', set: { button: false, reset: true }, waitMs: 200, expect: { count: 0, scans: 0 } },
        ],
      },
    ],
  },
  {
    slug: 'normally-open-vs-normally-closed-plc-inputs',
    title: 'Normally open vs normally closed: why stop buttons are wired NC (fail-safe)',
    description: 'NO and NC contacts explained, how to use an NC stop button in PLC logic, and why a broken wire must cause a stop. Live simulator with a wire-break test.',
    answer:
      'A normally open (NO) contact closes when actuated; a normally closed (NC) contact opens when actuated. Stop buttons, limit switches for safety and overload contacts are wired NC, so that a broken wire looks exactly like "pressed" and stops the machine instead of silently disabling the stop.',
    level: 'beginner',
    explanation: `| Device contact | Not actuated | Actuated | Broken wire |
|---|---|---|---|
| NO (start button) | input OFF | input ON | input OFF (start does nothing) |
| NC (stop button) | input ON | input OFF | input OFF (machine stops) |

With an NC stop button, the PLC input is **ON when everything is healthy**. The program therefore uses it as a "stop not pressed" permissive: **Run = (Start OR Running) AND Stop input**.

In the simulator the NC input block shows the contact: switching it "actuated" opens the contact and the input goes OFF. A **broken wire** has the same effect, which is the whole point: the machine stops and cannot be started until the circuit is healthy again.

Start buttons stay NO: a broken wire on a start button means the machine cannot be started, which is safe.`,
    circuit: `circuit "NC stop button" version 1 {
  start: INPUT(label="Start (NO)")
  stopNC: NC_INPUT(label="Stop (NC contact)")
  sealed: OR(label="Start or running")
  run: AND(label="Run")
  holding: SCAN_DELAY(label="Running")
  motor: OUTPUT(label="Motor")
  start.Q -> sealed.A
  holding.Q -> sealed.B
  sealed.Q -> run.A
  stopNC.Q -> run.B
  run.Q -> holding.A
  run.Q -> motor.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start (NO)', device: 'Normally open push button' },
      { id: 'stopNC', type: 'NC_INPUT', label: 'Stop (NC contact)', device: 'Normally closed push button; "actuated" = pressed or wire broken' },
    ],
    outputs: [{ id: 'motor', type: 'OUTPUT', label: 'Motor', device: 'Motor contactor' }],
    tryIt: ['Switch Start on and off: the motor runs (the NC stop input is ON while not pressed).', 'Actuate the Stop contact: the motor stops.', 'Leave it actuated (a broken wire) and try Start: nothing happens.'],
    steps: [
      { title: 'Wire the stop button NC', text: 'The input is ON when healthy and not pressed.' },
      { title: 'Use it as a permissive', text: 'AND the run rung with the stop input (an NO contact in the program).' },
      { title: 'Test a wire break', text: 'Disconnect the wire: the machine must stop and refuse to start.' },
    ],
    mistakes: [
      'Wiring the stop button NO: a broken wire leaves a machine that cannot be stopped.',
      'Using an NC contact in the program for an NC-wired button, which inverts it twice.',
      'Treating NC wiring as a safety function on its own: emergency stops still need safety-rated relays or PLCs.',
    ],
    faq: [
      { q: 'Why does an NC input use an NO contact in the program?', a: 'Because the program tests the input bit, not the button. The bit is ON when the NC button is not pressed, so "examine if closed" (NO) means "stop not pressed".' },
      { q: 'Which devices should be NC?', a: 'Anything whose failure must lead to the safe state: stop buttons, guard switches, overload and high-level trip contacts, and many sensors used for protection.' },
    ],
    blocks: ['NC_INPUT', 'INPUT', 'SCAN_DELAY', 'OR', 'AND'],
    challenges: ['start-stop'],
    scenarios: [
      {
        name: 'Normal use and wire break',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 200, expect: { motor: true } },
          { action: 'Release Start', set: { start: false }, waitMs: 500, expect: { motor: true } },
          { action: 'Press Stop (contact opens)', set: { stopNC: true }, waitMs: 200, expect: { motor: false } },
          { action: 'Wire broken: Stop contact stays open, press Start', set: { start: true }, waitMs: 500, expect: { motor: false } },
          { action: 'Wire repaired, press Start', set: { stopNC: false }, waitMs: 200, expect: { motor: true } },
        ],
      },
    ],
  },
  {
    slug: 'two-way-three-way-switching-xor',
    title: 'Two-way and intermediate switching (staircase light) in PLC logic with XOR',
    description: 'Control one light from two or three switches: any switch changes the light. XOR logic for two-way and intermediate switching, with a live example.',
    answer:
      'With two switches, the light is ON when exactly one of them is ON: that is XOR. With three switches, chain the XOR: light = A XOR B XOR C. Flipping any switch always changes the light, whatever the others are set to.',
    level: 'beginner',
    explanation: `In house wiring, a staircase light uses two **two-way switches** (or travellers with an intermediate switch for a third location). In a PLC the switches are just inputs and the logic is XOR:

| A | B | Light (A XOR B) |
|---|---|---|
| OFF | OFF | OFF |
| ON | OFF | ON |
| OFF | ON | ON |
| ON | ON | OFF |

Each switch flips the result, which is exactly what you expect from a staircase light. For a third switch, XOR the result with C. This scales to any number of switches.

With push buttons instead of rocker switches, use the toggle (pulse relay) pattern from the one-button guide and OR the buttons together.`,
    circuit: `circuit "Two-way and intermediate switching" version 1 {
  a: INPUT(label="Switch downstairs")
  b: INPUT(label="Switch upstairs")
  c: INPUT(label="Switch on the landing")
  ab: XOR(label="A xor B")
  abc: XOR(label="A xor B xor C")
  twoWay: OUTPUT(label="Light (two switches)")
  threeWay: OUTPUT(label="Light (three switches)")
  a.Q -> ab.A
  b.Q -> ab.B
  ab.Q -> abc.A
  c.Q -> abc.B
  ab.Q -> twoWay.A
  abc.Q -> threeWay.A
}`,
    inputs: [
      { id: 'a', type: 'INPUT', label: 'Switch downstairs', device: 'Rocker switch' },
      { id: 'b', type: 'INPUT', label: 'Switch upstairs', device: 'Rocker switch' },
      { id: 'c', type: 'INPUT', label: 'Switch on the landing', device: 'Rocker switch' },
    ],
    outputs: [
      { id: 'twoWay', type: 'OUTPUT', label: 'Light (two switches)', device: 'Light relay' },
      { id: 'threeWay', type: 'OUTPUT', label: 'Light (three switches)', device: 'Light relay' },
    ],
    tryIt: ['Flip any switch: the lights change.', 'Flip it back: they change back.', 'Try all combinations of the three switches.'],
    steps: [
      { title: 'Two switches', text: 'Light = A XOR B.' },
      { title: 'More switches', text: 'XOR each additional switch with the previous result.' },
      { title: 'Push buttons', text: 'Use a toggle on the OR of all buttons instead.' },
    ],
    mistakes: [
      'Using OR: once one switch is ON, the other switch can no longer turn the light off.',
      'Mixing push buttons into XOR logic: a momentary button only changes the light while held.',
    ],
    faq: [
      { q: 'How is XOR written in ladder?', a: 'As two parallel branches: (A AND NOT B) OR (NOT A AND B). The ladder view of this circuit shows exactly that.' },
      { q: 'What about a central "all off"?', a: 'With rocker switches the position of each switch is fixed, so "all off" needs push buttons and a toggle (pulse relay) instead.' },
    ],
    blocks: ['XOR', 'PULSE_RELAY'],
    challenges: ['light-switch'],
    scenarios: [
      {
        name: 'Every switch changes the light',
        steps: [
          { action: 'All off', waitMs: 200, expect: { twoWay: false, threeWay: false } },
          { action: 'A on', set: { a: true }, waitMs: 200, expect: { twoWay: true, threeWay: true } },
          { action: 'B on', set: { b: true }, waitMs: 200, expect: { twoWay: false, threeWay: false } },
          { action: 'C on', set: { c: true }, waitMs: 200, expect: { twoWay: false, threeWay: true } },
          { action: 'A off', set: { a: false }, waitMs: 200, expect: { twoWay: true, threeWay: false } },
          { action: 'B off', set: { b: false }, waitMs: 200, expect: { twoWay: false, threeWay: true } },
        ],
      },
    ],
  },
  {
    slug: 'count-every-nth-item-plc',
    title: 'How to do something every Nth item (counter that resets itself)',
    description: 'Divert every 5th product for a quality sample using a counter that resets itself when it reaches the preset. A PLC pattern you can run live.',
    answer:
      'Count items with an up counter set to N. When it reaches N, act (here: fire a sample diverter) and reset the counter, so the next item starts a new count. The reset goes through a one-scan delay so the counter\'s done bit is seen once.',
    level: 'beginner',
    explanation: `- **Counter** (preset 5) counts rising edges of the product sensor.
- When it reaches 5 its done bit turns on. That starts a **pulse timer** for the diverter and, one scan later, **resets the counter** to zero.
- The 10th, 15th… item does the same.

The one-scan delay on the reset gives every block that uses the done bit one full scan to see it. Many PLCs let you write the reset on the rung after the one that uses the done bit, which has the same effect.`,
    circuit: `circuit "Every 5th item" version 1 {
  product: INPUT(label="Product sensor")
  count: COUNTER(label="Item count", limit=5)
  autoReset: SCAN_DELAY(label="Reset after use")
  divert: PULSE_TIMER(label="Diverter time", duration=500)
  sampler: OUTPUT(label="Sample diverter")
  items: ANALOG_OUTPUT(label="Count")
  product.Q -> count.CU
  count.Q -> autoReset.A
  autoReset.Q -> count.R
  count.Q -> divert.A
  divert.Q -> sampler.A
  count.CV -> items.A
}`,
    inputs: [{ id: 'product', type: 'INPUT', label: 'Product sensor', device: 'Photo-eye on the conveyor' }],
    outputs: [
      { id: 'sampler', type: 'OUTPUT', label: 'Sample diverter', device: 'Diverter gate solenoid' },
      { id: 'items', type: 'ANALOG_OUTPUT', label: 'Count', device: 'HMI value' },
    ],
    tryIt: ['Switch the product sensor on and off five times: the diverter fires on the fifth.', 'Keep going: it fires again on the tenth.'],
    steps: [
      { title: 'Count', text: 'Up counter with the preset N.' },
      { title: 'Act on done', text: 'Done bit starts the action.' },
      { title: 'Reset', text: 'Done bit resets the counter one scan later.' },
    ],
    mistakes: [
      'Resetting in the same scan before the action reads the done bit: the action never happens.',
      'Counting the sensor level instead of edges.',
      'Diverting the item that triggered the count when the diverter is further down the line; use a shift register to track it.',
    ],
    faq: [
      { q: 'How do I make N adjustable?', a: 'Use an HMI value as the counter preset. Apply a new value only at a reset.' },
      { q: 'Can I use the counter value instead?', a: 'Yes: compare the count with N using a comparator. The result is the same.' },
    ],
    blocks: ['COUNTER', 'SCAN_DELAY', 'PULSE_TIMER'],
    challenges: ['batch-counter'],
    scenarios: [
      {
        name: 'Ten items',
        steps: [
          { action: 'Item 1', set: { product: true }, waitMs: 200 },
          { action: 'Gap', set: { product: false }, waitMs: 600 },
          { action: 'Item 2', set: { product: true }, waitMs: 200 },
          { action: 'Gap', set: { product: false }, waitMs: 600 },
          { action: 'Item 3', set: { product: true }, waitMs: 200 },
          { action: 'Gap', set: { product: false }, waitMs: 600 },
          { action: 'Item 4', set: { product: true }, waitMs: 200, expect: { sampler: false, items: 4 } },
          { action: 'Gap', set: { product: false }, waitMs: 600 },
          { action: 'Item 5', set: { product: true }, waitMs: 200, expect: { sampler: true, items: 0 } },
          { action: 'Gap', set: { product: false }, waitMs: 600, expect: { sampler: false } },
          { action: 'Item 6', set: { product: true }, waitMs: 200, expect: { sampler: false, items: 1 } },
          { action: 'Gap', set: { product: false }, waitMs: 600 },
          { action: 'Item 7', set: { product: true }, waitMs: 200 },
          { action: 'Gap', set: { product: false }, waitMs: 600 },
          { action: 'Item 8', set: { product: true }, waitMs: 200 },
          { action: 'Gap', set: { product: false }, waitMs: 600 },
          { action: 'Item 9', set: { product: true }, waitMs: 200 },
          { action: 'Gap', set: { product: false }, waitMs: 600 },
          { action: 'Item 10', set: { product: true }, waitMs: 200, expect: { sampler: true } },
        ],
      },
    ],
  },
  {
    slug: 'plc-step-sequencer-counter',
    title: 'How to build a step sequencer in a PLC (step number with a counter)',
    description: 'A step sequencer driven by a step counter: each step has its own action and transition condition. Fill A, fill B, mix, repeat. Live PLC example.',
    answer:
      'Keep the current step in a number. Each step drives its own outputs, and each step has a transition condition that advances to the next step. This scales far better than a web of latches and makes it easy to show the step on an HMI.',
    level: 'advanced',
    explanation: `This is the idea behind sequential function charts (SFC), built from basic blocks:

| Step | Action | Transition |
|---|---|---|
| 0 Idle | – | Start |
| 1 Fill A | valve A open | level A reached |
| 2 Fill B | valve B open | level B reached |
| 3 Mix | mixer on | 3 s elapsed → back to 0 |

- The **step counter** holds the step number.
- A comparator per step decodes "step = n".
- **Advance** = rising edge of (step 0 AND Start) OR (step 1 AND level A) OR (step 2 AND level B). The edge makes sure each transition counts once.
- In step 3, an on-delay resets the counter to step 0.
- The advance pulse and the reset reach the counter through **one-scan delays**: the counter's own value decides them, so the change takes effect in the next scan. A PLC does the same when the step number is written at the end of the program.

Adding a step means one comparator, one transition term and its actions; nothing else changes.`,
    circuit: `circuit "Step sequencer" version 1 {
  start: INPUT(label="Start")
  levelA: INPUT(label="Level A reached")
  levelB: INPUT(label="Level B reached")
  step: COUNTER(label="Step number", limit=100)
  c0: ANALOG_CONSTANT(label="0", value=0)
  c1: ANALOG_CONSTANT(label="1", value=1)
  c2: ANALOG_CONSTANT(label="2", value=2)
  c3: ANALOG_CONSTANT(label="3", value=3)
  s0: ANALOG_COMPARATOR(label="Step 0", operation="eq")
  s1: ANALOG_COMPARATOR(label="Step 1", operation="eq")
  s2: ANALOG_COMPARATOR(label="Step 2", operation="eq")
  s3: ANALOG_COMPARATOR(label="Step 3", operation="eq")
  t0: AND(label="Idle and Start")
  t1: AND(label="Fill A done")
  t2: AND(label="Fill B done")
  t01: OR(label="Transition 0 or 1")
  tAny: OR(label="Any transition")
  advance: R_TRIG(label="Advance")
  nextStep: SCAN_DELAY(label="Advance (next scan)")
  mixTime: TON(label="Mix time", duration=3000)
  backToIdle: SCAN_DELAY(label="Back to step 0 (next scan)")
  valveA: OUTPUT(label="Valve A")
  valveB: OUTPUT(label="Valve B")
  mixer: OUTPUT(label="Mixer")
  stepOut: ANALOG_OUTPUT(label="Current step")
  step.CV -> s0.A
  c0.Q -> s0.B
  step.CV -> s1.A
  c1.Q -> s1.B
  step.CV -> s2.A
  c2.Q -> s2.B
  step.CV -> s3.A
  c3.Q -> s3.B
  s0.Q -> t0.A
  start.Q -> t0.B
  s1.Q -> t1.A
  levelA.Q -> t1.B
  s2.Q -> t2.A
  levelB.Q -> t2.B
  t0.Q -> t01.A
  t1.Q -> t01.B
  t01.Q -> tAny.A
  t2.Q -> tAny.B
  tAny.Q -> advance.A
  advance.Q -> nextStep.A
  nextStep.Q -> step.CU
  s3.Q -> mixTime.A
  mixTime.Q -> backToIdle.A
  backToIdle.Q -> step.R
  s1.Q -> valveA.A
  s2.Q -> valveB.A
  s3.Q -> mixer.A
  step.CV -> stepOut.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'levelA', type: 'INPUT', label: 'Level A reached', device: 'Level switch for ingredient A' },
      { id: 'levelB', type: 'INPUT', label: 'Level B reached', device: 'Level switch for ingredient B' },
    ],
    outputs: [
      { id: 'valveA', type: 'OUTPUT', label: 'Valve A', device: 'Ingredient A valve' },
      { id: 'valveB', type: 'OUTPUT', label: 'Valve B', device: 'Ingredient B valve' },
      { id: 'mixer', type: 'OUTPUT', label: 'Mixer', device: 'Mixer motor' },
      { id: 'stepOut', type: 'ANALOG_OUTPUT', label: 'Current step', device: 'HMI step display' },
    ],
    tryIt: ['Switch to "Function blocks" to see the step number.', 'Switch Start on: step 1, valve A. Switch Level A on: step 2, valve B.', 'Switch Level B on: step 3, mixing for 3 s, then back to step 0.'],
    steps: [
      { title: 'Hold the step', text: 'A counter (or integer) holds the step number.' },
      { title: 'Decode the steps', text: 'One comparator per step.' },
      { title: 'Transitions', text: 'Each step AND its condition; OR them; take the rising edge to advance.' },
      { title: 'Actions', text: 'Each output is driven by the step(s) where it is active.' },
      { title: 'Return', text: 'The last step resets the step number.' },
    ],
    mistakes: [
      'Advancing on the condition level: a condition that stays true races through several steps in consecutive scans.',
      'Driving an output from several places instead of from the step decode.',
      'No way to abort: add a Stop that resets the step to 0 and a timeout per step.',
    ],
    faq: [
      { q: 'Is this the same as SFC?', a: 'It is the same idea. Sequential function chart (IEC 61131-3) draws steps and transitions graphically and handles parallel branches; a step number is the portable way to do it in any language.' },
      { q: 'Why does the transition need an edge?', a: 'Without it, if level A were already on when step 1 starts, the sequence would advance again on the next scan, and again, skipping steps.' },
    ],
    blocks: ['COUNTER', 'ANALOG_COMPARATOR', 'R_TRIG', 'SCAN_DELAY', 'TON', 'AND', 'OR'],
    challenges: ['star-delta', 'batch-counter'],
    never: [
      { when: { valveA: true, valveB: true }, message: 'Both valves were open together' },
      { when: { mixer: true, valveA: true }, message: 'Mixing while filling A' },
    ],
    scenarios: [
      {
        name: 'One batch and back to idle',
        steps: [
          { action: 'Idle', waitMs: 300, expect: { stepOut: 0, valveA: false } },
          { action: 'Start', set: { start: true }, waitMs: 200, expect: { stepOut: 1, valveA: true } },
          { action: 'Release Start', set: { start: false }, waitMs: 500, expect: { stepOut: 1 } },
          { action: 'Level A reached', set: { levelA: true }, waitMs: 200, expect: { stepOut: 2, valveA: false, valveB: true } },
          { action: 'Level B reached', set: { levelB: true }, waitMs: 200, expect: { stepOut: 3, valveB: false, mixer: true } },
          { action: 'Mixing', waitMs: 2500, expect: { mixer: true } },
          { action: 'Mix time over', set: { levelA: false, levelB: false }, waitMs: 700, expect: { stepOut: 0, mixer: false } },
          { action: 'Next batch', set: { start: true }, waitMs: 200, expect: { stepOut: 1 } },
        ],
      },
      {
        name: 'Transitions only count in their own step',
        steps: [
          { action: 'Level switches on while idle', set: { levelA: true, levelB: true }, waitMs: 500, expect: { stepOut: 0 } },
          { action: 'Start with level A already on', set: { start: true }, waitMs: 200, expect: { stepOut: 1 } },
          { action: 'Level A goes off and on', set: { levelA: false }, waitMs: 200, expect: { stepOut: 1 } },
          { action: 'Level A on again', set: { levelA: true }, waitMs: 200, expect: { stepOut: 2 } },
        ],
      },
    ],
  },
  {
    slug: 'plc-program-microwave-oven',
    title: 'PLC program for a microwave oven (cook timer that pauses when the door opens)',
    description: 'Classic PLC exercise: microwave with door interlock, cook time that pauses when the door opens and continues when it closes, cancel, and an end beep.',
    answer:
      'Use a retentive timer for the cook time: it counts only while cooking and keeps its value when the door opens. Cooking = started AND door closed AND not finished. Cancel resets everything, and a short beep sounds when the time is up.',
    level: 'intermediate',
    explanation: `- **Started** latch: Start (with the door closed) sets it; Cancel or the end of cooking resets it.
- **Cooking** = started AND door closed. The magnetron, turntable and lamp follow it. The door switch interrupts cooking immediately.
- **Cook time**: a retentive on-delay (8 s in the demo) counts while cooking and **keeps** its elapsed time while the door is open. A normal TON would start again from zero.
- When the time is up, a pulse timer sounds the **beep** and the started latch resets (through a one-scan delay). Cancel resets the cook timer too.

The cavity lamp also lights while the door is open, as on a real microwave.`,
    circuit: `circuit "Microwave oven" version 1 {
  start: INPUT(label="Start")
  cancel: INPUT(label="Cancel")
  door: INPUT(label="Door closed", value=true)
  canStart: AND(label="Start with door closed")
  finished: SCAN_DELAY(label="Time up (last scan)")
  endCook: OR(label="Cancel or time up")
  started: RS_LATCH(label="Started")
  cooking: AND(label="Cooking")
  clearTime: OR(label="Clear cook time")
  cookTime: RETENTIVE_TON(label="Cook time", duration=8000)
  doorOpen: NOT(label="Door open")
  lampLogic: OR(label="Lamp")
  beepTimer: PULSE_TIMER(label="Beep", duration=1000)
  magnetron: OUTPUT(label="Magnetron")
  turntable: OUTPUT(label="Turntable")
  lamp: OUTPUT(label="Cavity lamp")
  beep: OUTPUT(label="Beeper")
  start.Q -> canStart.A
  door.Q -> canStart.B
  cookTime.Q -> finished.A
  cancel.Q -> endCook.A
  finished.Q -> endCook.B
  canStart.Q -> started.S
  endCook.Q -> started.R
  started.Q -> cooking.A
  door.Q -> cooking.B
  cancel.Q -> clearTime.A
  finished.Q -> clearTime.B
  cooking.Q -> cookTime.A
  clearTime.Q -> cookTime.R
  door.Q -> doorOpen.A
  cooking.Q -> lampLogic.A
  doorOpen.Q -> lampLogic.B
  cookTime.Q -> beepTimer.A
  cooking.Q -> magnetron.A
  cooking.Q -> turntable.A
  lampLogic.Q -> lamp.A
  beepTimer.Q -> beep.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Start button' },
      { id: 'cancel', type: 'INPUT', label: 'Cancel', device: 'Stop/cancel button' },
      { id: 'door', type: 'INPUT', label: 'Door closed', device: 'Door interlock switch' },
    ],
    outputs: [
      { id: 'magnetron', type: 'OUTPUT', label: 'Magnetron', device: 'High-voltage relay' },
      { id: 'turntable', type: 'OUTPUT', label: 'Turntable', device: 'Turntable motor' },
      { id: 'lamp', type: 'OUTPUT', label: 'Cavity lamp', device: 'Lamp' },
      { id: 'beep', type: 'OUTPUT', label: 'Beeper', device: 'Buzzer' },
    ],
    tryIt: ['Switch Start on and off: cooking starts.', 'Open the door after 3 s for a while, then close it: cooking continues where it stopped.', 'After 8 s of cooking in total, it beeps and stops.'],
    steps: [
      { title: 'Latch the start', text: 'Start with the door closed; reset by Cancel or time up.' },
      { title: 'Gate with the door', text: 'Cooking = started AND door closed.' },
      { title: 'Retentive cook time', text: 'A retentive timer pauses with the door.' },
      { title: 'Finish', text: 'Beep, reset the latch and clear the timer.' },
    ],
    mistakes: [
      'Using a normal on-delay: opening the door restarts the cook time.',
      'Letting cooking resume automatically after Cancel because the timer kept its time.',
      'Real microwaves interlock the door with several switches in hardware; the PLC exercise only models the logic.',
    ],
    faq: [
      { q: 'How do I let the user set the time?', a: 'Use an HMI value (or a number of presses on a "+30 s" button counted by a counter) as the retentive timer preset.' },
      { q: 'How do I show the remaining time?', a: 'Remaining = preset − elapsed time (ET) of the retentive timer, divided by 1000 for seconds.' },
    ],
    blocks: ['RETENTIVE_TON', 'RS_LATCH', 'PULSE_TIMER', 'SCAN_DELAY', 'AND', 'OR', 'NOT'],
    challenges: ['delayed-fan', 'guarded-machine'],
    never: [{ when: { magnetron: true, door: false }, message: 'The magnetron ran with the door open' }],
    scenarios: [
      {
        name: 'Cook with a door opening in between',
        steps: [
          { action: 'Press Start', set: { door: true, start: true }, waitMs: 200, expect: { magnetron: true, lamp: true } },
          { action: 'Cook 3 s', set: { start: false }, waitMs: 2800, expect: { magnetron: true } },
          { action: 'Door opened', set: { door: false }, waitMs: 2000, expect: { magnetron: false, turntable: false, lamp: true } },
          { action: 'Door closed: continues', set: { door: true }, waitMs: 4000, expect: { magnetron: true } },
          { action: '8 s of cooking in total', waitMs: 1300, expect: { magnetron: false, beep: true } },
          { action: 'Beep over', waitMs: 1200, expect: { beep: false, magnetron: false, lamp: false } },
          { action: 'Start again: full time', set: { start: true }, waitMs: 200, expect: { magnetron: true } },
          { action: 'Cook 6 s', set: { start: false }, waitMs: 6000, expect: { magnetron: true } },
        ],
      },
      {
        name: 'Cancel and door',
        steps: [
          { action: 'Start with the door open', set: { door: false, start: true }, waitMs: 300, expect: { magnetron: false } },
          { action: 'Close door, Start', set: { door: true }, waitMs: 3000, expect: { magnetron: true } },
          { action: 'Cancel', set: { start: false, cancel: true }, waitMs: 200, expect: { magnetron: false, turntable: false } },
          { action: 'Start again', set: { cancel: false, start: true }, waitMs: 200, expect: { magnetron: true } },
          { action: 'Cooks the full 8 s again', set: { start: false }, waitMs: 6000, expect: { magnetron: true, turntable: true, beep: false } },
        ],
      },
    ],
  },
  {
    slug: 'plc-first-scan-bit-initialization',
    title: 'How to use a first-scan bit to initialise a PLC program',
    description: 'Make a pulse that is ON only in the first scan after power-up to reset sequences, set defaults and require a fresh start. PLC pattern with a live demo.',
    answer:
      'A first-scan bit is ON only during the first scan after the PLC starts. Use it to put sequences in their initial step, set default values and, most importantly, make sure nothing starts by itself after a power cut. Many PLCs provide one (S:FS, FirstScan, OB100); you can also build it.',
    level: 'intermediate',
    explanation: `**Building it**: a one-scan delay on a constant TRUE outputs FALSE in the very first scan and TRUE from then on. NOT of that is the **first-scan pulse**.

In the example:

- The first-scan pulse sets a **"restart required"** latch. A machine that was running when the power failed must not start again by itself, even if its run memory is retentive.
- **Run** latch: Start sets it, but only after the operator has acknowledged the restart; Stop and the first scan reset it.
- A **power-up counter** shows how often the PLC has started (it counts the first-scan pulses).

Typical first-scan jobs: reset step sequencers to step 0, clear one-shots, load default setpoints, and force outputs to a known state.`,
    circuit: `circuit "First-scan initialisation" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  ack: INPUT(label="Acknowledge restart")
  alwaysOn: HIGH(label="TRUE")
  afterFirst: SCAN_DELAY(label="Not first scan")
  firstScan: NOT(label="First scan")
  restart: RS_LATCH(label="Restart required")
  ackOk: AND(label="Acknowledge")
  ready: NOT(label="Ready to start")
  canStart: AND(label="Start allowed")
  stopOrInit: OR(label="Stop or first scan")
  run: RS_LATCH(label="Run")
  powerUps: COUNTER(label="Power-ups", limit=1000)
  motor: OUTPUT(label="Motor")
  restartLamp: OUTPUT(label="Restart required lamp")
  starts: ANALOG_OUTPUT(label="Power-up count")
  alwaysOn.Q -> afterFirst.A
  afterFirst.Q -> firstScan.A
  firstScan.Q -> restart.S
  ack.Q -> ackOk.A
  afterFirst.Q -> ackOk.B
  ackOk.Q -> restart.R
  restart.Q -> ready.A
  start.Q -> canStart.A
  ready.Q -> canStart.B
  stop.Q -> stopOrInit.A
  firstScan.Q -> stopOrInit.B
  canStart.Q -> run.S
  stopOrInit.Q -> run.R
  firstScan.Q -> powerUps.CU
  run.Q -> motor.A
  restart.Q -> restartLamp.A
  powerUps.CV -> starts.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'ack', type: 'INPUT', label: 'Acknowledge restart', device: 'Reset push button or HMI' },
    ],
    outputs: [
      { id: 'motor', type: 'OUTPUT', label: 'Motor', device: 'Motor contactor' },
      { id: 'restartLamp', type: 'OUTPUT', label: 'Restart required lamp', device: 'Indicator' },
      { id: 'starts', type: 'ANALOG_OUTPUT', label: 'Power-up count', device: 'Diagnostic' },
    ],
    tryIt: ['Press Reset in the toolbar (a simulated power-up): the restart lamp lights.', 'Start does nothing until you switch Acknowledge on and off.', 'Then Start runs the motor.'],
    steps: [
      { title: 'Make the pulse', text: 'NOT (one-scan delay of TRUE), or the PLC\'s system first-scan bit.' },
      { title: 'Initialise', text: 'Reset sequences and latches with it, set defaults.' },
      { title: 'Block automatic restart', text: 'Require an acknowledgement before the next start.' },
    ],
    mistakes: [
      'Relying on retentive latches without a first-scan reset: the machine wakes up running.',
      'Using the first-scan bit in a program part that is not executed in the first scan (a subroutine called later), so it never sees it.',
      'Initialising setpoints from defaults on every power-up when the operator expects the last values to be kept.',
    ],
    faq: [
      { q: 'What is the first-scan bit called on my PLC?', a: 'Allen-Bradley: S:FS. Siemens S7-1200/1500: the FirstScan system memory bit or startup OB100. Codesys: use a variable initialised to TRUE and cleared at the end of the first cycle.' },
      { q: 'Why does acknowledge also need "not first scan"?', a: 'So that an acknowledge button held during power-up does not clear the restart request in the same scan that sets it.' },
    ],
    blocks: ['HIGH', 'SCAN_DELAY', 'NOT', 'RS_LATCH', 'COUNTER'],
    challenges: ['start-stop'],
    scenarios: [
      {
        name: 'Power-up',
        steps: [
          { action: 'After power-up', waitMs: 300, expect: { restartLamp: true, motor: false, starts: 1 } },
          { action: 'Start without acknowledge', set: { start: true }, waitMs: 300, expect: { motor: false } },
          { action: 'Acknowledge', set: { start: false, ack: true }, waitMs: 200, expect: { restartLamp: false } },
          { action: 'Start', set: { ack: false, start: true }, waitMs: 200, expect: { motor: true } },
          { action: 'Release Start', set: { start: false }, waitMs: 500, expect: { motor: true, starts: 1 } },
          { action: 'Stop', set: { stop: true }, waitMs: 200, expect: { motor: false, restartLamp: false } },
        ],
      },
      {
        name: 'Acknowledge held during power-up',
        steps: [{ action: 'Acknowledge held from power-up', set: { ack: true }, waitMs: 100, expect: { restartLamp: true, motor: false } }],
      },
    ],
  },
  {
    slug: 'day-night-thermostat-setback',
    title: 'How to program a day/night thermostat with setback (two setpoints)',
    description: 'Heat to 21 °C during the day and 17 °C at night: two hysteresis bands selected by a time signal, plus a manual comfort override. PLC logic you can run.',
    answer:
      'Use two hysteresis switches, one for the comfort (day) setpoint and one for the setback (night) setpoint, and select between them with a day/night signal from a clock. An override button gives comfort temperature at night for a while.',
    level: 'beginner',
    explanation: `- **Day band**: heat on at 20 °C or below, off at 21 °C or above.
- **Night band**: heat on at 16 °C or below, off at 17 °C or above.
- **Comfort mode** = day OR override. The override uses an off-delay (5 s in the demo, typically 1–2 hours) so a press gives comfort for a while.
- **Heater** = (comfort AND day band) OR (NOT comfort AND night band).

Setting back the temperature at night saves energy roughly in proportion to the temperature difference and the hours; the heating needs some time to recover in the morning, so many controllers start the day period early (optimum start).`,
    circuit: `circuit "Day/night thermostat" version 1 {
  temp: ANALOG_INPUT(label="Room °C", value=19)
  day: INPUT(label="Day period (clock)", value=true)
  override: INPUT(label="Comfort override button")
  dayBand: ANALOG_DIFFERENTIAL(label="Day: on 20 / off 21 °C", onThreshold=20, offThreshold=21)
  nightBand: ANALOG_DIFFERENTIAL(label="Night: on 16 / off 17 °C", onThreshold=16, offThreshold=17)
  overrideHold: TOF(label="Override time", duration=5000)
  comfort: OR(label="Comfort mode")
  setback: NOT(label="Setback mode")
  dayHeat: AND(label="Comfort heating")
  nightHeat: AND(label="Setback heating")
  heatLogic: OR(label="Heat")
  heater: OUTPUT(label="Heater")
  comfortLamp: OUTPUT(label="Comfort mode lamp")
  temp.Q -> dayBand.A
  temp.Q -> nightBand.A
  override.Q -> overrideHold.A
  day.Q -> comfort.A
  overrideHold.Q -> comfort.B
  comfort.Q -> setback.A
  comfort.Q -> dayHeat.A
  dayBand.Q -> dayHeat.B
  setback.Q -> nightHeat.A
  nightBand.Q -> nightHeat.B
  dayHeat.Q -> heatLogic.A
  nightHeat.Q -> heatLogic.B
  heatLogic.Q -> heater.A
  comfort.Q -> comfortLamp.A
}`,
    inputs: [
      { id: 'temp', type: 'ANALOG_INPUT', label: 'Room °C', device: 'Room temperature sensor' },
      { id: 'day', type: 'INPUT', label: 'Day period (clock)', device: 'Time switch or PLC schedule' },
      { id: 'override', type: 'INPUT', label: 'Comfort override button', device: 'Push button in the room' },
    ],
    outputs: [
      { id: 'heater', type: 'OUTPUT', label: 'Heater', device: 'Boiler or heater enable' },
      { id: 'comfortLamp', type: 'OUTPUT', label: 'Comfort mode lamp', device: 'Indicator' },
    ],
    tryIt: ['Press Run and set 19 °C in the day: heating to 21 °C.', 'Switch Day period OFF and set 18 °C: no heating (night setpoint 17 °C).', 'Press the override button: comfort heating for 5 s.'],
    steps: [
      { title: 'Two bands', text: 'One per setpoint, both low triggers.' },
      { title: 'Select', text: 'Comfort = day OR override.' },
      { title: 'Combine', text: 'Use the band that belongs to the active mode.' },
    ],
    mistakes: [
      'Switching setpoints without hysteresis, so the heater chatters at the change-over.',
      'An override that never times out.',
      'Setting back so far that the building cannot recover by the morning.',
    ],
    faq: [
      { q: 'How do I add a holiday mode?', a: 'Add a third band (for example 12 °C frost protection) selected by a holiday switch, which takes priority over day and night.' },
      { q: 'Can I do this with one adjustable setpoint instead?', a: 'Yes: select the setpoint value (21 or 17) with a multiplexer and feed it into a comparator-based band or a PI controller.' },
    ],
    blocks: ['ANALOG_DIFFERENTIAL', 'TOF', 'AND', 'OR', 'NOT'],
    challenges: ['tank-level', 'stairwell-light'],
    scenarios: [
      {
        name: 'Day and night',
        steps: [
          { action: 'Day, 19 °C', set: { day: true, temp: 19 }, waitMs: 200, expect: { heater: true, comfortLamp: true } },
          { action: 'Day, 21 °C', set: { temp: 21 }, waitMs: 200, expect: { heater: false } },
          { action: 'Day, 20.5 °C', set: { temp: 20.5 }, waitMs: 200, expect: { heater: false } },
          { action: 'Night, 18 °C', set: { day: false, temp: 18 }, waitMs: 200, expect: { heater: false, comfortLamp: false } },
          { action: 'Night, 15.5 °C', set: { temp: 15.5 }, waitMs: 200, expect: { heater: true } },
          { action: 'Night, 17 °C', set: { temp: 17 }, waitMs: 200, expect: { heater: false } },
        ],
      },
      {
        name: 'Override at night',
        steps: [
          { action: 'Night, 18 °C', set: { day: false, temp: 18 }, waitMs: 200, expect: { heater: false } },
          { action: 'Press override', set: { override: true }, waitMs: 200, expect: { comfortLamp: true, heater: true } },
          { action: '4 s later', set: { override: false }, waitMs: 4000, expect: { heater: true } },
          { action: 'Override expired', waitMs: 1500, expect: { comfortLamp: false, heater: false } },
        ],
      },
    ],
  },
];
