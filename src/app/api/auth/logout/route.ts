import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, getAuthService } from '@/server/auth/runtime';

export async function POST(request: Request) {
  const token = request.headers.get('cookie')?.match(/(?:^|;\s*)divinexpress_admin_session=([^;]+)/)?.[1];
  if (token) await (await getAuthService()).revokeSession(decodeURIComponent(token));
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
