export function parsePage(searchParams: URLSearchParams): number {
  const raw = Number(searchParams.get('page'));
  return Number.isInteger(raw) && raw > 0 ? raw : 1;
}

export function pageHref(searchParams: URLSearchParams, page: number): string {
  const next = new URLSearchParams(searchParams);
  if (page <= 1) {
    next.delete('page');
  } else {
    next.set('page', String(page));
  }
  return `?${next.toString()}`;
}
