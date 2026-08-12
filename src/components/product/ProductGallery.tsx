'use client';

import { useState } from 'react';
import { PlaceholderBlock } from '@/components/ui/PlaceholderBlock';
import { getProductImageUrl, type Product } from '@/lib/products';

/**
 * Desktop: thumbnail column on the left of the main image (flex `order`).
 * Mobile: main image capped and centered, thumbnails in a row underneath.
 */
export function ProductGallery({
  imageCount,
  productName,
  product,
  selectedColor,
  onChangeColor
}: {
  imageCount: number;
  productName: string;
  product?: Product;
  selectedColor?: string;
  onChangeColor?: (color: string) => void;
}) {
  const isYahweh = product && product.id === 'homme-hoodie-yahweh';
  const [localIndex, setLocalIndex] = useState(0);

  // If it's Yahweh, sync index with color index. Otherwise use local index state.
  const selectedIndex = isYahweh && selectedColor ? product.colors.indexOf(selectedColor) : 0;
  const activeIndex = isYahweh ? (selectedIndex !== -1 ? selectedIndex : 0) : localIndex;

  const handleSelectIndex = (index: number) => {
    if (isYahweh) {
      if (product && onChangeColor) {
        const color = product.colors[index];
        if (color) {
          onChangeColor(color);
        }
      }
    } else {
      setLocalIndex(index);
    }
  };

  const mediaImages = product?.images ?? [];
  const useMedia = mediaImages.length > 0;
  const imagesCount = useMedia ? mediaImages.length : isYahweh ? product.colors.length : imageCount;
  const images = Array.from({ length: imagesCount }, (_, index) => index);
  const activeImageUrl = useMedia
    ? mediaImages[activeIndex]
    : product ? getProductImageUrl(product, isYahweh ? product.colors[activeIndex] : product.colors[0]) : undefined;

  return (
    <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:gap-3.5">
      <PlaceholderBlock
        aspect="portrait"
        label={`${productName} — ${activeIndex + 1}/${images.length}`}
        imageUrl={activeImageUrl}
        className="order-1 w-full max-w-[260px] md:order-2 md:max-w-[340px]"
      />
      <div className="order-2 flex flex-shrink-0 justify-center gap-2.5 md:order-1 md:flex-col">
        {images.map((index) => {
          const imageUrl = useMedia
            ? mediaImages[index]
            : product ? getProductImageUrl(product, isYahweh ? product.colors[index] : product.colors[0]) : undefined;
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectIndex(index)}
              aria-label={`${productName} ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={`h-[70px] w-14 flex-shrink-0 overflow-hidden rounded-lg ${
                index === activeIndex ? 'outline-2 outline-offset-2 outline-accent' : ''
              }`}
            >
              <PlaceholderBlock
                aspect="portrait"
                label={String(index + 1)}
                imageUrl={imageUrl}
                className="h-full w-full"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
