export const SOLAR_LOGGING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" width="100%" height="100%">
  <defs>
    <!-- Background grid -->
    <pattern id="solarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#162235" stroke-width="0.8" opacity="0.65"/>
      <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#1c2d46" stroke-width="1.2" opacity="0.4"/>
    </pattern>

    <!-- Gradients -->
    <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.95"/>
      <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#ea580c" stop-opacity="0.8"/>
    </linearGradient>

    <linearGradient id="panelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.95"/>
      <stop offset="50%" stop-color="#0f172a" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.4"/>
    </linearGradient>

    <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#475569" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#334155" stop-opacity="0.5"/>
    </linearGradient>

    <filter id="neonAmber" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="neonEmerald" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Deep Blueprint Canvas -->
  <rect width="1200" height="560" fill="#070b14"/>
  <rect width="1200" height="560" fill="url(#solarGrid)"/>

  <!-- Outer Frame -->
  <rect x="18" y="18" width="1164" height="524" rx="10" fill="none" stroke="#1e293b" stroke-width="1.8"/>

  <!-- ==================== HEADER BAR ==================== -->
  <g transform="translate(40, 48)">
    <rect x="0" y="0" width="1120" height="42" rx="6" fill="#0c1322" stroke="#1e293b" stroke-width="1"/>
    <circle cx="20" cy="21" r="5" fill="#f59e0b" filter="url(#neonAmber)"/>
    <text x="36" y="25" fill="#f8fafc" font-family="ui-monospace, monospace" font-size="13" font-weight="bold" letter-spacing="1.5">
      FIG 1.1 // REMOTE SOLAR PV MICROGRID TELEMETRY &amp; MOVING AVERAGE DATA LOGGER
    </text>
    <rect x="880" y="10" width="224" height="22" rx="4" fill="#141f32" stroke="#334155" stroke-width="0.8"/>
    <text x="992" y="25" fill="#10b981" font-family="ui-monospace, monospace" font-size="10" font-weight="600" text-anchor="middle" letter-spacing="1">
      PV-STRING // 24VDC - 32VDC BUS
    </text>
  </g>

  <!-- ==================== SUN & DRIFTING CLOUDS (IRRADIANCE NOISE) ==================== -->
  <g id="sunAndClouds" transform="translate(100, 110)">
    <!-- Sun disk -->
    <circle cx="40" cy="40" r="28" fill="url(#sunGrad)" filter="url(#neonAmber)"/>
    <!-- Sun rays -->
    <line x1="40" y1="2" x2="40" y2="-6" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="40" y1="78" x2="40" y2="86" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="2" y1="40" x2="-6" y2="40" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="78" y1="40" x2="86" y2="40" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
    <text x="40" y="98" fill="#f59e0b" font-family="ui-monospace, monospace" font-size="8.5" font-weight="bold" text-anchor="middle">SOLAR IRRADIANCE</text>

    <!-- Drifting Cloud (Causes Voltage Dip) -->
    <g transform="translate(90, 15)">
      <path d="M 20 30 Q 15 15 35 15 Q 45 5 65 10 Q 85 5 95 20 Q 110 20 110 35 Q 110 50 90 50 L 25 50 Q 10 50 20 30 Z"
            fill="url(#cloudGrad)" stroke="#64748b" stroke-width="1.5"/>
      <!-- Wind / drift arrows -->
      <path d="M 5 28 L 22 28 M 12 28 L 18 24 M 12 28 L 18 32" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
      <text x="65" y="40" fill="#cbd5e1" font-family="ui-monospace, monospace" font-size="8" font-weight="bold" text-anchor="middle">CLOUD SHADOW</text>
    </g>
  </g>

  <!-- ==================== PHOTOVOLTAIC ARRAY (PV-101) ==================== -->
  <g id="pvArray" transform="translate(80, 240)">
    <!-- Rack Stanchions -->
    <line x1="30" y1="180" x2="60" y2="80" stroke="#475569" stroke-width="4"/>
    <line x1="190" y1="180" x2="220" y2="80" stroke="#475569" stroke-width="4"/>
    <line x1="20" y1="180" x2="240" y2="180" stroke="#334155" stroke-width="3"/> <!-- Ground line -->

    <!-- Tilted Solar Panel Glass Face (Isometric angle) -->
    <polygon points="40,140 220,140 260,40 80,40" fill="url(#panelGrad)" stroke="#00f0ff" stroke-width="2.2"/>

    <!-- Silicon cell grid lines -->
    <line x1="100" y1="140" x2="140" y2="40" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>
    <line x1="160" y1="140" x2="200" y2="40" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>
    <line x1="50" y1="115" x2="230" y2="115" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>
    <line x1="65" y1="90" x2="245" y2="90" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>
    <line x1="75" y1="65" x2="255" y2="65" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>

    <!-- Tag -->
    <rect x="90" y="195" width="100" height="28" rx="4" fill="#0b1324" stroke="#00f0ff" stroke-width="1"/>
    <text x="140" y="212" fill="#00f0ff" font-family="ui-monospace, monospace" font-size="9" font-weight="bold" text-anchor="middle">PV-101 STRING</text>
    <text x="140" y="222" fill="#64748b" font-family="ui-monospace, monospace" font-size="7.5" text-anchor="middle">VOC: 36V // VMP: 28V</text>
  </g>

  <!-- ==================== COMBINER & VOLTAGE SENSOR (VT-101) ==================== -->
  <g id="transducer" transform="translate(360, 230)">
    <!-- Combiner Enclosure -->
    <rect x="0" y="0" width="110" height="150" rx="6" fill="#090d16" stroke="#334155" stroke-width="1.8"/>
    <rect x="0" y="0" width="110" height="24" rx="4" fill="#1e293b"/>
    <text x="55" y="16" fill="#f8fafc" font-family="ui-monospace, monospace" font-size="8.5" font-weight="bold" text-anchor="middle">JB-101 COMBINER</text>

    <!-- DC Disconnect Switch (SW-101) -->
    <circle cx="35" cy="55" r="14" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5"/>
    <line x1="28" y1="55" x2="42" y2="55" stroke="#f59e0b" stroke-width="2"/>
    <text x="35" y="80" fill="#f59e0b" font-family="ui-monospace, monospace" font-size="7.5" font-weight="bold" text-anchor="middle">SW-101</text>

    <!-- Voltage Transducer (VT-101) -->
    <circle cx="80" cy="55" r="14" fill="#0f172a" stroke="#00f0ff" stroke-width="1.5"/>
    <text x="80" y="58" fill="#00f0ff" font-family="ui-monospace, monospace" font-size="7.5" font-weight="bold" text-anchor="middle">VT</text>
    <text x="80" y="80" fill="#00f0ff" font-family="ui-monospace, monospace" font-size="7.5" font-weight="bold" text-anchor="middle">VT-101</text>

    <!-- Terminal Strip -->
    <rect x="15" y="100" width="80" height="30" fill="#0b1324" stroke="#475569" stroke-width="1"/>
    <circle cx="30" cy="115" r="4" fill="#ef4444"/>
    <circle cx="55" cy="115" r="4" fill="#1e293b" stroke="#ffffff" stroke-width="1"/>
    <circle cx="80" cy="115" r="4" fill="#38bdf8"/>
    <text x="55" y="142" fill="#64748b" font-family="ui-monospace, monospace" font-size="7" text-anchor="middle">0 - 10V DC OUTPUT</text>
  </g>

  <!-- Wiring from PV array to Combiner Box -->
  <path d="M 280 290 L 360 290" stroke="#f59e0b" stroke-width="3" stroke-dasharray="4 2"/>
  <path d="M 280 300 L 360 300" stroke="#64748b" stroke-width="3"/>

  <!-- ==================== SIGNAL WAVEFORM COMPARISON DISPLAY ==================== -->
  <g id="waveformDisplay" transform="translate(520, 140)">
    <rect x="0" y="0" width="360" height="240" rx="8" fill="#060911" stroke="#334155" stroke-width="2"/>
    <rect x="0" y="0" width="360" height="28" rx="6" fill="#0b1324"/>
    <text x="14" y="18" fill="#f8fafc" font-family="ui-monospace, monospace" font-size="9.5" font-weight="bold">
      SIGNAL CONDITIONING: RAW VS. SMOOTHED
    </text>

    <!-- Graph Axes & Grid -->
    <g transform="translate(40, 45)">
      <line x1="0" y1="150" x2="300" y2="150" stroke="#334155" stroke-width="1.5"/> <!-- X Axis -->
      <line x1="0" y1="0" x2="0" y2="150" stroke="#334155" stroke-width="1.5"/>   <!-- Y Axis -->

      <line x1="0" y1="30" x2="300" y2="30" stroke="#1e293b" stroke-width="1" stroke-dasharray="2 2"/>
      <line x1="0" y1="75" x2="300" y2="75" stroke="#1e293b" stroke-width="1" stroke-dasharray="2 2"/>
      <line x1="0" y1="120" x2="300" y2="120" stroke="#1e293b" stroke-width="1" stroke-dasharray="2 2"/>

      <text x="-8" y="34" fill="#64748b" font-family="ui-monospace, monospace" font-size="7.5" text-anchor="end">32V</text>
      <text x="-8" y="79" fill="#ef4444" font-family="ui-monospace, monospace" font-size="7.5" text-anchor="end">24V</text>
      <text x="-8" y="124" fill="#64748b" font-family="ui-monospace, monospace" font-size="7.5" text-anchor="end">16V</text>

      <!-- 24V Threshold Line (Cutoff) -->
      <line x1="0" y1="75" x2="300" y2="75" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="6 3"/>

      <!-- RAW JAGGED WAVEFORM (Orange / Noise) -->
      <path d="M 0 60 L 25 55 L 40 85 L 55 45 L 75 105 L 90 60 L 115 110 L 135 65 L 160 50 L 180 95 L 205 55 L 230 50 L 255 85 L 280 55 L 300 50"
            fill="none" stroke="#f59e0b" stroke-width="1.8" opacity="0.85"/>

      <!-- SMOOTHED MOVING AVERAGE WAVEFORM (Emerald / Filtered) -->
      <path d="M 0 58 Q 50 68 100 82 Q 150 70 200 62 Q 250 65 300 52"
            fill="none" stroke="#10b981" stroke-width="3" filter="url(#neonEmerald)"/>

      <text x="150" y="165" fill="#64748b" font-family="ui-monospace, monospace" font-size="8" text-anchor="middle">TIME (SECONDS) →</text>
    </g>

    <!-- Graph Legend -->
    <g transform="translate(14, 218)">
      <line x1="0" y1="5" x2="20" y2="5" stroke="#f59e0b" stroke-width="2"/>
      <text x="26" y="8" fill="#f59e0b" font-family="ui-monospace, monospace" font-size="8">RAW VOLTAGE (UNFILTERED JITTER)</text>

      <line x1="190" y1="5" x2="210" y2="5" stroke="#10b981" stroke-width="2.5"/>
      <text x="216" y="8" fill="#10b981" font-family="ui-monospace, monospace" font-size="8" font-weight="bold">SMOOTHED (AVERAGE)</text>
    </g>
  </g>

  <!-- Wiring from Combiner to RTU Display -->
  <path d="M 470 305 L 520 305" stroke="#00f0ff" stroke-width="2.5" stroke-linecap="round"/>

  <!-- ==================== INDUSTRIAL RTU & BATTERY CHARGE SKID ==================== -->
  <g id="rtuSkid" transform="translate(920, 140)">
    <rect x="0" y="0" width="220" height="240" rx="8" fill="#090d16" stroke="#10b981" stroke-width="2"/>
    <rect x="0" y="0" width="220" height="28" rx="6" fill="#064e3b"/>
    <text x="110" y="18" fill="#ffffff" font-family="ui-monospace, monospace" font-size="9.5" font-weight="bold" text-anchor="middle">
      RTU // CHARGE MANAGER
    </text>

    <!-- Battery Charge Contactor (KM-101) -->
    <g transform="translate(30, 50)">
      <rect x="0" y="0" width="45" height="40" rx="4" fill="#0f172a" stroke="#10b981" stroke-width="1.5"/>
      <circle cx="22" cy="20" r="10" fill="#10b981" filter="url(#neonEmerald)"/>
      <text x="22" y="24" fill="#022c22" font-family="ui-monospace, monospace" font-size="8" font-weight="bold" text-anchor="middle">KM</text>
      <text x="22" y="52" fill="#10b981" font-family="ui-monospace, monospace" font-size="7.5" font-weight="bold" text-anchor="middle">KM-101</text>
    </g>

    <!-- Cloud Telemetry Antenna (ANT-101) -->
    <g transform="translate(150, 45)">
      <line x1="20" y1="45" x2="20" y2="10" stroke="#38bdf8" stroke-width="2.5"/>
      <line x1="10" y1="10" x2="30" y2="10" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="20" cy="5" r="4" fill="#0284c7"/>
      <!-- Radiating wireless waves -->
      <path d="M 10 -2 A 12 12 0 0 1 30 -2" fill="none" stroke="#38bdf8" stroke-width="1.2"/>
      <path d="M 5 -8 A 18 18 0 0 1 35 -8" fill="none" stroke="#38bdf8" stroke-width="1.2"/>
      <text x="20" y="58" fill="#38bdf8" font-family="ui-monospace, monospace" font-size="7.5" font-weight="bold" text-anchor="middle">ANT-101</text>
    </g>

    <!-- Battery Bank (BESS-101) -->
    <g transform="translate(25, 120)">
      <rect x="0" y="0" width="170" height="70" rx="4" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
      <!-- Cell blocks -->
      <rect x="15" y="15" width="30" height="40" rx="2" fill="#1e293b" stroke="#10b981" stroke-width="1"/>
      <rect x="55" y="15" width="30" height="40" rx="2" fill="#1e293b" stroke="#10b981" stroke-width="1"/>
      <rect x="95" y="15" width="30" height="40" rx="2" fill="#1e293b" stroke="#10b981" stroke-width="1"/>
      <rect x="135" y="15" width="20" height="40" rx="2" fill="#1e293b" stroke="#10b981" stroke-width="1"/>
      <text x="85" y="78" fill="#10b981" font-family="ui-monospace, monospace" font-size="8" font-weight="bold" text-anchor="middle">BESS-101 // 24V 200AH</text>
    </g>

    <!-- Status text -->
    <text x="110" y="215" fill="#f8fafc" font-family="ui-monospace, monospace" font-size="8" text-anchor="middle">
      MQTT // 500ms TELEMETRY LOG
    </text>
  </g>

  <!-- Wiring from Display to RTU -->
  <path d="M 880 260 L 920 260" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>

  <!-- ==================== BOTTOM ENGINEERING LEGEND ==================== -->
  <g transform="translate(80, 420)">
    <rect x="0" y="0" width="1040" height="90" rx="6" fill="#0b1324" stroke="#334155" stroke-width="1"/>
    <text x="16" y="22" fill="#f59e0b" font-family="ui-monospace, monospace" font-size="10" font-weight="bold">
      ● SOLAR SIGNAL CONDITIONING RULES
    </text>
    <line x1="16" y1="28" x2="1024" y2="28" stroke="#1e293b" stroke-width="1"/>

    <text x="16" y="46" fill="#94a3b8" font-family="ui-monospace, monospace" font-size="8.5">
      1. TRANSIENT REJECTION: Passing clouds cause instantaneous 40% voltage dips. Raw readings cause false alarms and contactor chattering.
    </text>
    <text x="16" y="62" fill="#10b981" font-family="ui-monospace, monospace" font-size="8.5" font-weight="bold">
      2. MOVING AVERAGE: 5-sample smoothing eliminates cloud jitter while tracking true solar output trends with minimal phase delay.
    </text>
    <text x="16" y="78" fill="#38bdf8" font-family="ui-monospace, monospace" font-size="8.5">
      3. TELEMETRY EFFICIENCY: DATA_LOG samples every 500ms to preserve cellular bandwidth and avoid memory overflow on remote microgrids.
    </text>
  </g>
</svg>
`;

export const SOLAR_LOGGING_SVG_DATA_URI =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SOLAR_LOGGING_SVG);
