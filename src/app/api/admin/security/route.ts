import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DomainError } from '@/server/domain/errors';
import { requireRole } from '@/server/auth/authorization';
import { ADMIN_SESSION_COOKIE, getAuthService, getCurrentAdmin } from '@/server/auth/runtime';

const securitySchema = z.object({
  email: z.email(),
  currentPassword: z.string().min(8).max(128),
  newPassword: z.union([z.literal(''), z.string().min(12).max(128)]),
  confirmPassword: z.string().max(128),
}).strict().superRefine((value, context) => {
  if (value.newPassword !== value.confirmPassword) {
    context.addIssue({
      code: 'custom',
      path: ['confirmPassword'],
      message: 'PASSWORD_CONFIRMATION_MISMATCH',
    });
  }
});

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  return NextResponse.json({ email: admin.email, role: admin.role });
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    requireRole(admin.role, ['owner']);
    const input = securitySchema.parse(await request.json());
    await (await getAuthService()).updateCredentials({
      userId: admin.id,
      email: input.email,
      currentPassword: input.currentPassword,
      newPassword: input.newPassword || undefined,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'INVALID_SECURITY_SETTINGS' }, { status: 400 });
    }
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'SECURITY_UPDATE_FAILED' }, { status: 500 });
  }
}
