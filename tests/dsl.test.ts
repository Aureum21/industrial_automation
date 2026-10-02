import assert from 'node:assert/strict';
import test from 'node:test';
import { BLOCK_CATALOG, BLOCK_DEFINITIONS } from '../src/lib/automation/catalog.ts';
import { createBlock } from '../src/lib/automation/documents.ts';
import { CircuitDSLParseError, parseCircuitDSL, stringifyCircuitDSL } from '../src/lib/automation/dsl.ts';
import { EXAMPLES } from '../src/lib/automation/examples.ts';
import { runCircuitTest } from '../src/lib/automation/testing.ts';
import type { BlockDefinition, CircuitDocument } from '../src/lib/automation/types.ts';

const parse = (body: string, catalog: Record<string, BlockDefinition> = BLOCK_CATALOG) =>
  parseCircuitDSL(`circuit "Test" version 1 {\n${body}\n}`, catalog);

function expectParseError(code: string, pattern?: RegExp, line?: number, column?: number) {
  assert.throws(() => parseCircuitDSL(code, BLOCK_CATALOG), error => {
    assert.ok(error instanceof CircuitDSLParseError);
    assert.ok(Number.isInteger(error.line) && error.line > 0);
    assert.ok(Number.isInteger(error.column) && error.column > 0);
    assert.match(error.message, /line \d+, column \d+/i);
    if (pattern) assert.match(error.message, pattern);
    if (line !== undefined) assert.equal(error.line, line);
    if (column !== undefined) assert.equal(error.column, column);
    return true;
  });
}

// Layout and wire identities are intentionally outside the text grammar.
function normalize(document: CircuitDocument): CircuitDocument {
  return JSON.parse(JSON.stringify({
    ...document,
    blocks: document.blocks.map(block => ({
      ...block,
      position: { x: 0, y: 0 },
      params: {
        ...Object.fromEntries(BLOCK_CATALOG[block.type].parameters.map(parameter => [parameter.key, parameter.defaultValue])),
        ...block.params,
      },
    })),
    connections: document.connections.map((connection, index) => ({ ...connection, id: `wire_${index + 1}` })),
  }));
}

test('DSL parses a timer circuit using real catalog pins and settings', () => {
  const document = parse(`
    I1: INPUT(label="Start", tag="start", value=false)
    T1: TON(duration=2000)
    Q1: OUTPUT(label="Fan")
    I1.Q -> T1.A
    T1.Q -> Q1.A
  `);
  assert.equal(document.version, 1);
  assert.equal(document.name, 'Test');
  assert.deepEqual(document.blocks, [
    { id: 'I1', type: 'INPUT', position: { x: 0, y: 0 }, label: 'Start', tag: 'start', value: false, params: {} },
    { id: 'T1', type: 'TON', position: { x: 0, y: 0 }, params: { duration: 2000 } },
    { id: 'Q1', type: 'OUTPUT', position: { x: 0, y: 0 }, label: 'Fan', params: {} },
  ]);
  assert.deepEqual(document.connections, [
    { id: 'wire_1', fromBlockId: 'I1', fromPin: 'Q', toBlockId: 'T1', toPin: 'A' },
    { id: 'wire_2', fromBlockId: 'T1', fromPin: 'Q', toBlockId: 'Q1', toPin: 'A' },
  ]);
});

test('parsed DSL executes with the existing deterministic scenario runner', () => {
  const document = parse('start: INPUT() timer: TON(duration=250) out: OUTPUT() start.Q -> timer.A timer.Q -> out.A');
  const result = runCircuitTest(document, {
    name: 'Exact timer boundary and reset',
    steps: [
      { inputs: { start: true }, afterMs: 249, expect: [{ blockId: 'out', pin: 'Q', value: false }, { blockId: 'timer', pin: 'ET', value: 249 }] },
      { inputs: {}, afterMs: 1, expect: [{ blockId: 'out', pin: 'Q', value: true }] },
      { inputs: { start: false }, afterMs: 100, expect: [{ blockId: 'out', pin: 'Q', value: false }, { blockId: 'timer', pin: 'ET', value: 0 }] },
    ],
  });
  assert.equal(result.passed, true);
});

