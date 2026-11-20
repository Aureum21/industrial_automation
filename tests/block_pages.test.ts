import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOCUMENTED_BLOCKS, blockFromSlug, blockSlug, demoCircuit } from '../src/lib/automation/blockPages.ts';
import { BLOCK_GUIDES } from '../src/lib/automation/blockGuides.ts';
import { BLOCK_CATALOG } from '../src/lib/automation/catalog.ts';
import { CHALLENGES } from '../src/lib/challenges/catalog.ts';
import { LogicEngine } from '../src/lib/LogicEngine.ts';
import { parseCircuitDSL, stringifyCircuitDSL } from '../src/lib/automation/dsl.ts';

test('every documented block has a unique slug that round-trips', () => {
  const slugs = new Set<string>();
  for (const block of DOCUMENTED_BLOCKS) {
    const slug = blockSlug(block.type);
    assert.match(slug, /^[a-z0-9-]+$/);
    assert.ok(!slugs.has(slug), `duplicate slug ${slug}`);
    slugs.add(slug);
    assert.equal(blockFromSlug(slug)?.type, block.type);
  }
  assert.equal(blockFromSlug('not-a-block'), undefined);
});

test('every demo circuit survives the DSL round-trip and runs', () => {
  for (const block of DOCUMENTED_BLOCKS) {
    const doc = parseCircuitDSL(stringifyCircuitDSL(demoCircuit(block.type)), BLOCK_CATALOG);
    const engine = new LogicEngine();
    engine.load(doc);
    for (let i = 0; i < 30; i++) engine.tick(100);
  }
});

test('guides only reference real blocks and real challenges', () => {
  for (const [type, guide] of Object.entries(BLOCK_GUIDES)) {
    assert.ok(BLOCK_CATALOG[type as keyof typeof BLOCK_CATALOG], `unknown block ${type}`);
    for (const slug of guide!.challenges ?? []) assert.ok(CHALLENGES.some((c) => c.slug === slug), `unknown challenge ${slug}`);
  }
});

test('TON demo behaves as the guide describes', () => {
  const engine = new LogicEngine();
  engine.load(demoCircuit('TON'));
  const duration = Number(BLOCK_CATALOG.TON.parameters.find((p) => p.key === 'duration')?.defaultValue);
  const lamp = () => engine.blocks.get('out_Q')!.outputs.Q;
  engine.setInput('in_A', true);
  engine.tick(duration - 100);
  assert.equal(lamp(), false, 'not yet');
  engine.tick(100);
  assert.equal(lamp(), true, 'on after the delay');
  engine.setInput('in_A', false);
  engine.tick(100);
  assert.equal(lamp(), false, 'off as soon as the input drops');
});
