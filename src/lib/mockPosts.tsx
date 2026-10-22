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
import { TANK_HYSTERESIS_SVG } from './tankHysteresisBlueprintSvg';
import { TRAFFIC_LIGHT_SVG } from './trafficBlueprintSvg';
import { PUMP_ALTERNATOR_SVG } from './pumpAlternatorBlueprintSvg';
import { CONVEYOR_SORTING_SVG } from './conveyorBlueprintSvg';
import { HVAC_ECONOMIZER_SVG_DATA_URI } from './hvacBlueprintSvg';
import { ESD_DELAYS_SVG_DATA_URI } from './esdBlueprintSvg';
import { SOLAR_LOGGING_SVG_DATA_URI } from './solarBlueprintSvg';

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

const TANK_HYSTERESIS_SVG_DATA_URI =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(TANK_HYSTERESIS_SVG);

const HYSTERESIS_LAB1_DSL = `circuit "Stage 1 - The Naive Single-Setpoint Flaw" version 1 {
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
}
`;

const HYSTERESIS_LAB2_DSL = `circuit "Stage 2 - Hysteresis Band (Schmitt Trigger)" version 1 {
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
}
`;

const HYSTERESIS_LAB3_DSL = `circuit "Stage 3 - Closed-Loop Storage Tank with Dynamic Hysteresis" version 1 {
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
}
`;

const TRAFFIC_LIGHT_SVG_DATA_URI =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(TRAFFIC_LIGHT_SVG);

const TRAFFIC_LAB1_DSL = `circuit "Stage 1 - The Naive Cascade & Missing Clearance" version 1 {
  run: INPUT(label="Master Run Enable", value=true)
  t_ns_g: TON(label="NS Green Timer (3s)", duration=3000)
  t_ns_y: TON(label="NS Yellow Timer (1.5s)", duration=1500)
  t_ew_g: TON(label="EW Green Timer (3s)", duration=3000)
  t_ew_y: TON(label="EW Yellow Timer (1.5s)", duration=1500)

  cycle_delay: SCAN_DELAY()
  loop_reset: NOT()
  gate_run: AND()

  not_ns_g: NOT()
  not_ns_y: NOT()
  not_ew_g: NOT()
  not_ew_y: NOT()

  ns_g_active: AND()
  ns_y_active: AND()
  ew_g_active: AND()
  ew_y_active: AND()

  ns_green: OUTPUT(label="North-South Green")
  ns_yellow: OUTPUT(label="North-South Yellow")
  ns_red: OUTPUT(label="North-South Red")
  ew_green: OUTPUT(label="East-West Green")
  ew_yellow: OUTPUT(label="East-West Yellow")
  ew_red: OUTPUT(label="East-West Red")
  hazard_alert: OUTPUT(label="Collision Hazard: 0s All-Red Clearance")

  run.Q -> gate_run.A
  loop_reset.Q -> gate_run.B
  gate_run.Q -> t_ns_g.A

  t_ns_g.Q -> not_ns_g.A
  gate_run.Q -> ns_g_active.A
  not_ns_g.Q -> ns_g_active.B
  ns_g_active.Q -> ns_green.A

  t_ns_g.Q -> t_ns_y.A
  t_ns_y.Q -> not_ns_y.A
  t_ns_g.Q -> ns_y_active.A
  not_ns_y.Q -> ns_y_active.B
  ns_y_active.Q -> ns_yellow.A

  t_ns_y.Q -> t_ew_g.A
  t_ew_g.Q -> not_ew_g.A
  t_ns_y.Q -> ew_g_active.A
  not_ew_g.Q -> ew_g_active.B
  ew_g_active.Q -> ew_green.A

  t_ew_g.Q -> t_ew_y.A
  t_ew_y.Q -> not_ew_y.A
  t_ew_g.Q -> ew_y_active.A
  not_ew_y.Q -> ew_y_active.B
  ew_y_active.Q -> ew_yellow.A

  t_ew_y.Q -> cycle_delay.A
  cycle_delay.Q -> loop_reset.A

  ew_g_active.Q -> ns_red.A
  ns_g_active.Q -> ew_red.A
  ew_g_active.Q -> hazard_alert.A
}
`;

const TRAFFIC_LAB2_DSL = `circuit "Stage 2 - Dual-Ring Controller with All-Red Clearance" version 1 {
  run: INPUT(label="Intersection Sequence Enable", value=true)
  t1_ns_g: TON(label="P1: NS Green (3.5s)", duration=3500)
  t2_ns_y: TON(label="P2: NS Yellow (1.5s)", duration=1500)
  t3_clear1: TON(label="P3: All-Red Clear (1.5s)", duration=1500)
  t4_ew_g: TON(label="P4: EW Green (3.0s)", duration=3000)
  t5_ew_y: TON(label="P5: EW Yellow (1.5s)", duration=1500)
  t6_clear2: TON(label="P6: All-Red Clear (1.5s)", duration=1500)

  cycle_delay: SCAN_DELAY()
  cycle_reset: NOT()
  master_gate: AND()

  not_t1: NOT()
  not_t2: NOT()
  not_t3: NOT()
  not_t4: NOT()
  not_t5: NOT()
  not_t6: NOT()

  p1_active: AND()
  p2_active: AND()
  p3_active: AND()
  p4_active: AND()
  p5_active: AND()
  p6_active: AND()

  or_clear: OR()
  ew_active_any: OR()
  ns_active_any: OR()
  ns_red_gate: OR()
  ew_red_gate: OR()

  ns_g: OUTPUT(label="North-South Green")
  ns_y: OUTPUT(label="North-South Yellow")
  ns_r: OUTPUT(label="North-South Red")
  ew_g: OUTPUT(label="East-West Green")
  ew_y: OUTPUT(label="East-West Yellow")
  ew_r: OUTPUT(label="East-West Red")
  all_red: OUTPUT(label="All-Red Clearance Interval Active")

  run.Q -> master_gate.A
  cycle_reset.Q -> master_gate.B
  master_gate.Q -> t1_ns_g.A

  t1_ns_g.Q -> not_t1.A
  master_gate.Q -> p1_active.A
  not_t1.Q -> p1_active.B
  p1_active.Q -> ns_g.A

  t1_ns_g.Q -> t2_ns_y.A
  t2_ns_y.Q -> not_t2.A
  t1_ns_g.Q -> p2_active.A
  not_t2.Q -> p2_active.B
  p2_active.Q -> ns_y.A

  t2_ns_y.Q -> t3_clear1.A
  t3_clear1.Q -> not_t3.A
  t2_ns_y.Q -> p3_active.A
  not_t3.Q -> p3_active.B

  t3_clear1.Q -> t4_ew_g.A
  t4_ew_g.Q -> not_t4.A
  t3_clear1.Q -> p4_active.A
  not_t4.Q -> p4_active.B
  p4_active.Q -> ew_g.A

  t4_ew_g.Q -> t5_ew_y.A
  t5_ew_y.Q -> not_t5.A
  t4_ew_g.Q -> p5_active.A
  not_t5.Q -> p5_active.B
  p5_active.Q -> ew_y.A

  t5_ew_y.Q -> t6_clear2.A
  t6_clear2.Q -> not_t6.A
  t5_ew_y.Q -> p6_active.A
  not_t6.Q -> p6_active.B

  t6_clear2.Q -> cycle_delay.A
  cycle_delay.Q -> cycle_reset.A

  p3_active.Q -> or_clear.A
  p6_active.Q -> or_clear.B
  or_clear.Q -> all_red.A

  p4_active.Q -> ew_active_any.A
  p5_active.Q -> ew_active_any.B
  ew_active_any.Q -> ns_red_gate.A
  or_clear.Q -> ns_red_gate.B
  ns_red_gate.Q -> ns_r.A

  p1_active.Q -> ns_active_any.A
  p2_active.Q -> ns_active_any.B
  ns_active_any.Q -> ew_red_gate.A
  or_clear.Q -> ew_red_gate.B
  ew_red_gate.Q -> ew_r.A
}
`;

const TRAFFIC_LAB3_DSL = `circuit "Stage 3 - Actuated Intersection with Conflict Monitor" version 1 {
  run: INPUT(label="Intersection Controller Online", value=true)
  loop_ew: INPUT(label="East-West Inductive Loop Detector", value=false)
  ped_call: INPUT(label="Pedestrian Crosswalk Call PB", value=false)
  force_cmu_fault: INPUT(label="Simulate CMU Conflict (Welded Triac)", value=false)

  demand_or: OR(label="Any Service Demand")
  demand_latch: RS_LATCH(label="Side-Street Demand Latch")
  clear_delay: SCAN_DELAY()

  t_ns_y: TON(label="NS Yellow Change (1.5s)", duration=1500)
  t_clear1: TON(label="All-Red Clearance 1 (1.5s)", duration=1500)
  t_ew_g: TON(label="EW Green Extension (3.5s)", duration=3500)
  t_ew_y: TON(label="EW Yellow Change (1.5s)", duration=1500)
  t_clear2: TON(label="All-Red Clearance 2 (1.5s)", duration=1500)

  not_y1: NOT()
  not_c1: NOT()
  not_eg: NOT()
  not_ey: NOT()
  not_c2: NOT()

  ns_y_run: AND()
  c1_run: AND()
  ew_g_run: AND()
  ew_y_run: AND()
  c2_run: AND()

  side_busy: OR()
  side_busy_or2: OR()
  side_busy_or3: OR()
  ns_busy_or: OR()

  ns_rest_g: NOT()
  norm_ns_g: AND()
  norm_ew_g: AND()

  cmu_conflict: AND(label="Simultaneous Dual Green Fault")
  cmu_or: OR()
  cmu_trip: RS_LATCH(label="CMU Hardware Lockout Latch")
  cmu_healthy: NOT()

  flasher: CLOCK(label="Emergency Flasher Timer", onTime=500, offTime=500)
  flash_red: AND()

  out_ns_g: AND()
  out_ns_y: AND()
  out_ns_r: OR()
  out_ew_g: AND()
  out_ew_y: AND()
  out_ew_r: OR()

  ns_green: OUTPUT(label="North-South Green")
  ns_yellow: OUTPUT(label="North-South Yellow")
  ns_red: OUTPUT(label="North-South Red")
  ew_green: OUTPUT(label="East-West Green")
  ew_yellow: OUTPUT(label="East-West Yellow")
  ew_red: OUTPUT(label="East-West Red")
  cmu_alarm: OUTPUT(label="CMU Hardware Fault: Flash Mode")
  ped_walk: OUTPUT(label="Pedestrian WALK Signal")

  loop_ew.Q -> demand_or.A
  ped_call.Q -> demand_or.B
  demand_or.Q -> demand_latch.S
  t_clear2.Q -> clear_delay.A
  clear_delay.Q -> demand_latch.R

  demand_latch.Q -> t_ns_y.A
  t_ns_y.Q -> not_y1.A
  demand_latch.Q -> ns_y_run.A
  not_y1.Q -> ns_y_run.B

  t_ns_y.Q -> t_clear1.A
  t_clear1.Q -> not_c1.A
  t_ns_y.Q -> c1_run.A
  not_c1.Q -> c1_run.B

  t_clear1.Q -> t_ew_g.A
  t_ew_g.Q -> not_eg.A
  t_clear1.Q -> ew_g_run.A
  not_eg.Q -> ew_g_run.B

  t_ew_g.Q -> t_ew_y.A
  t_ew_y.Q -> not_ey.A
  t_ew_g.Q -> ew_y_run.A
  not_ey.Q -> ew_y_run.B

  t_ew_y.Q -> t_clear2.A
  t_clear2.Q -> not_c2.A
  t_ew_y.Q -> c2_run.A
  not_c2.Q -> c2_run.B

  ns_y_run.Q -> side_busy.A
  c1_run.Q -> side_busy.B
  side_busy.Q -> side_busy_or2.A
  ew_g_run.Q -> side_busy_or2.B
  side_busy_or2.Q -> side_busy_or3.A
  ew_y_run.Q -> side_busy_or3.B
  side_busy_or3.Q -> ns_busy_or.A
  c2_run.Q -> ns_busy_or.B

  ns_busy_or.Q -> ns_rest_g.A
  run.Q -> norm_ns_g.A
  ns_rest_g.Q -> norm_ns_g.B

  run.Q -> norm_ew_g.A
  ew_g_run.Q -> norm_ew_g.B

  norm_ns_g.Q -> cmu_conflict.A
  norm_ew_g.Q -> cmu_conflict.B

  cmu_conflict.Q -> cmu_or.A
  force_cmu_fault.Q -> cmu_or.B
  cmu_or.Q -> cmu_trip.S

  cmu_trip.Q -> cmu_alarm.A
  cmu_trip.Q -> cmu_healthy.A

  cmu_trip.Q -> flash_red.A
  flasher.Q -> flash_red.B

  norm_ns_g.Q -> out_ns_g.A
  cmu_healthy.Q -> out_ns_g.B
  out_ns_g.Q -> ns_green.A

  ns_y_run.Q -> out_ns_y.A
  cmu_healthy.Q -> out_ns_y.B
  out_ns_y.Q -> ns_yellow.A

  side_busy_or2.Q -> out_ns_r.A
  flash_red.Q -> out_ns_r.B
  out_ns_r.Q -> ns_red.A

  norm_ew_g.Q -> out_ew_g.A
  cmu_healthy.Q -> out_ew_g.B
  out_ew_g.Q -> ew_green.A

  ew_y_run.Q -> out_ew_y.A
  cmu_healthy.Q -> out_ew_y.B
  out_ew_y.Q -> ew_yellow.A

  norm_ns_g.Q -> out_ew_r.A
  flash_red.Q -> out_ew_r.B
  out_ew_r.Q -> ew_red.A

  out_ew_g.Q -> ped_walk.A
}
`;

const PUMP_ALTERNATOR_SVG_DATA_URI =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(PUMP_ALTERNATOR_SVG);

const PUMP_ALT_LAB1_DSL = `circuit "Stage 1 - Basic Duty Alternator" version 1 {
  call: INPUT(label="Call for Water", value=true)
  edge: F_TRIG(label="Cycle End (Falling Edge)")
  toggle: PULSE_RELAY(label="Duty Flip-Flop")
  not_toggle: NOT()
  pumpA: AND(label="Pump A Gate")
  pumpB: AND(label="Pump B Gate")
  outA: OUTPUT(label="Pump A Contactor")
  outB: OUTPUT(label="Pump B Contactor")
  duty_b: OUTPUT(label="Next Duty: Pump B when ON")

  call.Q -> edge.A
  edge.Q -> toggle.A
  toggle.Q -> not_toggle.A
  toggle.Q -> duty_b.A

  call.Q -> pumpA.A
  not_toggle.Q -> pumpA.B
  pumpA.Q -> outA.A

  call.Q -> pumpB.A
  toggle.Q -> pumpB.B
  pumpB.Q -> outB.A
}
`;

