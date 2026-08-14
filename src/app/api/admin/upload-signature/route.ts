import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { signUpload } from '@/server/media/cloudinary';
import { DomainError } from '@/server/domain/errors';

export async function POST() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    requireRole(admin.role, ['owner', 'manager']);
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
    throw error;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'CLOUDINARY_NOT_CONFIGURED' }, { status: 503 });
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const folder = 'divinexpress/products';
  const signature = signUpload({ folder, timestamp }, apiSecret);
  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
}
