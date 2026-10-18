# AutomationHub // Blog Authoring & FBD DSL Manual
*A comprehensive guide for authoring publication-ready industrial automation articles with embedded, multi-stage interactive FBD simulations.*

---

## 1. The Anatomy of an AutomationHub Article

Every article on AutomationHub is not just a blog post—it is an **interactive engineering masterclass**. Every article follows a strict 6-part pedagogical structure:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. THE HOOK: Real-World Industrial War Story                           │
│    • A realistic catastrophe, commissioning failure, or emergency trip │
│    • Specific physical failure modes (cavitation, overshoot, scrap)    │
│    • Dollars lost, equipment damaged, or downtime incurred             │
├────────────────────────────────────────────────────────────────────────┤
│ 2. THE TECHNICAL BLUEPRINT: Visual P&ID or Transient Graph             │
│    • A clean P&ID, SCADA graphic, or MATLAB step response plot        │
│    • Detailed technical breakdown of curves, setpoints, and sensors    │
├────────────────────────────────────────────────────────────────────────┤
│ 3. STAGE 1: Foundational Logic & Interactive Lab 1                     │
│    • Theory of the primary problem (e.g. error calculation, interlock) │
│    • Embedded interactive FBD circuit isolating Stage 1                │
│    • Actionable reader exercise ("Click input X, observe output Y")    │
├────────────────────────────────────────────────────────────────────────┤
│ 4. STAGE 2: Intermediate Expansion & Interactive Lab 2                 │
│    • Overcoming physical limits (e.g. integral elimination of droop,   │
│      hysteresis to prevent short-cycling, time-proportioned PWM)       │
│    • Embedded interactive FBD circuit expanding the logic              │
│    • Actionable reader exercise                                        │
├────────────────────────────────────────────────────────────────────────┤
│ 5. STAGE 3: The Full System & Interactive Lab 3                        │
│    • Complete closed-loop plant model (thermal inertia, tank level)    │
│    • Reader can change setpoint live and observe dynamic response      │
│    • Live tuning and anti-windup validation                            │
├────────────────────────────────────────────────────────────────────────┤
│ 6. COMMISSIONING CHECKLIST & LESSONS FROM THE FIELD                    │
│    • Hard-won rules from senior instrumentation engineers              │
│    • Practical advice for live plant floor deployment                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Standardized Article File Formats

AutomationHub supports two external file formats that you can upload directly via the `/write` section:
1. **Structured JSON format (`.json`)** — Ideal for programmatic generation and AI output.
2. **Markdown with Embedded FBD code blocks (`.md`)** — Ideal for writing in Markdown editors.

### Format A: The Structured JSON Format (`article.json`)

```json
{
  "slug": "water-treatment",
  "title": "Building an Industrial Water Treatment Simulator",
  "excerpt": "A step-by-step masterclass on water treatment SCADA: intake permissives, basin level hysteresis, and automated multi-pump duty alternation.",
  "author": "John Doe",
  "date": "Oct 18",
  "readingTime": "15 min read",
  "tag": "Process Control",
  "views": 18450,
  "heroImage": "/water_treatment_pid.jpg",
  "sections": [
    {
      "type": "markdown",
      "content": "## The Midnight Overflow at Basin 3\n\nAt 2:40 AM..."
    },
    {
      "type": "image",
      "src": "/water_treatment_pid.jpg",
      "alt": "Water Treatment P&ID Layout",
      "caption": "FIG 1.1 // PROCESS FLOW & INSTRUMENTATION DIAGRAM"
    },
    {
      "type": "markdown",
      "content": "### Stage 1: Intake Permissives & Dry-Run Protection\n\nBefore any pump can start..."
    },
    {
      "type": "lab",
      "title": "Stage 1: Intake Permissives & Dry-Run Lockout",
      "step": "Stage 1 of 3",
      "height": 480,
      "dsl": "circuit \"Stage 1\" version 1 {\n  valve: INPUT(label=\"Intake Valve Open\", value=true)\n  level_ok: INPUT(label=\"Suction Level OK\", value=true)\n  start_pb: INPUT(label=\"Start PB\", value=false)\n  stop_pb: INPUT(label=\"Stop PB\", value=false)\n  perm: AND()\n  latch: RS_LATCH()\n  pump: OUTPUT(label=\"Intake Pump\")\n\n  valve.Q -> perm.A\n  level_ok.Q -> perm.B\n  start_pb.Q -> latch.S\n  stop_pb.Q -> latch.R\n  latch.Q -> pump.A\n}"
    },
    {
      "type": "callout",
      "variant": "info",
      "title": "Interactive Exercise",
      "text": "Try toggling Suction Level to OFF while the pump is running..."
    }
  ]
}
```

### Format B: The Markdown Format with ````fbd```` Code Blocks