test('empty circuits, unicode names, whitespace, and end-of-file comments are accepted', () => {
  const document = parseCircuitDSL('// hello\r\ncircuit\t"مضخة — 水"\r\nversion 1 { // empty\r\n}\t// done', BLOCK_CATALOG);
  assert.deepEqual(document, { version: 1, name: 'مضخة — 水', blocks: [], connections: [] });
  assert.deepEqual(parseCircuitDSL(stringifyCircuitDSL(document), BLOCK_CATALOG), document);
});

test('comments can separate tokens without terminating statements or corrupting strings', () => {
  const label = 'https://example.test/line // "Start"\nnext\\path\tend';
  const code = `circuit "Escapes" version 1 {
    I1 // id
    : // type
    INPUT // settings
    (label // key
    = ${JSON.stringify(label)}, value=false)
    Q1:OUTPUT()
    I1 // source
    . Q // arrow
    -> Q1 . // input
    A
  }`;
  const document = parseCircuitDSL(code, BLOCK_CATALOG);
  assert.equal(document.blocks[0].label, label);
  assert.equal(document.connections.length, 1);
  assert.deepEqual(parseCircuitDSL(stringifyCircuitDSL(document), BLOCK_CATALOG), document);
});

test('forward references and fanout retain wire statement order', () => {
  const document = parse('source.Q -> out.A source.Q -> gate.B gate: AND() out: OUTPUT() source: INPUT(value=true)');
  assert.deepEqual(document.blocks.map(block => block.id), ['gate', 'out', 'source']);
  assert.deepEqual(document.connections.map(connection => [connection.id, connection.toBlockId, connection.toPin]), [
    ['wire_1', 'out', 'A'], ['wire_2', 'gate', 'B'],
  ]);
});

test('parser leaves feedback execution policy and planned block availability to the engine', () => {
  const feedback = parse('memory: RS_LATCH() memory.Q -> memory.S');
  assert.equal(feedback.connections.length, 1);
  const planned = BLOCK_DEFINITIONS.find(definition => definition.status === 'planned')!;
  assert.equal(parse(`future: ${planned.type}()`).blocks[0].type, planned.type);
});

test('catalog defaults are filled without modifying the catalog', () => {
  const snapshot = structuredClone(BLOCK_CATALOG);
  const document = parse('timer: TON() math: MATH()');
  for (const block of document.blocks) {
    assert.deepEqual(block.params, Object.fromEntries(BLOCK_CATALOG[block.type].parameters.map(parameter => [parameter.key, parameter.defaultValue])));
  }
  assert.deepEqual(BLOCK_CATALOG, snapshot);
});

test('metadata false, zero, and empty strings survive formatting along with a value parameter', () => {
  const document = parse('digital: INPUT(label="", tag="", value=false) analog: ANALOG_INPUT(value=0, params.value=17) constant: ANALOG_CONSTANT(params.value=0)');
  assert.deepEqual(document.blocks[1].params, { value: 17 });
  assert.equal(document.blocks[1].value, 0);
  const source = stringifyCircuitDSL(document);
  assert.match(source, /params\.value/);
  assert.deepEqual(parseCircuitDSL(source, BLOCK_CATALOG), document);
});

test('finite scientific and negative numeric literals are preserved', () => {
  const document = parse('gain: ANALOG_AMPLIFIER(gain=6.25e-2, offset=-2.5e1)');
  assert.deepEqual(document.blocks[0].params, { gain: 0.0625, offset: -25 });
  assert.deepEqual(parseCircuitDSL(stringifyCircuitDSL(document), BLOCK_CATALOG), document);
});

test('quoted IDs and pin names support UUIDs, spaces, punctuation, and escaped quotes', () => {
  const catalog = {
    INPUT: { ...BLOCK_CATALOG.INPUT, outputs: [{ id: 'out." Q', label: 'Q', kind: 'digital' as const }] },
    OUTPUT: { ...BLOCK_CATALOG.OUTPUT, inputs: [{ id: 'input pin', label: 'A', kind: 'digital' as const }] },
  };
  const sourceId = '550e8400-e29b-41d4-a716-446655440000';
  const targetId = 'motor.1 / 主';
  const document = parse(`${JSON.stringify(sourceId)}: INPUT() ${JSON.stringify(targetId)}: OUTPUT()
    ${JSON.stringify(sourceId)}.${JSON.stringify('out." Q')} -> ${JSON.stringify(targetId)}."input pin"`, catalog);
  assert.equal(document.connections[0].fromBlockId, sourceId);
  assert.equal(document.connections[0].toBlockId, targetId);
  assert.deepEqual(parseCircuitDSL(stringifyCircuitDSL(document), catalog), document);
});

