'use client';

import { useState } from 'react';
import { Rating } from '../Rating/Rating';
import type { Locale } from '@/i18n';
import styles from './TestimonialCarousel.module.css';

const TESTIMONIALS = [
  {
    quoteFr: "Je n'ai jamais porté de chaussures aussi élégantes qui donnent aussi l'impression de marcher sur des nuages. La qualité est irréprochable !",
    quoteEn: "I have never worn shoes so elegant that also feel like walking on clouds. The quality is flawless!",
    name: "Harper Jackson",
    avatar: "https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/6893621a929dc19ce2544e67_Ellipse%202.svg",
    rating: 5
  },
  {
    quoteFr: "Trouver des chaussures bien ajustées est toujours difficile pour moi. Ici, le guide des tailles était parfait. Je recommande vivement !",
    quoteEn: "Finding well-fitting shoes is always hard for me. Here, the size guide was perfect. Highly recommend!",
    name: "Mason Jack",
    avatar: "https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/68935d2912795d5a43a13801_Ellipse%202%20(1).png",
    rating: 5
  },
  {
    quoteFr: "L'équipe DivinExpress a rendu les retours simples et la qualité est toujours au rendez-vous, paire après paire.",
    quoteEn: "The DivinExpress team made returns simple and the quality is always there, pair after pair.",
    name: "Avery Wyatt",
    avatar: "https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/68a09cad8bbd3e84a18dc902_6f59301a62fbf9bc224efbfdc89a3d0a2e0790a4.png",
    rating: 5
  },
  {
    quoteFr: "Livraison rapide, finitions soignées : mes Eclipse Sneakers sont devenues ma paire du quotidien.",
    quoteEn: "Fast delivery, neat finishes: my Eclipse Sneakers have become my everyday pair.",
    name: "Léa Fontaine",
    avatar: "https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/6893621a929dc19ce2544e67_Ellipse%202.svg",
    rating: 5
  },
  {
    quoteFr: "Le service client a résolu mon échange de taille en un jour. Une confiance totale pour mes prochains achats.",
    quoteEn: "Customer service resolved my size exchange in one day. Total confidence for my next purchases.",
    name: "Noah Girard",
    avatar: "https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/68935d2912795d5a43a13801_Ellipse%202%20(1).png",
    rating: 4
  },
  {
    quoteFr: "Des matières premium et un style qui sort du lot. DivinExpress est devenue ma référence chaussures.",
    quoteEn: "Premium materials and a style that stands out. DivinExpress has become my shoe reference.",
    name: "Camille Roy",
    avatar: "https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/68a09cad8bbd3e84a18dc902_6f59301a62fbf9bc224efbfdc89a3d0a2e0790a4.png",
    rating: 5
  }
];

export function TestimonialCarousel({ locale }: { locale: Locale }) {
  const [index, setIndex] = useState(0);

  const visibleIndices = [0, 1, 2].map(
    (offset) => (index + offset) % TESTIMONIALS.length
  );

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        {locale === 'fr' ? "Ce qu'en disent nos clients" : "What our customers say"}
      </h2>
      <div className={styles.carouselContainer}>
        {/* Left Arrow */}
        <button
          type="button"
          onClick={() => setIndex((current) => (current - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
          className={styles.arrowLeft}
          aria-label="Previous testimonial"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C0407" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Grid of testimonials */}
        <div className={styles.grid}>
          {visibleIndices.map((idx) => {
            const item = TESTIMONIALS[idx];
            return (
              <div key={item.name} className={styles.card}>
                <p className={styles.quote}>&ldquo;{locale === 'fr' ? item.quoteFr : item.quoteEn}&rdquo;</p>
                <div className={styles.bio}>
                  <img src={item.avatar} alt={item.name} className={styles.avatar} />
                  <div className={styles.info}>
                    <span className={styles.name}>{item.name}</span>
                    <Rating value={item.rating} id={`testi-${item.name.toLowerCase().replace(/\s+/g, '-')}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          type="button"
          onClick={() => setIndex((current) => (current + 1) % TESTIMONIALS.length)}
          className={styles.arrowRight}
          aria-label="Next testimonial"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C0407" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Dots navigation */}
      <div className={styles.dots}>
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={i === index ? styles.dotActive : styles.dot}
            aria-label={`Go to testimonial slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
