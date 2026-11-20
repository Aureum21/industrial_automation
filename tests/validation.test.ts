import assert from 'node:assert/strict';
import test from 'node:test';
import { isSafeImageUrl, isSafeLinkUrl, safeRedirectPath } from '../src/shared/urls.ts';
import { articleInputSchema, signUpSchema, firstIssue } from '../src/shared/validation.ts';
import { parseArticleUpload } from '../src/lib/content/upload.ts';
import { DEFAULT_MASTERCLASSES } from '../src/lib/defaultArticlesData.ts';

const validLab = `circuit "Lamp" version 1 {
  s: INPUT(label="Switch")
  q: OUTPUT(label="Lamp")
  s.Q -> q.A
}`;

test('link URLs: only http(s), site paths and anchors', () => {
  for (const ok of ['https://example.com', 'http://example.com/a?b=c', '/lab', '#section-2']) assert.equal(isSafeLinkUrl(ok), true, ok);
  for (const bad of ['javascript:alert(1)', ' JavaScript:alert(1)', 'vbscript:x', 'data:text/html,<script>', '//evil.com', '', 'mailto:x@y.z']) {
    assert.equal(isSafeLinkUrl(bad), false, bad);
  }
});

test('image URLs additionally allow image data URIs but never HTML data URIs', () => {
  assert.equal(isSafeImageUrl('data:image/svg+xml;charset=utf-8,%3Csvg%3E'), true);
  assert.equal(isSafeImageUrl('data:image/png;base64,AAAA'), true);
  assert.equal(isSafeImageUrl('data:text/html;base64,AAAA'), false);
  assert.equal(isSafeImageUrl('/hero.jpg'), true);
  assert.equal(isSafeImageUrl('#x'), false);
});

test('post-login redirects stay on this site', () => {
  assert.equal(safeRedirectPath('/write?edit=a'), '/write?edit=a');
  assert.equal(safeRedirectPath('https://evil.com'), '/');
  assert.equal(safeRedirectPath('//evil.com'), '/');
  assert.equal(safeRedirectPath('/\\evil.com'), '/');
  assert.equal(safeRedirectPath(null, '/blogs'), '/blogs');
});

test('usernames are restricted so they cannot imitate other identities with spaces or symbols', () => {
  assert.equal(signUpSchema.safeParse({ name: 'jordan_controls', email: 'j@example.com', password: 'longenough' }).success, true);
  const spaced = signUpSchema.safeParse({ name: 'alex eng aut', email: 'j@example.com', password: 'longenough' });
  assert.equal(spaced.success, false);
  const short = signUpSchema.safeParse({ name: 'jordan', email: 'j@example.com', password: 'short' });
  assert.equal(short.success, false);
  if (!short.success) assert.match(firstIssue(short.error), /8 characters/);
});

test('articles: labs must contain a valid circuit', () => {
  const base = { slug: 'my-article', title: 'My article', sections: [{ type: 'lab', title: 'Lab', dsl: validLab }] };
  assert.equal(articleInputSchema.safeParse(base).success, true);
  const broken = articleInputSchema.safeParse({ ...base, sections: [{ type: 'lab', title: 'Lab', dsl: 'circuit "x" version 1 { a: NOPE() }' }] });
  assert.equal(broken.success, false);
  if (!broken.success) assert.match(firstIssue(broken.error), /invalid circuit/);
});

test('articles: unsafe image sources and bad slugs are rejected', () => {
  const md = [{ type: 'markdown', content: 'hi' }];
  assert.equal(articleInputSchema.safeParse({ slug: 'Bad Slug', title: 'Title', sections: md }).success, false);
  assert.equal(articleInputSchema.safeParse({ slug: 'ok', title: 'Title', sections: [{ type: 'image', src: 'javascript:alert(1)' }] }).success, false);
  assert.equal(articleInputSchema.safeParse({ slug: 'ok', title: 'Title', sections: [] }).success, false);
});

test('every built-in masterclass passes the same validation the API applies', () => {
  for (const post of DEFAULT_MASTERCLASSES) {
    const result = articleInputSchema.safeParse(post);
    assert.equal(result.success, true, `${post.slug}: ${result.success ? '' : firstIssue(result.error)}`);
  }
});

test('markdown uploads: front matter and fbd fences become sections', () => {
  const upload = `---
slug: lamp-basics
title: Lamp basics
tag: Fundamentals
---
Intro text.

\`\`\`fbd title="Stage 1" step="1 of 1" height=420
${validLab}
\`\`\`

Outro.`;
  const article = parseArticleUpload(upload);
  assert.equal(article.slug, 'lamp-basics');
  assert.equal(article.tag, 'Fundamentals');
  assert.deepEqual(article.sections.map((section) => section.type), ['markdown', 'lab', 'markdown']);
  const lab = article.sections[1];
  assert.ok(lab.type === 'lab' && lab.height === 420 && lab.step === '1 of 1');
});

test('uploads with an invalid circuit fail with a readable message', () => {
  assert.throws(() => parseArticleUpload('{"slug":"x","title":"Title","sections":[{"type":"lab","title":"L","dsl":"nope"}]}'), /invalid circuit/);
  assert.throws(() => parseArticleUpload('{not json'), /Invalid JSON/);
});
