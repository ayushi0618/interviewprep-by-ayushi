import { useEffect, useMemo, useState } from 'react';

// Bubble Sort — compare neighbouring bars, swap if out of order. After each
// pass the biggest remaining bar has "bubbled" to the end, so the sorted
// region at the right grows by one. Steps are precomputed by actually
// running the algorithm once (below), then replayed.

const START = [5, 2, 9, 1, 7, 3, 8, 4];

function buildSteps() {
  const a = [...START];
  const steps = [{
    arr: [...a], pass: 0, cmp: null, swapped: false, sortedFrom: a.length,
    say: 'Unsorted bars. Bubble sort only ever compares neighbours — press Step and watch bigger bars bubble to the right.',
  }];
  let pass = 0;
  for (let end = a.length - 1; end > 0; end--) {
    pass += 1;
    for (let j = 0; j < end; j++) {
      const x = a[j];
      const y = a[j + 1];
      const swapped = x > y;
      if (swapped) { a[j] = y; a[j + 1] = x; }
      steps.push({
        arr: [...a],
        pass,
        cmp: [j, j + 1],
        swapped,
        // On the last comparison of a pass, position `end` is final too.
        sortedFrom: j === end - 1 ? end : end + 1,
        say: swapped
          ? `Compare ${x} and ${y}: ${x} > ${y}, so swap — the bigger value bubbles one step right.`
          : `Compare ${x} and ${y}: already in order, leave them where they are.`,
      });
    }
  }
  steps.push({
    arr: [...a], pass, cmp: null, swapped: false, sortedFrom: 0, done: true,
    say: 'Sorted! Every pass parked the biggest remaining bar at the end, so the green sorted region grew from the right. Bubble sort makes ~n² comparisons — fine for tiny lists, slow for big ones.',
  });
  return steps;
}

export default function Sorting() {
  const steps = useMemo(buildSteps, []);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = steps.length - 1;
  const s = steps[step];

  useEffect(() => {
    if (!playing) return undefined;
    if (step >= last) { setPlaying(false); return undefined; }
    const id = setTimeout(() => setStep(step + 1), 480);
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
      <div className="bg-brand-700 px-4 py-2.5 text-sm font-bold text-white">🫧 Bubble Sort — biggest bar bubbles to the end</div>
      <div className="p-4">
        <div className="flex h-44 items-end gap-1.5 px-1">
          {s.arr.map((v, i) => {
            const inCmp = s.cmp && (i === s.cmp[0] || i === s.cmp[1]);
            const sorted = i >= s.sortedFrom;
            return (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1 self-stretch">
                <div
                  className={`flex w-full items-start justify-center rounded-t-md pt-1 font-mono text-xs font-bold text-white transition-all duration-300 ${sorted ? 'bg-brand-400' : inCmp ? (s.swapped ? 'bg-red-400' : 'bg-amber-400 text-amber-950') : 'bg-slate-400'}`}
                  style={{ height: `${(v / 9) * 82}%` }}
                >
                  {v}
                </div>
                <div className="font-mono text-[0.65rem] text-slate-400">[{i}]</div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-lg bg-slate-900 px-3 py-1.5 font-mono text-white">pass {s.pass}</span>
          {s.cmp && <span className="viz-pop rounded-lg bg-amber-100 px-3 py-1.5 font-semibold text-amber-800">comparing [{s.cmp[0]}] &amp; [{s.cmp[1]}]{s.swapped ? ' → swap!' : ''}</span>}
          {s.done && <span className="viz-pop rounded-lg bg-brand-500 px-3 py-1.5 font-semibold text-white">✓ fully sorted</span>}
          <span className="ml-auto flex items-center gap-3 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-amber-400" /> comparing</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-red-400" /> swapped</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-brand-400" /> sorted</span>
          </span>
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
        In plain words: bubble sort never looks far ahead — it just fixes one neighbouring pair at a time and lets large values drift right, pass after pass. Easy to explain in an interview, and a good baseline before saying &quot;in practice I would use the built-in sort (Timsort / introsort), which is O(n log n)&quot;.
      </div>
    </div>
  );
}
