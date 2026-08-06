import { LoginPanel } from '@/components/admin/LoginPanel';
import { loginAction } from './actions';

export default async function ConnexionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const normalizedLocale = locale === 'en' ? 'en' : 'fr';
  return <LoginPanel locale={normalizedLocale} action={loginAction.bind(null, normalizedLocale)} />;
}
