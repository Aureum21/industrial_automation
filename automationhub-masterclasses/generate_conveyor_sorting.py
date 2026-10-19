import json
from pathlib import Path
from textwrap import dedent
from urllib.parse import quote

OUT = Path(__file__).resolve().parent

def md(text): return {'type': 'markdown', 'content': dedent(text).strip()}
def note(title, text, variant='info'): return {'type': 'callout', 'variant': variant, 'title': title, 'text': text}
def lab(n, title, dsl): return {'type': 'lab', 'title': title, 'step': f'Stage {n} of 3', 'height': 600 if n == 3 else 520, 'dsl': dedent(dsl).strip()}
def image(svg, alt, caption): return {'type': 'image', 'src': 'data:image/svg+xml;charset=utf-8,' + quote(svg, safe=''), 'alt': alt, 'caption': caption}

conveyor_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" role="img" aria-labelledby="t d">
  <title id="t">Automated Conveyor Sorting System and Diverter Tracking</title>
  <desc id="d">Engineering schematic of a high-speed parcel sorting conveyor with inspection photoeyes, shift register zone tracking, pneumatic diverter cylinder, and downstream anti-jam watchdog.</desc>
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
    <text x="38" y="42" font-size="24" font-weight="bold">07 / AUTOMATED CONVEYOR SORTING &amp; SHIFT-REGISTER TRACKING</text>
    <text x="38" y="70" font-size="15">Multi-Zone Parcel Displacement, Pneumatic Diverter Timing &amp; Jam Watchdog Protection</text>
  </g>

  <rect x="38" y="100" width="370" height="390" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <rect x="50" y="112" width="346" height="26" rx="4" fill="#e8f4f8"/>
  <text x="223" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c" text-anchor="middle">SORTING CONVEYOR LINE (CV-101)</text>

  <rect x="55" y="240" width="336" height="45" rx="4" fill="#334155" stroke="#1e293b" stroke-width="2"/>
  <line x1="55" y1="262" x2="391" y2="262" stroke="#475569" stroke-width="1.5" stroke-dasharray="8 6"/>

  <circle cx="65" cy="262" r="14" fill="#64748b" stroke="#1e293b" stroke-width="2"/>
  <circle cx="381" cy="262" r="14" fill="#64748b" stroke="#1e293b" stroke-width="2"/>

  <line x1="140" y1="230" x2="140" y2="295" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
  <line x1="220" y1="230" x2="220" y2="295" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
  <line x1="300" y1="230" x2="300" y2="295" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>

  <text x="100" y="222" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0284c7" text-anchor="middle">ZONE 1 (SCAN)</text>
  <text x="180" y="222" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#64748b" text-anchor="middle">ZONE 2</text>
  <text x="260" y="222" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#64748b" text-anchor="middle">ZONE 3</text>
  <text x="340" y="222" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#dc2626" text-anchor="middle">ZONE 4 (DIVERT)</text>

  <circle cx="100" cy="175" r="10" fill="#f8fafc" stroke="#0284c7" stroke-width="2"/>
  <text x="100" y="179" font-family="Arial,sans-serif" font-size="8" font-weight="bold" fill="#0284c7" text-anchor="middle">PE</text>
  <path d="M100 185 v50" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="2 2"/>
  <text x="100" y="160" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#0284c7" text-anchor="middle">PE-101 (DEFECT)</text>

  <rect x="165" y="235" width="30" height="22" rx="2" fill="#ef4444" stroke="#b91c1c" stroke-width="1.5"/>
  <text x="180" y="250" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">DEF</text>

  <rect x="245" y="235" width="30" height="22" rx="2" fill="#10b981" stroke="#047857" stroke-width="1.5"/>
  <text x="260" y="250" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">OK</text>

  <rect x="330" y="165" width="22" height="65" rx="3" fill="#cbd5e1" stroke="#23495c" stroke-width="2"/>
  <rect x="334" y="215" width="14" height="20" fill="#dc2626"/>
  <path d="M341 235 v45" fill="none" stroke="#dc2626" stroke-width="3" marker-end="url(#arr-red)"/>
  <text x="341" y="155" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#dc2626" text-anchor="middle">SOL-101 DIVERTER</text>

  <path d="M330 290 l25 45 h45" fill="none" stroke="#dc2626" stroke-width="3"/>
  <text x="375" y="350" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#dc2626">REJECT CHUTE</text>

  <circle cx="380" cy="315" r="9" fill="#f8fafc" stroke="#f59e0b" stroke-width="2"/>
  <text x="380" y="318" font-family="Arial,sans-serif" font-size="7" font-weight="bold" fill="#f59e0b" text-anchor="middle">JAM</text>
  <text x="340" y="395" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#b45309">PE-102 JAM SENSOR</text>

  <rect x="50" y="415" width="346" height="65" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <circle cx="80" cy="448" r="16" fill="#f1f5f9" stroke="#23495c" stroke-width="2"/>
  <path d="M72 456 v-16 l16 8 Z" fill="#227b92"/>
  <text x="110" y="442" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#142c3d">MOTOR DRIVE M-101 (480V VFD / 60 FPM)</text>
  <text x="110" y="460" font-family="Arial,sans-serif" font-size="9" fill="#64748b">Interlocked to Diverter Reed Switches &amp; Anti-Jam Watchdog</text>

  <rect x="430" y="100" width="375" height="390" rx="12" fill="#ffffff" stroke="#0f766e" stroke-width="2.5" stroke-dasharray="5 5"/>
  <rect x="445" y="112" width="345" height="26" rx="4" fill="#ccfbf1"/>
  <text x="617" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0f766e" text-anchor="middle">PLC SORTING &amp; TRACKING ENGINE</text>

  <rect x="450" y="155" width="335" height="85" rx="8" fill="#fef2f2" stroke="#dc2626" stroke-width="1.5"/>
  <text x="617" y="176" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#991b1b" text-anchor="middle">1. THE FIXED TIMER DELAY FLAW (TON/TOF)</text>
  <text x="465" y="196" font-family="Arial,sans-serif" font-size="10" fill="#7f1d1d">• Single timer delays diverter by travel time (e.g. 2.0s)</text>
  <text x="465" y="213" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b91c1c">⚠ MULTI-BOX HAZARD: Second defect overwrites/resets timer!</text>
  <text x="465" y="230" font-family="Arial,sans-serif" font-size="10" fill="#991b1b">• Only safe when exactly ONE parcel occupies the belt</text>

  <rect x="450" y="250" width="335" height="110" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
  <text x="617" y="272" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#14532d" text-anchor="middle">2. SHIFT REGISTER MULTI-ZONE TRACKING</text>
  <text x="465" y="294" font-family="Arial,sans-serif" font-size="10" fill="#166534">• Conveyor travel clock shifts bits through discrete zones</text>
  <text x="465" y="311" font-family="Arial,sans-serif" font-size="10" fill="#166534">• Zone 1: Scan (PE) → Zone 2: Accel → Zone 3 → Zone 4</text>
  <text x="465" y="328" font-family="Arial,sans-serif" font-size="10" fill="#166534">• Multiple parcels tracked simultaneously in pipeline</text>
  <text x="465" y="346" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#15803d">✔ 100% sort accuracy at full line rate (60 boxes/min)</text>

  <rect x="450" y="370" width="335" height="105" rx="8" fill="#fffbeb" stroke="#d97706" stroke-width="1.5"/>
  <text x="617" y="392" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#92400e" text-anchor="middle">3. PNEUMATIC SAFETY &amp; JAM WATCHDOG</text>
  <text x="465" y="413" font-family="Arial,sans-serif" font-size="10" fill="#78350f">• Reed switches verify cylinder full-retract before next box</text>
  <text x="465" y="430" font-family="Arial,sans-serif" font-size="10" fill="#78350f">• PE-102 Jam Sensor: If blocked &gt; 1.5s → Line Emergency Stop</text>
  <text x="465" y="447" font-family="Arial,sans-serif" font-size="10" fill="#78350f">• Latches conveyor motor cutout until manual operator reset</text>
  <text x="465" y="464" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b45309">✔ Prevents box crushing, belt burn &amp; equipment pile-up</text>

  <rect x="830" y="100" width="335" height="390" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <rect x="845" y="112" width="305" height="26" rx="4" fill="#e8f4f8"/>
  <text x="997" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c" text-anchor="middle">SORTING CONTROLS COMPARISON</text>

  <rect x="845" y="155" width="305" height="150" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="855" y="178" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#142c3d">TRACKING METHOD COMPARISON:</text>
  <text x="855" y="200" font-family="Arial,sans-serif" font-size="9" fill="#334155">1. Fixed Delay Timer (Stage 1):</text>
  <text x="865" y="214" font-family="Arial,sans-serif" font-size="9" fill="#b91c1c">   - Single box: OK | Multi-box queue: FAILS</text>

  <text x="855" y="235" font-family="Arial,sans-serif" font-size="9" fill="#334155">2. Shift Register (Stage 2):</text>
  <text x="865" y="249" font-family="Arial,sans-serif" font-size="9" fill="#047857">   - Multi-box pipeline: 100% accurate</text>

  <text x="855" y="270" font-family="Arial,sans-serif" font-size="9" fill="#334155">3. Jam Watchdog &amp; Reed Safety (Stage 3):</text>
  <text x="865" y="284" font-family="Arial,sans-serif" font-size="9" fill="#047857">   - Auto line cutout on package jam &amp; cylinder stall</text>

  <rect x="845" y="320" width="305" height="155" rx="8" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
  <text x="997" y="342" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#065f46" text-anchor="middle">FIELD COMMISSIONING RULES</text>
  <text x="855" y="365" font-family="Arial,sans-serif" font-size="9" fill="#047857">• Filter optical photoeyes with 20ms debounce timers</text>
  <text x="855" y="385" font-family="Arial,sans-serif" font-size="9" fill="#047857">• Base tracking clocks on belt distance, not elapsed time</text>
  <text x="855" y="405" font-family="Arial,sans-serif" font-size="9" fill="#047857">• Set diverter pulse width equal to carton passage time</text>
  <text x="855" y="425" font-family="Arial,sans-serif" font-size="9" fill="#047857">• Install mechanical guide rails to prevent skewed cartons</text>
  <text x="855" y="445" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#065f46">• Latch jam alarms to prevent automatic restarting</text>

  <path d="M408 280 h22" fill="none" stroke="#227b92" stroke-width="2.5" marker-end="url(#arr)"/>
  <path d="M805 280 h25" fill="none" stroke="#bd7b24" stroke-width="2.5" marker-end="url(#arr-amber)"/>

  <g font-family="Arial,sans-serif" font-size="13" fill="#294758">
    <text x="40" y="520">Solid Cyan: Belt Motion &amp; Parcel Flow | Amber / Red: Optical Photoeye Signals &amp; Pneumatic Solenoid Commands</text>
    <text x="40" y="542">Shift register tracking decouples parcel sort decisions from conveyor speed variations, ensuring zero misplaced packages.</text>
  </g>
