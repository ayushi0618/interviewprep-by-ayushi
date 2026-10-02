import { useMemo } from 'react';
import { marked } from 'marked';
import { renderMarkdown, splitSegments } from '../lib/markdown';
import { TOPICS } from '../content/topics';
import VISUALS from './visuals';
import JsPlayground from '../components/playgrounds/JsPlayground';
import SqlPlayground from '../components/playgrounds/SqlPlayground';

// Renders one notes article as an ordered list of segments:
//   md         → styled HTML via renderMarkdown (copy buttons + in-app links
//                are handled by the delegated onClick on the <article> below)
//   visual     → interactive React visualizer from the ./visuals registry
//   playground → runnable JS playground,  sql → runnable SQL playground
// Unknown visual names render a friendly fallback card instead of crashing.
export default function ArticleRenderer({ topic, onNavigate }) {
  const slugByFile = useMemo(() => {
    const map = {};
    for (const t of TOPICS) map[t.file] = t.slug;
    return map;
  }, []);

  const segments = useMemo(() => splitSegments(topic.markdown), [topic]);

  // One delegated handler for everything inside the article: copy buttons in
  // code blocks and internal #article-<slug> links (converted by markdown.js).
  const handleClick = (e) => {
    // Copy button inside a code block
    const btn = e.target.closest('.copy-btn');
    if (btn) {
      const code = btn.parentElement.querySelector('code')?.innerText || '';
      navigator.clipboard?.writeText(code).then(() => {
        btn.textContent = 'Copied ✓';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1400);
      });
      return;
    }
    // Internal article link (transformed to #article-<slug>)
    const a = e.target.closest('a[href^="#article-"]');
    if (a) {
      e.preventDefault();
      onNavigate(a.getAttribute('href').replace('#article-', ''));
    }
  };

  return (
    <article
      className="article-body bg-paper rounded-2xl shadow-card border border-amber-100/80 px-5 py-6 md:px-10 md:py-9"
      onClick={handleClick}
    >
      {segments.map((seg, idx) => {
        if (seg.type === 'md') {
          return (
            <div
              key={idx}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(seg.text, slugByFile) }}
            />
          );
        }
        if (seg.type === 'visual') {
          const Visual = VISUALS[seg.name];
          if (!Visual) {
            return (
              <div
                key={idx}
                className="my-6 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-6 text-center shadow-card"
              >
                <div className="mb-1 text-2xl">🧩</div>
                <div className="font-semibold text-amber-900">Visualization coming soon</div>
                {seg.name && <div className="mt-0.5 font-mono text-sm text-amber-700">{seg.name}</div>}
              </div>
            );
          }
          return <Visual key={idx} />;
        }
        if (seg.type === 'playground') {
          return <JsPlayground key={idx} title={seg.title} code={seg.code} />;
        }
        if (seg.type === 'sql') {
          return <SqlPlayground key={idx} title={seg.title} code={seg.code} />;
        }
        return null;
      })}
    </article>
  );
}

// Small helper reused by search: render a markdown snippet to plain text.
export function mdToText(md) {
  const html = marked.parse(md || '');
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}
