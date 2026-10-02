import { TOPICS } from '../content/topics';
import { useProgress } from '../lib/progress.jsx';
import { isTopicComplete, topicChapterCounts, courseChapterTotals } from '../lib/progress';

// Left list for the course track: guides in TOPICS order, each with its
// chapter completion (done/total). The ACTIVE guide expands in place to
// its chapter list — one ✓ per finished chapter — so the sidebar is the
// syllabus of whatever you're reading. Sticky on desktop; the Notes page
// wraps this in a slide-in drawer on mobile.
export default function Sidebar({ activeTopic, activeChapter, onSelectTopic, onSelectChapter }) {
  const { progress } = useProgress();
  const totals = courseChapterTotals(progress, TOPICS.map((t) => t.slug));
  const pct = totals.total ? Math.round((totals.done / totals.total) * 100) : 0;
  const groups = [...new Set(TOPICS.map((t) => t.group))];

  return (
    <div className="py-4">
      {/* Course progress */}
      <div className="px-4 mb-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-500">Course track</p>
          <p className="text-xs font-extrabold text-brand-800">{totals.done}/{totals.total} chapters · {pct}%</p>
        </div>
        <div className="mt-2 h-2 rounded-full bg-brand-100 overflow-hidden">
          <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-slate-500">Read a chapter, tick it complete, move to the next →</p>
      </div>

      {groups.map((g) => (
        <div key={g} className="mb-5">
          <p className="px-4 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-500">{g}</p>
          <ul className="mt-2 space-y-0.5">
            {TOPICS.filter((t) => t.group === g).map((t) => {
              const complete = isTopicComplete(progress, t.slug);
              const counts = topicChapterCounts(progress, t.slug);
              const isActive = activeTopic === t.slug;
              return (
                <li key={t.slug}>
                  <button
                    onClick={() => onSelectTopic(t.slug)}
                    className={`w-full text-left px-4 py-2.5 rounded-r-xl text-[0.92rem] font-medium flex items-center gap-2.5 transition border-l-4 ${
                      isActive
                        ? 'bg-brand-600 text-white border-brand-700 shadow-card'
                        : 'text-slate-700 hover:bg-brand-50 border-transparent'
                    }`}
                  >
                    <span
                      className={`grid place-items-center w-5 h-5 rounded-full text-[0.65rem] font-extrabold shrink-0 ${
                        complete
                          ? 'bg-brand-600 text-white ring-2 ring-brand-100'
                          : isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-brand-100 text-brand-500'
                      }`}
                      title={complete ? 'Guide completed' : `${counts.done}/${counts.total} chapters done`}
                    >
                      {complete ? '✓' : counts.done > 0 ? counts.done : ''}
                    </span>
                    <span className="text-base">{t.emoji}</span>
                    <span className="flex-1 leading-snug">{t.title}</span>
                    <span className={`text-[0.68rem] font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/25 text-white' : 'bg-brand-100 text-brand-700'}`}>
                      {counts.done}/{counts.total}
                    </span>
                  </button>

                  {/* Chapter list of the active guide */}
                  {isActive && (
                    <ul className="mt-1 mb-2 ml-6 mr-2 space-y-0.5 border-l-2 border-brand-100 pl-2">
                      {t.chapters.map((c, ci) => {
                        const chapterDone = Boolean(progress.articles?.[t.slug] || progress.chapters?.[t.slug]?.[c.slug]);
                        const isCurrent = activeChapter === c.slug;
                        return (
                          <li key={c.slug}>
                            <button
                              onClick={() => onSelectChapter(c.slug)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[0.82rem] flex items-center gap-2 transition ${
                                isCurrent
                                  ? 'bg-brand-100 text-brand-900 font-bold'
                                  : 'text-slate-600 hover:bg-brand-50 hover:text-brand-900'
                              }`}
                            >
                              <span
                                className={`grid place-items-center w-4 h-4 rounded-full text-[0.55rem] font-extrabold shrink-0 ${
                                  chapterDone ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-400'
                                }`}
                              >
                                {chapterDone ? '✓' : ''}
                              </span>
                              <span className="flex-1 leading-snug">{ci + 1}. {c.title}</span>
                              <span className="text-[0.65rem] font-semibold text-slate-400 whitespace-nowrap">~{c.minutes}m</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
