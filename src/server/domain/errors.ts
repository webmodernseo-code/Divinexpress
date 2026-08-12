export type DomainErrorCode =
  | 'CURRENCY_MISMATCH'
  | 'INVALID_MONEY'
  | 'INVALID_QUANTITY'
  | 'INVALID_ORDER_TRANSITION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'PAYMENT_PROVIDER_NOT_CONFIGURED';

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
