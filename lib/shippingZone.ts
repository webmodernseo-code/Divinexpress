export function resolveShippingZone(countryCode: string, zones: { countries: string[] }[]): number {
  return zones.findIndex((zone) => zone.countries.includes(countryCode));
}
