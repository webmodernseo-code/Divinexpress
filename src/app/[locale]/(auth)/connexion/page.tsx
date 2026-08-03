import { LoginPanel } from '@/components/admin/LoginPanel';

export default async function ConnexionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LoginPanel locale={locale === 'en' ? 'en' : 'fr'} />;
}
