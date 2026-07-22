import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import type { ProductStatus } from '@prisma/client';
import { totalStock, priceRange } from '@/lib/productDisplay';
import { formatEURCents } from '@/lib/adminStats';
import { parsePage, pageHref } from '@/lib/adminPagination';
import { setProductStatus, deleteProduct } from './actions';
import styles from './page.module.css';

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  ARCHIVED: 'Archivé'
};

const ERROR_MESSAGES: Record<string, string> = {
  'commandes-existantes': 'Ce produit a déjà été commandé — archivez-le plutôt que de le supprimer.'
};

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const urlSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((v) => urlSearchParams.append(key, v));
    } else if (value !== undefined) {
      urlSearchParams.append(key, value);
    }
  }

  const page = parsePage(urlSearchParams);
  const q = (urlSearchParams.get('q') ?? '').trim();
  const categoryId = urlSearchParams.get('categorie') ?? '';
  const status = urlSearchParams.get('statut') ?? '';
  const errorParam = urlSearchParams.get('error') ?? undefined;

  const where = {
    ...(q ? { nameFr: { contains: q, mode: 'insensitive' as const } } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status: status as ProductStatus } : {})
  };

  const [products, totalCount, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { variants: true, images: { orderBy: { position: 'asc' }, take: 1 }, category: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: 'asc' } })
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const errorMessage = errorParam ? ERROR_MESSAGES[errorParam] : undefined;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Produits</h1>
        <div className={styles.headerActions}>
          <Link href="/admin/produits/categories" className={styles.secondaryButton}>
            Catégories
          </Link>
          <Link href="/admin/produits/nouveau" className={styles.primaryButton}>
            Ajouter un produit
          </Link>
        </div>
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <form method="get" className={styles.filterBar}>
        <input type="text" name="q" placeholder="Rechercher un produit" defaultValue={q} className={styles.input} />
        <select name="categorie" defaultValue={categoryId} className={styles.select}>
          <option value="">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select name="statut" defaultValue={status} className={styles.select}>
          <option value="">Tous les statuts</option>
          <option value="DRAFT">Brouillon</option>
          <option value="PUBLISHED">Publié</option>
          <option value="ARCHIVED">Archivé</option>
        </select>
        <button type="submit" className={styles.filterButton}>
          Filtrer
        </button>
      </form>

      <div className={styles.tableCard}>
        {products.length === 0 ? (
          <p className={styles.empty}>Aucun produit ne correspond à ces critères.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Statut</th>
                <th>Stock</th>
                <th>Prix</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const range = priceRange(product.variants);
                return (
                  <tr key={product.id}>
                    <td>
                      <img
                        src={product.images[0]?.url ?? '/placeholder-product.svg'}
                        alt={product.images[0]?.alt ?? product.nameFr}
                        className={styles.thumbnail}
                      />
                    </td>
                    <td>{product.nameFr}</td>
                    <td>{product.category.name}</td>
                    <td>
                      <span className={styles.statusBadge}>{STATUS_LABELS[product.status]}</span>
                    </td>
                    <td>{totalStock(product.variants)}</td>
                    <td>
                      {range
                        ? range.minCents === range.maxCents
                          ? formatEURCents(range.minCents)
                          : `${formatEURCents(range.minCents)} – ${formatEURCents(range.maxCents)}`
                        : '—'}
                    </td>
                    <td className={styles.actions}>
                      <Link href={`/admin/produits/${product.id}`} className={styles.actionLink}>
                        Éditer
                      </Link>
                      <form
                        action={setProductStatus.bind(
                          null,
                          product.id,
                          product.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED'
                        )}
                      >
                        <button type="submit" className={styles.actionButton}>
                          {product.status === 'PUBLISHED' ? 'Archiver' : 'Publier'}
                        </button>
                      </form>
                      <form action={deleteProduct.bind(null, product.id)}>
                        <button type="submit" className={styles.actionButtonDanger}>
                          Supprimer
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <Link
              key={pageNumber}
              href={pageHref(urlSearchParams, pageNumber)}
              className={pageNumber === page ? styles.pageActive : styles.pageLink}
            >
              {pageNumber}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
