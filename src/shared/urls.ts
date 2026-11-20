/**
 * URL safety checks for user-authored content (markdown links, images).
 * Only http(s), site-relative paths and in-page anchors are allowed, which rules out
 * `javascript:`, `vbscript:` and other script-bearing schemes.
 */
export function isSafeLinkUrl(url: string): boolean {
  const value = url.trim();
  if (!value) return false;
  if (value.startsWith('#')) return true;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Images may additionally be inline SVG/PNG/JPEG data URIs (used by built-in blueprints). */
export function isSafeImageUrl(url: string): boolean {
  const value = url.trim();
  if (/^data:image\/(svg\+xml|png|jpeg|gif|webp)[;,]/i.test(value)) return true;
  return isSafeLinkUrl(value) && !value.startsWith('#');
}

/**
 * Validates a post-login redirect target. Only same-site paths are accepted so the
 * sign-in page cannot be used to bounce visitors to another website.
 */
export function safeRedirectPath(target: string | null | undefined, fallback = '/'): string {
  if (!target) return fallback;
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return fallback;
  return target;
}