</svg>'''

dsl1 = '''circuit "Stage 1 - The Fixed Timer Delay Flaw" version 1 {
  sensor: INPUT(label="PE-101 Defect Photoeye", value=false)
  belt_running: INPUT(label="Conveyor Motor Running", value=true)
  pulse: TOF(label="Sensor Pulse Capture", duration=600)
  active_defect: AND()
  travel_delay: TON(label="Fixed Travel Delay (2.0s)", duration=2000)
  divert_pulse: TOF(label="Diverter Arm Stroke (0.8s)", duration=800)
  diverter: OUTPUT(label="Pneumatic Diverter Arm")
  hazard_alert: OUTPUT(label="Multi-Package Collision Risk")

  sensor.Q -> pulse.A
  pulse.Q -> active_defect.A
  belt_running.Q -> active_defect.B
  active_defect.Q -> travel_delay.A
  travel_delay.Q -> divert_pulse.A
  divert_pulse.Q -> diverter.A
  active_defect.Q -> hazard_alert.A
}'''

dsl2 = '''circuit "Stage 2 - Synchronous Zone Tracking via Shift Register" version 1 {
  defect_pe: INPUT(label="PE-101 Defect Photoeye", value=false)
  belt_run: INPUT(label="Conveyor Drive Running", value=true)
  belt_tick: CLOCK(label="Belt Travel Zone Pulses", onTime=400, offTime=400)
  reset_reg: INPUT(label="Clear Tracking Register", value=false)

  dir_low: LOW()
  gate_clk: AND()
  shift: SHIFT_REGISTER(label="4-Zone Conveyor Tracking", length=4)
  divert_pulse: TOF(label="Diverter Fire Pulse", duration=600)
  diverter: OUTPUT(label="Zone 4 Reject Diverter Solenoid")
  box_at_reject: OUTPUT(label="Defect Box Arrived at Zone 4")

  belt_run.Q -> gate_clk.A
  belt_tick.Q -> gate_clk.B

  defect_pe.Q -> shift.D
  gate_clk.Q -> shift.CLK
  dir_low.Q -> shift.DIR
  reset_reg.Q -> shift.R

  shift.Q -> box_at_reject.A
  shift.Q -> divert_pulse.A
  divert_pulse.Q -> diverter.A
}'''

dsl3 = '''circuit "Stage 3 - Pneumatic Diverter with Jam Watchdog" version 1 {
  run_cmd: INPUT(label="Conveyor Start Request", value=true)
  pe_jam: INPUT(label="PE-102 Diverter Jam Photoeye", value=false)
  diverter_fwd: INPUT(label="ZSE Diverter Full Extend Sw", value=true)
  reset_pb: INPUT(label="Operator Reset Pushbutton", value=false)

  jam_timer: TON(label="Jam Detection Timer (1.5s)", duration=1500)
  jam_latch: RS_LATCH(label="Conveyor Jam Cutout Latch")
  jam_safe: NOT()

  conv_permit: AND(label="Conveyor Run Permissive")
  motor_run: OUTPUT(label="Conveyor Drive Contactor (KM-101)")
  jam_alarm: OUTPUT(label="Carton Jam Alarm (LINE STOP)")

  pe_jam.Q -> jam_timer.A
  jam_timer.Q -> jam_latch.S
  reset_pb.Q -> jam_latch.R

  jam_latch.Q -> jam_alarm.A
  jam_latch.Q -> jam_safe.A

  run_cmd.Q -> conv_permit.A
  jam_safe.Q -> conv_permit.B
  conv_permit.Q -> motor_run.A
}'''

article_data = {
    'slug': 'conveyor-sorting',
    'title': 'Automated Conveyor Sorting: Shift-Register Tracking, Diverter Timing & Jam Watchdogs',
    'excerpt': 'An intermediate masterclass on packaging and material handling automation: why fixed timers fail when multiple cartons queue up, implementing multi-zone shift register tracking, and engineering pneumatic diverters with jam-detection interlocks.',
    'author': 'Mike Systems & AutomationHub Team',
    'date': 'Sep 22',
    'readingTime': '12 min read + 15 min labs',
    'tag': 'Intermediate',
    'views': 11450,
    'heroImage': 'data:image/svg+xml;charset=utf-8,' + quote(conveyor_svg, safe=''),
    'sections': [
        image(conveyor_svg, 'Automated Conveyor Sorting System and Diverter Tracking P&ID', 'FIG 1.1 // AUTOMATED CONVEYOR SORTING: MULTI-ZONE TRACKING, PNEUMATIC DIVERTER & ANTI-JAM WATCHDOG'),
        md('''## 1. The Sorting Conveyor Dilemma: Single-Box Timers vs. Multi-Box Pipelines

