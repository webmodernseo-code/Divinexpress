import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: 'vestes' },
    update: {},
    create: { name: 'Vestes', slug: 'vestes' }
  });

  await prisma.product.upsert({
    where: { slug: 'veste-wax-noire' },
    update: {},
    create: {
      slug: 'veste-wax-noire',
      nameFr: 'Veste wax noire',
      nameEn: 'Black wax jacket',
      descriptionFr: 'Veste en wax premium, coupe ajustée.',
      descriptionEn: 'Premium wax jacket, fitted cut.',
      status: 'PUBLISHED',
      categoryId: category.id,
      variants: {
        create: [
          { sku: 'VWN-M-BLK', size: 'M', color: 'Noir', priceCents: 8900, stock: 12 },
          { sku: 'VWN-L-BLK', size: 'L', color: 'Noir', priceCents: 8900, stock: 8 }
        ]
      },
      images: {
        create: [{ url: '/placeholder-product.jpg', alt: 'Veste wax noire' }]
      }
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
