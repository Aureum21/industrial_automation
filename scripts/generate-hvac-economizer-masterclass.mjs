import fs from 'fs';
import path from 'path';
import { HVAC_ECONOMIZER_SVG, HVAC_ECONOMIZER_SVG_DATA_URI } from '../src/lib/hvacBlueprintSvg.ts';

const LAB1_DSL = `circuit "Stage 1: The Naive Outside Air Comparator" version 1 {
  oat: ANALOG_INPUT(label="Outdoor Air Temp (°F)", value=62)
  rat: ANALOG_INPUT(label="Return Air Temp (°F)", value=74)
  callCool: INPUT(label="Thermostat Call for Cooling", value=true)
  comp: ANALOG_COMPARATOR(operation="lt")
  damperLogic: AND()
  damper: OUTPUT(label="Open Fresh Air Damper 100%")
  notEconomize: NOT()
  compLogic: AND()
  compressor: OUTPUT(label="Run AC Compressor")

  oat.Q -> comp.A
  rat.Q -> comp.B
  comp.Q -> damperLogic.A
  callCool.Q -> damperLogic.B
  damperLogic.Q -> damper.A

  comp.Q -> notEconomize.A
  notEconomize.Q -> compLogic.A
  callCool.Q -> compLogic.B
  compLogic.Q -> compressor.A
}
`;

const LAB2_DSL = `circuit "Stage 2: Safe Economizer Window & Min Vent Damper" version 1 {
  oat: ANALOG_INPUT(label="Outdoor Air Temp (°F)", value=58)
  rat: ANALOG_INPUT(label="Return Air Temp (°F)", value=74)
  minOat: ANALOG_INPUT(label="Low Limit Cutoff (°F)", value=50)
  callCool: INPUT(label="Thermostat Call for Cooling", value=true)
  minPos: ANALOG_INPUT(label="Min Fresh Air Damper %", value=15)
  maxPos: ANALOG_INPUT(label="Full Economizer Damper %", value=100)

  isCooler: ANALOG_COMPARATOR(operation="lt")
  isNotTooCold: ANALOG_COMPARATOR(operation="gt")
  econWindow: AND()
  econActive: AND()
  damperMux: ANALOG_MUX()
  damperOutput: ANALOG_OUTPUT(label="Damper Actuator Position (%)")

  freeCoolLamp: OUTPUT(label="Free Cooling Active (No Compressor)")
  notEcon: NOT()
  compGate: AND()
  compressor: OUTPUT(label="Run AC Compressor")

  oat.Q -> isCooler.A
  rat.Q -> isCooler.B
  oat.Q -> isNotTooCold.A
  minOat.Q -> isNotTooCold.B

  isCooler.Q -> econWindow.A
  isNotTooCold.Q -> econWindow.B

  econWindow.Q -> econActive.A
  callCool.Q -> econActive.B

  minPos.Q -> damperMux.A
  maxPos.Q -> damperMux.B
  econActive.Q -> damperMux.S
  damperMux.Q -> damperOutput.A

  econActive.Q -> freeCoolLamp.A

  econActive.Q -> notEcon.A
  notEcon.Q -> compGate.A
  callCool.Q -> compGate.B
  compGate.Q -> compressor.A
}
`;

