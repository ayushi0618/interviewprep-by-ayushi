// progress.js — the ONE progress store for the whole site (course track,
// DSA Sheet, study plans). Plain localStorage + a tiny pub/sub so React
// components re-render when anything changes.
//
// Shape (localStorage key "ip_progress_v2"):
//   {
//     articles:  { [slug]: timestamp },                  // topics marked fully complete
//     chapters:  { [slug]: { [chapterSlug]: timestamp } }, // per-chapter completion
//     problems:  { [id]: { solved, attempts, lastCode, solvedAt } },
//     plans:     { [planId]: { [itemKey]: true } },      // manual plan checks
//     planStart: { [planId]: 'YYYY-MM-DD' }              // "Start plan" dates
//   }
//
// Chapter completion (added with chapter-wise notes) NEVER rewrites
// existing data destructively: a topic whose `articles` flag is already
// set reads as "every chapter complete", and unmarking one chapter in
// that state materialises the others first so nothing else is lost.
// The `articles` flag is kept as an honest mirror — set exactly when a
// topic's chapters are all done — because older surfaces and the
// server-side profile stats read it.
//
// Older, separate keys (practice history, live sessions, route) are left
// untouched — this store only owns learning progress.
import { resolveChapter } from './chapters.js';

const KEY = 'ip_progress_v2';
const EMPTY = { articles: {}, chapters: {}, problems: {}, plans: {}, planStart: {} };

let cache = null;
const listeners = new Set();

function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    cache = { ...EMPTY, ...(parsed || {}) };
    // Fill any missing buckets for older saved shapes.
    for (const k of Object.keys(EMPTY)) if (!cache[k] || typeof cache[k] !== 'object') cache[k] = {};
  } catch {
    cache = { ...EMPTY };
  }
  return cache;
}

function persistAndNotify() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* storage full/blocked — progress just won't persist */ }
  for (const fn of [...listeners]) fn();
}

export function getProgress() {
  return load();
}

