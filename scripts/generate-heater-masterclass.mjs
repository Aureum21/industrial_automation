import fs from 'fs';
import path from 'path';

const heater_svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" role="img" aria-labelledby="t d">
  <title id="t">Heater control and independent limit path</title>
  <desc id="d">Heater control schematic showing setpoint, TIC-101, PWM, SSR, heater, temperature feedback, and a separate high-temperature power isolation path.</desc>
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
  </defs>
  <rect width="1200" height="560" rx="18" fill="#f3f6f8"/>

  <g font-family="Arial,sans-serif" fill="#142c3d">
    <text x="38" y="42" font-size="24" font-weight="bold">02 / HEATER CONTROL &amp; INDEPENDENT LIMIT PATH</text>
    <text x="38" y="70" font-size="15">Functional Schematic — Closed-Loop PI, Time-Proportioned PWM &amp; Hardwired Thermal Cutout</text>
  </g>

  <rect x="38" y="100" width="670" height="180" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2" stroke-dasharray="4 4"/>
  <text x="52" y="125" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c">PLC / CONTROLLER BOUNDARY (TIC-101)</text>

  <rect x="58" y="150" width="110" height="90" rx="8" fill="#e8f4f8" stroke="#23495c" stroke-width="2"/>
  <text x="113" y="185" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#142c3d" text-anchor="middle">SETPOINT</text>
  <text x="113" y="208" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="#227b92" text-anchor="middle">SP = 60°C</text>
  <text x="113" y="226" font-family="Arial,sans-serif" font-size="11" fill="#5a7184" text-anchor="middle">Recipe Target</text>

  <rect x="220" y="140" width="220" height="110" rx="8" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <text x="330" y="165" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#142c3d" text-anchor="middle">TIC-101 / PI ENGINE</text>
  <text x="330" y="188" font-family="Arial,sans-serif" font-size="12" fill="#23495c" text-anchor="middle">e = SP − PV | Kp=4, Ki=0.1</text>
  <rect x="235" y="200" width="190" height="34" rx="4" fill="#e6f4ea" stroke="#137333" stroke-width="1.5"/>
  <text x="330" y="222" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#137333" text-anchor="middle">ANTI-WINDUP LIMITS: 0–100%</text>

  <rect x="490" y="140" width="190" height="110" rx="8" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <text x="585" y="165" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#142c3d" text-anchor="middle">PWM-101 / TIME PROP</text>
  <text x="585" y="188" font-family="Arial,sans-serif" font-size="12" fill="#23495c" text-anchor="middle">Period = 2,000 ms</text>
  <path d="M515 220 h20 v-18 h25 v18 h35 v-18 h25 v18 h20" fill="none" stroke="#227b92" stroke-width="2.5"/>

  <path d="M168 195 h52" fill="none" stroke="#bd7b24" stroke-width="2.5" marker-end="url(#arr-amber)"/>
  <path d="M440 195 h50" fill="none" stroke="#bd7b24" stroke-width="2.5" marker-end="url(#arr-amber)"/>

  <rect x="760" y="90" width="120" height="60" rx="8" fill="#fef2f2" stroke="#b91c1c" stroke-width="2"/>
  <text x="820" y="115" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#b91c1c" text-anchor="middle">SAFETY M-101</text>
  <text x="820" y="135" font-family="Arial,sans-serif" font-size="11" fill="#7f1d1d" text-anchor="middle">Emergency Contactor</text>

  <text x="760" y="55" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#142c3d">480V AC 3Φ MAINS</text>
  <path d="M790 60 v30" fill="none" stroke="#23495c" stroke-width="4"/>
  <path d="M820 60 v30" fill="none" stroke="#23495c" stroke-width="4"/>
  <path d="M850 60 v30" fill="none" stroke="#23495c" stroke-width="4"/>

  <path d="M820 150 v35" fill="none" stroke="#23495c" stroke-width="4"/>

  <rect x="750" y="185" width="140" height="90" rx="8" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <text x="820" y="210" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#142c3d" text-anchor="middle">SSR-101</text>
  <text x="820" y="230" font-family="Arial,sans-serif" font-size="12" fill="#5a7184" text-anchor="middle">Solid-State Relay</text>
  <text x="820" y="252" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#227b92" text-anchor="middle">Optically Isolated</text>

  <path d="M680 195 h70" fill="none" stroke="#bd7b24" stroke-width="2.5" stroke-dasharray="6 4" marker-end="url(#arr-amber)"/>
  <text x="715" y="185" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#bd7b24" text-anchor="middle">PWM</text>

  <path d="M820 275 v60" fill="none" stroke="#23495c" stroke-width="4" marker-end="url(#arr)"/>
  <text x="835" y="310" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c">Switched 480V</text>

  <rect x="680" y="335" width="280" height="160" rx="16" fill="#ffffff" stroke="#23495c" stroke-width="3"/>
  <rect x="700" y="355" width="240" height="120" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
  <text x="820" y="380" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="#142c3d" text-anchor="middle">JACKET VESSEL TK-101</text>
  <text x="820" y="405" font-family="Arial,sans-serif" font-size="12" fill="#475569" text-anchor="middle">Well-Mixed Liquid Chamber</text>

  <path d="M720 440 q15 -25 30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="#dc2626" stroke-width="3"/>
  <text x="820" y="465" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#dc2626" text-anchor="middle">HTR-101 Heating Elements</text>

  <rect x="695" y="500" width="250" height="24" rx="4" fill="#e2e8f0"/>
  <text x="820" y="516" font-family="Courier,monospace" font-size="11" fill="#1e293b" text-anchor="middle">30·dT/dt = 20 + 0.8u − L − T</text>

  <circle cx="510" cy="415" r="30" fill="#ffffff" stroke="#23495c" stroke-width="2.5"/>
  <text x="510" y="412" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#142c3d" text-anchor="middle">TT-101</text>
  <text x="510" y="428" font-family="Arial,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">RTD Sensor</text>

  <path d="M700 415 h-160" fill="none" stroke="#23495c" stroke-width="2.5"/>

  <path d="M480 415 h-200 v-165 h-25" fill="none" stroke="#bd7b24" stroke-width="2.5" stroke-dasharray="6 4" marker-end="url(#arr-amber)"/>
  <text x="290" y="360" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#bd7b24">PV Feedback (°C)</text>

  <circle cx="1070" cy="415" r="32" fill="#fef2f2" stroke="#b91c1c" stroke-width="2.5"/>
  <text x="1070" y="412" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">TSHH-101</text>
  <text x="1070" y="428" font-family="Arial,sans-serif" font-size="10" fill="#7f1d1d" text-anchor="middle">Cutout &gt;95°C</text>

  <path d="M940 415 h98" fill="none" stroke="#b91c1c" stroke-width="2.5"/>

  <path d="M1070 383 v-263 h-190" fill="none" stroke="#b91c1c" stroke-width="2.5" stroke-dasharray="7 5" marker-end="url(#arr-red)"/>
  <text x="1010" y="105" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#b91c1c" text-anchor="middle">HARDWIRED TRIP</text>

  <g font-family="Arial,sans-serif" font-size="13" fill="#294758">
    <text x="40" y="525">Thick Blue: 480V Electrical Power | Dashed Amber: Low-Voltage Analog/Digital Signals | Dashed Red: Hardwired Safety Interlock</text>
    <text x="40" y="545">Actuator saturation at 100% does not guarantee controller state bounds. Anti-windup clamping is required inside the PI algorithm.</text>
  </g>
