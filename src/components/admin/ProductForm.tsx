'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { ChevronRight, Trash2, X, AlertTriangle } from 'lucide-react';
import { useRouter, Link } from '@/i18n/navigation';
import { ImageUploader } from './ImageUploader';
import { categoryMap, getProductImage, type ProductItem, type ProductVariantItem } from './product-shared';

type VariantRow = { size: string; color: string; stock: string };
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unique'];

const inputClass =
  'w-full h-11 px-3.5 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl outline-none transition text-xs font-semibold text-slate-800';
const selectClass =
  'w-full h-11 px-3.5 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl outline-none transition text-xs font-bold text-slate-700 cursor-pointer';
const labelClass = 'block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5';
const cardClass = 'bg-white border border-admin-border rounded-2xl shadow-xs p-6 space-y-5';

export function ProductForm({ mode, product }: { mode: 'create' | 'edit'; product?: ProductItem }) {
  const systemLocale = useLocale() as 'fr' | 'en';
  const fr = systemLocale === 'fr';
  const router = useRouter();
  const isEdit = mode === 'edit' && !!product;

  const [formName, setFormName] = useState(product?.name ?? '');
  const [formNameEn, setFormNameEn] = useState(product?.nameEn ?? '');
  const [formCategoryId, setFormCategoryId] = useState(product?.categoryId ?? 'category:homme');
  const [formBrand, setFormBrand] = useState(product?.brand ?? '');
  const [formDescriptionFr, setFormDescriptionFr] = useState(product?.descriptionFr ?? '');
  const [formDescriptionEn, setFormDescriptionEn] = useState(product?.descriptionEn ?? '');
  const [formPrice, setFormPrice] = useState(product ? String(product.price) : '');
  const [formStock, setFormStock] = useState(product ? String(product.stock) : '');
  const [formStatus, setFormStatus] = useState<'active' | 'draft'>(
    product && product.status !== 'archived' ? product.status : 'active'
  );
  const [formCompareAt, setFormCompareAt] = useState(product?.compareAtEur ? String(product.compareAtEur) : '');
  const [formImages, setFormImages] = useState<string[]>(product?.images ?? []);
  const [formVariants, setFormVariants] = useState<VariantRow[]>([{ size: 'M', color: 'Noir', stock: '' }]);
  const [variants, setVariants] = useState<ProductVariantItem[]>(product?.variants ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addVariantRow = () => setFormVariants((rows) => [...rows, { size: 'M', color: 'Noir', stock: '' }]);
  const removeVariantRow = (i: number) => setFormVariants((rows) => rows.filter((_, idx) => idx !== i));
  const updateVariantRow = (i: number, patch: Partial<VariantRow>) =>
    setFormVariants((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const adjustVariantStockApi = async (variantId: string, stock: number) => {
    const r = await fetch(`/api/admin/products/${product!.id}/variants/${variantId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock }),
    });
    if (!r.ok) { alert(fr ? 'Échec ajustement stock' : 'Stock update failed'); return; }
    setVariants((vs) => vs.map((v) => (v.id === variantId ? { ...v, stock } : v)));
  };
  const deactivateVariantApi = async (variantId: string) => {
    if (!confirm(fr ? 'Désactiver cette variante ?' : 'Deactivate this variant?')) return;
    const r = await fetch(`/api/admin/products/${product!.id}/variants/${variantId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: false }),
    });
    if (!r.ok) { alert(fr ? 'Échec' : 'Failed'); return; }
    setVariants((vs) => vs.filter((v) => v.id !== variantId));
  };
  const addVariantApi = async () => {
    const size = prompt(fr ? 'Taille (XS..XXL ou Unique)' : 'Size (XS..XXL or Unique)') ?? '';
    if (!size) return;
    const color = (prompt(fr ? 'Couleur' : 'Color') || 'Noir').trim() || 'Noir';
    const stock = parseInt(prompt(fr ? 'Stock' : 'Stock') ?? '0') || 0;
    const r = await fetch(`/api/admin/products/${product!.id}/variants`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size: size || 'Unique', color, stock }),
    });
    if (!r.ok) { alert(fr ? 'Échec ajout variante' : 'Add failed'); return; }
    const data = (await r.json()) as { id: string };
    setVariants((vs) => [...vs, { id: data.id, size, color, stock }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const priceNum = parseFloat(formPrice.replace(',', '.')) || 0;
    const stockNum = parseInt(formStock) || 0;
    const priceMinorValue = Math.round(priceNum * 100);

    const slug = (formNameEn || formName)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    try {
      let res: Response;
      if (isEdit) {
        const payload = {
          categoryId: formCategoryId,
          nameFr: formName,
          nameEn: formNameEn || formName,
          descriptionFr: formDescriptionFr,
          descriptionEn: formDescriptionEn || formDescriptionFr,
          status: formStatus,
          brand: formBrand.trim() || null,
          priceMinor: priceMinorValue,
          stock: stockNum,
          images: formImages,
          compareAtPriceMinor: formCompareAt ? Math.round(parseFloat(formCompareAt) * 100) : undefined,
        };
        res = await fetch(`/api/admin/products/${product!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        const uniqueId = `prod-${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
        const sku = `DIVINEXPRESS-${slug.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const createVariants = formVariants.map((v, idx) => ({
          id: `var-${uniqueId}-${idx}`,
          sku: `${sku}-${(v.size || 'U')}-${idx}`,
          size: v.size || 'Unique',
          color: v.color.trim() || 'Noir',
          priceMinor: priceMinorValue,
          currency: 'EUR' as const,
          stock: parseInt(v.stock) || 0,
        }));

        const createPayload = {
          id: uniqueId,
          categoryId: formCategoryId,
          slug,
          nameFr: formName,
          nameEn: formNameEn || formName,
          descriptionFr: formDescriptionFr,
          descriptionEn: formDescriptionEn || formDescriptionFr,
          brand: formBrand.trim() || null,
          images: formImages,
          compareAtPriceMinor: formCompareAt ? Math.round(parseFloat(formCompareAt) * 100) : undefined,
          status: formStatus,
          variants: createVariants,
        };

        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createPayload),
        });
      }

      if (res.ok) {
        router.push('/produits');
      } else {
        const err = (await res.json()) as { error?: string };
        alert(fr ? `Erreur: ${err.error || 'inconnue'}` : `Error: ${err.error || 'unknown'}`);
      }
    } catch {
      alert(fr ? 'Erreur réseau' : 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Live preview derived state ---
  const previewCategory = categoryMap[formCategoryId] ?? { fr: formCategoryId, en: formCategoryId };
  const previewSizes = isEdit
    ? Array.from(new Set(variants.map((v) => v.size).filter((s): s is string => Boolean(s))))
    : Array.from(new Set(formVariants.map((v) => v.size).filter(Boolean)));
  const previewColors = isEdit
    ? Array.from(new Set(variants.map((v) => v.color).filter((c): c is string => Boolean(c))))
    : Array.from(new Set(formVariants.map((v) => v.color.trim()).filter(Boolean)));
  const previewStock = isEdit
    ? variants.reduce((total, v) => total + (v.stock || 0), 0)
    : formVariants.reduce((total, v) => total + (parseInt(v.stock) || 0), 0);
  const previewPrice = parseFloat(formPrice.replace(',', '.')) || 0;
  const previewCompareAt = parseFloat(formCompareAt.replace(',', '.')) || 0;
  const previewName = (fr ? formName : formNameEn) || (fr ? 'Nom du produit' : 'Product name');
  const previewImage = formImages[0] ?? getProductImage(product?.id ?? '', previewCategory.fr);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in text-admin-text font-sans pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-admin-muted">
        <Link href="/produits" className="hover:text-black transition">
          {fr ? 'Produits' : 'Products'}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-black">
          {isEdit ? (fr ? 'Modifier le produit' : 'Edit product') : (fr ? 'Ajouter un produit' : 'Add a product')}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            {isEdit ? (fr ? 'Modifier le produit' : 'Edit product') : (fr ? 'Ajouter un produit' : 'Add a product')}
          </h1>
          <p className="text-sm text-admin-muted mt-1.5">
            {isEdit
              ? (fr ? 'Modifiez les informations de ce produit.' : 'Update this product’s information.')
              : (fr
                  ? 'Remplissez les informations ci-dessous pour ajouter un nouveau produit à votre boutique.'
                  : 'Fill in the information below to add a new product to your store.')}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => router.push('/produits')}
            className="h-11 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 transition shadow-2xs cursor-pointer"
          >
            {fr ? 'Annuler' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 px-6 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition shadow-md shadow-neutral-900/5 active:scale-[0.98] cursor-pointer disabled:bg-neutral-400"
          >
            {isSubmitting
              ? (fr ? 'Enregistrement...' : 'Saving...')
              : (fr ? 'Enregistrer le produit' : 'Save product')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <div className={cardClass}>
            <h2 className="font-serif text-lg font-bold text-slate-800">
              {fr ? 'Informations générales' : 'General information'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className={labelClass}>{fr ? 'Nom du produit (Français)' : 'Product name (French)'}</span>
                <input
                  type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                  placeholder={fr ? 'Ex : Hoodie Essentials' : 'E.g. Hoodie Essentials'}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>{fr ? 'Nom du produit (Anglais)' : 'Product name (English)'}</span>
                <input
                  type="text" required value={formNameEn} onChange={(e) => setFormNameEn(e.target.value)}
                  placeholder="E.g. Hoodie Essentials"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className={labelClass}>{fr ? 'Description (Français)' : 'Description (French)'}</span>
                <textarea
                  required rows={4} value={formDescriptionFr} onChange={(e) => setFormDescriptionFr(e.target.value)}
                  placeholder={fr ? 'Décrivez votre produit en détail...' : 'Describe your product in detail...'}
                  className="w-full p-3.5 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl outline-none transition text-xs font-semibold text-slate-800 resize-none"
                />
              </label>
              <label className="block">
                <span className={labelClass}>{fr ? 'Description (Anglais)' : 'Description (English)'}</span>
                <textarea
                  required rows={4} value={formDescriptionEn} onChange={(e) => setFormDescriptionEn(e.target.value)}
                  placeholder="Describe your product in detail..."
                  className="w-full p-3.5 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl outline-none transition text-xs font-semibold text-slate-800 resize-none"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="block">
                <span className={labelClass}>{fr ? 'Catégorie' : 'Category'}</span>
                <select value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)} className={selectClass}>
                  <option value="category:homme">{fr ? 'Homme' : 'Men'}</option>
                  <option value="category:femme">{fr ? 'Femme' : 'Women'}</option>
                  <option value="category:enfant">{fr ? 'Enfant' : 'Kids'}</option>
                  <option value="category:accessoires">{fr ? 'Accessoires' : 'Accessories'}</option>
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>{fr ? 'Marque' : 'Brand'}</span>
                <input
                  type="text" value={formBrand} onChange={(e) => setFormBrand(e.target.value)}
                  placeholder="Ex : DivinExpress" className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>{fr ? 'Statut' : 'Status'}</span>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as 'active' | 'draft')} className={selectClass}>
                  <option value="active">{fr ? 'Actif' : 'Active'}</option>
                  <option value="draft">{fr ? 'Brouillon' : 'Draft'}</option>
                </select>
              </label>
            </div>

            {/* Sizes / colors / stock */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <span className={labelClass}>{fr ? 'Tailles, couleurs et stock' : 'Sizes, colors and stock'}</span>

              {!isEdit && (
                <div className="space-y-2">
                  {formVariants.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select value={v.size} onChange={(e) => updateVariantRow(i, { size: e.target.value })} className="h-10 px-2 border border-slate-200 rounded-lg text-xs">
                        {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input
                        value={v.color} onChange={(e) => updateVariantRow(i, { color: e.target.value })}
                        placeholder={fr ? 'Couleur' : 'Color'} className="h-10 px-2 border border-slate-200 rounded-lg text-xs flex-1"
                      />
                      <input
                        type="number" min="0" value={v.stock} onChange={(e) => updateVariantRow(i, { stock: e.target.value })}
                        placeholder="Stock" className="h-10 px-2 border border-slate-200 rounded-lg text-xs w-24"
                      />
                      {formVariants.length > 1 && (
                        <button type="button" onClick={() => removeVariantRow(i)} aria-label="remove" className="p-2 text-admin-muted hover:text-admin-error">
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addVariantRow} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    + {fr ? 'Ajouter une variante' : 'Add a variant'}
                  </button>
                </div>
              )}

              {isEdit && (
                <div className="space-y-2">
                  {variants.map((v) => (
                    <div key={v.id} className="flex items-center gap-2">
                      <span className="text-xs flex-1 text-slate-700 font-semibold">{v.size ?? 'Unique'} / {v.color ?? '—'}</span>
                      <input
                        type="number" min="0" defaultValue={v.stock}
                        onBlur={(e) => adjustVariantStockApi(v.id, parseInt(e.target.value) || 0)}
                        className="h-9 px-2 border border-slate-200 rounded-lg text-xs w-24"
                      />
                      <button type="button" onClick={() => deactivateVariantApi(v.id)} aria-label="deactivate variant" className="p-2 text-admin-muted hover:text-admin-error">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addVariantApi} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    + {fr ? 'Ajouter une variante' : 'Add a variant'}
                  </button>

                  <label className="block pt-2">
                    <span className={labelClass}>{fr ? 'Stock (global)' : 'Stock (overall)'}</span>
                    <input
                      type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)}
                      className={`${inputClass} sm:w-1/2`}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Prix */}
          <div className={cardClass}>
            <h2 className="font-serif text-lg font-bold text-slate-800">{fr ? 'Prix' : 'Price'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className={labelClass}>{fr ? 'Ancien prix (barré)' : 'Old price (struck-through)'}</span>
                <input
                  type="number" step="0.01" value={formCompareAt} onChange={(e) => setFormCompareAt(e.target.value)}
                  placeholder="Ex : 59.99" className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>{fr ? 'Nouveau prix (actuel)' : 'New price (current)'}</span>
                <input
                  type="number" step="0.01" required value={formPrice} onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="Ex : 39.99" className={inputClass}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className={cardClass}>
            <div>
              <h2 className="font-serif text-lg font-bold text-slate-800">{fr ? 'Images du produit' : 'Product images'}</h2>
              <p className="text-xs text-admin-muted mt-1">
                {fr ? 'Ajoutez plusieurs images pour présenter votre produit.' : 'Add several images to showcase your product.'}
              </p>
            </div>
            <ImageUploader
              value={formImages}
              onChange={setFormImages}
              labels={{
                add: fr ? 'Cliquez pour uploader' : 'Click to upload',
                more: fr ? "Ajouter d'autres images" : 'Add more images',
                hint: fr ? 'ou glissez-déposez vos images ici' : 'or drag and drop your images here',
                sizeHint: fr ? "PNG, JPG, WEBP jusqu'à 5MB" : 'PNG, JPG, WEBP up to 5MB',
                uploading: fr ? 'Envoi…' : 'Uploading…',
                remove: fr ? 'Supprimer' : 'Remove',
                error: fr ? "Échec de l'envoi. Réessayez." : 'Upload failed. Try again.',
              }}
            />
          </div>

          <div className={cardClass}>
            <h2 className="font-serif text-lg font-bold text-slate-800">{fr ? 'Aperçu' : 'Preview'}</h2>
            <div className="rounded-xl border border-admin-border overflow-hidden">
              <div className="relative aspect-square bg-neutral-100">
                <Image src={previewImage} alt={previewName} fill className="object-cover" />
              </div>
              <div className="p-3.5 space-y-1.5">
                <p className="text-sm font-bold text-slate-800 truncate">{previewName}</p>
                <div className="flex items-center gap-2">
                  {previewCompareAt > previewPrice && (
                    <span className="text-xs text-slate-400 line-through">{previewCompareAt.toFixed(2)} €</span>
                  )}
                  <span className={`text-sm font-bold ${previewCompareAt > previewPrice ? 'text-amber-600' : 'text-slate-800'}`}>
                    {previewPrice.toFixed(2)} €
                  </span>
                </div>
                <p className="text-xs text-admin-muted truncate">
                  {previewColors.length > 0 ? previewColors.join(', ') : (fr ? 'Couleur' : 'Color')}
                  {' • '}
                  {previewSizes.length > 0 ? previewSizes.join(', ') : (fr ? 'Taille' : 'Size')}
                </p>
                {previewStock === 0 ? (
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-admin-error">
                    <AlertTriangle className="size-3.5" /> {fr ? 'Rupture de stock' : 'Out of stock'}
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-[#247A52]">
                    <span className="size-1.5 rounded-full bg-[#247A52]" />
                    {fr ? `En stock (${previewStock})` : `In stock (${previewStock})`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-4">
        <p className="text-xs font-semibold text-amber-800">
          {fr
            ? 'Une fois enregistré, ce produit sera visible sur votre boutique en ligne.'
            : 'Once saved, this product will be visible on your online store.'}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/produits')}
            className="h-11 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 transition shadow-2xs cursor-pointer"
          >
            {fr ? 'Annuler' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 px-6 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition shadow-md shadow-neutral-900/5 active:scale-[0.98] cursor-pointer disabled:bg-neutral-400"
          >
            {isSubmitting
              ? (fr ? 'Enregistrement...' : 'Saving...')
              : (fr ? 'Enregistrer le produit' : 'Save product')}
          </button>
        </div>
      </div>
    </form>
  );
}
