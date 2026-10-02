import { useState } from 'react';
import { TOPICS, getTopic } from '../content/topics';
import { useProgress } from '../lib/progress.jsx';
import { isArticleDone, articleDoneCount } from '../lib/progress';
import Sidebar from '../components/Sidebar';
import ArticleRenderer from '../components/ArticleRenderer';

// Notes layout: sticky sidebar (desktop) / drawer (mobile) + article.
// This is a COURSE TRACK: finish a guide → "Mark as complete" → the
// Next card lights up and the sidebar + navbar progress move with you.
export default function Notes({ slug, onSelect, onMock, onHome }) {
  const [drawer, setDrawer] = useState(false);
  const { progress, markArticle } = useProgress();
  const topic = getTopic(slug);
  const idx = TOPICS.findIndex((t) => t.slug === topic.slug);
  const prev = TOPICS[idx - 1];
  const next = TOPICS[idx + 1];
  const done = isArticleDone(progress, topic.slug);
  const doneCount = articleDoneCount(progress, TOPICS.map((t) => t.slug));
  const coursePct = Math.round((doneCount / TOPICS.length) * 100);
  const topQuestions = (topic.questions || []).slice(0, 6);

  const levelTag = (() => {
    if (topic.group === 'Interview Room') return { label: 'Interview', cls: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (topic.group === 'Rapid Revision') return { label: 'Revision', cls: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (topic.questions?.length >= 12) return { label: 'Advanced', cls: 'bg-brand-100 text-brand-700 border-brand-200' };
    if (topic.questions?.length >= 6) return { label: 'Intermediate', cls: 'bg-brand-100 text-brand-700 border-brand-200' };
    return { label: 'Core', cls: 'bg-brand-100 text-brand-700 border-brand-200' };
  })();

  const select = (s) => { setDrawer(false); onSelect(s); };
  const goHome = () => { if (onHome) onHome(); };

  return (
    <div className="max-w-[1400px] mx-auto flex items-start">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto nice-scroll bg-white border-r border-brand-100">
        <Sidebar active={topic.slug} onSelect={select} />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDrawer(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white overflow-y-auto nice-scroll shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-100">
              <span className="font-extrabold text-brand-900">All Topics</span>
              <button onClick={() => setDrawer(false)} className="text-xl leading-none px-2 hover:text-brand-700 transition">✕</button>
            </div>
            <Sidebar active={topic.slug} onSelect={select} />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 px-4 py-5 md:px-6 md:py-6 xl:px-8">
        <button onClick={() => setDrawer(true)} className="lg:hidden mb-4 bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-card hover:bg-brand-700 transition">
          ☰ All topics
        </button>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm flex-wrap">
          <button onClick={goHome} className="font-semibold text-brand-700 hover:text-brand-900 hover:underline underline-offset-2 transition">Home</button>
          <span className="text-slate-400" aria-hidden="true">/</span>
          <button onClick={() => select(topic.slug)} className="font-semibold text-brand-700 hover:text-brand-900 hover:underline underline-offset-2 transition">Notes</button>
          <span className="text-slate-400" aria-hidden="true">/</span>
          <span aria-current="page" className="font-bold text-slate-800 truncate max-w-[16rem] sm:max-w-none">{topic.emoji} {topic.title}</span>
          <span className={`ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-extrabold ${levelTag.cls}`}>{levelTag.label}</span>
          <span className="hidden sm:inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[0.68rem] font-bold text-brand-700">{topic.group}</span>
          {topic.isNew && <span className="inline-flex items-center rounded-full bg-amber-400 px-2 py-0.5 text-[0.68rem] font-extrabold text-amber-950">NEW</span>}
        </nav>

        {/* Course progress strip */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 shadow-card">
          <span className="text-sm font-extrabold text-brand-900 whitespace-nowrap">📚 Course track</span>
          <div className="h-2 flex-1 rounded-full bg-brand-100 overflow-hidden">
            <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${coursePct}%` }} />
          </div>
          <span className="text-xs font-bold text-brand-800 whitespace-nowrap">{doneCount}/{TOPICS.length} guides · {coursePct}%</span>
          <span className="hidden md:inline text-xs font-semibold text-slate-500 whitespace-nowrap">Guide {idx + 1} of {TOPICS.length}</span>
        </div>

        <div className="flex items-start gap-6">
          {/* Main article column */}
          <div className="flex-1 min-w-0">
            <ArticleRenderer topic={topic} onNavigate={select} />

            {/* Mark complete + practice strip */}
            <div className="mt-6 rounded-2xl border border-brand-100 bg-white px-5 py-4 shadow-card flex flex-wrap items-center gap-3">
              {done ? (
                <>
                  <span className="inline-flex items-center gap-2 rounded-full bg-brand-600 text-white text-sm font-bold px-4 py-2">
                    ✓ Completed — nice work!
                  </span>
                  <button onClick={() => markArticle(topic.slug, false)} className="text-sm font-semibold text-slate-500 underline underline-offset-2 hover:text-brand-700 transition">
                    Undo
                  </button>
                  {next && <span className="text-sm text-slate-600">Next up: <strong className="text-brand-800">{next.title}</strong> ↓</span>}
                </>
              ) : (
                <>
                  <button onClick={() => markArticle(topic.slug, true)} className="btn-primary">
                    ✓ Mark as complete
                  </button>
                  <span className="text-sm text-slate-500">Finished reading? Tick it off — your plans update themselves.</span>
                </>
              )}
              {topic.questions.length > 0 && (
                <button onClick={() => onMock(topic.slug)} className="ml-auto bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm px-4 py-2.5 rounded-xl shadow-card transition">
                  🎤 Practice {topic.questions.length} {topic.title} questions
                </button>
              )}
            </div>

            {/* Prev / Next */}
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {prev ? (
                <button onClick={() => select(prev.slug)} className="card-hover text-left bg-white border border-brand-100 rounded-xl px-4 py-3 shadow-card">
                  <span className="block text-xs font-bold text-brand-500">← PREVIOUS</span>
                  <span className="font-semibold text-slate-800">{prev.emoji} {prev.title}</span>
                </button>
              ) : <span />}
              {next && (
                <button
                  onClick={() => select(next.slug)}
                  className={`card-hover text-right bg-white border rounded-xl px-4 py-3 shadow-card ${
                    done ? 'border-brand-500 ring-2 ring-brand-200' : 'border-brand-100'
                  }`}
                >
                  <span className="block text-xs font-bold text-brand-500">NEXT →</span>
                  <span className="font-semibold text-slate-800">Next: {next.emoji} {next.title} →</span>
                </button>
              )}
            </div>
          </div>

          {/* Right rail — xl screens only */}
          <aside className="hidden xl:block w-80 shrink-0 sticky top-20 space-y-4">
            {/* Level / meta card */}
            <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-500">Topic</p>
              <h2 className="font-extrabold text-brand-900 mt-1 leading-snug">{topic.emoji} {topic.title}</h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{topic.blurb}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-extrabold ${levelTag.cls}`}>{levelTag.label}</span>
                <span className="inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[0.68rem] font-bold text-brand-700">{topic.group}</span>
                <span className="inline-flex items-center rounded-full border border-brand-100 bg-white px-2 py-0.5 text-[0.68rem] font-bold text-slate-600">Guide {idx + 1} / {TOPICS.length}</span>
              </div>
            </div>

            {/* Practice this topic */}
            {topic.questions.length > 0 && (
              <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-brand-50 to-white p-4 shadow-card">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-500">Practice this topic</p>
                <p className="font-extrabold text-brand-900 mt-1">{topic.questions.length} bank questions</p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">Say your answers out loud — the mock room grades what you actually say.</p>
                <button onClick={() => onMock(topic.slug)} className="btn-primary w-full mt-3 text-sm">
                  🎤 Practice {topic.title}
                </button>
              </div>
            )}

            {/* Top interview questions */}
            {topQuestions.length > 0 && (
              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-500">Top interview questions</p>
                <ul className="mt-3 space-y-1">
                  {topQuestions.map((q, i) => (
                    <li key={i}>
                      <button
                        onClick={() => onMock(topic.slug)}
                        className="w-full text-left rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 leading-snug transition hover:bg-brand-50 hover:text-brand-900"
                      >
                        <span className="text-brand-500 font-extrabold mr-1.5">{i + 1}.</span>{q.question}
                      </button>
                    </li>
                  ))}
                </ul>
                <button onClick={() => onMock(topic.slug)} className="mt-2 w-full text-center text-sm font-bold text-brand-700 hover:text-brand-900 hover:underline underline-offset-2 transition">
                  Practice all {topic.questions.length} →
                </button>
              </div>
            )}

            {/* Progress card */}
            <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
              <div className="flex items-baseline justify-between">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-500">Your progress</p>
                <p className="text-xs font-extrabold text-brand-800">{coursePct}%</p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-brand-100 overflow-hidden">
                <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${coursePct}%` }} />
              </div>
              <p className="text-sm text-slate-600 mt-2">{doneCount} of {TOPICS.length} guides complete</p>
              <p className={`text-sm font-bold mt-1 ${done ? 'text-brand-700' : 'text-slate-500'}`}>
                {done ? '✓ This guide is marked complete' : 'Not marked complete yet'}
              </p>
              {!done && (
                <button onClick={() => markArticle(topic.slug, true)} className="btn-outline w-full mt-3 text-sm">✓ Mark as complete</button>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
