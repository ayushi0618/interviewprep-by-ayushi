// progress.js — the ONE progress store for the whole site (course track,
// DSA Sheet, study plans). Plain localStorage + a tiny pub/sub so React
// components re-render when anything changes.
//
// Shape (localStorage key "ip_progress_v2"):
//   {
//     articles:  { [slug]: timestamp },                  // notes marked complete
//     problems:  { [id]: { solved, attempts, lastCode, solvedAt } },
//     plans:     { [planId]: { [itemKey]: true } },      // manual plan checks
//     planStart: { [planId]: 'YYYY-MM-DD' }              // "Start plan" dates
//   }
//
// Older, separate keys (practice history, live sessions, route) are left
// untouched — this store only owns learning progress.

const KEY = 'ip_progress_v2';
const EMPTY = { articles: {}, problems: {}, plans: {}, planStart: {} };

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
  else delete p.articles[slug];
  persistAndNotify();
}

export function isArticleDone(p, slug) {
  return Boolean(p?.articles?.[slug]);
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
// auto-complete from the rest of the site (finished the article, solved the
// problem) so learners never tick the same work twice.
export function isPlanItemDone(p, plan, item) {
  if (isPlanItemChecked(p, plan.id, item.key)) return true;
  if (!p) return false;
  if (item.type === 'article' || item.type === 'section') return isArticleDone(p, item.ref);
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
