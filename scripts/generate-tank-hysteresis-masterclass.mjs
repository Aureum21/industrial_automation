import fs from 'fs';
import path from 'path';

const tank_svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" role="img" aria-labelledby="t d">
  <title id="t">Industrial Process Vessel Level Hysteresis and Schmitt Trigger Control</title>
  <desc id="d">Functional P&amp;ID of a 50,000-gallon buffer tank with continuous level radar LT-201, Schmitt trigger hysteresis deadband, anti-slosh low-pass filter, and redundant LSHH/LSLL hardwired cutouts.</desc>
  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0 0L8 4L0 8Z" fill="#227b92"/>
    </marker>
    <marker id="arr-amber" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0 0L8 4L0 8Z" fill="#bd7b24"/>
    </marker>
    <marker id="arr-red" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0 0L8 4L0 8Z" fill="#b91c1c"/>
    </marker>
    <linearGradient id="waterGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#227b92" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.2"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="560" rx="18" fill="#f3f6f8"/>

  <g font-family="Arial,sans-serif" fill="#142c3d">
    <text x="38" y="42" font-size="24" font-weight="bold">04 / INDUSTRIAL PROCESS VESSEL LEVEL HYSTERESIS &amp; SCHMITT TRIGGER</text>
    <text x="38" y="70" font-size="15">Dual-Threshold Deadband, Wave Slosh Filtering &amp; NEMA MG 1 Motor Protection Architecture</text>
  </g>

  <rect x="38" y="100" width="340" height="390" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <rect x="50" y="112" width="316" height="26" rx="4" fill="#e8f4f8"/>
  <text x="208" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c" text-anchor="middle">BUFFER VESSEL TK-201 (50,000 GAL)</text>

  <rect x="65" y="155" width="220" height="270" rx="14" fill="#ffffff" stroke="#23495c" stroke-width="3"/>
  <rect x="68" y="275" width="214" height="147" rx="6" fill="url(#waterGrad)"/>
  <path d="M68 275 Q 120 270, 175 275 T 282 275" fill="none" stroke="#227b92" stroke-width="3"/>

  <line x1="68" y1="175" x2="282" y2="175" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="290" y="179" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#dc2626">92% LSHH (Trip)</text>

  <line x1="68" y1="205" x2="282" y2="205" stroke="#bd7b24" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="290" y="209" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#bd7b24">80% Stop Fill</text>

  <line x1="68" y1="265" x2="282" y2="265" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
  <text x="290" y="269" font-family="Arial,sans-serif" font-size="9" fill="#64748b">50% Setpoint (Naive)</text>

  <line x1="68" y1="335" x2="282" y2="335" stroke="#059669" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="290" y="339" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#059669">20% Start Fill</text>

  <line x1="68" y1="385" x2="282" y2="385" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="290" y="389" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#dc2626">8% LSLL (Inhibit)</text>

  <circle cx="175" cy="140" r="14" fill="#f8fafc" stroke="#23495c" stroke-width="2"/>
  <text x="175" y="144" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#142c3d" text-anchor="middle">LT</text>
  <path d="M175 154 v15" stroke="#23495c" stroke-width="2"/>
  <text x="175" y="125" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#227b92" text-anchor="middle">LT-201 (RADAR)</text>

  <circle cx="95" cy="140" r="12" fill="#fef2f2" stroke="#b91c1c" stroke-width="2"/>
  <text x="95" y="144" font-family="Arial,sans-serif" font-size="8" font-weight="bold" fill="#b91c1c" text-anchor="middle">HH</text>

  <path d="M175 425 v35 h-95" fill="none" stroke="#227b92" stroke-width="4" marker-end="url(#arr)"/>
  <text x="75" y="475" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#227b92">FCV-202 (Drain Outflow)</text>

  <rect x="405" y="100" width="380" height="390" rx="12" fill="#ffffff" stroke="#0f766e" stroke-width="2.5" stroke-dasharray="5 5"/>
  <rect x="420" y="112" width="350" height="26" rx="4" fill="#ccfbf1"/>
  <text x="595" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0f766e" text-anchor="middle">PLC CONTROL CABINET // HYSTERESIS LOGIC</text>

  <rect x="430" y="155" width="330" height="70" rx="8" fill="#f0fdfa" stroke="#0d9488" stroke-width="1.5"/>
  <text x="595" y="178" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#134e4a" text-anchor="middle">1.5s LOW-PASS FILTER (ANTI-SLOSH)</text>
  <text x="595" y="196" font-family="Arial,sans-serif" font-size="11" fill="#0f766e" text-anchor="middle">&alpha; = &Delta;t / (&tau; + &Delta;t) &bull; Exponential Moving Average</text>
  <text x="595" y="214" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#059669" text-anchor="middle">Eliminates surface ripples, splashing &amp; echo transients</text>

  <rect x="430" y="240" width="330" height="110" rx="8" fill="#f8fafc" stroke="#23495c" stroke-width="1.5"/>
  <text x="595" y="262" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#142c3d" text-anchor="middle">SCHMITT TRIGGER HYSTERESIS ENGINE</text>
  <text x="595" y="282" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#059669" text-anchor="middle">&bull; Level &le; 20%: Latch Fill Command ON</text>
  <text x="595" y="300" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#bd7b24" text-anchor="middle">&bull; Level &ge; 80%: Reset Fill Command OFF</text>
  <text x="595" y="320" font-family="Arial,sans-serif" font-size="11" fill="#475569" text-anchor="middle">&bull; Between 20% &amp; 80%: Retain Previous Output (Deadband)</text>
  <text x="595" y="338" font-family="Courier,monospace" font-size="11" font-weight="bold" fill="#0f766e" text-anchor="middle">Hysteresis Width &Delta;H = 80% &minus; 20% = 60%</text>

  <rect x="430" y="365" width="330" height="65" rx="8" fill="#fef2f2" stroke="#b91c1c" stroke-width="1.5"/>
  <text x="595" y="388" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">NEMA MG 1 ANTI-SHORT-CYCLING</text>
  <text x="595" y="406" font-family="Arial,sans-serif" font-size="10" fill="#7f1d1d" text-anchor="middle">Prevents contactor flutter &bull; Max 3&ndash;4 starts/hr rating</text>
  <text x="595" y="420" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#991b1b" text-anchor="middle">LSHH overflow trip and dry-well LSLL lockout gates</text>

  <path d="M189 140 h216" fill="none" stroke="#bd7b24" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#arr-amber)"/>
  <text x="300" y="132" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#bd7b24">4-20 mA LT-201</text>

  <path d="M95 128 v-15 h345 v255" fill="none" stroke="#b91c1c" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#arr-red)"/>
  <text x="240" y="105" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b91c1c">Hardwired High-High Trip</text>

  <rect x="815" y="100" width="345" height="390" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <rect x="830" y="112" width="315" height="26" rx="4" fill="#e8f4f8"/>
  <text x="987" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c" text-anchor="middle">PUMP STATION &amp; MCC 480V TRAIN</text>

  <rect x="835" y="160" width="145" height="100" rx="8" fill="#f8fafc" stroke="#23495c" stroke-width="2"/>
  <text x="907" y="185" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#142c3d" text-anchor="middle">CONTACTOR M-201</text>
  <text x="907" y="205" font-family="Arial,sans-serif" font-size="11" fill="#0f766e" text-anchor="middle">3-Phase 480V AC</text>
  <text x="907" y="228" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b91c1c" text-anchor="middle">Overload OL-201 OK</text>
  <text x="907" y="248" font-family="Arial,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">Silver-Alloy Tips</text>

  <circle cx="1070" cy="210" r="38" fill="#f8fafc" stroke="#23495c" stroke-width="2.5"/>
  <path d="M1050 230 v-40 l40 20 Z" fill="#227b92"/>
  <text x="1070" y="265" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#142c3d" text-anchor="middle">PUMP P-201</text>
  <text x="1070" y="282" font-family="Arial,sans-serif" font-size="11" fill="#64748b" text-anchor="middle">75 kW / 100 HP</text>

  <path d="M1010 320 v30 l20 -15 Z M1030 320 v30" fill="none" stroke="#23495c" stroke-width="2"/>
  <text x="1025" y="310" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#142c3d" text-anchor="middle">NRV-201</text>

  <path d="M1070 172 v-45 h-740 v28" fill="none" stroke="#227b92" stroke-width="4" marker-end="url(#arr)"/>
  <text x="640" y="122" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#227b92">Pressurized Inflow Pipe (1200 GPM)</text>

  <path d="M760 300 h75" fill="none" stroke="#bd7b24" stroke-width="2.5" marker-end="url(#arr-amber)"/>
  <text x="797" y="292" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#bd7b24">PUMP_CMD</text>

  <g font-family="Arial,sans-serif" font-size="13" fill="#294758">
    <text x="40" y="520">Solid Cyan: Process Inflow/Outflow Lines (3000 GPM) | Dashed Amber: 4–20 mA Level Transmitter &amp; Contactor Coils (24V DC)</text>
    <text x="40" y="542">Dashed Red: Hardwired High-High / Low-Low Overrides | Deadband of 60% guarantees motor stays within thermal start limits.</text>
  </g>
