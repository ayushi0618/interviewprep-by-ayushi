import { useEffect, useRef, useState } from 'react';
import { useSandboxRunner, LEVEL_CLASS } from '../lib/runCode';
import { loadSqlJs, createSeededDb, SEED_COLUMNS, SEED_ROWS } from '../lib/sqlEngine';
import { ONLINE_LANGUAGES, getOnlineLanguage, executeOnline, onlineErrorMessage } from '../lib/onlineRunner';

// Code Playground — a full-page "online compiler" for the notes.
//   JavaScript mode → shared sandbox runner (lib/runCode.js): write JS,
//     press Run, console output appears on the right. Same engine as the
//     little playgrounds inside the articles — code never runs in this
//     page itself, it runs in a scripts-only sandboxed iframe.
//   SQL mode → shared sql.js engine (lib/sqlEngine.js) with the same
//     seeded `students` table the SQL notes use. Queries run 100% in
//     the browser; Reset rebuilds the database.
//   Python / Java / C++ / C / TypeScript / Go / Rust → lib/onlineRunner.js
//     sends the code to the free Wandbox runner (needs internet; the
//     page says so — never paste secrets there). Optional stdin box
//     feeds the program's input.
// Switching languages keeps your work in every editor.

const JS_SNIPPETS = [
  {
    id: 'hello', name: '👋 Hello & Output',
    code: `// Welcome! Edit anything, press Run ▶, watch the output.
// console.log prints to the output panel.

const name = "Ayushi";
console.log("Hello,", name);

console.log("typeof 42      →", typeof 42);
console.log("typeof 'hello' →", typeof "hello");
console.log("typeof null    →", typeof null, "(famous trap!)");
console.log("typeof []      →", typeof []);
console.log("1 + '2'        →", 1 + "2");
console.log("'5' - 2        →", "5" - 2);

// TODO: predict first, then run — what does this print?
console.log("[] == ![]      →", [] == ![]);`,
  },
  {
    id: 'closures', name: '🔒 Closures counter',
    code: `// A closure: the inner function "remembers" count
// even after makeCounter has finished running.

function makeCounter() {
  let count = 0; // private — nobody outside can touch this
  return function () {
    count += 1;
    return count;
  };
}

const clicks = makeCounter();
console.log(clicks()); // 1
console.log(clicks()); // 2
console.log(clicks()); // 3

const other = makeCounter(); // a brand-new memory!
console.log(other()); // 1 — not 4

// TODO: move "let count" OUTSIDE makeCounter. What changes?`,
  },
  {
    id: 'two-sum', name: '🎯 Two Sum',
    code: `// Two Sum: indices of the two numbers that add to target.
// Hash map answers "have I seen the number I need?"

function twoSum(nums, target) {
  const seen = new Map(); // value → index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) {
      console.log(\`found: \${nums[seen.get(need)]} + \${nums[i]} = \${target}\`);
      return [seen.get(need), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}

console.log("Answer:", twoSum([2, 7, 11, 15], 9));
console.log("Answer:", twoSum([3, 2, 4], 6));
// TODO: try twoSum([3, 3], 6)`,
  },
  {
    id: 'binary-search', name: '🔍 Binary Search',
    code: `// Binary Search: sorted array — halve the space each step. O(log n)

function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    console.log(\`lo=\${lo} hi=\${hi} mid=\${mid} arr[mid]=\${arr[mid]}\`);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

const nums = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
console.log("Index of 23: ", binarySearch(nums, 23));
console.log("Index of 100:", binarySearch(nums, 100));`,
  },
  {
    id: 'debounce', name: '⏱️ Debounce demo',
    code: `// Debounce: wait until the calls STOP, then run once.
// Search boxes use this so they don't fire on every keystroke.

function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer); // cancel the previously scheduled run
    timer = setTimeout(() => fn(...args), wait);
  };
}

const search = debounce((text) => {
  console.log("🔍 API call for:", text);
}, 300);

// Simulate fast typing: a, ay, ayu, ayus, ayush, ayushi
const word = "ayushi";
[...word].forEach((_, i) => {
  const text = word.slice(0, i + 1);
  setTimeout(() => search(text), i * 100); // a keystroke every 100ms
});

console.log("Typing… only ONE api call should fire at the end.");`,
  },
  {
    id: 'promise-order', name: '⚡ Promise order (event loop)',
    code: `// Predict the output BEFORE running. THE interview question.

console.log("1 — script start");

setTimeout(() => console.log("2 — setTimeout (macrotask)"), 0);

Promise.resolve().then(() => console.log("3 — promise .then (microtask)"));

console.log("4 — script end");

// Rule: sync code first → microtasks → macrotasks.
// TODO: add a second .then() chain. Where does it land?`,
  },
  {
    id: 'bubble-sort', name: '🫧 Bubble Sort (with logs)',
    code: `// Bubble Sort: big values "bubble" to the end, pass by pass. O(n²)

function bubbleSort(arr) {
  const a = [...arr];
  for (let end = a.length - 1; end > 0; end--) {
    console.log(\`Pass (end=\${end}):\`, [...a]);
    for (let i = 0; i < end; i++) {
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]]; // swap neighbours
        console.log("  swapped →", [...a]);
      }
    }
  }
  return a;
}

console.log("Sorted:", bubbleSort([5, 2, 9, 1, 7]));
// TODO: what if the array is already sorted? Count the swaps.`,
  },
];

