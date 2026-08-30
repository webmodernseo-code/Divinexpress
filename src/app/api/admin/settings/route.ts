import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { getCommerceDatabase } from '@/server/db/runtime';
import {
  readStoreSettings,
  storeSettingsSchema,
  writeStoreSettings,
} from '@/server/settings/store-settings';

export async function GET() {
  if (!await getCurrentAdmin()) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const settings = await readStoreSettings(await getCommerceDatabase());
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    requireRole(admin.role, ['owner', 'manager']);
    const input = storeSettingsSchema.parse(await request.json());
    const settings = await writeStoreSettings(await getCommerceDatabase(), admin.id, input);
    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'INVALID_SETTINGS' }, { status: 400 });
    }
    return NextResponse.json({ error: 'SETTINGS_SAVE_FAILED' }, { status: 500 });
  }
}
