'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { ProductActionState } from '@/app/admin/(dashboard)/produits/actions';
import styles from './ProductForm.module.css';

type Category = { id: string; name: string };

type ExistingVariant = {
  id: string;
  size: string;
  color: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  sku: string;
  hasOrders: boolean;
};

type VariantRow = {
  key: string;
  id: string | null;
  size: string;
  color: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  sku: string;
  hasOrders: boolean;
};

export type ProductFormProduct = {
  id: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  categoryId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featured: boolean;
  variants: ExistingVariant[];
};

let rowKeySeed = 0;
function nextRowKey(): string {
  rowKeySeed += 1;
  return `new-${rowKeySeed}`;
}

function toRow(variant: ExistingVariant): VariantRow {
  return {
    key: variant.id,
    id: variant.id,
    size: variant.size,
    color: variant.color,
    price: (variant.priceCents / 100).toFixed(2),
    compareAtPrice: variant.compareAtPriceCents !== null ? (variant.compareAtPriceCents / 100).toFixed(2) : '',
    stock: String(variant.stock),
    sku: variant.sku,
    hasOrders: variant.hasOrders
  };
}

function emptyRow(): VariantRow {
  return {
    key: nextRowKey(),
    id: null,
    size: '',
    color: '',
    price: '',
    compareAtPrice: '',
    stock: '',
    sku: '',
    hasOrders: false
  };
}

export function ProductForm({
  mode,
  categories,
  product,
  action
}: {
  mode: 'create' | 'edit';
  categories: Category[];
  product?: ProductFormProduct;
  action: (prevState: ProductActionState, formData: FormData) => Promise<ProductActionState>;
}) {
  const [state, formAction] = useFormState(action, { error: null });
  const [rows, setRows] = useState<VariantRow[]>(
    product && product.variants.length > 0 ? product.variants.map(toRow) : [emptyRow()]
  );

  function updateRow(key: string, field: keyof VariantRow, value: string) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setRows((current) => [...current, emptyRow()]);
  }

  function removeRow(key: string) {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.key !== key) : current));
  }

  return (
    <form action={formAction} className={styles.form}>
      {state.error && <p className={styles.error}>{state.error}</p>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Informations générales</h2>
        <div className={styles.grid2}>
          <label className={styles.label}>
            Nom (FR)
            <input type="text" name="nameFr" defaultValue={product?.nameFr} required className={styles.input} />
          </label>
          <label className={styles.label}>
            Nom (EN)
            <input type="text" name="nameEn" defaultValue={product?.nameEn} required className={styles.input} />
          </label>
        </div>
        <div className={styles.grid2}>
          <label className={styles.label}>
            Description (FR)
            <textarea name="descriptionFr" defaultValue={product?.descriptionFr} required className={styles.textarea} />
          </label>
          <label className={styles.label}>
            Description (EN)
            <textarea name="descriptionEn" defaultValue={product?.descriptionEn} required className={styles.textarea} />
          </label>
        </div>
        <div className={styles.grid3}>
          <label className={styles.label}>
            Catégorie
            <select name="categoryId" defaultValue={product?.categoryId ?? ''} required className={styles.input}>
              <option value="" disabled>
                Choisir…
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Statut
            <select name="status" defaultValue={product?.status ?? 'DRAFT'} className={styles.input}>
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
              <option value="ARCHIVED">Archivé</option>
            </select>
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="featured" defaultChecked={product?.featured} />
            Mis en avant
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Variantes</h2>
        <div className={styles.variantRows}>
          {rows.map((row, index) => (
            <div key={row.key} className={styles.variantRow}>
              <input type="hidden" name={`variants[${index}][id]`} value={row.id ?? ''} />
              <input
                type="text"
                name={`variants[${index}][size]`}
                placeholder="Taille"
                value={row.size}
                onChange={(e) => updateRow(row.key, 'size', e.target.value)}
                required
                className={styles.variantInput}
              />
              <input
                type="text"
                name={`variants[${index}][color]`}
                placeholder="Couleur"
                value={row.color}
                onChange={(e) => updateRow(row.key, 'color', e.target.value)}
                required
                className={styles.variantInput}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                name={`variants[${index}][price]`}
                placeholder="Prix €"
                value={row.price}
                onChange={(e) => updateRow(row.key, 'price', e.target.value)}
                required
                className={styles.variantInput}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                name={`variants[${index}][compareAtPrice]`}
                placeholder="Prix barré €"
                value={row.compareAtPrice}
                onChange={(e) => updateRow(row.key, 'compareAtPrice', e.target.value)}
                className={styles.variantInput}
              />
              <input
                type="number"
                min="0"
                name={`variants[${index}][stock]`}
                placeholder="Stock"
                value={row.stock}
                onChange={(e) => updateRow(row.key, 'stock', e.target.value)}
                required
                className={styles.variantInput}
              />
              <input
                type="text"
                name={`variants[${index}][sku]`}
                placeholder="SKU"
                value={row.sku}
                onChange={(e) => updateRow(row.key, 'sku', e.target.value)}
                required
                className={styles.variantInput}
              />
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                disabled={row.hasOrders}
                title={
                  row.hasOrders
                    ? 'Cette variante a déjà été commandée : passez son stock à 0 au lieu de la retirer.'
                    : undefined
                }
                className={styles.removeRowButton}
              >
                {row.hasOrders ? '🔒' : '✕'}
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addRow} className={styles.addRowButton}>
          + Ajouter une variante
        </button>
      </section>

      <SubmitButton mode={mode} />
    </form>
  );
}

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={styles.submit}>
      {pending ? 'Enregistrement…' : mode === 'create' ? 'Créer le produit' : 'Enregistrer'}
    </button>
  );
}
