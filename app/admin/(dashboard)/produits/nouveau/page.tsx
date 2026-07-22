import { prisma } from '@/lib/prisma';
import { createProduct } from '../actions';
import { ProductForm } from '@/components/Admin/ProductForm';
import styles from '../page.module.css';

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

  return (
    <div>
      <h1 className={styles.title}>Nouveau produit</h1>
      <ProductForm mode="create" categories={categories} action={createProduct} />
    </div>
  );
}
