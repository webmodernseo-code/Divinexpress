import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPageLayout, type LegalSection } from '@/components/legal/LegalPageLayout';

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('privacy');
  const tLegal = await getTranslations('legal');

  return (
    <LegalPageLayout
      title={t('title')}
      updatedLabel={t('updatedLabel')}
      sections={t.raw('sections') as LegalSection[]}
      disclaimer={tLegal('disclaimer')}
    />
  );
}
