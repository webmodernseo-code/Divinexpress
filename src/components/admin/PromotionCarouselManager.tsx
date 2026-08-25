'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

type Locale = 'fr' | 'en';

type PromotionSlide = {
  id: string;
  imageUrl: string;
  productId: string;
  productSlug: string;
  productNameFr: string;
  productNameEn: string;
  position: number;
  active: boolean;
};

type CatalogProduct = {
  id: string;
  nameFr: string;
  nameEn: string;
  status: 'active' | 'draft' | 'archived';
};

const copy = {
  fr: {
    title: 'Carrousel promotionnel', description: 'Mettez en avant vos produits dans le carrousel de la boutique.',
    image: 'Image de la promotion', product: 'Produit associé', chooseProduct: 'Choisissez un produit actif',
    create: 'Créer la promotion', update: 'Enregistrer les modifications', cancel: 'Annuler', edit: 'Modifier',
    activate: 'Activer', deactivate: 'Désactiver', active: 'Active', inactive: 'Inactive',
    up: 'Monter', down: 'Descendre', delete: 'Supprimer', loading: 'Chargement des promotions…',
    empty: 'Aucune promotion n’est configurée.', saving: 'Enregistrement…',
    created: 'Promotion enregistrée.', updated: 'Promotion mise à jour.', reordered: 'Ordre mis à jour.',
    deleted: 'Promotion supprimée.', imageRequired: 'Ajoutez une image et choisissez un produit actif.',
    productRequired: 'Choisissez un produit actif.', failed: 'Une erreur est survenue. Réessayez.',
    confirmDelete: 'Supprimer cette promotion ?', upload: 'Téléverser une image', uploading: 'Envoi…', remove: 'Supprimer l’image',
  },
  en: {
    title: 'Promotional carousel', description: 'Feature products in the storefront carousel.',
    image: 'Promotion image', product: 'Linked product', chooseProduct: 'Choose an active product',
    create: 'Create promotion', update: 'Save changes', cancel: 'Cancel', edit: 'Edit',
    activate: 'Activate', deactivate: 'Deactivate', active: 'Active', inactive: 'Inactive',
    up: 'Move up', down: 'Move down', delete: 'Delete', loading: 'Loading promotions…',
    empty: 'No promotions are configured.', saving: 'Saving…',
    created: 'Promotion saved.', updated: 'Promotion updated.', reordered: 'Order updated.',
    deleted: 'Promotion deleted.', imageRequired: 'Add an image and choose an active product.',
    productRequired: 'Choose an active product.', failed: 'Something went wrong. Try again.',
    confirmDelete: 'Delete this promotion?', upload: 'Upload an image', uploading: 'Uploading…', remove: 'Remove image',
  },
} as const;

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error('request failed');
  return response.json() as Promise<T>;
}

