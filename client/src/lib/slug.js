// slug.js — turn a guide heading ("📌 11. The Event Loop") or a study-plan
// label ("The event loop — the four players") into ONE canonical slug.
// Headings and labels go through the exact same normalisation, so plan
// items resolve to chapters without a hand-maintained mapping table.

export function slugifyHeading(text) {
  return (
    String(text || '')
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/'/g, '')
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'chapter'
  );
}

// Tokens used ONLY for fuzzy matching (never for URLs): numbering tokens
// like "1", "11" or "6c" are dropped, since plan labels rarely carry the
// guide's numbering.
export function matchTokens(slug) {
  return new Set(
    String(slug || '')
      .split('-')
      .filter((t) => t && !/^\d+[a-z]?$/.test(t)),
  );
}
