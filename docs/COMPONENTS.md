# Component inventory

The authoritative inventory is [`src/lib/automation/catalog.ts`](../src/lib/automation/catalog.ts). Every entry defines its identity, category, typed pins, configurable parameters, availability, and delivery phase. This inventory includes all components shown in the three supplied reference images and several foundational additions.

`Ready` means implemented in the current simulator. `Planned` means represented in the catalog for future implementation and unavailable for execution. These are educational simulator components; familiar names are not a claim of compatibility with a particular PLC vendor.

| Category | Ready in Phase 1 | Planned |
| --- | --- | --- |
| Digital I/O | Digital input, status 0, status 1, output, flag | Cursor key, text display function key, shift register bit, open connector — Phase 2 |
| Analog I/O | Analog input, output, flag, numeric constant | — |
| Network | — | Network digital input/output and network analog input/output — Phase 4 |
| Basic logic | AND, NAND, OR, NOR, XOR, XNOR, NOT | AND (edge), NAND (edge) — Phase 2 |
| Timers | On-delay, off-delay, asynchronous pulse generator | On/off-delay, retentive on-delay, wiping relay, edge triggered wiping relay, random generator, stairway lighting switch, multiple function switch, weekly timer, yearly timer, astronomical clock, stopwatch — Phase 2 |
| Counters | Up/down counter | Hours counter, frequency threshold trigger — Phase 2 |
| Analog processing | Mathematic instruction, analog comparator, analog threshold trigger, amplifier, MUX | Watchdog, differential trigger, ramp, PI controller, PWM, filter, maximum/minimum, average value — Phase 3 |
| Memory and utilities | Latching relay, pulse relay, float/integer converter, integer/float converter, rising edge trigger, falling edge trigger, one-scan delay | Message texts, softkey, shift register — Phase 2; mathematic instruction error detection — Phase 3 |
| Data and modules | — | Data log — Phase 3; user-defined function — Phase 4 |

## Current signal contracts

- Digital signals are booleans; analog signals are finite JavaScript numbers. Text pins are reserved for future display blocks. Pins of different kinds cannot be directly wired together.
- Most blocks use `A` and `B` as inputs and `Q` as their result. The catalog is the source of truth for the exact interface.
- Input and output tags provide named signals within the simulation. Digital and analog tag channels retain their signal kind.
- Latching relays use `S` and `R`, with reset priority. Pulse relays toggle on rising `A` edges.
- Up/down counters use `CU`, `CD`, and `R`; `CV` is the numeric count and `Q` indicates the configured limit. The default limit is 5.
- On-delay and off-delay blocks use a duration in milliseconds, defaulting to 2,000. `ET` exposes elapsed time. The pulse generator has independent positive on/off durations, defaulting to 1,000 ms each.
- Arithmetic supports addition, subtraction, multiplication, and division. The comparator supports `>`, `>=`, `<`, `<=`, equality, and inequality. Analog threshold output is true at or above the configured threshold.
- An analog amplifier applies gain and offset. An analog MUX selects `B` when `S` is true and otherwise selects `A`.
- Float-to-integer conversion truncates toward zero. Integer-to-float is a numeric pass-through: the simulator currently uses one JavaScript number representation, not separate vendor-specific integer and real formats.
- An explicit one-scan delay stores the previous digital input for circuits that require a feedback memory boundary.

## Rules for adding a component

1. Extend the `BlockType` union and provide a complete catalog definition with unique pin and parameter names.
2. Specify startup state, reset behavior, edge semantics, units, invalid-input behavior, and interactions with the simulation clock.
3. Implement runtime behavior independently of the canvas and add tests that check observable outcomes.
4. Expose supported parameters in the node editor and verify saved-document round trips.
5. Mark the component `ready` only after the runtime and editing workflow support its declared contract.

The planned interfaces are initial foundations and can evolve before implementation. In particular, user-defined functions will obtain their pins from their module definition rather than a fixed generic interface.