</svg>`;

const heater_stage1 = `circuit "Stage 1 - Proportional Heater Demand" version 1 {
  sp: ANALOG_INPUT(label="Setpoint C", value=60)
  pv: ANALOG_INPUT(label="Measured Temperature C", value=20)
  error: MATH(label="SP minus PV", operation="subtract")
  proportional: ANALOG_AMPLIFIER(label="Kp 2 percent per C", gain=2, offset=0)
  zero: ANALOG_CONSTANT(value=0)
  full: ANALOG_CONSTANT(value=100)
  below_zero: ANALOG_COMPARATOR(label="Below zero", operation="lt")
  lower_limit: ANALOG_MUX(label="Clamp at zero")
  above_full: ANALOG_COMPARATOR(label="Above 100 percent", operation="gt")
  upper_limit: ANALOG_MUX(label="Clamp at 100")
  error_meter: ANALOG_OUTPUT(label="Error C")
  raw_meter: ANALOG_OUTPUT(label="Raw Demand percent")
  demand_meter: ANALOG_OUTPUT(label="Limited Demand percent")

  sp.Q -> error.A
  pv.Q -> error.B
  error.Q -> proportional.A
  error.Q -> error_meter.A
  proportional.Q -> raw_meter.A
  proportional.Q -> below_zero.A
  zero.Q -> below_zero.B
  below_zero.Q -> lower_limit.S
  proportional.Q -> lower_limit.A
  zero.Q -> lower_limit.B
  lower_limit.Q -> above_full.A
  full.Q -> above_full.B
  above_full.Q -> upper_limit.S
  lower_limit.Q -> upper_limit.A
  full.Q -> upper_limit.B
  upper_limit.Q -> demand_meter.A
}`;

const heater_stage2 = `circuit "Stage 2 - PI and PWM" version 1 {
  sp: ANALOG_INPUT(label="Setpoint C", value=60)
  pv: ANALOG_INPUT(label="Manual Temperature C", value=60)
  enabled: HIGH()
  controller: PID_CONTROLLER(label="PI with Internal Limits", kp=4, ki=0.1, kd=0, min=0, max=100)
  pwm: PWM(label="SSR Time Proportioning", period=2000)
  command: OUTPUT(label="SSR Command")
  demand: ANALOG_OUTPUT(label="Heater Demand percent")
  full: ANALOG_CONSTANT(value=100)
  at_limit: ANALOG_COMPARATOR(label="At Upper Limit", operation="gte")
  saturation_lamp: OUTPUT(label="Output Saturated High")

  sp.Q -> controller.SP
  pv.Q -> controller.PV
  enabled.Q -> controller.EN
  controller.CV -> pwm.A
  pwm.Q -> command.A
  controller.CV -> demand.A
  controller.CV -> at_limit.A
  full.Q -> at_limit.B
  at_limit.Q -> saturation_lamp.A
}`;

const heater_stage3 = `circuit "Stage 3 - Closed Loop Thermal Plant" version 1 {
  sp: ANALOG_INPUT(label="Setpoint C", value=60)
  tuning: ANALOG_INPUT(label="Gain Multiplier G", value=1)
  load: ANALOG_INPUT(label="Cooling Load Equivalent C", value=0)
  error: MATH(label="Actual SP minus PV", operation="subtract")
  scaled_error: MATH(label="Error times G", operation="multiply")
  zero: ANALOG_CONSTANT(value=0)
  enabled: HIGH()
  controller: PID_CONTROLLER(label="PI on Scaled Error", kp=4, ki=0.1, kd=0, min=0, max=100)
  heater_gain: ANALOG_AMPLIFIER(label="Temperature Rise from Power", gain=0.8, offset=0)
  net_heat: MATH(label="Heat minus Cooling Load", operation="subtract")
  plant: TRANSFER_FUNCTION(label="Jacket Thermal Inertia", gain=1, tau=30000)
  absolute_temperature: ANALOG_AMPLIFIER(label="Add Ambient 20 C", gain=1, offset=20)
  pwm: PWM(label="SSR Command Representation", period=2000)
  ssr: OUTPUT(label="SSR Command")
  temperature_meter: ANALOG_OUTPUT(label="TT101 Temperature C")
  setpoint_meter: ANALOG_OUTPUT(label="Actual Setpoint C")
  error_meter: ANALOG_OUTPUT(label="Actual Error C")
  demand_meter: ANALOG_OUTPUT(label="Heater Demand percent")
  full: ANALOG_CONSTANT(value=100)
  saturated: ANALOG_COMPARATOR(label="At Upper Limit", operation="gte")
  saturation_lamp: OUTPUT(label="Output Saturated High")

  sp.Q -> error.A
  absolute_temperature.Q -> error.B
  error.Q -> scaled_error.A
  tuning.Q -> scaled_error.B
  scaled_error.Q -> controller.SP
  zero.Q -> controller.PV
  enabled.Q -> controller.EN
  controller.CV -> heater_gain.A
  heater_gain.Q -> net_heat.A
  load.Q -> net_heat.B
  net_heat.Q -> plant.A
  plant.Q -> absolute_temperature.A
  controller.CV -> pwm.A
  pwm.Q -> ssr.A
  absolute_temperature.Q -> temperature_meter.A
  sp.Q -> setpoint_meter.A
  error.Q -> error_meter.A
  controller.CV -> demand_meter.A
  controller.CV -> saturated.A
  full.Q -> saturated.B
  saturated.Q -> saturation_lamp.A
}`;

const svgDataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(heater_svg);

const articleData = {
  slug: "industrial-heater-pi-pwm-anti-windup",
  title: "When 100% Heat Is Not Enough: PI Control, PWM, and Anti-Windup",
  excerpt: "Build an industrial heater controller in three interactive FBD labs: proportional demand, PI with PWM, and a closed-loop thermal plant with live tuning and saturation-recovery experiments.",
  author: "AutomationHub Editorial",
  date: "Oct 19",
  readingTime: "20 min read + 25 min labs",
  tag: "Process Control",
  views: 24190,
  heroImage: svgDataUri,
  sections: [
    {
      type: "markdown",
      content: `## 1. The $18,600 Batch That Kept Getting Hotter

