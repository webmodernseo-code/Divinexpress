'use client';

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
  if (region === 'europe') {
    return (
      <svg
        aria-hidden="true"
        data-region-icon="europe"
        viewBox="0 0 32 32"
        className="h-7 w-7"
        fill="none"
      >
        <path
          d="M5.5 7.2 9 4.8l3.1.7 2.5-2 3.8 1.2.8 2.8 4.5-.2 2.8 3-1.1 3.1-3.7.5-1.8 2.6 2.1 3.2-1.5 4.3-3.4-1-2.2 2.6-3.2-.8-1.9-3.6-3.4-.4-2.8-2.8-3.2.5-2.1-2.7-3 .6-1.9-2.4Z"
          fill="currentColor"
        />
        <path d="m18.6 22.3 2 1.8-1.1 3.1-2.6-.6-.8-2.7 2.5-1.6Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      data-region-icon="africa"
      viewBox="0 0 32 32"
      className="h-7 w-7"
      fill="none"
    >
      <path
        d="M8.1 5.4 13.7 3l7.5 1.1 4.7 4.8-1.4 5.6-3.2 2.7-1.7 5.5-3.1 6.2-3.2-2.7-1-5.8-3-3-3.2-6.1 2-5.9Z"
        fill="currentColor"
      />
    </svg>
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
