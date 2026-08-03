import type { HTMLAttributes } from 'react';

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<StatusTone, string> = {
  neutral: 'border-neutral-200 bg-neutral-50 text-neutral-700',
  success: 'border-green-200 bg-green-50 text-green-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
};

export function StatusBadge({ tone = 'neutral', className = '', ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: StatusTone }) {
  return <span {...props} data-tone={tone} className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${tones[tone]} ${className}`} />;
}
