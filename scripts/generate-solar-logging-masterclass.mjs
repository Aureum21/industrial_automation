import fs from 'fs';
import path from 'path';
import { SOLAR_LOGGING_SVG, SOLAR_LOGGING_SVG_DATA_URI } from '../src/lib/solarBlueprintSvg.ts';

const LAB1_DSL = `circuit "Stage 1 - Raw Unfiltered Solar Noise" version 1 {
  rawVolt: ANALOG_INPUT(label="Raw Solar Voltage (V)", value=22)
  minChargeVolt: ANALOG_INPUT(label="Min Charge Threshold (24V)", value=24)
  comp: ANALOG_COMPARATOR(operation="gte")
  chargeRelay: OUTPUT(label="Battery Charge Contactor")
  alarmTrip: NOT(label="Low Voltage Alarm")
  alarmLamp: OUTPUT(label="Unfiltered Voltage Alarm")

  rawVolt.Q -> comp.A
  minChargeVolt.Q -> comp.B
  comp.Q -> chargeRelay.A

  comp.Q -> alarmTrip.A
  alarmTrip.Q -> alarmLamp.A
}
`;

const LAB2_DSL = `circuit "Stage 2 - Analog Smoothing with Moving Average" version 1 {
  rawVolt: ANALOG_INPUT(label="Raw Solar Voltage (V)", value=28)
  avgFilter: AVERAGE(samples=5)
  smoothedVolt: ANALOG_OUTPUT(label="Smoothed Array Voltage (V)")
  minChargeVolt: ANALOG_INPUT(label="Min Charge Threshold (24V)", value=24)
  comp: ANALOG_COMPARATOR(operation="gte")
  chargeActive: OUTPUT(label="Battery Charging Active")

  rawVolt.Q -> avgFilter.A
  avgFilter.Q -> smoothedVolt.A

  avgFilter.Q -> comp.A
  minChargeVolt.Q -> comp.B
  comp.Q -> chargeActive.A
}
`;

const LAB3_DSL = `circuit "Stage 3 - Full Solar Telemetry & Battery Charge Manager" version 1 {
  rawVolt: ANALOG_INPUT(label="Raw PV String Voltage (V)", value=28)
  avgFilter: AVERAGE(samples=5)
  smoothedVolt: ANALOG_OUTPUT(label="Clean Trend Voltage (V)")

  minChargeVolt: ANALOG_INPUT(label="Min Charge Threshold (24V)", value=24)
  maxOverVolt: ANALOG_INPUT(label="Over-Voltage Limit (32V)", value=32)

  isHealthyMin: ANALOG_COMPARATOR(operation="gte")
  isSafeMax: ANALOG_COMPARATOR(operation="lte")
  chargePermissive: AND()

  enableLogging: INPUT(label="Cloud Telemetry Logging Enable", value=true)
  logger: DATA_LOG(interval=500)
  logActiveLamp: OUTPUT(label="Telemetry Data Logging Active")

  chargeContactor: OUTPUT(label="Battery Charge Contactor (KM-101)")
  overvoltAlarm: NOT()
  overvoltLamp: OUTPUT(label="Over-Voltage Hazard Alarm")

  rawVolt.Q -> avgFilter.A
  avgFilter.Q -> smoothedVolt.A

  avgFilter.Q -> isHealthyMin.A
  minChargeVolt.Q -> isHealthyMin.B

  avgFilter.Q -> isSafeMax.A
  maxOverVolt.Q -> isSafeMax.B

  isHealthyMin.Q -> chargePermissive.A
  isSafeMax.Q -> chargePermissive.B
  chargePermissive.Q -> chargeContactor.A

  avgFilter.Q -> logger.A
  enableLogging.Q -> logger.EN
  logger.Q -> logActiveLamp.A

  isSafeMax.Q -> overvoltAlarm.A
  overvoltAlarm.Q -> overvoltLamp.A
}
`;

