'use client';

/* eslint-disable @next/next/no-html-link-for-pages */

import Image from 'next/image';
import { CalendarDays, Download, Package, Percent, RotateCcw, ShoppingBag, TrendingUp } from 'lucide-react';
import { useAdminDemo } from '@/context/AdminDemoContext';
import type { DashboardMetric } from '@/lib/admin/types';
import { MetricCard } from './ui/MetricCard';
import { StatusBadge, type StatusTone } from './ui/StatusBadge';
import { AdminCard } from './ui/AdminCard';
import { SalesChart } from './SalesChart';
import { CategoryDistributionChart } from './CategoryDistributionChart';

const metricIcons: Record<DashboardMetric['icon'], typeof TrendingUp> = { revenue: TrendingUp, orders: ShoppingBag, basket: Package, returns: RotateCcw };
const statusTones: Record<string, StatusTone> = { 'Payée': 'success', 'Expédiée': 'info', 'En préparation': 'warning', 'Annulée': 'danger' };

export function DashboardOverview() {
  const { state, setPeriod } = useAdminDemo();
  return (
    <div className="mx-auto max-w-[1450px] space-y-6">
      {/* Upper header segment */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-admin-muted">
            Administration &nbsp;/&nbsp; <b className="text-indigo-600">Vue d’ensemble</b>
          </p>
          <h1 className="mt-4 font-serif text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Bonjour Jean
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Voici les performances de votre boutique aujourd’hui.
          </p>
        </div>
        
        {/* Modern SaaS Filter bar & actions */}
        <div className="flex items-center gap-3">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-all cursor-pointer">
            <CalendarDays className="size-4 text-slate-400" />
            <span className="sr-only">Période</span>
            <select
              aria-label="Période"
              value={state.preferences.period}
              onChange={(e) => setPeriod(e.target.value as '7d' | '30d' | '90d')}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">90 derniers jours</option>
            </select>
          </label>
          <button className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all">
            <Download className="size-4 text-slate-400" />
            Exporter
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <section aria-label="Indicateurs" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {state.metrics.map((metric) => (
          <MetricCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            trend={metric.trend}
            positive={metric.positive}
            icon={metricIcons[metric.icon]}
          />
        ))}
      </section>

      {/* Interactive Charts Segment */}
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <AdminCard className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-slate-800">Ventes</h2>
            <div className="flex rounded-xl bg-slate-100/80 p-1 text-[11px] font-bold border border-slate-200/40">
              <button className="rounded-lg px-3 py-1.5 text-slate-500 hover:text-slate-900 transition-colors">Jour</button>
              <button className="rounded-lg px-3 py-1.5 text-slate-500 hover:text-slate-900 transition-colors">Semaine</button>
              <button className="rounded-lg bg-white px-3 py-1.5 text-slate-800 shadow-sm border border-slate-200/30">Mois</button>
            </div>
          </div>
          <SalesChart />
        </AdminCard>

        <AdminCard className="p-6 space-y-6 flex flex-col justify-between">
          <h2 className="font-serif text-lg font-bold text-slate-800">Répartition des Ventes</h2>
          <div className="flex-1 flex items-center justify-center">
            <CategoryDistributionChart />
          </div>
        </AdminCard>
      </div>

      {/* Lists / Tables Segment */}
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <AdminCard className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="font-serif text-lg font-bold text-slate-800">Commandes récentes</h2>
            <a href="/fr/commandes" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
              Voir toutes les commandes
            </a>
          </div>
          <div className="divide-y divide-slate-100">
            {state.recentOrders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[0.8fr_1.45fr_auto] items-center gap-3 p-4 text-xs sm:grid-cols-[0.8fr_1.4fr_1.2fr_0.9fr_0.7fr] hover:bg-slate-50/50 transition-colors"
              >
                <b className="text-slate-800">#{order.id}</b>
                <span>
                  <b className="block text-slate-850 text-[13px]">{order.customer}</b>
                  <small className="text-slate-500">{order.email}</small>
                </span>
                <span className="hidden sm:block text-slate-500 font-medium">{order.date}</span>
                <StatusBadge tone={statusTones[order.status]}>{order.status}</StatusBadge>
                <b className="hidden text-right sm:block font-serif text-[13px] text-slate-800">{order.total}</b>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* Stock alerts & Quick Actions */}
        <div className="grid gap-6">
          <AdminCard className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="font-serif text-base font-bold text-slate-800">Alertes Stock</h2>
              <a href="/fr/produits" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                Voir tout
              </a>
            </div>
            <div className="divide-y divide-slate-100">
              {state.stockAlerts.map((item) => (
                <div key={item.id} className="flex items-center gap-3.5 p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                    <Image src={item.image} alt="" fill className="object-contain p-1" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-xs text-slate-800 font-semibold">{item.name}</b>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">SKU: {item.sku}</span>
                  </div>
                  <b className="text-xs text-amber-600 bg-amber-50 border border-amber-100/50 rounded-full px-2 py-0.5 shrink-0">
                    {item.remaining} restants
                  </b>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard className="p-5 space-y-4">
            <h2 className="font-serif text-base font-bold text-slate-800">Actions rapides</h2>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <a
                href="/fr/produits"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 p-3 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200"
              >
                <Package className="size-4 text-slate-400" />
                Ajouter un produit
              </a>
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 p-3 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200 text-left">
                <Percent className="size-4 text-slate-400" />
                Créer une remise
              </button>
              <a
                href="/fr/retours"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 p-3 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200"
              >
                <RotateCcw className="size-4 text-slate-400" />
                Traiter un retour
              </a>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
