export const ESD_DELAYS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" width="100%" height="100%">
  <defs>
    <!-- Background grid -->
    <pattern id="esdGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#162235" stroke-width="0.8" opacity="0.65"/>
      <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#1c2d46" stroke-width="1.2" opacity="0.4"/>
    </pattern>

    <!-- Gradients -->
    <linearGradient id="vesselGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.95"/>
      <stop offset="50%" stop-color="#334155" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#1e293b" stop-opacity="0.95"/>
    </linearGradient>

    <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#0369a1" stop-opacity="0.5"/>
    </linearGradient>

    <linearGradient id="flareFlame" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#ef4444" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/>
    </linearGradient>

    <filter id="neonRed" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="neonAmber" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Dark Engineering Canvas -->
  <rect width="1200" height="560" fill="#070b14"/>
  <rect width="1200" height="560" fill="url(#esdGrid)"/>

  <!-- Outer Frame -->
  <rect x="18" y="18" width="1164" height="524" rx="10" fill="none" stroke="#1e293b" stroke-width="1.8"/>

  <!-- ==================== HEADER BAR ==================== -->
  <g transform="translate(40, 48)">
    <rect x="0" y="0" width="1120" height="42" rx="6" fill="#0c1322" stroke="#1e293b" stroke-width="1"/>
    <circle cx="20" cy="21" r="5" fill="#ef4444" filter="url(#neonRed)"/>
    <text x="36" y="25" fill="#f8fafc" font-family="ui-monospace, monospace" font-size="13" font-weight="bold" letter-spacing="1.5">
      FIG 1.1 // CHEMICAL PROCESS SKID EMERGENCY SHUTDOWN (ESD) &amp; STAGED DEPRESSURIZATION
    </text>
    <rect x="880" y="10" width="224" height="22" rx="4" fill="#141f32" stroke="#334155" stroke-width="0.8"/>
    <text x="992" y="25" fill="#f59e0b" font-family="ui-monospace, monospace" font-size="10" font-weight="600" text-anchor="middle" letter-spacing="1">
      IEC 61511 // SIL-2 ARCHITECTURE
    </text>
  </g>

  <!-- ==================== PROCESS VESSEL (RX-101) ==================== -->
  <g id="reactorVessel" transform="translate(380, 160)">
    <!-- Cooling Jacket Outer Shell -->
    <rect x="-18" y="20" width="236" height="200" rx="16" fill="url(#jacketGrad)" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="6 3"/>
    
    <!-- Main Pressure Vessel Body -->
    <rect x="0" y="0" width="200" height="240" rx="20" fill="url(#vesselGrad)" stroke="#64748b" stroke-width="2.5"/>
    <path d="M 0 30 Q 100 50 200 30" fill="none" stroke="#475569" stroke-width="1.5"/>
    <path d="M 0 210 Q 100 230 200 210" fill="none" stroke="#475569" stroke-width="1.5"/>

    <!-- Agitator Motor on top -->
    <rect x="85" y="-35" width="30" height="35" rx="3" fill="#0f172a" stroke="#94a3b8" stroke-width="1.5"/>
    <line x1="100" y1="0" x2="100" y2="190" stroke="#94a3b8" stroke-width="3"/>
    <path d="M 70 170 L 130 170 M 80 185 L 120 185" stroke="#94a3b8" stroke-width="2.5"/>

    <!-- Reactor Tag -->
    <rect x="40" y="90" width="120" height="36" rx="4" fill="#090d16" stroke="#38bdf8" stroke-width="1.2"/>
    <text x="100" y="108" fill="#f8fafc" font-family="ui-monospace, monospace" font-size="11" font-weight="bold" text-anchor="middle">RX-101</text>
    <text x="100" y="120" fill="#38bdf8" font-family="ui-monospace, monospace" font-size="8" text-anchor="middle">EXOTHERMIC VESSEL</text>

    <!-- Pressure Sensor (PT-101) -->
    <circle cx="215" cy="50" r="14" fill="#0f172a" stroke="#00f0ff" stroke-width="1.5"/>
    <line x1="200" y1="50" x2="201" y2="50" stroke="#00f0ff" stroke-width="2"/>
    <text x="215" y="54" fill="#00f0ff" font-family="ui-monospace, monospace" font-size="8" font-weight="bold" text-anchor="middle">PT</text>
    <text x="215" y="30" fill="#00f0ff" font-family="ui-monospace, monospace" font-size="9" font-weight="bold" text-anchor="middle">PT-101</text>
  </g>

  <!-- ==================== RAW FEED LINE & ISOLATION VALVE (XV-101) ==================== -->
  <g id="feedLine" transform="translate(120, 140)">
    <!-- Pipe from storage -->
    <path d="M 0 20 L 300 20 L 300 60" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
    <polygon points="120,20 108,14 108,26" fill="#f59e0b"/>
    <text x="30" y="10" fill="#f59e0b" font-family="ui-monospace, monospace" font-size="10" font-weight="bold">
      RAW CHEMICAL FEED (HIGH PRESSURE)
    </text>

    <!-- Fail-Safe Isolation Valve (XV-101) -->
    <g transform="translate(180, 20)">
      <!-- Valve body bowtie -->
      <polygon points="-16,-12 16,12 -16,12 16,-12" fill="#78350f" stroke="#f59e0b" stroke-width="1.8"/>
      <!-- Actuator Stem -->
      <line x1="0" y1="0" x2="0" y2="-22" stroke="#f59e0b" stroke-width="2"/>
      <!-- Spring-Return Diaphragm Dome -->
      <path d="M -16 -22 Q 0 -36 16 -22 Z" fill="#92400e" stroke="#f59e0b" stroke-width="1.8"/>
      <line x1="-16" y1="-22" x2="16" y2="-22" stroke="#f59e0b" stroke-width="1.8"/>
      <!-- Internal Spring symbol -->
      <path d="M -8 -25 L -4 -29 L 0 -25 L 4 -29 L 8 -25" fill="none" stroke="#ffffff" stroke-width="1.2"/>
      <!-- Solenoid Pilot -->
      <rect x="20" y="-32" width="22" height="16" rx="2" fill="#0f172a" stroke="#38bdf8" stroke-width="1"/>
      <text x="31" y="-21" fill="#38bdf8" font-family="ui-monospace, monospace" font-size="7" font-weight="bold" text-anchor="middle">SOV</text>
      <!-- Tag -->
      <text x="0" y="28" fill="#f59e0b" font-family="ui-monospace, monospace" font-size="10" font-weight="bold" text-anchor="middle">XV-101</text>
      <text x="0" y="40" fill="#ef4444" font-family="ui-monospace, monospace" font-size="8" font-weight="bold" text-anchor="middle">FAIL-CLOSE (0.0s)</text>
    </g>
  </g>

  <!-- ==================== COOLING JACKET LOOP & PUMP (P-101) ==================== -->
  <g id="coolingLoop">
    <!-- Supply from cooling tower / chiller -->
    <path d="M 330 460 L 330 330 L 362 330" fill="none" stroke="#38bdf8" stroke-width="4" stroke-dasharray="6 3"/>
    <polygon points="360,330 348,324 348,336" fill="#38bdf8"/>

    <!-- Cooling Return from top of jacket to pump -->
    <path d="M 598 220 L 680 220 L 680 430 L 530 430" fill="none" stroke="#0284c7" stroke-width="4"/>
    <polygon points="535,430 547,424 547,436" fill="#0284c7"/>

    <!-- Circulation Pump (P-101) -->
    <g transform="translate(480, 430)">
      <circle cx="0" cy="0" r="26" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="0" cy="0" r="10" fill="#0284c7"/>
      <!-- Tangential outlet line back to supply -->
      <path d="M 0 -26 L 0 -40 L -150 -40 L -150 30" fill="none" stroke="#38bdf8" stroke-width="4"/>
      <!-- Motor Box -->
      <rect x="28" y="-18" width="28" height="36" rx="4" fill="#0c4a6e" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="42" y="4" fill="#ffffff" font-family="ui-monospace, monospace" font-size="10" font-weight="bold" text-anchor="middle">M</text>
      <!-- Tag -->
      <text x="0" y="42" fill="#38bdf8" font-family="ui-monospace, monospace" font-size="10" font-weight="bold" text-anchor="middle">P-101</text>
      <text x="0" y="55" fill="#10b981" font-family="ui-monospace, monospace" font-size="8" font-weight="bold" text-anchor="middle">RUNS ON +4.0s (TOF)</text>
    </g>
  </g>

  <!-- ==================== EMERGENCY FLARE DEPRESSURIZATION LINE ==================== -->
  <g id="flareLine" transform="translate(530, 90)">
    <!-- Vapor blowdown pipe -->
    <path d="M 0 70 L 0 20 L 280 20 L 280 -10" fill="none" stroke="#ef4444" stroke-width="4.5" stroke-dasharray="8 4"/>
    <polygon points="280,5 274,17 286,17" fill="#ef4444"/>

    <!-- Blowdown Valve (BDV-101) -->
    <g transform="translate(140, 20)">
      <polygon points="-16,-12 16,12 -16,12 16,-12" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.8"/>
      <line x1="0" y1="0" x2="0" y2="-22" stroke="#ef4444" stroke-width="2"/>
      <!-- Spring-Return Open Diaphragm (Fail-Open) -->
      <path d="M -16 -22 Q 0 -36 16 -22 Z" fill="#991b1b" stroke="#ef4444" stroke-width="1.8"/>
      <line x1="-16" y1="-22" x2="16" y2="-22" stroke="#ef4444" stroke-width="1.8"/>
      <text x="0" y="28" fill="#ef4444" font-family="ui-monospace, monospace" font-size="10" font-weight="bold" text-anchor="middle">BDV-101</text>
      <text x="0" y="40" fill="#f59e0b" font-family="ui-monospace, monospace" font-size="8" font-weight="bold" text-anchor="middle">OPENS @ +1.0s</text>
    </g>

    <!-- Flare Stack Tip -->
    <g transform="translate(280, -35)">
      <rect x="-8" y="0" width="16" height="25" fill="#334155" stroke="#94a3b8" stroke-width="1.5"/>
      <!-- Flame plume -->
      <path d="M -12 0 Q 0 -35 12 0 Q 6 -15 0 -45 Q -6 -15 -12 0 Z" fill="url(#flareFlame)" filter="url(#neonRed)"/>
      <text x="0" y="-50" fill="#f59e0b" font-family="ui-monospace, monospace" font-size="9" font-weight="bold" text-anchor="middle">FLARE STACK</text>
    </g>
  </g>

  <!-- ==================== OPERATOR E-STOP CONTROL CONSOLE ==================== -->
  <g id="estopConsole" transform="translate(860, 160)">
    <rect x="0" y="0" width="280" height="210" rx="8" fill="#090d16" stroke="#ef4444" stroke-width="2" filter="url(#neonRed)"/>
    <rect x="0" y="0" width="280" height="28" rx="6" fill="#7f1d1d"/>
    <text x="140" y="19" fill="#ffffff" font-family="ui-monospace, monospace" font-size="10" font-weight="bold" text-anchor="middle" letter-spacing="1">
      EMERGENCY SHUTDOWN PANEL
    </text>

    <!-- Big Red Mushroom E-Stop Button (ESD-PB) -->
    <g transform="translate(75, 80)">
      <rect x="-24" y="-24" width="48" height="48" rx="8" fill="#450a0a" stroke="#ef4444" stroke-width="1.5"/>
      <!-- Yellow background ring -->
      <circle cx="0" cy="0" r="20" fill="#fef08a" stroke="#eab308" stroke-width="2"/>
      <!-- Red Mushroom Palm button -->
      <circle cx="0" cy="0" r="16" fill="#dc2626" stroke="#b91c1c" stroke-width="2" filter="url(#neonRed)"/>
      <path d="M -6 0 L 6 0 M 0 -6 L 0 6" stroke="#fecaca" stroke-width="2"/>
      <text x="0" y="34" fill="#f87171" font-family="ui-monospace, monospace" font-size="9" font-weight="bold" text-anchor="middle">ESD-PB (NC)</text>
      <text x="0" y="45" fill="#94a3b8" font-family="ui-monospace, monospace" font-size="8" text-anchor="middle">PULL-TO-RESET</text>
    </g>

    <!-- Blue/White Reset Button (RST-PB) -->
    <g transform="translate(205, 80)">
      <rect x="-20" y="-20" width="40" height="40" rx="6" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
      <circle cx="0" cy="0" r="13" fill="#0284c7" stroke="#38bdf8" stroke-width="1.8"/>
      <text x="0" y="34" fill="#38bdf8" font-family="ui-monospace, monospace" font-size="9" font-weight="bold" text-anchor="middle">RST-PB</text>
      <text x="0" y="45" fill="#94a3b8" font-family="ui-monospace, monospace" font-size="8" text-anchor="middle">MANUAL RESET</text>
    </g>

    <!-- Alarm Beacon Lamp -->
    <g transform="translate(140, 160)">
      <rect x="-28" y="-12" width="56" height="24" rx="4" fill="#18181b" stroke="#ef4444" stroke-width="1.5"/>
      <circle cx="0" cy="0" r="7" fill="#ef4444" filter="url(#neonRed)"/>
      <text x="0" y="24" fill="#ef4444" font-family="ui-monospace, monospace" font-size="8" font-weight="bold" text-anchor="middle">ALARM STROBE</text>
    </g>
  </g>

  <!-- ==================== SEQUENCE TIMING DIAGRAM ==================== -->
  <g transform="translate(860, 395)">
    <rect x="0" y="0" width="280" height="120" rx="6" fill="#0b1324" stroke="#334155" stroke-width="1"/>
    <text x="12" y="18" fill="#10b981" font-family="ui-monospace, monospace" font-size="10" font-weight="bold">
      ● STAGED ESD TRIP TIMELINE
    </text>
    <line x1="12" y1="26" x2="268" y2="26" stroke="#1e293b" stroke-width="1"/>
    
    <!-- T0: Feed Valve Instant Close -->
    <text x="12" y="44" fill="#ef4444" font-family="ui-monospace, monospace" font-size="8.5" font-weight="bold">
      T = 0.0s: XV-101 SHUTS (FEED CUT)
    </text>
    <!-- T1: Vent Valve Open -->
    <text x="12" y="64" fill="#f59e0b" font-family="ui-monospace, monospace" font-size="8.5">
      T = 1.0s: BDV-101 OPENS (VENT TO FLARE)
    </text>
    <!-- T2: Pump Cooldown Off-delay -->
    <text x="12" y="84" fill="#38bdf8" font-family="ui-monospace, monospace" font-size="8.5">
      T = 4.0s: P-101 STOPS (TOF COOLING DONE)
    </text>
    <!-- T3: Latched Safety State -->
    <text x="12" y="104" fill="#94a3b8" font-family="ui-monospace, monospace" font-size="8">
      STATUS: LATCHED UNTIL RST-PB PRESSED
    </text>
  </g>
</svg>
`;

export const ESD_DELAYS_SVG_DATA_URI =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ESD_DELAYS_SVG);