```markdown
---
slug: water-treatment
title: Building an Industrial Water Treatment Simulator
excerpt: A step-by-step masterclass on water treatment SCADA.
author: John Doe
date: Oct 18
readingTime: 15 min read
tag: Process Control
views: 18450
---

## The Midnight Overflow at Basin 3

At 2:40 AM on a freezing Tuesday, the raw intake lift pumps...

![P&ID Diagram](/water_treatment_pid.jpg)

### Stage 1: Intake Permissives

Before starting raw intake pumps, we verify suction permissives...

```fbd title="Stage 1: Intake Permissives & Dry-Run Lockout" step="Stage 1 of 3" height=480
circuit "Stage 1" version 1 {
  valve: INPUT(label="Intake Valve Open", value=true)
  level_ok: INPUT(label="Suction Level OK", value=true)
  start_pb: INPUT(label="Start PB", value=false)
  stop_pb: INPUT(label="Stop PB", value=false)
  perm: AND()
  latch: RS_LATCH()
  pump: OUTPUT(label="Intake Pump")

  valve.Q -> perm.A
  level_ok.Q -> perm.B
  start_pb.Q -> latch.S
  stop_pb.Q -> latch.R
  latch.Q -> pump.A
}
```

> **Interactive Exercise:** Click Start PB to energize the pump...
```

---

## 3. The Complete FBD DSL Syntax Specification

The AutomationHub Logic Engine uses a deterministic, typed Domain Specific Language (DSL).

### 3.1 Basic Structure
Every DSL string must follow this grammar:
```
circuit "<Circuit Name>" version 1 {
  <block_declarations>

  <wire_connections>
}
```

### 3.2 Block Declarations
Syntax: `id: BLOCK_TYPE(setting1=value, setting2=value)`
* `id` must be alphanumeric (letters, numbers, underscores).
* Metadata:
  * `label="..."`: The human-readable title shown on the block header in the UI.
  * `value=...`: Default starting state for inputs (`true`, `false`, or a numeric value).
* Parameters: configured using `key=value` (e.g. `kp=2.0`, `duration=1500`, `operation="subtract"`).

### 3.3 Wire Connections
Syntax: `sourceId.sourcePin -> targetId.targetPin`
* Pins are case-sensitive.
* Digital outputs (`Q`) can only wire to digital inputs (`A`, `B`, `S`, `R`, `EN`).
* Analog outputs (`Q`, `CV`, `MIN`, `MAX`) can only wire to analog inputs (`A`, `B`, `SP`, `PV`).

### 3.4 Feedback Loops & Delay
* In cyclic closed-loop circuits (e.g., sensor feedback), the feedback wire must pass through a memory boundary:
  * **Digital feedback:** Pass through `SCAN_DELAY` (`z⁻¹`).
  * **Analog feedback:** Pass through `ANALOG_SCAN_DELAY` (`z⁻¹`), or directly through continuous stateful plant blocks like `TRANSFER_FUNCTION` and `ANALOG_RAMP`.

---

## 4. Block Catalog Quick Reference

### 4.1 Digital I/O & Sources
| Block Type | Description | Inputs | Outputs | Key Parameters |
| :--- | :--- | :--- | :--- | :--- |
| `INPUT` | Interactive toggle switch | None | `Q` (digital) | `label`, `value` (bool) |
| `NC_INPUT` | Normally-closed push button | None | `Q` (digital) | `label`, `value` (bool) |
| `OUTPUT` | Digital pilot light / coil indicator | `A` (digital) | None | `label` |
| `HIGH` | Constant logic 1 source | None | `Q` (digital) | None |
| `LOW` | Constant logic 0 source | None | `Q` (digital) | None |
| `CLOCK` | Square-wave pulse generator | None | `Q` (digital) | `highDuration`, `lowDuration` |

### 4.2 Analog I/O & Constants
| Block Type | Description | Inputs | Outputs | Key Parameters |
| :--- | :--- | :--- | :--- | :--- |
| `ANALOG_INPUT` | Interactive numeric slider / transmitter | None | `Q` (analog) | `label`, `value` (number) |
| `ANALOG_OUTPUT` | Engineering units digital meter / gauge | `A` (analog) | None | `label` |
| `ANALOG_CONSTANT` | Fixed numeric constant (e.g. 100, 20) | None | `Q` (analog) | `value` (number) |

### 4.3 Logic Gates & Edge Triggers
| Block Type | Description | Inputs | Outputs | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `AND` | Logical AND | `A`, `B` | `Q` | `Q = A && B` |
| `OR` | Logical OR | `A`, `B` | `Q` | `Q = A || B` |
| `NOT` | Inverter | `A` | `Q` | `Q = !A` |
| `XOR` | Exclusive OR | `A`, `B` | `Q` | `Q = A !== B` |
| `NAND`, `NOR`, `XNOR` | Inverted logic gates | `A`, `B` | `Q` | Standard gates |
| `R_TRIG` | Rising edge one-scan pulse | `A` | `Q` | Emits 1 tick on 0 -> 1 |
| `F_TRIG` | Falling edge one-scan pulse | `A` | `Q` | Emits 1 tick on 1 -> 0 |
| `RS_LATCH` | Set/Reset bistable memory | `S`, `R` | `Q` | Reset dominant latch |
| `PULSE_RELAY` | Toggle flip-flop | `A` | `Q` | Toggles state on rising edge |

