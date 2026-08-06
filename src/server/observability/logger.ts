import { randomUUID } from 'node:crypto';
import { redact } from '../security/redaction';

type LogLevel = 'info' | 'warn' | 'error';

export interface LogContext { correlationId?: string; [key: string]: unknown }

export function log(level: LogLevel, message: string, context: LogContext = {}): string {
  const correlationId = context.correlationId ?? randomUUID();
  const entry = {
    timestamp: new Date().toISOString(), level, message, correlationId,
    context: redact({ ...context, correlationId: undefined }),
  };
  const serialized = JSON.stringify(entry);
  if (level === 'error') console.error(serialized);
  else if (level === 'warn') console.warn(serialized);
  else console.info(serialized);
  return correlationId;
}
