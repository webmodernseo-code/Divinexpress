'use client';

import { useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, Leaf, Quote, Recycle, Star, Truck } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Container } from '@/components/ui/Container';

const CONTENT = {
  fr: {
    eyebrow: 'Avis clients',
    title: 'Ils ont choisi DivinExpress',
    subtitle: 'Des expériences mode soignées, de l’Europe à l’Afrique.',
    previous: 'Avis précédent',
    next: 'Avis suivant',
    reviews: [
      { quote: 'La robe est arrivée à Paris en trois jours, parfaitement emballée. La coupe est fidèle aux photos et le tissu tombe vraiment bien.', name: 'Aïcha B.', location: 'Paris, France', purchase: 'Robe midi satinée', rating: 4.5 },
      { quote: 'Commande suivie facilement et reçue à Abidjan dans le délai annoncé. Le service m’a tenue informée à chaque étape.', name: 'Mariam K.', location: 'Abidjan, Côte d’Ivoire', purchase: 'Ensemble homme premium', rating: 4 },
      { quote: 'Les finitions sont soignées et la taille correspond parfaitement. Mon sac est arrivé à Dakar bien protégé, prêt à offrir.', name: 'Fatou N.', location: 'Dakar, Sénégal', purchase: 'Sac structuré', rating: 3 }
    ],
    reassurance: [
      { title: 'Matières responsables', body: 'Des matières choisies avec attention, pour conjuguer style et durabilité.' },
      { title: 'Qualité garantie', body: 'Chaque pièce est sélectionnée et contrôlée avec soin avant expédition.' },
      { title: 'Livraison suivie', body: 'Un suivi clair de votre commande jusqu’à votre adresse, en Europe et en Afrique.' },
      { title: 'Sélection écoresponsable', body: 'Des collections pensées pour durer et mieux accompagner votre quotidien.' }
    ]
  },
  en: {
    eyebrow: 'Customer reviews',
    title: 'They chose DivinExpress',
    subtitle: 'Carefully delivered fashion experiences across Europe and Africa.',
    previous: 'Previous review',
    next: 'Next review',
    reviews: [
      { quote: 'The dress reached Paris in three days and was beautifully packed. The fit matches the photos and the fabric falls perfectly.', name: 'Aïcha B.', location: 'Paris, France', purchase: 'Satin midi dress', rating: 4.5 },
      { quote: 'Tracking was easy and my order reached Abidjan within the promised timeframe. I received clear updates at every stage.', name: 'Mariam K.', location: 'Abidjan, Côte d’Ivoire', purchase: 'Premium menswear set', rating: 4 },
      { quote: 'The finishing is beautiful and the sizing is spot on. My bag arrived in Dakar well protected and ready to gift.', name: 'Fatou N.', location: 'Dakar, Senegal', purchase: 'Structured bag', rating: 3 }
    ],
    reassurance: [
      { title: 'Responsible materials', body: 'Materials chosen with care to bring style and durability together.' },
      { title: 'Quality commitment', body: 'Every piece is carefully selected and checked before dispatch.' },
      { title: 'Tracked delivery', body: 'Clear order tracking right to your address across Europe and Africa.' },
      { title: 'Thoughtful selection', body: 'Collections designed to last and fit beautifully into everyday life.' }
    ]
  }
} as const;

const REASSURANCE_ICONS = [Recycle, BadgeCheck, Truck, Leaf] as const;

export function CustomerTestimonials() {
  const locale = useLocale();
  const copy = CONTENT[locale === 'en' ? 'en' : 'fr'];
  const [activeIndex, setActiveIndex] = useState(0);
  const review = copy.reviews[activeIndex];
  const previous = () => setActiveIndex((index) => (index - 1 + copy.reviews.length) % copy.reviews.length);
  const next = () => setActiveIndex((index) => (index + 1) % copy.reviews.length);

  return (
    <section aria-labelledby="customer-testimonials-title" className="overflow-hidden bg-white py-14 text-ink md:py-20">
      <Container>
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent">{copy.eyebrow}</p>
          <h2 id="customer-testimonials-title" className="mt-3 font-serif text-2xl md:text-3xl">{copy.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-ink/65 md:text-base">{copy.subtitle}</p>
        </header>

        <div className="mx-auto mt-9 max-w-3xl rounded-3xl border border-stone-200 bg-[#faf8f3] px-6 py-7 shadow-[0_18px_55px_rgba(39,35,30,.08)] sm:px-10 md:px-12 md:py-9">
          <div className="flex items-center justify-between gap-4">
            <Quote className="size-7 text-accent" aria-hidden="true" />
            <div className="flex items-center gap-1" aria-label={`${review.rating.toLocaleString(locale === 'en' ? 'en' : 'fr')} ${locale === 'en' ? 'stars out of 5' : 'étoiles sur 5'}`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} data-review-star="true" className="relative block size-5">
                  <Star className="absolute inset-0 size-5 fill-amber-100 text-amber-300" aria-hidden="true" />
                  <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(1, review.rating - star + 1)) * 100}%` }}>
                    <Star className="size-5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div aria-live="polite" className="mt-4 min-h-44 transition-all duration-300 motion-reduce:transition-none">
            <blockquote className="font-serif text-lg leading-8 md:text-xl">“{review.quote}”</blockquote>
            <footer className="mt-6 border-t border-stone-200 pt-4">
              <p className="font-bold">{review.name}</p>
              <p className="mt-1 text-sm text-ink/55">{review.location}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">{review.purchase}</p>
            </footer>
          </div>

          <nav className="mt-7 flex items-center justify-between gap-4" aria-label={copy.eyebrow}>
            <button type="button" onClick={previous} aria-label={copy.previous} className="flex size-10 items-center justify-center rounded-full border border-stone-300 bg-white transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-3">
              {copy.reviews.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`${locale === 'en' ? 'View the review from' : 'Voir l’avis de'} ${item.name}`}
                  aria-pressed={index === activeIndex}
                  className={`h-2.5 rounded-full transition-all motion-reduce:transition-none ${index === activeIndex ? 'w-9 bg-accent' : 'w-2.5 bg-stone-300 hover:bg-stone-400'}`}
                />
              ))}
            </div>
            <button type="button" onClick={next} aria-label={copy.next} className="flex size-10 items-center justify-center rounded-full border border-stone-300 bg-white transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </nav>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {copy.reassurance.map((item, index) => {
            const Icon = REASSURANCE_ICONS[index];
            return (
              <article key={item.title} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
                <Icon className="size-9 stroke-[1.6] text-accent" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/65">{item.body}</p>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
