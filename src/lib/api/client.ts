import type { ArticleDocument } from '@/shared/articles';
import type { ArticleInput } from '@/shared/validation';
import type { ChallengeProgress } from '@/shared/progress';
import type { GallerySummary } from '@/shared/gallery';
import type { CircuitDocument } from '@/lib/automation/types';

/**
 * The only place the browser talks to the API. Every call resolves to a result object
 * instead of throwing, so UI code handles failures explicitly.
 */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  joinedDate: string;
  isOwner: boolean;
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
      credentials: 'same-origin',
    });
  } catch {
    return { ok: false, status: 0, error: 'Network error. Check your connection and try again.' };
  }
  let body: { data?: T; error?: { message?: string } } | null = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON response (e.g. a platform error page).
  }
  if (res.ok && body && 'data' in body) return { ok: true, data: body.data as T };
  return { ok: false, status: res.status, error: body?.error?.message || `Request failed (${res.status}).` };
}

const post = <T>(path: string, payload?: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(payload ?? {}) });

export const authApi = {
  me: () => request<{ user: SessionUser | null; accounts: boolean }>('/api/auth/me', { cache: 'no-store' }),
  signIn: (identifier: string, password: string) => post<{ user: SessionUser }>('/api/auth/signin', { identifier, password }),
  signUp: (input: { name: string; email: string; password: string; role?: string }) =>
    post<{ user: SessionUser }>('/api/auth/signup', input),
  signOut: () => post<{ signedOut: true }>('/api/auth/signout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    post<{ changed: true }>('/api/auth/change-password', { currentPassword, newPassword }),
};

export const articlesApi = {
  listMine: () => request<{ articles: ArticleDocument[] }>('/api/articles?scope=mine', { cache: 'no-store' }),
  get: (slug: string) => request<{ article: ArticleDocument }>(`/api/articles/${encodeURIComponent(slug)}`),
  save: (article: ArticleInput) => post<{ article: ArticleDocument }>('/api/articles', article),
  remove: (slug: string) => request<{ deleted: true }>(`/api/articles/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
};

export const viewsApi = {
  record: (slug: string) => post<{ slug: string; views: number }>('/api/views', { slug }),
};

export const progressApi = {
  sync: (solved: { slug: string; solvedAt: string }[]) => post<{ progress: ChallengeProgress }>('/api/progress', { solved }),
};

export const galleryApi = {
  publish: (input: { title: string; description: string; document: CircuitDocument; forkedFrom?: string }) =>
    post<{ circuit: GallerySummary }>('/api/circuits', input),
  remove: (id: string) => request<{ deleted: true }>(`/api/circuits/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
