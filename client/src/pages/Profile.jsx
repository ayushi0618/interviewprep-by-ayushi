import { useMemo, useState } from 'react';
import { TOPICS } from '../content/topics';
import { PROBLEMS, DSA_TOPICS, problemsByTopic } from '../data/dsaSheet';
import { PLANS, planItemCount } from '../data/plans';
import { useAuth, apiFetch } from '../lib/auth.jsx';
import { useProgress } from '../lib/progress.jsx';
import { isProblemSolved, isPlanItemDone, isTopicComplete, courseChapterTotals, problemSolvedCount } from '../lib/progress';

// Profile page: who you are + everything you've done — guides completed,
// sheet problems (per-topic bars), plans in progress, live-interview
// history — plus name edit, password change and the sync status.
export default function Profile({ onAuth, onNotes, onSheet, onPlans, onMock, onHome }) {
  const { user, logout, refreshUser } = useAuth();
  const { progress, syncState } = useProgress();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameMsg, setNameMsg] = useState('');
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [busy, setBusy] = useState(false);

  const liveSessions = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('ip_live_sessions')) || []; } catch { return []; }
  }, []);
  const bestSession = liveSessions.reduce((m, s) => ((s.score || 0) > (m?.score ?? -1) ? s : m), null);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="max-w-lg mx-auto text-center bg-white rounded-3xl border border-brand-100 shadow-card p-8">
          <div className="text-4xl">👋</div>
          <h1 className="text-2xl font-extrabold text-brand-900 mt-3">You’re browsing as a guest</h1>
          <p className="text-slate-600 mt-2 leading-relaxed">
            Everything works in guest mode — your progress is saved on this device.
            Create a free profile to sync it across devices and see it all in one place.
          </p>
          <button onClick={onAuth} className="btn-primary mt-5">Login / Create profile →</button>
        </div>
      </div>
    );
  }

  const initials = user.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  const chTotals = courseChapterTotals(progress, TOPICS.map((t) => t.slug));
  const guidesDone = TOPICS.filter((t) => isTopicComplete(progress, t.slug)).length;
  const solvedCount = problemSolvedCount(progress, PROBLEMS.map((p) => p.id));

  const plansInProgress = PLANS
    .map((plan) => {
      const total = planItemCount(plan);
      const doneN = plan.chapters.flatMap((c) => c.items).filter((it) => isPlanItemDone(progress, plan, it)).length;
      const started = Boolean(progress.planStart?.[plan.id]) || doneN > 0;
      return { plan, total, doneN, started, pct: total ? Math.round((doneN / total) * 100) : 0 };
    })
    .filter((x) => x.started);

  const saveName = async () => {
    setBusy(true); setNameMsg('');
    try {
      await apiFetch('/api/profile', { method: 'PUT', body: { name: nameDraft.trim() } });
      await refreshUser();
      setEditingName(false);
      setNameMsg('Name updated ✓');
    } catch (e) { setNameMsg(e.message); } finally { setBusy(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setBusy(true); setPwMsg(''); setPwErr('');
    try {
      await apiFetch('/api/profile/password', { method: 'PUT', body: { currentPassword: curPw, newPassword: newPw } });
      setCurPw(''); setNewPw('');
      setPwMsg('Password changed ✓');
    } catch (err) { setPwErr(err.message); } finally { setBusy(false); }
  };

  const syncLabel = {
    synced: '☁️ Synced ✓',
    syncing: '☁️ Syncing…',
    error: '⚠️ Sync paused — will retry on your next tick',
    guest: 'Guest mode',
  }[syncState] || '';

  const statCard = 'bg-white rounded-2xl border border-brand-100 shadow-card p-5';
  const meter = (doneN, total) => (
    <div className="h-2 rounded-full bg-brand-100 overflow-hidden mt-2">
      <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${total ? (doneN / total) * 100 : 0}%` }} />
    </div>
  );

  return (
    <div className="page-container page-y">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-brand-100 shadow-card p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5">
        <span className="w-20 h-20 rounded-3xl bg-brand-600 text-white grid place-items-center text-3xl font-extrabold shadow-card shrink-0">
          {initials}
        </span>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex flex-wrap items-center gap-2">
              <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus
                className="rounded-xl border border-brand-200 px-4 py-2.5 text-lg font-bold outline-none focus:ring-2 focus:ring-brand-400" />
              <button onClick={saveName} disabled={busy} className="btn-primary !px-4 !py-2 text-sm">Save</button>
              <button onClick={() => setEditingName(false)} className="btn-outline !px-4 !py-2 text-sm">Cancel</button>
            </div>
          ) : (
            <h1 className="text-2xl md:text-3xl font-extrabold text-brand-900 flex flex-wrap items-center gap-3">
              {user.name}
              <button onClick={() => { setNameDraft(user.name); setEditingName(true); setNameMsg(''); }}
                className="text-sm font-bold text-brand-700 underline underline-offset-2 hover:text-brand-600">Edit name</button>
            </h1>
          )}
          {nameMsg && <p className="text-sm font-semibold text-brand-700 mt-1">{nameMsg}</p>}
          <p className="text-slate-600 mt-1">{user.email}</p>
          <p className="text-sm text-slate-500">Member since {memberSince} · <span className="font-semibold text-brand-700">{syncLabel}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onNotes} className="btn-primary text-sm">Continue learning →</button>
          <button onClick={() => { logout(); onHome(); }} className="btn-outline text-sm">Logout</button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <div className={statCard}>
          <p className="text-3xl font-extrabold text-brand-900">{chTotals.done}<span className="text-lg text-slate-400">/{chTotals.total}</span></p>
          <p className="text-sm font-bold text-slate-600 mt-0.5">📚 Chapters completed · {guidesDone}/{TOPICS.length} guides</p>
          {meter(chTotals.done, chTotals.total)}
          <button onClick={onNotes} className="text-sm font-bold text-brand-700 mt-3 hover:text-brand-600">Open the course track →</button>
        </div>
        <div className={statCard}>
          <p className="text-3xl font-extrabold text-brand-900">{solvedCount}<span className="text-lg text-slate-400">/{PROBLEMS.length}</span></p>
          <p className="text-sm font-bold text-slate-600 mt-0.5">🧩 DSA problems solved</p>
          {meter(solvedCount, PROBLEMS.length)}
          <button onClick={onSheet} className="text-sm font-bold text-brand-700 mt-3 hover:text-brand-600">Open the DSA Sheet →</button>
        </div>
        <div className={statCard}>
          <p className="text-3xl font-extrabold text-brand-900">{plansInProgress.length}</p>
          <p className="text-sm font-bold text-slate-600 mt-0.5">📋 Study plans in progress</p>
          {plansInProgress.slice(0, 2).map(({ plan, pct }) => (
            <p key={plan.id} className="text-sm text-slate-600 mt-1.5 truncate">{plan.emoji} {plan.title} · <strong className="text-brand-800">{pct}%</strong></p>
          ))}
          <button onClick={onPlans} className="text-sm font-bold text-brand-700 mt-3 hover:text-brand-600">Browse study plans →</button>
        </div>
        <div className={statCard}>
          <p className="text-3xl font-extrabold text-brand-900">{liveSessions.length}</p>
          <p className="text-sm font-bold text-slate-600 mt-0.5">🎤 Live interviews taken</p>
          <p className="text-sm text-slate-600 mt-1.5">
            {bestSession ? <>Best: <strong className="text-brand-800">{bestSession.band}</strong> ({bestSession.score}%)</> : 'No sessions yet — Ananya is waiting.'}
          </p>
          <button onClick={onMock} className="text-sm font-bold text-brand-700 mt-3 hover:text-brand-600">Enter the mock room →</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4 items-start">
        {/* Per-topic DSA bars */}
        <div className={statCard}>
          <h2 className="font-extrabold text-brand-900">🧩 DSA Sheet by topic</h2>
          <div className="mt-3 space-y-2.5">
            {DSA_TOPICS.map((t) => {
              const list = problemsByTopic(t.id);
              const doneN = list.filter((p) => isProblemSolved(progress, p.id)).length;
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="text-sm w-40 truncate font-semibold text-slate-700">{t.emoji} {t.title}</span>
                  <div className="h-2 flex-1 rounded-full bg-brand-100 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${list.length ? (doneN / list.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-bold text-brand-800 w-10 text-right">{doneN}/{list.length}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {/* Plans in progress */}
          <div className={statCard}>
            <h2 className="font-extrabold text-brand-900">📋 Your study plans</h2>
            {plansInProgress.length === 0 ? (
              <p className="text-sm text-slate-600 mt-2">No plans started yet. Pick one — SQL 50 is a lovely first finish.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {plansInProgress.map(({ plan, total, doneN, pct }) => (
                  <div key={plan.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-bold text-slate-800">{plan.emoji} {plan.title}</span>
                      <span className="text-xs font-bold text-brand-800">{doneN}/{total} · {pct}%</span>
                    </div>
                    {meter(doneN, total)}
                  </div>
                ))}
              </div>
            )}
            <button onClick={onPlans} className="text-sm font-bold text-brand-700 mt-4 hover:text-brand-600">Open study plans →</button>
          </div>

          {/* Change password */}
          <div className={statCard}>
            <h2 className="font-extrabold text-brand-900">🔐 Change password</h2>
            <form onSubmit={changePassword} className="mt-3 space-y-2.5">
              <input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} required
                placeholder="Current password" autoComplete="current-password"
                className="w-full rounded-xl border border-brand-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required
                placeholder="New password (6+ characters)" autoComplete="new-password"
                className="w-full rounded-xl border border-brand-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
              {pwErr && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{pwErr}</p>}
              {pwMsg && <p className="text-sm font-bold text-brand-700">{pwMsg}</p>}
              <button type="submit" disabled={busy} className="btn-outline text-sm">Change password</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
