import { useEffect, useRef, useState } from 'react';

/**
 * SqlPlayground — runnable SQL against an in-memory SQLite database.
 *
 * Engine: sql.js (SQLite compiled to WebAssembly), loaded lazily from CDN
 * on mount — no npm dependency. The load promise is cached at module level
 * so every playground on the page shares a single download. Each instance
 * gets its own DB seeded with a `students` table (previewed above the
 * editor); Reset rebuilds the DB and restores the starter query.
 */

const SQL_JS_SCRIPT = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
const SQL_JS_WASM = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm';

// Module-level cache: one CDN load shared by all playgrounds on the page.
let sqlJsPromise = null;

function loadSqlJs() {
  if (sqlJsPromise) return sqlJsPromise;
  sqlJsPromise = new Promise((resolve, reject) => {
    const init = () => window.initSqlJs({ locateFile: () => SQL_JS_WASM }).then(resolve, reject);
    if (typeof window.initSqlJs === 'function') { init(); return; }
    const script = document.createElement('script');
    script.src = SQL_JS_SCRIPT;
    script.onload = init;
    script.onerror = () => reject(new Error('Failed to load sql.js from CDN'));
    document.head.appendChild(script);
  });
  // Don't cache a failure — a later mount or retry may succeed.
  sqlJsPromise.catch(() => { sqlJsPromise = null; });
  return sqlJsPromise;
}

// Seed data: 10 students across Indian cities and common courses.
const SEED_COLUMNS = ['id', 'name', 'city', 'course', 'marks'];
const SEED_ROWS = [
  [1, 'Aarav Sharma', 'Delhi', 'B.Tech CSE', 92],
  [2, 'Priya Patel', 'Mumbai', 'B.Tech CSE', 88],
  [3, 'Rohan Mehta', 'Pune', 'BCA', 76],
  [4, 'Ananya Gupta', 'Jaipur', 'MCA', 95],
  [5, 'Vikram Singh', 'Lucknow', 'B.Tech ECE', 67],
  [6, 'Kavya Nair', 'Indore', 'B.Sc CS', 84],
  [7, 'Arjun Verma', 'Delhi', 'B.Tech CSE', 58],
  [8, 'Meera Iyer', 'Mumbai', 'MCA', 97],
  [9, 'Karan Malhotra', 'Pune', 'B.Tech ECE', 73],
  [10, 'Ishita Bose', 'Jaipur', 'BCA', 81],
];

function createSeededDb(SQL) {
  const db = new SQL.Database();
  db.run(`CREATE TABLE students (
    id INTEGER PRIMARY KEY, name TEXT, city TEXT, course TEXT, marks INTEGER
  );`);
  const stmt = db.prepare('INSERT INTO students (id, name, city, course, marks) VALUES (?, ?, ?, ?, ?)');
  SEED_ROWS.forEach((row) => stmt.run(row));
  stmt.free();
  return db;
}

export default function SqlPlayground({ title, code }) {
  const starterSql = code ?? '';
  const [sqlText, setSqlText] = useState(starterSql);
  const [engineState, setEngineState] = useState('loading'); // loading | ready | error
  const [showPreview, setShowPreview] = useState(false);
  const [resultSets, setResultSets] = useState(null); // [{ columns, values }]
  const [error, setError] = useState('');

  const sqlRef = useRef(null); // sql.js SQL object, once loaded
  const dbRef = useRef(null); // this playground's own in-memory DB

  // Lazy-load the engine on mount; seed this instance's DB when ready.
  useEffect(() => {
    let cancelled = false;
    loadSqlJs()
      .then((SQL) => {
        if (cancelled) return;
        sqlRef.current = SQL;
        dbRef.current = createSeededDb(SQL);
        setEngineState('ready');
      })
      .catch(() => { if (!cancelled) setEngineState('error'); });
    return () => {
      cancelled = true;
      if (dbRef.current) { dbRef.current.close(); dbRef.current = null; }
    };
  }, []);

  const handleRun = () => {
    if (!dbRef.current) return;
    setError('');
    setResultSets(null);
    try {
      // exec() returns one entry per statement that produced rows;
      // write/DDL statements succeed with an empty array.
      setResultSets(dbRef.current.exec(sqlText));
    } catch (err) {
      setError(err && err.message ? err.message : String(err));
    }
  };

  const handleReset = () => {
    setSqlText(starterSql);
    setError('');
    setResultSets(null);
    // Rebuild the DB so INSERT/UPDATE/DELETE experiments are undone.
    if (sqlRef.current) {
      if (dbRef.current) dbRef.current.close();
      dbRef.current = createSeededDb(sqlRef.current);
    }
  };

  const totalRows = resultSets?.[0]?.values.length ?? 0;
  const btnBase = 'rounded-lg px-3 py-1.5 text-sm font-semibold transition';

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-brand-200 bg-white shadow-card">
      {/* Header: badge + title + controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-100 bg-brand-50 px-4 py-2.5">
        <span className="rounded-md bg-brand-600 px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-white">
          🗄️ Live SQL
        </span>
        <h4 className="m-0 text-sm font-bold text-brand-900">{title}</h4>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={handleRun} disabled={engineState !== 'ready'}
            className={`${btnBase} bg-brand-600 px-3.5 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50`}>
            Run query ▶
          </button>
          <button type="button" onClick={handleReset}
            className={`${btnBase} border border-brand-200 bg-white text-brand-800 hover:bg-brand-100`}>
            Reset
          </button>
        </div>
      </div>

      {/* Engine status / graceful offline fallback */}
      {engineState === 'loading' && (
        <p className="border-b border-brand-100 bg-brand-50/60 px-4 py-2 text-sm text-slate-500">
          Loading the SQL engine…
        </p>
      )}
      {engineState === 'error' && (
        <p className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          Couldn&apos;t load the SQL engine (needs internet once). You can still
          read the query and expected output in the notes.
        </p>
      )}

      {/* Collapsible preview of the seeded students table */}
      <div className="border-b border-brand-100">
        <button type="button" onClick={() => setShowPreview((v) => !v)} aria-expanded={showPreview}
          className="w-full px-4 py-2 text-left text-sm font-semibold text-brand-800 transition hover:bg-brand-50">
          {showPreview ? '▾' : '▸'} students table (10 rows)
        </button>
        {showPreview && (
          <div className="overflow-x-auto px-4 pb-3">
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

      {/* Editable SQL area */}
      <textarea
        value={sqlText}
        onChange={(e) => setSqlText(e.target.value)}
        spellCheck={false}
        aria-label={title ? `SQL editor: ${title}` : 'SQL editor'}
        className="block h-32 w-full resize-y bg-slate-900 p-4 font-mono text-[0.85rem] leading-relaxed text-slate-100 outline-none"
      />

      {/* SQLite error, verbatim */}
      {error && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2.5 font-mono text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Query results as tables */}
      {resultSets && (
        <div className="border-t border-brand-100 px-4 py-3">
          {resultSets.length === 0 ? (
            <p className="text-sm text-slate-600">
              Query ran successfully — no rows returned (writes like INSERT /
              UPDATE produce no result set).
            </p>
          ) : (
            <>
              <p className="mb-2 text-sm font-semibold text-brand-800">
                {totalRows} row{totalRows === 1 ? '' : 's'} returned
              </p>
              {resultSets.map((set, setIdx) => (
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
