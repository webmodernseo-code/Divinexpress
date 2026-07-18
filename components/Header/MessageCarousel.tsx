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
      <span
        onClick={() => setIndex((current) => (current - 1 + messages.length) % messages.length)}
        className={styles.arrow}
        role="button"
        tabIndex={0}
      >
        ‹
      </span>
      <span className={styles.message}>{messages[index]}</span>
      <span
        onClick={() => setIndex((current) => (current + 1) % messages.length)}
        className={styles.arrow}
        role="button"
        tabIndex={0}
      >
        ›
      </span>
    </div>
  );
}
