import { useState } from 'react';
import { TOPICS, getTopic, getChapter } from '../content/topics';
import { useProgress } from '../lib/progress.jsx';
import { isChapterDone, isTopicComplete, topicChapterCounts } from '../lib/progress';
import Sidebar from '../components/Sidebar';
import ArticleRenderer from '../components/ArticleRenderer';

// Notes layout: sticky sidebar (desktop) / drawer (mobile) + content.
// Guides are CHAPTER-WISE: /notes/:topic is the course page (chapter
// list), /notes/:topic/:chapter is one chapter. Finish chapters → the
// sidebar ticks, the course bar fills, study plans tick themselves.
export default function Notes({ slug, chapter, onSelectTopic, onSelectChapter, onMock, onHome }) {
  const [drawer, setDrawer] = useState(false);
  const { progress, markChapter, markArticle } = useProgress();
  const topic = getTopic(slug);
  const activeChapter = chapter ? getChapter(topic, chapter) : null;
  const idx = TOPICS.findIndex((t) => t.slug === topic.slug);
  const prevTopic = TOPICS[idx - 1];
  const nextTopic = TOPICS[idx + 1];
  const counts = topicChapterCounts(progress, topic.slug);
  const pct = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;
  const topicComplete = isTopicComplete(progress, topic.slug);

  const levelTag = (() => {
    if (topic.group === 'Interview Room') return { label: 'Interview', cls: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (topic.group === 'Rapid Revision') return { label: 'Revision', cls: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (topic.questions?.length >= 12) return { label: 'Advanced', cls: 'bg-brand-100 text-brand-700 border-brand-200' };
    if (topic.questions?.length >= 6) return { label: 'Intermediate', cls: 'bg-brand-100 text-brand-700 border-brand-200' };
    return { label: 'Core', cls: 'bg-brand-100 text-brand-700 border-brand-200' };
  })();

  const selectTopic = (s) => { setDrawer(false); onSelectTopic(s); };
  const selectChapter = (c) => { setDrawer(false); onSelectChapter(c); };
  const goHome = () => { if (onHome) onHome(); };

  const chapterIdx = activeChapter ? topic.chapters.findIndex((c) => c.slug === activeChapter.slug) : -1;
  const prevChapter = chapterIdx > 0 ? topic.chapters[chapterIdx - 1] : null;
  const nextChapter = chapterIdx >= 0 && chapterIdx < topic.chapters.length - 1 ? topic.chapters[chapterIdx + 1] : null;
  const firstUndone = topic.chapters.find((c) => !isChapterDone(progress, topic.slug, c.slug));

  // Chapter foot: bank questions for this topic, rotated by chapter so
  // consecutive chapters surface different questions.
  const footQuestions = (() => {
    const qs = topic.questions || [];
    if (!qs.length) return [];
    const offset = chapterIdx >= 0 ? chapterIdx * 2 : 0;
    return [0, 1, 2, 3].map((i) => qs[(offset + i) % qs.length]);
  })();

  return (
    <div className="max-w-[1400px] mx-auto flex items-start">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto nice-scroll bg-white border-r border-brand-100">
        <Sidebar activeTopic={topic.slug} activeChapter={activeChapter?.slug || null} onSelectTopic={selectTopic} onSelectChapter={selectChapter} />
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
            <Sidebar activeTopic={topic.slug} activeChapter={activeChapter?.slug || null} onSelectTopic={selectTopic} onSelectChapter={selectChapter} />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 px-4 py-5 md:px-6 md:py-6 xl:px-8">
        <button onClick={() => setDrawer(true)} className="lg:hidden mb-4 bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-card hover:bg-brand-700 transition">
          ☰ Topics & chapters
        </button>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm flex-wrap">
          <button onClick={goHome} className="font-semibold text-brand-700 hover:text-brand-900 hover:underline underline-offset-2 transition">Home</button>
          <span className="text-slate-400" aria-hidden="true">/</span>
          <span className="font-semibold text-brand-700">Notes</span>
          <span className="text-slate-400" aria-hidden="true">/</span>
          <button onClick={() => selectTopic(topic.slug)} className="font-semibold text-brand-700 hover:text-brand-900 hover:underline underline-offset-2 transition">{topic.emoji} {topic.title}</button>
          {activeChapter && (
            <>
              <span className="text-slate-400" aria-hidden="true">/</span>
              <span aria-current="page" className="font-bold text-slate-800 truncate max-w-[16rem] sm:max-w-none">{activeChapter.title}</span>
            </>
          )}
          <span className={`ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-extrabold ${levelTag.cls}`}>{levelTag.label}</span>
          <span className="hidden sm:inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[0.68rem] font-bold text-brand-700">{topic.group}</span>
          {topic.isNew && <span className="inline-flex items-center rounded-full bg-[#0D9488] px-2 py-0.5 text-[0.68rem] font-extrabold text-white">NEW</span>}
        </nav>

        {/* Course progress strip */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 shadow-card">
          <span className="text-sm font-extrabold text-brand-900 whitespace-nowrap">📚 {topic.title}</span>
          <div className="h-2 flex-1 rounded-full bg-brand-100 overflow-hidden">
            <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-bold text-brand-800 whitespace-nowrap">{counts.done}/{counts.total} chapters · {pct}%</span>
          {activeChapter && <span className="hidden md:inline text-xs font-semibold text-slate-500 whitespace-nowrap">Chapter {chapterIdx + 1} of {counts.total}</span>}
        </div>

        <div className="flex items-start gap-6">
          {/* Main column */}
          <div className="flex-1 min-w-0">
            {!activeChapter ? (
              /* ---------------- Course page ---------------- */
              <>
                <div className="rounded-2xl border border-brand-100 bg-white px-5 py-5 md:px-7 md:py-6 shadow-card">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-brand-900">{topic.emoji} {topic.title}</h1>
                  <p className="text-slate-600 mt-2 leading-relaxed">{topic.blurb}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-extrabold ${levelTag.cls}`}>{levelTag.label}</span>
                    <span className="inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[0.68rem] font-bold text-brand-700">{topic.group}</span>
                    <span className="inline-flex items-center rounded-full border border-brand-100 bg-white px-2 py-0.5 text-[0.68rem] font-bold text-slate-600">{counts.total} chapters · ~{topic.readMinutes} min</span>
                    {topic.questions.length > 0 && (
                      <span className="inline-flex items-center rounded-full border border-brand-100 bg-white px-2 py-0.5 text-[0.68rem] font-bold text-slate-600">🎤 {topic.questions.length} mock questions</span>
                    )}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {firstUndone ? (
                      <button onClick={() => selectChapter(firstUndone.slug)} className="btn-primary">
                        {counts.done > 0 ? '▶ Continue' : '▶ Start'}: {firstUndone.title} →
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-brand-600 text-white text-sm font-bold px-4 py-2">✓ Guide complete — nice work!</span>
                    )}
                    {topicComplete ? (
                      <button onClick={() => markArticle(topic.slug, false)} className="text-sm font-semibold text-slate-500 underline underline-offset-2 hover:text-brand-700 transition">
                        Reset guide progress
                      </button>
                    ) : (
                      <button onClick={() => markArticle(topic.slug, true)} className="text-sm font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-900 transition">
                        Mark whole guide complete
                      </button>
                    )}
                    {topic.questions.length > 0 && (
                      <button onClick={() => onMock(topic.slug)} className="btn-accent ml-auto text-sm">
                        🎤 Practice {topic.questions.length} questions
                      </button>
                    )}
                  </div>
                </div>

                {/* Chapter list */}
                <ol className="mt-4 space-y-2">
                  {topic.chapters.map((c, ci) => {
                    const done = isChapterDone(progress, topic.slug, c.slug);
                    return (
                      <li key={c.slug}>
                        <button onClick={() => selectChapter(c.slug)}
                          className="card-hover w-full text-left bg-white border border-brand-100 rounded-xl px-4 py-3.5 shadow-card flex items-center gap-3">
                          <span className={`grid place-items-center w-7 h-7 rounded-full text-xs font-extrabold shrink-0 ${
                            done ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-600'
                          }`}>
                            {done ? '✓' : ci + 1}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block font-semibold text-slate-800 leading-snug">{c.title}</span>
                            <span className="block text-xs font-semibold text-slate-400 mt-0.5">~{c.minutes} min read</span>
                          </span>
                          <span className="text-brand-400 font-extrabold" aria-hidden="true">→</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>

                {/* Prev / next topic */}
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  {prevTopic ? (
                    <button onClick={() => selectTopic(prevTopic.slug)} className="card-hover text-left bg-white border border-brand-100 rounded-xl px-4 py-3 shadow-card">
                      <span className="block text-xs font-bold text-brand-500">← PREVIOUS GUIDE</span>
                      <span className="font-semibold text-slate-800">{prevTopic.emoji} {prevTopic.title}</span>
                    </button>
                  ) : <span />}
                  {nextTopic && (
                    <button onClick={() => selectTopic(nextTopic.slug)} className="card-hover text-right bg-white border border-brand-100 rounded-xl px-4 py-3 shadow-card">
                      <span className="block text-xs font-bold text-brand-500">NEXT GUIDE →</span>
                      <span className="font-semibold text-slate-800">{nextTopic.emoji} {nextTopic.title} →</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* ---------------- Chapter page ---------------- */
              <>
                <ArticleRenderer topic={{ ...topic, markdown: activeChapter.markdown }} onNavigate={selectTopic} />

                {/* Mark chapter complete */}
                <div className="mt-6 rounded-2xl border border-brand-100 bg-white px-5 py-4 shadow-card flex flex-wrap items-center gap-3">
                  {isChapterDone(progress, topic.slug, activeChapter.slug) ? (
                    <>
                      <span className="inline-flex items-center gap-2 rounded-full bg-brand-600 text-white text-sm font-bold px-4 py-2">✓ Chapter completed</span>
                      <button onClick={() => markChapter(topic.slug, activeChapter.slug, false)} className="text-sm font-semibold text-slate-500 underline underline-offset-2 hover:text-brand-700 transition">
                        Undo
                      </button>
                      {nextChapter && <span className="text-sm text-slate-600">Next: <strong className="text-brand-800">{nextChapter.title}</strong> ↓</span>}
                      {!nextChapter && nextTopic && <span className="text-sm text-slate-600">Guide done — next guide: <strong className="text-brand-800">{nextTopic.title}</strong> ↓</span>}
                    </>
                  ) : (
                    <>
                      <button onClick={() => markChapter(topic.slug, activeChapter.slug, true)} className="btn-primary">✓ Mark chapter complete</button>
                      <span className="text-sm text-slate-500">Finished this chapter? Tick it off — your course bar and study plans update themselves.</span>
                    </>
                  )}
                  {topic.questions.length > 0 && (
                    <button onClick={() => onMock(topic.slug)} className="btn-accent ml-auto text-sm">
                      🎤 Practice {topic.title}
                    </button>
                  )}
                </div>

                {/* Interview questions for this topic */}
                {footQuestions.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-brand-100 bg-gradient-to-b from-brand-50 to-white px-5 py-4 shadow-card">
                    <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-500">Interview questions — {topic.title}</p>
                    <ul className="mt-3 space-y-1">
                      {footQuestions.map((q, i) => (
                        <li key={i}>
                          <button onClick={() => onMock(topic.slug)} className="w-full text-left rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 leading-snug transition hover:bg-brand-100/60 hover:text-brand-900">
                            <span className="text-brand-500 font-extrabold mr-1.5">{i + 1}.</span>{q.question}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => onMock(topic.slug)} className="mt-2 w-full text-center text-sm font-bold text-brand-700 hover:text-brand-900 hover:underline underline-offset-2 transition">
                      Practice all {topic.questions.length} in the mock room →
                    </button>
                  </div>
                )}

                {/* Prev / next chapter */}
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  {prevChapter ? (
                    <button onClick={() => selectChapter(prevChapter.slug)} className="card-hover text-left bg-white border border-brand-100 rounded-xl px-4 py-3 shadow-card">
                      <span className="block text-xs font-bold text-brand-500">← PREVIOUS CHAPTER</span>
                      <span className="font-semibold text-slate-800">{prevChapter.title}</span>
                    </button>
                  ) : (
                    <button onClick={() => selectTopic(topic.slug)} className="card-hover text-left bg-white border border-brand-100 rounded-xl px-4 py-3 shadow-card">
                      <span className="block text-xs font-bold text-brand-500">← COURSE OVERVIEW</span>
                      <span className="font-semibold text-slate-800">{topic.emoji} {topic.title} — all chapters</span>
                    </button>
                  )}
                  {nextChapter ? (
                    <button onClick={() => selectChapter(nextChapter.slug)}
                      className={`card-hover text-right bg-white border rounded-xl px-4 py-3 shadow-card ${
                        isChapterDone(progress, topic.slug, activeChapter.slug) ? 'border-brand-500 ring-2 ring-brand-200' : 'border-brand-100'
                      }`}>
                      <span className="block text-xs font-bold text-brand-500">NEXT CHAPTER →</span>
                      <span className="font-semibold text-slate-800">Next: {nextChapter.title} →</span>
                    </button>
                  ) : nextTopic ? (
                    <button onClick={() => selectTopic(nextTopic.slug)} className="card-hover text-right bg-white border border-brand-100 rounded-xl px-4 py-3 shadow-card">
                      <span className="block text-xs font-bold text-brand-500">NEXT GUIDE →</span>
                      <span className="font-semibold text-slate-800">{nextTopic.emoji} {nextTopic.title} →</span>
                    </button>
                  ) : <span />}
                </div>
              </>
            )}
          </div>

          {/* Right rail — xl screens only */}
          <aside className="hidden xl:block w-80 shrink-0 sticky top-20 space-y-4">
            <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-500">{activeChapter ? 'Chapter' : 'Course'}</p>
              <h2 className="font-extrabold text-brand-900 mt-1 leading-snug">
                {activeChapter ? activeChapter.title : `${topic.emoji} ${topic.title}`}
              </h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                {activeChapter ? `${topic.emoji} ${topic.title} · Chapter ${chapterIdx + 1} of ${counts.total} · ~${activeChapter.minutes} min` : topic.blurb}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-extrabold ${levelTag.cls}`}>{levelTag.label}</span>
                <span className="inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[0.68rem] font-bold text-brand-700">{topic.group}</span>
                <span className="inline-flex items-center rounded-full border border-brand-100 bg-white px-2 py-0.5 text-[0.68rem] font-bold text-slate-600">Guide {idx + 1} / {TOPICS.length}</span>
              </div>
              {activeChapter && (
                <button onClick={() => selectTopic(topic.slug)} className="btn-outline w-full mt-3 text-sm">☰ All chapters</button>
              )}
            </div>

            {topic.questions.length > 0 && (
              <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-brand-50 to-white p-4 shadow-card">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-500">Practice this topic</p>
                <p className="font-extrabold text-brand-900 mt-1">{topic.questions.length} bank questions</p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">Say your answers out loud — the mock room grades what you actually say.</p>
                <button onClick={() => onMock(topic.slug)} className="btn-primary w-full mt-3 text-sm">🎤 Practice {topic.title}</button>
              </div>
            )}

            <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
              <div className="flex items-baseline justify-between">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-500">Your progress</p>
                <p className="text-xs font-extrabold text-brand-800">{pct}%</p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-brand-100 overflow-hidden">
                <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-sm text-slate-600 mt-2">{counts.done} of {counts.total} chapters complete in {topic.title}</p>
              {activeChapter && !isChapterDone(progress, topic.slug, activeChapter.slug) && (
                <button onClick={() => markChapter(topic.slug, activeChapter.slug, true)} className="btn-outline w-full mt-3 text-sm">✓ Mark this chapter complete</button>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
