import type { BlockType } from './types.ts';

/**
 * Hand-written explanations for the most searched blocks. Every statement here describes the
 * simulator's actual behaviour (see LogicEngine.ts); keep them in sync when behaviour changes.
 */
export interface BlockGuide {
  /** Search-friendly page title, e.g. "TON on-delay timer". */
  headline: string;
  /** Markdown: how it behaves, precisely. */
  behaviour: string;
  uses: string[];
  mistakes: string[];
  /** Challenge slugs that practise this block. */
  challenges?: string[];
}

export const BLOCK_GUIDES: Partial<Record<BlockType, BlockGuide>> = {
  AND: {
    headline: 'AND gate',
    behaviour: 'Q is ON only while **both** A and B are ON. It has no memory: the output depends only on the inputs in the current scan.',
    uses: ['Permissives: "run only if the start request AND the guard is closed".', 'Two-hand controls (logic part).', 'Gating a pulse train so it only passes while a condition is true.'],
    mistakes: ['Using AND where the circuit must remember an event: a released push button turns the output off again. Add a latch.', 'Unconnected inputs read OFF, so an AND with one input unwired is always OFF.'],
    challenges: ['two-hand-start', 'flashing-beacon'],
  },
  OR: {
    headline: 'OR gate',
    behaviour: 'Q is ON while A **or** B (or both) is ON.',
    uses: ['Alarms from any of several sensors.', 'Several places that can start the same thing.', 'Seal-in rungs: start OR "already running".'],
    mistakes: ['Expecting OR to choose one signal over another; use a MUX for that.'],
    challenges: ['door-alarm'],
  },
  NOT: {
    headline: 'NOT gate (inverter)',
    behaviour: 'Q is the opposite of A: ON when A is OFF, OFF when A is ON.',
    uses: ['"No product detected" from a presence sensor.', 'Turning a stop button into a "stop not pressed" permissive.'],
    mistakes: ['Inverting a normally closed device twice. Decide once what ON means for each signal and name it accordingly.'],
    challenges: ['empty-hopper'],
  },
  XOR: {
    headline: 'XOR gate (exclusive OR)',
    behaviour: 'Q is ON when exactly one of A and B is ON, and OFF when both are the same.',
    uses: ['Two-way staircase switching (either switch toggles the light).', 'Discrepancy checks: two sensors that should agree but do not.'],
    mistakes: ['Using XOR as an "either" alarm: it turns OFF when both inputs are ON.'],
  },
  RS_LATCH: {
    headline: 'RS latch (set/reset memory, reset dominant)',
    behaviour: 'A pulse on **S** turns Q ON and it stays ON after S is released. A pulse on **R** turns it OFF. If S and R are ON at the same time, **R wins** and Q is OFF. This reset priority is the safe choice for start/stop circuits.',
    uses: ['Motor start/stop with momentary push buttons.', 'Remembering that an alarm happened until it is acknowledged.', 'Hysteresis with two comparators (set below the low limit, reset above the high limit).'],
    mistakes: ['Wiring Stop to S and Start to R: then Start wins over Stop.', 'Forgetting to reset the latch when a permissive is lost, so the machine restarts by itself when the guard closes.'],
    challenges: ['start-stop', 'guarded-machine', 'star-delta'],
  },
  PULSE_RELAY: {
    headline: 'Pulse relay (toggle flip-flop)',
    behaviour: 'Each **rising edge** of A (OFF→ON) flips Q. Holding A ON does nothing more; it must go OFF and ON again to toggle again.',
    uses: ['One push button that turns a light on and off.', 'Alternating between two pumps on every start.'],
    mistakes: ['Feeding it a signal that bounces or flickers: every flicker toggles the output. Debounce first with a short on-delay.'],
  },
  R_TRIG: {
    headline: 'Rising edge trigger (R_TRIG, one-shot)',
    behaviour: 'Q is ON for exactly **one scan** when A changes from OFF to ON, then OFF again even if A stays ON. In this simulator a scan is 100 ms.',
    uses: ['Counting parts: count the moment a part arrives, not every scan it is present.', 'Starting a sequence step once per button press.'],
    mistakes: ['Driving an output directly with it: a one-scan pulse is too short to see or to move a real actuator. Stretch it with a pulse timer.'],
    challenges: ['batch-counter'],
  },
  F_TRIG: {
    headline: 'Falling edge trigger (F_TRIG)',
    behaviour: 'Q is ON for exactly one scan when A changes from ON to OFF.',
    uses: ['Doing something when a part leaves a sensor or a button is released.', 'Counting down on the falling edge of a signal.'],
    mistakes: ['Expecting a pulse at power-up: there is no falling edge until A has been ON.'],
  },
  TON: {
    headline: 'TON on-delay timer',
    behaviour: 'While A is ON, the elapsed time **ET** counts up in milliseconds. When ET reaches the set **duration**, Q turns ON and stays ON as long as A stays ON. The moment A goes OFF, Q turns OFF and ET resets to 0, so an interrupted input starts the delay again from zero.\n\nTime advances once per scan (100 ms here), so delays are resolved to the scan time.',
    uses: ['Start a fan a few seconds after its switch, so dampers can open first.', 'Debouncing: only accept a sensor after it has been ON for 200 ms.', 'Star-delta changeover after the motor has run up.', 'Raising an alarm only if a condition lasts long enough.'],
    mistakes: ['Expecting the timer to keep counting when A blinks OFF briefly: it restarts. Use a retentive timer (TONR) to accumulate.', 'Entering seconds: durations are milliseconds, so 3 s is 3000.'],
    challenges: ['delayed-fan', 'star-delta'],
  },
  TOF: {
    headline: 'TOF off-delay timer',
    behaviour: 'When A turns ON, Q turns ON **immediately**. When A turns OFF, Q stays ON for the set **duration**, then turns OFF. If A comes back ON during that time, Q stays ON and the delay starts again from zero the next time A goes OFF.',
    uses: ['Stairwell lights that stay on after the button is released.', 'Running a cooling fan on after a motor stops.', 'Stretching a short pulse into one long enough to see.'],
    mistakes: ['Using it to delay switching ON. That is the on-delay (TON).'],
    challenges: ['stairwell-light'],
  },
  ON_OFF_DELAY: {
    headline: 'On/off-delay timer',
    behaviour: 'Combines both delays: Q turns ON after A has been ON for the **on delay**, and turns OFF after A has been OFF for the **off delay**. ET shows whichever delay is currently running.',
    uses: ['Filtering a noisy level switch in both directions.', 'Valves that must open late and close late.'],
    mistakes: ['Setting both delays long on a safety-related signal: trips get slower too.'],
  },
  RETENTIVE_TON: {
    headline: 'Retentive on-delay timer (TONR)',
    behaviour: 'While A is ON, ET counts up; when A goes OFF, ET is **kept**, not reset. Q turns ON once the accumulated time reaches the duration and stays ON until **R** resets ET to 0.',
    uses: ['Maintenance reminders after a total running time.', 'Process steps that need a total exposure time even if interrupted.'],
    mistakes: ['Forgetting to wire R: once done, the timer stays done forever.'],
  },
  PULSE_TIMER: {
    headline: 'Pulse timer (TP, wiping relay)',
    behaviour: 'A **rising edge** on A starts a pulse: Q is ON for the set duration, whether A is released early or held longer. New edges during the pulse are ignored, so pressing again cannot extend it.',
    uses: ['A fixed dose per button press.', 'A horn that sounds for exactly two seconds per event.'],
    mistakes: ['Expecting the pulse to retrigger on each press. Use the edge-triggered wiping relay for that.'],
    challenges: ['one-shot-valve'],
  },
  EDGE_PULSE_TIMER: {
    headline: 'Edge-triggered pulse timer (retriggerable)',
    behaviour: 'Every rising edge on A starts the pulse **again from zero**, so repeated presses extend it. **R** cancels the pulse immediately.',
    uses: ['Watchdogs: keep Q ON while pulses keep arriving.', 'Presence lighting that stays on while motion keeps being detected.'],
    mistakes: ['Using it where a second press must not extend the pulse.'],
  },
  CLOCK: {
    headline: 'Pulse generator (clock)',
    behaviour: 'A free-running square wave: OFF for the **off time**, then ON for the **on time**, repeating from the start of the simulation. It needs no input.',
    uses: ['Flashing beacons and blinking indicators (gate the clock with AND).', 'Periodic sampling or polling.'],
    mistakes: ['Expecting it to start "fresh" when a fault appears: it keeps its own rhythm. Gate it, or build a start-synchronised oscillator from timers.'],
    challenges: ['flashing-beacon'],
  },
  COUNTER: {
    headline: 'Up/down counter (CTUD)',
    behaviour: 'Each rising edge on **CU** adds 1 to the count **CV**, each rising edge on **CD** subtracts 1. **R** sets the count to 0 and takes priority. **Q** is ON while CV is at or above the **limit**. Because it counts edges, an input that stays ON counts once.',
    uses: ['Parts per box, bottles per crate.', 'Counting cycles until a maintenance stop.', 'Tracking how many items are inside a zone (in on CU, out on CD).'],
    mistakes: ['Forgetting the reset, so the counter never starts a new batch.', 'Counting a bouncing contact: every bounce counts. Debounce with a short TON first.'],
    challenges: ['batch-counter'],
  },
  ANALOG_COMPARATOR: {
    headline: 'Analog comparator',
    behaviour: 'Compares two numbers A and B with the chosen operator (>, ≥, <, ≤, =, ≠) and turns Q ON when the comparison is true.',
    uses: ['High and low alarms against a setpoint block.', 'Comparing two transmitters that should agree.'],
    mistakes: ['Switching a pump directly from one comparator: it chatters when the value hovers at the limit. Add hysteresis.', 'Using "=" on measured values, which are rarely exactly equal.'],
    challenges: ['tank-level'],
  },
  ANALOG_THRESHOLD: {
    headline: 'Analog threshold trigger',
    behaviour: 'Q is ON while A is **at or above** the threshold parameter.',
    uses: ['A single high alarm with a fixed limit.'],
    mistakes: ['Expecting hysteresis: there is none. Use the differential trigger for separate on and off levels.'],
    challenges: ['sensor-scaling'],
  },
  ANALOG_DIFFERENTIAL: {
    headline: 'Hysteresis switch (analog differential trigger)',
    behaviour: 'Switches with two separate thresholds, so small ripples cannot make the output chatter.\n\n- If **on threshold > off threshold** (high trigger): Q turns ON when A rises to the on threshold or above, and OFF when A falls to the off threshold or below.\n- If **on threshold ≤ off threshold** (low trigger): Q turns ON when A falls to the on threshold or below, and OFF when A rises to the off threshold or above. This is the classic fill pump.\n\nBetween the thresholds Q keeps its previous state.',
    uses: ['Fill a tank between 20 % and 80 %.', 'Heater on below 18 °C, off above 21 °C.', 'Any on/off control that must not wear out a contactor.'],
    mistakes: ['Putting the thresholds the wrong way round and getting the opposite mode.', 'Making the band too narrow to absorb sensor noise.'],
    challenges: ['tank-level'],
  },
  ANALOG_AMPLIFIER: {
    headline: 'Analog scaling (gain and offset)',
    behaviour: 'Q = A × gain + offset. Any straight-line conversion can be written this way. For a 4–20 mA transmitter mapped to 0–100 %: gain = 100 / 16 = 6.25 and offset = −4 × 6.25 = −25.',
    uses: ['Raw input to engineering units.', 'Unit conversion (°C to °F: gain 1.8, offset 32).'],
    mistakes: ['Forgetting that values outside the input range extrapolate (21 mA becomes 106.25 %). Clamp or alarm explicitly if that matters.'],
    challenges: ['sensor-scaling'],
  },
  PI_CONTROLLER: {
    headline: 'PI controller with anti-windup',
    behaviour: 'Error e = SP − PV. Output = kp × e + I, where I grows by ki × e × Δt (seconds) every scan. The output is limited to [min, max], and I is clamped so that kp × e + I stays within those limits. That clamping is the **anti-windup**: the integral cannot build up while the output is saturated. **R** resets I to 0.',
    uses: ['Temperature, level and pressure loops driving a valve or a heater through PWM.'],
    mistakes: ['Tuning ki too high: the loop overshoots and oscillates.', 'Wrong sign: if a higher output lowers the process value, swap SP and PV.'],
  },
  PID_CONTROLLER: {
    headline: 'PID controller',
    behaviour: 'CV = kp × e + ki × ∫e dt + kd × de/dt, with e = SP − PV and time in seconds, limited to [min, max]. The integral stops accumulating while CV is at a limit (conditional integration). If **EN** is wired and OFF, CV is 0 and the controller resets.',
    uses: ['Fast loops where the derivative term damps overshoot, e.g. motor speed or position.'],
    mistakes: ['Using derivative on a noisy measurement: kd amplifies noise. Filter the PV first or set kd to 0.'],
  },
  PWM: {
    headline: 'PWM (pulse width modulation)',
    behaviour: 'Turns a 0–100 % duty value on input A into an ON/OFF pulse train: within every **period**, Q is ON for duty × period and OFF for the rest.',
    uses: ['Driving a heater through a solid-state relay from a PI output.', 'Dimming or proportioning with an on/off actuator.'],
    mistakes: ['Choosing a period shorter than the scan time; resolution is one scan (100 ms here).'],
  },
  ANALOG_FILTER: {
    headline: 'First-order low-pass filter',
    behaviour: 'Smooths a noisy signal: every scan the output moves a fraction α = Δt / (T + Δt) of the way toward the input, where T is the time constant. Larger T gives a smoother but slower signal.',
    uses: ['Calming a level transmitter on a turbulent tank.', 'Removing spikes before a comparator.'],
    mistakes: ['Filtering a safety trip signal so much that the trip is late.'],
  },
  AVERAGE: {
    headline: 'Moving average',
    behaviour: 'Outputs the average of the last N scan samples of A.',
    uses: ['Averaging a jittery flow or power reading for display.'],
    mistakes: ['Very large N on hardware: each sample uses memory. The Arduino export allows up to 256.'],
  },
  SCAN_DELAY: {
    headline: 'One-scan delay (feedback memory)',
    behaviour: 'Q is the value A had at the end of the **previous** scan. The simulator evaluates blocks in signal order and rejects loops, so any feedback (an output feeding back into its own logic) must pass through a scan delay. It makes the "previous scan" explicit, which is exactly how a PLC seal-in rung behaves.',
    uses: ['Seal-in start/stop: run = (start OR previous run) AND NOT stop.', 'Integrators and accumulators built from math blocks.'],
    mistakes: ['Expecting the delayed value in the same scan: downstream logic sees last scan\'s value, one scan late.'],
    challenges: ['start-stop'],
  },
  SHIFT_REGISTER: {
    headline: 'Shift register',
    behaviour: 'Holds up to 32 bits. On each rising edge of **CLK** it shifts: with **DIR** ON, bits move toward the top and D enters at the bottom, and Q shows the top bit; with DIR OFF, bits move toward the bottom, D enters at the top, and Q shows the bottom bit. **R** clears all bits.',
    uses: ['Tracking a reject along a conveyor: shift on every pitch, reject when the bit reaches the ejector.'],
    mistakes: ['Clocking on a signal that bounces: every edge shifts.'],
  },
  MATH_EXPRESSION: {
    headline: 'Math expression',
    behaviour: 'Evaluates a formula of the inputs A, B and C. Supported: + − × / %, power (^ or **), comparisons (<, <=, >, >=, ==, !=), &&, ||, !, the conditional `cond ? a : b`, the constants PI and E, and the functions abs, sqrt, cbrt, exp, log, log10, log2, sin, cos, tan, asin, acos, atan, atan2, min, max, pow, round, floor, ceil, sign, hypot and clamp. True is 1, false is 0. An invalid formula outputs 0 and shows a diagnostic.',
    uses: ['Custom scaling, square-root flow extraction (sqrt(A) × k), selecting between values.'],
    mistakes: ['Dividing by a value that can be 0: the result is replaced by 0, which can look like a real reading.'],
  },
};
