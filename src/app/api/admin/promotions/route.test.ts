// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeDatabase, createDatabase, type Database } from '@/server/db/client';
import { migrateDatabase } from '@/server/db/migrate';
import { DomainError } from '@/server/domain/errors';

const mocks = vi.hoisted(() => ({
  getCurrentAdmin: vi.fn(),
  getCommerceDatabase: vi.fn(),
  signUpload: vi.fn(() => 'signature'),
}));

vi.mock('@/server/auth/runtime', () => ({ getCurrentAdmin: mocks.getCurrentAdmin }));
vi.mock('@/server/db/runtime', () => ({ getCommerceDatabase: mocks.getCommerceDatabase }));
vi.mock('@/server/media/cloudinary', () => ({ signUpload: mocks.signUpload }));

import { GET, PATCH as reorder, POST } from './route';
import { DELETE, PATCH as update } from './[id]/route';
import { POST as uploadSignature } from '../upload-signature/route';

describe('promotion administration routes', () => {
  let database: Database;

  beforeEach(async () => {
    database = createDatabase(':memory:');
    await migrateDatabase(database);
    await database.prepare('INSERT INTO categories (id, slug, name_fr, name_en) VALUES (?, ?, ?, ?)')
      .run('category:test', 'test', 'Test', 'Test');
    await database.prepare(`INSERT INTO products
      (id, category_id, slug, name_fr, name_en, status) VALUES (?, ?, ?, ?, ?, ?)`)
      .run('product:active', 'category:test', 'active-product', 'Produit actif', 'Active product', 'active');
    await database.prepare(`INSERT INTO products
      (id, category_id, slug, name_fr, name_en, status) VALUES (?, ?, ?, ?, ?, ?)`)
      .run('product:draft', 'category:test', 'draft-product', 'Produit brouillon', 'Draft product', 'draft');

    mocks.getCommerceDatabase.mockResolvedValue(database);
    mocks.getCurrentAdmin.mockResolvedValue({ id: 'admin:owner', role: 'owner' });
    mocks.signUpload.mockClear();
    process.env.CLOUDINARY_CLOUD_NAME = 'cloud';
    process.env.CLOUDINARY_API_KEY = 'key';
    process.env.CLOUDINARY_API_SECRET = 'secret';
  });

  afterEach(async () => {
    await closeDatabase();
    vi.clearAllMocks();
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
  });

  it('rejects an unauthenticated promotion listing', async () => {
    mocks.getCurrentAdmin.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'UNAUTHORIZED' });
  });

  it('maps listing domain errors to their API status and code', async () => {
    mocks.getCommerceDatabase.mockRejectedValue(new DomainError('CONFLICT', 'Database conflict', 409));

    const response = await GET();

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'CONFLICT' });
  });

  it('allows any authenticated admin to list slides but forbids support mutations', async () => {
    await database.prepare(`INSERT INTO promotion_slides (id, image_url, product_id, position, active)
      VALUES (?, ?, ?, ?, ?)`)
      .run('slide:existing', '/image/promotions/existing.png', 'product:active', 0, 1);

    await expect((await GET()).json()).resolves.toEqual([
      expect.objectContaining({ id: 'slide:existing', productId: 'product:active' }),
    ]);

    mocks.getCurrentAdmin.mockResolvedValue({ id: 'admin:support', role: 'support' });
    const response = await POST(jsonRequest({
      imageUrl: '/image/promotions/new.png', productId: 'product:active', position: 1, active: true,
    }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'FORBIDDEN' });
  });

  it('rejects invalid slides and products that are missing or inactive', async () => {
    const invalidImage = await POST(jsonRequest({
      imageUrl: 'not-an-image-path', productId: 'product:active', position: 0, active: true,
    }));
    const missingProduct = await POST(jsonRequest({
      imageUrl: '/image/promotions/new.png', productId: 'product:missing', position: 0, active: true,
    }));
    const inactiveProduct = await POST(jsonRequest({
      imageUrl: '/image/promotions/new.png', productId: 'product:draft', position: 0, active: true,
    }));

    expect(invalidImage.status).toBe(400);
    expect(missingProduct.status).toBe(400);
    expect(inactiveProduct.status).toBe(400);
  });

  it('creates, updates, reorders, and deletes slides through the repository boundary', async () => {
    const createdResponse = await POST(jsonRequest({
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/slide.png',
      productId: 'product:active',
      position: 8,
      active: true,
    }));

    expect(createdResponse.status).toBe(201);
    const created = await createdResponse.json() as { id: string; imageUrl: string; position: number };
    expect(created).toMatchObject({ imageUrl: 'https://res.cloudinary.com/demo/image/upload/slide.png', position: 8 });

    const secondResponse = await POST(jsonRequest({
      imageUrl: '/image/promotions/second.png', productId: 'product:active', position: 9, active: true,
    }));
    const second = await secondResponse.json() as { id: string };

    const updatedResponse = await update(jsonRequest({ active: false, position: 4 }), {
      params: Promise.resolve({ id: created.id }),
    });
    expect(updatedResponse.status).toBe(200);
    await expect(updatedResponse.json()).resolves.toMatchObject({ id: created.id, active: false, position: 4 });

    const reorderedResponse = await reorder(jsonRequest({ ids: [second.id, created.id] }));
    expect(reorderedResponse.status).toBe(200);

    const positions = await database.prepare('SELECT id, position FROM promotion_slides ORDER BY position').all();
    expect(positions).toEqual([{ id: second.id, position: 0 }, { id: created.id, position: 1 }]);

    const deletedResponse = await DELETE(new Request('http://localhost/api/admin/promotions/' + created.id, { method: 'DELETE' }), {
      params: Promise.resolve({ id: created.id }),
    });
    expect(deletedResponse.status).toBe(204);
    await expect(database.prepare('SELECT id FROM promotion_slides WHERE id = ?').get(created.id)).resolves.toBeUndefined();
  });

  it('rejects duplicate reorder IDs', async () => {
    const response = await reorder(jsonRequest({ ids: ['slide:one', 'slide:one'] }));

    expect(response.status).toBe(400);
  });

  it('rejects an unauthenticated reorder', async () => {
    mocks.getCurrentAdmin.mockResolvedValue(null);

    const response = await reorder(jsonRequest({ ids: ['slide:one'] }));

    expect(response.status).toBe(401);
  });

  it('rejects an unauthenticated slide update', async () => {
    mocks.getCurrentAdmin.mockResolvedValue(null);

    const response = await update(jsonRequest({ active: false }), { params: Promise.resolve({ id: 'slide:one' }) });

    expect(response.status).toBe(401);
  });

  it('rejects an unauthenticated slide deletion', async () => {
    mocks.getCurrentAdmin.mockResolvedValue(null);

    const response = await DELETE(new Request('http://localhost/api/admin/promotions/slide:one', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'slide:one' }),
    });

    expect(response.status).toBe(401);
  });

  it('forbids support from reordering slides', async () => {
    mocks.getCurrentAdmin.mockResolvedValue({ id: 'admin:support', role: 'support' });

    const response = await reorder(jsonRequest({ ids: ['slide:one'] }));

    expect(response.status).toBe(403);
  });

  it('forbids support from updating a slide', async () => {
    mocks.getCurrentAdmin.mockResolvedValue({ id: 'admin:support', role: 'support' });

    const response = await update(jsonRequest({ active: false }), { params: Promise.resolve({ id: 'slide:one' }) });

    expect(response.status).toBe(403);
  });

  it('forbids support from deleting a slide', async () => {
    mocks.getCurrentAdmin.mockResolvedValue({ id: 'admin:support', role: 'support' });

    const response = await DELETE(new Request('http://localhost/api/admin/promotions/slide:one', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'slide:one' }),
    });

    expect(response.status).toBe(403);
  });

  it('scopes signed uploads to the validated purpose and keeps empty requests compatible', async () => {
    const promotionResponse = await uploadSignature(jsonRequest({ purpose: 'promotions' }));
    const legacyResponse = await uploadSignature(new Request('http://localhost/api/admin/upload-signature', { method: 'POST' }));

    expect(promotionResponse.status).toBe(200);
    await expect(promotionResponse.json()).resolves.toMatchObject({ folder: 'divinexpress/promotions' });
    expect(legacyResponse.status).toBe(200);
    await expect(legacyResponse.json()).resolves.toMatchObject({ folder: 'divinexpress/products' });
    expect(mocks.signUpload).toHaveBeenCalledWith(expect.objectContaining({ folder: 'divinexpress/promotions' }), 'secret');
    expect(mocks.signUpload).toHaveBeenCalledWith(expect.objectContaining({ folder: 'divinexpress/products' }), 'secret');
  });

  it('rejects an unsupported upload purpose', async () => {
    const response = await uploadSignature(jsonRequest({ purpose: 'avatars' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'INVALID_UPLOAD_PURPOSE' });
  });

  it('rejects upload purpose requests with extra fields', async () => {
    const response = await uploadSignature(jsonRequest({ purpose: 'promotions', folder: 'attacker-controlled' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'INVALID_UPLOAD_PURPOSE' });
  });
});

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/admin/promotions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
