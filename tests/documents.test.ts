import assert from 'node:assert/strict';
import test from 'node:test';
import { BLOCK_DEFINITIONS } from '../src/lib/automation/catalog.ts';
import { createBlock, parseCircuitDocument } from '../src/lib/automation/documents.ts';
import { EXAMPLES, getExample } from '../src/lib/automation/examples.ts';
import type { BlockType, CircuitBlock, CircuitConnection, CircuitDocument } from '../src/lib/automation/types.ts';

const makeBlock = (type: BlockType, id = 'block'): CircuitBlock => createBlock(type, id, { x: 100, y: 200 });
const documentWith = (blocks: CircuitBlock[], connections: CircuitConnection[] = []): CircuitDocument =>
  ({ version: 1, name: 'Document test', blocks, connections });
const parse = (value: unknown) => parseCircuitDocument(JSON.stringify(value));
const serializable = (value: unknown): unknown => JSON.parse(JSON.stringify(value));
const wire = (id = 'wire', from = 'input', to = 'output', fromPin = 'Q', toPin = 'A'): CircuitConnection =>
  ({ id, fromBlockId: from, toBlockId: to, fromPin, toPin });

for (const example of EXAMPLES) {
  test(`saved example round trip: ${example.name}`, () => {
    const original = example.create();
    const restored = parse(original);
    assert.deepEqual(serializable(restored), serializable(original));
    assert.deepEqual(serializable(parse(restored)), serializable(original));
  });
}

test('example factories return independent editable documents', () => {
  const first = getExample('start-stop');
  const second = getExample('start-stop');
  first.blocks[0].position.x = 9999;
  first.connections.pop();
  assert.notEqual(second.blocks[0].position.x, 9999);
  assert.equal(second.connections.length, 5);
});

test('every ready component can be created, saved, and loaded with its defaults', () => {
  for (const definition of BLOCK_DEFINITIONS.filter(block => block.status === 'ready')) {
    const block = makeBlock(definition.type, definition.type);
    const loaded = parse(documentWith([block]));
    assert.deepEqual(serializable(loaded.blocks[0]), serializable(block), definition.type);
  }
});

test('every planned component is unavailable for creation and file import', () => {
  for (const definition of BLOCK_DEFINITIONS.filter(block => block.status === 'planned')) {
    assert.throws(() => makeBlock(definition.type), Error, definition.type);
    const candidate = { ...makeBlock('INPUT'), type: definition.type };
    assert.throws(() => parse(documentWith([candidate])), /Unsupported component/, definition.type);
  }
});

test('missing parameters receive documented defaults during import', () => {
  const block = { ...makeBlock('TON'), params: {} };
  assert.equal(parse(documentWith([block])).blocks[0].params.duration, 2000);
});

test('an empty named circuit is a valid saved document', () => {
  assert.deepEqual(parse(documentWith([])), documentWith([]));
});

test('malformed JSON and incorrect document envelopes are rejected', () => {
  assert.throws(() => parseCircuitDocument('{"version":'), SyntaxError);
  for (const candidate of [null, [], {}, { ...documentWith([]), version: 2 }, { ...documentWith([]), name: 9 }, { ...documentWith([]), blocks: {} }, { ...documentWith([]), connections: null }]) {
    assert.throws(() => parse(candidate), Error);
  }
});

test('unknown component types are rejected', () => {
  assert.throws(() => parse({ ...documentWith([]), blocks: [{ ...makeBlock('INPUT'), type: 'FUTURE_BLOCK' }] }), /Unsupported component/);
});

test('blocks require nonempty identities, coordinates, and parameter objects', () => {
  for (const candidate of [null, [], { ...makeBlock('INPUT'), id: '' }, { ...makeBlock('INPUT'), id: '  ' }, { ...makeBlock('INPUT'), position: null }, { ...makeBlock('INPUT'), params: [] }]) {
    assert.throws(() => parse({ ...documentWith([]), blocks: [candidate] }), Error);
  }
});

test('positions reject strings, null, and non-finite JSON numbers', () => {
  for (const position of [{ x: '100', y: 0 }, { x: 0, y: null }, { x: null, y: 0 }]) {
    assert.throws(() => parse({ ...documentWith([]), blocks: [{ ...makeBlock('INPUT'), position }] }), /finite numbers/);
  }
  const source = JSON.stringify(documentWith([makeBlock('INPUT')]));
  assert.throws(() => parseCircuitDocument(source.replace('"x":100', '"x":1e400')), /finite numbers/);
  assert.throws(() => parseCircuitDocument(source.replace('"y":200', '"y":-1e400')), /finite numbers/);
});