const LAB3_DSL = `circuit "Stage 3: Full Economizer with Freeze-Stat Trip" version 1 {
  fanRunning: INPUT(label="Supply Fan Running", value=true)
  callCool: INPUT(label="Thermostat Call for Cooling", value=true)
  oat: ANALOG_INPUT(label="Outdoor Air Temp (°F)", value=56)
  rat: ANALOG_INPUT(label="Return Air Temp (°F)", value=74)
  minOat: ANALOG_INPUT(label="Low Limit Economizer (°F)", value=50)

  freezeTrip: INPUT(label="FZT-101 Freeze-Stat Capillary Trip", value=false)
  alarmReset: INPUT(label="Manual Alarm Reset PB", value=false)

  minPos: ANALOG_INPUT(label="Min Position 15%", value=15)
  maxPos: ANALOG_INPUT(label="Max Position 100%", value=100)
  zeroPos: ANALOG_INPUT(label="Damper Zero %", value=0)

  freezeAlarm: RS_LATCH(label="Freeze-Stat Trip Memory")
  freezeSafe: NOT(label="Freeze Protection Healthy")

  isCooler: ANALOG_COMPARATOR(operation="lt")
  isNotTooCold: ANALOG_COMPARATOR(operation="gt")
  econPermissive: AND()
  econDemand: AND()
  econActive: AND()

  normalDamperMux: ANALOG_MUX()
  finalDamperMux: ANALOG_MUX()
  damperCommand: ANALOG_OUTPUT(label="Damper Actuator Position (%)")

  freeCoolLamp: OUTPUT(label="Free Cooling Active (Compressor Off)")
  alarmLamp: OUTPUT(label="COIL FREEZE ALARM - DAMPERS SHUT")

  compPermissive: AND()
  notEcon: NOT()
  compDemand: AND()
  compFinal: AND(label="Compressor Final Permissive")
  compressorRun: OUTPUT(label="DX Compressor Command")

  freezeTrip.Q -> freezeAlarm.S
  alarmReset.Q -> freezeAlarm.R
  freezeAlarm.Q -> freezeSafe.A
  freezeAlarm.Q -> alarmLamp.A

  oat.Q -> isCooler.A
  rat.Q -> isCooler.B
  oat.Q -> isNotTooCold.A
  minOat.Q -> isNotTooCold.B

  isCooler.Q -> econPermissive.A
  isNotTooCold.Q -> econPermissive.B

  econPermissive.Q -> econDemand.A
  callCool.Q -> econDemand.B

  econDemand.Q -> econActive.A
  freezeSafe.Q -> econActive.B
  econActive.Q -> freeCoolLamp.A

  minPos.Q -> normalDamperMux.A
  maxPos.Q -> normalDamperMux.B
  econActive.Q -> normalDamperMux.S

  zeroPos.Q -> finalDamperMux.A
  normalDamperMux.Q -> finalDamperMux.B
  freezeSafe.Q -> finalDamperMux.S
  finalDamperMux.Q -> damperCommand.A

  fanRunning.Q -> compPermissive.A
  freezeSafe.Q -> compPermissive.B

  econActive.Q -> notEcon.A
  notEcon.Q -> compDemand.A
  callCool.Q -> compDemand.B

  compDemand.Q -> compFinal.A
  compPermissive.Q -> compFinal.B
  compFinal.Q -> compressorRun.A
}
`;

