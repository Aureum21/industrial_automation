'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { authApi, type ApiResult, type SessionUser } from '@/lib/api/client';

/**
 * Client-side view of the signed-in user. The server session cookie is the source of truth;
 * this store caches the profile so the header can render instantly, and refreshes it from
 * /api/auth/me once per page load. Authorization is always re-checked by the API.
 */
export type User = SessionUser;

interface SessionState {
  user: User | null;
  /** True once the server has been asked at least once during this page load. */
  checked: boolean;
  /** False when the deployment has no database, so accounts are unavailable. */
  accounts: boolean;
}

const CACHE_KEY = 'automationhub.session.v2';
const listeners = new Set<() => void>();
let state: SessionState = { user: null, checked: false, accounts: true };
let hydrated = false;
let refreshing: Promise<void> | null = null;

function readCache(): User | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeCache(user: User | null) {
  try {
    if (user) localStorage.setItem(CACHE_KEY, JSON.stringify(user));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    // Storage may be unavailable (private mode); the session still works via the cookie.
  }
}

function setState(next: Partial<SessionState>) {
  state = { ...state, ...next };
  if ('user' in next) writeCache(state.user);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (!hydrated && typeof window !== 'undefined') {
    hydrated = true;
    state = { ...state, user: readCache() };
    // Drop the pre-2026-11 cache key, which stored user objects without server verification.
    try {
      localStorage.removeItem('automationhub_authenticated_user');
    } catch {}
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const SERVER_STATE: SessionState = { user: null, checked: false, accounts: true };

export function refreshSession(): Promise<void> {
  refreshing ??= authApi
    .me()
    .then((result) => {
      if (result.ok) setState({ user: result.data.user, accounts: result.data.accounts, checked: true });
      else setState({ checked: true });
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** Current session; triggers one server check per page load. */
export function useSession(): SessionState {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  useEffect(() => {
    if (!state.checked) void refreshSession();
  }, []);
  return snapshot;
}

export async function signIn(identifier: string, password: string): Promise<ApiResult<{ user: User }>> {
  const result = await authApi.signIn(identifier, password);
  if (result.ok) setState({ user: result.data.user, checked: true });
  return result;
}

export async function signUp(input: { name: string; email: string; password: string; role?: string }): Promise<ApiResult<{ user: User }>> {
  const result = await authApi.signUp(input);
  if (result.ok) setState({ user: result.data.user, checked: true });
  return result;
}

export async function signOut(): Promise<void> {
  await authApi.signOut();
  setState({ user: null, checked: true });
}

export const changePassword = authApi.changePassword;
