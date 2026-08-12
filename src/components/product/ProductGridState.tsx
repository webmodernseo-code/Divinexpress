import type { Product } from '@/lib/products';
import { ProductCard } from './ProductCard';

export function ProductGridState({
  products,
  emptyTitle,
  emptyBody,
}: {
  products: Product[];
  emptyTitle: string;
  emptyBody: string;
}) {
  if (products.length === 0) {
    return (
      <div className="mt-12 text-center">
        <h2 className="font-serif text-xl text-ink">{emptyTitle}</h2>
        <p className="mt-2 text-sm text-mist-500">{emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="mt-7 grid grid-cols-2 gap-5 md:mt-10 md:grid-cols-4 md:gap-7">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
