import type { Challenge } from './types.ts';

/**
 * Challenge catalog, ordered from first steps to complete control patterns.
 * Every challenge has a reference solution in tests/challenges.test.ts that must pass,
 * and its untouched starter must fail.
 */
export const CHALLENGES: Challenge[] = [
  {
    slug: 'light-switch',
    title: 'Turn on the light',
    level: 'beginner',
    summary: 'Your first wire: make a lamp follow a switch.',
    concepts: ['Inputs', 'Outputs', 'Wiring'],
    brief: `Every control program reads **inputs**, decides, and drives **outputs**. Start with the simplest possible program: the lamp should do exactly what the wall switch does.

Drag from the small dot on the right of the switch (its output) to the dot on the left of the lamp (its input). Then press **Run**, toggle the switch, and watch the lamp.`,
    requirements: ['When the switch is ON, the lamp is ON.', 'When the switch is OFF, the lamp is OFF.'],
    hints: ['You do not need any extra blocks for this one.', 'Outputs are on the right side of a block, inputs on the left.'],
    starter: `circuit "Turn on the light" version 1 {
  switch: INPUT(label="Wall switch")
  lamp: OUTPUT(label="Lamp")
}`,
    inputs: [{ id: 'switch', type: 'INPUT', label: 'Wall switch' }],
    outputs: [{ id: 'lamp', type: 'OUTPUT', label: 'Lamp' }],
    scenarios: [
      {
        name: 'Lamp follows the switch',
        steps: [
          { action: 'Leave the switch off', waitMs: 200, expect: { lamp: false } },
          { action: 'Turn the switch on', set: { switch: true }, waitMs: 100, expect: { lamp: true } },
          { action: 'Turn the switch off', set: { switch: false }, waitMs: 100, expect: { lamp: false } },
        ],
      },
    ],
  },
  {
    slug: 'two-hand-start',
    title: 'Two-hand start',
    level: 'beginner',
    summary: 'A press may only move when both buttons are held: your first AND gate.',
    concepts: ['AND', 'Interlocks'],
    brief: `A small bench press must only move while the operator holds **both** buttons, so neither hand can be under the tool.

Make the **Press stroke** output turn on only while the left and the right button are both pressed.

*Real two-hand controls also require both buttons to be pressed within about half a second of each other, and are built from certified safety hardware. This exercise covers only the logic idea.*`,
    requirements: ['Only the left button pressed: no stroke.', 'Only the right button pressed: no stroke.', 'Both pressed: stroke.', 'Releasing either button stops the stroke.'],
    hints: ['Look in the Logic category of the component list.', 'An AND block is true only when both of its inputs are true.'],
    starter: `circuit "Two-hand start" version 1 {
  left: INPUT(label="Left button")
  right: INPUT(label="Right button")
  stroke: OUTPUT(label="Press stroke")
}`,
    inputs: [
      { id: 'left', type: 'INPUT', label: 'Left button' },
      { id: 'right', type: 'INPUT', label: 'Right button' },
    ],
    outputs: [{ id: 'stroke', type: 'OUTPUT', label: 'Press stroke' }],
    scenarios: [
      {
        name: 'One hand is not enough',
        steps: [
          { action: 'Press only the left button', set: { left: true }, waitMs: 200, expect: { stroke: false } },
          { action: 'Swap to only the right button', set: { left: false, right: true }, waitMs: 200, expect: { stroke: false } },
        ],
      },
      {
        name: 'Both hands start the stroke, either hand stops it',
        steps: [
          { action: 'Press both buttons', set: { left: true, right: true }, waitMs: 100, expect: { stroke: true } },
          { action: 'Release the right button', set: { right: false }, waitMs: 100, expect: { stroke: false } },
          { action: 'Press both again', set: { right: true }, waitMs: 100, expect: { stroke: true } },
          { action: 'Release the left button', set: { left: false }, waitMs: 100, expect: { stroke: false } },
        ],
      },
    ],
  },
  {
    slug: 'door-alarm',
    title: 'Either door opens the alarm',
    level: 'beginner',
    summary: 'Sound an alarm when any of two doors is open: the OR gate.',
    concepts: ['OR'],
    brief: `A cold room has two doors with sensors that are ON while the door is **open**. Sound the alarm whenever at least one door is open.`,
    requirements: ['Both doors closed: no alarm.', 'Door A open: alarm.', 'Door B open: alarm.', 'Both open: alarm.'],
    hints: ['Which gate is true when one input or the other (or both) is true?'],
    starter: `circuit "Door alarm" version 1 {
  doorA: INPUT(label="Door A open")
  doorB: INPUT(label="Door B open")
  alarm: OUTPUT(label="Alarm horn")
}`,
    inputs: [
      { id: 'doorA', type: 'INPUT', label: 'Door A open' },
      { id: 'doorB', type: 'INPUT', label: 'Door B open' },
    ],
    outputs: [{ id: 'alarm', type: 'OUTPUT', label: 'Alarm horn' }],
    scenarios: [
      {
        name: 'Any open door sounds the alarm',
        steps: [
          { action: 'Keep both doors closed', waitMs: 200, expect: { alarm: false } },
          { action: 'Open door A', set: { doorA: true }, waitMs: 100, expect: { alarm: true } },
          { action: 'Also open door B', set: { doorB: true }, waitMs: 100, expect: { alarm: true } },
          { action: 'Close door A', set: { doorA: false }, waitMs: 100, expect: { alarm: true } },
          { action: 'Close door B', set: { doorB: false }, waitMs: 100, expect: { alarm: false } },
        ],
      },
    ],
  },
  {
    slug: 'empty-hopper',
    title: 'Empty hopper warning',
    level: 'beginner',
    summary: 'Light a lamp when a sensor does NOT see product.',
    concepts: ['NOT'],
    brief: `A level sensor on a hopper is ON while it detects product. The operator needs a warning lamp that is lit when the hopper is **empty**, so it can be refilled before the line stops.`,
    requirements: ['Product detected: lamp off.', 'No product detected: lamp on.'],
    hints: ['You need to invert the signal.'],
    starter: `circuit "Empty hopper" version 1 {
  product: INPUT(label="Product detected")
  refill: OUTPUT(label="Refill lamp")
}`,
    inputs: [{ id: 'product', type: 'INPUT', label: 'Product detected' }],
    outputs: [{ id: 'refill', type: 'OUTPUT', label: 'Refill lamp' }],
    scenarios: [
      {
        name: 'Lamp shows an empty hopper',
        steps: [
          { action: 'Start with an empty hopper', waitMs: 200, expect: { refill: true } },
          { action: 'Fill the hopper', set: { product: true }, waitMs: 100, expect: { refill: false } },
          { action: 'Hopper runs empty', set: { product: false }, waitMs: 100, expect: { refill: true } },
        ],
      },
    ],
  },
  {
    slug: 'start-stop',
    title: 'Start / stop with memory',
    level: 'beginner',
    summary: 'Push buttons spring back. Make the motor remember it was started.',
    concepts: ['Latching', 'Stop priority'],
    brief: `Start and Stop are momentary push buttons: they are only ON while held. A motor must keep running after the Start button is released, and stop when Stop is pressed.

If both buttons are pressed at once, **Stop must win**. That is the safe choice.`,
    requirements: ['Pressing Start starts the motor.', 'The motor keeps running after Start is released.', 'Pressing Stop stops it.', 'Start and Stop together: motor off.'],
    hints: [
      'The circuit needs memory. Look in Memory & utilities.',
      'A latching relay has a Set and a Reset input. Which one should win?',
    ],
    starter: `circuit "Start stop" version 1 {
  start: INPUT(label="Start button")
  stop: INPUT(label="Stop button")
  motor: OUTPUT(label="Motor")
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start button' },
      { id: 'stop', type: 'INPUT', label: 'Stop button' },
    ],
    outputs: [{ id: 'motor', type: 'OUTPUT', label: 'Motor' }],
    scenarios: [
      {
        name: 'Start, release, stop',
        steps: [
          { action: 'Do nothing', waitMs: 200, expect: { motor: false } },
          { action: 'Press Start', set: { start: true }, waitMs: 100, expect: { motor: true } },
          { action: 'Release Start', set: { start: false }, waitMs: 500, expect: { motor: true } },
          { action: 'Press Stop', set: { stop: true }, waitMs: 100, expect: { motor: false } },
          { action: 'Release Stop', set: { stop: false }, waitMs: 500, expect: { motor: false } },
        ],
      },
      {
        name: 'Stop wins over Start',
        steps: [
          { action: 'Press Start and Stop together', set: { start: true, stop: true }, waitMs: 200, expect: { motor: false } },
          { action: 'Release Stop while still holding Start', set: { stop: false }, waitMs: 100, expect: { motor: true } },
          { action: 'Press Stop while still holding Start', set: { stop: true }, waitMs: 100, expect: { motor: false } },
        ],
      },
    ],
  },
  {
    slug: 'delayed-fan',
    title: 'Delayed fan start',
    level: 'beginner',
    summary: 'Start a fan 3 seconds after the switch, and only if the switch stays on.',
    concepts: ['On-delay timer'],
    brief: `A large exhaust fan should not start the instant someone flips its switch: a 3-second delay lets dampers open first. If the switch is turned off before the delay is over, the fan must not start, and the delay starts again from zero next time.`,
    requirements: ['Fan starts 3 s after the switch is turned on.', 'Turning the switch off stops the fan immediately.', 'A switch-on shorter than 3 s never starts the fan.'],
    hints: ['Timers live in the Timers category.', 'An on-delay (TON) output turns on after its input has been on for the set time. Durations are in milliseconds.'],
    starter: `circuit "Delayed fan" version 1 {
  switch: INPUT(label="Fan switch")
  fan: OUTPUT(label="Fan")
}`,
    inputs: [{ id: 'switch', type: 'INPUT', label: 'Fan switch' }],
    outputs: [{ id: 'fan', type: 'OUTPUT', label: 'Fan' }],
    scenarios: [
      {
        name: 'Starts after 3 s and stops at once',
        steps: [
          { action: 'Turn the switch on', set: { switch: true }, waitMs: 2900, expect: { fan: false } },
          { action: 'Keep it on a little longer', waitMs: 100, expect: { fan: true } },
          { action: 'Turn the switch off', set: { switch: false }, waitMs: 100, expect: { fan: false } },
        ],
      },
      {
        name: 'A short switch-on does not count',
        steps: [
          { action: 'Turn the switch on for 2 s', set: { switch: true }, waitMs: 2000, expect: { fan: false } },
          { action: 'Turn it off briefly', set: { switch: false }, waitMs: 200, expect: { fan: false } },
          { action: 'Turn it on again for 2 s', set: { switch: true }, waitMs: 2000, expect: { fan: false } },
          { action: 'Keep it on another second', waitMs: 1000, expect: { fan: true } },
        ],
      },
    ],
  },
  {
    slug: 'stairwell-light',
    title: 'Stairwell light',
    level: 'beginner',
    summary: 'Keep a light on for 5 seconds after the button is released.',
    concepts: ['Off-delay timer'],
    brief: `Each floor of a stairwell has a push button. Pressing it switches the light on; after the button is released the light stays on for **5 seconds**, then switches off. Pressing again while the light is still on restarts the 5 seconds.`,
    requirements: ['Light on as soon as the button is pressed.', 'Light stays on 5 s after release, then turns off.', 'A new press restarts the 5 s.'],
    hints: ['The opposite of an on-delay is an off-delay (TOF).'],
    starter: `circuit "Stairwell light" version 1 {
  button: INPUT(label="Push button")
  light: OUTPUT(label="Stair light")
}`,
    inputs: [{ id: 'button', type: 'INPUT', label: 'Push button' }],
    outputs: [{ id: 'light', type: 'OUTPUT', label: 'Stair light' }],
    scenarios: [
      {
        name: 'On while pressed, off 5 s after release',
        steps: [
          { action: 'Press the button', set: { button: true }, waitMs: 100, expect: { light: true } },
          { action: 'Release and wait 4.9 s', set: { button: false }, waitMs: 4900, expect: { light: true } },
          { action: 'Wait another 0.1 s', waitMs: 100, expect: { light: false } },
        ],
      },
      {
        name: 'Pressing again restarts the time',
        steps: [
          { action: 'Press and release', set: { button: true }, waitMs: 100 },
          { action: 'Wait 3 s', set: { button: false }, waitMs: 3000, expect: { light: true } },
          { action: 'Press again', set: { button: true }, waitMs: 100 },
          { action: 'Release and wait 4.9 s', set: { button: false }, waitMs: 4900, expect: { light: true } },
          { action: 'Wait another 0.1 s', waitMs: 100, expect: { light: false } },
        ],
      },
    ],
  },
  {
    slug: 'batch-counter',
    title: 'Count a batch of five',
    level: 'intermediate',
    summary: 'Count parts on a conveyor and signal when a box is full.',
    concepts: ['Counter', 'Edges', 'Reset'],
    brief: `A photo-eye is ON while a part passes in front of it. Five parts fill a box. Light **Box full** once five parts have passed, until the operator presses **Reset** after swapping the box.

A part that stops in front of the sensor must still count only once.`,
    requirements: ['Box full turns on after the fifth part.', 'It stays on until Reset.', 'Reset starts a new count.', 'A part that lingers in front of the sensor counts once.'],
    hints: ['Look in Counters.', 'The up/down counter counts rising edges on CU and turns Q on when the count reaches its limit.'],
    starter: `circuit "Batch counter" version 1 {
  eye: INPUT(label="Photo-eye")
  reset: INPUT(label="Reset")
  full: OUTPUT(label="Box full")
}`,
    inputs: [
      { id: 'eye', type: 'INPUT', label: 'Photo-eye' },
      { id: 'reset', type: 'INPUT', label: 'Reset' },
    ],
    outputs: [{ id: 'full', type: 'OUTPUT', label: 'Box full' }],
    scenarios: [
      {
        name: 'Five parts fill a box',
        steps: [
          ...[1, 2, 3, 4].flatMap((n) => [
            { action: `Part ${n} arrives`, set: { eye: true }, waitMs: 200 },
            { action: `Part ${n} leaves`, set: { eye: false }, waitMs: 200, expect: { full: false } },
          ]),
          { action: 'Part 5 arrives', set: { eye: true }, waitMs: 200 },
          { action: 'Part 5 leaves', set: { eye: false }, waitMs: 1000, expect: { full: true } },
          { action: 'Press Reset', set: { reset: true }, waitMs: 100, expect: { full: false } },
          { action: 'Release Reset', set: { reset: false }, waitMs: 100, expect: { full: false } },
        ],
      },
      {
        name: 'A lingering part counts once',
        steps: [
          { action: 'A part stops in front of the eye for 3 s', set: { eye: true }, waitMs: 3000 },
          { action: 'It moves on', set: { eye: false }, waitMs: 100, expect: { full: false } },
          ...[2, 3, 4].flatMap((n) => [
            { action: `Part ${n} arrives`, set: { eye: true }, waitMs: 100 },
            { action: `Part ${n} leaves`, set: { eye: false }, waitMs: 100, expect: { full: false } },
          ]),
        ],
      },
    ],
  },
  {
    slug: 'tank-level',
    title: 'Fill a tank without chattering',
    level: 'intermediate',
    summary: 'Run a pump between a low and a high level: hysteresis.',
    concepts: ['Analog input', 'Hysteresis'],
    brief: `A level transmitter reports the tank level in percent. A fill pump must start when the level falls to **20 % or below**, and keep running until the level reaches **80 % or more**. In between, it keeps doing whatever it was doing.

A single threshold would switch the pump on and off many times a minute as the surface ripples, wearing out the motor starter. The gap between the two levels is called **hysteresis**.`,
    requirements: ['Level ≤ 20 %: pump starts.', 'Pump keeps running between 20 % and 80 % while filling.', 'Level ≥ 80 %: pump stops.', 'Pump stays off between 80 % and 20 % while the tank drains.'],
    hints: [
      'Analog processing has a block with separate on and off thresholds.',
      'Alternatively: two comparators and a latching relay.',
    ],
    starter: `circuit "Tank level" version 1 {
  level: ANALOG_INPUT(label="Tank level %", value=50)
  pump: OUTPUT(label="Fill pump")
}`,
    inputs: [{ id: 'level', type: 'ANALOG_INPUT', label: 'Tank level %' }],
    outputs: [{ id: 'pump', type: 'OUTPUT', label: 'Fill pump' }],
    scenarios: [
      {
        name: 'Fill and drain cycle',
        steps: [
          { action: 'Level at 50 %', set: { level: 50 }, waitMs: 200, expect: { pump: false } },
          { action: 'Level drains to 25 %', set: { level: 25 }, waitMs: 200, expect: { pump: false } },
          { action: 'Level reaches 20 %', set: { level: 20 }, waitMs: 200, expect: { pump: true } },
          { action: 'Filling: 50 %', set: { level: 50 }, waitMs: 200, expect: { pump: true } },
          { action: 'Filling: 79 %', set: { level: 79 }, waitMs: 200, expect: { pump: true } },
          { action: 'Level reaches 80 %', set: { level: 80 }, waitMs: 200, expect: { pump: false } },
          { action: 'Draining: 50 %', set: { level: 50 }, waitMs: 200, expect: { pump: false } },
          { action: 'Draining: 21 %', set: { level: 21 }, waitMs: 200, expect: { pump: false } },
          { action: 'Level drops to 10 %', set: { level: 10 }, waitMs: 200, expect: { pump: true } },
        ],
      },
    ],
  },
  {
    slug: 'one-shot-valve',
    title: 'One shot per press',
    level: 'intermediate',
    summary: 'Open a dosing valve for about one second per press, however long the button is held.',
    concepts: ['Pulse timer', 'Edges'],
    brief: `An operator doses additive by pressing a button. Each press must open the valve for **about one second**, whether the button is tapped or held down. Pressing again while the valve is still open must **not** extend the dose.`,
    requirements: ['A press opens the valve.', 'It closes about 1 s later, even if the button is still held.', 'Releasing early does not shorten the dose.', 'A second press during a dose does not extend it.'],
    hints: ['The Timers category has a block that produces a fixed-length pulse.'],
    starter: `circuit "One shot valve" version 1 {
  button: INPUT(label="Dose button")
  valve: OUTPUT(label="Dosing valve")
}`,
    inputs: [{ id: 'button', type: 'INPUT', label: 'Dose button' }],
    outputs: [{ id: 'valve', type: 'OUTPUT', label: 'Dosing valve' }],
    scenarios: [
      {
        name: 'Holding the button gives one dose',
        steps: [
          { action: 'Press and hold', set: { button: true }, waitMs: 500, expect: { valve: true } },
          { action: 'Keep holding for another second', waitMs: 1000, expect: { valve: false } },
          { action: 'Release', set: { button: false }, waitMs: 500, expect: { valve: false } },
        ],
      },
      {
        name: 'A tap gives a full dose',
        steps: [
          { action: 'Tap the button', set: { button: true }, waitMs: 200 },
          { action: 'Release', set: { button: false }, waitMs: 300, expect: { valve: true } },
          { action: 'Wait', waitMs: 1000, expect: { valve: false } },
        ],
      },
      {
        name: 'Pressing again does not extend the dose',
        steps: [
          { action: 'Press', set: { button: true }, waitMs: 300 },
          { action: 'Release', set: { button: false }, waitMs: 300 },
          { action: 'Press again while dosing', set: { button: true }, waitMs: 300, expect: { valve: true } },
          { action: 'Release', set: { button: false }, waitMs: 400, expect: { valve: false } },
        ],
      },
    ],
  },
  {
    slug: 'guarded-machine',
    title: 'Machine guard interlock',
    level: 'intermediate',
    summary: 'A start/stop circuit that respects a guard door and never restarts by itself.',
    concepts: ['Latching', 'Permissives', 'No automatic restart'],
    brief: `A machine runs from Start and Stop buttons, and has a guard door with a switch that is ON while the guard is **closed**.

- Start only works while the guard is closed.
- Opening the guard stops the machine.
- Closing the guard again must **not** restart it: the operator has to press Start. A machine that starts on its own is a classic cause of injuries.

*Real guard interlocks also use safety-rated hardware. This exercise covers the control logic.*`,
    requirements: ['Start runs the machine only with the guard closed.', 'Opening the guard stops it.', 'Closing the guard does not restart it.', 'Stop stops it.'],
    hints: ['Start from your start/stop latch.', 'What should reset the latch besides the Stop button?'],
    starter: `circuit "Guarded machine" version 1 {
  start: INPUT(label="Start button")
  stop: INPUT(label="Stop button")
  guard: INPUT(label="Guard closed", value=true)
  motor: OUTPUT(label="Machine motor")
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start button' },
      { id: 'stop', type: 'INPUT', label: 'Stop button' },
      { id: 'guard', type: 'INPUT', label: 'Guard closed' },
    ],
    outputs: [{ id: 'motor', type: 'OUTPUT', label: 'Machine motor' }],
    scenarios: [
      {
        name: 'Normal start and stop',
        steps: [
          { action: 'Guard closed, nothing pressed', set: { guard: true }, waitMs: 200, expect: { motor: false } },
          { action: 'Press Start', set: { start: true }, waitMs: 100 },
          { action: 'Release Start', set: { start: false }, waitMs: 300, expect: { motor: true } },
          { action: 'Press Stop', set: { stop: true }, waitMs: 100, expect: { motor: false } },
          { action: 'Release Stop', set: { stop: false }, waitMs: 300, expect: { motor: false } },
        ],
      },
      {
        name: 'Opening the guard stops the machine for good',
        steps: [
          { action: 'Start the machine', set: { guard: true, start: true }, waitMs: 100 },
          { action: 'Release Start', set: { start: false }, waitMs: 200, expect: { motor: true } },
          { action: 'Open the guard', set: { guard: false }, waitMs: 100, expect: { motor: false } },
          { action: 'Close the guard', set: { guard: true }, waitMs: 500, expect: { motor: false } },
          { action: 'Press Start', set: { start: true }, waitMs: 100 },
          { action: 'Release Start', set: { start: false }, waitMs: 200, expect: { motor: true } },
        ],
      },
      {
        name: 'Start is ignored while the guard is open',
        steps: [
          { action: 'Open the guard and press Start', set: { guard: false, start: true }, waitMs: 200, expect: { motor: false } },
          { action: 'Release Start', set: { start: false }, waitMs: 100 },
          { action: 'Close the guard', set: { guard: true }, waitMs: 500, expect: { motor: false } },
        ],
      },
    ],
  },
  {
    slug: 'flashing-beacon',
    title: 'Flashing fault beacon',
    level: 'intermediate',
    summary: 'Flash a beacon about once a second while a fault is active.',
    concepts: ['Pulse generator', 'Gating'],
    brief: `A steady light is easy to ignore. While the **Fault** input is on, the beacon must flash: about half a second on, half a second off. When the fault clears, the beacon goes dark immediately.`,
    requirements: ['No fault: beacon off.', 'Fault: beacon flashes with roughly a 1 s period and 50 % on-time.', 'Fault cleared: beacon off straight away.'],
    hints: ['Timers include a block that produces a steady on/off pulse train.', 'Then only let the pulses through while the fault is active.'],
    starter: `circuit "Flashing beacon" version 1 {
  fault: INPUT(label="Fault")
  beacon: OUTPUT(label="Beacon")
}`,
    inputs: [{ id: 'fault', type: 'INPUT', label: 'Fault' }],
    outputs: [{ id: 'beacon', type: 'OUTPUT', label: 'Beacon' }],
    scenarios: [
      {
        name: 'Flashes during a fault',
        steps: [
          { action: 'No fault for 2 s', waitMs: 2000, during: [{ id: 'beacon', onShare: [0, 0] }] },
          { action: 'Fault for 4 s', set: { fault: true }, waitMs: 4000, during: [{ id: 'beacon', onShare: [0.35, 0.65], minChanges: 6 }] },
          { action: 'Clear the fault', set: { fault: false }, waitMs: 100, expect: { beacon: false } },
          { action: 'Stay clear for 2 s', waitMs: 2000, during: [{ id: 'beacon', onShare: [0, 0] }] },
        ],
      },
    ],
  },
  {
    slug: 'sensor-scaling',
    title: 'Scale a 4–20 mA transmitter',
    level: 'intermediate',
    summary: 'Turn a raw current into percent and raise a high-level alarm.',
    concepts: ['Analog scaling', 'Thresholds'],
    brief: `Industrial transmitters send **4 mA** at the bottom of their range and **20 mA** at the top. The value must be converted to **0–100 %** before anyone can make sense of it. Using 4 mA rather than 0 for "empty" lets the system tell an empty tank (4 mA) from a broken wire (0 mA).

Convert the current into a percentage on **Level %**, and turn on **High alarm** when the level is at or above 80 %.`,
    requirements: ['4 mA → 0 %.', '12 mA → 50 %.', '20 mA → 100 %.', 'High alarm at 80 % or more.'],
    hints: [
      'The scaling is a straight line: percent = (mA − 4) × 100 / 16.',
      'The analog amplifier computes A × gain + offset. Which gain and offset give 0 at 4 and 100 at 20?',
    ],
    starter: `circuit "Sensor scaling" version 1 {
  current: ANALOG_INPUT(label="Transmitter mA", value=4)
  percent: ANALOG_OUTPUT(label="Level %")
  alarm: OUTPUT(label="High alarm")
}`,
    inputs: [{ id: 'current', type: 'ANALOG_INPUT', label: 'Transmitter mA' }],
    outputs: [
      { id: 'percent', type: 'ANALOG_OUTPUT', label: 'Level %' },
      { id: 'alarm', type: 'OUTPUT', label: 'High alarm' },
    ],
    scenarios: [
      {
        name: 'Scaling across the range',
        steps: [
          { action: 'Transmitter at 4 mA', set: { current: 4 }, waitMs: 100, expect: { percent: 0, alarm: false } },
          { action: 'Transmitter at 12 mA', set: { current: 12 }, waitMs: 100, expect: { percent: 50, alarm: false } },
          { action: 'Transmitter at 20 mA', set: { current: 20 }, waitMs: 100, expect: { percent: 100, alarm: true } },
        ],
      },
      {
        name: 'High alarm threshold',
        steps: [
          { action: 'Transmitter at 16.6 mA (78.75 %)', set: { current: 16.6 }, waitMs: 100, expect: { alarm: false } },
          { action: 'Transmitter at 17 mA (81.25 %)', set: { current: 17 }, waitMs: 100, expect: { percent: 81.25, alarm: true } },
          { action: 'Back to 10 mA', set: { current: 10 }, waitMs: 100, expect: { alarm: false } },
        ],
      },
    ],
  },
  {
    slug: 'star-delta',
    title: 'Star-delta starter',
    level: 'advanced',
    summary: 'Start a motor in star, switch to delta after 3 s, and never energise both.',
    concepts: ['Sequencing', 'Timers', 'Interlocks'],
    brief: `Large motors are often started in **star** to limit the starting current, then switched to **delta** for full power.

- Pressing Start energises the star contactor.
- After **3 seconds** the star contactor drops out and the delta contactor pulls in.
- Delta stays on until Stop is pressed. Stop turns everything off.
- Star and delta must **never** be on at the same time. That would be a short circuit.

*Real starters add a short dead time between star and delta and use mechanically interlocked contactors.*`,
    requirements: ['Start: star on, delta off.', 'After 3 s: star off, delta on.', 'Stop: both off.', 'Star and delta never on together.', 'The motor can be started again after a stop.'],
    hints: [
      'Begin with a start/stop latch: "the motor is running".',
      'Feed "running" into an on-delay timer.',
      'Star = running AND NOT timer done. Delta = running AND timer done.',
    ],
    starter: `circuit "Star-delta starter" version 1 {
  start: INPUT(label="Start button")
  stop: INPUT(label="Stop button")
  star: OUTPUT(label="Star contactor")
  delta: OUTPUT(label="Delta contactor")
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start button' },
      { id: 'stop', type: 'INPUT', label: 'Stop button' },
    ],
    outputs: [
      { id: 'star', type: 'OUTPUT', label: 'Star contactor' },
      { id: 'delta', type: 'OUTPUT', label: 'Delta contactor' },
    ],
    never: [{ when: { star: true, delta: true }, message: 'Star and delta were on together' }],
    scenarios: [
      {
        name: 'Star, then delta, then stop',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 100, expect: { star: true, delta: false } },
          { action: 'Release Start and wait 2.8 s', set: { start: false }, waitMs: 2800, expect: { star: true, delta: false } },
          { action: 'Wait until 3 s have passed', waitMs: 200, expect: { star: false, delta: true } },
          { action: 'Run for a while', waitMs: 2000, expect: { star: false, delta: true } },
          { action: 'Press Stop', set: { stop: true }, waitMs: 100, expect: { star: false, delta: false } },
          { action: 'Release Stop', set: { stop: false }, waitMs: 1000, expect: { star: false, delta: false } },
        ],
      },
      {
        name: 'Restart after a stop during star',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 100 },
          { action: 'Release Start, wait 1 s', set: { start: false }, waitMs: 1000, expect: { star: true } },
          { action: 'Press Stop during star', set: { stop: true }, waitMs: 100, expect: { star: false, delta: false } },
          { action: 'Release Stop', set: { stop: false }, waitMs: 500 },
          { action: 'Press Start again', set: { start: true }, waitMs: 100, expect: { star: true, delta: false } },
          { action: 'Release Start, wait 3 s', set: { start: false }, waitMs: 3000, expect: { star: false, delta: true } },
        ],
      },
    ],
  },
];

export function getChallenge(slug: string): Challenge | undefined {
  return CHALLENGES.find((challenge) => challenge.slug === slug);
}
