'use server';

import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

function parseValue(type: string, rawValue: FormDataEntryValue | null): number | null {
  if (rawValue === null || String(rawValue).trim() === '') return null;
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return null;

  if (type === 'PERCENT') {
    if (!Number.isInteger(value) || value < 1 || value > 100) return null;
    return value;
  }
  if (type === 'FIXED') {
    if (value <= 0) return null;
    return Math.round(value * 100);
  }
  return null;
}

function parseExpiresAt(raw: FormDataEntryValue | null): Date | null {
  const trimmed = String(raw ?? '').trim();
  return trimmed ? new Date(trimmed) : null;
}

export async function createDiscountCode(formData: FormData): Promise<void> {
  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  const type = String(formData.get('type') ?? '');

  if (!code) {
    redirect('/admin/reductions?error=code-requis');
  }
  const value = parseValue(type, formData.get('value'));
  if (value === null) {
    redirect('/admin/reductions?error=valeur-invalide');
  }

  try {
    await prisma.discountCode.create({
      data: {
        code,
        type: type as 'PERCENT' | 'FIXED',
        value,
        expiresAt: parseExpiresAt(formData.get('expiresAt'))
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      redirect('/admin/reductions?error=code-deja-utilise');
    }
    throw err;
  }

  redirect('/admin/reductions');
}

export async function updateDiscountCode(id: string, formData: FormData): Promise<void> {
  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  const type = String(formData.get('type') ?? '');

  if (!code) {
    redirect(`/admin/reductions/${id}?error=code-requis`);
  }
  const value = parseValue(type, formData.get('value'));
  if (value === null) {
    redirect(`/admin/reductions/${id}?error=valeur-invalide`);
  }

  try {
    await prisma.discountCode.update({
      where: { id },
      data: {
        code,
        type: type as 'PERCENT' | 'FIXED',
        value,
        expiresAt: parseExpiresAt(formData.get('expiresAt'))
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      redirect(`/admin/reductions/${id}?error=code-deja-utilise`);
    }
    throw err;
  }

  redirect('/admin/reductions');
}

export async function toggleDiscountCodeActive(id: string): Promise<void> {
  const discountCode = await prisma.discountCode.findUniqueOrThrow({ where: { id } });
  await prisma.discountCode.update({ where: { id }, data: { isActive: !discountCode.isActive } });
  redirect('/admin/reductions');
}

export async function deleteDiscountCode(id: string): Promise<void> {
  await prisma.discountCode.delete({ where: { id } });
  redirect('/admin/reductions');
}
