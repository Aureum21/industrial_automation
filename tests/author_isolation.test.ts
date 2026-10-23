import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canEditPost,
  isAuthorUser,
  CORE_MASTERCLASS_SLUGS,
  getUserStorageKey,
} from '../src/lib/blogPermissions.ts';

test('isAuthorUser identifies Alazar Wake Kore correctly and rejects others', () => {
  const alazarEmail = { name: 'Alazar Wake Kore', email: 'alazar@industrialautomation.website' };
  const alazarShort = { name: 'Alazar', email: 'alazar@gmail.com' };
  const guestUser = { id: 'usr-123', name: 'John Doe', email: 'john@example.com' };

  assert.equal(isAuthorUser(alazarEmail), true);
  assert.equal(isAuthorUser(alazarShort), true);
  assert.equal(isAuthorUser(guestUser), false);
  assert.equal(isAuthorUser(null), false);
});

test('CORE_MASTERCLASS_SLUGS contains all 10 initial masterclasses', () => {
  assert.equal(CORE_MASTERCLASS_SLUGS.has('water-treatment'), true);
  assert.equal(CORE_MASTERCLASS_SLUGS.has('hydraulic-press-safety-interlock'), true);
  assert.equal(CORE_MASTERCLASS_SLUGS.has('solar-tracker-mppt-hysteresis'), true);
  assert.equal(CORE_MASTERCLASS_SLUGS.size, 10);
});

test('canEditPost strictly protects core masterclasses for non-lead authors', () => {
  const alazar = { id: 'usr-alazar', name: 'Alazar Wake Kore', email: 'alazar@industrialautomation.website' };
  const guest = { id: 'usr-guest', name: 'Jane Smith', email: 'jane@example.com' };

  const corePost = {
    slug: 'water-treatment',
    title: 'Water Treatment Sequence',
    author: 'Alazar Wake Kore',
  };

  // Lead author CAN edit core post
  assert.equal(canEditPost(corePost, alazar), true);

  // Guest CANNOT edit core post
  assert.equal(canEditPost(corePost, guest), false);
  assert.equal(canEditPost(corePost, null), false);
});

test('canEditPost allows community authors to edit their own articles and blocks others', () => {
  const authorA = { id: 'usr-author-a', name: 'Marcus Chen', email: 'marcus@controls.io' };
  const authorB = { id: 'usr-author-b', name: 'Elena Rostova', email: 'elena@automation.org' };

  const marcusPost = {
    slug: 'batch-reactor-thermal-runaway',
    title: 'Batch Reactor Thermal Safeguards',
    author: 'Marcus Chen',
    authorId: 'usr-author-a',
    authorEmail: 'marcus@controls.io',
  };

  // Marcus owns his post
  assert.equal(canEditPost(marcusPost, authorA), true);

  // Elena CANNOT edit Marcus's post
  assert.equal(canEditPost(marcusPost, authorB), false);

  // Anonymous CANNOT edit Marcus's post
  assert.equal(canEditPost(marcusPost, null), false);

  // Lead author Alazar can administratively edit/manage all posts
  const alazar = { id: 'usr-alazar', name: 'Alazar Wake Kore', email: 'alazar@industrialautomation.website' };
  assert.equal(canEditPost(marcusPost, alazar), true);
});

test('getUserStorageKey generates completely isolated storage namespaces per user', () => {
  assert.equal(getUserStorageKey('usr-alazar'), 'automationhub_custom_posts_usr-alazar');
  assert.equal(getUserStorageKey('usr-marcus'), 'automationhub_custom_posts_usr-marcus');
  assert.notEqual(getUserStorageKey('usr-alazar'), getUserStorageKey('usr-marcus'));
});
