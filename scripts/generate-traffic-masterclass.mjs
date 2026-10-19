import fs from 'fs';
import path from 'path';

const traffic_svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" role="img" aria-labelledby="t d">
  <title id="t">NEMA TS2 Dual-Ring Intersection Controller and Conflict Monitor Unit</title>
  <desc id="d">Engineering schematic of a 4-way intersection with inductive vehicle loop detection, ITE yellow and all-red clearance intervals, dual-ring barrier controller, and hardware Conflict Monitor Unit (CMU) failsafe.</desc>
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
    <text x="38" y="42" font-size="24" font-weight="bold">05 / NEMA TS2 DUAL-RING INTERSECTION &amp; CONFLICT MONITOR UNIT (CMU)</text>
    <text x="38" y="70" font-size="15">ITE Clearance Intervals (Yellow + All-Red), Inductive Vehicle Loops &amp; Hardware MMU Fail-Safe</text>
  </g>

  <rect x="38" y="100" width="370" height="390" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <rect x="50" y="112" width="346" height="26" rx="4" fill="#e8f4f8"/>
  <text x="223" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c" text-anchor="middle">4-WAY INTERSECTION (ROUTE 4 &amp; COUNTY PKWY)</text>

  <rect x="168" y="150" width="110" height="325" fill="#334155"/>
  <rect x="50" y="260" width="346" height="105" fill="#334155"/>

  <rect x="168" y="260" width="110" height="105" fill="#1e293b" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4 4"/>
  <text x="223" y="318" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#f8fafc" text-anchor="middle">CONFLICT BOX</text>

  <line x1="221" y1="150" x2="221" y2="250" stroke="#f59e0b" stroke-width="2"/>
  <line x1="225" y1="150" x2="225" y2="250" stroke="#f59e0b" stroke-width="2"/>
  <line x1="221" y1="375" x2="221" y2="475" stroke="#f59e0b" stroke-width="2"/>
  <line x1="225" y1="375" x2="225" y2="475" stroke="#f59e0b" stroke-width="2"/>
  <line x1="50" y1="311" x2="158" y2="311" stroke="#f59e0b" stroke-width="2"/>
  <line x1="50" y1="315" x2="158" y2="315" stroke="#f59e0b" stroke-width="2"/>
  <line x1="288" y1="311" x2="396" y2="311" stroke="#f59e0b" stroke-width="2"/>
  <line x1="288" y1="315" x2="396" y2="315" stroke="#f59e0b" stroke-width="2"/>

  <g fill="#cbd5e1">
    <rect x="172" y="250" width="102" height="6"/>
    <rect x="172" y="369" width="102" height="6"/>
    <rect x="158" y="264" width="6" height="97"/>
    <rect x="282" y="264" width="6" height="97"/>
  </g>

  <rect x="233" y="415" width="35" height="40" rx="3" fill="#475569" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="3 2"/>
  <text x="250" y="440" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#38bdf8" text-anchor="middle">L-NS</text>
  <rect x="95" y="325" width="45" height="30" rx="3" fill="#475569" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="3 2"/>
  <text x="117" y="344" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#38bdf8" text-anchor="middle">L-EW</text>

  <rect x="290" y="165" width="22" height="52" rx="4" fill="#0f172a" stroke="#475569" stroke-width="1.5"/>
  <circle cx="301" cy="174" r="5" fill="#334155"/>
  <circle cx="301" cy="191" r="5" fill="#334155"/>
  <circle cx="301" cy="208" r="6" fill="#10b981"/>
  <text x="320" y="195" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#10b981">SG-NS (Phase 2)</text>

  <rect x="330" y="375" width="22" height="52" rx="4" fill="#0f172a" stroke="#475569" stroke-width="1.5"/>
  <circle cx="341" cy="384" r="6" fill="#dc2626"/>
  <circle cx="341" cy="401" r="5" fill="#334155"/>
  <circle cx="341" cy="418" r="5" fill="#334155"/>
  <text x="341" y="440" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#dc2626" text-anchor="middle">SG-EW (Phase 4)</text>

  <rect x="430" y="100" width="375" height="390" rx="12" fill="#ffffff" stroke="#0f766e" stroke-width="2.5" stroke-dasharray="5 5"/>
  <rect x="445" y="112" width="345" height="26" rx="4" fill="#ccfbf1"/>
  <text x="617" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0f766e" text-anchor="middle">NEMA TS2 ACTUATED CONTROLLER UNIT (CU)</text>

  <rect x="450" y="155" width="335" height="135" rx="8" fill="#f8fafc" stroke="#23495c" stroke-width="1.5"/>
  <text x="617" y="176" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#142c3d" text-anchor="middle">DUAL-RING PHASE TIMING SEQUENCER</text>

  <rect x="460" y="190" width="95" height="35" rx="4" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
  <text x="507" y="205" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#065f46" text-anchor="middle">NS GREEN</text>
  <text x="507" y="218" font-family="Arial,sans-serif" font-size="9" fill="#047857" text-anchor="middle">Rest in Green (35s)</text>

  <rect x="560" y="190" width="70" height="35" rx="4" fill="#fffbeb" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="595" y="205" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b45309" text-anchor="middle">NS YELLOW</text>
  <text x="595" y="218" font-family="Arial,sans-serif" font-size="9" fill="#b45309" text-anchor="middle">4.3s (ITE Formula)</text>

  <rect x="635" y="190" width="75" height="35" rx="4" fill="#fef2f2" stroke="#dc2626" stroke-width="2"/>
  <text x="672" y="205" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#991b1b" text-anchor="middle">ALL-RED</text>
  <text x="672" y="218" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#b91c1c" text-anchor="middle">1.6s Clearance</text>

  <rect x="715" y="190" width="60" height="35" rx="4" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
  <text x="745" y="205" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#065f46" text-anchor="middle">EW GREEN</text>
  <text x="745" y="218" font-family="Arial,sans-serif" font-size="9" fill="#047857" text-anchor="middle">Extend on Loop</text>

  <text x="460" y="245" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#334155">• Ring Barrier Constraint: NS and EW Greens never cross concurrently</text>
  <text x="460" y="262" font-family="Arial,sans-serif" font-size="10" fill="#475569">• Inductive Loop Actuation: L-EW demand triggers safe termination</text>
  <text x="460" y="278" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0d9488">• Mandatory Clearance: Y ≥ 4.0s and All-Red ≥ 1.5s per MUTCD</text>

  <rect x="450" y="300" width="335" height="90" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
  <text x="617" y="322" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#14532d" text-anchor="middle">ITE CLEARANCE INTERVAL EQUATIONS</text>
  <text x="617" y="342" font-family="Courier,monospace" font-size="12" font-weight="bold" fill="#15803d" text-anchor="middle">Yellow: Y = t + V / (2a + 2Gg) = 4.3 s</text>
  <text x="617" y="360" font-family="Courier,monospace" font-size="12" font-weight="bold" fill="#15803d" text-anchor="middle">All-Red: R = (W + L) / V = 1.6 s</text>
  <text x="617" y="378" font-family="Arial,sans-serif" font-size="10" fill="#166534" text-anchor="middle">45 MPH Arterial (66 ft/s) • Intersection Width W = 80 ft</text>

  <rect x="450" y="400" width="335" height="75" rx="8" fill="#f8fafc" stroke="#23495c" stroke-width="1.5"/>
  <text x="617" y="420" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#142c3d" text-anchor="middle">PEDESTRIAN CLEARANCE &amp; FLASHING DONT WALK</text>
  <text x="617" y="438" font-family="Arial,sans-serif" font-size="10" fill="#475569">Ped Walk (7s) + Flashing Don&apos;t Walk (14s) timed before Yellow change</text>
  <text x="617" y="455" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b45309">Walking speed 3.5 ft/s ensures pedestrian clears before vehicular green</text>

  <rect x="830" y="100" width="335" height="390" rx="12" fill="#ffffff" stroke="#b91c1c" stroke-width="2"/>
  <rect x="845" y="112" width="305" height="26" rx="4" fill="#fef2f2"/>
  <text x="997" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">CONFLICT MONITOR UNIT (CMU / MMU)</text>

  <rect x="850" y="155" width="295" height="120" rx="8" fill="#fef2f2" stroke="#dc2626" stroke-width="2"/>
  <text x="997" y="180" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#991b1b" text-anchor="middle">HARDWARE INTERLOCK WATCHDOG</text>
  <circle cx="910" cy="215" r="14" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>
  <text x="910" y="219" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">CMU</text>
  <text x="940" y="210" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#7f1d1d">AC Voltage Sense Matrix</text>
  <text x="940" y="226" font-family="Arial,sans-serif" font-size="10" fill="#991b1b">Trip Window: ≤ 450 ms</text>
  <text x="997" y="255" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b91c1c" text-anchor="middle">Detects Conflicting Green / Yellow Displays</text>

  <rect x="850" y="290" width="295" height="100" rx="8" fill="#fffbeb" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="997" y="315" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#92400e" text-anchor="middle">ELECTROMECHANICAL FLASHER BACKUP</text>
  <text x="997" y="335" font-family="Arial,sans-serif" font-size="10" fill="#b45309" text-anchor="middle">Isolated Line Relay physically isolates Triac outputs</text>
  <text x="997" y="352" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b45309" text-anchor="middle">50 FPM Flasher: 100% 4-Way Flashing Red</text>
  <text x="997" y="370" font-family="Arial,sans-serif" font-size="10" fill="#78350f" text-anchor="middle">Guarantees safe 4-way stop during PLC / CPU lockup</text>

  <rect x="850" y="405" width="295" height="70" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="997" y="425" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">PROTECTED CMU FAULT CHANNELS</text>
  <text x="997" y="443" font-family="Arial,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">• Conflict (Dual Green) • Multiple Indications</text>
  <text x="997" y="460" font-family="Arial,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">• Short Yellow Clearance • 24V DC Brownout</text>

  <path d="M408 280 h22" fill="none" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#arr)"/>
  <path d="M805 210 h25" fill="none" stroke="#dc2626" stroke-width="2.5" marker-end="url(#arr-red)"/>

  <g font-family="Arial,sans-serif" font-size="13" fill="#294758">
    <text x="40" y="520">Solid Colors: Active Traffic Phase Displays (Green/Yellow/Red) | Cyan: Pavement Inductive Loop Detectors &amp; Lead-In Cable</text>
    <text x="40" y="542">Dashed Red: CMU Conflict Voltage Feedback &amp; Flasher Transfer | Never connect signal triacs directly without a certified MMU.</text>
  </g>
