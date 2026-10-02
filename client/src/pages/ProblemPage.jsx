// ProblemPage.jsx — one DSA problem: statement on the left, code + judge on the right.
//
// Left column is for understanding (statement, examples, constraints, hints,
// and the explanation — locked until the first run so I actually try before
// reading the answer, which is kind of the whole point). Right column is
// for doing: my code in the shared CodeEditor, Run checks the visible tests,
// Submit also runs the hidden ones. Only an all-green Submit marks the
// problem solved in the site-wide progress store.

import { useEffect, useMemo, useRef, useState } from 'react';
import { PROBLEMS, getProblem } from '../data/dsaSheet';
import { useProgress } from '../lib/progress.jsx';
import CodeEditor from '../components/CodeEditor';
import { runJudge, formatValue } from '../lib/judge';
import { LEVEL_CLASS } from '../lib/runCode';

function difficultyChipClass(difficulty) {
  return `diff-${String(difficulty).toLowerCase()}`;
}

// Examples/constraints authoring is loose (strings, or raw values), so for
// display: strings print as written, anything else goes through formatValue.
function displayValue(value) {
  return typeof value === 'string' ? value : formatValue(value);
}

export default function ProblemPage({ problemId, onBack, onOpenProblem, onOpenArticle }) {
  const { progress, recordProblemAttempt, recordProblemSolved, saveProblemCode } = useProgress();

  const problem = useMemo(() => getProblem(problemId), [problemId]);

  const [code, setCode] = useState('');
  const [judging, setJudging] = useState(false);
  // Last judge outcome: { mode: 'run' | 'submit', results, logs, error, timedOut }.
  const [judgeResult, setJudgeResult] = useState(null);
  const [revealedHints, setRevealedHints] = useState(0);
  // Two-step solution reveal: "View solution" first asks "Are you sure?".
  const [confirmSolution, setConfirmSolution] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const saveTimerRef = useRef(null);
  // Ref mirror of `judging` so the async handler can guard double-clicks
  // without stale-closure surprises.
  const judgingRef = useRef(false);

  // (Re)load the editor whenever we land on a different problem: my last
  // saved code if I have any, otherwise the starter. Everything else
  // (results, hints, solution) starts fresh for the new problem.
  useEffect(() => {
    if (!problem) return;
    setCode(progress.problems?.[problem.id]?.lastCode ?? problem.starterCode ?? '');
    setJudgeResult(null);
    setJudging(false);
    judgingRef.current = false;
    setRevealedHints(0);
    setConfirmSolution(false);
    setShowSolution(false);
    // progress is read as a one-time snapshot here on purpose — depending on
    // it would reset the editor every time progress changes (e.g. on solve).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem]);

  // Drop a pending debounced save when the page unmounts.
  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  if (!problem) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-8 text-center">
          <p className="text-3xl" aria-hidden="true">🧩</p>
          <h1 className="mt-3 text-xl font-extrabold text-brand-900">Problem not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            That problem id isn&apos;t on the sheet. Head back and pick one from the list.
          </p>
          <button type="button" onClick={() => onBack?.()} className="btn-primary mt-5">
            ← Back to DSA Sheet
          </button>
        </div>
      </div>
    );
  }

  const entry = progress.problems?.[problem.id];
  const isSolved = Boolean(entry?.solved);
  const attempts = entry?.attempts || 0;
  // The explanation unlocks after the first genuine try (or if already solved).
  const explanationUnlocked = isSolved || attempts > 0 || judgeResult !== null;

  const problemIndex = PROBLEMS.findIndex((p) => p.id === problem.id);
  const nextProblem = problemIndex >= 0 ? PROBLEMS[problemIndex + 1] : undefined;

  // Type → keep locally right away, persist after ~400ms of quiet so we
  // are not writing to localStorage on every single keystroke.
  const handleCodeChange = (next) => {
    setCode(next);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProblemCode(problem.id, next);
    }, 400);
  };

  const handleJudge = async (mode) => {
    if (judgingRef.current) return;
    judgingRef.current = true;
    setJudging(true);
    // Save first so a refresh mid-judge never loses the code, then count
    // this click as exactly one attempt (Run and Submit both count).
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveProblemCode(problem.id, code);
    recordProblemAttempt(problem.id);

    const testsToRun =
      mode === 'submit'
        ? [...(problem.visibleTests || []), ...(problem.hiddenTests || [])]
        : [...(problem.visibleTests || [])];

    const outcome = await runJudge({ problem, code, tests: testsToRun, timeoutMs: 6000 });
    const result = { mode, ...outcome };
    setJudgeResult(result);
    judgingRef.current = false;
    setJudging(false);

    // Accepted = Submit, no fatal error, no timeout, and every test green.
    if (
      mode === 'submit' &&
      !outcome.error &&
      !outcome.timedOut &&
      outcome.results.length > 0 &&
      outcome.results.every((r) => r.pass)
    ) {
      recordProblemSolved(problem.id, code);
    }
  };

  const handleReset = () => {
    const starter = problem.starterCode ?? '';
    setCode(starter);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveProblemCode(problem.id, starter);
    setJudgeResult(null);
  };

  // Verdict maths for the banner + results panel.
  const results = judgeResult?.results ?? [];
  const passedCount = results.filter((r) => r.pass).length;
  const firstFailedIndex = results.findIndex((r) => !r.pass);
  const allPassed =
    judgeResult !== null &&
    !judgeResult.error &&
    !judgeResult.timedOut &&
    results.length > 0 &&
    results.every((r) => r.pass);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
      {/* Header: back, title, chips */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => onBack?.()} className="btn-outline">
          ← DSA Sheet
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-brand-900 leading-tight">{problem.title}</h1>
        <span className={difficultyChipClass(problem.difficulty)}>{problem.difficulty}</span>
        {isSolved ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-extrabold text-white">
            ✓ Solved
          </span>
        ) : attempts > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">
            ◐ Attempted · {attempts} attempt{attempts === 1 ? '' : 's'}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => onOpenArticle?.('dsa')}
          className="ml-auto text-sm font-bold text-brand-700 hover:text-brand-600 transition"
        >
          📖 Read the DSA notes →
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2 items-start">
        {/* ---------- Left: understand the problem ---------- */}
        <div className="space-y-5 min-w-0">
          {/* Statement */}
          <section className="bg-white rounded-2xl border border-brand-100 shadow-card p-5 md:p-6">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-brand-500">Problem</h2>
            <div className="mt-3 text-[0.98rem] leading-relaxed text-slate-700 whitespace-pre-wrap">
              {problem.statement}
            </div>

            {/* Examples */}
            {problem.examples?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-extrabold text-slate-900">Examples</h3>
                <div className="mt-3 space-y-3">
                  {problem.examples.map((example, i) => (
                    <div key={i} className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
                      <p className="text-xs font-extrabold text-brand-700">Example {i + 1}</p>
                      <p className="mt-2 text-xs font-bold text-slate-500">Input</p>
                      <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 font-mono text-[0.82rem] text-slate-100 whitespace-pre-wrap break-words">
                        {displayValue(example.input)}
                      </pre>
                      <p className="mt-2 text-xs font-bold text-slate-500">Output</p>
                      <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 font-mono text-[0.82rem] text-slate-100 whitespace-pre-wrap break-words">
                        {displayValue(example.output)}
                      </pre>
                      {example.explanation ? (
                        <p className="mt-2.5 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                          {example.explanation}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Constraints */}
            {problem.constraints ? (
              <div className="mt-6">
                <h3 className="text-sm font-extrabold text-slate-900">Constraints</h3>
                {Array.isArray(problem.constraints) ? (
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-600 leading-relaxed">
                    {problem.constraints.map((line, i) => (
                      <li key={i} className="whitespace-pre-wrap">{String(line)}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {String(problem.constraints)}
                  </div>
                )}
              </div>
            ) : null}
          </section>

          {/* Hints — revealed one at a time, easiest nudge first */}
          {problem.hints?.length > 0 && (
            <section className="bg-white rounded-2xl border border-brand-100 shadow-card p-5 md:p-6">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-brand-500">Hints</h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Try without them first. Really. They&apos;re here for when you&apos;re properly stuck.
              </p>
              <div className="mt-3 space-y-2.5">
                {problem.hints.map((hint, i) => {
                  if (i < revealedHints) {
                    return (
                      <div
                        key={i}
                        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 whitespace-pre-wrap"
                      >
                        <span className="font-extrabold">💡 Hint {i + 1}: </span>
                        {hint}
                      </div>
                    );
                  }
                  if (i === revealedHints) {
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRevealedHints(i + 1)}
                        className="btn-outline"
                      >
                        💡 Hint {i + 1}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
            </section>
          )}

          {/* Explanation — locked until the first run/submit */}
          <section className="bg-white rounded-2xl border border-brand-100 shadow-card p-5 md:p-6">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-brand-500">Explanation</h2>
            {!explanationUnlocked ? (
              <div className="mt-3 rounded-xl border border-dashed border-brand-200 bg-brand-50/60 px-4 py-4 text-center">
                <p className="text-xl" aria-hidden="true">🔒</p>
                <p className="mt-1.5 text-sm font-semibold text-slate-700">
                  Run or submit once to unlock the full explanation
                </p>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  Give it a real try first — even a wrong answer teaches more than reading the answer cold.
                </p>
              </div>
            ) : (
              <div className="mt-3">
                {problem.explanation ? (
                  <div className="text-[0.95rem] leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {problem.explanation}
                  </div>
                ) : null}

                {problem.complexity ? (
                  <div className="mt-4 rounded-xl bg-slate-900 px-4 py-3 font-mono text-[0.85rem] text-slate-100 whitespace-pre-wrap">
                    {typeof problem.complexity === 'string'
                      ? problem.complexity
                      : [
                          problem.complexity.time ? `Time: ${problem.complexity.time}` : null,
                          problem.complexity.space ? `Space: ${problem.complexity.space}` : null,
                        ]
                          .filter(Boolean)
                          .join('\n') || formatValue(problem.complexity)}
                  </div>
                ) : null}

                {/* Solution behind a deliberate two-step reveal */}
                {problem.solutionCode ? (
                  <div className="mt-4">
                    {!showSolution ? (
                      !confirmSolution ? (
                        <button type="button" onClick={() => setConfirmSolution(true)} className="btn-outline">
                          View solution
                        </button>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-600">Sure? Try once more first —</span>
                          <button type="button" onClick={() => setShowSolution(true)} className="btn-primary">
                            Are you sure? View
                          </button>
                          <button type="button" onClick={() => setConfirmSolution(false)} className="btn-outline">
                            Not yet
                          </button>
                        </div>
                      )
                    ) : (
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                          Reference solution — read it, close it, retype it yourself
                        </p>
                        <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-[0.85rem] leading-relaxed text-slate-100 shadow-card whitespace-pre">
                          {problem.solutionCode}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>

        {/* ---------- Right: write it, run it ---------- */}
        <div className="space-y-5 min-w-0 lg:sticky lg:top-20">
          <div className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-card">
            <div className="flex flex-wrap items-center gap-2 border-b border-brand-100 bg-brand-50 px-4 py-2.5">
              <span className="font-mono text-xs font-semibold text-brand-700">{problem.fn}.js</span>
              <span className="text-xs text-slate-400">
                Define <code className="font-mono font-semibold text-slate-500">function {problem.fn}(...)</code>
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleJudge('run')}
                  disabled={judging}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {judging ? 'Judging…' : '▶ Run tests'}
                </button>
                <button
                  type="button"
                  onClick={() => handleJudge('submit')}
                  disabled={judging}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {judging ? 'Judging…' : '🚀 Submit'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={judging}
                  className="btn-outline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ↺ Reset
                </button>
              </div>
            </div>

            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              onRunShortcut={() => handleJudge('run')}
              ariaLabel={`Code editor for ${problem.title}`}
              heightClass="h-[440px]"
            />

            <p className="border-t border-brand-100 bg-brand-50/60 px-4 py-2 text-xs text-slate-500">
              Tip: <span className="font-semibold text-slate-600">Ctrl + Enter</span> runs the visible tests ·{' '}
              <span className="font-semibold text-slate-600">Run</span> = visible tests only,{' '}
              <span className="font-semibold text-slate-600">Submit</span> also runs the hidden ones.
            </p>
          </div>

          {/* Results panel */}
          <section
            aria-live="polite"
            className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-card"
          >
            <div className="flex items-center gap-2 border-b border-brand-100 bg-brand-50 px-4 py-2.5">
              <span className="text-sm font-bold text-brand-900">Test results</span>
              {judging && <span className="text-xs font-semibold text-amber-600">● Judging…</span>}
              {!judging && judgeResult && !judgeResult.error && !judgeResult.timedOut && results.length > 0 && (
                <span className="text-xs font-bold text-slate-500">
                  {passedCount}/{results.length} passed
                  {judgeResult.mode === 'run' ? ' (visible)' : ' (visible + hidden)'}
                </span>
              )}
            </div>

            <div className="p-4">
              {judging ? (
                <p className="text-sm text-slate-500">Running your code in the sandbox…</p>
              ) : !judgeResult ? (
                <p className="text-sm text-slate-500 leading-relaxed">
                  Press <strong className="text-slate-700">▶ Run tests</strong> to check the visible tests, or{' '}
                  <strong className="text-slate-700">🚀 Submit</strong> when you think it&apos;s fully correct.
                  Per-test input, expected and your output will show up here.
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Verdict banner */}
                  {allPassed && judgeResult.mode === 'submit' && (
                    <div className="rounded-xl border border-brand-300 bg-brand-50 px-4 py-3.5 text-center">
                      <p className="font-extrabold text-brand-800">🎉 Accepted — all {results.length} tests passed</p>
                      <p className="mt-1 text-sm text-brand-700">Marked solved. On to the next one!</p>
                    </div>
                  )}
                  {allPassed && judgeResult.mode === 'run' && (
                    <div className="rounded-xl border border-brand-300 bg-brand-50 px-4 py-3.5 text-center">
                      <p className="font-extrabold text-brand-800">
                        ✅ All {results.length} visible tests passed
                      </p>
                      <p className="mt-1 text-sm text-brand-700">
                        Looking good — hit 🚀 Submit to face the hidden tests.
                      </p>
                    </div>
                  )}
                  {!allPassed && !judgeResult.error && !judgeResult.timedOut && results.length > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-center">
                      <p className="font-extrabold text-red-800">
                        Wrong answer — test {firstFailedIndex + 1} failed
                      </p>
                      <p className="mt-1 text-sm text-red-700">
                        {passedCount}/{results.length} passed. Compare expected vs yours on the red case below.
                      </p>
                    </div>
                  )}

                  {/* Fatal error (syntax error, fn missing, top-level throw…) */}
                  {judgeResult.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
                      <p className="text-sm font-extrabold text-red-800">Your code hit an error:</p>
                      <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm text-red-700">
                        {judgeResult.error}
                      </pre>
                      <p className="mt-2 text-sm text-red-700/80">
                        Fix it and run again — check the function name is exactly{' '}
                        <code className="font-mono font-bold">{problem.fn}</code>.
                      </p>
                    </div>
                  )}

                  {/* Timeout */}
                  {judgeResult.timedOut && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                      <p className="font-extrabold text-amber-900">⏱️ Timed out — took longer than 6 seconds</p>
                      <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                        Usually that means an infinite loop (a pointer that never moves, a while condition
                        that never turns false). Add a console.log inside the loop and Run again to see it spin.
                      </p>
                    </div>
                  )}

                  {/* Per-test rows */}
                  {results.length > 0 && (
                    <ul className="space-y-2">
                      {results.map((result, i) => (
                        <li
                          key={i}
                          className={`rounded-xl border px-4 py-3 ${
                            result.pass
                              ? 'border-brand-100 bg-brand-50/40'
                              : 'border-red-200 bg-red-50/70'
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`grid place-items-center w-5 h-5 rounded-full text-xs font-extrabold ${
                                result.pass ? 'bg-brand-600 text-white' : 'bg-red-500 text-white'
                              }`}
                              aria-hidden="true"
                            >
                              {result.pass ? '✓' : '✗'}
                            </span>
                            <span className="text-sm font-bold text-slate-800">Test {i + 1}</span>
                            <span className={`text-xs font-extrabold ${result.pass ? 'text-brand-700' : 'text-red-700'}`}>
                              {result.pass ? 'Passed' : 'Failed'}
                            </span>
                            <span className="ml-auto font-mono text-xs text-slate-400">
                              input: {(result.args || []).map((arg) => formatValue(arg)).join(', ')}
                            </span>
                          </div>
                          {/* Failing cases are expanded by default — that is where
                              the learning is. Passing rows still show the full
                              picture so nothing is a black box. */}
                          <div className="mt-2 grid gap-1.5 font-mono text-[0.82rem] leading-relaxed">
                            <p className="break-words whitespace-pre-wrap">
                              <span className="font-bold text-slate-500">expected: </span>
                              <span className="text-slate-800">{formatValue(result.expected)}</span>
                            </p>
                            <p className="break-words whitespace-pre-wrap">
                              <span className="font-bold text-slate-500">got: </span>
                              <span className={result.pass ? 'text-slate-800' : 'font-bold text-red-800'}>
                                {formatValue(result.got)}
                              </span>
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Console output from inside the student's code */}
                  {judgeResult.logs?.length > 0 && (
                    <div className="overflow-hidden rounded-xl bg-slate-950">
                      <p className="px-4 pt-2.5 text-[0.68rem] font-semibold uppercase tracking-wider text-slate-500">
                        Console output
                      </p>
                      <div className="nice-scroll max-h-44 overflow-y-auto px-4 pb-3 pt-1 font-mono text-[0.82rem] leading-relaxed">
                        {judgeResult.logs.map((log, i) => (
                          <div
                            key={i}
                            className={`whitespace-pre-wrap break-words ${LEVEL_CLASS[log.level] || LEVEL_CLASS.log}`}
                          >
                            {log.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Footer: next problem in sheet order */}
      {nextProblem && (
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={() => onOpenProblem?.(nextProblem.id)} className="btn-primary">
            Next problem → {nextProblem.title}
          </button>
        </div>
      )}
    </div>
  );
}
