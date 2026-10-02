// DsaSheet.jsx — the DSA Sheet: every problem, topic by topic, LeetCode-sheet style.
//
// Data comes from client/src/data/dsaSheet.js (DSA_TOPICS + PROBLEMS +
// problemsByTopic). Solved/attempted state lives in the one site-wide
// progress store (lib/progress.jsx) — same store the Notes sidebar and
// Navbar chip read, so a tick here lights up everywhere instantly.
//
// Plain student voice on purpose: these are my own practice sheets, written
// the way I would explain them in an interview.

import { useMemo, useState } from 'react';
import { DSA_TOPICS, PROBLEMS, problemsByTopic } from '../data/dsaSheet';
import { useProgress } from '../lib/progress.jsx';
import { isProblemSolved } from '../lib/progress';

const STATUS_FILTERS = ['All', 'Unsolved', 'Solved', 'Attempted'];
const DIFFICULTY_FILTERS = ['All', 'Easy', 'Medium', 'Hard'];

// Work out a problem's state from the progress store.
//   solved    → green tick
//   attempted → tried at least once (attempts > 0) but not solved yet
//   todo      → never touched
function problemState(progress, id) {
  const entry = progress?.problems?.[id];
  if (entry?.solved) return 'solved';
  if ((entry?.attempts || 0) > 0) return 'attempted';
  return 'todo';
}

function difficultyChipClass(difficulty) {
  // .diff-easy / .diff-medium / .diff-hard are the shared chip styles.
  return `diff-${String(difficulty).toLowerCase()}`;
}

