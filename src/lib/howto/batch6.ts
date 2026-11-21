import type { HowTo } from './types.ts';

/** Sixth batch of how-to guides. Verified by tests/howto.test.ts. */
export const HOW_TOS_BATCH_6: HowTo[] = [
  {
    slug: 'shift-register-reject-conveyor',
    title: 'How to track rejects on a conveyor with a shift register (PLC)',
    description: 'Inspect products at one point and reject the bad ones at a station further down the line: a shift register clocked by each product. Live example.',
    answer:
      'Shift the inspection result into a shift register every time a product passes the inspection point. When the bit reaches the position of the reject station, fire the pusher. The register remembers which products are bad while they travel.',
    level: 'advanced',
    explanation: `A camera or sensor decides **good or bad** at the inspection point, but the reject pusher is a few products further down the line. Between the two, several products are on the belt at once, so a single "bad" bit is not enough.

- **Clock**: the product sensor at the inspection point. Each product is one shift.
- **Data**: the inspection result (ON = bad), valid when the product arrives.
- **Shift register** (length 4): with each product, all bits move one place toward the output. The reject station is 3 products downstream, so the bit of a product comes out of the register (Q) exactly when that product is in front of the pusher.
- **Pusher** = a pulse timer started by "product arrives AND Q".

This assumes products are evenly spaced, which an indexing conveyor or pockets guarantee. On a free-running belt, clock the register from an **encoder** (one shift per belt pitch) instead of from the products.`,
    circuit: `circuit "Shift register reject" version 1 {
  product: INPUT(label="Product at camera")
  bad: INPUT(label="Inspection: bad")
  clear: INPUT(label="Clear tracking")
  tracking: SHIFT_REGISTER(label="Product tracking", length=4)
  fire: AND(label="Bad product at pusher")
  push: PULSE_TIMER(label="Push time", duration=300)
  pusher: OUTPUT(label="Reject pusher")
  bad.Q -> tracking.D
  product.Q -> tracking.CLK
  clear.Q -> tracking.R
  product.Q -> fire.A
  tracking.Q -> fire.B
  fire.Q -> push.A
  push.Q -> pusher.A
}`,
    inputs: [
      { id: 'product', type: 'INPUT', label: 'Product at camera', device: 'Photo-eye at the inspection point' },
      { id: 'bad', type: 'INPUT', label: 'Inspection: bad', device: 'Vision system or check-weigher result' },
      { id: 'clear', type: 'INPUT', label: 'Clear tracking', device: 'Reset when the line is emptied' },
    ],
    outputs: [{ id: 'pusher', type: 'OUTPUT', label: 'Reject pusher', device: 'Pusher or air-jet solenoid' }],
    tryIt: ['Switch "Function blocks" view.', 'Set Inspection: bad ON and pulse Product once (a bad product), then set it OFF.', 'Pulse Product three more times: on the fourth product the pusher fires.'],
    steps: [
      { title: 'Measure the distance', text: 'Count how many products fit between the camera and the pusher.' },
      { title: 'Size the register', text: 'Length = that distance + 1.' },
      { title: 'Feed it', text: 'Clock = product sensor, data = inspection result.' },
      { title: 'Fire at the output', text: 'Product arriving AND register output starts the pusher pulse.' },
    ],
    mistakes: [
      'Clocking from products on a belt where they are not evenly spaced: the tracking drifts. Use an encoder.',
      'Reading the inspection result before it is valid; many vision systems need a few milliseconds after the trigger.',
      'Not clearing the register after a line purge, so the pusher fires at good products.',
    ],
    faq: [
      { q: 'What if the reject is 50 products away?', a: 'Use a longer register (most PLCs have bit-shift instructions such as BSL/BSR or SHL on words), or a FIFO of product IDs and results.' },
      { q: 'How do I confirm the reject worked?', a: 'Add a sensor after the pusher that must see the bad product leave the line; if a bad product passes it, stop the line.' },
    ],
    blocks: ['SHIFT_REGISTER', 'PULSE_TIMER', 'AND'],
    challenges: ['batch-counter'],
    scenarios: [
      {
        name: 'Bad product reaches the pusher',
        steps: [
          { action: 'Product 1 (bad)', set: { bad: true, product: true }, waitMs: 200, expect: { pusher: false } },
          { action: 'Gap', set: { product: false, bad: false }, waitMs: 400 },
          { action: 'Product 2 (good)', set: { product: true }, waitMs: 200, expect: { pusher: false } },
          { action: 'Gap', set: { product: false }, waitMs: 400 },
          { action: 'Product 3 (good)', set: { product: true }, waitMs: 200, expect: { pusher: false } },
          { action: 'Gap', set: { product: false }, waitMs: 400 },
          { action: 'Product 4: product 1 is at the pusher', set: { product: true }, waitMs: 200, expect: { pusher: true } },
          { action: 'Gap', set: { product: false }, waitMs: 400, expect: { pusher: false } },
          { action: 'Product 5', set: { product: true }, waitMs: 200, expect: { pusher: false } },
        ],
      },
      {
        name: 'Clear',
        steps: [
          { action: 'Bad product', set: { bad: true, product: true }, waitMs: 200 },
          { action: 'Gap; line purged', set: { product: false, bad: false, clear: true }, waitMs: 300 },
          { action: 'Product', set: { clear: false, product: true }, waitMs: 200 },
          { action: 'Gap', set: { product: false }, waitMs: 300 },
          { action: 'Product', set: { product: true }, waitMs: 200 },
          { action: 'Gap', set: { product: false }, waitMs: 300 },
          { action: 'Product: the purged bad one would be here', set: { product: true }, waitMs: 200, expect: { pusher: false } },
        ],
      },
    ],
  },
  {
    slug: 'fire-pump-jockey-pump-control',
    title: 'How fire pump and jockey pump controls work (PLC logic example)',
    description: 'Jockey pump keeps sprinkler pressure between 7 and 8 bar; the main fire pump starts at 6 bar, latches on and only stops manually. Logic explained live.',
    answer:
      'A small jockey pump makes up for leaks by keeping the pressure in a narrow band. If a sprinkler opens, the pressure falls below the jockey band and the main fire pump starts automatically. Once started, the main pump keeps running until someone stops it by hand.',
    level: 'intermediate',
    explanation: `**Note:** real fire pump controllers are listed products built to standards such as NFPA 20 or EN 12845. This example explains their logic; it is not a design for a fire protection system.

- **Jockey pump**: hysteresis switch, on at **7 bar** or below, off at **8 bar** or above. It does not run while the main pump runs.
- **Main fire pump**: a comparator at **6 bar** sets a latch. Nothing resets it automatically: during a fire, a pump that stops on a pressure peak could leave the sprinklers without water. Only the **manual stop** resets it (and if the pressure is still low, it starts again).
- **Pump running alarm** reports the main pump to the fire alarm panel.`,
    circuit: `circuit "Fire pump controls" version 1 {
  pressure: ANALOG_INPUT(label="System pressure (bar)", value=7.5)
  stop: INPUT(label="Main pump manual stop")
  jockeyBand: ANALOG_DIFFERENTIAL(label="Jockey: on 7 / off 8 bar", onThreshold=7, offThreshold=8)
  startLevel: ANALOG_CONSTANT(label="Main start 6 bar", value=6)
  lowPressure: ANALOG_COMPARATOR(label="At or below 6 bar", operation="lte")
  main: RS_LATCH(label="Main pump demand")
  mainOff: NOT(label="Main pump off")
  jockeyLogic: AND(label="Jockey")
  jockey: OUTPUT(label="Jockey pump")
  mainPump: OUTPUT(label="Main fire pump")
  runningAlarm: OUTPUT(label="Fire pump running alarm")
  pressure.Q -> jockeyBand.A
  pressure.Q -> lowPressure.A
  startLevel.Q -> lowPressure.B
  lowPressure.Q -> main.S
  stop.Q -> main.R
  main.Q -> mainOff.A
  jockeyBand.Q -> jockeyLogic.A
  mainOff.Q -> jockeyLogic.B
  jockeyLogic.Q -> jockey.A
  main.Q -> mainPump.A
  main.Q -> runningAlarm.A
}`,
    inputs: [
      { id: 'pressure', type: 'ANALOG_INPUT', label: 'System pressure (bar)', device: 'Pressure transmitter on the sprinkler main' },
      { id: 'stop', type: 'INPUT', label: 'Main pump manual stop', device: 'Stop push button on the fire pump controller' },
    ],
    outputs: [
      { id: 'jockey', type: 'OUTPUT', label: 'Jockey pump', device: 'Jockey pump contactor' },
      { id: 'mainPump', type: 'OUTPUT', label: 'Main fire pump', device: 'Fire pump controller start' },
      { id: 'runningAlarm', type: 'OUTPUT', label: 'Fire pump running alarm', device: 'Signal to the fire alarm panel' },
    ],
    tryIt: ['Press Run, set 6.8 bar: the jockey pump runs until 8 bar.', 'Set 5.5 bar (a sprinkler opened): the main pump starts.', 'Raise to 9 bar: it keeps running. Use the manual stop.'],
    steps: [
      { title: 'Jockey band', text: 'Hysteresis switch just below the normal pressure.' },
      { title: 'Main pump start', text: 'Comparator below the jockey band sets a latch.' },
      { title: 'Manual stop only', text: 'No automatic reset of the main pump latch.' },
      { title: 'Report', text: 'Running signal to the fire panel.' },
    ],
    mistakes: [
      'Stopping the main fire pump automatically when the pressure recovers.',
      'Setting the jockey band so low that the main pump starts on small leaks.',
      'Protecting a fire pump motor with an overload that trips it during a fire; fire pump controllers deliberately allow the motor to run to destruction.',
    ],
    faq: [
      { q: 'Why does the jockey pump stop when the main pump runs?', a: 'It cannot add anything useful and only uses power; some designs keep it running, which is also acceptable.' },
      { q: 'What about diesel fire pumps?', a: 'They follow the same start logic, with added battery, engine and fuel supervision, and a weekly automatic test run.' },
    ],
    blocks: ['ANALOG_DIFFERENTIAL', 'ANALOG_COMPARATOR', 'RS_LATCH', 'AND', 'NOT'],
    challenges: ['tank-level', 'start-stop'],
    never: [{ when: { jockey: true, mainPump: true }, message: 'Jockey and main pump ran together' }],
    scenarios: [
      {
        name: 'Leakage and a fire',
        steps: [
          { action: 'Normal 7.5 bar', set: { pressure: 7.5 }, waitMs: 200, expect: { jockey: false, mainPump: false } },
          { action: 'Leak: 6.8 bar', set: { pressure: 6.8 }, waitMs: 200, expect: { jockey: true } },
          { action: '7.5 bar', set: { pressure: 7.5 }, waitMs: 200, expect: { jockey: true } },
          { action: '8 bar', set: { pressure: 8 }, waitMs: 200, expect: { jockey: false } },
          { action: 'Sprinkler opens: 5.5 bar', set: { pressure: 5.5 }, waitMs: 200, expect: { mainPump: true, runningAlarm: true, jockey: false } },
          { action: 'Pressure peaks at 9 bar', set: { pressure: 9 }, waitMs: 1000, expect: { mainPump: true } },
          { action: 'Manual stop', set: { stop: true }, waitMs: 200, expect: { mainPump: false, runningAlarm: false } },
          { action: 'Release stop at 7.5 bar', set: { stop: false, pressure: 7.5 }, waitMs: 500, expect: { mainPump: false } },
        ],
      },
    ],
  },
  {
    slug: 'solar-water-heater-differential-controller',
    title: 'How to control a solar water heater pump (differential temperature controller)',
    description: 'Run the solar circulation pump when the collector is 8 °C hotter than the tank, stop at 3 °C, and protect the tank from overheating. PLC/Arduino logic.',
    answer:
      'Compare the collector temperature with the tank temperature: start the pump when the collector is about 8 °C hotter, stop it when the difference falls to about 3 °C. Stop it as well when the tank reaches its maximum temperature.',
    level: 'beginner',
    explanation: `A **differential temperature controller** only moves heat when there is heat to gain.

- **Difference** = collector − tank (a math block).
- **Hysteresis switch** on the difference: on at **8 °C** or more, off at **3 °C** or less (high trigger). Without the band, the pump would start, cool the collector a little and stop again every few seconds.
- **Tank limit**: at **80 °C** or above the pump stops, so the tank does not overheat.

At night the collector is colder than the tank, the difference is negative and the pump stays off, so the tank is not cooled down through the roof.`,
    circuit: `circuit "Solar differential controller" version 1 {
  collector: ANALOG_INPUT(label="Collector °C", value=30)
  tank: ANALOG_INPUT(label="Tank °C", value=40)
  diff: MATH_EXPRESSION(label="Collector minus tank", expr="A - B")
  band: ANALOG_DIFFERENTIAL(label="On +8 / off +3 °C", onThreshold=8, offThreshold=3)
  limit: ANALOG_CONSTANT(label="Tank maximum 80 °C", value=80)
  tooHot: ANALOG_COMPARATOR(label="Tank at or above 80 °C", operation="gte")
  allowed: NOT(label="Tank below maximum")
  pumpLogic: AND(label="Run pump")
  pump: OUTPUT(label="Solar pump")
  difference: ANALOG_OUTPUT(label="Temperature difference")
  collector.Q -> diff.A
  tank.Q -> diff.B
  diff.Q -> band.A
  tank.Q -> tooHot.A
  limit.Q -> tooHot.B
  tooHot.Q -> allowed.A
  band.Q -> pumpLogic.A
  allowed.Q -> pumpLogic.B
  pumpLogic.Q -> pump.A
  diff.Q -> difference.A
}`,
    inputs: [
      { id: 'collector', type: 'ANALOG_INPUT', label: 'Collector °C', device: 'PT1000 sensor in the collector' },
      { id: 'tank', type: 'ANALOG_INPUT', label: 'Tank °C', device: 'Sensor in the lower part of the tank' },
    ],
    outputs: [
      { id: 'pump', type: 'OUTPUT', label: 'Solar pump', device: 'Circulation pump relay' },
      { id: 'difference', type: 'ANALOG_OUTPUT', label: 'Temperature difference', device: 'Display value' },
    ],
    tryIt: ['Press Run. Set the collector to 50 °C and the tank to 40 °C: the pump runs.', 'Lower the collector to 44 °C: it keeps running. At 43 °C it stops.', 'Set the tank to 80 °C with a hot collector: the pump stops.'],
    steps: [
      { title: 'Compute the difference', text: 'Collector − tank with a math block.' },
      { title: 'Add hysteresis', text: 'On at +8 °C, off at +3 °C.' },
      { title: 'Limit the tank', text: 'Stop at the maximum tank temperature.' },
    ],
    mistakes: [
      'Placing the tank sensor at the top of the tank, where it reads the hottest water: the pump stops too early.',
      'A band that is too narrow, so the pump cycles constantly in weak sunshine.',
      'No overheat strategy for the collector itself when the tank is full of hot water (stagnation).',
    ],
    faq: [
      { q: 'Can I build this on an Arduino?', a: 'Yes: read two temperature sensors (for example DS18B20 or PT1000 with an amplifier) and use the generated sketch on this page as the control logic.' },
      { q: 'What about frost protection?', a: 'In climates with frost, either use antifreeze in the collector loop or add a rule that runs the pump briefly when the collector approaches 0 °C.' },
    ],
    blocks: ['MATH_EXPRESSION', 'ANALOG_DIFFERENTIAL', 'ANALOG_COMPARATOR', 'AND', 'NOT'],
    challenges: ['tank-level', 'sensor-scaling'],
    scenarios: [
      {
        name: 'Sunny day',
        steps: [
          { action: 'Morning: collector 30, tank 40', set: { collector: 30, tank: 40 }, waitMs: 200, expect: { pump: false, difference: -10 } },
          { action: 'Collector 50 °C', set: { collector: 50 }, waitMs: 200, expect: { pump: true, difference: 10 } },
          { action: 'Collector 44 °C', set: { collector: 44 }, waitMs: 200, expect: { pump: true } },
          { action: 'Collector 43 °C', set: { collector: 43 }, waitMs: 200, expect: { pump: false } },
          { action: 'Collector 46 °C', set: { collector: 46 }, waitMs: 200, expect: { pump: false } },
        ],
      },
      {
        name: 'Tank full',
        steps: [
          { action: 'Hot collector, tank 79 °C', set: { collector: 100, tank: 79 }, waitMs: 200, expect: { pump: true } },
          { action: 'Tank 80 °C', set: { tank: 80 }, waitMs: 200, expect: { pump: false } },
        ],
      },
    ],
  },
  {
    slug: 'rotary-indexing-table-plc',
    title: 'PLC program for a rotary indexing table (one station per start)',
    description: 'Index a rotary table one station per start: the motor runs from the index sensor until the next one, using an edge so it does not stop at once.',
    answer:
      'Start the motor only when the table is at a station, then stop it on the rising edge of the index sensor, which happens when the next station arrives. Using the edge, not the sensor level, is what stops the table from halting immediately at the station it is leaving.',
    level: 'beginner',
    explanation: `A cam or flag on the table makes an **index sensor** ON at every station.

- **Index** latch: Set = Start AND at station. Reset = Stop OR next station reached.
- **Next station reached** = rising edge of the index sensor. When the table starts, the sensor is already ON, so there is no edge; it goes OFF as the table leaves and ON again at the next station, which gives the edge.
- **Motor** = index latch.
- A **station counter** counts completed indexes: an arrival edge while the table was indexing (so the power-up edge does not count).`,
    circuit: `circuit "Indexing table" version 1 {
  start: INPUT(label="Start index")
  stop: INPUT(label="Stop")
  atStation: INPUT(label="Index sensor", value=true)
  canStart: AND(label="Start at a station")
  arrived: R_TRIG(label="Next station reached")
  stopOrArrived: OR(label="Stop or arrived")
  index: RS_LATCH(label="Indexing")
  wasIndexing: SCAN_DELAY(label="Was indexing")
  completed: AND(label="Index completed")
  counter: COUNTER(label="Indexes done", limit=1000)
  motor: OUTPUT(label="Table motor")
  indexes: ANALOG_OUTPUT(label="Index count")
  start.Q -> canStart.A
  atStation.Q -> canStart.B
  atStation.Q -> arrived.A
  stop.Q -> stopOrArrived.A
  arrived.Q -> stopOrArrived.B
  canStart.Q -> index.S
  stopOrArrived.Q -> index.R
  index.Q -> wasIndexing.A
  arrived.Q -> completed.A
  wasIndexing.Q -> completed.B
  completed.Q -> counter.CU
  index.Q -> motor.A
  counter.CV -> indexes.A
}`,
    inputs: [
      { id: 'start', type: 'INPUT', label: 'Start index', device: 'Push button or machine sequence' },
      { id: 'stop', type: 'INPUT', label: 'Stop', device: 'Stop push button; ON means pressed' },
      { id: 'atStation', type: 'INPUT', label: 'Index sensor', device: 'Inductive proximity sensor on the table cam' },
    ],
    outputs: [
      { id: 'motor', type: 'OUTPUT', label: 'Table motor', device: 'Geared motor with brake' },
      { id: 'indexes', type: 'ANALOG_OUTPUT', label: 'Index count', device: 'HMI counter' },
    ],
    tryIt: ['Switch Start on and off: the motor runs.', 'Switch Index sensor OFF (table leaving), then ON (next station): the motor stops.', 'Start again.'],
    steps: [
      { title: 'Start only at a station', text: 'AND Start with the index sensor.' },
      { title: 'Stop on the edge', text: 'A rising-edge trigger of the index sensor resets the latch.' },
      { title: 'Count', text: 'The same edge counts the indexes.' },
    ],
    mistakes: [
      'Stopping on the sensor level: the table never leaves the first station.',
      'Not accounting for coasting: use a brake motor or slow down before the station, or the table overshoots the sensor.',
      'No timeout: add an on-delay on the motor that raises a fault if the next station does not arrive.',
    ],
    faq: [
      { q: 'How do I index several stations with one start?', a: 'Load the number of stations into a down counter, decrement it on each arrival edge, and reset the latch only when it reaches zero.' },
      { q: 'How do I make the table stop exactly?', a: 'Use a slow-down sensor before each station and a creep speed, or a mechanical locating pin that engages after the stop.' },
    ],
    blocks: ['R_TRIG', 'RS_LATCH', 'COUNTER', 'SCAN_DELAY', 'AND', 'OR'],
    challenges: ['batch-counter', 'start-stop'],
    scenarios: [
      {
        name: 'Two indexes',
        steps: [
          { action: 'At a station, press Start', set: { atStation: true, start: true }, waitMs: 200, expect: { motor: true } },
          { action: 'Release Start, still on the sensor', set: { start: false }, waitMs: 300, expect: { motor: true } },
          { action: 'Table leaves the station', set: { atStation: false }, waitMs: 1000, expect: { motor: true } },
          { action: 'Next station', set: { atStation: true }, waitMs: 200, expect: { motor: false, indexes: 1 } },
          { action: 'Start again', set: { start: true }, waitMs: 200, expect: { motor: true } },
          { action: 'Leave', set: { start: false, atStation: false }, waitMs: 800 },
          { action: 'Arrive', set: { atStation: true }, waitMs: 200, expect: { motor: false, indexes: 2 } },
        ],
      },
      {
        name: 'Not at a station, and Stop',
        steps: [
          { action: 'Between stations, press Start', set: { atStation: false, start: true }, waitMs: 300, expect: { motor: false } },
          { action: 'At a station, Start', set: { atStation: true }, waitMs: 200, expect: { motor: true } },
          { action: 'Stop', set: { start: false, stop: true }, waitMs: 200, expect: { motor: false } },
        ],
      },
    ],
  },
  {
    slug: 'egg-incubator-controller-arduino-plc',
    title: 'Egg incubator controller: temperature and automatic egg turning (Arduino/PLC)',
    description: 'Incubator logic: heater with a tight hysteresis band, an over-temperature cut-out, and an egg turner that runs periodically until lockdown.',
    answer:
      'Keep the temperature in a narrow band with an on/off heater, cut the heater and raise an alarm if it overheats, and run the egg-turning motor for a short time at fixed intervals. Stop turning during the last days (lockdown).',
    level: 'beginner',
    explanation: `- **Heater**: hysteresis switch, on at **37.3 °C** or below, off at **37.8 °C** or above.
- **Over-temperature**: at **39 °C** or above the heater is blocked and an alarm sounds, whatever the thermostat says.
- **Egg turner**: a pulse generator turns the motor on for a short time at fixed intervals. The demo uses 2 s every 10 s; real incubators turn for a few seconds every 1 to 4 hours.
- **Lockdown** switch stops the turning for the last three days before hatching.

The generated Arduino sketch implements all of it with millis(), so the turner timing does not block the temperature control.`,
    circuit: `circuit "Egg incubator" version 1 {
  temp: ANALOG_INPUT(label="Temperature °C", value=37.5)
  lockdown: INPUT(label="Lockdown (stop turning)")
  thermostat: ANALOG_DIFFERENTIAL(label="On 37.3 / off 37.8 °C", onThreshold=37.3, offThreshold=37.8)
  limit: ANALOG_CONSTANT(label="Cut-out 39 °C", value=39)
  overheat: ANALOG_COMPARATOR(label="At or above 39 °C", operation="gte")
  safe: NOT(label="Not overheated")
  heatLogic: AND(label="Heat")
  turnTimer: CLOCK(label="Turn interval", onTime=2000, offTime=8000)
  turning: NOT(label="Turning allowed")
  turnLogic: AND(label="Turn")
  heater: OUTPUT(label="Heater")
  turner: OUTPUT(label="Egg turner motor")
  alarm: OUTPUT(label="Over-temperature alarm")
  temp.Q -> thermostat.A
  temp.Q -> overheat.A
  limit.Q -> overheat.B
  overheat.Q -> safe.A
  thermostat.Q -> heatLogic.A
  safe.Q -> heatLogic.B
  lockdown.Q -> turning.A
  turnTimer.Q -> turnLogic.A
  turning.Q -> turnLogic.B
  heatLogic.Q -> heater.A
  turnLogic.Q -> turner.A
  overheat.Q -> alarm.A
}`,
    inputs: [
      { id: 'temp', type: 'ANALOG_INPUT', label: 'Temperature °C', device: 'DS18B20, DHT22 or PT100 sensor at egg height' },
      { id: 'lockdown', type: 'INPUT', label: 'Lockdown (stop turning)', device: 'Switch' },
    ],
    outputs: [
      { id: 'heater', type: 'OUTPUT', label: 'Heater', device: 'Relay or SSR for the heating element' },
      { id: 'turner', type: 'OUTPUT', label: 'Egg turner motor', device: 'Relay for the turner motor' },
      { id: 'alarm', type: 'OUTPUT', label: 'Over-temperature alarm', device: 'Buzzer' },
    ],
    tryIt: ['Press Run and set 37.0 °C: the heater runs until 37.8 °C.', 'Watch the turner motor run 2 s out of every 10 s.', 'Set 39.5 °C: heater off, alarm on. Switch Lockdown ON to stop turning.'],
    steps: [
      { title: 'Narrow thermostat band', text: 'Half a degree is typical for forced-air incubators.' },
      { title: 'Independent cut-out', text: 'A comparator blocks the heater above the safe limit.' },
      { title: 'Periodic turning', text: 'A pulse generator with a short on time and a long off time.' },
      { title: 'Lockdown', text: 'A switch disables turning.' },
    ],
    mistakes: [
      'Measuring temperature far from the eggs, for example near the heater.',
      'Using delay() on Arduino for the turner interval, which freezes the temperature control for hours.',
      'No independent overheat protection; a stuck relay can cook the eggs. A separate thermal fuse is a good addition.',
    ],
    faq: [
      { q: 'How do I control humidity too?', a: 'Add a humidity sensor and a second hysteresis switch driving a small fan over a water tray or a humidifier, like the misting in the greenhouse guide.' },
      { q: 'Should I use PID for the heater?', a: 'For small incubators an on/off band works well. A PID with PWM gives a steadier temperature with powerful heaters.' },
    ],
    blocks: ['ANALOG_DIFFERENTIAL', 'ANALOG_COMPARATOR', 'CLOCK', 'AND', 'NOT'],
    challenges: ['flashing-beacon', 'tank-level'],
    scenarios: [
      {
        name: 'Temperature',
        steps: [
          { action: '37.5 °C', set: { temp: 37.5 }, waitMs: 200, expect: { heater: false, alarm: false } },
          { action: '37.2 °C', set: { temp: 37.2 }, waitMs: 200, expect: { heater: true } },
          { action: '37.6 °C', set: { temp: 37.6 }, waitMs: 200, expect: { heater: true } },
          { action: '37.8 °C', set: { temp: 37.8 }, waitMs: 200, expect: { heater: false } },
          { action: 'Overheating: 39.5 °C', set: { temp: 39.5 }, waitMs: 200, expect: { heater: false, alarm: true } },
          { action: 'Back to 37 °C', set: { temp: 37 }, waitMs: 200, expect: { heater: true, alarm: false } },
        ],
      },
      {
        name: 'Turning',
        steps: [
          { action: 'Turner over 20 s', set: { temp: 37.5 }, waitMs: 20000, during: [{ id: 'turner', onShare: [0.15, 0.25], minChanges: 3 }] },
          { action: 'Lockdown', set: { lockdown: true }, waitMs: 20000, during: [{ id: 'turner', onShare: [0, 0] }] },
        ],
      },
    ],
  },
  {
    slug: 'automatic-irrigation-soil-moisture',
    title: 'Automatic irrigation with a soil moisture sensor and rain lockout',
    description: 'Water when the soil is dry, stop when it is moist, skip watering when it rains, and stop with a fault if watering runs too long. PLC/Arduino logic.',
    answer:
      'Open the valve when soil moisture falls to the dry threshold and close it at the wet threshold, so the soil is watered in proper doses. Block watering while it rains, and limit any single watering to a maximum time so a broken sensor cannot flood the garden.',
    level: 'beginner',
    explanation: `- **Moisture band**: hysteresis switch, on at **30 %** or below, off at **45 %** or above (low trigger).
- **Rain sensor** blocks watering.
- **Maximum watering time** (10 s in the demo, typically 20–60 minutes): an on-delay on the watering demand. If it finishes, the soil is not getting wetter, so the sensor or the water supply has a problem: a fault latches and the valve closes until Reset.
- **Valve** = demand AND NOT fault.`,
    circuit: `circuit "Irrigation controller" version 1 {
  moisture: ANALOG_INPUT(label="Soil moisture %", value=40)
  rain: INPUT(label="Raining")
  reset: INPUT(label="Fault reset")
  dry: ANALOG_DIFFERENTIAL(label="Water: on 30 / off 45 %", onThreshold=30, offThreshold=45)
  noRain: NOT(label="Not raining")
  demand: AND(label="Watering demand")
  maxTime: TON(label="Maximum watering time", duration=10000)
  fault: RS_LATCH(label="Watering fault")
  noFault: NOT(label="No fault")
  valveLogic: AND(label="Water")
  valve: OUTPUT(label="Irrigation valve")
  faultLamp: OUTPUT(label="Fault lamp")
  moisture.Q -> dry.A
  rain.Q -> noRain.A
  dry.Q -> demand.A
  noRain.Q -> demand.B
  demand.Q -> maxTime.A
  maxTime.Q -> fault.S
  reset.Q -> fault.R
  fault.Q -> noFault.A
  demand.Q -> valveLogic.A
  noFault.Q -> valveLogic.B
  valveLogic.Q -> valve.A
  fault.Q -> faultLamp.A
}`,
    inputs: [
      { id: 'moisture', type: 'ANALOG_INPUT', label: 'Soil moisture %', device: 'Capacitive soil moisture sensor' },
      { id: 'rain', type: 'INPUT', label: 'Raining', device: 'Rain sensor' },
      { id: 'reset', type: 'INPUT', label: 'Fault reset', device: 'Push button' },
    ],
    outputs: [
      { id: 'valve', type: 'OUTPUT', label: 'Irrigation valve', device: 'Solenoid valve or pump relay' },
      { id: 'faultLamp', type: 'OUTPUT', label: 'Fault lamp', device: 'LED or notification' },
    ],
    tryIt: ['Press Run and set moisture to 25 %: the valve opens.', 'Raise to 45 %: it closes.', 'Set 25 % and leave it: after 10 s the fault stops watering.'],
    steps: [
      { title: 'Dry/wet band', text: 'Hysteresis on the moisture reading.' },
      { title: 'Rain lockout', text: 'AND with NOT raining.' },
      { title: 'Watering time limit', text: 'An on-delay on the demand latches a fault.' },
    ],
    mistakes: [
      'Resistive moisture probes corrode within weeks; capacitive sensors last much longer.',
      'Watering in the midday sun; add a time window (morning or evening) with a clock signal.',
      'No maximum time: a sensor pulled out of the ground reads dry forever.',
    ],
    faq: [
      { q: 'How do I water several zones?', a: 'Give each zone its own sensor, band and valve, and only allow one valve at a time if the water supply cannot feed all of them.' },
      { q: 'How do I add a time window?', a: 'AND the demand with a "watering allowed" signal from a clock or the PLC real-time clock.' },
    ],
    blocks: ['ANALOG_DIFFERENTIAL', 'TON', 'RS_LATCH', 'AND', 'NOT'],
    challenges: ['tank-level', 'delayed-fan'],
    scenarios: [
      {
        name: 'Normal watering and rain',
        steps: [
          { action: 'Moist 40 %', set: { moisture: 40 }, waitMs: 200, expect: { valve: false } },
          { action: 'Dry 25 %', set: { moisture: 25 }, waitMs: 200, expect: { valve: true } },
          { action: 'Getting wetter: 38 %', set: { moisture: 38 }, waitMs: 3000, expect: { valve: true } },
          { action: 'Wet 45 %', set: { moisture: 45 }, waitMs: 200, expect: { valve: false } },
          { action: 'Dry while raining', set: { moisture: 25, rain: true }, waitMs: 500, expect: { valve: false } },
          { action: 'Rain stops', set: { rain: false }, waitMs: 200, expect: { valve: true } },
        ],
      },
      {
        name: 'Watering takes too long',
        steps: [
          { action: 'Dry 20 %', set: { moisture: 20 }, waitMs: 9000, expect: { valve: true, faultLamp: false } },
          { action: 'Still dry after 10 s', waitMs: 1500, expect: { valve: false, faultLamp: true } },
          { action: 'Sensor fixed: 50 %, reset', set: { moisture: 50, reset: true }, waitMs: 200, expect: { faultLamp: false, valve: false } },
        ],
      },
    ],
  },
  {
    slug: 'fan-staging-by-temperature',
    title: 'How to stage cooling fans by temperature (3 stages with hysteresis)',
    description: 'Switch three fans on in stages at 30, 35 and 40 °C, each off 2 °C lower, and only allow a stage if the stage below runs. PLC logic you can run.',
    answer:
      'Give each fan stage its own temperature band with a couple of degrees of hysteresis, and let a stage run only while the stage below it runs. The more heat, the more fans, without fans chattering on and off at the thresholds.',
    level: 'beginner',
    explanation: `Three hysteresis switches (high triggers, on threshold above off threshold):

| Stage | On at | Off at |
|---|---|---|
| 1 | 30 °C | 28 °C |
| 2 | 35 °C | 33 °C |
| 3 | 40 °C | 38 °C |

Each stage is ANDed with the stage below, so the fans always come on in order and a stage never runs alone. The same pattern stages compressors, boilers, pumps or electric heater banks.`,
    circuit: `circuit "Fan staging" version 1 {
  temp: ANALOG_INPUT(label="Temperature °C", value=25)
  band1: ANALOG_DIFFERENTIAL(label="Stage 1: on 30 / off 28", onThreshold=30, offThreshold=28)
  band2: ANALOG_DIFFERENTIAL(label="Stage 2: on 35 / off 33", onThreshold=35, offThreshold=33)
  band3: ANALOG_DIFFERENTIAL(label="Stage 3: on 40 / off 38", onThreshold=40, offThreshold=38)
  s2Logic: AND(label="Stage 2 after 1")
  s3Logic: AND(label="Stage 3 after 2")
  fan1: OUTPUT(label="Fan 1")
  fan2: OUTPUT(label="Fan 2")
  fan3: OUTPUT(label="Fan 3")
  temp.Q -> band1.A
  temp.Q -> band2.A
  temp.Q -> band3.A
  band2.Q -> s2Logic.A
  band1.Q -> s2Logic.B
  band3.Q -> s3Logic.A
  s2Logic.Q -> s3Logic.B
  band1.Q -> fan1.A
  s2Logic.Q -> fan2.A
  s3Logic.Q -> fan3.A
}`,
    inputs: [{ id: 'temp', type: 'ANALOG_INPUT', label: 'Temperature °C', device: 'Temperature sensor in the room or cabinet' }],
    outputs: [
      { id: 'fan1', type: 'OUTPUT', label: 'Fan 1', device: 'Fan contactor' },
      { id: 'fan2', type: 'OUTPUT', label: 'Fan 2', device: 'Fan contactor' },
      { id: 'fan3', type: 'OUTPUT', label: 'Fan 3', device: 'Fan contactor' },
    ],
    tryIt: ['Press Run and raise the temperature step by step to 41 °C: the fans come on at 30, 35 and 40 °C.', 'Lower it again: each fan goes off 2 °C below its start.'],
    steps: [
      { title: 'One band per stage', text: 'Increasing thresholds with a few degrees of hysteresis.' },
      { title: 'Chain the stages', text: 'Stage n runs only with stage n−1.' },
    ],
    mistakes: [
      'Bands that overlap so much that several stages switch at once.',
      'Starting all motors in the same scan after a power cut; add small start delays between stages.',
      'Always using fan 1 as the first stage: rotate the stage order (like the duty/standby guide) to even out wear.',
    ],
    faq: [
      { q: 'Should I use a VFD instead?', a: 'One fan on a VFD controlled by a PI loop is quieter and saves energy. Staging is simpler and works with plain contactors.' },
      { q: 'How do I add a minimum run time?', a: 'Hold each stage on with an off-delay of a few minutes after its band turns off.' },
    ],
    blocks: ['ANALOG_DIFFERENTIAL', 'AND'],
    challenges: ['tank-level'],
    never: [
      { when: { fan2: true, fan1: false }, message: 'Fan 2 ran without fan 1' },
      { when: { fan3: true, fan2: false }, message: 'Fan 3 ran without fan 2' },
    ],
    scenarios: [
      {
        name: 'Heating up and cooling down',
        steps: [
          { action: '25 °C', set: { temp: 25 }, waitMs: 200, expect: { fan1: false, fan2: false, fan3: false } },
          { action: '31 °C', set: { temp: 31 }, waitMs: 200, expect: { fan1: true, fan2: false } },
          { action: '36 °C', set: { temp: 36 }, waitMs: 200, expect: { fan2: true, fan3: false } },
          { action: '41 °C', set: { temp: 41 }, waitMs: 200, expect: { fan3: true } },
          { action: '39 °C', set: { temp: 39 }, waitMs: 200, expect: { fan3: true } },
          { action: '37 °C', set: { temp: 37 }, waitMs: 200, expect: { fan3: false, fan2: true } },
          { action: '32 °C', set: { temp: 32 }, waitMs: 200, expect: { fan2: false, fan1: true } },
          { action: '27 °C', set: { temp: 27 }, waitMs: 200, expect: { fan1: false } },
        ],
      },
      {
        name: 'Stage 2 band alone cannot run fan 2',
        steps: [
          { action: 'Jump straight to 36 °C', set: { temp: 36 }, waitMs: 200, expect: { fan1: true, fan2: true } },
          { action: 'Drop to 29 °C', set: { temp: 29 }, waitMs: 200, expect: { fan1: true, fan2: false } },
          { action: 'Drop to 27 °C, then 34 °C', set: { temp: 27 }, waitMs: 200, expect: { fan1: false } },
          { action: '34 °C', set: { temp: 34 }, waitMs: 200, expect: { fan1: true, fan2: false } },
        ],
      },
    ],
  },
  {
    slug: 'belt-slip-underspeed-detection',
    title: 'How to detect belt slip or underspeed with a pulse sensor (PLC)',
    description: 'Watch the pulses from a speed sensor on the tail pulley; if they stop while the motor runs, raise a belt slip alarm. Retriggerable timer watchdog.',
    answer:
      'Put a proximity sensor on a pulley the belt drives, and restart a retriggerable timer on every pulse. If the timer runs out while the motor is supposed to run (after a start-up allowance), the belt is slipping or broken.',
    level: 'intermediate',
    explanation: `The motor running does not prove the belt moves: the belt can slip, break or the coupling can fail. A sensor on the **driven (tail) pulley** proves real movement.

- A **retriggerable pulse timer** (2 s) restarts on every pulse. While pulses keep arriving it stays ON: this is a **watchdog**.
- **Start-up allowance**: an on-delay (3 s) after the motor starts, while the belt accelerates.
- **Slip** = start-up done AND watchdog OFF. It latches an alarm, which is reset when the motor stops.

Choose the watchdog time a little longer than the time between pulses at the lowest normal speed.`,
    circuit: `circuit "Belt slip detection" version 1 {
  running: INPUT(label="Motor running")
  pulse: INPUT(label="Speed sensor pulse")
  watchdog: EDGE_PULSE_TIMER(label="Pulse watchdog", duration=2000)
  startup: TON(label="Start-up allowance", duration=3000)
  noPulses: NOT(label="Pulses missing")
  slipping: AND(label="Running, no pulses")
  stopped: NOT(label="Motor stopped")
  alarm: RS_LATCH(label="Belt slip")
  slipAlarm: OUTPUT(label="Belt slip alarm")
  moving: OUTPUT(label="Belt moving")
  pulse.Q -> watchdog.A
  running.Q -> startup.A
  watchdog.Q -> noPulses.A
  startup.Q -> slipping.A
  noPulses.Q -> slipping.B
  running.Q -> stopped.A
  slipping.Q -> alarm.S
  stopped.Q -> alarm.R
  alarm.Q -> slipAlarm.A
  watchdog.Q -> moving.A
}`,
    inputs: [
      { id: 'running', type: 'INPUT', label: 'Motor running', device: 'Contactor auxiliary or drive running signal' },
      { id: 'pulse', type: 'INPUT', label: 'Speed sensor pulse', device: 'Inductive sensor seeing bolts or a cam on the tail pulley' },
    ],
    outputs: [
      { id: 'slipAlarm', type: 'OUTPUT', label: 'Belt slip alarm', device: 'Alarm (often also stops the conveyor)' },
      { id: 'moving', type: 'OUTPUT', label: 'Belt moving', device: 'Status indication' },
    ],
    tryIt: ['Switch Motor running ON and keep switching the pulse input on and off about once a second.', 'Stop pulsing: 2 s later the slip alarm latches.', 'Switch Motor running OFF to reset.'],
    steps: [
      { title: 'Sense the driven pulley', text: 'Not the motor shaft.' },
      { title: 'Watchdog', text: 'A retriggerable timer restarted by each pulse.' },
      { title: 'Allow start-up', text: 'Ignore missing pulses for the first seconds.' },
      { title: 'Latch the alarm', text: 'Reset when the motor stops.' },
    ],
    mistakes: [
      'Mounting the sensor on the drive pulley, which keeps turning when the belt slips.',
      'A watchdog time shorter than the pulse spacing at low speed: nuisance alarms.',
      'No start-up allowance: every start raises an alarm.',
    ],
    faq: [
      { q: 'How do I measure the actual speed?', a: 'Count pulses per second (or measure the time between pulses) and scale to metres per second; then alarm below, say, 80 % of normal speed.' },
      { q: 'Can I use this for fans or pumps?', a: 'Yes: any rotating machine with a pulse sensor can use the same watchdog, for example to detect a broken fan belt.' },
    ],
    blocks: ['EDGE_PULSE_TIMER', 'TON', 'RS_LATCH', 'AND', 'NOT'],
    challenges: ['delayed-fan'],
    scenarios: [
      {
        name: 'Running, then slip',
        steps: [
          { action: 'Motor starts, no pulses yet', set: { running: true }, waitMs: 2000, expect: { slipAlarm: false } },
          { action: 'Pulse', set: { pulse: true }, waitMs: 200 },
          { action: 'Gap', set: { pulse: false }, waitMs: 800 },
          { action: 'Pulse', set: { pulse: true }, waitMs: 200 },
          { action: 'Gap', set: { pulse: false }, waitMs: 800 },
          { action: 'Pulse', set: { pulse: true }, waitMs: 200 },
          { action: 'Gap', set: { pulse: false }, waitMs: 800, expect: { slipAlarm: false, moving: true } },
          { action: 'Pulse', set: { pulse: true }, waitMs: 200 },
          { action: 'Belt slips: no pulses for 2.5 s', set: { pulse: false }, waitMs: 2500, expect: { slipAlarm: true, moving: false } },
          { action: 'Pulses return', set: { pulse: true }, waitMs: 200, expect: { slipAlarm: true } },
          { action: 'Motor stopped', set: { pulse: false, running: false }, waitMs: 200, expect: { slipAlarm: false } },
        ],
      },
      {
        name: 'Belt never moves',
        steps: [{ action: 'Motor runs, no pulses at all', set: { running: true }, waitMs: 3500, expect: { slipAlarm: true } }],
      },
    ],
  },
  {
    slug: 'bathroom-exhaust-fan-humidity-timer',
    title: 'How to control a bathroom exhaust fan with humidity and a run-on timer',
    description: 'Run the exhaust fan when the light is on (with a run-on after it goes off) or when humidity is high, with hysteresis. Building automation logic you can run.',
    answer:
      'Run the fan while the light is on and for a few minutes after it is switched off (an off-delay timer), and also whenever humidity is high, switching off only when it has dropped well below the start level.',
    level: 'beginner',
    explanation: `- **Run-on**: an off-delay on the light switch (5 s in the demo, typically 5–15 minutes) keeps the fan going after someone leaves.
- **Humidity**: a hysteresis switch, on at **70 %** RH or above, off at **60 %** or below (high trigger). It clears the steam after a shower even if the light is already off.
- **Fan** = run-on OR humidity.`,
    circuit: `circuit "Bathroom fan" version 1 {
  light: INPUT(label="Light switch")
  humidity: ANALOG_INPUT(label="Humidity % RH", value=50)
  runOn: TOF(label="Run-on time", duration=5000)
  humid: ANALOG_DIFFERENTIAL(label="On 70 / off 60 %", onThreshold=70, offThreshold=60)
  fanLogic: OR(label="Fan on")
  fan: OUTPUT(label="Exhaust fan")
  light.Q -> runOn.A
  humidity.Q -> humid.A
  runOn.Q -> fanLogic.A
  humid.Q -> fanLogic.B
  fanLogic.Q -> fan.A
}`,
    inputs: [
      { id: 'light', type: 'INPUT', label: 'Light switch', device: 'Light switch or occupancy sensor' },
      { id: 'humidity', type: 'ANALOG_INPUT', label: 'Humidity % RH', device: 'Humidity sensor' },
    ],
    outputs: [{ id: 'fan', type: 'OUTPUT', label: 'Exhaust fan', device: 'Fan relay' }],
    tryIt: ['Switch the light ON and OFF: the fan runs 5 s longer.', 'Set humidity to 75 %: the fan runs until it drops to 60 %.'],
    steps: [
      { title: 'Run-on', text: 'Off-delay on the light.' },
      { title: 'Humidity band', text: 'High trigger with 10 % hysteresis.' },
      { title: 'Combine', text: 'OR the two.' },
    ],
    mistakes: [
      'Running the fan only while the light is on: the steam stays after the shower.',
      'A humidity band so narrow that the fan cycles in humid weather.',
      'Starting the fan the moment the light turns on for a short visit; some designs add a short on-delay too.',
    ],
    faq: [
      { q: 'What about very humid summer days?', a: 'Outdoor humidity can keep the fan running all day. Compare indoor with outdoor humidity, or limit the humidity run to a maximum time.' },
      { q: 'Is this the same as the stairwell light?', a: 'The run-on part is: an off-delay timer. This guide adds a second, independent reason to run.' },
    ],
    blocks: ['TOF', 'ANALOG_DIFFERENTIAL', 'OR'],
    challenges: ['stairwell-light'],
    scenarios: [
      {
        name: 'Visit and shower',
        steps: [
          { action: 'Idle', set: { humidity: 50 }, waitMs: 300, expect: { fan: false } },
          { action: 'Light on', set: { light: true }, waitMs: 2000, expect: { fan: true } },
          { action: 'Light off, 4 s later', set: { light: false }, waitMs: 4000, expect: { fan: true } },
          { action: 'Run-on over', waitMs: 1500, expect: { fan: false } },
          { action: 'Shower: 75 %', set: { humidity: 75 }, waitMs: 200, expect: { fan: true } },
          { action: '65 %', set: { humidity: 65 }, waitMs: 200, expect: { fan: true } },
          { action: '60 %', set: { humidity: 60 }, waitMs: 200, expect: { fan: false } },
        ],
      },
    ],
  },
  {
    slug: 'production-counter-reject-rate',
    title: 'How to count good and rejected parts and calculate the reject rate (PLC)',
    description: 'Count good and bad parts with two counters, calculate the reject percentage with a math block and alarm when it gets too high. PLC logic you can run.',
    answer:
      'Count good parts and rejects with two counters, calculate reject % = rejects ÷ (good + rejects) × 100, and raise a quality alarm when the rate goes above a limit once enough parts have been made to make it meaningful.',
    level: 'intermediate',
    explanation: `- **Good** and **Reject** counters count rising edges of their sensors.
- **Total** = good + rejects; **Reject %** = rejects / total × 100 (math blocks). The simulator's math block returns 0 for a division by zero, so the rate reads 0 before the first part.
- **Quality alarm** = reject % ≥ 10 AND total ≥ 5. The minimum count stops the alarm from firing on the first part of a shift when one reject is 100 %.
- **Shift reset** clears both counters.`,
    circuit: `circuit "Production counter" version 1 {
  good: INPUT(label="Good part")
  bad: INPUT(label="Rejected part")
  shiftReset: INPUT(label="Shift reset")
  goodCount: COUNTER(label="Good parts", limit=100000)
  badCount: COUNTER(label="Rejects", limit=100000)
  total: MATH_EXPRESSION(label="Total", expr="A + B")
  rate: MATH_EXPRESSION(label="Reject %", expr="B / (A + B) * 100")
  rateLimit: ANALOG_CONSTANT(label="Limit 10 %", value=10)
  minParts: ANALOG_CONSTANT(label="Minimum 5 parts", value=5)
  tooMany: ANALOG_COMPARATOR(label="Rate at or above limit", operation="gte")
  enough: ANALOG_COMPARATOR(label="Enough parts", operation="gte")
  alarmLogic: AND(label="Quality alarm")
  goodOut: ANALOG_OUTPUT(label="Good count")
  badOut: ANALOG_OUTPUT(label="Reject count")
  rateOut: ANALOG_OUTPUT(label="Reject rate %")
  alarm: OUTPUT(label="Quality alarm")
  good.Q -> goodCount.CU
  bad.Q -> badCount.CU
  shiftReset.Q -> goodCount.R
  shiftReset.Q -> badCount.R
  goodCount.CV -> total.A
  badCount.CV -> total.B
  goodCount.CV -> rate.A
  badCount.CV -> rate.B
  rate.Q -> tooMany.A
  rateLimit.Q -> tooMany.B
  total.Q -> enough.A
  minParts.Q -> enough.B
  tooMany.Q -> alarmLogic.A
  enough.Q -> alarmLogic.B
  goodCount.CV -> goodOut.A
  badCount.CV -> badOut.A
  rate.Q -> rateOut.A
  alarmLogic.Q -> alarm.A
}`,
    inputs: [
      { id: 'good', type: 'INPUT', label: 'Good part', device: 'Sensor at the good-part exit' },
      { id: 'bad', type: 'INPUT', label: 'Rejected part', device: 'Sensor at the reject chute' },
      { id: 'shiftReset', type: 'INPUT', label: 'Shift reset', device: 'HMI button or shift change signal' },
    ],
    outputs: [
      { id: 'goodOut', type: 'ANALOG_OUTPUT', label: 'Good count', device: 'HMI value' },
      { id: 'badOut', type: 'ANALOG_OUTPUT', label: 'Reject count', device: 'HMI value' },
      { id: 'rateOut', type: 'ANALOG_OUTPUT', label: 'Reject rate %', device: 'HMI value' },
      { id: 'alarm', type: 'OUTPUT', label: 'Quality alarm', device: 'Andon light or HMI alarm' },
    ],
    tryIt: ['Switch to "Function blocks". Pulse Good part a few times and Rejected part once.', 'Watch the counts and the reject rate.', 'Add rejects until the quality alarm turns on; pulse Shift reset.'],
    steps: [
      { title: 'Two counters', text: 'One per sensor, counting edges.' },
      { title: 'Calculate', text: 'Total and reject percentage with math blocks.' },
      { title: 'Alarm sensibly', text: 'Rate above the limit and enough parts.' },
      { title: 'Reset per shift', text: 'Clear both counters together.' },
    ],
    mistakes: [
      'Alarming on the rate from the very first part.',
      'Integer division in the PLC (1 / 9 = 0): convert to REAL before dividing.',
      'Counting the reject command instead of a sensor that sees the part leave.',
    ],
    faq: [
      { q: 'How do I calculate OEE?', a: 'OEE = availability × performance × quality. The reject rate gives quality (good ÷ total); add run time and ideal cycle time for the other two.' },
      { q: 'How do I keep the counts after a power failure?', a: 'Use retentive counters or copy the values to retentive memory regularly.' },
    ],
    blocks: ['COUNTER', 'MATH_EXPRESSION', 'ANALOG_COMPARATOR', 'AND'],
    challenges: ['batch-counter'],
    scenarios: [
      {
        name: 'A shift',
        steps: [
          { action: 'Start of shift', waitMs: 200, expect: { goodOut: 0, badOut: 0, rateOut: 0, alarm: false } },
          { action: 'First part rejected', set: { bad: true }, waitMs: 200, expect: { badOut: 1, rateOut: 100, alarm: false } },
          { action: 'Gap', set: { bad: false }, waitMs: 100 },
          { action: 'Good 1', set: { good: true }, waitMs: 100 },
          { action: 'Gap', set: { good: false }, waitMs: 100 },
          { action: 'Good 2', set: { good: true }, waitMs: 100 },
          { action: 'Gap', set: { good: false }, waitMs: 100 },
          { action: 'Good 3', set: { good: true }, waitMs: 100 },
          { action: 'Gap', set: { good: false }, waitMs: 100, expect: { goodOut: 3, rateOut: 25, alarm: false } },
          { action: 'Good 4', set: { good: true }, waitMs: 100, expect: { rateOut: 20, alarm: true } },
          { action: 'Gap', set: { good: false }, waitMs: 100 },
          { action: 'Good 5', set: { good: true }, waitMs: 100 },
          { action: 'Gap', set: { good: false }, waitMs: 100 },
          { action: 'Good 6', set: { good: true }, waitMs: 100 },
          { action: 'Gap', set: { good: false }, waitMs: 100 },
          { action: 'Good 7', set: { good: true }, waitMs: 100 },
          { action: 'Gap', set: { good: false }, waitMs: 100 },
          { action: 'Good 8', set: { good: true }, waitMs: 100 },
          { action: 'Gap', set: { good: false }, waitMs: 100 },
          { action: 'Good 9', set: { good: true }, waitMs: 100, expect: { rateOut: 10, alarm: true } },
          { action: 'Gap', set: { good: false }, waitMs: 100 },
          { action: 'Good 10', set: { good: true }, waitMs: 100, expect: { alarm: false } },
          { action: 'Shift reset', set: { good: false, shiftReset: true }, waitMs: 200, expect: { goodOut: 0, badOut: 0, alarm: false } },
        ],
      },
    ],
  },
];
