import { memo, useRef, useState } from 'react';

// Render Counter — a tiny REAL React app inside the article. The parent
// holds a counter; every increment re-renders the parent and its plain
// child, but the React.memo child only re-renders when its own prop
// changes. Render counts are counted with refs inside each component,
// so what you see is genuine React behaviour, not a simulation.

// A normal child: re-renders whenever its parent re-renders.
function PlainChild() {
  const renders = useRef(0);
  renders.current += 1;
  return (
    <div className="flex-1 rounded-xl border-2 border-slate-300 bg-slate-50 p-3 text-center">
      <div className="text-sm font-bold text-slate-700">Plain child</div>
      <div className="font-mono text-[0.68rem] text-slate-400">re-renders with parent</div>
      <div className="mt-1.5 text-3xl font-extrabold text-slate-700">{renders.current}</div>
      <div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">renders</div>
    </div>
  );
}

// The same child wrapped in React.memo: React skips re-rendering it
// while its props are unchanged (label stays the same string).
const MemoChild = memo(function MemoChild({ label }) {
  const renders = useRef(0);
  renders.current += 1;
  return (
    <div className="flex-1 rounded-xl border-2 border-brand-400 bg-brand-50 p-3 text-center">
      <div className="text-sm font-bold text-brand-800">Memo child</div>
      <div className="font-mono text-[0.68rem] text-brand-500">wrapped in React.memo</div>
      <div className="mt-1.5 text-3xl font-extrabold text-brand-700">{renders.current}</div>
      <div className="text-[0.65rem] font-bold uppercase tracking-wider text-brand-500">renders</div>
      <div className="mt-1.5 inline-block rounded-md bg-white px-2 py-0.5 font-mono text-xs text-slate-600">prop label = &quot;{label}&quot;</div>
    </div>
  );
});

function Demo() {
  const renders = useRef(0);
  renders.current += 1; // parent render count (this component's own body)
  const [count, setCount] = useState(0);
  const [label, setLabel] = useState('sky');

  return (
    <div>
      <div className="rounded-xl border-2 border-brand-500 bg-brand-50/70 p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-brand-900">Parent component</span>
          <span className="rounded-md bg-brand-600 px-2 py-0.5 font-mono text-xs font-bold text-white">rendered {renders.current}×</span>
          <span className="ml-auto font-mono text-sm text-slate-600">counter = <span className="font-extrabold text-slate-900">{count}</span></span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setCount((c) => c + 1)} className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700">+1 counter (re-render parent)</button>
          <button
            type="button"
            onClick={() => setLabel((l) => (l === 'sky' ? 'amber' : 'sky'))}
            className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            change memo prop (now &quot;{label}&quot;)
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <PlainChild />
        <MemoChild label={label} />
      </div>
    </div>
  );
}

export default function RenderCounter() {
  const [remountKey, setRemountKey] = useState(0); // Reset = fresh mount

  return (
    <div className="viz-root my-6 overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-card">
      <div className="bg-brand-700 px-4 py-2.5 text-sm font-bold text-white">⚛️ Render Counter — re-render ≠ repaint</div>
      <div className="p-4">
        <Demo key={remountKey} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setRemountKey((k) => k + 1)} className="rounded-lg bg-slate-200 px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300">↺ Reset counts</button>
          <span className="text-xs text-slate-400">this is a real React app running inside the note — try the buttons</span>
        </div>
      </div>
      <div className="border-t border-brand-100 bg-brand-50/60 px-4 py-3 text-[0.83rem] leading-relaxed text-slate-600">
        In plain words: &quot;re-render&quot; only means React re-ran the component function and compared the new output with the old (reconciliation) — it touches the real DOM only where something actually changed, so a re-render is usually cheap. React.memo is an opt-in skip: if a child&apos;s props are identical, React reuses its last output. Click +1 a few times (memo stays at 1), then change the memo prop (it finally re-renders).
      </div>
    </div>
  );
}
