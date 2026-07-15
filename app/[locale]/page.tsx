'use client';

import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('layout');

  return (
    <section style={{ padding: 'var(--space-8)' }}>
      <p>{t('brand')} — coming soon.</p>
    </section>
  );
}
