export interface ArticleSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  code?: string;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingMinutes: number;
  date: string;
  example?: 'and' | 'start-stop' | 'analog';
  takeaway: string;
  sections: ArticleSection[];
}

export const articles: Article[] = [
  {
    slug: 'understanding-the-scan-cycle',
    title: 'A scan cycle is the unit of thought.',
    excerpt: 'Inputs, logic, outputs. A clear mental model for what happens between a button press and a response.',
    category: 'Fundamentals',
    readingMinutes: 3,
    date: '2026-09-30',
    example: 'and',
    takeaway: 'A circuit is easier to reason about when you can explain its state before and after one scan.',
    sections: [
      {
        id: 'read-evaluate-write',
        heading: 'Read. Evaluate. Write. Repeat.',
        paragraphs: [
          'A useful starting model for a cyclic PLC program is three steps: read the inputs, evaluate the logic, and update the outputs. The controller repeats the sequence. Real controllers also have task scheduling, communication, interrupts, and device-specific I/O behavior, so this model is a starting point rather than a universal timing guarantee.',
          'Think about an AND gate connected to two switches. At the moment the logic is evaluated, both inputs must be true for the output to be true. The gate does not remember that the first switch was true a second ago. It answers a question about the values it receives now.',
        ],
        code: 'A      B      A AND B\nfalse  false  false\ntrue   false  false\nfalse  true   false\ntrue   true   true',
      },
      {
        id: 'state-changes-the-question',
        heading: 'State changes the question.',
        paragraphs: [
          'A latch, timer, or counter has memory. Its next result depends on the current inputs and its previous state. A rising-edge detector is a simple example: it produces a pulse when an input changes from false to true. Holding that input true should not produce a new rising edge on every scan.',
          'This distinction matters when testing. Two circuits can have the same current inputs and different outputs because their histories differ. Record the sequence of input changes, not just a screenshot of the final values.',
        ],
        code: 'Previous input  Current input  Rising edge\nfalse           true           true\ntrue            true           false\ntrue            false          false',
      },
      {
        id: 'test-with-intent',
        heading: 'Make each step answer a question.',
        paragraphs: [
          'Start with the two-input AND example in the lab. Pause the simulation, set the inputs, and advance a scan. Repeat for all four combinations. Then replace a direct signal path with a stateful block and describe what you expect to be remembered.',
          'The Fieldnotes lab is an educational browser simulation. Its scan and timer behavior are defined by its own engine; they do not certify how a particular PLC or physical machine will behave. Browser scheduling is also different from deterministic controller timing.',
        ],
        bullets: ['Write the expected result before changing an input.', 'Check startup and reset, as well as steady operation.', 'For timed behavior, compare simulated elapsed time with the configured duration.'],
      },
    ],
  },
  {
    slug: 'building-a-start-stop-circuit',
    title: 'Build a start–stop circuit you can explain.',
    excerpt: 'Use a reset-priority latch to turn momentary commands into a predictable running state.',
    category: 'Control patterns',
    readingMinutes: 3,
    date: '2026-09-30',
    example: 'start-stop',
    takeaway: 'Define the meaning and priority of every input before you connect the blocks.',
    sections: [
      {
        id: 'name-the-signals',
        heading: 'First, name what true means.',
        paragraphs: [
          'For this teaching circuit, Start = true means a start command is present, and Stop = true means a stop command is present. The output Run represents a remembered request to run. Naming these meanings explicitly prevents a surprisingly common problem: confusing a stop request with a healthy stop circuit.',
          'Physical normally closed stop contacts often produce a healthy signal while unpressed. That is a different signal convention. Translate device states into clearly named logical signals before using this pattern on a real control design.',
        ],
      },
      {
        id: 'remember-the-command',
        heading: 'Give the stop command priority.',
        paragraphs: [
          'Connect Start to the set input of a reset-priority latch and Stop to its reset input. A start pulse sets the output. Releasing Start leaves the output set. A stop command resets it. When Start and Stop are both true, reset takes priority and the output is false.',
          'The following expression describes the state transition. Run_previous is the stored output before the transition; Run_next is the result afterward.',
        ],
        code: 'Run_next = (Start OR Run_previous) AND NOT Stop',
      },
      {
        id: 'test-the-transitions',
        heading: 'Test the sequence, including the awkward cases.',
        paragraphs: [
          'Open the example and begin with both commands false and the Permissive input true. Assert Start, observe the Run memory and Motor command, and release Start. Then assert Stop and check that Run clears. These transitions exercise the memory behavior that a single truth table of current inputs cannot capture.',
          'Also hold Start true while Stop is asserted. The output must remain false while Stop is true. With this basic pattern, releasing Stop while Start remains true allows Run to set again. If a new start edge is required after stopping, the design needs additional logic. State the restart requirement before extending the circuit.',
        ],
        bullets: ['Startup: both commands false, Run false.', 'Start then release: Run remains true.', 'Stop: Run becomes false.', 'Both commands true: Stop wins.', 'Stop released with Start held: examine the intended restart behavior.'],
      },
      {
        id: 'extend-the-pattern',
        heading: 'Add permissives as explicit requirements.',
        paragraphs: [
          'The example includes a process permissive that is ANDed with the stored run request. Turning Permissive off blocks the motor output but leaves Run memory set. Turning it back on allows the motor command to return. Try this sequence, then consider how the circuit would change if loss of the permissive had to clear the stored request as well.',
          'This example teaches ordinary control logic. Emergency stops, protective interlocks, and physical machine safety require their own engineered hardware and validated design; an educational browser circuit is not a safety controller.',
        ],
      },
    ],
  },
  {
    slug: 'analog-signals-to-engineering-units',
    title: 'Give an analog signal a useful meaning.',
    excerpt: 'A raw number is only the beginning. Scale it, name its units, and test the boundaries.',
    category: 'Analog essentials',
    readingMinutes: 3,
    date: '2026-09-30',
    example: 'analog',
    takeaway: 'A useful analog value includes a range, a unit, and a defined response to invalid input.',
    sections: [
      {
        id: 'define-both-ranges',
        heading: 'Start with two ranges.',
        paragraphs: [
          'An analog input module supplies a numerical representation of a measurement. Your process logic usually needs engineering units: temperature in degrees, pressure in bar, or tank level in percent. Scaling maps the configured raw input range onto that engineering range.',
          'For a deliberately simple example, assume a raw range of 0 to 1000 represents a tank level of 0 to 100 percent. A raw reading of 250 represents 25 percent. These raw limits are illustrative: use the actual module configuration and sensor calibration for a physical installation.',
          'The linked lab exercise applies the same principle to an input range of 4–20 and an output range of 0–100. Its amplifier uses gain 6.25 and offset −25, so an input of 12 gives an output of 50. Change the input to 4 and 20 to check the endpoints.',
        ],
        code: 'engineering = engineeringMin\n  + (raw - rawMin)\n  * (engineeringMax - engineeringMin)\n  / (rawMax - rawMin)\n\nExample: 0 + (250 - 0) * (100 - 0) / (1000 - 0)\nResult:  25 %',
      },
      {
        id: 'boundaries-are-behavior',
        heading: 'The boundaries are part of the behavior.',
        paragraphs: [
          'Check the lower endpoint, midpoint, and upper endpoint. Then deliberately go outside the range. A linear scaling expression extrapolates: raw 1100 becomes 110 percent in this example. Clamping the result to 100 percent may make a display neater, but it can conceal an over-range condition unless validity is tracked separately.',
          'A zero-width raw range would divide by zero. Treat it as a configuration error. Also decide how missing, non-finite, or invalid values are represented. A plausible-looking zero is not always a useful substitute for an unavailable measurement.',
        ],
        bullets: ['raw = 0 → 0 %', 'raw = 500 → 50 %', 'raw = 1000 → 100 %', 'raw = 1100 → 110 % before any explicit clamp', 'rawMin = rawMax → invalid configuration'],
      },
      {
        id: 'separate-scaling-from-control',
        heading: 'Keep measurement and control understandable.',
        paragraphs: [
          'Give the scaled signal a name that includes its meaning, such as TankLevelPercent. Place thresholds after scaling so the threshold values are understandable in the same units. If noisy input makes an output flicker around a threshold, investigate filtering and hysteresis as separate behaviors.',
          'For example, a high-level indicator can turn on at 80 percent and clear below 75 percent. The gap prevents tiny movements around 80 percent from repeatedly changing the indicator. Document what happens exactly at each threshold and test both rising and falling values.',
          'The component library tracks analog blocks alongside their implementation status. Use that status to distinguish the available lab exercises from the planned control tools.',
        ],
      },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

export function formatArticleDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}
