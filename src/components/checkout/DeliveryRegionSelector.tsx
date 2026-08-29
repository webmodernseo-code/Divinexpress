'use client';

import { FaEarthAfrica, FaEarthEurope } from 'react-icons/fa6';

export type DeliveryRegion = 'europe' | 'africa';

type DeliveryRegionSelectorProps = {
  value: DeliveryRegion;
  onChange: (region: DeliveryRegion) => void;
  groupLabel: string;
  europeLabel: string;
  africaLabel: string;
};

const REGIONS = ['europe', 'africa'] as const;

function RegionIcon({ region }: { region: DeliveryRegion }) {
  const Icon = region === 'europe' ? FaEarthEurope : FaEarthAfrica;
  return (
    <Icon
      aria-hidden="true"
      data-region-icon={region}
      data-testid={`region-icon-${region}`}
      className="h-7 w-7"
    />
  );
}

export function DeliveryRegionSelector({
  value,
  onChange,
  groupLabel,
  europeLabel,
  africaLabel
}: DeliveryRegionSelectorProps) {
  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="grid grid-cols-2 gap-3 sm:max-w-md"
    >
      {REGIONS.map((region) => {
        const selected = value === region;
        const label = region === 'europe' ? europeLabel : africaLabel;

        return (
          <button
            key={region}
            type="button"
            onClick={() => onChange(region)}
            aria-pressed={selected}
            className={`flex min-h-20 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
              selected
                ? 'border-ink bg-ink text-paper shadow-sm'
                : 'border-mist-200 bg-paper text-ink hover:border-ink'
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                selected ? 'bg-paper/15' : 'bg-mist-100'
              }`}
            >
              <RegionIcon region={region} />
            </span>
            <span className="text-sm font-semibold">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
