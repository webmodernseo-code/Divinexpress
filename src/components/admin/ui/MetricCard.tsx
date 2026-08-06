import type { ComponentType } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  trend: string;
  icon: ComponentType<{ className?: string }>;
  positive?: boolean;
  comparison?: string;
}

function getMetricTheme(label: string) {
  const norm = label.toLowerCase();
  if (norm.includes('chiffre') || norm.includes('revenue')) {
    return 'bg-indigo-50 border-indigo-100 text-indigo-600';
  }
  if (norm.includes('commande') || norm.includes('order')) {
    return 'bg-emerald-50 border-emerald-100 text-emerald-600';
  }
  if (norm.includes('panier') || norm.includes('basket')) {
    return 'bg-amber-50 border-amber-100 text-amber-600';
  }
  if (norm.includes('retour') || norm.includes('return')) {
    return 'bg-rose-50 border-rose-100 text-rose-600';
  }
  return 'bg-slate-50 border-slate-100 text-slate-600';
}

export function MetricCard({ label, value, trend, icon: Icon, positive = true, comparison = 'vs 30 jours précédents' }: MetricCardProps) {
  const TrendIcon = positive ? TrendingUp : TrendingDown;
  const themeClass = getMetricTheme(label);
  return (
    <article className="rounded-2xl border border-admin-border bg-admin-surface p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-admin-muted">{label}</p>
          <p className="mt-2 font-serif text-3xl font-bold tracking-tight text-admin-text">{value}</p>
        </div>
        <span className={`grid size-12 shrink-0 place-items-center rounded-xl border ${themeClass}`}>
          <Icon aria-hidden className="size-5" />
        </span>
      </div>
      <div className="mt-5 flex items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full px-2 py-0.5 ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          <TrendIcon aria-hidden className="size-3.5" />{trend}
        </span>
        <span className="text-admin-muted">{comparison}</span>
      </div>
    </article>
  );
}
