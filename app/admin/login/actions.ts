'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken } from '@/lib/adminAuth';

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const secret = process.env.ADMIN_SESSION_SECRET;

  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin || !secret || !verifyPassword(password, admin.passwordHash)) {
    redirect('/admin/login?error=1');
  }

  cookies().set('admin_session', createSessionToken(admin.id, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: 60 * 60 * 24 * 7
  });

  redirect('/admin');
}