Automated sorting conveyors are the lifeblood of distribution centers, bottling plants, and food packaging facilities. A standard sorting line features:
- **Infeed Inspection Station:** A vision camera, barcode scanner, or optical checkweigher photoeye (`PE-101`) that flags defective or misrouted cartons.
- **Transport Bed:** A powered belt or roller conveyor moving items at constant linear speed (e.g., $60\text{ to }120\text{ FPM}$).
- **Diverter Station:** A high-speed pneumatic pusher arm, pop-up wheel diverter, or air blast nozzle (`SOL-101`) positioned downstream to kick flagged items into a reject lane.

### Why Beginners Use Fixed Timers (And Why They Fail)
When tasked with triggering the diverter 2 meters downstream, a beginner controls engineer naturally reaches for timers:
```
Defect Detected -> TON Timer (2.0 seconds) -> Fire Diverter Arm (0.8s TOF)
```

**The High-Throughput Trap:**
This timer circuit works during low-speed commissioning when you gently push one test box down the belt. But as soon as production ramps up to 60 cartons per minute:
1. **Queue Collisions:** What happens if Box #1 is defective, and Box #2 (1.0 second behind it) is also defective? The `TON` timer is already busy timing Box #1. When Box #2 passes the sensor, the timer cannot track two distinct time horizons simultaneously!
2. **Timer Reset Flaw:** If the sensor pulse drops between cartons, the timer resets completely—causing the diverter to miss Box #1 and fire late for Box #2!
3. **Speed Drift Misalignment:** If the conveyor belt slows down under a heavy load or stops during an upstream pause, wall-clock timers keep counting down! The diverter fires into empty air, and the defective box rolls right into good stock.'''),
        note('Intermediate Control Rule: Track Distance, Not Time', 'Conveyor parcel tracking should always be coupled to physical belt displacement rather than wall-clock seconds. Using travel encoder pulses or discrete zone shift registers ensures that if the belt speeds up, slows down, or stops entirely, the tracked positions of all parcels freeze and move in perfect physical synchronism.', 'warning'),
        md('''## 2. Stage 1: The Fixed Timer Delay Flaw

