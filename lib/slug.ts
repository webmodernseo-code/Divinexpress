export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function dedupeSlug(base: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(base)) return base;
  let attempt = 2;
  while (existingSlugs.includes(`${base}-${attempt}`)) {
    attempt += 1;
  }
  return `${base}-${attempt}`;
}
