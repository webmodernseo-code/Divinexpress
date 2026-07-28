'use server';

import prisma from '@/lib/db';
import { comparePassword } from '@/lib/adminPassword';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { OrderStatus, DiscountType } from '@prisma/client';

export async function adminLogin(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin) {
      return { success: false, error: 'Invalid credentials.' };
    }

    const passwordMatch = comparePassword(password, admin.passwordHash);
    if (!passwordMatch) {
      return { success: false, error: 'Invalid credentials.' };
    }

    // Set cookie session
    cookies().set('admin_session', admin.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });

    return { success: true };
  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false, error: 'An error occurred during sign in.' };
  }
}

export async function adminLogout() {
  cookies().set('admin_session', '', { maxAge: 0, path: '/' });
  return { success: true };
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus }
    });
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false };
  }
}

export async function updateProductStock(variantId: string, stock: number) {
  try {
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock }
    });
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating product stock:', error);
    return { success: false };
  }
}

export async function createPromoCode(code: string, type: string, value: number) {
  try {
    await prisma.discountCode.create({
      data: {
        code: code.toUpperCase(),
        type: type.toUpperCase() as DiscountType,
        value,
        isActive: true
      }
    });
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error creating promo code:', error);
    return { success: false };
  }
}

export async function togglePromoCode(promoId: string, isActive: boolean) {
  try {
    await prisma.discountCode.update({
      where: { id: promoId },
      data: { isActive }
    });
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error toggling promo code:', error);
    return { success: false };
  }
}
