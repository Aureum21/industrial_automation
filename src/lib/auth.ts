'use client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  stationId?: string;
  avatar?: string;
  bio?: string;
  joinedDate: string;
}

export const DEMO_USERS: User[] = [
  {
    id: 'usr-001',
    name: 'Alazar Wake Kore',
    email: 'alazar@industrialautomation.website',
    role: 'Electrical Engineering Technology Senior at Higher Colleges of Technology (UAE)',
    stationId: 'PLC-STATION-ALPHA',
    avatar: 'AW',
    bio: 'Electrical Engineering Technology Senior at Higher Colleges of Technology (UAE) specializing in industrial control systems, deterministic PLC logic, and distributed SCADA telemetry.',
    joinedDate: 'Jan 2024',
  },
  {
    id: 'usr-002',
    name: 'Sarah Dev',
    email: 'sarah.dev@automationhub.io',
    role: 'Senior Controls & Robotics Specialist',
    stationId: 'MOTION-LAB-04',
    avatar: 'SD',
    bio: 'Specialist in 6-axis kinematics, high-speed vision sorting, and deterministic fieldbus timing.',
    joinedDate: 'Mar 2024',
  },
  {
    id: 'usr-003',
    name: 'Alex Rivera',
    email: 'alex.rivera@automationhub.io',
    role: 'Field Systems Integrator',
    stationId: 'EDGE-GATEWAY-09',
    avatar: 'AR',
    bio: 'Commissioning engineer specializing in burner management, fail-safe ESD loops, and OPC-UA telemetry.',
    joinedDate: 'Jul 2024',
  },
];

const AUTH_STORAGE_KEY = 'automationhub_authenticated_user';
export const AUTH_CHANGE_EVENT = 'automationhub_auth_change';

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Failed to parse stored user:', err);
    return null;
  }
}

export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: user }));
  } catch (err) {
    console.error('Failed to save user session:', err);
  }
}

export function clearCurrentUser(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: null }));
  } catch (err) {
    console.error('Failed to clear user session:', err);
  }
}

/**
 * Sign in against Neon PostgreSQL backend (/api/auth/signin).
 * Synchronizes session cookie and localStorage user state.
 */
export async function signInWithNeon(
  emailOrUsername: string,
  password: string
): Promise<{ ok: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Failed to sign in.' };
    }

    if (data.user) {
      setCurrentUser(data.user);
    }

    return { ok: true, user: data.user };
  } catch (err) {
    return { ok: false, error: (err as Error).message || 'Network connection failed.' };
  }
}

/**
 * Sign up a new user in Neon PostgreSQL backend (/api/auth/signup).
 */
export async function signUpWithNeon(userData: {
  name: string;
  email: string;
  password: string;
  stationId?: string;
  role?: string;
  bio?: string;
}): Promise<{ ok: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Failed to create account.' };
    }

    if (data.user) {
      setCurrentUser(data.user);
    }

    return { ok: true, user: data.user };
  } catch (err) {
    return { ok: false, error: (err as Error).message || 'Network connection failed.' };
  }
}

/**
 * Sign out from server session and clear local session state.
 */
export async function signOutWithNeon(): Promise<void> {
  try {
    await fetch('/api/auth/signout', { method: 'POST' });
  } catch (err) {
    console.warn('Signout request failed:', err);
  } finally {
    clearCurrentUser();
  }
}

/**
 * Check if the active session is valid on Neon server (/api/auth/me).
 */
export async function checkSessionWithNeon(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    if (data.ok && data.user) {
      setCurrentUser(data.user);
      return data.user;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Updates the user's password in Neon PostgreSQL (/api/auth/change-password).
 */
export async function changePasswordWithNeon(payload: {
  currentPassword: string;
  newPassword: string;
  emailOrUsername?: string;
}): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Failed to update password.' };
    }

    return { ok: true, message: data.message };
  } catch (err) {
    return { ok: false, error: (err as Error).message || 'Network connection failed.' };
  }
}
