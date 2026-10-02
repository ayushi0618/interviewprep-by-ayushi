// Topic registry: sidebar order, metadata, and the raw markdown for each article.
// Markdown files live next to this file's parent in ./content and are inlined at
// build time by Vite (?raw imports), so articles ship with the static site.
import bank from '../data/bank.json';

const raw = import.meta.glob('./*.md', { query: '?raw', import: 'default', eager: true });
const byFile = {};
for (const [path, text] of Object.entries(raw)) {
  const file = path.split('/').pop().replace('.md', '');
  byFile[file] = text;
}

export const TOPICS = [
  { slug: 'javascript', file: 'javascript', emoji: '⚡', title: 'JavaScript', group: 'Core Notes', blurb: 'Types, hoisting, closures, this, promises, event loop + output puzzles' },
  { slug: 'react', file: 'react', emoji: '⚛️', title: 'React', group: 'Core Notes', blurb: 'Hooks, useEffect model, state done right, bug hunts & performance' },
  { slug: 'backend', file: 'backend', emoji: '🖥️', title: 'Backend — Node, Express, APIs, DB', group: 'Core Notes', blurb: 'Express, REST, JWT, MongoDB vs SQL, status codes' },
  { slug: 'dsa', file: 'dsa', emoji: '🧩', title: 'DSA', group: 'Core Notes', blurb: 'Big-O, patterns, trees & graphs — approach-first, like interviews' },
  { slug: 'typescript', file: 'typescript', emoji: '🔷', title: 'TypeScript Essentials', group: 'Core Notes', blurb: 'Types, interfaces vs type, generics, narrowing, TS + React traps', isNew: true },
  { slug: 'nextjs', file: 'nextjs', emoji: '▲', title: 'Next.js Basics', group: 'Core Notes', blurb: 'App vs Pages router, SSR/SSG/CSR, API routes, when Next wins', isNew: true },
  { slug: 'sql', file: 'sql', emoji: '🗄️', title: 'SQL Deep-Dive', group: 'Core Notes', blurb: 'JOINs, GROUP BY/HAVING, subqueries + 18 practice queries', isNew: true },
  { slug: 'system-design', file: 'system-design', emoji: '🏗️', title: 'System Design for Freshers', group: 'Core Notes', blurb: 'URL shortener & chat walkthroughs, cache/LB/CDN in plain words', isNew: true },
  { slug: 'operating-systems', file: 'operating-systems', emoji: '⚙️', title: 'Operating Systems', group: 'Core Subjects', blurb: 'Processes & threads, scheduling, deadlocks, paging and virtual memory in plain words', isNew: true },
  { slug: 'dbms', file: 'dbms', emoji: '🗃️', title: 'DBMS', group: 'Core Subjects', blurb: 'ER model & keys, normalization 1NF to BCNF, B-tree indexes, ACID & isolation levels', isNew: true },
  { slug: 'computer-networks', file: 'computer-networks', emoji: '🌐', title: 'Computer Networks', group: 'Core Subjects', blurb: 'OSI vs TCP/IP, TCP vs UDP, HTTP/HTTPS, DNS and routing basics', isNew: true },
  { slug: 'oop', file: 'oop', emoji: '🧱', title: 'OOP', group: 'Core Subjects', blurb: 'Four pillars, SOLID in plain words, OOP in JS/Java/C++ and design basics', isNew: true },
  { slug: 'git-cs', file: 'git-cs', emoji: '🧰', title: 'Git & CS Fundamentals', group: 'Rapid Revision', blurb: 'Git workflow, OS, DBMS, networks, OOP — 30-second answers' },
  { slug: 'html-css', file: 'html-css', emoji: '🎨', title: 'HTML/CSS Quick Notes', group: 'Rapid Revision', blurb: 'Box model, flexbox vs grid, specificity, responsive basics' },
  { slug: 'projects-hr', file: 'projects-hr', emoji: '🎯', title: 'Project Explainers + HR Round', group: 'Interview Room', blurb: 'Pitch your projects in 30s & 2 min, HR answers you can say' },
  { slug: 'mock-bank', file: 'mock-bank', emoji: '🎤', title: 'Full Mock Bank & 7-Day Plan', group: 'Interview Room', blurb: 'A 45-minute mock format, scoring rubric and a 7-day plan' },
];

for (const t of TOPICS) {
  t.markdown = byFile[t.file] || `# ${t.title}\n\nNotes coming soon.`;
  t.questions = bank[t.slug] || [];
}

export const ALL_QUESTIONS = TOPICS.flatMap((t) => t.questions.map((q) => ({ ...q, topic: t.slug, topicTitle: t.title })));
export const TOTAL_QUESTIONS = ALL_QUESTIONS.length;
export const getTopic = (slug) => TOPICS.find((t) => t.slug === slug) || TOPICS[0];
