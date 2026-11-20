'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * A JSON value persisted in localStorage and shared by every component using the same key.
 * Renders `fallback` on the server and during hydration, then the stored value.
 * Pass a module-level constant as `fallback` (not an inline [] or {}) so its identity is stable.
 */
const EVENT = 'automationhub:storage';
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return fallback;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function writeStoredValue<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the value just isn't persisted.
  }
  window.dispatchEvent(new Event(EVENT));
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** A raw (non-JSON) string in localStorage, for keys written before values were JSON-encoded. */
export function useStoredString(key: string): [string | null, (value: string) => void] {
  const value = useSyncExternalStore(subscribe, () => readRaw(key), () => null);
  const set = useCallback(
    (next: string) => {
      try {
        localStorage.setItem(key, next);
      } catch {}
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );
  return [value, set];
}

export function useStoredValue<T>(key: string, fallback: T): [T, (value: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  );
  const set = useCallback((next: T) => writeStoredValue(key, next), [key]);
  return [value, set];
}
