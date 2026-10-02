// verify-chapters.mjs — node check that every study-plan section/article
// item resolves to a real chapter of its guide (the same splitChapters +
// resolveChapter the app runs). Also prints chapters per guide.
//
//   node scripts/verify-chapters.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { splitChapters, resolveChapter } from '../client/src/lib/chapters.js';

const CONTENT = new URL('../client/src/content/', import.meta.url).pathname;
const guides = {}; // file -> chapters
for (const f of readdirSync(CONTENT).filter((x) => x.endsWith('.md'))) {
  guides[f.replace('.md', '')] = splitChapters(readFileSync(CONTENT + f, 'utf8'));
}
// topics.js: slug === file for every guide today.
console.log('Chapters per guide:');
let totalChapters = 0;
for (const [slug, chs] of Object.entries(guides)) {
  totalChapters += chs.length;
  console.log(`  ${slug}: ${chs.length} (${chs.map((c) => c.slug).slice(0, 3).join(', ')}${chs.length > 3 ? ', …' : ''})`);
}
console.log(`  TOTAL: ${totalChapters} chapters across ${Object.keys(guides).length} guides`);

// Pull every sec()/art() call out of plans.js (labels are plain strings).
const plansSrc = readFileSync(new URL('../client/src/data/plans.js', import.meta.url), 'utf8');
const itemRe = /\b(sec|art)\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'([\w-]+)'/g;
let resolved = 0;
const misses = [];
let m;
while ((m = itemRe.exec(plansSrc)) !== null) {
  const [, kind, label, ref] = m;
  const chs = guides[ref];
  if (!chs) { misses.push(`${kind} "${label}" → unknown guide '${ref}'`); continue; }
  if (kind === 'art') { resolved += 1; continue; } // article items need only the guide
  const hit = resolveChapter(chs, label);
  if (hit) resolved += 1;
  else misses.push(`sec "${label}" (${ref})`);
}
const totalItems = resolved + misses.length;
console.log(`\nPlan items resolving: ${resolved}/${totalItems}`);
if (misses.length) {
  console.log('UNRESOLVED (fall back to whole-guide completion):');
  for (const x of misses) console.log(`  ✗ ${x}`);
}
process.exit(misses.length ? 1 : 0);
