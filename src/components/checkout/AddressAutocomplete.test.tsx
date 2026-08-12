import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AddressAutocomplete } from './AddressAutocomplete';

const feature = {
  properties: {
    name: '1 Rue de Rivoli',
    housenumber: '1',
    street: 'Rue de Rivoli',
    city: 'Paris',
    postcode: '75001',
    country: 'France',
    countrycode: 'fr'
  }
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ features: [feature] }) }))
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('AddressAutocomplete', () => {
  it('shows suggestions after debounce and returns a mapped selection on click', async () => {
    const onSelect = vi.fn();
    render(
      <AddressAutocomplete
        value=""
        locale="fr"
        label="Adresse"
        onInputChange={() => {}}
        onSelect={onSelect}
      />
    );

    fireEvent.change(screen.getByLabelText('Adresse'), { target: { value: 'rue de riv' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    const option = screen.getByText(/Rue de Rivoli/);
    fireEvent.click(option);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ address: '1 Rue de Rivoli', city: 'Paris', postalCode: '75001', countryCode: 'FR' })
    );
  });

  it('does not query for fewer than 3 characters', async () => {
    render(
      <AddressAutocomplete value="" locale="fr" label="Adresse" onInputChange={() => {}} onSelect={() => {}} />
    );

    fireEvent.change(screen.getByLabelText('Adresse'), { target: { value: 'ru' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(fetch).not.toHaveBeenCalled();
  });
});
