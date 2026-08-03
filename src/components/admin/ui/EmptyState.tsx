import type { ComponentType } from 'react';

export function EmptyState({ icon: Icon, title, description }: { icon: ComponentType<{ className?: string }>; title: string; description: string }) {
  return <div className="grid min-h-56 place-items-center p-8 text-center"><div><Icon aria-hidden className="mx-auto size-8 text-admin-muted" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-1 text-sm text-admin-muted">{description}</p></div></div>;
}
