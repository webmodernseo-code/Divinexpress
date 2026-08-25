'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { PromotionSlide } from '@/server/promotions/repository';

const COPY = {
  fr: { title: 'Promotions du moment', subtitle: 'DÃ©couvrez nos offres et accÃ©dez directement aux piÃ¨ces qui vous inspirent.', previous: 'Promotion prÃ©cÃ©dente', next: 'Promotion suivante', view: 'DÃ©couvrir' },
  en: { title: 'Current promotions', subtitle: 'Explore our offers and go straight to the pieces that inspire you.', previous: 'Previous promotion', next: 'Next promotion', view: 'Discover' }
} as const;

function positionOf(index: number, active: number, length: number) {
  let position = (index - active + length) % length;
  if (position > Math.floor(length / 2)) position -= length;
  return position;
}

export function PromotionCarousel({ slides }: { slides: PromotionSlide[] }) {
  const locale = useLocale() === 'en' ? 'en' : 'fr';
  const copy = COPY[locale];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchX = useRef<number | null>(null);
  const previous = useCallback(() => setActive((value) => (value - 1 + slides.length) % slides.length), [slides.length]);
  const next = useCallback(() => setActive((value) => (value + 1) % slides.length), [slides.length]);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion || slides.length < 2) return;
    const timer = window.setInterval(next, 5200);
    return () => window.clearInterval(timer);
  }, [next, paused, reduceMotion, slides.length]);

  if (!slides.length) return null;

  return (
    <section className="overflow-hidden bg-ink py-16 text-paper md:py-24">
      <header className="mx-auto max-w-3xl px-5 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-paper/55">SÃ©lection DivinExpress</p>
        <h2 id="promotion-carousel-title" className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl">{copy.title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-paper/65 md:text-base">{copy.subtitle}</p>
      </header>

      <div
        role="region"
        aria-roledescription="carousel"
        aria-labelledby="promotion-carousel-title"
        aria-label={copy.title}
        tabIndex={0}
        className="relative mx-auto mt-10 h-[390px] max-w-7xl touch-pan-y select-none outline-none sm:h-[500px] md:mt-14 md:h-[580px]"
        onKeyDown={(event) => { if (event.key === 'ArrowLeft') previous(); if (event.key === 'ArrowRight') next(); }}
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
        onTouchStart={(event) => { setPaused(true); touchX.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          const end = event.changedTouches[0]?.clientX;
          if (touchX.current !== null && end !== undefined && Math.abs(touchX.current - end) > 45) touchX.current > end ? next() : previous();
          touchX.current = null; setPaused(false);
        }}
      >
        <div className="relative flex h-full items-center justify-center [perspective:1200px]">
          {slides.map((slide, index) => {
            const position = positionOf(index, active, slides.length);
            const distance = Math.abs(position);
            const current = position === 0;
            const name = locale === 'en' ? slide.productNameEn : slide.productNameFr;
            return (
              <Link
                key={slide.id}
                href={`/produit/${slide.productSlug}`}
                aria-label={`${copy.view} ${name}`}
                aria-current={current ? 'true' : undefined}
                tabIndex={current ? 0 : -1}
                className="absolute w-[78vw] max-w-[360px] transition-[transform,opacity,filter] duration-500 motion-reduce:transition-none sm:w-[54vw] md:w-[38vw] lg:w-[30vw]"
                style={{ transform: `translateX(${position * 66}%) scale(${current ? 1 : distance === 1 ? .86 : .72}) rotateY(${position * -9}deg)`, opacity: current ? 1 : distance === 1 ? .58 : distance === 2 ? .2 : 0, filter: current ? 'none' : 'brightness(.65)', pointerEvents: current ? 'auto' : 'none', visibility: distance <= 2 ? 'visible' : 'hidden', zIndex: 10 - distance }}
              >
                <article className="group relative aspect-[4/5] overflow-hidden rounded-3xl border border-paper/15 bg-mist-900 shadow-2xl">
                  <img src={slide.imageUrl} alt={name} draggable={false} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025] motion-reduce:transition-none" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-5 pb-5 pt-20 sm:px-7 sm:pb-7">
                    <p className="font-serif text-xl text-white sm:text-2xl">{name}</p>
                    <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-white/80">{copy.view}<ChevronRight className="size-4" aria-hidden="true" /></span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
        {slides.length > 1 && <>
          <button type="button" onClick={previous} aria-label={copy.previous} className="absolute left-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-paper/25 bg-black/50 md:left-8"><ChevronLeft aria-hidden="true" /></button>
          <button type="button" onClick={next} aria-label={copy.next} className="absolute right-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-paper/25 bg-black/50 md:right-8"><ChevronRight aria-hidden="true" /></button>
        </>}
      </div>
      {slides.length > 1 && <nav className="mt-2 flex justify-center gap-2.5" aria-label={copy.title}>{slides.map((slide, index) => <button key={slide.id} type="button" onClick={() => setActive(index)} aria-label={`${copy.view} ${locale === 'en' ? slide.productNameEn : slide.productNameFr}`} aria-pressed={index === active} className={`h-2 rounded-full ${index === active ? 'w-8 bg-paper' : 'w-2 bg-paper/30'}`} />)}</nav>}
    </section>
  );
}
