import styles from './Rating.module.css';

interface RatingProps {
  value: number; // e.g. 4.3
  count?: number; // e.g. 128
  size?: number; // star size in px, defaults to 14
  id: string; // unique ID to prevent SVG gradient id collisions
}

function Star({ fill, gradId, size = 14 }: { fill: number; gradId: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={styles.starSvg} aria-hidden="true">
      <defs>
        <linearGradient id={gradId}>
          <stop offset={`${fill * 100}%`} stopColor="var(--accent-rating, #FFB600)" />
          <stop offset={`${fill * 100}%`} stopColor="var(--neutral-200, #E5E5E5)" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l3.09 6.26 6.91 1-5 4.87 1.18 6.87L12 18.4l-6.18 3.1L7 14.63l-5-4.87 6.91-1L12 2.5Z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}

export function Rating({ value, count, size = 14, id }: RatingProps) {
  const stars = [0, 1, 2, 3, 4].map((i) => Math.max(0, Math.min(1, value - i)));

  return (
    <span className={styles.ratingContainer}>
      <span className={styles.starsGroup}>
        {stars.map((f, i) => (
          <Star key={i} fill={f} gradId={`star-${id}-${i}`} size={size} />
        ))}
      </span>
      {count !== undefined ? (
        <span className={styles.count}>({count})</span>
      ) : value > 0 ? (
        <span className={styles.count}>({value.toFixed(1)})</span>
      ) : null}
    </span>
  );
}