Examine the Stage 1 circuit below. It implements the classic single-box timer delay: a `TOF` captures the optical photoeye pulse, a `TON` delays actuation by $2000\text{ ms}$ of travel time, and a second `TOF` strokes the diverter arm for $800\text{ ms}$.

Notice the **Multi-Package Collision Risk** indicator: the moment a defect is registered, the single timer channel becomes locked. If another carton arrives before the first completes its 2-second travel, tracking is lost.'''),
        lab(1, 'Stage 1: The Fixed Timer Delay Flaw', dsl1),
        note('Interactive Exercise — Stage 1 (Witness the Lost Package)', 'In Stage 1 above:
1. Click "PE-101 Defect Photoeye" once to simulate a defective box. Watch "Sensor Pulse Capture" hold the pulse, and after 2.0s, "Pneumatic Diverter Arm" strokes for 0.8s. That works!
2. Now click "PE-101 Defect Photoeye", wait 0.8s, and click it a SECOND time (two defective cartons close together). Watch how the second pulse is completely swallowed by the running timer! The diverter only strokes once—the second defective box escapes!', 'error'),
        md('''## 3. Stage 2: Synchronous Zone Tracking via Shift Register

In professional material handling systems, the conveyor line is mathematically divided into discrete physical **Zones** (e.g. Zone 1 = Scan, Zone 2 = Acceleration, Zone 3 = Alignment, Zone 4 = Divert).

