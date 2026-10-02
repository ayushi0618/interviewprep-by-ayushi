// Extracts mock-interview Q&A from the notes markdown into a JS data file.
// The notes use a loose but consistent format:
//   **1. Question text?**        (or **Q1. ...** / **Q: ...**)
//   > model answer...            (or a plainly quoted "answer..." line)
// Run: node scripts/extract-bank.mjs → rewrites client/src/data/bank.js
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'client', 'src', 'content');

// Which content file belongs to which practice topic.
const TOPIC_OF_FILE = {
  'javascript.md': 'javascript',
  'react.md': 'react',
  'backend.md': 'backend',
  'dsa.md': 'dsa',
  'typescript.md': 'typescript',
  'nextjs.md': 'nextjs',
  'sql.md': 'sql',
  'system-design.md': 'system-design',
  'git-cs.md': 'git-cs',
  'html-css.md': 'html-css',
  'projects-hr.md': 'projects-hr',
};

const STOPWORDS = new Set(('the a an and or of to in is are was were what how why when do does did you your i it its this that with for on at by from as be can could should would will shall may might have has had not no yes if then than so such into about between through during before after above below under over again further once here there all any both each few more most other some only own same don t s m re ll ve d o clock one two three get make take').split(' '));

function keywordsFor(question, answer) {
  const text = `${question} ${answer}`.toLowerCase().replace(/[`*_"'“”‘’>]/g, ' ');
  const freq = new Map();
  for (const w of text.split(/[^a-z0-9+#.-]+/)) {
    const word = w.replace(/^[.-]+|[.-]+$/g, '');
    if (word.length < 4 || STOPWORDS.has(word) || /^\d+$/.test(word)) continue;
    freq.set(word, (freq.get(word) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([w]) => w);
}

const QUESTION_RE = /^\*\*(?:Q\d+[:.]\s*|Q:\s*|\d+\.\s*)(.+?)\*\*\s*$/;
const bank = {};

for (const [file, topic] of Object.entries(TOPIC_OF_FILE)) {
  const path = join(contentDir, file);
  if (!existsSync(path)) { console.warn('missing', file); continue; }
  const lines = readFileSync(path, 'utf8').split('\n');
  const items = [];
  let current = null;
  const flush = () => { if (current && current.answer.trim().length > 10) items.push(current); current = null; };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const q = line.match(QUESTION_RE);
    if (q) { flush(); current = { question: q[1].trim(), answer: '' }; continue; }
    if (!current) continue;
    if (/^#{1,4}\s/.test(line) || line === '---') { flush(); continue; }
    if (!line.trim()) continue;
    // Answer line: strip blockquote marker and surrounding smart/straight quotes.
    let a = line.replace(/^>\s?/, '').trim();
    if ((a.startsWith('"') && a.endsWith('"')) || (a.startsWith('“') && a.endsWith('”'))) a = a.slice(1, -1);
    if (a === '</details>' || a.startsWith('<summary')) { flush(); continue; }
    current.answer += (current.answer ? ' ' : '') + a;
  }
  flush();
  // Only keep entries whose question reads like a question or prompt (long enough to be meaningful).
  const clean = items
    .map((it) => ({ ...it, question: it.question.replace(/\s+/g, ' ').trim(), answer: it.answer.replace(/\s+/g, ' ').trim() }))
    .filter((it) => it.question.length > 8 && it.answer.length > 20)
    .map((it) => ({ question: it.question, answer: it.answer, keywords: keywordsFor(it.question, it.answer) }));
  if (clean.length) bank[topic] = clean;
  console.log(topic, clean.length);
}

const outPath = join(root, 'client', 'src', 'data', 'bank.json');
writeFileSync(outPath, JSON.stringify(bank, null, 2));
console.log('wrote client/src/data/bank.json');