test('numeric parameters reject invalid types, explicit null, and out-of-range values', () => {
  for (const duration of ['2000', true, null, -1, {}, []]) {
    assert.throws(() => parse({ ...documentWith([]), blocks: [{ ...makeBlock('TON'), params: { duration } }] }), /Invalid Delay/);
  }
});

test('numeric parameters reject overflow rather than admitting infinite runtime values', () => {
  const source = JSON.stringify(documentWith([makeBlock('TON')]));
  assert.throws(() => parseCircuitDocument(source.replace('"duration":2000', '"duration":1e400')), /Invalid Delay/);
});

test('select parameters reject choices outside the declared operations', () => {
  const block = { ...makeBlock('MATH'), params: { operation: 'execute' } };
  assert.throws(() => parse(documentWith([block])), /Unknown choice/);
});

test('saved input values must match the declared signal kind', () => {
  assert.throws(() => parse(documentWith([{ ...makeBlock('INPUT'), value: 12 }])), /digital value/);
  assert.throws(() => parse(documentWith([{ ...makeBlock('ANALOG_INPUT'), value: true }])), /analog value/);
  assert.throws(() => parse(documentWith([{ ...makeBlock('INPUT'), value: 'true' }])), /digital value/);
  const source = JSON.stringify(documentWith([{ ...makeBlock('ANALOG_INPUT'), value: 123 }]));
  assert.throws(() => parseCircuitDocument(source.replace('"value":123', '"value":1e400')), /finite numbers/);
});

test('labels and tags must be text', () => {
  assert.throws(() => parse({ ...documentWith([]), blocks: [{ ...makeBlock('INPUT'), label: false }] }), /Labels must be text/);
  assert.throws(() => parse({ ...documentWith([]), blocks: [{ ...makeBlock('INPUT'), tag: 12 }] }), /Tags must be text/);
});

test('duplicate block identities cannot overwrite earlier blocks', () => {
  assert.throws(() => parse(documentWith([makeBlock('INPUT', 'same'), makeBlock('OUTPUT', 'same')])), /IDs must be unique/);
});

test('duplicate wire identities are rejected even when their endpoints differ', () => {
  const blocks = [makeBlock('INPUT', 'input'), makeBlock('AND', 'gate')];
  assert.throws(() => parse(documentWith(blocks, [wire('same', 'input', 'gate', 'Q', 'A'), wire('same', 'input', 'gate', 'Q', 'B')])), /IDs must be unique/);
});

test('wires need complete nonempty endpoint identities', () => {
  const blocks = [makeBlock('INPUT', 'input'), makeBlock('OUTPUT', 'output')];
  for (const key of ['id', 'fromBlockId', 'fromPin', 'toBlockId', 'toPin']) {
    assert.throws(() => parse({ ...documentWith(blocks), connections: [{ ...wire(), [key]: '' }] }), /invalid endpoints/);
  }
});

test('wires cannot reference missing blocks or unknown pins', () => {
  const blocks = [makeBlock('INPUT', 'input'), makeBlock('OUTPUT', 'output')];
  for (const connection of [wire('wire', 'missing'), wire('wire', 'input', 'missing'), wire('wire', 'input', 'output', 'missing'), wire('wire', 'input', 'output', 'Q', 'missing')]) {
    assert.throws(() => parse(documentWith(blocks, [connection])), Error);
  }
});

test('digital and analog pins cannot be connected directly', () => {
  const digitalToAnalog = documentWith([makeBlock('INPUT', 'input'), makeBlock('ANALOG_OUTPUT', 'output')], [wire()]);
  const analogToDigital = documentWith([makeBlock('ANALOG_INPUT', 'input'), makeBlock('OUTPUT', 'output')], [wire()]);
  assert.throws(() => parse(digitalToAnalog), /digital output to.*analog input/);
  assert.throws(() => parse(analogToDigital), /analog output to.*digital input/);
});

test('a saved input pin cannot have two driving wires', () => {
  const blocks = [makeBlock('INPUT', 'first'), makeBlock('INPUT', 'second'), makeBlock('OUTPUT', 'output')];
  assert.throws(() => parse(documentWith(blocks, [wire('one', 'first'), wire('two', 'second')])), /already has a connection/);
});

test('files over the documented size and graph limits are rejected', () => {
  assert.throws(() => parseCircuitDocument(' '.repeat(2_000_001)), /smaller than 2 MB/);
  const blocks = Array.from({ length: 501 }, (_, index) => makeBlock('INPUT', `input-${index}`));
  assert.throws(() => parse(documentWith(blocks)), /up to 500 blocks/);
  assert.throws(() => parse({ ...documentWith([]), connections: Array.from({ length: 2001 }, (_, index) => wire(`wire-${index}`)) }), /2,000 wires/);
});
