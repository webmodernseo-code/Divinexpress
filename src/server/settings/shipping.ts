const STANDARD_SHIPPING_MINOR = 990;

export function shippingMinorFor(
  subtotalMinor: number,
  settings: { free_shipping_threshold_minor: number },
): number {
  return subtotalMinor >= settings.free_shipping_threshold_minor ? 0 : STANDARD_SHIPPING_MINOR;
}

export function freeShippingRemainingEur(subtotalEur: number, thresholdMinor: number): number {
  return Math.max(thresholdMinor / 100 - subtotalEur, 0);
}
