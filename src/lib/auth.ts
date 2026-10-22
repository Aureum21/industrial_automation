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
