/**
 * Safe arithmetic expressions for the MATH_EXPRESSION block.
 *
 * Expressions come from circuit files and published articles, so they are parsed into a small
 * syntax tree and evaluated here: there is no access to JavaScript, globals or the page.
 *
 * Supported:
 *   numbers (1, 2.5, 1e-3), inputs A B C, constants PI E
 *   + - * / %   ^ or ** (power, right-associative)   unary + - !
 *   < <= > >= == !=   && ||   (true = 1, false = 0)   cond ? a : b
 *   functions: abs sqrt cbrt exp log log10 log2 sin cos tan asin acos atan atan2
 *              min max pow round floor ceil sign hypot clamp(x, lo, hi)
 */

export type ExpressionNode =
  | { kind: 'number'; value: number }
  | { kind: 'variable'; name: 'A' | 'B' | 'C' }
  | { kind: 'unary'; op: '-' | '+' | '!'; operand: ExpressionNode }
  | { kind: 'binary'; op: BinaryOp; left: ExpressionNode; right: ExpressionNode }
  | { kind: 'conditional'; test: ExpressionNode; then: ExpressionNode; otherwise: ExpressionNode }
  | { kind: 'call'; name: string; args: ExpressionNode[] };

type BinaryOp = '+' | '-' | '*' | '/' | '%' | '^' | '<' | '<=' | '>' | '>=' | '==' | '!=' | '&&' | '||';

export class ExpressionError extends Error {}

const MAX_LENGTH = 500;
const MAX_DEPTH = 64;

const FUNCTIONS: Record<string, { arity: [number, number]; fn: (...args: number[]) => number }> = {
  abs: { arity: [1, 1], fn: Math.abs },
  sqrt: { arity: [1, 1], fn: Math.sqrt },
  cbrt: { arity: [1, 1], fn: Math.cbrt },
  exp: { arity: [1, 1], fn: Math.exp },
  log: { arity: [1, 1], fn: Math.log },
  log10: { arity: [1, 1], fn: Math.log10 },
  log2: { arity: [1, 1], fn: Math.log2 },
  sin: { arity: [1, 1], fn: Math.sin },
  cos: { arity: [1, 1], fn: Math.cos },
  tan: { arity: [1, 1], fn: Math.tan },
  asin: { arity: [1, 1], fn: Math.asin },
  acos: { arity: [1, 1], fn: Math.acos },
  atan: { arity: [1, 1], fn: Math.atan },
  atan2: { arity: [2, 2], fn: Math.atan2 },
  round: { arity: [1, 1], fn: Math.round },
  floor: { arity: [1, 1], fn: Math.floor },
  ceil: { arity: [1, 1], fn: Math.ceil },
  sign: { arity: [1, 1], fn: Math.sign },
  pow: { arity: [2, 2], fn: Math.pow },
  min: { arity: [1, 16], fn: Math.min },
  max: { arity: [1, 16], fn: Math.max },
  hypot: { arity: [1, 16], fn: Math.hypot },
  clamp: { arity: [3, 3], fn: (x, lo, hi) => Math.min(Math.max(x, lo), hi) },
};

const CONSTANTS: Record<string, number> = { PI: Math.PI, E: Math.E };

type Token = { type: 'num'; value: number; pos: number } | { type: 'id'; value: string; pos: number } | { type: 'op'; value: string; pos: number } | { type: 'end'; pos: number };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /\s+|(\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|(\*\*|<=|>=|==|!=|&&|\|\||[-+*/%^()<>!?:,])/y;
  let pos = 0;
  while (pos < source.length) {
    pattern.lastIndex = pos;
    const match = pattern.exec(source);
    if (!match) throw new ExpressionError(`Unexpected character "${source[pos]}" at position ${pos + 1}.`);
    if (match[1]) tokens.push({ type: 'num', value: Number(match[1]), pos });
    else if (match[2]) tokens.push({ type: 'id', value: match[2], pos });
    else if (match[3]) tokens.push({ type: 'op', value: match[3] === '**' ? '^' : match[3], pos });
    pos = pattern.lastIndex;
  }
  tokens.push({ type: 'end', pos });
  return tokens;
}

const BINARY_PRECEDENCE: Record<string, number> = {
  '||': 1, '&&': 2, '==': 3, '!=': 3, '<': 4, '<=': 4, '>': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6, '^': 8,
};
const UNARY_PRECEDENCE = 7;

