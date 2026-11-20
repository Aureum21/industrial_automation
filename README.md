# Industrial Automation Hub

Welcome to the Industrial Automation Hub! This is a complete, browser-based educational simulator and workspace for industrial automation, robotics, and control theory. 

Instead of needing expensive physical PLCs or heavy desktop software, you can design, wire, and test complete logic circuits right in your browser.

## Features

* **Visual Logic Lab**: A drag-and-drop function block diagram (FBD) editor. Wire up switches, logic gates, timers, PID controllers, and analog math blocks.
* **SCADA / HMI Builder**: Build custom operator dashboards. Drag and drop switches, gauges, indicator lights, and sliders, then bind them directly to your logic engine using custom tags.
* **Time-Travel Logic Analyzer**: An integrated oscilloscope that records the last 5 minutes of your simulation. You can pause at any time and scrub backward through the timeline to see exactly when a signal flipped and trace down race conditions.
* **Deterministic Simulation**: A robust logic engine that handles combinational logic, stateful feedback loops, and analog signal processing. 

## Running locally

You will need Node.js 22.18+ (Node 24 is recommended).

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Without a database the simulator, lab and built-in articles all work; accounts and the Studio are disabled.

### With a local database (accounts, Studio, read counts)

Production uses Neon's HTTP driver. Locally you can use any Postgres through a small proxy that speaks the same protocol:

```sh
createdb automationhub                       # any Postgres 14+
LOCAL_PG_URL=postgres://localhost/automationhub npm run db:proxy   # listens on :4444
```

Then in `.env.local` (see `.env.example`):

```sh
DATABASE_URL=postgres://localhost/automationhub
NEON_FETCH_ENDPOINT=http://localhost:4444/sql
OWNER_INITIAL_PASSWORD=choose-one     # creates the owner account on first start
```

Migrations run automatically on the first request (`src/server/db/migrations.ts`).

## Testing and building

```sh
npm test              # Unit tests: engine, DSL, documents, Arduino export, permissions, validation
npm run lint          # ESLint (must be error-free)
npm run typecheck     # TypeScript
npm run build         # Production build
npm run smoke:api     # End-to-end API checks (see scripts/smoke-fixtures.sh for setup)
```

## How to use the Lab

1. **Wiring**: Connect output handles to input handles of the same signal type (digital or analog). Each input accepts one wire. 
2. **Execution**: Press the Run button to start the simulation engine. The simulation runs at a standard 100ms scan interval. 
3. **Tags**: You can assign text tags (like `Motor_1`) to blocks in the lab. This allows you to wirelessly link them to HMI dashboard widgets or monitor them automatically in the logic analyzer.
4. **Saving**: Use the Save button to store your current workspace locally in your browser, or use Export to download it as a portable JSON file so you can share it.

## Architecture

```
src/
  app/                 Pages and API route handlers (thin: validate, authorize, call a service)
  server/              Server-only code (imports 'server-only')
    db/                Neon client and versioned migrations
    auth/              Password hashing and sessions (hashed tokens in an HttpOnly cookie)
    repos/             SQL queries per table
    services/          Business rules: articles, auth, published content for pages
    http.ts            JSON responses, error handling, request validation
  shared/              Pure code used by both sides: types, permissions, validation (zod), URL safety
  lib/
    api/client.ts      The only place the browser calls the API
    auth.ts            Client session store (useSession)
    content/           Article rendering and upload parsing
    LogicEngine.ts     The deterministic simulator
    automation/        Block catalog, circuit DSL, documents, layout
    codegen/           Arduino sketch generator
  components/lab/      React Flow canvas, HMI builder, logic analyzer
```

Rules of thumb:

* Authorization lives in `src/shared/permissions.ts` and is enforced by the API on every write; the UI only uses it to decide what to show.
* Every API payload is validated with the schemas in `src/shared/validation.ts`.
* Public pages read data on the server through `src/server/services/content.ts`, so articles are fully rendered for readers and search engines.
* Schema changes are new entries at the end of `MIGRATIONS`; never edit one that has shipped.

This project is an educational simulator and does not claim compatibility with specific PLC vendors. It is designed to make learning control logic accessible, visual, and highly interactive.
