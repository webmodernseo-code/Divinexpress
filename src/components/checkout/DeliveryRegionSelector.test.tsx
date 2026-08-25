import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DeliveryRegionSelector } from './DeliveryRegionSelector';

describe('DeliveryRegionSelector', () => {
  it('exposes two distinct region choices and marks the selected one', () => {
    render(
      <DeliveryRegionSelector
        value="europe"
        onChange={vi.fn()}
        groupLabel="Zone de livraison"
        europeLabel="Europe"
        africaLabel="Afrique"
      />
    );

    expect(screen.getByRole('group', { name: 'Zone de livraison' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Europe' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Afrique' })).toHaveAttribute('aria-pressed', 'false');
    const europeIcon = document.querySelector('[data-region-icon="europe"]');
    const africaIcon = document.querySelector('[data-region-icon="africa"]');
    expect(europeIcon).toBeInTheDocument();
    expect(africaIcon).toBeInTheDocument();
    expect(europeIcon).toHaveAttribute('aria-hidden', 'true');
    expect(africaIcon).toHaveAttribute('aria-hidden', 'true');
    expect(europeIcon?.querySelector('path')?.getAttribute('d')).not.toBe(
      africaIcon?.querySelector('path')?.getAttribute('d')
    );
  });

  it('notifies the parent when the customer selects another region', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DeliveryRegionSelector
        value="europe"
        onChange={onChange}
        groupLabel="Zone de livraison"
        europeLabel="Europe"
        africaLabel="Afrique"
      />
    );

    await user.click(screen.getByRole('button', { name: 'Afrique' }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('africa');
  });
});