### 4.4 Timers & Actuators
| Block Type | Description | Inputs | Outputs | Key Parameters |
| :--- | :--- | :--- | :--- | :--- |
| `TON` | On-delay timer | `A` | `Q` | `duration` (ms) |
| `TOF` | Off-delay timer (pulse extender) | `A` | `Q` | `duration` (ms) |
| `PWM` | Time-proportioned pulse modulation | `A` (analog 0-100%) | `Q` (digital) | `period` (ms) |
| `COUNTER` | Up/Down counter | `CU`, `CD`, `R` | `Q`, `CV` | `limit` (number) |

### 4.5 Math & Advanced Process Control
| Block Type | Description | Inputs | Outputs | Key Parameters |
| :--- | :--- | :--- | :--- | :--- |
| `MATH` | Arithmetic calculation | `A`, `B` (analog) | `Q` | `operation` ("add", "subtract", "multiply", "divide") |
| `ANALOG_AMPLIFIER` | Gain multiplier & offset | `A` (analog) | `Q` | `gain` (number), `offset` (number) |
| `ANALOG_COMPARATOR`| Compare two analog signals | `A`, `B` (analog) | `Q` (digital) | `operation` ("gt", "gte", "lt", "lte", "eq") |
| `ANALOG_DIFFERENTIAL`| Schmitt trigger / hysteresis | `A` (analog) | `Q` (digital) | `onThreshold`, `offThreshold` |
| `ANALOG_MUX` | 2-channel analog multiplexer | `S` (digital), `A`, `B` | `Q` (analog) | `Q = S ? B : A` |
| `PI_CONTROLLER` | Proportional-Integral controller | `SP`, `PV`, `R` | `Q` (analog) | `kp`, `ki`, `min`, `max` |
| `PID_CONTROLLER`| Full PID with anti-windup | `SP`, `PV`, `EN` | `CV` (analog) | `kp`, `ki`, `kd`, `min`, `max` |
| `TRANSFER_FUNCTION`| First-order physical lag plant | `A` (analog) | `Q` (analog) | `gain` (K), `tau` (ms) |
| `ANALOG_RAMP` | Slew rate limiter | `A` (analog) | `Q` (analog) | `riseRate`, `fallRate` |
| `AVERAGE` | Moving average smoothing filter | `A` (analog) | `Q` (analog) | `samples` (count) |

---

## 5. Master AI Prompt Template

Copy and paste this prompt directly into ChatGPT, Claude, or Gemini to have it author a complete article conforming to this manual:

```text
You are a Senior Industrial Automation & SCADA Engineer writing a publication-grade interactive masterclass article for AutomationHub.

TOPIC: [Insert Topic, e.g. "Municipal Water Treatment: Intake Permissives, Hysteresis & Pump Alternation"]

Follow the strict AutomationHub 6-Part Structure:
1. Dramatic real-world failure narrative (dollars lost, equipment wrecked, specific physical failure modes like cavitation, dry run, or water hammer).
2. Reference to an architectural process diagram (P&ID or SCADA screen) explaining tags and flow.
3. Stage 1: Foundational logic theory + Embedded Lab 1 (valid FBD DSL).
4. Stage 2: Addressing real-world physics (actuation, hysteresis, time-proportioning) + Embedded Lab 2.
5. Stage 3: Full closed-loop plant simulation + Embedded Lab 3.
6. Field commissioning rules and hard-won lessons from senior engineers.

CRITICAL DSL RULES:
- Use valid AutomationHub FBD DSL syntax:
  circuit "<Title>" version 1 {
    blockId: BLOCK_TYPE(label="...", param=value)
    fromBlock.fromPin -> toBlock.toPin
  }
- Available Blocks: INPUT, NC_INPUT, OUTPUT, HIGH, LOW, ANALOG_INPUT, ANALOG_OUTPUT, ANALOG_CONSTANT, AND, OR, NOT, RS_LATCH, PULSE_RELAY, TON, TOF, PWM, MATH, ANALOG_AMPLIFIER, ANALOG_COMPARATOR, ANALOG_DIFFERENTIAL, ANALOG_MUX, PI_CONTROLLER, PID_CONTROLLER, TRANSFER_FUNCTION, ANALOG_RAMP, AVERAGE.
- Analog pins are: Q, CV, SP, PV, A, B. Digital pins are: Q, A, B, S, R, EN.

OUTPUT FORMAT: Output the complete article in valid AutomationHub JSON format (with slug, title, excerpt, author, date, readingTime, tag, views, and an array of sections with types 'markdown', 'image', 'lab', and 'callout').
```
