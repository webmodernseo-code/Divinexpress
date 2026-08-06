import { DomainError } from './errors';

export type Currency = 'EUR' | 'GBP';

export interface Money {
  readonly amountMinor: number;
  readonly currency: Currency;
}

export function money(amountMinor: number, currency: Currency): Money {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new DomainError('INVALID_MONEY', 'Money must use non-negative integer minor units');
  }
  return { amountMinor, currency };
}

export function addMoney(left: Money, right: Money): Money {
  if (left.currency !== right.currency) {
    throw new DomainError('CURRENCY_MISMATCH', 'Currencies must match');
  }
  return money(left.amountMinor + right.amountMinor, left.currency);
}

export function multiplyMoney(value: Money, quantity: number): Money {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new DomainError('INVALID_QUANTITY', 'Quantity must be a positive integer');
  }
  return money(value.amountMinor * quantity, value.currency);
}
