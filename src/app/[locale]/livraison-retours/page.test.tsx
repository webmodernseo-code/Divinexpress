import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ShippingReturnsContent } from './ShippingReturnsContent';

describe('ShippingReturnsContent', () => {
  it('renders the configured threshold and return period', () => {
    render(<ShippingReturnsContent locale="fr" thresholdMinor={17500} returnPeriodDays={30} />);
    expect(screen.getByText(/175,00/)).toBeVisible();
    expect(screen.getByText(/30 jours/)).toBeVisible();
  });
});