export function PromotionCarouselManager() {
  const locale = (useLocale() === 'en' ? 'en' : 'fr') as Locale;
  const t = copy[locale];
  const [slides, setSlides] = useState<PromotionSlide[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [productId, setProductId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeProducts = useMemo(() => products.filter((product) => product.status === 'active'), [products]);
  const orderedSlides = useMemo(
    () => [...slides].sort((left, right) => left.position - right.position),
    [slides],
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      requestJson<PromotionSlide[]>('/api/admin/promotions'),
      requestJson<CatalogProduct[]>('/api/admin/products'),
    ]).then(([nextSlides, nextProducts]) => {
      if (cancelled) return;
      setSlides(nextSlides);
      setProducts(nextProducts);
    }).catch(() => {
      if (!cancelled) setError(t.failed);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [t.failed]);

  function resetForm() {
    setImageUrls([]);
    setProductId('');
    setEditingId(null);
  }

  function startEdit(slide: PromotionSlide) {
    setImageUrls([slide.imageUrl]);
    setProductId(slide.productId);
    setEditingId(slide.id);
    setError(null);
    setSuccess(null);
  }

  async function save() {
    setError(null);
    setSuccess(null);
    if (imageUrls.length === 0) {
      setError(t.imageRequired);
      return;
    }
    if (!productId) {
      setError(t.productRequired);
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const current = slides.find((slide) => slide.id === editingId);
        const updated = await requestJson<PromotionSlide>(`/api/admin/promotions/${editingId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: imageUrls[0], productId, active: current?.active ?? true }),
        });
        setSlides((currentSlides) => currentSlides.map((slide) => slide.id === updated.id ? updated : slide));
        setSuccess(t.updated);
      } else {
        const nextPosition = orderedSlides.reduce((highest, slide) => Math.max(highest, slide.position), -1) + 1;
        const created = await requestJson<PromotionSlide>('/api/admin/promotions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: imageUrls[0], productId, position: nextPosition, active: true }),
        });
        setSlides((currentSlides) => [...currentSlides, created]);
        setSuccess(t.created);
      }
      resetForm();
    } catch {
      setError(t.failed);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(slide: PromotionSlide) {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const updated = await requestJson<PromotionSlide>(`/api/admin/promotions/${slide.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !slide.active }),
      });
      setSlides((currentSlides) => currentSlides.map((current) => current.id === updated.id ? updated : current));
      setSuccess(t.updated);
    } catch {
      setError(t.failed);
    } finally {
      setSaving(false);
    }
  }

  async function move(fromIndex: number, direction: -1 | 1) {
    const destination = fromIndex + direction;
    if (destination < 0 || destination >= orderedSlides.length) return;
    const next = [...orderedSlides];
    [next[fromIndex], next[destination]] = [next[destination], next[fromIndex]];
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await requestJson<{ ok: true }>('/api/admin/promotions', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: next.map((slide) => slide.id) }),
      });
      setSlides(next.map((slide, position) => ({ ...slide, position })));
      setSuccess(t.reordered);
    } catch {
      setError(t.failed);
    } finally {
      setSaving(false);
    }
  }

  async function remove(slide: PromotionSlide) {
    if (!window.confirm(t.confirmDelete)) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/promotions/${slide.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('request failed');
      setSlides((currentSlides) => currentSlides.filter((current) => current.id !== slide.id));
      if (editingId === slide.id) resetForm();
      setSuccess(t.deleted);
    } catch {
      setError(t.failed);
    } finally {
      setSaving(false);
    }
  }

  const productName = (product: CatalogProduct) => locale === 'fr' ? product.nameFr : product.nameEn;
  const slideName = (slide: PromotionSlide) => locale === 'fr' ? slide.productNameFr : slide.productNameEn;

  return (
    <section aria-labelledby="promotion-carousel-title" className="rounded-2xl border border-admin-border bg-white p-5 shadow-xs sm:p-6">
      <div className="mb-5">
        <h2 id="promotion-carousel-title" className="font-serif text-lg font-bold text-slate-800">{t.title}</h2>
        <p className="mt-1 text-xs text-admin-muted">{t.description}</p>
      </div>

      {loading ? <p role="status" className="text-sm text-admin-muted">{t.loading}</p> : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            {orderedSlides.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-admin-muted">{t.empty}</p> : orderedSlides.map((slide, index) => (
              <article key={slide.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-3 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.imageUrl} alt="" className="h-20 w-full rounded-2xl object-cover sm:w-28" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{slideName(slide)}</p>
                  <p className={`mt-1 text-xs font-semibold ${slide.active ? 'text-emerald-700' : 'text-slate-500'}`}>{slide.active ? t.active : t.inactive}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={saving} onClick={() => move(index, -1)} aria-label={`${t.up} ${slideName(slide)} ${index + 1}`} className="rounded-lg border border-slate-200 p-2 disabled:opacity-50"><ArrowUp className="size-4" /></button>
                  <button type="button" disabled={saving} onClick={() => move(index, 1)} aria-label={`${t.down} ${slideName(slide)} ${index + 1}`} className="rounded-lg border border-slate-200 p-2 disabled:opacity-50"><ArrowDown className="size-4" /></button>
                  <button type="button" disabled={saving} onClick={() => startEdit(slide)} aria-label={`${t.edit} ${slideName(slide)}`} className="rounded-lg border border-slate-200 p-2 disabled:opacity-50"><Pencil className="size-4" /></button>
                  <button type="button" disabled={saving} onClick={() => toggle(slide)} className="rounded-lg border border-slate-200 px-2.5 text-xs font-bold disabled:opacity-50">{slide.active ? t.deactivate : t.activate}</button>
                  <button type="button" disabled={saving} onClick={() => remove(slide)} aria-label={`${t.delete} ${slideName(slide)}`} className="rounded-lg border border-red-100 p-2 text-red-600 disabled:opacity-50"><Trash2 className="size-4" /></button>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">{t.image}</p>
                <ImageUploader value={imageUrls} max={1} onChange={setImageUrls} purpose="promotions" labels={{ add: t.upload, uploading: t.uploading, remove: t.remove, error: t.failed }} />
                {imageUrls[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrls[0]} alt={locale === 'fr' ? 'Aperçu de la promotion' : 'Promotion preview'} className="mt-3 aspect-[16/9] w-full rounded-2xl object-cover" />
                )}
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">{t.product}</span>
                <select aria-label={t.product} value={productId} onChange={(event) => setProductId(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800">
                  <option value="">{t.chooseProduct}</option>
                  {activeProducts.map((product) => <option key={product.id} value={product.id}>{productName(product)}</option>)}
                </select>
              </label>
              {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
              {success && <p role="status" className="text-sm font-medium text-emerald-700">{success}</p>}
              <div className="flex gap-2">
                <button type="button" disabled={saving} onClick={save} className="rounded-xl bg-black px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{saving ? t.saving : editingId ? t.update : t.create}</button>
                {editingId && <button type="button" disabled={saving} onClick={resetForm} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700">{t.cancel}</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
