import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductGridState } from './ProductGridState';

describe('ProductGridState', () => {
  it('renders a useful empty state without product cards', () => {
    render(
      <ProductGridState
        products={[]}
        emptyTitle="Aucun résultat"
        emptyBody="Essayez un autre terme."
      />,
    );

    expect(screen.getByRole('heading', { name: 'Aucun résultat' })).toBeVisible();
    expect(screen.getByText('Essayez un autre terme.')).toBeVisible();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });
});
