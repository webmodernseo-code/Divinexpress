import { describe, expect, it } from 'vitest';
import { parseLegalText } from '@/lib/legalText';

describe('parseLegalText', () => {
  it('returns a single plain segment when there is no placeholder', () => {
    expect(parseLegalText('Le Site est édité par Reign SAS.')).toEqual([
      { text: 'Le Site est édité par Reign SAS.', isPlaceholder: false }
    ]);
  });

  it('extracts a placeholder surrounded by plain text and drops the ** markers', () => {
    expect(parseLegalText('sous le numéro SIREN **à compléter**, dont le siège')).toEqual([
      { text: 'sous le numéro SIREN ', isPlaceholder: false },
      { text: 'à compléter', isPlaceholder: true },
      { text: ', dont le siège', isPlaceholder: false }
    ]);
  });

  it('handles several placeholders in one paragraph without merging them', () => {
    expect(parseLegalText('hébergé par **nom à compléter**, **adresse à compléter**.')).toEqual([
      { text: 'hébergé par ', isPlaceholder: false },
      { text: 'nom à compléter', isPlaceholder: true },
      { text: ', ', isPlaceholder: false },
      { text: 'adresse à compléter', isPlaceholder: true },
      { text: '.', isPlaceholder: false }
    ]);
  });

  it('handles a paragraph that is only a placeholder', () => {
    expect(parseLegalText('**à compléter**')).toEqual([{ text: 'à compléter', isPlaceholder: true }]);
  });

  it('leaves an unpaired ** marker alone rather than swallowing the rest of the text', () => {
    expect(parseLegalText('taxes ** incluses')).toEqual([{ text: 'taxes ** incluses', isPlaceholder: false }]);
  });
});