// Masterclass Object
const masterclassData = {
  slug: 'solar-logging',
  title: 'Solar Array Telemetry: Analog Smoothing, Moving Averages & Data Logging',
  excerpt: 'A beginner-friendly guide to clean sensor data: eliminating cloud-induced voltage ripple with moving average filters, preventing contactor chatter, and logging periodic microgrid telemetry.',
  author: 'Dave Climate & AutomationHub Team',
  date: 'Oct 21',
  readingTime: '12 min read + 15 min labs',
  tag: 'Renewables / IoT',
  views: 8450,
  heroImage: '/solar-logging-blueprint.png',
  sections: [
    {
      type: 'image',
      src: SOLAR_LOGGING_SVG_DATA_URI,
      caption: 'FIG 1.1 // REMOTE SOLAR PV MICROGRID TELEMETRY & MOVING AVERAGE DATA LOGGER',
      alt: 'Solar array telemetry and moving average signal conditioning schematic'
    },
    {
      type: 'markdown',
      content: `## The 4,000 False Alarms & The Weekend Database Crash

Imagine driving down a bumpy, rocky dirt road. If your car speedometer displayed the raw instant speed of each bounce every millisecond, the needle would violently blur between 20 MPH and 50 MPH! You wouldn't be able to read your speed, and your cruise control would violently jerk the throttle.

Modern cars solve this with **digital smoothing**—averaging recent readings to display a smooth, steady number.

In solar energy automation, sensors face the exact same problem from nature: **passing clouds**:

> **The Desert Microgrid Incident:**
> At an off-grid solar microgrid site in Nevada, an engineering intern configured the telemetry station to send an SMS alert whenever the solar battery charging voltage dipped below 24VDC.
> 
> On a partly cloudy Saturday afternoon, puffy cumulus clouds drifted across the desert sky. Every few seconds, the sunlight would dim for a brief moment, causing the raw voltage to dip from 28V down to 22V, and then bounce right back up.
> 
> The raw threshold comparator tripped and untripped continuously! By Sunday evening, the system had spammed over **4,200 text messages** to the plant manager's phone and filled the remote cellular gateway memory to 100%, causing a complete communications lockup.

**The Golden Lesson:** Never connect raw, noisy analog signals directly to alarm thresholds or high-frequency loggers. Always filter transients with a **Moving Average (\`AVERAGE\`)** and log clean, periodic snapshots with a **\`DATA_LOG\`** block.`
    },
    {
      type: 'markdown',
      content: `## Understanding Analog Noise vs. Real Trends

When monitoring physical sensors (like solar voltage, wind speed, or temperature), readings contain two components:

1. **The True Engineering Trend:** The actual, meaningful state of the process (e.g., the sun is shining brightly at midday).
2. **High-Frequency Noise:** Temporary fluctuations caused by electromagnetic interference, cable induction, or passing cloud shadows.

If an automation system reacts to every millisecond of noise:
- Mechanical relays and contactors **chatter violently**, burning out their electrical contacts.
- Data historians and cloud databases get overwhelmed with useless junk data.
- False alarms wake up on-call technicians in the middle of the night.`
    },
    {
      type: 'markdown',
      content: `## Stage 1: The Raw Unfiltered Comparator (Contactor Chattering)

Below is **Stage 1** of our interactive lab. The raw solar voltage is wired directly into an \`ANALOG_COMPARATOR\` with a 24V threshold.

Try adjusting the slider in the simulation below:`
    },
    {
      type: 'lab',
      title: 'Stage 1: Raw Unfiltered Solar Noise',
      step: 'Stage 1 of 3',
      height: 460,
      dsl: LAB1_DSL
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'The Beginner Flaw in Stage 1',
      text: 'In the lab above, drag "Raw Solar Voltage (V)" back and forth across 24V (e.g., 23V, 25V, 22V, 26V). Notice how the Battery Charge Contactor immediately clicks ON and OFF with zero delay! In a real battery room, this rapid contactor chatter creates electrical sparks, welds relay points, and triggers hundreds of nuisance alarms.'
    },
    {
      type: 'markdown',
      content: `## Stage 2: Analog Smoothing with a Moving Average Filter

To solve signal chatter, we pass the raw analog signal through an **\`AVERAGE\`** block.

How a Moving Average Works:
The block maintains a small FIFO memory buffer of recent measurements (e.g., 5 samples):
$$\\text{Smoothed Output} = \\frac{V_1 + V_2 + V_3 + V_4 + V_5}{5}$$

When a brief shadow or voltage spike occurs, its impact is diluted across the buffer. The resulting output is a clean, stable engineering value that reflects the true trend without jitter!

Test this smoothing action in **Stage 2** below:`
    },
    {
      type: 'lab',
      title: 'Stage 2: Analog Smoothing with Moving Average',
      step: 'Stage 2 of 3',
      height: 480,
      dsl: LAB2_DSL
    },
    {
      type: 'callout',
      variant: 'success',
      title: 'Interactive Exercise — Stage 2',
      text: 'Observe "Smoothed Array Voltage (V)". When you change the raw voltage, notice how the filtered value transitions smoothly rather than jumping instantly. This gives the battery charging system a rock-solid, jitter-free signal to make smart decisions.'
    },
    {
      type: 'markdown',
      content: `## Stage 3: Full Microgrid Telemetry & Battery Charge Manager

In a production solar microgrid, the control logic must perform two essential tasks:

1. **Safe Window Charging:** Batteries must only charge when voltage is within safe limits (e.g., **between 24V and 32V**). Below 24V, sunlight is insufficient; above 32V, over-voltage threatens to boil battery electrolyte!
2. **Periodic Telemetry Logging (\`DATA_LOG\`):** Instead of logging continuous streams of data, the \`DATA_LOG\` block samples the clean, smoothed voltage at a steady, configured interval (e.g., every 500ms). This produces compact, orderly datasets ready for cloud transmission via MQTT or cellular IoT.

Below is the complete **Stage 3** production-grade solar telemetry circuit:`
    },
    {
      type: 'lab',
      title: 'Stage 3: Full Solar Telemetry & Battery Charge Manager',
      step: 'Stage 3 of 3',
      height: 560,
      dsl: LAB3_DSL
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'Interactive Exercise — Stage 3',
      text: '1. At normal 28V, notice "Battery Charge Contactor (KM-101)" is energized and "Telemetry Data Logging Active" is TRUE.\\n2. Increase voltage to 34V (simulate a faulty charge controller). The Over-Voltage Hazard Alarm trips and cuts the contactor instantly to protect the battery bank!\\n3. Set voltage to 20V (simulate dusk or heavy overcast). The contactor disconnects safely without chattering.'
    },
    {
      type: 'markdown',
      content: `## Commissioning & Field Calibration Checklist

When deploying analog telemetry or data loggers on a remote solar installation, follow this 5-point field checkout:

1. **Verify Instrument Cable Shielding:** Ensure the shielded drain wire from the voltage transducer (\`VT-101\`) is grounded at **one end only** (at the RTU cabinet) to avoid creating ground loops.
2. **Tune the Averaging Window:** Sizing the sample buffer is a balance: too few samples (e.g., 2) leaves jitter; too many samples (e.g., 50) introduces noticeable phase lag during genuine daylight transitions. 5 to 10 samples is ideal for solar PV strings.
3. **Verify Logging Frequency:** Confirm that data logging intervals match your network budget. On satellite or cellular IoT skids, sampling every 500ms to 5 seconds provides high fidelity without exceeding monthly data caps.
4. **Calibrate Analog Span:** Measure the physical string voltage with a calibrated Fluke multimeter. Ensure the scaled analog reading on the PLC display matches within ±0.1VDC.
5. **Test Over-Voltage Cutoff:** Inject a simulated test voltage of 33VDC into the analog channel and verify the battery charge contactor drops out immediately.

---

### Key Takeaways for Automation Beginners

- **Filter Before Deciding:** Always smooth volatile analog signals before feeding them into comparators or safety trips.
- **Moving Averages (\`AVERAGE\`):** Rolling FIFO buffers flatten noise while preserving genuine physical trends.
- **Save Bandwidth with \`DATA_LOG\`:** Record clean, periodic snapshots rather than flooding databases with millisecond noise.
- **Protect Battery Assets:** Always implement dual-boundary check limits (minimum charge voltage and over-voltage lockout).`
    }
  ]
};