const PUMP_ALT_LAB2_DSL = `circuit "Stage 2 - Fault-Aware Alternator with Auto-Takeover" version 1 {
  call: INPUT(label="Call for Water", value=true)
  healthy_a: INPUT(label="Pump A Overload Healthy", value=true)
  healthy_b: INPUT(label="Pump B Overload Healthy", value=true)

  edge: F_TRIG(label="Cycle End Detector")
  duty: PULSE_RELAY(label="Duty Selector")
  duty_a: NOT()

  fault_a: NOT()
  fault_b: NOT()

  duty_a_pref: AND(label="Duty A Desired")
  duty_b_pref: AND(label="Duty B Desired")

  takeover_b: AND(label="B Takes Over for Faulted A")
  takeover_a: AND(label="A Takes Over for Faulted B")

  demand_a: OR()
  demand_b: OR()
  takeover_or: OR(label="Any Takeover Active")

  final_a: AND(label="Final Pump A Command")
  final_b: AND(label="Final Pump B Command")

  outA: OUTPUT(label="Pump A Motor Command")
  outB: OUTPUT(label="Pump B Motor Command")
  alarmA: OUTPUT(label="Pump A Tripped Alarm")
  alarmB: OUTPUT(label="Pump B Tripped Alarm")
  autoTakeover: OUTPUT(label="Standby Pump in Auto-Takeover")

  call.Q -> edge.A
  edge.Q -> duty.A
  duty.Q -> duty_a.A

  healthy_a.Q -> fault_a.A
  healthy_b.Q -> fault_b.A
  fault_a.Q -> alarmA.A
  fault_b.Q -> alarmB.A

  call.Q -> duty_a_pref.A
  duty_a.Q -> duty_a_pref.B

  call.Q -> duty_b_pref.A
  duty.Q -> duty_b_pref.B

  duty_a_pref.Q -> takeover_b.A
  fault_a.Q -> takeover_b.B

  duty_b_pref.Q -> takeover_a.A
  fault_b.Q -> takeover_a.B

  duty_a_pref.Q -> demand_a.A
  takeover_a.Q -> demand_a.B

  duty_b_pref.Q -> demand_b.A
  takeover_b.Q -> demand_b.B

  demand_a.Q -> final_a.A
  healthy_a.Q -> final_a.B
  final_a.Q -> outA.A

  demand_b.Q -> final_b.A
  healthy_b.Q -> final_b.B
  final_b.Q -> outB.A

  takeover_a.Q -> takeover_or.A
  takeover_b.Q -> takeover_or.B
  takeover_or.Q -> autoTakeover.A
}
`;

const PUMP_ALT_LAB3_DSL = `circuit "Stage 3 - Duplex Lead / Lag Sequencing & Peak Assist" version 1 {
  lead_call: INPUT(label="Lead Demand (Pressure / Low Level)", value=true)
  lag_call: INPUT(label="Lag Demand (High Inflow / Peak Surge)", value=false)
  healthy_a: INPUT(label="Pump A Healthy", value=true)
  healthy_b: INPUT(label="Pump B Healthy", value=true)

  edge: F_TRIG(label="Cycle End Detector")
  duty: PULSE_RELAY(label="Lead Selector Toggle")
  duty_a: NOT()

  fault_a: NOT()
  fault_b: NOT()

  lead_req_a: AND()
  lead_req_b: AND()

  lead_takeover_b: AND(label="B Takes Lead if A Faulted")
  lead_takeover_a: AND(label="A Takes Lead if B Faulted")

  lead_run_a: OR()
  lead_run_b: OR()

  lag_active: AND(label="Lag Gate")
  lag_req_a: AND(label="Lag Call to A (when B is Lead)")
  lag_req_b: AND(label="Lag Call to B (when A is Lead)")

  demand_a: OR()
  demand_b: OR()

  final_a: AND()
  final_b: AND()

  dual_active: AND(label="Both Pumps Running")

  pumpA: OUTPUT(label="Pump A Motor (P-101A)")
  pumpB: OUTPUT(label="Pump B Motor (P-101B)")
  dual_mode: OUTPUT(label="Dual Pumping Mode (Peak Surge)")
  alarm_a: OUTPUT(label="Pump A Fault Alarm")
  alarm_b: OUTPUT(label="Pump B Fault Alarm")

  lead_call.Q -> edge.A
  edge.Q -> duty.A
  duty.Q -> duty_a.A

  healthy_a.Q -> fault_a.A
  healthy_b.Q -> fault_b.A
  fault_a.Q -> alarm_a.A
  fault_b.Q -> alarm_b.A

  lead_call.Q -> lead_req_a.A
  duty_a.Q -> lead_req_a.B

  lead_call.Q -> lead_req_b.A
  duty.Q -> lead_req_b.B

  lead_req_a.Q -> lead_takeover_b.A
  fault_a.Q -> lead_takeover_b.B

  lead_req_b.Q -> lead_takeover_a.A
  fault_b.Q -> lead_takeover_a.B

  lead_req_a.Q -> lead_run_a.A
  lead_takeover_a.Q -> lead_run_a.B

  lead_req_b.Q -> lead_run_b.A
  lead_takeover_b.Q -> lead_run_b.B

  lead_call.Q -> lag_active.A
  lag_call.Q -> lag_active.B

  lag_active.Q -> lag_req_b.A
  lead_run_a.Q -> lag_req_b.B

  lag_active.Q -> lag_req_a.A
  lead_run_b.Q -> lag_req_a.B

  lead_run_a.Q -> demand_a.A
  lag_req_a.Q -> demand_a.B

  lead_run_b.Q -> demand_b.A
  lag_req_b.Q -> demand_b.B

  demand_a.Q -> final_a.A
  healthy_a.Q -> final_a.B
  final_a.Q -> pumpA.A

  demand_b.Q -> final_b.A
  healthy_b.Q -> final_b.B
  final_b.Q -> pumpB.A

  final_a.Q -> dual_active.A
  final_b.Q -> dual_active.B
  dual_active.Q -> dual_mode.A
}
`;

const CONVEYOR_SORTING_SVG_DATA_URI =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(CONVEYOR_SORTING_SVG);

const CONVEYOR_LAB1_DSL = `circuit "Stage 1 - The Fixed Timer Delay Flaw" version 1 {
  sensor: INPUT(label="PE-101 Defect Photoeye", value=false)
  belt_running: INPUT(label="Conveyor Motor Running", value=true)
  pulse: TOF(label="Sensor Pulse Capture", duration=600)
  active_defect: AND()
  travel_delay: TON(label="Fixed Travel Delay (2.0s)", duration=2000)
  divert_pulse: TOF(label="Diverter Arm Stroke (0.8s)", duration=800)
  diverter: OUTPUT(label="Pneumatic Diverter Arm")
  hazard_alert: OUTPUT(label="Multi-Package Collision Risk")

  sensor.Q -> pulse.A
  pulse.Q -> active_defect.A
  belt_running.Q -> active_defect.B
  active_defect.Q -> travel_delay.A
  travel_delay.Q -> divert_pulse.A
  divert_pulse.Q -> diverter.A
  active_defect.Q -> hazard_alert.A
}
`;

const CONVEYOR_LAB2_DSL = `circuit "Stage 2 - Synchronous Zone Tracking via Shift Register" version 1 {
  defect_pe: INPUT(label="PE-101 Defect Photoeye", value=false)
  belt_run: INPUT(label="Conveyor Drive Running", value=true)
  belt_tick: CLOCK(label="Belt Travel Zone Pulses", onTime=400, offTime=400)
  reset_reg: INPUT(label="Clear Tracking Register", value=false)

  dir_low: LOW()
  gate_clk: AND()
  shift: SHIFT_REGISTER(label="4-Zone Conveyor Tracking", length=4)
  divert_pulse: TOF(label="Diverter Fire Pulse", duration=600)
  diverter: OUTPUT(label="Zone 4 Reject Diverter Solenoid")
  box_at_reject: OUTPUT(label="Defect Box Arrived at Zone 4")

  belt_run.Q -> gate_clk.A
  belt_tick.Q -> gate_clk.B

  defect_pe.Q -> shift.D
  gate_clk.Q -> shift.CLK
  dir_low.Q -> shift.DIR
  reset_reg.Q -> shift.R

  shift.Q -> box_at_reject.A
  shift.Q -> divert_pulse.A
  divert_pulse.Q -> diverter.A
}
`;

const CONVEYOR_LAB3_DSL = `circuit "Stage 3 - Pneumatic Diverter with Jam Watchdog" version 1 {
  run_cmd: INPUT(label="Conveyor Start Request", value=true)
  pe_jam: INPUT(label="PE-102 Diverter Jam Photoeye", value=false)
  diverter_fwd: INPUT(label="ZSE Diverter Full Extend Sw", value=true)
  reset_pb: INPUT(label="Operator Reset Pushbutton", value=false)

  jam_timer: TON(label="Jam Detection Timer (1.5s)", duration=1500)
  jam_latch: RS_LATCH(label="Conveyor Jam Cutout Latch")
  jam_safe: NOT()

  conv_permit: AND(label="Conveyor Run Permissive")
  motor_run: OUTPUT(label="Conveyor Drive Contactor (KM-101)")
  jam_alarm: OUTPUT(label="Carton Jam Alarm (LINE STOP)")

  pe_jam.Q -> jam_timer.A
  jam_timer.Q -> jam_latch.S
  reset_pb.Q -> jam_latch.R

  jam_latch.Q -> jam_alarm.A
  jam_latch.Q -> jam_safe.A

  run_cmd.Q -> conv_permit.A
  jam_safe.Q -> conv_permit.B
  conv_permit.Q -> motor_run.A
}
`;

