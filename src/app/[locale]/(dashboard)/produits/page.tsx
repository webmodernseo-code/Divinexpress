'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import Image from 'next/image';
import { ImageUploader } from '@/components/admin/ImageUploader';

type ProductItem = {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  categoryEn: string;
  price: number;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  image: string;
  categoryId: string;
  descriptionFr: string;
  descriptionEn: string;
  images: string[];
  variants: Array<{ id: string; size: string | null; color: string | null; stock: number }>;
};

type VariantRow = { size: string; color: string; stock: string };
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unique'];

const categoryMap: Record<string, { fr: string, en: string }> = {
  'category:homme': { fr: 'Homme', en: 'Men' },
  'category:femme': { fr: 'Femme', en: 'Women' },
  'category:enfant': { fr: 'Enfant', en: 'Kids' },
  'category:accessoires': { fr: 'Accessoires', en: 'Accessories' }
};

const getProductImage = (productId: string, category: string) => {
  if (productId.toLowerCase().includes('hoodie')) return '/image/reign-admin-hoodie.png';
  if (category.toLowerCase().includes('femme') || category.toLowerCase().includes('women')) return '/image/category_femme.png';
  if (category.toLowerCase().includes('enfant') || category.toLowerCase().includes('kids')) return '/image/category_enfant.png';
  if (category.toLowerCase().includes('accessoires') || category.toLowerCase().includes('accessories')) return '/image/category_accessoires.png';
  return '/image/category_homme.png';
};

interface CatalogProductRaw {
  id: string;
  categoryId: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  status: 'active' | 'draft' | 'archived';
  images?: string[];
  variants: Array<{
    id: string;
    size: string | null;
    color: string | null;
    priceMinor: number;
    stock: number;
  }>;
}

