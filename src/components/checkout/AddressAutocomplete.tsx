'use client';

import { useEffect, useRef, useState } from 'react';

export interface AddressSelection {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  countryCode: string;
}

interface PhotonProperties {
  name?: string;
  housenumber?: string;
  street?: string;
  city?: string;
  town?: string;
  village?: string;
  postcode?: string;
  country?: string;
  countrycode?: string;
}

interface PhotonFeature {
  properties?: PhotonProperties;
}

function mapFeature(feature: PhotonFeature): AddressSelection {
  const p = feature.properties ?? {};
  const address = [p.housenumber, p.street ?? p.name].filter(Boolean).join(' ') || (p.name ?? '');
  return {
    address,
    city: p.city ?? p.town ?? p.village ?? '',
    postalCode: p.postcode ?? '',
    country: p.country ?? '',
    countryCode: (p.countrycode ?? '').toUpperCase()
  };
}

function suggestionLabel(sel: AddressSelection): string {
  const locality = [sel.postalCode, sel.city].filter(Boolean).join(' ');
  return [sel.address, locality, sel.country].filter(Boolean).join(', ');
}

/**
 * Address field with live suggestions from Photon (OpenStreetMap) — free, no API
 * key, CORS-enabled. Debounced, aborts stale requests, and degrades to manual
 * entry when the service returns nothing or fails.
 */
export function AddressAutocomplete({
  value,
  locale,
  label,
  onInputChange,
  onSelect,
  error,
  hint,
  attribution
}: {
  value: string;
  locale: 'fr' | 'en';
  label: string;
  onInputChange: (text: string) => void;
  onSelect: (selection: AddressSelection) => void;
  error?: string;
  hint?: string;
  attribution?: string;
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSelection[]>([]);
  const [open, setOpen] = useState(false);
  const shouldSearch = useRef(false);

  useEffect(() => {
    if (!shouldSearch.current) return;
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lang=${locale}&limit=5`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { features?: PhotonFeature[] };
        setSuggestions(Array.isArray(data.features) ? data.features.map(mapFeature) : []);
        setOpen(true);
      } catch {
        // Aborted or network error: keep silent, manual entry stays possible.
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale]);

  function handleSelect(selection: AddressSelection) {
    shouldSearch.current = false;
    setQuery(selection.address);
    setSuggestions([]);
    setOpen(false);
    onSelect(selection);
    onInputChange(selection.address);
  }

  return (
    <div className="relative">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        type="text"
        autoComplete="off"
        aria-label={label}
        value={query}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'address-error' : undefined}
        onChange={(event) => {
          shouldSearch.current = true;
          setQuery(event.target.value);
          onInputChange(event.target.value);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          // Delay so a click on a suggestion registers before the list closes.
          setTimeout(() => setOpen(false), 150);
        }}
        className="h-12 w-full rounded-xl border border-mist-200 bg-paper px-4 text-sm outline-none focus:border-ink"
      />
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-mist-200 bg-paper shadow-lg"
        >
          {suggestions.map((sel, index) => (
            <li key={`${sel.address}-${sel.postalCode}-${index}`} role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(sel)}
                className="block w-full px-4 py-2.5 text-left text-sm hover:bg-mist-50"
              >
                {suggestionLabel(sel)}
              </button>
            </li>
          ))}
        </ul>
      )}
      {hint && <span className="mt-1 block text-xs text-mist-500">{hint}</span>}
      {attribution && <span className="mt-1 block text-[10px] text-mist-400">{attribution}</span>}
      {error && (
        <span id="address-error" className="mt-1 block text-xs text-accent">
          {error}
        </span>
      )}
    </div>
  );
}
