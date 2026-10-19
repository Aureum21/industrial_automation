export const TANK_HYSTERESIS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" role="img" aria-labelledby="t d">
  <title id="t">Industrial Process Vessel Level Hysteresis and Schmitt Trigger Control</title>
  <desc id="d">Functional P&amp;ID of a 50,000-gallon buffer tank with continuous level radar LT-201, Schmitt trigger hysteresis deadband, anti-slosh low-pass filter, and redundant LSHH/LSLL hardwired cutouts.</desc>
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
    <linearGradient id="waterGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#227b92" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.2"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="560" rx="18" fill="#f3f6f8"/>

  <!-- Title & Subtitle -->
  <g font-family="Arial,sans-serif" fill="#142c3d">
    <text x="38" y="42" font-size="24" font-weight="bold">04 / INDUSTRIAL PROCESS VESSEL LEVEL HYSTERESIS &amp; SCHMITT TRIGGER</text>
    <text x="38" y="70" font-size="15">Dual-Threshold Deadband, Wave Slosh Filtering &amp; NEMA MG 1 Motor Protection Architecture</text>
  </g>

  <!-- Left: Process Tank Vessel TK-201 -->
  <rect x="38" y="100" width="340" height="390" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <rect x="50" y="112" width="316" height="26" rx="4" fill="#e8f4f8"/>
  <text x="208" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c" text-anchor="middle">BUFFER VESSEL TK-201 (50,000 GAL)</text>

  <!-- Tank Vessel Outline -->
  <rect x="65" y="155" width="220" height="270" rx="14" fill="#ffffff" stroke="#23495c" stroke-width="3"/>
  <!-- Liquid fill -->
  <rect x="68" y="275" width="214" height="147" rx="6" fill="url(#waterGrad)"/>
  <path d="M68 275 Q 120 270, 175 275 T 282 275" fill="none" stroke="#227b92" stroke-width="3"/>

  <!-- Level Markers inside Tank -->
  <!-- 92% High-High (LSHH) -->
  <line x1="68" y1="175" x2="282" y2="175" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="290" y="179" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#dc2626">92% LSHH (Trip)</text>

  <!-- 80% Stop Fill -->
  <line x1="68" y1="205" x2="282" y2="205" stroke="#bd7b24" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="290" y="209" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#bd7b24">80% Stop Fill</text>

  <!-- 50% Median Line -->
  <line x1="68" y1="265" x2="282" y2="265" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
  <text x="290" y="269" font-family="Arial,sans-serif" font-size="9" fill="#64748b">50% Setpoint (Naive)</text>

  <!-- 20% Start Fill -->
  <line x1="68" y1="335" x2="282" y2="335" stroke="#059669" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="290" y="339" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#059669">20% Start Fill</text>

  <!-- 8% Low-Low (LSLL) -->
  <line x1="68" y1="385" x2="282" y2="385" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="290" y="389" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#dc2626">8% LSLL (Inhibit)</text>

  <!-- Level Transmitter LT-201 on top -->
  <circle cx="175" cy="140" r="14" fill="#f8fafc" stroke="#23495c" stroke-width="2"/>
  <text x="175" y="144" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#142c3d" text-anchor="middle">LT</text>
  <path d="M175 154 v15" stroke="#23495c" stroke-width="2"/>
  <text x="175" y="125" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#227b92" text-anchor="middle">LT-201 (RADAR)</text>

  <!-- High-High Switch LSHH-201 -->
  <circle cx="95" cy="140" r="12" fill="#fef2f2" stroke="#b91c1c" stroke-width="2"/>
  <text x="95" y="144" font-family="Arial,sans-serif" font-size="8" font-weight="bold" fill="#b91c1c" text-anchor="middle">HH</text>

  <!-- Gravity Discharge Line (Bottom) -->
  <path d="M175 425 v35 h-95" fill="none" stroke="#227b92" stroke-width="4" marker-end="url(#arr)"/>
  <text x="75" y="475" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#227b92">FCV-202 (Drain Outflow)</text>

  <!-- Center: PLC Schmitt Trigger & Signal Conditioning -->
  <rect x="405" y="100" width="380" height="390" rx="12" fill="#ffffff" stroke="#0f766e" stroke-width="2.5" stroke-dasharray="5 5"/>
  <rect x="420" y="112" width="350" height="26" rx="4" fill="#ccfbf1"/>
  <text x="595" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0f766e" text-anchor="middle">PLC CONTROL CABINET // HYSTERESIS LOGIC</text>

  <!-- Signal Filtering Block -->
  <rect x="430" y="155" width="330" height="70" rx="8" fill="#f0fdfa" stroke="#0d9488" stroke-width="1.5"/>
  <text x="595" y="178" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#134e4a" text-anchor="middle">1.5s LOW-PASS FILTER (ANTI-SLOSH)</text>
  <text x="595" y="196" font-family="Arial,sans-serif" font-size="11" fill="#0f766e" text-anchor="middle">&alpha; = &Delta;t / (&tau; + &Delta;t) &bull; Exponential Moving Average</text>
  <text x="595" y="214" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#059669" text-anchor="middle">Eliminates surface ripples, splashing &amp; echo transients</text>

  <!-- Schmitt Trigger / Hysteresis Block -->
  <rect x="430" y="240" width="330" height="110" rx="8" fill="#f8fafc" stroke="#23495c" stroke-width="1.5"/>
  <text x="595" y="262" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#142c3d" text-anchor="middle">SCHMITT TRIGGER HYSTERESIS ENGINE</text>
  <text x="595" y="282" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#059669" text-anchor="middle">&bull; Level &le; 20%: Latch Fill Command ON</text>
  <text x="595" y="300" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#bd7b24" text-anchor="middle">&bull; Level &ge; 80%: Reset Fill Command OFF</text>
  <text x="595" y="320" font-family="Arial,sans-serif" font-size="11" fill="#475569" text-anchor="middle">&bull; Between 20% &amp; 80%: Retain Previous Output (Deadband)</text>
  <text x="595" y="338" font-family="Courier,monospace" font-size="11" font-weight="bold" fill="#0f766e" text-anchor="middle">Hysteresis Width &Delta;H = 80% &minus; 20% = 60%</text>

  <!-- NEMA Protection & Contactor Gate -->
  <rect x="430" y="365" width="330" height="65" rx="8" fill="#fef2f2" stroke="#b91c1c" stroke-width="1.5"/>
  <text x="595" y="388" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">NEMA MG 1 ANTI-SHORT-CYCLING</text>
  <text x="595" y="406" font-family="Arial,sans-serif" font-size="10" fill="#7f1d1d" text-anchor="middle">Prevents contactor flutter &bull; Max 3&ndash;4 starts/hr rating</text>
  <text x="595" y="420" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#991b1b" text-anchor="middle">LSHH overflow trip and dry-well LSLL lockout gates</text>

  <!-- Wiring from Tank to Controller -->
  <path d="M189 140 h216" fill="none" stroke="#bd7b24" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#arr-amber)"/>
  <text x="300" y="132" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#bd7b24">4-20 mA LT-201</text>

  <!-- Hardwired Trips -->
  <path d="M95 128 v-15 h345 v255" fill="none" stroke="#b91c1c" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#arr-red)"/>
  <text x="240" y="105" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b91c1c">Hardwired High-High Trip</text>

  <!-- Right: Motor Control Center (MCC) & Pump P-201 -->
  <rect x="815" y="100" width="345" height="390" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <rect x="830" y="112" width="315" height="26" rx="4" fill="#e8f4f8"/>
  <text x="987" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c" text-anchor="middle">PUMP STATION &amp; MCC 480V TRAIN</text>

  <!-- 480V Contactor Box -->
  <rect x="835" y="160" width="145" height="100" rx="8" fill="#f8fafc" stroke="#23495c" stroke-width="2"/>
  <text x="907" y="185" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#142c3d" text-anchor="middle">CONTACTOR M-201</text>
  <text x="907" y="205" font-family="Arial,sans-serif" font-size="11" fill="#0f766e" text-anchor="middle">3-Phase 480V AC</text>
  <text x="907" y="228" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b91c1c" text-anchor="middle">Overload OL-201 OK</text>
  <text x="907" y="248" font-family="Arial,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">Silver-Alloy Tips</text>

  <!-- Pump Motor -->
  <circle cx="1070" cy="210" r="38" fill="#f8fafc" stroke="#23495c" stroke-width="2.5"/>
  <path d="M1050 230 v-40 l40 20 Z" fill="#227b92"/>
  <text x="1070" y="265" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#142c3d" text-anchor="middle">PUMP P-201</text>
  <text x="1070" y="282" font-family="Arial,sans-serif" font-size="11" fill="#64748b" text-anchor="middle">75 kW / 100 HP</text>

  <!-- Check Valve NRV-201 -->
  <path d="M1010 320 v30 l20 -15 Z M1030 320 v30" fill="none" stroke="#23495c" stroke-width="2"/>
  <text x="1025" y="310" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#142c3d" text-anchor="middle">NRV-201</text>

  <!-- Piping: Pump Outlet to Tank Inflow -->
  <path d="M1070 172 v-45 h-740 v28" fill="none" stroke="#227b92" stroke-width="4" marker-end="url(#arr)"/>
  <text x="640" y="122" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#227b92">Pressurized Inflow Pipe (1200 GPM)</text>

  <!-- Control wire from PLC to Contactor -->
  <path d="M760 300 h75" fill="none" stroke="#bd7b24" stroke-width="2.5" marker-end="url(#arr-amber)"/>
  <text x="797" y="292" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#bd7b24">PUMP_CMD</text>

  <!-- Bottom Legend -->
  <g font-family="Arial,sans-serif" font-size="13" fill="#294758">
    <text x="40" y="520">Solid Cyan: Process Inflow/Outflow Lines (3000 GPM) | Dashed Amber: 4–20 mA Level Transmitter &amp; Contactor Coils (24V DC)</text>
    <text x="40" y="542">Dashed Red: Hardwired High-High / Low-Low Overrides | Deadband of 60% guarantees motor stays within thermal start limits.</text>
  </g>
</svg>`;
