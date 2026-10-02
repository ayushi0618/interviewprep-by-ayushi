// CodeEditor.jsx — the shared code editor used by the Problem page and
// the Code Playground.
//
// Thin wrapper around components/CodeMirrorEditor (CodeMirror 6),
// lazy-loaded so the editor library ships as its own chunk and pages
// that never open an editor don't pay for it. While the chunk loads, a
// plain styled textarea stands in at the exact same height so the
// layout never jumps.
//
// The wrapper owns the slim toolbar above the editor: filename label on
// the left, wrap + theme toggles on the right, and a Reset button only
// when the page passes onReset. Theme choice persists across pages in
// localStorage ('ip_editor_theme'; light LeetCode-like by default).

import { Suspense, lazy, useState } from 'react';

const CodeMirrorEditor = lazy(() => import('./CodeMirrorEditor'));

const THEME_KEY = 'ip_editor_theme';

function readStoredTheme() {
  try {
    return window.localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

const toggleBtn =
  'rounded-md px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-brand-100 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400';

export default function CodeEditor({
  value,
  onChange,
  onRunShortcut,
  ariaLabel,
  heightClass = 'h-[430px]',
  language = 'javascript',
  label,
  onReset,
}) {
  const [theme, setTheme] = useState(readStoredTheme);
  const [wrap, setWrap] = useState(true);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch {
        // Private-mode storage can throw — the toggle still works in-page.
      }
      return next;
    });
  };

  // Stand-in while the CodeMirror chunk downloads: same height, same
  // value, Tab + Ctrl/Cmd+Enter already work so nothing feels broken.
  const fallback = (
    <textarea
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault();
          onRunShortcut?.();
          return;
        }
        if (event.key === 'Tab') {
          event.preventDefault();
          const el = event.target;
          const text = value ?? '';
          const start = el.selectionStart;
          onChange?.(text.slice(0, start) + '  ' + text.slice(el.selectionEnd));
          requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = start + 2;
          });
        }
      }}
      spellCheck={false}
      aria-label={ariaLabel}
      className={`${heightClass} block w-full resize-none bg-white p-3 font-mono text-[13.5px] leading-[1.6] text-slate-800 outline-none`}
    />
  );

  return (
    <div>
      {/* Toolbar: filename left; wrap / theme / reset right */}
      <div className="flex items-center gap-1.5 border-b border-brand-100 bg-brand-50/70 px-3 py-1.5">
        {label ? (
          <span className="font-mono text-xs font-semibold text-brand-800">{label}</span>
        ) : (
          <span />
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWrap((w) => !w)}
            aria-pressed={wrap}
            title={wrap ? 'Turn line wrapping off' : 'Turn line wrapping on'}
            className={toggleBtn}
          >
            ↩ Wrap {wrap ? 'on' : 'off'}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={theme === 'dark'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className={toggleBtn}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          {onReset ? (
            <button type="button" onClick={onReset} className={toggleBtn}>
              ↺ Reset
            </button>
          ) : null}
        </div>
      </div>

      <Suspense fallback={fallback}>
        <CodeMirrorEditor
          value={value}
          onChange={onChange}
          language={language}
          theme={theme}
          wrap={wrap}
          onRunShortcut={onRunShortcut}
          ariaLabel={ariaLabel}
          heightClass={heightClass}
        />
      </Suspense>
    </div>
  );
}