At 02:17, the operator reduced the jacket-temperature setpoint from 90°C to 60°C. The heater output stayed at 100%.

For the previous warm-up period, the controller had been demanding more heat than the installed heater could deliver. Its integral term kept accumulating error. Now the temperature was above the new target, but the stored integral demand was still large enough to hold the output against its upper limit.

The jacket overshot the revised recipe temperature. Heat continued moving into the product, viscosity drifted outside the batch specification, and the shift stopped the line. The illustrative loss ledger was $12,000 of rejected material plus three hours of downtime at $2,200 per hour: $18,600 before cleanup.

This is a fictional commissioning scenario, with invented costs, built around a real control failure mechanism. It is not a report of a documented plant incident.

The mistake was treating a bounded output as proof of a bounded controller state. Limiting the displayed command to 100% does not, by itself, stop an integrator from winding up. Anti-windup must account for actuator saturation inside the control algorithm.`
    },
    {
      type: "image",
      src: svgDataUri,
      alt: "Heater control schematic showing setpoint, TIC-101, PWM, SSR, heater, temperature feedback, and a separate high-temperature power isolation path.",
      caption: "FIG 1.1 // HEATER CONTROL AND INDEPENDENT LIMIT PATH — FUNCTIONAL SCHEMATIC, NOT A CONSTRUCTION P&ID"
    },
    {
      type: "markdown",
      content: `## 2. The Technical Blueprint: Follow the Heat, Then Follow the Signal

