import { DomainError } from '../domain/errors';

export type AdminRole = 'owner' | 'manager' | 'support';

export function requireRole(role: AdminRole, allowed: readonly AdminRole[]): void {
  if (!allowed.includes(role)) {
    throw new DomainError('FORBIDDEN', 'Insufficient permissions', 403);
  }
}
