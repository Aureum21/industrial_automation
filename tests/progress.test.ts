import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeProgress, sanitizeProgress } from '../src/shared/progress.ts';

const now = new Date('2026-06-01T12:00:00Z');

test('sanitize drops unknown challenges, fixes bad or future times and keeps the earliest duplicate', () => {
  const out = sanitizeProgress(
    [
      { slug: 'light-switch', solvedAt: '2026-05-01T00:00:00Z' },
      { slug: 'light-switch', solvedAt: '2026-04-01T00:00:00Z' },
      { slug: 'start-stop', solvedAt: 'yesterday' },
      { slug: 'door-alarm', solvedAt: '2030-01-01T00:00:00Z' },
      { slug: 'no-such-challenge', solvedAt: '2026-05-01T00:00:00Z' },
    ],
    now,
  );
  assert.deepEqual(Object.keys(out).sort(), ['door-alarm', 'light-switch', 'start-stop']);
  assert.equal(out['light-switch'].solvedAt, '2026-04-01T00:00:00.000Z');
  assert.equal(out['start-stop'].solvedAt, now.toISOString());
  assert.equal(out['door-alarm'].solvedAt, now.toISOString());
});

test('merge is a union that keeps the earliest solve', () => {
  const merged = mergeProgress({ a: { solvedAt: '2026-02-01' }, b: { solvedAt: '2026-01-01' } }, { a: { solvedAt: '2026-01-15' }, c: { solvedAt: '2026-03-01' } });
  assert.deepEqual(merged, { a: { solvedAt: '2026-01-15' }, b: { solvedAt: '2026-01-01' }, c: { solvedAt: '2026-03-01' } });
});
