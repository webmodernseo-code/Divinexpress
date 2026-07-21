// lib/currentAdmin.ts
import { cache } from 'react';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/adminSession';

export const getCurrentAdmin = cache(async (): Promise<{ name: string | null; email: string } | null> => {
  const sessionCookie = cookies().get('admin_session')?.value;
  const secret = process.env.ADMIN_SESSION_SECRET ?? '';
  const session = sessionCookie ? await verifySessionToken(sessionCookie, secret) : null;
  if (!session) return null;
  return prisma.admin.findUnique({ where: { id: session.adminId }, select: { name: true, email: true } });
});