// Export JSON file for studio
const masterclassData = {
  slug: 'hvac-economizer',
  title: 'HVAC Economizer Logic: Free Cooling, Damper Control & Freeze-Stat Safety',
  excerpt: 'A beginner-friendly guide to commercial building climate control: harnessing free outside air to slash electricity bills, modulating fresh air dampers, and interlocking low-limit freeze-stats to protect hydronic coils.',
  author: 'Dave Climate & AutomationHub Team',
  date: 'Oct 21',
  readingTime: '12 min read + 15 min labs',
  tag: 'HVAC / Climate',
  views: 9420,
  heroImage: '/hvac-economizer-blueprint.png',
  sections: [
    {
      type: 'image',
      src: HVAC_ECONOMIZER_SVG_DATA_URI,
      caption: 'FIG 1.1 // ROOFTOP AIR HANDLING UNIT (AHU) ECONOMIZER & AIRFLOW SCHEMATIC',
      alt: 'Rooftop AHU economizer damper and sensor layout'
    },
    {
      type: 'markdown',
      content: `## The $4,200 Power Bill & The Burst Copper Pipe

Imagine driving home on a crisp 58°F (14°C) autumn evening. Inside your car, the afternoon sun made the cabin uncomfortably warm. What do you do?

Do you turn on the high-power refrigerated air conditioning compressor, burning extra gasoline? **Of course not.** You simply roll down your window and let the cool evening breeze freshen the car for free!

In commercial facilities—such as corporate offices, schools, and shopping centers—this intuitive concept is called the **HVAC Economizer Cycle** or **"Free Cooling"**. Air handling units (AHUs) draw in cool outdoor air instead of running energy-hungry mechanical chillers and compressors, cutting annual commercial cooling bills by **up to 40%**.

> **The Costly Field Disaster:**
> In November at a regional community college, maintenance noticed the campus electric bill had spiked by over $4,200. During inspection, technicians discovered that the rooftop fresh air damper (\`OAD-101\`) was rusted shut at 10%. The building's DX air conditioning compressor had been running continuously even while outdoor temperatures hovered at a chilly 54°F!
> 
> To "fix" it, a junior technician wedged the damper 100% open. Two nights later, an unseasonal cold snap plunged outside temperatures to 24°F (-4°C). The Arctic air blew straight into the mixing plenum, freezing the hot-water heating coil solid. The copper pipes ruptured under hydrostatic ice pressure, flooding three classrooms with water.
> 
> **The Lesson:** Economizers save massive energy, but they require **safe upper and lower limits** and **fail-safe low-limit freeze-stat interlocks** to avoid physical building catastrophe.`
    },
    {
      type: 'markdown',
      content: `## Understanding the 3 Main Dampers & Air Streams

Before diving into the logic circuits, let's understand the physical anatomy of an Air Handling Unit (AHU):

1. **Outdoor Air Damper (OAD):** Modulates from 0% to 100% to admit outside fresh air.
2. **Return Air Damper (RAD):** Recirculates conditioned air already inside the building to preserve warmth or coolness.
3. **Exhaust / Relief Air Damper (EAD):** Lets excess stale air escape to prevent over-pressurizing the building like an over-inflated balloon.

\`\`\`
   [Outdoor Air (OAT)] ──► [OAD Damper] ──┐
                                          ├──► [Mixing Plenum (MAT)] ──► [Filters] ──► [Coils] ──► [Supply Fan] ──► Building
   [Building Return]  ───► [RAD Damper] ──┘
          │
          └──► [EAD Relief] ──► Outside
\`\`\`

When the Economizer activates:
- The **Outside Damper opens** to 100%.
- The **Return Damper closes** proportionally.
- The **Exhaust Damper opens** to exhaust stale room air.`
    },
    {
      type: 'markdown',
      content: `## Stage 1: The Naive Outside Air Comparator (The Freeze Hazard)

A common beginner mistake is writing a simple single-line rule:
\`\`\`
IF (Outside_Temp < Return_Temp) AND Call_For_Cooling THEN
    Open_Fresh_Air_Damper = 100%
    AC_Compressor = OFF
ELSE
    AC_Compressor = ON
\`\`\`

Below is **Stage 1** of our interactive lab. An \`ANALOG_COMPARATOR\` evaluates whether Outside Temp is lower than Return Temp. Try testing it below:`
    },
    {
      type: 'lab',
      title: 'Stage 1: The Naive Outside Air Comparator',
      step: 'Stage 1 of 3',
      height: 480,
      dsl: LAB1_DSL
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'The Beginner Flaw in Stage 1',
      text: 'In the lab above, change Outdoor Air Temp to 25°F (-4°C). Notice that "Open Fresh Air Damper 100%" stays ON! Because 25°F is indeed less than 74°F, the simple logic blindfolded the system into blasting sub-freezing air directly over the hydronic water coils, risking pipe bursts and severe tenant discomfort!'
    },
    {
      type: 'markdown',
      content: `## Stage 2: The Safe Economizer Window & Minimum Fresh Air Position

To fix the naive comparator, real-world Building Automation Systems (BAS) implement two fundamental rules:

1. **The Safe Economizer Window (Sweet Spot):** Free cooling should only be allowed if outdoor air is cooler than room air **AND** warm enough to enter safely (typically **above 50°F / 10°C**). If outside is below 50°F, outdoor air must be tempered with return air!
2. **Minimum Ventilation Damper Position:** Even when outside air is freezing cold or boiling hot, human occupants require fresh oxygen to breathe and dilute indoor CO2 levels (per building codes like ASHRAE 62.1). Therefore, the damper must **never fully close during occupied hours**—it must maintain a minimum opening (typically **15%**).

We implement this in **Stage 2** using an \`ANALOG_MUX\` (Analog Multiplexer):
- When Free Cooling is **OFF**: Damper commands to **15% (Minimum Ventilation)**.
- When Free Cooling is **ACTIVE**: Damper opens to **100% (Full Free Cooling)**.`
    },
    {
      type: 'lab',
      title: 'Stage 2: Safe Economizer Window & Min Vent Damper',
      step: 'Stage 2 of 3',
      height: 520,
      dsl: LAB2_DSL
    },
    {
      type: 'callout',
      variant: 'success',
      title: 'Interactive Exercise — Stage 2',
      text: 'Observe Damper Actuator Position (%): At 58°F, the green "Free Cooling Active" lamp is lit and the damper is at 100% with the compressor OFF (saving electricity!). Now adjust Outdoor Air Temp down to 45°F. Notice how Free Cooling shuts off, the compressor stays off (since outside is cold), and the damper safely relaxes to 15% minimum ventilation!'
    },
    {
      type: 'markdown',
      content: `## Stage 3: Low-Limit Freeze-Stat (FZT-101) & Complete Safety Interlocks

What happens if an actuator motor breaks, a linkage snaps, or a blizzard strikes while the damper is open? 

In commercial HVAC, rotating machinery and water coils are protected by a dedicated **Freeze-Stat (\`FZT-101\`)**. This is a 20-foot vapor-filled copper capillary tube woven in a serpentine grid across the entire face of the heating and cooling coils. 

If **any 12-inch section** of the capillary tube drops below **38°F (3.3°C)**, the internal diaphragm trips an electrical switch:
1. **Spring-Returns Dampers to 0%:** Overrides all logic to slam the outdoor damper completely shut.
2. **Trips the Supply Fan OFF:** Prevents drawing freezing air through the ruptured coil.
3. **Latches a Safety Alarm:** Holds the unit safely shut down until a certified technician physically inspects the unit and presses the manual reset button.

Below is the complete **Stage 3** production-grade AHU Economizer circuit:`
    },
    {
      type: 'lab',
      title: 'Stage 3: Full Economizer with Freeze-Stat Trip',
      step: 'Stage 3 of 3',
      height: 560,
      dsl: LAB3_DSL
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'Interactive Exercise — Stage 3',
      text: 'In Stage 3 above, the unit is happily free-cooling with 100% outdoor air. Now simulate a sudden frost or stuck damper by toggling "FZT-101 Freeze-Stat Capillary Trip" to TRUE. Notice how the RS Latch immediately locks into alarm: the damper drops to 0%, free cooling shuts off, and the compressor is locked out! Even after the trip clears, the alarm stays latched until you click "Manual Alarm Reset PB".'
    },
    {
      type: 'markdown',
      content: `## Commissioning & Field Checkout Checklist

When commissioning an air handling unit economizer on a commercial rooftop, follow this 5-point field checkout:

1. **Verify Minimum Position:** With the supply fan running and cooling disabled, use an inclinometer or direct measurement to verify the damper blades sit exactly at the designed minimum ventilation position (10% to 15%).
2. **Test Actuator Spring Return:** Kill main 24VAC control power to the damper actuator. Verify the mechanical internal spring snaps the outdoor air damper completely closed (0%) in under 15 seconds.
3. **Calibrate Temperature Sensors:** Cross-check the Outdoor Air Sensor (\`TE-101\`) and Return Air Sensor (\`TE-102\`) with a calibrated digital thermometer. A 2°F drift can waste thousands of kilowatt-hours per season.
4. **Physically Test the Freeze-Stat:** Use freeze spray on the capillary tube of \`FZT-101\`. Verify that the safety circuit trips, shuts the outdoor air damper, and requires a physical manual reset.
5. **Inspect Exhaust Damper Relief:** Ensure the barometric or motorized relief damper opens freely when outdoor air is at 100%, preventing building over-pressurization and whistling exterior doors.

---

### Key Takeaways for Automation Beginners

- **Free Cooling:** Using outdoor air when cooler than indoor air saves up to 40% in AC power costs.
- **The Sweet Spot:** Never economize below 50°F (10°C) without mixed air preheating.
- **Minimum Ventilation:** Buildings always require a minimum fresh air opening (10–15%) for occupant health.
- **Freeze-Stats Save Coils:** A mechanical low-limit switch (\`FZT-101\`) is non-negotiable on any unit exposed to freezing ambient climates.`
    }
  ]
};

