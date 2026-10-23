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
]);

export function isAuthorUser(user?: { name?: string; email?: string } | null): boolean {
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
  const email = (user.email || '').toLowerCase();
  const name = (user.name || '').toLowerCase();
  return (
    email === 'alazar@industrialautomation.website' ||
    email.startsWith('alazar') ||
    name.includes('alazar')
  );
}

/**
 * Checks whether the current user has permission to edit or delete a specific post.
 * Core masterclasses are restricted strictly to lead author Alazar Wake Kore.
 * Community masterclasses belong to their respective creators.
 */
export function canEditPost(
  post: { slug: string; author?: string; authorId?: string; authorEmail?: string },
  user?: { id?: string; name?: string; email?: string } | null
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

  const isLead = isAuthorUser(user);
  const isCore = CORE_MASTERCLASS_SLUGS.has(post.slug);

  // Core masterclasses can ONLY be edited by lead author Alazar
  if (isCore) {
    return isLead;
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

  // Lead author can manage all articles
  if (isLead) return true;

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
