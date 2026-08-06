import { randomUUID } from 'node:crypto';
import type { Database } from '../db/client';
import type { NotificationProvider, NotificationRequest } from './provider';

export class DevelopmentNotificationProvider implements NotificationProvider {
  readonly name = 'development';

  constructor(private readonly database: Database) {}

  async send(request: NotificationRequest): Promise<{ reference: string }> {
    const id = randomUUID();
    const reference = `dev_email_${id}`;
    this.database.prepare(`INSERT INTO notification_deliveries
      (id, channel, recipient, template, payload_json, provider, provider_reference, status, sent_at)
      VALUES (?, 'email', ?, ?, ?, ?, ?, 'sent', CURRENT_TIMESTAMP)`)
      .run(id, request.recipient, request.template, JSON.stringify(request.payload), this.name, reference);
    return { reference };
  }
}
