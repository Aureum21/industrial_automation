import fs from 'fs';
import path from 'path';

const water_svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" role="img" aria-labelledby="t d"><title id="t">Intake station and receiving tank</title><desc id="d">A source sump feeds two parallel pumps through an open-proved isolation valve. Check valves join the receiving tank. Level feedback selects the duty pump. An independent high-high switch and suction-low switch inhibit pumping.</desc><defs><marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#227b92"/></marker></defs><rect width="1200" height="560" rx="18" fill="#f3f6f8"/><g font-family="Arial,sans-serif" fill="#142c3d"><text x="38" y="42" font-size="24" font-weight="bold">01 / INTAKE DUTY, PERMISSIVES AND TANK LEVEL</text><text x="38" y="70" font-size="15">Conceptual P&amp;ID — physical protection and PLC logic are separate layers</text></g><g fill="#fff" stroke="#23495c" stroke-width="3"><path d="M55 190v190h165V190"/><path d="M65 300h145" stroke="#227b92"/><circle cx="510" cy="220" r="43"/><circle cx="510" cy="355" r="43"/><path d="M490 239v-38l37 19Z M490 374v-38l37 19Z"/><rect x="845" y="185" width="210" height="220" rx="14"/><path d="M850 310h200" stroke="#227b92"/><path d="M302 264l25 20-25 20Z M352 264l-25 20 25 20Z"/></g><g fill="none" stroke="#227b92" stroke-width="5" marker-end="url(#arr)"><path d="M220 284h80"/><path d="M354 284h66V220h46"/><path d="M420 284v71h46"/><path d="M554 220h170v64h117"/><path d="M554 355h170v-71"/><path d="M1055 350h108"/></g><g fill="none" stroke="#23495c" stroke-width="2"><path d="M624 204v32l22-16Z M649 204v32 M624 339v32l22-16Z M649 339v32"/><circle cx="138" cy="165" r="32"/><path d="M138 197v100"/><circle cx="922" cy="128" r="31"/><path d="M922 159v27"/><circle cx="1010" cy="128" r="31"/><path d="M1010 159v27"/><rect x="320" y="100" width="400" height="60" rx="8"/></g><g fill="none" stroke="#bd7b24" stroke-width="2" stroke-dasharray="7 5"><path d="M170 165h95v-35h55 M720 130h171 M979 128h-25 M327 260v-100 M510 160v16 M570 160v152"/></g><g font-family="Arial,sans-serif" fill="#142c3d" text-anchor="middle"><text x="138" y="160" font-size="13">LSL-101</text><text x="138" y="178" font-size="11">suction OK</text><text x="135" y="415" font-size="17">TK-101 / source sump</text><text x="327" y="335" font-size="15">XV-101 / ZSO-101</text><text x="510" y="287" font-size="16">P-101A</text><text x="510" y="419" font-size="16">P-101B</text><text x="655" y="190" font-size="13">NRV-A</text><text x="655" y="400" font-size="13">NRV-B</text><text x="950" y="436" font-size="17">TK-102 / receiving tank</text><text x="922" y="133" font-size="13">LT-102</text><text x="1010" y="133" font-size="12">LSHH-102</text><text x="520" y="125" font-size="17">PLC / demand latch + duty selector</text><text x="520" y="147" font-size="12">Start 35% • stop 75% • independent HH inhibit</text></g><g font-family="Arial,sans-serif" font-size="15" fill="#294758"><text x="40" y="496">Blue: water flow →    Dashed amber: logical / instrument signals</text><text x="40" y="524">Duty alternation is not automatic fault substitution. Valve and motor feedback must be proved separately.</text></g></svg>`;

const water1 = `circuit "Intake 1 - Permissives clear the run memory" version 1 {
  start: INPUT(label="Start pulse - release after one scan", value=false)
  stopHealthy: NC_INPUT(label="Stop PB - press to stop", value=false)
  suctionOK: INPUT(label="LSL-101 suction water available", value=true)
  valveOpen: INPUT(label="ZSO-101 intake valve open proved", value=true)
  motorOK: INPUT(label="Motor overload healthy", value=true)
  wetPath: AND(label="Wet and open")
  permission: AND(label="Process permissive")
  notPermitted: NOT()
  stopRequest: NOT()
  resetRun: OR(label="Stop or lost permissive")
  validStart: AND()
  runMemory: RS_LATCH(label="Reset-priority run request")
  finalGate: AND()
  motor: OUTPUT(label="P-101A motor command")
  suctionOK.Q -> wetPath.A
  valveOpen.Q -> wetPath.B
  wetPath.Q -> permission.A
  motorOK.Q -> permission.B
  permission.Q -> notPermitted.A
  stopHealthy.Q -> stopRequest.A
  notPermitted.Q -> resetRun.A
  stopRequest.Q -> resetRun.B
  start.Q -> validStart.A
  permission.Q -> validStart.B
  validStart.Q -> runMemory.S
  resetRun.Q -> runMemory.R
  runMemory.Q -> finalGate.A
  permission.Q -> finalGate.B
  finalGate.Q -> motor.A
}`;

const water2 = `circuit "Intake 2 - Level band and cycle duty alternation" version 1 {
  level: ANALOG_INPUT(label="LT-102 level percent", value=55)
  low: ANALOG_CONSTANT(label="Start threshold percent", params.value=35)
  high: ANALOG_CONSTANT(label="Stop threshold percent", params.value=75)
  permit: INPUT(label="All intake process permissives healthy", value=true)
  needsFill: ANALOG_COMPARATOR(operation="lte")
  full: ANALOG_COMPARATOR(operation="gte")
  bad: NOT()
  stopFill: OR()
  fill: RS_LATCH(label="Fill demand - reset priority")
  duty: PULSE_RELAY(label="Next duty B when true")
  dutyA: NOT()
  enabled: AND()
  selectA: AND()
  selectB: AND()
  pumpA: OUTPUT(label="P-101A")
  pumpB: OUTPUT(label="P-101B")
  level.Q -> needsFill.A
  low.Q -> needsFill.B
  level.Q -> full.A
  high.Q -> full.B
  permit.Q -> bad.A
  bad.Q -> stopFill.A
  full.Q -> stopFill.B
  needsFill.Q -> fill.S
  stopFill.Q -> fill.R
  full.Q -> duty.A
  duty.Q -> dutyA.A
  fill.Q -> enabled.A
  permit.Q -> enabled.B
  enabled.Q -> selectA.A
  dutyA.Q -> selectA.B
  enabled.Q -> selectB.A
  duty.Q -> selectB.B
  selectA.Q -> pumpA.A
  selectB.Q -> pumpB.A
}`;

const water3 = `circuit "Intake 3 - Closed-loop tank and alternating duty" version 1 {
  permit: INPUT(label="Suction valve and both units healthy", value=true)
  startLevel: ANALOG_INPUT(label="Fill start percent", value=35)
  stopLevel: ANALOG_INPUT(label="Fill stop percent", value=75)
  outletLoad: ANALOG_INPUT(label="Extra outlet coefficient 0 to 0.5", value=0)
  targetEmpty: ANALOG_CONSTANT(label="Drain target", params.value=15)
  targetFull: ANALOG_CONSTANT(label="Fill target", params.value=95)

  needsFill: ANALOG_COMPARATOR(operation="lte")
  isFull: ANALOG_COMPARATOR(operation="gte")
  permitLost: NOT()
  stopFill: OR()
  fillDemand: RS_LATCH(label="Fill demand latch")

  dutyFlip: PULSE_RELAY(label="Alternate pump on full")
  dutyA: NOT()
  pumpEnable: AND()
  cmdA: AND()
  cmdB: AND()

  pumpA: OUTPUT(label="P-101A Duty Pump")
  pumpB: OUTPUT(label="P-101B Standby Pump")

  targetLevel: ANALOG_MUX()
  tankLevel: ANALOG_RAMP(riseRate=6, fallRate=4)
  levelDisplay: ANALOG_OUTPUT(label="TK-102 Level LT-102 %")
  dutyDisplay: OUTPUT(label="Next Duty: Pump B when ON")

  tankLevel.Q -> needsFill.A
  startLevel.Q -> needsFill.B
  tankLevel.Q -> isFull.A
  stopLevel.Q -> isFull.B

  permit.Q -> permitLost.A
  permitLost.Q -> stopFill.A
  isFull.Q -> stopFill.B

  needsFill.Q -> fillDemand.S
  stopFill.Q -> fillDemand.R

  isFull.Q -> dutyFlip.A
  dutyFlip.Q -> dutyA.A
  dutyFlip.Q -> dutyDisplay.A

  fillDemand.Q -> pumpEnable.A
  permit.Q -> pumpEnable.B

  pumpEnable.Q -> cmdA.A
  dutyA.Q -> cmdA.B
  cmdA.Q -> pumpA.A

  pumpEnable.Q -> cmdB.A
  dutyFlip.Q -> cmdB.B
  cmdB.Q -> pumpB.A

  fillDemand.Q -> targetLevel.S
  targetEmpty.Q -> targetLevel.A
  targetFull.Q -> targetLevel.B

  targetLevel.Q -> tankLevel.A
  tankLevel.Q -> levelDisplay.A
}`;

const svgDataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(water_svg);

const articleData = {
  slug: 'water-treatment',
  title: 'Building an Industrial Water Treatment Simulator: Intake Permissives, Basin Hysteresis & Automated Pump Alternation',
  excerpt: 'A comprehensive masterclass on municipal and industrial water treatment SCADA: diagnosing cavitation disasters, interlocking intake permissives, eliminating basin short-cycling with hysteresis, and automating pump duty alternation.',
  author: 'AutomationHub Editorial',
  date: '2026-10-18',
  readingTime: '20 min read + 25 min labs',
  tag: 'Process Control',
  views: 18450,
  heroImage: svgDataUri,
  sections: [
    {
      type: 'image',
      src: svgDataUri,
      alt: 'Intake station and receiving tank P&ID',
      caption: 'FIG 1.1 // PROCESS FLOW & P&ID OVERVIEW: INTAKE DUTY, PERMISSIVES AND TANK LEVEL'
    },
    {
      type: 'markdown',
      content: `## The Midnight Basin 3 Overflow & Mechanical Seal Blowout

