import type {
  BlockDefinition, CircuitBlock, CircuitConnection, CircuitDocument,
  ParameterDefinition, ParameterValue, PinDefinition,
} from './types.ts';

type TokenKind = 'name' | 'string' | 'number' | 'symbol' | 'eof';
interface Token { kind: TokenKind; text: string; line: number; column: number }
interface Endpoint { block: Token; pin: Token }
interface PendingWire { from: Endpoint; to: Endpoint }

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const METADATA = new Set(['label', 'tag', 'value']);

/** A syntax or catalog validation error with a one-based source location. */
export class CircuitDSLParseError extends Error {
  readonly line: number;
  readonly column: number;

  constructor(message: string, location: { line: number; column: number }) {
    super(`Line ${location.line}, column ${location.column}: ${message}`);
    this.name = 'CircuitDSLParseError';
    this.line = location.line;
    this.column = location.column;
  }
}

function fail(token: Token, message: string): never {
  throw new CircuitDSLParseError(message, token);
}

/** Tokenize comments separately from strings, preserving locations and escapes. */
function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /\s+|\/\/[^\r\n]*|"(?:[^"\\\r\n]|\\[^\r\n])*"|->|[A-Za-z_][A-Za-z0-9_]*|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}():,.=]/y;
  let offset = 0;
  let line = 1;
  let column = 1;
  while (offset < code.length) {
    pattern.lastIndex = offset;
    const match = pattern.exec(code);
    if (!match) {
      const detail = code[offset] === '"'
        ? 'Unterminated string. Use JSON escapes for quotes and line breaks.'
        : `Unexpected character ${JSON.stringify(code[offset])}.`;
      throw new CircuitDSLParseError(detail, { line, column });
    }
    const text = match[0];
    if (!/^\s/.test(text) && !text.startsWith('//')) {
      const kind: TokenKind = text[0] === '"' ? 'string'
        : /^[A-Za-z_]/.test(text) ? 'name'
          : text !== '->' && /^[-\d]/.test(text) ? 'number' : 'symbol';
      tokens.push({ kind, text, line, column });
    }
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\r' || text[i] === '\n') {
        if (text[i] === '\r' && text[i + 1] === '\n') i++;
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    offset += text.length;
  }
  tokens.push({ kind: 'eof', text: '', line, column });
  return tokens;
}

function decodeString(token: Token): string {
  try { return JSON.parse(token.text) as string; }
  catch { return fail(token, 'Invalid string. Use double quotes and valid JSON escapes.'); }
}

function nameOf(token: Token): string {
  const value = token.kind === 'string' ? decodeString(token) : token.text;
  if (!value.trim()) fail(token, 'Names must not be empty.');
  return value;
}

function validateParameter(parameter: ParameterDefinition, value: ParameterValue, token: Token): void {
  const expected = parameter.type === 'text' || parameter.type === 'select' ? 'string' : parameter.type;
  if (typeof value !== expected) fail(token, `Parameter ${parameter.key} requires a ${expected} value.`);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail(token, `Parameter ${parameter.key} requires a finite number.`);
    if (parameter.min !== undefined && value < parameter.min) {
      fail(token, `Parameter ${parameter.key} must be at least ${parameter.min}.`);
    }
    if (parameter.max !== undefined && value > parameter.max) {
      fail(token, `Parameter ${parameter.key} must be at most ${parameter.max}.`);
    }
  }
  if (parameter.type === 'select' && !parameter.options?.some(option => option.value === value)) {
    fail(token, `Invalid choice for ${parameter.key}. Available choices: ${parameter.options?.map(option => option.value).join(', ') || '(none)'}.`);
  }
}

class Parser {
  private index = 0;
  private readonly tokens: Token[];
  private readonly catalog: Record<string, BlockDefinition>;
  private readonly blocks = new Map<string, { block: CircuitBlock; definition: BlockDefinition }>();
  private readonly wires: PendingWire[] = [];

  constructor(code: string, catalog: Record<string, BlockDefinition>) {
    this.tokens = tokenize(code);
    this.catalog = catalog;
  }

  private get current(): Token { return this.tokens[this.index]; }

