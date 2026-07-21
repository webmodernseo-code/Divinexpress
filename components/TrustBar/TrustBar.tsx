import { getTranslations } from 'next-intl/server';
import styles from './TrustBar.module.css';

const ITEMS = [
  {
    key: 'payment',
    icon: 'https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/6892144f750bf17c33b635e7_recycling-reproducing-svgrepo-com%201.svg'
  },
  {
    key: 'delivery',
    icon: 'https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/689214509e45233c0eac2f63_warranty-svgrepo-com%201.svg'
  },
  {
    key: 'returns',
    icon: 'https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/68921450b524ed88c4868689_delivery-fast-svgrepo.svg'
  },
  {
    key: 'materials',
    icon: 'https://cdn.prod.website-files.com/6890fbf29f28b7089b169c21/6892144f566712d4d864a312_eco-friendly-svgrepo-com%201.svg'
  }
] as const;

export async function TrustBar() {
  const t = await getTranslations('trustbar');

  // Repeat items 2 times for seamless infinite scroll
  const repeatedItems = [...ITEMS, ...ITEMS];

  return (
    <section className={styles.wrapper}>
      <div className={styles.viewport}>
        <div className={styles.track}>
          {repeatedItems.map((item, idx) => (
            <div key={`${item.key}-${idx}`} className={styles.item}>
              <img src={item.icon} alt="" className={styles.icon} />
              <div className={styles.textGroup}>
                <h3 className={styles.title}>{t(`${item.key}Title`)}</h3>
                <p className={styles.desc}>{t(`${item.key}Desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



