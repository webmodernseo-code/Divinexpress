import { createAdminDemoSeed } from './demoData';
import type { AdminDemoState } from './types';

export const ADMIN_STORAGE_KEY = 'divinexpress:admin-demo:v1';

export function loadAdminDemoState(): AdminDemoState {
  if (typeof window === 'undefined') return createAdminDemoSeed();
  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return createAdminDemoSeed();
    const parsed = JSON.parse(raw) as AdminDemoState;
    return parsed.version === 1 ? parsed : createAdminDemoSeed();
  } catch {
    return createAdminDemoSeed();
  }
}

export function saveAdminDemoState(state: AdminDemoState): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(state));
}

export function resetAdminDemoState(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(ADMIN_STORAGE_KEY);
}