A **Bit Shift Register (`SHIFT_REGISTER`)** acts as a true First-In, First-Out (FIFO) pipeline:
- Each clock pulse (`CLK`) represents the belt moving forward by exactly one zone length.
- If a package at `PE-101` is marked defective, a digital `1` is shifted into the register at bit 0.
- With every travel pulse, the `1` bit marches synchronously through the zones:
  ```
  Zone 1 (Scan):     [ 1, 0, 0, 0 ]
  Zone 2 (Accel):    [ 0, 1, 0, 0 ]
  Zone 3 (Align):    [ 0, 0, 1, 0 ]
  Zone 4 (Divert):   [ 0, 0, 0, 1 ] -> FIRE DIVERTER!
  ```
- If three defective packages pass in a row, the register simply holds `[ 1, 1, 1, 0 ]`. Each package is individually tracked and diverted with 100% precision!'''),
        lab(2, 'Stage 2: Synchronous Zone Tracking via Shift Register', dsl2),
        note('Interactive Exercise — Stage 2 (Multi-Carton Pipeline in Action)', 'In Stage 2 above:
1. Click "Run" to start the simulation. The "Belt Travel Zone Pulses" clock pulses continuously as the conveyor rolls.
2. Click "PE-101 Defect Photoeye" to flag a package. Notice how the defect bit enters the shift register.
3. Count 4 travel steps: precisely when the carton arrives at Zone 4, "Defect Box Arrived at Zone 4" turns ON, and the diverter solenoid fires!
4. Now pulse "PE-101 Defect Photoeye" two or three times across successive clock ticks. Watch how multiple defect bits travel in sequence without overwriting each other!', 'success'),
        md('''## 4. Stage 3: Pneumatic Diverter Safety, Reed Switches & Jam Watchdog

