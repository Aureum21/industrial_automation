import json
from pathlib import Path
from textwrap import dedent
from urllib.parse import quote

OUT = Path(__file__).resolve().parent

def md(text): return {'type': 'markdown', 'content': dedent(text).strip()}
def note(title, text, variant='info'): return {'type': 'callout', 'variant': variant, 'title': title, 'text': text}
def lab(n, title, dsl): return {'type': 'lab', 'title': title, 'step': f'Stage {n} of 3', 'height': 600 if n == 3 else 520, 'dsl': dedent(dsl).strip()}
def image(svg, alt, caption): return {'type': 'image', 'src': 'data:image/svg+xml;charset=utf-8,' + quote(svg, safe=''), 'alt': alt, 'caption': caption}

pump_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" role="img" aria-labelledby="t d">
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

  <g font-family="Arial,sans-serif" fill="#142c3d">
    <text x="38" y="42" font-size="24" font-weight="bold">06 / DUPLEX PUMP DUTY CYCLING &amp; LEAD / LAG ALTERNATION</text>
    <text x="38" y="70" font-size="15">Equal Wear Balancing, Automatic Fault Substitution &amp; Peak-Inflow Assist Control</text>
  </g>

  <rect x="38" y="100" width="370" height="390" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <rect x="50" y="112" width="346" height="26" rx="4" fill="#e8f4f8"/>
  <text x="223" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c" text-anchor="middle">DUPLEX PUMP SKID (P-101A / P-101B)</text>

  <rect x="55" y="190" width="30" height="180" rx="6" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
  <text x="70" y="285" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0369a1" transform="rotate(-90 70 285)" text-anchor="middle">SUCTION HEADER (FROM SUMP)</text>

  <path d="M85 220 h45" fill="none" stroke="#0284c7" stroke-width="4"/>
  <path d="M85 340 h45" fill="none" stroke="#0284c7" stroke-width="4"/>

  <path d="M130 210 l16 10 -16 10 Z M162 210 l-16 10 16 10 Z" fill="#23495c"/>
  <text x="146" y="240" font-family="Arial,sans-serif" font-size="9" fill="#64748b" text-anchor="middle">V-IN-A</text>

  <path d="M130 330 l16 10 -16 10 Z M162 330 l-16 10 16 10 Z" fill="#23495c"/>
  <text x="146" y="360" font-family="Arial,sans-serif" font-size="9" fill="#64748b" text-anchor="middle">V-IN-B</text>

  <circle cx="210" cy="220" r="32" fill="#f8fafc" stroke="#23495c" stroke-width="2.5"/>
  <path d="M195 235 v-30 l30 15 Z" fill="#227b92"/>
  <text x="210" y="178" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#142c3d" text-anchor="middle">PUMP P-101A</text>
  <text x="210" y="265" font-family="Arial,sans-serif" font-size="9" fill="#64748b" text-anchor="middle">Duty / Lead Unit</text>

  <circle cx="210" cy="340" r="32" fill="#f8fafc" stroke="#23495c" stroke-width="2.5"/>
  <path d="M195 355 v-30 l30 15 Z" fill="#227b92"/>
  <text x="210" y="385" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#142c3d" text-anchor="middle">PUMP P-101B</text>
  <text x="210" y="399" font-family="Arial,sans-serif" font-size="9" fill="#64748b" text-anchor="middle">Standby / Lag Unit</text>

  <path d="M242 220 h45" fill="none" stroke="#227b92" stroke-width="4"/>
  <path d="M242 340 h45" fill="none" stroke="#227b92" stroke-width="4"/>

  <path d="M287 210 v20 l16 -10 Z M303 210 v20" fill="none" stroke="#23495c" stroke-width="2"/>
  <text x="295" y="240" font-family="Arial,sans-serif" font-size="9" fill="#64748b" text-anchor="middle">NRV-A</text>

  <path d="M287 330 v20 l16 -10 Z M303 330 v20" fill="none" stroke="#23495c" stroke-width="2"/>
  <text x="295" y="360" font-family="Arial,sans-serif" font-size="9" fill="#64748b" text-anchor="middle">NRV-B</text>

  <path d="M305 220 h35 v120 h-35" fill="none" stroke="#227b92" stroke-width="4"/>
  <path d="M340 280 h55" fill="none" stroke="#227b92" stroke-width="5" marker-end="url(#arr)"/>
  <text x="368" y="270" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#227b92">TO SYSTEM</text>

  <rect x="50" y="415" width="346" height="65" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <circle cx="80" cy="448" r="8" fill="#10b981"/>
  <text x="95" y="452" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#065f46">LEAD CALL (LSH-101): Normal Inflow Demand</text>
  <circle cx="80" cy="466" r="8" fill="#f59e0b"/>
  <text x="95" y="470" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b45309">LAG CALL (LSHH-102): Peak Surge Demand (Both Run)</text>

  <rect x="430" y="100" width="375" height="390" rx="12" fill="#ffffff" stroke="#0f766e" stroke-width="2.5" stroke-dasharray="5 5"/>
  <rect x="445" y="112" width="345" height="26" rx="4" fill="#ccfbf1"/>
  <text x="617" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0f766e" text-anchor="middle">PLC ALTERNATION &amp; AUTO-TAKEOVER ENGINE</text>

  <rect x="450" y="155" width="335" height="90" rx="8" fill="#f8fafc" stroke="#23495c" stroke-width="1.5"/>
  <text x="617" y="176" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#142c3d" text-anchor="middle">1. CYCLE-BASED DUTY FLIP-FLOP (PULSE_RELAY)</text>
  <text x="465" y="198" font-family="Arial,sans-serif" font-size="10" fill="#334155">• On falling edge of Call (F_TRIG), duty flips A ↔ B</text>
  <text x="465" y="215" font-family="Arial,sans-serif" font-size="10" fill="#334155">• Balances runtime hours and prevents seal stiction</text>
  <text x="465" y="232" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b91c1c">⚠ FLAW: Blind toggle stalls if duty pump trips on overload!</text>

  <rect x="450" y="255" width="335" height="105" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
  <text x="617" y="276" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#14532d" text-anchor="middle">2. FAULT-AWARE STANDBY AUTO-TAKEOVER</text>
  <text x="465" y="298" font-family="Arial,sans-serif" font-size="10" fill="#166534">• Monitors thermal overloads OL-A and OL-B</text>
  <text x="465" y="315" font-family="Arial,sans-serif" font-size="10" fill="#166534">• If Duty A is tripped → Standby B takes over instantly</text>
  <text x="465" y="332" font-family="Arial,sans-serif" font-size="10" fill="#166534">• If Duty B is tripped → Standby A takes over instantly</text>
  <text x="465" y="348" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#15803d">✔ Zero service interruption; station continues pumping</text>

  <rect x="450" y="370" width="335" height="105" rx="8" fill="#fffbeb" stroke="#d97706" stroke-width="1.5"/>
  <text x="617" y="392" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#92400e" text-anchor="middle">3. LEAD / LAG SEQUENCING (PEAK ASSIST)</text>
  <text x="465" y="413" font-family="Arial,sans-serif" font-size="10" fill="#78350f">• Normal level: Only Lead Pump runs (50% energy)</text>
  <text x="465" y="430" font-family="Arial,sans-serif" font-size="10" fill="#78350f">• High level (Surge): Lag Pump kicks on in parallel</text>
  <text x="465" y="447" font-family="Arial,sans-serif" font-size="10" fill="#78350f">• Both pumps run until level recedes below Lag threshold</text>
  <text x="465" y="464" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#b45309">✔ Doubles flow capacity during storm / peak hours</text>

  <rect x="830" y="100" width="335" height="390" rx="12" fill="#ffffff" stroke="#23495c" stroke-width="2"/>
  <rect x="845" y="112" width="305" height="26" rx="4" fill="#e8f4f8"/>
  <text x="997" y="130" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#23495c" text-anchor="middle">INTERMEDIATE CONTROLS COMPARISON</text>

  <rect x="845" y="155" width="305" height="150" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="855" y="178" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#142c3d">ARCHITECTURE COMPARISON:</text>
  <text x="855" y="200" font-family="Arial,sans-serif" font-size="9" fill="#334155">1. Blind Toggle (Stage 1):</text>
  <text x="865" y="214" font-family="Arial,sans-serif" font-size="9" fill="#b91c1c">   - Equal wear: YES | Fault tolerant: NO</text>

  <text x="855" y="235" font-family="Arial,sans-serif" font-size="9" fill="#334155">2. Fault-Aware (Stage 2):</text>
  <text x="865" y="249" font-family="Arial,sans-serif" font-size="9" fill="#047857">   - Equal wear: YES | Standby takeover: YES</text>

  <text x="855" y="270" font-family="Arial,sans-serif" font-size="9" fill="#334155">3. Duplex Lead/Lag (Stage 3):</text>
  <text x="865" y="284" font-family="Arial,sans-serif" font-size="9" fill="#047857">   - Wear balanced | Fault takeover | Peak assist: YES</text>

  <rect x="845" y="320" width="305" height="155" rx="8" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
  <text x="997" y="342" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#065f46" text-anchor="middle">FIELD COMMISSIONING RULES</text>
  <text x="855" y="365" font-family="Arial,sans-serif" font-size="9" fill="#047857">• Exercise unselected pump weekly to prevent seal sticking</text>
  <text x="855" y="385" font-family="Arial,sans-serif" font-size="9" fill="#047857">• Stagger motor start times by 5-10s to avoid MCC inrush</text>
  <text x="855" y="405" font-family="Arial,sans-serif" font-size="9" fill="#047857">• Latch thermal overload trips until manual push-reset</text>
  <text x="855" y="425" font-family="Arial,sans-serif" font-size="9" fill="#047857">• Invert toggle on cycle completion (not cycle start)</text>
  <text x="855" y="445" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#065f46">• Always verify non-return valves (NRV) hold backpressure</text>

  <path d="M408 280 h22" fill="none" stroke="#227b92" stroke-width="2.5" marker-end="url(#arr)"/>
  <path d="M805 280 h25" fill="none" stroke="#bd7b24" stroke-width="2.5" marker-end="url(#arr-amber)"/>

  <g font-family="Arial,sans-serif" font-size="13" fill="#294758">
    <text x="40" y="520">Solid Cyan: Water Piping &amp; Pump Flow (1200 GPM) | Amber / Red: 24V DC Control Interlocks &amp; Contactor Commands</text>
    <text x="40" y="542">Duty cycling equalizes operating hours across rotating equipment, preventing bearing brinelling and premature seal failure.</text>
  </g>
