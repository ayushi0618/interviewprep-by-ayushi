import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * JsPlayground — editable, runnable JavaScript snippet.
 *
 * Sandbox model: user code never runs in this page. On Run we build a
 * fresh hidden <iframe> with sandbox="allow-scripts" ONLY (never the
 * same-origin flag, so the frame gets an opaque origin and cannot touch
 * our DOM, storage or cookies) and load a runner page via srcDoc. The
 * runner shims console.*, executes the code in an async IIFE (top-level
 * await works) and streams results back with postMessage; the parent
 * only trusts messages from exactly that iframe's contentWindow. Stop
 * kills a runaway loop by destroying/recreating the iframe.
 */

// Build the srcDoc runner document for a given snippet of user code.
function buildSrcDoc(userCode) {
  // Escape "</script>" in the snippet so it can't break out of the
  // runner's own <script> tag while being inlined below.
  const safeCode = String(userCode).replace(/<\/script/gi, '<\\/script');

  return `<!doctype html>
<html><head><meta charset="utf-8" /></head><body>
<script>
(function () {
  var send = function (msg) { window.parent.postMessage(msg, '*'); };

  // Format a console argument: primitives as-is, objects via JSON with a
  // circular fallback, undefined spelled out, functions as "ƒ name()".
  function formatArg(value) {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'function') return '\\u0192 ' + (value.name || 'anonymous') + '()';
    if (typeof value === 'object') {
      try {
        var json = JSON.stringify(value);
        return json === undefined ? String(value) : json;
      } catch (e) { return '[object — circular, cannot display]'; }
    }
    try { return String(value); } catch (e) { return '[unprintable value]'; }
  }

  function makeLogger(level) {
    return function () {
      var text = Array.prototype.map.call(arguments, formatArg).join(' ');
      send({ type: 'log', level: level, text: text });
    };
  }
  window.console = {
    log: makeLogger('log'), info: makeLogger('info'),
    warn: makeLogger('warn'), error: makeLogger('error'), debug: makeLogger('log')
  };

  function reportError(err) {
    var name = err && err.name ? err.name : 'Error';
    var message = err && err.message ? err.message : String(err);
    send({ type: 'error', text: name + ': ' + message });
  }
  window.addEventListener('error', function (event) {
    if (event && event.error) reportError(event.error);
    else if (event && event.message) send({ type: 'error', text: 'Error: ' + event.message });
  });
  window.addEventListener('unhandledrejection', function (event) {
    reportError(event ? event.reason : event);
  });

  (async function () {
    try {
      // User code inside an async IIFE: top-level await works.
      await (async function () {
        ${safeCode}
      })();
    } catch (err) { reportError(err); }
    // ~400ms grace so trailing promise .then() logs land before 'done'.
    await new Promise(function (resolve) { setTimeout(resolve, 400); });
    send({ type: 'done' });
  })();
})();
</` + `script>
</body></html>`;
}

// Console text colour per level.
const LEVEL_CLASS = {
  log: 'text-slate-100',
  info: 'text-sky-300',
  warn: 'text-amber-300',
  error: 'text-red-300',
  notice: 'text-amber-300 italic',
};

let lineId = 0;

export default function JsPlayground({ title, code }) {
  const starterCode = code ?? '';
  const [editorCode, setEditorCode] = useState(starterCode);
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(false);
  // Bumping frameKey (or blanking srcDoc) destroys the iframe — that is
  // what actually halts an infinite loop on Stop / before a re-run.
  const [frameKey, setFrameKey] = useState(0);
  const [srcDoc, setSrcDoc] = useState('');

  const iframeRef = useRef(null);
  const consoleRef = useRef(null);
  const slowTimerRef = useRef(null);
  const doneRef = useRef(true);

  const pushLine = useCallback((level, text) => {
    lineId += 1;
    setLines((prev) => [...prev, { id: lineId, level, text }]);
  }, []);

  // Only trust messages coming from our own sandbox iframe.
  useEffect(() => {
    function onMessage(event) {
      const frame = iframeRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'log') {
        pushLine(data.level || 'log', String(data.text ?? ''));
      } else if (data.type === 'error') {
        pushLine('error', String(data.text ?? 'Unknown error'));
      } else if (data.type === 'done') {
        doneRef.current = true;
        setRunning(false);
        if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [pushLine]);

  // Keep the console pinned to the newest line.
  useEffect(() => {
    const el = consoleRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  useEffect(() => () => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
  }, []);

  const handleRun = () => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    setLines([]);
    doneRef.current = false;
    setRunning(true);
    setFrameKey((k) => k + 1); // fresh iframe = clean globals each run
    setSrcDoc(buildSrcDoc(editorCode));
    // If 'done' never arrives (~infinite loop), nudge the learner.
    slowTimerRef.current = setTimeout(() => {
      if (!doneRef.current) {
        pushLine('notice', 'Still running — if this is an infinite loop, press Stop.');
      }
    }, 5000);
  };

  const handleStop = () => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    doneRef.current = true;
    setRunning(false);
    setSrcDoc('');
    setFrameKey((k) => k + 1); // recreating the frame kills its JS thread
    pushLine('notice', '— stopped —');
  };

  const handleReset = () => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    doneRef.current = true;
    setRunning(false);
    setSrcDoc('');
    setFrameKey((k) => k + 1);
    setEditorCode(starterCode);
    setLines([]);
  };

  const btnBase = 'rounded-lg px-3 py-1.5 text-sm font-semibold transition';

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-brand-200 bg-white shadow-card">
      {/* Header: badge + title + controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-100 bg-brand-50 px-4 py-2.5">
        <span className="rounded-md bg-brand-600 px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-white">
          ▶ Live code
        </span>
        <h4 className="m-0 text-sm font-bold text-brand-900">{title}</h4>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={handleRun} disabled={running}
            className={`${btnBase} bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50`}>
            Run ▶
          </button>
          <button type="button" onClick={handleStop} disabled={!running}
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
          {lines.length === 0 ? (
            <p className="text-slate-500">Press Run to see output →</p>
          ) : (
            lines.map((line) => (
              <div key={line.id}
                className={`whitespace-pre-wrap break-words ${LEVEL_CLASS[line.level] || LEVEL_CLASS.log}`}>
                {line.text}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Hidden sandbox runner (scripts only — no same-origin access). */}
      <iframe
        key={frameKey}
        ref={iframeRef}
        title="JavaScript sandbox runner"
        aria-hidden="true"
        tabIndex={-1}
        sandbox="allow-scripts"
        srcDoc={srcDoc}
        style={{ width: 0, height: 0, border: 0, position: 'absolute' }}
      />
    </div>
  );
}
