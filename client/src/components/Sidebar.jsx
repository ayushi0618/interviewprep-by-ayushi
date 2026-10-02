import { TOPICS } from '../content/topics';
import { useProgress } from '../lib/progress.jsx';
import { isArticleDone, articleDoneCount } from '../lib/progress';

// Left topic list for the course track: guides in TOPICS order, a ✓ on
// every completed one, and the course progress bar up top. Sticky on
// desktop; the Notes page wraps this in a slide-in drawer on mobile.
export default function Sidebar({ active, onSelect }) {
  const { progress } = useProgress();
  const done = articleDoneCount(progress, TOPICS.map((t) => t.slug));
  const pct = Math.round((done / TOPICS.length) * 100);
  const groups = [...new Set(TOPICS.map((t) => t.group))];

  return (
    <div className="py-4">
      {/* Course progress */}
      <div className="px-4 mb-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-500">Course track</p>
          <p className="text-xs font-extrabold text-brand-800">{done}/{TOPICS.length} · {pct}%</p>
        </div>
        <div className="mt-2 h-2 rounded-full bg-brand-100 overflow-hidden">
          <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-slate-500">Finish a guide, tick it complete, move to the next →</p>
      </div>

      {groups.map((g) => (
        <div key={g} className="mb-5">
          <p className="px-4 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-500">{g}</p>
          <ul className="mt-2 space-y-0.5">
            {TOPICS.filter((t) => t.group === g).map((t) => {
              const isDone = isArticleDone(progress, t.slug);
              const isActive = active === t.slug;
              return (
                <li key={t.slug}>
                  <button
                    onClick={() => onSelect(t.slug)}
                    className={`w-full text-left px-4 py-2.5 rounded-r-xl text-[0.92rem] font-medium flex items-center gap-2.5 transition border-l-4 ${
                      isActive
                        ? 'bg-brand-600 text-white border-brand-800 shadow-card'
                        : 'text-slate-700 hover:bg-brand-50 border-transparent'
                    }`}
                  >
                    <span
                      className={`grid place-items-center w-5 h-5 rounded-full text-[0.65rem] font-extrabold shrink-0 ${
                        isDone
                          ? 'bg-brand-600 text-white'
                          : isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-brand-100 text-brand-400'
                      }`}
                      title={isDone ? 'Completed' : 'Not completed yet'}
                    >
                      {isDone ? '✓' : ''}
                    </span>
                    <span className="text-base">{t.emoji}</span>
                    <span className="flex-1 leading-snug">{t.title}</span>
                    {t.questions.length > 0 && (
                      <span className={`text-[0.68rem] font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/25 text-white' : 'bg-brand-100 text-brand-700'}`}>
                        {t.questions.length} Q
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
