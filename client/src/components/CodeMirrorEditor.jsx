// CodeMirrorEditor.jsx — the real code editor (CodeMirror 6).
//
// Replaces the old plain-<textarea> editors: syntax colours, line
// numbers, bracket matching + auto-close, Tab = 2-space indent, undo
// history, and Ctrl/Cmd+Enter to run. Two themes: a light
// LeetCode-like theme by default, oneDark behind the 🌙 toggle.
//
// The view is built ONCE per mount (and destroyed on unmount, so React
// StrictMode double-mounting is safe). Language, theme and line-wrap
// live in Compartments, so the CodeEditor toolbar can swap them live
// without recreating the view and losing undo history / cursor state.
// External `value` changes (snippet loads, Reset) are written into the
// doc under a guard flag so they never echo back through onChange.

import { useEffect, useRef } from 'react';
import { EditorState, Compartment, Prec } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from '@codemirror/view';
import {
  history,
  historyKeymap,
  defaultKeymap,
  indentWithTab,
} from '@codemirror/commands';
import {
  indentOnInput,
  bracketMatching,
  syntaxHighlighting,
  HighlightStyle,
  indentUnit,
} from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { tags as t } from '@lezer/highlight';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { sql } from '@codemirror/lang-sql';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';
import { oneDark } from '@codemirror/theme-one-dark';

const MONO_FONT =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

// GitHub-light-ish token colours on the light theme.
const lightHighlightStyle = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.controlKeyword], color: '#cf222e' },
  { tag: [t.string, t.special(t.string), t.regexp], color: '#0a3069' },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName)],
    color: '#8250df',
  },
  { tag: [t.number, t.bool, t.null, t.atom], color: '#0550ae' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: '#6a737d', fontStyle: 'italic' },
  {
    tag: [t.typeName, t.className, t.namespace, t.definition(t.typeName)],
    color: '#953800',
  },
  { tag: [t.propertyName, t.attributeName], color: '#0550ae' },
  { tag: t.operator, color: '#d1242f' },
]);

// LeetCode-like light chrome: white surface, pale gutter, a whisper of
// the site lavender on the active line. Height 100% so the wrapper's
// heightClass drives sizing and the editor scrolls internally.
const lightTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#ffffff',
      color: '#1f2328',
      height: '100%',
      fontSize: '13.5px',
    },
    '.cm-scroller': { overflow: 'auto', fontFamily: MONO_FONT, lineHeight: '1.6' },
    '.cm-content': { fontFamily: MONO_FONT, lineHeight: '1.6', padding: '10px 0', caretColor: '#0969da' },
    '.cm-line': { padding: '0 12px 0 6px' },
    '.cm-gutters': {
      backgroundColor: '#f6f8fa',
      color: '#8c959f',
      borderRight: '1px solid #e5e7eb',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 14px', minWidth: '2.2em' },
    '.cm-activeLine': { backgroundColor: 'rgba(124, 107, 217, 0.06)' },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(124, 107, 217, 0.12)',
      color: '#5744a8',
    },
    '&.cm-focused': { outline: 'none' },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(124, 107, 217, 0.25)',
    },
    '.cm-selectionBackground': { backgroundColor: 'rgba(124, 107, 217, 0.18)' },
    '.cm-cursor': { borderLeftColor: '#0969da' },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(9, 105, 218, 0.18)',
      outline: '1px solid rgba(9, 105, 218, 0.35)',
    },
  },
  { dark: false },
);

// Shared font sizing for the dark theme (oneDark's own colours stay).
const darkFontTheme = EditorView.theme(
  {
    '&': { height: '100%', fontSize: '13.5px' },
    '.cm-scroller': { overflow: 'auto', fontFamily: MONO_FONT, lineHeight: '1.6' },
    '.cm-content': { fontFamily: MONO_FONT, lineHeight: '1.6' },
    '&.cm-focused': { outline: 'none' },
  },
  { dark: true },
);

function languageExtension(language) {
  switch (language) {
    case 'javascript':
      return javascript();
    case 'typescript':
      return javascript({ typescript: true });
    case 'python':
      return python();
    case 'java':
      return java();
    case 'cpp':
    case 'c':
      return cpp();
    case 'sql':
      return sql();
    case 'rust':
      return rust();
    case 'go':
      return go();
    default:
      return []; // 'plain' — line numbers only, no highlighting
  }
}

function themeExtension(theme) {
  return theme === 'dark'
    ? [oneDark, darkFontTheme]
    : [lightTheme, syntaxHighlighting(lightHighlightStyle)];
}

export default function CodeMirrorEditor({
  value,
  onChange,
  language = 'javascript',
  theme = 'light',
  wrap = true,
  onRunShortcut,
  ariaLabel,
  heightClass = 'h-[430px]',
}) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);

  // Compartments created once (lazy ref init — StrictMode-safe).
  const langCompRef = useRef(null);
  const themeCompRef = useRef(null);
  const wrapCompRef = useRef(null);
  if (langCompRef.current === null) {
    langCompRef.current = new Compartment();
    themeCompRef.current = new Compartment();
    wrapCompRef.current = new Compartment();
  }

  // Latest callbacks in refs so the view never needs rebuilding when a
  // parent re-renders with new closures.
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRunShortcut);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    onRunRef.current = onRunShortcut;
  }, [onRunShortcut]);

  // True while we are writing an external `value` into the doc — the
  // update listener skips those so snippet loads don't loop onChange.
  const externalRef = useRef(false);

  // Build the view once per mount; destroy on unmount.
  useEffect(() => {
    const langComp = langCompRef.current;
    const themeComp = themeCompRef.current;
    const wrapComp = wrapCompRef.current;

    const runKeymap = Prec.highest(
      keymap.of([
        {
          key: 'Mod-Enter',
          run: () => {
            onRunRef.current?.();
            return true;
          },
        },
      ]),
    );

    const state = EditorState.create({
      doc: value ?? '',
      extensions: [
        runKeymap,
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        indentOnInput(),
        indentUnit.of('  '),
        bracketMatching(),
        closeBrackets(),
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        langComp.of(languageExtension(language)),
        themeComp.of(themeExtension(theme)),
        wrapComp.of(wrap ? EditorView.lineWrapping : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !externalRef.current) {
            onChangeRef.current?.(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    if (ariaLabel) view.contentDOM.setAttribute('aria-label', ariaLabel);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Built once: initial language/theme/wrap/value are read here, and
    // later changes flow through the compartment/value effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap language without recreating the view.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: langCompRef.current.reconfigure(languageExtension(language)),
    });
  }, [language]);

  // Swap theme (light ↔ oneDark) live.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: themeCompRef.current.reconfigure(themeExtension(theme)) });
  }, [theme]);

  // Toggle line wrapping live.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: wrapCompRef.current.reconfigure(wrap ? EditorView.lineWrapping : []),
    });
  }, [wrap]);

  // Keep the accessible name current.
  useEffect(() => {
    const view = viewRef.current;
    if (view && ariaLabel) view.contentDOM.setAttribute('aria-label', ariaLabel);
  }, [ariaLabel]);

  // Sync external value changes (snippet loads, Reset, problem switch)
  // into the doc — guarded so they never fire onChange back.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const next = value ?? '';
    const current = view.state.doc.toString();
    if (current === next) return;
    externalRef.current = true;
    try {
      view.dispatch({ changes: { from: 0, to: current.length, insert: next } });
    } finally {
      externalRef.current = false;
    }
  }, [value]);

  return <div ref={hostRef} className={`${heightClass} overflow-hidden text-left`} />;
}
