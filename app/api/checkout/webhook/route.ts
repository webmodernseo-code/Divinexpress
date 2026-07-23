import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature, isValidWebhookTimestamp } from '@/lib/geniuspayWebhook';

const SUCCESS_EVENTS = new Set(['payment.success']);
const FAILURE_EVENTS = new Set(['payment.failed', 'payment.cancelled', 'payment.expired']);

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature') ?? '';
  const timestamp = request.headers.get('x-webhook-timestamp') ?? '';
  const event = request.headers.get('x-webhook-event') ?? '';

  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET ?? '';
  if (!secret || !verifyWebhookSignature(rawBody, timestamp, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  if (!isValidWebhookTimestamp(Number(timestamp))) {
    return NextResponse.json({ error: 'Timestamp too old' }, { status: 400 });
  }

  if (!SUCCESS_EVENTS.has(event) && !FAILURE_EVENTS.has(event)) {
    return NextResponse.json({ received: true });
  }

  let payload: { data?: { metadata?: { order_id?: string } } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const orderId = payload.data?.metadata?.order_id;
  if (!orderId) {
    return NextResponse.json({ received: true });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== 'PENDING') {
    return NextResponse.json({ received: true });
  }

  if (SUCCESS_EVENTS.has(event)) {
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { status: 'PAID' } }),
      prisma.payment.update({ where: { orderId }, data: { status: 'SUCCEEDED' } })
    ]);
  } else {
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } }),
      prisma.payment.update({ where: { orderId }, data: { status: 'FAILED' } })
    ]);
  }

  return NextResponse.json({ received: true });
}
