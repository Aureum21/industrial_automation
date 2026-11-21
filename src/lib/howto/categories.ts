/** Groups for the how-to index. tests/howto.test.ts checks that every guide is in exactly one. */
export const HOW_TO_CATEGORIES: { title: string; blurb: string; slugs: string[] }[] = [
  {
    title: 'PLC fundamentals',
    blurb: 'Start here: how ladder logic, the scan cycle and contacts work.',
    slugs: ['what-is-ladder-logic-basics', 'plc-scan-cycle-explained', 'normally-open-vs-normally-closed-plc-inputs', 'plc-first-scan-bit-initialization', 'plc-step-sequencer-counter'],
  },
  {
    title: 'Motor control',
    blurb: 'Start/stop, reversing, starters and selector switches.',
    slugs: ['start-stop-motor-control-seal-in', 'motor-forward-reverse-interlock', 'star-delta-starter-plc-program', 'jog-and-run-motor-control', 'hand-off-auto-hoa-switch-plc', 'motor-fail-to-start-feedback-alarm', 'emergency-stop-reset-plc-program', 'lube-oil-pump-permissive-motor', 'two-hand-control-anti-tie-down'],
  },
  {
    title: 'Machines and sequences',
    blurb: 'The classic PLC exercises: timed and step sequences.',
    slugs: ['plc-program-traffic-light', 'plc-program-pedestrian-crossing', 'plc-program-car-wash', 'plc-program-washing-machine', 'plc-program-garage-door', 'automatic-sliding-door-plc', 'plc-program-two-floor-elevator', 'pneumatic-cylinder-extend-retract-plc', 'airlock-door-interlock-plc', 'parking-boom-barrier-plc', 'rotary-indexing-table-plc', 'plc-program-microwave-oven'],
  },
  {
    title: 'Conveyors and packaging',
    blurb: 'Filling, sorting, counting and line control.',
    slugs: ['plc-program-bottle-filling', 'plc-program-conveyor-sorting-boxes', 'plc-program-packaging-counter', 'sequential-conveyor-start-stop', 'conveyor-jam-detection-plc', 'parking-lot-counter-plc', 'shift-register-reject-conveyor', 'belt-slip-underspeed-detection', 'production-counter-reject-rate'],
  },
  {
    title: 'Tanks, pumps and process',
    blurb: 'Levels, pumps, compressors, heating and analog signals.',
    slugs: ['tank-level-control-pump-hysteresis', 'pump-control-two-float-switches', 'water-level-indicator-plc', 'duty-standby-pump-alternation', 'sump-pump-lead-lag-high-level', 'plc-program-mixing-tank-batch', 'air-compressor-control-plc', 'heater-thermostat-high-limit-plc', '4-20ma-scaling-plc', 'automatic-transfer-switch-ats-plc', 'greenhouse-control-plc', 'two-speed-dosing-by-weight', 'valve-before-pump-start-sequence', 'fire-pump-jockey-pump-control', 'solar-water-heater-differential-controller', 'fan-staging-by-temperature'],
  },
  {
    title: 'Alarms, safety and indication',
    blurb: 'Alarm handling, voting, stack lights and monitoring.',
    slugs: ['alarm-horn-acknowledge-flashing-light', 'machine-stack-light-tower-plc', '2oo3-voting-logic-plc', 'plc-run-hour-meter-maintenance', 'analog-alarm-delay-deadband', 'street-light-automatic-dusk-dawn'],
  },
  {
    title: 'Basic techniques',
    blurb: 'Small patterns you will use in every program.',
    slugs: ['one-push-button-on-off-toggle', 'blinking-light-two-timers-plc', 'debounce-noisy-input-plc', 'motion-sensor-light-timer-plc', 'set-reset-latch-ladder-logic', 'ton-tof-tp-timer-difference', 'two-way-three-way-switching-xor', 'count-every-nth-item-plc'],
  },
  {
    title: 'Home, garden and building',
    blurb: 'Projects for Arduino and building automation.',
    slugs: ['egg-incubator-controller-arduino-plc', 'automatic-irrigation-soil-moisture', 'bathroom-exhaust-fan-humidity-timer', 'day-night-thermostat-setback'],
  },
];
