import { useEffect, useMemo, useRef, useState } from 'react';
import { TOPICS, ALL_QUESTIONS } from '../content/topics';
import { VERDICT_STYLES } from '../lib/scoring';

const HISTORY_KEY = 'ip_practice_history';
const PER_QUESTION_SECONDS = 60;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
}

// Flash-card practice: question → think (timed) → reveal model answer →
// honestly rate yourself. Ratings feed the summary + localStorage history.
export default function PracticeMode({ initialTopic, onReadTopic }) {
  const [topicSel, setTopicSel] = useState(initialTopic || 'mixed');
  const [phase, setPhase] = useState('setup'); // setup | playing | done
  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ratings, setRatings] = useState({});
  const [left, setLeft] = useState(PER_QUESTION_SECONDS);
  const [history, setHistory] = useState(loadHistory);
  const timerRef = useRef(null);

  useEffect(() => { if (initialTopic) { setTopicSel(initialTopic); setPhase('setup'); } }, [initialTopic]);

  const pool = useMemo(() => {
    if (topicSel === 'mixed') return ALL_QUESTIONS;
    const t = TOPICS.find((x) => x.slug === topicSel);
    return (t?.questions || []).map((q) => ({ ...q, topic: t.slug, topicTitle: t.title }));
  }, [topicSel]);

  // Per-question countdown — pauses when the answer is revealed.
  useEffect(() => {
    if (phase !== 'playing' || revealed) return undefined;
    timerRef.current = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, revealed, idx]);

  const start = () => {
    setDeck(shuffle(pool));
    setIdx(0); setRatings({}); setRevealed(false); setLeft(PER_QUESTION_SECONDS);
    setPhase('playing');
  };

  const current = deck[idx];

  const rate = (verdict) => {
    const next = { ...ratings, [idx]: verdict };
    setRatings(next);
    if (idx + 1 >= deck.length) {
      const counts = deck.reduce((acc, _q, i) => {
        const v = next[i];
        if (v) acc[v] = (acc[v] || 0) + 1;
        return acc;
      }, {});
      const entry = {
        date: new Date().toISOString(), topic: topicSel, total: deck.length,
        knew: counts['Knew it'] || 0, shaky: counts.Shaky || 0, missed: counts.Missed || 0,
      };
      const hist = [entry, ...history].slice(0, 12);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
      setHistory(hist);
      setPhase('done');
    } else {
      setIdx(idx + 1); setRevealed(false); setLeft(PER_QUESTION_SECONDS);
    }
  };

  const summary = useMemo(() => {
    const counts = { 'Knew it': 0, Shaky: 0, Missed: 0 };
    Object.values(ratings).forEach((v) => { counts[v] += 1; });
    return counts;
  }, [ratings]);

  const weakTopics = useMemo(() => {
    const missByTopic = {};
    deck.forEach((q, i) => { if (ratings[i] !== 'Knew it') missByTopic[q.topic] = (missByTopic[q.topic] || 0) + 1; });
    return Object.entries(missByTopic).sort((a, b) => b[1] - a[1]);
  }, [deck, ratings]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {phase === 'setup' && (
        <div className="bg-white rounded-2xl shadow-card border border-brand-100 p-6 md:p-8">
          <h2 className="text-2xl font-extrabold text-brand-900">🎴 Practice mode</h2>
          <p className="text-slate-600 mt-2 leading-relaxed">
            Flash-card style: read the question, say your answer <strong>out loud</strong> before the timer runs out,
            then reveal the model answer and rate yourself honestly.
          </p>
          <label className="block mt-6 text-sm font-bold text-slate-700">Choose a deck</label>
          <select value={topicSel} onChange={(e) => setTopicSel(e.target.value)}
            className="mt-2 w-full rounded-xl border border-brand-200 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-brand-400">
            <option value="mixed">🎲 Mixed — all topics ({ALL_QUESTIONS.length} questions)</option>
            {TOPICS.filter((t) => t.questions.length).map((t) => (
              <option key={t.slug} value={t.slug}>{t.emoji} {t.title} ({t.questions.length})</option>
            ))}
          </select>
          <button onClick={start} disabled={!pool.length}
            className="mt-5 w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 rounded-xl shadow-card transition disabled:opacity-50">
            Start — {pool.length} questions, {PER_QUESTION_SECONDS}s each
          </button>

          {history.length > 0 && (
            <div className="mt-8">
              <h3 className="font-bold text-slate-800">Your recent sessions</h3>
              <ul className="mt-3 space-y-2">
                {history.slice(0, 5).map((h, i) => (
                  <li key={i} className="flex flex-wrap gap-2 items-center text-sm bg-[#fbfdfc] border border-brand-100 rounded-lg px-3 py-2">
                    <span className="font-semibold text-slate-700">{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span className="text-slate-500">{h.topic === 'mixed' ? 'Mixed deck' : TOPICS.find((t) => t.slug === h.topic)?.title || h.topic}</span>
                    <span className="ml-auto flex gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${VERDICT_STYLES['Knew it']}`}>Knew {h.knew}</span>
                      <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${VERDICT_STYLES.Shaky}`}>Shaky {h.shaky}</span>
                      <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${VERDICT_STYLES.Missed}`}>Missed {h.missed}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {phase === 'playing' && current && (
        <div className="bg-paper rounded-2xl shadow-card border border-amber-100 p-6 md:p-8">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-brand-700">{current.topicTitle}</span>
            <span className="text-slate-500 font-semibold">Question {idx + 1} / {deck.length}</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${left <= 10 ? 'bg-red-100 text-red-700' : 'bg-brand-50 text-brand-700'}`}>
              ⏱ {left}s
            </span>
          </div>
          <div className="h-2 bg-brand-50 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${((idx) / deck.length) * 100}%` }} />
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug mt-6">{current.question}</h3>
          <p className="text-slate-500 text-sm mt-2">Say your answer out loud — like the interviewer is sitting right there.</p>

          {revealed ? (
            <div className="mt-6">
              <div className="bg-brand-50 border border-brand-200 rounded-xl px-5 py-4">
                <p className="text-xs font-extrabold tracking-widest text-brand-600">MODEL ANSWER</p>
                <p className="mt-1.5 leading-relaxed text-slate-800">{current.answer}</p>
              </div>
              <p className="mt-5 text-sm font-bold text-slate-700">Honestly — how was yours?</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {['Knew it', 'Shaky', 'Missed'].map((v) => (
                  <button key={v} onClick={() => rate(v)} className={`border font-bold py-2.5 rounded-xl transition hover:scale-[1.02] ${VERDICT_STYLES[v]}`}>{v}</button>
                ))}
              </div>
            </div>
          ) : (
            <button onClick={() => setRevealed(true)} className="mt-6 w-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold py-3 rounded-xl shadow-card transition">
              Reveal model answer
            </button>
          )}
          <button onClick={() => setPhase('setup')} className="mt-4 text-sm font-semibold text-slate-400 hover:text-slate-600">End session early</button>
        </div>
      )}

      {phase === 'done' && (
        <div className="bg-white rounded-2xl shadow-card border border-brand-100 p-6 md:p-8">
          <h2 className="text-2xl font-extrabold text-brand-900">Session complete 🎉</h2>
          <div className="grid grid-cols-3 gap-3 mt-5">
            {Object.entries(summary).map(([v, n]) => (
              <div key={v} className={`rounded-xl border px-4 py-3 text-center ${VERDICT_STYLES[v]}`}>
                <p className="text-2xl font-extrabold">{n}</p>
                <p className="text-xs font-bold">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-slate-600">
            Score: <strong>{deck.length ? Math.round((summary['Knew it'] / deck.length) * 100) : 0}%</strong> solid out of {deck.length} questions.
          </p>
          {weakTopics.length > 0 && (
            <div className="mt-5">
              <p className="font-bold text-slate-800">Revise these next:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {weakTopics.map(([slug, n]) => {
                  const t = TOPICS.find((x) => x.slug === slug);
                  return (
                    <button key={slug} onClick={() => onReadTopic(slug)} className="bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-800 font-semibold text-sm px-3 py-1.5 rounded-lg">
                      {t?.emoji} {t?.title} ({n} to fix) →
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-7">
            <button onClick={start} className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl shadow-card">↻ New round</button>
            <button onClick={() => setPhase('setup')} className="flex-1 bg-white border border-brand-200 font-bold py-3 rounded-xl text-brand-800">Change deck</button>
          </div>
        </div>
      )}
    </div>
  );
}
