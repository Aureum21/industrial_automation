import type { HowTo } from './types.ts';

/** Fifth batch of how-to guides. Verified by tests/howto.test.ts. */
export const HOW_TOS_BATCH_5: HowTo[] = [
  {
    slug: 'set-reset-latch-ladder-logic',
    title: 'Set/reset (latch/unlatch) in ladder logic: reset-dominant vs set-dominant',
    description: 'How SET and RESET coils (OTL/OTU, S/R) work, and the difference between a reset-dominant and a set-dominant latch when both inputs are on.',
    answer:
      'A set/reset latch turns its output on with a pulse on Set and off with a pulse on Reset, and remembers the state in between. The only difference between the two kinds is what happens when Set and Reset are on together: reset-dominant gives OFF, set-dominant gives ON.',
    level: 'beginner',
    explanation: `In ladder logic a latch is either a pair of coils (**SET/RESET**, **S/R**, or **OTL/OTU** in Allen-Bradley) or a function block (**RS** or **SR**).

| Set | Reset | Reset-dominant (RS) | Set-dominant (SR) |
|---|---|---|---|
| OFF | OFF | keeps state | keeps state |
| ON | OFF | ON | ON |
| OFF | ON | OFF | OFF |
| ON | ON | **OFF** | **ON** |

With coils, the rung that comes **last** in the program wins, because both rungs write the same bit in each scan.

- **Reset-dominant** is the safe choice for anything that moves: Stop must win over Start.
- **Set-dominant** fits alarm memories: a new alarm must be remembered even while someone holds Acknowledge.

The circuit builds both: an RS block (reset-dominant) and a set-dominant latch made from logic, Q = Set OR (Q previous AND NOT Reset).`,
    circuit: `circuit "Set/reset latches" version 1 {
  set: INPUT(label="Set")
  reset: INPUT(label="Reset")
  rs: RS_LATCH(label="Reset-dominant latch")
  prev: SCAN_DELAY(label="Set-dominant (last scan)")
  notReset: NOT(label="Not reset")
  hold: AND(label="Hold")
  srLogic: OR(label="Set-dominant latch")
  lampRS: OUTPUT(label="Reset-dominant lamp")
  lampSR: OUTPUT(label="Set-dominant lamp")
  set.Q -> rs.S
  reset.Q -> rs.R
  srLogic.Q -> prev.A
  reset.Q -> notReset.A
  prev.Q -> hold.A
  notReset.Q -> hold.B
  set.Q -> srLogic.A
  hold.Q -> srLogic.B
  rs.Q -> lampRS.A
  srLogic.Q -> lampSR.A
}`,
    inputs: [
      { id: 'set', type: 'INPUT', label: 'Set', device: 'Push button (for example Start, or an alarm event)' },
      { id: 'reset', type: 'INPUT', label: 'Reset', device: 'Push button (for example Stop, or Acknowledge)' },
    ],
    outputs: [
      { id: 'lampRS', type: 'OUTPUT', label: 'Reset-dominant lamp', device: 'Indicator' },
      { id: 'lampSR', type: 'OUTPUT', label: 'Set-dominant lamp', device: 'Indicator' },
    ],
    tryIt: ['Switch Set on and off: both lamps stay on.', 'Switch Reset on and off: both turn off.', 'Switch both ON together: the reset-dominant lamp is off, the set-dominant lamp is on.'],
    steps: [
      { title: 'Pick the dominance', text: 'Ask what must win if both happen together: usually reset for machines, set for alarm memories.' },
      { title: 'Use the right block or rung order', text: 'RS block or Reset rung after Set rung for reset-dominant; SR or the opposite order for set-dominant.' },
      { title: 'Never write the bit elsewhere', text: 'A latched bit written by a normal coil somewhere else is a classic hard-to-find bug.' },
    ],
    mistakes: [
      'Using a set-dominant latch for a motor: holding Start overrides Stop.',
      'Writing the same bit with SET in one place and a normal output coil in another.',
      'Forgetting that latched bits in retentive memory survive a power cycle, so a machine can wake up "running".',
    ],
    faq: [
      { q: 'Is RS reset-dominant or set-dominant?', a: 'In IEC 61131-3, RS is reset-dominant and SR is set-dominant: the first letter is the input that wins. Vendors are not always consistent, so check your PLC documentation.' },
      { q: 'Should I use a latch or a seal-in rung?', a: 'Both work. A seal-in rung drops out at power loss and keeps the whole condition on one rung; latches are clearer for step sequences and memories.' },
    ],
    blocks: ['RS_LATCH', 'SCAN_DELAY', 'OR', 'AND', 'NOT'],
    challenges: ['start-stop'],
    scenarios: [
      {
        name: 'Truth table',
        steps: [
          { action: 'Both off', waitMs: 200, expect: { lampRS: false, lampSR: false } },
          { action: 'Set', set: { set: true }, waitMs: 200, expect: { lampRS: true, lampSR: true } },
          { action: 'Release Set', set: { set: false }, waitMs: 300, expect: { lampRS: true, lampSR: true } },
          { action: 'Reset', set: { reset: true }, waitMs: 200, expect: { lampRS: false, lampSR: false } },
          { action: 'Both on', set: { set: true }, waitMs: 300, expect: { lampRS: false, lampSR: true } },
          { action: 'Release Set, keep Reset', set: { set: false }, waitMs: 200, expect: { lampRS: false, lampSR: false } },
          { action: 'Release Reset', set: { reset: false }, waitMs: 300, expect: { lampRS: false, lampSR: false } },
        ],
      },
    ],
  },
  {
    slug: 'ton-tof-tp-timer-difference',
    title: 'TON vs TOF vs TP: PLC timer types explained with a live example',
    description: 'On-delay (TON), off-delay (TOF) and pulse (TP) timers side by side on the same input, with timing diagrams you can run. When to use which.',
    answer:
      'TON switches its output on after the input has been on for the preset time. TOF switches on at once and off only after the input has been off for the preset time. TP gives one fixed-length pulse on each rising edge, no matter how long the input stays on.',
    level: 'beginner',
    explanation: `All three timers below have a preset of 2 s and the same input.

| Timer | Output turns ON | Output turns OFF | Typical use |
|---|---|---|---|
| **TON** on-delay | 2 s after the input turns on | at once when the input turns off | delayed start, debouncing, "alarm if it lasts" |
| **TOF** off-delay | at once | 2 s after the input turns off | run-on fans, stair lights, holding a valve open |
| **TP** pulse | at once, on the rising edge | 2 s later, whatever the input does | fixed doses, horn blasts, one-shot movements |

Two details matter in practice:

- A TON **restarts from zero** if the input drops out before the time is up. If you need to accumulate time across interruptions, use a retentive timer (TONR).
- A TP **cannot be extended** by pressing again during the pulse. A retriggerable pulse needs a different block.

Run the simulator and watch the three outputs in the logic analyzer while you switch the input.`,
    circuit: `circuit "Timer comparison" version 1 {
  input: INPUT(label="Input")
  ton: TON(label="TON 2 s", duration=2000)
  tof: TOF(label="TOF 2 s", duration=2000)
  tp: PULSE_TIMER(label="TP 2 s", duration=2000)
  outTon: OUTPUT(label="TON output")
  outTof: OUTPUT(label="TOF output")
  outTp: OUTPUT(label="TP output")
  input.Q -> ton.A
  input.Q -> tof.A
  input.Q -> tp.A
  ton.Q -> outTon.A
  tof.Q -> outTof.A
  tp.Q -> outTp.A
}`,
    inputs: [{ id: 'input', type: 'INPUT', label: 'Input', device: 'Any signal' }],
    outputs: [
      { id: 'outTon', type: 'OUTPUT', label: 'TON output', device: 'Indicator' },
      { id: 'outTof', type: 'OUTPUT', label: 'TOF output', device: 'Indicator' },
      { id: 'outTp', type: 'OUTPUT', label: 'TP output', device: 'Indicator' },
    ],
    tryIt: ['Switch to "Function blocks" to see the logic analyzer.', 'Switch Input ON for 4 s, then OFF: compare the three outputs.', 'Switch Input ON for only 1 s: TON never turns on, TP still gives its full 2 s.'],
    steps: [
      { title: 'Delay switching on', text: 'TON.' },
      { title: 'Delay switching off', text: 'TOF.' },
      { title: 'Fixed-length pulse', text: 'TP.' },
      { title: 'Check the units', text: 'Presets are usually milliseconds (T#2s in IEC notation).' },
    ],
    mistakes: [
      'Using TON to keep something on after a signal ends: that is TOF.',
      'Expecting a TON to keep its elapsed time after an interruption.',
      'Entering 2 instead of 2000 for two seconds on a timer that counts milliseconds.',
    ],
    faq: [
      { q: 'What does ET mean?', a: 'Elapsed time: how far the timer has counted. Q is the done output. Both are visible on the timer blocks in the simulator.' },
      { q: 'What are TON, TOF and TP called in Allen-Bradley?', a: 'TON and TOF have the same names. There is no TP instruction; a pulse is built from a TON and a one-shot, or with a TOF triggered by a one-shot.' },
    ],
    blocks: ['TON', 'TOF', 'PULSE_TIMER', 'RETENTIVE_TON', 'EDGE_PULSE_TIMER'],
    challenges: ['delayed-fan', 'stairwell-light', 'one-shot-valve'],
    scenarios: [
      {
        name: 'Long input',
        steps: [
          { action: 'Input ON', set: { input: true }, waitMs: 200, expect: { outTon: false, outTof: true, outTp: true } },
          { action: 'At 1.5 s', waitMs: 1300, expect: { outTon: false, outTof: true, outTp: true } },
          { action: 'At 2.5 s', waitMs: 1000, expect: { outTon: true, outTof: true, outTp: false } },
          { action: 'Input OFF', set: { input: false }, waitMs: 200, expect: { outTon: false, outTof: true, outTp: false } },
          { action: '2.5 s after OFF', waitMs: 2300, expect: { outTof: false } },
        ],
      },
      {
        name: 'Short input',
        steps: [
          { action: 'Input ON for 1 s', set: { input: true }, waitMs: 1000, expect: { outTp: true } },
          { action: 'Input OFF', set: { input: false }, waitMs: 500, expect: { outTon: false, outTof: true, outTp: true } },
          { action: 'Pulse over', waitMs: 800, expect: { outTp: false } },
          { action: 'Off-delay over', waitMs: 1000, expect: { outTof: false, outTon: false } },
        ],
      },
    ],
  },
  {
    slug: 'lube-oil-pump-permissive-motor',
    title: 'How to program a lube oil pump permissive before starting a main motor',
    description: 'Start the lube oil pump first, start the main motor only after oil pressure has been healthy for 3 s, run the pump on after stopping, trip on low oil.',
    answer:
      'Start the auxiliary (lube oil) pump on the start command, and allow the main motor only when the oil pressure has been healthy for a few seconds. Keep the lube pump running for a run-down time after the main motor stops, and trip the main motor if the pressure is lost.',
    level: 'intermediate',
    explanation: `This **permissive** pattern protects compressors, turbines, large fans and gearboxes, but it also applies to any "motor B needs motor A" interlock.

- **Run** latch: Start sets it; Stop or a low-oil trip resets it. The latch is reset-dominant, so Start is ignored while the trip is active.
- **Lube pump** = off-delay (5 s) on Run: it starts at once and keeps running 5 s after stop, while the shaft runs down.
- **Pressure proven** = on-delay (3 s) on oil pressure OK, so a short pressure peak does not count.
- **Main motor** = Run AND pressure proven. It stops immediately if the pressure drops.
- **Low-oil trip**: Run AND NOT oil pressure for 5 s latches an alarm and resets Run (through a one-scan delay). The trip must be reset before the next start.`,
    circuit: `circuit "Lube oil permissive" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  oil: INPUT(label="Oil pressure OK")
  reset: INPUT(label="Trip reset")
  tripPrev: SCAN_DELAY(label="Tripped (last scan)")
  stopOrTrip: OR(label="Stop or trip")
  run: RS_LATCH(label="Run")
  lube: TOF(label="Lube run-down", duration=5000)
  proven: TON(label="Pressure proven", duration=3000)
  mainLogic: AND(label="Main allowed")
  noOil: NOT(label="No oil pressure")
  lowOil: AND(label="Running without oil")
  lowOilTime: TON(label="Low oil delay", duration=5000)
  trip: RS_LATCH(label="Low oil trip")
  lubePump: OUTPUT(label="Lube oil pump")
  mainMotor: OUTPUT(label="Main motor")
  alarm: OUTPUT(label="Low oil alarm")
  trip.Q -> tripPrev.A
  stop.Q -> stopOrTrip.A
  tripPrev.Q -> stopOrTrip.B
  start.Q -> run.S
  stopOrTrip.Q -> run.R
  run.Q -> lube.A
  oil.Q -> proven.A
  run.Q -> mainLogic.A
  proven.Q -> mainLogic.B
  oil.Q -> noOil.A
  run.Q -> lowOil.A
  noOil.Q -> lowOil.B
  lowOil.Q -> lowOilTime.A
  lowOilTime.Q -> trip.S
  reset.Q -> trip.R
  lube.Q -> lubePump.A
  mainLogic.Q -> mainMotor.A
  trip.Q -> alarm.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'oil', type: 'INPUT', label: 'Oil pressure OK', device: 'Oil pressure switch' },
      { id: 'reset', type: 'INPUT', label: 'Trip reset', device: 'Reset push button' },
    ],
    outputs: [
      { id: 'lubePump', type: 'OUTPUT', label: 'Lube oil pump', device: 'Auxiliary pump contactor' },
      { id: 'mainMotor', type: 'OUTPUT', label: 'Main motor', device: 'Main motor starter' },
      { id: 'alarm', type: 'OUTPUT', label: 'Low oil alarm', device: 'Alarm lamp' },
    ],
    tryIt: ['Switch Start on and off: the lube pump starts.', 'Switch Oil pressure OK ON: 3 s later the main motor starts.', 'Switch Stop: the main motor stops, the lube pump runs 5 s more.'],
    steps: [
      { title: 'Start the auxiliary first', text: 'The lube pump follows the run command through an off-delay.' },
      { title: 'Prove the permissive', text: 'An on-delay on the pressure switch.' },
      { title: 'Start the main motor', text: 'Run AND pressure proven.' },
      { title: 'Trip on loss', text: 'A timed low-oil condition latches a trip and drops the run command.' },
    ],
    mistakes: [
      'Starting the main motor on the lube pump output instead of on proven pressure.',
      'Stopping the lube pump together with the main motor: bearings run dry during run-down.',
      'No trip latch: the main motor restarts when the pressure comes back.',
    ],
    faq: [
      { q: 'Can I use this for "fan before heater" interlocks?', a: 'Yes. Replace the lube pump with the fan and the oil pressure with an airflow switch: the heater only runs with proven airflow, and the fan runs on to cool the heater.' },
      { q: 'Should the pressure switch be checked before start too?', a: 'Many designs also check that the switch is OFF before the pump starts, to detect a switch stuck in the OK position.' },
    ],
    blocks: ['TON', 'TOF', 'RS_LATCH', 'SCAN_DELAY', 'AND', 'OR', 'NOT'],
    challenges: ['delayed-fan', 'guarded-machine'],
    never: [{ when: { mainMotor: true, lubePump: false }, message: 'The main motor ran without the lube pump' }],
    scenarios: [
      {
        name: 'Start, run, stop',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 200, expect: { lubePump: true, mainMotor: false } },
          { action: 'Oil pressure builds', set: { start: false, oil: true }, waitMs: 2500, expect: { mainMotor: false } },
          { action: 'Pressure proven', waitMs: 800, expect: { mainMotor: true } },
          { action: 'Runs for 6 s with pressure', waitMs: 6000, expect: { mainMotor: true, alarm: false } },
          { action: 'Press Stop', set: { stop: true }, waitMs: 200, expect: { mainMotor: false, lubePump: true } },
          { action: 'Run-down 4 s', set: { stop: false }, waitMs: 4000, expect: { lubePump: true } },
          { action: 'Run-down over', waitMs: 1200, expect: { lubePump: false } },
        ],
      },
      {
        name: 'Low oil trip',
        steps: [
          { action: 'Start with pressure', set: { start: true, oil: true }, waitMs: 3500, expect: { mainMotor: true } },
          { action: 'Pressure lost', set: { start: false, oil: false }, waitMs: 200, expect: { mainMotor: false, alarm: false } },
          { action: '5 s without pressure', waitMs: 5000, expect: { alarm: true } },
          { action: 'Start refused while tripped', set: { oil: true, start: true }, waitMs: 4000, expect: { mainMotor: false } },
          { action: 'Reset, then Start', set: { start: false, reset: true }, waitMs: 200, expect: { alarm: false } },
          { action: 'Start', set: { reset: false, start: true }, waitMs: 3500, expect: { mainMotor: true } },
        ],
      },
    ],
  },
  {
    slug: 'greenhouse-control-plc',
    title: 'PLC program for greenhouse climate control (heater, fan, misting)',
    description: 'Greenhouse automation with temperature and humidity bands: heater below 18 °C, vent fan above 28 °C, misting below 60 % humidity. Live simulator.',
    answer:
      'Give each actuator its own hysteresis band: heat below 18 °C until 20 °C, ventilate above 28 °C until 25 °C, and mist below 60 % humidity until 75 %. Keeping the bands apart means the heater and fan can never fight each other.',
    level: 'beginner',
    explanation: `Three hysteresis switches, one per actuator:

| Actuator | Turns on | Turns off | Mode |
|---|---|---|---|
| Heater | ≤ 18 °C | ≥ 20 °C | low trigger (on < off) |
| Vent fan | ≥ 28 °C | ≤ 25 °C | high trigger (on > off) |
| Misting | ≤ 60 % RH | ≥ 75 % RH | low trigger |

The **dead zone** between 20 and 25 °C, where neither heater nor fan runs, is what keeps them from running against each other. **Misting is blocked while the fan runs**, because the fan would blow the mist straight out.

An **Auto** switch enables the whole system.`,
    circuit: `circuit "Greenhouse control" version 1 {
  temp: ANALOG_INPUT(label="Temperature °C", value=22)
  humidity: ANALOG_INPUT(label="Humidity % RH", value=70)
  auto: INPUT(label="Auto", value=true)
  heatBand: ANALOG_DIFFERENTIAL(label="Heat: on 18 / off 20 °C", onThreshold=18, offThreshold=20)
  ventBand: ANALOG_DIFFERENTIAL(label="Vent: on 28 / off 25 °C", onThreshold=28, offThreshold=25)
  mistBand: ANALOG_DIFFERENTIAL(label="Mist: on 60 / off 75 %", onThreshold=60, offThreshold=75)
  heatLogic: AND(label="Heat")
  ventLogic: AND(label="Ventilate")
  noVent: NOT(label="Fan off")
  mistAllowed: AND(label="Mist allowed")
  mistLogic: AND(label="Mist")
  heater: OUTPUT(label="Heater")
  fan: OUTPUT(label="Vent fan")
  mister: OUTPUT(label="Misting valve")
  temp.Q -> heatBand.A
  temp.Q -> ventBand.A
  humidity.Q -> mistBand.A
  auto.Q -> heatLogic.A
  heatBand.Q -> heatLogic.B
  auto.Q -> ventLogic.A
  ventBand.Q -> ventLogic.B
  ventLogic.Q -> noVent.A
  mistBand.Q -> mistAllowed.A
  noVent.Q -> mistAllowed.B
  auto.Q -> mistLogic.A
  mistAllowed.Q -> mistLogic.B
  heatLogic.Q -> heater.A
  ventLogic.Q -> fan.A
  mistLogic.Q -> mister.A
}`,
    inputs: [
      { id: 'temp', type: 'ANALOG_INPUT', label: 'Temperature °C', device: 'Temperature sensor (shaded, aspirated)' },
      { id: 'humidity', type: 'ANALOG_INPUT', label: 'Humidity % RH', device: 'Humidity transmitter' },
      { id: 'auto', type: 'INPUT', label: 'Auto', device: 'Auto/manual selector' },
    ],
    outputs: [
      { id: 'heater', type: 'OUTPUT', label: 'Heater', device: 'Heater contactor' },
      { id: 'fan', type: 'OUTPUT', label: 'Vent fan', device: 'Fan contactor or vent motor' },
      { id: 'mister', type: 'OUTPUT', label: 'Misting valve', device: 'Solenoid valve on the misting line' },
    ],
    tryIt: ['Press Run and set the temperature to 17 °C: the heater runs until 20 °C.', 'Set 29 °C: the fan runs until 25 °C.', 'Set humidity to 55 %: misting starts, but not while the fan runs.'],
    steps: [
      { title: 'One band per actuator', text: 'Low trigger for heating and misting, high trigger for ventilation.' },
      { title: 'Leave a dead zone', text: 'Heater off and fan on thresholds must not overlap.' },
      { title: 'Add interlocks', text: 'No misting while ventilating.' },
      { title: 'Enable with Auto', text: 'AND every output with the Auto switch.' },
    ],
    mistakes: [
      'Overlapping heat and vent bands: the heater and fan run together.',
      'A temperature sensor in direct sunlight, which reads far too high.',
      'No minimum off time for the fan or heater when the bands are narrow.',
    ],
    faq: [
      { q: 'How do I add day and night setpoints?', a: 'Switch the thresholds with a time signal: two hysteresis switches for heating (day and night) ANDed with "is day" and "is night".' },
      { q: 'Can I control vent windows instead of a fan?', a: 'Yes: use the vent demand to open the window motor until its open limit, and NOT vent demand to close it until its closed limit, like the sliding door guide.' },
    ],
    blocks: ['ANALOG_DIFFERENTIAL', 'AND', 'NOT'],
    challenges: ['tank-level'],
    never: [
      { when: { heater: true, fan: true }, message: 'Heater and fan ran together' },
      { when: { mister: true, fan: true }, message: 'Misting while the fan ran' },
    ],
    scenarios: [
      {
        name: 'Temperature',
        steps: [
          { action: '22 °C', set: { temp: 22, humidity: 70 }, waitMs: 200, expect: { heater: false, fan: false } },
          { action: '17 °C', set: { temp: 17 }, waitMs: 200, expect: { heater: true } },
          { action: '19 °C', set: { temp: 19 }, waitMs: 200, expect: { heater: true } },
          { action: '20 °C', set: { temp: 20 }, waitMs: 200, expect: { heater: false } },
          { action: '29 °C', set: { temp: 29 }, waitMs: 200, expect: { fan: true } },
          { action: '26 °C', set: { temp: 26 }, waitMs: 200, expect: { fan: true } },
          { action: '25 °C', set: { temp: 25 }, waitMs: 200, expect: { fan: false } },
        ],
      },
      {
        name: 'Humidity and Auto',
        steps: [
          { action: '55 % at 22 °C', set: { temp: 22, humidity: 55 }, waitMs: 200, expect: { mister: true } },
          { action: '70 %', set: { humidity: 70 }, waitMs: 200, expect: { mister: true } },
          { action: '75 %', set: { humidity: 75 }, waitMs: 200, expect: { mister: false } },
          { action: '55 % but hot: fan runs', set: { humidity: 55, temp: 30 }, waitMs: 200, expect: { fan: true, mister: false } },
          { action: 'Auto off', set: { auto: false, temp: 15 }, waitMs: 200, expect: { heater: false, fan: false, mister: false } },
        ],
      },
    ],
  },
  {
    slug: 'street-light-automatic-dusk-dawn',
    title: 'How to switch street lights automatically at dusk with a delay',
    description: 'Dusk-to-dawn street lighting from a light sensor, with on and off delays so passing headlights and clouds do not switch the lamps. PLC logic you can run.',
    answer:
      'Switch the lights on when the light sensor reports dark, but only after it has been dark for a while, and off only after it has been light for a while. The delays ignore car headlights at night and passing clouds at dusk.',
    level: 'beginner',
    explanation: `- An **on/off-delay** (10 s on, 10 s off in the demo; minutes in practice) filters the twilight sensor.
- **Lights** = (filtered dark AND NOT maintenance off) OR manual test.
- A **manual test** switch turns the lamps on in daylight for maintenance, and a **maintenance off** switch keeps them off while someone works on the circuit.

The same pattern works for any slow on/off signal that must not react to short disturbances: a frost sensor, a wind switch on an awning, a level switch in a rough tank.`,
    circuit: `circuit "Street lights" version 1 {
  dark: INPUT(label="Light sensor: dark")
  test: INPUT(label="Manual test")
  maintenance: INPUT(label="Maintenance off")
  filter: ON_OFF_DELAY(label="Dusk/dawn delay", onDelay=10000, offDelay=10000)
  allowed: NOT(label="In service")
  auto: AND(label="Automatic on")
  lightLogic: OR(label="Lights on")
  lights: OUTPUT(label="Street lights")
  dark.Q -> filter.A
  maintenance.Q -> allowed.A
  filter.Q -> auto.A
  allowed.Q -> auto.B
  auto.Q -> lightLogic.A
  test.Q -> lightLogic.B
  lightLogic.Q -> lights.A
}`,
    inputs: [
      { id: 'dark', type: 'INPUT', label: 'Light sensor: dark', device: 'Photocell or twilight switch' },
      { id: 'test', type: 'INPUT', label: 'Manual test', device: 'Key switch in the cabinet' },
      { id: 'maintenance', type: 'INPUT', label: 'Maintenance off', device: 'Key switch in the cabinet' },
    ],
    outputs: [{ id: 'lights', type: 'OUTPUT', label: 'Street lights', device: 'Lighting contactor' }],
    tryIt: ['Switch Light sensor: dark ON: after 10 s the lights turn on.', 'Switch it OFF for 3 s and ON again (headlights): the lights stay on.', 'Switch Manual test ON in daylight.'],
    steps: [
      { title: 'Filter the sensor', text: 'An on/off-delay longer than the disturbances.' },
      { title: 'Add maintenance switches', text: 'Test (force on) and maintenance (force off).' },
    ],
    mistakes: [
      'No delay: lights flicker at dusk and switch off when a car lights the sensor.',
      'Pointing the sensor at the lamps it controls.',
      'Letting the manual test bypass the maintenance switch, so someone working on the lamps gets a live circuit.',
    ],
    faq: [
      { q: 'How do I switch half the lights off after midnight?', a: 'Add a time signal from a clock or the PLC real-time clock and split the lamps into two groups: group 2 = lights AND NOT after midnight.' },
      { q: 'Photocell or astronomical clock?', a: 'An astronomical clock calculates sunset and sunrise from the date and location, so it has no dirty sensor. Many installations use both.' },
    ],
    blocks: ['ON_OFF_DELAY', 'AND', 'OR', 'NOT'],
    challenges: ['delayed-fan', 'stairwell-light'],
    scenarios: [
      {
        name: 'Dusk, headlights, dawn',
        steps: [
          { action: 'Daylight', waitMs: 500, expect: { lights: false } },
          { action: 'Dusk: dark for 8 s', set: { dark: true }, waitMs: 8000, expect: { lights: false } },
          { action: 'Dark for 11 s', waitMs: 3000, expect: { lights: true } },
          { action: 'Headlights for 3 s', set: { dark: false }, waitMs: 3000, expect: { lights: true } },
          { action: 'Dark again', set: { dark: true }, waitMs: 2000, expect: { lights: true } },
          { action: 'Dawn: light for 11 s', set: { dark: false }, waitMs: 11000, expect: { lights: false } },
        ],
      },
      {
        name: 'Maintenance switches',
        steps: [
          { action: 'Test in daylight', set: { test: true }, waitMs: 200, expect: { lights: true } },
          { action: 'Test off', set: { test: false }, waitMs: 200, expect: { lights: false } },
          { action: 'Night with maintenance off', set: { dark: true, maintenance: true }, waitMs: 11000, expect: { lights: false } },
          { action: 'Maintenance done', set: { maintenance: false }, waitMs: 200, expect: { lights: true } },
        ],
      },
    ],
  },
  {
    slug: 'analog-alarm-delay-deadband',
    title: 'How to make a process alarm with delay and deadband (no nuisance alarms)',
    description: 'High-temperature alarm that must persist for 5 s before it sounds and clears only 5 °C below the limit. Alarm delay plus deadband in PLC logic.',
    answer:
      'Add a deadband (hysteresis) so the alarm clears a few units below the trip point, and an on-delay so the value must stay above the limit for a few seconds before the alarm is raised. Together they remove most nuisance alarms without hiding real ones.',
    level: 'intermediate',
    explanation: `Alarms that come and go every few seconds teach operators to ignore them. Two standard tools from alarm management (ISA-18.2 / EEMUA 191):

- **Deadband**: a hysteresis switch that turns on at **80 °C** and off at **75 °C** (high trigger). A value hovering around 80 °C no longer toggles the alarm.
- **On-delay**: the alarm is only raised after the condition has lasted **5 s**. Short spikes are ignored.

The circuit also shows a **pending** signal (over the limit, delay running) that can be shown on an HMI faceplate.

Choose the values from the process: the deadband larger than the normal noise, the delay shorter than the time in which the operator must react.`,
    circuit: `circuit "Alarm with delay and deadband" version 1 {
  temp: ANALOG_INPUT(label="Temperature °C", value=60)
  band: ANALOG_DIFFERENTIAL(label="On 80 / off 75 °C", onThreshold=80, offThreshold=75)
  delay: TON(label="Alarm delay", duration=5000)
  notYet: NOT(label="Delay running")
  pendingLogic: AND(label="Pending")
  alarm: OUTPUT(label="High temperature alarm")
  pending: OUTPUT(label="Alarm pending")
  temp.Q -> band.A
  band.Q -> delay.A
  delay.Q -> notYet.A
  band.Q -> pendingLogic.A
  notYet.Q -> pendingLogic.B
  delay.Q -> alarm.A
  pendingLogic.Q -> pending.A
}`,
    inputs: [{ id: 'temp', type: 'ANALOG_INPUT', label: 'Temperature °C', device: 'Temperature transmitter' }],
    outputs: [
      { id: 'alarm', type: 'OUTPUT', label: 'High temperature alarm', device: 'Alarm to the HMI / horn' },
      { id: 'pending', type: 'OUTPUT', label: 'Alarm pending', device: 'HMI indication' },
    ],
    tryIt: ['Press Run and set 82 °C for 2 s, then 70 °C: no alarm.', 'Set 82 °C and wait 5 s: alarm.', 'Lower to 78 °C: still in alarm (deadband). Lower to 74 °C: cleared.'],
    steps: [
      { title: 'Deadband', text: 'Hysteresis: on at the limit, off a few units lower.' },
      { title: 'Delay', text: 'On-delay on the banded signal.' },
      { title: 'Show pending', text: 'Over the limit but not yet alarmed.' },
    ],
    mistakes: [
      'Delaying alarms that need an immediate response, such as a fire or a safety trip.',
      'A deadband smaller than the measurement noise.',
      'Delaying the clear as well as the raise, so the alarm stays after the problem is gone.',
    ],
    faq: [
      { q: 'What deadband values are typical?', a: 'EEMUA 191 suggests about 1 % of range for flow and level, 2 % for temperature and pressure as a starting point, then tune from the alarm history.' },
      { q: 'Should the alarm latch?', a: 'For important alarms, combine this with the acknowledge pattern from the alarm guide, so a short alarm is not missed.' },
    ],
    blocks: ['ANALOG_DIFFERENTIAL', 'TON', 'AND', 'NOT'],
    challenges: ['tank-level', 'delayed-fan'],
    scenarios: [
      {
        name: 'Spike, real alarm, deadband',
        steps: [
          { action: 'Normal 60 °C', set: { temp: 60 }, waitMs: 500, expect: { alarm: false, pending: false } },
          { action: 'Spike to 82 °C for 2 s', set: { temp: 82 }, waitMs: 2000, expect: { alarm: false, pending: true } },
          { action: 'Back to 70 °C', set: { temp: 70 }, waitMs: 1000, expect: { alarm: false, pending: false } },
          { action: '82 °C sustained', set: { temp: 82 }, waitMs: 5300, expect: { alarm: true, pending: false } },
          { action: '79 °C (inside the deadband)', set: { temp: 79 }, waitMs: 1000, expect: { alarm: true } },
          { action: '74 °C', set: { temp: 74 }, waitMs: 200, expect: { alarm: false } },
        ],
      },
    ],
  },
  {
    slug: 'two-speed-dosing-by-weight',
    title: 'How to dose by weight with fast and slow filling (two-speed dosing)',
    description: 'Fill to a target weight with a fast valve until 90 % and a slow valve for the last 10 %, stop at the target. Weighing and dosing logic in a PLC.',
    answer:
      'Open both the fast and the slow valve at the start, close the fast valve at about 90 % of the target, and close the slow valve at the target. The slow final phase makes the result accurate without making the whole fill slow.',
    level: 'intermediate',
    explanation: `A load cell measures the weight in the hopper.

- **Dosing** latch: Start sets it (only when the target has not been reached), Stop or the target resets it.
- **Fast valve** = dosing AND weight < 90 kg.
- **Slow valve** = dosing. It closes when the target resets the dosing latch.
- **Done** = weight ≥ 100 kg.

The material still in the air when a valve closes (the **in-flight** quantity) makes the result overshoot. Real dosing controllers learn it and close the slow valve a little before the target; with a fixed early cut-off you get the same effect.`,
    circuit: `circuit "Two-speed dosing" version 1 {
  weight: ANALOG_INPUT(label="Weight (kg)", value=0)
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  fastLimit: ANALOG_CONSTANT(label="Fast cut-off 90 kg", value=90)
  target: ANALOG_CONSTANT(label="Target 100 kg", value=100)
  belowFast: ANALOG_COMPARATOR(label="Below 90 kg", operation="lt")
  reached: ANALOG_COMPARATOR(label="At or above 100 kg", operation="gte")
  stopOrDone: OR(label="Stop or target")
  dosing: RS_LATCH(label="Dosing")
  fastLogic: AND(label="Fast")
  fastValve: OUTPUT(label="Fast valve")
  slowValve: OUTPUT(label="Slow valve")
  done: OUTPUT(label="Target reached")
  weight.Q -> belowFast.A
  fastLimit.Q -> belowFast.B
  weight.Q -> reached.A
  target.Q -> reached.B
  stop.Q -> stopOrDone.A
  reached.Q -> stopOrDone.B
  start.Q -> dosing.S
  stopOrDone.Q -> dosing.R
  dosing.Q -> fastLogic.A
  belowFast.Q -> fastLogic.B
  fastLogic.Q -> fastValve.A
  dosing.Q -> slowValve.A
  reached.Q -> done.A
}`,
    inputs: [
      { id: 'weight', type: 'ANALOG_INPUT', label: 'Weight (kg)', device: 'Load cells via a weighing transmitter' },
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button or batch command' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
    ],
    outputs: [
      { id: 'fastValve', type: 'OUTPUT', label: 'Fast valve', device: 'Large feed valve or fast screw speed' },
      { id: 'slowValve', type: 'OUTPUT', label: 'Slow valve', device: 'Small feed valve or slow screw speed' },
      { id: 'done', type: 'OUTPUT', label: 'Target reached', device: 'Indicator / batch step done' },
    ],
    tryIt: ['Press Run, switch Start on and off: both valves open.', 'Raise the weight to 92 kg: only the slow valve stays open.', 'Raise to 100 kg: dosing ends.'],
    steps: [
      { title: 'Latch the dose', text: 'Start sets; Stop or target resets (reset wins).' },
      { title: 'Fast phase', text: 'Fast valve while below the cut-off.' },
      { title: 'Slow phase', text: 'The slow valve stays open until the target resets the latch.' },
    ],
    mistakes: [
      'Only one speed: either slow, or inaccurate.',
      'Weighing while the hopper is still swinging or the feeder vibrates. Filter the weight or wait for it to settle before the final check.',
      'Not taring the scale (zeroing the empty hopper) before each dose.',
    ],
    faq: [
      { q: 'How do I compensate for in-flight material?', a: 'Measure the overshoot of the last doses and move the slow cut-off down by that amount, within limits. This is called in-flight or preact compensation.' },
      { q: 'Can I use a VFD instead of two valves?', a: 'Yes: run the feeder screw at high speed until the cut-off, then at low speed until the target.' },
    ],
    blocks: ['ANALOG_COMPARATOR', 'ANALOG_CONSTANT', 'RS_LATCH', 'AND', 'OR'],
    challenges: ['sensor-scaling'],
    scenarios: [
      {
        name: 'One dose',
        steps: [
          { action: 'Empty, press Start', set: { weight: 0, start: true }, waitMs: 200, expect: { fastValve: true, slowValve: true, done: false } },
          { action: '50 kg', set: { start: false, weight: 50 }, waitMs: 200, expect: { fastValve: true, slowValve: true } },
          { action: '92 kg', set: { weight: 92 }, waitMs: 200, expect: { fastValve: false, slowValve: true } },
          { action: '100 kg', set: { weight: 100 }, waitMs: 200, expect: { fastValve: false, slowValve: false, done: true } },
          { action: 'Hopper emptied to 0 kg: stays idle', set: { weight: 0 }, waitMs: 300, expect: { fastValve: false, slowValve: false, done: false } },
        ],
      },
      {
        name: 'Stop and full hopper',
        steps: [
          { action: 'Start', set: { weight: 10, start: true }, waitMs: 200, expect: { fastValve: true } },
          { action: 'Stop', set: { start: false, stop: true }, waitMs: 200, expect: { fastValve: false, slowValve: false } },
          { action: 'Start with a full hopper', set: { stop: false, weight: 100, start: true }, waitMs: 300, expect: { fastValve: false, slowValve: false } },
        ],
      },
    ],
  },
  {
    slug: 'parking-boom-barrier-plc',
    title: 'PLC program for a parking boom barrier with vehicle loop safety',
    description: 'Raise the barrier on a valid ticket, lower it only after the vehicle has left the loop, and never lower onto a car. Boom barrier logic you can run.',
    answer:
      'Latch an open request on a valid ticket and clear it when the vehicle leaves the safety loop under the barrier. The barrier is held up while the request is active or while anything is on the loop, so it can never come down on a vehicle.',
    level: 'beginner',
    explanation: `- **Request** latch: Set = valid ticket. Reset = the vehicle has left the loop (falling edge of the loop detector).
- **Hold up** = request OR vehicle on loop.
- **Raise** = hold up AND NOT up limit.
- **Lower** = NOT hold up AND NOT down limit.

If a second car follows closely (tailgating), the loop stays occupied and the barrier stays up until it has passed too. If something enters the loop while the barrier is lowering, it immediately goes back up.`,
    circuit: `circuit "Boom barrier" version 1 {
  ticket: INPUT(label="Valid ticket")
  loop: INPUT(label="Vehicle on loop")
  isUp: INPUT(label="Up limit")
  isDown: INPUT(label="Down limit", value=true)
  passed: F_TRIG(label="Vehicle left loop")
  request: RS_LATCH(label="Open request")
  holdUp: OR(label="Hold up")
  notHold: NOT(label="Clear to lower")
  notUp: NOT(label="Not up")
  notDown: NOT(label="Not down")
  raiseLogic: AND(label="Raise")
  lowerLogic: AND(label="Lower")
  raise: OUTPUT(label="Raise barrier")
  lower: OUTPUT(label="Lower barrier")
  loop.Q -> passed.A
  ticket.Q -> request.S
  passed.Q -> request.R
  request.Q -> holdUp.A
  loop.Q -> holdUp.B
  holdUp.Q -> notHold.A
  isUp.Q -> notUp.A
  isDown.Q -> notDown.A
  holdUp.Q -> raiseLogic.A
  notUp.Q -> raiseLogic.B
  notHold.Q -> lowerLogic.A
  notDown.Q -> lowerLogic.B
  raiseLogic.Q -> raise.A
  lowerLogic.Q -> lower.A
}`,
    inputs: [
      { id: 'ticket', type: 'INPUT', label: 'Valid ticket', device: 'Pulse from the ticket or ANPR system' },
      { id: 'loop', type: 'INPUT', label: 'Vehicle on loop', device: 'Induction loop detector under the barrier' },
      { id: 'isUp', type: 'INPUT', label: 'Up limit', device: 'Limit switch' },
      { id: 'isDown', type: 'INPUT', label: 'Down limit', device: 'Limit switch' },
    ],
    outputs: [
      { id: 'raise', type: 'OUTPUT', label: 'Raise barrier', device: 'Barrier motor up' },
      { id: 'lower', type: 'OUTPUT', label: 'Lower barrier', device: 'Barrier motor down' },
    ],
    tryIt: ['Switch Valid ticket on and off: the barrier raises (switch Down limit OFF and Up limit ON).', 'Switch Vehicle on loop ON, then OFF: the barrier lowers.', 'Switch the loop ON while lowering: it goes back up.'],
    steps: [
      { title: 'Latch the request', text: 'Ticket sets; vehicle leaving the loop resets.' },
      { title: 'Hold up while occupied', text: 'Request OR loop occupied.' },
      { title: 'Drive to the limits', text: 'Raise until up, lower until down.' },
    ],
    mistakes: [
      'Lowering on a timer after the ticket, regardless of where the car is.',
      'Resetting the request when the car arrives on the loop instead of when it leaves.',
      'A loop that does not detect high vehicles or motorcycles reliably; tune the loop detector sensitivity.',
    ],
    faq: [
      { q: 'How do I count cars with this?', a: 'Count the falling edges of the loop (vehicle passed) with a counter, like the car park counter guide.' },
      { q: 'Should the barrier lower if a car backs out?', a: 'With this logic it does: when the car leaves the loop the request resets. Use a second loop or direction detection if reversing should be handled differently.' },
    ],
    blocks: ['F_TRIG', 'RS_LATCH', 'OR', 'AND', 'NOT'],
    challenges: ['one-shot-valve'],
    never: [{ when: { raise: true, lower: true }, message: 'Raise and lower were on together' }],
    scenarios: [
      {
        name: 'One car, then tailgating',
        steps: [
          { action: 'Barrier down, idle', set: { isDown: true }, waitMs: 300, expect: { raise: false, lower: false } },
          { action: 'Valid ticket', set: { ticket: true }, waitMs: 200, expect: { raise: true } },
          { action: 'Barrier reaches up', set: { ticket: false, isDown: false, isUp: true }, waitMs: 300, expect: { raise: false, lower: false } },
          { action: 'Car on the loop', set: { loop: true }, waitMs: 1000, expect: { lower: false } },
          { action: 'Car leaves', set: { loop: false }, waitMs: 200, expect: { lower: true } },
          { action: 'Barrier moving down; next car drives in', set: { isUp: false, loop: true }, waitMs: 200, expect: { lower: false, raise: true } },
          { action: 'Up again', set: { isUp: true }, waitMs: 300, expect: { raise: false } },
          { action: 'Second car leaves', set: { loop: false }, waitMs: 200, expect: { lower: true } },
          { action: 'Down', set: { isUp: false, isDown: true }, waitMs: 300, expect: { lower: false } },
        ],
      },
    ],
  },
  {
    slug: 'two-hand-control-anti-tie-down',
    title: 'How to program two-hand control with 0.5 s synchronisation and anti-tie-down',
    description: 'Two-hand control logic: both buttons within 0.5 s, hold-to-run, and both must be released before the next cycle. Live PLC example with safety notes.',
    answer:
      'Start only if both buttons are pressed within 0.5 s of each other, keep running only while both are held, and require both buttons to be released before the next start. That stops one button being taped down or pressed with an elbow.',
    level: 'advanced',
    explanation: `**Safety note:** two-hand control devices are safety functions (ISO 13851, type III C for presses) and must be built with certified two-hand relays or safety PLCs. This page explains the logic.

- **Too late**: an on-delay of 0.5 s on "any button pressed". If the second hand comes later, the start is refused.
- The same timer gives **anti-tie-down**: it keeps running as long as *either* button is held, so once 0.5 s have passed nothing can start until *both* buttons have been released. A button taped down keeps the system blocked for ever.
- **Start** = both pressed AND NOT too late.
- **Stroke** latch: set by Start, reset when either button is released (**hold-to-run**).`,
    circuit: `circuit "Two-hand control" version 1 {
  left: INPUT(label="Left button")
  right: INPUT(label="Right button")
  any: OR(label="Any button pressed")
  both: AND(label="Both pressed")
  late: TON(label="0.5 s window", duration=500)
  inTime: NOT(label="Within the window")
  startLogic: AND(label="Start stroke")
  released: NOT(label="A hand released")
  stroke: RS_LATCH(label="Stroke")
  press: OUTPUT(label="Press stroke")
  left.Q -> any.A
  right.Q -> any.B
  left.Q -> both.A
  right.Q -> both.B
  any.Q -> late.A
  late.Q -> inTime.A
  both.Q -> startLogic.A
  inTime.Q -> startLogic.B
  both.Q -> released.A
  startLogic.Q -> stroke.S
  released.Q -> stroke.R
  stroke.Q -> press.A
}`,
    inputs: [
      { id: 'left', type: 'INPUT', label: 'Left button', device: 'Two-hand station, left (1 NO + 1 NC in a real device)' },
      { id: 'right', type: 'INPUT', label: 'Right button', device: 'Two-hand station, right' },
    ],
    outputs: [{ id: 'press', type: 'OUTPUT', label: 'Press stroke', device: 'Press valve via the safety relay' }],
    tryIt: ['Switch both buttons ON together: the stroke runs while both are held.', 'Release one: it stops.', 'Hold Left, wait 1 s, then press Right: refused until both are released.'],
    steps: [
      { title: 'Time the window', text: 'On-delay of 0.5 s from the first button.' },
      { title: 'Require release', text: 'The window timer only resets when both buttons are released.' },
      { title: 'Start in time', text: 'Both pressed within the window.' },
      { title: 'Hold to run', text: 'Releasing either button ends the stroke.' },
    ],
    mistakes: [
      'Only ANDing the two buttons: one button taped down turns it into one-hand control.',
      'Latching the stroke so it continues after the hands are released (unless the risk assessment allows it for the non-hazardous part).',
      'Building it in a standard PLC for a real press. Use a certified two-hand control relay.',
    ],
    faq: [
      { q: 'Why 0.5 s?', a: 'ISO 13851 requires the two inputs to be actuated within 0.5 s of each other for types II and III, which makes it hard to operate both with one hand and an elbow.' },
      { q: 'How far from the danger zone must the buttons be?', a: 'Far enough that the hands cannot reach the danger zone before the movement stops. ISO 13855 gives the formula based on stopping time.' },
    ],
    blocks: ['TON', 'RS_LATCH', 'AND', 'OR', 'NOT'],
    challenges: ['two-hand-start', 'guarded-machine'],
    never: [{ when: { press: true, left: false }, message: 'The press ran without the left hand' }, { when: { press: true, right: false }, message: 'The press ran without the right hand' }],
    scenarios: [
      {
        name: 'Valid operation',
        steps: [
          { action: 'Both released', waitMs: 300, expect: { press: false } },
          { action: 'Left pressed', set: { left: true }, waitMs: 200, expect: { press: false } },
          { action: 'Right pressed 0.2 s later', set: { right: true }, waitMs: 200, expect: { press: true } },
          { action: 'Held for 2 s', waitMs: 2000, expect: { press: true } },
          { action: 'Right released', set: { right: false }, waitMs: 200, expect: { press: false } },
          { action: 'Right pressed again without releasing left', set: { right: true }, waitMs: 300, expect: { press: false } },
          { action: 'Both released', set: { left: false, right: false }, waitMs: 300 },
          { action: 'Both pressed together', set: { left: true, right: true }, waitMs: 200, expect: { press: true } },
        ],
      },
      {
        name: 'Too slow and tie-down',
        steps: [
          { action: 'Left pressed', set: { left: true }, waitMs: 1000 },
          { action: 'Right 1 s later', set: { right: true }, waitMs: 500, expect: { press: false } },
          { action: 'Release right only, press again', set: { right: false }, waitMs: 200 },
          { action: 'Right pressed (left still taped down)', set: { right: true }, waitMs: 500, expect: { press: false } },
          { action: 'Both released', set: { left: false, right: false }, waitMs: 300 },
          { action: 'Right first', set: { right: true }, waitMs: 1000 },
          { action: 'Left 1 s later', set: { left: true }, waitMs: 500, expect: { press: false } },
        ],
      },
    ],
  },
  {
    slug: 'valve-before-pump-start-sequence',
    title: 'How to open a valve before starting a pump (valve-pump sequence)',
    description: 'Open the discharge valve first, start the pump only when the valve open limit switch confirms, stop the pump before closing the valve. PLC logic.',
    answer:
      'On start, open the valve and wait for its open limit switch before starting the pump. On stop, stop the pump at once and close the valve only after a short delay. Raise a fault if the valve does not reach open in time.',
    level: 'intermediate',
    explanation: `Starting a pump against a closed valve overheats it or causes a pressure surge; closing a valve on a running pump causes water hammer.

- **Run** latch: Start / Stop (and a valve fault).
- **Open valve** = off-delay (2 s) on Run: opens at once, closes 2 s after Stop.
- **Pump** = Run AND valve open limit.
- **Valve fault**: Run AND NOT open limit for 5 s latches a fault and resets Run. Reset clears it.`,
    circuit: `circuit "Valve before pump" version 1 {
  start: INPUT(label="Start")
  stop: INPUT(label="Stop")
  isOpen: INPUT(label="Valve open limit")
  reset: INPUT(label="Fault reset")
  faultPrev: SCAN_DELAY(label="Fault (last scan)")
  stopOrFault: OR(label="Stop or fault")
  run: RS_LATCH(label="Run")
  valveHold: TOF(label="Valve close delay", duration=2000)
  pumpLogic: AND(label="Pump allowed")
  notOpen: NOT(label="Valve not open")
  waiting: AND(label="Waiting for valve")
  travel: TON(label="Valve travel time", duration=5000)
  fault: RS_LATCH(label="Valve fault")
  openValve: OUTPUT(label="Open valve")
  pump: OUTPUT(label="Pump")
  faultLamp: OUTPUT(label="Valve fault")
  fault.Q -> faultPrev.A
  stop.Q -> stopOrFault.A
  faultPrev.Q -> stopOrFault.B
  start.Q -> run.S
  stopOrFault.Q -> run.R
  run.Q -> valveHold.A
  run.Q -> pumpLogic.A
  isOpen.Q -> pumpLogic.B
  isOpen.Q -> notOpen.A
  run.Q -> waiting.A
  notOpen.Q -> waiting.B
  waiting.Q -> travel.A
  travel.Q -> fault.S
  reset.Q -> fault.R
  valveHold.Q -> openValve.A
  pumpLogic.Q -> pump.A
  fault.Q -> faultLamp.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start', device: 'Push button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'isOpen', type: 'INPUT', label: 'Valve open limit', device: 'Valve position switch (open)' },
      { id: 'reset', type: 'INPUT', label: 'Fault reset', device: 'Reset push button' },
    ],
    outputs: [
      { id: 'openValve', type: 'OUTPUT', label: 'Open valve', device: 'Actuated valve open command' },
      { id: 'pump', type: 'OUTPUT', label: 'Pump', device: 'Pump contactor' },
      { id: 'faultLamp', type: 'OUTPUT', label: 'Valve fault', device: 'Alarm lamp' },
    ],
    tryIt: ['Switch Start on and off: the valve opens, the pump waits.', 'Switch Valve open limit ON: the pump starts.', 'Switch Stop: the pump stops at once, the valve closes 2 s later.'],
    steps: [
      { title: 'Open the valve first', text: 'The valve command follows Run through an off-delay.' },
      { title: 'Confirm before starting', text: 'Pump = Run AND open limit.' },
      { title: 'Close after stopping', text: 'The off-delay keeps the valve open for 2 s after Stop.' },
      { title: 'Supervise the valve', text: 'A travel timer raises a fault if the limit never arrives.' },
    ],
    mistakes: [
      'Starting the pump on the valve command instead of the limit switch.',
      'Closing the valve and stopping the pump at the same moment.',
      'A travel time shorter than the real valve stroke time.',
    ],
    faq: [
      { q: 'What about centrifugal pumps that start against a closed valve?', a: 'Some large centrifugal pumps are started with the discharge valve closed to limit power, then opened slowly. The sequence is reversed but the pattern (wait for confirmation, supervise travel) is the same.' },
      { q: 'How do I handle a valve that drifts closed while running?', a: 'The pump already stops when the open limit drops; the travel timer then raises the fault after 5 s.' },
    ],
    blocks: ['TOF', 'TON', 'RS_LATCH', 'SCAN_DELAY', 'AND', 'OR', 'NOT'],
    challenges: ['delayed-fan', 'start-stop'],
    never: [{ when: { pump: true, openValve: false }, message: 'The pump ran with the valve command off' }],
    scenarios: [
      {
        name: 'Normal start and stop',
        steps: [
          { action: 'Press Start', set: { start: true }, waitMs: 200, expect: { openValve: true, pump: false } },
          { action: 'Valve travelling', set: { start: false }, waitMs: 2000, expect: { pump: false, faultLamp: false } },
          { action: 'Valve open', set: { isOpen: true }, waitMs: 200, expect: { pump: true } },
          { action: 'Pumping for 6 s', waitMs: 6000, expect: { pump: true, faultLamp: false } },
          { action: 'Press Stop', set: { stop: true }, waitMs: 200, expect: { pump: false, openValve: true } },
          { action: '2.5 s later', set: { stop: false }, waitMs: 2300, expect: { openValve: false } },
        ],
      },
      {
        name: 'Valve fails to open',
        steps: [
          { action: 'Start, valve stuck', set: { isOpen: false, start: true }, waitMs: 200, expect: { openValve: true } },
          { action: '5 s later', set: { start: false }, waitMs: 5200, expect: { faultLamp: true, pump: false } },
          { action: 'Run dropped, valve closes', waitMs: 2500, expect: { openValve: false } },
          { action: 'Reset', set: { reset: true }, waitMs: 200, expect: { faultLamp: false } },
        ],
      },
    ],
  },
];