</svg>`;

const dsl1 = `circuit "Stage 1 - The Naive Cascade & Missing Clearance" version 1 {
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
}`;

const dsl2 = `circuit "Stage 2 - Dual-Ring Controller with All-Red Clearance" version 1 {
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
}`;

const dsl3 = `circuit "Stage 3 - Actuated Intersection with Conflict Monitor" version 1 {
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
}`;

const svgDataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(traffic_svg);

const articleData = {
  slug: "traffic-lights",
  title: "The Double-Green T-Bone Collision: Engineering NEMA Dual-Ring Traffic Controllers & Conflict Monitors",
  excerpt: "A deep masterclass on municipal intersection control: analyzing why cascading timers cause fatal broadside collisions, implementing NEMA TS2 dual-ring state machines with ITE all-red clearance intervals, and engineering inductive loop vehicle detection with hardware conflict monitor fail-safes.",
  author: "Sarah Dev & AutomationHub Engineering",
  date: "Oct 19",
  readingTime: "20 min read + 25 min labs",
  tag: "Control Systems",
  views: 19850,
  heroImage: svgDataUri,
  sections: [
    {
      type: "image",
      src: svgDataUri,
      alt: "NEMA TS2 Dual-Ring Intersection Controller and Conflict Monitor Unit P&ID",
      caption: "FIG 1.1 // NEMA TS2 DUAL-RING INTERSECTION & CONFLICT MONITOR UNIT (CMU): ITE CLEARANCE, INDUCTIVE LOOPS & HARDWARE FAIL-SAFE"
    },
    {
      type: "markdown",
      content: `## 1. The 08:22 AM Double-Green Disaster at Route 4 & County Parkway

