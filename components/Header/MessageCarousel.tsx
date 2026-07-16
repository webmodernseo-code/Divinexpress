'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import styles from './MessageCarousel.module.css';

export function MessageCarousel() {
  const t = useTranslations('header');
  const messages = [
    { text: t('topbarMsg1'), icon: '✉' },
    { text: t('topbarMsg2'), icon: '🚚' }
  ];

  const [index, setIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [index]);

  const changeSlide = (nextIndex: number) => {
    setOpacity(0);
    setTimeout(() => {
      setIndex(nextIndex);
      setOpacity(1);
    }, 300);
  };

  const handlePrev = () => {
    const nextIndex = index === 0 ? messages.length - 1 : index - 1;
    changeSlide(nextIndex);
  };

  const handleNext = () => {
    const nextIndex = index === messages.length - 1 ? 0 : index + 1;
    changeSlide(nextIndex);
  };

  const current = messages[index];
  if (!current) return null;

  return (
    <div className={styles.carousel}>
      <button onClick={handlePrev} className={styles.button} aria-label="Previous message" type="button">
        <span className={styles.icon}>←</span>
      </button>
      <div className={styles.content} style={{ opacity }}>
        <span>{current.icon}</span>
        <span>{current.text}</span>
      </div>
      <button onClick={handleNext} className={styles.button} aria-label="Next message" type="button">
        <span className={styles.icon}>→</span>
      </button>
    </div>
  );
}
