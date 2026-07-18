'use client';

import { useEffect, useState } from 'react';
import styles from './MessageCarousel.module.css';

export function MessageCarousel({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 4000);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className={styles.carousel} role="status" aria-live="polite">
      <button
        type="button"
        onClick={() => setIndex((current) => (current - 1 + messages.length) % messages.length)}
        className={styles.arrow}
        aria-label="Previous"
      >
        &lsaquo;
      </button>
      <span className={styles.message}>{messages[index]}</span>
      <button
        type="button"
        onClick={() => setIndex((current) => (current + 1) % messages.length)}
        className={styles.arrow}
        aria-label="Next"
      >
        &rsaquo;
      </button>
    </div>
  );
}