At 08:22 on a rainy October morning at the high-speed junction of Route 4 ($45\\text{ MPH}$ arterial) and County Parkway ($35\\text{ MPH}$ cross-street), the sound of crushing automotive steel echoed across six lanes. A loaded 30-ton ready-mix concrete truck traveling northbound entered the intersection at 42 MPH and collided broadside into a commuter sedan entering from the cross-street.

Both drivers swore under oath that their signal light was green.

Crash reconstructionists and municipal traffic engineers impounded the roadside NEMA cabinet. Inside, they found a custom PLC controller installed three months earlier to replace an aging electromechanical dial. The controls programmer had created an intersection sequence using three cascading On-Delay Timers (\`TON\`):

\`\`\`
Timer_Green  -> Timer_Yellow -> Timer_Red -> (Reset Loop)
\`\`\`

To implement the cross-street, the programmer simply wired the opposing phase to start the exact instant the yellow timer finished. There was **zero all-red clearance interval** ($R = 0\\text{ s}$).

To make matters worse, an emergency vehicle preemption call had triggered just as North-South was timing out. Because the reset logic lacked a strict state machine barrier, the controller glitched for two program scans: North-South turned green while East-West was still energized on fresh green!

The collision resulted in a $4.2 million municipal tort liability settlement, permanent incapacitation of the sedan driver, and an immediate Department of Transportation moratorium on uncertified intersection controllers.`
    },
    {
      type: "callout",
      variant: "warning",
      title: "Regulatory Mandate: NEMA TS2, MUTCD & Malfunction Management Units (MMU)",
      text: "Never drive municipal traffic signal load switches directly from standard PLC outputs without a certified, independent Conflict Monitor Unit (CMU) or Malfunction Management Unit (MMU)! If a hardware triac welds short or software bugs command conflicting greens, the CMU must mechanically trip a line relay within 450 ms, forcing all four approaches into an isolated, hardwired Flashing Red backup mode."
    },
    {
      type: "markdown",
      content: `## 2. Engineering Theory: ITE Clearance Physics & Dual-Ring Barrier State Machines

Safe intersection design is governed by the **Manual on Uniform Traffic Control Devices (MUTCD)** and the **Institute of Transportation Engineers (ITE)**. The clearance interval between conflicting traffic streams is divided into two distinct, life-critical phases:

### 1. The Yellow Change Interval ($Y$)
The yellow interval gives approaching motorists sufficient time to either comfortably brake to a stop before the stop bar, or clear into the intersection before red appears:

$$Y = t + \\frac{V}{2a + 2Gg}$$

Where:
- $t = 1.0\\text{ s}$: Driver perception-reaction time.
- $V$: Approach speed ($45\\text{ MPH} = 66\\text{ ft/s} = 20.1\\text{ m/s}$).
- $a = 10\\text{ ft/s}^2$ ($3.05\\text{ m/s}^2$): Comfortable wet-pavement deceleration.
- $G$: Roadway grade (decimal, $0.0$ for level grade).
- $g = 32.2\\text{ ft/s}^2$: Acceleration of gravity.

For a 45 MPH approach:
$$Y = 1.0 + \\frac{66}{2(10)} = 1.0 + 3.3 = 4.3\\text{ seconds}$$

### 2. The All-Red Clearance Interval ($R$)
Even after yellow expires, a vehicle that entered on the last millisecond of yellow needs time to travel completely across the width of the conflict box ($W$) plus its own vehicle length ($L$) before cross-traffic receives green:

$$R = \\frac{W + L}{V}$$

For an 80-foot intersection with a standard 20-foot vehicle at 45 MPH ($66\\text{ ft/s}$):
$$R = \\frac{80 + 20}{66} = 1.52\\text{ seconds} \\approx 1.6\\text{ seconds}$$

Without this $1.6\\text{ s}$ All-Red buffer, clearing vehicles and fresh-green cross-traffic occupy the exact same physical space simultaneously!

### Traffic Controller State Machine Architectures

| Architecture | Mutual Exclusion | All-Red Clearance | Actuation Support | Safety Failure Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Naive Cascading Timers** | Software only | Missing ($0\\text{ s}$) | None (Fixed time only) | Race conditions, dual-green collision |
| **Dual-Ring Barrier (Stage 2)** | Guaranteed by state gates | Full ITE ($1.5\\text{ s}$) | Fixed cycle | CPU lockup requires external watchdog |
| **Fully-Actuated + CMU (Stage 3)** | Double-interlocked + Hardware CMU | Dynamic & Protected | Loops + Ped Call | Failsafe transfer to 100% Flashing Red |`
    },
    {
      type: "markdown",
      content: `## 3. Stage 1: The Naive Cascade & The Missing Clearance

Examine the Stage 1 circuit below. It implements the classic beginner's mistake: two opposing approaches chained together through simple sequential timers.

Notice what happens when North-South Yellow finishes: East-West Green turns ON at the exact same instant! There is zero clearance window. Any vehicle in the conflict box is immediately exposed to cross-traffic acceleration.`
    },
    {
      type: "lab",
      title: "Stage 1: The Naive Cascade & Missing Clearance",
      step: "Stage 1 of 3",
      height: 520,
      dsl: dsl1
    },
    {
      type: "callout",
      variant: "error",
      title: "Interactive Exercise — Stage 1 (Diagnose the Clearance Defect)",
      text: "In Stage 1 above, watch the cycle run: North-South Green (3s) -> North-South Yellow (1.5s). The very scan NS Yellow drops, East-West Green ignites immediately! Notice the 'Collision Hazard: 0s All-Red Clearance' indicator turns ON. A car clearing an 80-ft intersection at 45 MPH takes 1.5 seconds to exit—during that entire time, cross-traffic has a green light!"
    },
    {
      type: "markdown",
      content: `## 4. Stage 2: Dual-Ring Controller with ITE All-Red Clearance

Stage 2 introduces the standardized 6-phase cyclic state machine incorporating mandatory ITE clearance windows:

1. **P1: North-South Green** ($3.5\\text{ s}$) • East-West holds Red
2. **P2: North-South Yellow** ($1.5\\text{ s}$) • East-West holds Red
3. **P3: ALL-RED CLEARANCE 1** ($1.5\\text{ s}$) • **Both North-South and East-West hold solid RED** while the conflict box clears!
4. **P4: East-West Green** ($3.0\\text{ s}$) • North-South holds Red
5. **P5: East-West Yellow** ($1.5\\text{ s}$) • North-South holds Red
6. **P6: ALL-RED CLEARANCE 2** ($1.5\\text{ s}$) • **Both hold solid RED** before North-South receives green!

A \`SCAN_DELAY\` block provides an explicit, safe memory boundary for the loop reset without race conditions.`
    },
    {
      type: "lab",
      title: "Stage 2: Dual-Ring Controller with All-Red Clearance",
      step: "Stage 2 of 3",
      height: 520,
      dsl: dsl2
    },
    {
      type: "callout",
      variant: "info",
      title: "Interactive Exercise — Stage 2 (Observing the All-Red Protection Window)",
      text: "In Stage 2 above, watch the cycle progress through all 6 phases. Notice how the 'All-Red Clearance Interval Active' lamp lights up between every phase change! Both North-South Red and East-West Red are illuminated simultaneously for 1.5 seconds, guaranteeing that speeding vehicles have completely exited before cross-traffic is permitted to roll."
    },
    {
      type: "markdown",
      content: `## 5. Stage 3: Fully-Actuated Controller with Inductive Vehicle Loop, Pedestrian Call & Conflict Monitor (CMU)

In real municipal networks, traffic controllers do not blindly cycle fixed timers. They operate in **Fully-Actuated Mode**:
- **Main Street (North-South)** rests indefinitely in Green to maximize arterial corridor progression.
- **Side Street (East-West)** features an embedded **Inductive Loop Detector (\`loop_ew\`)** that senses the metallic chassis of waiting vehicles.
- **Crosswalk Pushbutton (\`ped_call\`)** registers pedestrian demand.

When side-street demand is latched, the controller smoothly terminates the main street green, executes the ITE yellow change and all-red clearance, serves the side street with pedestrian walk signals, and safely returns to rest in main-street green!

### The Hardware Conflict Monitor Unit (CMU)
The controller incorporates a hardware watchdog sensing field AC voltage taps. If conflicting greens ever energize simultaneously (or if an engineer forces a conflict via \`force_cmu_fault\`), the CMU trips within 450 ms, cuts power to the load switches, and engages a 50 FPM flasher relay into **100% 4-Way Flashing Red**!`
    },
    {
      type: "lab",
      title: "Stage 3: Actuated Intersection with Conflict Monitor",
      step: "Stage 3 of 3",
      height: 650,
      dsl: dsl3
    },
    {
      type: "callout",
      variant: "success",
      title: "Interactive Exercise — Stage 3 (Actuate Loops & Test the CMU Trip)",
      text: "In Stage 3 above:\n1. Notice the controller rests peacefully in North-South Green. Cross-street traffic has no cars, so no green time is wasted!\n2. Click 'East-West Inductive Loop Detector' to simulate a car arriving at the side-street stop bar. Watch the controller seamlessly execute NS Yellow (1.5s) -> All-Red (1.5s) -> EW Green & Ped Walk (3.5s) -> EW Yellow (1.5s) -> All-Red (1.5s) -> and return to resting NS Green!\n3. Now simulate a welded solid-state triac: toggle 'Simulate CMU Conflict (Welded Triac)' to ON. Watch the CMU trip instantly! Green drops dead, and both approaches begin flashing emergency Red at 1 Hz!"
    },
    {
      type: "markdown",
      content: `## 6. Commissioning Checklist & Municipal Intersection Proof Testing

Before turning over any traffic cabinet to municipal DOT operations, field crews must complete this mandatory protocol:

1. **CMU Diode Card Conflict Testing:** Remove the Conflict Monitor Unit from the cabinet and insert a factory testing harness. Systematically bridge every green and yellow channel pair (e.g. Phase 2 Green with Phase 4 Green). Verify the CMU drops the line relay into Flashing Red within 450 ms on every combination.
2. **Inductive Loop Sensitivity & Resistance Verification:** Measure loop inductance with an RLC meter ($50$ to $300\\,\\mu\\text{H}$) and resistance-to-ground ($>100\\text{ M}\\Omega$). Test loop responsiveness with a bicycle or small motorcycle to confirm detection sensitivity.
3. **ITE Clearance Timing Audit:** Physically stopwatch-verify field displays against the approved engineering timing sheet. Yellow change intervals must never be configured shorter than 3.0 seconds (typically $4.0$ to $5.5\\text{ s}$ on arterials), and All-Red must never be omitted ($1.0$ to $2.5\\text{ s}$).
4. **Pedestrian Clearance Intervals (MUTCD 4E.06):** Ensure the flashing Don't Walk interval is calculated using a walking speed of no faster than $3.5\\text{ ft/s}$ ($1.07\\text{ m/s}$) across the full curb-to-curb crosswalk width.
5. **Power Loss & Flasher Relay Drop Test:** Disconnect main 120V AC cabinet utility power and restore it. Verify the controller boots up in minimum 5-second all-red/flash mode before entering automatic coordination.
6. **Preemption Gate Interlocks:** Verify that railroad preemption or emergency vehicle optical strobe sensors (Opticom) force an immediate safe clearance sequence rather than an instantaneous green transfer.`
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

traffic_svg = '''${traffic_svg}'''

dsl1 = '''${dsl1}'''
dsl2 = '''${dsl2}'''
dsl3 = '''${dsl3}'''

article = {
    'slug': 'traffic-lights',
    'title': 'The Double-Green T-Bone Collision: Engineering NEMA Dual-Ring Traffic Controllers & Conflict Monitors',
    'excerpt': 'A deep masterclass on municipal intersection control: analyzing why cascading timers cause fatal broadside collisions, implementing NEMA TS2 dual-ring state machines with ITE all-red clearance intervals, and engineering inductive loop vehicle detection with hardware conflict monitor fail-safes.',
    'author': 'Sarah Dev & AutomationHub Engineering',
    'date': 'Oct 19',
    'readingTime': '20 min read + 25 min labs',
    'tag': 'Control Systems',
    'views': 19850,
    'heroImage': 'data:image/svg+xml;charset=utf-8,' + quote(traffic_svg, safe=''),
    'sections': [
        image(traffic_svg, 'NEMA TS2 Dual-Ring Intersection Controller and Conflict Monitor Unit P&ID', 'FIG 1.1 // NEMA TS2 DUAL-RING INTERSECTION & CONFLICT MONITOR UNIT (CMU): ITE CLEARANCE, INDUCTIVE LOOPS & HARDWARE FAIL-SAFE'),
        md('''
        ## 1. The 08:22 AM Double-Green Disaster at Route 4 & County Parkway

        At 08:22 on a rainy October morning at the high-speed junction of Route 4 ($45\\\\text{ MPH}$ arterial) and County Parkway ($35\\\\text{ MPH}$ cross-street), the sound of crushing automotive steel echoed across six lanes. A loaded 30-ton ready-mix concrete truck traveling northbound entered the intersection at 42 MPH and collided broadside into a commuter sedan entering from the cross-street.

        Both drivers swore under oath that their signal light was green.

        Crash reconstructionists and municipal traffic engineers impounded the roadside NEMA cabinet. Inside, they found a custom PLC controller installed three months earlier to replace an aging electromechanical dial. The controls programmer had created an intersection sequence using three cascading On-Delay Timers (\`TON\`):

        \`\`\`
        Timer_Green  -> Timer_Yellow -> Timer_Red -> (Reset Loop)
        \`\`\`

        To implement the cross-street, the programmer simply wired the opposing phase to start the exact instant the yellow timer finished. There was **zero all-red clearance interval** ($R = 0\\\\text{ s}$).

        To make matters worse, an emergency vehicle preemption call had triggered just as North-South was timing out. Because the reset logic lacked a strict state machine barrier, the controller glitched for two program scans: North-South turned green while East-West was still energized on fresh green!

        The collision resulted in a $4.2 million municipal tort liability settlement, permanent incapacitation of the sedan driver, and an immediate Department of Transportation moratorium on uncertified intersection controllers.
        '''),
        note('Regulatory Mandate: NEMA TS2, MUTCD & Malfunction Management Units (MMU)', 'Never drive municipal traffic signal load switches directly from standard PLC outputs without a certified, independent Conflict Monitor Unit (CMU) or Malfunction Management Unit (MMU)! If a hardware triac welds short or software bugs command conflicting greens, the CMU must mechanically trip a line relay within 450 ms, forcing all four approaches into an isolated, hardwired Flashing Red backup mode.', 'warning'),
        md('''
        ## 2. Engineering Theory: ITE Clearance Physics & Dual-Ring Barrier State Machines

        Safe intersection design is governed by the **Manual on Uniform Traffic Control Devices (MUTCD)** and the **Institute of Transportation Engineers (ITE)**. The clearance interval between conflicting traffic streams is divided into two distinct, life-critical phases:

        ### 1. The Yellow Change Interval ($Y$)
        The yellow interval gives approaching motorists sufficient time to either comfortably brake to a stop before the stop bar, or clear into the intersection before red appears:

        $$Y = t + \\\\frac{V}{2a + 2Gg}$$

        Where:
        - $t = 1.0\\\\text{ s}$: Driver perception-reaction time.
        - $V$: Approach speed ($45\\\\text{ MPH} = 66\\\\text{ ft/s} = 20.1\\\\text{ m/s}$).
        - $a = 10\\\\text{ ft/s}^2$ ($3.05\\\\text{ m/s}^2$): Comfortable wet-pavement deceleration.
        - $G$: Roadway grade (decimal, $0.0$ for level grade).
        - $g = 32.2\\\\text{ ft/s}^2$: Acceleration of gravity.

        For a 45 MPH approach:
        $$Y = 1.0 + \\\\frac{66}{2(10)} = 1.0 + 3.3 = 4.3\\\\text{ seconds}$$

        ### 2. The All-Red Clearance Interval ($R$)
        Even after yellow expires, a vehicle that entered on the last millisecond of yellow needs time to travel completely across the width of the conflict box ($W$) plus its own vehicle length ($L$) before cross-traffic receives green:

        $$R = \\\\frac{W + L}{V}$$

        For an 80-foot intersection with a standard 20-foot vehicle at 45 MPH ($66\\\\text{ ft/s}$):
        $$R = \\\\frac{80 + 20}{66} = 1.52\\\\text{ seconds} \\\\approx 1.6\\\\text{ seconds}$$
        '''),
        md('''
        ## 3. Stage 1: The Naive Cascade & The Missing Clearance

        Examine the Stage 1 circuit below. It implements the classic beginner's mistake: two opposing approaches chained together through simple sequential timers.

        Notice what happens when North-South Yellow finishes: East-West Green turns ON at the exact same instant! There is zero clearance window. Any vehicle in the conflict box is immediately exposed to cross-traffic acceleration.
        '''),
        lab(1, 'Stage 1: The Naive Cascade & Missing Clearance', dsl1),
        note('Interactive Exercise — Stage 1 (Diagnose the Clearance Defect)', 'In Stage 1 above, watch the cycle run: North-South Green (3s) -> North-South Yellow (1.5s). The very scan NS Yellow drops, East-West Green ignites immediately! Notice the Collision Hazard: 0s All-Red Clearance indicator turns ON. A car clearing an 80-ft intersection at 45 MPH takes 1.5 seconds to exit—during that entire time, cross-traffic has a green light!', 'error'),
        md('''
        ## 4. Stage 2: Dual-Ring Controller with ITE All-Red Clearance

        Stage 2 introduces the standardized 6-phase cyclic state machine incorporating mandatory ITE clearance windows:

        1. **P1: North-South Green** ($3.5\\\\text{ s}$) • East-West holds Red
        2. **P2: North-South Yellow** ($1.5\\\\text{ s}$) • East-West holds Red
        3. **P3: ALL-RED CLEARANCE 1** ($1.5\\\\text{ s}$) • **Both North-South and East-West hold solid RED** while the conflict box clears!
        4. **P4: East-West Green** ($3.0\\\\text{ s}$) • North-South holds Red
        5. **P5: East-West Yellow** ($1.5\\\\text{ s}$) • North-South holds Red
        6. **P6: ALL-RED CLEARANCE 2** ($1.5\\\\text{ s}$) • **Both hold solid RED** before North-South receives green!

        A \`SCAN_DELAY\` block provides an explicit, safe memory boundary for the loop reset without race conditions.
        '''),
        lab(2, 'Stage 2: Dual-Ring Controller with All-Red Clearance', dsl2),
        note('Interactive Exercise — Stage 2 (Observing the All-Red Protection Window)', 'In Stage 2 above, watch the cycle progress through all 6 phases. Notice how the All-Red Clearance Interval Active lamp lights up between every phase change! Both North-South Red and East-West Red are illuminated simultaneously for 1.5 seconds, guaranteeing that speeding vehicles have completely exited before cross-traffic is permitted to roll.', 'info'),
        md('''
        ## 5. Stage 3: Fully-Actuated Controller with Inductive Vehicle Loop, Pedestrian Call & Conflict Monitor (CMU)

        In real municipal networks, traffic controllers do not blindly cycle fixed timers. They operate in **Fully-Actuated Mode**:
        - **Main Street (North-South)** rests indefinitely in Green to maximize arterial corridor progression.
        - **Side Street (East-West)** features an embedded **Inductive Loop Detector (\`loop_ew\`)** that senses the metallic chassis of waiting vehicles.
        - **Crosswalk Pushbutton (\`ped_call\`)** registers pedestrian demand.

        When side-street demand is latched, the controller smoothly terminates the main street green, executes the ITE yellow change and all-red clearance, serves the side street with pedestrian walk signals, and safely returns to rest in main-street green!

        ### The Hardware Conflict Monitor Unit (CMU)
        The controller incorporates a hardware watchdog sensing field AC voltage taps. If conflicting greens ever energize simultaneously (or if an engineer forces a conflict via \`force_cmu_fault\`), the CMU trips within 450 ms, cuts power to the load switches, and engages a 50 FPM flasher relay into **100% 4-Way Flashing Red**!
        '''),
        lab(3, 'Stage 3: Actuated Intersection with Conflict Monitor', dsl3),
        note('Interactive Exercise — Stage 3 (Actuate Loops & Test the CMU Trip)', 'In Stage 3 above:\n1. Notice the controller rests peacefully in North-South Green. Cross-street traffic has no cars, so no green time is wasted!\n2. Click East-West Inductive Loop Detector to simulate a car arriving at the side-street stop bar. Watch the controller seamlessly execute NS Yellow (1.5s) -> All-Red (1.5s) -> EW Green & Ped Walk (3.5s) -> EW Yellow (1.5s) -> All-Red (1.5s) -> and return to resting NS Green!\n3. Now simulate a welded solid-state triac: toggle Simulate CMU Conflict (Welded Triac) to ON. Watch the CMU trip instantly! Green drops dead, and both approaches begin flashing emergency Red at 1 Hz!', 'success'),
        md('''
        ## 6. Commissioning Checklist & Municipal Intersection Proof Testing

        Before turning over any traffic cabinet to municipal DOT operations, field crews must complete this mandatory protocol:

        1. **CMU Diode Card Conflict Testing:** Remove the Conflict Monitor Unit from the cabinet and insert a factory testing harness. Systematically bridge every green and yellow channel pair (e.g. Phase 2 Green with Phase 4 Green). Verify the CMU drops the line relay into Flashing Red within 450 ms on every combination.
        2. **Inductive Loop Sensitivity & Resistance Verification:** Measure loop inductance with an RLC meter ($50$ to $300\\\\,\\\\mu\\\\text{H}$) and resistance-to-ground ($>100\\\\text{ M}\\\\Omega$). Test loop responsiveness with a bicycle or small motorcycle to confirm detection sensitivity.
        3. **ITE Clearance Timing Audit:** Physically stopwatch-verify field displays against the approved engineering timing sheet. Yellow change intervals must never be configured shorter than 3.0 seconds (typically $4.0$ to $5.5\\\\text{ s}$ on arterials), and All-Red must never be omitted ($1.0$ to $2.5\\\\text{ s}$).
        4. **Pedestrian Clearance Intervals (MUTCD 4E.06):** Ensure the flashing Don't Walk interval is calculated using a walking speed of no faster than $3.5\\\\text{ ft/s}$ ($1.07\\\\text{ m/s}$) across the full curb-to-curb crosswalk width.
        5. **Power Loss & Flasher Relay Drop Test:** Disconnect main 120V AC cabinet utility power and restore it. Verify the controller boots up in minimum 5-second all-red/flash mode before entering automatic coordination.
        6. **Preemption Gate Interlocks:** Verify that railroad preemption or emergency vehicle optical strobe sensors (Opticom) force an immediate safe clearance sequence rather than an instantaneous green transfer.
        ''')
    ]
}

(OUT / 'traffic-light-sequence.json').write_text(json.dumps(article, ensure_ascii=False, indent=2) + '\\n', encoding='utf-8')
print('Saved traffic-light-sequence.json successfully!')
`;

// Save files
const targetJsonPath = path.resolve('automationhub-masterclasses', 'traffic-light-sequence.json');
const targetPyPath = path.resolve('automationhub-masterclasses', 'generate_traffic_light_sequence.py');
const parentJsonPath = path.resolve('..', 'automationhub-masterclasses', 'traffic-light-sequence.json');
const parentPyPath = path.resolve('..', 'automationhub-masterclasses', 'generate_traffic_light_sequence.py');

fs.writeFileSync(targetJsonPath, JSON.stringify(articleData, null, 2) + '\n', 'utf8');
fs.writeFileSync(targetPyPath, pythonScript, 'utf8');

if (fs.existsSync(path.resolve('..', 'automationhub-masterclasses'))) {
  fs.writeFileSync(parentJsonPath, JSON.stringify(articleData, null, 2) + '\n', 'utf8');
  fs.writeFileSync(parentPyPath, pythonScript, 'utf8');
}

console.log('Saved masterclass JSON to:', targetJsonPath);
console.log('Saved python generator to:', targetPyPath);
