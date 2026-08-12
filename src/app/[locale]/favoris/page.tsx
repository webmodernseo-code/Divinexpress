'use client';

import { useTranslations } from 'next-intl';
import { useFavorites } from '@/context/FavoritesContext';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { ProductCard } from '@/components/product/ProductCard';

export default function FavoritesPage() {
  const t = useTranslations('favorites');
  const { favorites: products } = useFavorites();

  return (
    <Container className="py-10 md:py-14">
      <Heading level={1}>{t('title')}</Heading>

      {products.length === 0 ? (
        <p className="mt-12 text-center text-sm text-mist-500">{t('empty')}</p>
      ) : (
        <div className="mt-7 grid grid-cols-2 gap-5 md:mt-10 md:grid-cols-4 md:gap-7">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </Container>
  );
}