export function parseExpression(source: string): ExpressionNode {
  if (source.length > MAX_LENGTH) throw new ExpressionError(`Expressions are limited to ${MAX_LENGTH} characters.`);
  if (!source.trim()) throw new ExpressionError('The expression is empty.');
  const tokens = tokenize(source);
  let index = 0;
  const peek = () => tokens[index];
  const isOp = (value: string) => {
    const token = peek();
    return token.type === 'op' && token.value === value;
  };
  const expectOp = (value: string) => {
    if (!isOp(value)) throw new ExpressionError(`Expected "${value}" at position ${peek().pos + 1}.`);
    index++;
  };

  /** Precedence climbing. The conditional `?:` binds loosest and only at the top level of a sub-expression. */
  function parse(minPrecedence: number, depth: number): ExpressionNode {
    if (depth > MAX_DEPTH) throw new ExpressionError('The expression is nested too deeply.');
    let left = parsePrefix(depth);
    for (;;) {
      const token = peek();
      if (token.type !== 'op') break;
      if (token.value === '?') {
        if (minPrecedence > 0) break;
        index++;
        const then = parse(0, depth + 1);
        expectOp(':');
        const otherwise = parse(0, depth + 1);
        left = { kind: 'conditional', test: left, then, otherwise };
        continue;
      }
      const precedence = BINARY_PRECEDENCE[token.value];
      if (precedence === undefined || precedence < minPrecedence) break;
      index++;
      // '^' is right-associative (2^3^2 = 2^9); everything else is left-associative.
      const right = parse(token.value === '^' ? precedence : precedence + 1, depth + 1);
      left = { kind: 'binary', op: token.value as BinaryOp, left, right };
    }
    return left;
  }

  function parsePrefix(depth: number): ExpressionNode {
    const token = peek();
    if (token.type === 'num') {
      index++;
      return { kind: 'number', value: token.value };
    }
    if (token.type === 'op' && (token.value === '-' || token.value === '+' || token.value === '!')) {
      index++;
      return { kind: 'unary', op: token.value, operand: parse(UNARY_PRECEDENCE, depth + 1) };
    }
    if (token.type === 'op' && token.value === '(') {
      index++;
      const inner = parse(0, depth + 1);
      expectOp(')');
      return inner;
    }
    if (token.type === 'id') {
      index++;
      if (token.value === 'A' || token.value === 'B' || token.value === 'C') return { kind: 'variable', name: token.value };
      if (token.value in CONSTANTS) return { kind: 'number', value: CONSTANTS[token.value] };
      const fn = FUNCTIONS[token.value];
      if (!fn) throw new ExpressionError(`Unknown name "${token.value}". Use A, B, C, PI, E or a supported function.`);
      expectOp('(');
      const args: ExpressionNode[] = [];
      if (!isOp(')')) {
        do args.push(parse(0, depth + 1));
        while (isOp(',') && ++index);
      }
      expectOp(')');
      const [lo, hi] = fn.arity;
      if (args.length < lo || args.length > hi) {
        throw new ExpressionError(`${token.value}() takes ${lo === hi ? lo : `${lo}–${hi}`} argument${hi === 1 ? '' : 's'}.`);
      }
      return { kind: 'call', name: token.value, args };
    }
    if (token.type === 'end') throw new ExpressionError('The expression ends unexpectedly.');
    throw new ExpressionError(`Unexpected "${token.value}" at position ${token.pos + 1}.`);
  }

  const tree = parse(0, 0);
  if (peek().type !== 'end') {
    const token = peek() as Exclude<Token, { type: 'end' }>;
    throw new ExpressionError(`Unexpected "${token.value}" at position ${token.pos + 1}.`);
  }
  return tree;
}

export function evaluateExpression(node: ExpressionNode, inputs: { A: number; B: number; C: number }): number {
  switch (node.kind) {
    case 'number':
      return node.value;
    case 'variable':
      return inputs[node.name];
    case 'unary': {
      const value = evaluateExpression(node.operand, inputs);
      return node.op === '-' ? -value : node.op === '!' ? Number(!value) : value;
    }
    case 'conditional':
      return evaluateExpression(node.test, inputs) ? evaluateExpression(node.then, inputs) : evaluateExpression(node.otherwise, inputs);
    case 'call':
      return FUNCTIONS[node.name].fn(...node.args.map((arg) => evaluateExpression(arg, inputs)));
    case 'binary': {
      if (node.op === '&&') return Number(Boolean(evaluateExpression(node.left, inputs)) && Boolean(evaluateExpression(node.right, inputs)));
      if (node.op === '||') return Number(Boolean(evaluateExpression(node.left, inputs)) || Boolean(evaluateExpression(node.right, inputs)));
      const a = evaluateExpression(node.left, inputs);
      const b = evaluateExpression(node.right, inputs);
      switch (node.op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
        case '%': return a % b;
        case '^': return a ** b;
        case '<': return Number(a < b);
        case '<=': return Number(a <= b);
        case '>': return Number(a > b);
        case '>=': return Number(a >= b);
        case '==': return Number(a === b);
        case '!=': return Number(a !== b);
      }
    }
  }
}
