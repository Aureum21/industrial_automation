import assert from 'node:assert/strict';
import test from 'node:test';
import { BLOCK_CATALOG } from '../src/lib/automation/catalog.ts';
import { parseCircuitDSL } from '../src/lib/automation/dsl.ts';
import { LogicEngine } from '../src/lib/LogicEngine.ts';

export const BOILER_LAB1_DSL = `circuit "Stage 1 - Feedforward Mass Balance" version 1 {
  steam_flow: ANALOG_INPUT(label="Steam Flow FT-102 t/h", value=50)
  blowdown: ANALOG_CONSTANT(label="Continuous Blowdown t/h", value=2)
  mass_demand: MATH(label="Steam plus Blowdown", operation="add")
  fw_measured: ANALOG_INPUT(label="Feedwater Flow FT-103 t/h", value=52)
  flow_error: MATH(label="Mass Flow Deficit", operation="subtract")
  target_meter: ANALOG_OUTPUT(label="Target Feedwater t/h")
  error_meter: ANALOG_OUTPUT(label="Flow Mismatch t/h")

  steam_flow.Q -> mass_demand.A
  blowdown.Q -> mass_demand.B
  mass_demand.Q -> target_meter.A
  mass_demand.Q -> flow_error.A
  fw_measured.Q -> flow_error.B
  flow_error.Q -> error_meter.A
}
`;

export const BOILER_LAB2_DSL = `circuit "Stage 2 - 3-Element Drum Level Cascade Loop" version 1 {
  level_sp: ANALOG_INPUT(label="Drum Level Setpoint %", value=50)
  level_pv: ANALOG_INPUT(label="Drum Level LT-101 %", value=54)
  steam_flow: ANALOG_INPUT(label="Steam Flow FT-102 t/h", value=65)
  blowdown: ANALOG_CONSTANT(label="Blowdown t/h", value=2)
  mass_base: MATH(label="Base Mass Demand", operation="add")
  enabled: HIGH()
  level_pi: PID_CONTROLLER(label="Level PI Trim", kp=1.5, ki=0.05, kd=0, min=-25, max=25)
  total_demand: MATH(label="Feedforward plus Level Trim", operation="add")
  valve_out: ANALOG_OUTPUT(label="Feedwater FCV-101 Demand %")
  level_meter: ANALOG_OUTPUT(label="Drum Level Feedback %")
  high_limit: ANALOG_CONSTANT(label="Upper Alarm Thresh", value=75)
  high_alarm: ANALOG_COMPARATOR(label="High Drum Level Alert", operation="gte")
  alarm_lamp: OUTPUT(label="High Drum Level Annunciator")

  steam_flow.Q -> mass_base.A
  blowdown.Q -> mass_base.B
  level_sp.Q -> level_pi.SP
  level_pv.Q -> level_pi.PV
  enabled.Q -> level_pi.EN
  mass_base.Q -> total_demand.A
  level_pi.CV -> total_demand.B
  total_demand.Q -> valve_out.A
  level_pv.Q -> level_meter.A
  level_pv.Q -> high_alarm.A
  high_limit.Q -> high_alarm.B
  high_alarm.Q -> alarm_lamp.A
}
`;

export const BOILER_LAB3_DSL = `circuit "Stage 3 - NFPA 85 LLWL Burner Safety Safeguard" version 1 {
  drum_level: ANALOG_INPUT(label="Drum Level LT-101 %", value=50)
  llwl_limit: ANALOG_CONSTANT(label="LLWL Trip Limit 15%", value=15)
  hhwl_limit: ANALOG_CONSTANT(label="HHWL Trip Limit 85%", value=85)
  low_trip: ANALOG_COMPARATOR(label="Level Below LLWL", operation="lte")
  high_trip: ANALOG_COMPARATOR(label="Level Above HHWL", operation="gte")
  trip_condition: OR(label="Any Level Excursion Trip")
  purge_pb: INPUT(label="Initiate Furnace Pre-Purge PB", value=false)
  purge_timer: TON(label="5s Furnace Purge Timer", duration=5000)
  master_reset: INPUT(label="Master Safety Key Reset PB", value=false)
  purge_complete: AND(label="Purge Complete and Reset")
  fuel_latch: RS_LATCH(label="Fuel Safety Shutoff Valve Latch")
  fuel_ssov: OUTPUT(label="Fuel SSOV Solenoid Energized")
  llwl_alarm: OUTPUT(label="Tube Burnout Hazard Lamp")
  hhwl_alarm: OUTPUT(label="Turbine Carryover Hazard Lamp")

  drum_level.Q -> low_trip.A
  llwl_limit.Q -> low_trip.B
  drum_level.Q -> high_trip.A
  hhwl_limit.Q -> high_trip.B
  low_trip.Q -> trip_condition.A
  high_trip.Q -> trip_condition.B
  purge_pb.Q -> purge_timer.A
  purge_timer.Q -> purge_complete.A
  master_reset.Q -> purge_complete.B
  purge_complete.Q -> fuel_latch.S
  trip_condition.Q -> fuel_latch.R
  fuel_latch.Q -> fuel_ssov.A
  low_trip.Q -> llwl_alarm.A
  high_trip.Q -> hhwl_alarm.A
}
`;

test('Boiler Drum Level DSL stages parse and execute correctly in LogicEngine', () => {
  const dsls = [BOILER_LAB1_DSL, BOILER_LAB2_DSL, BOILER_LAB3_DSL];
  for (const dsl of dsls) {
    const doc = parseCircuitDSL(dsl, BLOCK_CATALOG);
    assert.ok(doc.blocks.length >= 7, 'Circuit has sufficient blocks');
    assert.ok(doc.connections.length >= 6, 'Circuit has connections');

    const engine = new LogicEngine();
    engine.load(doc);
    engine.tick(100);
    assert.ok(engine.blocks.size === doc.blocks.length, 'Engine loaded all blocks');
  }
});
