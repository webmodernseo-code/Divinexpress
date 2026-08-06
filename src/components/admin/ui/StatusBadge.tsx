import type { HTMLAttributes } from 'react';

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<StatusTone, string> = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  success: 'border-emerald-100 bg-emerald-50/80 text-emerald-700',
  warning: 'border-amber-100 bg-amber-50/80 text-amber-800',
  danger: 'border-rose-100 bg-rose-50/80 text-rose-700',
  info: 'border-blue-100 bg-blue-50/80 text-blue-700',
};

export function StatusBadge({ tone = 'neutral', className = '', ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: StatusTone }) {
  return <span {...props} data-tone={tone} className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${tones[tone]} ${className}`} />;
}
