// StudyPlans — LeetCode-style study-plan cards + chapter checklists.
//
// No calendars, no deadlines: pick a plan (say "SQL 50"), work down its
// chapters, tick items off. Finishing the matching notes chapter, or
// solving a sheet problem, ticks the matching plan items BY ITSELF (see
// isPlanItemDone in lib/progress.js) — those rows show a little "auto ✓"
// badge so you know why they're already done. Everything can also be
// ticked by hand; section rows deep-link to their chapter.
import { useMemo, useState } from 'react';
import { PLANS, planItemCount } from '../data/plans';
import { getTopic } from '../content/topics';
import { resolveChapter } from '../lib/chapters.js';
import { useProgress } from '../lib/progress.jsx';
import { isPlanItemDone, isPlanItemChecked } from '../lib/progress.js';

const TYPE_ICON = {
  article: '📖',
  section: '📄',
  problem: '🧩',
  practice: '🎤',
  playground: '▶',
  interview: '🎥',
  task: '✍️',
};

// Difficulty meta on problem rows gets the lavender / amber / rose chip.
function diffClass(meta) {
  if (meta === 'Easy') return 'diff-easy';
  if (meta === 'Medium') return 'diff-medium';
  if (meta === 'Hard') return 'diff-hard';
  return null;
}

// Small SVG ring for the plan cards (same trick as the navbar chip).
function ProgressRing({ done, total }) {
  const pct = total ? done / total : 0;
  const C = 2 * Math.PI * 15.5; // r = 15.5
  return (
    <span className="relative grid place-items-center w-11 h-11 shrink-0" title={`${done} of ${total} done`}>
      <svg viewBox="0 0 36 36" className="w-11 h-11 -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ECE8F9" strokeWidth="3.5" />
        <circle
          cx="18" cy="18" r="15.5" fill="none" stroke="#7C6BD9" strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={`${pct * C} ${C}`}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-[0.62rem] font-extrabold text-brand-800">
        {total ? Math.round(pct * 100) : 0}%
      </span>
    </span>
  );
}

function ProgressBar({ done, total, className = '' }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-2 flex-1 rounded-full bg-brand-100 overflow-hidden">
        <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-brand-800 whitespace-nowrap">{done}/{total} · {pct}%</span>
    </div>
  );
}

