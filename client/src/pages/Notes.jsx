import { useState } from 'react';
import { TOPICS, getTopic } from '../content/topics';
import Sidebar from '../components/Sidebar';
import ArticleRenderer from '../components/ArticleRenderer';

// Notes layout: sticky sidebar (desktop) / drawer (mobile) + article,
// with prev/next navigation at the bottom of every article.
export default function Notes({ slug, onSelect, onMock }) {
  const [drawer, setDrawer] = useState(false);
  const topic = getTopic(slug);
  const idx = TOPICS.findIndex((t) => t.slug === topic.slug);
  const prev = TOPICS[idx - 1];
  const next = TOPICS[idx + 1];

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

        <ArticleRenderer topic={topic} onNavigate={select} />

        {/* Practice-this-topic strip + prev/next */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {topic.questions.length > 0 && (
            <button onClick={() => onMock(topic.slug)} className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm px-4 py-2.5 rounded-xl shadow-card transition">
              🎤 Practice {topic.questions.length} {topic.title} questions
            </button>
          )}
        </div>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {prev ? (
            <button onClick={() => select(prev.slug)} className="text-left bg-white border border-brand-100 rounded-xl px-4 py-3 shadow-card hover:border-brand-300 transition">
              <span className="block text-xs font-bold text-brand-500">← PREVIOUS</span>
              <span className="font-semibold text-slate-800">{prev.emoji} {prev.title}</span>
            </button>
          ) : <span />}
          {next && (
            <button onClick={() => select(next.slug)} className="text-right bg-white border border-brand-100 rounded-xl px-4 py-3 shadow-card hover:border-brand-300 transition">
              <span className="block text-xs font-bold text-brand-500">NEXT →</span>
              <span className="font-semibold text-slate-800">{next.emoji} {next.title}</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
