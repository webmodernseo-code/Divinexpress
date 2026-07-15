import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function HomePage({
  params
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);

  const t = await getTranslations('layout');

  return (
    <section style={{ padding: 'var(--space-8)' }}>
      <p>{t('brand')} — coming soon.</p>
    </section>
  );
}
