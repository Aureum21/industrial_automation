import React from 'react';
import InlineLab from '@/components/lab/InlineLab';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readingTime: string;
  tag: string;
  views: number;
  content: React.ReactNode;
  dsl: string;
}

const LAB1_PROPORTIONAL_DSL = `circuit "Stage 1: Proportional Droop" version 1 {
  sp: ANALOG_INPUT(label="Target SP", value=180)
  pv: ANALOG_INPUT(label="Thermocouple PV", value=168)
  err: MATH(operation="subtract")
  gain: ANALOG_AMPLIFIER(gain=2)
  cv: ANALOG_OUTPUT(label="Proportional CV %")
  err_disp: ANALOG_OUTPUT(label="Active Error")

  sp.Q -> err.A
  pv.Q -> err.B
  err.Q -> gain.A
  gain.Q -> cv.A
  err.Q -> err_disp.A
}
`;

const LAB2_INTEGRAL_PWM_DSL = `circuit "Stage 2: Integral & PWM Actuation" version 1 {
  sp: ANALOG_INPUT(label="Target SP", value=180)
  pv: ANALOG_INPUT(label="Thermocouple PV", value=168)
  pi: PI_CONTROLLER(kp=1.5, ki=0.25)
  pwm: PWM(period=2000)
  ssr: OUTPUT(label="Heater SSR Relay")
  cv_gauge: ANALOG_OUTPUT(label="PI Output Power %")

  sp.Q -> pi.SP
  pv.Q -> pi.PV
  pi.Q -> pwm.A
  pwm.Q -> ssr.A
  pi.Q -> cv_gauge.A
}
`;

const LAB3_CLOSED_LOOP_DSL = `circuit "Stage 3: Full Closed Loop Plant" version 1 {
  sp: ANALOG_INPUT(label="Target SP", value=180)
  pid: PI_CONTROLLER(kp=2, ki=0.4, min=0, max=100)
  plant: TRANSFER_FUNCTION(gain=2.5, tau=2000)
  pwm: PWM(period=1000)
  heater: OUTPUT(label="Heater SSR")
  chamber_temp: ANALOG_OUTPUT(label="Chamber Temp PV")
  power_pct: ANALOG_OUTPUT(label="Output Effort %")

  sp.Q -> pid.SP
  pid.Q -> plant.A
  plant.Q -> pid.PV
  pid.Q -> pwm.A
  pwm.Q -> heater.A
  plant.Q -> chamber_temp.A
  pid.Q -> power_pct.A
}
`;

const WT_LAB1_DSL = `circuit "Intake 1 - Permissives clear the run memory" version 1 {
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
}
`;

const WT_LAB2_DSL = `circuit "Intake 2 - Level band and cycle duty alternation" version 1 {
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
}
`;

const WT_LAB3_DSL = `circuit "Intake 3 - Closed-loop tank and alternating duty" version 1 {
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
}
`;

