// Roadmap.jsx — the DSA Roadmap: a NeetCode-style journey through the sheet.
//
// Twelve stops, one per DSA Sheet topic, in pattern order (arrays first,
// dynamic programming last). Every number on this page is derived live from
// the sheet data (data/dsaSheet.js) and the one site-wide progress store
// (lib/progress.jsx) — solved counts here always match the sheet itself.
// Nothing is decorative: no XP, no levels, just what is actually solved.
//
// Clicking a stop jumps to the sheet focused on that topic: we stash the
// topic id in sessionStorage ("ip_sheet_focus") and DsaSheet reads + clears
// it on mount, scrolling that topic's section into view. The small
// "Next: … →" link on each stop opens the first unsolved problem directly
// (or the first problem again, for review, once a topic is finished).

import { useMemo } from 'react';
import { DSA_TOPICS, PROBLEMS } from '../data/dsaSheet';
import { useProgress } from '../lib/progress.jsx';
import { isProblemSolved, problemSolvedCount } from '../lib/progress';

// Pattern order for the journey. This intentionally differs from the raw
// DSA_TOPICS order: stack & queue comes before binary search here, the way
// the patterns build on each other.
const ROADMAP_ORDER = [
  'arrays',
  'strings',
  'hashing',
  'two-pointers',
  'sliding-window',
  'stack-queue',
  'binary-search',
  'sorting',
  'linked-list',
  'trees',
  'graphs',
  'dp',
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// Shade ladder for the difficulty pills — all brand palette, darkest = Hard.
const DIFFICULTY_PILL = {
  Easy: 'bg-brand-50 text-brand-700 border-brand-200',
  Medium: 'bg-brand-100 text-brand-800 border-brand-300',
  Hard: 'bg-brand-600 text-white border-brand-600',
};

export default function Roadmap({ onSheet, onProblem }) {
  const { progress } = useProgress();

  // Per-topic rollup, derived from the data + progress store on every render.
  const nodes = useMemo(
    () =>
      ROADMAP_ORDER.map((topicId, index) => {
        const topic = DSA_TOPICS.find((t) => t.id === topicId) || { id: topicId, title: topicId, emoji: '🧩' };
        const problems = PROBLEMS.filter((p) => p.topic === topicId);
        const total = problems.length;
        const solved = problemSolvedCount(progress, problems.map((p) => p.id));
        const mix = { Easy: 0, Medium: 0, Hard: 0 };
        for (const p of problems) if (mix[p.difficulty] !== undefined) mix[p.difficulty] += 1;
        const nextUnsolved = problems.find((p) => !isProblemSolved(progress, p.id)) || null;
        const next = nextUnsolved || problems[0] || null;
        const state = total > 0 && solved === total ? 'done' : solved > 0 ? 'active' : 'todo';
        return { topic, index, problems, total, solved, mix, next, nextUnsolved, state, pct: total ? Math.round((solved / total) * 100) : 0 };
      }),
    [progress],
  );

  const totalSolved = useMemo(
    () => problemSolvedCount(progress, PROBLEMS.map((p) => p.id)),
    [progress],
  );
  const totalProblems = PROBLEMS.length;
  const overallPct = totalProblems ? Math.round((totalSolved / totalProblems) * 100) : 0;

  // First stop that still has work in it — drives the header "Continue" link.
  const currentNode = nodes.find((n) => n.nextUnsolved) || null;

  const jumpToTopic = (topicId) => {
    try {
      sessionStorage.setItem('ip_sheet_focus', topicId);
    } catch {
      /* storage blocked — the sheet still opens, just without the scroll */
    }
    onSheet?.();
  };

  const openNext = (event, node) => {
    event.stopPropagation();
    if (node.next) onProblem?.(node.next.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
      {/* Header + overall progress */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-brand-900">🗺️ DSA Roadmap</h1>
          <p className="text-slate-600 mt-2 max-w-2xl leading-relaxed">
            The sheet as a journey: twelve pattern stops, in the order they build on each
            other. Click any stop to jump straight to its problems on the sheet.
          </p>
        </div>
        <div className="bg-white border border-brand-100 rounded-2xl shadow-card px-5 py-4 min-w-[240px]">
          <div className="flex items-baseline justify-between gap-6">
            <span className="text-sm font-bold text-brand-900">Overall progress</span>
            <span className="text-sm font-extrabold text-brand-700">
              {totalSolved}/{totalProblems} solved
            </span>
          </div>
          <div className="mt-2.5 h-2.5 rounded-full bg-brand-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-4">
            <p className="text-xs text-slate-500">{overallPct}% of the sheet done.</p>
            {currentNode?.nextUnsolved && (
              <button
                type="button"
                onClick={() => onProblem?.(currentNode.nextUnsolved.id)}
                className="text-xs font-bold text-brand-700 hover:text-brand-600 hover:underline underline-offset-2 whitespace-nowrap"
              >
                Continue: {currentNode.nextUnsolved.title} →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="grid place-items-center w-4 h-4 rounded-full bg-brand-600 text-white text-[0.6rem] font-extrabold">✓</span>
          Topic finished
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-white border-[3px] border-brand-500" />
          In progress
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-brand-50 border-2 border-brand-200" />
          Not started yet
        </span>
      </div>

      {/* The path: vertical line on mobile, alternating sides on desktop.
          The filled overlay grows with real overall progress. */}
      <div className="relative mt-10 max-w-5xl mx-auto">
        <div aria-hidden="true" className="absolute top-2 bottom-2 left-6 md:left-1/2 w-1 -translate-x-1/2 rounded-full bg-brand-100" />
        <div
          aria-hidden="true"
          className="absolute top-2 left-6 md:left-1/2 w-1 -translate-x-1/2 rounded-full bg-brand-400 transition-all duration-700"
          style={{ height: `calc((100% - 1rem) * ${overallPct / 100})` }}
        />

        <ol className="relative space-y-6 md:space-y-2">
          {nodes.map((node) => {
            const { topic, state } = node;
            const onLeft = node.index % 2 === 0;
            return (
              <li
                key={topic.id}
                className={`relative pl-16 md:pl-0 md:w-1/2 md:pb-8 ${
                  onLeft ? 'md:pr-14' : 'md:ml-auto md:pl-14'
                }`}
              >
                {/* Horizontal stub from the line to the card (desktop only) */}
                <span
                  aria-hidden="true"
                  className={`hidden md:block absolute top-10 h-0.5 w-14 bg-brand-200 ${
                    onLeft ? 'right-0' : 'left-0'
                  }`}
                />
                {/* Node dot on the path */}
                <span
                  aria-hidden="true"
                  className={`absolute top-7 md:top-8 grid place-items-center w-5 h-5 rounded-full z-10 ${
                    onLeft
                      ? 'left-6 -translate-x-1/2 md:left-auto md:-right-2.5 md:translate-x-0'
                      : 'left-6 -translate-x-1/2 md:left-0'
                  } ${
                    state === 'done'
                      ? 'bg-brand-600 text-white text-[0.65rem] font-extrabold shadow-card'
                      : state === 'active'
                        ? 'bg-white border-[3px] border-brand-500 shadow-card'
                        : 'bg-brand-50 border-2 border-brand-200'
                  }`}
                >
                  {state === 'done' ? '✓' : ''}
                </span>

                {/* Stop card — click jumps to this topic on the sheet */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${topic.title} problems on the DSA Sheet`}
                  onClick={() => jumpToTopic(topic.id)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      jumpToTopic(topic.id);
                    }
                  }}
                  className={`card-hover cursor-pointer rounded-2xl border bg-white p-5 shadow-card transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    state === 'done'
                      ? 'border-brand-300 bg-brand-50/80'
                      : state === 'active'
                        ? 'border-brand-300 ring-2 ring-brand-400/60'
                        : 'border-brand-100'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Step badge: ✓ when finished, emoji otherwise */}
                    <span
                      aria-hidden="true"
                      className={`grid place-items-center w-11 h-11 rounded-full text-lg shrink-0 ${
                        state === 'done'
                          ? 'bg-brand-600 text-white text-base font-extrabold'
                          : state === 'active'
                            ? 'bg-white border-2 border-brand-500'
                            : 'bg-brand-50 border border-brand-100 opacity-70'
                      }`}
                    >
                      {state === 'done' ? '✓' : topic.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.7rem] font-extrabold uppercase tracking-wider text-brand-500">
                        Step {node.index + 1} of {nodes.length}
                      </p>
                      <h2 className="font-extrabold text-brand-900 leading-snug">{topic.title}</h2>
                      <p className={`text-xs font-semibold mt-0.5 ${state === 'todo' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {node.solved}/{node.total} solved
                        {state === 'done' ? ' — finished' : state === 'active' ? ` — ${node.pct}% there` : ''}
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-brand-700 bg-brand-100 rounded-full px-2 py-1 shrink-0">
                      {node.pct}%
                    </span>
                  </div>

                  {/* Mini progress bar */}
                  <div className="mt-3.5 h-2 rounded-full bg-brand-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all duration-500"
                      style={{ width: `${node.pct}%` }}
                    />
                  </div>

                  {/* Difficulty mix + next problem */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-2">
                    {DIFFICULTIES.map((d) => (
                      <span
                        key={d}
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.7rem] font-bold leading-none ${DIFFICULTY_PILL[d]}`}
                      >
                        {node.mix[d]} {d}
                      </span>
                    ))}
                    {node.next && (
                      <button
                        type="button"
                        onClick={(e) => openNext(e, node)}
                        className="ml-auto text-xs font-bold text-brand-700 hover:text-brand-600 hover:underline underline-offset-2 whitespace-nowrap"
                      >
                        {node.nextUnsolved ? 'Next' : 'Review'}: {node.next.title} →
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="mt-4 text-center text-sm text-slate-500">
        Prefer the full list?{' '}
        <button
          type="button"
          onClick={() => onSheet?.()}
          className="font-bold text-brand-700 hover:text-brand-600 hover:underline underline-offset-2"
        >
          Open the DSA Sheet →
        </button>
      </p>
    </div>
  );
}
