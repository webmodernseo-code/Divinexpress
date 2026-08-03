import { loadAdminDemoState, saveAdminDemoState, resetAdminDemoState } from './repository';
import { beforeEach, describe, expect, it } from 'vitest';

describe('admin demo repository', () => {
  beforeEach(() => localStorage.clear());

  it('returns deterministic seed data when storage is empty', () => {
    const state = loadAdminDemoState();
    expect(state.metrics).toHaveLength(4);
    expect(state.recentOrders[0].id).toBe('RG-2841');
  });

  it('persists dashboard preferences', () => {
    const state = loadAdminDemoState();
    saveAdminDemoState({ ...state, preferences: { ...state.preferences, period: '7d' } });
    expect(loadAdminDemoState().preferences.period).toBe('7d');
  });

  it('restores the seed after reset', () => {
    const state = loadAdminDemoState();
    saveAdminDemoState({ ...state, recentOrders: [] });
    resetAdminDemoState();
    expect(loadAdminDemoState().recentOrders.length).toBeGreaterThan(0);
  });
});
