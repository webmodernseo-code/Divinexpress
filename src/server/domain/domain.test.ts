// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DomainError } from './errors';
import { addMoney, money, multiplyMoney } from './money';
import { assertOrderTransition } from './order-status';

describe('money', () => {
  it('adds integer minor units in the same currency', () => {
    expect(addMoney(money(1099, 'EUR'), money(201, 'EUR'))).toEqual({
      amountMinor: 1300,
      currency: 'EUR',
    });
  });

  it('rejects mixed currencies', () => {
    expect(() => addMoney(money(100, 'EUR'), money(100, 'GBP')))
      .toThrowError(new DomainError('CURRENCY_MISMATCH', 'Currencies must match'));
  });

  it('rejects non-integer and negative minor units', () => {
    expect(() => money(1.5, 'EUR')).toThrowError(DomainError);
    expect(() => money(-1, 'EUR')).toThrowError(DomainError);
  });

  it('multiplies a price by a positive integer quantity', () => {
    expect(multiplyMoney(money(2500, 'EUR'), 3)).toEqual({
      amountMinor: 7500,
      currency: 'EUR',
    });
    expect(() => multiplyMoney(money(2500, 'EUR'), 0)).toThrowError(DomainError);
  });
});

describe('order state transitions', () => {
  it('allows the normal fulfilment lifecycle', () => {
    expect(() => assertOrderTransition('pending_payment', 'paid')).not.toThrow();
    expect(() => assertOrderTransition('paid', 'preparing')).not.toThrow();
    expect(() => assertOrderTransition('preparing', 'shipped')).not.toThrow();
    expect(() => assertOrderTransition('shipped', 'delivered')).not.toThrow();
  });

  it('rejects skipping fulfilment states and changes after cancellation', () => {
    expect(() => assertOrderTransition('paid', 'delivered'))
      .toThrowError(new DomainError('INVALID_ORDER_TRANSITION', 'Invalid order transition'));
    expect(() => assertOrderTransition('cancelled', 'paid')).toThrowError(DomainError);
  });
});
