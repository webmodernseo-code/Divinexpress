import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';

const CATEGORIES = ['homme', 'femme', 'running', 'sale'] as const;

export default async function HomePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations('home');
  const tHeader = await getTranslations('header');

  return (
    <>
      <h1>{t('heroTitle')}</h1>
      <p>{t('heroSubtitle')}</p>
      <ul>
        {CATEGORIES.map((slug) => (
          <li key={slug}>
            <Link href={`/${slug}`} locale={locale}>
              {tHeader(slug)}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
