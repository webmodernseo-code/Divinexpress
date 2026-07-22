import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { createCategory, updateCategory, deleteCategory } from './actions';
import styles from './page.module.css';

const ERROR_MESSAGES: Record<string, string> = {
  'nom-requis': 'Merci de renseigner un nom.',
  'categorie-non-vide': 'Cette catégorie contient encore des produits — réassignez-les avant de la supprimer.'
};

export default async function AdminCategoriesPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } }
  });
  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] : undefined;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Catégories</h1>
        <Link href="/admin/produits" className={styles.backLink}>
          ← Retour aux produits
        </Link>
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <form action={createCategory} className={styles.addForm}>
        <input type="text" name="name" placeholder="Nouvelle catégorie" required className={styles.input} />
        <button type="submit" className={styles.addButton}>
          Ajouter
        </button>
      </form>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Slug</th>
              <th>Produits</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>
                  <form action={updateCategory.bind(null, category.id)} className={styles.editForm}>
                    <input type="text" name="name" defaultValue={category.name} className={styles.inlineInput} />
                    <button type="submit" className={styles.saveButton}>
                      Enregistrer
                    </button>
                  </form>
                </td>
                <td className={styles.slugCell}>{category.slug}</td>
                <td>{category._count.products}</td>
                <td>
                  <form action={deleteCategory.bind(null, category.id)}>
                    <button type="submit" className={styles.deleteButton}>
                      Supprimer
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
