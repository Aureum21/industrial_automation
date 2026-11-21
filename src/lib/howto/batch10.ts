import type { HowTo } from './types.ts';

/** Tenth batch of how-to guides. Verified by tests/howto.test.ts. */
export const HOW_TOS_BATCH_10: HowTo[] = [
  {
    slug: 'burner-management-purge-ignition-sequence',
    title: 'How a burner management sequence works: purge, ignition, flame proving, lockout',
    description: 'Burner sequence logic explained live: fan and airflow proving, timed purge, trial for ignition, flame supervision and a lockout that needs a manual reset.',
    answer:
      'Before any fuel is admitted, the fan purges the combustion chamber with proven airflow. Then the igniter and fuel valve open for a short trial for ignition; if no flame is proven by the end of the trial, or the flame or airflow is lost later, the fuel closes and the burner locks out until someone resets it.',
    level: 'advanced',
    explanation: `**Safety note:** burner management systems are safety-critical and must use certified burner controllers or safety PLCs designed to standards such as EN 298 / EN 746-2 / NFPA 85/86. This page explains the logic for learning only.

| Phase | Fan | Igniter | Fuel valve | Ends when |
|---|---|---|---|---|
| Pre-purge | on | off | closed | 5 s with airflow proven |
| Trial for ignition | on | on | open | 3 s |
| Firing | on | off | open while flame is proven | demand ends |

**Lockout** (latched, manual reset) when:
- no flame at the end of the trial for ignition, or the flame is lost while firing;
- airflow is not proven 3 s after the fan starts, or is lost later;
- a flame is detected for more than **1.5 s** when there should be none (idle or purge), which means a leaking valve or a faulty detector. The delay is the flame failure response time: after a normal shutdown the flame needs a moment to die out.

The fuel valve can only be open during the trial or with a proven flame, and only after a complete purge.`,
    circuit: `circuit "Burner management" version 1 {
  demand: INPUT(label="Heat demand")
  airflow: INPUT(label="Airflow proven")
  flame: INPUT(label="Flame detected")
  reset: INPUT(label="Lockout reset")
  lockPrev: SCAN_DELAY(label="Locked out (last scan)")
  notLocked: NOT(label="Not locked out")
  run: AND(label="Run")
  purgeEnable: AND(label="Purging with airflow")
  purge: TON(label="Pre-purge", duration=5000)
  firing: AND(label="Purge complete")
  trial: TON(label="Trial for ignition", duration=3000)
  inTrial: NOT(label="Trial running")
  ignLogic: AND(label="Ignite")
  keepFuel: OR(label="Trial or flame")
  fuelLogic: AND(label="Fuel")
  noFlame: NOT(label="No flame")
  flameFail: AND(label="No flame after trial")
  airCheck: TON(label="Airflow proving time", duration=3000)
  noAir: NOT(label="No airflow")
  airFail: AND(label="Airflow failure")
  notFiring: NOT(label="Not firing")
  falseFlame: AND(label="Unexpected flame")
  falseFlameTime: TON(label="Flame failure response time", duration=1500)
  fail1: OR(label="Flame or air failure")
  fail: OR(label="Lockout condition")
  resetOk: AND(label="Reset with no flame")
  lockout: RS_LATCH(label="Lockout")
  fan: OUTPUT(label="Combustion air fan")
  igniter: OUTPUT(label="Igniter")
  fuel: OUTPUT(label="Fuel valve")
  lockLamp: OUTPUT(label="Lockout lamp")
  lockout.Q -> lockPrev.A
  lockPrev.Q -> notLocked.A
  demand.Q -> run.A
  notLocked.Q -> run.B
  run.Q -> purgeEnable.A
  airflow.Q -> purgeEnable.B
  purgeEnable.Q -> purge.A
  run.Q -> firing.A
  purge.Q -> firing.B
  firing.Q -> trial.A
  trial.Q -> inTrial.A
  firing.Q -> ignLogic.A
  inTrial.Q -> ignLogic.B
  inTrial.Q -> keepFuel.A
  flame.Q -> keepFuel.B
  firing.Q -> fuelLogic.A
  keepFuel.Q -> fuelLogic.B
  flame.Q -> noFlame.A
  trial.Q -> flameFail.A
  noFlame.Q -> flameFail.B
  run.Q -> airCheck.A
  airflow.Q -> noAir.A
  airCheck.Q -> airFail.A
  noAir.Q -> airFail.B
  firing.Q -> notFiring.A
  flame.Q -> falseFlame.A
  notFiring.Q -> falseFlame.B
  flameFail.Q -> fail1.A
  airFail.Q -> fail1.B
  fail1.Q -> fail.A
  falseFlame.Q -> falseFlameTime.A
  falseFlameTime.Q -> fail.B
  reset.Q -> resetOk.A
  noFlame.Q -> resetOk.B
  fail.Q -> lockout.S
  resetOk.Q -> lockout.R
  run.Q -> fan.A
  ignLogic.Q -> igniter.A
  fuelLogic.Q -> fuel.A
  lockout.Q -> lockLamp.A
}`,
    inputs: [
      { id: 'demand', type: 'INPUT', label: 'Heat demand', device: 'Thermostat or boiler control' },
      { id: 'airflow', type: 'INPUT', label: 'Airflow proven', device: 'Air pressure switch' },
      { id: 'flame', type: 'INPUT', label: 'Flame detected', device: 'UV or ionisation flame detector' },
      { id: 'reset', type: 'INPUT', label: 'Lockout reset', device: 'Reset push button' },
    ],
    outputs: [
      { id: 'fan', type: 'OUTPUT', label: 'Combustion air fan', device: 'Fan contactor' },
      { id: 'igniter', type: 'OUTPUT', label: 'Igniter', device: 'Ignition transformer' },
      { id: 'fuel', type: 'OUTPUT', label: 'Fuel valve', device: 'Gas or oil safety shut-off valves' },
      { id: 'lockLamp', type: 'OUTPUT', label: 'Lockout lamp', device: 'Alarm lamp' },
    ],
    tryIt: ['Switch Heat demand ON, then Airflow proven ON within 3 s.', 'After the 5 s purge the igniter and fuel open: switch Flame detected ON before the 3 s trial ends.', 'Try it without a flame: lockout. Reset it with the reset input.'],
    steps: [
      { title: 'Prove airflow', text: 'The purge timer only runs with airflow proven.' },
      { title: 'Trial for ignition', text: 'Igniter and fuel for a short, fixed time.' },
      { title: 'Supervise the flame', text: 'After the trial, fuel stays open only with a flame.' },
      { title: 'Lock out on any failure', text: 'Latched; reset only manually and with no flame present.' },
    ],
    mistakes: [
      'Opening the fuel valve before the purge is complete, or purging without proven airflow.',
      'Retrying ignition automatically after a failure: unburnt fuel can accumulate and explode.',
      'Using a standard PLC instead of a certified burner controller or safety PLC.',
    ],
    faq: [
      { q: 'Why is a pre-purge needed?', a: 'To remove any fuel that leaked into the furnace before ignition. Standards require a minimum number of volume changes (often four or more), which sets the purge time.' },
      { q: 'What is a false flame check?', a: 'Before start, the flame detector must report no flame. A flame signal at that time means a leaking fuel valve or a failed detector, and the burner must not start.' },
    ],
    blocks: ['TON', 'RS_LATCH', 'SCAN_DELAY', 'AND', 'OR', 'NOT'],
    challenges: ['guarded-machine', 'star-delta'],
    never: [{ when: { fuel: true, igniter: false, flame: false }, message: 'Fuel was open with neither ignition nor flame' }],
    scenarios: [
      {
        name: 'Normal start and stop',
        steps: [
          { action: 'Demand', set: { demand: true }, waitMs: 500, expect: { fan: true, fuel: false, igniter: false } },
          { action: 'Airflow proven', set: { airflow: true }, waitMs: 4500, expect: { fuel: false } },
          { action: 'Purge complete', waitMs: 1000, expect: { igniter: true, fuel: true } },
          { action: 'Flame established', set: { flame: true }, waitMs: 1000, expect: { fuel: true } },
          { action: 'Trial over: firing', waitMs: 2500, expect: { igniter: false, fuel: true, lockLamp: false } },
          { action: 'Demand ends', set: { demand: false }, waitMs: 200, expect: { fuel: false, fan: false } },
          { action: 'Flame out', set: { flame: false, airflow: false }, waitMs: 500, expect: { lockLamp: false } },
        ],
      },
      {
        name: 'Ignition failure and reset',
        steps: [
          { action: 'Demand with airflow', set: { demand: true, airflow: true }, waitMs: 5500, expect: { fuel: true } },
          { action: 'No flame during the trial', waitMs: 3000, expect: { fuel: false, igniter: false, lockLamp: true } },
          { action: 'Stays locked out', waitMs: 6000, expect: { fuel: false, fan: false } },
          { action: 'Reset', set: { reset: true }, waitMs: 200, expect: { lockLamp: false } },
          { action: 'New purge starts', set: { reset: false }, waitMs: 1000, expect: { fan: true, fuel: false } },
        ],
      },
      {
        name: 'Air and flame faults',
        steps: [
          { action: 'Demand, airflow never proven', set: { demand: true }, waitMs: 3500, expect: { lockLamp: true, fan: false } },
          { action: 'Reset', set: { demand: false, reset: true }, waitMs: 200, expect: { lockLamp: false } },
          { action: 'Flame seen while idle', set: { reset: false, flame: true }, waitMs: 2000, expect: { lockLamp: true } },
          { action: 'Reset refused with flame present', set: { reset: true }, waitMs: 200, expect: { lockLamp: true } },
          { action: 'Flame gone, reset', set: { flame: false }, waitMs: 200, expect: { lockLamp: false } },
          { action: 'Firing, then airflow lost', set: { reset: false, demand: true, airflow: true }, waitMs: 5500 },
          { action: 'Flame', set: { flame: true }, waitMs: 3500, expect: { fuel: true } },
          { action: 'Airflow lost', set: { airflow: false }, waitMs: 300, expect: { fuel: false, lockLamp: true } },
        ],
      },
    ],
  },
  {
    slug: 'awning-wind-sun-automation',
    title: 'How to automate an awning with sun and wind sensors (with wind lock)',
    description: 'Extend the awning in sunshine, retract it in wind, and keep it in for a while after the wind calms down. Home automation logic you can run live.',
    answer:
      'Extend when the sun sensor reports sunshine and retract when it does not, but let the wind sensor override everything: after a few seconds of strong wind the awning retracts and stays locked in until the wind has been calm for a while.',
    level: 'beginner',
    explanation: `- **Wind lock**: a latch set when the wind sensor has been active for **2 s** (gusts shorter than that are ignored) and reset when it has been calm for **10 s** (typically 10–15 minutes).
- **Want out** = sun AND NOT wind lock.
- **Extend** = want out AND NOT fully extended; **Retract** = NOT want out AND NOT fully retracted.

Wind always wins: an awning damaged by a storm costs far more than one that retracts a little too often.`,
    circuit: `circuit "Awning control" version 1 {
  sun: INPUT(label="Sunny")
  wind: INPUT(label="Wind above limit")
  isOut: INPUT(label="Fully extended")
  isIn: INPUT(label="Fully retracted", value=true)
  windy: TON(label="Wind for 2 s", duration=2000)
  calmSignal: NOT(label="No wind")
  calm: TON(label="Calm for 10 s", duration=10000)
  windLock: RS_LATCH(label="Wind lock")
  unlocked: NOT(label="No wind lock")
  wantOut: AND(label="Want extended")
  wantIn: NOT(label="Want retracted")
  notOut: NOT(label="Not fully extended")
  notIn: NOT(label="Not fully retracted")
  extendLogic: AND(label="Extend")
  retractLogic: AND(label="Retract")
  extend: OUTPUT(label="Motor extend")
  retract: OUTPUT(label="Motor retract")
  windLamp: OUTPUT(label="Wind lock lamp")
  wind.Q -> windy.A
  wind.Q -> calmSignal.A
  calmSignal.Q -> calm.A
  windy.Q -> windLock.S
  calm.Q -> windLock.R
  windLock.Q -> unlocked.A
  sun.Q -> wantOut.A
  unlocked.Q -> wantOut.B
  wantOut.Q -> wantIn.A
  isOut.Q -> notOut.A
  isIn.Q -> notIn.A
  wantOut.Q -> extendLogic.A
  notOut.Q -> extendLogic.B
  wantIn.Q -> retractLogic.A
  notIn.Q -> retractLogic.B
  extendLogic.Q -> extend.A
  retractLogic.Q -> retract.A
  windLock.Q -> windLamp.A
}`,
    inputs: [
      { id: 'sun', type: 'INPUT', label: 'Sunny', device: 'Sun sensor with threshold (often with its own delay)' },
      { id: 'wind', type: 'INPUT', label: 'Wind above limit', device: 'Anemometer threshold output' },
      { id: 'isOut', type: 'INPUT', label: 'Fully extended', device: 'Motor end limit (or position)' },
      { id: 'isIn', type: 'INPUT', label: 'Fully retracted', device: 'Motor end limit (or position)' },
    ],
    outputs: [
      { id: 'extend', type: 'OUTPUT', label: 'Motor extend', device: 'Awning motor, out' },
      { id: 'retract', type: 'OUTPUT', label: 'Motor retract', device: 'Awning motor, in' },
      { id: 'windLamp', type: 'OUTPUT', label: 'Wind lock lamp', device: 'Indicator' },
    ],
    tryIt: ['Switch Sunny ON: the motor extends (switch Fully retracted OFF and Fully extended ON).', 'Switch Wind ON for 2 s: it retracts and the wind lock lights.', 'Switch the wind OFF: the awning stays in until 10 s of calm.'],
    steps: [
      { title: 'Filter the wind', text: 'Only sustained wind sets the lock.' },
      { title: 'Hold the lock', text: 'Reset only after a calm period.' },
      { title: 'Decide the position', text: 'Out with sun and no lock, in otherwise.' },
      { title: 'Drive to the limits', text: 'Opposite conditions, so never both directions.' },
    ],
    mistakes: [
      'Retracting on every gust, which wears the motor; or never filtering, which makes it hunt.',
      'Letting the sun sensor override the wind lock.',
      'Forgetting rain and frost: many installations also retract on rain and lock in below freezing.',
    ],
    faq: [
      { q: 'How do I add a manual override?', a: 'Add up/down buttons that set a manual mode for a limited time, but keep the wind lock above manual so a storm still retracts the awning.' },
      { q: 'Can this run on an Arduino?', a: 'Yes. Read the sensors on digital inputs, drive the motor through two interlocked relays, and use the generated sketch.' },
    ],
    blocks: ['TON', 'RS_LATCH', 'AND', 'NOT'],
    challenges: ['delayed-fan'],
    never: [{ when: { extend: true, retract: true }, message: 'Extend and retract together' }],
    scenarios: [
      {
        name: 'Sun, wind, calm',
        steps: [
          { action: 'Sun', set: { sun: true, isIn: true }, waitMs: 200, expect: { extend: true } },
          { action: 'Extended', set: { isIn: false, isOut: true }, waitMs: 300, expect: { extend: false, retract: false } },
          { action: 'Gust of 1 s', set: { wind: true }, waitMs: 1000, expect: { retract: false } },
          { action: 'Calm again', set: { wind: false }, waitMs: 500, expect: { retract: false } },
          { action: 'Wind for 2.5 s', set: { wind: true }, waitMs: 2500, expect: { retract: true, windLamp: true } },
          { action: 'Retracted', set: { isOut: false, isIn: true }, waitMs: 300, expect: { retract: false } },
          { action: 'Wind stops, 8 s later', set: { wind: false }, waitMs: 8000, expect: { extend: false, windLamp: true } },
          { action: '10 s of calm', waitMs: 2500, expect: { windLamp: false, extend: true } },
        ],
      },
      {
        name: 'No sun',
        steps: [
          { action: 'Extended, sun goes away', set: { isIn: false, isOut: true, sun: false }, waitMs: 300, expect: { retract: true } },
        ],
      },
    ],
  },
  {
    slug: 'tanker-loading-permissives-interlock',
    title: 'How to program tank truck loading permissives (earthing, overfill, deadman)',
    description: 'Loading bay interlocks: the pump runs only with earthing proven, no overfill, the arm in position and the deadman button held. PLC logic you can run.',
    answer:
      'Gather all loading permissives into one "ready" signal: earthing proven, overfill probes dry, loading arm in position. Start is only accepted when ready, the pump stops the moment any permissive is lost, and the operator must hold a deadman button while loading.',
    level: 'intermediate',
    explanation: `- **Ready** = earthing OK AND no overfill AND arm in position.
- **Loading** latch: Start sets it only when ready; Stop or loss of readiness resets it, so a lost permissive needs a new Start once fixed.
- **Pump and valve** = loading AND deadman held. Releasing the deadman pauses loading without ending the batch.
- Lamps show each permissive, so the driver can see what is missing.

Static electricity from flowing fuel can ignite vapour; the earthing monitor proves the truck is bonded before and during loading. The overfill system (probes in each compartment) must stop the flow independently of the batch meter.`,
    circuit: `circuit "Truck loading permissives" version 1 {
  earth: INPUT(label="Earthing proven")
  overfill: INPUT(label="Overfill probe wet")
  arm: INPUT(label="Arm in position")
  deadman: INPUT(label="Deadman held")
  start: INPUT(label="Start loading")
  stop: INPUT(label="Stop")
  dry: NOT(label="No overfill")
  ready1: AND(label="Earthed and dry")
  ready: AND(label="Ready to load")
  canStart: AND(label="Start allowed")
  notReady: NOT(label="Permissive lost")
  stopLoading: OR(label="Stop or not ready")
  loading: RS_LATCH(label="Loading")
  pumpLogic: AND(label="Pump")
  pump: OUTPUT(label="Loading pump and valve")
  readyLamp: OUTPUT(label="Ready lamp")
  loadingLamp: OUTPUT(label="Loading active lamp")
  overfill.Q -> dry.A
  earth.Q -> ready1.A
  dry.Q -> ready1.B
  ready1.Q -> ready.A
  arm.Q -> ready.B
  start.Q -> canStart.A
  ready.Q -> canStart.B
  ready.Q -> notReady.A
  stop.Q -> stopLoading.A
  notReady.Q -> stopLoading.B
  canStart.Q -> loading.S
  stopLoading.Q -> loading.R
  loading.Q -> pumpLogic.A
  deadman.Q -> pumpLogic.B
  pumpLogic.Q -> pump.A
  ready.Q -> readyLamp.A
  loading.Q -> loadingLamp.A
}`,
    inputs: [
      { id: 'earth', type: 'INPUT', label: 'Earthing proven', device: 'Earthing (grounding) monitor relay' },
      { id: 'overfill', type: 'INPUT', label: 'Overfill probe wet', device: 'Overfill prevention controller' },
      { id: 'arm', type: 'INPUT', label: 'Arm in position', device: 'Loading arm position switch' },
      { id: 'deadman', type: 'INPUT', label: 'Deadman held', device: 'Hold-to-run push button' },
      { id: 'start', type: 'INPUT', label: 'Start loading', device: 'Push button or batch controller' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
    ],
    outputs: [
      { id: 'pump', type: 'OUTPUT', label: 'Loading pump and valve', device: 'Pump starter and loading valve' },
      { id: 'readyLamp', type: 'OUTPUT', label: 'Ready lamp', device: 'Green lamp at the bay' },
      { id: 'loadingLamp', type: 'OUTPUT', label: 'Loading active lamp', device: 'Lamp' },
    ],
    tryIt: ['Switch Earthing proven and Arm in position ON: the ready lamp lights.', 'Switch Start on and off and hold the deadman: the pump runs.', 'Switch Overfill probe wet ON: loading stops and needs a new Start.'],
    steps: [
      { title: 'Collect permissives', text: 'AND them into one ready signal.' },
      { title: 'Start only when ready', text: 'The loading latch accepts Start only with ready.' },
      { title: 'Stop on any loss', text: 'NOT ready resets the latch.' },
      { title: 'Hold to load', text: 'The pump also needs the deadman.' },
    ],
    mistakes: [
      'Letting loading resume by itself when a permissive returns.',
      'Bypassing the earthing monitor "temporarily".',
      'Relying on the batch meter alone to prevent overfills; overfill probes are an independent layer.',
    ],
    faq: [
      { q: 'Why a deadman button?', a: 'It proves the operator is present and watching. Many sites also require it to be released and pressed again every few minutes.' },
      { q: 'How does the batch quantity fit in?', a: 'Add the flow totaliser pattern: the batch latch also resets when the preset volume is reached.' },
    ],
    blocks: ['RS_LATCH', 'AND', 'OR', 'NOT'],
    challenges: ['guarded-machine', 'two-hand-start'],
    never: [
      { when: { pump: true, earth: false }, message: 'Pumping without earthing' },
      { when: { pump: true, overfill: true }, message: 'Pumping with an overfill alarm' },
    ],
    scenarios: [
      {
        name: 'Loading with permissives',
        steps: [
          { action: 'Start without earthing', set: { arm: true, start: true }, waitMs: 300, expect: { pump: false, readyLamp: false } },
          { action: 'Earthing proven', set: { start: false, earth: true }, waitMs: 200, expect: { readyLamp: true, pump: false } },
          { action: 'Start, deadman held', set: { start: true, deadman: true }, waitMs: 200, expect: { pump: true, loadingLamp: true } },
          { action: 'Deadman released', set: { start: false, deadman: false }, waitMs: 300, expect: { pump: false, loadingLamp: true } },
          { action: 'Deadman again', set: { deadman: true }, waitMs: 300, expect: { pump: true } },
          { action: 'Overfill', set: { overfill: true }, waitMs: 200, expect: { pump: false, loadingLamp: false } },
          { action: 'Overfill clears: no restart', set: { overfill: false }, waitMs: 500, expect: { pump: false } },
          { action: 'Start again', set: { start: true }, waitMs: 200, expect: { pump: true } },
          { action: 'Arm moved', set: { start: false, arm: false }, waitMs: 200, expect: { pump: false } },
          { action: 'Arm back, Start, then Stop', set: { arm: true, start: true }, waitMs: 200, expect: { pump: true } },
          { action: 'Stop', set: { start: false, stop: true }, waitMs: 200, expect: { pump: false, loadingLamp: false } },
        ],
      },
    ],
  },
  {
    slug: 'cip-clean-in-place-sequence',
    title: 'How to program a CIP (clean-in-place) sequence with temperature-checked wash time',
    description: 'CIP sequence: pre-rinse, hot caustic wash timed only while above 70 °C, final rinse. A retentive timer guarantees the full time at temperature.',
    answer:
      'Run the steps in order: water pre-rinse, caustic wash, water final rinse. Time the caustic step with a retentive timer that counts only while the solution is at temperature, so a temperature dip extends the wash instead of shortening the effective cleaning time.',
    level: 'advanced',
    explanation: `| Step | Valve | Heater | Ends when |
|---|---|---|---|
| Pre-rinse | water | off | 3 s |
| Caustic wash | caustic | on below 70 °C, off at 75 °C | 5 s accumulated at ≥ 70 °C |
| Final rinse | water | off | 3 s |

- **Cycle** latch: Start sets it; Stop or the end of the final rinse resets it.
- **Wash time** is a **retentive timer**: its input is "caustic step AND temperature ≥ 70 °C". If the temperature dips, the timer pauses, keeps its elapsed time, and continues when the temperature is back.
- The heater uses a 70–75 °C band during the caustic step.
- The timer is cleared at the end of the cycle.

In food and pharma, the time at temperature is what proves the cleaning, so it is usually recorded for every CIP run.`,
    circuit: `circuit "CIP sequence" version 1 {
  start: INPUT(label="Start CIP")
  stop: INPUT(label="Stop")
  temp: ANALOG_INPUT(label="Return temperature °C", value=20)
  finished: SCAN_DELAY(label="CIP finished")
  endCycle: OR(label="Stop or finished")
  cycle: RS_LATCH(label="CIP running")
  noCycle: NOT(label="No CIP")
  preRinse: TON(label="Pre-rinse time", duration=3000)
  washedPrev: SCAN_DELAY(label="Wash done (last scan)")
  notWashed: NOT(label="Wash not done")
  causticStep: AND(label="Caustic step")
  limit: ANALOG_CONSTANT(label="70 °C", value=70)
  hot: ANALOG_COMPARATOR(label="At or above 70 °C", operation="gte")
  washing: AND(label="Caustic at temperature")
  washTime: RETENTIVE_TON(label="Wash time at temperature", duration=5000)
  finalRinse: TON(label="Final rinse time", duration=3000)
  notRinsed: NOT(label="Final rinse running")
  finalStep: AND(label="Final rinse step")
  notPre: NOT(label="Pre-rinse running")
  preStep: AND(label="Pre-rinse step")
  waterLogic: OR(label="Water")
  band: ANALOG_DIFFERENTIAL(label="Heat: on 70 / off 75 °C", onThreshold=70, offThreshold=75)
  heatLogic: AND(label="Heat")
  water: OUTPUT(label="Water valve")
  caustic: OUTPUT(label="Caustic valve")
  heater: OUTPUT(label="Heater")
  finalRinse.Q -> finished.A
  stop.Q -> endCycle.A
  finished.Q -> endCycle.B
  start.Q -> cycle.S
  endCycle.Q -> cycle.R
  cycle.Q -> noCycle.A
  cycle.Q -> preRinse.A
  washTime.Q -> washedPrev.A
  washedPrev.Q -> notWashed.A
  preRinse.Q -> causticStep.A
  notWashed.Q -> causticStep.B
  temp.Q -> hot.A
  limit.Q -> hot.B
  causticStep.Q -> washing.A
  hot.Q -> washing.B
  washing.Q -> washTime.A
  noCycle.Q -> washTime.R
  washedPrev.Q -> finalRinse.A
  finalRinse.Q -> notRinsed.A
  washedPrev.Q -> finalStep.A
  notRinsed.Q -> finalStep.B
  preRinse.Q -> notPre.A
  cycle.Q -> preStep.A
  notPre.Q -> preStep.B
  preStep.Q -> waterLogic.A
  finalStep.Q -> waterLogic.B
  temp.Q -> band.A
  causticStep.Q -> heatLogic.A
  band.Q -> heatLogic.B
  waterLogic.Q -> water.A
  causticStep.Q -> caustic.A
  heatLogic.Q -> heater.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start CIP', device: 'HMI button' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'temp', type: 'ANALOG_INPUT', label: 'Return temperature °C', device: 'Temperature on the CIP return line' },
    ],
    outputs: [
      { id: 'water', type: 'OUTPUT', label: 'Water valve', device: 'Rinse water valve' },
      { id: 'caustic', type: 'OUTPUT', label: 'Caustic valve', device: 'Caustic supply valve' },
      { id: 'heater', type: 'OUTPUT', label: 'Heater', device: 'Steam valve or heater' },
    ],
    tryIt: ['Press Run, switch Start on and off: pre-rinse with water.', 'In the caustic step, set the temperature to 72 °C; drop it to 65 °C for a while and see the wash take longer.', 'After 5 s at temperature the final rinse runs.'],
    steps: [
      { title: 'Latch the cycle', text: 'Start / Stop / finished.' },
      { title: 'Timed rinses', text: 'On-delay timers for the pre-rinse and final rinse.' },
      { title: 'Wash at temperature', text: 'A retentive timer counts only while hot enough.' },
      { title: 'Keep it hot', text: 'A heater band during the caustic step.' },
    ],
    mistakes: [
      'Timing the caustic step with a plain timer: a cold wash passes as a full wash.',
      'Measuring temperature at the supply instead of the return, which hides heat losses in the circuit.',
      'Not checking flow and conductivity; real CIP also proves the flow velocity and the caustic concentration.',
    ],
    faq: [
      { q: 'What about the acid step?', a: 'Add an acid wash and an intermediate rinse as more steps, with their own valves and the same at-temperature timing.' },
      { q: 'How do I know the rinse is complete?', a: 'Many systems end the final rinse on low conductivity at the return (no caustic left) rather than on time.' },
    ],
    blocks: ['RETENTIVE_TON', 'TON', 'ANALOG_COMPARATOR', 'ANALOG_DIFFERENTIAL', 'RS_LATCH', 'SCAN_DELAY', 'AND', 'OR', 'NOT'],
    challenges: ['star-delta', 'tank-level'],
    never: [{ when: { water: true, caustic: true }, message: 'Water and caustic open together' }],
    scenarios: [
      {
        name: 'CIP with a temperature dip',
        steps: [
          { action: 'Start', set: { temp: 20, start: true }, waitMs: 200, expect: { water: true, caustic: false } },
          { action: 'Pre-rinse 3 s', set: { start: false }, waitMs: 3000, expect: { water: false, caustic: true, heater: true } },
          { action: 'Hot: 72 °C for 3 s', set: { temp: 72 }, waitMs: 3000, expect: { caustic: true, heater: true } },
          { action: '75 °C', set: { temp: 75 }, waitMs: 200, expect: { heater: false } },
          { action: 'Dips to 65 °C for 3 s', set: { temp: 65 }, waitMs: 3000, expect: { caustic: true, heater: true } },
          { action: 'Back to 72 °C: 2 s left', set: { temp: 72 }, waitMs: 1500, expect: { caustic: true } },
          { action: 'Wash complete', waitMs: 600, expect: { caustic: false, water: true, heater: false } },
          { action: 'Final rinse over', waitMs: 3200, expect: { water: false, caustic: false } },
          { action: 'Next CIP runs fully again', set: { temp: 20, start: true }, waitMs: 3300, expect: { caustic: true } },
          { action: 'Hot', set: { start: false, temp: 72 }, waitMs: 4000, expect: { caustic: true } },
        ],
      },
      {
        name: 'Stop',
        steps: [
          { action: 'Start', set: { start: true }, waitMs: 200, expect: { water: true } },
          { action: 'Stop', set: { start: false, stop: true }, waitMs: 200, expect: { water: false, caustic: false, heater: false } },
        ],
      },
    ],
  },
  {
    slug: 'swimming-pool-pump-chlorinator-control',
    title: 'Swimming pool automation: filter pump schedule, chlorinator with flow proving, freeze protection',
    description: 'Run the pool pump on a schedule, allow the chlorinator only with proven flow, and run the pump below 3 °C to prevent freezing. Logic you can run live.',
    answer:
      'Run the filter pump during the scheduled hours, on manual request, or whenever the air is near freezing. Dose chlorine only while the pump runs and a flow switch has proven flow for a few seconds, so chemicals never accumulate in a stagnant pipe.',
    level: 'beginner',
    explanation: `- **Pump** = schedule OR manual OR freeze protection (air ≤ **3 °C**).
- **Flow proven** = on-delay (5 s) on the flow switch.
- **Chlorinator** = pump AND flow proven.

Dosing into a pipe without flow is dangerous: chlorine and acid can accumulate and react when the flow restarts. Interlocking the chlorinator to proven flow (not just to the pump command) catches a closed valve or a lost prime too.`,
    circuit: `circuit "Pool control" version 1 {
  schedule: INPUT(label="Schedule active")
  manual: INPUT(label="Manual run")
  flow: INPUT(label="Flow switch")
  air: ANALOG_INPUT(label="Air temperature °C", value=15)
  frostLimit: ANALOG_CONSTANT(label="3 °C", value=3)
  frost: ANALOG_COMPARATOR(label="At or below 3 °C", operation="lte")
  want1: OR(label="Schedule or manual")
  pumpLogic: OR(label="Run pump")
  proven: TON(label="Flow proven", duration=5000)
  dosing: AND(label="Chlorinate")
  pump: OUTPUT(label="Filter pump")
  chlorinator: OUTPUT(label="Chlorinator")
  air.Q -> frost.A
  frostLimit.Q -> frost.B
  schedule.Q -> want1.A
  manual.Q -> want1.B
  want1.Q -> pumpLogic.A
  frost.Q -> pumpLogic.B
  flow.Q -> proven.A
  pumpLogic.Q -> dosing.A
  proven.Q -> dosing.B
  pumpLogic.Q -> pump.A
  dosing.Q -> chlorinator.A
}`,
    inputs: [
      { id: 'schedule', type: 'INPUT', label: 'Schedule active', device: 'Time switch or PLC schedule' },
      { id: 'manual', type: 'INPUT', label: 'Manual run', device: 'Switch' },
      { id: 'flow', type: 'INPUT', label: 'Flow switch', device: 'Paddle flow switch after the filter' },
      { id: 'air', type: 'ANALOG_INPUT', label: 'Air temperature °C', device: 'Outdoor temperature sensor' },
    ],
    outputs: [
      { id: 'pump', type: 'OUTPUT', label: 'Filter pump', device: 'Pump contactor' },
      { id: 'chlorinator', type: 'OUTPUT', label: 'Chlorinator', device: 'Salt cell or dosing pump' },
    ],
    tryIt: ['Switch Schedule active ON: the pump runs.', 'Switch Flow switch ON: 5 s later the chlorinator starts.', 'Switch the schedule OFF and set the air to 2 °C: freeze protection runs the pump.'],
    steps: [
      { title: 'Combine run requests', text: 'Schedule, manual and frost.' },
      { title: 'Prove flow', text: 'Delay the flow switch a few seconds.' },
      { title: 'Interlock dosing', text: 'Chlorinator only with pump and proven flow.' },
    ],
    mistakes: [
      'Interlocking the chlorinator to the pump command only: a closed valve still doses into a dead leg.',
      'No freeze protection on outdoor equipment in cold climates.',
      'Running the heater without proven flow; the same interlock applies.',
    ],
    faq: [
      { q: 'How long should the pump run per day?', a: 'Long enough to turn over the pool volume one to two times a day, depending on use and temperature.' },
      { q: 'How do I add a heat pump?', a: 'Allow it only with proven flow, like the chlorinator, plus a temperature band on the water.' },
    ],
    blocks: ['TON', 'ANALOG_COMPARATOR', 'AND', 'OR'],
    challenges: ['delayed-fan'],
    never: [{ when: { chlorinator: true, pump: false }, message: 'Chlorinating without the pump' }],
    scenarios: [
      {
        name: 'Daily run',
        steps: [
          { action: 'Schedule on', set: { air: 15, schedule: true }, waitMs: 500, expect: { pump: true, chlorinator: false } },
          { action: 'Flow established, 3 s', set: { flow: true }, waitMs: 3000, expect: { chlorinator: false } },
          { action: 'Flow proven', waitMs: 2500, expect: { chlorinator: true } },
          { action: 'Flow lost (valve closed)', set: { flow: false }, waitMs: 200, expect: { chlorinator: false, pump: true } },
          { action: 'Schedule off', set: { schedule: false }, waitMs: 200, expect: { pump: false } },
          { action: 'Manual run', set: { manual: true }, waitMs: 200, expect: { pump: true } },
        ],
      },
      {
        name: 'Freeze protection',
        steps: [
          { action: '2 °C, no schedule', set: { air: 2 }, waitMs: 300, expect: { pump: true } },
          { action: '5 °C', set: { air: 5 }, waitMs: 300, expect: { pump: false } },
        ],
      },
    ],
  },
  {
    slug: 'pump-dry-run-protection-auto-retry',
    title: 'Pump dry-run protection with automatic retry and lockout',
    description: 'Stop a pump that runs without flow, wait, retry automatically up to three times, then lock out until reset. Borewell and booster pump logic, live.',
    answer:
      'If the pump runs for a few seconds without flow, stop it and wait before trying again, because the water level may recover. Count the failed attempts; after three in a row, lock the pump out until someone resets it. A successful run with flow clears the count.',
    level: 'advanced',
    explanation: `- **Dry run** = pump running (last scan) AND no flow for **3 s**.
- A dry run starts a **rest** period of **10 s** (minutes in practice) during which the pump is off.
- A **counter** counts dry runs. At **3**, the pump is locked out.
- Running with flow for **5 s** resets the counter, and so does the Reset button.
- **Pump** = demand AND NOT resting AND NOT locked out.

Borewell (well) pumps lose suction when the water table drops; resting lets the well recover. Without a limit on retries, a pump with a broken shaft or a dry well would restart for ever.`,
    circuit: `circuit "Dry-run protection" version 1 {
  demand: INPUT(label="Pump demand")
  flow: INPUT(label="Flow detected")
  reset: INPUT(label="Reset")
  pumpPrev: SCAN_DELAY(label="Pump (last scan)")
  noFlow: NOT(label="No flow")
  dryRunning: AND(label="Running without flow")
  dry: TON(label="Dry-run time", duration=3000)
  restingPrev: SCAN_DELAY(label="Resting (last scan)")
  restTime: TON(label="Rest time", duration=10000)
  resting: RS_LATCH(label="Resting")
  goodRun: AND(label="Running with flow")
  healthy: TON(label="Good run time", duration=5000)
  clearCount: OR(label="Clear failures")
  failures: COUNTER(label="Dry-run failures", limit=3)
  notResting: NOT(label="Not resting")
  notLocked: NOT(label="Not locked out")
  allowed: AND(label="Allowed")
  pumpLogic: AND(label="Run pump")
  pump: OUTPUT(label="Pump")
  restLamp: OUTPUT(label="Resting lamp")
  lockLamp: OUTPUT(label="Lockout lamp")
  pumpLogic.Q -> pumpPrev.A
  flow.Q -> noFlow.A
  pumpPrev.Q -> dryRunning.A
  noFlow.Q -> dryRunning.B
  dryRunning.Q -> dry.A
  dry.Q -> resting.S
  restTime.Q -> resting.R
  resting.Q -> restingPrev.A
  restingPrev.Q -> restTime.A
  pumpPrev.Q -> goodRun.A
  flow.Q -> goodRun.B
  goodRun.Q -> healthy.A
  reset.Q -> clearCount.A
  healthy.Q -> clearCount.B
  dry.Q -> failures.CU
  clearCount.Q -> failures.R
  resting.Q -> notResting.A
  failures.Q -> notLocked.A
  notResting.Q -> allowed.A
  notLocked.Q -> allowed.B
  demand.Q -> pumpLogic.A
  allowed.Q -> pumpLogic.B
  pumpLogic.Q -> pump.A
  resting.Q -> restLamp.A
  failures.Q -> lockLamp.A
}`,
    inputs: [
      { id: 'demand', type: 'INPUT', label: 'Pump demand', device: 'Tank level control or pressure switch' },
      { id: 'flow', type: 'INPUT', label: 'Flow detected', device: 'Flow switch, or a current relay sensing underload' },
      { id: 'reset', type: 'INPUT', label: 'Reset', device: 'Reset push button' },
    ],
    outputs: [
      { id: 'pump', type: 'OUTPUT', label: 'Pump', device: 'Pump starter' },
      { id: 'restLamp', type: 'OUTPUT', label: 'Resting lamp', device: 'Indicator' },
      { id: 'lockLamp', type: 'OUTPUT', label: 'Lockout lamp', device: 'Alarm lamp' },
    ],
    tryIt: ['Switch Pump demand ON without flow: after 3 s the pump rests for 10 s, then retries.', 'After three failures it locks out.', 'Pulse Reset and switch Flow detected ON: it runs normally.'],
    steps: [
      { title: 'Detect dry running', text: 'Running without flow for a few seconds.' },
      { title: 'Rest', text: 'Stop for a while to let the source recover.' },
      { title: 'Count failures', text: 'Lock out after a few in a row.' },
      { title: 'Clear on success', text: 'A good run with flow resets the count.' },
    ],
    mistakes: [
      'Unlimited automatic retries on a pump that has lost its prime or broken its shaft.',
      'A dry-run time shorter than the time the pump needs to build flow after starting.',
      'Detecting flow with the pump command instead of a real sensor.',
    ],
    faq: [
      { q: 'Can I detect dry running without a flow switch?', a: 'Yes: a pump running dry draws noticeably less current. Underload (power) monitoring relays or the drive\'s underload function are common for borewell pumps.' },
      { q: 'How long should the rest be?', a: 'Long enough for the well to recover: often 15–60 minutes. Some controllers increase the rest after each failure.' },
    ],
    blocks: ['TON', 'RS_LATCH', 'COUNTER', 'SCAN_DELAY', 'AND', 'OR', 'NOT'],
    challenges: ['batch-counter', 'delayed-fan'],
    scenarios: [
      {
        name: 'Three dry runs and lockout',
        steps: [
          { action: 'Demand, no flow', set: { demand: true }, waitMs: 2500, expect: { pump: true, restLamp: false } },
          { action: 'Dry run 1', waitMs: 1000, expect: { pump: false, restLamp: true } },
          { action: 'Resting', waitMs: 9000, expect: { pump: false } },
          { action: 'Retry', waitMs: 1500, expect: { pump: true, restLamp: false } },
          { action: 'Dry run 2', waitMs: 2500, expect: { pump: false, restLamp: true } },
          { action: 'Rest and retry', waitMs: 10500, expect: { pump: true } },
          { action: 'Dry run 3: lockout', waitMs: 2500, expect: { pump: false, lockLamp: true } },
          { action: 'Stays locked out', waitMs: 15000, expect: { pump: false, lockLamp: true }, during: [{ id: 'pump', onShare: [0, 0] }] },
          { action: 'Reset with water back', set: { reset: true, flow: true }, waitMs: 200, expect: { lockLamp: false } },
          { action: 'Runs normally', set: { reset: false }, waitMs: 10000, expect: { pump: true, restLamp: false } },
        ],
      },
      {
        name: 'A good run clears the count',
        steps: [
          { action: 'Demand, no flow', set: { demand: true }, waitMs: 3500, expect: { restLamp: true } },
          { action: 'Rest, then retry', waitMs: 10500, expect: { pump: true } },
          { action: 'Flow this time, 6 s', set: { flow: true }, waitMs: 6000, expect: { pump: true } },
          { action: 'Flow lost: dry run', set: { flow: false }, waitMs: 3500, expect: { restLamp: true, lockLamp: false } },
          { action: 'Rest, retry, dry again', waitMs: 13500, expect: { restLamp: true, lockLamp: false } },
        ],
      },
    ],
  },
  {
    slug: 'zero-pressure-accumulation-conveyor-zones',
    title: 'Zero-pressure accumulation conveyor logic (ZPA zones)',
    description: 'Each conveyor zone stops when it holds a product and the zone ahead is full and stopped, so products queue without touching. 3-zone ZPA logic, live.',
    answer:
      'Divide the conveyor into zones with a sensor at the end of each. A zone stops only when its own sensor sees a product and the next zone is also occupied and stopped; otherwise it runs. Products then queue up one per zone with gaps between them, so they never push against each other.',
    level: 'intermediate',
    explanation: `For three zones feeding a discharge point:

- **Zone 3 stops** = product at the end of zone 3 AND discharge not ready.
- **Zone 2 stops** = product at the end of zone 2 AND zone 3 stopped.
- **Zone 1 stops** = product at the end of zone 1 AND zone 2 stopped.
- Every zone motor = line running AND NOT zone stopped.

When the discharge accepts again, zone 3 starts, which releases zone 2, which releases zone 1: the queue moves off in a wave (singulation). Because zones only stop when the zone ahead is full, empty zones keep running to close up the queue.

"Zero pressure" means no line pressure between products, unlike a roller conveyor where products are pushed into each other.`,
    circuit: `circuit "ZPA conveyor" version 1 {
  run: INPUT(label="Line running", value=true)
  z1: INPUT(label="Zone 1 occupied")
  z2: INPUT(label="Zone 2 occupied")
  z3: INPUT(label="Zone 3 occupied")
  discharge: INPUT(label="Discharge ready", value=true)
  blocked: NOT(label="Discharge not ready")
  stop3: AND(label="Zone 3 stops")
  stop2: AND(label="Zone 2 stops")
  stop1: AND(label="Zone 1 stops")
  go3: NOT(label="Zone 3 may run")
  go2: NOT(label="Zone 2 may run")
  go1: NOT(label="Zone 1 may run")
  m3: AND(label="Zone 3 motor")
  m2: AND(label="Zone 2 motor")
  m1: AND(label="Zone 1 motor")
  motor1: OUTPUT(label="Zone 1 motor")
  motor2: OUTPUT(label="Zone 2 motor")
  motor3: OUTPUT(label="Zone 3 motor")
  discharge.Q -> blocked.A
  z3.Q -> stop3.A
  blocked.Q -> stop3.B
  z2.Q -> stop2.A
  stop3.Q -> stop2.B
  z1.Q -> stop1.A
  stop2.Q -> stop1.B
  stop3.Q -> go3.A
  stop2.Q -> go2.A
  stop1.Q -> go1.A
  run.Q -> m3.A
  go3.Q -> m3.B
  run.Q -> m2.A
  go2.Q -> m2.B
  run.Q -> m1.A
  go1.Q -> m1.B
  m1.Q -> motor1.A
  m2.Q -> motor2.A
  m3.Q -> motor3.A
}`,
    inputs: [
      { id: 'run', type: 'INPUT', label: 'Line running', device: 'Line start/stop' },
      { id: 'z1', type: 'INPUT', label: 'Zone 1 occupied', device: 'Photo-eye at the end of zone 1' },
      { id: 'z2', type: 'INPUT', label: 'Zone 2 occupied', device: 'Photo-eye at the end of zone 2' },
      { id: 'z3', type: 'INPUT', label: 'Zone 3 occupied', device: 'Photo-eye at the end of zone 3' },
      { id: 'discharge', type: 'INPUT', label: 'Discharge ready', device: 'Downstream machine ready signal' },
    ],
    outputs: [
      { id: 'motor1', type: 'OUTPUT', label: 'Zone 1 motor', device: 'Motor-driven roller (24 V)' },
      { id: 'motor2', type: 'OUTPUT', label: 'Zone 2 motor', device: 'Motor-driven roller' },
      { id: 'motor3', type: 'OUTPUT', label: 'Zone 3 motor', device: 'Motor-driven roller' },
    ],
    tryIt: ['Switch Discharge ready OFF and Zone 3 occupied ON: zone 3 stops.', 'Switch Zone 2 occupied ON: zone 2 stops too. Zone 1 keeps running until it is occupied.', 'Switch Discharge ready ON: the queue releases.'],
    steps: [
      { title: 'One sensor per zone', text: 'At the end of the zone.' },
      { title: 'Chain the stop conditions', text: 'Each zone stops only if occupied and the next zone is stopped.' },
      { title: 'Release in a wave', text: 'Starting the front zone releases the others one by one.' },
    ],
    mistakes: [
      'Stopping a zone whenever the next zone is occupied, even if it is moving: the line stutters.',
      'Sensors placed at the start of the zone instead of the end, so products stop half on the next zone.',
      'Zones shorter than the longest product.',
    ],
    faq: [
      { q: 'What is singulation mode?', a: 'Releasing the queue one product at a time with a gap, by letting a zone start only when the zone ahead is empty. Train mode releases the whole queue together.' },
      { q: 'Do I need a PLC for ZPA?', a: 'Motor-driven roller systems often have this logic built into the zone cards; a PLC is used for the overall line control and interfaces.' },
    ],
    blocks: ['AND', 'NOT'],
    challenges: ['batch-counter'],
    scenarios: [
      {
        name: 'Accumulate and release',
        steps: [
          { action: 'Empty line', set: { run: true, discharge: true }, waitMs: 200, expect: { motor1: true, motor2: true, motor3: true } },
          { action: 'Product reaches zone 3, discharge busy', set: { z3: true, discharge: false }, waitMs: 200, expect: { motor3: false, motor2: true, motor1: true } },
          { action: 'Zone 2 fills', set: { z2: true }, waitMs: 200, expect: { motor2: false, motor1: true } },
          { action: 'Zone 1 fills', set: { z1: true }, waitMs: 200, expect: { motor1: false } },
          { action: 'Discharge ready', set: { discharge: true }, waitMs: 200, expect: { motor3: true, motor2: true, motor1: true } },
          { action: 'Product in zone 2 only, discharge busy', set: { z1: false, z3: false, discharge: false }, waitMs: 200, expect: { motor2: true, motor3: true } },
          { action: 'Line stopped', set: { run: false }, waitMs: 200, expect: { motor1: false, motor2: false, motor3: false } },
        ],
      },
    ],
  },
  {
    slug: 'crane-hoist-up-down-limits-overload',
    title: 'How to program a crane hoist: up/down with limits, overload and brake',
    description: 'Hold-to-run hoist control with upper and lower limits, an overload that blocks lifting but allows lowering, interlocked directions and brake release.',
    answer:
      'Run the hoist only while a direction button is held, stop it at the upper and lower limits, and never energise both directions. An overload blocks lifting but still allows lowering, so a too-heavy load can be put down. The brake is released only while the motor is driven.',
    level: 'beginner',
    explanation: `- **Up** = up button AND NOT down button AND NOT upper limit AND NOT overload.
- **Down** = down button AND NOT up button AND NOT lower limit.
- **Brake release** = up OR down. The brake is spring-applied, so it holds the load whenever the motor is not driven, including on a power failure.

Pressing both buttons does nothing. Overload protection that also blocked lowering would leave a heavy load hanging in the air.`,
    circuit: `circuit "Crane hoist" version 1 {
  upBtn: INPUT(label="Up button")
  downBtn: INPUT(label="Down button")
  upper: INPUT(label="Upper limit")
  lower: INPUT(label="Lower limit")
  overload: INPUT(label="Overload (load cell)")
  notDownBtn: NOT(label="Down not pressed")
  notUpBtn: NOT(label="Up not pressed")
  notUpper: NOT(label="Below upper limit")
  notLower: NOT(label="Above lower limit")
  notOverload: NOT(label="Load OK")
  up1: AND(label="Up requested")
  up2: AND(label="Up within limits")
  upLogic: AND(label="Up")
  down1: AND(label="Down requested")
  downLogic: AND(label="Down")
  brakeLogic: OR(label="Release brake")
  hoistUp: OUTPUT(label="Hoist up")
  hoistDown: OUTPUT(label="Hoist down")
  brake: OUTPUT(label="Brake release")
  downBtn.Q -> notDownBtn.A
  upBtn.Q -> notUpBtn.A
  upper.Q -> notUpper.A
  lower.Q -> notLower.A
  overload.Q -> notOverload.A
  upBtn.Q -> up1.A
  notDownBtn.Q -> up1.B
  up1.Q -> up2.A
  notUpper.Q -> up2.B
  up2.Q -> upLogic.A
  notOverload.Q -> upLogic.B
  downBtn.Q -> down1.A
  notUpBtn.Q -> down1.B
  down1.Q -> downLogic.A
  notLower.Q -> downLogic.B
  upLogic.Q -> brakeLogic.A
  downLogic.Q -> brakeLogic.B
  upLogic.Q -> hoistUp.A
  downLogic.Q -> hoistDown.A
  brakeLogic.Q -> brake.A
}`,
    inputs: [
      { id: 'upBtn', type: 'INPUT', label: 'Up button', device: 'Pendant push button (hold to run)' },
      { id: 'downBtn', type: 'INPUT', label: 'Down button', device: 'Pendant push button (hold to run)' },
      { id: 'upper', type: 'INPUT', label: 'Upper limit', device: 'Hoist upper limit switch' },
      { id: 'lower', type: 'INPUT', label: 'Lower limit', device: 'Hoist lower limit switch' },
      { id: 'overload', type: 'INPUT', label: 'Overload (load cell)', device: 'Load limiter output' },
    ],
    outputs: [
      { id: 'hoistUp', type: 'OUTPUT', label: 'Hoist up', device: 'Up contactor' },
      { id: 'hoistDown', type: 'OUTPUT', label: 'Hoist down', device: 'Down contactor' },
      { id: 'brake', type: 'OUTPUT', label: 'Brake release', device: 'Brake coil' },
    ],
    tryIt: ['Hold Up: the hoist lifts and the brake releases.', 'Switch Upper limit ON: it stops.', 'Switch Overload ON: Up is blocked but Down still works.'],
    steps: [
      { title: 'Hold to run', text: 'Each direction only while its button is held.' },
      { title: 'Interlock', text: 'Each direction requires the other button released.' },
      { title: 'Limits', text: 'Each direction stops at its own limit.' },
      { title: 'Overload', text: 'Blocks lifting only.' },
      { title: 'Brake', text: 'Released only while moving.' },
    ],
    mistakes: [
      'Blocking lowering on overload, which leaves the load hanging.',
      'Releasing the brake before the motor has torque (on inverter-driven hoists the drive controls the brake timing).',
      'Relying on the operational limit only; hoists also need a final (ultimate) limit that cuts power directly.',
    ],
    faq: [
      { q: 'Why hold-to-run instead of latching?', a: 'The operator must be in control of a suspended load at every moment; releasing the button stops it.' },
      { q: 'How do I add two speeds?', a: 'Use two-step pendant buttons: the first step gives slow speed, the second fast, with the same limits and interlocks; slow down near the limits with pre-limit switches.' },
    ],
    blocks: ['AND', 'OR', 'NOT'],
    challenges: ['guarded-machine', 'two-hand-start'],
    never: [
      { when: { hoistUp: true, hoistDown: true }, message: 'Up and down together' },
      { when: { hoistUp: true, brake: false }, message: 'Driving up with the brake applied' },
    ],
    scenarios: [
      {
        name: 'Lifting and lowering',
        steps: [
          { action: 'Idle', waitMs: 200, expect: { hoistUp: false, hoistDown: false, brake: false } },
          { action: 'Hold Up', set: { upBtn: true }, waitMs: 300, expect: { hoistUp: true, brake: true } },
          { action: 'Upper limit', set: { upper: true }, waitMs: 200, expect: { hoistUp: false, brake: false } },
          { action: 'Release Up, hold Down', set: { upBtn: false, downBtn: true }, waitMs: 300, expect: { hoistDown: true, brake: true } },
          { action: 'Both buttons', set: { upBtn: true, upper: false }, waitMs: 200, expect: { hoistUp: false, hoistDown: false } },
          { action: 'Only Down, reach lower limit', set: { upBtn: false, lower: true }, waitMs: 200, expect: { hoistDown: false } },
        ],
      },
      {
        name: 'Overload',
        steps: [
          { action: 'Overload, hold Up', set: { overload: true, upBtn: true }, waitMs: 300, expect: { hoistUp: false } },
          { action: 'Hold Down instead', set: { upBtn: false, downBtn: true }, waitMs: 300, expect: { hoistDown: true } },
        ],
      },
    ],
  },
];
