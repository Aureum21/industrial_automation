import assert from 'node:assert/strict';
import test from 'node:test';
import { buildShareUrl, decodeCircuitFragment, encodeCircuitFragment } from '../src/lib/automation/share.ts';
import { parseCircuitDSL } from '../src/lib/automation/dsl.ts';
import { BLOCK_CATALOG } from '../src/lib/automation/catalog.ts';
import { DEFAULT_MASTERCLASSES } from '../src/lib/defaultArticlesData.ts';
import type { CircuitDocument } from '../src/lib/automation/types.ts';

const sample: CircuitDocument = {
  ...parseCircuitDSL(`circuit "Pump \\"P-101\\" ünïcode ✓" version 1 {
    start: INPUT(label="Start", value=true)
    level: ANALOG_INPUT(value=42.5, tag="Level")
    t: TON(duration=1500)
    q: OUTPUT(label="Pump")
    start.Q -> t.A
    t.Q -> q.A
  }`, BLOCK_CATALOG),
  widgets: [{ id: 'w1', type: 'gauge', tag: 'Level', x: 10, y: 20, options: { min: 0, max: 100 } }],
};
sample.blocks[0].position = { x: 12.7, y: -40.2 };

test('round trip keeps wiring, settings, positions (rounded), tags and HMI widgets', async () => {
  const fragment = await encodeCircuitFragment(sample);
  assert.match(fragment, /^c=1\.[A-Za-z0-9_-]+$/);
  const decoded = await decodeCircuitFragment(`#${fragment}`);
  assert.ok(decoded);
  assert.equal(decoded.name, sample.name);
  assert.deepEqual(decoded.connections, sample.connections);
  assert.deepEqual(decoded.widgets, sample.widgets);
  assert.deepEqual(decoded.blocks[0].position, { x: 13, y: -40 });
  assert.equal(decoded.blocks[1].tag, 'Level');
  assert.equal(decoded.blocks[1].value, 42.5);
  assert.equal(decoded.blocks[2].params.duration, 1500);
});

test('links stay short enough to paste into chats and forums', async () => {
  for (const post of DEFAULT_MASTERCLASSES) {
    for (const section of post.sections) {
      if (section.type !== 'lab') continue;
      const url = await buildShareUrl('https://www.industrialautomation.website', parseCircuitDSL(section.dsl, BLOCK_CATALOG));
      assert.ok(url.length < 8000, `${post.slug}/${section.title}: ${url.length} chars`);
    }
  }
});

test('fragments without a circuit are ignored', async () => {
  assert.equal(await decodeCircuitFragment(''), null);
  assert.equal(await decodeCircuitFragment('#section-2'), null);
});

test('damaged, foreign or hostile links fail with a readable message', async () => {
  const good = await encodeCircuitFragment(sample);
  await assert.rejects(decodeCircuitFragment(good.slice(0, good.length - 10)), /damaged|incomplete/);
  await assert.rejects(decodeCircuitFragment('c=1.<script>'), /invalid characters/);
  await assert.rejects(decodeCircuitFragment('c=2.abc'), /newer version/);

  // Valid compression, invalid circuit: goes through the same validation as file imports.
  const evil = { ...sample, blocks: [{ ...sample.blocks[0], type: 'NOT_A_BLOCK' }] } as unknown as CircuitDocument;
  const fragment = await encodeCircuitFragment(evil);
  await assert.rejects(decodeCircuitFragment(fragment), /Unsupported component/);
});

test('decompression bombs are stopped', async () => {
  const huge: CircuitDocument = { ...sample, name: 'x'.repeat(3_000_000) };
  const fragment = await encodeCircuitFragment(huge);
  await assert.rejects(decodeCircuitFragment(fragment), /too large/);
});

test('embed code points at /embed and escapes the title', async () => {
  const { buildEmbedCode } = await import('../src/lib/automation/share.ts');
  const code = buildEmbedCode('https://x.test/lab#c=1.abc', 'Pump "A" <test>');
  assert.match(code, /src="https:\/\/x\.test\/embed#c=1\.abc"/);
  assert.match(code, /title="Pump &quot;A&quot; &lt;test&gt;"/);
});
