'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/orderNumber';
import { resolveShippingZone } from '@/lib/shippingZone';
import { eurCentsToXof, initiatePayment } from '@/lib/geniuspay';
import { computeDiscountCents } from '@/lib/discountCode';
import type { Locale } from '@/i18n';

export type CheckoutCartLine = { variantId: string; quantity: number };

export type CheckoutInput = {
  locale: Locale;
  email: string;
  shippingAddr: string;
  country: string;
  cart: CheckoutCartLine[];
  discountCode?: string;
};

export type CheckoutResult = { checkoutUrl: string } | { error: string };

export type DiscountPreviewResult = { discountCents: number; code: string } | { error: string };

class InsufficientStockError extends Error {}

function buildConfirmationUrl(locale: string, orderNumber: string): string {
  const host = headers().get('host') ?? 'divinexpress.fr';
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  return `${protocol}://${host}/${locale}/checkout/confirmation/${orderNumber}`;
}

export async function validateDiscountCode(code: string, subtotalCents: number): Promise<DiscountPreviewResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { error: 'Merci de renseigner un code.' };
  }

  const discountCode = await prisma.discountCode.findUnique({ where: { code: normalized } });
  if (!discountCode || !discountCode.isActive) {
    return { error: 'Code promo invalide.' };
  }
  if (discountCode.expiresAt && discountCode.expiresAt < new Date()) {
    return { error: 'Ce code a expiré.' };
  }

  const discountCents = computeDiscountCents(subtotalCents, discountCode.type, discountCode.value);
  return { discountCents, code: normalized };
}

export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  if (!input.email || !input.shippingAddr || !input.country || input.cart.length === 0) {
    return { error: 'Merci de renseigner tous les champs et de vérifier votre panier.' };
  }

  if (input.cart.some((line) => !Number.isInteger(line.quantity) || line.quantity <= 0)) {
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

  const quantityByVariantId = new Map<string, number>();
  for (const line of input.cart) {
    quantityByVariantId.set(line.variantId, (quantityByVariantId.get(line.variantId) ?? 0) + line.quantity);
  }

  for (const [variantId, quantity] of quantityByVariantId) {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant || variant.stock < quantity) {
      return { error: "Un ou plusieurs articles de votre panier ne sont plus disponibles en quantité suffisante." };
    }
  }

  const subtotalCents = input.cart.reduce((sum, line) => {
    const variant = variants.find((v) => v.id === line.variantId)!;
    return sum + variant.priceCents * line.quantity;
  }, 0);

  let discountCents = 0;
  let discountCodeId: string | null = null;
  if (input.discountCode) {
    const normalized = input.discountCode.trim().toUpperCase();
    const discount = await prisma.discountCode.findUnique({ where: { code: normalized } });
    if (!discount || !discount.isActive) {
      return { error: "Ce code promo n'est plus valide." };
    }
    if (discount.expiresAt && discount.expiresAt < new Date()) {
      return { error: 'Ce code promo a expiré.' };
    }
    discountCents = computeDiscountCents(subtotalCents, discount.type, discount.value);
    discountCodeId = discount.id;
  }

  const totalCents = subtotalCents - discountCents + zone.costCents;
  const orderNumber = generateOrderNumber();

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      for (const line of input.cart) {
        const result = await tx.productVariant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } }
        });
        if (result.count === 0) {
          throw new InsufficientStockError();
        }
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
          discountCents,
          discountCodeId,
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
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return { error: "Un ou plusieurs articles de votre panier ne sont plus disponibles en quantité suffisante." };
    }
    throw err;
  }

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