  private accept(text: string): boolean {
    if (this.current.text !== text || this.current.kind === 'eof') return false;
    this.index++;
    return true;
  }

  private expect(text: string): Token {
    const token = this.current;
    if (!this.accept(text)) fail(token, `Expected ${JSON.stringify(text)}, found ${token.text || 'end of input'}.`);
    return token;
  }

  private readName(): Token {
    const token = this.current;
    if (token.kind !== 'name' && token.kind !== 'string') fail(token, 'Expected an identifier or a quoted name.');
    nameOf(token);
    this.index++;
    return token;
  }

  private readValue(): ParameterValue {
    const token = this.current;
    this.index++;
    if (token.kind === 'string') return decodeString(token);
    if (token.kind === 'number') {
      const value = Number(token.text);
      if (!Number.isFinite(value)) fail(token, 'Expected a finite number.');
      return value;
    }
    if (token.kind === 'name' && (token.text === 'true' || token.text === 'false')) return token.text === 'true';
    return fail(token, 'Expected a number, double-quoted string, or boolean.');
  }

  parse(): CircuitDocument {
    this.expect('circuit');
    const name = this.current;
    if (name.kind !== 'string') fail(name, 'Expected a double-quoted circuit name.');
    this.index++;
    this.expect('version');
    const version = this.current;
    if (version.kind !== 'number' || version.text !== '1') fail(version, 'Only circuit version 1 is supported.');
    this.index++;
    this.expect('{');
    while (!this.accept('}')) {
      if (this.current.kind === 'eof') fail(this.current, 'Expected "}" before end of input.');
      const id = this.readName();
      if (this.accept(':')) this.readBlock(id);
      else {
        this.expect('.');
        const from: Endpoint = { block: id, pin: this.readName() };
        this.expect('->');
        const toBlock = this.readName();
        this.expect('.');
        this.wires.push({ from, to: { block: toBlock, pin: this.readName() } });
      }
    }
    if (this.current.kind !== 'eof') fail(this.current, 'Unexpected content after the circuit.');
    return {
      version: 1, name: decodeString(name),
      blocks: [...this.blocks.values()].map(entry => entry.block),
      connections: this.resolveWires(),
    };
  }

  private readBlock(idToken: Token): void {
    const id = nameOf(idToken);
    if (this.blocks.has(id)) fail(idToken, `Duplicate block ID ${JSON.stringify(id)}.`);
    const typeToken = this.readName();
    const type = nameOf(typeToken);
    if (!Object.prototype.hasOwnProperty.call(this.catalog, type)) fail(typeToken, `Unknown block type ${JSON.stringify(type)}.`);
    const definition = this.catalog[type];
    const parameters = new Map(definition.parameters.map(parameter => [parameter.key, parameter]));
    // Object.fromEntries keeps special keys such as __proto__ as own data properties.
    const params = new Map<string, ParameterValue>();
    for (const parameter of definition.parameters) {
      if (parameter.defaultValue !== undefined) params.set(parameter.key, parameter.defaultValue);
    }
    const block: CircuitBlock = { id, type: definition.type, position: { x: 0, y: 0 }, params: {} };
    const assigned = new Set<string>();
    this.expect('(');
    if (!this.accept(')')) {
      do {
        const keyToken = this.readName();
        let key = nameOf(keyToken);
        const qualified = key === 'params' && this.accept('.');
        if (qualified) key = nameOf(this.readName());
        const metadata = !qualified && METADATA.has(key);
        const assignment = `${metadata ? 'block' : 'params'}.${key}`;
        if (assigned.has(assignment)) fail(keyToken, `Duplicate setting ${assignment} on ${id}.`);
        assigned.add(assignment);
        this.expect('=');
        const valueToken = this.current;
        const value = this.readValue();
        if (metadata) {
          if (key === 'label' || key === 'tag') {
            if (typeof value !== 'string') fail(valueToken, `${key} must be a string.`);
            block[key] = value;
          } else {
            block.value = value;
          }
        } else {
          const parameter = parameters.get(key);
          if (!parameter) fail(keyToken, `Unknown parameter ${JSON.stringify(key)} on ${type}. Available parameters: ${[...parameters.keys()].join(', ') || '(none)'}.`);
          validateParameter(parameter, value, valueToken);
          params.set(key, value);
        }
      } while (this.accept(','));
      this.expect(')');
    }
    block.params = Object.fromEntries(params);
    this.blocks.set(id, { block, definition });
  }