</svg>`;

const dsl1 = `circuit "Stage 1 - The Naive Single-Setpoint Flaw" version 1 {
  level: ANALOG_INPUT(label="Raw Tank Level %", value=50)
  setpoint: ANALOG_CONSTANT(label="Threshold Setpoint 50%", params.value=50)
  comp: ANALOG_COMPARATOR(label="Naive Comparator (< 50%)", operation="lt")
  cycle_edge: R_TRIG()
  chatter_counter: COUNTER(label="Motor Starts Count", limit=100)
  pump: OUTPUT(label="Pump Motor Command (UNSTABLE)")

  level.Q -> comp.A
  setpoint.Q -> comp.B
  comp.Q -> pump.A
  comp.Q -> cycle_edge.A
  cycle_edge.Q -> chatter_counter.CU
}`;

const dsl2 = `circuit "Stage 2 - Hysteresis Band (Schmitt Trigger)" version 1 {
  level: ANALOG_INPUT(label="Tank Level %", value=50)
  diff: ANALOG_DIFFERENTIAL(label="Schmitt Trigger (20% to 80%)", onThreshold=20, offThreshold=80)
  pump: OUTPUT(label="Fill Pump Motor Command")
  low_mark: ANALOG_CONSTANT(label="20% Low Ref", params.value=20)
  high_mark: ANALOG_CONSTANT(label="80% High Ref", params.value=80)
  in_deadband: AND(label="In Hysteresis Deadband")
  above_low: ANALOG_COMPARATOR(operation="gt")
  below_high: ANALOG_COMPARATOR(operation="lt")
  deadband_lamp: OUTPUT(label="Operating Inside Deadband")

  level.Q -> diff.A
  diff.Q -> pump.A
  level.Q -> above_low.A
  low_mark.Q -> above_low.B
  level.Q -> below_high.A
  high_mark.Q -> below_high.B
  above_low.Q -> in_deadband.A
  below_high.Q -> in_deadband.B
  in_deadband.Q -> deadband_lamp.A
}`;

const dsl3 = `circuit "Stage 3 - Closed-Loop Storage Tank with Dynamic Hysteresis" version 1 {
  permit: INPUT(label="System Permissive & Breaker Healthy", value=true)
  targetEmpty: ANALOG_CONSTANT(label="Gravity Drain Target", params.value=0)
  targetFull: ANALOG_CONSTANT(label="Pump Inflow Target", params.value=100)
  startLevel: ANALOG_CONSTANT(label="Start Threshold (20%)", params.value=20)
  stopLevel: ANALOG_CONSTANT(label="Stop Threshold (80%)", params.value=80)
  hiHiLimit: ANALOG_CONSTANT(label="High-High Cutout (92%)", params.value=92)
  loLoLimit: ANALOG_CONSTANT(label="Low-Low Dry Alarm (8%)", params.value=8)

  tankTarget: ANALOG_MUX()
  tankLevel: ANALOG_RAMP(label="Physical Vessel Level", riseRate=7, fallRate=4)
  filter: ANALOG_FILTER(label="Surface Wave Filter", timeConstant=1000)

  needsFill: ANALOG_COMPARATOR(operation="lte")
  isFull: ANALOG_COMPARATOR(operation="gte")
  isHiHi: ANALOG_COMPARATOR(operation="gte")
  isLoLo: ANALOG_COMPARATOR(operation="lte")

  hiHiNot: NOT()
  permitTrip: AND()
  stopFill: OR()
  fillDemand: RS_LATCH(label="Hysteresis Memory (Reset Priority)")
  pumpEnable: AND()

  pump: OUTPUT(label="P-201 Fill Pump Motor")
  hiHiAlarm: OUTPUT(label="LSHH-201 High-High Alarm")
  loLoAlarm: OUTPUT(label="LSLL-201 Low-Low Dry Run Alarm")
  levelGauge: ANALOG_OUTPUT(label="Vessel Level LT-201 %")
  filteredGauge: ANALOG_OUTPUT(label="Smoothed Level %")

  pumpEnable.Q -> tankTarget.S
  targetEmpty.Q -> tankTarget.A
  targetFull.Q -> tankTarget.B
  tankTarget.Q -> tankLevel.A
  tankLevel.Q -> levelGauge.A
  tankLevel.Q -> filter.A
  filter.Q -> filteredGauge.A

  filter.Q -> needsFill.A
  startLevel.Q -> needsFill.B
  filter.Q -> isFull.A
  stopLevel.Q -> isFull.B
  tankLevel.Q -> isHiHi.A
  hiHiLimit.Q -> isHiHi.B
  tankLevel.Q -> isLoLo.A
  loLoLimit.Q -> isLoLo.B

  isHiHi.Q -> hiHiAlarm.A
  isLoLo.Q -> loLoAlarm.A

  isHiHi.Q -> hiHiNot.A
  permit.Q -> permitTrip.A
  hiHiNot.Q -> permitTrip.B

  isFull.Q -> stopFill.A
  isHiHi.Q -> stopFill.B

  needsFill.Q -> fillDemand.S
  stopFill.Q -> fillDemand.R

  fillDemand.Q -> pumpEnable.A
  permitTrip.Q -> pumpEnable.B
  pumpEnable.Q -> pump.A
}`;

const svgDataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(tank_svg);

const articleData = {
  slug: "tank-hysteresis",
  title: "The 40-Second Motor Burnout: Tank Level Hysteresis, Schmitt Triggers & Anti-Short-Cycling",
  excerpt: "A deep masterclass on process vessel level control: diagnosing why single-threshold comparators cause catastrophic contactor chattering, implementing mathematical hysteresis bands with Schmitt triggers, and building dynamic closed-loop tank models with surface slosh filtering.",
  author: "John Doe & AutomationHub Engineering",
  date: "Oct 19",
  readingTime: "18 min read + 20 min labs",
  tag: "Control Systems",
  views: 16840,
  heroImage: svgDataUri,
  sections: [
    {
      type: "image",
      src: svgDataUri,
      alt: "Industrial Process Vessel Level Hysteresis and Schmitt Trigger Control P&ID",
      caption: "FIG 1.1 // PROCESS VESSEL LEVEL HYSTERESIS & SCHMITT TRIGGER: DUAL-THRESHOLD DEADBAND & NEMA MG 1 PROTECTION ARCHITECTURE"
    },
    {
      type: "markdown",
      content: `## 1. The 40-Second Motor Burnout & The Welded Contactor