const SQL_SNIPPETS = [
  {
    id: 'all', name: '📋 All students, toppers first',
    code: `SELECT * FROM students
ORDER BY marks DESC;`,
  },
  {
    id: 'filter', name: '🎯 Filter: CSE above 80',
    code: `SELECT name, city, marks
FROM students
WHERE course = 'B.Tech CSE' AND marks > 80
ORDER BY marks DESC;`,
  },
  {
    id: 'group', name: '📊 Average marks per course',
    code: `SELECT course,
       COUNT(*) AS students,
       ROUND(AVG(marks), 1) AS avg_marks
FROM students
GROUP BY course
ORDER BY avg_marks DESC;`,
  },
  {
    id: 'write', name: '✍️ Insert + update (Reset undoes it)',
    code: `INSERT INTO students (id, name, city, course, marks)
VALUES (11, 'Test Student', 'Delhi', 'B.Tech CSE', 77);

UPDATE students SET marks = 99 WHERE id = 11;

SELECT * FROM students WHERE id = 11;`,
  },
];

// Editor with a line-number gutter. The gutter is a plain div whose
// scrollTop we sync with the textarea's — no editor library needed.
// Tab inserts two spaces instead of moving focus.
function CodeEditor({ value, onChange, onRunShortcut, ariaLabel }) {
  const gutterRef = useRef(null);
  const lineCount = value.split('\n').length;

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onRunShortcut?.(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target;
      const start = el.selectionStart;
      const next = value.slice(0, start) + '  ' + value.slice(el.selectionEnd);
      onChange(next);
      // Restore the caret just after the inserted spaces.
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 2; });
    }
  };

  return (
    <div className="flex bg-slate-900 font-mono text-[0.85rem] leading-[1.6]">
      <div ref={gutterRef} aria-hidden="true"
        className="select-none overflow-hidden py-4 pl-3 pr-2 text-right text-slate-500 border-r border-white/5">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={(e) => { if (gutterRef.current) gutterRef.current.scrollTop = e.target.scrollTop; }}
        spellCheck={false}
        wrap="off"
        aria-label={ariaLabel}
        className="h-[430px] flex-1 resize-y bg-transparent p-4 pl-3 text-slate-100 outline-none"
      />
    </div>
  );
}

