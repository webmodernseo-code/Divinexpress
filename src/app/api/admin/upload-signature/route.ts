import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/server/auth/runtime';
import { requireRole } from '@/server/auth/authorization';
import { signUpload } from '@/server/media/cloudinary';
import { DomainError } from '@/server/domain/errors';

const uploadPurposeSchema = z.object({
  purpose: z.enum(['products', 'promotions']),
}).strict();

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    requireRole(admin.role, ['owner', 'manager']);
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.code }, { status: error.status });
    throw error;
  }

  let purpose: 'products' | 'promotions' = 'products';
  try {
    const rawBody = await request.text();
    if (rawBody.trim()) purpose = uploadPurposeSchema.parse(JSON.parse(rawBody)).purpose;
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: 'INVALID_UPLOAD_PURPOSE' }, { status: 400 });
    }
    throw error;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'CLOUDINARY_NOT_CONFIGURED' }, { status: 503 });
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const folder = purpose === 'promotions' ? 'divinexpress/promotions' : 'divinexpress/products';
  const signature = signUpload({ folder, timestamp }, apiSecret);
  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
}
