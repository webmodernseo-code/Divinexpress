'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export async function markOrderFulfilled(id: string): Promise<void> {
  const result = await prisma.order.updateMany({
    where: { id, status: 'PAID' },
    data: { status: 'FULFILLED' }
  });

  if (result.count === 0) {
    redirect(`/admin/commandes/${id}?error=transition-invalide`);
  }

  redirect(`/admin/commandes/${id}`);
}

export async function cancelOrder(id: string): Promise<void> {
  const cancelled = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) return null;

    const result = await tx.order.updateMany({
      where: { id, status: { in: ['PENDING', 'PAID'] } },
      data: { status: 'CANCELLED' }
    });
    if (result.count === 0) return null;

    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } }
      });
    }

    return order;
  });

  if (!cancelled) {
    redirect(`/admin/commandes/${id}?error=transition-invalide`);
  }

  redirect(`/admin/commandes/${id}`);
}
