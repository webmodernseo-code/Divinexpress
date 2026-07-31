import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';

export default async function LocaleNotFound() {
  const t = await getTranslations('notFound');

  return (
    <Container className="max-w-xl py-24 text-center">
      <Heading level={1}>{t('title')}</Heading>
      <p className="mt-4 text-sm text-mist-600">{t('body')}</p>
      <Link href="/" className="mt-8 inline-block">
        <Button>{t('backHome')}</Button>
      </Link>
    </Container>
  );
}