export default function ProduitsPage() {
  const systemLocale = useLocale() as 'fr' | 'en';
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('category:homme');
  const [formDescriptionFr, setFormDescriptionFr] = useState('');
  const [formDescriptionEn, setFormDescriptionEn] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'draft'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formCompareAt, setFormCompareAt] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formVariants, setFormVariants] = useState<VariantRow[]>([{ size: 'M', color: 'Noir', stock: '' }]);
  const [loadError, setLoadError] = useState(false);

  const refreshProducts = () => {
    fetch('/api/admin/products')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load products'))))
      .then((data) => {
        const mapped = (data as CatalogProductRaw[]).map((p) => {
          const cat = categoryMap[p.categoryId] || { fr: p.categoryId, en: p.categoryId };
          const firstVariant = p.variants?.[0];
          const price = firstVariant ? firstVariant.priceMinor / 100 : 0;
          const stock = p.variants?.reduce((acc: number, v) => acc + (v.stock || 0), 0) || 0;
          return {
            id: p.id,
            name: p.nameFr,
            nameEn: p.nameEn,
            category: cat.fr,
            categoryEn: cat.en,
            price,
            stock,
            status: p.status,
            image: p.images?.[0] ?? getProductImage(p.id, cat.fr),
            categoryId: p.categoryId,
            descriptionFr: p.descriptionFr || '',
            descriptionEn: p.descriptionEn || '',
            images: p.images ?? [],
            variants: (p.variants ?? []).map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock ?? 0 })),
          };
        });
        setProducts(mapped);
        setLoadError(false);
      })
      .catch(() => setLoadError(true));
  };

  const addVariantRow = () => setFormVariants((rows) => [...rows, { size: 'M', color: 'Noir', stock: '' }]);
  const removeVariantRow = (i: number) => setFormVariants((rows) => rows.filter((_, idx) => idx !== i));
  const updateVariantRow = (i: number, patch: Partial<VariantRow>) =>
    setFormVariants((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const adjustVariantStockApi = async (pid: string, vid: string, stock: number) => {
    const r = await fetch(`/api/admin/products/${pid}/variants/${vid}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock }),
    });
    if (!r.ok) alert(systemLocale === 'fr' ? 'Échec ajustement stock' : 'Stock update failed');
    else refreshProducts();
  };
  const deactivateVariantApi = async (pid: string, vid: string) => {
    if (!confirm(systemLocale === 'fr' ? 'Désactiver cette variante ?' : 'Deactivate this variant?')) return;
    const r = await fetch(`/api/admin/products/${pid}/variants/${vid}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: false }),
    });
    if (!r.ok) alert(systemLocale === 'fr' ? 'Échec' : 'Failed'); else refreshProducts();
  };
  const addVariantApi = async (pid: string) => {
    const size = prompt(systemLocale === 'fr' ? 'Taille (XS..XXL ou Unique)' : 'Size (XS..XXL or Unique)') ?? '';
    if (!size) return;
    const color = prompt(systemLocale === 'fr' ? 'Couleur' : 'Color') ?? 'Noir';
    const stock = parseInt(prompt(systemLocale === 'fr' ? 'Stock' : 'Stock') ?? '0') || 0;
    const r = await fetch(`/api/admin/products/${pid}/variants`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size: size === 'Unique' ? null : size, color, stock }),
    });
    if (!r.ok) alert(systemLocale === 'fr' ? 'Échec ajout variante' : 'Add failed'); else refreshProducts();
  };

  useEffect(() => {
    refreshProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusBadge = (status: ProductItem['status']) => {
    const config = {
      active: { bg: 'bg-green-50 text-[#247A52] border-green-100', label: systemLocale === 'fr' ? 'Actif' : 'Active' },
      draft: { bg: 'bg-amber-50 text-[#B76A16] border-amber-100', label: systemLocale === 'fr' ? 'Brouillon' : 'Draft' },
      archived: { bg: 'bg-neutral-50 text-neutral-600 border-neutral-200', label: systemLocale === 'fr' ? 'Archivé' : 'Archived' }
    };
    const active = config[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${active.bg}`}>
        {active.label}
      </span>
    );
  };

  const deleteProduct = async (id: string) => {
    if (confirm(systemLocale === 'fr' ? 'Supprimer ce produit ?' : 'Delete this product?')) {
      try {
        const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setProducts(products.map((p) => p.id === id ? { ...p, status: 'archived' } : p));
        } else {
          alert(systemLocale === 'fr' ? 'Échec de la suppression' : 'Deletion failed');
        }
      } catch {
        alert(systemLocale === 'fr' ? 'Erreur réseau' : 'Network error');
      }
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormNameEn('');
    setFormCategoryId('category:homme');
    setFormDescriptionFr('');
    setFormDescriptionEn('');
    setFormPrice('');
    setFormStock('');
    setFormStatus('active');
    setFormCompareAt('');
    setFormImages([]);
    setFormVariants([{ size: 'M', color: 'Noir', stock: '' }]);
    setShowModal(true);
  };

  const openEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormNameEn(product.nameEn);
    setFormCategoryId(product.categoryId);
    setFormDescriptionFr(product.descriptionFr);
    setFormDescriptionEn(product.descriptionEn);
    setFormPrice(String(product.price));
    setFormStock(String(product.stock));
    setFormStatus(product.status === 'archived' ? 'draft' : product.status);
    setFormCompareAt('');
    setFormImages(product.images);
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const priceNum = parseFloat(formPrice.replace(',', '.')) || 0;
    const stockNum = parseInt(formStock) || 0;
    const priceMinorValue = Math.round(priceNum * 100);

    const slug = (formNameEn || formName)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const payload = {
      categoryId: formCategoryId,
      nameFr: formName,
      nameEn: formNameEn || formName,
      descriptionFr: formDescriptionFr,
      descriptionEn: formDescriptionEn || formDescriptionFr,
      status: formStatus,
      priceMinor: priceMinorValue,
      stock: stockNum,
      images: formImages,
      ...(formCompareAt ? { compareAtPriceMinor: Math.round(parseFloat(formCompareAt) * 100) } : {}),
    };

    try {
      let res;
      if (editingProduct) {
        // Edit existing product
        res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new product with its variants (size / color / stock)
        const uniqueId = `prod-${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
        const sku = `DIVINEXPRESS-${slug.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const variants = formVariants.map((v, idx) => ({
          id: `var-${uniqueId}-${idx}`,
          sku: `${sku}-${(v.size || 'U')}-${idx}`,
          size: v.size === 'Unique' ? null : v.size,
          color: v.color || null,
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
          images: formImages,
          compareAtPriceMinor: formCompareAt ? Math.round(parseFloat(formCompareAt) * 100) : undefined,
          status: formStatus,
          variants,
        };

        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createPayload),
        });
      }

      if (res.ok) {
        setShowModal(false);
        refreshProducts();
      } else {
        const err = await res.json() as { error?: string };
        alert(systemLocale === 'fr' ? `Erreur: ${err.error || 'inconnue'}` : `Error: ${err.error || 'unknown'}`);
      }
    } catch {
      alert(systemLocale === 'fr' ? 'Erreur réseau' : 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
      
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in text-admin-text font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            {systemLocale === 'fr' ? 'Gestion des produits' : 'Products'}
          </h1>
          <p className="text-sm text-admin-muted mt-1.5">
            {systemLocale === 'fr' 
              ? 'Ajoutez, modifiez ou organisez vos collections de produits.' 
              : 'Add, modify, or organize your product collections.'}
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="h-[46px] px-5 bg-black text-white hover:bg-neutral-800 transition font-semibold rounded-xl text-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="size-4" />
          <span>{systemLocale === 'fr' ? 'Nouveau produit' : 'New product'}</span>
        </button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          <AlertTriangle className="size-4" />
          {systemLocale === 'fr'
            ? 'Impossible de charger les produits. Vérifiez votre connexion et réessayez.'
            : 'Failed to load products. Check your connection and retry.'}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={systemLocale === 'fr' ? 'Rechercher un produit...' : 'Search product...'}
            className="w-full h-11 pl-10 pr-4 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 text-xs text-black shadow-2xs"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-11 px-4 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 text-xs font-bold cursor-pointer text-slate-700 shadow-2xs"
          >
            <option value="all">{systemLocale === 'fr' ? 'Toutes les catégories' : 'All categories'}</option>
            <option value="Homme">{systemLocale === 'fr' ? 'Homme' : 'Men'}</option>
            <option value="Femme">{systemLocale === 'fr' ? 'Femme' : 'Women'}</option>
            <option value="Enfant">{systemLocale === 'fr' ? 'Enfant' : 'Kids'}</option>
            <option value="Accessoires">{systemLocale === 'fr' ? 'Accessoires' : 'Accessories'}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 text-xs font-bold cursor-pointer text-slate-700 shadow-2xs"
          >
            <option value="all">{systemLocale === 'fr' ? 'Tous les statuts' : 'All statuses'}</option>
            <option value="active">{systemLocale === 'fr' ? 'Actif' : 'Active'}</option>
            <option value="draft">{systemLocale === 'fr' ? 'Brouillon' : 'Draft'}</option>
            <option value="archived">{systemLocale === 'fr' ? 'Archivé' : 'Archived'}</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white border border-admin-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-admin-border bg-admin-ivory/30 text-admin-muted font-semibold">
                <th className="p-4 w-12">Image</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Nom' : 'Name'}</th>
                <th className="p-4">SKU / ID</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Catégorie' : 'Category'}</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Prix' : 'Price'}</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Stock' : 'Stock'}</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Statut' : 'Status'}</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border/50 font-medium">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50/50 transition">
                    <td className="p-4">
                      <div className="relative size-10 rounded-lg overflow-hidden bg-neutral-100 border border-admin-border">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="p-4 text-black font-semibold">
                      {systemLocale === 'fr' ? product.name : product.nameEn}
                    </td>
                    <td className="p-4 text-admin-muted font-mono">{product.id}</td>
                    <td className="p-4">{systemLocale === 'fr' ? product.category : product.categoryEn}</td>
                    <td className="p-4 text-black font-semibold">{product.price.toFixed(2)} €</td>
                    <td className="p-4">
                      {product.stock === 0 ? (
                        <span className="text-admin-error font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="size-3.5" />
                          {systemLocale === 'fr' ? 'Rupture' : 'Out of stock'}
                        </span>
                      ) : product.stock <= 5 ? (
                        <span className="text-admin-alert font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="size-3.5" />
                          {product.stock} {systemLocale === 'fr' ? 'restants' : 'left'}
                        </span>
                      ) : (
                        <span>{product.stock}</span>
                      )}
                    </td>
                    <td className="p-4">{getStatusBadge(product.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => openEditModal(product)}
                          className="p-2 text-admin-muted hover:text-black transition cursor-pointer" 
                          aria-label="Edit product"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button 
                          onClick={() => deleteProduct(product.id)} 
                          className="p-2 text-admin-muted hover:text-admin-error transition cursor-pointer" 
                          aria-label="Delete product"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-admin-muted">
                    {systemLocale === 'fr' ? 'Aucun produit trouvé' : 'No products found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay & Card */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in font-sans">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="font-serif text-xl font-bold text-slate-800">
                {editingProduct 
                  ? (systemLocale === 'fr' ? 'Modifier le produit' : 'Edit product')
                  : (systemLocale === 'fr' ? 'Ajouter un produit' : 'New product')}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-slate-50 transition cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nom FR */}
                <label className="block">
                  <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    {systemLocale === 'fr' ? 'Nom (Français)' : 'Name (French)'}
                  </span>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full h-11 px-3.5 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl outline-none transition text-xs font-semibold text-slate-800"
                  />
                </label>
                
                {/* Nom EN */}
                <label className="block">
                  <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    {systemLocale === 'fr' ? 'Nom (Anglais)' : 'Name (English)'}
                  </span>
                  <input
                    type="text"
                    required
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    className="w-full h-11 px-3.5 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl outline-none transition text-xs font-semibold text-slate-800"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Catégorie */}
                <label className="block">
                  <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    {systemLocale === 'fr' ? 'Catégorie' : 'Category'}
                  </span>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full h-11 px-3.5 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl outline-none transition text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="category:homme">{systemLocale === 'fr' ? 'Homme' : 'Men'}</option>
                    <option value="category:femme">{systemLocale === 'fr' ? 'Femme' : 'Women'}</option>
                    <option value="category:enfant">{systemLocale === 'fr' ? 'Enfant' : 'Kids'}</option>
                    <option value="category:accessoires">{systemLocale === 'fr' ? 'Accessoires' : 'Accessories'}</option>
                  </select>
                </label>

                {/* Statut */}
                <label className="block">
                  <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    {systemLocale === 'fr' ? 'Statut' : 'Status'}
                  </span>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'draft')}
                    className="w-full h-11 px-3.5 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl outline-none transition text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="active">{systemLocale === 'fr' ? 'Actif' : 'Active'}</option>
                    <option value="draft">{systemLocale === 'fr' ? 'Brouillon' : 'Draft'}</option>
                  </select>
                </label>
              </div>

              {/* Description FR */}
              <label className="block">
                <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  {systemLocale === 'fr' ? 'Description (Français)' : 'Description (French)'}
                </span>
                <textarea
                  required
                  rows={3}
                  value={formDescriptionFr}
                  onChange={(e) => setFormDescriptionFr(e.target.value)}
                  className="w-full p-3.5 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl outline-none transition text-xs font-semibold text-slate-800 resize-none"
                />
              </label>

              {/* Description EN */}
              <label className="block">
                <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  {systemLocale === 'fr' ? 'Description (Anglais)' : 'Description (English)'}
                </span>
                <textarea
                  required
                  rows={3}
                  value={formDescriptionEn}
                  onChange={(e) => setFormDescriptionEn(e.target.value)}
                  className="w-full p-3.5 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl outline-none transition text-xs font-semibold text-slate-800 resize-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                {/* Prix */}
                <label className="block">
                  <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    {systemLocale === 'fr' ? 'Prix de base (EUR)' : 'Base Price (EUR)'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full h-11 px-3.5 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl outline-none transition text-xs font-semibold text-slate-800"
                  />
                </label>

                {/* Stock global — édition seulement (la création gère le stock par variante) */}
                {editingProduct && (
                  <label className="block">
                    <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      {systemLocale === 'fr' ? 'Stock (global)' : 'Stock (global)'}
                    </span>
                    <input
                      type="number"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full h-11 px-3.5 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl outline-none transition text-xs font-semibold text-slate-800"
                    />
                  </label>
                )}
              </div>

              {/* Variantes (taille / couleur / stock) — création */}
              {!editingProduct && (
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {systemLocale === 'fr' ? 'Variantes (taille / couleur / stock)' : 'Variants (size / color / stock)'}
                  </span>
                  {formVariants.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select value={v.size} onChange={(e) => updateVariantRow(i, { size: e.target.value })} className="h-10 px-2 border border-slate-200 rounded-lg text-xs">
                        {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input value={v.color} onChange={(e) => updateVariantRow(i, { color: e.target.value })} placeholder={systemLocale === 'fr' ? 'Couleur' : 'Color'} className="h-10 px-2 border border-slate-200 rounded-lg text-xs flex-1" />
                      <input type="number" min="0" value={v.stock} onChange={(e) => updateVariantRow(i, { stock: e.target.value })} placeholder="Stock" className="h-10 px-2 border border-slate-200 rounded-lg text-xs w-24" />
                      {formVariants.length > 1 && (
                        <button type="button" onClick={() => removeVariantRow(i)} aria-label="remove" className="p-2 text-admin-muted hover:text-admin-error"><X className="size-4" /></button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addVariantRow} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    + {systemLocale === 'fr' ? 'Ajouter une variante' : 'Add a variant'}
                  </button>
                </div>
              )}

              <label className="block sm:w-1/2 sm:pr-2">
                <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  {systemLocale === 'fr' ? 'Prix initial barré (EUR)' : 'Original struck-through price (EUR)'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={formCompareAt}
                  onChange={(e) => setFormCompareAt(e.target.value)}
                  placeholder={editingProduct
                    ? (systemLocale === 'fr' ? 'Laisser vide = inchangé' : 'Leave empty = unchanged')
                    : (systemLocale === 'fr' ? 'Optionnel (promo)' : 'Optional (sale)')}
                  className="w-full h-11 px-3.5 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl outline-none transition text-xs font-semibold text-slate-800"
                />
              </label>

              <div className="block">
                <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  {systemLocale === 'fr' ? 'Images (jusqu’à 6)' : 'Images (up to 6)'}
                </span>
                <ImageUploader
                  value={formImages}
                  onChange={setFormImages}
                  labels={{
                    add: systemLocale === 'fr' ? 'Ajouter' : 'Add',
                    uploading: systemLocale === 'fr' ? 'Envoi…' : 'Uploading…',
                    remove: systemLocale === 'fr' ? 'Supprimer' : 'Remove'
                  }}
                />
              </div>

              {/* Gestion des variantes — édition */}
              {editingProduct && (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {systemLocale === 'fr' ? 'Variantes' : 'Variants'}
                  </span>
                  {editingProduct.variants.map((v) => (
                    <div key={v.id} className="flex items-center gap-2">
                      <span className="text-xs flex-1 text-slate-700 font-semibold">{v.size ?? 'Unique'} / {v.color ?? '—'}</span>
                      <input
                        type="number"
                        min="0"
                        defaultValue={v.stock}
                        onBlur={(e) => adjustVariantStockApi(editingProduct.id, v.id, parseInt(e.target.value) || 0)}
                        className="h-9 px-2 border border-slate-200 rounded-lg text-xs w-24"
                      />
                      <button type="button" onClick={() => deactivateVariantApi(editingProduct.id, v.id)} aria-label="deactivate variant" className="p-2 text-admin-muted hover:text-admin-error">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addVariantApi(editingProduct.id)} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    + {systemLocale === 'fr' ? 'Ajouter une variante' : 'Add a variant'}
                  </button>
                </div>
              )}

              {/* Modal Actions Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-11 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 transition shadow-2xs cursor-pointer"
                >
                  {systemLocale === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 px-6 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition shadow-md shadow-neutral-900/5 active:scale-[0.98] cursor-pointer disabled:bg-neutral-400"
                >
                  {isSubmitting 
                    ? (systemLocale === 'fr' ? 'Enregistrement...' : 'Saving...')
                    : (systemLocale === 'fr' ? 'Enregistrer' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
