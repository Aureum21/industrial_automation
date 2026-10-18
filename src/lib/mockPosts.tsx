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

const WT_LAB1_DSL = `circuit "Stage 1: Intake Permissives" version 1 {
  valve: INPUT(label="Intake Valve XV-101 Open", value=true)
  suction_ok: INPUT(label="Wet Well Level > NPSH", value=true)
  start_pb: INPUT(label="Start Pushbutton", value=false)
  stop_pb: INPUT(label="E-Stop / Trip", value=false)
  perm: AND()
  start_gate: AND()
  latch: RS_LATCH()
  pump: OUTPUT(label="Raw Water Pump P-101")

  valve.Q -> perm.A
  suction_ok.Q -> perm.B
  perm.Q -> start_gate.A
  start_pb.Q -> start_gate.B
  start_gate.Q -> latch.S
  stop_pb.Q -> latch.R
  latch.Q -> pump.A
}
`;

const WT_LAB2_DSL = `circuit "Stage 2: Basin Level Control" version 1 {
  level: ANALOG_INPUT(label="Basin Level LIT-301 %", value=25)
  fill_ctrl: ANALOG_DIFFERENTIAL(onThreshold=30, offThreshold=85)
  hi_hi_sensor: ANALOG_COMPARATOR(operation="gt")
  hi_hi_limit: ANALOG_CONSTANT(value=95)
  fill_valve: OUTPUT(label="Inflow Valve XV-201")
  alarm: OUTPUT(label="High-High Overflow Alarm")

  level.Q -> fill_ctrl.A
  fill_ctrl.Q -> fill_valve.A
  level.Q -> hi_hi_sensor.A
  hi_hi_limit.Q -> hi_hi_sensor.B
  hi_hi_sensor.Q -> alarm.A
}
`;

