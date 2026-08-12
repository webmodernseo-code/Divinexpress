type Aspect = 'portrait' | 'square' | 'wide';

const ASPECT_CLASSES: Record<Aspect, string> = {
  portrait: 'aspect-[4/5]',
  square: 'aspect-square',
  wide: 'aspect-[16/9]'
};

/**
 * Shared image tile: light-grey rounded frame with a hairline ring. The ring
 * keeps white/light products from blending into the white page background, and
 * the grey shows through for cut-out images or while loading.
 */
const FRAME = 'relative overflow-hidden rounded-2xl bg-mist-100 ring-1 ring-black/[0.06]';

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
      <div className={`${ASPECT_CLASSES[aspect]} ${FRAME} ${className}`}>
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
      className={`${ASPECT_CLASSES[aspect]} ${FRAME} flex items-center justify-center ${className}`}
      role="img"
      aria-label={label ?? 'Visuel à venir'}
    >
      {label && (
        <span className="px-4 text-center text-xs uppercase tracking-widest text-mist-500">{label}</span>
      )}
    </div>
  );
}
