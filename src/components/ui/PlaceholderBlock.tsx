type Aspect = 'portrait' | 'square' | 'wide';

const ASPECT_CLASSES: Record<Aspect, string> = {
  portrait: 'aspect-[4/5]',
  square: 'aspect-square',
  wide: 'aspect-[16/9]'
};

export function PlaceholderBlock({
  aspect = 'portrait',
  label,
  className = '',
  imageUrl
}: {
  aspect?: Aspect;
  label?: string;
  className?: string;
  imageUrl?: string;
}) {
  if (imageUrl) {
    return (
      <div className={`${ASPECT_CLASSES[aspect]} relative overflow-hidden bg-mist-900 ${className}`}>
        <img
          src={imageUrl}
          alt={label ?? ''}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        {label && label.includes('/') && <span className="sr-only">{label}</span>}
      </div>
    );
  }
  return (
    <div
      className={`${ASPECT_CLASSES[aspect]} flex items-center justify-center bg-mist-900 ${className}`}
      role="img"
      aria-label={label ?? 'Visuel à venir'}
    >
      {label && (
        <span className="px-4 text-center text-xs uppercase tracking-widest text-mist-400">{label}</span>
      )}
    </div>
  );
}