// 1. Write JSON file to automationhub-masterclasses
const jsonPath = path.resolve('automationhub-masterclasses', 'solar-panel-data-logging.json');
fs.writeFileSync(jsonPath, JSON.stringify(masterclassData, null, 2), 'utf-8');
console.log('Saved:', jsonPath);

// Also copy to parent
const parentJsonPath = path.resolve('..', 'automationhub-masterclasses', 'solar-panel-data-logging.json');
try {
  fs.writeFileSync(parentJsonPath, JSON.stringify(masterclassData, null, 2), 'utf-8');
  console.log('Saved:', parentJsonPath);
} catch (e) {
  console.warn('Parent write skipped');
}

// 2. Generate Python script
const pyCode = `#!/usr/bin/env python3
"""
Solar Array Telemetry & Data Logging - Masterclass Generator
Compiles the complete beginner-friendly masterclass for solar analog smoothing,
moving average filters, and microgrid telemetry logging.
"""

import json
import os

DATA = ${JSON.stringify(masterclassData, null, 2)}

def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_file = os.path.join(out_dir, "solar-panel-data-logging.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(DATA, f, indent=2)
    print(f"Exported masterclass to {out_file}")

if __name__ == "__main__":
    main()
`;

const pyPath = path.resolve('automationhub-masterclasses', 'generate_solar_logging.py');
fs.writeFileSync(pyPath, pyCode, 'utf-8');
console.log('Saved:', pyPath);

const parentPyPath = path.resolve('..', 'automationhub-masterclasses', 'generate_solar_logging.py');
try {
  fs.writeFileSync(parentPyPath, pyCode, 'utf-8');
  console.log('Saved:', parentPyPath);
} catch (e) {
  console.warn('Parent py write skipped');
}

console.log('All Solar Logging Masterclass assets successfully generated!');
