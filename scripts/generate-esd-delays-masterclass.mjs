import fs from 'fs';
import path from 'path';
import { ESD_DELAYS_SVG, ESD_DELAYS_SVG_DATA_URI } from '../src/lib/esdBlueprintSvg.ts';

const LAB1_DSL = `circuit "Stage 1 - The Naive Simultaneous Cut" version 1 {
  estop: NC_INPUT(label="E-Stop Mushroom PB (NC)", value=false)
  runCmd: INPUT(label="Process Run Command", value=true)
  masterGate: AND()
  feedValve: OUTPUT(label="Chemical Feed Valve (XV-101)")
  coolPump: OUTPUT(label="Cooling Circulation Pump (P-101)")

  estop.Q -> masterGate.A
  runCmd.Q -> masterGate.B
  masterGate.Q -> feedValve.A
  masterGate.Q -> coolPump.A
}
`;

const LAB2_DSL = `circuit "Stage 2 - Staged Off-Delay Cooling via TOF" version 1 {
  estop: NC_INPUT(label="E-Stop Mushroom PB (NC)", value=false)
  runCmd: INPUT(label="Process Run Command", value=true)
  systemOk: AND()
  feedValve: OUTPUT(label="Chemical Feed Valve (Instant Shut)")
  pumpDelay: TOF(label="Cooling Run-On Timer (3.0s)", duration=3000)
  coolPump: OUTPUT(label="Cooling Circulation Pump (Active)")

  estop.Q -> systemOk.A
  runCmd.Q -> systemOk.B
  systemOk.Q -> feedValve.A

  systemOk.Q -> pumpDelay.A
  pumpDelay.Q -> coolPump.A
}
`;

const LAB3_DSL = `circuit "Stage 3 - Controlled Flare Vent & Latched Safety Train" version 1 {
  estopPb: NC_INPUT(label="E-Stop Mushroom PB (NC)", value=false)
  resetPb: INPUT(label="Master Safety Reset PB", value=false)
  runCmd: INPUT(label="Operator Start Request", value=true)

  estopTrip: NOT(label="E-Stop Break Detector")
  esdLatch: RS_LATCH(label="Emergency Shutdown Trip Memory")
  esdSafe: NOT(label="Safety Loop Healthy")

  systemPermissive: AND()
  feedValve: OUTPUT(label="Feed Isolation Valve XV-101")

  pumpRunTimer: TOF(label="Pump Cooldown Timer (4.0s)", duration=4000)
  coolPump: OUTPUT(label="Cooling Pump P-101 (Active)")

  ventDelay: TON(label="Vent Safe Delay (1.0s)", duration=1000)
  ventGate: AND()
  blowdownVent: OUTPUT(label="Flare Blowdown Vent BDV-101")
  alarmBeacon: OUTPUT(label="EMERGENCY SHUTDOWN ALARM")

  estopPb.Q -> estopTrip.A
  estopTrip.Q -> esdLatch.S
  resetPb.Q -> esdLatch.R

  esdLatch.Q -> esdSafe.A
  esdLatch.Q -> alarmBeacon.A

  runCmd.Q -> systemPermissive.A
  esdSafe.Q -> systemPermissive.B
  systemPermissive.Q -> feedValve.A

  systemPermissive.Q -> pumpRunTimer.A
  pumpRunTimer.Q -> coolPump.A

  esdLatch.Q -> ventDelay.A
  ventDelay.Q -> ventGate.A
  esdLatch.Q -> ventGate.B
  ventGate.Q -> blowdownVent.A
}
`;

