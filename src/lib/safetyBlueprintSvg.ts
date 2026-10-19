export const TWO_HAND_SAFETY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" role="img" aria-labelledby="t d">
  <title id="t">Two-Hand Safety Interlock and Monitored Press Hydraulic Train</title>
  <desc id="d">Functional schematic of an ISO 13851 Type IIIC Two-Hand Control System with 500ms synchronism, anti-tie-down, anti-repeat, and monitored dual redundant safety valves.</desc>
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
    <text x="38" y="42" font-size="24" font-weight="bold">03 / TWO-HAND CONTROL &amp; MONITORED PRESS SAFETY TRAIN</text>
    <text x="38" y="70" font-size="15">ISO 13851 Type III C &amp; ISO 13849-1 Category 4 / PL e Functional Safety Architecture</text>
  </g>

  <!-- Operator Console Boundary -->
  <rect x="38" y="100" width="310" height="390" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <rect x="50" y="112" width="286" height="26" rx="4" fill="#e8f4f8"/>
  <text x="193" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c" text-anchor="middle">TWO-HAND ACTUATION CONSOLE</text>

  <!-- Button A (Left Hand) -->
  <rect x="60" y="160" width="120" height="110" rx="8" fill="#f8fafc" stroke="#23495c" stroke-width="2"/>
  <circle cx="120" cy="195" r="24" fill="#e2e8f0" stroke="#0f766e" stroke-width="3"/>
  <circle cx="120" cy="195" r="16" fill="#0d9488"/>
  <text x="120" y="235" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#142c3d" text-anchor="middle">PB-101A (LEFT)</text>
  <text x="120" y="252" font-family="Arial,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">Shielded Shroud</text>

  <!-- Button B (Right Hand) -->
  <rect x="205" y="160" width="120" height="110" rx="8" fill="#f8fafc" stroke="#23495c" stroke-width="2"/>
  <circle cx="265" cy="195" r="24" fill="#e2e8f0" stroke="#0f766e" stroke-width="3"/>
  <circle cx="265" cy="195" r="16" fill="#0d9488"/>
  <text x="265" y="235" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#142c3d" text-anchor="middle">PB-101B (RIGHT)</text>
  <text x="265" y="252" font-family="Arial,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">Shielded Shroud</text>

  <!-- Dimension line between buttons -->
  <path d="M120 285 h145" fill="none" stroke="#64748b" stroke-width="1.5"/>
  <path d="M120 280 v10 M265 280 v10" fill="none" stroke="#64748b" stroke-width="1.5"/>
  <text x="193" y="302" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#475569" text-anchor="middle">Spacing ≥ 260 mm</text>
  <text x="193" y="318" font-family="Arial,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">(Prevents Single-Arm Bridging)</text>

  <!-- E-Stop on console -->
  <rect x="110" y="340" width="165" height="75" rx="8" fill="#fef2f2" stroke="#b91c1c" stroke-width="2"/>
  <circle cx="145" cy="377" r="18" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>
  <text x="210" y="372" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#b91c1c">E-STOP S0</text>
  <text x="210" y="390" font-family="Arial,sans-serif" font-size="10" fill="#7f1d1d">Dual NC Contacts</text>

  <!-- Safety Distance Formula Box -->
  <rect x="50" y="430" width="286" height="50" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
  <text x="193" y="450" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">EN ISO 13855 SAFETY DISTANCE</text>
  <text x="193" y="468" font-family="Courier,monospace" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">S = (1600 mm/s × T) + C</text>

  <!-- Safety Controller Boundary -->
  <rect x="380" y="100" width="370" height="390" rx="12" fill="#ffffff" stroke="#0f766e" stroke-width="2.5" stroke-dasharray="5 5"/>
  <rect x="395" y="112" width="340" height="26" rx="4" fill="#ccfbf1"/>
  <text x="565" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0f766e" text-anchor="middle">SAFETY CONTROLLER LOGIC (TYPE III C / Cat 4)</text>

  <!-- Synchronism Block -->
  <rect x="405" y="155" width="320" height="75" rx="8" fill="#f0fdfa" stroke="#0d9488" stroke-width="1.5"/>
  <text x="565" y="178" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#134e4a" text-anchor="middle">500 ms SYNCHRONISM ENGINE</text>
  <text x="565" y="196" font-family="Arial,sans-serif" font-size="11" fill="#0f766e" text-anchor="middle">| t(PB-A) − t(PB-B) | ≤ 500 ms</text>
  <text x="565" y="214" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b91c1c" text-anchor="middle">Late press &gt;500ms locks out stroke immediately</text>

  <!-- Anti-Tie-Down & Anti-Repeat Block -->
  <rect x="405" y="245" width="320" height="85" rx="8" fill="#f8fafc" stroke="#23495c" stroke-width="1.5"/>
  <text x="565" y="268" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#142c3d" text-anchor="middle">ANTI-TIE-DOWN &amp; SINGLE-STROKE</text>
  <text x="565" y="288" font-family="Arial,sans-serif" font-size="11" fill="#475569" text-anchor="middle">• Both buttons must fully release before next cycle</text>
  <text x="565" y="306" font-family="Arial,sans-serif" font-size="11" fill="#475569" text-anchor="middle">• TDC limit switch resets stroke memory (No Repeat)</text>
  <text x="565" y="322" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0d9488" text-anchor="middle">Continuous concurrence required throughout downstroke</text>

  <!-- Spool Cross-Monitoring Block -->
  <rect x="405" y="345" width="320" height="70" rx="8" fill="#fef2f2" stroke="#b91c1c" stroke-width="1.5"/>
  <text x="565" y="368" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">VALVE SPOOL DIVERSE MONITORING</text>
  <text x="565" y="386" font-family="Arial,sans-serif" font-size="10" fill="#7f1d1d" text-anchor="middle">Dynamic check of ZSO-101 and ZSO-102 before energization</text>
  <text x="565" y="402" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#991b1b" text-anchor="middle">Spool stuck or discrepancy = Immediate Safety Lockout</text>

  <!-- Signal connection from Console to Safety Controller -->
  <path d="M120 270 v-20 h285" fill="none" stroke="#bd7b24" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#arr-amber)"/>
  <path d="M265 270 v-40 h140" fill="none" stroke="#bd7b24" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#arr-amber)"/>
  <path d="M275 377 h130" fill="none" stroke="#b91c1c" stroke-width="2.5" stroke-dasharray="6 4" marker-end="url(#arr-red)"/>

  <!-- Dual Redundant Output Path from Controller to Press -->
  <path d="M725 285 h55 v-60 h20" fill="none" stroke="#bd7b24" stroke-width="2.5" marker-end="url(#arr-amber)"/>
  <path d="M725 295 h35 v35 h40" fill="none" stroke="#bd7b24" stroke-width="2.5" marker-end="url(#arr-amber)"/>
  <text x="755" y="215" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#bd7b24">CH A CMD</text>
  <text x="755" y="345" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#bd7b24">CH B CMD</text>

  <!-- Hydraulic & Press Mechanism Boundary -->
  <rect x="780" y="100" width="380" height="390" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <rect x="795" y="112" width="350" height="26" rx="4" fill="#e8f4f8"/>
  <text x="970" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c" text-anchor="middle">HYDRAULIC PRESS TRAIN (150-TON RAM)</text>

  <!-- Dual Safety Valves SV-101 and SV-102 in series -->
  <rect x="800" y="160" width="135" height="90" rx="8" fill="#f8fafc" stroke="#23495c" stroke-width="2"/>
  <text x="867" y="185" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#142c3d" text-anchor="middle">VALVE SV-101</text>
  <text x="867" y="205" font-family="Arial,sans-serif" font-size="11" fill="#0f766e" text-anchor="middle">Pilot Solenoid A</text>
  <text x="867" y="228" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b91c1c" text-anchor="middle">ZSO-101 Spool Pos</text>

  <rect x="800" y="280" width="135" height="90" rx="8" fill="#f8fafc" stroke="#23495c" stroke-width="2"/>
  <text x="867" y="305" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#142c3d" text-anchor="middle">VALVE SV-102</text>
  <text x="867" y="325" font-family="Arial,sans-serif" font-size="11" fill="#0f766e" text-anchor="middle">Pilot Solenoid B</text>
  <text x="867" y="348" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b91c1c" text-anchor="middle">ZSO-102 Spool Pos</text>

  <!-- Series hydraulic fluid supply -->
  <path d="M867 145 v15" fill="none" stroke="#227b92" stroke-width="4"/>
  <text x="880" y="153" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#227b92">3000 PSI P</text>
  <path d="M867 250 v30" fill="none" stroke="#227b92" stroke-width="4"/>
  <path d="M867 370 v25 h85" fill="none" stroke="#227b92" stroke-width="4" marker-end="url(#arr)"/>

  <!-- Spool Position Feedback lines back to controller -->
  <path d="M800 230 h-75 v125" fill="none" stroke="#b91c1c" stroke-width="1.8" stroke-dasharray="6 4" marker-end="url(#arr-red)"/>
  <path d="M800 350 h-75 v15" fill="none" stroke="#b91c1c" stroke-width="1.8" stroke-dasharray="6 4" marker-end="url(#arr-red)"/>

  <!-- Hydraulic Cylinder & Press Ram -->
  <rect x="955" y="160" width="185" height="130" rx="8" fill="#ffffff" stroke="#23495c" stroke-width="2.5"/>
  <text x="1047" y="185" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#142c3d" text-anchor="middle">HYDRAULIC CYLINDER</text>
  
  <!-- Piston and rod -->
  <rect x="975" y="195" width="145" height="25" rx="3" fill="#cbd5e1" stroke="#475569" stroke-width="1.5"/>
  <rect x="1035" y="220" width="25" height="60" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>

  <!-- Ram / Upper Tooling Die -->
  <rect x="990" y="280" width="115" height="30" rx="4" fill="#475569" stroke="#1e293b" stroke-width="2"/>
  <text x="1047" y="300" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">UPPER DIE RAM</text>

  <!-- Lower Die Bed & Pinch Point Hazard -->
  <rect x="970" y="380" width="155" height="40" rx="6" fill="#334155" stroke="#0f172a" stroke-width="2"/>
  <text x="1047" y="405" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">LOWER DIE BED</text>

  <!-- Pinch Point Danger Zone -->
  <rect x="990" y="320" width="115" height="50" rx="4" fill="#fef2f2" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="1047" y="342" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#dc2626" text-anchor="middle">PINCH POINT</text>
  <text x="1047" y="358" font-family="Arial,sans-serif" font-size="10" fill="#991b1b" text-anchor="middle">HAZARD ZONE</text>

  <!-- TDC Cam Limit Switch -->
  <circle cx="1120" cy="190" r="14" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <text x="1120" y="194" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#23495c" text-anchor="middle">TDC</text>
  <path d="M1120 204 v70 h-395" fill="none" stroke="#bd7b24" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#arr-amber)"/>
  <text x="1115" y="245" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#bd7b24">Cam</text>

  <!-- Footer Legend -->
  <g font-family="Arial,sans-serif" font-size="13" fill="#294758">
    <text x="40" y="520">Solid Cyan: High-Pressure Hydraulic Fluid (3000 PSI) | Dashed Amber: Dual Safety Inputs &amp; Solenoid Drives (24V DC)</text>
    <text x="40" y="542">Dashed Red: Monitored Spool Position Feedback &amp; E-Stop Trips | Both hands must remain on actuators until stroke completes.</text>
  </g>
</svg>`;