// 1. Write JSON file to automationhub-masterclasses
const jsonPath = path.resolve('automationhub-masterclasses', 'hvac-economizer-logic.json');
fs.writeFileSync(jsonPath, JSON.stringify(masterclassData, null, 2), 'utf-8');
console.log('Saved:', jsonPath);

// Also copy to parent
const parentJsonPath = path.resolve('..', 'automationhub-masterclasses', 'hvac-economizer-logic.json');
try {
  fs.writeFileSync(parentJsonPath, JSON.stringify(masterclassData, null, 2), 'utf-8');
  console.log('Saved:', parentJsonPath);
} catch (e) {
  console.warn('Parent write skipped');
}

// 2. Generate Python script
const pyCode = `#!/usr/bin/env python3
"""
HVAC Economizer Logic - Masterclass Generator
Compiles the complete beginner-friendly masterclass for HVAC free cooling,
minimum ventilation dampers, and low-limit freeze-stat protection.
"""

import json
import os

DATA = ${JSON.stringify(masterclassData, null, 2)}

def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_file = os.path.join(out_dir, "hvac-economizer-logic.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(DATA, f, indent=2)
    print(f"Exported masterclass to {out_file}")

if __name__ == "__main__":
    main()
`;

const pyPath = path.resolve('automationhub-masterclasses', 'generate_hvac_economizer.py');
fs.writeFileSync(pyPath, pyCode, 'utf-8');
console.log('Saved:', pyPath);

const parentPyPath = path.resolve('..', 'automationhub-masterclasses', 'generate_hvac_economizer.py');
try {
  fs.writeFileSync(parentPyPath, pyCode, 'utf-8');
  console.log('Saved:', parentPyPath);
} catch (e) {
  console.warn('Parent py write skipped');
}

console.log('All HVAC Economizer assets successfully generated!');
