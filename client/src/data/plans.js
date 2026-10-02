// plans.js — LeetCode-style study plans for InterviewPrep.
//
// Think "SQL 50" on LeetCode: a card, a few chapters, and a list of
// completable items inside each chapter. There is NO calendar here —
// you just work down the list at your own pace and tick things off.
//
// Every item points at REAL site content:
//   article / section → a notes guide (section = one meaty ## section of it)
//   problem           → a DSA Sheet problem (ref = problem id)
//   practice          → a practice deck (ref = topic slug, bank questions)
//   playground        → the Code Playground / an in-article "try it" card
//   interview         → the live AI interview room
//   task              → a plain do-it-yourself job (write / say it out loud)
//
// Done rules live in lib/progress.js (isPlanItemDone) — this file only
// describes the plans. Manual ticks are stored per item key, and
// article/section/problem items ALSO auto-complete when you finish the
// guide / solve the problem elsewhere on the site.
//
// Item keys are `${planId}:${chapterId}:${n}` — stable as long as the
// order below doesn't change, so don't reshuffle casually.

import { PROBLEMS } from './dsaSheet';

// --- tiny item builders (keep the plan lists below readable) -----------------

const sec = (label, ref, meta) => ({ label, type: 'section', ref, ...(meta ? { meta } : {}) });
const art = (label, ref, meta) => ({ label, type: 'article', ref, ...(meta ? { meta } : {}) });
const prob = (label, ref, meta) => ({ label, type: 'problem', ref, ...(meta ? { meta } : {}) });
const prac = (label, ref, meta) => ({ label, type: 'practice', ref, ...(meta ? { meta } : {}) });
const play = (label, ref, meta) => ({ label, type: 'playground', ref, ...(meta ? { meta } : {}) });
const live = (label, ref, meta) => ({ label, type: 'interview', ref, ...(meta ? { meta } : {}) });
const task = (label, ref, meta) => ({ label, type: 'task', ref, ...(meta ? { meta } : {}) });

// --- DSA Sheet problems --------------------------------------------------------
// The DSA-75 chapters are GENERATED from the sheet (grouped by topic) so the
// plan can never drift from the real problem list. The fallback map below only
// supplies readable titles/difficulties if the sheet entry is missing one.

const DSA_TOPIC_ORDER = [
  'arrays', 'strings', 'hashing', 'two-pointers', 'sliding-window',
  'binary-search', 'sorting', 'linked-list', 'stack-queue', 'trees',
  'graphs', 'dp',
];

const DSA_TOPIC_TITLES = {
  arrays: 'Arrays',
  strings: 'Strings',
  hashing: 'Hashing',
  'two-pointers': 'Two Pointers',
  'sliding-window': 'Sliding Window',
  'binary-search': 'Binary Search',
  sorting: 'Sorting',
  'linked-list': 'Linked List',
  'stack-queue': 'Stack & Queue',
  trees: 'Trees',
  graphs: 'Graphs',
  dp: 'Dynamic Programming',
};

// id → [title, difficulty] for every problem the plan promises.
const DSA_FALLBACK = {
  'two-sum': ['Two Sum', 'Easy'],
  'best-time-stock': ['Best Time to Buy and Sell Stock', 'Easy'],
  'max-subarray': ['Maximum Subarray', 'Medium'],
  'move-zeroes': ['Move Zeroes', 'Easy'],
  'valid-palindrome': ['Valid Palindrome', 'Easy'],
  'valid-anagram': ['Valid Anagram', 'Easy'],
  'reverse-words': ['Reverse Words in a String', 'Medium'],
  'longest-common-prefix': ['Longest Common Prefix', 'Easy'],
  'contains-duplicate': ['Contains Duplicate', 'Easy'],
  'first-unique-char': ['First Unique Character in a String', 'Easy'],
  'group-anagrams': ['Group Anagrams', 'Medium'],
  'container-most-water': ['Container With Most Water', 'Medium'],
  'three-sum': ['3Sum', 'Medium'],
  'remove-duplicates-sorted': ['Remove Duplicates from Sorted Array', 'Easy'],
  'max-window-sum': ['Maximum Sum Subarray of Size K', 'Easy'],
  'longest-substring-norepeat': ['Longest Substring Without Repeating Characters', 'Medium'],
  'min-window-substring': ['Minimum Window Substring', 'Hard'],
  'binary-search': ['Binary Search', 'Easy'],
  'search-insert': ['Search Insert Position', 'Easy'],
  'first-last-position': ['First and Last Position in Sorted Array', 'Medium'],
  'sort-colors': ['Sort Colors', 'Medium'],
  'merge-intervals': ['Merge Intervals', 'Medium'],
  'kth-largest': ['Kth Largest Element in an Array', 'Medium'],
  'reverse-linked-list': ['Reverse Linked List', 'Easy'],
  'merge-two-sorted-lists': ['Merge Two Sorted Lists', 'Easy'],
  'linked-list-cycle': ['Linked List Cycle', 'Easy'],
  'middle-linked-list': ['Middle of the Linked List', 'Easy'],
  'valid-parentheses': ['Valid Parentheses', 'Easy'],
  'next-greater-element': ['Next Greater Element', 'Medium'],
  'daily-temperatures': ['Daily Temperatures', 'Medium'],
  'max-depth': ['Maximum Depth of Binary Tree', 'Easy'],
  'invert-binary-tree': ['Invert Binary Tree', 'Easy'],
  'level-order-traversal': ['Binary Tree Level Order Traversal', 'Medium'],
  'diameter-binary-tree': ['Diameter of Binary Tree', 'Easy'],
  'number-of-islands': ['Number of Islands', 'Medium'],
  'flood-fill': ['Flood Fill', 'Easy'],
  'rotting-oranges': ['Rotting Oranges', 'Medium'],
  'climbing-stairs': ['Climbing Stairs', 'Easy'],
  'house-robber': ['House Robber', 'Medium'],
  'coin-change': ['Coin Change', 'Medium'],
  'longest-increasing-subsequence': ['Longest Increasing Subsequence', 'Medium'],
};

