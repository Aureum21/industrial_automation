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

import { HEATER_SVG } from './heaterBlueprintSvg';
import { TWO_HAND_SAFETY_SVG } from './safetyBlueprintSvg';

const HEATER_LAB1_DSL = `circuit "Stage 1 - Proportional Heater Demand" version 1 {
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
}
`;

const HEATER_LAB2_DSL = `circuit "Stage 2 - PI and PWM" version 1 {
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
}
`;

const HEATER_LAB3_DSL = `circuit "Stage 3 - Closed Loop Thermal Plant" version 1 {
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
}
`;

const HEATER_SVG_DATA_URI = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(HEATER_SVG);

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

const TWO_HAND_SAFETY_SVG_DATA_URI =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(TWO_HAND_SAFETY_SVG);

const SAFETY_LAB1_DSL = `circuit "Stage 1 - The Naive Bypass Flaw" version 1 {
  pb1: INPUT(label="Left Hand PB-101A", value=false)
  pb2: INPUT(label="Right Hand PB-101B", value=false)
  and_gate: AND(label="Naive Concurrence")
  stroke: OUTPUT(label="Press Ram Solenoid (UNSAFE)")

  pb1.Q -> and_gate.A
  pb2.Q -> and_gate.B
  and_gate.Q -> stroke.A
}
`;

const SAFETY_LAB2_DSL = `circuit "Stage 2 - 500ms Synchronism Window" version 1 {
  pb1: INPUT(label="Left Hand PB-101A", value=false)
  pb2: INPUT(label="Right Hand PB-101B", value=false)
  edge1: R_TRIG(label="PB1 Rising Edge")
  edge2: R_TRIG(label="PB2 Rising Edge")
  window1: TOF(label="500ms Window from PB1", duration=500)
  window2: TOF(label="500ms Window from PB2", duration=500)
  sync1: AND(label="PB2 inside PB1 window")
  sync2: AND(label="PB1 inside PB2 window")
  any_sync: OR(label="Synchronous Press Proved")
  both_held: AND(label="Both Actively Held")
  valid_run: AND(label="Synchronous & Held")
  run_cmd: OUTPUT(label="Press Stroke Permissive")
  sync_lamp: OUTPUT(label="Sync Timing OK (<500ms)")

  pb1.Q -> edge1.A
  pb2.Q -> edge2.A
  edge1.Q -> window1.A
  edge2.Q -> window2.A
  window1.Q -> sync1.A
  pb2.Q -> sync1.B
  window2.Q -> sync2.A
  pb1.Q -> sync2.B
  sync1.Q -> any_sync.A
  sync2.Q -> any_sync.B
  pb1.Q -> both_held.A
  pb2.Q -> both_held.B
  any_sync.Q -> valid_run.A
  both_held.Q -> valid_run.B
  valid_run.Q -> run_cmd.A
  any_sync.Q -> sync_lamp.A
}
`;