const WT_LAB3_DSL = `circuit "Stage 3: Full Treatment Train" version 1 {
  run_req: INPUT(label="Plant Run Permissive", value=true)
  flow_rate: ANALOG_INPUT(label="Raw Flow Rate FIT-101 (GPM)", value=1200)
  dose_ratio: ANALOG_CONSTANT(value=0.05)
  dose_calc: MATH(operation="multiply")
  dose_pump: ANALOG_OUTPUT(label="Coagulant Dosing Rate (GPH)")
  cycle_edge: F_TRIG()
  alt_flip: PULSE_RELAY()
  not_alt: NOT()
  gate_a: AND()
  gate_b: AND()
  pump_a: OUTPUT(label="Duty Pump P-101A")
  pump_b: OUTPUT(label="Standby Pump P-101B")

  flow_rate.Q -> dose_calc.A
  dose_ratio.Q -> dose_calc.B
  dose_calc.Q -> dose_pump.A

  run_req.Q -> cycle_edge.A
  cycle_edge.Q -> alt_flip.A
  alt_flip.Q -> not_alt.A

  run_req.Q -> gate_a.A
  not_alt.Q -> gate_a.B
  gate_a.Q -> pump_a.A

  run_req.Q -> gate_b.A
  alt_flip.Q -> gate_b.B
  gate_b.Q -> pump_b.A
}
`;

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'water-treatment',
    title: 'Building an Industrial Water Treatment Simulator: Intake Permissives, Basin Hysteresis & Automated Pump Alternation',
    excerpt: 'A comprehensive masterclass on municipal and industrial water treatment SCADA: diagnosing cavitation disasters, interlocking intake permissives, eliminating basin short-cycling with hysteresis, and automating chemical dosing.',
    author: 'John Doe',
    date: 'Sep 25',
    readingTime: '16 min read',
    tag: 'Process Control',
    views: 18450,
    content: (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-8 mb-4">
          The Midnight Basin 3 Overflow & Mechanical Seal Blowout
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

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-10 mb-4">
          System Blueprint: The Multi-Stage Process Architecture
        </h2>
        <p>
          Modern water treatment facilities rely on rigid physical separations and automated interlocks between process zones. Below is the Piping and Instrumentation Diagram (P&ID) of the plant showing the full flow from raw water intake to high-service distribution:
        </p>

        <div className="my-8 not-prose rounded-xl overflow-hidden border border-zinc-300 shadow-xl bg-white">
          <img
            src="/water_treatment_pid.jpg"
            alt="Water Treatment Piping and Instrumentation Diagram (P&ID)"
            className="w-full h-auto object-cover"
          />
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs font-mono text-zinc-400 flex flex-wrap justify-between items-center gap-2">
            <span className="text-emerald-400 font-semibold">FIG 1.1 // PROCESS FLOW & P&ID OVERVIEW</span>
            <span>INTAKE LIFT → COAGULATION → SEDIMENTATION → RAPID SAND FILTRATION</span>
          </div>
        </div>

        <p>
          The water treatment chain consists of five critical stages:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Raw Water Pump Station (P-101A/B):</strong> Dual high-capacity intake pumps lifting river water through automated isolation valves (XV-102/103) into the chemical flash-mix basin.
          </li>
          <li>
            <strong>Coagulation & Flocculation (T-201):</strong> Dosing precise ratios of alum and polyelectrolyte proportional to inflow velocity to aggregate suspended microscopic colloidal particulates into heavy flocs.
          </li>
          <li>
            <strong>Clarifier / Sedimentation Basin:</strong> Gravity settling tank with automated sludge rake (M-301) and continuous level transmitter (LIT-301) that must be protected against overflow.
          </li>
          <li>
            <strong>Rapid Sand Filter Beds (F-401A/B):</strong> Deep multi-media filter beds requiring differential pressure monitoring (DP-401) to trigger backwash cycles before channel clogging occurs.
          </li>
          <li>
            <strong>High-Service Clean Distribution (P-601A/B/C):</strong> Triplex booster pump station delivering disinfected clean potable water into the city main.
          </li>
        </ul>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 1: Permissives vs. Interlocks — Intake Suction & Dry-Run Lockout
        </h2>
        <p>
          In industrial automation, there is a strict distinction between an <strong>Operational Permissive</strong> and a <strong>Safety Interlock</strong>:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Permissive (Pre-Condition):</strong> A set of criteria that must ALL be true before an equipment run command is allowed to execute (e.g. "Intake isolation valve confirmed 100% open AND wet well level exceeds NPSH required").
          </li>
          <li>
            <strong>Interlock (Runtime Trip):</strong> A condition that actively de-energizes the motor at any instant during operation (e.g. emergency stop, dry-run float switch, or motor bearing over-temperature).
          </li>
        </ul>
        <p>
          In our Stage 1 simulation below, we implement a fail-safe start/stop circuit using an <code>RS_LATCH</code>. The Start Pushbutton can only successfully energize the Set (<code>S</code>) pin if the Permissive AND-gate confirms both the intake valve limit switch and suction level transmitters are healthy. If the suction well drops below minimum level, the latch instantly Resets (<code>R</code>), locking out the pump.
        </p>

        <InlineLab
          dsl={WT_LAB1_DSL}
          title="Stage 1: Intake Permissives & Dry-Run Lockout"
          step="Stage 1 of 3"
          height={480}
        />

        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg my-4 text-sm text-emerald-950 font-sans">
          <strong>Interactive Exercise:</strong> In Stage 1 above, click on <strong>Start Pushbutton</strong> to energize the pump. The RS Latch holds the pump running. Now toggle <strong>Wet Well Level</strong> to OFF. Notice how the safety reset trips the pump offline immediately. Now try toggling the Start Pushbutton while the Intake Valve is closed—the permissive gate prevents the pump from ever starting dry!
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 2: Basin Level Control with Differential Hysteresis
        </h2>
        <p>
          Why do naive automation engineers cause motor burnouts in clarifier basins? Because they use single-point setpoints:
        </p>
        <div className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800">
          // THE SHORT-CYCLING DISASTER:<br />
          IF Basin_Level &lt; 50% THEN Fill_Valve = OPEN<br />
          ELSE Fill_Valve = CLOSED
        </div>
        <p>
          Surface ripples and hydraulic turbulence cause the analog sensor to fluctuate between 49.9% and 50.1% several times per second. The inlet valve actuator cycles on and off dozens of times every hour, burning out motor starter contactors and creating hydraulic water hammer across the main headers.
        </p>
        <p>
          The correct solution is <strong>Schmitt Trigger Differential Hysteresis</strong> (<code>ANALOG_DIFFERENTIAL</code>). We configure an ON threshold of 30% and an OFF threshold of 85%. When the basin drains to 30%, the valve opens and stays continuously open until the basin fills to 85%. Between 30% and 85%, the controller holds its prior state. In addition, an independent safety comparator monitors for a High-High emergency condition (&gt; 95%) to trigger an overflow alarm:
        </p>

        <InlineLab
          dsl={WT_LAB2_DSL}
          title="Stage 2: Basin Level Differential Hysteresis Control"
          step="Stage 2 of 3"
          height={480}
        />

        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg my-4 text-sm text-emerald-950 font-sans">
          <strong>Interactive Exercise:</strong> In Stage 2 above, click on <strong>Basin Level LIT-301</strong>. Change the level from <code>25%</code> to <code>50%</code>—notice the Inflow Valve stays ON. Raise it to <code>85%</code>—the valve snaps OFF. Now lower it to <code>70%</code>—the valve stays OFF! Only when the water drops back below <code>30%</code> does the fill cycle re-engage. Try raising the level to <code>98%</code> to watch the High-High Overflow Alarm fire!
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 3: Full Treatment Train (Flow Pacing & Pump Alternation)
        </h2>
        <p>
          In a 24/7 continuous treatment facility, equipment wear must be balanced across duty cycles. If Pump A runs 10,000 hours while Pump B sits idle, Pump A will fail prematurely while Pump B suffers seal degradation from stagnation.
        </p>
        <p>
          We implement automated <strong>Lead/Lag Duty Alternation</strong> using a <code>PULSE_RELAY</code> (bistable toggle flip-flop) coupled with a Falling-Edge Trigger (<code>F_TRIG</code>). Every time the plant run permissive completes a cycle (transitions from true to false), the toggle flips state. When the next run permissive arrives, the command is routed to the alternate pump!
        </p>
        <p>
          Simultaneously, raw water turbidity demands proportional coagulant chemical dosing. The magnetic flowmeter (<code>FIT-101</code>) sends continuous GPM flow data to an analog <code>MATH</code> multiplier, dynamically pacing chemical injection to maintain an exact parts-per-million ratio regardless of river flow swings:
        </p>

        <InlineLab
          dsl={WT_LAB3_DSL}
          title="Stage 3: Flow Paced Chemical Dosing & Duty Alternation"
          step="Stage 3 of 3 (Full Lab)"
          height={540}
        />

        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg my-4 text-sm text-emerald-950 font-sans">
          <strong>Interactive Exercise:</strong> In Stage 3 above, observe that <strong>Duty Pump P-101A</strong> is active. Toggle <strong>Plant Run Permissive</strong> to OFF, then toggle it back to ON—watch the flip-flop switch control over to <strong>Standby Pump P-101B</strong>! Change the <strong>Raw Flow Rate</strong> from <code>1200</code> to <code>2000 GPM</code> and observe the chemical dosing rate automatically scale up from 60 to 100 GPH in real time!
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Field-Tested Rules for Municipal SCADA Deployment
        </h2>
        <p>
          Before commissioning any water reclamation or filtration SCADA system on live municipal infrastructure, verify these five mandatory safety principles:
        </p>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <strong>Hardware Interlocks Over Software Flags:</strong> Critical safety trips (dry-run low float and basin overflow high float) must be hardwired directly into the variable frequency drive (VFD) safe torque off (STO) circuit, independent of PLC software logic.
          </li>
          <li>
            <strong>Valve Stroke Time Travel Watchdogs:</strong> Never assume an automated motorized butterfly valve opened just because an output coil energized. Always wire open/closed limit switches and implement a 15-second travel timer watchdog in ladder/FBD logic.
          </li>
          <li>
            <strong>Anti-Water-Hammer Sequencing:</strong> Always sequence pump ramp-down before slow-closing discharge check valves to prevent shock pressure transients from blowing out ductile iron piping joints.
          </li>
          <li>
            <strong>Hysteresis Deadbands Must Exceed Hydraulic Waves:</strong> In outdoor open basins, wind shear can generate 6-inch surface chop. Ensure your differential hysteresis span is at least 3× the maximum wave height.
          </li>
        </ol>
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
    dsl: `
      enable = INPUT(label: "Enable Sequence")
      
      green_timer = TON(duration: 4000)
      yellow_timer = TON(duration: 1500)
      red_timer = TON(duration: 4000)
      
      # Green is on when enabled but green timer hasn't finished
      not_green_done = NOT()
      green_timer -> not_green_done
      
      is_green = AND()
      enable -> is_green.A
      not_green_done -> is_green.B
      
      # Yellow starts when green is done
      green_timer -> yellow_timer
      not_yellow_done = NOT()
      yellow_timer -> not_yellow_done
      
      is_yellow = AND()
      green_timer -> is_yellow.A
      not_yellow_done -> is_yellow.B
      
      # Red starts when yellow is done
      yellow_timer -> red_timer
      not_red_done = NOT()
      red_timer -> not_red_done
      
      is_red = AND()
      yellow_timer -> is_red.A
      not_red_done -> is_red.B
      
      # Loop reset (if red is done, reset green)
      # In FBD, we can break the loop by turning off the green timer
      reset_loop = NOT()
      red_timer -> reset_loop
      
      run_green = AND()
      enable -> run_green.A
      reset_loop -> run_green.B
      
      run_green -> green_timer.A
      
      g_out = OUTPUT(label: "Green Light")
      is_green -> g_out
      y_out = OUTPUT(label: "Yellow Light")
      is_yellow -> y_out
      r_out = OUTPUT(label: "Red Light")
      is_red -> r_out
    `
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
    dsl: `
      sensor = INPUT(label: "Defect Sensor")
      belt_running = INPUT(label: "Belt Running")
      
      pulse = TOF(duration: 500)
      sensor -> pulse
      
      # Only process if belt is running
      active_defect = AND()
      pulse -> active_defect.A
      belt_running -> active_defect.B
      
      travel_delay = TON(duration: 2000)
      active_defect -> travel_delay
      
      divert_pulse = TOF(duration: 1000)
      travel_delay -> divert_pulse
      
      diverter = OUTPUT(label: "Diverter Arm")
      divert_pulse -> diverter
    `
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
    dsl: `
      btn1 = INPUT(label: "Left Hand Button")
      btn2 = INPUT(label: "Right Hand Button")
      
      edge1 = R_TRIG()
      btn1 -> edge1
      
      edge2 = R_TRIG()
      btn2 -> edge2
      
      timer1 = TOF(duration: 500)
      edge1 -> timer1
      
      timer2 = TOF(duration: 500)
      edge2 -> timer2
      
      valid1 = AND()
      timer1 -> valid1.A
      btn2 -> valid1.B
      
      valid2 = AND()
      timer2 -> valid2.A
      btn1 -> valid2.B
      
      valid = OR()
      valid1 -> valid.A
      valid2 -> valid.B
      
      both_held = AND()
      btn1 -> both_held.A
      btn2 -> both_held.B
      
      latch = RS_LATCH()
      valid -> latch.S
      
      not_held = NOT()
      both_held -> not_held
      not_held -> latch.R
      
      press = OUTPUT(label: "Actuate Press")
      latch -> press
    `
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
    dsl: `
      out_temp = ANALOG_INPUT(label: "Outside Temp (F)", value: 65)
      in_temp = ANALOG_INPUT(label: "Return Temp (F)", value: 75)
      call_cool = INPUT(label: "Thermostat Call for Cool")
      
      comp = ANALOG_COMPARATOR(operation: "lt")
      out_temp -> comp.A
      in_temp -> comp.B
      
      damper_logic = AND()
      comp -> damper_logic.A
      call_cool -> damper_logic.B
      
      damper = OUTPUT(label: "Open Fresh Air Damper")
      damper_logic -> damper
      
      # If cooling is called but outside is hotter, run compressor
      not_economize = NOT()
      comp -> not_economize
      
      comp_logic = AND()
      not_economize -> comp_logic.A
      call_cool -> comp_logic.B
      
      compressor = OUTPUT(label: "Run AC Compressor")
      comp_logic -> compressor
    `
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
    dsl: `
      level = ANALOG_INPUT(label: "Tank Level %", value: 50)
      
      # We want pump ON when level < 20, OFF when level > 80.
      # The differential block turns ON when A >= onThreshold, OFF when A < offThreshold.
      # So we can invert the logic, or use math. Let's invert the level: 100 - level
      
      hundred = ANALOG_CONSTANT(value: 100)
      math = MATH(operation: "subtract")
      hundred -> math.A
      level -> math.B
      
      # Now math Q is (100 - level).
      # Turn on when math > 80 (level < 20). Turn off when math < 20 (level > 80).
      
      diff = ANALOG_DIFFERENTIAL(onThreshold: 80, offThreshold: 20)
      math -> diff.A
      
      pump = OUTPUT(label: "Fill Pump")
      diff -> pump
    `
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
    dsl: `
      call = INPUT(label: "Call for Water")
      
      # Detect falling edge to switch pumps for NEXT cycle
      edge = F_TRIG()
      call -> edge
      
      toggle = PULSE_RELAY()
      edge -> toggle
      
      not_toggle = NOT()
      toggle -> not_toggle
      
      pumpA = AND()
      call -> pumpA.A
      not_toggle -> pumpA.B
      
      pumpB = AND()
      call -> pumpB.A
      toggle -> pumpB.B
      
      outA = OUTPUT(label: "Pump A")
      pumpA -> outA
      
      outB = OUTPUT(label: "Pump B")
      pumpB -> outB
    `
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
    dsl: `
      estop = NC_INPUT(label: "E-Stop (NC)")
      run_cmd = INPUT(label: "Normal Run Command")
      
      sys_ok = AND()
      estop -> sys_ok.A
      run_cmd -> sys_ok.B
      
      valve = OUTPUT(label: "Feed Valve")
      sys_ok -> valve
      
      # Cooling pump runs if sys_ok is true, OR for 3s after it goes false
      pump_delay = TOF(duration: 3000)
      sys_ok -> pump_delay
      
      pump = OUTPUT(label: "Cooling Pump")
      pump_delay -> pump
    `
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
    dsl: `
      voltage = ANALOG_INPUT(label: "Raw Solar Voltage", value: 12)
      
      # Smooth over 10 samples
      avg = AVERAGE(samples: 10)
      voltage -> avg.A
      
      smoothed = ANALOG_OUTPUT(label: "Smoothed Output")
      avg -> smoothed
      
      log_enable = INPUT(label: "Enable Logging")
      logger = DATA_LOG(interval: 500)
      avg -> logger.A
      log_enable -> logger.EN
    `
  }
];