At 03:14 AM on a frigid November night inside a commercial beverage bottling and pasteurization plant, a pungent chemical stench of charred epoxy and vaporized copper filled the motor control center (MCC). Seconds later, the main 480V substation feeder breaker tripped on instantaneous magnetic overcurrent, plunging the entire packaging line into total blackout.

The culprit was the primary 75 kW (100 HP) centrifugal pump (\`P-201\`) feeding a 50,000-gallon raw water buffer vessel (\`TK-201\`). When electricians unbolted the enclosure of motor starter contactor \`M-201\`, they found the silver-cadmium contacts burned into molten spheres and permanently welded shut. The motor windings had reached temperatures exceeding 240°C, destroying the Class H insulation and shorting all three phases directly to ground.

During the root-cause investigation, controls engineers pulled the PLC program archive. A junior automation technician had implemented the tank filling routine using a single naive analog comparator:

\`\`\`pascal
// NAIVE TANK FILL LOGIC - DO NOT USE IN PRODUCTION
IF Tank_Level_LT201 < 50.0 THEN
    Pump_Cmd := TRUE;
ELSE
    Pump_Cmd := FALSE;
END_IF;
\`\`\`

The incoming city water feed was turbulent, and the liquid surface suffered continuous 2-inch ripples from an adjacent agitator. As the tank filled to exactly 50.0%, the radar level transmitter (\`LT-201\`) dithered between 49.9% and 50.1% every 300 to 500 milliseconds.

In less than 12 minutes, the 480V contactor slammed open and closed over **1,400 times**. The motor inrush current ($6\\times$ to $8\\times$ full load amperage) never subsided. Heat accumulated in the copper stator windings exponentially faster than the cooling fan could dissipate it, incinerating a $14,000 motor and causing $85,000 in unscheduled downtime.`
    },
    {
      type: "callout",
      variant: "warning",
      title: "Physical Hazards: Contactor Contact Welding & NEMA Motor Start Limits",
      text: "Standard 3-phase induction motors are thermally rated according to NEMA MG 1 and IEC 60034. Large motors (above 50 HP) must NEVER be started more than 3 to 4 times per hour from cold, or 2 times per hour from hot running temperature! A single-threshold comparator causes destructive 'contactor chattering' that welds contactor tips shut, burns motor coils, and propagates acoustic water hammer shockwaves throughout piping networks."
    },
    {
      type: "markdown",
      content: `## 2. Engineering Theory: Schmitt Triggers, Deadband Sizing & Fluid Slosh Dynamics

To stop rapid chattering, control engineers implement **Hysteresis** (also known as a **Schmitt Trigger** or **Differential Gap**). Instead of a single switching point, the control algorithm defines two discrete, separated thresholds:

1. **Lower Threshold ($H_{\\text{start}}$):** Turn the pump ON when level drops below **20%**.
2. **Upper Threshold ($H_{\\text{stop}}$):** Turn the pump OFF when level reaches **80%**.
3. **Deadband ($\\Delta H$):** Between 20% and 80%, the controller **holds its previous state**. No switching can occur inside the deadband!

### Sizing the Hysteresis Deadband vs. Vessel Geometry

The time required to complete one full fill-drain cycle ($t_{\\text{cycle}}$) is a direct mathematical function of the deadband volume:

$$\\Delta V = A_{\\text{tank}} \\times \\Delta H = A_{\\text{tank}} \\times (H_{\\text{stop}} - H_{\\text{start}})$$

$$t_{\\text{fill}} = \\frac{\\Delta V}{Q_{\\text{pump}} - Q_{\\text{drain}}}, \\quad t_{\\text{drain}} = \\frac{\\Delta V}{Q_{\\text{drain}}}$$

$$t_{\\text{cycle}} = t_{\\text{fill}} + t_{\\text{drain}} = \\Delta V \\left( \\frac{Q_{\\text{pump}}}{Q_{\\text{drain}} (Q_{\\text{pump}} - Q_{\\text{drain}})} \\right)$$

For a 50,000-gallon vessel with a 1,200 GPM pump and a 400 GPM average process draw:
- With a naive 0.2% ripple at 50%: $\\Delta V = 100\\text{ gal} \\implies t_{\\text{cycle}} = 18.7\\text{ seconds}$ (**192 starts/hour &mdash; fatal!**)
- With a 60% hysteresis band (20% to 80%): $\\Delta V = 30,000\\text{ gal} \\implies t_{\\text{cycle}} = 5,625\\text{ seconds} \\approx 1.56\\text{ hours}$ (**0.64 starts/hour &mdash; rock solid!**)

### Comparison of Liquid Level Control Architectures

| Control Architecture | Complexity | Noise Immunity | Starts Per Hour | Primary Failure Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Naive Single-Point Comparator** | Trivial ($1$ block) | Zero (Severe Chatter) | $>500$ starts/hr | Welded contactors, motor stator burnout, water hammer |
| **Fixed Hysteresis (Schmitt Trigger)** | Low ($1$ block) | Excellent (Within Deadband) | $0.5$–$2$ starts/hr | Large liquid level swings in tight buffer tanks |
| **Filtered Hysteresis + Safety Alarms** | Industrial Grade | Impervious (Filters Wave Echoes) | Strictly bounded | Requires dual independent hardwired safety switches (LSHH/LSLL) |`
    },
    {
      type: "markdown",
      content: `## 3. Stage 1: The Naive Single-Setpoint Flaw (Destructive Short-Cycling)

Examine the Stage 1 circuit below. It implements the exact naive boolean comparison that destroyed the bottling plant's motor:
\`level.Q -> comp.A (operation=\"lt\")\` with \`setpoint = 50%\`.

We have wired an edge trigger (\`R_TRIG\`) into a \`COUNTER\` block to record every time the motor contactor is energized.`
    },
    {
      type: "lab",
      title: "Stage 1: The Naive Single-Setpoint Flaw",
      step: "Stage 1 of 3",
      height: 520,
      dsl: dsl1
    },
    {
      type: "callout",
      variant: "error",
      title: "Interactive Exercise — Stage 1 (Simulating Destructive Chatter)",
      text: "In Stage 1 above, click on Raw Tank Level % (currently 50%). Change it to 49%—the pump turns ON and the counter records 1 start. Now change it to 51% (pump turns OFF), then 49% (pump turns ON), then 50%... Notice how every tiny fluctuation around 50% pulses the motor starter! In a turbulent tank with surface ripples, this produces dozens of contactor arcs per minute, destroying mechanical contacts and overheating the motor windings."
    },
    {
      type: "markdown",
      content: `## 4. Stage 2: Dual Threshold Hysteresis with ANALOG_DIFFERENTIAL (Schmitt Trigger)

To solve short-cycling once and for all, Stage 2 introduces the **ANALOG_DIFFERENTIAL** functional block. It features independent turn-on and turn-off thresholds:
- \`onThreshold = 20\`: When the tank level drops down to or below 20%, the block turns its output \`Q\` to TRUE (starts the fill pump).
- \`offThreshold = 80\`: When the tank level rises up to or above 80%, the block turns its output \`Q\` to FALSE (shuts the fill pump off).
- **The Deadband:** While the level is anywhere between 20% and 80%, the block retains its existing state.

Watch the **Operating Inside Deadband** lamp below:`
    },
    {
      type: "lab",
      title: "Stage 2: Hysteresis Band (Schmitt Trigger)",
      step: "Stage 2 of 3",
      height: 520,
      dsl: dsl2
    },
    {
      type: "callout",
      variant: "info",
      title: "Interactive Exercise — Stage 2 (Testing the Deadband Window)",
      text: "In Stage 2 above:\n1. Click on Tank Level % and drop the level down to 18%. Notice that Fill Pump Motor Command turns ON!\n2. Now raise the level to 35%, then 50%, then 75%. Notice the pump stays solidly ENERGIZED throughout the deadband!\n3. Now raise the level to 82%: the pump instantly shuts OFF!\n4. Now lower the level back to 70%, then 50%, then 30%: the pump stays reliably DE-ENERGIZED until you drop below 20%! Contactor chattering is mathematically impossible."
    },
    {
      type: "markdown",
      content: `## 5. Stage 3: Closed-Loop Dynamic Storage Tank with Wave Slosh Filter & Safety Alarms

In real-world process vessels, liquid is continuously consumed by downstream equipment while the pump delivers pressurized inflow. Furthermore, incoming fluid creates surface sloshing, splashing, and acoustic radar echo noise.

Stage 3 couples a dynamic physical vessel with industrial signal conditioning:
1. **Dynamic Plant Model (\`ANALOG_RAMP\` + \`ANALOG_MUX\`):** When the pump is ON, inflow exceeds outflow (level rises at 7%/s). When the pump is OFF, gravity drain empties the tank at 4%/s.
2. **First-Order Low-Pass Filter (\`ANALOG_FILTER\`):** Uses an exponential moving average with time constant $\\tau = 1,000\\text{ ms}$ to eliminate turbulence before feeding the Schmitt trigger.
3. **Safety Protection Permissives:**
   - **High-High Limit (\`LSHH-201\` at 92%):** Independent trip gate that immediately de-energizes the pump contactor if fluid nears tank overflow.
   - **Low-Low Dry-Run Alarm (\`LSLL-201\` at 8%):** Warns operators of suction well starvation to protect downstream impellers from cavitation.

Press **▶ Run** below to start the continuous dynamic simulation:`
    },
    {
      type: "lab",
      title: "Stage 3: Closed-Loop Storage Tank with Dynamic Hysteresis",
      step: "Stage 3 of 3",
      height: 650,
      dsl: dsl3
    },
    {
      type: "callout",
      variant: "success",
      title: "Interactive Exercise — Stage 3 (Dynamic Cycling & High-High Trips)",
      text: "In Stage 3 above:\n1. Press ▶ Run. Watch the tank level smoothly oscillate between 20% and 80% in a continuous, automated triangular cycle. Notice the Smoothed Level % lags raw surface ripples cleanly.\n2. Open the Logic Analyzer at the bottom to view the analog ramps and clean digital pump square wave.\n3. Test the Safety Interlock: Toggle 'System Permissive & Breaker Healthy' to OFF while the pump is running—notice the pump drops out immediately regardless of water level!"
    },
    {
      type: "markdown",
      content: `## 6. Commissioning Checklist & Plant Floor Level Sensor Proof Testing

Before commissioning any automated tank filling, lift station, or chemical dosing system, verify these field rules:

1. **Calculate Minimum Deadband from Motor Nameplate:** Verify the motor's rated maximum starts per hour with the manufacturer ($f_{\\max}$). Ensure the volume deadband $\\Delta V$ guarantees $t_{\\text{cycle}} \\ge 3600 / f_{\\max}$ under worst-case peak inflow and minimum gravity consumption.
2. **Instrument Stilling Well Verification:** Ultrasonic and radar transmitters must be mounted inside a vertical, perforated **stilling well** (or bypass bridle) if the vessel has mechanical agitation, turbulent top-filling nozzles, or boiling liquids.
3. **Damping Parameter Alignment:** Configure transmitter internal damping ($2$ to $5$ seconds) to suppress physical surface ripples before transmitting 4–20 mA signals to the analog input card.
4. **Independent High-High Float Switches (LSHH):** Never rely solely on an analog transmitter for overflow prevention. A physical magnetic float or tuning fork switch must be hardwired directly into the motor starter safety circuit.
5. **Fail-Safe Signal Behavior (NAMUR NE 43):** Ensure that sensor wire break ($<3.6\\text{ mA}$) or short circuit ($>21.0\\text{ mA}$) causes the PLC to immediately default to a safe state (stop filling pump, trigger operator diagnostic alarm).
6. **Quarterly Contactor Tip Inspection:** Periodically unbolt MCC starter covers and inspect silver-alloy contact tips for pitting, carbon buildup, or signs of contact chatter arcing.`
    }
  ]
};

