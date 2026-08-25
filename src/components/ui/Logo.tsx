import Image from 'next/image';
import { Link } from '@/i18n/navigation';

type LogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
};

export function Logo({ className = '', markClassName = '', wordmarkClassName = '' }: LogoProps) {
  return (
    <Link href="/" aria-label="DivinExpress — accueil" className={`inline-flex items-center gap-2 md:gap-3 ${className}`}>
      <Image
        src="/branding/logo-divinexpress-mark.png"
        alt=""
        width={44}
        height={44}
        priority
        className={`size-7 shrink-0 md:size-10 ${markClassName}`}
      />
      <Image
        src="/branding/logo-divinexpress.png"
        alt=""
        width={201}
        height={67}
        priority
        className={`h-8 w-auto md:h-12 ${wordmarkClassName}`}
      />
    </Link>
  );
}
