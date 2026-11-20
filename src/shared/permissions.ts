/**
 * Authorization rules shared by the UI and the API. The UI uses them to decide what to show;
 * the API applies the same rules to the server-verified user before every write.
 */

/** Slugs of the built-in masterclasses. Only the site owner may overwrite or delete these. */
export const CORE_MASTERCLASS_SLUGS: ReadonlySet<string> = new Set([
  'water-treatment',
  'industrial-heater-pi-pwm-anti-windup',
  'traffic-lights',
  'conveyor-sorting',
  'two-hand-safety',
  'hvac-economizer',
  'tank-hysteresis',
  'pump-alternator',
  'esd-delays',
  'solar-logging',
  'steam-boiler-drum-level',
]);

export interface PermissionUser {
  id: string;
  isOwner?: boolean;
}

export interface PermissionArticle {
  slug: string;
  /** Whether an article with this slug is already stored. */
  exists: boolean;
  /** User ID of the account that first published it. Legacy rows may have none. */
  authorId?: string | null;
}

export function isSiteOwner(user: PermissionUser | null | undefined): boolean {
  return user?.isOwner === true;
}

/**
 * Whether `user` may create or overwrite the article at `article.slug`.
 * - Core masterclasses: owner only.
 * - Existing articles: the original author or the owner (legacy rows with no author: owner only).
 * - New slugs: any signed-in user.
 */
export function canEditArticle(article: PermissionArticle, user: PermissionUser | null | undefined): boolean {
  if (!user) return false;
  if (isSiteOwner(user)) return true;
  if (CORE_MASTERCLASS_SLUGS.has(article.slug)) return false;
  if (!article.exists) return true;
  // Legacy rows without a recorded author belong to the owner.
  return Boolean(article.authorId) && article.authorId === user.id;
}

/** Deleting needs an existing article plus edit rights. */
export function canDeleteArticle(article: PermissionArticle, user: PermissionUser | null | undefined): boolean {
  return article.exists && canEditArticle(article, user);
}

/** A gallery circuit may be deleted by whoever published it, or by the site owner (moderation). */
export function canDeleteGalleryCircuit(user: PermissionUser | null | undefined, circuit: { ownerId: string }): boolean {
  return Boolean(user && (user.id === circuit.ownerId || isSiteOwner(user)));
}
