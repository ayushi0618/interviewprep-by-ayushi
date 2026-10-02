import { useMemo, useRef, useState } from 'react';
import { TOPICS, ALL_QUESTIONS } from '../content/topics';
import Logo from './Logo';

// Top bar: the ONE InterviewPrep logo, main navigation, and a search box
// that filters both topics and practice questions (results jump to the
// article or the practice room for that topic).
export default function Navbar({ route, onHome, onNotes, onMock, onPlayground, onPracticeTopic }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return null;
    const topics = TOPICS.filter((t) => `${t.title} ${t.blurb}`.toLowerCase().includes(q)).slice(0, 4);
    const questions = ALL_QUESTIONS.filter((x) => x.question.toLowerCase().includes(q)).slice(0, 6);
    return { topics, questions };
  }, [query]);

  const linkCls = (active) =>
    `px-3 py-2 rounded-lg text-sm font-semibold transition ${active ? 'bg-brand-700 text-white' : 'text-brand-900 hover:bg-brand-100'}`;

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

        <nav className="hidden md:flex items-center gap-1 ml-4">
          <button className={linkCls(route.name === 'notes')} onClick={() => onNotes()}>📚 Notes</button>
          <button className={linkCls(route.name === 'playground')} onClick={() => onPlayground()}>▶ Run Code</button>
          <button className={linkCls(route.name === 'mock')} onClick={() => onMock()}>🎤 Mock Interview</button>
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

        <nav className="flex md:hidden items-center gap-1">
          <button className={linkCls(route.name === 'notes')} onClick={() => onNotes()}>📚</button>
          <button className={linkCls(route.name === 'playground')} onClick={() => onPlayground()}>▶</button>
          <button className={linkCls(route.name === 'mock')} onClick={() => onMock()}>🎤</button>
        </nav>
      </div>
    </header>
  );
}