// Normalise the sheet (array of problems) into id → problem, whatever exact
// field names the sheet uses for its title/topic.
const sheetById = {};
if (Array.isArray(PROBLEMS)) {
  for (const p of PROBLEMS) {
    if (p && p.id) sheetById[p.id] = p;
  }
}

function problemItem(id) {
  const fromSheet = sheetById[id];
  const [fallbackTitle, fallbackDiff] = DSA_FALLBACK[id] || [id, ''];
  const title = (fromSheet && (fromSheet.title || fromSheet.name)) || fallbackTitle;
  const diff = (fromSheet && (fromSheet.difficulty || fromSheet.level)) || fallbackDiff;
  return prob(title, id, diff || undefined);
}

// One chapter per DSA topic, in pattern order, items = that topic's problems.
// Starts from the sheet's own grouping; any promised id the sheet forgot
// still appears (with its fallback title) so the plan stays honest.
function dsaProblemChapters() {
  const idsByTopic = {};
  for (const topic of DSA_TOPIC_ORDER) idsByTopic[topic] = [];

  // Sheet first — it is the source of truth for what exists + ordering.
  if (Array.isArray(PROBLEMS)) {
    for (const p of PROBLEMS) {
      if (!p || !p.id) continue;
      const topic = p.topic || p.category || p.pattern || p.group;
      if (topic && idsByTopic[topic] && !idsByTopic[topic].includes(p.id)) {
        idsByTopic[topic].push(p.id);
      }
    }
  }
  // Then make sure every promised problem is in exactly one chapter.
  const placed = new Set(Object.values(idsByTopic).flat());
  const canonical = {
    arrays: ['two-sum', 'best-time-stock', 'max-subarray', 'move-zeroes'],
    strings: ['valid-palindrome', 'valid-anagram', 'reverse-words', 'longest-common-prefix'],
    hashing: ['contains-duplicate', 'first-unique-char', 'group-anagrams'],
    'two-pointers': ['container-most-water', 'three-sum', 'remove-duplicates-sorted'],
    'sliding-window': ['max-window-sum', 'longest-substring-norepeat', 'min-window-substring'],
    'binary-search': ['binary-search', 'search-insert', 'first-last-position'],
    sorting: ['sort-colors', 'merge-intervals', 'kth-largest'],
    'linked-list': ['reverse-linked-list', 'merge-two-sorted-lists', 'linked-list-cycle', 'middle-linked-list'],
    'stack-queue': ['valid-parentheses', 'next-greater-element', 'daily-temperatures'],
    trees: ['max-depth', 'invert-binary-tree', 'level-order-traversal', 'diameter-binary-tree'],
    graphs: ['number-of-islands', 'flood-fill', 'rotting-oranges'],
    dp: ['climbing-stairs', 'house-robber', 'coin-change', 'longest-increasing-subsequence'],
  };
  for (const topic of DSA_TOPIC_ORDER) {
    for (const id of canonical[topic]) {
      if (!placed.has(id)) {
        idsByTopic[topic].push(id);
        placed.add(id);
      }
    }
  }
  // Any sheet problem not in the canonical lists still gets a home.
  if (Array.isArray(PROBLEMS)) {
    for (const p of PROBLEMS) {
      if (p && p.id && !placed.has(p.id)) {
        const topic = p.topic || p.category || p.pattern || p.group;
        const home = idsByTopic[topic] ? topic : 'arrays';
        idsByTopic[home].push(p.id);
        placed.add(p.id);
      }
    }
  }

  return DSA_TOPIC_ORDER
    .filter((topic) => idsByTopic[topic].length > 0)
    .map((topic) => ({
      id: topic,
      title: DSA_TOPIC_TITLES[topic] || topic,
      items: idsByTopic[topic].map(problemItem),
    }));
}

