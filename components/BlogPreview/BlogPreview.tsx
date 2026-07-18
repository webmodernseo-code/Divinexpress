import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n';
import styles from './BlogPreview.module.css';

export const POSTS: {
  id: number;
  imageUrl: string;
  titleFr: string;
  titleEn: string;
  categoryFr: string;
  categoryEn: string;
  date: string;
  bodyFr: string[];
  bodyEn: string[];
}[] = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&auto=format&fit=crop&q=80',
    titleFr: 'Voyager avec un petit budget : explorer le monde sans se ruiner',
    titleEn: 'Traveling on a budget: explore the world without breaking the bank',
    categoryFr: 'Voyage',
    categoryEn: 'Travel',
    date: '2026-04-20',
    bodyFr: [
      "Voyager sans se ruiner est un art accessible à toutes et tous. Réserver ses billets plusieurs mois à l'avance permet souvent d'économiser jusqu'à 40 % sur le prix total du séjour.",
      "Privilégiez les hébergements alternatifs, les transports en commun locaux et la restauration de quartier pour profiter pleinement de votre destination sans exploser votre budget.",
      "Enfin, voyager léger — avec une seule paire de chaussures polyvalente et confortable — simplifie chaque étape du trajet."
    ],
    bodyEn: [
      "Traveling on a budget is an art accessible to everyone. Booking tickets several months in advance often saves up to 40% on the total price of the stay.",
      "Opt for alternative accommodations, local public transportation, and neighborhood dining to fully enjoy your destination without blowing your budget.",
      "Finally, traveling light — with a single versatile and comfortable pair of shoes — simplifies every step of the journey."
    ]
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1511295742364-92767fa62d9f?w=600&auto=format&fit=crop&q=80',
    titleFr: 'Améliorer son hygiène de sommeil pour mieux se reposer',
    titleEn: 'Improve your sleep hygiene to rest better',
    categoryFr: 'Santé',
    categoryEn: 'Health',
    date: '2026-05-01',
    bodyFr: [
      "Un bon sommeil commence par de bonnes habitudes : horaires réguliers, lumière tamisée en soirée et écrans éteints une heure avant le coucher.",
      "La qualité de vos accessoires du quotidien, y compris vos chaussures, influence aussi votre niveau de fatigue — une paire mal ajustée fatigue davantage le corps sur la journée.",
      "Adoptez une routine simple et constante : votre corps vous remerciera dès les premières nuits."
    ],
    bodyEn: [
      "Good sleep starts with good habits: regular schedules, dim lights in the evening, and screens turned off an hour before bedtime.",
      "The quality of your everyday accessories, including your shoes, also influences your fatigue level — an ill-fitting pair tires the body more throughout the day.",
      "Adopt a simple and consistent routine: your body will thank you from the very first nights."
    ]
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1581822261290-991b38693d1b?w=600&auto=format&fit=crop&q=80',
    titleFr: 'Top 10 des logiciels de rendu pour des visuels époustouflants',
    titleEn: 'Top 10 rendering software for stunning visuals',
    categoryFr: 'Technologie',
    categoryEn: 'Technology',
    date: '2026-06-12',
    bodyFr: [
      "Le rendu 3D a considérablement évolué ces dernières années, avec des outils de plus en plus accessibles aux créateurs indépendants.",
      "Chez DivinExpress, ces mêmes technologies nous permettent de visualiser nos collections avant même la première paire produite, réduisant les déchets et les erreurs de fabrication.",
      "Un allié précieux pour une mode plus responsable."
    ],
    bodyEn: [
      "3D rendering has evolved considerably in recent years, with tools becoming increasingly accessible to independent creators.",
      "At DivinExpress, these same technologies allow us to visualize our collections before the first pair is even produced, reducing waste and manufacturing errors.",
      "A valuable ally for a more responsible fashion."
    ]
  },
  {
    id: 4,
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
    titleFr: '10 indispensables de la garde-robe pour tout amateur de mode',
    titleEn: '10 wardrobe essentials for every fashion lover',
    categoryFr: 'Guide Mode',
    categoryEn: 'Fashion Guide',
    date: '2026-07-07',
    bodyFr: [
      "Une garde-robe réussie repose sur quelques pièces intemporelles plutôt que sur l'accumulation de tendances éphémères.",
      "Une bonne paire de baskets blanches, un mocassin élégant et une botte robuste couvrent déjà l'essentiel de vos besoins, quelle que soit la saison.",
      "Investir dans la qualité, c'est investir dans la durabilité — pour votre style comme pour la planète."
    ],
    bodyEn: [
      "A successful wardrobe is built on a few timeless pieces rather than an accumulation of fleeting trends.",
      "A good pair of white sneakers, elegant loafers, and sturdy boots already cover most of your needs, whatever the season.",
      "Investing in quality is investing in sustainability — for your style as well as for the planet."
    ]
  }
];

export async function BlogPreview({ locale }: { locale: Locale }) {
  const t = await getTranslations('home');
  const formatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t('blogTitle')}</h2>
      <div className={styles.grid}>
        {POSTS.map((post) => (
          <Link key={post.id} href={`/blog/${post.id}`} locale={locale} className={styles.card}>
            <img src={post.imageUrl} alt="" className={styles.image} />
            <div className={styles.meta}>
              {locale === 'fr' ? post.categoryFr : post.categoryEn} · {formatter.format(new Date(post.date))}
            </div>
            <h3 className={styles.postTitle}>{locale === 'fr' ? post.titleFr : post.titleEn}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