Our process is an electrically heated, well-mixed jacket represented by one measured temperature. HTR-101 supplies heat. TT-101 measures temperature. TIC-101 compares that measurement with the operator's setpoint and produces a 0–100% demand. PWM-101 converts that demand into a repeating ON/OFF signal for SSR-101.

The diagram also shows an independent high-temperature limit and a power contactor. These belong in the physical protection design; they are not implemented by the three instructional control circuits.

### Tags, units, and the model boundary

| Tag or variable | Meaning | Laboratory value |
| :--- | :--- | :--- |
| SP | Requested jacket temperature | 60°C initially |
| TT-101 / PV | Measured jacket temperature | Generated by the plant in Stage 3 |
| TIC-101 / u | Heater demand | 0–100%; 50 means 50%, not 0.50 |
| PWM-101 | Time-proportioning period | 2,000 ms |
| SSR-101 | Solid-state power-switch command | Digital ON/OFF indicator |
| Tₐ | Ambient reference | 20°C |
| K | Steady-state temperature rise per output percentage point | 0.8°C/% |
| τ | First-order thermal time constant | 30,000 ms = 30 s |
| L | Additional heat-removal disturbance, expressed as an equivalent temperature reduction | 0°C initially |

The teaching plant follows:

\`\`\`
30 × dT/dt = 20 + 0.8u − L − T
\`\`\`

At steady state, \`T = 20 + 0.8u − L\`. With no additional load, 50% output holds 60°C and 100% output approaches 100°C. A request for 110°C is therefore unreachable.

The 30-second time constant makes the lesson quick to run; it is not a claimed value for an industrial vessel. This model omits transport delay, separate heater and product temperatures, sensor lag, changing heat-transfer coefficients, and temperature-dependent losses. It teaches controller behavior, not product-temperature qualification.

For a fixed 50% open-loop command, zero load, and an initial temperature of 20°C, the analytical response is \`T(t) = 20 + 40(1 − exp(−t/30))\`: about 45.3°C after 30 seconds and 58.0°C after 90 seconds. Those figures describe the open-loop plant, not a guaranteed closed-loop trajectory.`
    },
    {
      type: "callout",
      variant: "info",
      title: "Before running the labs",
      text: "The DSL uses only blocks and pins listed in the supplied manual. The numerical tuning below assumes integral gain is applied per second. Anti-windup clamps the internal integrator to prevent output runaway during actuator saturation."
    },
    {
      type: "markdown",
      content: `## 3. Stage 1: Calculate the Error Before You Tune the Loop

For a heating process, define error as \`e = SP − PV\`. A positive error should request more heat. Start with a proportional gain of 2 output percentage points per degree:

\`\`\`
u_raw = 2 × (SP − PV)
\`\`\`

The heater cannot produce negative power or exceed full output, so the usable command is \`u = max(0, min(100, u_raw))\`.

The first lab builds those limits explicitly. The low comparator selects zero whenever raw demand is negative. The high comparator then selects 100 whenever the lower-limited result exceeds 100. Each multiplexer follows the manual's rule: false selects A; true selects B.

PV is a manual input in this stage. You are testing direction, scaling, and limits before connecting a simulated process.`
    },
    {
      type: "lab",
      title: "Stage 1: Error, Proportional Demand, and Output Limits",
      step: "Stage 1 of 3",
      height: 540,
      dsl: heater_stage1
    },
    {
      type: "callout",
      variant: "info",
      title: "Interactive exercise: prove the direction and both limits",
      text: "Keep SP at 60°C. Set PV to 20°C: error should be 40°C and demand 80%. Change PV to 55°C: demand should fall to 10%. Change PV to 70°C: raw demand should be −20%, but limited demand must be 0%. Finally set SP to 80°C and PV to 20°C: raw demand should be 120%, while limited demand remains 100%."
    },
    {
      type: "markdown",
      content: `### Why proportional control settles below the target

At exactly zero error, this proportional-only controller requests zero heat. But our jacket needs 50% power to remain at 60°C. It must retain a positive error to generate the required holding power.

Combining the unsaturated proportional controller with the zero-load plant gives:

\`\`\`
T = 20 + 0.8 × 2 × (60 − T)
\`\`\`

Therefore \`T ≈ 44.6°C\` and \`u ≈ 30.8%\`. The remaining 15.4°C error is steady-state offset. Raising proportional gain reduces it, but does not eliminate it at finite gain in this unbiased controller. Integral action supplies the missing holding demand.`
    },
    {
      type: "markdown",
      content: `## 4. Stage 2: Add Integral Action and Translate Demand into Switching

A PI controller combines the immediate proportional response with an accumulated correction:

\`\`\`
u_raw(t) = Kp × e(t) + Ki × ∫ e(τ) dτ
\`\`\`

While temperature remains below target, integral action can increase heating demand. At a reachable steady state, the integral term can retain the holding output even when error is zero.

We use \`PID_CONTROLLER\` with \`kd=0\`, making it a PI controller, with internal limits set to the actuator's actual range: 0–100%. The starting values are \`kp=4\` and \`ki=0.1\`. Under the seconds-based parallel PI convention, that corresponds to an integral time \`Kp/Ki\` of 40 seconds.

### A percentage is not yet a switching command

PWM converts controller demand into an ON fraction of a repeating period. With a 2,000 ms period, a steady 25% demand represents approximately 500 ms ON and 1,500 ms OFF; 50% represents 1,000 ms of each.

This lab deliberately leaves PV manual. It reveals what the controller requests when the process does not respond.`
    },
    {
      type: "lab",
      title: "Stage 2: PI Demand and Time-Proportioned Heater Output",
      step: "Stage 2 of 3",
      height: 560,
      dsl: heater_stage2
    },
    {
      type: "callout",
      variant: "info",
      title: "Interactive exercise: watch the integral term at work",
      text: "With SP at 60°C, change manual PV from 60°C to 50°C. Observe the initial proportional response and then increasing demand while the error persists. The SSR command should spend progressively more of each period ON. Return PV to 60°C and observe the retained demand; zero error does not necessarily mean zero output. Then set PV to 70°C and watch demand reduce. Keep the experiment running until you have also observed the upper-limit lamp at 100%."
    },
    {
      type: "markdown",
      content: `## 5. Stage 3: Close the Loop and Challenge It

Replace manual PV with a thermal plant. The controller's percentage output is multiplied by 0.8, the equivalent cooling load is subtracted, and a first-order lag with \`tau=30000\` models thermal inertia. Adding 20°C converts temperature rise into absolute temperature for feedback.

The feedback path crosses \`TRANSFER_FUNCTION\`, a stateful block explicitly permitted as an analog memory boundary. There is no instantaneous algebraic feedback loop.

### Live tuning without undocumented controller pins

The circuit calculates \`e_scaled = G × (SP − PV)\`, feeds that value into the PID's SP pin, and feeds zero into its PV pin. The PID therefore operates on the intended scaled error.

Start at G = 1. Use 0.5, 1, and 1.5 for controlled comparisons. Press **▶ Run** below to simulate the closed-loop thermal response in real time:`
    },
    {
      type: "lab",
      title: "Stage 3: Thermal Feedback, Live Tuning, and Saturation Recovery",
      step: "Stage 3 of 3",
      height: 680,
      dsl: heater_stage3
    },
    {
      type: "callout",
      variant: "success",
      title: "Model fidelity: average power versus switching ripple",
      text: "The thermal plant receives the analog duty demand as average heater power. The PWM branch shows the corresponding SSR command, but its digital pulses do not drive the plant. This intentional averaged model does not simulate switching ripple or electrical power faults. A two-second PWM period is short relative to the assumed 30-second thermal time constant, making average power useful for this lesson."
    },
    {
      type: "markdown",
      content: `### Controlled Experiments to Perform

#### Experiment A: Reach a reachable steady-state
1. Start a fresh simulation with SP = 60°C, G = 1, and L = 0°C.
2. Watch demand and temperature together. From a cool start (20°C), demand ramps to 100% while temperature rises gradually.
3. Allow the loop to settle. Notice how it lands smoothly at 60°C with exactly 50% demand!
4. Change SP to 70°C. The new steady-state demand settles at exactly 62.5% because \`(70 − 20)/0.8 = 62.5%\`.

#### Experiment B: Add cooling load disturbance
Return SP to 60°C and let the loop settle. Change the cooling-load input from 0°C to 10°C. Temperature initially dips, and the controller compensates by driving demand up to 62.5%. Remove the load and verify demand returns to 50%.

#### Experiment C: Request the impossible, then recover (Anti-Windup Test)
1. Set SP = 110°C (with G=1, L=0). 110°C would require 112.5% heat, which is physically impossible.
2. The controller saturates at 100% output, and the saturation lamp turns ON. Temperature tops out near 100°C.
3. After holding at 110°C for 60 seconds, drop SP down to 60°C.
4. Because the integrator is bounded by anti-windup clamping, the output drops out of saturation immediately without the catastrophic delay that ruined the $18,600 batch!

| Operating point | Expected steady-state demand | Interpretation |
| :--- | :--- | :--- |
| SP 60°C, L 0°C | 50% | Reachable normal operation |
| SP 70°C, L 0°C | 62.5% | Reachable higher temperature |
| SP 60°C, L 10°C | 62.5% | Additional load requires additional power |
| SP 110°C, L 0°C | Would require 112.5% | Unreachable; output saturates at 100% |`
    },
    {
      type: "markdown",
      content: `## 6. Commissioning Checklist: What Must Be Proven on the Plant Floor

The simulator makes every signal visible and gives the heater a predictable response. Commissioning begins by proving that the installed system behaves as the control design assumes.

- **Prove measurement scaling:** Inject known transmitter signals and verify the displayed engineering units at several points. Confirm sensor type, range, polarity, and the behavior on sensor failure.
- **Prove the direction of action at low power:** Below setpoint, heating demand should increase. Above setpoint, it should decrease. Verify this through the full chain from software demand to measured heater current.
- **Identify the process before copying gains:** Record the temperature response to a controlled manual power change. Estimate gain, time constant, and any dead time. Account for product loading and mixing conditions.
- **Confirm the controller convention:** Determine whether the device uses integral gain or integral time, seconds or minutes, and a parallel or dependent formulation. A number copied between controllers may represent a different algorithm.
- **Match limits to available power:** Confirm that 100% demand means the actual maximum permitted power. If a downstream limiter or interlock reduces delivered output, assess controller tracking or integration handling rather than assuming its internal limits account for the change.
- **Verify PWM against the installed actuator:** Check cycle period, minimum practical ON/OFF time, SSR ratings, heat sinking, and actual current switching. A blinking pilot light proves the command signal, not power delivery.
- **Test the independent high-temperature shutdown:** Confirm its sensor path, trip action, power-isolation device, reset behavior, and response to a failed-on power switch. Follow the approved plant protection design.
- **Test startup and restart behavior:** Establish permitted output after power restoration, sensor recovery, controller enable, and transfer between manual and automatic operation.
- **Trend SP, PV, command, and delivered power together:** Include operating mode and trip status. Otherwise a bad sensor, missing heater power, or output override may be mistaken for poor tuning.
- **Use a controlled saturation-recovery test:** On a live installation, use an approved procedure and safe operating limits; the simulator's deliberately unreachable 110°C request is a teaching exercise, not a field test instruction.`
    }
  ]
};

const targetDirs = [
  path.resolve('automationhub-masterclasses'),
  path.resolve('..', 'automationhub-masterclasses')
];

for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, 'industrial-heater-pi-pwm-anti-windup.json');
  fs.writeFileSync(outPath, JSON.stringify(articleData, null, 2) + '\n', 'utf-8');
  console.log('Saved masterclass JSON to:', outPath);
}

const pyScript = `import json
from pathlib import Path

OUT = Path(__file__).resolve().parent

data = ${JSON.stringify(articleData, null, 2)}

(OUT / "industrial-heater-pi-pwm-anti-windup.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\\n", encoding="utf-8")
print("Exported industrial-heater-pi-pwm-anti-windup.json successfully.")
`;

for (const dir of targetDirs) {
  const pyPath = path.join(dir, 'generate_industrial_heater.py');
  fs.writeFileSync(pyPath, pyScript, 'utf-8');
  console.log('Saved python generator to:', pyPath);
}