test('custom boolean and text parameters validate and preserve falsy values', () => {
  const catalog = {
    INPUT: {
      ...BLOCK_CATALOG.INPUT,
      outputs: [{ id: 'Q', label: 'Q', kind: 'text' as const }],
      parameters: [
        { key: 'enabled', label: 'Enabled', type: 'boolean' as const, defaultValue: true },
        { key: 'text', label: 'Text', type: 'text' as const, defaultValue: 'default' },
      ],
    },
  };
  const document = parse('text: INPUT(value="", enabled=false, text="")', catalog);
  assert.equal(document.blocks[0].value, '');
  assert.deepEqual(document.blocks[0].params, { enabled: false, text: '' });
  assert.deepEqual(parseCircuitDSL(stringifyCircuitDSL(document), catalog), document);
  assert.throws(() => parse('text: INPUT(enabled="false")', catalog), CircuitDSLParseError);
  assert.throws(() => parse('text: INPUT(text=false)', catalog), CircuitDSLParseError);
});

test('parameter namespace distinguishes all reserved metadata names', () => {
  const catalog = {
    INPUT: {
      ...BLOCK_CATALOG.INPUT,
      parameters: ['label', 'tag', 'value'].map(key => ({ key, label: key, type: 'text' as const, defaultValue: 'default' })),
    },
  };
  const document = parse('I: INPUT(label="Switch", tag="bus", value=false, params.label="parameter label", params.tag="parameter tag", params.value="parameter value")', catalog);
  assert.equal(document.blocks[0].label, 'Switch');
  assert.equal(document.blocks[0].tag, 'bus');
  assert.equal(document.blocks[0].value, false);
  assert.deepEqual(document.blocks[0].params, { label: 'parameter label', tag: 'parameter tag', value: 'parameter value' });
  assert.deepEqual(parseCircuitDSL(stringifyCircuitDSL(document), catalog), document);
});

test('unknown types, including inherited Object names, cannot enter a document', () => {
  for (const type of ['FUTURE_BLOCK', 'toString', 'constructor', '__proto__']) {
    expectParseError(`circuit "Bad" version 1 {\n  B: ${type}()\n}`, /unknown.*type/i, 2);
  }
});

test('unknown source and target blocks fail even with forward references enabled', () => {
  expectParseError('circuit "Bad" version 1 { out: OUTPUT() missing.Q -> out.A }', /missing/i);
  expectParseError('circuit "Bad" version 1 { source: INPUT() source.Q -> missing.A }', /missing/i);
});

test('unknown pins report the endpoint, pin direction, available pins, and source line', () => {
  expectParseError('circuit "Bad" version 1 {\r\n T1: TON()\r\n out: OUTPUT()\r\n T1.Z -> out.A\r\n}', /T1\.Z.*output pin.*Q.*ET/i, 4);
  expectParseError('circuit "Bad" version 1 { source: INPUT() T1: TON() source.Q -> T1.Z }', /T1\.Z.*input pin.*A/i);
});

test('multiple drivers and repeated identical wires are rejected at the second wire', () => {
  for (const second of ['second.Q -> out.A', 'first.Q -> out.A']) {
    expectParseError(`circuit "Bad" version 1 {
      first: INPUT() second: INPUT() out: OUTPUT()
      first.Q -> out.A
      ${second}
    }`, /(?=.*out\.A)(?=.*(?:already|driver|driv|connect))/i, 4);
  }
});

test('input occupancy keys cannot collide when block and pin names contain dots', () => {
  const catalog = {
    INPUT: BLOCK_CATALOG.INPUT,
    OUTPUT: { ...BLOCK_CATALOG.OUTPUT, inputs: [
      { id: 'C', label: 'C', kind: 'digital' as const },
      { id: 'B.C', label: 'B.C', kind: 'digital' as const },
    ] },
  };
  assert.equal(parse('I: INPUT() "A.B": OUTPUT() A: OUTPUT() I.Q -> "A.B".C I.Q -> A."B.C"', catalog).connections.length, 2);
});

