import Image from 'next/image';
import { Link } from '@/i18n/navigation';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" aria-label="DivinExpress — accueil" className={`inline-flex items-center ${className}`}>
      <Image
        src="/branding/logo-divinexpress.png"
        alt="DivinExpress"
        width={201}
        height={67}
        priority
        className="h-8 w-auto md:h-10"
      />
    </Link>
  );
}
