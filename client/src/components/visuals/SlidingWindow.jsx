import { useEffect, useState } from 'react';

// Sliding Window — longest substring without repeating characters.
// A window [L..R] slides over the string: R grows the window, and when a
// character repeats, L jumps past the previous occurrence. Examples like
// this are the #1 sliding-window interview pattern.

const S = 'abcabcbb';

const STEPS = [
  { l: 0, r: 0, say: 'Start: the window is just "a" (L and R both at index 0). No repeats yet.' },
  { l: 0, r: 1, say: 'Grow R: add b → window "ab", length 2. New best!' },
  { l: 0, r: 2, say: 'Grow R: add c → window "abc", length 3. New best!' },
  { l: 1, r: 3, say: 'Add a — but a already sits at index 0 inside the window. Move L past the old a (to index 1). Window becomes "bca", still length 3.' },
  { l: 2, r: 4, say: 'Add b — b was at index 1. Move L to 2. Window "cab", length 3.' },
  { l: 3, r: 5, say: 'Add c — c was at index 2. Move L to 3. Window "abc" again, length 3.' },
  { l: 5, r: 6, say: 'Add b — b was at index 4. L jumps to 5. The window shrinks to "cb", length 2.' },
  { l: 7, r: 7, say: 'Add b — b was just at index 6. L jumps to 7. Window is only "b" now.' },
  { l: 7, r: 7, done: true, say: 'String finished. The best window we ever saw was length 3. Answer: 3 (for example "abc").' },
];

export default function SlidingWindow() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = STEPS.length - 1;
  const s = STEPS[step];

  useEffect(() => {
    if (!playing) return undefined;
    if (step >= last) { setPlaying(false); return undefined; }
    const id = setTimeout(() => setStep(step + 1), 1300);
    return () => clearTimeout(id);
  }, [playing, step, last]);

  const reset = () => { setStep(0); setPlaying(false); };
  const togglePlay = () => {
    if (playing) { setPlaying(false); return; }
    if (step >= last) setStep(0);
    setPlaying(true);
  };

  // Best window seen in any step up to the current one.
  const upto = STEPS.slice(0, step + 1);
  const bestLen = Math.max(...upto.map((st) => st.r - st.l + 1));
  const bestStep = upto.find((st) => st.r - st.l + 1 === bestLen);
  const bestStr = S.slice(bestStep.l, bestStep.r + 1);
  const curStr = S.slice(s.l, s.r + 1);
  const curLen = s.r - s.l + 1;
  const movedL = step > 0 && STEPS[step - 1].l < s.l;

  return (
    <div className="viz-root my-6 overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-card">
      <div className="bg-brand-700 px-4 py-2.5 text-sm font-bold text-white">🪟 Sliding Window — longest substring without repeats</div>
      <div className="p-4">
        <div className="mb-3 font-mono text-sm text-slate-500">s = <span className="font-bold text-slate-800">&quot;{S}&quot;</span></div>
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-[430px] items-end gap-1.5 px-1">
            {S.split('').map((ch, i) => {
              const inWindow = i >= s.l && i <= s.r;
              const isR = i === s.r;
              const isL = i === s.l;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-5 items-center font-mono text-xs font-extrabold">
                    {isL && <span className="text-brand-600">L ▼</span>}
                    {isR && !isL && <span className="text-amber-600">R ▼</span>}
                    {isL && isR && <span className="text-brand-600">L·R ▼</span>}
                  </div>
                  <div className={`flex h-12 w-full items-center justify-center rounded-lg border-2 font-mono text-base font-bold transition-all duration-300 ${inWindow ? 'border-brand-600 bg-brand-500 text-white' : 'border-slate-200 bg-slate-50 text-slate-300'} ${isR && !s.done ? 'ring-4 ring-amber-300/70' : ''}`}>
                    {ch}
                  </div>
                  <div className="font-mono text-[0.65rem] text-slate-400">[{i}]</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-lg bg-slate-900 px-3 py-1.5 font-mono text-white">window: &quot;{curStr}&quot;</span>
          <span className="rounded-lg bg-brand-50 px-3 py-1.5 font-semibold text-brand-800">length: {curLen}</span>
          <span className="rounded-lg bg-amber-100 px-3 py-1.5 font-semibold text-amber-800">best so far: {bestLen} (&quot;{bestStr}&quot;)</span>
          {movedL && !s.done && <span className="viz-pop rounded-lg bg-red-100 px-3 py-1.5 font-semibold text-red-700">repeat found → L jumped</span>}
        </div>

        <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm leading-relaxed text-slate-700">{s.say}</div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setStep(Math.min(step + 1, last))} disabled={step >= last} className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40">Step →</button>
          <button type="button" onClick={togglePlay} className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-600">{playing ? '⏸ Pause' : '▶ Play'}</button>
          <button type="button" onClick={reset} className="rounded-lg bg-slate-200 px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300">↺ Reset</button>
          <span className="ml-auto font-mono text-xs text-slate-400">Step {step} / {last}</span>
        </div>
      </div>
      <div className="border-t border-brand-100 bg-brand-50/60 px-4 py-3 text-[0.83rem] leading-relaxed text-slate-600">
        In plain words: never start over — just slide. R only moves right and L only moves right, so each character enters and leaves the window once: O(n) total instead of re-checking every substring. A small map of &quot;last seen index&quot; per character makes each L jump O(1).
      </div>
    </div>
  );
}
