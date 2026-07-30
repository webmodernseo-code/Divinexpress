type ButtonVariant = 'primary' | 'secondary';

const BASE = 'inline-flex items-center justify-center px-6 py-3 text-sm tracking-wide transition-colors';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: `${BASE} bg-ink text-paper hover:bg-accent`,
  secondary: `${BASE} border border-ink text-ink hover:border-accent hover:text-accent`
};

export function buttonClassName(variant: ButtonVariant = 'primary'): string {
  return VARIANTS[variant];
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button className={`${buttonClassName(variant)} ${className}`} {...props}>
      {children}
    </button>
  );
}
