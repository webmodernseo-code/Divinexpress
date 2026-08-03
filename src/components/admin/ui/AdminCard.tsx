import type { HTMLAttributes } from 'react';

export function AdminCard({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`rounded-xl border border-admin-border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.025)] ${className}`} />;
}