// Masterclass object
const masterclassData = {
  slug: 'esd-delays',
  title: 'Emergency Shutdown Sequence (ESD): Staged Delays & Safe Depressurization',
  excerpt: 'A beginner-friendly guide to industrial emergency stops: why pulling the master plug causes catastrophic thermal seizures, using TOF off-delay timers for post-trip cooling, and sequencing flare blowdown vents.',
  author: 'Emma Safety & AutomationHub Team',
  date: 'Oct 21',
  readingTime: '12 min read + 15 min labs',
  tag: 'Safety / ESD',
  views: 8940,
  heroImage: '/esd-delays-blueprint.png',
  sections: [
    {
      type: 'image',
      src: ESD_DELAYS_SVG_DATA_URI,
      caption: 'FIG 1.1 // CHEMICAL PROCESS SKID EMERGENCY SHUTDOWN (ESD) & STAGED DEPRESSURIZATION',
      alt: 'Chemical process vessel ESD valve and cooling loop blueprint'
    },
    {
      type: 'markdown',
      content: `## The $85,000 Extruder Carbon Bake & The Trapped Solvent Hazard

When a beginner thinks of an Emergency Stop (E-Stop), they envision slamming the big red mushroom button and having all electrical power cut to zero in a single millisecond.

In the real physical world of chemical processing, rotating machinery, and high-temperature reactors, **cutting all power simultaneously can cause catastrophic damage:**

> **A Familiar Everyday Analogy:**
> Think of high-performance turbocharged sports cars. When you push an engine hard on a racetrack, the turbocharger spins at 150,000 RPM and glows cherry red at 1,400°F (760°C). 
> 
> If you suddenly turn the key off the second you park, the oil pump stops instantly. The trapped oil inside the red-hot bearing housing bakes into solid abrasive charcoal in seconds, destroying the turbocharger bearings. Instead, the engine must idle or run an auxiliary electric coolant pump for a few minutes to dissipate heat.

In industrial automation, the exact same principle applies:

At a specialty polymer plant in Louisiana, a small mechanical seal leak sprayed raw feed onto the skid floor. A startled operator panicked and pulled the main 480V disconnect handle on the wall. 
- The raw chemical feed stopped immediately (good).
- But the cooling water jacket pump died instantly while the chemical reactor was at 420°F (215°C)!
- Without cooling water flow, the remaining molten polymer baked into a rock-solid block of carbon, permanently fusing the $85,000 internal agitator screw to the reactor walls.
- Even worse, volatile solvent vapors remained trapped at 180 PSI with no power to open the relief valves!

**The Golden Lesson:** An Emergency Shutdown must be a **controlled, staged sequence**: instantly starve raw feed, keep auxiliary cooling pumps alive via **off-delay timers (\`TOF\`)**, and open emergency flare blowdown vents to safely depressurize the vessel.`
    },
    {
      type: 'markdown',
      content: `## Why E-Stops Use Normally Closed (NC) Contacts

Notice in all industrial standards (such as NFPA 79 and IEC 60204-1) that Emergency Stop pushbuttons are wired as **Normally Closed (NC)** contacts.

Why? Because of the **Fail-Safe Principle**:
- When the button is untouched, electrical current flows through the closed contact (\`True\`).
- When an operator hits the mushroom button, the mechanical contacts break open, interrupting current flow (\`False\`).
- If a rat chews through the wire, a terminal screw vibrates loose, or an electrician accidentally cuts the cable, the circuit breaks open—causing a **fail-safe shutdown** rather than leaving the machine unable to stop!`
    },
    {
      type: 'markdown',
      content: `## Stage 1: The Naive Simultaneous Cut (Why Simple AND Fails)

Below is **Stage 1** of our interactive lab, representing how naive programmers wire an emergency stop circuit: a single \`AND\` gate driving both the feed valve and the cooling pump simultaneously.

Try running the simulation below and observe what happens when you press the E-Stop button:`
    },
    {
      type: 'lab',
      title: 'Stage 1: The Naive Simultaneous Cut',
      step: 'Stage 1 of 3',
      height: 460,
      dsl: LAB1_DSL
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'The Beginner Flaw in Stage 1',
      text: 'Click on the "E-Stop Mushroom PB (NC)" button to simulate pressing it. Both "Feed Valve" and "Cooling Circulation Pump" turn OFF immediately in the exact same scan cycle! The cooling pump cuts out before the reactor can dissipate its thermal energy, triggering equipment seizure.'
    },
    {
      type: 'markdown',
      content: `## Stage 2: Staged Cooldown via TOF (Timer Off-Delay)

To protect rotating bearings and prevent boiling runaway, we introduce one of the most useful blocks in industrial automation: the **Timer Off-Delay (\`TOF\`)**.

How a \`TOF\` Works:
1. While the input (\`A\`) is **True**, the output (\`Q\`) is **True** (the pump runs normally).
2. The instant the input (\`A\`) drops to **False** (the E-Stop is hit), the \`TOF\` starts an internal countdown clock!
3. The output (\`Q\`) **stays True** during the countdown (holding the cooling pump energized).
4. Only after the full duration expires (e.g., 3.0 seconds) does the pump finally de-energize.

Test this staged behavior in **Stage 2** below:`
    },
    {
      type: 'lab',
      title: 'Stage 2: Staged Off-Delay Cooling via TOF',
      step: 'Stage 2 of 3',
      height: 480,
      dsl: LAB2_DSL
    },
    {
      type: 'callout',
      variant: 'success',
      title: 'Interactive Exercise — Stage 2',
      text: 'Press the "E-Stop Mushroom PB (NC)" button. Notice that the Chemical Feed Valve shuts immediately (0 sec), but the Cooling Circulation Pump remains ACTIVE! Watch the timer hold the pump running for 3 seconds of safe post-trip cooling before gracefully turning off.'
    },
    {
      type: 'markdown',
      content: `## Stage 3: Controlled Flare Venting & The Anti-Restart Latch

In pressurized chemical or gas systems, shutting valves is only half the battle. Trapped pressure must be safely routed to the **flare stack** through a Blowdown Valve (\`BDV-101\`).

However, opening a high-pressure vent valve at the exact millisecond a pipe bursts can cause violent pressure shockwaves or extinguish flare pilot flames. Therefore:
1. **At T = 0.0s:** Raw feed valve (\`XV-101\`) shuts immediately.
2. **At T = 1.0s:** Blowdown vent valve (\`BDV-101\`) opens via a short \`TON\` delay, safely depressurizing the vessel to the flare header.
3. **From T = 0 to 4.0s:** Cooling pump (\`P-101\`) runs on via \`TOF\` to dissipate reaction heat.
4. **The Anti-Restart Latch (\`RS_LATCH\`):** If someone twists or pulls the red mushroom button to reset it, the plant **must NEVER jump back to life on its own**! An \`RS_LATCH\` locks the shutdown in memory until a deliberate, separate "Master Safety Reset" button is pressed by a trained operator.

Below is the complete **Stage 3** production-grade ESD circuit:`
    },
    {
      type: 'lab',
      title: 'Stage 3: Controlled Flare Vent & Latched Safety Train',
      step: 'Stage 3 of 3',
      height: 560,
      dsl: LAB3_DSL
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'Interactive Exercise — Stage 3',
      text: '1. Click "E-Stop Mushroom PB" to trip the system. Notice that the Feed Valve shuts instantly, the Alarm sounds, the Cooling Pump keeps running for 4.0s, and after a 1.0s pause, the Flare Blowdown Vent opens!\\n2. Now pull the E-Stop back out (untoggle it). Notice that the plant does NOT restart—the alarm stays latched!\\n3. Click "Master Safety Reset PB" to clear the memory and restore the line.'
    },
    {
      type: 'markdown',
      content: `## Commissioning & Proof-Testing Checklist

When verifying an Emergency Shutdown (ESD) loop on an industrial skid, follow these 5 core proof-testing rules:

1. **Test Broken Wire Detection:** Disconnect one terminal wire from the E-Stop switch while the machine is running. The open circuit must immediately trigger a fail-safe shutdown.
2. **Verify Cooldown Run-On Time:** Use a stopwatch to confirm the cooling pump runs for the full duration specified on the Process & Instrumentation Diagram (P&ID) after an ESD trip.
3. **Verify Anti-Restart Memory:** Trip the E-Stop, release the button, and confirm that no valve or pump energizes until the operator presses the physical reset button.
4. **Inspect Spring-Return Valves:** Confirm that all fail-safe valves (\`XV-101\`, \`BDV-101\`) mechanically move to their fail-safe positions if 24VDC instrument power or compressed air header pressure is lost.
5. **Audible & Visual Evacuation:** Confirm the high-decibel siren and high-visibility flashing strobe illuminate immediately upon trip, alerting plant personnel to clear the skid area.

---

### Key Takeaways for Automation Beginners

- **De-Energize to Trip:** Always use Normally Closed (NC) contacts for emergency devices so a severed wire safely stops the machine.
- **Cooling Run-On (\`TOF\`):** Use off-delay timers to carry away residual heat and prevent costly bearing seizures.
- **Staged Venting (\`TON\`):** Depressurize vessels into flare or scrubber headers in an engineered, orderly sequence.
- **Latch the Trip (\`RS_LATCH\`):** Releasing an E-Stop mushroom button must NEVER restart a machine without a separate manual reset.`
    }
  ]
};