const SAFETY_LAB3_DSL = `circuit "Stage 3 - Type III C Redundant Safety Train" version 1 {
  estop: NC_INPUT(label="E-Stop Button (NC)", value=false)
  pb1: INPUT(label="Left Hand PB-101A", value=false)
  pb2: INPUT(label="Right Hand PB-101B", value=false)
  tdc_cam: INPUT(label="TDC Stroke Complete Cam", value=false)
  valveA_spool: INPUT(label="Valve A Spool Proved Normal", value=true)
  valveB_spool: INPUT(label="Valve B Spool Proved Normal", value=true)

  edge1: R_TRIG()
  edge2: R_TRIG()
  window1: TOF(duration=500)
  window2: TOF(duration=500)
  sync1: AND()
  sync2: AND()
  any_sync: OR()
  both_held: AND()
  sync_held: AND()

  anti_repeat: RS_LATCH(label="Anti-Repeat Single-Stroke Latch")
  both_released: NOR(label="Both Released to Reset")

  spool_healthy: AND(label="Dual Spool Feedback Healthy")
  system_permissive: AND(label="Safety Permissive")

  dual_out_A: AND()
  dual_out_B: AND()

  valveA_cmd: OUTPUT(label="Safety Valve Pilot Solenoid A")
  valveB_cmd: OUTPUT(label="Safety Valve Pilot Solenoid B")
  stroke_active: OUTPUT(label="Press Downstroke Active")
  fault_lamp: OUTPUT(label="Safety Valve Spool Fault")

  spool_fault: NOT()
  spool_fault.Q -> fault_lamp.A

  valveA_spool.Q -> spool_healthy.A
  valveB_spool.Q -> spool_healthy.B
  spool_healthy.Q -> spool_fault.A

  estop.Q -> system_permissive.A
  spool_healthy.Q -> system_permissive.B

  pb1.Q -> edge1.A
  pb2.Q -> edge2.A
  edge1.Q -> window1.A
  edge2.Q -> window2.A
  window1.Q -> sync1.A
  pb2.Q -> sync1.B
  window2.Q -> sync2.A
  pb1.Q -> sync2.B
  sync1.Q -> any_sync.A
  sync2.Q -> any_sync.B

  pb1.Q -> both_held.A
  pb2.Q -> both_held.B
  any_sync.Q -> sync_held.A
  both_held.Q -> sync_held.B

  sync_held.Q -> anti_repeat.S
  tdc_cam.Q -> anti_repeat.R

  pb1.Q -> both_released.A
  pb2.Q -> both_released.B

  anti_repeat.Q -> dual_out_A.A
  both_held.Q -> dual_out_A.B

  dual_out_A.Q -> dual_out_B.A
  system_permissive.Q -> dual_out_B.B

  dual_out_B.Q -> valveA_cmd.A
  dual_out_B.Q -> valveB_cmd.A
  dual_out_B.Q -> stroke_active.A
}
`;

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
    slug: 'industrial-heater-pi-pwm-anti-windup',
    title: 'When 100% Heat Is Not Enough: PI Control, PWM, and Anti-Windup',
    excerpt: 'Build an industrial heater controller in three interactive FBD labs: proportional demand, PI with PWM, and a closed-loop thermal plant with live tuning and saturation-recovery experiments.',
    author: 'AutomationHub Editorial',
    date: 'Oct 19',
    readingTime: '20 min read + 25 min labs',
    tag: 'Process Control',
    views: 24190,
    content: (
      <div className="space-y-6">
        <div className="my-8 not-prose rounded-xl overflow-hidden border border-zinc-300 shadow-xl bg-white">
          <img
            src={HEATER_SVG_DATA_URI}
            alt="Heater control schematic showing setpoint, TIC-101, PWM, SSR, heater, temperature feedback, and a separate high-temperature power isolation path."
            className="w-full h-auto object-cover max-h-[550px]"
          />
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs font-mono text-zinc-400 flex flex-wrap justify-between items-center gap-2">
            <span className="text-emerald-400 font-semibold">FIG 1.1 // HEATER CONTROL &amp; INDEPENDENT LIMIT PATH</span>
            <span>FUNCTIONAL SCHEMATIC: CLOSED-LOOP PI, TIME-PROPORTIONED PWM &amp; HARDWIRED CUTOUT</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-8 mb-4">
          1. The $18,600 Batch That Kept Getting Hotter
        </h2>
        <p>
          At 02:17, the operator reduced the jacket-temperature setpoint from 90°C to 60°C. The heater output stayed at 100%.
        </p>
        <p>
          For the previous warm-up period, the controller had been demanding more heat than the installed heater could deliver. Its integral term kept accumulating error. Now the temperature was above the new target, but the stored integral demand was still large enough to hold the output against its upper limit.
        </p>
        <p>
          The jacket overshot the revised recipe temperature. Heat continued moving into the product, viscosity drifted outside the batch specification, and the shift stopped the line. The illustrative loss ledger was $12,000 of rejected material plus three hours of downtime at $2,200 per hour: $18,600 before cleanup.
        </p>
        <p>
          The mistake was treating a bounded output as proof of a bounded controller state. Limiting the displayed command to 100% does not, by itself, stop an integrator from winding up. Anti-windup must account for actuator saturation inside the control algorithm.
        </p>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-10 mb-4">
          2. The Technical Blueprint: Follow the Heat, Then Follow the Signal
        </h2>
        <p>
          Our process is an electrically heated, well-mixed jacket represented by one measured temperature. HTR-101 supplies heat. TT-101 measures temperature. TIC-101 compares that measurement with the operator&apos;s setpoint and produces a 0–100% demand. PWM-101 converts that demand into a repeating ON/OFF signal for SSR-101.
        </p>
        <p>
          The diagram also shows an independent high-temperature limit and a power contactor. These belong in the physical protection design; they are not implemented by the three instructional control circuits.
        </p>

        <div className="my-6 overflow-x-auto not-prose rounded-xl border border-zinc-200 shadow-sm bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              <tr>
                <th className="px-4 py-3 border-b border-zinc-200">Tag or variable</th>
                <th className="px-4 py-3 border-b border-zinc-200">Meaning</th>
                <th className="px-4 py-3 border-b border-zinc-200">Laboratory value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-zinc-900">SP</td>
                <td className="px-4 py-3 text-zinc-800">Requested jacket temperature</td>
                <td className="px-4 py-3 text-zinc-800">60°C initially</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-zinc-900">TT-101 / PV</td>
                <td className="px-4 py-3 text-zinc-800">Measured jacket temperature</td>
                <td className="px-4 py-3 text-zinc-800">Generated by the plant in Stage 3</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-zinc-900">TIC-101 / u</td>
                <td className="px-4 py-3 text-zinc-800">Heater demand</td>
                <td className="px-4 py-3 text-zinc-800">0–100%; 50 means 50%, not 0.50</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-zinc-900">PWM-101</td>
                <td className="px-4 py-3 text-zinc-800">Time-proportioning period</td>
                <td className="px-4 py-3 text-zinc-800">2,000 ms</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-zinc-900">SSR-101</td>
                <td className="px-4 py-3 text-zinc-800">Solid-state power-switch command</td>
                <td className="px-4 py-3 text-zinc-800">Digital ON/OFF indicator</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-zinc-900">Tₐ</td>
                <td className="px-4 py-3 text-zinc-800">Ambient reference</td>
                <td className="px-4 py-3 text-zinc-800">20°C</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-zinc-900">K</td>
                <td className="px-4 py-3 text-zinc-800">Steady-state temperature rise per output %</td>
                <td className="px-4 py-3 text-zinc-800">0.8°C/%</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-zinc-900">τ</td>
                <td className="px-4 py-3 text-zinc-800">First-order thermal time constant</td>
                <td className="px-4 py-3 text-zinc-800">30,000 ms = 30 s</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-zinc-900">L</td>
                <td className="px-4 py-3 text-zinc-800">Additional heat-removal disturbance</td>
                <td className="px-4 py-3 text-zinc-800">0°C initially</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>The teaching plant follows the first-order differential equation:</p>
        <div className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800">
          30 × dT/dt = 20 + 0.8u − L − T
        </div>
        <p>
          At steady state, <code>T = 20 + 0.8u − L</code>. With no additional load, 50% output holds 60°C and 100% output approaches 100°C. A request for 110°C is therefore unreachable.
        </p>

        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg my-4 text-sm font-sans text-blue-950">
          <strong className="block font-semibold mb-1">Before running the labs</strong>
          <p>
            The numerical tuning below assumes integral gain is applied per second. Anti-windup clamps the internal integrator to prevent output runaway during actuator saturation.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          3. Stage 1: Calculate the Error Before You Tune the Loop
        </h2>
        <p>
          For a heating process, define error as <code>e = SP − PV</code>. A positive error should request more heat. Start with a proportional gain of 2 output percentage points per degree:
        </p>
        <div className="bg-zinc-100 p-4 rounded-lg font-mono text-sm not-prose my-3 border border-zinc-200 text-zinc-800">
          u_raw = 2 × (SP − PV)
        </div>
        <p>
          The heater cannot produce negative power or exceed full output, so the usable command is <code>u = max(0, min(100, u_raw))</code>.
        </p>
        <p>
          The first lab builds those limits explicitly. The low comparator selects zero whenever raw demand is negative. The high comparator then selects 100 whenever the lower-limited result exceeds 100.
        </p>

        <InlineLab
          dsl={HEATER_LAB1_DSL}
          title="Stage 1: Error, Proportional Demand, and Output Limits"
          step="Stage 1 of 3"
          height={540}
        />

        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg my-4 text-sm font-sans text-blue-950">
          <strong className="block font-semibold mb-1">Interactive exercise: prove the direction and both limits</strong>
          <p>
            Keep SP at 60°C. Set PV to 20°C: error should be 40°C and demand 80%. Change PV to 55°C: demand should fall to 10%. Change PV to 70°C: raw demand should be −20%, but limited demand must be 0%. Finally set SP to 80°C and PV to 20°C: raw demand should be 120%, while limited demand remains 100%.
          </p>
        </div>

        <h3 className="text-xl font-bold font-serif text-zinc-900 mt-8 mb-3">
          Why proportional control settles below the target
        </h3>
        <p>
          At exactly zero error, this proportional-only controller requests zero heat. But our jacket needs 50% power to remain at 60°C. It must retain a positive error to generate the required holding power.
        </p>
        <p>
          Combining the unsaturated proportional controller with the zero-load plant gives:
        </p>
        <div className="bg-zinc-100 p-4 rounded-lg font-mono text-sm not-prose my-3 border border-zinc-200 text-zinc-800">
          T = 20 + 0.8 × 2 × (60 − T) &nbsp;⇒&nbsp; T ≈ 44.6°C, u ≈ 30.8%
        </div>
        <p>
          The remaining 15.4°C error is <strong>steady-state droop</strong>. Integral action supplies the missing holding demand.
        </p>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          4. Stage 2: Add Integral Action and Translate Demand into Switching
        </h2>
        <p>
          A PI controller combines the immediate proportional response with an accumulated correction:
        </p>
        <div className="bg-zinc-100 p-4 rounded-lg font-mono text-sm not-prose my-3 border border-zinc-200 text-zinc-800">
          u_raw(t) = Kp × e(t) + Ki × ∫ e(τ) dτ
        </div>
        <p>
          We use <code>PID_CONTROLLER</code> with <code>kd=0</code> and internal limits set to the actuator&apos;s actual range: 0–100%. The starting values are <code>kp=4</code> and <code>ki=0.1</code>. Under the seconds-based parallel PI convention, that corresponds to an integral time <code>Kp/Ki</code> of 40 seconds.
        </p>
        <p>
          PWM converts controller demand into an ON fraction of a repeating period. With a 2,000 ms period, a steady 25% demand represents approximately 500 ms ON and 1,500 ms OFF; 50% represents 1,000 ms of each.
        </p>

        <InlineLab
          dsl={HEATER_LAB2_DSL}
          title="Stage 2: PI Demand and Time-Proportioned Heater Output"
          step="Stage 2 of 3"
          height={560}
        />

        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg my-4 text-sm font-sans text-blue-950">
          <strong className="block font-semibold mb-1">Interactive exercise: watch the integral term at work</strong>
          <p>
            With SP at 60°C, change manual PV from 60°C to 50°C. Observe the initial proportional response and then increasing demand while the error persists. The SSR command should spend progressively more of each period ON. Return PV to 60°C and observe the retained demand; zero error does not necessarily mean zero output. Then set PV to 70°C and watch demand reduce. Keep the experiment running until you have also observed the upper-limit lamp at 100%.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          5. Stage 3: Close the Loop and Challenge It
        </h2>
        <p>
          Replace manual PV with a thermal plant. The controller&apos;s percentage output is multiplied by 0.8, the equivalent cooling load is subtracted, and a first-order lag with <code>tau=30000</code> models thermal inertia. Adding 20°C converts temperature rise into absolute temperature for feedback.
        </p>
        <p>
          The circuit calculates <code>e_scaled = G × (SP − PV)</code>, feeding that value into the PID&apos;s SP pin, and feeding zero into its PV pin. This enables interactive live gain tuning without modifying block parameters!
        </p>

        <InlineLab
          dsl={HEATER_LAB3_DSL}
          title="Stage 3: Thermal Feedback, Live Tuning, and Saturation Recovery"
          step="Stage 3 of 3"
          height={680}
        />

        <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 rounded-r-lg my-4 text-sm font-sans text-emerald-950">
          <strong className="block font-semibold mb-1">Model fidelity: average power versus switching ripple</strong>
          <p>
            The thermal plant receives the analog duty demand as average heater power. The PWM branch shows the corresponding SSR command, but its digital pulses do not drive the plant. This intentional averaged model does not simulate switching ripple or electrical power faults. A two-second PWM period is short relative to the assumed 30-second thermal time constant, making average power useful for this lesson.
          </p>
        </div>

        <h3 className="text-xl font-bold font-serif text-zinc-900 mt-8 mb-3">
          Controlled Experiments to Perform
        </h3>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <strong>Experiment A (Reachable Steady-State):</strong> Start with SP = 60°C, G = 1, and L = 0°C. Watch demand and temperature together. From a cool start (20°C), demand ramps to 100% while temperature rises gradually. Notice how it lands smoothly at 60°C with exactly 50% demand! Change SP to 70°C: steady-state demand settles at exactly 62.5% because <code>(70 − 20)/0.8 = 62.5%</code>.
          </li>
          <li>
            <strong>Experiment B (Cooling Load Disturbance):</strong> Return SP to 60°C. Change the cooling-load input from 0°C to 10°C. Temperature initially dips, and the controller compensates by driving demand up to 62.5%. Remove the load and verify demand returns to 50%.
          </li>
          <li>
            <strong>Experiment C (Anti-Windup Saturation Recovery):</strong> Set SP = 110°C (with G=1, L=0). 110°C would require 112.5% heat, which is physically impossible. The controller saturates at 100% output, and the saturation lamp turns ON. Temperature tops out near 100°C. After holding for 60 seconds, drop SP down to 60°C. Because the integrator is bounded by anti-windup clamping, the output drops out of saturation immediately without catastrophic overshoot!
          </li>
        </ol>

        <div className="my-6 overflow-x-auto not-prose rounded-xl border border-zinc-200 shadow-sm bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              <tr>
                <th className="px-4 py-3 border-b border-zinc-200">Operating point</th>
                <th className="px-4 py-3 border-b border-zinc-200">Expected steady-state demand</th>
                <th className="px-4 py-3 border-b border-zinc-200">Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-zinc-900">SP 60°C, L 0°C</td>
                <td className="px-4 py-3 text-zinc-800">50%</td>
                <td className="px-4 py-3 text-zinc-800">Reachable normal operation</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-zinc-900">SP 70°C, L 0°C</td>
                <td className="px-4 py-3 text-zinc-800">62.5%</td>
                <td className="px-4 py-3 text-zinc-800">Reachable higher temperature</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-zinc-900">SP 60°C, L 10°C</td>
                <td className="px-4 py-3 text-zinc-800">62.5%</td>
                <td className="px-4 py-3 text-zinc-800">Additional load requires additional power</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-zinc-900">SP 110°C, L 0°C</td>
                <td className="px-4 py-3 text-zinc-800">Would require 112.5%</td>
                <td className="px-4 py-3 text-zinc-800">Unreachable; output saturates at 100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          6. Commissioning Checklist: What Must Be Proven on the Plant Floor
        </h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>
            <strong>Prove measurement scaling:</strong> Inject known transmitter signals and verify the displayed engineering units at several points. Confirm sensor type, range, polarity, and the behavior on sensor failure.
          </li>
          <li>
            <strong>Prove the direction of action at low power:</strong> Below setpoint, heating demand should increase. Above setpoint, it should decrease. Verify this through the full chain from software demand to measured heater current.
          </li>
          <li>
            <strong>Identify the process before copying gains:</strong> Record the temperature response to a controlled manual power change. Estimate gain, time constant, and any dead time. Account for product loading and mixing conditions.
          </li>
          <li>
            <strong>Confirm the controller convention:</strong> Determine whether the device uses integral gain or integral time, seconds or minutes, and a parallel or dependent formulation. A number copied between controllers may represent a different algorithm.
          </li>
          <li>
            <strong>Match limits to available power:</strong> Confirm that 100% demand means the actual maximum permitted power. If a downstream limiter or interlock reduces delivered output, assess controller tracking or integration handling rather than assuming its internal limits account for the change.
          </li>
          <li>
            <strong>Verify PWM against the installed actuator:</strong> Check cycle period, minimum practical ON/OFF time, SSR ratings, heat sinking, and actual current switching. A blinking pilot light proves the command signal, not power delivery.
          </li>
          <li>
            <strong>Test the independent high-temperature shutdown:</strong> Confirm its sensor path, trip action, power-isolation device, reset behavior, and response to a failed-on power switch. Follow the approved plant protection design.
          </li>
          <li>
            <strong>Test startup and restart behavior:</strong> Establish permitted output after power restoration, sensor recovery, controller enable, and transfer between manual and automatic operation.
          </li>
          <li>
            <strong>Trend SP, PV, command, and delivered power together:</strong> Include operating mode and trip status. Otherwise a bad sensor, missing heater power, or output override may be mistaken for poor tuning.
          </li>
          <li>
            <strong>Use a controlled saturation-recovery test:</strong> On a live installation, use an approved procedure and safe operating limits; the simulator&apos;s deliberately unreachable 110°C request is a teaching exercise, not a field test instruction.
          </li>
        </ul>
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
    title: 'The $240,000 Tie-Down Disaster: Engineering ISO 13851 Type III C Two-Hand Safety Controls',
    excerpt: 'A deep masterclass in functional safety: diagnosing why naive AND-gate circuits cause catastrophic press amputations, implementing the strict 500 ms synchronism window with anti-tie-down and anti-repeat, and engineering Category 4 / PL e dual-channel monitored safety valves.',
    author: 'Emma Safety',
    date: 'Oct 19',
    readingTime: '18 min read + 20 min labs',
    tag: 'Safety',
    views: 15200,
    content: (
      <div className="space-y-6">
        <div className="my-8 not-prose rounded-xl overflow-hidden border border-zinc-300 shadow-xl bg-white">
          <img
            src={TWO_HAND_SAFETY_SVG_DATA_URI}
            alt="Two-Hand Safety Interlock and Monitored Press Hydraulic Train P&ID"
            className="w-full h-auto object-cover max-h-[550px]"
          />
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs font-mono text-zinc-400 flex flex-wrap justify-between items-center gap-2">
            <span className="text-emerald-400 font-semibold">FIG 1.1 // TWO-HAND CONTROL &amp; MONITORED PRESS SAFETY TRAIN</span>
            <span>ISO 13851 TYPE III C &amp; CATEGORY 4 / PL e ARCHITECTURE</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-8 mb-4">
          1. The 07:15 AM Stamping Press Amputation Near-Miss
        </h2>
        <p>
          At 07:15 on a Tuesday morning inside a tier-1 automotive chassis stamping facility, the plant safety siren echoed across the press bay. A 150-ton hydraulic C-frame stamping press had just cycled while an operator was reaching into the die bed to dislodge a jammed sheet metal blank.
        </p>
        <p>
          The operator survived with severe crushing injuries, escaping traumatic amputation by fractions of an inch. During the subsequent OSHA investigation and root-cause analysis, investigators discovered a wooden wedge wrapped in electrical tape forced into the left-hand actuation button (<code>PB-101A</code>).
        </p>
        <p>
          The machine builder had written naive boolean concurrence inside a standard programmable controller:
        </p>
        <div className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800">
          IF Left_PB AND Right_PB THEN Clutch_Solenoid = TRUE<br />
          ELSE Clutch_Solenoid = FALSE
        </div>
        <p>
          To boost piece-rate production quota, the operator had wedged the left button permanently down, freeing their left hand to load sheet metal blanks while cycling the 150-ton ram single-handedly using only the right button! While reaching into the pinch zone to clear an off-center slug, their hip accidentally brushed against the right button. The hydraulic ram surged downward with 3,000 PSI of fluid pressure.
        </p>
        <p>
          The incident resulted in a $240,000 regulatory fine, immediate revocation of machine CE certification, and an emergency plant-wide safety shutdown across all twelve stamping lines.
        </p>

        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg my-4 text-sm font-sans text-amber-950">
          <strong className="block font-semibold mb-1">Regulatory Mandate: OSHA 1910.217 &amp; ISO 13849-1</strong>
          <p>
            Never use standard PLC inputs or non-safety boolean gates for primary operator point-of-operation safeguarding. A single welded contact, short circuit, or mechanical tie-down wedge completely defeats naive software logic. Certified safety controllers, dual-channel inputs with test pulsing, and monitored safety valves are mandatory by international law.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          2. Engineering Standards: ISO 13851 Classification &amp; The Physics of Distance
        </h2>
        <p>
          Point-of-operation safeguarding by two-hand control is governed by <strong>ISO 13851</strong>. The standard categorizes two-hand controls into functional types based on their resistance to defeat and internal architecture:
        </p>

        <div className="my-6 overflow-x-auto not-prose rounded-xl border border-zinc-200 shadow-sm bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              <tr>
                <th className="px-4 py-3 border-b border-zinc-200">ISO 13851 Type</th>
                <th className="px-4 py-3 border-b border-zinc-200">Synchronous Window</th>
                <th className="px-4 py-3 border-b border-zinc-200">Anti-Tie-Down</th>
                <th className="px-4 py-3 border-b border-zinc-200">ISO 13849-1 Cat / PL</th>
                <th className="px-4 py-3 border-b border-zinc-200">Industrial Application</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-semibold text-zinc-900">Type I</td>
                <td className="px-4 py-3 text-zinc-600">No (Static concurrence)</td>
                <td className="px-4 py-3 text-zinc-600">No</td>
                <td className="px-4 py-3 text-zinc-600">Cat B / PL a</td>
                <td className="px-4 py-3 text-zinc-600">Non-hazardous auxiliary positioning</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-semibold text-zinc-900">Type II</td>
                <td className="px-4 py-3 text-zinc-600">No</td>
                <td className="px-4 py-3 text-zinc-600">Yes (Both release required)</td>
                <td className="px-4 py-3 text-zinc-600">Cat 1 / PL c</td>
                <td className="px-4 py-3 text-zinc-600">Low-speed material clamping</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-semibold text-zinc-900">Type III A</td>
                <td className="px-4 py-3 text-zinc-600">Yes (&Delta;t &le; 500 ms)</td>
                <td className="px-4 py-3 text-zinc-600">Yes</td>
                <td className="px-4 py-3 text-zinc-600">Cat 1 / PL c</td>
                <td className="px-4 py-3 text-zinc-600">Pneumatic riveters, light presses</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-semibold text-zinc-900">Type III B</td>
                <td className="px-4 py-3 text-zinc-600">Yes (&Delta;t &le; 500 ms)</td>
                <td className="px-4 py-3 text-zinc-600">Yes</td>
                <td className="px-4 py-3 text-zinc-600">Cat 3 / PL d</td>
                <td className="px-4 py-3 text-zinc-600">Intermediate mechanical presses</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors bg-teal-50/50">
                <td className="px-4 py-3 font-semibold text-teal-900">Type III C</td>
                <td className="px-4 py-3 text-teal-800">Yes (&Delta;t &le; 500 ms)</td>
                <td className="px-4 py-3 text-teal-800">Yes</td>
                <td className="px-4 py-3 text-teal-800 font-bold">Cat 4 / PL e</td>
                <td className="px-4 py-3 text-teal-800">Heavy hydraulic &amp; mechanical stamping presses</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-bold font-serif text-zinc-900 mt-8 mb-3">
          The Physics of Safety Distance: EN ISO 13855
        </h3>
        <p>
          Even the most rigorous Type III C logic cannot save an operator if the console is mounted too close to the pinch point. Once the operator releases either button, their hand moves toward the closing die at human approach speed (<em>K</em>). The safety distance (<em>S</em>) must satisfy:
        </p>
        <div className="bg-zinc-900 text-teal-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800 text-center">
          S = (K &times; T) + C
        </div>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>K = 1,600 mm/s:</strong> Standard hand approach speed defined by EN ISO 13855.</li>
          <li><strong>T = t&#8321; + t&#8322;:</strong> Overall system stopping performance, where t&#8321; is safety controller reaction time (e.g. 15 ms) and t&#8322; is valve de-energization and hydraulic brake stopping time (e.g. 180 ms), totaling T = 195 ms.</li>
          <li><strong>C = 250 mm:</strong> Penetration depth constant (minimum 250 mm for two-hand consoles without physical shrouds, reducible to 0 mm when buttons have physical ring guards and &ge; 260 mm button separation).</li>
        </ul>
        <p>
          For a press system with T = 0.22 s and shrouded buttons (C = 0): S = (1,600 &times; 0.22) + 0 = 352 mm. Mounting the buttons even 50 mm closer would allow a fast operator to enter the pinch zone before the hydraulic ram comes to a complete standstill!
        </p>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          3. Stage 1: The Naive Bypass Flaw (Why Boolean AND Fails)
        </h2>
        <p>
          To understand why traditional ladder logic fails, examine the Stage 1 circuit below. It implements a simple <code>AND</code> gate combining <code>PB-101A</code> and <code>PB-101B</code>.
        </p>

        <InlineLab
          dsl={SAFETY_LAB1_DSL}
          title="Stage 1: The Naive Concurrence &amp; The Fatal Bypass"
          step="Stage 1 of 3"
          height={520}
        />

        <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg my-4 text-sm font-sans text-red-950">
          <strong className="block font-semibold mb-1">Interactive Exercise — Stage 1 (Simulate the Fatal Bypass)</strong>
          <p>
            In Stage 1 above, toggle <strong>Left Hand PB-101A</strong> to ON (simulating an operator taping down the button or wedging it with a piece of wood). Notice that the input stays permanently energized. Now toggle <strong>Right Hand PB-101B</strong> on and off: observe that you can actuate the Press Ram single-handedly at will! The operator&apos;s left hand is completely free to reach into the 150-ton pinch zone. This is the exact fatal defect that caused the $240,000 amputation incident.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          4. Stage 2: The 500 ms Synchronism Window &amp; Anti-Tie-Down
        </h2>
        <p>
          To eliminate the tie-down bypass, ISO 13851 mandates <strong>Synchronous Actuation</strong>:
          Both pushbuttons must be pressed within a time window of <strong>no more than 500 ms</strong>:
        </p>
        <div className="bg-zinc-900 text-teal-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800 text-center">
          | t(PB-101A) &minus; t(PB-101B) | &le; 500 ms
        </div>
        <p>
          If either button is pressed first, a rising-edge trigger (<code>R_TRIG</code>) starts an off-delay timer (<code>TOF</code>) with a 500 ms preset. The second button must transition to TRUE before that 500 ms window expires. If an operator wedges <code>PB-101A</code> down permanently:
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>The rising edge fires once when the wedge is inserted, timing out after 500 ms.</li>
          <li>When the operator later presses <code>PB-101B</code>, the 500 ms window from PB-A has long expired.</li>
          <li>No permissive command is produced. Both buttons must be fully released to re-arm the edge triggers!</li>
        </ol>

        <InlineLab
          dsl={SAFETY_LAB2_DSL}
          title="Stage 2: 500 ms Synchronism Window &amp; Anti-Tie-Down"
          step="Stage 2 of 3"
          height={520}
        />

        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg my-4 text-sm font-sans text-blue-950">
          <strong className="block font-semibold mb-1">Interactive Exercise — Stage 2 (Testing Synchronism &amp; Lockout)</strong>
          <p>
            In Stage 2 above, click <strong>PB-101A</strong> and then immediately click <strong>PB-101B</strong> within 500 ms. Notice how <strong>Press Stroke Permissive</strong> and <strong>Sync Timing OK</strong> energize! Now reset both to OFF. Next, simulate a tie-down bypass: toggle <strong>PB-101A</strong> to ON and wait 2 seconds. Now toggle <strong>PB-101B</strong> to ON. Notice that the press permissive refuses to energize! The circuit successfully detects the tie-down and locks out operation.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          5. Stage 3: Type III C Full Safety Train (Anti-Repeat &amp; Monitored Valves)
        </h2>
        <p>
          Synchronous actuation alone is not enough for heavy industrial presses. Two critical mechanical hazards remain:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Continuous Holding &amp; Repeat Strokes:</strong> If an operator keeps both buttons held down after the ram completes a punch, the machine must not begin a second stroke automatically. An <strong>Anti-Repeat</strong> single-stroke circuit is required. The stroke memory latches on valid synchronous press, and is reset by the <strong>Top Dead Center (TDC) Cam Switch</strong>. Both buttons must be released (<code>NOR</code> gate) before the next cycle can initiate.
          </li>
          <li>
            <strong>Valve Spool Sticking (Single Point of Failure):</strong> Hydraulic valves can weld or seize due to particulate contamination in 3,000 PSI oil. In a Category 4 / PL e architecture, redundant dual valves (<code>SV-101</code> and <code>SV-102</code>) are piped in series. Inductive proximity sensors (<code>ZSO-101</code> and <code>ZSO-102</code>) verify that both spools are in their de-energized resting state before power is applied. If either valve sticks open, a Spool Fault is triggered and all subsequent motion is locked out!
          </li>
        </ul>

        <InlineLab
          dsl={SAFETY_LAB3_DSL}
          title="Stage 3: Full Category 4 / PL e Two-Hand Safety Train"
          step="Stage 3 of 3"
          height={650}
        />

        <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 rounded-r-lg my-4 text-sm font-sans text-emerald-950">
          <strong className="block font-semibold mb-1">Interactive Exercise — Stage 3 (Simulate Spool Jamming &amp; TDC Reset)</strong>
          <p>
            In Stage 3 above:
            <br />1. Click <strong>PB-101A</strong> and <strong>PB-101B</strong> synchronously. Dual Safety Valve Solenoids A &amp; B energize together and <strong>Press Downstroke Active</strong> engages!
            <br />2. Now pulse the <strong>TDC Stroke Complete Cam</strong> to ON: notice the anti-repeat latch instantly resets and de-energizes the valve outputs, even if both pushbuttons remain held down!
            <br />3. Now simulate a welded or jammed hydraulic valve: toggle <strong>Valve A Spool Proved Normal</strong> to OFF. Watch <strong>Safety Valve Spool Fault</strong> trip immediately, dropping safety permissives and preventing any further press actuation!
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          6. Commissioning Checklist &amp; Mandatory Plant Floor Proof Testing
        </h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>
            <strong>500 ms Synchronism Verification:</strong> Use a calibrated multi-channel digital oscilloscope or safety PLC trace buffer to measure input arrival times. Press PB-A, wait 550 ms, press PB-B, and verify zero voltage reaches the valve pilots. Repeat with PB-B leading.
          </li>
          <li>
            <strong>Anti-Tie-Down Proof Test:</strong> Mechanically clamp or wedge PB-A in the actuated position. Actuate PB-B fifty consecutive times at random intervals. Verify zero unintended machine motion occurs on every cycle.
          </li>
          <li>
            <strong>Anti-Repeat Limit Cam Integrity:</strong> Initiate a legitimate stroke and deliberately hold both buttons down continuously for 10 seconds. Verify the ram performs exactly one stroke, hits the Top Dead Center (TDC) limit switch, halts, and will not repeat until both buttons are released.
          </li>
          <li>
            <strong>Cross-Monitoring Discrepancy Fault:</strong> Disconnect the feedback connector from valve spool position sensor ZSO-101. Attempt a press cycle. Verify the safety relay drops out within 20 ms and displays a permanent cross-monitoring fault code.
          </li>
          <li>
            <strong>Safety Distance Physical Audit:</strong> Measure the physical distance from the center of the pushbuttons to the closest point of the pinch hazard. Confirm that the distance meets or exceeds <em>S = (1,600 mm/s &times; T) + C</em> based on the latest annual stopping-time measurement report.
          </li>
          <li>
            <strong>Physical Button Shrouding &amp; Separation:</strong> Verify pushbuttons are separated by at least 260 mm centerline-to-centerline or isolated by a rigid physical baffle to prevent simultaneous actuation with one hand, wrist, or elbow.
          </li>
          <li>
            <strong>Pre-Shift Functional Safety Inspection:</strong> Operators must perform a documented functional test at every shift handover: verify E-Stop trips immediately, individual button presses produce no motion, and late actuation (&gt;500 ms) inhibits stroke initiation.
          </li>
        </ul>
      </div>
    ),
    dsl: ''
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
