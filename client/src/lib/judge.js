// judge.js — browser judge for the DSA Sheet.
//
// It runs the student's function against test cases inside a hidden,
// scripts-only sandboxed iframe (same security model as lib/runCode.js):
// user code never executes in our page, it runs in a frame with an opaque
// origin that cannot touch our DOM, localStorage or cookies. The parent
// only trusts messages whose `event.source` is exactly that iframe.
//
// The actual test semantics (building lists/trees, normalising unordered
// answers, deep equality) come from lib/judgeCore.js via JUDGE_FRAME_SOURCE,
// stringified straight into the frame. That keeps the browser judge
// byte-for-byte the same logic the offline verify script checks.

import { JUDGE_FRAME_SOURCE } from './judgeCore';

// Small helper for showing values in the results panel: strings/numbers/
// arrays become JSON so [1, 2] prints as "[1,2]", with a plain String()
// fallback for anything JSON can't handle (circular objects, undefined…).
export function formatValue(value) {
  if (value === undefined) return 'undefined';
  if (typeof value === 'function') return 'ƒ ' + (value.name || 'anonymous') + '()';
  try {
    const json = JSON.stringify(value);
    return json === undefined ? String(value) : json;
  } catch {
    return String(value);
  }
}

// Build the srcDoc document that the judge iframe runs.
//
// Two <script> blocks on purpose:
//   1. Setup — console shim (collects logs instead of printing), a fatal
//      error reporter, and the inlined JUDGE_FRAME_SOURCE helpers.
//   2. User code + runner — if the student's code has a syntax error this
//      block fails to parse, but block 1 already installed window.onerror,
//      so the parent still gets a 'judge-fatal' message instead of hanging
//      until the timeout.
function buildJudgeSrcDoc({ problem, code, tests }) {
  // Escape "</script>" so student code can't break out of its <script> tag.
  const safeCode = String(code || '').replace(/<\/script/gi, '<\\/script');
  // JSON for embedding problem/tests; escaping "<" stops "</script>"
  // hiding inside a string argument from closing the tag early.
  const embed = (value) => JSON.stringify(value ?? null).replace(/</g, '\\u003c');

  return `<!doctype html>
<html><head><meta charset="utf-8" /></head><body>
<script>
var __logs = [];
function __formatArg(value) {
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
function __makeLogger(level) {
  return function () {
    var text = Array.prototype.map.call(arguments, __formatArg).join(' ');
    __logs.push({ level: level, text: text });
  };
}
window.console = {
  log: __makeLogger('log'), info: __makeLogger('info'),
  warn: __makeLogger('warn'), error: __makeLogger('error'), debug: __makeLogger('log')
};
function __sendFatal(message) {
  try { window.parent.postMessage({ type: 'judge-fatal', error: String(message), logs: __logs.slice() }, '*'); } catch (e) {}
}
window.addEventListener('error', function (event) {
  var msg = event && event.error && event.error.name
    ? event.error.name + ': ' + event.error.message
    : event && event.message ? 'Error: ' + event.message : 'Unknown error';
  __sendFatal(msg);
});
window.addEventListener('unhandledrejection', function (event) {
  var reason = event ? event.reason : null;
  var msg = reason && reason.name ? reason.name + ': ' + reason.message : String(reason);
  __sendFatal(msg);
});
${JUDGE_FRAME_SOURCE}
</` + `script>
<script>
${safeCode}

(function __runTests() {
  var __problem = ${embed({ fn: problem.fn, kind: problem.kind, normalize: problem.normalize || 'none' })};
  var __tests = ${embed(tests)};
  try {
    var __fn = undefined;
    // The student's "function twoSum(...)" declaration lives in this same
    // script scope, so a direct eval of the name finds function
    // declarations AND const/let arrow functions alike. The window
    // lookup is a backup for plain global function declarations.
    try { __fn = eval(__problem.fn); } catch (e) { __fn = undefined; }
    if (typeof __fn !== 'function') {
      try { __fn = window[__problem.fn]; } catch (e) { __fn = undefined; }
    }
    if (typeof __fn !== 'function') {
      window.parent.postMessage({
        type: 'judge-fatal',
        error: 'Function ' + __problem.fn + ' is not defined. Make sure your code defines function ' + __problem.fn + '(...) { ... }',
        logs: __logs.slice()
      }, '*');
      return;
    }

    var __results = [];
    for (var i = 0; i < __tests.length; i++) {
      var __test = __tests[i];
      var __got;
      var __pass = false;
      var __threw = false;
      try {
        __got = computeGot(__problem.kind, __fn, __test.args);
      } catch (err) {
        __threw = true;
        __got = (err && err.name ? err.name : 'Error') + ': ' + (err && err.message ? err.message : String(err));
      }
      if (!__threw) {
        try {
          var __gotNorm = applyNormalize(deepClone(__got), __problem.normalize);
          var __expNorm = applyNormalize(deepClone(__test.expected), __problem.normalize);
          __pass = deepEqual(__gotNorm, __expNorm);
        } catch (e) { __pass = false; }
      }
      __results.push({ args: __test.args, expected: __test.expected, got: __got, pass: __pass });
    }
    window.parent.postMessage({ type: 'judge-results', results: __results, logs: __logs.slice() }, '*');
  } catch (err) {
    var __name = err && err.name ? err.name : 'Error';
    var __msg = err && err.message ? err.message : String(err);
    window.parent.postMessage({ type: 'judge-fatal', error: __name + ': ' + __msg, logs: __logs.slice() }, '*');
  }
})();
</` + `script>
</body></html>`;
}

