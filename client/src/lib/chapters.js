// chapters.js — carve a guide's markdown into chapters (one chapter =
// one page). A chapter is one top-level `## ` section; everything before
// the first H2 (the H1 + intro) becomes the "Introduction" chapter.
// Chapter slugs derive from the heading text via lib/slug.js, so study
// plans that name a section resolve to the same chapter on both sides.
// Each chapter also records its `### ` sub-sections: plan labels often
// name a sub-section, and resolving one means completing its chapter.
import { slugifyHeading, matchTokens } from './slug.js';

// Display title for lists: strip markdown marks + leading emoji/symbols,
// keep the numbering ("11. The Event Loop" reads fine in a syllabus).
export function chapterTitle(headingText) {
  return (
    String(headingText || '')
      .replace(/[*_`]/g, '')
      .replace(/^[^A-Za-z0-9]+/, '')
      .trim() || 'Chapter'
  );
}

function estimateMinutes(md) {
  const words = String(md || '').split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 180));
}

// `### ` sub-headings inside one chapter's markdown (fence-aware).
function subSections(md) {
  const subs = [];
  let inFence = false;
  for (const line of String(md || '').split('\n')) {
    if (/^\s{0,3}```/.test(line)) inFence = !inFence;
    const m = !inFence && line.match(/^###\s+(.*)$/);
    if (m) subs.push({ slug: slugifyHeading(m[1].trim()), title: chapterTitle(m[1].trim()) });
  }
  return subs;
}

// splitChapters(markdown) → [{ slug, title, markdown, minutes, subs }]
// Fence-aware: a `## ` inside a code block is content, not a chapter.
// Duplicate slugs within one guide get -2, -3 suffixes in order.
export function splitChapters(markdown) {
  const text = String(markdown ?? '').replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  const raw = [];
  let current = { heading: null, lines: [] };
  let inFence = false;
  for (const line of lines) {
    if (/^\s{0,3}```/.test(line)) inFence = !inFence;
    const m = !inFence && line.match(/^##\s+(.*)$/);
    if (m) {
      raw.push(current);
      current = { heading: m[1].trim(), lines: [line] };
    } else {
      current.lines.push(line);
    }
  }
  raw.push(current);

  const parts = raw.filter((c, i) => i > 0 || c.lines.join('\n').trim().length > 0);
  const seen = new Map();
  return parts
    .map((c) => {
      const isIntro = c.heading === null;
      let slug = isIntro ? 'introduction' : slugifyHeading(c.heading);
      const n = (seen.get(slug) || 0) + 1;
      seen.set(slug, n);
      if (n > 1) slug = `${slug}-${n}`;
      const md = c.lines.join('\n').trim();
      return {
        slug,
        title: isIntro ? 'Introduction' : chapterTitle(c.heading),
        markdown: md,
        minutes: estimateMinutes(md),
        subs: subSections(md),
      };
    })
    .filter((c) => c.markdown.length > 0);
}

// ---------------------------------------------------------------------------
// resolveChapter(chapters, label) → chapter | null
//
// Maps a study-plan section label to the guide chapter it means, in
// widening tiers (numbering-insensitive throughout — plan labels rarely
// carry the guide's "📌 11." numbering):
//   1. exact slug (or slug minus its leading numbering token)
//   2. slug prefix, either direction
//   3. chapter title minus "(…)" as prefix, either direction
//   4. token subset (chapter's words all inside the label's words)
//   5. the same tiers against each chapter's `### ` sub-sections —
//      a hit returns the PARENT chapter
//   6. a 3-token phrase from the chapter/sub inside the label, or back
//   7. best token overlap (Jaccard ≥ 0.34, ≥ 2 shared words)
// Null means "fall back to the whole-guide rule" (pre-chapter behaviour).
// ---------------------------------------------------------------------------
const coreSlug = (slug) => String(slug || '').replace(/^\d+[a-z]?-/, '');

function matchOne(candidates, target) {
  // candidates: [{ slug, title, hit }] — `hit` is what to return.
  const tCore = coreSlug(target);
  for (const c of candidates) {
    if (c.slug === target || coreSlug(c.slug) === tCore) return c.hit;
  }
  for (const c of candidates) {
    const s = coreSlug(c.slug);
    if (s && (tCore.startsWith(`${s}-`) || s.startsWith(`${tCore}-`))) return c.hit;
  }
  const shortTitle = (title) => coreSlug(slugifyHeading(String(title || '').replace(/\([^)]*\)/g, ' ')));
  for (const c of candidates) {
    const s = shortTitle(c.title);
    if (s && s !== 'chapter' && (tCore === s || tCore.startsWith(`${s}-`) || s.startsWith(`${tCore}-`))) return c.hit;
  }
  const tTokens = matchTokens(target);
  if (!tTokens.size) return null;
  let subset = null;
  let subsetSize = 0;
  for (const c of candidates) {
    const cTokens = matchTokens(c.slug);
    if (!cTokens.size) continue;
    const allIn = [...cTokens].every((t) => tTokens.has(t));
    const ok = cTokens.size >= 2 ? allIn : allIn && [...cTokens][0].length >= 4;
    if (ok && cTokens.size > subsetSize) { subset = c; subsetSize = cTokens.size; }
  }
  if (subset) return subset.hit;
  // Lead-phrase: the candidate's first two content words appear
  // contiguously in the label ("Deep-dive: dynamic programming — …").
  for (const c of candidates) {
    const toks = coreSlug(c.slug).split('-').filter(Boolean);
    if (toks.length >= 2 && `-${tCore}-`.includes(`-${toks[0]}-${toks[1]}-`)) return c.hit;
  }
  // 3-token phrase containment, either direction.
  const windows = (slug) => {
    const toks = coreSlug(slug).split('-').filter(Boolean);
    const out = new Set();
    for (let i = 0; i + 3 <= toks.length; i++) out.add(toks.slice(i, i + 3).join('-'));
    return out;
  };
  const tWin = windows(target);
  for (const c of candidates) {
    const cWin = windows(c.slug);
    for (const w of tWin) if (cWin.has(w)) return c.hit;
    const tStr = `-${tCore}-`;
    for (const w of cWin) if (tStr.includes(`-${w}-`)) return c.hit;
  }
  // Best token overlap.
  let best = null;
  let bestScore = 0;
  for (const c of candidates) {
    const cTokens = matchTokens(c.slug);
    let inter = 0;
    for (const t of cTokens) if (tTokens.has(t)) inter += 1;
    const union = new Set([...cTokens, ...tTokens]).size;
    const score = union ? inter / union : 0;
    if (inter >= 2 && score > bestScore) { bestScore = score; best = c; }
  }
  return bestScore >= 0.34 ? best.hit : null;
}

export function resolveChapter(chapters, label) {
  if (!Array.isArray(chapters) || !chapters.length || !label) return null;
  const target = slugifyHeading(label);
  if (!target || target === 'chapter') return null;

  const byChapter = matchOne(chapters.map((c) => ({ slug: c.slug, title: c.title, hit: c })), target);
  if (byChapter) return byChapter;

  const subCandidates = [];
  for (const c of chapters) {
    for (const s of c.subs || []) subCandidates.push({ slug: s.slug, title: s.title, hit: c });
  }
  if (subCandidates.length) {
    const bySub = matchOne(subCandidates, target);
    if (bySub) return bySub;
  }
  return null;
}