  private resolvePin(endpoint: Endpoint, direction: 'input' | 'output'): PinDefinition {
    const id = nameOf(endpoint.block);
    const entry = this.blocks.get(id);
    if (!entry) fail(endpoint.block, `Unknown block ${JSON.stringify(id)}.`);
    const pins = direction === 'input' ? entry.definition.inputs : entry.definition.outputs;
    const pinId = nameOf(endpoint.pin);
    const pin = pins.find(candidate => candidate.id === pinId);
    if (!pin) fail(endpoint.pin, `${id}.${pinId} is not an ${direction} pin. Available ${direction}s: ${pins.map(candidate => candidate.id).join(', ') || '(none)'}.`);
    return pin;
  }

  private resolveWires(): CircuitConnection[] {
    const driven = new Map<string, PendingWire>();
    return this.wires.map((wire, index) => {
      const fromPin = this.resolvePin(wire.from, 'output');
      const toPin = this.resolvePin(wire.to, 'input');
      if (fromPin.kind !== toPin.kind) {
        fail(wire.to.pin, `Cannot connect a ${fromPin.kind} output to a ${toPin.kind} input.`);
      }
      const toBlockId = nameOf(wire.to.block);
      const key = JSON.stringify([toBlockId, toPin.id]);
      const previous = driven.get(key);
      if (previous) {
        fail(wire.to.pin, `Multiple wires drive ${toBlockId}.${toPin.id}. Each input pin accepts one wire; first connected at line ${previous.to.pin.line}.`);
      }
      driven.set(key, wire);
      return {
        id: `wire_${index + 1}`,
        fromBlockId: nameOf(wire.from.block), fromPin: fromPin.id,
        toBlockId, toPin: toPin.id,
      };
    });
  }
}

/** Compile DSL using the supplied catalog; positions are a frontend layout stub. */
export function parseCircuitDSL(code: string, catalog: Record<string, BlockDefinition>): CircuitDocument {
  return new Parser(code, catalog).parse();
}

function formatName(name: string): string {
  if (!name.trim()) throw new Error('DSL names must not be empty.');
  return IDENTIFIER.test(name) ? name : JSON.stringify(name);
}

function formatValue(value: ParameterValue): string {
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return Object.is(value, -0) ? '-0' : String(value);
  throw new Error('DSL values must be strings, booleans, or finite numbers.');
}

/**
 * Format a circuit deterministically without mutating it. Positions and wire IDs
 * are intentionally omitted; parsing recreates zero positions and sequential IDs.
 */
export function stringifyCircuitDSL(document: CircuitDocument): string {
  if (document.version !== 1) throw new Error('Only circuit version 1 is supported.');
  const blocks = document.blocks.map(block => {
    const settings: string[] = [];
    if (block.label !== undefined) settings.push(`label=${formatValue(block.label)}`);
    if (block.tag !== undefined) settings.push(`tag=${formatValue(block.tag)}`);
    if (block.value !== undefined) settings.push(`value=${formatValue(block.value)}`);
    for (const key of Object.keys(block.params).sort()) {
      const name = `${METADATA.has(key) ? 'params.' : ''}${formatName(key)}`;
      settings.push(`${name}=${formatValue(block.params[key])}`);
    }
    return `  ${formatName(block.id)}: ${formatName(block.type)}(${settings.join(', ')})`;
  });
  const wires = document.connections.map(wire =>
    `  ${formatName(wire.fromBlockId)}.${formatName(wire.fromPin)} -> ${formatName(wire.toBlockId)}.${formatName(wire.toPin)}`);
  return [
    `circuit ${JSON.stringify(document.name)} version 1 {`,
    ...blocks, ...(blocks.length && wires.length ? [''] : []), ...wires, '}', '',
  ].join('\n');
}
