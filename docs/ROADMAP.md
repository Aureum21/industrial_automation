# Industrial Automation Hub roadmap

Build in reviewable phases. Phase 1 establishes the shared foundations for an industrial automation publication and its interactive engineering lab. The catalog covers every component in the supplied reference images plus numeric constants, XNOR, edge triggers, and an explicit scan delay.

## Phase 1 — Foundation

- A searchable, typed component registry with pins, parameters, descriptions, availability, and planned delivery phase.
- A working core simulator: digital logic, digital and analog I/O, named signals, latches, edge detection, basic timers, counters, and numeric calculations.
- One circuit document shared by the canvas, runtime, validation, and file persistence. Deletion must remove engine blocks and connections as well as canvas elements.
- Explicit simulation lifecycle controls, deterministic scan behavior, connection validation, and automated engine regression checks.
- A publication shell with starter educational articles and a clear route into the lab.
- A versioned circuit format, scenario-test contracts, and a headless runner with detailed assertions so later work can build on stable boundaries.

Planned catalog entries are visible but unavailable for execution. A declared pin or parameter for a planned block is a design contract, not an implemented feature. Phase 1 is a browser simulation and article starter; it does not yet provide accounts, a publishing CMS, or physical PLC connectivity.

## Phase 2 — Timing, sequencing, and operator controls

Implement advanced timers, retentive timing, pulse variants, seeded random timing, weekly and yearly schedules, astronomical scheduling, stopwatch, hours and frequency counters, shift registers, operator keys, and text display blocks. Define edge cases before implementation: simultaneous events, reset precedence, scan resolution, timezone and daylight-saving behavior, and persistence of retained state.

Add examples such as stairway lighting, start/stop motor sequencing, maintenance intervals, and timed conveyor control. Each implemented block moves to `ready` only with runtime behavior, property editing, documentation, and behavioral tests.

## Phase 3 — Analog control and test workbench

Implement watchdogs, hysteresis, ramping, PI control, PWM, filtering, extrema, averaging, calculation error monitoring, and data logging. Add traces, CSV export, simulated sensor profiles, and fault injection.

Build the scenario testing UI on the existing test contracts: scripted input changes, simulation-time advancement, output assertions, readable failures, and reusable test suites. Develop tank level, temperature loop, and alarm exercises with defined expected behavior. Keep numeric ranges, units, sampling, saturation, and reset behavior explicit.

## Phase 4 — Publishing and reusable connected labs

Add article authoring, drafts, review and publication workflows, accounts, saved projects, and embedded lab examples. Develop user-defined function modules with versioned interfaces, reusable libraries, and nested circuit validation.

Implement network simulation channels first. Actual hardware access requires separate protocol adapters, connection configuration, and integration testing; selecting a network block must never silently connect to equipment. Protocol selection and any deployment architecture remain future design decisions.

## Boundaries that should remain stable

- `src/lib/automation/types.ts`: circuit, signal, component, runtime, and scenario contracts.
- `src/lib/automation/catalog.ts`: the authoritative component inventory and availability.
- Runtime behavior must not depend on React rendering or canvas positioning.
- Saved documents contain circuit intent; transient timing, scan, and display state belongs to the runtime.
- Articles and examples should describe this simulator's actual behavior. Reference component names do not imply vendor compatibility or equivalent timing and numeric semantics.
