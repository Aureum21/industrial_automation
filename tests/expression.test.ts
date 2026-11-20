import assert from 'node:assert/strict';
import test from 'node:test';
import { ExpressionError, evaluateExpression, parseExpression } from '../src/lib/automation/expression.ts';
import { LogicEngine } from '../src/lib/LogicEngine.ts';
import { parseCircuitDSL } from '../src/lib/automation/dsl.ts';
import { BLOCK_CATALOG } from '../src/lib/automation/catalog.ts';

const run = (expr: string, A = 0, B = 0, C = 0) => evaluateExpression(parseExpression(expr), { A, B, C });

test('arithmetic, precedence and associativity', () => {
  assert.equal(run('A + B * C', 1, 2, 3), 7);
  assert.equal(run('(A + B) * C', 1, 2, 3), 9);
  assert.equal(run('10 - 4 - 3'), 3);
  assert.equal(run('100 / 10 / 5'), 2);
  assert.equal(run('2 ^ 3 ^ 2'), 512);
  assert.equal(run('2 ** 10'), 1024);
  assert.equal(run('-2 ^ 2'), -4);
  assert.equal(run('7 % 4'), 3);
  assert.equal(run('1.5e2 + .5'), 150.5);
});

test('comparisons, logic and the conditional operator', () => {
  assert.equal(run('A > 50 ? 100 : 0', 60), 100);
  assert.equal(run('A > 50 ? 100 : 0', 40), 0);
  assert.equal(run('A > 10 && A < 20', 15), 1);
  assert.equal(run('A < 10 || A > 20', 15), 0);
  assert.equal(run('!(A == B)', 1, 2), 1);
  assert.equal(run('A > 0 ? B > 0 ? 1 : 2 : 3', 1, -1), 2);
  assert.equal(run('1 + (A > 0 ? 10 : 20)', 1), 11);
});

test('functions and constants', () => {
  assert.equal(run('max(A, B, C)', 3, 9, 4), 9);
  assert.equal(run('clamp(A, 0, 100)', 140), 100);
  assert.ok(Math.abs(run('sin(PI / 2)') - 1) < 1e-12);
  assert.equal(run('round(sqrt(A))', 17), 4);
  assert.equal(run('atan2(1, 1) * 4 / PI'), 1);
});

test('anything that is not math is rejected before it runs', () => {
  const attacks = [
    'alert(1)',
    'constructor.constructor("return document")()',
    'A.constructor',
    'globalThis',
    'Math.random()',
    'this',
    'A; fetch("/api")',
    '`x`',
    '[1,2]',
    'A = 5',
    "'string'",
  ];
  for (const expr of attacks) assert.throws(() => parseExpression(expr), ExpressionError, expr);
});

test('readable errors for malformed input and limits', () => {
  assert.throws(() => parseExpression(''), /empty/);
  assert.throws(() => parseExpression('A +'), /ends unexpectedly/);
  assert.throws(() => parseExpression('(A + B'), /Expected "\)"/);
  assert.throws(() => parseExpression('max()'), /takes 1–16 arguments/);
  assert.throws(() => parseExpression('pow(A)'), /takes 2 arguments/);
  assert.throws(() => parseExpression('x'.repeat(501)), /limited to 500/);
  assert.throws(() => parseExpression('('.repeat(80) + 'A' + ')'.repeat(80)), /nested too deeply/);
});

test('MATH_EXPRESSION block uses the safe evaluator and reports errors as diagnostics', () => {
  const doc = parseCircuitDSL(`circuit "expr" version 1 {
    a: ANALOG_INPUT(value=60)
    f: MATH_EXPRESSION(expr="A > 50 ? A * 2 : 0")
    q: ANALOG_OUTPUT()
    a.Q -> f.A
    f.Q -> q.A
  }`, BLOCK_CATALOG);
  const engine = new LogicEngine();
  engine.load(doc);
  engine.tick(100);
  assert.equal(engine.blocks.get('q')!.outputs.Q, 120);

  engine.setParam('f', 'expr', 'alert(1)');
  engine.tick(100);
  assert.equal(engine.blocks.get('f')!.outputs.Q, 0);
  assert.ok(engine.diagnostics.some((message) => message.includes('Unknown name "alert"')), engine.diagnostics.join('\n'));
});
