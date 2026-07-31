'use client';

import { useState } from 'react';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';

/**
 * Desktop: thumbnail column on the left of the main image (flex `order`).
 * Mobile: main image capped and centered, thumbnails in a row underneath.
 */
export function ProductGallery({ imageCount, productName }: { imageCount: number; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = Array.from({ length: imageCount }, (_, index) => index);

  return (
    <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:gap-3.5">
      <PlaceholderBlock
        aspect="portrait"
        label={`${productName} — ${activeIndex + 1}/${imageCount}`}
        className="order-1 w-full max-w-[260px] rounded-[22px] md:order-2 md:max-w-[340px]"
      />
      <div className="order-2 flex flex-shrink-0 justify-center gap-2.5 md:order-1 md:flex-col">
        {images.map((index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`${productName} ${index + 1}`}
            aria-pressed={activeIndex === index}
            className={`h-[70px] w-14 flex-shrink-0 overflow-hidden rounded-lg ${
              index === activeIndex ? 'outline-2 outline-offset-2 outline-accent' : ''
            }`}
          >
            <PlaceholderBlock aspect="portrait" label={String(index + 1)} className="h-full w-full" />
          </button>
        ))}
      </div>
    </div>
  );
}
