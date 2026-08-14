'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { mapCatalogProduct, type CatalogProductRaw, type ProductItem } from '@/components/admin/product-shared';

export default function ModifierProduitPage() {
  const { id } = useParams<{ id: string }>();
  const systemLocale = useLocale() as 'fr' | 'en';
  const fr = systemLocale === 'fr';
  const [product, setProduct] = useState<ProductItem | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/products')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load products'))))
      .then((data) => {
        if (cancelled) return;
        const raw = (data as CatalogProductRaw[]).find((p) => p.id === id);
        setProduct(raw ? mapCatalogProduct(raw) : null);
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (product === undefined) {
    return <div className="p-8 text-center text-admin-muted text-sm">{fr ? 'Chargement...' : 'Loading...'}</div>;
  }

  if (product === null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
        <AlertTriangle className="size-6 text-red-600" />
        <p className="text-sm font-semibold text-red-700">
          {fr ? 'Produit introuvable.' : 'Product not found.'}
        </p>
        <Link href="/produits" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
          {fr ? 'Retour aux produits' : 'Back to products'}
        </Link>
      </div>
    );
  }

  return <ProductForm mode="edit" product={product} />;
}
