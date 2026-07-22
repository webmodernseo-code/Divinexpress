'use server';

import { prisma } from '@/lib/prisma';
import { getUploadSignature, deleteCloudinaryImage } from '@/lib/cloudinary';

export async function getCloudinarySignatureAction() {
  return getUploadSignature();
}

export async function attachProductImage(
  productId: string,
  image: { url: string; publicId: string; alt: string }
): Promise<{ id: string; url: string; alt: string; position: number }> {
  const last = await prisma.productImage.findFirst({ where: { productId }, orderBy: { position: 'desc' } });
  return prisma.productImage.create({
    data: {
      productId,
      url: image.url,
      alt: image.alt,
      cloudinaryPublicId: image.publicId,
      position: (last?.position ?? -1) + 1
    },
    select: { id: true, url: true, alt: true, position: true }
  });
}

export async function removeProductImage(imageId: string): Promise<void> {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return;
  if (image.cloudinaryPublicId) {
    await deleteCloudinaryImage(image.cloudinaryPublicId);
  }
  await prisma.productImage.delete({ where: { id: imageId } });
}

export async function reorderProductImages(productId: string, orderedImageIds: string[]): Promise<void> {
  await prisma.$transaction(
    orderedImageIds.map((imageId, index) =>
      prisma.productImage.update({ where: { id: imageId, productId }, data: { position: index } })
    )
  );
}