test('wires must connect compatible signal kinds', () => {
  expectParseError('circuit "Bad" version 1 { I: INPUT() Q: ANALOG_OUTPUT() I.Q -> Q.A }', /digital.*analog/i);
  expectParseError('circuit "Bad" version 1 { I: ANALOG_INPUT() Q: OUTPUT() I.Q -> Q.A }', /analog.*digital/i);
});

test('duplicate block identities and duplicate settings cannot silently overwrite values', () => {
  expectParseError('circuit "Bad" version 1 { B: INPUT() B: OUTPUT() }', /duplicate|already.*(block|defined)/i);
  for (const body of ['T: TON(duration=1, duration=2)', 'T: TON(duration=1, params.duration=2)', 'I: INPUT(label="a", label="b")']) {
    expectParseError(`circuit "Bad" version 1 { ${body} }`, /duplicate|already.*(setting|parameter|specified)/i);
  }
});

test('unknown settings and invalid metadata or parameter types fail clearly', () => {
  expectParseError('circuit "Bad" version 1 { T: TON(duraton=10) }', /duraton/i);
  for (const body of ['T: TON(duration="100")', 'T: TON(duration=true)', 'I: INPUT(label=false)', 'I: INPUT(tag=7)']) {
    expectParseError(`circuit "Bad" version 1 { ${body} }`);
  }
});

test('numeric range limits and select choices come from the supplied catalog', () => {
  for (const body of ['T: TON(duration=-1)', 'K: TD_FUNCTION_KEY(key=5)', 'M: MATH(operation="execute")']) {
    expectParseError(`circuit "Bad" version 1 { ${body} }`);
  }
  assert.equal(parse('T: TON(duration=0)').blocks[0].params.duration, 0);
  assert.equal(parse('K: TD_FUNCTION_KEY(key=4)').blocks[0].params.key, 4);
});

test('non-finite numbers, expressions, collections, and non-JSON scalars are rejected', () => {
  for (const value of ['1e400', '-1e400', 'NaN', 'Infinity', 'null', '[]', '{}', '1+2', '2s']) {
    expectParseError(`circuit "Bad" version 1 { T: TON(duration=${value}) }`);
  }
});

test('invalid strings and malformed grammar report locations rather than accepting a prefix', () => {
  const invalid = [
    'circuit "Unclosed version 1 {}',
    'circuit "Bad\\q" version 1 {}',
    'circuit "Bad\nname" version 1 {}',
    'circuit "Bad" version 2 {}',
    'circuit "Bad" version 1 {',
    'circuit "Bad" version 1 {} extra',
    'circuit "Bad" version 1 {} circuit "Other" version 1 {}',
    'circuit "Bad" version 1 { T: TON(duration=1 label="bad") }',
    'circuit "Bad" version 1 { I: INPUT() Q: OUTPUT() I.Q - > Q.A }',
    'circuit "Bad" version 1 { I: INPUT() Q: OUTPUT() I.Q -> Q. }',
  ];
  for (const code of invalid) expectParseError(code);
  expectParseError('circuit "Bad" version 1 {\n  @\n}', undefined, 2, 3);
});

test('all ready catalog components round-trip with their defaults and stable formatting', () => {
  for (const definition of BLOCK_DEFINITIONS.filter(item => item.status === 'ready')) {
    const document: CircuitDocument = {
      version: 1, name: definition.name,
      blocks: [createBlock(definition.type, `block-${definition.type}`, { x: 270, y: 135 })], connections: [],
    };
    const snapshot = structuredClone(document);
    const code = stringifyCircuitDSL(document);
    const restored = parseCircuitDSL(code, BLOCK_CATALOG);
    assert.deepEqual(normalize(restored), normalize(document), definition.type);
    assert.equal(stringifyCircuitDSL(restored), code, definition.type);
    assert.deepEqual(document, snapshot, 'formatting cannot mutate its input');
  }
});

for (const example of EXAMPLES) {
  test(`existing circuit exports and imports through DSL: ${example.name}`, () => {
    const document = example.create();
    const restored = parseCircuitDSL(stringifyCircuitDSL(document), BLOCK_CATALOG);
    assert.deepEqual(normalize(restored), normalize(document));
    assert.deepEqual(restored.blocks.map(block => block.position), document.blocks.map(() => ({ x: 0, y: 0 })));
  });
}
