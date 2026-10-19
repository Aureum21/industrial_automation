export const TRAFFIC_LIGHT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" role="img" aria-labelledby="t d">
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

  <!-- Header -->
  <g font-family="Arial,sans-serif" fill="#142c3d">
    <text x="38" y="42" font-size="24" font-weight="bold">05 / NEMA TS2 DUAL-RING INTERSECTION &amp; CONFLICT MONITOR UNIT (CMU)</text>
    <text x="38" y="70" font-size="15">ITE Clearance Intervals (Yellow + All-Red), Inductive Vehicle Loops &amp; Hardware MMU Fail-Safe</text>
  </g>

  <!-- Left Box: Physical 4-Way Intersection Layout -->
  <rect x="38" y="100" width="370" height="390" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <rect x="50" y="112" width="346" height="26" rx="4" fill="#e8f4f8"/>
  <text x="223" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c" text-anchor="middle">4-WAY INTERSECTION (ROUTE 4 &amp; COUNTY PKWY)</text>

  <!-- Asphalt Roadways -->
  <!-- North-South Road (Width 110) -->
  <rect x="168" y="150" width="110" height="325" fill="#334155"/>
  <!-- East-West Road (Height 100) -->
  <rect x="50" y="260" width="346" height="105" fill="#334155"/>

  <!-- Intersection Conflict Box (W = 80ft) -->
  <rect x="168" y="260" width="110" height="105" fill="#1e293b" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4 4"/>
  <text x="223" y="318" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#f8fafc" text-anchor="middle">CONFLICT BOX</text>

  <!-- Center Double Yellow Lines -->
  <!-- North-South -->
  <line x1="221" y1="150" x2="221" y2="250" stroke="#f59e0b" stroke-width="2"/>
  <line x1="225" y1="150" x2="225" y2="250" stroke="#f59e0b" stroke-width="2"/>
  <line x1="221" y1="375" x2="221" y2="475" stroke="#f59e0b" stroke-width="2"/>
  <line x1="225" y1="375" x2="225" y2="475" stroke="#f59e0b" stroke-width="2"/>
  <!-- East-West -->
  <line x1="50" y1="311" x2="158" y2="311" stroke="#f59e0b" stroke-width="2"/>
  <line x1="50" y1="315" x2="158" y2="315" stroke="#f59e0b" stroke-width="2"/>
  <line x1="288" y1="311" x2="396" y2="311" stroke="#f59e0b" stroke-width="2"/>
  <line x1="288" y1="315" x2="396" y2="315" stroke="#f59e0b" stroke-width="2"/>

  <!-- Pedestrian Crosswalks (White zebra bars) -->
  <g fill="#cbd5e1">
    <rect x="172" y="250" width="102" height="6"/>
    <rect x="172" y="369" width="102" height="6"/>
    <rect x="158" y="264" width="6" height="97"/>
    <rect x="282" y="264" width="6" height="97"/>
  </g>

  <!-- Inductive Loop Detectors in Pavement -->
  <!-- Northbound Loop L-NS -->
  <rect x="233" y="415" width="35" height="40" rx="3" fill="#475569" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="3 2"/>
  <text x="250" y="440" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#38bdf8" text-anchor="middle">L-NS</text>
  <!-- Eastbound Loop L-EW -->
  <rect x="95" y="325" width="45" height="30" rx="3" fill="#475569" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="3 2"/>
  <text x="117" y="344" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#38bdf8" text-anchor="middle">L-EW</text>

  <!-- North-South Signal Head (Active Green) -->
  <rect x="290" y="165" width="22" height="52" rx="4" fill="#0f172a" stroke="#475569" stroke-width="1.5"/>
  <circle cx="301" cy="174" r="5" fill="#334155"/>
  <circle cx="301" cy="191" r="5" fill="#334155"/>
  <circle cx="301" cy="208" r="6" fill="#10b981"/>
  <text x="320" y="195" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#10b981">SG-NS (Phase 2)</text>

  <!-- East-West Signal Head (Active Red) -->
  <rect x="330" y="375" width="22" height="52" rx="4" fill="#0f172a" stroke="#475569" stroke-width="1.5"/>
  <circle cx="341" cy="384" r="6" fill="#dc2626"/>
  <circle cx="341" cy="401" r="5" fill="#334155"/>
  <circle cx="341" cy="418" r="5" fill="#334155"/>
  <text x="341" y="440" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#dc2626" text-anchor="middle">SG-EW (Phase 4)</text>

  <!-- Center Box: Controller State Machine & Timing Engine -->
  <rect x="430" y="100" width="375" height="390" rx="12" fill="#ffffff" stroke="#0f766e" stroke-width="2.5" stroke-dasharray="5 5"/>
  <rect x="445" y="112" width="345" height="26" rx="4" fill="#ccfbf1"/>
  <text x="617" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0f766e" text-anchor="middle">NEMA TS2 ACTUATED CONTROLLER UNIT (CU)</text>

  <!-- Dual-Ring Phase Sequencer -->
  <rect x="450" y="155" width="335" height="135" rx="8" fill="#f8fafc" stroke="#23495c" stroke-width="1.5"/>
  <text x="617" y="176" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#142c3d" text-anchor="middle">DUAL-RING PHASE TIMING SEQUENCER</text>

  <!-- Phase Timeline Blocks -->
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

  <!-- Ring Barrier Rules -->
  <text x="460" y="245" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#334155">• Ring Barrier Constraint: NS and EW Greens never cross concurrently</text>
  <text x="460" y="262" font-family="Arial,sans-serif" font-size="10" fill="#475569">• Inductive Loop Actuation: L-EW demand triggers safe termination</text>
  <text x="460" y="278" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0d9488">• Mandatory Clearance: Y ≥ 4.0s and All-Red ≥ 1.5s per MUTCD</text>

  <!-- ITE Clearance Calculation Panel -->
  <rect x="450" y="300" width="335" height="90" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
  <text x="617" y="322" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#14532d" text-anchor="middle">ITE CLEARANCE INTERVAL EQUATIONS</text>
  <text x="617" y="342" font-family="Courier,monospace" font-size="12" font-weight="bold" fill="#15803d" text-anchor="middle">Yellow: Y = t + V / (2a + 2Gg) = 4.3 s</text>
  <text x="617" y="360" font-family="Courier,monospace" font-size="12" font-weight="bold" fill="#15803d" text-anchor="middle">All-Red: R = (W + L) / V = 1.6 s</text>
  <text x="617" y="378" font-family="Arial,sans-serif" font-size="10" fill="#166534" text-anchor="middle">45 MPH Arterial (66 ft/s) • Intersection Width W = 80 ft</text>

  <!-- Pedestrian Crosswalk Coordination -->
  <rect x="450" y="400" width="335" height="75" rx="8" fill="#f8fafc" stroke="#23495c" stroke-width="1.5"/>
  <text x="617" y="420" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#142c3d" text-anchor="middle">PEDESTRIAN CLEARANCE &amp; FLASHING DONT WALK</text>
  <text x="617" y="438" font-family="Arial,sans-serif" font-size="10" fill="#475569">Ped Walk (7s) + Flashing Don&apos;t Walk (14s) timed before Yellow change</text>
  <text x="617" y="455" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b45309">Walking speed 3.5 ft/s ensures pedestrian clears before vehicular green</text>

  <!-- Right Box: Conflict Monitor Unit (CMU / MMU) -->
  <rect x="830" y="100" width="335" height="390" rx="12" fill="#ffffff" stroke="#b91c1c" stroke-width="2"/>
  <rect x="845" y="112" width="305" height="26" rx="4" fill="#fef2f2"/>
  <text x="997" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">CONFLICT MONITOR UNIT (CMU / MMU)</text>

  <!-- CMU Hardware Relay Inset -->
  <rect x="850" y="155" width="295" height="120" rx="8" fill="#fef2f2" stroke="#dc2626" stroke-width="2"/>
  <text x="997" y="180" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#991b1b" text-anchor="middle">HARDWARE INTERLOCK WATCHDOG</text>
  <circle cx="910" cy="215" r="14" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>
  <text x="910" y="219" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">CMU</text>
  <text x="940" y="210" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#7f1d1d">AC Voltage Sense Matrix</text>
  <text x="940" y="226" font-family="Arial,sans-serif" font-size="10" fill="#991b1b">Trip Window: ≤ 450 ms</text>
  <text x="997" y="255" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b91c1c" text-anchor="middle">Detects Conflicting Green / Yellow Displays</text>

  <!-- Emergency Flash Circuit -->
  <rect x="850" y="290" width="295" height="100" rx="8" fill="#fffbeb" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="997" y="315" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#92400e" text-anchor="middle">ELECTROMECHANICAL FLASHER BACKUP</text>
  <text x="997" y="335" font-family="Arial,sans-serif" font-size="10" fill="#b45309" text-anchor="middle">Isolated Line Relay physically isolates Triac outputs</text>
  <text x="997" y="352" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b45309" text-anchor="middle">50 FPM Flasher: 100% 4-Way Flashing Red</text>
  <text x="997" y="370" font-family="Arial,sans-serif" font-size="10" fill="#78350f" text-anchor="middle">Guarantees safe 4-way stop during PLC / CPU lockup</text>

  <!-- Failure Modes Identified -->
  <rect x="850" y="405" width="295" height="70" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="997" y="425" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">PROTECTED CMU FAULT CHANNELS</text>
  <text x="997" y="443" font-family="Arial,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">• Conflict (Dual Green) • Multiple Indications</text>
  <text x="997" y="460" font-family="Arial,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">• Short Yellow Clearance • 24V DC Brownout</text>

  <!-- Connecting Arrows -->
  <path d="M408 280 h22" fill="none" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#arr)"/>
  <path d="M805 210 h25" fill="none" stroke="#dc2626" stroke-width="2.5" marker-end="url(#arr-red)"/>

  <!-- Bottom Legend -->
  <g font-family="Arial,sans-serif" font-size="13" fill="#294758">
    <text x="40" y="520">Solid Colors: Active Traffic Phase Displays (Green/Yellow/Red) | Cyan: Pavement Inductive Loop Detectors &amp; Lead-In Cable</text>
    <text x="40" y="542">Dashed Red: CMU Conflict Voltage Feedback &amp; Flasher Transfer | Never connect signal triacs directly without a certified MMU.</text>
  </g>
</svg>`;
