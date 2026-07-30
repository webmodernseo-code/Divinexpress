import Image from 'next/image';
import { Link } from '@/i18n/navigation';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" aria-label="Reign — accueil" className={`inline-flex items-center ${className}`}>
      <Image
        src="/branding/logo-reign.png"
        alt="Reign"
        width={160}
        height={52}
        priority
        className="h-8 w-auto md:h-10"
      />
    </Link>
  );
}
