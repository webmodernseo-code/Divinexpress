const sensitiveKey = /^(authorization|cookie|password|password_hash|secret|token|sessiontoken|email|phone|address|line1|line2)$/i;

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [
    key,
    sensitiveKey.test(key) ? '[REDACTED]' : redact(item),
  ]));
}