// Replace the whole local progress (used by the login merge in
// progress.jsx: local ∪ account progress becomes the new local truth,
// then gets pushed back up — so signing in can never lose work).
export function replaceProgress(next) {
  cache = { ...EMPTY, ...(next || {}) };
  for (const k of Object.keys(EMPTY)) if (!cache[k] || typeof cache[k] !== 'object') cache[k] = {};
  persistAndNotify();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// --- articles ---------------------------------------------------------------

export function markArticle(slug, done = true) {
  const p = load();
  if (done) p.articles[slug] = Date.now();
  else { delete p.articles[slug]; if (p.chapters) delete p.chapters[slug]; }
  persistAndNotify();
}

export function isArticleDone(p, slug) {
  return Boolean(p?.articles?.[slug]);
}

// --- chapters -----------------------------------------------------------------
// Chapter metadata ([{ slug, title }] per topic) is registered once by
// content/topics.js at import time; completion maths lives here so
// every surface (sidebar, Home, navbar, plans) agrees.

let chapterIndex = {};

export function registerChapters(index) {
  chapterIndex = index || {};
}

export function getChapterMeta(topicSlug) {
  return chapterIndex[topicSlug] || [];
}

export function isChapterDone(p, topicSlug, chapterSlug) {
  return Boolean(p?.articles?.[topicSlug] || p?.chapters?.[topicSlug]?.[chapterSlug]);
}

export function isTopicComplete(p, topicSlug) {
  const meta = getChapterMeta(topicSlug);
  if (!meta.length) return isArticleDone(p, topicSlug);
  return meta.every((c) => isChapterDone(p, topicSlug, c.slug));
}

export function topicChapterCounts(p, topicSlug) {
  const meta = getChapterMeta(topicSlug);
  return {
    done: meta.reduce((n, c) => n + (isChapterDone(p, topicSlug, c.slug) ? 1 : 0), 0),
    total: meta.length,
  };
}

export function courseChapterTotals(p, slugs) {
  return (slugs || Object.keys(chapterIndex)).reduce(
    (acc, s) => {
      const { done, total } = topicChapterCounts(p, s);
      return { done: acc.done + done, total: acc.total + total };
    },
    { done: 0, total: 0 },
  );
}

export function markChapter(topicSlug, chapterSlug, done = true) {
  const p = load();
  const meta = getChapterMeta(topicSlug);
  if (!p.chapters[topicSlug] || typeof p.chapters[topicSlug] !== 'object') p.chapters[topicSlug] = {};
  if (done) {
    p.chapters[topicSlug][chapterSlug] = Date.now();
  } else if (p.articles[topicSlug]) {
    // Topic was completed as a whole (legacy flag, no per-chapter data):
    // materialise every other chapter first so unmarking ONE chapter
    // keeps the rest complete instead of nuking the topic.
    const ts = p.articles[topicSlug];
    for (const c of meta) {
      if (c.slug !== chapterSlug && !p.chapters[topicSlug][c.slug]) p.chapters[topicSlug][c.slug] = ts;
    }
    delete p.chapters[topicSlug][chapterSlug];
    delete p.articles[topicSlug];
  } else {
    delete p.chapters[topicSlug][chapterSlug];
  }
  // Keep the whole-topic flag an honest mirror (older surfaces + the
  // server-side profile stats read it).
  if (meta.length && meta.every((c) => isChapterDone(p, topicSlug, c.slug)) && !p.articles[topicSlug]) {
    p.articles[topicSlug] = Date.now();
  }
  persistAndNotify();
}

// --- DSA problems -------------------------------------------------------------

export function recordProblemAttempt(id) {
  const p = load();
  const prev = p.problems[id] || { solved: false, attempts: 0, lastCode: '', solvedAt: null };
  p.problems[id] = { ...prev, attempts: (prev.attempts || 0) + 1 };
  persistAndNotify();
}

export function saveProblemCode(id, code) {
  const p = load();
  const prev = p.problems[id] || { solved: false, attempts: 0, lastCode: '', solvedAt: null };
  p.problems[id] = { ...prev, lastCode: code };
  persistAndNotify();
}

export function recordProblemSolved(id, code) {
  const p = load();
  const prev = p.problems[id] || { solved: false, attempts: 0, lastCode: '', solvedAt: null };
  p.problems[id] = {
    ...prev,
    solved: true,
    solvedAt: prev.solvedAt || Date.now(),
    lastCode: code ?? prev.lastCode ?? '',
  };
  persistAndNotify();
}

export function isProblemSolved(p, id) {
  return Boolean(p?.problems?.[id]?.solved);
}

// --- study plans --------------------------------------------------------------

export function togglePlanItem(planId, itemKey) {
  const p = load();
  if (!p.plans[planId]) p.plans[planId] = {};
  if (p.plans[planId][itemKey]) delete p.plans[planId][itemKey];
  else p.plans[planId][itemKey] = true;
  persistAndNotify();
}

export function isPlanItemChecked(p, planId, itemKey) {
  return Boolean(p?.plans?.[planId]?.[itemKey]);
}

export function startPlan(planId) {
  const p = load();
  if (!p.planStart[planId]) p.planStart[planId] = new Date().toISOString().slice(0, 10);
  persistAndNotify();
}

// Is one plan item "done"? Manual checkbox always counts; some types also
// auto-complete from the rest of the site so learners never tick the same
// work twice: 'article' completes when the guide is finished (whole-flag
// or every chapter), 'section' completes when ITS chapter is done (the
// label resolves to a chapter via lib/chapters.js; unresolvable labels
// keep the old whole-guide rule), 'problem' when the problem is solved.
export function isPlanItemDone(p, plan, item) {
  if (isPlanItemChecked(p, plan.id, item.key)) return true;
  if (!p) return false;
  if (item.type === 'article') return isArticleDone(p, item.ref) || isTopicComplete(p, item.ref);
  if (item.type === 'section') {
    const chapter = resolveChapter(getChapterMeta(item.ref), item.label);
    if (chapter) return isChapterDone(p, item.ref, chapter.slug);
    return isArticleDone(p, item.ref);
  }
  if (item.type === 'problem') return isProblemSolved(p, item.ref);
  return false; // practice / playground / interview / task → manual tick
}

// --- derived counts -------------------------------------------------------------

export function articleDoneCount(p, slugs) {
  return slugs.reduce((n, s) => n + (isArticleDone(p, s) ? 1 : 0), 0);
}

export function problemSolvedCount(p, ids) {
  return ids.reduce((n, id) => n + (isProblemSolved(p, id) ? 1 : 0), 0);
}
