import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: Variant;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const variants: Record<Variant, string> = {
  primary: 'border-black bg-black text-white hover:bg-neutral-800',
  secondary: 'border-admin-border bg-white text-admin-text hover:bg-admin-soft',
  ghost: 'border-transparent bg-transparent text-admin-text hover:bg-admin-soft',
  danger: 'border-admin-danger bg-white text-admin-danger hover:bg-red-50',
};

export function AdminButton({
  children,
  className = '',
  disabled,
  icon,
  iconPosition = 'left',
  loading = false,
  variant = 'primary',
  ...props
}: AdminButtonProps) {
  const visualIcon = loading ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : icon;
  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
    >
      {iconPosition === 'left' && visualIcon}
      {children}
      {iconPosition === 'right' && visualIcon}
    </button>
  );
}