A real industrial diverter arm is powered by a double-acting pneumatic cylinder. If a box gets wedged against the guide rail or the air supply drops, the cylinder may stall half-way, causing the next oncoming carton to crash into the arm at full speed.

### Real-World Diverter Interlocks:
1. **Cylinder Reed Switches (`diverter_fwd` / `diverter_ret`):** Magnetic sensors mounted on the pneumatic cylinder verify that the arm has fully retracted before the next carton is allowed to enter the zone.
2. **Jam Detection Watchdog (`PE-102`):** An optical retro-reflective sensor positioned directly at the divert chute. Under normal operation, cartons pass the sensor within 200–400 ms. If `PE-102` remains continuously blocked for longer than **1.5 seconds**, a **Carton Jam** is declared:
   - The line drive motor (`KM-101`) trips immediately.
   - An `RS_LATCH` locks the conveyor in an Emergency Stop state to prevent back-pressure box crushing.
   - A flashing `jam_alarm` alerts operators to clear the physical obstruction and press `reset_pb`.'''),
        lab(3, 'Stage 3: Pneumatic Diverter with Jam Watchdog', dsl3),
        note('Interactive Exercise — Stage 3 (Simulate a Carton Jam & Emergency Stop)', 'In Stage 3 above:
1. Notice "Conveyor Drive Contactor (KM-101)" is running normally.
2. Toggle "PE-102 Diverter Jam Photoeye" to ON (simulating a package stuck at the reject mouth).
3. Watch the "Jam Detection Timer" count: after 1.5 seconds of sustained blockage, the latch trips, the motor stops instantly, and "Carton Jam Alarm (LINE STOP)" turns ON!
4. Clear the simulated jam by toggling "PE-102" to OFF. Notice the line remains safely stopped until you pulse "Operator Reset Pushbutton" to restore line run permissive!', 'info'),
        md('''## 5. Field Commissioning & Sensor Alignment Rules

When commissioning high-speed sorting belts on the factory floor, apply these five practical guidelines:

1. **Optical Photoeye Debounce Filtering:** Industrial cardboard flaps and shipping labels have ripples that can cause optical beams to flicker. Always insert a 15–20 ms on-delay filter on photoeye inputs to prevent a single ragged carton from registering as two distinct boxes.
2. **Link Tracking to Shaft Encoders:** For variable-speed conveyors, mount an incremental quadrature encoder (e.g., 1024 pulses/rev) on an unpowered idler pulley. Never use the motor drive shaft, as belt slip will introduce cumulative tracking error.
3. **Pneumatic Pressure Switches & Flow Controls:** Install dual meter-out speed control mufflers on the diverter cylinder. Adjust extend speed to cushion carton impact, and adjust retract speed to ensure the paddle clears the belt before the next carton arrives.
4. **Mechanical Guide Rails & Singulation:** Software tracking assumes consistent package spacing. Upstream metering belts or pop-up brake pads must enforce minimum package pitch (gap) before cartons reach the inspection photoeye.
5. **Latched Jam Alarms with Manual Reset:** Never allow an automatic jam clear to restart conveyor motors autonomously. A jammed carton can dislodge suddenly; requiring a deliberate operator reset button press protects technicians clearing wedged boxes.'''),
        md('''## 6. Key Engineering Takeaways

- **Timers do not scale to queues:** Fixed delay timers (`TON`) fail when multiple items are in flight simultaneously or when belt speed fluctuates.
- **Shift registers provide true FIFO tracking:** By indexing parcel positions to discrete conveyor displacement zones, multi-item sorting operates with 100% precision.
- **Physical safety requires watchdog sensing:** Cylinders must prove full retraction via magnetic reed switches, and downstream photoeyes must trip conveyor drives on sustained carton blockage.
- **Simplicity and reliability:** Combining synchronous bit shifting with latching jam interlocks provides an industrial-grade sortation solution suitable for any factory or distribution hub.''')
    ]
}

(OUT / 'generate_conveyor_sorting.py').write_text(f'# Generated generator script\nimport json\nfrom pathlib import Path\nOUT = Path(__file__).resolve().parent\n(OUT / "conveyor-sorting-system.json").write_text(json.dumps({json.dumps(article_data, indent=2)}, indent=2), encoding="utf-8")\n', encoding='utf-8')
print("Successfully generated conveyor sorting masterclass python file.")
