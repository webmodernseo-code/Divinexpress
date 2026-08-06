import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { getCommerceDatabase } from '@/server/db/runtime';
import { getDashboardState } from '@/server/dashboard/queries';
import type { DashboardPeriod } from '@/lib/admin/types';

export async function GET(request: Request) {
  if (!await getCurrentAdmin()) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const requested = new URL(request.url).searchParams.get('period');
  const period: DashboardPeriod = requested === '7d' || requested === '90d' ? requested : '30d';
  const db = await getCommerceDatabase();
  return NextResponse.json(await getDashboardState(db, period));
}
