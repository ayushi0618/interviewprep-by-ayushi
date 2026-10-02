import { useEffect, useState } from 'react';

// Recursion Tree — expanding fib(5) = fib(4) + fib(3) call by call.
// The tree is precomputed once below (15 calls total). Notice how the same
// subcalls (fib(3), fib(2), fib(1)…) keep reappearing: that repeated work
// is exactly what memoization / DP removes.

function buildTree() {
  const nodes = [];
  function add(n, parent, depth) {
    const node = { id: nodes.length, n, parent, depth, x: 0 };
    nodes.push(node);
    if (n >= 2) { add(n - 1, node.id, depth + 1); add(n - 2, node.id, depth + 1); }
    return node;
  }
  add(5, null, 0);
  const kids = {};
  nodes.forEach((nd) => {
    if (nd.parent !== null) (kids[nd.parent] = kids[nd.parent] || []).push(nd);
  });
  // Layout: leaves take slots left→right; a parent sits above its children.
  let slot = 0;
  (function place(node) {
    const c = kids[node.id] || [];
    if (!c.length) { node.x = slot; slot += 1; return; }
    c.forEach(place);
    node.x = (c[0].x + c[c.length - 1].x) / 2;
  })(nodes[0]);
  return { nodes, kids, slots: slot };
}

const TREE = buildTree();
const COUNTS = {};
TREE.nodes.forEach((nd) => { COUNTS[nd.n] = (COUNTS[nd.n] || 0) + 1; });
const UNIQUE_TOTAL = Object.keys(COUNTS).length;
const X = (x) => 34 + x * 54;
const Y = (d) => 16 + d * 58;

export default function RecursionTree() {
  const [step, setStep] = useState(0); // how many calls have been revealed
  const [playing, setPlaying] = useState(false);
  const last = TREE.nodes.length;
  const done = step >= last;

  useEffect(() => {
    if (!playing) return undefined;
    if (step >= last) { setPlaying(false); return undefined; }
    const id = setTimeout(() => setStep(step + 1), 650);
    return () => clearTimeout(id);
  }, [playing, step, last]);

  const reset = () => { setStep(0); setPlaying(false); };
  const togglePlay = () => {
    if (playing) { setPlaying(false); return; }
    if (step >= last) setStep(0);
    setPlaying(true);
  };

  // Which distinct subproblems (fib(n) values) have appeared so far, and
  // the occurrence number of each revealed call (fib(2) the 3rd time = repeat).
  const seenN = new Set(TREE.nodes.slice(0, step).map((nd) => nd.n));
  const occOf = {};
  {
    const c = {};
    for (let i = 0; i < step; i++) {
      const nd = TREE.nodes[i];
      c[nd.n] = (c[nd.n] || 0) + 1;
      occOf[nd.id] = c[nd.n];
    }
  }

  const current = step > 0 ? TREE.nodes[step - 1] : null;
  let say = 'Press Step: every fib(n) call splits into fib(n−1) and fib(n−2) until it hits the base cases fib(1)=1 and fib(0)=0.';
  if (done) {
    say = `Done — ${last} calls in total, but only ${UNIQUE_TOTAL} different subproblems (fib(0)…fib(5)). With memoization each is computed once and cached: ${UNIQUE_TOTAL} calls instead of ${last}. That trick is the heart of dynamic programming.`;
  } else if (current) {
    say = current.n < 2
      ? `Call fib(${current.n}) — base case, returns ${current.n} immediately without splitting further.`
      : occOf[current.id] > 1
        ? `Call fib(${current.n}) — wait, this exact call already happened (${occOf[current.id]}× now)! Plain recursion happily redoes all of its work.`
        : `Call fib(${current.n}) → splits into fib(${current.n - 1}) + fib(${current.n - 2}).`;
  }

  return (
    <div className="viz-root my-6 overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-card">
      <div className="bg-brand-700 px-4 py-2.5 text-sm font-bold text-white">🌳 Recursion Tree — expanding fib(5)</div>
      <div className="p-4">
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/60">
          <div className="relative" style={{ width: TREE.slots * 54 + 68, height: 16 + 4 * 58 + 44 }}>
            <svg className="absolute inset-0 h-full w-full">
              {TREE.nodes.slice(0, step).map((nd) => (nd.parent === null ? null : (
                <line key={nd.id} x1={X(TREE.nodes[nd.parent].x)} y1={Y(nd.depth - 1) + 30} x2={X(nd.x)} y2={Y(nd.depth)} stroke="#D9D1F2" strokeWidth="2" />
              )))}
            </svg>
            {TREE.nodes.map((nd, i) => {
              if (i >= step) return null;
              const repeated = COUNTS[nd.n] > 1;
              const isRepeatOccurrence = occOf[nd.id] > 1;
              return (
                <div
                  key={nd.id}
                  className={`viz-pop absolute flex w-[3.4rem] -translate-x-1/2 flex-col items-center rounded-full border-2 py-0.5 font-mono text-xs font-bold ${isRepeatOccurrence ? 'border-red-400 bg-red-100 text-red-800' : repeated ? 'border-amber-400 bg-amber-100 text-amber-900' : 'border-brand-500 bg-white text-brand-800'}`}
                  style={{ left: X(nd.x), top: Y(nd.depth) }}
                >
                  <span>fib({nd.n})</span>
                  {isRepeatOccurrence && <span className="text-[0.58rem] font-extrabold uppercase">repeat</span>}
                </div>
              );
            })}
            {step === 0 && <div className="absolute left-4 top-4 text-sm italic text-slate-400">tree is empty — start stepping →</div>}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-lg bg-slate-900 px-3 py-1.5 font-mono text-white">calls made: {step} / {last}</span>
          <span className="rounded-lg bg-amber-100 px-3 py-1.5 font-semibold text-amber-800">different subproblems: {seenN.size} / {UNIQUE_TOTAL}</span>
          <span className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800"><span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-amber-400 bg-amber-100" /> called more than once</span>
          <span className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"><span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-red-400 bg-red-100" /> repeat occurrence</span>
        </div>

        <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm leading-relaxed text-slate-700">{say}</div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setStep(Math.min(step + 1, last))} disabled={step >= last} className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40">Step →</button>
          <button type="button" onClick={togglePlay} className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-600">{playing ? '⏸ Pause' : '▶ Play'}</button>
          <button type="button" onClick={reset} className="rounded-lg bg-slate-200 px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300">↺ Reset</button>
          <span className="ml-auto font-mono text-xs text-slate-400">Step {step} / {last}</span>
        </div>
      </div>
      <div className="border-t border-brand-100 bg-brand-50/60 px-4 py-3 text-[0.83rem] leading-relaxed text-slate-600">
        In plain words: naive recursion re-solves the same small problems again and again (watch the amber and red pills pile up), so fib grows exponentially — O(2ⁿ) calls. Interview follow-up answer: &quot;add a cache (memoization) and it drops to O(n), because there are only n different inputs.&quot;
      </div>
    </div>
  );
}
