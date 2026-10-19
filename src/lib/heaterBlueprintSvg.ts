export const HEATER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" role="img" aria-labelledby="t d">
  <title id="t">Heater control and independent limit path</title>
  <desc id="d">Heater control schematic showing setpoint, TIC-101, PWM, SSR, heater, temperature feedback, and a separate high-temperature power isolation path.</desc>
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
    <text x="38" y="42" font-size="24" font-weight="bold">02 / HEATER CONTROL &amp; INDEPENDENT LIMIT PATH</text>
    <text x="38" y="70" font-size="15">Functional Schematic — Closed-Loop PI, Time-Proportioned PWM &amp; Hardwired Thermal Cutout</text>
  </g>

  <!-- Control Layer Box -->
  <rect x="38" y="100" width="670" height="180" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2" stroke-dasharray="4 4"/>
  <text x="52" y="125" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c">PLC / CONTROLLER BOUNDARY (TIC-101)</text>

  <!-- SP Block -->
  <rect x="58" y="150" width="110" height="90" rx="8" fill="#e8f4f8" stroke="#23495c" stroke-width="2"/>
  <text x="113" y="185" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#142c3d" text-anchor="middle">SETPOINT</text>
  <text x="113" y="208" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="#227b92" text-anchor="middle">SP = 60°C</text>
  <text x="113" y="226" font-family="Arial,sans-serif" font-size="11" fill="#5a7184" text-anchor="middle">Recipe Target</text>

  <!-- Error / PI Controller Block -->
  <rect x="220" y="140" width="220" height="110" rx="8" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <text x="330" y="165" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#142c3d" text-anchor="middle">TIC-101 / PI ENGINE</text>
  <text x="330" y="188" font-family="Arial,sans-serif" font-size="12" fill="#23495c" text-anchor="middle">e = SP − PV | Kp=4, Ki=0.1</text>
  <rect x="235" y="200" width="190" height="34" rx="4" fill="#e6f4ea" stroke="#137333" stroke-width="1.5"/>
  <text x="330" y="222" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#137333" text-anchor="middle">ANTI-WINDUP LIMITS: 0–100%</text>

  <!-- PWM Block -->
  <rect x="490" y="140" width="190" height="110" rx="8" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <text x="585" y="165" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#142c3d" text-anchor="middle">PWM-101 / TIME PROP</text>
  <text x="585" y="188" font-family="Arial,sans-serif" font-size="12" fill="#23495c" text-anchor="middle">Period = 2,000 ms</text>
  <path d="M515 220 h20 v-18 h25 v18 h35 v-18 h25 v18 h20" fill="none" stroke="#227b92" stroke-width="2.5"/>

  <!-- Lines inside control -->
  <path d="M168 195 h52" fill="none" stroke="#bd7b24" stroke-width="2.5" marker-end="url(#arr-amber)"/>
  <path d="M440 195 h50" fill="none" stroke="#bd7b24" stroke-width="2.5" marker-end="url(#arr-amber)"/>

  <!-- 480V Power Bus and Hardwired Safety Contactor M-101 -->
  <rect x="760" y="90" width="120" height="60" rx="8" fill="#fef2f2" stroke="#b91c1c" stroke-width="2"/>
  <text x="820" y="115" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#b91c1c" text-anchor="middle">SAFETY M-101</text>
  <text x="820" y="135" font-family="Arial,sans-serif" font-size="11" fill="#7f1d1d" text-anchor="middle">Emergency Contactor</text>

  <text x="760" y="55" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#142c3d">480V AC 3Φ MAINS</text>
  <path d="M790 60 v30" fill="none" stroke="#23495c" stroke-width="4"/>
  <path d="M820 60 v30" fill="none" stroke="#23495c" stroke-width="4"/>
  <path d="M850 60 v30" fill="none" stroke="#23495c" stroke-width="4"/>

  <!-- Power Line from M-101 to SSR-101 -->
  <path d="M820 150 v35" fill="none" stroke="#23495c" stroke-width="4"/>

  <!-- SSR-101 Block -->
  <rect x="750" y="185" width="140" height="90" rx="8" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <text x="820" y="210" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#142c3d" text-anchor="middle">SSR-101</text>
  <text x="820" y="230" font-family="Arial,sans-serif" font-size="12" fill="#5a7184" text-anchor="middle">Solid-State Relay</text>
  <text x="820" y="252" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#227b92" text-anchor="middle">Optically Isolated</text>

  <!-- PWM to SSR gate line -->
  <path d="M680 195 h70" fill="none" stroke="#bd7b24" stroke-width="2.5" stroke-dasharray="6 4" marker-end="url(#arr-amber)"/>
  <text x="715" y="185" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#bd7b24" text-anchor="middle">PWM</text>

  <!-- Switched Power to Vessel Heater HTR-101 -->
  <path d="M820 275 v60" fill="none" stroke="#23495c" stroke-width="4" marker-end="url(#arr)"/>
  <text x="835" y="310" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c">Switched 480V</text>

  <!-- Vessel / Thermal Plant TK-101 -->
  <rect x="680" y="335" width="280" height="160" rx="16" fill="#ffffff" stroke="#23495c" stroke-width="3"/>
  <rect x="700" y="355" width="240" height="120" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
  <text x="820" y="380" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="#142c3d" text-anchor="middle">JACKET VESSEL TK-101</text>
  <text x="820" y="405" font-family="Arial,sans-serif" font-size="12" fill="#475569" text-anchor="middle">Well-Mixed Liquid Chamber</text>

  <!-- Heater Coils inside vessel -->
  <path d="M720 440 q15 -25 30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="#dc2626" stroke-width="3"/>
  <text x="820" y="465" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#dc2626" text-anchor="middle">HTR-101 Heating Elements</text>

  <!-- Model equation label -->
  <rect x="695" y="500" width="250" height="24" rx="4" fill="#e2e8f0"/>
  <text x="820" y="516" font-family="Courier,monospace" font-size="11" fill="#1e293b" text-anchor="middle">30·dT/dt = 20 + 0.8u − L − T</text>

  <!-- Temperature Transmitter TT-101 -->
  <circle cx="510" cy="415" r="30" fill="#ffffff" stroke="#23495c" stroke-width="2.5"/>
  <text x="510" y="412" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#142c3d" text-anchor="middle">TT-101</text>
  <text x="510" y="428" font-family="Arial,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">RTD Sensor</text>

  <!-- Sensing probe from vessel to TT-101 -->
  <path d="M700 415 h-160" fill="none" stroke="#23495c" stroke-width="2.5"/>

  <!-- Feedback Line from TT-101 to TIC-101 -->
  <path d="M480 415 h-200 v-165 h-25" fill="none" stroke="#bd7b24" stroke-width="2.5" stroke-dasharray="6 4" marker-end="url(#arr-amber)"/>
  <text x="290" y="360" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#bd7b24">PV Feedback (°C)</text>

  <!-- Independent High-Limit Safety Path (TSHH-101) -->
  <circle cx="1070" cy="415" r="32" fill="#fef2f2" stroke="#b91c1c" stroke-width="2.5"/>
  <text x="1070" y="412" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">TSHH-101</text>
  <text x="1070" y="428" font-family="Arial,sans-serif" font-size="10" fill="#7f1d1d" text-anchor="middle">Cutout &gt;95°C</text>

  <!-- Independent probe to vessel -->
  <path d="M940 415 h98" fill="none" stroke="#b91c1c" stroke-width="2.5"/>

  <!-- Independent hardwired trip wire to M-101 -->
  <path d="M1070 383 v-263 h-190" fill="none" stroke="#b91c1c" stroke-width="2.5" stroke-dasharray="7 5" marker-end="url(#arr-red)"/>
  <text x="1010" y="105" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#b91c1c" text-anchor="middle">HARDWIRED TRIP</text>

  <!-- Footer Legend -->
  <g font-family="Arial,sans-serif" font-size="13" fill="#294758">
    <text x="40" y="525">Thick Blue: 480V Electrical Power | Dashed Amber: Low-Voltage Analog/Digital Signals | Dashed Red: Hardwired Safety Interlock</text>
    <text x="40" y="545">Actuator saturation at 100% does not guarantee controller state bounds. Anti-windup clamping is required inside the PI algorithm.</text>
  </g>
</svg>`;
