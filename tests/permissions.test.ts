import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CORE_MASTERCLASS_SLUGS, canDeleteArticle, canEditArticle, isSiteOwner } from '../src/shared/permissions.ts';
import { DEFAULT_MASTERCLASSES } from '../src/lib/defaultArticlesData.ts';

const owner = { id: 'usr-owner', isOwner: true };
const alice = { id: 'usr-alice' };
const bob = { id: 'usr-bob' };

test('owner status comes only from the server-issued flag', () => {
  assert.equal(isSiteOwner(owner), true);
  assert.equal(isSiteOwner(alice), false);
  assert.equal(isSiteOwner({ id: 'x', isOwner: false }), false);
  assert.equal(isSiteOwner(null), false);
});

test('every built-in masterclass slug is protected, and nothing else', () => {
  const builtInSlugs = DEFAULT_MASTERCLASSES.map((post) => post.slug).sort();
  assert.deepEqual([...CORE_MASTERCLASS_SLUGS].sort(), builtInSlugs);

  // The JSX versions in mockPosts.tsx must use the same slugs (read as text: the file contains JSX).
  const source = readFileSync(new URL('../src/lib/mockPosts.tsx', import.meta.url), 'utf8');
  const jsxSlugs = [...source.matchAll(/^\s{4}slug: '([^']+)'/gm)].map((match) => match[1]).sort();
  assert.deepEqual(jsxSlugs, builtInSlugs);
});

test('core masterclasses: only the owner can edit or delete', () => {
  for (const slug of CORE_MASTERCLASS_SLUGS) {
    assert.equal(canEditArticle({ slug, exists: false }, owner), true);
    assert.equal(canEditArticle({ slug, exists: false }, alice), false);
    assert.equal(canEditArticle({ slug, exists: true, authorId: 'usr-alice' }, alice), false, 'even a stored row by alice');
    assert.equal(canDeleteArticle({ slug, exists: true, authorId: 'usr-owner' }, owner), true);
    assert.equal(canDeleteArticle({ slug, exists: true, authorId: 'usr-owner' }, alice), false);
  }
});

test('community articles belong to their author', () => {
  const alicesPost = { slug: 'batch-reactor', exists: true, authorId: 'usr-alice' };
  assert.equal(canEditArticle(alicesPost, alice), true);
  assert.equal(canEditArticle(alicesPost, bob), false);
  assert.equal(canEditArticle(alicesPost, owner), true);
  assert.equal(canEditArticle(alicesPost, null), false);
  assert.equal(canDeleteArticle(alicesPost, alice), true);
  assert.equal(canDeleteArticle(alicesPost, bob), false);
});

test('any signed-in user may claim a free slug; nobody can delete what does not exist', () => {
  assert.equal(canEditArticle({ slug: 'new-idea', exists: false }, bob), true);
  assert.equal(canEditArticle({ slug: 'new-idea', exists: false }, null), false);
  assert.equal(canDeleteArticle({ slug: 'new-idea', exists: false }, owner), false);
});

test('legacy rows without a recorded author are owner-only', () => {
  const legacy = { slug: 'old-post', exists: true, authorId: null };
  assert.equal(canEditArticle(legacy, alice), false);
  assert.equal(canDeleteArticle(legacy, alice), false);
  assert.equal(canEditArticle(legacy, owner), true);
});
