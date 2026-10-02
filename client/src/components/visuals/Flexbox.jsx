import { useEffect, useState } from 'react';

// Flexbox playground — four boxes in a flex container. Change
// flex-direction (main axis), justify-content (spread along the main
// axis) and align-items (position on the cross axis), and watch the
// preview + the exact CSS update live.

const DIRECTIONS = ['row', 'column'];
const JUSTIFY = ['flex-start', 'center', 'space-between', 'space-around'];
const ALIGN = ['stretch', 'center', 'flex-start'];
const SIZES = [44, 76, 56, 92]; // varied box sizes so alignment is visible
const BOX_COLORS = ['bg-brand-500', 'bg-brand-400', 'bg-amber-500', 'bg-slate-500'];

function Group({ label, options, value, onChange }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[0.7rem] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold transition ${value === o ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-brand-100 hover:text-brand-800'}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Flexbox() {
  const [direction, setDirection] = useState('row');
  const [justify, setJustify] = useState('flex-start');
  const [align, setAlign] = useState('stretch');
  const [playing, setPlaying] = useState(false);

  // Play mode: cycle justify-content so the movement is easy to see.
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      setJustify((cur) => JUSTIFY[(JUSTIFY.indexOf(cur) + 1) % JUSTIFY.length]);
    }, 1400);
    return () => clearInterval(id);
  }, [playing]);

  const reset = () => {
    setDirection('row');
    setJustify('flex-start');
    setAlign('stretch');
    setPlaying(false);
  };

  const isRow = direction === 'row';
  const boxStyle = (i) => (isRow
    ? { width: '3.4rem', height: align === 'stretch' ? undefined : SIZES[i] }
    : { height: '3rem', width: align === 'stretch' ? undefined : SIZES[i] + 20 });

  return (
    <div className="viz-root my-6 overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-card">
      <div className="bg-brand-700 px-4 py-2.5 text-sm font-bold text-white">🧱 Flexbox — justify vs align, live</div>
      <div className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Group label="flex-direction" options={DIRECTIONS} value={direction} onChange={setDirection} />
          <Group label="justify-content" options={JUSTIFY} value={justify} onChange={setJustify} />
          <Group label="align-items" options={ALIGN} value={align} onChange={setAlign} />
        </div>

        <div
          className="mt-4 flex h-64 gap-2 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/50 p-2 transition-all"
          style={{ flexDirection: direction, justifyContent: justify, alignItems: align }}
        >
          {[1, 2, 3, 4].map((n, i) => (
            <div
              key={n}
              className={`flex items-center justify-center rounded-lg font-mono text-sm font-extrabold text-white shadow-card transition-all duration-500 ${BOX_COLORS[i]}`}
              style={boxStyle(i)}
            >
              {n}
            </div>
          ))}
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-3.5 font-mono text-[0.78rem] leading-relaxed text-slate-100">
          <span className="text-slate-400">.container {'{'}</span>
          <div className="pl-4">display: <span className="text-amber-300">flex</span>;</div>
          <div className="pl-4">flex-direction: <span className="text-amber-300">{direction}</span>;</div>
          <div className="pl-4">justify-content: <span className="text-amber-300">{justify}</span>;</div>
          <div className="pl-4">align-items: <span className="text-amber-300">{align}</span>;</div>
          <span className="text-slate-400">{'}'}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPlaying(!playing)} className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-600">{playing ? '⏸ Pause' : '▶ Play (cycle justify)'}</button>
          <button type="button" onClick={reset} className="rounded-lg bg-slate-200 px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300">↺ Reset</button>
          <span className="ml-auto font-mono text-xs text-slate-400">direction: {direction}</span>
        </div>
      </div>
      <div className="border-t border-brand-100 bg-brand-50/60 px-4 py-3 text-[0.83rem] leading-relaxed text-slate-600">
        In plain words: flex-direction picks the main axis (row = left→right, column = top→bottom). justify-content spreads boxes along that main axis, align-items positions them on the cross axis. &quot;Center anything&quot; is just justify-content: center + align-items: center. Try Play, then flip direction and see the axes swap roles.
      </div>
    </div>
  );
}