export default function StudyPlans({ onOpenArticle, onOpenProblem, onPractice, onOpenPlayground, onOpenInterview }) {
  const [selectedId, setSelectedId] = useState(null);
  const { progress, togglePlanItem, startPlan } = useProgress();

  const selected = useMemo(
    () => PLANS.find((p) => p.id === selectedId) || null,
    [selectedId],
  );

  // done/total for any plan, straight from the one progress store.
  const countsFor = (plan) => {
    const total = planItemCount(plan);
    let done = 0;
    for (const chapter of plan.chapters) {
      for (const item of chapter.items) {
        if (isPlanItemDone(progress, plan, item)) done += 1;
      }
    }
    return { done, total };
  };

  const openPlan = (plan) => setSelectedId(plan.id);

  const startAndOpen = (plan) => {
    startPlan(plan.id); // stamps today's date; harmless if already started
    setSelectedId(plan.id);
  };

  // Where does clicking an item's label take you? Section/article items
  // deep-link to the exact chapter when the label resolves to one.
  const navigate = (item) => {
    switch (item.type) {
      case 'article':
      case 'section': {
        if (!item.ref) break;
        const topic = getTopic(item.ref);
        const chapter = item.type === 'section' ? resolveChapter(topic.chapters, item.label) : null;
        onOpenArticle?.(item.ref, chapter?.slug || undefined);
        break;
      }
      case 'problem':
        if (item.ref) onOpenProblem?.(item.ref);
        break;
      case 'practice':
        if (item.ref) onPractice?.(item.ref);
        break;
      case 'playground':
        onOpenPlayground?.();
        break;
      case 'interview':
        onOpenInterview?.();
        break;
      default:
        break; // task — nothing to open, just do it and tick it
    }
  };

  // ---------- plan detail ----------

  if (selected) {
    const plan = selected;
    const { done, total } = countsFor(plan);
    const started = progress.planStart?.[plan.id];

    return (
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-10">
        <button onClick={() => setSelectedId(null)} className="btn-outline !px-4 !py-2 text-sm">
          ← All plans
        </button>

        {/* Plan header */}
        <div className="mt-5 rounded-2xl bg-white border border-brand-100 shadow-card p-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl" aria-hidden="true">{plan.emoji}</span>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-brand-900 leading-tight">{plan.title}</h1>
              <p className="text-slate-600 mt-1 leading-relaxed">{plan.tagline}</p>
              <p className="text-xs font-semibold text-slate-500 mt-2">
                {total} items · {plan.chapters.length} chapters
                {started ? ` · started ${started}` : ' · not started yet'}
              </p>
            </div>
          </div>
          <ProgressBar done={done} total={total} className="mt-4" />
          {done === total && total > 0 && (
            <p className="mt-3 text-sm font-bold text-brand-700">🎉 Plan complete — every single item. Go book that interview.</p>
          )}
        </div>

        {/* Chapters */}
        {plan.chapters.map((chapter, chapterIdx) => {
          const chapterDone = chapter.items.filter((item) => isPlanItemDone(progress, plan, item)).length;
          return (
            <section key={chapter.id} className="mt-6 rounded-2xl bg-white border border-brand-100 shadow-card overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-brand-50">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h2 className="font-extrabold text-brand-900">
                    <span className="text-brand-500 mr-1.5">{chapterIdx + 1}.</span>
                    {chapter.title}
                  </h2>
                  <span className="ml-auto text-xs font-bold text-brand-700">{chapterDone}/{chapter.items.length}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-brand-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-500"
                    style={{ width: `${chapter.items.length ? (chapterDone / chapter.items.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <ul className="divide-y divide-brand-50">
                {chapter.items.map((item) => {
                  const done = isPlanItemDone(progress, plan, item);
                  const checked = isPlanItemChecked(progress, plan.id, item.key);
                  const autoDone = done && !checked; // finished elsewhere on the site
                  const chip = item.type === 'problem' ? diffClass(item.meta) : null;
                  const clickable = item.type !== 'task';

                  return (
                    <li key={item.key} className={`flex items-center gap-3 px-5 py-3 ${done ? 'bg-brand-50/60' : ''}`}>
                      {/* Manual tick — always available, even for auto items */}
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={done}
                        aria-label={`Mark done: ${item.label}`}
                        onClick={() => togglePlanItem(plan.id, item.key)}
                        className={`grid place-items-center w-6 h-6 shrink-0 rounded-md border-2 text-[0.8rem] font-extrabold transition ${
                          done
                            ? 'bg-brand-600 border-brand-600 text-white'
                            : 'bg-white border-brand-300 text-transparent hover:border-brand-500'
                        }`}
                      >
                        ✓
                      </button>

                      <span className="text-base shrink-0" aria-hidden="true">{TYPE_ICON[item.type] || '•'}</span>

                      {/* Label — clicking goes to the thing itself */}
                      {clickable ? (
                        <button
                          type="button"
                          onClick={() => navigate(item)}
                          className={`flex-1 min-w-0 text-left text-[0.95rem] font-medium leading-snug transition hover:text-brand-700 ${
                            done ? 'text-slate-500 line-through decoration-brand-300' : 'text-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ) : (
                        <span className={`flex-1 min-w-0 text-[0.95rem] font-medium leading-snug ${done ? 'text-slate-500 line-through decoration-brand-300' : 'text-slate-800'}`}>
                          {item.label}
                        </span>
                      )}

                      {autoDone && (
                        <span className="shrink-0 text-[0.65rem] font-extrabold bg-brand-600 text-white px-2 py-0.5 rounded-full" title="You already did this elsewhere on the site">
                          auto ✓
                        </span>
                      )}
                      {chip ? (
                        <span className={`${chip} shrink-0`}>{item.meta}</span>
                      ) : (
                        item.meta && <span className="shrink-0 text-xs font-semibold text-slate-400 whitespace-nowrap">{item.meta}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        <p className="mt-6 text-sm text-slate-500 leading-relaxed">
          Rows tick themselves when you finish the guide or solve the problem elsewhere on the site —
          look for the <span className="font-bold text-brand-700">auto ✓</span> badge. You can still tick
          (or untick) anything by hand with the checkbox.
        </p>
      </div>
    );
  }

  // ---------- plan cards (LeetCode-style grid) ----------

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
      <h1 className="text-3xl md:text-4xl font-extrabold text-brand-900">📋 Study Plans</h1>
      <p className="text-slate-600 mt-2 max-w-3xl leading-relaxed">
        Pick a plan, work down the list, tick things off — no dates, no deadlines.
        Reading a guide or solving a problem anywhere on the site ticks the matching items for you.
      </p>

      {PLANS.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white border border-brand-100 shadow-card p-8 text-center">
          <p className="text-4xl" aria-hidden="true">🌱</p>
          <p className="font-bold text-brand-900 mt-3">No study plans yet</p>
          <p className="text-sm text-slate-600 mt-1">Plans are on their way — meanwhile, the Notes and DSA Sheet are wide open.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {PLANS.map((plan) => {
            const { done, total } = countsFor(plan);
            const started = Boolean(progress.planStart?.[plan.id]);
            const pct = total ? Math.round((done / total) * 100) : 0;

            return (
              <div
                key={plan.id}
                role="button"
                tabIndex={0}
                onClick={() => openPlan(plan)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlan(plan); } }}
                className="card-hover cursor-pointer text-left bg-white rounded-2xl border border-brand-100 shadow-card p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden="true">{plan.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-extrabold text-lg text-slate-900 leading-snug">{plan.title}</h2>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{plan.tagline}</p>
                  </div>
                  {started && <ProgressRing done={done} total={total} />}
                </div>

                <p className="text-xs font-bold text-brand-700 mt-4">
                  {total} items · {plan.chapters.length} chapters
                  {started && done > 0 ? ` · ${done} done` : ''}
                </p>

                {started ? (
                  <>
                    <div className="mt-3 h-2 rounded-full bg-brand-100 overflow-hidden">
                      <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="btn-primary mt-4 w-full text-sm">Continue →</span>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); startAndOpen(plan); }}
                    className="btn-primary mt-4 w-full text-sm"
                  >
                    Start plan
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-sm text-slate-500">
        New here? <span className="font-semibold text-brand-700">SQL 50</span> and{' '}
        <span className="font-semibold text-brand-700">JavaScript 30</span> are the friendliest first picks —
        or jump straight into <span className="font-semibold text-brand-700">Top Interview 60</span> if the interview is close.
      </p>
    </div>
  );
}
