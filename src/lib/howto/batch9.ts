import type { HowTo } from './types.ts';

const PROCESS_NOTE =
  'This circuit includes a simulated process (the math and transfer-function blocks that turn the controller output into a temperature or pressure). On real hardware, delete those blocks and read the measured value from your sensor instead; the sketch below still contains them so that it runs as a demo.';

/** Ninth batch: closed-loop control and analog signal handling. */
export const HOW_TOS_BATCH_9: HowTo[] = [
  {
    slug: 'pi-temperature-control-explained',
    title: 'PID temperature control explained with a live PI loop (and PWM heater output)',
    description: 'How a PI controller holds a temperature: proportional and integral action, a simulated heater process, and PWM output to an SSR. Change the setpoint live.',
    answer:
      'A PI controller compares the setpoint with the measured temperature and sets the heater power from the error: the P part reacts to the size of the error now, the I part keeps adding up past error until it is zero. A PWM output then turns the power percentage into on/off pulses for a solid-state relay.',
    level: 'intermediate',
    explanation: `**The loop**: setpoint (SP) and process value (PV, the temperature) go into the controller; its output (0–100 % heater power) drives the heater; the heater changes the temperature; the temperature is measured again.

**P (proportional)**: output = kp × error. Big error, big power. On its own it always leaves a remaining error (see the P vs PI guide), because some error is needed to produce the power that holds the temperature.

**I (integral)**: adds ki × error × time every scan. As long as there is any error, the I part keeps growing, until the output is exactly what is needed and the error is zero.

**D (derivative)** reacts to how fast the error changes. It helps fast processes but amplifies noise, and many temperature loops run fine as PI.

The simulated oven here: temperature = 20 °C + 0.8 °C per % of heater power, with a 10 s time constant. With kp = 4 and ki = 0.4 it reaches 60 °C without overshoot in about a minute.

**PWM**: a solid-state relay can only be on or off, so the 0–100 % output becomes the on-share of a 1 s period.`,
    circuit: `circuit "PI temperature control" version 1 {
  sp: ANALOG_INPUT(label="Setpoint °C", value=60)
  pi: PI_CONTROLLER(label="PI controller", kp=4, ki=0.4, min=0, max=100)
  pwm: PWM(label="Heater PWM", period=1000)
  oven: MATH_EXPRESSION(label="Simulated oven: 20 + 0.8 × power", expr="20 + 0.8 * A")
  lag: TRANSFER_FUNCTION(label="Simulated thermal lag (10 s)", gain=1, tau=10000)
  band: MATH_EXPRESSION(label="Within 1 °C?", expr="abs(A - B) <= 1")
  temp: ANALOG_OUTPUT(label="Temperature °C")
  power: ANALOG_OUTPUT(label="Heater power %")
  inBand: ANALOG_OUTPUT(label="At setpoint (1 = yes)")
  ssr: OUTPUT(label="Heater SSR")
  sp.Q -> pi.SP
  lag.Q -> pi.PV
  pi.Q -> oven.A
  oven.Q -> lag.A
  pi.Q -> pwm.A
  sp.Q -> band.A
  lag.Q -> band.B
  lag.Q -> temp.A
  pi.Q -> power.A
  band.Q -> inBand.A
  pwm.Q -> ssr.A
}`,
    inputs: [{ id: 'sp', type: 'ANALOG_INPUT', label: 'Setpoint °C', device: 'HMI setpoint' }],
    outputs: [
      { id: 'temp', type: 'ANALOG_OUTPUT', label: 'Temperature °C', device: 'Measured value (simulated here)' },
      { id: 'power', type: 'ANALOG_OUTPUT', label: 'Heater power %', device: 'Controller output' },
      { id: 'inBand', type: 'ANALOG_OUTPUT', label: 'At setpoint (1 = yes)', device: 'Diagnostic' },
      { id: 'ssr', type: 'OUTPUT', label: 'Heater SSR', device: 'Solid-state relay for the heater' },
    ],
    tryIt: ['Press Run and watch the temperature rise to 60 °C in the logic analyzer.', 'Change the setpoint to 40 °C, then 80 °C.', 'Open the PI block settings and try other kp and ki values: too much ki overshoots.'],
    steps: [
      { title: 'Measure', text: 'PV from the temperature sensor, scaled to °C.' },
      { title: 'Control', text: 'PI block: SP, PV, output limited to 0–100 %.' },
      { title: 'Actuate', text: 'PWM to an SSR, or the analog output to a thyristor unit.' },
      { title: 'Tune', text: 'Raise kp until the response is quick without oscillating, then add ki until the remaining error disappears in reasonable time.' },
    ],
    mistakes: [
      'Wrong direction: if more output lowers the PV (cooling), swap SP and PV or use a reverse-acting controller.',
      'Too much integral gain: the temperature overshoots and oscillates.',
      'A PWM period much shorter than the SSR and heater can follow, or much longer than the process time constant.',
    ],
    faq: [
      { q: 'How do I tune a PID quickly?', a: 'Start with ki = 0 and raise kp until the loop just starts to oscillate (the ultimate gain), then use about half of that kp and add ki slowly. Ziegler–Nichols and relay auto-tuning formalise this.' },
      { q: 'What is anti-windup?', a: 'While the output is stuck at 0 or 100 %, the integral must stop growing, or it overshoots badly when the output comes back. The PI block in this simulator limits its integral so that P + I stays within the output range.' },
    ],
    blocks: ['PI_CONTROLLER', 'PID_CONTROLLER', 'PWM', 'TRANSFER_FUNCTION', 'MATH_EXPRESSION'],
    challenges: ['tank-level', 'sensor-scaling'],
    arduinoNote: PROCESS_NOTE,
    scenarios: [
      {
        name: 'Heat up and setpoint change',
        steps: [
          { action: 'Start: 5 s in', set: { sp: 60 }, waitMs: 5000, expect: { inBand: 0 } },
          { action: 'After 60 s', waitMs: 55000, expect: { inBand: 1 } },
          { action: 'Holding: PWM about 50 %', waitMs: 5000, expect: { inBand: 1 }, during: [{ id: 'ssr', onShare: [0.4, 0.6], minChanges: 6 }] },
          { action: 'Setpoint 40 °C', set: { sp: 40 }, waitMs: 3000, expect: { inBand: 0 } },
          { action: '60 s later', waitMs: 60000, expect: { inBand: 1 } },
        ],
      },
    ],
  },
  {
    slug: 'p-vs-pi-control-steady-state-error',
    title: 'P vs PI control: why a P controller leaves a steady-state error (offset)',
    description: 'Two identical heater loops side by side: proportional-only settles below the setpoint, PI reaches it. See the offset live and learn why it happens.',
    answer:
      'A P controller needs an error to produce any output, so it settles where the error is just big enough to hold the temperature: below the setpoint. Adding integral action removes the offset, because the integral keeps changing the output until the error is zero.',
    level: 'intermediate',
    explanation: `Both loops control the same simulated oven (20 °C + 0.8 °C per % power, 10 s lag) to 60 °C with kp = 4. The second one also has ki = 0.4.

**P only**: at steady state, power = 4 × error, and the oven needs power to stay hot. Solving 20 + 0.8 × 4 × (60 − T) = T gives **T ≈ 50.5 °C**: an offset of 9.5 °C that never goes away.

Raising kp reduces the offset (kp = 20 would leave about 2 °C) but makes the loop more aggressive and, in real processes with dead time, oscillate.

**PI**: the integral keeps growing while there is any error and settles at exactly the power the oven needs, so **T = 60 °C**.

That is why almost every industrial loop has integral action, and why P-only control is used mostly where an offset does not matter (some level controls in surge tanks).`,
    circuit: `circuit "P vs PI" version 1 {
  sp: ANALOG_INPUT(label="Setpoint °C", value=60)
  pOnly: PI_CONTROLLER(label="P only (ki = 0)", kp=4, ki=0, min=0, max=100)
  pi: PI_CONTROLLER(label="PI", kp=4, ki=0.4, min=0, max=100)
  ovenP: MATH_EXPRESSION(label="Oven 1", expr="20 + 0.8 * A")
  ovenPI: MATH_EXPRESSION(label="Oven 2", expr="20 + 0.8 * A")
  lagP: TRANSFER_FUNCTION(label="Lag 1", gain=1, tau=10000)
  lagPI: TRANSFER_FUNCTION(label="Lag 2", gain=1, tau=10000)
  offsetP: MATH_EXPRESSION(label="P offset between 3 and 15 °C?", expr="abs(A - B) > 3 && abs(A - B) < 15")
  offsetPI: MATH_EXPRESSION(label="PI error <= 0.5 °C?", expr="abs(A - B) <= 0.5")
  tempP: ANALOG_OUTPUT(label="Temperature, P only")
  tempPI: ANALOG_OUTPUT(label="Temperature, PI")
  pHasOffset: ANALOG_OUTPUT(label="P only has offset (1 = yes)")
  piAtSetpoint: ANALOG_OUTPUT(label="PI at setpoint (1 = yes)")
  sp.Q -> pOnly.SP
  lagP.Q -> pOnly.PV
  pOnly.Q -> ovenP.A
  ovenP.Q -> lagP.A
  sp.Q -> pi.SP
  lagPI.Q -> pi.PV
  pi.Q -> ovenPI.A
  ovenPI.Q -> lagPI.A
  sp.Q -> offsetP.A
  lagP.Q -> offsetP.B
  sp.Q -> offsetPI.A
  lagPI.Q -> offsetPI.B
  lagP.Q -> tempP.A
  lagPI.Q -> tempPI.A
  offsetP.Q -> pHasOffset.A
  offsetPI.Q -> piAtSetpoint.A
}`,
    inputs: [{ id: 'sp', type: 'ANALOG_INPUT', label: 'Setpoint °C', device: 'HMI setpoint' }],
    outputs: [
      { id: 'tempP', type: 'ANALOG_OUTPUT', label: 'Temperature, P only', device: 'Simulated' },
      { id: 'tempPI', type: 'ANALOG_OUTPUT', label: 'Temperature, PI', device: 'Simulated' },
      { id: 'pHasOffset', type: 'ANALOG_OUTPUT', label: 'P only has offset (1 = yes)', device: 'Diagnostic' },
      { id: 'piAtSetpoint', type: 'ANALOG_OUTPUT', label: 'PI at setpoint (1 = yes)', device: 'Diagnostic' },
    ],
    tryIt: ['Press Run and compare the two temperatures in the logic analyzer.', 'Raise kp on the P-only block: the offset shrinks but never disappears.', 'Change the setpoint: the P-only offset changes with it.'],
    steps: [
      { title: 'Run P only', text: 'Note where it settles.' },
      { title: 'Add integral', text: 'The offset disappears.' },
      { title: 'Compare the effort', text: 'Both end with the power the process needs; only PI finds it exactly.' },
    ],
    mistakes: [
      'Trying to remove offset by raising kp alone until the loop oscillates.',
      'Adding a fixed "bias" to a P controller: it only works at one operating point.',
      'Forgetting that the size of the offset depends on the load: it changes whenever the process does.',
    ],
    faq: [
      { q: 'Why not always use PID?', a: 'D action reacts to noise and is often unnecessary for slow processes. PI is the default for most loops; PID helps when the process has significant lag and needs a faster response.' },
      { q: 'What is the formula for the P-only offset?', a: 'For a process with steady-state gain K and a P controller with gain kp, the remaining error is 1 / (1 + K × kp) of the error you would have with no control.' },
    ],
    blocks: ['PI_CONTROLLER', 'TRANSFER_FUNCTION', 'MATH_EXPRESSION'],
    challenges: ['tank-level'],
    arduinoNote: PROCESS_NOTE,
    scenarios: [
      {
        name: 'Steady state',
        steps: [
          { action: 'After 90 s', set: { sp: 60 }, waitMs: 90000, expect: { pHasOffset: 1, piAtSetpoint: 1 } },
          { action: 'Setpoint 40 °C, 90 s later', set: { sp: 40 }, waitMs: 90000, expect: { pHasOffset: 1, piAtSetpoint: 1 } },
        ],
      },
    ],
  },
  {
    slug: 'kiln-temperature-ramp-soak-controller',
    title: 'How to ramp a temperature setpoint (kiln or furnace ramp controller)',
    description: 'Ramp the setpoint at a fixed rate instead of jumping, so a kiln or furnace heats evenly; a PI loop follows the ramp. Live simulation with ramp status.',
    answer:
      'Feed the target temperature through a rate limiter (ramp block) and use the ramped value as the controller setpoint. The temperature then rises at a controlled rate, for example 10 °C per second here or 100 °C per hour in a ceramic kiln, instead of as fast as the heater allows.',
    level: 'intermediate',
    explanation: `- **Target** is where the operator wants to go.
- **Ramp** moves its output toward the target at **10 °C per second** (rise and fall rates can differ).
- The **PI controller** uses the ramped value as its setpoint, so it only ever has a small error to correct; the temperature tracks the ramp a few degrees behind.
- **Ramp done** shows when the ramped setpoint has reached the target; a soak (hold) timer would start there.

Ramping protects products and equipment from thermal stress: ceramics crack, refractory spalls and metals distort when heated unevenly. It also stops a big setpoint change from saturating the controller.`,
    circuit: `circuit "Ramp controller" version 1 {
  target: ANALOG_INPUT(label="Target °C", value=20)
  ramp: ANALOG_RAMP(label="Ramp 10 °C/s", riseRate=10, fallRate=10)
  pi: PI_CONTROLLER(label="PI controller", kp=3, ki=0.6, min=0, max=100)
  kiln: MATH_EXPRESSION(label="Simulated kiln: 20 + 4 × power", expr="20 + 4 * A")
  lag: TRANSFER_FUNCTION(label="Simulated thermal lag (8 s)", gain=1, tau=8000)
  done: MATH_EXPRESSION(label="Ramp at target?", expr="abs(A - B) < 0.01")
  follow: MATH_EXPRESSION(label="Within 6 °C of the ramp?", expr="abs(A - B) <= 6")
  settled: MATH_EXPRESSION(label="Within 0.5 °C?", expr="abs(A - B) <= 0.5")
  setpoint: ANALOG_OUTPUT(label="Ramped setpoint °C")
  temp: ANALOG_OUTPUT(label="Temperature °C")
  rampDone: ANALOG_OUTPUT(label="Ramp done (1 = yes)")
  following: ANALOG_OUTPUT(label="Following the ramp (1 = yes)")
  atTarget: ANALOG_OUTPUT(label="At target (1 = yes)")
  target.Q -> ramp.A
  ramp.Q -> pi.SP
  lag.Q -> pi.PV
  pi.Q -> kiln.A
  kiln.Q -> lag.A
  ramp.Q -> done.A
  target.Q -> done.B
  ramp.Q -> follow.A
  lag.Q -> follow.B
  target.Q -> settled.A
  lag.Q -> settled.B
  ramp.Q -> setpoint.A
  lag.Q -> temp.A
  done.Q -> rampDone.A
  follow.Q -> following.A
  settled.Q -> atTarget.A
}`,
    inputs: [{ id: 'target', type: 'ANALOG_INPUT', label: 'Target °C', device: 'HMI or program step' }],
    outputs: [
      { id: 'setpoint', type: 'ANALOG_OUTPUT', label: 'Ramped setpoint °C', device: 'Controller setpoint' },
      { id: 'temp', type: 'ANALOG_OUTPUT', label: 'Temperature °C', device: 'Measured value (simulated here)' },
      { id: 'rampDone', type: 'ANALOG_OUTPUT', label: 'Ramp done (1 = yes)', device: 'Start of the soak step' },
      { id: 'following', type: 'ANALOG_OUTPUT', label: 'Following the ramp (1 = yes)', device: 'Diagnostic' },
      { id: 'atTarget', type: 'ANALOG_OUTPUT', label: 'At target (1 = yes)', device: 'Diagnostic' },
    ],
    tryIt: ['Press Run and wait a few seconds, then set the target to 200 °C.', 'Watch the setpoint climb at 10 °C/s and the temperature follow.', 'Set the target back to 50 °C to see the ramp down.'],
    steps: [
      { title: 'Limit the rate', text: 'A ramp block between the target and the controller setpoint.' },
      { title: 'Control to the ramp', text: 'The controller follows the moving setpoint.' },
      { title: 'Detect the end', text: 'Ramped setpoint equal to the target starts the soak.' },
    ],
    mistakes: [
      'Ramping faster than the heater can follow: the temperature lags further and further behind and the ramp is meaningless. Hold the ramp when the deviation gets too large (guaranteed soak).',
      'Starting a ramp from the old setpoint instead of from the actual temperature after a power cut.',
      'Using the target, not the ramped value, for the soak timer start.',
    ],
    faq: [
      { q: 'How do I build a multi-segment ramp/soak program?', a: 'Use a step sequencer: each step loads a target and a ramp rate, waits for "ramp done", then runs a soak timer before moving to the next step.' },
      { q: 'What ramp rates are typical?', a: 'Ceramic kilns often ramp at 50–150 °C per hour, slower through critical ranges; heat treatment furnaces follow the material specification.' },
    ],
    blocks: ['ANALOG_RAMP', 'PI_CONTROLLER', 'TRANSFER_FUNCTION', 'MATH_EXPRESSION'],
    challenges: ['tank-level'],
    arduinoNote: PROCESS_NOTE,
    scenarios: [
      {
        name: 'Ramp to 200 °C',
        steps: [
          { action: 'Settle at 20 °C', set: { target: 20 }, waitMs: 5000, expect: { rampDone: 1 } },
          { action: 'Target 200 °C, 9 s later', set: { target: 200 }, waitMs: 9000, expect: { rampDone: 0, following: 1 } },
          { action: '20 s after the change', waitMs: 11000, expect: { rampDone: 1, following: 1 } },
          { action: '40 s after the change', waitMs: 20000, expect: { atTarget: 1 } },
          { action: 'Target 150 °C: ramps down', set: { target: 150 }, waitMs: 2000, expect: { rampDone: 0 } },
          { action: 'At 150 °C after 40 s', waitMs: 38000, expect: { rampDone: 1, atTarget: 1 } },
        ],
      },
    ],
  },
  {
    slug: 'pump-pressure-control-pid-vfd',
    title: 'Constant pressure pump control with PID and a VFD',
    description: 'Hold water pressure constant by adjusting pump speed with a PI controller on a variable frequency drive; watch it recover when demand jumps. Live demo.',
    answer:
      'Measure the discharge pressure, compare it with the setpoint in a PI controller, and send the controller output to the VFD as the speed reference. When demand rises the pressure drops, the controller speeds the pump up until the pressure is back at the setpoint.',
    level: 'intermediate',
    explanation: `Booster sets for buildings and irrigation keep a constant pressure whatever the consumption.

- **Setpoint**: 4 bar.
- **PI controller** (kp = 20, ki = 10): output 0–100 % is the **speed reference** for the drive.
- The **simulated system**: pressure rises with pump speed and drops with demand, with a 3 s lag.
- When **demand jumps** from 50 % to 100 %, the pressure dips briefly and the controller raises the speed until it is back at 4 bar.

This is called disturbance rejection, and it is the integral action that brings the pressure exactly back. Real booster sets add a sleep mode at low demand, dry-run protection and pump staging.`,
    circuit: `circuit "Constant pressure pump" version 1 {
  sp: ANALOG_INPUT(label="Pressure setpoint (bar)", value=4)
  demand: ANALOG_INPUT(label="Water demand %", value=50)
  pi: PI_CONTROLLER(label="PI controller", kp=20, ki=10, min=0, max=100)
  hydraulics: MATH_EXPRESSION(label="Simulated system: 0.08 × speed − 0.02 × demand", expr="0.08 * A - 0.02 * B")
  lag: TRANSFER_FUNCTION(label="Simulated pressure lag (3 s)", gain=1, tau=3000)
  band: MATH_EXPRESSION(label="Within 0.05 bar?", expr="abs(A - B) <= 0.05")
  pressure: ANALOG_OUTPUT(label="Pressure (bar)")
  speed: ANALOG_OUTPUT(label="VFD speed reference %")
  atSetpoint: ANALOG_OUTPUT(label="At setpoint (1 = yes)")
  sp.Q -> pi.SP
  lag.Q -> pi.PV
  pi.Q -> hydraulics.A
  demand.Q -> hydraulics.B
  hydraulics.Q -> lag.A
  sp.Q -> band.A
  lag.Q -> band.B
  lag.Q -> pressure.A
  pi.Q -> speed.A
  band.Q -> atSetpoint.A
}`,
    inputs: [
      { id: 'sp', type: 'ANALOG_INPUT', label: 'Pressure setpoint (bar)', device: 'HMI setpoint' },
      { id: 'demand', type: 'ANALOG_INPUT', label: 'Water demand %', device: 'Disturbance (simulated consumption)' },
    ],
    outputs: [
      { id: 'pressure', type: 'ANALOG_OUTPUT', label: 'Pressure (bar)', device: 'Pressure transmitter (simulated here)' },
      { id: 'speed', type: 'ANALOG_OUTPUT', label: 'VFD speed reference %', device: 'Analog output to the drive' },
      { id: 'atSetpoint', type: 'ANALOG_OUTPUT', label: 'At setpoint (1 = yes)', device: 'Diagnostic' },
    ],
    tryIt: ['Press Run: the pressure settles at 4 bar.', 'Raise the demand to 100 %: the pressure dips and the speed rises to bring it back.', 'Lower the demand: the pump slows down.'],
    steps: [
      { title: 'Measure pressure', text: 'Transmitter on the discharge header.' },
      { title: 'PI to the drive', text: 'Controller output as the VFD speed reference.' },
      { title: 'Limit the speed', text: 'Set a minimum speed so the pump keeps a useful head.' },
      { title: 'Test a demand step', text: 'The pressure must return to the setpoint without oscillating.' },
    ],
    mistakes: [
      'Tuning so aggressively that the pressure oscillates when taps open and close.',
      'No minimum speed: at low speed the pump makes no pressure and overheats.',
      'Running the pump against zero demand: add a sleep mode that stops it when the speed has been low for a while and restarts below a wake-up pressure.',
    ],
    faq: [
      { q: 'Should the PID run in the PLC or in the drive?', a: 'Most VFDs have a built-in PID that works well for a single pump. A PLC is better when several pumps are staged or the setpoint comes from elsewhere.' },
      { q: 'How do I add a second pump?', a: 'Start the second pump when the first has run at high speed for a while and the pressure is still low; stop it when both run slowly. The lead/lag guides show the alternation part.' },
    ],
    blocks: ['PI_CONTROLLER', 'TRANSFER_FUNCTION', 'MATH_EXPRESSION'],
    challenges: ['tank-level'],
    arduinoNote: PROCESS_NOTE,
    scenarios: [
      {
        name: 'Start-up and demand step',
        steps: [
          { action: '25 s after start', set: { sp: 4, demand: 50 }, waitMs: 25000, expect: { atSetpoint: 1 } },
          { action: 'Demand jumps to 100 %', set: { demand: 100 }, waitMs: 2500, expect: { atSetpoint: 0 } },
          { action: '20 s later', waitMs: 20000, expect: { atSetpoint: 1 } },
          { action: 'Setpoint 3 bar, 20 s later', set: { sp: 3 }, waitMs: 20000, expect: { atSetpoint: 1 } },
        ],
      },
    ],
  },
  {
    slug: 'plc-analog-output-scaling-4-20ma',
    title: 'How to scale a PLC analog output to 4-20 mA (percent to milliamps)',
    description: 'Convert a 0-100 % command into a 4-20 mA analog output for a valve or drive: the formula, clamping, and the reverse calculation. Live example.',
    answer:
      'Output mA = 4 + 16 × percent / 100, after limiting the percentage to 0–100. So 0 % is 4 mA, 50 % is 12 mA and 100 % is 20 mA. On a real PLC you then convert mA to the raw value the output card expects.',
    level: 'beginner',
    explanation: `- **Clamp** the command to 0–100 % first, so a controller or a typing error cannot push the output out of range.
- **Scale**: mA = 4 + 0.16 × percent.
- **Raw value**: many PLC output cards take an integer, for example 0–27648 for 4–20 mA (Siemens) or 6242–31208 (Allen-Bradley, card dependent). Scale to that range the same way.

Some actuators are **reverse-acting** (fail-open valves): there 100 % command must give 4 mA. Use mA = 20 − 0.16 × percent.

The circuit shows both directions.`,
    circuit: `circuit "Analog output scaling" version 1 {
  command: ANALOG_INPUT(label="Command %", value=50)
  limited: MATH_EXPRESSION(label="Clamp 0-100 %", expr="clamp(A, 0, 100)")
  direct: MATH_EXPRESSION(label="Direct: 4 + 0.16 × %", expr="4 + 0.16 * A")
  reverse: MATH_EXPRESSION(label="Reverse: 20 − 0.16 × %", expr="20 - 0.16 * A")
  mA: ANALOG_OUTPUT(label="Output mA (direct)")
  mAReverse: ANALOG_OUTPUT(label="Output mA (reverse acting)")
  command.Q -> limited.A
  limited.Q -> direct.A
  limited.Q -> reverse.A
  direct.Q -> mA.A
  reverse.Q -> mAReverse.A
}`,
    inputs: [{ id: 'command', type: 'ANALOG_INPUT', label: 'Command %', device: 'Controller output or manual setpoint' }],
    outputs: [
      { id: 'mA', type: 'ANALOG_OUTPUT', label: 'Output mA (direct)', device: '4-20 mA output to a valve positioner or drive' },
      { id: 'mAReverse', type: 'ANALOG_OUTPUT', label: 'Output mA (reverse acting)', device: '4-20 mA output to a reverse-acting device' },
    ],
    tryIt: ['Press Run and set the command to 0, 50 and 100 %.', 'Try 120 % and −10 %: the output stays within 4–20 mA.'],
    steps: [
      { title: 'Clamp', text: 'Limit the command to 0–100 %.' },
      { title: 'Scale', text: '4 mA + 16 mA × fraction.' },
      { title: 'Convert to raw', text: 'Scale mA to the integer range of the output card.' },
    ],
    mistakes: [
      'Scaling from 0 mA instead of 4 mA: the valve never fully closes.',
      'Not clamping, so an out-of-range value wraps around or raises a card error.',
      'Forgetting the action direction of the actuator.',
    ],
    faq: [
      { q: 'What is the reverse formula (mA to percent)?', a: 'percent = (mA − 4) × 6.25. The 4-20 mA input scaling guide covers it, including wire-break detection.' },
      { q: 'What about 0-10 V outputs?', a: 'Same idea: volts = 10 × percent / 100, or 2–10 V with a live zero: 2 + 0.08 × percent.' },
    ],
    blocks: ['MATH_EXPRESSION', 'ANALOG_AMPLIFIER'],
    challenges: ['sensor-scaling'],
    scenarios: [
      {
        name: 'Scaling',
        steps: [
          { action: '0 %', set: { command: 0 }, waitMs: 200, expect: { mA: 4, mAReverse: 20 } },
          { action: '50 %', set: { command: 50 }, waitMs: 200, expect: { mA: 12, mAReverse: 12 } },
          { action: '100 %', set: { command: 100 }, waitMs: 200, expect: { mA: 20, mAReverse: 4 } },
          { action: '25 %', set: { command: 25 }, waitMs: 200, expect: { mA: 8, mAReverse: 16 } },
          { action: '120 % is clamped', set: { command: 120 }, waitMs: 200, expect: { mA: 20, mAReverse: 4 } },
          { action: '−10 % is clamped', set: { command: -10 }, waitMs: 200, expect: { mA: 4, mAReverse: 20 } },
        ],
      },
    ],
  },
  {
    slug: 'median-select-redundant-transmitters',
    title: 'How to select the median of three redundant transmitters (and flag a deviating one)',
    description: 'Use the middle value of three sensors so one failed transmitter cannot upset control, and alarm when any sensor deviates from the median. Live example.',
    answer:
      'Take the median (middle value) of three transmitters for control: one sensor failing high or low is simply ignored. Compare each sensor with the median and raise a deviation alarm when one differs by more than an allowed amount, so the failed sensor gets fixed.',
    level: 'intermediate',
    explanation: `- **Median** = max(min(A, B), min(max(A, B), C)). Whatever single sensor fails, the median stays between the two healthy ones.
- **Deviation alarm**: any sensor more than **5 units** from the median.

Compared with the **average**, the median ignores a failed sensor completely; the average moves a third of the way toward it. Compared with **high select** or **low select**, it fails toward neither direction.

This is the analog counterpart of 2oo3 voting and is common for critical measurements (furnace temperature, drum level, turbine speed).`,
    circuit: `circuit "Median select" version 1 {
  a: ANALOG_INPUT(label="Transmitter A", value=50)
  b: ANALOG_INPUT(label="Transmitter B", value=51)
  c: ANALOG_INPUT(label="Transmitter C", value=49)
  median: MATH_EXPRESSION(label="Median of three", expr="max(min(A, B), min(max(A, B), C))")
  average: MATH_EXPRESSION(label="Average (for comparison)", expr="(A + B + C) / 3")
  devA: MATH_EXPRESSION(label="A deviates?", expr="abs(A - B) > 5")
  devB: MATH_EXPRESSION(label="B deviates?", expr="abs(A - B) > 5")
  devC: MATH_EXPRESSION(label="C deviates?", expr="abs(A - B) > 5")
  anyDev: MATH_EXPRESSION(label="Any deviation", expr="A + B + C > 0")
  selected: ANALOG_OUTPUT(label="Selected value (median)")
  avgOut: ANALOG_OUTPUT(label="Average")
  alarm: ANALOG_OUTPUT(label="Deviation alarm (1 = yes)")
  a.Q -> median.A
  b.Q -> median.B
  c.Q -> median.C
  a.Q -> average.A
  b.Q -> average.B
  c.Q -> average.C
  a.Q -> devA.A
  median.Q -> devA.B
  b.Q -> devB.A
  median.Q -> devB.B
  c.Q -> devC.A
  median.Q -> devC.B
  devA.Q -> anyDev.A
  devB.Q -> anyDev.B
  devC.Q -> anyDev.C
  median.Q -> selected.A
  average.Q -> avgOut.A
  anyDev.Q -> alarm.A
}`,
    inputs: [
      { id: 'a', type: 'ANALOG_INPUT', label: 'Transmitter A', device: 'Redundant transmitter 1' },
      { id: 'b', type: 'ANALOG_INPUT', label: 'Transmitter B', device: 'Redundant transmitter 2' },
      { id: 'c', type: 'ANALOG_INPUT', label: 'Transmitter C', device: 'Redundant transmitter 3' },
    ],
    outputs: [
      { id: 'selected', type: 'ANALOG_OUTPUT', label: 'Selected value (median)', device: 'Value used for control' },
      { id: 'avgOut', type: 'ANALOG_OUTPUT', label: 'Average', device: 'Comparison only' },
      { id: 'alarm', type: 'ANALOG_OUTPUT', label: 'Deviation alarm (1 = yes)', device: 'Maintenance alarm' },
    ],
    tryIt: ['Press Run: the median is 50.', 'Set transmitter A to 200 (failed high): the median stays at 50, the average jumps.', 'The deviation alarm shows the bad transmitter.'],
    steps: [
      { title: 'Select the median', text: 'max(min(A, B), min(max(A, B), C)).' },
      { title: 'Check each sensor', text: 'Absolute difference from the median above a limit.' },
      { title: 'Alarm', text: 'Any deviation: fix the sensor before a second one fails.' },
    ],
    mistakes: [
      'Averaging three sensors and calling it redundancy.',
      'Ignoring the deviation alarm: with one sensor failed, the next failure may be undetected.',
      'Three sensors sharing one impulse line or power supply, which can fail all three together.',
    ],
    faq: [
      { q: 'What if two sensors fail?', a: 'Then the median follows one of the failed sensors. That is why the deviation alarm matters, and why many systems add quality bits from the transmitters (out of range, diagnostics) and degrade to 1oo2.' },
      { q: 'Is the median the same as 2oo3?', a: 'It is the analog equivalent: a trip on the median value behaves like a 2oo3 vote of three trip switches.' },
    ],
    blocks: ['MATH_EXPRESSION'],
    challenges: ['sensor-scaling'],
    scenarios: [
      {
        name: 'Healthy and failed sensors',
        steps: [
          { action: 'All healthy', set: { a: 50, b: 51, c: 49 }, waitMs: 200, expect: { selected: 50, avgOut: 50, alarm: 0 } },
          { action: 'A fails high', set: { a: 200 }, waitMs: 200, expect: { selected: 51, avgOut: 100, alarm: 1 } },
          { action: 'A healthy, B fails low', set: { a: 50, b: 0 }, waitMs: 200, expect: { selected: 49, alarm: 1 } },
          { action: 'B healthy, C fails high', set: { b: 51, c: 120 }, waitMs: 200, expect: { selected: 51, alarm: 1 } },
          { action: 'All healthy again', set: { c: 49 }, waitMs: 200, expect: { selected: 50, alarm: 0 } },
        ],
      },
    ],
  },
  {
    slug: 'horizontal-tank-volume-from-level',
    title: 'How to calculate horizontal cylindrical tank volume from level (PLC formula)',
    description: 'Convert the level in a horizontal cylinder tank into volume and percent full with the circular-segment formula. PLC math block you can test live.',
    answer:
      'For a horizontal cylinder of radius r and length L, the liquid volume at level h is V = L × (r² × acos((r − h) / r) − (r − h) × √(2rh − h²)). It is not proportional to the level: the tank holds less per centimetre near the bottom and top than in the middle.',
    level: 'intermediate',
    explanation: `The liquid cross-section is a **circular segment**; multiply its area by the tank length.

- Tank in the demo: radius **1 m**, length **2 m**, full volume 2π m³ ≈ **6283 L**.
- **Level** is clamped to 0–2 m first, because acos and the square root are undefined outside the tank.
- **Volume** (litres) = 1000 × L × (r² acos((r − h)/r) − (r − h) √(2rh − h²)).
- **Percent full** = volume / full volume × 100.

At half height the tank is exactly 50 % full, but at a quarter of the height (0.5 m) it holds only about 19.6 %, which is why a level reading in percent is not a volume in percent for horizontal tanks.

Vertical cylinders are simple (volume ∝ level); spheres and dished ends need their own formulas or a strapping table.`,
    circuit: `circuit "Horizontal tank volume" version 1 {
  level: ANALOG_INPUT(label="Level (m)", value=1)
  h: MATH_EXPRESSION(label="Clamp 0-2 m", expr="clamp(A, 0, 2)")
  volume: MATH_EXPRESSION(label="Volume (L), r = 1 m, L = 2 m", expr="1000 * 2 * (acos(1 - A) - (1 - A) * sqrt(2 * A - A * A))")
  percent: MATH_EXPRESSION(label="Percent full", expr="A / (2000 * PI) * 100")
  litres: ANALOG_OUTPUT(label="Volume (L)")
  full: ANALOG_OUTPUT(label="Percent full")
  level.Q -> h.A
  h.Q -> volume.A
  volume.Q -> percent.A
  volume.Q -> litres.A
  percent.Q -> full.A
}`,
    inputs: [{ id: 'level', type: 'ANALOG_INPUT', label: 'Level (m)', device: 'Level transmitter, scaled to metres' }],
    outputs: [
      { id: 'litres', type: 'ANALOG_OUTPUT', label: 'Volume (L)', device: 'HMI value' },
      { id: 'full', type: 'ANALOG_OUTPUT', label: 'Percent full', device: 'HMI value' },
    ],
    tryIt: ['Press Run and set the level to 0, 0.5, 1, 1.5 and 2 m.', 'Compare level % (level / 2 m) with volume %.'],
    steps: [
      { title: 'Clamp the level', text: 'Between 0 and the diameter.' },
      { title: 'Segment area × length', text: 'r² acos((r − h)/r) − (r − h) √(2rh − h²), times L.' },
      { title: 'Percent full', text: 'Divide by π r² L.' },
    ],
    mistakes: [
      'Treating level % as volume % in a horizontal tank: errors of more than 5 % near a quarter full.',
      'Measuring the level from the wrong reference (the transmitter mounting point rather than the tank bottom).',
      'Ignoring dished ends, which add volume that the cylinder formula does not include.',
    ],
    faq: [
      { q: 'What if my PLC has no acos function?', a: 'Use a strapping table (level vs volume at, say, 20 points) and linear interpolation between the points.' },
      { q: 'How do I include dished ends?', a: 'Add the volume of the two heads, which depends on their shape (torispherical, ellipsoidal); tank manufacturers usually provide the strapping table.' },
    ],
    blocks: ['MATH_EXPRESSION'],
    challenges: ['sensor-scaling'],
    scenarios: [
      {
        name: 'Levels',
        steps: [
          { action: 'Empty', set: { level: 0 }, waitMs: 200, expect: { litres: 0, full: 0 } },
          { action: '0.5 m', set: { level: 0.5 }, waitMs: 200, expect: { litres: 1228.369698608757 } },
          { action: '1 m (half)', set: { level: 1 }, waitMs: 200, expect: { litres: 3141.592653589793, full: 50 } },
          { action: '1.5 m', set: { level: 1.5 }, waitMs: 200, expect: { litres: 5054.81560857083 } },
          { action: 'Full', set: { level: 2 }, waitMs: 200, expect: { litres: 6283.185307179586, full: 100 } },
          { action: 'Over range is clamped', set: { level: 2.4 }, waitMs: 200, expect: { full: 100 } },
        ],
      },
    ],
  },
  {
    slug: 'square-root-extraction-dp-flow',
    title: 'How to calculate flow from differential pressure (square root extraction)',
    description: 'Flow through an orifice or venturi is proportional to the square root of differential pressure. Scale dP to flow with a low-flow cutoff, live in a PLC.',
    answer:
      'For orifice plates, venturis and pitot tubes, flow is proportional to the square root of the differential pressure: flow % = 10 × √(dP %). Add a low-flow cutoff, because the square root magnifies noise near zero.',
    level: 'intermediate',
    explanation: `Bernoulli: the pressure drop across a restriction grows with the square of the velocity, so **flow = k × √dP**.

With dP and flow both in percent of range: **flow % = 10 × √(dP %)**.

| dP % | flow % |
|---|---|
| 1 | 10 |
| 25 | 50 |
| 64 | 80 |
| 100 | 100 |

Near zero, the slope of the square root is very steep: a tiny transmitter offset of 0.5 % dP would read as 7 % flow. A **low-flow cutoff** forces the flow to zero below a small dP (here 1 %).

Many transmitters can do the square root themselves; make sure it is done **once**, either in the transmitter or in the PLC.`,
    circuit: `circuit "Square root extraction" version 1 {
  dp: ANALOG_INPUT(label="Differential pressure %", value=25)
  flow: MATH_EXPRESSION(label="Flow % with 1 % cutoff", expr="A < 1 ? 0 : 10 * sqrt(clamp(A, 0, 100))")
  flowOut: ANALOG_OUTPUT(label="Flow %")
  dp.Q -> flow.A
  flow.Q -> flowOut.A
}`,
    inputs: [{ id: 'dp', type: 'ANALOG_INPUT', label: 'Differential pressure %', device: 'DP transmitter across the orifice' }],
    outputs: [{ id: 'flowOut', type: 'ANALOG_OUTPUT', label: 'Flow %', device: 'Flow value for control and totalising' }],
    tryIt: ['Press Run and set dP to 1, 25, 64 and 100 %.', 'Set 0.5 %: the cutoff gives 0 flow.'],
    steps: [
      { title: 'Square root', text: 'flow % = 10 × √(dP %).' },
      { title: 'Low-flow cutoff', text: 'Zero below a small dP.' },
      { title: 'Scale to units', text: 'Multiply the percentage by the flow range.' },
    ],
    mistakes: [
      'Taking the square root twice (in the transmitter and in the PLC).',
      'No low-flow cutoff: a closed line shows a phantom flow and the totaliser keeps counting.',
      'Using a linear scaling for a dP flow element.',
    ],
    faq: [
      { q: 'Why is the turndown of an orifice limited?', a: 'Because 10:1 in flow is 100:1 in dP. Below about 10 % flow, the dP is too small to measure accurately.' },
      { q: 'Do I need temperature and pressure compensation?', a: 'For gases and steam, yes: density changes with pressure and temperature, and the flow formula includes the density.' },
    ],
    blocks: ['MATH_EXPRESSION'],
    challenges: ['sensor-scaling'],
    scenarios: [
      {
        name: 'Flow values',
        steps: [
          { action: '25 % dP', set: { dp: 25 }, waitMs: 200, expect: { flowOut: 50 } },
          { action: '64 % dP', set: { dp: 64 }, waitMs: 200, expect: { flowOut: 80 } },
          { action: '100 % dP', set: { dp: 100 }, waitMs: 200, expect: { flowOut: 100 } },
          { action: '1 % dP', set: { dp: 1 }, waitMs: 200, expect: { flowOut: 10 } },
          { action: '0.5 % dP: cutoff', set: { dp: 0.5 }, waitMs: 200, expect: { flowOut: 0 } },
          { action: 'Negative dP', set: { dp: -2 }, waitMs: 200, expect: { flowOut: 0 } },
        ],
      },
    ],
  },
  {
    slug: 'moving-average-vs-low-pass-filter',
    title: 'Moving average vs low-pass filter for noisy analog signals (PLC)',
    description: 'Smooth a noisy analog input with a moving average or a first-order filter: how each responds to a step, and how to choose. Live comparison.',
    answer:
      'A moving average outputs the mean of the last N samples: after a step it reaches the new value exactly N scans later. A first-order low-pass filter moves a fraction of the way each scan and approaches the new value gradually (63 % after one time constant). Both smooth noise; the average gives a defined delay, the filter is cheaper in memory.',
    level: 'intermediate',
    explanation: `Both blocks get the same input.

- **Moving average** (5 samples): after a step, the output climbs in five equal increments and reaches the new value after 5 scans (0.5 s here). It needs memory for N samples.
- **First-order low-pass** (time constant 500 ms): each scan the output moves the fraction Δt / (T + Δt) toward the input. After one time constant it has covered about 63 % of a step, after five about 99 %. It needs one value of memory.

Choose by what you need: a hard upper limit on the delay (average), or a cheap, smooth filter with a gradual tail (low-pass). For spikes (single wild values), a **median** of the last few samples works better than either.

Remember that any filter delays the signal: never filter a safety trip so much that it reacts too late.`,
    circuit: `circuit "Average vs low-pass" version 1 {
  raw: ANALOG_INPUT(label="Raw signal", value=0)
  avg: AVERAGE(label="Moving average, 5 samples", samples=5)
  lowpass: ANALOG_FILTER(label="Low-pass, T = 500 ms", timeConstant=500)
  avgOut: ANALOG_OUTPUT(label="Moving average")
  lpOut: ANALOG_OUTPUT(label="Low-pass")
  lpBand: MATH_EXPRESSION(label="Low-pass above 95 %?", expr="A >= 95")
  lpSettled: ANALOG_OUTPUT(label="Low-pass above 95 (1 = yes)")
  raw.Q -> avg.A
  raw.Q -> lowpass.A
  avg.Q -> avgOut.A
  lowpass.Q -> lpOut.A
  lowpass.Q -> lpBand.A
  lpBand.Q -> lpSettled.A
}`,
    inputs: [{ id: 'raw', type: 'ANALOG_INPUT', label: 'Raw signal', device: 'Noisy transmitter' }],
    outputs: [
      { id: 'avgOut', type: 'ANALOG_OUTPUT', label: 'Moving average', device: 'Filtered value' },
      { id: 'lpOut', type: 'ANALOG_OUTPUT', label: 'Low-pass', device: 'Filtered value' },
      { id: 'lpSettled', type: 'ANALOG_OUTPUT', label: 'Low-pass above 95 (1 = yes)', device: 'Diagnostic' },
    ],
    tryIt: ['Switch to "Function blocks", press Run, and step the raw signal from 0 to 100.', 'Use "Step +100 ms" to watch the average climb in five equal steps.', 'Compare with the low-pass curve in the logic analyzer.'],
    steps: [
      { title: 'Look at the noise', text: 'How fast and how big is it compared with real changes?' },
      { title: 'Pick a filter', text: 'Average for a bounded delay, low-pass for a cheap smooth signal.' },
      { title: 'Size it', text: 'Long enough to calm the noise, short enough for control and alarms.' },
    ],
    mistakes: [
      'Filtering the input of a fast control loop so much that it becomes unstable.',
      'Filtering a safety or trip signal.',
      'Using a moving average with thousands of samples on a small controller: memory and CPU.',
    ],
    faq: [
      { q: 'How do I choose the time constant?', a: 'A few times the period of the noise, and well below the time scale of the changes you care about. For a level in a turbulent tank, a few seconds is common.' },
      { q: 'What about spikes?', a: 'A median filter (middle value of the last 3 or 5 samples) removes single spikes without smearing them out.' },
    ],
    blocks: ['AVERAGE', 'ANALOG_FILTER', 'MATH_EXPRESSION'],
    challenges: ['sensor-scaling'],
    scenarios: [
      {
        name: 'Step response',
        steps: [
          { action: 'At 0', set: { raw: 0 }, waitMs: 1000, expect: { avgOut: 0, lpSettled: 0 } },
          { action: 'Step to 100: one scan', set: { raw: 100 }, waitMs: 100, expect: { avgOut: 20 } },
          { action: 'Three scans', waitMs: 200, expect: { avgOut: 60, lpSettled: 0 } },
          { action: 'Five scans', waitMs: 200, expect: { avgOut: 100, lpSettled: 0 } },
          { action: '2.5 s (five time constants)', waitMs: 2000, expect: { avgOut: 100, lpSettled: 1 } },
        ],
      },
    ],
  },
];
