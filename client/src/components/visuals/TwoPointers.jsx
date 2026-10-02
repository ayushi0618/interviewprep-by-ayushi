import { useEffect, useState } from 'react';

// Two Pointers — find two numbers in a SORTED array that add up to a target.
// One pointer starts at each end; the sum tells you which pointer to move.

const ARR = [1, 2, 3, 4, 6, 8, 9];
const TARGET = 10;

const STEPS = [
  { l: 0, r: 6, sum: null, say: 'Two pointers: L starts at the smallest value, R at the largest. Because the array is sorted, the ends hold useful information.' },
  { l: 0, r: 6, sum: 10, say: 'Add the two ends: 1 + 9 = 10. Compare with the target (10)…' },
  { l: 0, r: 6, sum: 10, found: true, say: '10 equals the target — pair found: (1, 9), in a single step! If the sum had been too small we would move L right (need a bigger number); too big, move R left. Every move throws away one value forever, so this is O(n) — no nested loop needed.' },
];

export default function TwoPointers() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = STEPS.length - 1;
  const s = STEPS[step];

  useEffect(() => {
    if (!playing) return undefined;
    if (step >= last) { setPlaying(false); return undefined; }
    const id = setTimeout(() => setStep(step + 1), 1400);
    return () => clearTimeout(id);
  }, [playing, step, last]);

  const reset = () => { setStep(0); setPlaying(false); };
  const togglePlay = () => {
    if (playing) { setPlaying(false); return; }
    if (step >= last) setStep(0);
    setPlaying(true);
  };

  return (
    <div className="viz-root my-6 overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-card">
      <div className="bg-brand-700 px-4 py-2.5 text-sm font-bold text-white">👉👈 Two Pointers — pair that sums to {TARGET}</div>
      <div className="p-4">
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-[430px] items-end justify-between gap-1.5 px-1">
            {ARR.map((v, i) => {
              const isL = i === s.l;
              const isR = i === s.r;
              const found = s.found && (isL || isR);
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`flex h-5 items-center gap-0.5 font-mono text-xs font-extrabold ${isL ? 'text-brand-600' : isR ? 'text-amber-600' : 'text-transparent'}`}>
                    {isL && <span>L ▼</span>}
                    {isR && <span>R ▼</span>}
                  </div>
                  <div className={`flex h-12 w-11 items-center justify-center rounded-lg border-2 font-mono text-base font-bold transition-all duration-300 md:w-12 ${found ? 'scale-110 border-brand-600 bg-brand-500 text-white' : isL || isR ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-600'}`}>
                    {v}
                  </div>
                  <div className="font-mono text-[0.65rem] text-slate-400">[{i}]</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-slate-900 px-3 py-1.5 font-mono text-sm text-white">
            {s.sum === null ? `L + R = ? (target ${TARGET})` : `${ARR[s.l]} + ${ARR[s.r]} = ${s.sum}`}
          </span>
          {s.sum !== null && (
            <span className={`viz-pop rounded-lg px-3 py-1.5 text-sm font-bold ${s.found ? 'bg-brand-500 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {s.found ? '✓ equal to target — found!' : s.sum < TARGET ? '< target → move L →' : '> target → move R ←'}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5 text-[0.72rem] font-semibold">
          <span className="rounded-md bg-brand-50 px-2 py-1 text-brand-700">sum &lt; target → move L right (need bigger)</span>
          <span className="rounded-md bg-brand-50 px-2 py-1 text-brand-700">sum &gt; target → move R left (need smaller)</span>
          <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">sum = target → done ✓</span>
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
        In plain words: sorted order turns a guessing game into a rule. The two ends give the smallest possible and largest possible sums, so each comparison lets you safely discard one end. Two pointers is just that discard rule on repeat.
      </div>
    </div>
  );
}
