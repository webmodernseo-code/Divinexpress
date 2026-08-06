export interface NotificationRequest {
  recipient: string;
  template: string;
  payload: Record<string, unknown>;
}

export interface NotificationProvider {
  readonly name: string;
  send(request: NotificationRequest): Promise<{ reference: string }>;
}
