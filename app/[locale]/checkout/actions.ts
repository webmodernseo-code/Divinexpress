'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/orderNumber';
import { resolveShippingZone } from '@/lib/shippingZone';
import { eurCentsToXof, initiatePayment } from '@/lib/geniuspay';
import type { Locale } from '@/i18n';

export type CheckoutCartLine = { variantId: string; quantity: number };

export type CheckoutInput = {
  locale: Locale;
  email: string;
  shippingAddr: string;
  country: string;
  cart: CheckoutCartLine[];
};

export type CheckoutResult = { checkoutUrl: string } | { error: string };

function buildConfirmationUrl(locale: string, orderNumber: string): string {
  const host = headers().get('host') ?? 'divinexpress.fr';
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  return `${protocol}://${host}/${locale}/checkout/confirmation/${orderNumber}`;
}

export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  if (!input.email || !input.shippingAddr || !input.country || input.cart.length === 0) {
    return { error: 'Merci de renseigner tous les champs et de vérifier votre panier.' };
  }

  const zones = await prisma.shippingZone.findMany();
  const zoneIndex = resolveShippingZone(input.country, zones);
  if (zoneIndex === -1) {
    return { error: "Ce pays n'est pas encore livré, désolé." };
  }
  const zone = zones[zoneIndex];

  const variantIds = input.cart.map((line) => line.variantId);
  const variants = await prisma.productVariant.findMany({ where: { id: { in: variantIds } } });

  for (const line of input.cart) {
    const variant = variants.find((v) => v.id === line.variantId);
    if (!variant || variant.stock < line.quantity) {
      return { error: "Un ou plusieurs articles de votre panier ne sont plus disponibles en quantité suffisante." };
    }
  }

  const subtotalCents = input.cart.reduce((sum, line) => {
    const variant = variants.find((v) => v.id === line.variantId)!;
    return sum + variant.priceCents * line.quantity;
  }, 0);
  const totalCents = subtotalCents + zone.costCents;
  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    for (const line of input.cart) {
      await tx.productVariant.update({
        where: { id: line.variantId },
        data: { stock: { decrement: line.quantity } }
      });
    }

    return tx.order.create({
      data: {
        orderNumber,
        customerEmail: input.email,
        shippingAddr: input.shippingAddr,
        country: input.country,
        currency: 'EUR',
        status: 'PENDING',
        totalCents,
        items: {
          create: input.cart.map((line) => {
            const variant = variants.find((v) => v.id === line.variantId)!;
            return {
              variantId: line.variantId,
              quantity: line.quantity,
              unitPriceCents: variant.priceCents
            };
          })
        },
        payment: {
          create: {
            provider: 'geniuspay',
            reference: orderNumber,
            status: 'PENDING',
            amountCents: eurCentsToXof(totalCents),
            currency: 'XOF'
          }
        }
      }
    });
  });

  const confirmationUrl = buildConfirmationUrl(input.locale, orderNumber);

  try {
    const payment = await initiatePayment({
      amountXof: eurCentsToXof(totalCents),
      description: `Commande ${orderNumber}`,
      customer: { email: input.email },
      successUrl: confirmationUrl,
      errorUrl: confirmationUrl,
      metadata: { order_id: order.id }
    });

    await prisma.payment.update({
      where: { orderId: order.id },
      data: { reference: payment.reference }
    });

    return { checkoutUrl: payment.checkoutUrl };
  } catch {
    await prisma.$transaction(async (tx) => {
      for (const line of input.cart) {
        await tx.productVariant.update({
          where: { id: line.variantId },
          data: { stock: { increment: line.quantity } }
        });
      }
      await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
      await tx.payment.update({ where: { orderId: order.id }, data: { status: 'FAILED' } });
    });
    return { error: "Le paiement n'a pas pu être initié, merci de réessayer." };
  }
}