At 2:40 AM during a torrential spring thunderstorm, the regional municipal water reclamation plant suffered an environmental disaster. The lead intake centrifugal pump (P-101A) suddenly started screaming with a deafening rattle that sounded like pumping gravel through a steel pipe.

Heavy debris had blinded the raw intake bar screens, starving the wet well. The suction pressure plummeted far below the vapor pressure of water, throwing the impeller into violent **cavitation**. Vapor bubbles imploded against the stainless steel vanes with shockwaves exceeding 10,000 PSI. Within ninety seconds, the mechanical seal shattered, spraying river water across the motor floor and tripping the 480V thermal overload.

To make matters worse, the downstream clarifier basin relied on a software polling loop rather than a dedicated hardware interlock. When the standby pump was manually kicked on by a panicked night-shift operator, the inlet valve was forced wide open into an already saturated sedimentation tank. By 3:15 AM, over 120,000 gallons of untreated wastewater had overflowed the weir into the adjacent municipal canal, drawing state environmental citations and hundreds of thousands of dollars in fines.`
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Physical Protection vs. PLC Software Permissives',
      text: 'Hardwired interlocks (emergency stop, dry-run float switches LSL-101, and motor thermal overloads) must act independently of PLC software logic. Never rely solely on software polls to protect rotating machinery from cavitation or tanks from environmental overflow.'
    },
    {
      type: 'markdown',
      content: `## Stage 1: Intake Permissives & Dry-Run Lockout

