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
      {messages[index]}
    </div>
  );
}