const HVAC_LAB1_DSL = `circuit "Stage 1 - The Naive Outside Air Comparator" version 1 {
  oat: ANALOG_INPUT(label="Outdoor Air Temp (F)", value=62)
  rat: ANALOG_INPUT(label="Return Air Temp (F)", value=74)
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

const HVAC_LAB2_DSL = `circuit "Stage 2 - Safe Economizer Window & Min Vent Damper" version 1 {
  oat: ANALOG_INPUT(label="Outdoor Air Temp (F)", value=58)
  rat: ANALOG_INPUT(label="Return Air Temp (F)", value=74)
  minOat: ANALOG_INPUT(label="Low Limit Cutoff (F)", value=50)
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

const HVAC_LAB3_DSL = `circuit "Stage 3 - Full Economizer with Freeze-Stat Trip" version 1 {
  fanRunning: INPUT(label="Supply Fan Running", value=true)
  callCool: INPUT(label="Thermostat Call for Cooling", value=true)
  oat: ANALOG_INPUT(label="Outdoor Air Temp (F)", value=56)
  rat: ANALOG_INPUT(label="Return Air Temp (F)", value=74)
  minOat: ANALOG_INPUT(label="Low Limit Economizer (F)", value=50)

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

const ESD_LAB1_DSL = `circuit "Stage 1 - The Naive Simultaneous Cut" version 1 {
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

const ESD_LAB2_DSL = `circuit "Stage 2 - Staged Off-Delay Cooling via TOF" version 1 {
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

const ESD_LAB3_DSL = `circuit "Stage 3 - Controlled Flare Vent & Latched Safety Train" version 1 {
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

const SOLAR_LAB1_DSL = `circuit "Stage 1 - Raw Unfiltered Solar Noise" version 1 {
  rawVolt: ANALOG_INPUT(label="Raw Solar Voltage (V)", value=22)
  minChargeVolt: ANALOG_INPUT(label="Min Charge Threshold (24V)", value=24)
  comp: ANALOG_COMPARATOR(operation="gte")
  chargeRelay: OUTPUT(label="Battery Charge Contactor")
  alarmTrip: NOT(label="Low Voltage Alarm")
  alarmLamp: OUTPUT(label="Unfiltered Voltage Alarm")

  rawVolt.Q -> comp.A
  minChargeVolt.Q -> comp.B
  comp.Q -> chargeRelay.A

  comp.Q -> alarmTrip.A
  alarmTrip.Q -> alarmLamp.A
}
`;

const SOLAR_LAB2_DSL = `circuit "Stage 2 - Analog Smoothing with Moving Average" version 1 {
  rawVolt: ANALOG_INPUT(label="Raw Solar Voltage (V)", value=28)
  avgFilter: AVERAGE(samples=5)
  smoothedVolt: ANALOG_OUTPUT(label="Smoothed Array Voltage (V)")
  minChargeVolt: ANALOG_INPUT(label="Min Charge Threshold (24V)", value=24)
  comp: ANALOG_COMPARATOR(operation="gte")
  chargeActive: OUTPUT(label="Battery Charging Active")

  rawVolt.Q -> avgFilter.A
  avgFilter.Q -> smoothedVolt.A

  avgFilter.Q -> comp.A
  minChargeVolt.Q -> comp.B
  comp.Q -> chargeActive.A
}
`;

const SOLAR_LAB3_DSL = `circuit "Stage 3 - Full Solar Telemetry & Battery Charge Manager" version 1 {
  rawVolt: ANALOG_INPUT(label="Raw PV String Voltage (V)", value=28)
  avgFilter: AVERAGE(samples=5)
  smoothedVolt: ANALOG_OUTPUT(label="Clean Trend Voltage (V)")

  minChargeVolt: ANALOG_INPUT(label="Min Charge Threshold (24V)", value=24)
  maxOverVolt: ANALOG_INPUT(label="Over-Voltage Limit (32V)", value=32)

  isHealthyMin: ANALOG_COMPARATOR(operation="gte")
  isSafeMax: ANALOG_COMPARATOR(operation="lte")
  chargePermissive: AND()

  enableLogging: INPUT(label="Cloud Telemetry Logging Enable", value=true)
  logger: DATA_LOG(interval=500)
  logActiveLamp: OUTPUT(label="Telemetry Data Logging Active")

  chargeContactor: OUTPUT(label="Battery Charge Contactor (KM-101)")
  overvoltAlarm: NOT()
  overvoltLamp: OUTPUT(label="Over-Voltage Hazard Alarm")

  rawVolt.Q -> avgFilter.A
  avgFilter.Q -> smoothedVolt.A

  avgFilter.Q -> isHealthyMin.A
  minChargeVolt.Q -> isHealthyMin.B

  avgFilter.Q -> isSafeMax.A
  maxOverVolt.Q -> isSafeMax.B

  isHealthyMin.Q -> chargePermissive.A
  isSafeMax.Q -> chargePermissive.B
  chargePermissive.Q -> chargeContactor.A

  avgFilter.Q -> logger.A
  enableLogging.Q -> logger.EN
  logger.Q -> logActiveLamp.A

  isSafeMax.Q -> overvoltAlarm.A
  overvoltAlarm.Q -> overvoltLamp.A
}
`;

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'water-treatment',
    title: 'Building an Industrial Water Treatment Simulator: Intake Permissives, Basin Hysteresis & Automated Pump Alternation',
    excerpt: 'A comprehensive masterclass on municipal and industrial water treatment SCADA: diagnosing cavitation disasters, interlocking intake permissives, eliminating basin short-cycling with hysteresis, and automating pump duty alternation.',
    author: 'ALAZAR',
    date: 'Oct 15',
    readingTime: '20 min read + 25 min labs',
    tag: 'Process Control',
    views: 18,
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
    author: 'ALAZAR',
    date: 'Oct 8',
    readingTime: '20 min read + 25 min labs',
    tag: 'Process Control',
    views: 14,
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
    title: 'Traffic Signal Automation: NEMA TS2 Dual-Ring Phasing, ITE Clearance Intervals & Conflict Monitor Watchdogs',
    excerpt: 'A comprehensive traffic engineering masterclass on intersection signal automation: the Route 4 & Parkway collision analysis, ITE clearance calculations, dual-ring sequential state machines, actuated inductive loop detection, and hardware Conflict Monitor Unit (CMU) failsafes.',
    author: 'ALAZAR',
    date: 'Oct 1',
    readingTime: '22 min read + 25 min labs',
    tag: 'Control Systems',
    views: 19,
    content: (
      <div className="space-y-6">
        <div className="my-8 not-prose rounded-xl overflow-hidden border border-zinc-300 shadow-xl bg-white">
          <img
            src={TRAFFIC_LIGHT_SVG_DATA_URI}
            alt="NEMA TS2 Dual-Ring Intersection Controller and Conflict Monitor Unit P&ID"
            className="w-full h-auto object-cover max-h-[550px]"
          />
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs font-mono text-zinc-400 flex flex-wrap justify-between items-center gap-2">
            <span className="text-emerald-400 font-semibold">FIG 1.1 // NEMA TS2 DUAL-RING INTERSECTION &amp; CONFLICT MONITOR UNIT (CMU)</span>
            <span>ITE CLEARANCE, INDUCTIVE LOOPS &amp; HARDWARE FAIL-SAFE</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-8 mb-4">
          The 08:22 AM Double-Green Disaster at Route 4 &amp; County Parkway
        </h2>
        <p>
          At 08:22 on a rainy October morning at the high-speed junction of Route 4 (a 45 MPH arterial) and County Parkway (a 35 MPH cross-street), the sound of crushing automotive steel echoed across six lanes. A loaded 30-ton ready-mix concrete truck traveling northbound entered the intersection at 42 MPH and collided broadside into a commuter sedan entering from the cross-street.
        </p>
        <p>
          Both drivers swore under oath that their signal light was green.
        </p>
        <p>
          Crash reconstructionists and municipal traffic engineers impounded the roadside NEMA cabinet. Inside, they found a custom PLC controller installed three months earlier to replace an aging electromechanical dial. The controls programmer had created an intersection sequence using three cascading On-Delay Timers (<code>TON</code>):
        </p>
        <div className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800">
          Timer_Green &rarr; Timer_Yellow &rarr; Timer_Red &rarr; (Reset Loop)
        </div>
        <p>
          To implement the cross-street, the programmer simply wired the opposing phase to start the exact instant the yellow timer finished. There was <strong>zero all-red clearance interval</strong> (<em>R = 0 s</em>).
        </p>
        <p>
          To make matters worse, an emergency vehicle preemption call had triggered just as North-South was timing out. Because the reset logic lacked a strict state machine barrier, the controller glitched for two program scans: North-South turned green while East-West was still energized on fresh green!
        </p>
        <p>
          The collision resulted in a $4.2 million municipal tort liability settlement, permanent incapacitation of the sedan driver, and an immediate Department of Transportation moratorium on uncertified intersection controllers.
        </p>

        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg my-4 text-sm font-sans text-amber-950">
          <strong className="block font-semibold mb-1">Regulatory Mandate: NEMA TS2, MUTCD &amp; Malfunction Management Units (MMU)</strong>
          <p>
            Never drive municipal traffic signal load switches directly from standard PLC outputs without a certified, independent Conflict Monitor Unit (CMU) or Malfunction Management Unit (MMU)! If a hardware triac welds short or software bugs command conflicting greens, the CMU must mechanically trip a line relay within 450 ms, forcing all four approaches into an isolated, hardwired Flashing Red backup mode.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Engineering Theory: ITE Clearance Physics &amp; Dual-Ring Barrier State Machines
        </h2>
        <p>
          Safe intersection design is governed by the <strong>Manual on Uniform Traffic Control Devices (MUTCD)</strong> and the <strong>Institute of Transportation Engineers (ITE)</strong>. The clearance interval between conflicting traffic streams is divided into two distinct, life-critical phases:
        </p>

        <h3 className="text-xl font-bold font-serif text-zinc-900 mt-6 mb-2">
          1. The Yellow Change Interval (<em>Y</em>)
        </h3>
        <p>
          The yellow interval gives approaching motorists sufficient time to either comfortably brake to a stop before the stop bar, or clear into the intersection before red appears:
        </p>
        <div className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800">
          Y = t + V / (2a + 2Gg)
        </div>
        <p>Where:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><code>t = 1.0 s</code>: Driver perception-reaction time.</li>
          <li><code>V</code>: Approach speed (45 MPH = 66 ft/s = 20.1 m/s).</li>
          <li><code>a = 10 ft/s&sup2;</code> (3.05 m/s&sup2;): Comfortable wet-pavement deceleration.</li>
          <li><code>G</code>: Roadway grade (decimal, 0.0 for level grade).</li>
          <li><code>g = 32.2 ft/s&sup2;</code>: Acceleration of gravity.</li>
        </ul>
        <p>
          For a 45 MPH approach: <code>Y = 1.0 + 66 / (2 &times; 10) = 1.0 + 3.3 = 4.3 seconds</code>.
        </p>

        <h3 className="text-xl font-bold font-serif text-zinc-900 mt-6 mb-2">
          2. The All-Red Clearance Interval (<em>R</em>)
        </h3>
        <p>
          Even after yellow expires, a vehicle that entered on the last millisecond of yellow needs time to travel completely across the width of the conflict box (<em>W</em>) plus its own vehicle length (<em>L</em>) before cross-traffic receives green:
        </p>
        <div className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800">
          R = (W + L) / V
        </div>
        <p>
          For an 80-foot intersection with a standard 20-foot vehicle at 45 MPH (66 ft/s): <code>R = (80 + 20) / 66 = 1.52 seconds &approx; 1.6 seconds</code>.
        </p>
        <p>
          Without this 1.6 s All-Red buffer, clearing vehicles and fresh-green cross-traffic occupy the exact same physical space simultaneously!
        </p>

        <div className="my-6 overflow-x-auto not-prose">
          <table className="min-w-full text-left text-sm border-collapse border border-zinc-200">
            <thead>
              <tr className="bg-zinc-100 border-b border-zinc-200">
                <th className="p-3 font-semibold text-zinc-900">Architecture</th>
                <th className="p-3 font-semibold text-zinc-900">Mutual Exclusion</th>
                <th className="p-3 font-semibold text-zinc-900">All-Red Clearance</th>
                <th className="p-3 font-semibold text-zinc-900">Actuation Support</th>
                <th className="p-3 font-semibold text-zinc-900">Safety Failure Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              <tr>
                <td className="p-3 font-semibold text-zinc-800">Naive Cascading Timers</td>
                <td className="p-3 text-red-600 font-medium">Software only</td>
                <td className="p-3 text-red-600 font-medium">Missing (0 s)</td>
                <td className="p-3 text-zinc-600">None (Fixed time only)</td>
                <td className="p-3 text-red-700">Race conditions, dual-green collision</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-zinc-800">Dual-Ring Barrier (Stage 2)</td>
                <td className="p-3 text-emerald-600 font-medium">Guaranteed by state gates</td>
                <td className="p-3 text-emerald-600 font-medium">Full ITE (1.5 s)</td>
                <td className="p-3 text-zinc-600">Fixed cycle</td>
                <td className="p-3 text-amber-700">CPU lockup requires external watchdog</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-zinc-800">Fully-Actuated + CMU (Stage 3)</td>
                <td className="p-3 text-emerald-600 font-medium">Double-interlocked + Hardware CMU</td>
                <td className="p-3 text-emerald-600 font-medium">Dynamic &amp; Protected</td>
                <td className="p-3 text-emerald-600">Loops + Ped Call</td>
                <td className="p-3 text-emerald-700">Failsafe transfer to 100% Flashing Red</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 1: The Naive Cascade &amp; The Missing Clearance
        </h2>
        <p>
          Examine the Stage 1 circuit below. It implements the classic beginner&apos;s mistake: two opposing approaches chained together through simple sequential timers.
        </p>
        <p>
          Notice what happens when North-South Yellow finishes: East-West Green turns ON at the exact same instant! There is zero clearance window. Any vehicle in the conflict box is immediately exposed to cross-traffic acceleration.
        </p>

        <InlineLab
          dsl={TRAFFIC_LAB1_DSL}
          title="Stage 1: The Naive Cascade & Missing Clearance"
          step="Stage 1 of 3"
          height={520}
        />

        <div className="border-l-4 border-rose-500 bg-rose-50 p-4 rounded-r-lg my-4 text-sm font-sans text-rose-950">
          <strong className="block font-semibold mb-1">Interactive Exercise &mdash; Stage 1 (Diagnose the Clearance Defect)</strong>
          <p>
            In Stage 1 above, watch the cycle run: North-South Green (3s) &rarr; North-South Yellow (1.5s). The very scan NS Yellow drops, East-West Green ignites immediately! Notice the <strong>Collision Hazard: 0s All-Red Clearance</strong> indicator turns ON. A car clearing an 80-ft intersection at 45 MPH takes 1.5 seconds to exit&mdash;during that entire time, cross-traffic has a green light!
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 2: Dual-Ring Controller with ITE All-Red Clearance
        </h2>
        <p>
          Stage 2 introduces the standardized 6-phase cyclic state machine incorporating mandatory ITE clearance windows:
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li><strong>P1: North-South Green (3.5s)</strong> &bull; East-West holds solid Red.</li>
          <li><strong>P2: North-South Yellow (1.5s)</strong> &bull; East-West holds solid Red.</li>
          <li><strong>P3: ALL-RED CLEARANCE 1 (1.5s)</strong> &bull; <strong>Both North-South and East-West hold solid RED</strong> while the conflict box clears!</li>
          <li><strong>P4: East-West Green (3.0s)</strong> &bull; North-South holds solid Red.</li>
          <li><strong>P5: East-West Yellow (1.5s)</strong> &bull; North-South holds solid Red.</li>
          <li><strong>P6: ALL-RED CLEARANCE 2 (1.5s)</strong> &bull; <strong>Both hold solid RED</strong> before North-South receives green!</li>
        </ol>
        <p>
          A <code>SCAN_DELAY</code> block provides an explicit, safe memory boundary for the loop reset without race conditions.
        </p>

        <InlineLab
          dsl={TRAFFIC_LAB2_DSL}
          title="Stage 2: Dual-Ring Controller with All-Red Clearance"
          step="Stage 2 of 3"
          height={520}
        />

        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg my-4 text-sm font-sans text-blue-950">
          <strong className="block font-semibold mb-1">Interactive Exercise &mdash; Stage 2 (Observing the All-Red Protection Window)</strong>
          <p>
            In Stage 2 above, watch the cycle progress through all 6 phases. Notice how the <strong>All-Red Clearance Interval Active</strong> lamp lights up between every phase change! Both North-South Red and East-West Red are illuminated simultaneously for 1.5 seconds, guaranteeing that speeding vehicles have completely exited before cross-traffic is permitted to roll.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 3: Fully-Actuated Controller with Inductive Vehicle Loop, Pedestrian Call &amp; Conflict Monitor (CMU)
        </h2>
        <p>
          In real municipal networks, traffic controllers do not blindly cycle fixed timers. They operate in <strong>Fully-Actuated Mode</strong>:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Main Street (North-South)</strong> rests indefinitely in Green to maximize arterial corridor progression.</li>
          <li><strong>Side Street (East-West)</strong> features an embedded <strong>Inductive Loop Detector (<code>loop_ew</code>)</strong> that senses the metallic chassis of waiting vehicles.</li>
          <li><strong>Crosswalk Pushbutton (<code>ped_call</code>)</strong> registers pedestrian demand.</li>
        </ul>
        <p>
          When side-street demand is latched, the controller smoothly terminates the main street green, executes the ITE yellow change and all-red clearance, serves the side street with pedestrian walk signals, and safely returns to rest in main-street green!
        </p>

        <h3 className="text-xl font-bold font-serif text-zinc-900 mt-6 mb-2">
          The Hardware Conflict Monitor Unit (CMU)
        </h3>
        <p>
          The controller incorporates a hardware watchdog sensing field AC voltage taps. If conflicting greens ever energize simultaneously (or if an engineer forces a conflict via <code>force_cmu_fault</code>), the CMU trips within 450 ms, cuts power to the load switches, and engages a 50 FPM flasher relay into <strong>100% 4-Way Flashing Red</strong>!
        </p>

        <InlineLab
          dsl={TRAFFIC_LAB3_DSL}
          title="Stage 3: Actuated Intersection with Conflict Monitor"
          step="Stage 3 of 3"
          height={650}
        />

        <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 rounded-r-lg my-4 text-sm font-sans text-emerald-950">
          <strong className="block font-semibold mb-1">Interactive Exercise &mdash; Stage 3 (Actuate Loops &amp; Test the CMU Trip)</strong>
          <ol className="list-decimal pl-5 space-y-1 mt-1">
            <li>Notice the controller rests peacefully in North-South Green. Cross-street traffic has no cars, so no green time is wasted!</li>
            <li>Click <strong>East-West Inductive Loop Detector</strong> to simulate a car arriving at the side-street stop bar. Watch the controller seamlessly execute NS Yellow (1.5s) &rarr; All-Red (1.5s) &rarr; EW Green &amp; Ped Walk (3.5s) &rarr; EW Yellow (1.5s) &rarr; All-Red (1.5s) &rarr; and return to resting NS Green!</li>
            <li>Now simulate a welded solid-state triac: toggle <strong>Simulate CMU Conflict (Welded Triac)</strong> to ON. Watch the CMU trip instantly! Green drops dead, and both approaches begin flashing emergency Red at 1 Hz!</li>
          </ol>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Commissioning Checklist &amp; Municipal Intersection Proof Testing
        </h2>
        <p>
          Before turning over any traffic cabinet to municipal DOT operations, field crews must complete this mandatory protocol:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>CMU Diode Card Conflict Testing:</strong> Remove the Conflict Monitor Unit from the cabinet and insert a factory testing harness. Systematically bridge every green and yellow channel pair (e.g. Phase 2 Green with Phase 4 Green). Verify the CMU drops the line relay into Flashing Red within 450 ms on every combination.
          </li>
          <li>
            <strong>Inductive Loop Sensitivity &amp; Resistance Verification:</strong> Measure loop inductance with an RLC meter (50 to 300 &mu;H) and resistance-to-ground (&gt;100 M&Omega;). Test loop responsiveness with a bicycle or small motorcycle to confirm detection sensitivity.
          </li>
          <li>
            <strong>ITE Clearance Timing Audit:</strong> Physically stopwatch-verify field displays against the approved engineering timing sheet. Yellow change intervals must never be configured shorter than 3.0 seconds (typically 4.0 to 5.5 s on arterials), and All-Red must never be omitted (1.0 to 2.5 s).
          </li>
          <li>
            <strong>Pedestrian Clearance Intervals (MUTCD 4E.06):</strong> Ensure the flashing Don&apos;t Walk interval is calculated using a walking speed of no faster than 3.5 ft/s (1.07 m/s) across the full curb-to-curb crosswalk width.
          </li>
          <li>
            <strong>Power Loss &amp; Flasher Relay Drop Test:</strong> Disconnect main 120V AC cabinet utility power and restore it. Verify the controller boots up in minimum 5-second all-red/flash mode before entering automatic coordination.
          </li>
          <li>
            <strong>Preemption Gate Interlocks:</strong> Verify that railroad preemption or emergency vehicle optical strobe sensors (Opticom) force an immediate safe clearance sequence rather than an instantaneous green transfer.
          </li>
        </ul>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Key Engineering Takeaways
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>All-Red is not optional:</strong> Omitting the all-red clearance interval creates an instantaneous collision window where vehicles clearing the box are struck broadside by cross-traffic.
          </li>
          <li>
            <strong>State Machines over Timer Cascades:</strong> Never rely on cascading timer completion bits for mutual exclusion; implement discrete state logic with explicit scan boundaries.
          </li>
          <li>
            <strong>Hardware watchdogs are non-negotiable:</strong> A certified Conflict Monitor Unit (CMU/MMU) must monitor the physical field voltages and trip a hardwired line relay into flashing red upon any conflict or brownout.
          </li>
          <li>
            <strong>Actuation preserves corridor efficiency:</strong> Resting in main-street green until an inductive loop or pedestrian pushbutton registers demand maximizes throughput while maintaining absolute safety.
          </li>
        </ul>
      </div>
    ),
    dsl: ''
  },
  {
    slug: 'conveyor-sorting',
    title: 'Automated Conveyor Sorting: Shift-Register Tracking, Diverter Timing & Jam Watchdogs',
    excerpt: 'An intermediate masterclass on packaging and material handling automation: why fixed timers fail when multiple cartons queue up, implementing multi-zone shift register tracking, and engineering pneumatic diverters with jam-detection interlocks.',
    author: 'ALAZAR',
    date: 'Sep 24',
    readingTime: '12 min read + 15 min labs',
    tag: 'Intermediate',
    views: 7,
    content: (
      <div className="space-y-6">
        <div className="my-8 not-prose rounded-xl overflow-hidden border border-zinc-300 shadow-xl bg-white">
          <img
            src={CONVEYOR_SORTING_SVG_DATA_URI}
            alt="Automated Conveyor Sorting System and Diverter Tracking P&ID"
            className="w-full h-auto object-cover max-h-[550px]"
          />
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs font-mono text-zinc-400 flex flex-wrap justify-between items-center gap-2">
            <span className="text-emerald-400 font-semibold">FIG 1.1 // AUTOMATED CONVEYOR SORTING</span>
            <span>MULTI-ZONE TRACKING, PNEUMATIC DIVERTER &amp; ANTI-JAM WATCHDOG</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-8 mb-4">
          The Sorting Conveyor Dilemma: Single-Box Timers vs. Multi-Box Pipelines
        </h2>
        <p>
          Automated sorting conveyors are the lifeblood of distribution centers, bottling plants, and food packaging facilities. A standard sorting line features:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Infeed Inspection Station:</strong> A vision camera, barcode scanner, or optical checkweigher photoeye (<code>PE-101</code>) that flags defective or misrouted cartons.
          </li>
          <li>
            <strong>Transport Bed:</strong> A powered belt or roller conveyor moving items at constant linear speed (e.g., 60 to 120 FPM).
          </li>
          <li>
            <strong>Diverter Station:</strong> A high-speed pneumatic pusher arm, pop-up wheel diverter, or air blast nozzle (<code>SOL-101</code>) positioned downstream to kick flagged items into a reject lane.
          </li>
        </ul>

        <h3 className="text-xl font-bold font-serif text-zinc-900 mt-6 mb-2">
          Why Beginners Use Fixed Timers (And Why They Fail)
        </h3>
        <p>
          When tasked with triggering the diverter 2 meters downstream, a beginner controls engineer naturally reaches for timers:
        </p>
        <div className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800">
          Defect Detected &rarr; TON Timer (2.0 seconds) &rarr; Fire Diverter Arm (0.8s TOF)
        </div>
        <p>
          <strong>The High-Throughput Trap:</strong> This timer circuit works during low-speed commissioning when you gently push one test box down the belt. But as soon as production ramps up to 60 cartons per minute:
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            <strong>Queue Collisions:</strong> What happens if Box #1 is defective, and Box #2 (1.0 second behind it) is also defective? The <code>TON</code> timer is already busy timing Box #1. When Box #2 passes the sensor, the timer cannot track two distinct time horizons simultaneously!
          </li>
          <li>
            <strong>Timer Reset Flaw:</strong> If the sensor pulse drops between cartons, the timer resets completely&mdash;causing the diverter to miss Box #1 and fire late for Box #2!
          </li>
          <li>
            <strong>Speed Drift Misalignment:</strong> If the conveyor belt slows down under a heavy load or stops during an upstream pause, wall-clock timers keep counting down! The diverter fires into empty air, and the defective box rolls right into good stock.
          </li>
        </ol>

        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg my-4 text-sm font-sans text-amber-950">
          <strong className="block font-semibold mb-1">Intermediate Control Rule: Track Distance, Not Time</strong>
          <p>
            Conveyor parcel tracking should always be coupled to physical belt displacement rather than wall-clock seconds. Using travel encoder pulses or discrete zone shift registers ensures that if the belt speeds up, slows down, or stops entirely, the tracked positions of all parcels freeze and move in perfect physical synchronism.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 1: The Fixed Timer Delay Flaw
        </h2>
        <p>
          Examine the Stage 1 circuit below. It implements the classic single-box timer delay: a <code>TOF</code> captures the optical photoeye pulse, a <code>TON</code> delays actuation by 2000 ms of travel time, and a second <code>TOF</code> strokes the diverter arm for 800 ms.
        </p>
        <p>
          Notice the <strong>Multi-Package Collision Risk</strong> indicator: the moment a defect is registered, the single timer channel becomes locked. If another carton arrives before the first completes its 2-second travel, tracking is lost.
        </p>

        <InlineLab
          dsl={CONVEYOR_LAB1_DSL}
          title="Stage 1: The Fixed Timer Delay Flaw"
          step="Stage 1 of 3"
          height={520}
        />

        <div className="border-l-4 border-rose-500 bg-rose-50 p-4 rounded-r-lg my-4 text-sm font-sans text-rose-950">
          <strong className="block font-semibold mb-1">Interactive Exercise &mdash; Stage 1 (Witness the Lost Package)</strong>
          <ol className="list-decimal pl-5 space-y-1 mt-1">
            <li>Click <strong>PE-101 Defect Photoeye</strong> once to simulate a defective box. Watch <strong>Sensor Pulse Capture</strong> hold the pulse, and after 2.0s, <strong>Pneumatic Diverter Arm</strong> strokes for 0.8s. That works!</li>
            <li>Now click <strong>PE-101 Defect Photoeye</strong>, wait 0.8s, and click it a SECOND time (two defective cartons close together). Watch how the second pulse is completely swallowed by the running timer! The diverter only strokes once&mdash;the second defective box escapes!</li>
          </ol>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 2: Synchronous Zone Tracking via Shift Register
        </h2>
        <p>
          In professional material handling systems, the conveyor line is mathematically divided into discrete physical <strong>Zones</strong> (e.g. Zone 1 = Scan, Zone 2 = Acceleration, Zone 3 = Alignment, Zone 4 = Divert).
        </p>
        <p>
          A <strong>Bit Shift Register (<code>SHIFT_REGISTER</code>)</strong> acts as a true First-In, First-Out (FIFO) pipeline:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Each clock pulse (<code>CLK</code>) represents the belt moving forward by exactly one zone length.</li>
          <li>If a package at <code>PE-101</code> is marked defective, a digital <code>1</code> is shifted into the register at bit 0.</li>
          <li>With every travel pulse, the <code>1</code> bit marches synchronously through the zones:
            <div className="bg-zinc-900 text-emerald-400 p-3 rounded font-mono text-xs my-2">
              Zone 1 (Scan): &nbsp;&nbsp;&nbsp;[ 1, 0, 0, 0 ]<br />
              Zone 2 (Accel): &nbsp;&nbsp;[ 0, 1, 0, 0 ]<br />
              Zone 3 (Align): &nbsp;&nbsp;[ 0, 0, 1, 0 ]<br />
              Zone 4 (Divert): &nbsp;[ 0, 0, 0, 1 ] &rarr; FIRE DIVERTER!
            </div>
          </li>
          <li>If three defective packages pass in a row, the register simply holds <code>[ 1, 1, 1, 0 ]</code>. Each package is individually tracked and diverted with 100% precision!</li>
        </ul>

        <InlineLab
          dsl={CONVEYOR_LAB2_DSL}
          title="Stage 2: Synchronous Zone Tracking via Shift Register"
          step="Stage 2 of 3"
          height={520}
        />

        <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 rounded-r-lg my-4 text-sm font-sans text-emerald-950">
          <strong className="block font-semibold mb-1">Interactive Exercise &mdash; Stage 2 (Multi-Carton Pipeline in Action)</strong>
          <ol className="list-decimal pl-5 space-y-1 mt-1">
            <li>Click <strong>Run</strong> to start the simulation. The <strong>Belt Travel Zone Pulses</strong> clock pulses continuously as the conveyor rolls.</li>
            <li>Click <strong>PE-101 Defect Photoeye</strong> to flag a package. Notice how the defect bit enters the shift register.</li>
            <li>Count 4 travel steps: precisely when the carton arrives at Zone 4, <strong>Defect Box Arrived at Zone 4</strong> turns ON, and the diverter solenoid fires!</li>
            <li>Now pulse <strong>PE-101 Defect Photoeye</strong> two or three times across successive clock ticks. Watch how multiple defect bits travel in sequence without overwriting each other!</li>
          </ol>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 3: Pneumatic Diverter Safety, Reed Switches &amp; Jam Watchdog
        </h2>
        <p>
          A real industrial diverter arm is powered by a double-acting pneumatic cylinder. If a box gets wedged against the guide rail or the air supply drops, the cylinder may stall half-way, causing the next oncoming carton to crash into the arm at full speed.
        </p>

        <h3 className="text-xl font-bold font-serif text-zinc-900 mt-6 mb-2">
          Real-World Diverter Interlocks:
        </h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Cylinder Reed Switches (<code>diverter_fwd</code> / <code>diverter_ret</code>):</strong> Magnetic sensors mounted on the pneumatic cylinder verify that the arm has fully retracted before the next carton is allowed to enter the zone.
          </li>
          <li>
            <strong>Jam Detection Watchdog (<code>PE-102</code>):</strong> An optical retro-reflective sensor positioned directly at the divert chute. Under normal operation, cartons pass the sensor within 200&ndash;400 ms. If <code>PE-102</code> remains continuously blocked for longer than <strong>1.5 seconds</strong>, a <strong>Carton Jam</strong> is declared:
            <ul className="list-disc pl-6 mt-1 space-y-1">
              <li>The line drive motor (<code>KM-101</code>) trips immediately.</li>
              <li>An <code>RS_LATCH</code> locks the conveyor in an Emergency Stop state to prevent back-pressure box crushing.</li>
              <li>A flashing <code>jam_alarm</code> alerts operators to clear the physical obstruction and press <code>reset_pb</code>.</li>
            </ul>
          </li>
        </ul>

        <InlineLab
          dsl={CONVEYOR_LAB3_DSL}
          title="Stage 3: Pneumatic Diverter with Jam Watchdog"
          step="Stage 3 of 3"
          height={600}
        />

        <div className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg my-4 text-sm font-sans text-indigo-950">
          <strong className="block font-semibold mb-1">Interactive Exercise &mdash; Stage 3 (Simulate a Carton Jam &amp; Emergency Stop)</strong>
          <ol className="list-decimal pl-5 space-y-1 mt-1">
            <li>Notice <strong>Conveyor Drive Contactor (KM-101)</strong> is running normally.</li>
            <li>Toggle <strong>PE-102 Diverter Jam Photoeye</strong> to ON (simulating a package stuck at the reject mouth).</li>
            <li>Watch the <strong>Jam Detection Timer</strong> count: after 1.5 seconds of sustained blockage, the latch trips, the motor stops instantly, and <strong>Carton Jam Alarm (LINE STOP)</strong> turns ON!</li>
            <li>Clear the simulated jam by toggling <strong>PE-102</strong> to OFF. Notice the line remains safely stopped until you pulse <strong>Operator Reset Pushbutton</strong> to restore line run permissive!</li>
          </ol>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Field Commissioning &amp; Sensor Alignment Rules
        </h2>
        <p>
          When commissioning high-speed sorting belts on the factory floor, apply these five practical guidelines:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Optical Photoeye Debounce Filtering:</strong> Industrial cardboard flaps and shipping labels have ripples that can cause optical beams to flicker. Always insert a 15&ndash;20 ms on-delay filter on photoeye inputs to prevent a single ragged carton from registering as two distinct boxes.
          </li>
          <li>
            <strong>Link Tracking to Shaft Encoders:</strong> For variable-speed conveyors, mount an incremental quadrature encoder (e.g., 1024 pulses/rev) on an unpowered idler pulley. Never use the motor drive shaft, as belt slip will introduce cumulative tracking error.
          </li>
          <li>
            <strong>Pneumatic Pressure Switches &amp; Flow Controls:</strong> Install dual meter-out speed control mufflers on the diverter cylinder. Adjust extend speed to cushion carton impact, and adjust retract speed to ensure the paddle clears the belt before the next carton arrives.
          </li>
          <li>
            <strong>Mechanical Guide Rails &amp; Singulation:</strong> Software tracking assumes consistent package spacing. Upstream metering belts or pop-up brake pads must enforce minimum package pitch (gap) before cartons reach the inspection photoeye.
          </li>
          <li>
            <strong>Latched Jam Alarms with Manual Reset:</strong> Never allow an automatic jam clear to restart conveyor motors autonomously. A jammed carton can dislodge suddenly; requiring a deliberate operator reset button press protects technicians clearing wedged boxes.
          </li>
        </ul>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Key Engineering Takeaways
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Timers do not scale to queues:</strong> Fixed delay timers (<code>TON</code>) fail when multiple items are in flight simultaneously or when belt speed fluctuates.
          </li>
          <li>
            <strong>Shift registers provide true FIFO tracking:</strong> By indexing parcel positions to discrete conveyor displacement zones, multi-item sorting operates with 100% precision.
          </li>
          <li>
            <strong>Physical safety requires watchdog sensing:</strong> Cylinders must prove full retraction via magnetic reed switches, and downstream photoeyes must trip conveyor drives on sustained carton blockage.
          </li>
          <li>
            <strong>Simplicity and reliability:</strong> Combining synchronous bit shifting with latching jam interlocks provides an industrial-grade sortation solution suitable for any factory or distribution hub.
          </li>
        </ul>
      </div>
    ),
    dsl: ''
  },
  {
    slug: 'two-hand-safety',
    title: 'The $240,000 Tie-Down Disaster: Engineering ISO 13851 Type III C Two-Hand Safety Controls',
    excerpt: 'A deep masterclass in functional safety: diagnosing why naive AND-gate circuits cause catastrophic press amputations, implementing the strict 500 ms synchronism window with anti-tie-down and anti-repeat, and engineering Category 4 / PL e dual-channel monitored safety valves.',
    author: 'ALAZAR',
    date: 'Sep 17',
    readingTime: '18 min read + 20 min labs',
    tag: 'Safety',
    views: 1,
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
    title: 'HVAC Economizer Logic: Free Cooling, Damper Control & Freeze-Stat Safety',
    excerpt: 'A beginner-friendly guide to commercial building climate control: harnessing free outside air to slash electricity bills, modulating fresh air dampers, and interlocking low-limit freeze-stats to protect hydronic coils.',
    author: 'ALAZAR',
    date: 'Sep 10',
    readingTime: '12 min read + 15 min labs',
    tag: 'HVAC / Climate',
    views: 12,
    content: (
      <div className="space-y-6">
        <div className="my-8 not-prose rounded-xl overflow-hidden border border-zinc-300 shadow-xl bg-white">
          <img
            src={HVAC_ECONOMIZER_SVG_DATA_URI}
            alt="Rooftop Air Handling Unit (AHU) economizer airflow schematic"
            className="w-full h-auto object-cover max-h-[550px]"
          />
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs font-mono text-zinc-400 flex flex-wrap justify-between items-center gap-2">
            <span className="text-emerald-400 font-semibold">FIG 1.1 // ROOFTOP AIR HANDLING UNIT (AHU) ECONOMIZER</span>
            <span>SYSTEM: AHU-04 // ASHRAE 90.1 FREE-COOLING SCHEMATIC</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-8 mb-4">
          The $4,200 Power Bill &amp; The Burst Copper Pipe
        </h2>
        <p>
          Imagine driving home on a crisp 58°F (14°C) autumn evening. Inside your car, the afternoon sun made the cabin uncomfortably warm. What do you do?
        </p>
        <p>
          Do you turn on the high-power refrigerated air conditioning compressor, burning extra gasoline? <strong>Of course not.</strong> You simply roll down your window and let the cool evening breeze freshen the car for free!
        </p>
        <p>
          In commercial facilities—such as corporate offices, schools, and shopping centers—this intuitive concept is called the <strong>HVAC Economizer Cycle</strong> or <strong>&quot;Free Cooling&quot;</strong>. Air handling units (AHUs) draw in cool outdoor air instead of running energy-hungry mechanical chillers and compressors, cutting annual commercial cooling bills by <strong>up to 40%</strong>.
        </p>

        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg my-4 text-sm font-sans text-amber-950">
          <strong className="block font-semibold mb-1">The Costly Field Disaster:</strong>
          <p>
            In November at a regional community college, maintenance noticed the campus electric bill had spiked by over $4,200. During inspection, technicians discovered that the rooftop fresh air damper (<code>OAD-101</code>) was rusted shut at 10%. The building's DX air conditioning compressor had been running continuously even while outdoor temperatures hovered at a chilly 54°F!
          </p>
          <p className="mt-2">
            To &quot;fix&quot; it, a junior technician wedged the damper 100% open. Two nights later, an unseasonal cold snap plunged outside temperatures to 24°F (-4°C). The Arctic air blew straight into the mixing plenum, freezing the hot-water heating coil solid. The copper pipes ruptured under hydrostatic ice pressure, flooding three classrooms with water.
          </p>
          <p className="mt-2 font-medium">
            The Lesson: Economizers save massive energy, but they require safe upper and lower limits and fail-safe low-limit freeze-stat interlocks to avoid physical building catastrophe.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Understanding the 3 Main Dampers &amp; Air Streams
        </h2>
        <p>
          Before diving into the logic circuits, let's understand the physical anatomy of an Air Handling Unit (AHU):
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Outdoor Air Damper (OAD):</strong> Modulates from 0% to 100% to admit outside fresh air into the unit.</li>
          <li><strong>Return Air Damper (RAD):</strong> Recirculates conditioned air already inside the building to preserve warmth or coolness.</li>
          <li><strong>Exhaust / Relief Air Damper (EAD):</strong> Lets excess stale air escape to prevent over-pressurizing the building like an over-inflated balloon.</li>
        </ul>
        <p>
          When the Economizer activates:
          The Outside Damper opens to 100%, the Return Damper closes proportionally, and the Exhaust Damper opens to vent stale room air.
        </p>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 1: The Naive Outside Air Comparator (The Freeze Hazard)
        </h2>
        <p>
          A common beginner mistake is writing a simple single-line rule:
        </p>
        <div className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800">
          IF (Outside_Temp &lt; Return_Temp) AND Call_For_Cooling THEN<br />
          &nbsp;&nbsp;Open_Fresh_Air_Damper = 100%<br />
          &nbsp;&nbsp;AC_Compressor = OFF<br />
          ELSE<br />
          &nbsp;&nbsp;AC_Compressor = ON
        </div>
        <p>
          Below is <strong>Stage 1</strong> of our interactive lab. An <code>ANALOG_COMPARATOR</code> evaluates whether Outside Temp is lower than Return Temp. Try testing it below:
        </p>

        <InlineLab
          dsl={HVAC_LAB1_DSL}
          title="Stage 1 - The Naive Outside Air Comparator"
          step="Stage 1 of 3"
          height={480}
        />

        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg my-4 text-sm font-sans text-amber-950">
          <strong className="block font-semibold mb-1">The Beginner Flaw in Stage 1</strong>
          <p>
            In the lab above, change <strong>Outdoor Air Temp</strong> to 25°F (-4°C). Notice that <strong>Open Fresh Air Damper 100%</strong> stays ON! Because 25°F is indeed less than 74°F, the simple logic blindfolded the system into blasting sub-freezing air directly over the hydronic water coils, risking pipe bursts and severe tenant discomfort!
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 2: Safe Economizer Window &amp; Minimum Ventilation Damper
        </h2>
        <p>
          To fix the naive comparator, real-world Building Automation Systems (BAS) implement two fundamental rules:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>The Safe Economizer Window (Sweet Spot):</strong> Free cooling should only be allowed if outdoor air is cooler than room air <strong>AND</strong> warm enough to enter safely (typically <strong>above 50°F / 10°C</strong>). If outside is below 50°F, outdoor air must be tempered with return air!
          </li>
          <li>
            <strong>Minimum Ventilation Damper Position:</strong> Even when outside air is freezing cold or boiling hot, human occupants require fresh oxygen to breathe and dilute indoor CO2 levels (per building codes like ASHRAE 62.1). Therefore, the damper must <strong>never fully close during occupied hours</strong>—it must maintain a minimum opening (typically <strong>15%</strong>).
          </li>
        </ul>
        <p>
          We implement this in <strong>Stage 2</strong> using an <code>ANALOG_MUX</code> (Analog Multiplexer):
          When Free Cooling is OFF, the damper commands to <strong>15% (Minimum Ventilation)</strong>; when Free Cooling is ACTIVE, the damper opens to <strong>100% (Full Free Cooling)</strong>.
        </p>

        <InlineLab
          dsl={HVAC_LAB2_DSL}
          title="Stage 2 - Safe Economizer Window &amp; Min Vent Damper"
          step="Stage 2 of 3"
          height={520}
        />

        <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 rounded-r-lg my-4 text-sm font-sans text-emerald-950">
          <strong className="block font-semibold mb-1">Interactive Exercise — Stage 2</strong>
          <p>
            Observe <strong>Damper Actuator Position (%)</strong>: At 58°F, the green <em>Free Cooling Active</em> lamp is lit and the damper is at 100% with the compressor OFF (saving electricity!). Now adjust <strong>Outdoor Air Temp</strong> down to 45°F. Notice how Free Cooling shuts off, the compressor stays off (since outside is cold), and the damper safely relaxes to 15% minimum ventilation!
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 3: Low-Limit Freeze-Stat (FZT-101) &amp; Complete Safety Interlocks
        </h2>
        <p>
          What happens if an actuator motor breaks, a linkage snaps, or a blizzard strikes while the damper is open?
        </p>
        <p>
          In commercial HVAC, rotating machinery and water coils are protected by a dedicated <strong>Freeze-Stat (<code>FZT-101</code>)</strong>. This is a 20-foot vapor-filled copper capillary tube woven in a serpentine grid across the entire face of the heating and cooling coils.
        </p>
        <p>
          If <strong>any 12-inch section</strong> of the capillary tube drops below <strong>38°F (3.3°C)</strong>, the internal diaphragm trips an electrical switch:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Spring-Returns Dampers to 0%:</strong> Overrides all logic to slam the outdoor damper completely shut.</li>
          <li><strong>Trips the Supply Fan OFF:</strong> Prevents drawing freezing air through the ruptured coil.</li>
          <li><strong>Latches a Safety Alarm:</strong> Holds the unit safely shut down until a certified technician physically inspects the unit and presses the manual reset button.</li>
        </ul>

        <InlineLab
          dsl={HVAC_LAB3_DSL}
          title="Stage 3 - Full Economizer with Freeze-Stat Trip"
          step="Stage 3 of 3"
          height={560}
        />

        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg my-4 text-sm font-sans text-blue-950">
          <strong className="block font-semibold mb-1">Interactive Exercise — Stage 3</strong>
          <p>
            In Stage 3 above, the unit is happily free-cooling with 100% outdoor air. Now simulate a sudden frost or stuck damper by toggling <strong>FZT-101 Freeze-Stat Capillary Trip</strong> to TRUE. Notice how the RS Latch immediately locks into alarm: the damper drops to 0%, free cooling shuts off, and the compressor is locked out! Even after the trip clears, the alarm stays latched until you click <strong>Manual Alarm Reset PB</strong>.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Commissioning &amp; Field Checkout Checklist
        </h2>
        <p>
          When commissioning an air handling unit economizer on a commercial rooftop, follow this 5-point field checkout:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-sm">
          <li><strong>Verify Minimum Position:</strong> With the supply fan running and cooling disabled, verify the damper blades sit exactly at the designed minimum ventilation position (10% to 15%).</li>
          <li><strong>Test Actuator Spring Return:</strong> Kill main 24VAC control power to the damper actuator. Verify the mechanical internal spring snaps the outdoor air damper completely closed (0%) in under 15 seconds.</li>
          <li><strong>Calibrate Temperature Sensors:</strong> Cross-check the Outdoor Air Sensor (<code>TE-101</code>) and Return Air Sensor (<code>TE-102</code>) with a calibrated digital thermometer. A 2°F drift can waste thousands of kilowatt-hours per season.</li>
          <li><strong>Physically Test the Freeze-Stat:</strong> Use freeze spray on the capillary tube of <code>FZT-101</code>. Verify that the safety circuit trips, shuts the outdoor air damper, and requires a physical manual reset.</li>
          <li><strong>Inspect Exhaust Damper Relief:</strong> Ensure the barometric or motorized relief damper opens freely when outdoor air is at 100%, preventing building over-pressurization and whistling exterior doors.</li>
        </ol>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Key Engineering Takeaways
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans not-prose my-6">
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <h4 className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <span className="text-emerald-500 font-mono">01</span> Free Cooling Economics
            </h4>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Using cool outdoor air instead of running energy-heavy DX compressors can slash annual commercial cooling utility bills by up to 40%.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <h4 className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <span className="text-emerald-500 font-mono">02</span> The Safe Sweet Spot
            </h4>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Never economize below 50°F (10°C) without mixed air preheating. Freezing outdoor air must be tempered with warm return air.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <h4 className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <span className="text-emerald-500 font-mono">03</span> Continuous Ventilation
            </h4>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Commercial building codes (ASHRAE 62.1) require maintaining a minimum damper opening (10-15%) during occupied hours for human oxygen &amp; CO2 control.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <h4 className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <span className="text-emerald-500 font-mono">04</span> Hard Freeze Protection
            </h4>
            <p className="text-zinc-600 text-xs leading-relaxed">
              A physical low-limit capillary switch (FZT-101) tripped at 38°F is non-negotiable to slam dampers closed and prevent catastrophic coil freezing.
            </p>
          </div>
        </div>
      </div>
    ),
    dsl: ''
  },
  {
    slug: 'tank-hysteresis',
    title: 'The 40-Second Motor Burnout: Tank Level Hysteresis, Schmitt Triggers & Anti-Short-Cycling',
    excerpt: 'A deep masterclass on process vessel level control: diagnosing why single-threshold comparators cause catastrophic contactor chattering, implementing mathematical hysteresis bands with Schmitt triggers, and building dynamic closed-loop tank models with surface slosh filtering.',
    author: 'ALAZAR',
    date: 'Sep 3',
    readingTime: '18 min read + 20 min labs',
    tag: 'Control Systems',
    views: 16,
    content: (
      <div className="space-y-6">
        <div className="my-8 not-prose rounded-xl overflow-hidden border border-zinc-300 shadow-xl bg-white">
          <img
            src={TANK_HYSTERESIS_SVG_DATA_URI}
            alt="Industrial Process Vessel Level Hysteresis and Schmitt Trigger Control P&ID"
            className="w-full h-auto object-cover max-h-[550px]"
          />
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs font-mono text-zinc-400 flex flex-wrap justify-between items-center gap-2">
            <span className="text-emerald-400 font-semibold">FIG 1.1 // PROCESS VESSEL LEVEL HYSTERESIS &amp; SCHMITT TRIGGER</span>
            <span>DUAL-THRESHOLD DEADBAND &amp; NEMA MG 1 PROTECTION ARCHITECTURE</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-8 mb-4">
          1. The 40-Second Motor Burnout &amp; The Welded Contactor
        </h2>
        <p>
          At 03:14 AM on a frigid November night inside a commercial beverage bottling and pasteurization plant, a pungent chemical stench of charred epoxy and vaporized copper filled the motor control center (MCC). Seconds later, the main 480V substation feeder breaker tripped on instantaneous magnetic overcurrent, plunging the entire packaging line into total blackout.
        </p>
        <p>
          The culprit was the primary 75 kW (100 HP) centrifugal pump (<code>P-201</code>) feeding a 50,000-gallon raw water buffer vessel (<code>TK-201</code>). When electricians unbolted the enclosure of motor starter contactor <code>M-201</code>, they found the silver-cadmium contacts burned into molten spheres and permanently welded shut. The motor windings had reached temperatures exceeding 240°C, destroying the Class H insulation and shorting all three phases directly to ground.
        </p>
        <p>
          During the root-cause investigation, controls engineers pulled the PLC program archive. A junior automation technician had implemented the tank filling routine using a single naive analog comparator:
        </p>
        <div className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800">
          // NAIVE TANK FILL LOGIC - DO NOT USE IN PRODUCTION<br />
          IF Tank_Level_LT201 &lt; 50.0 THEN<br />
          &nbsp;&nbsp;&nbsp;&nbsp;Pump_Cmd := TRUE;<br />
          ELSE<br />
          &nbsp;&nbsp;&nbsp;&nbsp;Pump_Cmd := FALSE;<br />
          END_IF;
        </div>
        <p>
          The incoming city water feed was turbulent, and the liquid surface suffered continuous 2-inch ripples from an adjacent agitator. As the tank filled to exactly 50.0%, the radar level transmitter (<code>LT-201</code>) dithered between 49.9% and 50.1% every 300 to 500 milliseconds.
        </p>
        <p>
          In less than 12 minutes, the 480V contactor slammed open and closed over <strong>1,400 times</strong>. The motor inrush current (6× to 8× full load amperage) never subsided. Heat accumulated in the copper stator windings exponentially faster than the cooling fan could dissipate it, incinerating a $14,000 motor and causing $85,000 in unscheduled downtime.
        </p>

        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg my-4 text-sm font-sans text-amber-950">
          <strong className="block font-semibold mb-1">Physical Hazards: Contactor Contact Welding &amp; NEMA Motor Start Limits</strong>
          <p>
            Standard 3-phase induction motors are thermally rated according to NEMA MG 1 and IEC 60034. Large motors (above 50 HP) must NEVER be started more than 3 to 4 times per hour from cold, or 2 times per hour from hot running temperature! A single-threshold comparator causes destructive contactor chattering that welds contactor tips shut, burns motor coils, and propagates acoustic water hammer shockwaves throughout piping networks.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          2. Engineering Theory: Schmitt Triggers, Deadband Sizing &amp; Fluid Slosh Dynamics
        </h2>
        <p>
          To stop rapid chattering, control engineers implement <strong>Hysteresis</strong> (also known as a <strong>Schmitt Trigger</strong> or <strong>Differential Gap</strong>). Instead of a single switching point, the control algorithm defines two discrete, separated thresholds:
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li><strong>Lower Threshold (H<sub>start</sub>):</strong> Turn the pump ON when level drops below <strong>20%</strong>.</li>
          <li><strong>Upper Threshold (H<sub>stop</sub>):</strong> Turn the pump OFF when level reaches <strong>80%</strong>.</li>
          <li><strong>Deadband (&Delta;H):</strong> Between 20% and 80%, the controller <strong>holds its previous state</strong>. No switching can occur inside the deadband!</li>
        </ol>

        <div className="my-6 overflow-x-auto not-prose rounded-xl border border-zinc-200 shadow-sm bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm text-left">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              <tr>
                <th className="px-4 py-3 border-b border-zinc-200">Control Architecture</th>
                <th className="px-4 py-3 border-b border-zinc-200">Complexity</th>
                <th className="px-4 py-3 border-b border-zinc-200">Noise Immunity</th>
                <th className="px-4 py-3 border-b border-zinc-200">Starts Per Hour</th>
                <th className="px-4 py-3 border-b border-zinc-200">Primary Failure Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-semibold text-zinc-900">Naive Single-Point Comparator</td>
                <td className="px-4 py-3 text-zinc-600">Trivial (1 block)</td>
                <td className="px-4 py-3 text-red-600 font-semibold">Zero (Severe Chatter)</td>
                <td className="px-4 py-3 text-red-600 font-semibold">&gt;500 starts/hr</td>
                <td className="px-4 py-3 text-zinc-600">Welded contactors, motor stator burnout, water hammer</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-4 py-3 font-semibold text-zinc-900">Fixed Hysteresis (Schmitt Trigger)</td>
                <td className="px-4 py-3 text-zinc-600">Low (1 block)</td>
                <td className="px-4 py-3 text-zinc-600">Excellent (Within Deadband)</td>
                <td className="px-4 py-3 text-zinc-600">0.5&ndash;2 starts/hr</td>
                <td className="px-4 py-3 text-zinc-600">Large liquid level swings in tight buffer tanks</td>
              </tr>
              <tr className="hover:bg-zinc-50/80 transition-colors bg-teal-50/50">
                <td className="px-4 py-3 font-semibold text-teal-900">Filtered Hysteresis + Safety Alarms</td>
                <td className="px-4 py-3 text-teal-800">Industrial Grade</td>
                <td className="px-4 py-3 text-teal-800 font-bold">Impervious (Filters Wave Echoes)</td>
                <td className="px-4 py-3 text-teal-800 font-bold">Strictly bounded</td>
                <td className="px-4 py-3 text-teal-800">Requires dual independent hardwired safety switches (LSHH/LSLL)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-bold font-serif text-zinc-900 mt-8 mb-3">
          Sizing the Hysteresis Deadband vs. Vessel Geometry
        </h3>
        <p>
          The time required to complete one full fill-drain cycle (t<sub>cycle</sub>) is a direct mathematical function of the deadband volume:
        </p>
        <div className="bg-zinc-900 text-teal-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800 text-center">
          &Delta;V = A<sub>tank</sub> &times; &Delta;H = A<sub>tank</sub> &times; (H<sub>stop</sub> &minus; H<sub>start</sub>)
        </div>
        <p>
          For a 50,000-gallon vessel with a 1,200 GPM pump and a 400 GPM average process draw:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>With a naive 0.2% ripple at 50%: &Delta;V = 100 gal &rarr; t<sub>cycle</sub> = 18.7 seconds (<strong>192 starts/hour &mdash; fatal!</strong>)</li>
          <li>With a 60% hysteresis band (20% to 80%): &Delta;V = 30,000 gal &rarr; t<sub>cycle</sub> = 5,625 seconds &asymp; 1.56 hours (<strong>0.64 starts/hour &mdash; rock solid!</strong>)</li>
        </ul>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          3. Stage 1: The Naive Single-Setpoint Flaw (Destructive Short-Cycling)
        </h2>
        <p>
          Examine the Stage 1 circuit below. It implements the exact naive boolean comparison that destroyed the bottling plant&apos;s motor:
          <code>level.Q &rarr; comp.A (operation=&quot;lt&quot;)</code> with <code>setpoint = 50%</code>.
        </p>
        <p>
          We have wired an edge trigger (<code>R_TRIG</code>) into a <code>COUNTER</code> block to record every time the motor contactor is energized.
        </p>

        <InlineLab
          dsl={HYSTERESIS_LAB1_DSL}
          title="Stage 1: The Naive Single-Setpoint Flaw"
          step="Stage 1 of 3"
          height={520}
        />

        <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg my-4 text-sm font-sans text-red-950">
          <strong className="block font-semibold mb-1">Interactive Exercise — Stage 1 (Simulating Destructive Chatter)</strong>
          <p>
            In Stage 1 above, click on <strong>Raw Tank Level %</strong> (currently 50%). Change it to 49%&mdash;the pump turns ON and the counter records 1 start. Now change it to 51% (pump turns OFF), then 49% (pump turns ON), then 50%... Notice how every tiny fluctuation around 50% pulses the motor starter! In a turbulent tank with surface ripples, this produces dozens of contactor arcs per minute, destroying mechanical contacts and overheating the motor windings.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          4. Stage 2: Dual Threshold Hysteresis with ANALOG_DIFFERENTIAL (Schmitt Trigger)
        </h2>
        <p>
          To solve short-cycling once and for all, Stage 2 introduces the <strong>ANALOG_DIFFERENTIAL</strong> functional block. It features independent turn-on and turn-off thresholds:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><code>onThreshold = 20</code>: When the tank level drops down to or below 20%, the block turns its output <code>Q</code> to TRUE (starts the fill pump).</li>
          <li><code>offThreshold = 80</code>: When the tank level rises up to or above 80%, the block turns its output <code>Q</code> to FALSE (shuts the fill pump off).</li>
          <li><strong>The Deadband:</strong> While the level is anywhere between 20% and 80%, the block retains its existing state.</li>
        </ul>

        <InlineLab
          dsl={HYSTERESIS_LAB2_DSL}
          title="Stage 2: Hysteresis Band (Schmitt Trigger)"
          step="Stage 2 of 3"
          height={520}
        />

        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg my-4 text-sm font-sans text-blue-950">
          <strong className="block font-semibold mb-1">Interactive Exercise — Stage 2 (Testing the Deadband Window)</strong>
          <p>
            In Stage 2 above:
            <br />1. Click on <strong>Tank Level %</strong> and drop the level down to 18%. Notice that <strong>Fill Pump Motor Command</strong> turns ON!
            <br />2. Now raise the level to 35%, then 50%, then 75%. Notice the pump stays solidly ENERGIZED throughout the deadband!
            <br />3. Now raise the level to 82%: the pump instantly shuts OFF!
            <br />4. Now lower the level back to 70%, then 50%, then 30%: the pump stays reliably DE-ENERGIZED until you drop below 20%! Contactor chattering is mathematically impossible.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          5. Stage 3: Closed-Loop Dynamic Storage Tank with Wave Slosh Filter &amp; Safety Alarms
        </h2>
        <p>
          In real-world process vessels, liquid is continuously consumed by downstream equipment while the pump delivers pressurized inflow. Furthermore, incoming fluid creates surface sloshing, splashing, and acoustic radar echo noise.
        </p>
        <p>
          Stage 3 couples a dynamic physical vessel with industrial signal conditioning:
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li><strong>Dynamic Plant Model (<code>ANALOG_RAMP</code> + <code>ANALOG_MUX</code>):</strong> When the pump is ON, inflow exceeds outflow (level rises at 7%/s). When the pump is OFF, gravity drain empties the tank at 4%/s.</li>
          <li><strong>First-Order Low-Pass Filter (<code>ANALOG_FILTER</code>):</strong> Uses an exponential moving average with time constant &tau; = 1,000 ms to eliminate turbulence before feeding the Schmitt trigger.</li>
          <li><strong>Safety Protection Permissives:</strong>
            <ul className="list-disc pl-6 mt-1 space-y-1">
              <li><strong>High-High Limit (<code>LSHH-201</code> at 92%):</strong> Independent trip gate that immediately de-energizes the pump contactor if fluid nears tank overflow.</li>
              <li><strong>Low-Low Dry-Run Alarm (<code>LSLL-201</code> at 8%):</strong> Warns operators of suction well starvation to protect downstream impellers from cavitation.</li>
            </ul>
          </li>
        </ol>

        <InlineLab
          dsl={HYSTERESIS_LAB3_DSL}
          title="Stage 3: Closed-Loop Storage Tank with Dynamic Hysteresis"
          step="Stage 3 of 3"
          height={650}
        />

        <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 rounded-r-lg my-4 text-sm font-sans text-emerald-950">
          <strong className="block font-semibold mb-1">Interactive Exercise — Stage 3 (Dynamic Cycling &amp; High-High Trips)</strong>
          <p>
            In Stage 3 above:
            <br />1. Press <strong>▶ Run</strong>. Watch the tank level smoothly oscillate between 20% and 80% in a continuous, automated triangular cycle. Notice the <strong>Smoothed Level %</strong> lags raw surface ripples cleanly.
            <br />2. Open the Logic Analyzer at the bottom to view the analog ramps and clean digital pump square wave.
            <br />3. Test the Safety Interlock: Toggle <strong>System Permissive &amp; Breaker Healthy</strong> to OFF while the pump is running&mdash;notice the pump drops out immediately regardless of water level!
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          6. Commissioning Checklist &amp; Plant Floor Level Sensor Proof Testing
        </h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>
            <strong>Calculate Minimum Deadband from Motor Nameplate:</strong> Verify the motor&apos;s rated maximum starts per hour with the manufacturer (f<sub>max</sub>). Ensure the volume deadband &Delta;V guarantees t<sub>cycle</sub> &ge; 3600 / f<sub>max</sub> under worst-case peak inflow and minimum gravity consumption.
          </li>
          <li>
            <strong>Instrument Stilling Well Verification:</strong> Ultrasonic and radar transmitters must be mounted inside a vertical, perforated <strong>stilling well</strong> (or bypass bridle) if the vessel has mechanical agitation, turbulent top-filling nozzles, or boiling liquids.
          </li>
          <li>
            <strong>Damping Parameter Alignment:</strong> Configure transmitter internal damping (2 to 5 seconds) to suppress physical surface ripples before transmitting 4&ndash;20 mA signals to the analog input card.
          </li>
          <li>
            <strong>Independent High-High Float Switches (LSHH):</strong> Never rely solely on an analog transmitter for overflow prevention. A physical magnetic float or tuning fork switch must be hardwired directly into the motor starter safety circuit.
          </li>
          <li>
            <strong>Fail-Safe Signal Behavior (NAMUR NE 43):</strong> Ensure that sensor wire break (&lt;3.6 mA) or short circuit (&gt;21.0 mA) causes the PLC to immediately default to a safe state (stop filling pump, trigger operator diagnostic alarm).
          </li>
          <li>
            <strong>Quarterly Contactor Tip Inspection:</strong> Periodically unbolt MCC starter covers and inspect silver-alloy contact tips for pitting, carbon buildup, or signs of contact chatter arcing.
          </li>
        </ul>
      </div>
    ),
    dsl: ''
  },
  {
    slug: 'pump-alternator',
    title: 'Motor Duty Cycling: Duplex Pump Alternation, Auto-Takeover & Lead/Lag Control',
    excerpt: 'An intermediate masterclass on rotating machinery duty cycling: why naive flip-flops stall when motors trip, how to implement automatic standby takeover, and configuring duplex lead/lag assist for peak demand surges.',
    author: 'ALAZAR',
    date: 'Aug 27',
    readingTime: '12 min read + 15 min labs',
    tag: 'Intermediate',
    views: 4,
    content: (
      <div className="space-y-6">
        <div className="my-8 not-prose rounded-xl overflow-hidden border border-zinc-300 shadow-xl bg-white">
          <img
            src={PUMP_ALTERNATOR_SVG_DATA_URI}
            alt="Duplex Pump Duty Alternation and Lead-Lag Control P&ID"
            className="w-full h-auto object-cover max-h-[550px]"
          />
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs font-mono text-zinc-400 flex flex-wrap justify-between items-center gap-2">
            <span className="text-emerald-400 font-semibold">FIG 1.1 // DUPLEX PUMP DUTY CYCLING &amp; LEAD / LAG SEQUENCING</span>
            <span>EQUAL WEAR BALANCING &amp; STANDBY AUTO-TAKEOVER</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-8 mb-4">
          The Duplex Pump Dilemma: Unequal Wear vs. Fault Stalling
        </h2>
        <p>
          In commercial buildings, municipal booster stations, and industrial lift stations, pumps rarely operate alone. A standard design installs two identical pumps (<strong>Pump A</strong> and <strong>Pump B</strong>) piped in parallel across common suction and discharge manifolds.
        </p>

        <h3 className="text-xl font-bold font-serif text-zinc-900 mt-6 mb-2">
          Why Alternate Rotating Equipment?
        </h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Equalizing Wear:</strong> If Pump A runs 100% of the time while Pump B sits idle as a &quot;cold spare,&quot; Pump A accumulates thousands of operating hours and burns out its mechanical seal within a year. Meanwhile, Pump B&apos;s idle seal elastomeric faces can dry out, and its bearing grease can oxidize or separate, causing it to seize the very first time an emergency occurs!
          </li>
          <li>
            <strong>Thermal Dissipation:</strong> Periodic resting gives motor windings, motor bearings, and contactor coils time to cool down below their maximum thermal rise limits.
          </li>
          <li>
            <strong>Operational Verification:</strong> Running both pumps on a daily or weekly rotation proves that both starters, pressure switches, and non-return valves (NRVs) remain fully functional before a critical surge hits.
          </li>
        </ul>

        <p>
          However, many beginner PLC programs implement alternation using a simple, blind flip-flop:
        </p>
        <div className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800">
          Cycle Finished &rarr; Toggle Bit &rarr; Alternate Next Demand
        </div>
        <p>
          <strong>The Field Flaw:</strong> What happens if Pump A trips on its thermal overload relay? The blind flip-flop doesn&apos;t care&mdash;on the very next cycle, it blindly routes the call to the faulted pump. Demand goes completely unserved, the wet well fills up, and an alarm sounds, even though a perfectly healthy Pump B was sitting right next to it doing nothing!
        </p>

        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg my-4 text-sm font-sans text-amber-950">
          <strong className="block font-semibold mb-1">Intermediate Control Rule: Alternation Must Be Fault-Aware</strong>
          <p>
            A duty alternator should never be just a software toggle flip-flop. Real-world duty cycling must cross-check equipment health: if the duty pump is faulted, in maintenance lockout, or fails to prove flow, the standby unit must take over immediately without human intervention.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 1: The Classic Flip-Flop Alternator
        </h2>
        <p>
          In Stage 1 below, we implement the foundational duty cycling circuit using a <code>PULSE_RELAY</code> (bistable toggle flip-flop) driven by a falling-edge detector (<code>F_TRIG</code>).
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>When water demand is active (<code>Call for Water</code> = ON), the currently selected pump runs.</li>
          <li>When water demand is satisfied (<code>Call for Water</code> turns OFF), the falling edge triggers the <code>PULSE_RELAY</code>.</li>
          <li>The toggle state switches, steering the <em>next</em> start command to the opposite pump via mutual AND gates.</li>
        </ul>

        <InlineLab
          dsl={PUMP_ALT_LAB1_DSL}
          title="Stage 1: The Basic Duty Alternator"
          step="Stage 1 of 3"
          height={520}
        />

        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg my-4 text-sm font-sans text-blue-950">
          <strong className="block font-semibold mb-1">Interactive Exercise &mdash; Stage 1 (Observe the Alternation)</strong>
          <ol className="list-decimal pl-5 space-y-1 mt-1">
            <li>Notice that Pump A is initially running because <strong>Call for Water</strong> is ON.</li>
            <li>Toggle <strong>Call for Water</strong> to OFF (cycle complete). Watch the <strong>Duty Flip-Flop</strong> switch state and light up <strong>Next Duty: Pump B when ON</strong>.</li>
            <li>Turn <strong>Call for Water</strong> back ON: now Pump B runs!</li>
            <li>Notice the limitation: there is no input for motor health. If a pump burns out, the circuit still tries to run it every other cycle!</li>
          </ol>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 2: Fault-Aware Alternator with Automatic Standby Takeover
        </h2>
        <p>
          To solve the blind toggle flaw, Stage 2 introduces motor health interlocks from thermal overload auxiliary contacts (<code>healthy_a</code> and <code>healthy_b</code>).
        </p>

        <h3 className="text-xl font-bold font-serif text-zinc-900 mt-6 mb-2">
          How Automatic Takeover Works:
        </h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Normal Cycle:</strong> If Pump A is selected and healthy, Pump A runs.
          </li>
          <li>
            <strong>Duty Pump Faulted:</strong> If Pump A is selected but trips its overload (<code>healthy_a</code> drops to false), the <code>takeover_b</code> gate activates instantly. Demand is immediately redirected to <strong>Pump B</strong>!
          </li>
          <li>
            <strong>Standby Backup:</strong> The station continues delivering water without human intervention. An alarm indicator alerts technicians to service Pump A while Pump B carries the load.
          </li>
        </ul>

        <InlineLab
          dsl={PUMP_ALT_LAB2_DSL}
          title="Stage 2: Fault-Aware Standby Auto-Takeover"
          step="Stage 2 of 3"
          height={520}
        />

        <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 rounded-r-lg my-4 text-sm font-sans text-emerald-950">
          <strong className="block font-semibold mb-1">Interactive Exercise &mdash; Stage 2 (Simulate a Tripped Motor Overload)</strong>
          <ol className="list-decimal pl-5 space-y-1 mt-1">
            <li>With <strong>Call for Water</strong> active, Pump A is running normally as the duty pump.</li>
            <li>Now toggle <strong>Pump A Overload Healthy</strong> to OFF (simulating a tripped starter thermal overload).</li>
            <li>Watch what happens in real time: Pump A shuts down, <strong>Pump A Tripped Alarm</strong> illuminates, and Pump B immediately energizes under <strong>Standby Pump in Auto-Takeover</strong>!</li>
            <li>The process never starves for water even during an active equipment breakdown.</li>
          </ol>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 3: Duplex Lead / Lag Sequencing for Peak Inflow
        </h2>
        <p>
          In real stormwater stations, municipal lift stations, and commercial booster systems, water demand fluctuates throughout the day. A single pump may handle 90% of operating hours, but during a heavy storm or peak morning demand, one pump cannot keep up.
        </p>
        <p>
          This is where <strong>Lead / Lag Sequencing</strong> is used:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Lead Demand (<code>lead_call</code>):</strong> The primary demand switch (e.g. wet well reaches 50% level or water pressure drops below 45 PSI). The assigned <strong>Lead Pump</strong> starts and runs solo.
          </li>
          <li>
            <strong>Lag Demand (<code>lag_call</code>):</strong> A secondary high-demand switch (e.g. wet well surges to 80% level or pressure drops below 35 PSI). The <strong>Lag Pump</strong> starts in parallel to assist, doubling discharge flow rate!
          </li>
          <li>
            When the surge subsides and <code>lag_call</code> turns off, the Lag pump shuts down, leaving the Lead pump to finish the cycle.
          </li>
          <li>
            On cycle completion, the Lead duty alternates, ensuring both pumps share the Lead role equally.
          </li>
        </ul>

        <InlineLab
          dsl={PUMP_ALT_LAB3_DSL}
          title="Stage 3: Duplex Lead / Lag Sequencing & Peak Assist"
          step="Stage 3 of 3"
          height={600}
        />

        <div className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg my-4 text-sm font-sans text-indigo-950">
          <strong className="block font-semibold mb-1">Interactive Exercise &mdash; Stage 3 (Duplex Lead/Lag Peak Assist)</strong>
          <ol className="list-decimal pl-5 space-y-1 mt-1">
            <li>With only <strong>Lead Demand</strong> active, Pump A runs alone as the Lead unit.</li>
            <li>Now toggle <strong>Lag Demand (High Inflow / Peak Surge)</strong> to ON. Watch Pump B immediately kick on alongside Pump A, illuminating <strong>Dual Pumping Mode (Peak Surge)</strong>!</li>
            <li>Turn <strong>Lag Demand</strong> OFF: Pump B shuts off smoothly, and Pump A continues running.</li>
            <li>Turn <strong>Lead Demand</strong> OFF to finish the cycle. Next time you turn <strong>Lead Demand</strong> ON, Pump B starts as the Lead pump, and Pump A becomes the Lag standby!</li>
          </ol>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Field Commissioning &amp; Maintenance Best Practices
        </h2>
        <p>
          When programming duplex pump stations on the plant floor or in building automation systems, keep these five field guidelines in mind:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Alternate on Cycle Completion, Not Cycle Start:</strong> Always trigger the duty toggle on the <em>falling edge</em> of the demand call (when pumping stops). If you toggle on the rising edge, an operator cycling the power switch or a brief sensor flicker could prematurely swap the duty assignment mid-stride.
          </li>
          <li>
            <strong>Stagger Lag Pump Starting:</strong> When dual pumping is required, never start both large induction motors simultaneously across-the-line. Stagger the Lag pump start by 5 to 10 seconds to avoid tripping the main building feeder breaker on cumulative motor inrush current.
          </li>
          <li>
            <strong>Provide an Exercise Timer:</strong> If a duplex pump station sits idle for weeks (common in backup flood sumps or seasonal HVAC systems), configure an automated exercise timer (e.g., run each pump for 60 seconds once every 7 days). This keeps mechanical seal faces lubricated and flushes sediment out of the pump volute.
          </li>
          <li>
            <strong>Non-Return Valve (NRV) Integrity:</strong> Every parallel pump branch requires a dedicated swing or silent check valve on its discharge. If check valve NRV-A fails open, Pump B will simply recirculate pressurized water backward through Pump A instead of delivering water to the system!
          </li>
          <li>
            <strong>Runtime Hour Balancing vs. Cycle Alternation:</strong> Simple cycle alternation works best when run durations are relatively consistent. For applications where one run cycle might last 5 minutes and another lasts 6 hours, intermediate PLCs accumulate run hours into memory registers and assign Lead duty to whichever pump has fewer lifetime hours.
          </li>
        </ul>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Key Engineering Takeaways
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Duty cycling equalizes wear:</strong> Alternating runtime prevents premature mechanical seal degradation and bearing brinelling on idle backup equipment.
          </li>
          <li>
            <strong>Never toggle blindly:</strong> Always include motor overload (<code>OL</code>) and disconnect switch auxiliary contacts to allow automatic standby substitution during hardware faults.
          </li>
          <li>
            <strong>Lead / Lag doubles capacity:</strong> Duplex staging allows energy-efficient single-pump operation under base load while providing full parallel capacity during peak demand surges.
          </li>
          <li>
            <strong>Proven simplicity:</strong> With a falling-edge trigger (<code>F_TRIG</code>), a toggle flip-flop (<code>PULSE_RELAY</code>), and basic logic gates, you can build a resilient, industry-standard duplex controller.
          </li>
        </ul>
      </div>
    ),
    dsl: ''
  },
  {
    slug: 'esd-delays',
    title: 'Emergency Shutdown Sequence (ESD): Staged Delays & Safe Depressurization',
    excerpt: 'A beginner-friendly guide to industrial emergency stops: why pulling the master plug causes catastrophic thermal seizures, using TOF off-delay timers for post-trip cooling, and sequencing flare blowdown vents.',
    author: 'ALAZAR',
    date: 'Aug 20',
    readingTime: '12 min read + 15 min labs',
    tag: 'Safety / ESD',
    views: 1,
    content: (
      <div className="space-y-6">
        <div className="my-8 not-prose rounded-xl overflow-hidden border border-zinc-300 shadow-xl bg-white">
          <img
            src={ESD_DELAYS_SVG_DATA_URI}
            alt="Chemical process vessel ESD valve and cooling loop blueprint"
            className="w-full h-auto object-cover max-h-[550px]"
          />
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs font-mono text-zinc-400 flex flex-wrap justify-between items-center gap-2">
            <span className="text-red-400 font-semibold">FIG 1.1 // PROCESS SKID EMERGENCY SHUTDOWN (ESD)</span>
            <span>SYSTEM: RX-101 // IEC 61511 SIL-2 DEPRESSURIZATION TIMELINE</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-8 mb-4">
          The $85,000 Extruder Carbon Bake &amp; The Trapped Solvent Hazard
        </h2>
        <p>
          When a beginner thinks of an Emergency Stop (E-Stop), they envision slamming the big red mushroom button and having all electrical power cut to zero in a single millisecond.
        </p>
        <p>
          In the real physical world of chemical processing, rotating machinery, and high-temperature reactors, <strong>cutting all power simultaneously can cause catastrophic damage:</strong>
        </p>

        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg my-4 text-sm font-sans text-blue-950">
          <strong className="block font-semibold mb-1">A Familiar Everyday Analogy: Turbocharged Car Engines</strong>
          <p>
            Think of high-performance turbocharged sports cars. When you push an engine hard on a racetrack, the turbocharger spins at 150,000 RPM and glows cherry red at 1,400°F (760°C).
          </p>
          <p className="mt-2">
            If you suddenly turn the key off the second you park, the oil pump stops instantly. The trapped oil inside the red-hot bearing housing bakes into solid abrasive charcoal in seconds, destroying the turbocharger bearings. Instead, the engine must idle or run an auxiliary electric coolant pump for a few minutes to dissipate heat.
          </p>
        </div>

        <p>
          In industrial automation, the exact same principle applies:
        </p>
        <p>
          At a specialty polymer plant in Louisiana, a small mechanical seal leak sprayed raw feed onto the skid floor. A startled operator panicked and pulled the main 480V disconnect handle on the wall.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>The raw chemical feed stopped immediately (good).</li>
          <li>But the cooling water jacket pump died instantly while the chemical reactor was at 420°F (215°C)!</li>
          <li>Without cooling water flow, the remaining molten polymer baked into a rock-solid block of carbon, permanently fusing the $85,000 internal agitator screw to the reactor walls.</li>
          <li>Even worse, volatile solvent vapors remained trapped at 180 PSI with no power to open the relief valves!</li>
        </ul>

        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg my-4 text-sm font-sans text-amber-950">
          <strong className="block font-semibold mb-1">The Golden Lesson:</strong>
          <p>
            An Emergency Shutdown must be a <strong>controlled, staged sequence</strong>: instantly starve raw feed, keep auxiliary cooling pumps alive via <strong>off-delay timers (<code>TOF</code>)</strong>, and open emergency flare blowdown vents to safely depressurize the vessel.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Why E-Stops Use Normally Closed (NC) Contacts
        </h2>
        <p>
          Notice in all industrial standards (such as NFPA 79 and IEC 60204-1) that Emergency Stop pushbuttons are wired as <strong>Normally Closed (NC)</strong> contacts.
        </p>
        <p>
          Why? Because of the <strong>Fail-Safe Principle</strong>:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>When the button is untouched, electrical current flows through the closed contact (<code>True</code>).</li>
          <li>When an operator hits the mushroom button, the mechanical contacts break open, interrupting current flow (<code>False</code>).</li>
          <li>If a rat chews through the wire, a terminal screw vibrates loose, or an electrician accidentally cuts the cable, the circuit breaks open—causing a <strong>fail-safe shutdown</strong> rather than leaving the machine unable to stop!</li>
        </ul>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 1: The Naive Simultaneous Cut (Why Simple AND Fails)
        </h2>
        <p>
          Below is <strong>Stage 1</strong> of our interactive lab, representing how naive programmers wire an emergency stop circuit: a single <code>AND</code> gate driving both the feed valve and the cooling pump simultaneously.
        </p>
        <p>
          Try running the simulation below and observe what happens when you press the E-Stop button:
        </p>

        <InlineLab
          dsl={ESD_LAB1_DSL}
          title="Stage 1 - The Naive Simultaneous Cut"
          step="Stage 1 of 3"
          height={460}
        />

        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg my-4 text-sm font-sans text-amber-950">
          <strong className="block font-semibold mb-1">The Beginner Flaw in Stage 1</strong>
          <p>
            Click on the <strong>E-Stop Mushroom PB (NC)</strong> button to simulate pressing it. Both <em>Chemical Feed Valve</em> and <em>Cooling Circulation Pump</em> turn OFF immediately in the exact same scan cycle! The cooling pump cuts out before the reactor can dissipate its thermal energy, triggering equipment seizure.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 2: Staged Cooldown via TOF (Timer Off-Delay)
        </h2>
        <p>
          To protect rotating bearings and prevent boiling runaway, we introduce one of the most useful blocks in industrial automation: the <strong>Timer Off-Delay (<code>TOF</code>)</strong>.
        </p>
        <p>
          How a <code>TOF</code> Works:
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>While the input (<code>A</code>) is <strong>True</strong>, the output (<code>Q</code>) is <strong>True</strong> (the pump runs normally).</li>
          <li>The instant the input (<code>A</code>) drops to <strong>False</strong> (the E-Stop is hit), the <code>TOF</code> starts an internal countdown clock!</li>
          <li>The output (<code>Q</code>) <strong>stays True</strong> during the countdown (holding the cooling pump energized).</li>
          <li>Only after the full duration expires (e.g., 3.0 seconds) does the pump finally de-energize.</li>
        </ol>

        <InlineLab
          dsl={ESD_LAB2_DSL}
          title="Stage 2 - Staged Off-Delay Cooling via TOF"
          step="Stage 2 of 3"
          height={480}
        />

        <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 rounded-r-lg my-4 text-sm font-sans text-emerald-950">
          <strong className="block font-semibold mb-1">Interactive Exercise — Stage 2</strong>
          <p>
            Press the <strong>E-Stop Mushroom PB (NC)</strong> button. Notice that the Chemical Feed Valve shuts immediately (0 sec), but the Cooling Circulation Pump remains ACTIVE! Watch the timer hold the pump running for 3 seconds of safe post-trip cooling before gracefully turning off.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 3: Controlled Flare Venting &amp; The Anti-Restart Latch
        </h2>
        <p>
          In pressurized chemical or gas systems, shutting valves is only half the battle. Trapped pressure must be safely routed to the <strong>flare stack</strong> through a Blowdown Valve (<code>BDV-101</code>).
        </p>
        <p>
          However, opening a high-pressure vent valve at the exact millisecond a pipe bursts can cause violent pressure shockwaves or extinguish flare pilot flames. Therefore:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>At T = 0.0s:</strong> Raw feed valve (<code>XV-101</code>) shuts immediately.</li>
          <li><strong>At T = 1.0s:</strong> Blowdown vent valve (<code>BDV-101</code>) opens via a short <code>TON</code> delay, safely depressurizing the vessel to the flare header.</li>
          <li><strong>From T = 0 to 4.0s:</strong> Cooling pump (<code>P-101</code>) runs on via <code>TOF</code> to dissipate reaction heat.</li>
          <li><strong>The Anti-Restart Latch (<code>RS_LATCH</code>):</strong> If someone twists or pulls the red mushroom button to reset it, the plant <strong>must NEVER jump back to life on its own</strong>! An <code>RS_LATCH</code> locks the shutdown in memory until a deliberate, separate &quot;Master Safety Reset&quot; button is pressed by a trained operator.</li>
        </ul>

        <InlineLab
          dsl={ESD_LAB3_DSL}
          title="Stage 3 - Controlled Flare Vent &amp; Latched Safety Train"
          step="Stage 3 of 3"
          height={560}
        />

        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg my-4 text-sm font-sans text-blue-950">
          <strong className="block font-semibold mb-1">Interactive Exercise — Stage 3</strong>
          <p>
            1. Click <strong>E-Stop Mushroom PB</strong> to trip the system. Notice that the Feed Valve shuts instantly, the Alarm sounds, the Cooling Pump keeps running for 4.0s, and after a 1.0s pause, the Flare Blowdown Vent opens!<br />
            2. Now pull the E-Stop back out (untoggle it). Notice that the plant does NOT restart—the alarm stays latched!<br />
            3. Click <strong>Master Safety Reset PB</strong> to clear the memory and restore the line.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Commissioning &amp; Proof-Testing Checklist
        </h2>
        <p>
          When verifying an Emergency Shutdown (ESD) loop on an industrial skid, follow these 5 core proof-testing rules:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-sm">
          <li><strong>Test Broken Wire Detection:</strong> Disconnect one terminal wire from the E-Stop switch while the machine is running. The open circuit must immediately trigger a fail-safe shutdown.</li>
          <li><strong>Verify Cooldown Run-On Time:</strong> Use a stopwatch to confirm the cooling pump runs for the full duration specified on the Process &amp; Instrumentation Diagram (P&amp;ID) after an ESD trip.</li>
          <li><strong>Verify Anti-Restart Memory:</strong> Trip the E-Stop, release the button, and confirm that no valve or pump energizes until the operator presses the physical reset button.</li>
          <li><strong>Inspect Spring-Return Valves:</strong> Confirm that all fail-safe valves (<code>XV-101</code>, <code>BDV-101</code>) mechanically move to their fail-safe positions if 24VDC instrument power or compressed air header pressure is lost.</li>
          <li><strong>Audible &amp; Visual Evacuation:</strong> Confirm the high-decibel siren and high-visibility flashing strobe illuminate immediately upon trip, alerting plant personnel to clear the skid area.</li>
        </ol>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Key Engineering Takeaways
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans not-prose my-6">
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <h4 className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <span className="text-red-500 font-mono">01</span> De-Energize to Trip
            </h4>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Always use Normally Closed (NC) contacts for emergency devices so a severed wire safely stops the machine.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <h4 className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <span className="text-emerald-500 font-mono">02</span> Cooling Run-On (TOF)
            </h4>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Use off-delay timers to carry away residual heat and prevent costly bearing seizures and polymer carbonization.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <h4 className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <span className="text-amber-500 font-mono">03</span> Staged Flare Venting
            </h4>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Depressurize vessels into flare or scrubber headers in an engineered, orderly sequence (1.0s delay) to prevent pipe shock.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <h4 className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <span className="text-cyan-500 font-mono">04</span> Anti-Restart Interlock
            </h4>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Releasing an E-Stop mushroom button must NEVER restart a machine without a separate, deliberate manual safety reset.
            </p>
          </div>
        </div>
      </div>
    ),
    dsl: ''
  },
  {
    slug: 'solar-logging',
    title: 'Solar Array Telemetry: Analog Smoothing, Moving Averages & Data Logging',
    excerpt: 'A beginner-friendly guide to clean sensor data: eliminating cloud-induced voltage ripple with moving average filters, preventing contactor chatter, and logging periodic microgrid telemetry.',
    author: 'ALAZAR',
    date: 'Aug 13',
    readingTime: '12 min read + 15 min labs',
    tag: 'Renewables / IoT',
    views: 9,
    content: (
      <div className="space-y-6">
        <div className="my-8 not-prose rounded-xl overflow-hidden border border-zinc-300 shadow-xl bg-white">
          <img
            src={SOLAR_LOGGING_SVG_DATA_URI}
            alt="Solar array telemetry and moving average signal conditioning schematic"
            className="w-full h-auto object-cover max-h-[550px]"
          />
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs font-mono text-zinc-400 flex flex-wrap justify-between items-center gap-2">
            <span className="text-amber-400 font-semibold">FIG 1.1 // REMOTE SOLAR PV MICROGRID TELEMETRY</span>
            <span>SYSTEM: PV-STRING // 24VDC - 32VDC BUS SIGNAL CONDITIONING</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-8 mb-4">
          The 4,000 False Alarms &amp; The Weekend Database Crash
        </h2>
        <p>
          Imagine driving down a bumpy, rocky dirt road. If your car speedometer displayed the raw instant speed of each bounce every millisecond, the needle would violently blur between 20 MPH and 50 MPH! You wouldn't be able to read your speed, and your cruise control would violently jerk the throttle.
        </p>
        <p>
          Modern cars solve this with <strong>digital smoothing</strong>—averaging recent readings to display a smooth, steady number.
        </p>
        <p>
          In solar energy automation, sensors face the exact same problem from nature: <strong>passing clouds</strong>:
        </p>

        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg my-4 text-sm font-sans text-amber-950">
          <strong className="block font-semibold mb-1">The Desert Microgrid Incident:</strong>
          <p>
            At an off-grid solar microgrid site in Nevada, an engineering intern configured the telemetry station to send an SMS alert whenever the solar battery charging voltage dipped below 24VDC.
          </p>
          <p className="mt-2">
            On a partly cloudy Saturday afternoon, puffy cumulus clouds drifted across the desert sky. Every few seconds, the sunlight would dim for a brief moment, causing the raw voltage to dip from 28V down to 22V, and then bounce right back up.
          </p>
          <p className="mt-2">
            The raw threshold comparator tripped and untripped continuously! By Sunday evening, the system had spammed over <strong>4,200 text messages</strong> to the plant manager's phone and filled the remote cellular gateway memory to 100%, causing a complete communications lockup.
          </p>
          <p className="mt-2 font-medium">
            The Golden Lesson: Never connect raw, noisy analog signals directly to alarm thresholds or high-frequency loggers. Always filter transients with a Moving Average (AVERAGE) and log clean, periodic snapshots with a DATA_LOG block.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Understanding Analog Noise vs. Real Trends
        </h2>
        <p>
          When monitoring physical sensors (like solar voltage, wind speed, or temperature), readings contain two components:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>The True Engineering Trend:</strong> The actual, meaningful state of the process (e.g., the sun is shining brightly at midday).</li>
          <li><strong>High-Frequency Noise:</strong> Temporary fluctuations caused by electromagnetic interference, cable induction, or passing cloud shadows.</li>
        </ul>
        <p>
          If an automation system reacts to every millisecond of noise:
          Mechanical relays and contactors chatter violently, burning out contacts; databases get overwhelmed with useless junk; and false alarms wake up on-call technicians.
        </p>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 1: The Raw Unfiltered Comparator (Contactor Chattering)
        </h2>
        <p>
          Below is <strong>Stage 1</strong> of our interactive lab. The raw solar voltage is wired directly into an <code>ANALOG_COMPARATOR</code> with a 24V threshold.
        </p>
        <p>
          Try adjusting the slider in the simulation below:
        </p>

        <InlineLab
          dsl={SOLAR_LAB1_DSL}
          title="Stage 1 - Raw Unfiltered Solar Noise"
          step="Stage 1 of 3"
          height={460}
        />

        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg my-4 text-sm font-sans text-amber-950">
          <strong className="block font-semibold mb-1">The Beginner Flaw in Stage 1</strong>
          <p>
            In the lab above, drag <strong>Raw Solar Voltage (V)</strong> back and forth across 24V (e.g., 23V, 25V, 22V, 26V). Notice how the Battery Charge Contactor immediately clicks ON and OFF with zero delay! In a real battery room, this rapid contactor chatter creates electrical sparks, welds relay points, and triggers hundreds of nuisance alarms.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 2: Analog Smoothing with a Moving Average Filter
        </h2>
        <p>
          To solve signal chatter, we pass the raw analog signal through an <strong><code>AVERAGE</code></strong> block.
        </p>
        <p>
          How a Moving Average Works:
          The block maintains a small FIFO memory buffer of recent measurements (e.g., 5 samples):
        </p>
        <div className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-sm not-prose my-4 border border-zinc-800">
          Smoothed_Output = (V1 + V2 + V3 + V4 + V5) / 5
        </div>
        <p>
          When a brief shadow or voltage spike occurs, its impact is diluted across the buffer. The resulting output is a clean, stable engineering value that reflects the true trend without jitter!
        </p>

        <InlineLab
          dsl={SOLAR_LAB2_DSL}
          title="Stage 2 - Analog Smoothing with Moving Average"
          step="Stage 2 of 3"
          height={480}
        />

        <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 rounded-r-lg my-4 text-sm font-sans text-emerald-950">
          <strong className="block font-semibold mb-1">Interactive Exercise — Stage 2</strong>
          <p>
            Observe <strong>Smoothed Array Voltage (V)</strong>. When you change the raw voltage, notice how the filtered value transitions smoothly rather than jumping instantly. This gives the battery charging system a rock-solid, jitter-free signal to make smart decisions.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Stage 3: Full Microgrid Telemetry &amp; Battery Charge Manager
        </h2>
        <p>
          In a production solar microgrid, the control logic must perform two essential tasks:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Safe Window Charging:</strong> Batteries must only charge when voltage is within safe limits (e.g., <strong>between 24V and 32V</strong>). Below 24V, sunlight is insufficient; above 32V, over-voltage threatens to boil battery electrolyte!</li>
          <li><strong>Periodic Telemetry Logging (<code>DATA_LOG</code>):</strong> Instead of logging continuous streams of data, the <code>DATA_LOG</code> block samples the clean, smoothed voltage at a steady, configured interval (e.g., every 500ms). This produces compact, orderly datasets ready for cloud transmission via MQTT or cellular IoT.</li>
        </ul>

        <InlineLab
          dsl={SOLAR_LAB3_DSL}
          title="Stage 3 - Full Solar Telemetry &amp; Battery Charge Manager"
          step="Stage 3 of 3"
          height={560}
        />

        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg my-4 text-sm font-sans text-blue-950">
          <strong className="block font-semibold mb-1">Interactive Exercise — Stage 3</strong>
          <p>
            1. At normal 28V, notice <strong>Battery Charge Contactor (KM-101)</strong> is energized and <strong>Telemetry Data Logging Active</strong> is TRUE.<br />
            2. Increase voltage to 34V (simulate a faulty charge controller). The Over-Voltage Hazard Alarm trips and cuts the contactor instantly to protect the battery bank!<br />
            3. Set voltage to 20V (simulate dusk or heavy overcast). The contactor disconnects safely without chattering.
          </p>
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Commissioning &amp; Field Calibration Checklist
        </h2>
        <p>
          When deploying analog telemetry or data loggers on a remote solar installation, follow this 5-point field checkout:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-sm">
          <li><strong>Verify Instrument Cable Shielding:</strong> Ensure the shielded drain wire from the voltage transducer (<code>VT-101</code>) is grounded at <strong>one end only</strong> (at the RTU cabinet) to avoid creating ground loops.</li>
          <li><strong>Tune the Averaging Window:</strong> Sizing the sample buffer is a balance: too few samples (e.g., 2) leaves jitter; too many samples (e.g., 50) introduces noticeable phase lag during genuine daylight transitions. 5 to 10 samples is ideal for solar PV strings.</li>
          <li><strong>Verify Logging Frequency:</strong> Confirm that data logging intervals match your network budget. On satellite or cellular IoT skids, sampling every 500ms to 5 seconds provides high fidelity without exceeding monthly data caps.</li>
          <li><strong>Calibrate Analog Span:</strong> Measure the physical string voltage with a calibrated Fluke multimeter. Ensure the scaled analog reading on the PLC display matches within ±0.1VDC.</li>
          <li><strong>Test Over-Voltage Cutoff:</strong> Inject a simulated test voltage of 33VDC into the analog channel and verify the battery charge contactor drops out immediately.</li>
        </ol>

        <h2 className="text-2xl font-bold font-serif text-zinc-900 mt-12 mb-4">
          Key Engineering Takeaways
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans not-prose my-6">
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <h4 className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <span className="text-amber-500 font-mono">01</span> Filter Before Deciding
            </h4>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Always smooth volatile analog signals before feeding them into comparators or safety trips.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <h4 className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <span className="text-emerald-500 font-mono">02</span> Moving Averages (AVERAGE)
            </h4>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Rolling FIFO buffers flatten noise while preserving genuine physical trends without high phase lag.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <h4 className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <span className="text-cyan-500 font-mono">03</span> Save Bandwidth with DATA_LOG
            </h4>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Record clean, periodic snapshots rather than flooding databases and cellular links with millisecond noise.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <h4 className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <span className="text-red-500 font-mono">04</span> Dual Boundary Limits
            </h4>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Always protect battery assets with both low-voltage dropout and high-voltage overcharge protection.
            </p>
          </div>
        </div>
      </div>
    ),
    dsl: ''
  }
];
