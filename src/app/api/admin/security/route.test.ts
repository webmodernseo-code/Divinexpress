// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentAdmin: vi.fn(),
  getAuthService: vi.fn(),
  updateCredentials: vi.fn(),
}));

vi.mock('@/server/auth/runtime', () => ({
  ADMIN_SESSION_COOKIE: 'divinexpress_admin_session',
  getCurrentAdmin: mocks.getCurrentAdmin,
  getAuthService: mocks.getAuthService,
}));

import { POST } from './route';

function request(body: unknown) {
  return new Request('http://localhost/api/admin/security', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthService.mockResolvedValue({ updateCredentials: mocks.updateCredentials });
  });

  it('rejects anonymous requests', async () => {
    mocks.getCurrentAdmin.mockResolvedValue(null);
    const response = await POST(request({}));
    expect(response.status).toBe(401);
  });

  it('rejects mismatched password confirmation without changing credentials', async () => {
    mocks.getCurrentAdmin.mockResolvedValue({ id: 'admin-1', email: 'owner@example.com', role: 'owner' });
    const response = await POST(request({
      email: 'webmodernseo@gmail.com',
      currentPassword: 'Current password 2026!',
      newPassword: 'New secure password 2026!',
      confirmPassword: 'Different password 2026!',
    }));
    expect(response.status).toBe(400);
    expect(mocks.updateCredentials).not.toHaveBeenCalled();
  });

  it('updates owner credentials and expires the current session cookie', async () => {
    mocks.getCurrentAdmin.mockResolvedValue({ id: 'admin-1', email: 'owner@example.com', role: 'owner' });
    const response = await POST(request({
      email: 'webmodernseo@gmail.com',
      currentPassword: 'Current password 2026!',
      newPassword: 'New secure password 2026!',
      confirmPassword: 'New secure password 2026!',
    }));

    expect(response.status).toBe(200);
    expect(mocks.updateCredentials).toHaveBeenCalledWith({
      userId: 'admin-1',
      email: 'webmodernseo@gmail.com',
      currentPassword: 'Current password 2026!',
      newPassword: 'New secure password 2026!',
    });
    expect(response.headers.get('set-cookie')).toMatch(/divinexpress_admin_session=;/);
  });
});
