export const PUMP_ALTERNATOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" role="img" aria-labelledby="t d">
  <title id="t">Duplex Pump Duty Alternation and Lead-Lag Control</title>
  <desc id="d">Engineering P&amp;ID of a duplex booster pump skid with duty alternation flip-flop, thermal overload standby auto-takeover, and peak-demand lag sequencing.</desc>
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

  <!-- Title & Subtitle -->
  <g font-family="Arial,sans-serif" fill="#142c3d">
    <text x="38" y="42" font-size="24" font-weight="bold">06 / DUPLEX PUMP DUTY CYCLING &amp; LEAD / LAG ALTERNATION</text>
    <text x="38" y="70" font-size="15">Equal Wear Balancing, Automatic Fault Substitution &amp; Peak-Inflow Assist Control</text>
  </g>

  <!-- Left: Duplex Hydraulic Piping Skid -->
  <rect x="38" y="100" width="370" height="390" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <rect x="50" y="112" width="346" height="26" rx="4" fill="#e8f4f8"/>
  <text x="223" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c" text-anchor="middle">DUPLEX PUMP SKID (P-101A / P-101B)</text>

  <!-- Common Suction Header (Cyan) -->
  <rect x="55" y="190" width="30" height="180" rx="6" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
  <text x="70" y="285" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0369a1" transform="rotate(-90 70 285)" text-anchor="middle">SUCTION HEADER (FROM SUMP)</text>

  <!-- Suction branches -->
  <path d="M85 220 h45" fill="none" stroke="#0284c7" stroke-width="4"/>
  <path d="M85 340 h45" fill="none" stroke="#0284c7" stroke-width="4"/>

  <!-- Isolation Valves Suction -->
  <path d="M130 210 l16 10 -16 10 Z M162 210 l-16 10 16 10 Z" fill="#23495c"/>
  <text x="146" y="240" font-family="Arial,sans-serif" font-size="9" fill="#64748b" text-anchor="middle">V-IN-A</text>

  <path d="M130 330 l16 10 -16 10 Z M162 330 l-16 10 16 10 Z" fill="#23495c"/>
  <text x="146" y="360" font-family="Arial,sans-serif" font-size="9" fill="#64748b" text-anchor="middle">V-IN-B</text>

  <!-- Pump Volutes -->
  <circle cx="210" cy="220" r="32" fill="#f8fafc" stroke="#23495c" stroke-width="2.5"/>
  <path d="M195 235 v-30 l30 15 Z" fill="#227b92"/>
  <text x="210" y="178" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#142c3d" text-anchor="middle">PUMP P-101A</text>
  <text x="210" y="265" font-family="Arial,sans-serif" font-size="9" fill="#64748b" text-anchor="middle">Duty / Lead Unit</text>

  <circle cx="210" cy="340" r="32" fill="#f8fafc" stroke="#23495c" stroke-width="2.5"/>
  <path d="M195 355 v-30 l30 15 Z" fill="#227b92"/>
  <text x="210" y="385" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#142c3d" text-anchor="middle">PUMP P-101B</text>
  <text x="210" y="399" font-family="Arial,sans-serif" font-size="9" fill="#64748b" text-anchor="middle">Standby / Lag Unit</text>

  <!-- Discharge Branches -->
  <path d="M242 220 h45" fill="none" stroke="#227b92" stroke-width="4"/>
  <path d="M242 340 h45" fill="none" stroke="#227b92" stroke-width="4"/>

  <!-- Check Valves (NRV) -->
  <path d="M287 210 v20 l16 -10 Z M303 210 v20" fill="none" stroke="#23495c" stroke-width="2"/>
  <text x="295" y="240" font-family="Arial,sans-serif" font-size="9" fill="#64748b" text-anchor="middle">NRV-A</text>

  <path d="M287 330 v20 l16 -10 Z M303 330 v20" fill="none" stroke="#23495c" stroke-width="2"/>
  <text x="295" y="360" font-family="Arial,sans-serif" font-size="9" fill="#64748b" text-anchor="middle">NRV-B</text>

  <!-- Common Discharge Header -->
  <path d="M305 220 h35 v120 h-35" fill="none" stroke="#227b92" stroke-width="4"/>
  <path d="M340 280 h55" fill="none" stroke="#227b92" stroke-width="5" marker-end="url(#arr)"/>
  <text x="368" y="270" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#227b92">TO SYSTEM</text>

  <!-- Wet Well Level Float Switches Inset -->
  <rect x="50" y="415" width="346" height="65" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <circle cx="80" cy="448" r="8" fill="#10b981"/>
  <text x="95" y="452" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#065f46">LEAD CALL (LSH-101): Normal Inflow Demand</text>
  <circle cx="80" cy="466" r="8" fill="#f59e0b"/>
  <text x="95" y="470" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b45309">LAG CALL (LSHH-102): Peak Surge Demand (Both Run)</text>

  <!-- Center: PLC Alternation & Auto-Takeover Engine -->
  <rect x="430" y="100" width="375" height="390" rx="12" fill="#ffffff" stroke="#0f766e" stroke-width="2.5" stroke-dasharray="5 5"/>
  <rect x="445" y="112" width="345" height="26" rx="4" fill="#ccfbf1"/>
  <text x="617" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0f766e" text-anchor="middle">PLC ALTERNATION &amp; AUTO-TAKEOVER ENGINE</text>

  <!-- Stage 1 Block: Duty Flip-Flop -->
  <rect x="450" y="155" width="335" height="90" rx="8" fill="#f8fafc" stroke="#23495c" stroke-width="1.5"/>
  <text x="617" y="176" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#142c3d" text-anchor="middle">1. CYCLE-BASED DUTY FLIP-FLOP (PULSE_RELAY)</text>
  <text x="465" y="198" font-family="Arial,sans-serif" font-size="10" fill="#334155">• On falling edge of Call (F_TRIG), duty flips A ↔ B</text>
  <text x="465" y="215" font-family="Arial,sans-serif" font-size="10" fill="#334155">• Balances runtime hours and prevents seal stiction</text>
  <text x="465" y="232" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b91c1c">⚠ FLAW: Blind toggle stalls if duty pump trips on overload!</text>

  <!-- Stage 2 Block: Standby Auto-Takeover -->
  <rect x="450" y="255" width="335" height="105" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
  <text x="617" y="276" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#14532d" text-anchor="middle">2. FAULT-AWARE STANDBY AUTO-TAKEOVER</text>
  <text x="465" y="298" font-family="Arial,sans-serif" font-size="10" fill="#166534">• Monitors thermal overloads OL-A and OL-B</text>
  <text x="465" y="315" font-family="Arial,sans-serif" font-size="10" fill="#166534">• If Duty A is tripped → Standby B takes over instantly</text>
  <text x="465" y="332" font-family="Arial,sans-serif" font-size="10" fill="#166534">• If Duty B is tripped → Standby A takes over instantly</text>
  <text x="465" y="348" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#15803d">✔ Zero service interruption; station continues pumping</text>

  <!-- Stage 3 Block: Lead / Lag Peak Assist -->
  <rect x="450" y="370" width="335" height="105" rx="8" fill="#fffbeb" stroke="#d97706" stroke-width="1.5"/>
  <text x="617" y="392" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#92400e" text-anchor="middle">3. LEAD / LAG SEQUENCING (PEAK ASSIST)</text>
  <text x="465" y="413" font-family="Arial,sans-serif" font-size="10" fill="#78350f">• Normal level: Only Lead Pump runs (50% energy)</text>
  <text x="465" y="430" font-family="Arial,sans-serif" font-size="10" fill="#78350f">• High level (Surge): Lag Pump kicks on in parallel</text>
  <text x="465" y="447" font-family="Arial,sans-serif" font-size="10" fill="#78350f">• Both pumps run until level recedes below Lag threshold</text>
  <text x="465" y="464" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b45309">✔ Doubles flow capacity during storm / peak hours</text>

  <!-- Right: Comparison & Field Practicalities -->
  <rect x="830" y="100" width="335" height="390" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <rect x="845" y="112" width="305" height="26" rx="4" fill="#e8f4f8"/>
  <text x="997" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c" text-anchor="middle">INTERMEDIATE CONTROLS COMPARISON</text>

  <!-- Table Inset -->
  <rect x="845" y="155" width="305" height="150" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="855" y="178" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#142c3d">ARCHITECTURE COMPARISON:</text>
  <text x="855" y="200" font-family="Arial,sans-serif" font-size="9" fill="#334155">1. Blind Toggle (Stage 1):</text>
  <text x="865" y="214" font-family="Arial,sans-serif" font-size="9" fill="#b91c1c">   - Equal wear: YES | Fault tolerant: NO</text>

  <text x="855" y="235" font-family="Arial,sans-serif" font-size="9" fill="#334155">2. Fault-Aware (Stage 2):</text>
  <text x="865" y="249" font-family="Arial,sans-serif" font-size="9" fill="#047857">   - Equal wear: YES | Standby takeover: YES</text>

  <text x="855" y="270" font-family="Arial,sans-serif" font-size="9" fill="#334155">3. Duplex Lead/Lag (Stage 3):</text>
  <text x="865" y="284" font-family="Arial,sans-serif" font-size="9" fill="#047857">   - Wear balanced | Fault takeover | Peak assist: YES</text>

  <!-- Field Practicalities Card -->
  <rect x="845" y="320" width="305" height="155" rx="8" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
  <text x="997" y="342" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#065f46" text-anchor="middle">FIELD COMMISSIONING RULES</text>
  <text x="855" y="365" font-family="Arial,sans-serif" font-size="9" fill="#047857">• Exercise unselected pump weekly to prevent seal sticking</text>
  <text x="855" y="385" font-family="Arial,sans-serif" font-size="9" fill="#047857">• Stagger motor start times by 5-10s to avoid MCC inrush</text>
  <text x="855" y="405" font-family="Arial,sans-serif" font-size="9" fill="#047857">• Latch thermal overload trips until manual push-reset</text>
  <text x="855" y="425" font-family="Arial,sans-serif" font-size="9" fill="#047857">• Invert toggle on cycle completion (not cycle start)</text>
  <text x="855" y="445" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#065f46">• Always verify non-return valves (NRV) hold backpressure</text>

  <!-- Wiring connections -->
  <path d="M408 280 h22" fill="none" stroke="#227b92" stroke-width="2.5" marker-end="url(#arr)"/>
  <path d="M805 280 h25" fill="none" stroke="#bd7b24" stroke-width="2.5" marker-end="url(#arr-amber)"/>

  <!-- Legend -->
  <g font-family="Arial,sans-serif" font-size="13" fill="#294758">
    <text x="40" y="520">Solid Cyan: Water Piping &amp; Pump Flow (1200 GPM) | Amber / Red: 24V DC Control Interlocks &amp; Contactor Commands</text>
    <text x="40" y="542">Duty cycling equalizes operating hours across rotating equipment, preventing bearing brinelling and premature seal failure.</text>
  </g>
</svg>`;
