'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export async function updateShippingZoneCost(id: string, formData: FormData): Promise<void> {
  const costEuros = Number(formData.get('costEuros'));
  if (!Number.isFinite(costEuros) || costEuros < 0) {
    redirect('/admin/parametres/livraison?error=cout-invalide');
  }

  await prisma.shippingZone.update({
    where: { id },
    data: { costCents: Math.round(costEuros * 100) }
  });

  redirect('/admin/parametres/livraison');
}
