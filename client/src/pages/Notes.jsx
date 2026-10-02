import { useState } from 'react';
import { TOPICS, getTopic } from '../content/topics';
import { useProgress } from '../lib/progress.jsx';
import { isArticleDone, articleDoneCount } from '../lib/progress';
import Sidebar from '../components/Sidebar';
import ArticleRenderer from '../components/ArticleRenderer';

// Notes layout: sticky sidebar (desktop) / drawer (mobile) + article.
// This is a COURSE TRACK: finish a guide → "Mark as complete" → the
// Next card lights up and the sidebar + navbar progress move with you.
export default function Notes({ slug, onSelect, onMock }) {
  const [drawer, setDrawer] = useState(false);
  const { progress, markArticle } = useProgress();
  const topic = getTopic(slug);
  const idx = TOPICS.findIndex((t) => t.slug === topic.slug);
  const prev = TOPICS[idx - 1];
  const next = TOPICS[idx + 1];
  const done = isArticleDone(progress, topic.slug);
  const doneCount = articleDoneCount(progress, TOPICS.map((t) => t.slug));
  const coursePct = Math.round((doneCount / TOPICS.length) * 100);

  const select = (s) => { setDrawer(false); onSelect(s); };

  return (
    <div className="max-w-7xl mx-auto flex items-start">
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
              <button onClick={() => setDrawer(false)} className="text-xl leading-none px-2">✕</button>
            </div>
            <Sidebar active={topic.slug} onSelect={select} />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 px-4 py-5 md:px-8 md:py-7">
        <button onClick={() => setDrawer(true)} className="lg:hidden mb-4 bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-card">
          ☰ All topics
        </button>

        {/* Course progress strip */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 shadow-card">
          <span className="text-sm font-extrabold text-brand-900 whitespace-nowrap">📚 Course track</span>
          <div className="h-2 flex-1 rounded-full bg-brand-100 overflow-hidden">
            <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${coursePct}%` }} />
          </div>
          <span className="text-xs font-bold text-brand-800 whitespace-nowrap">{doneCount}/{TOPICS.length} guides · {coursePct}%</span>
          <span className="hidden md:inline text-xs font-semibold text-slate-500 whitespace-nowrap">Guide {idx + 1} of {TOPICS.length}</span>
        </div>

        <ArticleRenderer topic={topic} onNavigate={select} />

        {/* Mark complete + practice strip */}
        <div className="mt-6 rounded-2xl border border-brand-100 bg-white px-5 py-4 shadow-card flex flex-wrap items-center gap-3">
          {done ? (
            <>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-600 text-white text-sm font-bold px-4 py-2">
                ✓ Completed — nice work!
              </span>
              <button onClick={() => markArticle(topic.slug, false)} className="text-sm font-semibold text-slate-500 underline underline-offset-2 hover:text-brand-700">
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
      </main>
    </div>
  );
}
