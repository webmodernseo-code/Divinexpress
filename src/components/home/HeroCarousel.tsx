'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

type HeroTheme = 'navy' | 'black';

interface HeroSlide {
  image: string;
  imageAlt: string;
  watermark: string;
  title: string;
  subtitle: string;
  theme: HeroTheme;
}

interface HeroCta {
  label: string;
  href: string;
}

type HeroFeatureIcon = 'quality' | 'design' | 'shipping';

interface HeroFeature {
  icon: HeroFeatureIcon;
  title: string;
  subtitle: string;
}

/** Background tint (rgb triplet) used for the readability gradient and the
 *  solid backdrop behind the contained image on mobile. */
const THEME_TINT: Record<HeroTheme, string> = {
  navy: '11, 26, 46',
  black: '8, 8, 8'
};

function overlayStyle(theme: HeroTheme): React.CSSProperties {
  const tint = THEME_TINT[theme];
  return {
    background: `linear-gradient(90deg, rgba(${tint}, 0.94) 0%, rgba(${tint}, 0.86) 38%, rgba(${tint}, 0.4) 66%, rgba(${tint}, 0) 100%)`
  };
}

function FeatureIcon({ icon, className = '' }: { icon: HeroFeatureIcon; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true
  };
  if (icon === 'quality') {
    return (
      <svg {...common}>
        <path d="M11 3C7 5 5 8 5 12c0 4 3 8 6 9 3-1 6-5 6-9 0-4-2-7-6-9z" />
        <path d="M11 21V9" />
      </svg>
    );
  }
  if (icon === 'design') {
    return (
      <svg {...common}>
        <circle cx="12" cy="9" r="5" />
        <path d="M9 13l-2 8 5-3 5 3-2-8" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
}

export function HeroCarousel({
  slides,
  primaryCta,
  secondaryCta,
  features
}: {
  slides: HeroSlide[];
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
  features: HeroFeature[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered, slides.length]);

  return (
    <section className="w-full md:px-6 md:pt-6 lg:px-8">
      <div
        className="relative mx-auto h-[50vh] min-h-[340px] w-full max-w-7xl overflow-hidden rounded-none md:h-auto md:min-h-[560px] md:rounded-3xl lg:min-h-[640px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.image}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'
              }`}
              style={{ backgroundColor: `rgb(${THEME_TINT[slide.theme]})` }}
              aria-hidden={!isActive}
            >
              {/* Product image — fills the frame edge-to-edge on every breakpoint (no letterbox bands). */}
              <Image
                src={slide.image}
                alt={slide.imageAlt}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-center md:object-right"
              />

              {/* Readability gradient (dark on the text side, transparent on the product side) */}
              <div className="absolute inset-0" style={overlayStyle(slide.theme)} />

              {/* Giant watermark */}
              <span className="pointer-events-none absolute left-1/2 top-1/2 z-[15] w-full -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center text-[26vw] font-black uppercase leading-none tracking-tighter text-white/[0.05] md:text-[16vw]">
                {slide.watermark}
              </span>

              {/* Content */}
              <div className="relative z-20 flex h-full flex-col justify-center px-5 py-6 text-paper sm:px-10 sm:py-10 lg:px-16">
                <div className="max-w-xl">
                  <h1 className="font-sans text-2xl font-extrabold uppercase leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                    {slide.title.split(' ').map((word) => (
                      <span key={word} className="block">
                        {word}
                      </span>
                    ))}
                  </h1>
                  <p className="mt-3 max-w-md text-xs leading-relaxed text-paper/80 sm:mt-6 sm:text-sm md:text-base">
                    {slide.subtitle}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-8 sm:gap-3">
                    <a
                      href={primaryCta.href}
                      className="inline-flex items-center justify-center rounded-full bg-paper px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-paper/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper sm:px-6 sm:py-3 sm:text-xs"
                    >
                      {primaryCta.label}
                    </a>
                    <a
                      href={secondaryCta.href}
                      className="inline-flex items-center justify-center rounded-full border border-paper/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-paper transition-colors hover:border-paper hover:bg-paper/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper sm:px-6 sm:py-3 sm:text-xs"
                    >
                      {secondaryCta.label}
                    </a>
                  </div>

                  <ul className="mt-5 flex flex-row flex-wrap gap-x-4 gap-y-2 sm:mt-10 sm:gap-x-8">
                    {features.map((feature) => (
                      <li key={feature.title} className="flex items-center gap-2 sm:gap-3">
                        <FeatureIcon icon={feature.icon} className="size-4 shrink-0 text-paper/80 sm:size-6" />
                        <span className="leading-tight">
                          <span className="block text-[11px] font-semibold text-paper sm:text-sm">{feature.title}</span>
                          <span className="hidden text-xs text-paper/65 sm:block">{feature.subtitle}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-4 z-30 hidden items-center md:flex lg:left-6">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                className="flex size-12 items-center justify-center rounded-full border border-paper/30 bg-black/10 text-paper backdrop-blur-xs transition-colors hover:border-paper hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper"
                aria-label="Slide précédent"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div className="absolute inset-y-0 right-4 z-30 hidden items-center md:flex lg:right-6">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
                className="flex size-12 items-center justify-center rounded-full border border-paper/30 bg-black/10 text-paper backdrop-blur-xs transition-colors hover:border-paper hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper"
                aria-label="Slide suivant"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Slide indicators */}
            <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-3 sm:bottom-6">
              {slides.map((slide, index) => {
                const isActive = index === currentIndex;
                return (
                  <button
                    key={slide.image}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive ? 'w-8 bg-paper' : 'w-2 bg-paper/40 hover:bg-paper/70'
                    }`}
                    aria-label={`Aller au slide ${index + 1}`}
                    aria-pressed={isActive}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
