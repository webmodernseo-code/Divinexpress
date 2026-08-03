import { render, screen } from '@testing-library/react';
import { TrendingUp } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { AdminButton } from './AdminButton';
import { MetricCard } from './MetricCard';
import { StatusBadge } from './StatusBadge';

describe('admin primitives', () => {
  it('renders a loading button accessibly', () => {
    render(<AdminButton loading>Enregistrer</AdminButton>);
    const button = screen.getByRole('button', { name: /enregistrer/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('renders a semantic status label', () => {
    render(<StatusBadge tone="success">Payée</StatusBadge>);
    expect(screen.getByText('Payée')).toHaveAttribute('data-tone', 'success');
  });

  it('renders a metric with its trend', () => {
    render(
      <MetricCard
        label="Chiffre d'affaires"
        value="18 420 €"
        trend="+12,4 %"
        icon={TrendingUp}
      />
    );
    expect(screen.getByText("Chiffre d'affaires")).toBeVisible();
    expect(screen.getByText('+12,4 %')).toBeVisible();
  });
});