const WATER_TREATMENT_SVG_DATA_URI =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" role="img" aria-labelledby="t d"><title id="t">Intake station and receiving tank</title><desc id="d">A source sump feeds two parallel pumps through an open-proved isolation valve. Check valves join the receiving tank. Level feedback selects the duty pump. An independent high-high switch and suction-low switch inhibit pumping.</desc><defs><marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#227b92"/></marker></defs><rect width="1200" height="560" rx="18" fill="#f3f6f8"/><g font-family="Arial,sans-serif" fill="#142c3d"><text x="38" y="42" font-size="24" font-weight="bold">01 / INTAKE DUTY, PERMISSIVES AND TANK LEVEL</text><text x="38" y="70" font-size="15">Conceptual P&amp;ID — physical protection and PLC logic are separate layers</text></g><g fill="#fff" stroke="#23495c" stroke-width="3"><path d="M55 190v190h165V190"/><path d="M65 300h145" stroke="#227b92"/><circle cx="510" cy="220" r="43"/><circle cx="510" cy="355" r="43"/><path d="M490 239v-38l37 19Z M490 374v-38l37 19Z"/><rect x="845" y="185" width="210" height="220" rx="14"/><path d="M850 310h200" stroke="#227b92"/><path d="M302 264l25 20-25 20Z M352 264l-25 20 25 20Z"/></g><g fill="none" stroke="#227b92" stroke-width="5" marker-end="url(#arr)"><path d="M220 284h80"/><path d="M354 284h66V220h46"/><path d="M420 284v71h46"/><path d="M554 220h170v64h117"/><path d="M554 355h170v-71"/><path d="M1055 350h108"/></g><g fill="none" stroke="#23495c" stroke-width="2"><path d="M624 204v32l22-16Z M649 204v32 M624 339v32l22-16Z M649 339v32"/><circle cx="138" cy="165" r="32"/><path d="M138 197v100"/><circle cx="922" cy="128" r="31"/><path d="M922 159v27"/><circle cx="1010" cy="128" r="31"/><path d="M1010 159v27"/><rect x="320" y="100" width="400" height="60" rx="8"/></g><g fill="none" stroke="#bd7b24" stroke-width="2" stroke-dasharray="7 5"><path d="M170 165h95v-35h55 M720 130h171 M979 128h-25 M327 260v-100 M510 160v16 M570 160v152"/></g><g font-family="Arial,sans-serif" fill="#142c3d" text-anchor="middle"><text x="138" y="160" font-size="13">LSL-101</text><text x="138" y="178" font-size="11">suction OK</text><text x="135" y="415" font-size="17">TK-101 / source sump</text><text x="327" y="335" font-size="15">XV-101 / ZSO-101</text><text x="510" y="287" font-size="16">P-101A</text><text x="510" y="419" font-size="16">P-101B</text><text x="655" y="190" font-size="13">NRV-A</text><text x="655" y="400" font-size="13">NRV-B</text><text x="950" y="436" font-size="17">TK-102 / receiving tank</text><text x="922" y="133" font-size="13">LT-102</text><text x="1010" y="133" font-size="12">LSHH-102</text><text x="520" y="125" font-size="17">PLC / demand latch + duty selector</text><text x="520" y="147" font-size="12">Start 35% • stop 75% • independent HH inhibit</text></g><g font-family="Arial,sans-serif" font-size="15" fill="#294758"><text x="40" y="496">Blue: water flow →    Dashed amber: logical / instrument signals</text><text x="40" y="524">Duty alternation is not automatic fault substitution. Valve and motor feedback must be proved separately.</text></g></svg>`
  );

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'water-treatment',
    title: 'Building an Industrial Water Treatment Simulator: Intake Permissives, Basin Hysteresis & Automated Pump Alternation',
    excerpt: 'A comprehensive masterclass on municipal and industrial water treatment SCADA: diagnosing cavitation disasters, interlocking intake permissives, eliminating basin short-cycling with hysteresis, and automating pump duty alternation.',
    author: 'AutomationHub Editorial',
    date: 'Oct 18',
    readingTime: '20 min read + 25 min labs',
    tag: 'Process Control',
    views: 18450,
    content: (
      <div className="space-y-6">
        <div className="my-8 not-prose rounded-xl overflow-hidden border border-zinc-300 shadow-xl bg-white">
          <img
            src={WATER_TREATMENT_SVG_DATA_URI}
            alt="Intake station and receiving tank P&ID"
            className="w-full h-auto object-cover max-h-[550px]"
          />
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs font-mono text-zinc-400 flex flex-wrap justify-between items-center gap-2">
            <span className="text-emerald-400 font-semibold">FIG 1.1 // PROCESS FLOW &amp; P&amp;ID OVERVIEW</span>
            <span>INTAKE STATION &amp; RECEIVING TANK (TK-101 → P-101A/B → TK-102)</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-8 mb-4">
          The Midnight Basin 3 Overflow &amp; Mechanical Seal Blowout
        </h2>
        <p>
          At 2:40 AM during a torrential spring thunderstorm, the regional municipal water reclamation plant suffered an environmental disaster. The lead intake centrifugal pump (P-101A) suddenly started screaming with a deafening rattle that sounded like pumping gravel through a steel pipe.
        </p>
        <p>
          Heavy debris had blinded the raw intake bar screens, starving the wet well. The suction pressure plummeted far below the vapor pressure of water, throwing the impeller into violent <strong>cavitation</strong>. Vapor bubbles imploded against the stainless steel vanes with shockwaves exceeding 10,000 PSI. Within ninety seconds, the mechanical seal shattered, spraying river water across the motor floor and tripping the 480V thermal overload.
        </p>
        <p>
          To make matters worse, the downstream clarifier basin relied on a software polling loop rather than a dedicated hardware interlock. When the standby pump was manually kicked on by a panicked night-shift operator, the inlet valve was forced wide open into an already saturated sedimentation tank. By 3:15 AM, over 120,000 gallons of untreated wastewater had overflowed the weir into the adjacent municipal canal, drawing state environmental citations and hundreds of thousands of dollars in fines.
        </p>

        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg my-4 text-sm font-sans text-amber-950">
          <strong className="block font-semibold mb-1">Physical Protection vs. PLC Software Permissives</strong>
          <p>
            Hardwired interlocks (emergency stop, dry-run float switches LSL-101, and motor thermal overloads) must act independently of PLC software logic. Never rely solely on software polls to protect rotating machinery from cavitation or tanks from environmental overflow.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 1: Intake Permissives &amp; Dry-Run Lockout
        </h2>
        <p>
          In industrial automation, there is a strict engineering distinction between an <strong>Operational Permissive</strong> and an <strong>Interlock Trip</strong>:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Permissive (Pre-Condition):</strong> A set of criteria that must ALL be satisfied before a piece of equipment is allowed to start. For example: &quot;Intake isolation valve ZSO-101 confirmed 100% open AND suction level switch LSL-101 confirmed submerged AND motor thermal overload healthy&quot;.
          </li>
          <li>
            <strong>Interlock (Active Protection):</strong> A condition that de-energizes the contactor immediately during operation if breached. If the suction well drains or the isolation valve drifts shut during pumping, the run request must drop instantly.
          </li>
        </ul>
        <p>
          Below is Stage 1 of the simulation. We implement a fail-safe start/stop circuit using an <code>RS_LATCH</code> with reset priority. The Start command can only latch if all permissives are proved; any loss of permissive or Stop press immediately clears the run memory:
        </p>

        <InlineLab
          dsl={WT_LAB1_DSL}
          title="Intake 1 - Permissives clear the run memory"
          step="Stage 1 of 3"
          height={520}
        />

        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg my-4 text-sm font-sans text-blue-950">
          <strong className="block font-semibold mb-1">Interactive Exercise — Stage 1</strong>
          <p>
            In Stage 1 above, click on <strong>Start pulse</strong> to energize Pump P-101A. The RS Latch holds the pump energized. Now toggle <strong>LSL-101 suction water available</strong> to OFF (dry suction). Notice how the lost permissive immediately forces a reset on the latch, killing motor command instantly! Try starting the pump while the intake valve ZSO-101 is closed—the permissive gate prevents any start command from passing.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 2: Receiving Tank Level Band &amp; Duty Alternation
        </h2>
        <p>
          Why do naive programmers burn out pump contactors in wastewater lift stations? Because they implement single-point setpoint logic:
        </p>
        <div className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800">
          IF Tank_Level &lt; 50% THEN Pump = ON<br />
          ELSE Pump = OFF
        </div>
        <p>
          Surface ripples and turbulence cause level transmitters (LT-102) to flutter between 49.9% and 50.1% dozens of times per minute. This causes rapid contactor chattering, excessive electrical arcing, and severe water hammer.
        </p>
        <p>
          The correct methodology uses a wide <strong>Hysteresis Band</strong>:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Start threshold (Low Level):</strong> 35%</li>
          <li><strong>Stop threshold (High Level):</strong> 75%</li>
        </ul>
        <p>
          When the tank level drains down to 35%, <code>needsFill</code> trips and latches the fill memory ON. The pump runs steadily until the tank reaches 75%, where <code>full</code> trips and resets the latch. Furthermore, to balance impeller and bearing wear across 24/7 operations, a bistable toggle (<code>PULSE_RELAY</code>) alternates the duty between <strong>P-101A</strong> and <strong>P-101B</strong> on every completed fill cycle!
        </p>

        <InlineLab
          dsl={WT_LAB2_DSL}
          title="Intake 2 - Level band and cycle duty alternation"
          step="Stage 2 of 3"
          height={520}
        />

        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg my-4 text-sm font-sans text-blue-950">
          <strong className="block font-semibold mb-1">Interactive Exercise — Stage 2</strong>
          <p>
            In Stage 2 above, click <strong>LT-102 level percent</strong>. Change the level from 55% down to 30%—notice that Fill Demand engages and starts Duty Pump P-101A. Now raise the level to 50%—the pump continues running! Raise the level to 75%—the fill demand clears, and the duty toggle flips to Pump B! Lower the level back to 30%—watch Pump B take the next run cycle while Pump A rests!
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 3: Closed-Loop Dynamic Plant Simulation &amp; Continuous Cycling
        </h2>
        <p>
          In this final stage, we close the loop with a real-time dynamic tank model. The simulation couples the PLC control logic with physical plant dynamics:
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li><strong>Pump Inflow:</strong> Active pumps deliver pressurized inflow to the receiving tank.</li>
          <li><strong>Dynamic Gravity Drain:</strong> Fluid continuously exits the tank to downstream process units.</li>
          <li><strong>Continuous Duty Balancing:</strong> As the tank fills and drains over time, the controller transitions between P-101A and P-101B automatically without human intervention.</li>
        </ol>
        <p>
          Press <strong>▶ Run</strong> below to start the continuous dynamic simulation:
        </p>

        <InlineLab
          dsl={WT_LAB3_DSL}
          title="Intake 3 - Closed-loop tank and alternating duty"
          step="Stage 3 of 3"
          height={650}
        />

        <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 rounded-r-lg my-4 text-sm font-sans text-emerald-950">
          <strong className="block font-semibold mb-1">Interactive Exercise — Stage 3</strong>
          <p>
            Press <strong>▶ Run</strong>. Watch the tank level steadily climb from 35% toward 75% driven by Pump P-101A. As soon as the level reaches 75%, Pump A shuts off, and the tank begins draining. Once the water drops back to 35%, watch Standby Pump P-101B automatically start up! Open the Logic Analyzer at the bottom to watch the square waves and level ramps record in real time!
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Commissioning &amp; Engineering Takeaways
        </h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>
            <strong>Physical Permissives are Non-Negotiable:</strong> Never issue a motor start command without proving open suction path and positive suction head.
          </li>
          <li>
            <strong>Always Band Your Analog Thresholds:</strong> Single-point hysteresis causes cavitation and destroys contactors. Maintain at least a 20–40% deadband between start and stop thresholds.
          </li>
          <li>
            <strong>Duty Alternation Extends Mean-Time-Between-Failures (MTBF):</strong> Automatic alternation balances mechanical seal wear and prevents bearing brinelling in idle equipment.
          </li>
          <li>
            <strong>Hardware Interlocks Must Override Software:</strong> Always wire independent high-high level switches (LSHH) directly into the motor control center (MCC) trip circuit.
          </li>
        </ul>
      </div>
    ),
    dsl: ''
  },
  {
    slug: 'pid-oven-tuning',
    title: 'PID Temperature Regulation: From Catastrophic Overshoot to Critically Damped Control',
    excerpt: "A step-by-step masterclass on temperature control: diagnosing the fatal flaws of on-off thermostats, deconstructing P and PI logic, and building a full closed-loop thermal simulator.",
    author: 'Alex Engineer',
    date: 'Oct 1',
    readingTime: '14 min read',
    tag: 'Control Systems',
    views: 24190,
    content: (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-8 mb-4">
          The $40,000 Scrap Incident at 3:15 AM
        </h2>
        <p>
          At three in the morning inside an aerospace autoclave bay, an alarm buzzer pierced the silence of the night shift. An industrial cure oven loaded with eight carbon-fiber wing spar preforms had just tripped a high-limit thermal interlock.
        </p>
        <p>
          The recipe called for a controlled ramp to 180°C, followed by a mandatory two-hour soak. To save commissioning costs, the equipment builder had installed a simple digital thermostat driving an AC contactor. The logic inside was naive bang-bang control:
        </p>
        <div className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800">
          IF Temperature &lt; 180°C THEN Heater_Contactor = TRUE<br />
          ELSE Heater_Contactor = FALSE
        </div>
        <p>
          On paper, that logic looks bulletproof to an apprentice programmer. But physical thermodynamics does not care about digital booleans. The oven was heated by heavy nichrome ceramic resistance banks. Even when the contactor snapped open at exactly 180°C, the ceramic blocks were still glowing cherry-red.
        </p>
        <p>
          Because of massive thermal inertia, stored radiative heat continued bleeding into the sealed chamber for another five minutes. The thermocouple soared past 180°C, blowing through 190°C and topping out at 205°C before gravity took over. That 25°C overshoot triggered premature exothermic cross-linking in the resin. Microscopic thermal cracks spider-webbed across every spar flange. By sunrise, forty thousand dollars worth of structural aerospace material was forklifted straight into the scrap bin.
        </p>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-10 mb-4">
          Visualizing The Physics: The Step Response Comparison
        </h2>
        <p>
          To understand why thermal systems behave this way, look at the MATLAB Simulink step-response simulation below comparing the exact same oven under three distinct control strategies:
        </p>

        <div className="my-8 not-prose rounded-xl overflow-hidden border border-zinc-300 shadow-xl bg-white">
          <img
            src="/matlab_pid_graph.jpg"
            alt="MATLAB Simulink Step Response Plot comparing On-Off Thermostat, Proportional Control, and Tuned PID"
            className="w-full h-auto object-cover"
          />
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs font-mono text-zinc-400 flex flex-wrap justify-between items-center gap-2">
            <span className="text-emerald-400 font-semibold">FIG 1.1 // MATLAB SIMULINK TRANSIENT ANALYSIS</span>
            <span>SETPOINT: 180.0 °C · THERMAL TIME CONSTANT τ = 2000 ms</span>
          </div>
        </div>

        <p>
          Examining the curves tells the entire story:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>The Red Sawtooth (On-Off Thermostat):</strong> Once thermal lag is present, on-off control produces violent limit-cycle hunting. It never stabilizes. It destroys mechanical relays and cooks sensitive workpieces.
          </li>
          <li>
            <strong>The Orange Curve (Pure Proportional Control):</strong> Smooth, predictable, and fast—yet it permanently plateaus at 168°C. It suffers from a 12°C "steady-state droop" that no amount of proportional gain can fix without causing instability.
          </li>
          <li>
            <strong>The Green Curve (Tuned Closed-Loop PI Control):</strong> The gold standard. A critically damped rise that smoothly decelerates into the 180°C target line with zero ringing and zero steady-state error.
          </li>
        </ul>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Step 1: The Raw Proportional Engine and the Mystery of Droop
        </h2>
        <p>
          The bedrock of any closed-loop system is the Error signal: the mathematical difference between where you want to be (Setpoint, <em>SP</em>) and where the physical machine actually is (Process Variable, <em>PV</em>):
        </p>
        <div className="bg-zinc-100 p-4 rounded-lg font-mono text-sm not-prose my-3 border border-zinc-200 text-zinc-800">
          e(t) = SP(t) - PV(t)
        </div>
        <p>
          In a purely Proportional controller, the output effort <em>P(t)</em> is simply the error multiplied by a proportional gain <em>Kp</em>:
        </p>
        <div className="bg-zinc-100 p-4 rounded-lg font-mono text-sm not-prose my-3 border border-zinc-200 text-zinc-800">
          P(t) = Kp × e(t)
        </div>
        <p>
          Now consider the physical trap: An oven loses heat to the ambient room through its insulation. To stay warm at 180°C, the oven requires roughly 24% continuous electrical power just to counteract ambient losses. But under pure Proportional control, what happens if the oven actually reaches 180°C?
        </p>
        <p>
          If <em>PV</em> = 180°C and <em>SP</em> = 180°C, then <em>e(t)</em> = 0. Therefore, <em>P(t) = Kp × 0 = 0%</em>! The controller immediately kills all power. The chamber cools down until an error re-appears. The system eventually enters a standoff at 168°C where the 12°C error produces exactly 24% power (<em>12°C × Kp=2 = 24%</em>). The system gets trapped in <strong>steady-state droop</strong>.
        </p>
        <p>
          Let us verify this in our first simulation sandbox. Below is the isolated Proportional calculation engine:
        </p>

        <InlineLab
          dsl={LAB1_PROPORTIONAL_DSL}
          title="Stage 1: Error Calculation & Proportional Droop"
          step="Stage 1 of 3"
          height={480}
        />

        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg my-4 text-sm text-emerald-950 font-sans">
          <strong>Interactive Exercise:</strong> In Stage 1 above, click on the <strong>Thermocouple PV</strong> block and change its value to <code>180</code>. Watch the <strong>Proportional CV %</strong> collapse to zero. Then change PV to <code>168</code> and observe how the output locks at <code>24%</code>. This illustrates why proportional gain alone can never reach setpoint in a thermal environment with heat loss.
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Step 2: Erasing Offset with the Integral Term & Modulating SSRs
        </h2>
        <p>
          To kill steady-state droop, we introduce the <strong>Integral term</strong> (<em>Ki</em>). The integral term does not care about how large the error is right now—it cares about how long the error has existed over time:
        </p>
        <div className="bg-zinc-100 p-4 rounded-lg font-mono text-sm not-prose my-3 border border-zinc-200 text-zinc-800">
          I(t) = Ki × ∫ e(τ) dτ
        </div>
        <p>
          Even if the error is a microscopic 0.5°C, the integral accumulator continuously increments scan after scan. It gradually ratchets up output power until it supplies the exact 24% baseline power needed to balance heat dissipation—even when the error drops all the way to zero!
        </p>
        <p>
          However, this introduces another real-world industrial hurdle: <strong>Actuation</strong>. Industrial heating elements run on high-current AC power switched by Solid State Relays (SSRs). An SSR is a binary switch: it is either 100% conducting or 0% off. You cannot send an SSR an analog "42.5%" command.
        </p>
        <p>
          The solution is <strong>Time-Proportioned Pulse Width Modulation (PWM)</strong>. We define a fixed cycle window (for example, 2000 milliseconds). If our PI controller requests 40% power, the PWM block energizes the SSR for 800 ms and shuts it off for 1200 ms. Over time, the thermal mass of the heating element averages this out into steady, seamless heating.
        </p>
        <p>
          In Stage 2 below, we add the PI controller block and feed its control variable directly into a high-speed PWM generator driving a physical Solid State Relay:
        </p>

        <InlineLab
          dsl={LAB2_INTEGRAL_PWM_DSL}
          title="Stage 2: PI Controller & Time-Proportioned PWM Actuation"
          step="Stage 2 of 3"
          height={480}
        />

        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg my-4 text-sm text-emerald-950 font-sans">
          <strong>Interactive Exercise:</strong> Click <strong>▶ Run</strong> on Stage 2 above. Observe how the <strong>Heater SSR Relay</strong> pulses on and off. Try dragging the <strong>Thermocouple PV</strong> down to <code>150</code>. Notice how the PI block demands higher power, widening the ON duration of the relay pulses!
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Step 3: Closing The Physical Loop (Thermal Lag & Plant Simulation)
        </h2>
        <p>
          We now have a tuned PI engine and an SSR actuator. But to test true dynamic performance before touching real multi-kilowatt factory hardware, we must model the physical thermal plant itself.
        </p>
        <p>
          In control engineering, thermal chambers are modeled as a First-Order Plus Dead Time (FOPDT) system. We represent this with a first-order lag Transfer Function:
        </p>
        <div className="bg-zinc-100 p-4 rounded-lg font-mono text-sm not-prose my-3 border border-zinc-200 text-zinc-800">
          G(s) = K / (τ·s + 1)
        </div>
        <p>
          Where <em>τ</em> represents the physical thermal inertia (how long it takes heat to migrate from the coils into the air volume), and <em>K</em> is the system gain.
        </p>
        <p>
          By connecting the output of our Transfer Function directly back into the <code>PV</code> input of the PID controller, we close the loop. Furthermore, we activate <strong>Integral Anti-Windup</strong> by capping the output limits between 0% and 100%. This ensures that if the oven door is swung open, the integrator does not wind up to infinity, which would cause massive thermal overshoot once the door is shut.
        </p>
        <p>
          Behold the complete, fully operational closed-loop temperature control system:
        </p>

        <InlineLab
          dsl={LAB3_CLOSED_LOOP_DSL}
          title="Stage 3: Complete Closed-Loop Thermal Plant Simulation"
          step="Stage 3 of 3 (Full Lab)"
          height={540}
        />

        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg my-4 text-sm text-emerald-950 font-sans">
          <strong>Final Commissioning Test:</strong> Click <strong>▶ Run</strong> on Stage 3 above! Watch the simulated cold oven start at room temperature. The PID controller commands full 100% effort, then smoothly throttles back power as the thermocouple passes 160°C, and lands gracefully on exactly 180°C. Click on <strong>Target SP</strong>, change it to <code>220</code>, and watch the control loop automatically track the new setpoint with zero ringing!
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Field-Tested Rules for Industrial Tuning
        </h2>
        <p>
          When you step out onto the plant floor to tune a live heating process, remember these hard-won rules from senior instrumentation engineers:
        </p>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <strong>Beware the Derivative Term (Kd):</strong> While PID algorithms include a derivative component, in 90% of industrial temperature loops, <em>Kd is set to zero</em>. Industrial thermocouples are prone to electromagnetic noise from nearby VFDs and motors. Differentiating high-frequency noise creates massive "derivative spikes" that rattle SSRs and destroy heaters.
          </li>
          <li>
            <strong>Tune Integral in Time, Not Multipliers:</strong> If your PLC uses Integral Time (<em>Ti</em> in seconds or minutes per repeat), remember that <em>smaller numbers mean stronger integration</em>. If it uses Integral Gain (<em>Ki</em>), larger numbers mean stronger integration. Mistaking one for the other has melted dozens of extruder barrels.
          </li>
          <li>
            <strong>Always Enforce Anti-Windup:</strong> Never commission an analog temperature loop without clamping the integral accumulator to the physical actuator limits (0–100%). It is the difference between a pristine production batch and a $40,000 pile of scrap.
          </li>
        </ol>
      </div>
    ),
    dsl: ''
  },
  {
    slug: 'traffic-lights',
    title: 'Automated Traffic Light Sequence',
    excerpt: 'Building a 3-state state machine using TON timers and logic gates.',
    author: 'Sarah Dev',
    date: 'Sep 28',
    readingTime: '8 min read',
    tag: 'Logic',
    views: 11340,
    content: (
      <>
        <p>State machines are notoriously tricky in visual block programming, but cascading timers make it easy. We use three TON (Timer On Delay) blocks to represent the duration of the Green, Yellow, and Red lights.</p>
        <p>When the sequence starts, the Green timer counts. Once it finishes, it triggers the Yellow timer, which triggers the Red timer. The Red timer's completion resets the Green timer, causing a continuous loop.</p>
        <p>Toggle the "Enable Sequence" switch below to see the cascade in action.</p>
      </>
    ),
    dsl: `circuit "Automated Traffic Light Sequence" version 1 {
  enable: INPUT(label="Enable Sequence", value=true)
  green_timer: TON(duration=4000)
  yellow_timer: TON(duration=1500)
  red_timer: TON(duration=4000)
  not_green_done: NOT()
  is_green: AND()
  not_yellow_done: NOT()
  is_yellow: AND()
  not_red_done: NOT()
  is_red: AND()
  reset_loop: NOT()
  run_green: AND()
  g_out: OUTPUT(label="Green Light")
  y_out: OUTPUT(label="Yellow Light")
  r_out: OUTPUT(label="Red Light")

  enable.Q -> run_green.A
  reset_loop.Q -> run_green.B
  run_green.Q -> green_timer.A
  green_timer.Q -> not_green_done.A
  run_green.Q -> is_green.A
  not_green_done.Q -> is_green.B
  is_green.Q -> g_out.A

  green_timer.Q -> yellow_timer.A
  yellow_timer.Q -> not_yellow_done.A
  green_timer.Q -> is_yellow.A
  not_yellow_done.Q -> is_yellow.B
  is_yellow.Q -> y_out.A

  yellow_timer.Q -> red_timer.A
  red_timer.Q -> not_red_done.A
  yellow_timer.Q -> is_red.A
  not_red_done.Q -> is_red.B
  is_red.Q -> r_out.A

  red_timer.Q -> reset_loop.A
}`
  },
  {
    slug: 'conveyor-sorting',
    title: 'Conveyor Belt Sorting System',
    excerpt: 'Using sensors and timers to divert packages accurately.',
    author: 'Mike Systems',
    date: 'Sep 22',
    readingTime: '6 min read',
    tag: 'Logistics',
    views: 7620,
    content: (
      <>
        <p>A sorting conveyor requires precise timing. When a sensor detects a defective package, the diverter arm shouldn't swing immediately—it has to wait until the package travels down the belt to the diverter position.</p>
        <p>We solve this using a TOF (Timer Off Delay) combined with a TON. The TOF extends the sensor pulse to ensure it's captured, and the TON delays the diverter actuation by exactly the travel time (e.g., 2000ms).</p>
        <p>Test the logic by briefly pulsing the "Defect Sensor" below and watch the diverter actuate 2 seconds later.</p>
      </>
    ),
    dsl: `circuit "Conveyor Belt Sorting System" version 1 {
  sensor: INPUT(label="Defect Sensor", value=false)
  belt_running: INPUT(label="Belt Running", value=true)
  pulse: TOF(duration=500)
  active_defect: AND()
  travel_delay: TON(duration=2000)
  divert_pulse: TOF(duration=1000)
  diverter: OUTPUT(label="Diverter Arm")

  sensor.Q -> pulse.A
  pulse.Q -> active_defect.A
  belt_running.Q -> active_defect.B
  active_defect.Q -> travel_delay.A
  travel_delay.Q -> divert_pulse.A
  divert_pulse.Q -> diverter.A
}`
  },
  {
    slug: 'two-hand-safety',
    title: 'Two-Hand Safety Interlock',
    excerpt: 'Ensuring operator safety with strict timing logic.',
    author: 'Emma Safety',
    date: 'Sep 20',
    readingTime: '7 min read',
    tag: 'Safety',
    views: 15200,
    content: (
      <>
        <p>Industrial presses often require the operator to press two buttons simultaneously (one for each hand) to ensure their hands are out of the danger zone. To prevent the operator from simply taping one button down, the logic dictates that both buttons must be pressed within 500ms of each other.</p>
        <p>We use Edge Triggers (R_TRIG) and Timers to enforce this strict window. If the window expires, the operator must release both buttons and try again.</p>
        <p>Try pressing both buttons in the simulation. If you leave one pressed for too long before pressing the second, the press will not actuate.</p>
      </>
    ),
    dsl: `circuit "Two-Hand Safety Interlock" version 1 {
  btn1: INPUT(label="Left Hand Button", value=false)
  btn2: INPUT(label="Right Hand Button", value=false)
  edge1: R_TRIG()
  edge2: R_TRIG()
  timer1: TOF(duration=500)
  timer2: TOF(duration=500)
  valid1: AND()
  valid2: AND()
  valid: OR()
  both_held: AND()
  latch: RS_LATCH()
  not_held: NOT()
  press: OUTPUT(label="Actuate Press")

  btn1.Q -> edge1.A
  btn2.Q -> edge2.A
  edge1.Q -> timer1.A
  edge2.Q -> timer2.A
  timer1.Q -> valid1.A
  btn2.Q -> valid1.B
  timer2.Q -> valid2.A
  btn1.Q -> valid2.B
  valid1.Q -> valid.A
  valid2.Q -> valid.B
  btn1.Q -> both_held.A
  btn2.Q -> both_held.B
  valid.Q -> latch.S
  both_held.Q -> not_held.A
  not_held.Q -> latch.R
  latch.Q -> press.A
}`
  },
  {
    slug: 'hvac-economizer',
    title: 'HVAC Economizer Logic',
    excerpt: 'Saving energy by using outdoor air when temperatures are favorable.',
    author: 'Dave Climate',
    date: 'Sep 18',
    readingTime: '4 min read',
    tag: 'HVAC',
    views: 5210,
    content: (
      <>
        <p>An HVAC economizer saves energy by drawing in fresh outside air when the outdoor temperature is cooler than the indoor return air, providing "free cooling."</p>
        <p>We use an ANALOG_COMPARATOR to check if Outside Temp &lt; Return Temp. If true, and there is a call for cooling from the thermostat, the system opens the outside damper instead of running the energy-heavy compressor.</p>
        <p>Adjust the temperatures in the simulation to see when the damper opens.</p>
      </>
    ),
    dsl: `circuit "HVAC Economizer Logic" version 1 {
  out_temp: ANALOG_INPUT(label="Outside Temp F", value=65)
  in_temp: ANALOG_INPUT(label="Return Temp F", value=75)
  call_cool: INPUT(label="Thermostat Call for Cool", value=true)
  comp: ANALOG_COMPARATOR(operation="lt")
  damper_logic: AND()
  damper: OUTPUT(label="Open Fresh Air Damper")
  not_economize: NOT()
  comp_logic: AND()
  compressor: OUTPUT(label="Run AC Compressor")

  out_temp.Q -> comp.A
  in_temp.Q -> comp.B
  comp.Q -> damper_logic.A
  call_cool.Q -> damper_logic.B
  damper_logic.Q -> damper.A

  comp.Q -> not_economize.A
  not_economize.Q -> comp_logic.A
  call_cool.Q -> comp_logic.B
  comp_logic.Q -> compressor.A
}`
  },
  {
    slug: 'tank-hysteresis',
    title: 'Tank Level Hysteresis Control',
    excerpt: 'Preventing pump short-cycling with differential triggers.',
    author: 'John Doe',
    date: 'Sep 15',
    readingTime: '6 min read',
    tag: 'Control Systems',
    views: 12900,
    content: (
      <>
        <p>If you use a simple comparator to turn on a pump when a tank drops below 50%, the pump will turn on at 49.9% and off at 50.1%, rapidly cycling on and off. This "short-cycling" destroys motors.</p>
        <p>The solution is Hysteresis. We use an ANALOG_DIFFERENTIAL block to turn the pump on when the level drops below 20%, and keep it on until the level reaches 80%.</p>
        <p>Watch the pump state in the simulation below as you manually adjust the Tank Level analog input.</p>
      </>
    ),
    dsl: `circuit "Tank Level Hysteresis Control" version 1 {
  level: ANALOG_INPUT(label="Tank Level %", value=50)
  hundred: ANALOG_CONSTANT(value=100)
  math: MATH(operation="subtract")
  diff: ANALOG_DIFFERENTIAL(onThreshold=80, offThreshold=20)
  pump: OUTPUT(label="Fill Pump")

  hundred.Q -> math.A
  level.Q -> math.B
  math.Q -> diff.A
  diff.Q -> pump.A
}`
  },
  {
    slug: 'pump-alternator',
    title: 'Motor Duty Cycling (Alternating Pumps)',
    excerpt: 'Extending equipment life by alternating two identical pumps.',
    author: 'Alex Engineer',
    date: 'Sep 10',
    readingTime: '9 min read',
    tag: 'Maintenance',
    views: 9870,
    content: (
      <>
        <p>In municipal water stations, two identical pumps are often installed. To ensure equal wear, they alternate cycles: Pump A runs for the first cycle, Pump B for the second, and so on.</p>
        <p>A PULSE_RELAY (toggle flip-flop) is perfect for this. Every time the call for water ends (falling edge), the toggle switches state. Depending on the toggle state, the next call for water is routed to either Pump A or Pump B using AND gates.</p>
      </>
    ),
    dsl: `circuit "Motor Duty Cycling (Alternating Pumps)" version 1 {
  call: INPUT(label="Call for Water", value=true)
  edge: F_TRIG()
  toggle: PULSE_RELAY()
  not_toggle: NOT()
  pumpA: AND()
  pumpB: AND()
  outA: OUTPUT(label="Pump A")
  outB: OUTPUT(label="Pump B")

  call.Q -> edge.A
  edge.Q -> toggle.A
  toggle.Q -> not_toggle.A
  call.Q -> pumpA.A
  not_toggle.Q -> pumpA.B
  pumpA.Q -> outA.A
  call.Q -> pumpB.A
  toggle.Q -> pumpB.B
  pumpB.Q -> outB.A
}`
  },
  {
    slug: 'esd-delays',
    title: 'Emergency Shutdown Sequence (ESD)',
    excerpt: 'Cascading delays to safely spin down hazardous processes.',
    author: 'Emma Safety',
    date: 'Sep 05',
    readingTime: '6 min read',
    tag: 'Safety',
    views: 6540,
    content: (
      <>
        <p>When an Emergency Stop (E-Stop) is pressed, you cannot always kill power to everything instantly. Some processes require valves to close immediately to starve a reaction, while cooling pumps must run for an additional 10 seconds to prevent overheating.</p>
        <p>In this circuit, we use a normally-closed E-Stop button. When it breaks (goes false), the valves drop out immediately. The cooling pump, however, is fed through a TOF (Timer Off Delay), keeping it alive for a brief duration after the shutdown signal.</p>
      </>
    ),
    dsl: `circuit "Emergency Shutdown Sequence (ESD)" version 1 {
  estop: NC_INPUT(label="E-Stop (NC)", value=true)
  run_cmd: INPUT(label="Normal Run Command", value=true)
  sys_ok: AND()
  valve: OUTPUT(label="Feed Valve")
  pump_delay: TOF(duration=3000)
  pump: OUTPUT(label="Cooling Pump")

  estop.Q -> sys_ok.A
  run_cmd.Q -> sys_ok.B
  sys_ok.Q -> valve.A
  sys_ok.Q -> pump_delay.A
  pump_delay.Q -> pump.A
}`
  },
  {
    slug: 'solar-logging',
    title: 'Data Logging for a Solar Panel Array',
    excerpt: 'Smoothing and recording volatile analog signals over time.',
    author: 'Dave Climate',
    date: 'Sep 02',
    readingTime: '5 min read',
    tag: 'Renewables',
    views: 3890,
    content: (
      <>
        <p>Solar panel voltage fluctuates rapidly due to passing clouds. If we log raw data directly, the chart becomes noisy and difficult to read.</p>
        <p>By passing the analog signal through an AVERAGE block (moving average), we smooth out the transients. We then use a DATA_LOG block to record a sample every 500ms, giving us a clean, actionable dataset.</p>
        <p>Adjust the "Solar Voltage" randomly in the simulation and observe the smoothed output.</p>
      </>
    ),
    dsl: `circuit "Data Logging for a Solar Panel Array" version 1 {
  voltage: ANALOG_INPUT(label="Raw Solar Voltage", value=12)
  avg: AVERAGE(samples=10)
  smoothed: ANALOG_OUTPUT(label="Smoothed Output")
  log_enable: INPUT(label="Enable Logging", value=true)
  logger: DATA_LOG(interval=500)

  voltage.Q -> avg.A
  avg.Q -> smoothed.A
  avg.Q -> logger.A
  log_enable.Q -> logger.EN
}`
  }
];
