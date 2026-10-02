// runCode.js — shared "run JavaScript safely in the browser" machinery.
//
// Used by BOTH the in-article playgrounds (components/playgrounds/JsPlayground)
// and the full-page Code Playground (pages/Playground) — the iframe code
// lives here exactly once.
//
// Sandbox model (important — this is the security story):
//   User code NEVER runs in our page. On Run we build a hidden <iframe>
//   with sandbox="allow-scripts" ONLY (never allow-same-origin), so the
//   frame gets an opaque origin: it cannot touch our DOM, localStorage
//   or cookies. The frame loads a tiny runner page via srcDoc; the runner
//   shims console.*, executes the snippet inside an async IIFE (so
//   top-level `await` works) and streams log lines back via postMessage.
//   The parent only accepts messages whose source is exactly that
//   iframe's contentWindow. Stop / re-run destroys the iframe, which is
//   what actually kills a runaway `while (true) {}` loop.
import { useCallback, useEffect, useRef, useState } from 'react';

// Build the srcDoc runner document for a given snippet of user code.
export function buildRunnerSrcDoc(userCode) {
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

// Console text colour per message level (shared by both UIs).
export const LEVEL_CLASS = {
  log: 'text-slate-100',
  info: 'text-sky-300',
  warn: 'text-amber-300',
  error: 'text-red-300',
  notice: 'text-amber-300 italic',
};

let lineId = 0;

// useSandboxRunner — React hook owning the sandbox iframe + output lines.
//
//   const r = useSandboxRunner();
//   <iframe {...r.frameProps} />          // render exactly once, anywhere
//   r.run(editorCode); r.stop(); r.clear();
//   r.lines → [{ id, level, text }],  r.running → boolean
export function useSandboxRunner() {
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(false);
  // Bumping frameKey (or blanking srcDoc) destroys the iframe — that is
  // what actually halts an infinite loop on Stop / before a re-run.
  const [frameKey, setFrameKey] = useState(0);
  const [srcDoc, setSrcDoc] = useState('');

  const iframeRef = useRef(null);
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

  useEffect(() => () => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
  }, []);

  const killFrame = useCallback(() => {
    // Recreating the frame (new key + empty srcDoc) kills its JS thread.
    setSrcDoc('');
    setFrameKey((k) => k + 1);
  }, []);

  const run = useCallback((code) => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    setLines([]);
    doneRef.current = false;
    setRunning(true);
    setFrameKey((k) => k + 1); // fresh iframe = clean globals each run
    setSrcDoc(buildRunnerSrcDoc(code));
    // If 'done' never arrives (infinite loop?), nudge the learner.
    slowTimerRef.current = setTimeout(() => {
      if (!doneRef.current) {
        pushLine('notice', 'Still running… if this is an infinite loop, press Stop.');
      }
    }, 5000);
  }, [pushLine]);

  const stop = useCallback(() => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    doneRef.current = true;
    setRunning(false);
    killFrame();
    pushLine('notice', '— stopped —');
  }, [killFrame, pushLine]);

  const reset = useCallback(() => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    doneRef.current = true;
    setRunning(false);
    killFrame();
    setLines([]);
  }, [killFrame]);

  const clear = useCallback(() => setLines([]), []);

  // Spread onto the hidden runner <iframe>. sandbox is scripts-only:
  // no allow-same-origin, ever.
  const frameProps = {
    ref: iframeRef,
    key: frameKey,
    title: 'JavaScript sandbox runner',
    'aria-hidden': true,
    tabIndex: -1,
    sandbox: 'allow-scripts',
    srcDoc,
    style: { width: 0, height: 0, border: 0, position: 'absolute' },
  };

  return { lines, running, run, stop, reset, clear, frameProps };
}