// 1. Write JSON file to automationhub-masterclasses
const jsonPath = path.resolve('automationhub-masterclasses', 'emergency-shutdown-sequence.json');
fs.writeFileSync(jsonPath, JSON.stringify(masterclassData, null, 2), 'utf-8');
console.log('Saved:', jsonPath);

// Also copy to parent
const parentJsonPath = path.resolve('..', 'automationhub-masterclasses', 'emergency-shutdown-sequence.json');
try {
  fs.writeFileSync(parentJsonPath, JSON.stringify(masterclassData, null, 2), 'utf-8');
  console.log('Saved:', parentJsonPath);
} catch (e) {
  console.warn('Parent write skipped');
}

// 2. Generate Python script
const pyCode = `#!/usr/bin/env python3
"""
Emergency Shutdown Sequence (ESD) - Masterclass Generator
Compiles the complete beginner-friendly masterclass for staged ESD shutdowns,
TOF cooldown timers, and flare blowdown depressurization.
"""

import json
import os

DATA = ${JSON.stringify(masterclassData, null, 2)}

def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_file = os.path.join(out_dir, "emergency-shutdown-sequence.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(DATA, f, indent=2)
    print(f"Exported masterclass to {out_file}")

if __name__ == "__main__":
    main()
`;

const pyPath = path.resolve('automationhub-masterclasses', 'generate_esd_delays.py');
fs.writeFileSync(pyPath, pyCode, 'utf-8');
console.log('Saved:', pyPath);

const parentPyPath = path.resolve('..', 'automationhub-masterclasses', 'generate_esd_delays.py');
try {
  fs.writeFileSync(parentPyPath, pyCode, 'utf-8');
  console.log('Saved:', parentPyPath);
} catch (e) {
  console.warn('Parent py write skipped');
}

console.log('All ESD Masterclass assets successfully generated!');
