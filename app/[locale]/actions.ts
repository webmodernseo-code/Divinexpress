'use server';

import prisma from '@/lib/db';

export async function validatePromoCode(code: string) {
  try {
    const promo = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!promo || !promo.isActive) {
      return { success: false };
    }

    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return { success: false };
    }

    return {
      success: true,
      type: promo.type.toLowerCase(), // 'percent' or 'fixed'
      value: promo.value
    };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return { success: false };
  }
}

interface CreateOrderData {
  email: string;
  phone: string;
  address: string;
  paymentMethod: string;
  total: number;
  items: {
    variantId: string;
    quantity: number;
    price: number;
  }[];
  promoCode?: string;
}

export async function createOrder(data: CreateOrderData) {
  try {
    const orderNumber = `DV-${Math.floor(100000 + Math.random() * 900000)}`;

    let discountCodeId: string | undefined;
    let discountCents = 0;

    if (data.promoCode) {
      const promo = await prisma.discountCode.findUnique({
        where: { code: data.promoCode.toUpperCase() }
      });
      if (promo && promo.isActive) {
        discountCodeId = promo.id;
        if (promo.type === 'PERCENT') {
          const subtotal = data.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
          discountCents = Math.round(subtotal * 100 * (promo.value / 100));
        } else {
          discountCents = promo.value * 100;
        }
      }
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerEmail: data.email,
        shippingAddr: data.address,
        country: 'FR', // Default for now
        currency: 'EUR', // Default for now
        status: 'PAID', // Automatically mark as paid for simulated success
        totalCents: Math.round(data.total * 100),
        discountCents,
        discountCodeId,
        items: {
          create: data.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            unitPriceCents: Math.round(item.price * 100)
          }))
        }
      }
    });

    return { success: true, orderNumber: order.orderNumber };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false };
  }
}
