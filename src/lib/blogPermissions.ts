export const CORE_MASTERCLASS_SLUGS = new Set([
  'water-treatment',
  'hydraulic-press-safety-interlock',
  'dual-pump-alternator',
  'industrial-heater-pi-pwm-anti-windup',
  'solar-tracker-mppt-hysteresis',
  'hvac-chiller-economizer',
  'conveyor-bottle-sorter',
  'traffic-intersection-controller',
  'emergency-shutdown-esd-matrix',
  'tank-level-cascade-pid',
  'steam-boiler-drum-level',
]);

type PermissionUser = { id?: string; name?: string; email?: string; isOwner?: boolean };

/** True for the site owner account. The flag comes from the server (users.is_owner); the server re-checks it on every write. */
export function isSiteOwner(user?: PermissionUser | null): boolean {
  if (!user) {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem('automationhub_authenticated_user');
      if (!raw) return false;
      user = JSON.parse(raw);
    } catch {
      return false;
    }
  }
  return user?.isOwner === true;
}

/**
 * Checks whether the current user has permission to edit or delete a specific post.
 * Core masterclasses can only be edited by the site owner.
 * Community masterclasses belong to their respective creators.
 */
export function canEditPost(
  post: { slug: string; author?: string; authorId?: string; authorEmail?: string },
  user?: PermissionUser | null
): boolean {
  if (!user) {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem('automationhub_authenticated_user');
      if (!raw) return false;
      user = JSON.parse(raw);
    } catch {
      return false;
    }
  }
  if (!user) return false;

  const isOwner = isSiteOwner(user);
  const isCore = CORE_MASTERCLASS_SLUGS.has(post.slug);

  // Core masterclasses can ONLY be edited by the site owner
  if (isCore) {
    return isOwner;
  }

  // If article has explicit authorId or authorEmail, check exact match
  if (post.authorId && user.id && post.authorId === user.id) return true;
  if (
    post.authorEmail &&
    user.email &&
    post.authorEmail.toLowerCase() === user.email.toLowerCase()
  ) {
    return true;
  }

  // If author string matches user name
  if (post.author && user.name && post.author.toLowerCase().includes(user.name.toLowerCase())) {
    return true;
  }

  // The site owner can manage all articles
  if (isOwner) return true;

  return false;
}

/**
 * Generates an isolated storage key per user ID so multiple authors on the same
 * machine/browser never see each other's draft or edit lists.
 */
export function getUserStorageKey(userId?: string): string {
  if (userId) return `automationhub_custom_posts_${userId}`;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('automationhub_authenticated_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.id) return `automationhub_custom_posts_${u.id}`;
      }
    } catch {}
  }
  return 'automationhub_custom_posts';
}
