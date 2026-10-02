import { useMemo, useRef, useState } from 'react';
import { TOPICS, ALL_QUESTIONS } from '../content/topics';
import { PROBLEMS } from '../data/dsaSheet';
import { useProgress } from '../lib/progress.jsx';
import { useAuth } from '../lib/auth.jsx';
import Logo from './Logo';

// Top bar: the ONE InterviewPrep logo, main navigation (Notes → DSA Sheet
// → Study Plans → Mock Interview → Run Code), an overall-progress chip,
// and search across topics + practice questions.
export default function Navbar({ route, onHome, onNotes, onSheet, onPlans, onMock, onPlayground, onPracticeTopic, onAuth, onProfile }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const { progress } = useProgress();
  const { user } = useAuth();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return null;
    const topics = TOPICS.filter((t) => `${t.title} ${t.blurb}`.toLowerCase().includes(q)).slice(0, 4);
    const questions = ALL_QUESTIONS.filter((x) => x.question.toLowerCase().includes(q)).slice(0, 6);
    return { topics, questions };
  }, [query]);

  // Overall course progress = guides completed + sheet problems solved.
  const totalUnits = TOPICS.length + PROBLEMS.length;
  const doneUnits =
    Object.keys(progress.articles || {}).length +
    Object.values(progress.problems || {}).filter((p) => p.solved).length;
  const pct = totalUnits ? Math.round((doneUnits / totalUnits) * 100) : 0;

  const linkCls = (active) =>
    `px-3 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${active ? 'bg-brand-700 text-white shadow-card' : 'text-brand-900 hover:bg-brand-100'}`;

  const links = [
    { key: 'notes', label: '📚 Notes', icon: '📚', active: route.name === 'notes', onClick: () => onNotes() },
    { key: 'sheet', label: '🧩 DSA Sheet', icon: '🧩', active: route.name === 'sheet' || route.name === 'problem', onClick: onSheet },
    { key: 'plans', label: '📋 Study Plans', icon: '📋', active: route.name === 'plans', onClick: onPlans },
    { key: 'mock', label: '🎤 Mock Interview', icon: '🎤', active: route.name === 'mock', onClick: () => onMock() },
    { key: 'playground', label: '▶ Run Code', icon: '▶', active: route.name === 'playground', onClick: onPlayground },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b-2 border-brand-600 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
        <button onClick={onHome} className="flex items-center gap-2.5 shrink-0 text-left" aria-label="InterviewPrep — home">
          <Logo size={34} />
          <span className="leading-tight">
            <span className="block font-extrabold text-brand-900 text-[1.05rem]">InterviewPrep</span>
            <span className="block text-[0.7rem] font-semibold text-brand-600 -mt-0.5">by Ayushi Singh</span>
          </span>
        </button>

        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {links.map((l) => (
            <button key={l.key} className={linkCls(l.active)} onClick={l.onClick}>{l.label}</button>
          ))}
        </nav>

        <div className="relative flex-1 max-w-md ml-auto">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search topics & questions… (e.g. closure, jwt, join)"
            className="w-full rounded-xl border border-brand-200 bg-[#fbfdfc] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          />
          {open && results && (
            <div className="absolute right-0 left-0 mt-2 bg-white rounded-xl shadow-card border border-brand-100 overflow-hidden max-h-[70vh] overflow-y-auto nice-scroll">
              {results.topics.length === 0 && results.questions.length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-500">No matches — try “hooks”, “event loop”, “join”, “jwt”…</p>
              )}
              {results.topics.map((t) => (
                <button key={t.slug} className="w-full text-left px-4 py-2.5 hover:bg-brand-50 border-b border-brand-50"
                  onClick={() => { setQuery(''); onNotes(t.slug); }}>
                  <span className="text-sm font-semibold text-slate-800">{t.emoji} {t.title}</span>
                  <span className="block text-xs text-slate-500 truncate">{t.blurb}</span>
                </button>
              ))}
              {results.questions.map((x, i) => (
                <button key={i} className="w-full text-left px-4 py-2.5 hover:bg-amber-50 border-b border-brand-50"
                  onClick={() => { setQuery(''); onPracticeTopic(x.topic); }}>
                  <span className="text-sm text-slate-700">🎤 {x.question}</span>
                  <span className="block text-xs text-brand-600 font-semibold">Practice · {x.topicTitle}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Overall progress chip — every page, one source of truth */}
        <div className="hidden md:flex items-center gap-2 shrink-0 rounded-full border border-brand-200 bg-brand-50 pl-2 pr-3 py-1" title={`${doneUnits} of ${totalUnits} guides + problems done`}>
          <span className="relative grid place-items-center w-6 h-6">
            <svg viewBox="0 0 24 24" className="w-6 h-6 -rotate-90">
              <circle cx="12" cy="12" r="9" fill="none" stroke="#daeee0" strokeWidth="3.5" />
              <circle cx="12" cy="12" r="9" fill="none" stroke="#308d46" strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 56.5} 56.5`} />
            </svg>
          </span>
          <span className="text-xs font-extrabold text-brand-800">{pct}%</span>
        </div>

        {/* Account area: guest CTAs, or avatar → profile */}
        {user ? (
          <button onClick={onProfile} className="flex items-center gap-2 shrink-0 rounded-full border border-brand-200 bg-white pl-1 pr-3 py-1 shadow-card transition hover:border-brand-400" title="Your profile">
            <span className="w-7 h-7 rounded-full bg-brand-600 text-white grid place-items-center text-[0.7rem] font-extrabold">
              {user.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
            </span>
            <span className="hidden sm:block text-sm font-bold text-brand-900 max-w-[7rem] truncate">{user.name.split(/\s+/)[0]}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onAuth} className="hidden sm:inline-flex rounded-lg px-3 py-2 text-sm font-bold text-brand-800 transition hover:bg-brand-100">Login</button>
            <button onClick={onAuth} className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-bold text-white shadow-card transition hover:bg-brand-700 whitespace-nowrap">Create profile</button>
          </div>
        )}

        <nav className="flex lg:hidden items-center gap-0.5">
          {links.map((l) => (
            <button key={l.key} aria-label={l.label} className={`${linkCls(l.active)} px-2.5`} onClick={l.onClick}>{l.icon}</button>
          ))}
        </nav>
      </div>
    </header>
  );
}
