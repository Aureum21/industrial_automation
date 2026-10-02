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

Open [localhost:3000](http://localhost:3000). The application is built with Next.js, React, React Flow, and Tailwind CSS. It runs entirely locally in your browser and does not require any database or API keys to start.

## Testing and Building

```sh
npm test              # Run the engine and circuit regression tests
npm run lint          # Check code quality
npm run typecheck     # Verify TypeScript types
npm run build         # Build for production
npm start             # Serve the production build
```

## How to use the Lab

1. **Wiring**: Connect output handles to input handles of the same signal type (digital or analog). Each input accepts one wire. 
2. **Execution**: Press the Run button to start the simulation engine. The simulation runs at a standard 100ms scan interval. 
3. **Tags**: You can assign text tags (like `Motor_1`) to blocks in the lab. This allows you to wirelessly link them to HMI dashboard widgets or monitor them automatically in the logic analyzer.
4. **Saving**: Use the Save button to store your current workspace locally in your browser, or use Export to download it as a portable JSON file so you can share it.

## Architecture Map

* `src/lib/LogicEngine.ts`: The core deterministic simulator that evaluates the logic graphs.
* `src/lib/automation/catalog.ts`: The complete inventory of every available block and logic gate.
* `src/components/lab/`: The React Flow visual canvas, node renderers, and workspace UI.
* `src/components/lab/HmiCanvas.tsx`: The SCADA dashboard builder.
* `src/components/lab/oscilloscope/`: The time-travel logic analyzer.

This project is an educational simulator and does not claim compatibility with specific PLC vendors. It is designed to make learning control logic accessible, visual, and highly interactive.
