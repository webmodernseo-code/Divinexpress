/**
 * Legal copy (Tâche 27) marks the fields the brand still has to fill in — SIREN, registered
 * address, host name… — by wrapping them in `**…**` inside the message strings, e.g.
 * "…sous le numéro SIREN **à compléter**, dont…".
 *
 * This is NOT markdown: it is a single, deliberate convention so `LegalPageLayout` can
 * highlight those pending fields instead of printing literal asterisks. The `**` markers are
 * always consumed; only the wording between them survives, so "à compléter" stays visible.
 */
export interface LegalTextSegment {
  text: string;
  isPlaceholder: boolean;
}

const PLACEHOLDER_PATTERN = /\*\*(.+?)\*\*/g;

/** Splits a legal paragraph into plain and `**placeholder**` segments, in source order. */
export function parseLegalText(text: string): LegalTextSegment[] {
  const segments: LegalTextSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(PLACEHOLDER_PATTERN)) {
    const start = match.index ?? cursor;

    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), isPlaceholder: false });
    }

    segments.push({ text: match[1], isPlaceholder: true });
    cursor = start + match[0].length;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isPlaceholder: false });
  }

  return segments;
}
