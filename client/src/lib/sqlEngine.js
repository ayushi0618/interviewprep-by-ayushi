// sqlEngine.js — shared in-browser SQL engine (sql.js / SQLite → WASM).
//
// Used by BOTH the in-article SQL playgrounds (components/playgrounds/
// SqlPlayground) and the full-page Code Playground (pages/Playground).
// The engine downloads lazily from CDN exactly once: the load promise is
// cached at module level, so every playground on the page shares it.
// There is no npm dependency and no server involved — queries run
// entirely in the learner's browser against a throwaway in-memory DB.

const SQL_JS_SCRIPT = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
const SQL_JS_WASM = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm';

// Module-level cache: one CDN load shared by all playgrounds.
let sqlJsPromise = null;

export function loadSqlJs() {
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
// Every SQL playground starts from this exact table so the notes'
// example outputs match what learners see when they run the queries.
export const SEED_COLUMNS = ['id', 'name', 'city', 'course', 'marks'];
export const SEED_ROWS = [
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

// Build a fresh in-memory DB with the seeded `students` table.
export function createSeededDb(SQL) {
  const db = new SQL.Database();
  db.run(`CREATE TABLE students (
    id INTEGER PRIMARY KEY, name TEXT, city TEXT, course TEXT, marks INTEGER
  );`);
  const stmt = db.prepare('INSERT INTO students (id, name, city, course, marks) VALUES (?, ?, ?, ?, ?)');
  SEED_ROWS.forEach((row) => stmt.run(row));
  stmt.free();
  return db;
}
