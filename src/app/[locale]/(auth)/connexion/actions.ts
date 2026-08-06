'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DomainError } from '@/server/domain/errors';
import {
  ADMIN_SESSION_COOKIE,
  getAuthService,
  loginRateLimiter,
} from '@/server/auth/runtime';

export interface LoginState { error: string }

export async function loginAction(
  locale: string,
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const fr = locale !== 'en';
  if (!email || !password) {
    return { error: fr ? 'Veuillez renseigner tous les champs.' : 'Please complete every field.' };
  }

  try {
    loginRateLimiter.consume(email);
    const authService = await getAuthService();
    const session = await authService.authenticate(email, password);
    (await cookies()).set(ADMIN_SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(session.expiresAt),
    });
    loginRateLimiter.reset(email);
  } catch (error) {
    const limited = error instanceof DomainError && error.code === 'RATE_LIMITED';
    return {
      error: limited
        ? (fr ? 'Trop de tentatives. Réessayez plus tard.' : 'Too many attempts. Try again later.')
        : (fr ? 'Identifiants invalides.' : 'Invalid credentials.'),
    };
  }
  redirect(`/${locale === 'en' ? 'en' : 'fr'}/dashboard`);
}
