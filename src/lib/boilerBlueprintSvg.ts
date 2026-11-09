export const BOILER_BLUEPRINT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 580" role="img" aria-labelledby="t d">
  <title id="t">3-Element Steam Boiler Drum Level Control P&amp;ID</title>
  <desc id="d">Industrial P&amp;ID schematic illustrating steam boiler drum level instrumentation: differential pressure level transmitter LT-101, steam flow FT-102, feedwater flow FT-103, feedwater regulating valve FCV-101, fuel safety shutoff valve SSOV-101, and 3-element cascade PLC logic.</desc>
  <defs>
    <marker id="arr-blue" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0 0L8 4L0 8Z" fill="#0284c7"/>
    </marker>
    <marker id="arr-amber" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0 0L8 4L0 8Z" fill="#d97706"/>
    </marker>
    <marker id="arr-red" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0 0L8 4L0 8Z" fill="#dc2626"/>
    </marker>
    <linearGradient id="drumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="45%" stop-color="#f8fafc"/>
      <stop offset="48%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>
    <linearGradient id="fireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fef08a"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="580" rx="18" fill="#f8fafc"/>

  <!-- Title Header -->
  <g font-family="Arial,sans-serif" fill="#0f172a">
    <text x="40" y="42" font-size="22" font-weight="bold">11 // 3-ELEMENT STEAM BOILER DRUM LEVEL &amp; SAFETY INTERLOCK</text>
    <text x="40" y="68" font-size="14" fill="#64748b">Process Flow &amp; Instrumentation Diagram (P&amp;ID) — Shrink/Swell Mass Balance &amp; NFPA 85 Burner Safeguards</text>
  </g>

  <!-- 3-Element Controller Boundary -->
  <rect x="40" y="95" width="460" height="195" rx="12" fill="#ffffff" stroke="#0284c7" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="56" y="122" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0284c7">3-ELEMENT PLC CASCADE CONTROLLER (LIC / FIC-101)</text>

  <!-- Feedforward Summer & PID Box -->
  <rect x="60" y="140" width="180" height="130" rx="8" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.5"/>
  <text x="150" y="165" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">PRIMARY LEVEL TRIM</text>
  <text x="150" y="185" font-family="Arial,sans-serif" font-size="11" fill="#0369a1" text-anchor="middle">LIC-101 / PI on (SP − PV)</text>
  <rect x="75" y="200" width="150" height="28" rx="4" fill="#e0f2fe"/>
  <text x="150" y="218" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#0284c7" text-anchor="middle">SP = 50% Water Level</text>
  <text x="150" y="250" font-family="Arial,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">Anti-Windup Clamps: ±25%</text>

  <!-- Mass Balance Summer Box -->
  <rect x="280" y="140" width="200" height="130" rx="8" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>
  <text x="380" y="165" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">MASS BALANCE SUMMER</text>
  <text x="380" y="186" font-family="Arial,sans-serif" font-size="11" fill="#475569" text-anchor="middle">Feedforward = Steam + Blowdown</text>
  <text x="380" y="206" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Demand = FF + Level Trim</text>
  <text x="380" y="248" font-family="Arial,sans-serif" font-size="10" fill="#0284c7" text-anchor="middle">Outputs Valve Demand to FCV-101</text>

  <!-- Connect primary trim to mass summer -->
  <path d="M240 205 h40" fill="none" stroke="#0284c7" stroke-width="2" marker-end="url(#arr-blue)"/>

  <!-- STEAM BOILER DRUM (Physical Vessel) -->
  <g transform="translate(560, 110)">
    <!-- Drum Shell -->
    <rect x="0" y="0" width="340" height="140" rx="70" fill="url(#drumGrad)" stroke="#1e293b" stroke-width="3"/>

    <!-- Water Line Indicator -->
    <path d="M30 70 Q 85 66, 170 70 T 310 70" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-dasharray="4 2"/>
    <text x="170" y="60" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">Normal Water Level (NWL) 50%</text>
    <text x="170" y="105" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">STEAM DRUM (D-101)</text>
    <text x="170" y="125" font-family="Arial,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">Pressure: 60 bar / 870 PSI · Temp: 275°C</text>

    <!-- Steam Separation internals -->
    <path d="M80 30 h180" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 4"/>
    <text x="170" y="24" font-family="Arial,sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle">CYCLONE SEPARATORS &amp; CHEVRON DRYERS</text>
  </g>

  <!-- Downcomers & Furnace Riser Tube Loop -->
  <path d="M620 250 v150 h120" fill="none" stroke="#0284c7" stroke-width="6"/>
  <path d="M840 250 v150 h-100" fill="none" stroke="#e11d48" stroke-width="6"/>
  <text x="605" y="330" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0369a1" transform="rotate(-90 605 330)">DOWNCOMER</text>
  <text x="855" y="330" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#e11d48" transform="rotate(90 855 330)">STEAM RISER</text>

  <!-- Mud Drum (Lower Header) -->
  <rect x="680" y="375" width="100" height="50" rx="25" fill="#f1f5f9" stroke="#1e293b" stroke-width="2.5"/>
  <text x="730" y="405" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">MUD DRUM</text>

  <!-- Furnace Combustion Chamber -->
  <g transform="translate(685, 440)">
    <!-- Burner box -->
    <rect x="-15" y="0" width="120" height="55" rx="8" fill="#1e293b"/>
    <!-- Flames -->
    <path d="M0 0 Q 15 -35, 25 0 Q 35 -45, 45 0 Q 60 -35, 75 0 Z" fill="url(#fireGrad)"/>
    <text x="45" y="28" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">BURNER</text>
    <text x="45" y="44" font-family="Arial,sans-serif" font-size="9" fill="#cbd5e1" text-anchor="middle">Gas / Oil Fired</text>
  </g>

  <!-- Fuel Gas Supply Line & SSOV-101 (Safety Shutoff Valve) -->
  <path d="M500 467 h170" fill="none" stroke="#ea580c" stroke-width="4" marker-end="url(#arr-amber)"/>
  <g transform="translate(560, 447)">
    <polygon points="0,0 24,12 24,-12" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
    <polygon points="24,0 0,12 0,-12" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
    <rect x="6" y="-30" width="12" height="18" fill="#ffffff" stroke="#991b1b" stroke-width="1.5"/>
    <text x="12" y="-18" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#ef4444" text-anchor="middle">S</text>
    <text x="12" y="28" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#991b1b" text-anchor="middle">SSOV-101</text>
    <text x="12" y="40" font-family="Arial,sans-serif" font-size="9" fill="#dc2626" text-anchor="middle">De-energize to Trip</text>
  </g>

  <!-- Steam Outlet Line (Top of Drum to Header) -->
  <path d="M730 110 v-40 h260" fill="none" stroke="#64748b" stroke-width="5" marker-end="url(#arr-blue)"/>
  <text x="960" y="55" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#334155">MAIN STEAM TO TURBINE</text>

  <!-- Steam Flow Transmitter FT-102 -->
  <circle cx="830" cy="70" r="22" fill="#ffffff" stroke="#334155" stroke-width="2"/>
  <text x="830" y="67" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">FT</text>
  <text x="830" y="79" font-family="Arial,sans-serif" font-size="9" fill="#475569" text-anchor="middle">102</text>
  <!-- Signal line from FT-102 to Mass Summer -->
  <path d="M830 92 v40 H 480" fill="none" stroke="#d97706" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#arr-amber)"/>
  <text x="640" y="125" font-family="Arial,sans-serif" font-size="10" fill="#d97706">Steam Flow (t/h) Feedforward</text>

  <!-- Drum Level Transmitter LT-101 (Differential Pressure with Condensate Pot) -->
  <g transform="translate(930, 140)">
    <!-- Wet reference leg pot -->
    <rect x="-10" y="0" width="20" height="30" rx="4" fill="#94a3b8"/>
    <!-- DP Transmitter Cell -->
    <circle cx="0" cy="55" r="22" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
    <text x="0" y="52" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">LT</text>
    <text x="0" y="64" font-family="Arial,sans-serif" font-size="9" fill="#0369a1" text-anchor="middle">101</text>
    <!-- Tap lines into drum -->
    <path d="M-10 15 H -30" stroke="#334155" stroke-width="2"/>
    <path d="M-10 95 H -30" stroke="#0284c7" stroke-width="2"/>
    <!-- Wet reference line -->
    <path d="M0 30 v10" stroke="#334155" stroke-width="2"/>
    <!-- Variable dry leg -->
    <path d="M-10 95 H0 v-18" stroke="#0284c7" stroke-width="2"/>
  </g>
  <!-- Signal from LT-101 to Primary Trim -->
  <path d="M930 217 v45 H 240 v-25" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#arr-blue)"/>
  <text x="560" y="275" font-family="Arial,sans-serif" font-size="10" fill="#0284c7">Drum Level PV (%)</text>

  <!-- Feedwater Supply Line (From Feedwater Pumps) -->
  <path d="M40 370 h460 v-120" fill="none" stroke="#0284c7" stroke-width="5" marker-end="url(#arr-blue)"/>
  <path d="M500 250 h60" fill="none" stroke="#0284c7" stroke-width="5"/>
  <text x="50" y="355" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0369a1">BOILER FEEDWATER (BFW) PUMPS (85 bar)</text>

  <!-- Feedwater Flow Transmitter FT-103 -->
  <circle cx="160" cy="370" r="22" fill="#ffffff" stroke="#334155" stroke-width="2"/>
  <text x="160" y="367" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">FT</text>
  <text x="160" y="379" font-family="Arial,sans-serif" font-size="9" fill="#475569" text-anchor="middle">103</text>
  <path d="M160 348 v-40 h180 v-40" fill="none" stroke="#d97706" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#arr-amber)"/>
  <text x="195" y="325" font-family="Arial,sans-serif" font-size="10" fill="#d97706">BFW Flow Feedback</text>

  <!-- Feedwater Control Valve FCV-101 -->
  <g transform="translate(320, 370)">
    <polygon points="0,0 26,14 26,-14" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
    <polygon points="26,0 0,14 0,-14" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
    <!-- Pneumatic Diaphragm Actuator -->
    <path d="M13 0 v-24" stroke="#0f172a" stroke-width="2"/>
    <path d="M-3 -24 h32 a16 16 0 0 0 -32 0 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5"/>
    <text x="13" y="28" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">FCV-101</text>
    <text x="13" y="42" font-family="Arial,sans-serif" font-size="9" fill="#64748b" text-anchor="middle">Equal % Characteristic</text>
  </g>
  <!-- Signal from Summer to FCV-101 -->
  <path d="M410 270 v60 h-77 v16" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#arr-blue)"/>
  <text x="350" y="315" font-family="Arial,sans-serif" font-size="10" fill="#0284c7">4-20mA Control (0-100%)</text>

  <!-- Hardwired Safety Interlock Matrix Boundary -->
  <rect x="880" y="330" width="280" height="210" rx="10" fill="#fff1f2" stroke="#e11d48" stroke-width="1.5"/>
  <text x="895" y="355" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#be123c">NFPA 85 HARDWIRED TRIP MATRIX</text>

  <g transform="translate(900, 375)">
    <rect x="0" y="0" width="240" height="32" rx="4" fill="#ffe4e6" stroke="#f43f5e" stroke-width="1"/>
    <text x="10" y="20" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#9f1239">LT-101 &lt; 15% (LLWL): TUBE MELT TRIP</text>

    <rect x="0" y="42" width="240" height="32" rx="4" fill="#ffe4e6" stroke="#f43f5e" stroke-width="1"/>
    <text x="10" y="62" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#9f1239">LT-101 &gt; 85% (HHWL): TURBINE TRIP</text>

    <rect x="0" y="84" width="240" height="32" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="10" y="104" font-family="Arial,sans-serif" font-size="10" fill="#334155">Master Reset: Manual Key Interlock</text>

    <rect x="0" y="126" width="240" height="24" rx="4" fill="#be123c"/>
    <text x="120" y="142" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">DE-ENERGIZE SSOV-101 (FUEL SHUTOFF)</text>
  </g>
  <!-- Trip line to fuel valve -->
  <path d="M880 495 H 600" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="6 3" marker-end="url(#arr-red)"/>
  <text x="740" y="515" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#dc2626">Emergency Fuel Cutoff Signal</text>

  <!-- Engineering Legend / Units -->
  <g transform="translate(40, 520)" font-family="Arial,sans-serif" font-size="11" fill="#475569">
    <text x="0" y="0"><tspan font-weight="bold" fill="#0f172a">Process Variables:</tspan> LT-101 (Drum Level 0–100%) · FT-102 (Steam Flow 0–100 t/h) · FT-103 (Feedwater Flow 0–100 t/h)</text>
    <text x="0" y="20"><tspan font-weight="bold" fill="#0f172a">Control Dynamics:</tspan> Feedforward eliminates shrink/swell lag. Level PI trims thermal mass density drift.</text>
  </g>
</svg>
`;
