// Markdown → HTML for the notes articles.
// We use `marked` for the heavy lifting, with three pre/post transforms the
// notes format needs:
//  1. GitHub callouts  (> [!NOTE] ...)  → styled <div class="callout ...">
//  2. ```mermaid fences                 → "diagram card" (styled <pre>, no mermaid lib)
//  3. Internal .md links + task lists   → in-app navigation / paper checkboxes
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

const CALLOUT_META = {
  NOTE: { cls: 'note', label: '📝 Note' },
  TIP: { cls: 'tip', label: '💡 Tip' },
  IMPORTANT: { cls: 'important', label: '⭐ Important' },
  WARNING: { cls: 'warning', label: '⚠️ Warning' },
};

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Custom code renderer: dark blocks with a language label + copy button.
// ```mermaid becomes a tinted "diagram card" instead of a plain code block.
const renderer = {
  // marked v12 calls this as code(text, lang); newer marked passes a token
  // object — accept both shapes.
  code(token, infostring) {
    const isObj = typeof token === 'object' && token !== null;
    const text = isObj ? token.text || '' : String(token ?? '');
    const lang = isObj ? token.lang || '' : infostring || '';
    if (lang === 'mermaid') {
      return `<div class="diagram-card"><div class="diagram-title">📊 Diagram</div><pre>${escapeHtml(text)}</pre></div>`;
    }
    const label = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : '';
    return `<div class="codeblock">${label}<button class="copy-btn" type="button">Copy</button><pre><code>${escapeHtml(text)}</code></pre></div>`;
  },
};
marked.use({ renderer });

// Convert callout blockquotes BEFORE marked sees them, so the inner markdown
// of each callout is parsed as its own mini-document inside the styled div.
function transformCallouts(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING)\]\s*(.*)$/);
    if (!m) { out.push(lines[i]); i += 1; continue; }
    const meta = CALLOUT_META[m[1]];
    const body = [];
    if (m[2]) body.push(m[2]);
    i += 1;
    while (i < lines.length && /^>/.test(lines[i])) {
      body.push(lines[i].replace(/^>\s?/, ''));
      i += 1;
    }
    const inner = marked.parse(body.join('\n'));
    out.push(`<div class="callout ${meta.cls}"><div class="callout-title">${meta.label}</div>${inner}</div>`, '');
  }
  return out.join('\n');
}

// Paper-style task checkboxes + internal article links.
function transformInline(md, slugByFile) {
  return md
    .replace(/^(\s*)- \[ \] /gm, '$1- <span class="task-box" aria-hidden="true"></span> ')
    .replace(/^(\s*)- \[[xX]\] /gm, '$1- <span class="task-box done" aria-hidden="true">✓</span> ')
    .replace(/\]\((?:\.\/)?([\w-]+\.md)(#[^)]*)?\)/g, (full, file) => {
      const slug = slugByFile[file.replace('.md', '')];
      return slug ? `](#article-${slug})` : full;
    });
}

export function renderMarkdown(md, slugByFile = {}) {
  return marked.parse(transformInline(transformCallouts(md), slugByFile));
}

// ---------------------------------------------------------------------------
// splitSegments(md) — carve interactive blocks out of raw markdown BEFORE
// rendering. Articles can embed three special fences:
//   ```visual <name>          → { type:'visual', name }          (React visualizer)
//   ```playground <title...>  → { type:'playground', title, code } (runnable JS)
//   ```sql-playground <title> → { type:'sql', title, code }        (runnable SQL)
// Everything else — including ```js / ```mermaid fences — stays inside
// { type:'md', text } segments and is rendered later by renderMarkdown().
// CRLF input is normalised, and an unclosed fence just runs to EOF.
// ---------------------------------------------------------------------------
export function splitSegments(md) {
  const text = String(md ?? '').replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  const segments = [];
  let mdLines = [];

  const flushMd = () => {
    const joined = mdLines.join('\n');
    mdLines = [];
    if (joined.trim()) segments.push({ type: 'md', text: joined });
  };
  const openFence = (line) => {
    const m = line.match(/^\s{0,3}```(.*)$/);
    return m ? m[1].trim() : null;
  };
  const isCloseFence = (line) => /^\s{0,3}```\s*$/.test(line);

  let i = 0;
  while (i < lines.length) {
    const info = openFence(lines[i]);
    if (info === null) { mdLines.push(lines[i]); i += 1; continue; }

    const parts = info.split(/\s+/).filter(Boolean);
    const kind = (parts[0] || '').toLowerCase();
    const rest = parts.slice(1).join(' ');
    const special = kind === 'visual' || kind === 'playground' || kind === 'sql-playground';

    // Collect the fence body up to its closing ``` (or EOF if unclosed).
    const body = [];
    let j = i + 1;
    while (j < lines.length && !isCloseFence(lines[j])) { body.push(lines[j]); j += 1; }
    const closed = j < lines.length;

    if (special) {
      flushMd();
      if (kind === 'visual') segments.push({ type: 'visual', name: rest.split(/\s+/)[0] || '' });
      else if (kind === 'playground') segments.push({ type: 'playground', title: rest, code: body.join('\n') });
      else segments.push({ type: 'sql', title: rest, code: body.join('\n') });
    } else {
      // Ordinary code fence — keep the whole block verbatim in the markdown.
      mdLines.push(lines[i], ...body);
      if (closed) mdLines.push(lines[j]);
    }
    i = closed ? j + 1 : j;
  }
  flushMd();
  return segments;
}
