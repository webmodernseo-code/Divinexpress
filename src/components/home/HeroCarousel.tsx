'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface HeroSlide {
  image: string;
  kicker: string;
  title: string;
  subtitle: string;
}

export function HeroCarousel({
  slides
}: {
  slides: HeroSlide[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered, slides.length]);

  return (
    <section
      className="relative h-[65vh] w-full overflow-hidden md:h-[80vh]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides */}
      {slides.map((slide, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={slide.image}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              className="object-cover object-center"
              sizes="100vw"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-linear-to-b from-ink/20 via-ink/40 to-ink/75" />
            
            {/* Content */}
            <div className="absolute inset-x-0 bottom-0 z-20 mx-auto max-w-7xl px-4 pb-16 pt-32 text-paper sm:px-6 md:pb-24 lg:px-8">
              <div className="max-w-2xl transform transition-transform duration-1000">
                <p className="text-xs uppercase tracking-[0.3em] text-paper/90 md:text-sm">
                  {slide.kicker}
                </p>
                <h1 className="mt-4 font-serif text-4xl leading-tight md:text-7xl">
                  {slide.title}
                </h1>
                <p className="mt-6 max-w-lg text-sm leading-relaxed text-paper/85 md:text-lg">
                  {slide.subtitle}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation arrows */}
      <div className="absolute inset-y-0 left-4 z-30 hidden items-center md:flex lg:left-8">
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
          className="flex size-12 items-center justify-center rounded-full border border-paper/30 bg-ink/10 text-paper backdrop-blur-xs transition-colors hover:border-paper hover:bg-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper"
          aria-label="Slide précédent"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <div className="absolute inset-y-0 right-4 z-30 hidden items-center md:flex lg:right-8">
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
          className="flex size-12 items-center justify-center rounded-full border border-paper/30 bg-ink/10 text-paper backdrop-blur-xs transition-colors hover:border-paper hover:bg-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper"
          aria-label="Slide suivant"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Slide indicators (dots) */}
      <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-3">
        {slides.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`h-2 transition-all duration-300 rounded-full ${
                isActive ? 'w-8 bg-paper' : 'w-2 bg-paper/40 hover:bg-paper/70'
              }`}
              aria-label={`Aller au slide ${index + 1}`}
              aria-pressed={isActive}
            />
          );
        })}
      </div>
    </section>
  );
}