export default function Playground() {
  const [lang, setLang] = useState('js'); // 'js' | 'sql' | an ONLINE_LANGUAGES id

  // --- JavaScript state (shared sandbox runner) ---
  const runner = useSandboxRunner();
  const [jsSnippet, setJsSnippet] = useState(JS_SNIPPETS[0]);
  const [jsCode, setJsCode] = useState(JS_SNIPPETS[0].code);

  // --- Online languages state (lib/onlineRunner.js) ---
  const [onlineCode, setOnlineCode] = useState(() =>
    Object.fromEntries(ONLINE_LANGUAGES.map((l) => [l.id, l.snippets[0].code])));
  const [onlineSnipId, setOnlineSnipId] = useState(() =>
    Object.fromEntries(ONLINE_LANGUAGES.map((l) => [l.id, l.snippets[0].id])));
  const [stdin, setStdin] = useState('');
  const [onlineRun, setOnlineRun] = useState({ status: 'idle' }); // idle | running | done | error
  const onlineTokenRef = useRef(0);

  // --- SQL state (shared sql.js engine) ---
  const [sqlSnippet, setSqlSnippet] = useState(SQL_SNIPPETS[0]);
  const [sqlCode, setSqlCode] = useState(SQL_SNIPPETS[0].code);
  const [sqlState, setSqlState] = useState('idle'); // idle | loading | ready | error
  const [sqlResults, setSqlResults] = useState(null);
  const [sqlError, setSqlError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const sqlObjRef = useRef(null);
  const dbRef = useRef(null);

  const consoleRef = useRef(null);

  // Auto-scroll the JS console to the newest line.
  useEffect(() => {
    const el = consoleRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [runner.lines]);

  // Load the SQL engine the first time SQL mode is opened.
  useEffect(() => {
    if (lang !== 'sql' || sqlObjRef.current || sqlState === 'loading') return;
    setSqlState('loading');
    loadSqlJs()
      .then((SQL) => {
        sqlObjRef.current = SQL;
        dbRef.current = createSeededDb(SQL);
        setSqlState('ready');
      })
      .catch(() => setSqlState('error'));
  }, [lang, sqlState]);

  // Close this page's DB on unmount.
  useEffect(() => () => { if (dbRef.current) { dbRef.current.close(); dbRef.current = null; } }, []);

  const loadJsSnippet = (snip) => { setJsSnippet(snip); setJsCode(snip.code); };
  const loadSqlSnippet = (snip) => { setSqlSnippet(snip); setSqlCode(snip.code); setSqlResults(null); setSqlError(''); };
  const loadOnlineSnippet = (def, snip) => {
    setOnlineSnipId((m) => ({ ...m, [def.id]: snip.id }));
    setOnlineCode((m) => ({ ...m, [def.id]: snip.code }));
    setOnlineRun({ status: 'idle' });
  };

  // Switching languages never throws work away; a fresh language gets a
  // fresh output pane so results are never attributed to the wrong code.
  const switchLang = (next) => {
    if (next !== lang) setOnlineRun({ status: 'idle' });
    setLang(next);
  };

  const runOnline = async () => {
    const def = getOnlineLanguage(lang);
    if (!def || onlineRun.status === 'running') return;
    const token = ++onlineTokenRef.current;
    setOnlineRun({ status: 'running', langLabel: def.label });
    try {
      const result = await executeOnline(def, onlineCode[def.id], stdin);
      if (onlineTokenRef.current !== token) return; // a newer run owns the pane
      setOnlineRun({ status: 'done', langLabel: def.label, result });
    } catch (e) {
      if (onlineTokenRef.current !== token) return;
      setOnlineRun({ status: 'error', langLabel: def.label, message: onlineErrorMessage(e) });
    }
  };

  const runSql = () => {
    if (!dbRef.current) return;
    setSqlError('');
    setSqlResults(null);
    try {
      setSqlResults(dbRef.current.exec(sqlCode));
    } catch (err) {
      setSqlError(err && err.message ? err.message : String(err));
    }
  };

  const resetSql = () => {
    setSqlCode(sqlSnippet.code);
    setSqlResults(null);
    setSqlError('');
    if (sqlObjRef.current) {
      if (dbRef.current) dbRef.current.close();
      dbRef.current = createSeededDb(sqlObjRef.current);
    }
  };

  const onlineLang = getOnlineLanguage(lang);
  const snippets = lang === 'js' ? JS_SNIPPETS : lang === 'sql' ? SQL_SNIPPETS : onlineLang.snippets;
  const activeSnippet = lang === 'js'
    ? jsSnippet
    : lang === 'sql'
      ? sqlSnippet
      : onlineLang.snippets.find((s) => s.id === onlineSnipId[lang]) || onlineLang.snippets[0];
  const sqlRowCount = sqlResults?.[0]?.values.length ?? 0;

  const btn = 'rounded-lg px-3.5 py-2 text-sm font-bold transition';
  const langBtn = (active) =>
    `px-4 py-2 rounded-lg text-sm font-bold transition ${active ? 'bg-brand-600 text-white shadow-card' : 'text-brand-800 hover:bg-brand-100'}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
      {/* Page header */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-brand-900">▶ Code Playground</h1>
      <p className="text-slate-600 mt-2 max-w-3xl leading-relaxed">
        Don&apos;t just read the notes — <strong className="text-slate-800">write code and run it, right here</strong>.
        JavaScript runs in a safe sandbox in your browser, and SQL runs against a real SQLite database
        (the same <code className="font-mono text-[0.85em] bg-brand-100 text-brand-900 px-1.5 py-0.5 rounded">students</code> table
        from the notes) — those two never leave your device. Python, Java, C++, C, TypeScript, Go and Rust
        run on the free <strong className="text-slate-800">Wandbox</strong> online runner, so they need internet —
        great for practice, but don&apos;t paste anything secret there.
      </p>

      {/* Language switch */}
      <div className="mt-6 flex flex-wrap gap-1 rounded-xl border border-brand-200 bg-white p-1 shadow-card max-w-full">
        <button type="button" className={langBtn(lang === 'js')} onClick={() => switchLang('js')}>⚡ JavaScript</button>
        <button type="button" className={langBtn(lang === 'sql')} onClick={() => switchLang('sql')}>🗄️ SQL</button>
        {ONLINE_LANGUAGES.map((l) => (
          <button key={l.id} type="button" className={langBtn(lang === l.id)} onClick={() => switchLang(l.id)}>{l.label}</button>
        ))}
      </div>

      {/* Snippet picker */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-500">Start from:</span>
        {snippets.map((snip) => (
          <button key={snip.id} type="button"
            onClick={() => (lang === 'js' ? loadJsSnippet(snip) : lang === 'sql' ? loadSqlSnippet(snip) : loadOnlineSnippet(onlineLang, snip))}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold border transition ${
              activeSnippet.id === snip.id
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-brand-800 border-brand-200 hover:border-brand-400 hover:bg-brand-50'
            }`}>
            {snip.name}
          </button>
        ))}
      </div>

      {/* Editor + output */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2 items-start">
        {/* Editor card */}
        <div className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-card">
          <div className="flex flex-wrap items-center gap-2 border-b border-brand-100 bg-brand-50 px-4 py-2.5">
            <span className="font-mono text-xs font-semibold text-brand-700">
              {lang === 'js' ? 'main.js' : lang === 'sql' ? 'query.sql' : onlineLang.file}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {lang === 'js' ? (
                <>
                  <button type="button" onClick={() => runner.run(jsCode)} disabled={runner.running}
                    className={`${btn} bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50`}>
                    Run ▶
                  </button>
                  <button type="button" onClick={() => runner.stop()} disabled={!runner.running}
                    className={`${btn} border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40`}>
                    Stop
                  </button>
                  <button type="button" onClick={() => { runner.reset(); setJsCode(jsSnippet.code); }}
                    className={`${btn} border border-brand-200 bg-white text-brand-800 hover:bg-brand-100`}>
                    Reset
                  </button>
                </>
              ) : lang === 'sql' ? (
                <>
                  <button type="button" onClick={runSql} disabled={sqlState !== 'ready'}
                    className={`${btn} bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50`}>
                    Run query ▶
                  </button>
                  <button type="button" onClick={resetSql}
                    className={`${btn} border border-brand-200 bg-white text-brand-800 hover:bg-brand-100`}>
                    Reset
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={runOnline} disabled={onlineRun.status === 'running'}
                    className={`${btn} bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50`}>
                    {onlineRun.status === 'running' ? 'Running…' : 'Run ▶'}
                  </button>
                  <button type="button" onClick={() => { setOnlineCode((m) => ({ ...m, [lang]: activeSnippet.code })); setOnlineRun({ status: 'idle' }); }}
                    className={`${btn} border border-brand-200 bg-white text-brand-800 hover:bg-brand-100`}>
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>

          <CodeEditor
            value={lang === 'js' ? jsCode : lang === 'sql' ? sqlCode : onlineCode[lang]}
            onChange={lang === 'js' ? setJsCode : lang === 'sql' ? setSqlCode : (v) => setOnlineCode((m) => ({ ...m, [lang]: v }))}
            onRunShortcut={lang === 'js' ? () => runner.run(jsCode) : lang === 'sql' ? runSql : runOnline}
            ariaLabel={lang === 'js' ? 'JavaScript code editor' : lang === 'sql' ? 'SQL query editor' : `${onlineLang.label} code editor`}
          />

          {onlineLang && (
            <div className="border-t border-white/10 bg-slate-900 px-4 py-3">
              <label htmlFor="pg-stdin" className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                stdin — input your program reads (one value per line)
              </label>
              <textarea
                id="pg-stdin"
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                rows={3}
                spellCheck={false}
                placeholder={'e.g.\nAyushi\n21'}
                className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-slate-950 px-3 py-2 font-mono text-[0.85rem] text-slate-100 outline-none placeholder:text-slate-600 focus:border-brand-400"
              />
            </div>
          )}

          <p className="border-t border-brand-100 bg-brand-50/60 px-4 py-2 text-xs text-slate-500">
            Tip: <span className="font-semibold text-slate-600">Ctrl + Enter</span> runs your code ·{' '}
            <span className="font-semibold text-slate-600">Tab</span> indents ·{' '}
            {onlineLang
              ? `${onlineLang.label} runs online on the free Wandbox runner — your edits survive language switches.`
              : 'your edits survive language switches.'}
          </p>
        </div>

        {/* Output card */}
        <div className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-card">
          <div className="flex items-center gap-2 border-b border-brand-100 bg-brand-50 px-4 py-2.5">
            <span className="text-sm font-bold text-brand-900">Output</span>
            {lang === 'js' && runner.running && (
              <span className="text-xs font-semibold text-amber-600">● running…</span>
            )}
            {onlineLang && onlineRun.status === 'running' && (
              <span className="text-xs font-semibold text-amber-600">● running {onlineRun.langLabel}…</span>
            )}
            {onlineLang && onlineRun.status === 'done' && (
              <span className={`text-xs font-semibold ${onlineRun.result.code === 0 ? 'text-brand-700' : 'text-red-600'}`}>
                {onlineRun.result.code === 0 ? '✓ exit code 0' : `✕ exit code ${onlineRun.result.code ?? '—'}`}
              </span>
            )}
            {lang === 'sql' && sqlResults && !sqlError && (
              <span className="text-xs font-semibold text-brand-700">
                {sqlResults.length === 0 ? 'ran OK — no rows' : `${sqlRowCount} row${sqlRowCount === 1 ? '' : 's'}`}
              </span>
            )}
            <button type="button"
              onClick={lang === 'js' ? () => runner.clear() : lang === 'sql' ? () => { setSqlResults(null); setSqlError(''); } : () => setOnlineRun({ status: 'idle' })}
              className="ml-auto rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-800 transition hover:bg-brand-100">
              Clear output
            </button>
          </div>

          {lang === 'js' ? (
            <div className="bg-slate-950">
              <div ref={consoleRef}
                className="nice-scroll h-[430px] overflow-y-auto px-4 py-3 font-mono text-[0.85rem] leading-relaxed">
                {runner.lines.length === 0 ? (
                  <p className="text-slate-500">Press Run ▶ (or Ctrl + Enter) and your console.log output lands here →</p>
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
          ) : onlineLang ? (
            <div className="bg-slate-950">
              <div className="nice-scroll min-h-[430px] overflow-y-auto px-4 py-3 font-mono text-[0.85rem] leading-relaxed">
                {onlineRun.status === 'idle' && (
                  <p className="text-slate-500">
                    Press Run ▶ (or Ctrl + Enter) — your {onlineLang.label} code runs on the free Wandbox
                    runner and the output lands here. This mode needs internet; JavaScript and SQL
                    run inside your browser instead.
                  </p>
                )}
                {onlineRun.status === 'running' && (
                  <p className="text-amber-300">⏳ Running {onlineRun.langLabel}… free runners can take a few seconds, especially for compiled languages.</p>
                )}
                {onlineRun.status === 'error' && (
                  <div className="rounded-lg border border-amber-300/40 bg-amber-400/10 px-3 py-2.5 text-amber-200">
                    {onlineRun.message}
                  </div>
                )}
                {onlineRun.status === 'done' && (
                  <>
                    {onlineRun.result.stdout && (
                      <pre className="whitespace-pre-wrap break-words text-slate-100">{onlineRun.result.stdout}</pre>
                    )}
                    {!onlineRun.result.stdout && onlineRun.result.code === 0 && !onlineRun.result.compileOutput && (
                      <p className="text-slate-500">(your program ran, but printed nothing — add a print statement so you can see it)</p>
                    )}
                    {onlineRun.result.compileOutput && (
                      <>
                        <p className="mt-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-amber-400">Compiler output</p>
                        <pre className="mt-1 whitespace-pre-wrap break-words text-amber-200">{onlineRun.result.compileOutput}</pre>
                      </>
                    )}
                    {onlineRun.result.stderr && (
                      <>
                        <p className="mt-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-red-400">stderr</p>
                        <pre className="mt-1 whitespace-pre-wrap break-words text-red-300">{onlineRun.result.stderr}</pre>
                      </>
                    )}
                    <p className={`mt-4 border-t border-white/10 pt-2 text-xs font-bold ${onlineRun.result.code === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {onlineRun.result.code === 0
                        ? '✓ Finished · exit code 0'
                        : onlineRun.result.signal
                          ? `✕ Stopped by the runner (${onlineRun.result.signal}) — usually a crash or a timeout`
                          : `✕ Finished · exit code ${onlineRun.result.code ?? 'unknown'}`}
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="min-h-[430px] px-4 py-3">
              {sqlState === 'loading' && <p className="text-sm text-slate-500">Loading the SQL engine…</p>}
              {sqlState === 'idle' && <p className="text-sm text-slate-500">Preparing the SQL engine…</p>}
              {sqlState === 'error' && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                  Couldn&apos;t load the SQL engine (it needs internet once to download). Check your
                  connection and switch back to this tab to retry.
                </p>
              )}
              {sqlError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 font-mono text-sm text-red-700">
                  {sqlError}
                </div>
              )}
              {sqlState === 'ready' && !sqlResults && !sqlError && (
                <p className="text-sm text-slate-500">
                  Press <strong className="text-slate-700">Run query ▶</strong> — results show up here as a table.
                  Peek at the table below if you need the column names.
                </p>
              )}
              {sqlResults && sqlResults.length === 0 && !sqlError && (
                <p className="text-sm text-slate-600">
                  Query ran successfully — no rows returned (writes like INSERT / UPDATE produce no result set).
                </p>
              )}
              {sqlResults && sqlResults.map((set, setIdx) => (
                <div key={setIdx} className="mb-3 overflow-x-auto last:mb-0">
                  <table className="w-full border-collapse text-[0.85rem] shadow-card">
                    <thead>
                      <tr className="bg-brand-700 text-white">
                        {set.columns.map((col, i) => (
                          <th key={i} className="px-3 py-2 text-left font-semibold">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {set.values.map((row, r) => (
                        <tr key={r} className="odd:bg-white even:bg-brand-50/50">
                          {row.map((cell, c) => (
                            <td key={c} className="border-t border-brand-100 px-3 py-1.5">
                              {cell === null
                                ? <span className="italic text-slate-400">NULL</span>
                                : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {/* Seeded table preview */}
              <div className="mt-4 border-t border-brand-100 pt-2">
                <button type="button" onClick={() => setShowPreview((v) => !v)} aria-expanded={showPreview}
                  className="text-sm font-semibold text-brand-800 transition hover:text-brand-600">
                  {showPreview ? '▾' : '▸'} students table (10 rows)
                </button>
                {showPreview && (
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full border-collapse text-[0.82rem]">
                      <thead>
                        <tr className="bg-brand-700 text-white">
                          {SEED_COLUMNS.map((col) => (
                            <th key={col} className="px-3 py-1.5 text-left font-semibold">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {SEED_ROWS.map((row) => (
                          <tr key={row[0]} className="odd:bg-white even:bg-brand-50/50">
                            {row.map((cell, i) => (
                              <td key={i} className="border-t border-brand-100 px-3 py-1.5">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        Stuck on a concept? Every article in the <span className="font-semibold text-brand-700">Notes</span> has
        small <span className="font-semibold text-brand-700">▶ Try it yourself</span> cards like this one —
        and the visuals there animate exactly what this sandbox prints.
      </p>

      {/* Hidden JS sandbox runner (scripts only — no same-origin access).
          Always mounted so switching languages never remounts/re-runs it. */}
      <iframe {...runner.frameProps} />
    </div>
  );
}
