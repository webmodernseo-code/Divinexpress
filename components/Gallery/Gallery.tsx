'use client';

import { useState } from 'react';
import styles from './Gallery.module.css';

type GalleryImage = {
  url: string;
  alt: string;
};

export function Gallery({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className={styles.mainView}>
        <div className={styles.placeholder}>Photo</div>
      </div>
    );
  }

  // Generate simulated thumbnail views if only 1 image exists for seed testing
  const activeImages = images.length > 1 ? images : [
    images[0],
    { url: images[0].url, alt: `${images[0].alt} - View 2` },
    { url: images[0].url, alt: `${images[0].alt} - View 3` }
  ];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? activeImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === activeImages.length - 1 ? 0 : prev + 1));
  };

  const currentImage = activeImages[activeIndex];

  return (
    <div className={styles.container}>
      <div className={styles.thumbnails}>
        {activeImages.map((image, idx) => (
          <button
            key={`${image.url}-${idx}`}
            onClick={() => setActiveIndex(idx)}
            className={`${styles.thumbButton} ${idx === activeIndex ? styles.thumbActive : ''}`}
            type="button"
          >
            <img src={image.url} alt={image.alt} className={styles.thumbImage} />
          </button>
        ))}
      </div>
      
      <div className={styles.mainView}>
        <div className={styles.badge}>★ Bien noté</div>
        
        <img src={currentImage.url} alt={currentImage.alt} className={styles.mainImage} />
        
        <div className={styles.navControls}>
          <button onClick={handlePrev} className={styles.navButton} aria-label="Previous image" type="button">
            ‹
          </button>
          <button onClick={handleNext} className={styles.navButton} aria-label="Next image" type="button">
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
