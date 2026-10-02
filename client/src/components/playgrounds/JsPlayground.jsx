import { useEffect, useRef, useState } from 'react';
import { useSandboxRunner, LEVEL_CLASS } from '../../lib/runCode';

// JsPlayground — the in-article runnable JavaScript card.
//
// All sandbox machinery lives in lib/runCode.js (shared with the
// full-page Code Playground): user code runs in a hidden iframe with
// sandbox="allow-scripts" only, console output streams back via
// postMessage. This component is just editor + console chrome.
export default function JsPlayground({ title, code }) {
  const starterCode = code ?? '';
  const [editorCode, setEditorCode] = useState(starterCode);
  const runner = useSandboxRunner();
  const consoleRef = useRef(null);

  // Keep the console pinned to the newest line.
  useEffect(() => {
    const el = consoleRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [runner.lines]);

  const handleRun = () => runner.run(editorCode);
  const handleStop = () => runner.stop();
  const handleReset = () => { runner.reset(); setEditorCode(starterCode); };

  const btnBase = 'rounded-lg px-3 py-1.5 text-sm font-semibold transition';

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-brand-200 bg-white shadow-card">
      {/* Header: unmistakable "you can run this" badge + title + controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-100 bg-brand-50 px-4 py-2.5">
        <span className="rounded-md bg-brand-600 px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-white">
          ▶ Try it yourself — edit &amp; run
        </span>
        <h4 className="m-0 text-sm font-bold text-brand-900">{title}</h4>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={handleRun} disabled={runner.running}
            className={`${btnBase} bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50`}>
            Run ▶
          </button>
          <button type="button" onClick={handleStop} disabled={!runner.running}
            className={`${btnBase} border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40`}>
            Stop
          </button>
          <button type="button" onClick={handleReset}
            className={`${btnBase} border border-brand-200 bg-white text-brand-800 hover:bg-brand-100`}>
            Reset
          </button>
        </div>
      </div>

      {/* Editable code area */}
      <textarea
        value={editorCode}
        onChange={(e) => setEditorCode(e.target.value)}
        spellCheck={false}
        aria-label={title ? `Code editor: ${title}` : 'Code editor'}
        className="block h-44 w-full resize-y bg-slate-900 p-4 font-mono text-[0.85rem] leading-relaxed text-slate-100 outline-none"
      />

      {/* Output console */}
      <div className="border-t border-brand-100 bg-slate-950">
        <div className="px-4 pt-2 text-[0.68rem] font-semibold uppercase tracking-wider text-slate-500">
          Output
        </div>
        <div ref={consoleRef}
          className="nice-scroll h-[180px] overflow-y-auto px-4 pb-3 pt-1 font-mono text-[0.82rem] leading-relaxed">
          {runner.lines.length === 0 ? (
            <p className="text-slate-500">Press Run to see output →</p>
          ) : (
            runner.lines.map((line) => (
              <div key={line.id}
                className={`whitespace-pre-wrap break-words ${LEVEL_CLASS[line.level] || LEVEL_CLASS.log}`}>
                {line.text}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Hidden sandbox runner (scripts only — no same-origin access). */}
      <iframe {...runner.frameProps} />
    </div>
  );
}
