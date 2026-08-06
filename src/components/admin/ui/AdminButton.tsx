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
  primary: 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 hover:border-indigo-700 shadow-sm shadow-indigo-600/10 active:scale-[0.98]',
  secondary: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]',
  ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]',
  danger: 'border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 active:scale-[0.98]',
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
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
    >
      {iconPosition === 'left' && visualIcon}
      {children}
      {iconPosition === 'right' && visualIcon}
    </button>
  );
}