const pythonScript = `import json
from pathlib import Path
from textwrap import dedent
from urllib.parse import quote

OUT = Path(__file__).resolve().parent

def md(text): return {'type': 'markdown', 'content': dedent(text).strip()}
def note(title, text, variant='info'): return {'type': 'callout', 'variant': variant, 'title': title, 'text': text}
def lab(n, title, dsl): return {'type': 'lab', 'title': title, 'step': f'Stage {n} of 3', 'height': 650 if n == 3 else 520, 'dsl': dedent(dsl).strip()}
def image(svg, alt, caption): return {'type': 'image', 'src': 'data:image/svg+xml;charset=utf-8,' + quote(svg, safe=''), 'alt': alt, 'caption': caption}

tank_svg = '''${tank_svg}'''

dsl1 = '''${dsl1}'''
dsl2 = '''${dsl2}'''
dsl3 = '''${dsl3}'''

article = {
    'slug': 'tank-hysteresis',
    'title': 'The 40-Second Motor Burnout: Tank Level Hysteresis, Schmitt Triggers & Anti-Short-Cycling',
    'excerpt': 'A deep masterclass on process vessel level control: diagnosing why single-threshold comparators cause catastrophic contactor chattering, implementing mathematical hysteresis bands with Schmitt triggers, and building dynamic closed-loop tank models with surface slosh filtering.',
    'author': 'John Doe & AutomationHub Engineering',
    'date': 'Oct 19',
    'readingTime': '18 min read + 20 min labs',
    'tag': 'Control Systems',
    'views': 16840,
    'heroImage': 'data:image/svg+xml;charset=utf-8,' + quote(tank_svg, safe=''),
    'sections': [
        image(tank_svg, 'Industrial Process Vessel Level Hysteresis and Schmitt Trigger Control P&ID', 'FIG 1.1 // PROCESS VESSEL LEVEL HYSTERESIS & SCHMITT TRIGGER: DUAL-THRESHOLD DEADBAND & NEMA MG 1 PROTECTION ARCHITECTURE'),
        md('''
        ## 1. The 40-Second Motor Burnout & The Welded Contactor

        At 03:14 AM on a frigid November night inside a commercial beverage bottling and pasteurization plant, a pungent chemical stench of charred epoxy and vaporized copper filled the motor control center (MCC). Seconds later, the main 480V substation feeder breaker tripped on instantaneous magnetic overcurrent, plunging the entire packaging line into total blackout.

        The culprit was the primary 75 kW (100 HP) centrifugal pump (\`P-201\`) feeding a 50,000-gallon raw water buffer vessel (\`TK-201\`). When electricians unbolted the enclosure of motor starter contactor \`M-201\`, they found the silver-cadmium contacts burned into molten spheres and permanently welded shut. The motor windings had reached temperatures exceeding 240°C, destroying the Class H insulation and shorting all three phases directly to ground.

        During the root-cause investigation, controls engineers pulled the PLC program archive. A junior automation technician had implemented the tank filling routine using a single naive analog comparator:

        \`\`\`pascal
        // NAIVE TANK FILL LOGIC - DO NOT USE IN PRODUCTION
        IF Tank_Level_LT201 < 50.0 THEN
            Pump_Cmd := TRUE;
        ELSE
            Pump_Cmd := FALSE;
        END_IF;
        \`\`\`

        The incoming city water feed was turbulent, and the liquid surface suffered continuous 2-inch ripples from an adjacent agitator. As the tank filled to exactly 50.0%, the radar level transmitter (\`LT-201\`) dithered between 49.9% and 50.1% every 300 to 500 milliseconds.

        In less than 12 minutes, the 480V contactor slammed open and closed over **1,400 times**. The motor inrush current ($6\\times$ to $8\\times$ full load amperage) never subsided. Heat accumulated in the copper stator windings exponentially faster than the cooling fan could dissipate it, incinerating a $14,000 motor and causing $85,000 in unscheduled downtime.
        '''),
        note('Physical Hazards: Contactor Contact Welding & NEMA Motor Start Limits', 'Standard 3-phase induction motors are thermally rated according to NEMA MG 1 and IEC 60034. Large motors (above 50 HP) must NEVER be started more than 3 to 4 times per hour from cold, or 2 times per hour from hot running temperature! A single-threshold comparator causes destructive contactor chattering that welds contactor tips shut, burns motor coils, and propagates acoustic water hammer shockwaves throughout piping networks.', 'warning'),
        md('''
        ## 2. Engineering Theory: Schmitt Triggers, Deadband Sizing & Fluid Slosh Dynamics

        To stop rapid chattering, control engineers implement **Hysteresis** (also known as a **Schmitt Trigger** or **Differential Gap**). Instead of a single switching point, the control algorithm defines two discrete, separated thresholds:

        1. **Lower Threshold ($H_{\\\\text{start}}$):** Turn the pump ON when level drops below **20%**.
        2. **Upper Threshold ($H_{\\\\text{stop}}$):** Turn the pump OFF when level reaches **80%**.
        3. **Deadband ($\\\\Delta H$):** Between 20% and 80%, the controller **holds its previous state**. No switching can occur inside the deadband!

        ### Sizing the Hysteresis Deadband vs. Vessel Geometry

        The time required to complete one full fill-drain cycle ($t_{\\\\text{cycle}}$) is a direct mathematical function of the deadband volume:

        $$\\\\Delta V = A_{\\\\text{tank}} \\\\times \\\\Delta H = A_{\\\\text{tank}} \\\\times (H_{\\\\text{stop}} - H_{\\\\text{start}})$$

        $$t_{\\\\text{fill}} = \\\\frac{\\\\Delta V}{Q_{\\\\text{pump}} - Q_{\\\\text{drain}}}, \\\\quad t_{\\\\text{drain}} = \\\\frac{\\\\Delta V}{Q_{\\\\text{drain}}}$$

        $$t_{\\\\text{cycle}} = t_{\\\\text{fill}} + t_{\\\\text{drain}} = \\\\Delta V \\\\left( \\\\frac{Q_{\\\\text{pump}}}{Q_{\\\\text{drain}} (Q_{\\\\text{pump}} - Q_{\\\\text{drain}})} \\\\right)$$

        For a 50,000-gallon vessel with a 1,200 GPM pump and a 400 GPM average process draw:
        - With a naive 0.2% ripple at 50%: $\\\\Delta V = 100\\\\text{ gal} \\\\implies t_{\\\\text{cycle}} = 18.7\\\\text{ seconds}$ (**192 starts/hour &mdash; fatal!**)
        - With a 60% hysteresis band (20% to 80%): $\\\\Delta V = 30,000\\\\text{ gal} \\\\implies t_{\\\\text{cycle}} = 5,625\\\\text{ seconds} \\\\approx 1.56\\\\text{ hours}$ (**0.64 starts/hour &mdash; rock solid!**)
        '''),
        md('''
        ## 3. Stage 1: The Naive Single-Setpoint Flaw (Destructive Short-Cycling)

        Examine the Stage 1 circuit below. It implements the exact naive boolean comparison that destroyed the bottling plant's motor:
        \`level.Q -> comp.A (operation=\"lt\")\` with \`setpoint = 50%\`.

        We have wired an edge trigger (\`R_TRIG\`) into a \`COUNTER\` block to record every time the motor contactor is energized.
        '''),
        lab(1, 'Stage 1: The Naive Single-Setpoint Flaw', dsl1),
        note('Interactive Exercise — Stage 1 (Simulating Destructive Chatter)', 'In Stage 1 above, click on Raw Tank Level % (currently 50%). Change it to 49%—the pump turns ON and the counter records 1 start. Now change it to 51% (pump turns OFF), then 49% (pump turns ON), then 50%... Notice how every tiny fluctuation around 50% pulses the motor starter! In a turbulent tank with surface ripples, this produces dozens of contactor arcs per minute, destroying mechanical contacts and overheating the motor windings.', 'error'),
        md('''
        ## 4. Stage 2: Dual Threshold Hysteresis with ANALOG_DIFFERENTIAL (Schmitt Trigger)

        To solve short-cycling once and for all, Stage 2 introduces the **ANALOG_DIFFERENTIAL** functional block. It features independent turn-on and turn-off thresholds:
        - \`onThreshold = 20\`: When the tank level drops down to or below 20%, the block turns its output \`Q\` to TRUE (starts the fill pump).
        - \`offThreshold = 80\`: When the tank level rises up to or above 80%, the block turns its output \`Q\` to FALSE (shuts the fill pump off).
        - **The Deadband:** While the level is anywhere between 20% and 80%, the block retains its existing state.
        '''),
        lab(2, 'Stage 2: Hysteresis Band (Schmitt Trigger)', dsl2),
        note('Interactive Exercise — Stage 2 (Testing the Deadband Window)', 'In Stage 2 above:\n1. Click on Tank Level % and drop the level down to 18%. Notice that Fill Pump Motor Command turns ON!\n2. Now raise the level to 35%, then 50%, then 75%. Notice the pump stays solidly ENERGIZED throughout the deadband!\n3. Now raise the level to 82%: the pump instantly shuts OFF!\n4. Now lower the level back to 70%, then 50%, then 30%: the pump stays reliably DE-ENERGIZED until you drop below 20%! Contactor chattering is mathematically impossible.', 'info'),
        md('''
        ## 5. Stage 3: Closed-Loop Dynamic Storage Tank with Wave Slosh Filter & Safety Alarms

        In real-world process vessels, liquid is continuously consumed by downstream equipment while the pump delivers pressurized inflow. Furthermore, incoming fluid creates surface sloshing, splashing, and acoustic radar echo noise.

        Stage 3 couples a dynamic physical vessel with industrial signal conditioning:
        1. **Dynamic Plant Model (\`ANALOG_RAMP\` + \`ANALOG_MUX\`):** When the pump is ON, inflow exceeds outflow (level rises at 7%/s). When the pump is OFF, gravity drain empties the tank at 4%/s.
        2. **First-Order Low-Pass Filter (\`ANALOG_FILTER\`):** Uses an exponential moving average with time constant $\\\\tau = 1,000\\\\text{ ms}$ to eliminate turbulence before feeding the Schmitt trigger.
        3. **Safety Protection Permissives:**
           - **High-High Limit (\`LSHH-201\` at 92%):** Independent trip gate that immediately de-energizes the pump contactor if fluid nears tank overflow.
           - **Low-Low Dry-Run Alarm (\`LSLL-201\` at 8%):** Warns operators of suction well starvation to protect downstream impellers from cavitation.
        '''),
        lab(3, 'Stage 3: Closed-Loop Storage Tank with Dynamic Hysteresis', dsl3),
        note('Interactive Exercise — Stage 3 (Dynamic Cycling & High-High Trips)', 'In Stage 3 above:\n1. Press ▶ Run. Watch the tank level smoothly oscillate between 20% and 80% in a continuous, automated triangular cycle. Notice the Smoothed Level % lags raw surface ripples cleanly.\n2. Open the Logic Analyzer at the bottom to view the analog ramps and clean digital pump square wave.\n3. Test the Safety Interlock: Toggle System Permissive & Breaker Healthy to OFF while the pump is running—notice the pump drops out immediately regardless of water level!', 'success'),
        md('''
        ## 6. Commissioning Checklist & Plant Floor Level Sensor Proof Testing

        Before commissioning any automated tank filling, lift station, or chemical dosing system, verify these field rules:

        1. **Calculate Minimum Deadband from Motor Nameplate:** Verify the motor's rated maximum starts per hour with the manufacturer ($f_{\\\\max}$). Ensure the volume deadband $\\\\Delta V$ guarantees $t_{\\\\text{cycle}} \\\\ge 3600 / f_{\\\\max}$ under worst-case peak inflow and minimum gravity consumption.
        2. **Instrument Stilling Well Verification:** Ultrasonic and radar transmitters must be mounted inside a vertical, perforated **stilling well** (or bypass bridle) if the vessel has mechanical agitation, turbulent top-filling nozzles, or boiling liquids.
        3. **Damping Parameter Alignment:** Configure transmitter internal damping ($2$ to $5$ seconds) to suppress physical surface ripples before transmitting 4–20 mA signals to the analog input card.
        4. **Independent High-High Float Switches (LSHH):** Never rely solely on an analog transmitter for overflow prevention. A physical magnetic float or tuning fork switch must be hardwired directly into the motor starter safety circuit.
        5. **Fail-Safe Signal Behavior (NAMUR NE 43):** Ensure that sensor wire break ($<3.6\\\\text{ mA}$) or short circuit ($>21.0\\\\text{ mA}$) causes the PLC to immediately default to a safe state (stop filling pump, trigger operator diagnostic alarm).
        6. **Quarterly Contactor Tip Inspection:** Periodically unbolt MCC starter covers and inspect silver-alloy contact tips for pitting, carbon buildup, or signs of contact chatter arcing.
        ''')
    ]
}

(OUT / 'tank-level-hysteresis.json').write_text(json.dumps(article, ensure_ascii=False, indent=2) + '\\n', encoding='utf-8')
print('Saved tank-level-hysteresis.json successfully!')
`;

// Save files
const targetJsonPath = path.resolve('automationhub-masterclasses', 'tank-level-hysteresis.json');
const targetPyPath = path.resolve('automationhub-masterclasses', 'generate_tank_hysteresis.py');
const parentJsonPath = path.resolve('..', 'automationhub-masterclasses', 'tank-level-hysteresis.json');
const parentPyPath = path.resolve('..', 'automationhub-masterclasses', 'generate_tank_hysteresis.py');

fs.writeFileSync(targetJsonPath, JSON.stringify(articleData, null, 2) + '\n', 'utf8');
fs.writeFileSync(targetPyPath, pythonScript, 'utf8');

if (fs.existsSync(path.resolve('..', 'automationhub-masterclasses'))) {
  fs.writeFileSync(parentJsonPath, JSON.stringify(articleData, null, 2) + '\n', 'utf8');
  fs.writeFileSync(parentPyPath, pythonScript, 'utf8');
}

console.log('Saved masterclass JSON to:', targetJsonPath);
console.log('Saved python generator to:', targetPyPath);
