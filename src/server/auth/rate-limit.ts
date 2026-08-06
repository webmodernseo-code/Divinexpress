import { DomainError } from '../domain/errors';

export class SlidingWindowRateLimiter {
  private readonly attempts = new Map<string, number[]>();

  constructor(
    private readonly maximumAttempts: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  consume(key: string): void {
    const cutoff = this.now() - this.windowMs;
    const recent = (this.attempts.get(key) ?? []).filter((time) => time > cutoff);
    if (recent.length >= this.maximumAttempts) {
      throw new DomainError('RATE_LIMITED', 'Too many attempts', 429);
    }
    recent.push(this.now());
    this.attempts.set(key, recent);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}
