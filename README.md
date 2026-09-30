# Fieldnotes — Industrial Automation Hub

A publication and interactive testing workspace for industrial automation. Phase 1 establishes a usable journal, a reliable logic lab, and the contracts needed to grow the complete component library.

## Run locally

Use Node.js 22.18+ (Node 24 recommended for the built-in TypeScript test runner).

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The app uses Next.js, React, React Flow, TypeScript, and Tailwind. It needs no API keys, database, or external font downloads.

```sh
npm test              # Engine, circuit import, and scenario regression tests
npm run lint
npm run typecheck
npm run build
npm start             # Serve the production build
```

## Included in Phase 1

- `/`: editorial homepage and entrances to the journal and lab.
- `/journal`: three starter articles; `/journal/[slug]` connects each explanation to an executable example.
- `/lab`: a graph editor with 32 implemented components, typed wires, live signal indication, searchable palette, drag/drop and click-to-add, keyboard/toolbar deletion, run/pause/step/reset, browser save, and JSON import/export.
- `/library`: all 69 component types, including every reference-image entry and additional primitives. The 37 future components are explicitly marked planned and cannot execute.
- A headless scenario runner for scripted inputs, time advancement, and assertions. Interactive scenario authoring and traces come later.

The examples cover a start/stop latch with a process permissive, two-input AND, and 4–20 to 0–100 analog scaling. Pass `?example=start-stop`, `?example=and`, or `?example=analog` to the lab to load one.

## Lab behavior

Connect output handles to input handles of the same signal type. Each input accepts one wire. Select a block or wire and press Delete/Backspace, or use Delete in the toolbar. Removing a block also removes its wires and clears disconnected signals in the engine.

Run advances simulation time by 100 ms per browser callback; Step advances one 100 ms scan. This is simulated elapsed time, not a guarantee of wall-clock or physical controller timing. Combinational logic settles in dependency order, including tag links. Each stateful block updates once per scan. Feedback requires an explicit **One-scan delay** block. Editing inputs while paused refreshes combinational signals but does not advance timers or stateful blocks.

Reset clears runtime memory and elapsed simulation time while preserving configured manual inputs. Latches are reset-priority. A missing tagged writer uses the input's configured manual value. Digital and analog tags occupy separate namespaces; a tag permits one writer per signal type.

Numeric and tag fields apply when focus leaves the field or Enter is pressed. Timer durations allow zero; clock intervals must be positive. Analog values are finite JavaScript numbers. Divide-by-zero and numeric overflow produce 0 plus a visible diagnostic.

**Save** stores one circuit in this browser and restores it when opening `/lab` without an example link. **Export** creates a portable JSON document. **Import**, examples, and New circuit check for unsaved changes before replacement. Files preserve settings, positions, and wiring; simulation memory restarts on load. Browser storage is local to the origin and browser profile; export important work.

## Code map

| Location | Responsibility |
| --- | --- |
| `src/lib/automation/types.ts` | Typed signals, pins, parameters, documents, runtime and scenario contracts |
| `src/lib/automation/catalog.ts` | Complete inventory and component availability |
| `src/lib/LogicEngine.ts` | React-independent deterministic simulation and graph validation |
| `src/lib/automation/documents.ts` | Version 1 parser, bounds and validation, default block factory |
| `src/lib/automation/examples.ts` | Fresh, editable starter circuit factories |
| `src/lib/automation/testing.ts` | Isolated scenario execution with detailed assertion results |
| `src/components/lab/` | Canvas lifecycle and generic catalog-driven node rendering |
| `src/lib/content/articles.ts` | Typed local article content and example associations |
| `tests/` | Behavioral regression coverage |

The engine owns circuit/runtime state; React Flow mirrors it for editing and display. All deletion and connection actions update both. Saved files deliberately exclude callbacks, UI selection, and runtime memory. Imports validate in an isolated engine before replacing the live document.

## Scenario testing API

```ts
import { getExample } from './src/lib/automation/examples.ts';
import { runCircuitTest } from './src/lib/automation/testing.ts';

const result = runCircuitTest(getExample('and'), {
  name: 'Both inputs are required',
  steps: [
    { afterMs: 100, inputs: { a: true, b: false }, expect: [{ blockId: 'lamp', pin: 'Q', value: false }] },
    { afterMs: 100, inputs: { b: true }, expect: [{ blockId: 'lamp', pin: 'Q', value: true }] },
  ],
});
```

Each step applies its inputs, advances `afterMs` relative to the previous step, and checks expectations. The default scan interval is 100 ms; the final scan may be shorter. A zero-duration step checks without advancing stateful blocks. Assertion mismatches return `passed: false`; malformed scenarios throw. Runs use an isolated engine and are bounded to 100,000 scans. Analog assertions currently use exact equality.

## Build in phases

See [the roadmap](docs/ROADMAP.md) and [the component inventory](docs/COMPONENTS.md). Phase 2 expands timing, counting, sequencing, and operator controls. Phase 3 adds analog control, traces, data logging, and the scenario workbench. Phase 4 adds the publishing backend, accounts, reusable modules, and simulated network channels.

Articles are currently maintained in source. Accounts, a CMS, hosted project storage, embedded labs, and physical PLC adapters are future work. This is an educational simulator with its own defined behavior; it does not claim PLC vendor compatibility.
