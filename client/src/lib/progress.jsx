// progress.jsx — React binding for lib/progress.js, plus account sync.
//
// Local-first, always: progress.js (localStorage "ip_progress_v2") is the
// instant source of truth, so the app works fully as a guest. When you're
// logged in (lib/auth.jsx), this provider additionally:
//   • on login — GET the account progress, MERGE it with local (union:
//     completed/solved always wins, attempts keep the max, plan ticks
//     union, earliest plan start) so signing in never loses work, then
//     pushes the merged result back up;
//   • on every later change — debounced PUT of the whole progress object
//     (+ live-interview meta), with a syncState of
//     'guest' | 'syncing' | 'synced' | 'error' for the UI chip.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  getProgress, subscribe, replaceProgress,
  markArticle, markChapter, recordProblemAttempt, recordProblemSolved, saveProblemCode,
  togglePlanItem, startPlan,
} from './progress';
import { useAuth, apiFetch } from './auth.jsx';

const ProgressContext = createContext(null);

const actions = {
  markArticle, markChapter, recordProblemAttempt, recordProblemSolved, saveProblemCode,
  togglePlanItem, startPlan,
};

// Union-merge two progress objects (see header). Pure — easy to reason about.
export function mergeProgress(local, remote) {
  if (!remote) return local;
  const articles = {};
  for (const src of [remote.articles || {}, local.articles || {}]) {
    for (const [k, v] of Object.entries(src)) articles[k] = Math.max(articles[k] || 0, v || 0);
  }
  const chapters = {};
  for (const t of new Set([...Object.keys(local.chapters || {}), ...Object.keys(remote.chapters || {})])) {
    chapters[t] = {};
    for (const src of [remote.chapters?.[t] || {}, local.chapters?.[t] || {}]) {
      for (const [c, v] of Object.entries(src)) chapters[t][c] = Math.max(chapters[t][c] || 0, v || 0);
    }
  }
  const problems = {};
  for (const id of new Set([...Object.keys(local.problems || {}), ...Object.keys(remote.problems || {})])) {
    const a = local.problems?.[id];
    const b = remote.problems?.[id];
    if (!a) { problems[id] = b; continue; }
    if (!b) { problems[id] = a; continue; }
    const solved = Boolean(a.solved || b.solved);
    problems[id] = {
      solved,
      attempts: Math.max(a.attempts || 0, b.attempts || 0),
      solvedAt: [a.solvedAt, b.solvedAt].filter(Boolean).sort((x, y) => x - y)[0] || null,
      lastCode: (a.solved ? a.lastCode : '') || (b.solved ? b.lastCode : '') || a.lastCode || b.lastCode || '',
    };
  }
  const plans = {};
  for (const pid of new Set([...Object.keys(local.plans || {}), ...Object.keys(remote.plans || {})])) {
    plans[pid] = { ...(remote.plans?.[pid] || {}), ...(local.plans?.[pid] || {}) };
  }
  const planStart = {};
  for (const src of [remote.planStart || {}, local.planStart || {}]) {
    for (const [k, v] of Object.entries(src)) planStart[k] = planStart[k] && planStart[k] < v ? planStart[k] : v;
  }
  return { articles, chapters, problems, plans, planStart };
}

// Small summary of the locally-stored live-interview sessions, synced so
// the profile page can show "interviews taken / best band" anywhere.
function readLiveMeta() {
  try {
    const sessions = JSON.parse(localStorage.getItem('ip_live_sessions')) || [];
    if (!Array.isArray(sessions) || sessions.length === 0) return null;
    const best = sessions.reduce((m, s) => ((s.score || 0) > (m?.score ?? -1) ? s : m), null);
    return {
      taken: sessions.length,
      bestBand: best?.band || null,
      bestScore: best?.score || 0,
      lastDate: sessions[0]?.date || null,
    };
  } catch {
    return null;
  }
}

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(() => getProgress());
  const [syncState, setSyncState] = useState('guest');
  const { user } = useAuth();
  const pushTimer = useRef(null);
  const emailRef = useRef(null);

  const pushNow = async () => {
    try {
      await apiFetch('/api/progress', {
        method: 'PUT',
        body: { progress: getProgress(), liveSessionsMeta: readLiveMeta() },
      });
      setSyncState('synced');
    } catch {
      setSyncState('error');
    }
  };

  // On login: download, merge (never lose local work), push back.
  useEffect(() => {
    if (!user) {
      emailRef.current = null;
      setSyncState('guest');
      return;
    }
    if (emailRef.current === user.email) return;
    emailRef.current = user.email;
    let alive = true;
    (async () => {
      setSyncState('syncing');
      try {
        const remote = await apiFetch('/api/progress');
        if (!alive) return;
        const merged = mergeProgress(getProgress(), remote?.progress);
        replaceProgress(merged);
        await pushNow();
      } catch {
        if (alive) setSyncState('error');
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Keep React in sync with the store; when logged in, debounce-push.
  useEffect(() => subscribe(() => {
    setProgress({ ...getProgress() });
    if (!emailRef.current) return;
    setSyncState('syncing');
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => { pushNow(); }, 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  return (
    <ProgressContext.Provider value={{ progress, syncState, ...actions }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}
