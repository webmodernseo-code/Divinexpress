'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { 
  Search, 
  Plus, 
  Eye, 
  Trash2, 
  AlertTriangle
} from 'lucide-react';
import Image from 'next/image';

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
};

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

const INITIAL_PRODUCTS: ProductItem[] = [
  { id: 'fleece-hoodie-black', name: 'Sweat à capuche Fleece', nameEn: 'Fleece hoodie', category: 'Homme', categoryEn: 'Men', price: 68.00, stock: 2, status: 'active', image: '/image/reign-admin-hoodie.png' }
];

interface CatalogProductRaw {
  id: string;
  categoryId: string;
  nameFr: string;
  nameEn: string;
  status: 'active' | 'draft' | 'archived';
  variants: Array<{
    priceMinor: number;
    stock: number;
  }>;
}

export default function ProduitsPage() {
  const systemLocale = useLocale() as 'fr' | 'en';
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
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
            image: getProductImage(p.id, cat.fr),
          };
        });
        setProducts(mapped);
      })
      .catch(() => undefined);
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
        <button className="h-[46px] px-5 bg-black text-white hover:bg-neutral-800 transition font-semibold rounded-xl text-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer">
          <Plus className="size-4" />
          <span>{systemLocale === 'fr' ? 'Nouveau produit' : 'New product'}</span>
        </button>
      </div>

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
          {/* Category Filter */}
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

          {/* Status Filter */}
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
                        <button className="p-2 text-admin-muted hover:text-black transition" aria-label="Edit product">
                          <Eye className="size-4" />
                        </button>
                        <button 
                          onClick={() => deleteProduct(product.id)} 
                          className="p-2 text-admin-muted hover:text-admin-error transition" 
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

    </div>
  );
}
