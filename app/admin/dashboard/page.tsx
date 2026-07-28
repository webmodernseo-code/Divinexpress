import React from 'react';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/Admin/DashboardClient';

export default async function DashboardPage() {
  const session = cookies().get('admin_session')?.value;
  if (!session) {
    redirect('/admin/login');
  }

  const orders = await prisma.order.findMany({
    include: {
      payment: true,
      items: {
        include: {
          variant: {
            include: {
              product: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const products = await prisma.product.findMany({
    include: {
      variants: true,
      images: true
    }
  });

  const promos = await prisma.discountCode.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Map database structures to plain objects for client component
  const mappedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerEmail: o.customerEmail,
    shippingAddr: o.shippingAddr,
    status: o.status,
    totalCents: o.totalCents,
    paymentMethod: o.payment?.provider || 'Mobile Money',
    createdAt: o.createdAt.toISOString()
  }));

  const mappedProducts = products.map((p) => ({
    id: p.id,
    name: p.nameFr, // Default display name
    slug: p.slug,
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      priceCents: v.priceCents,
      stock: v.stock
    })),
    images: p.images.map((i) => ({
      url: i.url
    }))
  }));

  const mappedPromos = promos.map((p) => ({
    id: p.id,
    code: p.code,
    type: p.type,
    value: p.value,
    isActive: p.isActive
  }));

  return (
    <DashboardClient
      initialOrders={mappedOrders}
      initialProducts={mappedProducts}
      initialPromos={mappedPromos}
    />
  );
}
