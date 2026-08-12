'use client';

import { useEffect, useRef, useState } from 'react';

const BURSTS = [
  { x: '18%', y: '55%', delay: 0 },
  { x: '52%', y: '15%', delay: 160 },
  { x: '82%', y: '50%', delay: 320 }
];
const COLORS = ['#22c55e', '#4ade80', '#fbbf24', '#ffffff'];
const PARTICLES_PER_BURST = 10;

/** One-shot CSS firework bursts, shown briefly when free shipping unlocks. */
function Fireworks() {
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-8 bottom-0 z-20 overflow-visible" aria-hidden="true">
      {BURSTS.map((burst, burstIndex) => (
        <div key={burstIndex} className="absolute size-0" style={{ left: burst.x, top: burst.y }}>
          {Array.from({ length: PARTICLES_PER_BURST }).map((_, particleIndex) => {
            const angle = (particleIndex / PARTICLES_PER_BURST) * 2 * Math.PI;
            const distance = 24 + (particleIndex % 3) * 9;
            return (
              <span
                key={particleIndex}
                className="firework-particle"
                style={
                  {
                    '--tx': `${Math.cos(angle) * distance}px`,
                    '--ty': `${Math.sin(angle) * distance}px`,
                    background: COLORS[(burstIndex + particleIndex) % COLORS.length],
                    animationDelay: `${burst.delay}ms`
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * Free-shipping progress bar. The fill shifts dark → amber → green as the cart
 * approaches the threshold, and a short firework burst plays when it unlocks.
 */
export function FreeShippingProgress({
  subtotalEur,
  threshold,
  className = ''
}: {
  subtotalEur: number;
  threshold: number;
  className?: string;
}) {
  const progress = Math.min((subtotalEur / threshold) * 100, 100);
  const unlocked = subtotalEur >= threshold;
  const fillClass = unlocked
    ? 'shimmer-progress-unlocked'
    : progress >= 50
      ? 'shimmer-progress-mid'
      : 'shimmer-progress';

  const [celebrate, setCelebrate] = useState(false);
  const wasUnlocked = useRef(unlocked);

  useEffect(() => {
    if (unlocked && !wasUnlocked.current) {
      setCelebrate(true);
      const timer = setTimeout(() => setCelebrate(false), 1600);
      wasUnlocked.current = unlocked;
      return () => clearTimeout(timer);
    }
    wasUnlocked.current = unlocked;
  }, [unlocked]);

  return (
    <div className={`relative ${className}`}>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-neutral-200 shadow-inner"
        role="progressbar"
        aria-label="Free delivery progress"
        aria-valuemin={0}
        aria-valuemax={threshold}
        aria-valuenow={Math.min(subtotalEur, threshold)}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${fillClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {celebrate && <Fireworks />}
    </div>
  );
}
