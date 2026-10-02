import { useMemo } from 'react';
import { marked } from 'marked';
import { renderMarkdown } from '../lib/markdown';
import { TOPICS } from '../content/topics';

// Renders one notes article: markdown → styled HTML, with working copy
// buttons on code blocks and in-app navigation for internal .md links.
export default function ArticleRenderer({ topic, onNavigate }) {
  const slugByFile = useMemo(() => {
    const map = {};
    for (const t of TOPICS) map[t.file] = t.slug;
    return map;
  }, []);

  const html = useMemo(() => renderMarkdown(topic.markdown, slugByFile), [topic, slugByFile]);

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
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Small helper reused by search: render a markdown snippet to plain text.
export function mdToText(md) {
  const html = marked.parse(md || '');
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}
