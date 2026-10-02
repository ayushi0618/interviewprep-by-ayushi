// CodeEditor.jsx — the reusable dark code editor used on the Problem page.
//
// Extracted from the Code Playground (pages/Playground.jsx) so both places
// share one editor feel: slate-900 surface, JetBrains Mono, a line-number
// gutter that scrolls in sync with the textarea, Tab = two spaces (instead
// of moving focus away), and Ctrl/Cmd+Enter as the "run it" shortcut.
// No editor library — a plain <textarea> is honestly enough for interview
// prep, and it keeps the bundle tiny.

import { useRef } from 'react';

export default function CodeEditor({
  value,
  onChange,
  onRunShortcut,
  ariaLabel,
  heightClass = 'h-[430px]',
}) {
  const gutterRef = useRef(null);
  const text = value ?? '';
  const lineCount = text.split('\n').length;

  const handleKeyDown = (event) => {
    // Ctrl+Enter (or Cmd+Enter on Mac) — run without reaching for the mouse.
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      onRunShortcut?.();
      return;
    }
    // Tab should indent, not jump to the next button.
    if (event.key === 'Tab') {
      event.preventDefault();
      const el = event.target;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = text.slice(0, start) + '  ' + text.slice(end);
      onChange(next);
      // Put the caret back right after the two spaces we just inserted.
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="flex bg-slate-900 font-mono text-[0.85rem] leading-[1.6]">
      {/* Line numbers — aria-hidden because the textarea already carries
          the label; this column is purely visual. Its scrollTop is kept
          in sync from the textarea's onScroll below. */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="select-none overflow-hidden py-4 pl-3 pr-2 text-right text-slate-500 border-r border-white/5"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={(event) => {
          if (gutterRef.current) gutterRef.current.scrollTop = event.target.scrollTop;
        }}
        spellCheck={false}
        wrap="off"
        aria-label={ariaLabel}
        className={`${heightClass} flex-1 resize-y bg-transparent p-4 pl-3 text-slate-100 outline-none`}
      />
    </div>
  );
}