export default function DsaSheet({ onOpenProblem }) {
  const { progress } = useProgress();
  const [statusFilter, setStatusFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  // Overall progress for the header — solved X out of every problem on the sheet.
  const solvedCount = useMemo(
    () => PROBLEMS.reduce((count, problem) => count + (isProblemSolved(progress, problem.id) ? 1 : 0), 0),
    [progress],
  );
  const totalCount = PROBLEMS.length;
  const overallPct = totalCount ? Math.round((solvedCount / totalCount) * 100) : 0;

  const matchesFilters = (problem) => {
    if (difficultyFilter !== 'All' && problem.difficulty !== difficultyFilter) return false;
    if (statusFilter === 'All') return true;
    const state = problemState(progress, problem.id);
    if (statusFilter === 'Solved') return state === 'solved';
    if (statusFilter === 'Attempted') return state === 'attempted';
    // 'Unsolved' = not solved yet (covers both todo and attempted-but-stuck).
    if (statusFilter === 'Unsolved') return state !== 'solved';
    return true;
  };

  // Group in DSA_TOPICS order; topics with nothing left after filtering
  // are hidden entirely so the page never shows an empty shell.
  const visibleTopics = useMemo(
    () =>
      DSA_TOPICS.map((topic) => {
        const all = typeof problemsByTopic === 'function'
          ? problemsByTopic(topic.id)
          : PROBLEMS.filter((problem) => problem.topic === topic.id);
        const filtered = all.filter(matchesFilters);
        const topicSolved = all.reduce(
          (count, problem) => count + (isProblemSolved(progress, problem.id) ? 1 : 0),
          0,
        );
        return { topic, all, filtered, topicSolved };
      }).filter((entry) => entry.filtered.length > 0),
    // matchesFilters closes over the filters + progress; listing them all
    // keeps the memo honest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress, statusFilter, difficultyFilter],
  );

  const hasAnyVisible = visibleTopics.length > 0;

  const chipBase =
    'rounded-full px-3.5 py-1.5 text-sm font-semibold border transition whitespace-nowrap';
  const chipCls = (active) =>
    `${chipBase} ${active ? 'bg-brand-600 text-white border-brand-600 shadow-card' : 'bg-white text-brand-800 border-brand-200 hover:border-brand-400 hover:bg-brand-50'}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
      {/* Header + overall progress */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-brand-900">🧩 DSA Sheet</h1>
          <p className="text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Topic by topic, in the order I actually practise them. Open a problem, write the
            function, run the tests — green means solved, and it stays solved on every page.
          </p>
        </div>
        <div className="bg-white border border-brand-100 rounded-2xl shadow-card px-5 py-4 min-w-[220px]">
          <div className="flex items-baseline justify-between gap-6">
            <span className="text-sm font-bold text-brand-900">Overall progress</span>
            <span className="text-sm font-extrabold text-brand-700">
              {solvedCount}/{totalCount} solved
            </span>
          </div>
          <div className="mt-2.5 h-2.5 rounded-full bg-brand-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">{overallPct}% done — one problem at a time.</p>
        </div>
      </div>

      {/* Filters: status, then difficulty */}
      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-500 mr-1">Status:</span>
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              aria-pressed={statusFilter === filter}
              className={chipCls(statusFilter === filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-500 mr-1">Difficulty:</span>
          {DIFFICULTY_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setDifficultyFilter(filter)}
              aria-pressed={difficultyFilter === filter}
              className={chipCls(difficultyFilter === filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Topic sections */}
      {hasAnyVisible ? (
        <div className="mt-7 space-y-6">
          {visibleTopics.map(({ topic, all, filtered, topicSolved }) => {
            const topicPct = all.length ? Math.round((topicSolved / all.length) * 100) : 0;
            return (
              <section
                key={topic.id}
                className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-brand-100 bg-brand-50/70 px-5 py-3.5">
                  <h2 className="font-extrabold text-brand-900">
                    <span className="mr-1.5" aria-hidden="true">{topic.emoji}</span>
                    {topic.title}
                  </h2>
                  <span className="text-xs font-bold text-brand-700">
                    {topicSolved}/{all.length} solved
                  </span>
                  <div className="ml-auto flex items-center gap-2 min-w-[140px]">
                    <div className="h-2 flex-1 rounded-full bg-brand-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-600 transition-all duration-500"
                        style={{ width: `${topicPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500">{topicPct}%</span>
                  </div>
                </div>

                <ul className="divide-y divide-brand-50">
                  {filtered.map((problem) => {
                    const state = problemState(progress, problem.id);
                    const attempts = progress?.problems?.[problem.id]?.attempts || 0;
                    return (
                      <li key={problem.id}>
                        <div className="card-hover flex items-center gap-3 px-5 py-3 transition hover:bg-brand-50/60">
                          {/* Status icon: ✓ solved / ◐ attempted / ○ todo */}
                          <span
                            aria-label={state === 'solved' ? 'Solved' : state === 'attempted' ? 'Attempted' : 'Not attempted yet'}
                            title={state === 'solved' ? 'Solved' : state === 'attempted' ? 'Attempted' : 'Not attempted yet'}
                            className={`grid place-items-center w-6 h-6 rounded-full text-sm font-extrabold shrink-0 ${
                              state === 'solved'
                                ? 'bg-brand-600 text-white'
                                : state === 'attempted'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'border-2 border-brand-200 text-transparent'
                            }`}
                          >
                            {state === 'solved' ? '✓' : state === 'attempted' ? '◐' : '○'}
                          </span>

                          <button
                            type="button"
                            onClick={() => onOpenProblem?.(problem.id)}
                            className="flex-1 text-left font-semibold text-slate-800 hover:text-brand-700 transition leading-snug"
                          >
                            {problem.title}
                          </button>

                          {attempts > 0 && (
                            <span className="hidden sm:inline text-xs font-semibold text-slate-400 whitespace-nowrap">
                              {attempts} attempt{attempts === 1 ? '' : 's'}
                            </span>
                          )}

                          <span className={difficultyChipClass(problem.difficulty)}>{problem.difficulty}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-7 rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-12 text-center shadow-card">
          <p className="text-3xl" aria-hidden="true">🔍</p>
          <h2 className="mt-3 font-bold text-slate-800">No problems match these filters</h2>
          <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Nothing on the sheet is both “{statusFilter}” and “{difficultyFilter}” right now.
            Loosen a filter — or just go solve something new.
          </p>
          <button
            type="button"
            className="btn-primary mt-5"
            onClick={() => {
              setStatusFilter('All');
              setDifficultyFilter('All');
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