</svg>'''

dsl1 = '''circuit "Stage 1 - Basic Duty Alternator" version 1 {
  call: INPUT(label="Call for Water", value=true)
  edge: F_TRIG(label="Cycle End (Falling Edge)")
  toggle: PULSE_RELAY(label="Duty Flip-Flop")
  not_toggle: NOT()
  pumpA: AND(label="Pump A Gate")
  pumpB: AND(label="Pump B Gate")
  outA: OUTPUT(label="Pump A Contactor")
  outB: OUTPUT(label="Pump B Contactor")
  duty_b: OUTPUT(label="Next Duty: Pump B when ON")

  call.Q -> edge.A
  edge.Q -> toggle.A
  toggle.Q -> not_toggle.A
  toggle.Q -> duty_b.A

  call.Q -> pumpA.A
  not_toggle.Q -> pumpA.B
  pumpA.Q -> outA.A

  call.Q -> pumpB.A
  toggle.Q -> pumpB.B
  pumpB.Q -> outB.A
}'''

dsl2 = '''circuit "Stage 2 - Fault-Aware Alternator with Auto-Takeover" version 1 {
  call: INPUT(label="Call for Water", value=true)
  healthy_a: INPUT(label="Pump A Overload Healthy", value=true)
  healthy_b: INPUT(label="Pump B Overload Healthy", value=true)

  edge: F_TRIG(label="Cycle End Detector")
  duty: PULSE_RELAY(label="Duty Selector")
  duty_a: NOT()

  fault_a: NOT()
  fault_b: NOT()

  duty_a_pref: AND(label="Duty A Desired")
  duty_b_pref: AND(label="Duty B Desired")

  takeover_b: AND(label="B Takes Over for Faulted A")
  takeover_a: AND(label="A Takes Over for Faulted B")

  demand_a: OR()
  demand_b: OR()
  takeover_or: OR(label="Any Takeover Active")

  final_a: AND(label="Final Pump A Command")
  final_b: AND(label="Final Pump B Command")

  outA: OUTPUT(label="Pump A Motor Command")
  outB: OUTPUT(label="Pump B Motor Command")
  alarmA: OUTPUT(label="Pump A Tripped Alarm")
  alarmB: OUTPUT(label="Pump B Tripped Alarm")
  autoTakeover: OUTPUT(label="Standby Pump in Auto-Takeover")

  call.Q -> edge.A
  edge.Q -> duty.A
  duty.Q -> duty_a.A

  healthy_a.Q -> fault_a.A
  healthy_b.Q -> fault_b.A
  fault_a.Q -> alarmA.A
  fault_b.Q -> alarmB.A

  call.Q -> duty_a_pref.A
  duty_a.Q -> duty_a_pref.B

  call.Q -> duty_b_pref.A
  duty.Q -> duty_b_pref.B

  duty_a_pref.Q -> takeover_b.A
  fault_a.Q -> takeover_b.B

  duty_b_pref.Q -> takeover_a.A
  fault_b.Q -> takeover_a.B

  duty_a_pref.Q -> demand_a.A
  takeover_a.Q -> demand_a.B

  duty_b_pref.Q -> demand_b.A
  takeover_b.Q -> demand_b.B

  demand_a.Q -> final_a.A
  healthy_a.Q -> final_a.B
  final_a.Q -> outA.A

  demand_b.Q -> final_b.A
  healthy_b.Q -> final_b.B
  final_b.Q -> outB.A

  takeover_a.Q -> takeover_or.A
  takeover_b.Q -> takeover_or.B
  takeover_or.Q -> autoTakeover.A
}'''

dsl3 = '''circuit "Stage 3 - Duplex Lead / Lag Sequencing & Peak Assist" version 1 {
  lead_call: INPUT(label="Lead Demand (Pressure / Low Level)", value=true)
  lag_call: INPUT(label="Lag Demand (High Inflow / Peak Surge)", value=false)
  healthy_a: INPUT(label="Pump A Healthy", value=true)
  healthy_b: INPUT(label="Pump B Healthy", value=true)

  edge: F_TRIG(label="Cycle End Detector")
  duty: PULSE_RELAY(label="Lead Selector Toggle")
  duty_a: NOT()

  fault_a: NOT()
  fault_b: NOT()

  lead_req_a: AND()
  lead_req_b: AND()

  lead_takeover_b: AND(label="B Takes Lead if A Faulted")
  lead_takeover_a: AND(label="A Takes Lead if B Faulted")

  lead_run_a: OR()
  lead_run_b: OR()

  lag_active: AND(label="Lag Gate")
  lag_req_a: AND(label="Lag Call to A (when B is Lead)")
  lag_req_b: AND(label="Lag Call to B (when A is Lead)")

  demand_a: OR()
  demand_b: OR()

  final_a: AND()
  final_b: AND()

  dual_active: AND(label="Both Pumps Running")

  pumpA: OUTPUT(label="Pump A Motor (P-101A)")
  pumpB: OUTPUT(label="Pump B Motor (P-101B)")
  dual_mode: OUTPUT(label="Dual Pumping Mode (Peak Surge)")
  alarm_a: OUTPUT(label="Pump A Fault Alarm")
  alarm_b: OUTPUT(label="Pump B Fault Alarm")

  lead_call.Q -> edge.A
  edge.Q -> duty.A
  duty.Q -> duty_a.A

  healthy_a.Q -> fault_a.A
  healthy_b.Q -> fault_b.A
  fault_a.Q -> alarm_a.A
  fault_b.Q -> alarm_b.A

  lead_call.Q -> lead_req_a.A
  duty_a.Q -> lead_req_a.B

  lead_call.Q -> lead_req_b.A
  duty.Q -> lead_req_b.B

  lead_req_a.Q -> lead_takeover_b.A
  fault_a.Q -> lead_takeover_b.B

  lead_req_b.Q -> lead_takeover_a.A
  fault_b.Q -> lead_takeover_a.B

  lead_req_a.Q -> lead_run_a.A
  lead_takeover_a.Q -> lead_run_a.B

  lead_req_b.Q -> lead_run_b.A
  lead_takeover_b.Q -> lead_run_b.B

  lead_call.Q -> lag_active.A
  lag_call.Q -> lag_active.B

  lag_active.Q -> lag_req_b.A
  lead_run_a.Q -> lag_req_b.B

  lag_active.Q -> lag_req_a.A
  lead_run_b.Q -> lag_req_a.B

  lead_run_a.Q -> demand_a.A
  lag_req_a.Q -> demand_a.B

  lead_run_b.Q -> demand_b.A
  lag_req_b.Q -> demand_b.B

  demand_a.Q -> final_a.A
  healthy_a.Q -> final_a.B
  final_a.Q -> pumpA.A

  demand_b.Q -> final_b.A
  healthy_b.Q -> final_b.B
  final_b.Q -> pumpB.A

  final_a.Q -> dual_active.A
  final_b.Q -> dual_active.B
  dual_active.Q -> dual_mode.A
}'''

article_data = {
    'slug': 'pump-alternator',
    'title': 'Motor Duty Cycling: Duplex Pump Alternation, Auto-Takeover & Lead/Lag Control',
    'excerpt': 'An intermediate masterclass on rotating machinery duty cycling: why naive flip-flops stall when motors trip, how to implement automatic standby takeover, and configuring duplex lead/lag assist for peak demand surges.',
    'author': 'Alex Engineer & AutomationHub Team',
    'date': 'Sep 10',
    'readingTime': '12 min read + 15 min labs',
    'tag': 'Intermediate',
    'views': 12480,
    'heroImage': 'data:image/svg+xml;charset=utf-8,' + quote(pump_svg, safe=''),
    'sections': [
        image(pump_svg, 'Duplex Pump Duty Alternation and Lead-Lag Control P&ID', 'FIG 1.1 // DUPLEX PUMP DUTY CYCLING & LEAD / LAG SEQUENCING: EQUAL WEAR BALANCING & STANDBY AUTO-TAKEOVER'),
        md('''## 1. The Duplex Pump Dilemma: Unequal Wear vs. Fault Stalling

