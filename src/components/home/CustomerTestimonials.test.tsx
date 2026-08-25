import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CustomerTestimonials } from './CustomerTestimonials';

const copy: Record<string, string> = {
  eyebrow: 'Avis clients',
  title: 'Ils ont choisi DivinExpress',
  subtitle: 'Des commandes livrées entre Europe et Afrique.',
  previous: 'Avis précédent',
  next: 'Avis suivant',
  'reviews.0.quote': 'La robe est arrivée à Paris en trois jours, parfaitement emballée.',
  'reviews.0.name': 'Aïcha B.',
  'reviews.0.location': 'Paris, France',
  'reviews.0.purchase': 'Robe midi satinée',
  'reviews.1.quote': 'Commande suivie facilement et reçue à Abidjan dans le délai annoncé.',
  'reviews.1.name': 'Mariam K.',
  'reviews.1.location': 'Abidjan, Côte d’Ivoire',
  'reviews.1.purchase': 'Ensemble homme premium',
  'reviews.2.quote': 'Les finitions sont soignées et la taille correspond parfaitement.',
  'reviews.2.name': 'Fatou N.',
  'reviews.2.location': 'Dakar, Sénégal',
  'reviews.2.purchase': 'Sac structuré',
  'reassurance.materials.title': 'Matières responsables',
  'reassurance.materials.body': 'Des matières choisies avec attention.',
  'reassurance.quality.title': 'Qualité garantie',
  'reassurance.quality.body': 'Une sélection contrôlée avec soin.',
  'reassurance.delivery.title': 'Livraison suivie',
  'reassurance.delivery.body': 'Un suivi clair jusqu’à votre adresse.',
  'reassurance.eco.title': 'Sélection écoresponsable',
  'reassurance.eco.body': 'Des choix pensés pour durer.'
};

vi.mock('next-intl', () => ({
  useLocale: () => 'fr',
  useTranslations: () => (key: string) => copy[key] ?? key
}));

describe('CustomerTestimonials', () => {
  it('lets customers select a realistic DivinExpress delivery review with accessible controls', async () => {
    const user = userEvent.setup();
    render(<CustomerTestimonials />);

    expect(screen.getByText(/arrivée à Paris en trois jours/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Voir l’avis de Mariam K.' }));

    expect(screen.getByText(/reçue à Abidjan dans le délai annoncé/i)).toBeInTheDocument();
    expect(screen.getByText('Ensemble homme premium')).toBeInTheDocument();
  });

  it('renders the four DivinExpress reassurance items without a company-logo cloud', () => {
    render(<CustomerTestimonials />);

    expect(screen.getByRole('heading', { name: 'Matières responsables' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Qualité garantie' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Livraison suivie' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sélection écoresponsable' })).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
