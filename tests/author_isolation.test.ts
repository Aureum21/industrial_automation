import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canEditPost,
  isSiteOwner,
  CORE_MASTERCLASS_SLUGS,
  getUserStorageKey,
} from '../src/lib/blogPermissions.ts';

test('isSiteOwner relies on the server-issued owner flag, never on the name or email', () => {
  const owner = { id: 'usr-owner', name: 'alex_eng_aut', email: 'alex_eng_aut@industrialautomation.website', isOwner: true };
  const lookalike = { id: 'usr-x', name: 'alex_eng_aut', email: 'alex_eng_aut@gmail.com' };
  const guestUser = { id: 'usr-123', name: 'John Doe', email: 'john@example.com' };

  assert.equal(isSiteOwner(owner), true);
  assert.equal(isSiteOwner(lookalike), false);
  assert.equal(isSiteOwner(guestUser), false);
  assert.equal(isSiteOwner(null), false);
});

test('CORE_MASTERCLASS_SLUGS contains all 11 core masterclasses', () => {
  assert.equal(CORE_MASTERCLASS_SLUGS.has('water-treatment'), true);
  assert.equal(CORE_MASTERCLASS_SLUGS.has('hydraulic-press-safety-interlock'), true);
  assert.equal(CORE_MASTERCLASS_SLUGS.has('solar-tracker-mppt-hysteresis'), true);
  assert.equal(CORE_MASTERCLASS_SLUGS.has('steam-boiler-drum-level'), true);
  assert.equal(CORE_MASTERCLASS_SLUGS.size, 11);
});

test('canEditPost strictly protects core masterclasses for non-owners', () => {
  const owner = { id: 'usr-owner', name: 'alex_eng_aut', email: 'alex_eng_aut@industrialautomation.website', isOwner: true };
  const guest = { id: 'usr-guest', name: 'Jane Smith', email: 'jane@example.com' };

  const corePost = {
    slug: 'water-treatment',
    title: 'Water Treatment Sequence',
    author: 'alex_eng_aut',
  };

  // Owner CAN edit core post
  assert.equal(canEditPost(corePost, owner), true);

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

  // The site owner can manage all posts
  const owner = { id: 'usr-owner', name: 'alex_eng_aut', email: 'alex_eng_aut@industrialautomation.website', isOwner: true };
  assert.equal(canEditPost(marcusPost, owner), true);
});

test('getUserStorageKey generates completely isolated storage namespaces per user', () => {
  assert.equal(getUserStorageKey('usr-owner'), 'automationhub_custom_posts_usr-owner');
  assert.equal(getUserStorageKey('usr-marcus'), 'automationhub_custom_posts_usr-marcus');
  assert.notEqual(getUserStorageKey('usr-owner'), getUserStorageKey('usr-marcus'));
});