In industrial automation, there is a strict engineering distinction between an **Operational Permissive** and an **Interlock Trip**:

- **Permissive (Pre-Condition):** A set of criteria that must ALL be satisfied before a piece of equipment is allowed to start. For example: "Intake isolation valve ZSO-101 confirmed 100% open AND suction level switch LSL-101 confirmed submerged AND motor thermal overload healthy".
- **Interlock (Active Protection):** A condition that de-energizes the contactor immediately during operation if breached. If the suction well drains or the isolation valve drifts shut during pumping, the run request must drop instantly.

Below is Stage 1 of the simulation. We implement a fail-safe start/stop circuit using an \`RS_LATCH\` with reset priority. The Start command can only latch if all permissives are proved; any loss of permissive or Stop press immediately clears the run memory:`
    },
    {
      type: 'lab',
      step: 'Stage 1 of 3',
      title: 'Intake 1 - Permissives clear the run memory',
      dsl: water1,
      height: 520
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'Interactive Exercise — Stage 1',
      text: 'In Stage 1 above, click on Start pulse to energize Pump P-101A. The RS Latch holds the pump energized. Now toggle LSL-101 suction water available to OFF (dry suction). Notice how the lost permissive immediately forces a reset on the latch, killing motor command instantly! Try starting the pump while the intake valve ZSO-101 is closed—the permissive gate prevents any start command from passing.'
    },
    {
      type: 'markdown',
      content: `## Stage 2: Receiving Tank Level Band & Duty Alternation

Why do naive programmers burn out pump contactors in wastewater lift stations? Because they implement single-point setpoint logic:

\`\`\`
IF Tank_Level < 50% THEN Pump = ON
ELSE Pump = OFF
\`\`\`

Surface ripples and turbulence cause level transmitters (LT-102) to flutter between 49.9% and 50.1% dozens of times per minute. This causes rapid contactor chattering, excessive electrical arcing, and severe water hammer.

The correct methodology uses a wide **Hysteresis Band**:
- **Start threshold (Low Level):** 35%
- **Stop threshold (High Level):** 75%

When the tank level drains down to 35%, \`needsFill\` trips and latches the fill memory ON. The pump runs steadily until the tank reaches 75%, where \`full\` trips and resets the latch. Furthermore, to balance impeller and bearing wear across 24/7 operations, a bistable toggle (\`PULSE_RELAY\`) alternates the duty between **P-101A** and **P-101B** on every completed fill cycle!`
    },
    {
      type: 'lab',
      step: 'Stage 2 of 3',
      title: 'Intake 2 - Level band and cycle duty alternation',
      dsl: water2,
      height: 520
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'Interactive Exercise — Stage 2',
      text: 'In Stage 2 above, click LT-102 level percent. Change the level from 55% down to 30%—notice that Fill Demand engages and starts Duty Pump P-101A. Now raise the level to 50%—the pump continues running! Raise the level to 75%—the fill demand clears, and the duty toggle flips to Pump B! Lower the level back to 30%—watch Pump B take the next run cycle while Pump A rests!'
    },
    {
      type: 'markdown',
      content: `## Stage 3: Closed-Loop Dynamic Plant Simulation & Continuous Cycling

In this final stage, we close the loop with a real-time dynamic tank model. The simulation couples the PLC control logic with physical plant dynamics:

1. **Pump Inflow:** Active pumps deliver pressurized inflow to the receiving tank.
2. **Dynamic Gravity Drain:** Fluid continuously exits the tank to downstream process units.
3. **Continuous Duty Balancing:** As the tank fills and drains over time, the controller transitions between P-101A and P-101B automatically without human intervention.

Press **▶ Run** below to start the continuous dynamic simulation:`
    },
    {
      type: 'lab',
      step: 'Stage 3 of 3',
      title: 'Intake 3 - Closed-loop tank and alternating duty',
      dsl: water3,
      height: 650
    },
    {
      type: 'callout',
      variant: 'success',
      title: 'Interactive Exercise — Stage 3',
      text: 'Press ▶ Run. Watch the tank level steadily climb from 35% toward 75% driven by Pump P-101A. As soon as the level reaches 75%, Pump A shuts off, and the tank begins draining. Once the water drops back to 35%, watch Standby Pump P-101B automatically start up! Open the Logic Analyzer at the bottom to watch the square waves and level ramps record in real time!'
    },
    {
      type: 'markdown',
      content: `## Commissioning & Engineering Takeaways

- **Physical Permissives are Non-Negotiable:** Never issue a motor start command without proving open suction path and positive suction head.
- **Always Band Your Analog Thresholds:** Single-point hysteresis causes cavitation and destroys contactors. Maintain at least a 20–40% deadband between start and stop thresholds.
- **Duty Alternation Extends Mean-Time-Between-Failures (MTBF):** Automatic alternation balances mechanical seal wear and prevents bearing brinelling in idle equipment.
- **Hardware Interlocks Must Override Software:** Always wire independent high-high level switches (LSHH) directly into the motor control center (MCC) trip circuit.`
    }
  ]
};

// Write to both locations
const targetDirs = [
  path.resolve('automationhub-masterclasses'),
  path.resolve('..', 'automationhub-masterclasses')
];

for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, 'water-treatment.json');
  fs.writeFileSync(outPath, JSON.stringify(articleData, null, 2) + '\n', 'utf-8');
  console.log('Saved masterclass JSON to:', outPath);
}

// Also write a python script matching the user's request
const pyScript = `import json
from pathlib import Path
from urllib.parse import quote

OUT = Path(__file__).resolve().parent

data = ${JSON.stringify(articleData, null, 2)}

(OUT / "water-treatment.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\\n", encoding="utf-8")
print("Exported water-treatment.json successfully.")
`;

for (const dir of targetDirs) {
  const pyPath = path.join(dir, 'generate_water_treatment.py');
  fs.writeFileSync(pyPath, pyScript, 'utf-8');
  console.log('Saved python generator to:', pyPath);
}