// runJudge({ problem, code, tests, timeoutMs }) →
//   Promise<{ results: [{ args, expected, got, pass }], logs: [{ level, text }], error: string|null, timedOut: boolean }>
//
// One fresh hidden iframe per call; the iframe is always removed (and the
// message listener with it) whether the run finishes, errors or times out.
// Removing the iframe is also what kills a runaway infinite loop.
export function runJudge({ problem, code, tests, timeoutMs = 6000 }) {
  return new Promise((resolve) => {
    if (!problem || !problem.fn) {
      resolve({ results: [], logs: [], error: 'This problem is missing its function name.', timedOut: false });
      return;
    }
    const testList = Array.isArray(tests) ? tests : [];
    if (testList.length === 0) {
      resolve({ results: [], logs: [], error: 'No tests to run for this problem yet.', timedOut: false });
      return;
    }
    if (typeof document === 'undefined') {
      resolve({ results: [], logs: [], error: 'The judge needs a browser to run.', timedOut: false });
      return;
    }

    let settled = false;
    let timeoutId = null;
    const iframe = document.createElement('iframe');

    function cleanup() {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('message', onMessage);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }

    function settle(result) {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    }

    function onMessage(event) {
      if (event.source !== iframe.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'judge-results') {
        settle({
          results: Array.isArray(data.results) ? data.results : [],
          logs: Array.isArray(data.logs) ? data.logs : [],
          error: null,
          timedOut: false,
        });
      } else if (data.type === 'judge-fatal') {
        settle({
          results: [],
          logs: Array.isArray(data.logs) ? data.logs : [],
          error: typeof data.error === 'string' && data.error ? data.error : 'Something went wrong running your code.',
          timedOut: false,
        });
      }
    }

    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('title', 'DSA judge sandbox');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.position = 'absolute';

    window.addEventListener('message', onMessage);
    timeoutId = setTimeout(() => {
      // The frame never answered — most likely an infinite loop. Whatever
      // was collected so far is nothing (the runner posts once at the end),
      // so partial results are simply empty here.
      settle({ results: [], logs: [], error: null, timedOut: true });
    }, timeoutMs);

    try {
      iframe.srcdoc = buildJudgeSrcDoc({ problem, code, tests: testList });
      document.body.appendChild(iframe);
    } catch (err) {
      settle({
        results: [],
        logs: [],
        error: err && err.message ? err.message : String(err),
        timedOut: false,
      });
    }
  });
}
