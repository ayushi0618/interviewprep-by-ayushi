// Problems.jsx — the LeetCode-style problemset: every DSA problem in one
// searchable, filterable table, plus a deterministic Problem of the Day.
//
// Everything on this page is derived from the imported data
// (data/dsaSheet.js: PROBLEMS + DSA_TOPICS) and the one site-wide progress
// store (lib/progress.jsx / lib/progress.js) — no hardcoded counts, no
// invented stats (no acceptance %, no submission numbers). Clicking any
// problem calls onProblem(id), which the router turns into the problem page.

import { useMemo, useState } from 'react';
import { PROBLEMS, DSA_TOPICS } from '../data/dsaSheet';
import { useProgress } from '../lib/progress.jsx';
import { isProblemSolved, problemSolvedCount } from '../lib/progress';

const DIFFICULTY_FILTERS = ['All', 'Easy', 'Medium', 'Hard'];
const STATUS_FILTERS = ['All', 'Solved', 'Unsolved'];
const SORT_OPTIONS = [
  { id: 'default', label: 'Default order' },
  { id: 'title', label: 'Title A–Z' },
  { id: 'difficulty', label: 'Difficulty' },
];
const DIFFICULTY_RANK = { Easy: 0, Medium: 1, Hard: 2 };

// Difficulty chips in Tailwind classes only — emerald (once the
// central recolor lands) for Easy, amber for Medium, rose for Hard.
function difficultyChipClass(difficulty) {
  switch (difficulty) {
    case 'Easy':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Medium':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Hard':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

// Problem of the Day: seed a simple string hash from the local date
// (YYYYMMDD) and take it modulo the live problem count, so the pick is the
// same for the whole local day and rolls over at midnight.
function problemOfTheDay(problems) {
  if (!problems.length) return null;
  const now = new Date();
  const key = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return problems[hash % problems.length];
}

export default function Problems({ onProblem }) {
  const { progress } = useProgress();
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [topicFilter, setTopicFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('default');

  const topicById = useMemo(
    () => Object.fromEntries(DSA_TOPICS.map((topic) => [topic.id, topic])),
    [],
  );

  const totalCount = PROBLEMS.length;
  const solvedCount = useMemo(
    () => problemSolvedCount(progress, PROBLEMS.map((problem) => problem.id)),
    [progress],
  );

  const potd = useMemo(() => problemOfTheDay(PROBLEMS), []);
  const potdSolved = potd ? isProblemSolved(progress, potd.id) : false;
  const potdDateLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [],
  );

  const visibleProblems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = PROBLEMS.filter((problem) => {
      if (query && !problem.title.toLowerCase().includes(query)) return false;
      if (difficultyFilter !== 'All' && problem.difficulty !== difficultyFilter) return false;
      if (topicFilter !== 'All' && problem.topic !== topicFilter) return false;
      if (statusFilter !== 'All') {
        const solved = isProblemSolved(progress, problem.id);
        if (statusFilter === 'Solved' && !solved) return false;
        if (statusFilter === 'Unsolved' && solved) return false;
      }
      return true;
    });
    if (sortBy === 'title') {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === 'difficulty') {
      return [...filtered].sort(
        (a, b) =>
          (DIFFICULTY_RANK[a.difficulty] ?? 99) - (DIFFICULTY_RANK[b.difficulty] ?? 99) ||
          a.title.localeCompare(b.title),
      );
    }
    return filtered;
  }, [search, difficultyFilter, topicFilter, statusFilter, sortBy, progress]);

  const hasActiveFilters =
    search.trim() !== '' || difficultyFilter !== 'All' || topicFilter !== 'All' || statusFilter !== 'All';

  const resetFilters = () => {
    setSearch('');
    setDifficultyFilter('All');
    setTopicFilter('All');
    setStatusFilter('All');
    setSortBy('default');
  };

  const selectCls =
    'rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-800 shadow-card transition hover:border-brand-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

  return (
    <div className="page-container page-y">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-brand-900">💻 Problems</h1>
          <p className="text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Every practice problem in one list. Search, filter, and pick one — the tick next to
            it means you have solved it, here or anywhere else on the site.
          </p>
        </div>
        <div className="bg-white border border-brand-100 rounded-2xl shadow-card px-5 py-4">
          <p className="text-sm font-bold text-brand-900">
            {totalCount} problems · {solvedCount} solved
          </p>
        </div>
      </div>

      {/* Problem of the Day */}
      {potd && (
        <button
          type="button"
          onClick={() => onProblem?.(potd.id)}
          className="card-hover mt-6 block w-full text-left rounded-2xl border border-brand-200 bg-white shadow-card px-5 py-4 md:px-6 md:py-5 transition"
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex-1 min-w-[220px]">
              <p className="text-xs font-extrabold uppercase tracking-wider text-brand-600">
                ⭐ Problem of the Day · {potdDateLabel}
              </p>
              <p className="mt-1.5 text-lg md:text-xl font-extrabold text-brand-900 leading-snug">
                {potd.title}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">
                {topicById[potd.topic]?.emoji ? `${topicById[potd.topic].emoji} ` : ''}
                {topicById[potd.topic]?.title || potd.topic}
                {potdSolved ? ' · ✅ Solved' : ''}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${difficultyChipClass(
                potd.difficulty,
              )}`}
            >
              {potd.difficulty}
            </span>
            <span className="btn-primary pointer-events-none">Solve today’s problem →</span>
          </div>
        </button>
      )}

      {/* Controls */}
      <div className="mt-6 bg-white border border-brand-100 rounded-2xl shadow-card px-4 py-4 md:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 flex-1 min-w-[220px] rounded-xl border border-brand-200 bg-white px-3 py-2 shadow-card transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
            <span aria-hidden="true" className="text-slate-400">🔍</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search problems by title…"
              aria-label="Search problems by title"
              className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
            Difficulty
            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value)}
              className={selectCls}
              aria-label="Filter by difficulty"
            >
              {DIFFICULTY_FILTERS.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
            Topic
            <select
              value={topicFilter}
              onChange={(event) => setTopicFilter(event.target.value)}
              className={selectCls}
              aria-label="Filter by topic"
            >
              <option value="All">All topics</option>
              {DSA_TOPICS.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={selectCls}
              aria-label="Filter by status"
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
            Sort
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className={selectCls}
              aria-label="Sort problems"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-sm text-slate-500" aria-live="polite">
            Showing <span className="font-bold text-brand-800">{visibleProblems.length}</span> of{' '}
            {totalCount} problems
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-bold text-brand-700 underline decoration-brand-300 underline-offset-2 transition hover:text-brand-600"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Problem table */}
      {visibleProblems.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-card">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="bg-brand-50/70 text-xs font-extrabold uppercase tracking-wider text-brand-800">
                <th scope="col" className="px-5 py-3.5 w-16">Status</th>
                <th scope="col" className="px-3 py-3.5">Title</th>
                <th scope="col" className="px-3 py-3.5 hidden md:table-cell">Topic</th>
                <th scope="col" className="px-5 py-3.5 text-right">Difficulty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {visibleProblems.map((problem) => {
                const solved = isProblemSolved(progress, problem.id);
                const topic = topicById[problem.topic];
                return (
                  <tr key={problem.id} className="transition hover:bg-brand-50/60">
                    <td className="px-5 py-3">
                      <span
                        role="img"
                        aria-label={solved ? 'Solved' : 'Not solved yet'}
                        title={solved ? 'Solved' : 'Not solved yet'}
                        className={
                          solved
                            ? 'text-brand-600 text-base font-extrabold leading-none'
                            : 'text-brand-200 text-base font-bold leading-none'
                        }
                      >
                        {solved ? '✓' : '○'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => onProblem?.(problem.id)}
                        className="font-semibold text-slate-800 leading-snug transition hover:text-brand-700"
                      >
                        {problem.title}
                      </button>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="font-medium text-slate-500 whitespace-nowrap">
                        {topic?.emoji ? `${topic.emoji} ` : ''}
                        {topic?.title || problem.topic}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${difficultyChipClass(
                          problem.difficulty,
                        )}`}
                      >
                        {problem.difficulty}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-12 text-center shadow-card">
          <p className="text-3xl" aria-hidden="true">🔍</p>
          <h2 className="mt-3 font-bold text-slate-800">No problems match</h2>
          <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Nothing fits the current search and filter combination. Try a shorter search term, or
            clear the filters to see the whole list again.
          </p>
          <button type="button" className="btn-primary mt-5" onClick={resetFilters}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
