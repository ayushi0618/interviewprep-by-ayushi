import { useEffect, useState } from 'react';

// Binary Search — find a target in a SORTED array by repeatedly halving
// the search zone. Only works because the array is sorted.

const ARR = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
const TARGET = 23;

const STEPS = [
  { lo: 0, hi: 9, mid: -1, say: 'Sorted array, target 23. The search zone is the whole array (indices 0–9). Press Step to check the middle.' },
  { lo: 5, hi: 9, mid: 4, say: 'Middle = index 4 → value 16. 16 < 23, so 23 can only live on the right. Throw away the entire left half in one move.' },
  { lo: 5, hi: 6, mid: 7, say: 'New zone is indices 5–9. Middle = index 7 → value 56. 56 > 23, so throw away the right half.' },
  { lo: 5, hi: 6, mid: 5, found: true, say: 'Zone is indices 5–6. Middle = index 5 → value 23. Found it! Just 3 checks for 10 items — every step halves the work, so this is O(log n). A million items would take only ~20 checks.' },
];

export default function BinarySearch() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = STEPS.length - 1;
  const s = STEPS[step];

  useEffect(() => {
    if (!playing) return undefined;
    if (step >= last) { setPlaying(false); return undefined; }
    const id = setTimeout(() => setStep(step + 1), 1500);
    return () => clearTimeout(id);
  }, [playing, step, last]);

  const reset = () => { setStep(0); setPlaying(false); };
  const togglePlay = () => {
    if (playing) { setPlaying(false); return; }
    if (step >= last) setStep(0);
    setPlaying(true);
  };

  const labelFor = (i) => {
    const tags = [];
    if (i === s.lo) tags.push('lo');
    if (i === s.mid) tags.push('mid');
    if (i === s.hi) tags.push('hi');
    return tags.join('·');
  };

  return (
    <div className="viz-root my-6 overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-card">
      <div className="bg-brand-700 px-4 py-2.5 text-sm font-bold text-white">🔍 Binary Search — find {TARGET} in a sorted array</div>
      <div className="p-4">
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-[480px] items-end gap-1.5 px-1">
            {ARR.map((v, i) => {
              const eliminated = i < s.lo || i > s.hi;
              const isMid = i === s.mid;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className={`flex h-5 items-center font-mono text-[0.68rem] font-extrabold ${isMid ? 'text-amber-600' : 'text-brand-600'}`}>
                    {labelFor(i) && <span>{labelFor(i)} ▼</span>}
                  </div>
                  <div className={`flex h-12 w-full items-center justify-center rounded-lg border-2 font-mono text-base font-bold transition-all duration-300 ${s.found && isMid ? 'scale-110 border-brand-600 bg-brand-500 text-white' : isMid ? 'border-amber-500 bg-amber-400 text-amber-950' : eliminated ? 'border-slate-200 bg-slate-100 text-slate-300' : 'border-brand-300 bg-white text-slate-700'}`}>
                    {v}
                  </div>
                  <div className="font-mono text-[0.65rem] text-slate-400">[{i}]</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 font-mono text-sm">
          <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-white">lo = {s.lo}, hi = {s.hi}</span>
          {s.mid >= 0 && <span className="rounded-lg bg-amber-100 px-3 py-1.5 font-semibold text-amber-800">mid = {s.mid} → {ARR[s.mid]} {s.found ? `= ${TARGET} ✓` : ARR[s.mid] < TARGET ? `< ${TARGET}` : `> ${TARGET}`}</span>}
          <span className="rounded-lg bg-brand-50 px-3 py-1.5 font-semibold text-brand-800">zone size: {s.hi - s.lo + 1}</span>
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
        In plain words: sorted order means one look at the middle tells you which half is hopeless. Discarding half the array per check is what makes it O(log n) instead of O(n) — the greyed-out cells above were never even visited.
      </div>
    </div>
  );
}