// --- the plans -----------------------------------------------------------------

const RAW_PLANS = [
  {
    id: 'sql-50',
    title: 'SQL 50',
    emoji: '🗄️',
    tagline: 'Write real queries — JOINs, grouping and the 10 interview classics.',
    color: 'brand',
    chapters: [
      {
        id: 'basics',
        title: 'Basics — SELECT & filtering',
        items: [
          sec('The only query shape you need (SELECT → FROM → WHERE → ORDER BY)', 'sql', '~8 min'),
          sec('Filtering in depth: WHERE, LIKE, IN, BETWEEN', 'sql', '~10 min'),
          play('Playground page: sort the students table, toppers first', 'sql', '▶ playground'),
          play('Practice query 1 — Active employees, highest salary first, top 3', 'sql', '✍️ write it first'),
          play('Practice query 2 — Names starting with “A”, salary 40,000–90,000', 'sql', '✍️ write it first'),
          play('Practice query 8 — How many unique cities do active employees come from?', 'sql', '✍️ write it first'),
          play('Playground page: filter CSE students above 80', 'sql', '▶ playground'),
          task('Write queries 1–2 again from memory, no peeking', 'sql', '~10 min'),
        ],
      },
      {
        id: 'joins',
        title: 'JOINs & combining tables',
        items: [
          sec('JOINs — combining tables (INNER vs LEFT)', 'sql', '~12 min'),
          sec('A JOIN, joined by hand (row by row)', 'sql', '~8 min'),
          sec('Subqueries & DISTINCT', 'sql', '~10 min'),
          sec('Same answer, two ways — subquery vs JOIN', 'sql', '~8 min'),
          play('Practice query 3 — Every employee with department name, even those with none', 'sql', '✍️ write it first'),
          play('Practice query 5 — Employees who never placed an order', 'sql', '✍️ write it first'),
          play('Practice query 10 — Delhi/Pune departments with an order above 10,000', 'sql', '✍️ write it first'),
          task('Sketch the employees / departments / orders schema from memory', 'sql', '~5 min'),
          task('Explain INNER vs LEFT JOIN out loud in 30 seconds', 'sql', 'say it'),
        ],
      },
      {
        id: 'grouping',
        title: 'GROUP BY, aggregates & subqueries',
        items: [
          sec('GROUP BY + aggregates', 'sql', '~10 min'),
          sec('HAVING vs WHERE', 'sql', '~6 min'),
          sec('GROUP BY + HAVING, traced on five rows', 'sql', '~8 min'),
          play('Practice query 4 — Departments with more than 5 employees', 'sql', '✍️ write it first'),
          play('Practice query 6 — Total order amount per employee, biggest first', 'sql', '✍️ write it first'),
          play('Practice query 7 — Employees earning more than their department average', 'sql', '✍️ write it first'),
          play('Practice query 9 — Direct reports of manager id 4', 'sql', '✍️ write it first'),
          play('Playground page: average marks per course (GROUP BY)', 'sql', '▶ playground'),
          task('HAVING vs WHERE — write one example of each', 'sql', '~10 min'),
          prac('SQL practice round 1 (Q1–5)', 'sql', '🎤 say answers out loud'),
        ],
      },
      {
        id: 'pro',
        title: 'Indexes, transactions & window functions',
        items: [
          sec('Indexes — fast reads, costly writes', 'sql', '~8 min'),
          sec('Why an index is fast — the B-tree in plain words', 'sql', '~6 min'),
          sec('Transactions & ACID — all or nothing', 'sql', '~8 min'),
          sec('Window functions — rank without collapsing rows', 'sql', '~8 min'),
          sec('Normalization recap (1NF → 3NF)', 'sql', '~8 min'),
          sec('Naming trap: SQL vs MySQL', 'sql', '~4 min'),
          play('Playground page: insert + update a student, then Reset', 'sql', '▶ playground'),
          play('Playground page: run a query, break it on purpose, read the error', 'sql', '▶ playground'),
          prac('SQL practice round 2 (Q6–10)', 'sql', '🎤 say answers out loud'),
          task('Second-highest salary — write it two different ways', 'sql', 'classic question'),
        ],
      },
      {
        id: 'finish',
        title: 'Interview finish',
        items: [
          task('Find employees with no orders — from memory, first try', 'sql', '~5 min'),
          task('Revise: WHERE vs HAVING in one line each', 'sql', '~5 min'),
          task('Teach-back: explain JOINs like you are teaching a friend (2 min)', 'sql', 'say it'),
          live('Live interview: SQL round', 'sql', 'camera on 🎥'),
          task('60-second revision checklist: SQL', 'sql', 'final pass'),
        ],
      },
    ],
  },

  {
    id: 'javascript-30',
    title: 'JavaScript 30',
    emoji: '⚡',
    tagline: 'Closures, the event loop and every output puzzle they love to ask.',
    color: 'brand',
    chapters: [
      {
        id: 'foundations',
        title: 'Foundations',
        items: [
          sec('Data types — primitive vs reference', 'javascript', '~10 min'),
          sec('var vs let vs const', 'javascript', '~10 min'),
          sec('Hoisting & the Temporal Dead Zone', 'javascript', '~10 min'),
          sec('Scope & closures', 'javascript', '~14 min'),
          play('In-article playground: the closure counter', 'javascript', '▶ try it in the notes'),
          sec('The this keyword — the basic rules', 'javascript', '~12 min'),
          sec('== vs === and type coercion', 'javascript', '~10 min'),
          prac('JavaScript practice round 1 (Q1–5)', 'javascript', '🎤 say answers out loud'),
        ],
      },
      {
        id: 'arrays-async',
        title: 'Arrays, async & the event loop',
        items: [
          sec('Arrays & the Big Four: map, filter, reduce, forEach', 'javascript', '~14 min'),
          sec('Objects — copying, shallow vs deep', 'javascript', '~10 min'),
          sec('Functions: arrow, IIFE, callbacks, higher-order', 'javascript', '~12 min'),
          play('Playground: the debounce demo — predict the API calls', 'javascript', '▶ playground'),
          sec('Promises & async/await', 'javascript', '~14 min'),
          sec('The event loop — the four players', 'javascript', '~12 min'),
          play('Playground: promise order — predict first, then run', 'javascript', '▶ playground'),
          sec('ES6+ essentials: destructuring, spread vs rest', 'javascript', '~10 min'),
          prac('JavaScript practice round 2 (Q6–10)', 'javascript', '🎤 say answers out loud'),
        ],
      },
      {
        id: 'traps',
        title: 'Traps & output questions',
        items: [
          sec('Common traps — the greatest hits', 'javascript', '~12 min'),
          sec('Output questions — predict the result', 'javascript', '~14 min'),
          play('In-article playground: var + setTimeout in a loop', 'javascript', '▶ try it in the notes'),
          play('Playground page: typeof traps & coercion warm-up', 'javascript', '▶ playground'),
          prob('Contains Duplicate', 'contains-duplicate', 'Easy'),
          prob('Maximum Subarray', 'max-subarray', 'Medium'),
          task('Write the 8 falsy values from memory', 'javascript', '~3 min'),
        ],
      },
      {
        id: 'interview-ready',
        title: 'Interview ready',
        items: [
          prob('Two Sum', 'two-sum', 'Easy'),
          prob('Valid Palindrome', 'valid-palindrome', 'Easy'),
          play('In-article playground: arrays — the Big Four drill', 'javascript', '▶ try it in the notes'),
          prac('JavaScript practice round 3 (Q11–15)', 'javascript', '🎤 say answers out loud'),
          task('Teach-back: closures in your own words (60 seconds)', 'javascript', 'say it'),
          task('60-second revision checklist: JavaScript', 'javascript', 'final pass'),
        ],
      },
    ],
  },

  {
    id: 'typescript-15',
    title: 'TypeScript 15',
    emoji: '🔷',
    tagline: 'Types, generics and narrowing — minus the runtime surprises.',
    color: 'brand',
    chapters: [
      {
        id: 'foundations',
        title: 'Type foundations',
        items: [
          sec('Why TypeScript over JavaScript?', 'typescript', '~8 min'),
          sec('Basic types', 'typescript', '~8 min'),
          sec('Type inference — learn to “hover-think”', 'typescript', '~8 min'),
          sec('Interfaces vs type aliases', 'typescript', '~10 min'),
          play('In-article playground: basic types drill', 'typescript', '▶ try it in the notes'),
          prac('TypeScript practice round 1 (Q1–5)', 'typescript', '🎤 say answers out loud'),
        ],
      },
      {
        id: 'generics-narrowing',
        title: 'Generics, narrowing & safety',
        items: [
          sec('Unions, intersections & literal types', 'typescript', '~10 min'),
          sec('Generics basics — from any to generic, step by step', 'typescript', '~12 min'),
          sec('Type narrowing — one value, three guards (traced)', 'typescript', '~10 min'),
          play('In-article playground: narrowing drill', 'typescript', '▶ try it in the notes'),
          sec('Optional chaining & nullish coalescing in TS', 'typescript', '~6 min'),
        ],
      },
      {
        id: 'react-finish',
        title: 'TypeScript + React & traps',
        items: [
          sec('TypeScript with React — typing props properly', 'typescript', '~12 min'),
          sec('Utility types: Partial, Pick, Omit & friends', 'typescript', '~10 min'),
          sec('Strict mode — the safety net you should always name', 'typescript', '~6 min'),
          sec('Common interview traps', 'typescript', '~10 min'),
          prac('TypeScript practice round 2 (Q6–10)', 'typescript', '🎤 say answers out loud'),
        ],
      },
    ],
  },

  {
    id: 'react-25',
    title: 'React 25',
    emoji: '⚛️',
    tagline: 'Hooks done right — useEffect without the infinite loop.',
    color: 'brand',
    chapters: [
      {
        id: 'foundations',
        title: 'React foundations',
        items: [
          sec('What is React, and why use it?', 'react', '~10 min'),
          sec('JSX rules', 'react', '~8 min'),
          sec('Components & props (including children)', 'react', '~10 min'),
          sec('State with useState — immutable updates', 'react', '~12 min'),
          play('In-article playground: state drill', 'react', '▶ try it in the notes'),
          sec('Lists & keys — why index keys are risky', 'react', '~10 min'),
          prac('React practice round 1 (Q1–5)', 'react', '🎤 say answers out loud'),
        ],
      },
      {
        id: 'effects',
        title: 'Effects, refs & data',
        items: [
          sec('useEffect — the full model', 'react', '~14 min'),
          sec('useEffect cleanup & the infinite-loop trap', 'react', '~12 min'),
          sec('useRef — state vs ref, when each one', 'react', '~8 min'),
          sec('Conditional rendering & controlled forms', 'react', '~10 min'),
          play('RenderCounter visual — count your own renders', 'react', 'visual in the notes'),
          sec('Data fetching in React (cancel with AbortController)', 'react', '~12 min'),
          sec('React Router basics', 'react', '~8 min'),
          prac('React practice round 2 (Q6–10)', 'react', '🎤 say answers out loud'),
        ],
      },
      {
        id: 'pro',
        title: 'Context, performance & bug hunts',
        items: [
          sec('useContext — killing prop drilling', 'react', '~10 min'),
          sec('useMemo vs useCallback', 'react', '~10 min'),
          sec('Custom hooks — build a useFetch', 'react', '~10 min'),
          sec('Performance basics — React.memo & stable props', 'react', '~8 min'),
          play('In-article playground: custom-hook drill', 'react', '▶ try it in the notes'),
          sec('Bug hunt: the infinite loop', 'react', '~6 min'),
          sec('Bug hunt: stale state & missing keys', 'react', '~8 min'),
          prac('React practice round 3 (Q11–15)', 'react', '🎤 say answers out loud'),
        ],
      },
      {
        id: 'finish',
        title: 'Interview finish',
        items: [
          task('Explain your React project out loud (2 minutes)', 'react', 'say it'),
          live('Live interview: React round', 'react', 'camera on 🎥'),
        ],
      },
    ],
  },

  {
    id: 'backend-30',
    title: 'Backend 30',
    emoji: '🖥️',
    tagline: 'Node, Express, JWT and databases — the full request story.',
    color: 'brand',
    chapters: [
      {
        id: 'web-node',
        title: 'How the web & Node work',
        items: [
          sec('How the web works — a request’s full journey', 'backend', '~10 min'),
          sec('Node.js — the single-threaded event loop', 'backend', '~12 min'),
          sec('Why non-blocking I/O matters', 'backend', '~6 min'),
          sec('Sync vs async file read — the classic trap', 'backend', '~8 min'),
          play('In-article playground: event-loop trace', 'backend', '▶ try it in the notes'),
          sec('npm & package.json in brief', 'backend', '~6 min'),
          task('Trace one request out loud: browser → server → DB → back', 'backend', 'say it'),
          prac('Backend practice round 1 (Q1–5)', 'backend', '🎤 say answers out loud'),
        ],
      },
      {
        id: 'express-rest',
        title: 'Express & REST APIs',
        items: [
          sec('Express & middleware — the heart of Express', 'backend', '~12 min'),
          sec('Tracing one request through the middleware chain', 'backend', '~10 min'),
          play('In-article playground: middleware chain', 'backend', '▶ try it in the notes'),
          sec('REST APIs & resource naming rules', 'backend', '~10 min'),
          sec('REST design walkthrough — cleaning up a messy API', 'backend', '~10 min'),
          sec('Request anatomy: params vs query vs body vs headers', 'backend', '~8 min'),
          sec('HTTP status codes — the full reference table', 'backend', '~10 min'),
          prac('Backend practice round 2 (Q6–10)', 'backend', '🎤 say answers out loud'),
        ],
      },
      {
        id: 'auth-data',
        title: 'Auth, databases & production basics',
        items: [
          sec('Authentication vs authorization + JWT, step by step', 'backend', '~14 min'),
          sec('Decoding a sample JWT, part by part', 'backend', '~8 min'),
          sec('Passwords — bcrypt, never plain text', 'backend', '~8 min'),
          play('In-article playground: JWT decode drill', 'backend', '▶ try it in the notes'),
          sec('Databases: SQL vs NoSQL & MongoDB basics', 'backend', '~12 min'),
          sec('Environment variables & .env mistakes that bite', 'backend', '~8 min'),
          sec('CORS in 3 lines', 'backend', '~5 min'),
          sec('Error handling & validation basics', 'backend', '~10 min'),
          prac('Backend practice round 3 (Q11–15)', 'backend', '🎤 say answers out loud'),
        ],
      },
      {
        id: 'finish',
        title: 'Deploy & interview finish',
        items: [
          sec('Deployment basics in brief', 'backend', '~8 min'),
          task('Deploy checklist: env vars, PORT, read the logs', 'backend', '~10 min'),
          task('Teach-back: the JWT flow in 60 seconds', 'backend', 'say it'),
          task('60-second revision checklist: Backend', 'backend', 'final pass'),
          live('Live interview: Backend round', 'backend', 'camera on 🎥'),
        ],
      },
    ],
  },

  {
    id: 'dsa-75',
    title: 'DSA 75',
    emoji: '🧩',
    tagline: 'Every sheet problem, pattern first — approach before code.',
    color: 'brand',
    chapters: [
      {
        id: 'patterns',
        title: 'Read the patterns first',
        items: [
          sec('Big-O notation — the language of “how fast?”', 'dsa', '~12 min'),
          sec('Arrays & strings — the basics everyone skips', 'dsa', '~10 min'),
          sec('Hashing — the “have I seen this before?” tool', 'dsa', '~10 min'),
          sec('Traced example: Two Sum in one pass', 'dsa', '~8 min'),
          play('In-article playground: Two Sum trace', 'dsa', '▶ try it in the notes'),
          sec('Two pointers — two fingers, one pass', 'dsa', '~10 min'),
          sec('Sliding window — a window that breathes', 'dsa', '~12 min'),
          sec('Traced example: variable window on “abca”', 'dsa', '~8 min'),
          play('In-article playground: sliding-window trace', 'dsa', '▶ try it in the notes'),
          sec('Sorting — know the menu, not the kitchen', 'dsa', '~10 min'),
          sec('Binary search — halve it till you find it', 'dsa', '~12 min'),
          sec('Linked lists — pointers, not indexes', 'dsa', '~10 min'),
          play('In-article playground: linked-list pointers', 'dsa', '▶ try it in the notes'),
          sec('Stacks & queues — order is the whole point', 'dsa', '~8 min'),
          sec('Trees — the four traversals & the BST property', 'dsa', '~12 min'),
          sec('Graphs in brief — just BFS and DFS', 'dsa', '~12 min'),
          sec('Recursion & backtracking — trust the leap', 'dsa', '~10 min'),
          sec('Dynamic programming — recursion with a notebook', 'dsa', '~12 min'),
          sec('Building the Fibonacci table, bottom-up', 'dsa', '~8 min'),
          sec('Pattern-recognition table — read the clue, pick the weapon', 'dsa', '~10 min'),
        ],
      },
      // Problem chapters are generated from the DSA Sheet, grouped by topic.
      ...dsaProblemChapters(),
      {
        id: 'finish',
        title: 'Interview finish',
        items: [
          prac('DSA practice round 1 (Q1–5)', 'dsa', '🎤 say answers out loud'),
          prac('DSA practice round 2 (Q6–10)', 'dsa', '🎤 say answers out loud'),
          prac('DSA practice round 3 (Q11–15)', 'dsa', '🎤 say answers out loud'),
          live('Live interview: DSA round', 'dsa', 'camera on 🎥'),
          task('60-second revision checklist: DSA', 'dsa', 'final pass'),
        ],
      },
    ],
  },

  {
    id: 'cs-20',
    title: 'CS Fundamentals 20',
    emoji: '🧰',
    tagline: 'Git, OS, networks, OOP and HTML/CSS — 30-second answers.',
    color: 'brand',
    chapters: [
      {
        id: 'git',
        title: 'Git & GitHub workflow',
        items: [
          sec('The 10 Git commands that matter', 'git-cs', '~10 min'),
          sec('How Git thinks: the three areas', 'git-cs', '~8 min'),
          sec('Merge vs rebase', 'git-cs', '~6 min'),
          sec('A day in the life — one feature, start to finish', 'git-cs', '~10 min'),
          sec('Undo scenarios — which tool, and is it safe to share?', 'git-cs', '~8 min'),
          sec('Merge conflict walkthrough — what the scary markers mean', 'git-cs', '~8 min'),
          prac('Git & CS practice round (Q1–6)', 'git-cs', '🎤 say answers out loud'),
          task('Run the full Git workflow once in a scratch repo', 'git-cs', '~15 min'),
        ],
      },
      {
        id: 'cs',
        title: 'CS fundamentals — 30-second answers',
        items: [
          sec('Operating Systems: process, thread, deadlock', 'git-cs', '~10 min'),
          sec('DBMS basics', 'git-cs', '~10 min'),
          sec('Networks: DNS, HTTP, TCP vs UDP', 'git-cs', '~12 min'),
          sec('OOP — the 4 pillars', 'git-cs', '~10 min'),
          sec('CS rapid answers — say the example, not just the definition', 'git-cs', '~10 min'),
          task('60-second revision checklist: Git & CS', 'git-cs', 'final pass'),
        ],
      },
      {
        id: 'html-css',
        title: 'HTML/CSS quick notes',
        items: [
          sec('Semantic HTML', 'html-css', '~6 min'),
          sec('The box model', 'html-css', '~8 min'),
          sec('Flexbox vs Grid in 2 lines', 'html-css', '~8 min'),
          sec('position values', 'html-css', '~6 min'),
          sec('Specificity in one line', 'html-css', '~6 min'),
          sec('Responsive design basics', 'html-css', '~8 min'),
          prac('HTML/CSS practice round (Q1–5)', 'html-css', '🎤 say answers out loud'),
        ],
      },
    ],
  },

  {
    id: 'interview-60',
    title: 'Top Interview 60',
    emoji: '🎤',
    tagline: 'The whole bank, in rounds — finish with two live interviews.',
    color: 'brand',
    chapters: [
      {
        id: 'javascript',
        title: 'JavaScript rapid rounds',
        items: [
          art('Read the full JavaScript guide once', 'javascript', '~40 min'),
          sec('Deep-dive: scope & closures', 'javascript', '~14 min'),
          sec('Deep-dive: the event loop', 'javascript', '~12 min'),
          prac('JavaScript rapid round 1 (Q1–5)', 'javascript', '🎤 one line each'),
          prac('JavaScript rapid round 2 (Q6–10)', 'javascript', '🎤 one line each'),
          prac('JavaScript rapid round 3 (Q11–15)', 'javascript', '🎤 one line each'),
          task('Teach-back: closures + event loop, 2 minutes total', 'javascript', 'say it'),
        ],
      },
      {
        id: 'react',
        title: 'React rapid rounds',
        items: [
          art('Read the full React guide once', 'react', '~40 min'),
          sec('Deep-dive: useEffect — the full model', 'react', '~14 min'),
          sec('Deep-dive: custom hooks', 'react', '~10 min'),
          prac('React rapid round 1 (Q1–5)', 'react', '🎤 one line each'),
          prac('React rapid round 2 (Q6–10)', 'react', '🎤 one line each'),
          prac('React rapid round 3 (Q11–15)', 'react', '🎤 one line each'),
          task('Teach-back: explain useEffect to a beginner (2 min)', 'react', 'say it'),
        ],
      },
      {
        id: 'backend',
        title: 'Backend rapid rounds',
        items: [
          art('Read the full Backend guide once', 'backend', '~40 min'),
          sec('Deep-dive: authentication vs authorization + JWT', 'backend', '~14 min'),
          sec('Deep-dive: HTTP status codes that matter', 'backend', '~10 min'),
          prac('Backend rapid round 1 (Q1–5)', 'backend', '🎤 one line each'),
          prac('Backend rapid round 2 (Q6–10)', 'backend', '🎤 one line each'),
          prac('Backend rapid round 3 (Q11–15)', 'backend', '🎤 one line each'),
          task('Teach-back: what happens when you press Enter on a URL (60 sec)', 'backend', 'say it'),
        ],
      },
      {
        id: 'dsa',
        title: 'DSA rapid rounds',
        items: [
          art('Read the full DSA guide once', 'dsa', '~40 min'),
          sec('Deep-dive: the pattern-recognition table', 'dsa', '~10 min'),
          sec('Deep-dive: dynamic programming — the two properties', 'dsa', '~12 min'),
          prac('DSA rapid round 1 (Q1–5)', 'dsa', '🎤 approach first'),
          prac('DSA rapid round 2 (Q6–10)', 'dsa', '🎤 approach first'),
          prac('DSA rapid round 3 (Q11–15)', 'dsa', '🎤 approach first'),
          task('Say the approach (no code) for 5 random DSA questions', 'dsa', '~10 min'),
        ],
      },
      {
        id: 'sql-typescript',
        title: 'SQL & TypeScript rounds',
        items: [
          art('Read the full SQL guide once', 'sql', '~35 min'),
          sec('Deep-dive: JOINs — combining tables', 'sql', '~12 min'),
          prac('SQL rapid round 1 (Q1–5)', 'sql', '🎤 one line each'),
          prac('SQL rapid round 2 (Q6–10)', 'sql', '🎤 one line each'),
          art('Read the full TypeScript guide once', 'typescript', '~30 min'),
          prac('TypeScript rapid round 1 (Q1–5)', 'typescript', '🎤 one line each'),
          prac('TypeScript rapid round 2 (Q6–10)', 'typescript', '🎤 one line each'),
        ],
      },
      {
        id: 'next-system-design',
        title: 'Next.js & System Design rounds',
        items: [
          art('Read the full Next.js guide once', 'nextjs', '~30 min'),
          prac('Next.js rapid round 1 (Q1–4)', 'nextjs', '🎤 one line each'),
          prac('Next.js rapid round 2 (Q5–8)', 'nextjs', '🎤 one line each'),
          art('Read the full System Design guide once', 'system-design', '~30 min'),
          prac('System Design rapid round 1 (Q1–4)', 'system-design', '🎤 think aloud'),
          prac('System Design rapid round 2 (Q5–8)', 'system-design', '🎤 think aloud'),
        ],
      },
      {
        id: 'rapid-cs',
        title: 'Git, CS & HTML/CSS rapid fire',
        items: [
          art('Read the full Git & CS guide once', 'git-cs', '~30 min'),
          prac('Git & CS rapid round (Q1–6)', 'git-cs', '🎤 30 seconds each'),
          art('Read the full HTML/CSS guide once', 'html-css', '~20 min'),
          prac('HTML/CSS rapid round (Q1–5)', 'html-css', '🎤 30 seconds each'),
        ],
      },
      {
        id: 'projects-hr',
        title: 'Projects & HR round',
        items: [
          art('Read: Project Explainers + HR Round', 'projects-hr', '~25 min'),
          prac('Projects & HR round 1 (Q1–4)', 'projects-hr', '🎤 your own projects'),
          prac('Projects & HR round 2 (Q5–8)', 'projects-hr', '🎤 your own projects'),
          prac('Projects & HR round 3 (Q9–12)', 'projects-hr', '🎤 your own projects'),
          task('Write your 30-second project pitch, then say it', 'projects-hr', '~10 min'),
          task('Practise “Tell me about yourself” (60 seconds, timed)', 'projects-hr', 'say it'),
        ],
      },
      {
        id: 'live-finish',
        title: 'Live interview finish',
        items: [
          art('Read: Full Mock Bank & the 45-minute mock format', 'mock-bank', '~15 min'),
          live('Live interview 1 — mixed technical round', 'mixed', 'camera on 🎥'),
          live('Live interview 2 — project + HR round', 'projects-hr', 'camera on 🎥'),
          task('Score yourself with the mock rubric, honestly', 'mock-bank', '~10 min'),
          task('Night-before checklist — run it the evening before', 'projects-hr', 'final pass'),
        ],
      },
    ],
  },
];

// Attach stable keys: `${planId}:${chapterId}:${n}` (1-based, in order).
export const PLANS = RAW_PLANS.map((plan) => ({
  ...plan,
  chapters: plan.chapters.map((chapter) => ({
    ...chapter,
    items: chapter.items.map((item, i) => ({
      key: `${plan.id}:${chapter.id}:${i + 1}`,
      ...item,
    })),
  })),
}));

export const PLAN_LIST = PLANS;

export function planItemCount(plan) {
  if (!plan || !Array.isArray(plan.chapters)) return 0;
  return plan.chapters.reduce((sum, chapter) => sum + (chapter.items ? chapter.items.length : 0), 0);
}
