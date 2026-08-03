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

export function MetricCard({ label, value, trend, icon: Icon, positive = true, comparison = 'vs 30 jours précédents' }: MetricCardProps) {
  const TrendIcon = positive ? TrendingUp : TrendingDown;
  return (
    <article className="rounded-xl border border-admin-border bg-admin-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.025)]">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-admin-border bg-admin-soft text-admin-text">
          <Icon aria-hidden className="size-6" />
        </span>
        <div>
          <p className="text-sm font-medium text-admin-text">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-admin-text">{value}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-1 font-semibold ${positive ? 'text-admin-success' : 'text-admin-danger'}`}>
          <TrendIcon aria-hidden className="size-4" />{trend}
        </span>
        <span className="text-admin-muted">{comparison}</span>
      </div>
    </article>
  );
}
