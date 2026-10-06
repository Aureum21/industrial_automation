import React from 'react';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readingTime: string;
  tag: string;
  views: number;
  content: React.ReactNode;
  dsl: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'water-treatment',
    title: 'Building a Water Treatment Simulator',
    excerpt: 'An introduction to interlocking logic using RS Latches and logic gates.',
    author: 'John Doe',
    date: 'Sep 25',
    readingTime: '12 min read',
    tag: 'Control Systems',
    views: 18450,
    content: (
      <>
        <p>When designing a control system for a water treatment facility, one of the most fundamental concepts to master is interlocking logic. We need to ensure that the primary pump cannot start unless the intake valve is fully open, and we need a system to gracefully shut down the pump if the tank level exceeds the high-level limit.</p>
        <p>In our logic, this is handled with a mix of latches and AND gates. I have embedded the simulation below. Try toggling the <strong>Intake Valve</strong> and then press the <strong>Start Button</strong> to see how the RS Latch holds the state of the motor.</p>
        <p>Once the latch is set, releasing the start button doesn't stop the motor. The only way to stop the process is by triggering the Reset pin, which in our case is wired to the High-Level Sensor.</p>
      </>
    ),
    dsl: `
      valve = INPUT(label: "Intake Valve")
      start = INPUT(label: "Start Button")
      stop = INPUT(label: "High Level Sensor")
      
      can_start = AND()
      valve -> can_start.A
      start -> can_start.B
      
      latch = RS_LATCH()
      can_start -> latch.S
      stop -> latch.R
      
      pump = OUTPUT(label: "Main Pump")
      latch -> pump
    `
  },
  {
    slug: 'pid-oven-tuning',
    title: 'PID Control for Temperature Regulation',
    excerpt: "Tuning an oven's temperature using proportional, integral, and derivative logic.",
    author: 'Alex Engineer',
    date: 'Oct 1',
    readingTime: '5 min read',
    tag: 'Control Systems',
    views: 24190,
    content: (
      <>
        <p>PID loops are the backbone of analog automation. In this example, we control the heating element of an industrial oven. We have an analog setpoint and an analog sensor reading the current temperature.</p>
        <p>The PI_CONTROLLER block calculates the difference (error) and applies a Proportional-Integral algorithm to adjust the analog output. We then feed this output into a PWM (Pulse Width Modulation) block to switch the heating coils on and off rapidly, simulating an analog voltage using digital hardware.</p>
        <p>Play with the setpoint in the simulation below. Notice how the PI controller smoothly adjusts the PWM duty cycle, and the Ramp block simulates the physical inertia of the oven heating up and cooling down.</p>
      </>
    ),
    dsl: `
      setpoint = ANALOG_INPUT(label: "Target Temp (C)", value: 150)
      sensor = ANALOG_RAMP(riseRate: 10, fallRate: 2, label: "Actual Temp")
      
      pid = PI_CONTROLLER(kp: 2, ki: 0.5)
      setpoint -> pid.SP
      sensor -> pid.PV
      
      pwm = PWM(period: 1000)
      pid -> pwm.A
      
      heater = OUTPUT(label: "Heater Coil")
      pwm -> heater
      
      # Feed the heater back to the ramp to simulate heat
      heat_val = ANALOG_MUX()
      heater -> heat_val.S
      zero = ANALOG_CONSTANT(value: 20)
      full = ANALOG_CONSTANT(value: 300)
      zero -> heat_val.A
      full -> heat_val.B
      
      heat_val -> sensor.A
    `
  },
  {
    slug: 'traffic-lights',
    title: 'Automated Traffic Light Sequence',
    excerpt: 'Building a 3-state state machine using TON timers and logic gates.',
    author: 'Sarah Dev',
    date: 'Sep 28',
    readingTime: '8 min read',
    tag: 'Logic',
    views: 11340,
    content: (
      <>
        <p>State machines are notoriously tricky in visual block programming, but cascading timers make it easy. We use three TON (Timer On Delay) blocks to represent the duration of the Green, Yellow, and Red lights.</p>
        <p>When the sequence starts, the Green timer counts. Once it finishes, it triggers the Yellow timer, which triggers the Red timer. The Red timer's completion resets the Green timer, causing a continuous loop.</p>
        <p>Toggle the "Enable Sequence" switch below to see the cascade in action.</p>
      </>
    ),
    dsl: `
      enable = INPUT(label: "Enable Sequence")
      
      green_timer = TON(duration: 4000)
      yellow_timer = TON(duration: 1500)
      red_timer = TON(duration: 4000)
      
      # Green is on when enabled but green timer hasn't finished
      not_green_done = NOT()
      green_timer -> not_green_done
      
      is_green = AND()
      enable -> is_green.A
      not_green_done -> is_green.B
      
      # Yellow starts when green is done
      green_timer -> yellow_timer
      not_yellow_done = NOT()
      yellow_timer -> not_yellow_done
      
      is_yellow = AND()
      green_timer -> is_yellow.A
      not_yellow_done -> is_yellow.B
      
      # Red starts when yellow is done
      yellow_timer -> red_timer
      not_red_done = NOT()
      red_timer -> not_red_done
      
      is_red = AND()
      yellow_timer -> is_red.A
      not_red_done -> is_red.B
      
      # Loop reset (if red is done, reset green)
      # In FBD, we can break the loop by turning off the green timer
      reset_loop = NOT()
      red_timer -> reset_loop
      
      run_green = AND()
      enable -> run_green.A
      reset_loop -> run_green.B
      
      run_green -> green_timer.A
      
      g_out = OUTPUT(label: "Green Light")
      is_green -> g_out
      y_out = OUTPUT(label: "Yellow Light")
      is_yellow -> y_out
      r_out = OUTPUT(label: "Red Light")
      is_red -> r_out
    `
  },
  {
    slug: 'conveyor-sorting',
    title: 'Conveyor Belt Sorting System',
    excerpt: 'Using sensors and timers to divert packages accurately.',
    author: 'Mike Systems',
    date: 'Sep 22',
    readingTime: '6 min read',
    tag: 'Logistics',
    views: 7620,
    content: (
      <>
        <p>A sorting conveyor requires precise timing. When a sensor detects a defective package, the diverter arm shouldn't swing immediately—it has to wait until the package travels down the belt to the diverter position.</p>
        <p>We solve this using a TOF (Timer Off Delay) combined with a TON. The TOF extends the sensor pulse to ensure it's captured, and the TON delays the diverter actuation by exactly the travel time (e.g., 2000ms).</p>
        <p>Test the logic by briefly pulsing the "Defect Sensor" below and watch the diverter actuate 2 seconds later.</p>
      </>
    ),
    dsl: `
      sensor = INPUT(label: "Defect Sensor")
      belt_running = INPUT(label: "Belt Running")
      
      pulse = TOF(duration: 500)
      sensor -> pulse
      
      # Only process if belt is running
      active_defect = AND()
      pulse -> active_defect.A
      belt_running -> active_defect.B
      
      travel_delay = TON(duration: 2000)
      active_defect -> travel_delay
      
      divert_pulse = TOF(duration: 1000)
      travel_delay -> divert_pulse
      
      diverter = OUTPUT(label: "Diverter Arm")
      divert_pulse -> diverter
    `
  },
  {
    slug: 'two-hand-safety',
    title: 'Two-Hand Safety Interlock',
    excerpt: 'Ensuring operator safety with strict timing logic.',
    author: 'Emma Safety',
    date: 'Sep 20',
    readingTime: '7 min read',
    tag: 'Safety',
    views: 15200,
    content: (
      <>
        <p>Industrial presses often require the operator to press two buttons simultaneously (one for each hand) to ensure their hands are out of the danger zone. To prevent the operator from simply taping one button down, the logic dictates that both buttons must be pressed within 500ms of each other.</p>
        <p>We use Edge Triggers (R_TRIG) and Timers to enforce this strict window. If the window expires, the operator must release both buttons and try again.</p>
        <p>Try pressing both buttons in the simulation. If you leave one pressed for too long before pressing the second, the press will not actuate.</p>
      </>
    ),
    dsl: `
      btn1 = INPUT(label: "Left Hand Button")
      btn2 = INPUT(label: "Right Hand Button")
      
      edge1 = R_TRIG()
      btn1 -> edge1
      
      edge2 = R_TRIG()
      btn2 -> edge2
      
      timer1 = TOF(duration: 500)
      edge1 -> timer1
      
      timer2 = TOF(duration: 500)
      edge2 -> timer2
      
      valid1 = AND()
      timer1 -> valid1.A
      btn2 -> valid1.B
      
      valid2 = AND()
      timer2 -> valid2.A
      btn1 -> valid2.B
      
      valid = OR()
      valid1 -> valid.A
      valid2 -> valid.B
      
      both_held = AND()
      btn1 -> both_held.A
      btn2 -> both_held.B
      
      latch = RS_LATCH()
      valid -> latch.S
      
      not_held = NOT()
      both_held -> not_held
      not_held -> latch.R
      
      press = OUTPUT(label: "Actuate Press")
      latch -> press
    `
  },
  {
    slug: 'hvac-economizer',
    title: 'HVAC Economizer Logic',
    excerpt: 'Saving energy by using outdoor air when temperatures are favorable.',
    author: 'Dave Climate',
    date: 'Sep 18',
    readingTime: '4 min read',
    tag: 'HVAC',
    views: 5210,
    content: (
      <>
        <p>An HVAC economizer saves energy by drawing in fresh outside air when the outdoor temperature is cooler than the indoor return air, providing "free cooling."</p>
        <p>We use an ANALOG_COMPARATOR to check if Outside Temp &lt; Return Temp. If true, and there is a call for cooling from the thermostat, the system opens the outside damper instead of running the energy-heavy compressor.</p>
        <p>Adjust the temperatures in the simulation to see when the damper opens.</p>
      </>
    ),
    dsl: `
      out_temp = ANALOG_INPUT(label: "Outside Temp (F)", value: 65)
      in_temp = ANALOG_INPUT(label: "Return Temp (F)", value: 75)
      call_cool = INPUT(label: "Thermostat Call for Cool")
      
      comp = ANALOG_COMPARATOR(operation: "lt")
      out_temp -> comp.A
      in_temp -> comp.B
      
      damper_logic = AND()
      comp -> damper_logic.A
      call_cool -> damper_logic.B
      
      damper = OUTPUT(label: "Open Fresh Air Damper")
      damper_logic -> damper
      
      # If cooling is called but outside is hotter, run compressor
      not_economize = NOT()
      comp -> not_economize
      
      comp_logic = AND()
      not_economize -> comp_logic.A
      call_cool -> comp_logic.B
      
      compressor = OUTPUT(label: "Run AC Compressor")
      comp_logic -> compressor
    `
  },
  {
    slug: 'tank-hysteresis',
    title: 'Tank Level Hysteresis Control',
    excerpt: 'Preventing pump short-cycling with differential triggers.',
    author: 'John Doe',
    date: 'Sep 15',
    readingTime: '6 min read',
    tag: 'Control Systems',
    views: 12900,
    content: (
      <>
        <p>If you use a simple comparator to turn on a pump when a tank drops below 50%, the pump will turn on at 49.9% and off at 50.1%, rapidly cycling on and off. This "short-cycling" destroys motors.</p>
        <p>The solution is Hysteresis. We use an ANALOG_DIFFERENTIAL block to turn the pump on when the level drops below 20%, and keep it on until the level reaches 80%.</p>
        <p>Watch the pump state in the simulation below as you manually adjust the Tank Level analog input.</p>
      </>
    ),
    dsl: `
      level = ANALOG_INPUT(label: "Tank Level %", value: 50)
      
      # We want pump ON when level < 20, OFF when level > 80.
      # The differential block turns ON when A >= onThreshold, OFF when A < offThreshold.
      # So we can invert the logic, or use math. Let's invert the level: 100 - level
      
      hundred = ANALOG_CONSTANT(value: 100)
      math = MATH(operation: "subtract")
      hundred -> math.A
      level -> math.B
      
      # Now math Q is (100 - level).
      # Turn on when math > 80 (level < 20). Turn off when math < 20 (level > 80).
      
      diff = ANALOG_DIFFERENTIAL(onThreshold: 80, offThreshold: 20)
      math -> diff.A
      
      pump = OUTPUT(label: "Fill Pump")
      diff -> pump
    `
  },
  {
    slug: 'pump-alternator',
    title: 'Motor Duty Cycling (Alternating Pumps)',
    excerpt: 'Extending equipment life by alternating two identical pumps.',
    author: 'Alex Engineer',
    date: 'Sep 10',
    readingTime: '9 min read',
    tag: 'Maintenance',
    views: 9870,
    content: (
      <>
        <p>In municipal water stations, two identical pumps are often installed. To ensure equal wear, they alternate cycles: Pump A runs for the first cycle, Pump B for the second, and so on.</p>
        <p>A PULSE_RELAY (toggle flip-flop) is perfect for this. Every time the call for water ends (falling edge), the toggle switches state. Depending on the toggle state, the next call for water is routed to either Pump A or Pump B using AND gates.</p>
      </>
    ),
    dsl: `
      call = INPUT(label: "Call for Water")
      
      # Detect falling edge to switch pumps for NEXT cycle
      edge = F_TRIG()
      call -> edge
      
      toggle = PULSE_RELAY()
      edge -> toggle
      
      not_toggle = NOT()
      toggle -> not_toggle
      
      pumpA = AND()
      call -> pumpA.A
      not_toggle -> pumpA.B
      
      pumpB = AND()
      call -> pumpB.A
      toggle -> pumpB.B
      
      outA = OUTPUT(label: "Pump A")
      pumpA -> outA
      
      outB = OUTPUT(label: "Pump B")
      pumpB -> outB
    `
  },
  {
    slug: 'esd-delays',
    title: 'Emergency Shutdown Sequence (ESD)',
    excerpt: 'Cascading delays to safely spin down hazardous processes.',
    author: 'Emma Safety',
    date: 'Sep 05',
    readingTime: '6 min read',
    tag: 'Safety',
    views: 6540,
    content: (
      <>
        <p>When an Emergency Stop (E-Stop) is pressed, you cannot always kill power to everything instantly. Some processes require valves to close immediately to starve a reaction, while cooling pumps must run for an additional 10 seconds to prevent overheating.</p>
        <p>In this circuit, we use a normally-closed E-Stop button. When it breaks (goes false), the valves drop out immediately. The cooling pump, however, is fed through a TOF (Timer Off Delay), keeping it alive for a brief duration after the shutdown signal.</p>
      </>
    ),
    dsl: `
      estop = NC_INPUT(label: "E-Stop (NC)")
      run_cmd = INPUT(label: "Normal Run Command")
      
      sys_ok = AND()
      estop -> sys_ok.A
      run_cmd -> sys_ok.B
      
      valve = OUTPUT(label: "Feed Valve")
      sys_ok -> valve
      
      # Cooling pump runs if sys_ok is true, OR for 3s after it goes false
      pump_delay = TOF(duration: 3000)
      sys_ok -> pump_delay
      
      pump = OUTPUT(label: "Cooling Pump")
      pump_delay -> pump
    `
  },
  {
    slug: 'solar-logging',
    title: 'Data Logging for a Solar Panel Array',
    excerpt: 'Smoothing and recording volatile analog signals over time.',
    author: 'Dave Climate',
    date: 'Sep 02',
    readingTime: '5 min read',
    tag: 'Renewables',
    views: 3890,
    content: (
      <>
        <p>Solar panel voltage fluctuates rapidly due to passing clouds. If we log raw data directly, the chart becomes noisy and difficult to read.</p>
        <p>By passing the analog signal through an AVERAGE block (moving average), we smooth out the transients. We then use a DATA_LOG block to record a sample every 500ms, giving us a clean, actionable dataset.</p>
        <p>Adjust the "Solar Voltage" randomly in the simulation and observe the smoothed output.</p>
      </>
    ),
    dsl: `
      voltage = ANALOG_INPUT(label: "Raw Solar Voltage", value: 12)
      
      # Smooth over 10 samples
      avg = AVERAGE(samples: 10)
      voltage -> avg.A
      
      smoothed = ANALOG_OUTPUT(label: "Smoothed Output")
      avg -> smoothed
      
      log_enable = INPUT(label: "Enable Logging")
      logger = DATA_LOG(interval: 500)
      avg -> logger.A
      log_enable -> logger.EN
    `
  }
];
