import { useEffect, useState } from 'react';

// Event Loop visualizer — the classic interview snippet:
//   console.log('A'); setTimeout(B, 0); Promise.then(C); console.log('D');
// Output is A D C B: synchronous code first, then ALL microtasks (promises),
// then callbacks (timers). Each step below is a snapshot of where every
// piece of code is currently "parked".

const CODE_LINES = [
  "console.log('A');",
  "setTimeout(() => console.log('B'), 0);",
  "Promise.resolve().then(() => console.log('C'));",
  "console.log('D');",
];

const STEPS = [
  { line: -1, stack: [], web: [], micro: [], cb: [], out: [], active: '', say: 'Press Step (or Play) and watch where each line of code goes.' },
  { line: 0, stack: ["console.log('A')"], web: [], micro: [], cb: [], out: [], active: 'stack', say: "Synchronous code runs first, top to bottom. console.log('A') is pushed on the Call Stack…" },
  { line: 0, stack: [], web: [], micro: [], cb: [], out: ['A'], active: 'out', say: '…and prints A immediately. The stack is empty again.' },
  { line: 1, stack: [], web: ['⏱ setTimeout(cb, 0ms)'], micro: [], cb: [], out: ['A'], active: 'web', say: 'setTimeout is handed over to the browser (Web APIs). JavaScript does NOT wait for it — it moves straight to the next line.' },
  { line: 1, stack: [], web: [], micro: [], cb: ["() => log('B')"], out: ['A'], active: 'cb', say: 'The 0ms timer finishes almost instantly, so its callback lines up in the Callback Queue… but it cannot run yet.' },
  { line: 2, stack: [], web: [], micro: ["() => log('C')"], cb: ["() => log('B')"], out: ['A'], active: 'micro', say: '…because the promise callback goes to the Microtask Queue instead — a separate, higher-priority queue.' },
  { line: 3, stack: ["console.log('D')"], web: [], micro: ["() => log('C')"], cb: ["() => log('B')"], out: ['A'], active: 'stack', say: "Last synchronous line: console.log('D') goes on the stack and runs right away." },
  { line: 3, stack: [], web: [], micro: ["() => log('C')"], cb: ["() => log('B')"], out: ['A', 'D'], active: 'out', say: 'D printed. All synchronous code is done and the stack is empty — now the Event Loop starts checking the queues.' },
  { line: -1, stack: [], web: [], micro: [], cb: ["() => log('B')"], out: ['A', 'D', 'C'], active: 'micro', say: 'Microtasks always go first: C prints, and the Event Loop drains the ENTIRE Microtask Queue…' },
  { line: -1, stack: [], web: [], micro: [], cb: [], out: ['A', 'D', 'C', 'B'], active: 'cb', say: '…only then does the Callback Queue get its turn: B prints. Final output: A D C B ✓' },
];

const PANEL_STYLES = {
  stack: 'border-brand-400 bg-brand-50',
  web: 'border-slate-300 bg-slate-50',
  micro: 'border-amber-400 bg-amber-50',
  cb: 'border-brand-300 bg-brand-50/60',
  out: 'border-brand-400 bg-brand-700 text-white',
};

function Panel({ id, title, items, activeId, step }) {
  const active = activeId === id;
  return (
    <div className={`min-h-[7.5rem] rounded-xl border-2 p-2.5 transition-all duration-300 ${PANEL_STYLES[id]} ${active ? 'shadow-card ring-2 ring-brand-300/60' : 'opacity-90'}`}>
      <div className={`mb-2 text-[0.68rem] font-extrabold uppercase tracking-wider ${id === 'out' ? 'text-brand-100' : 'text-slate-500'}`}>{title}</div>
      <div className="space-y-1.5">
        {items.length === 0 && <div className={`text-xs italic ${id === 'out' ? 'text-brand-200' : 'text-slate-400'}`}>empty</div>}
        {items.map((it, i) => (
          <div key={`${step}-${it}-${i}`} className={`viz-pop rounded-md px-2 py-1 font-mono text-[0.7rem] shadow-sm ${id === 'out' ? 'bg-white/15 font-extrabold text-white' : 'border border-slate-200 bg-white/90 text-slate-800'}`}>
            {it}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EventLoop() {
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
      <div className="bg-brand-700 px-4 py-2.5 text-sm font-bold text-white">⚡ Event Loop — why the output is A D C B</div>
      <div className="p-4">
        <div className="overflow-x-auto rounded-xl bg-slate-900 p-3.5 font-mono text-[0.78rem] leading-relaxed">
          {CODE_LINES.map((l, i) => (
            <div key={i} className={`whitespace-pre rounded px-2 py-0.5 ${s.line === i ? 'bg-amber-400/25 text-amber-100' : 'text-slate-200'}`}>{l}</div>
          ))}
        </div>

        <div key={step} className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
          <Panel id="stack" title="📚 Call Stack" items={s.stack} activeId={s.active} step={step} />
          <Panel id="web" title="🌐 Web APIs" items={s.web} activeId={s.active} step={step} />
          <Panel id="micro" title="⚡ Microtask Queue" items={s.micro} activeId={s.active} step={step} />
          <Panel id="cb" title="⏱ Callback Queue" items={s.cb} activeId={s.active} step={step} />
          <Panel id="out" title="🖨 Output" items={s.out} activeId={s.active} step={step} />
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
        In plain words: synchronous code runs to completion first. Then the Event Loop empties the Microtask Queue (promises) completely, and only then picks up callbacks like timers — one at a time. That is why C (promise) beats B (setTimeout 0).
      </div>
    </div>
  );
}