In commercial buildings, municipal booster stations, and industrial lift stations, pumps rarely operate alone. A standard design installs two identical pumps (**Pump A** and **Pump B**) piped in parallel across common suction and discharge manifolds.

### Why Alternate Equipment?
1. **Equalizing Wear:** If Pump A runs 100% of the time while Pump B sits idle as a "cold spare," Pump A accumulates thousands of hours and burns out its mechanical seal within a year. Meanwhile, Pump B's idle seal elastomeric faces can dry out, and its bearing grease can oxidize or separate, causing it to seize the very first time an emergency occurs!
2. **Thermal Dissipation:** Periodic resting gives motor windings, motor bearings, and contactor coils time to cool down below their maximum thermal rise limits.
3. **Operational Verification:** Running both pumps on a daily or weekly rotation proves that both starters, pressure switches, and non-return valves (NRVs) remain fully functional before a critical surge hits.

However, many beginner PLC programs implement alternation using a simple, blind flip-flop:
```
Cycle Finished -> Toggle Bit -> Alternate Next Demand
```

**The Field Flaw:** What happens if Pump A trips on its thermal overload relay? The blind flip-flop doesn't care—on the very next cycle, it blindly routes the call to the faulted pump. Demand goes completely unserved, the wet well fills up, and an alarm sounds, even though a perfectly healthy Pump B was sitting right next to it doing nothing!'''),
        note('Intermediate Control Rule: Alternation Must Be Fault-Aware', 'A duty alternator should never be just a software toggle flip-flop. Real-world duty cycling must cross-check equipment health: if the duty pump is faulted, in maintenance lockout, or fails to prove flow, the standby unit must take over immediately without human intervention.', 'warning'),
        md('''## 2. Stage 1: The Classic Flip-Flop Alternator

In Stage 1 below, we implement the foundational duty cycling circuit using a `PULSE_RELAY` (bistable toggle flip-flop) driven by a falling-edge detector (`F_TRIG`).

- When water demand is active (`Call for Water` = ON), the currently selected pump runs.
- When water demand is satisfied (`Call for Water` turns OFF), the falling edge triggers the `PULSE_RELAY`.
- The toggle state switches, steering the *next* start command to the opposite pump via mutual AND gates.'''),
        lab(1, 'Stage 1: The Basic Duty Alternator', dsl1),
        note('Interactive Exercise — Stage 1 (Observe the Alternation)', 'In Stage 1 above:
1. Notice that Pump A is initially running because "Call for Water" is ON.
2. Toggle "Call for Water" to OFF (cycle complete). Watch the "Duty Flip-Flop" switch state and light up "Next Duty: Pump B when ON".
3. Turn "Call for Water" back ON: now Pump B runs!
4. Notice the limitation: there is no input for motor health. If a pump burns out, the circuit still tries to run it every other cycle!', 'info'),
        md('''## 3. Stage 2: Fault-Aware Alternator with Automatic Standby Takeover

To solve the blind toggle flaw, Stage 2 introduces motor health interlocks from thermal overload auxiliary contacts (`healthy_a` and `healthy_b`).

### How Automatic Takeover Works:
- **Normal Cycle:** If Pump A is selected and healthy, Pump A runs.
- **Duty Pump Faulted:** If Pump A is selected but trips its overload (`healthy_a` drops to false), the `takeover_b` gate activates instantly. Demand is immediately redirected to **Pump B**!
- **Standby Backup:** The station continues delivering water without human intervention. An alarm indicator alerts technicians to service Pump A while Pump B carries the load.'''),
        lab(2, 'Stage 2: Fault-Aware Standby Auto-Takeover', dsl2),
        note('Interactive Exercise — Stage 2 (Simulate a Tripped Motor Overload)', 'In Stage 2 above:
1. With "Call for Water" active, Pump A is running normally as the duty pump.
2. Now toggle "Pump A Overload Healthy" to OFF (simulating a tripped starter thermal overload).
3. Watch what happens in real time: Pump A shuts down, "Pump A Tripped Alarm" illuminates, and Pump B immediately energizes under "Standby Pump in Auto-Takeover"!
4. The process never starves for water even during an active equipment breakdown.', 'success'),
        md('''## 4. Stage 3: Duplex Lead / Lag Sequencing for Peak Inflow

In real stormwater stations, municipal lift stations, and commercial booster systems, water demand fluctuates throughout the day. A single pump may handle 90% of operating hours, but during a heavy storm or peak morning demand, one pump cannot keep up.

This is where **Lead / Lag Sequencing** is used:
- **Lead Demand (`lead_call`):** The primary demand switch (e.g. wet well reaches 50% level or water pressure drops below 45 PSI). The assigned **Lead Pump** starts and runs solo.
- **Lag Demand (`lag_call`):** A secondary high-demand switch (e.g. wet well surges to 80% level or pressure drops below 35 PSI). The **Lag Pump** starts in parallel to assist, doubling discharge flow rate!
- When the surge subsides and `lag_call` turns off, the Lag pump shuts down, leaving the Lead pump to finish the cycle.
- On cycle completion, the Lead duty alternates, ensuring both pumps share the Lead role equally.'''),
        lab(3, 'Stage 3: Duplex Lead / Lag Sequencing & Peak Assist', dsl3),
        note('Interactive Exercise — Stage 3 (Duplex Lead/Lag Peak Assist)', 'In Stage 3 above:
1. With only "Lead Demand" active, Pump A runs alone as the Lead unit.
2. Now toggle "Lag Demand (High Inflow / Peak Surge)" to ON. Watch Pump B immediately kick on alongside Pump A, illuminating "Dual Pumping Mode (Peak Surge)"!
3. Turn "Lag Demand" OFF: Pump B shuts off smoothly, and Pump A continues running.
4. Turn "Lead Demand" OFF to finish the cycle. Next time you turn "Lead Demand" ON, Pump B starts as the Lead pump, and Pump A becomes the Lag standby!', 'info'),
        md('''## 5. Field Commissioning & Maintenance Best Practices

When programming duplex pump stations on the plant floor or in building automation systems, keep these five field guidelines in mind:

1. **Alternate on Cycle Completion, Not Cycle Start:** Always trigger the duty toggle on the *falling edge* of the demand call (when pumping stops). If you toggle on the rising edge, an operator cycling the power switch or a brief sensor flicker could prematurely swap the duty assignment mid-stride.
2. **Stagger Lag Pump Starting:** When dual pumping is required, never start both large induction motors simultaneously across-the-line. Stagger the Lag pump start by 5 to 10 seconds to avoid tripping the main building feeder breaker on cumulative motor inrush current.
3. **Provide an Exercise Timer:** If a duplex pump station sits idle for weeks (common in backup flood sumps or seasonal HVAC systems), configure an automated exercise timer (e.g., run each pump for 60 seconds once every 7 days). This keeps mechanical seal faces lubricated and flushes sediment out of the pump volute.
4. **Non-Return Valve (NRV) Integrity:** Every parallel pump branch requires a dedicated swing or silent check valve on its discharge. If check valve NRV-A fails open, Pump B will simply recirculate pressurized water backward through Pump A instead of delivering water to the system!
5. **Runtime Hour Balancing vs. Cycle Alternation:** Simple cycle alternation works best when run durations are relatively consistent. For applications where one run cycle might last 5 minutes and another lasts 6 hours, intermediate PLCs accumulate run hours into memory registers and assign Lead duty to whichever pump has fewer lifetime hours.'''),
        md('''## 6. Key Engineering Takeaways

- **Duty cycling equalizes wear:** Alternating runtime prevents premature mechanical seal degradation and bearing brinelling on idle backup equipment.
- **Never toggle blindly:** Always include motor overload (`OL`) and disconnect switch auxiliary contacts to allow automatic standby substitution during hardware faults.
- **Lead / Lag doubles capacity:** Duplex staging allows energy-efficient single-pump operation under base load while providing full parallel capacity during peak demand surges.
- **Proven simplicity:** With a falling-edge trigger (`F_TRIG`), a toggle flip-flop (`PULSE_RELAY`), and basic logic gates, you can build a resilient, industry-standard duplex controller.''')
    ]
}

(OUT / 'generate_motor_duty_cycling.py').write_text(f'# Generated generator script\nimport json\nfrom pathlib import Path\nOUT = Path(__file__).resolve().parent\n(OUT / "motor-duty-cycling.json").write_text(json.dumps({json.dumps(article_data, indent=2)}, indent=2), encoding="utf-8")\n', encoding='utf-8')
print("Successfully generated motor duty cycling masterclass python file.")
