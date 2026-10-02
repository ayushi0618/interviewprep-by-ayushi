import { useEffect, useMemo, useRef, useState } from 'react';
import { TOPICS } from '../content/topics';
import { speak, stopSpeaking, hasRecognition, createRecognizer } from '../lib/speech';
import { scoreInterviewAnswer, BAND_STYLES } from '../lib/scoring';

const SESSION_KEY = 'ip_live_sessions';
const ROUNDS = [
  { key: 'intro', label: 'Intro' },
  { key: 'project', label: 'Your Project' },
  { key: 'technical', label: 'Technical' },
  { key: 'dsa', label: 'DSA Approach' },
  { key: 'closing', label: 'Your Questions' },
];

// --- Mirror of the scripted engine in server.js -----------------------------
// Used only if the /api/interview call itself fails (e.g. opening the built
// site without the Express server), so the room always works, key or not.
const TECH_TERMS = [
  'authentication', 'typescript', 'javascript', 'websocket', 'websockets',
  'mongodb', 'mongo', 'tailwind', 'deployment', 'database', 'express',
  'react', 'node', 'redis', 'docker', 'testing', 'graphql', 'supabase',
  'firebase', 'next.js', 'nextjs', 'hooks', 'hook', 'state', 'deploy',
  'cache', 'vite', 'html', 'css', 'python', 'sql', 'api', 'jwt', 'auth',
  'git', 'aws', 'db',
];
const PROJECT_ITEM = {
  question: "Pick one project you're proud of and walk me through it.",
  answer:
    'A strong project pitch covers: the problem and who it was for, your tech stack and why you chose it, what you personally built, the hardest challenge and how you solved it, and the result or what you learned. Structure: problem → stack → built → challenge → result.',
  keywords: ['problem', 'users', 'stack', 'built', 'challenge', 'learned', 'result', 'api', 'database'],
};
const INTRO_TEXT =
  "Hi, I'm Ananya, a Senior Software Engineer — I'll be taking your interview today. Let's ease in first: tell me about yourself — your background, your stack, and what you're preparing for.";
const PROJECT_QUESTION =
  "Pick one project you're proud of and walk me through it — what it does, your stack, and your role in it.";
const CLOSING_QUESTION = "That's everything from my side. Do you have any questions for me?";
const TECH_RAMPS = [
  "Let's start basic. ",
  'Good — a step up now. ',
  'A bit deeper now. ',
  "Last technical one — let's go a little deeper. ",
];

function analyse(answer, item) {
  const text = (answer || '').trim();
  const words = text ? text.split(/\s+/).length : 0;
  const lower = ` ${text.toLowerCase()} `;
  const keywords = item?.keywords || [];
  const hit = keywords.filter((k) => lower.includes(k.toLowerCase()));
  const missed = keywords.filter((k) => !hit.includes(k));
  return { words, hit, missed, coverage: keywords.length ? hit.length / keywords.length : 0 };
}

function findTechTerm(answer) {
  const lower = ` ${(answer || '').toLowerCase()} `;
  let best = null;
  let bestAt = Infinity;
  for (const t of TECH_TERMS) {
    const at = lower.indexOf(t);
    if (at >= 0 && (at < bestAt || (at === bestAt && t.length > best.length))) { best = t; bestAt = at; }
  }
  return best;
}

function pickTechPicked(items) {
  const n = items.length;
  if (!n) return [];
  const picked = [...new Set([0, Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1])];
  for (let i = 0; picked.length < Math.min(4, n) && i < n; i += 1) {
    if (!picked.includes(i)) picked.push(i);
  }
  return picked.slice(0, 4);
}

function pickDsaIdx(items) {
  const i = (items || []).findIndex((q) => /cycle|two sum|sliding window|binary search/i.test(q.question || ''));
  return i >= 0 ? i : 0;
}

function answerFeedback(answer, item, { skipped = false } = {}) {
  if (skipped) return "No worries at all — we'll skip that one and keep moving.";
  if (!item) return 'Thanks for sharing that.';
  const { words, hit, missed } = analyse(answer, item);
  if (words < 10) return 'Thanks — that was quite brief. In a real interview, adding the *why* behind an answer is what earns the marks.';
  if (missed.length === 0 && hit.length) return `Lovely — you covered ${hit.slice(0, 3).join(', ')}, which is really the heart of it.`;
  if (hit.length) return `Good — you covered ${hit.slice(0, 3).join(', ')} well. The piece worth adding there is ${missed.slice(0, 2).join(' and ')}.`;
  return `Fair start. The piece usually missing there is ${missed.slice(0, 2).join(' and ')} — worth a quick revise after this round.`;
}

function topicItems(slug) {
  return TOPICS.find((t) => t.slug === slug)?.questions || [];
}

function strongestFromHistory(history, topic) {
  const pools = [...topicItems(topic), ...topicItems('dsa'), PROJECT_ITEM];
  let best = null;
  (history || []).forEach((h, i) => {
    if (h.from !== 'interviewer') return;
    const item = pools.find((q) => h.text && h.text.includes(q.question.replace(/[.?]+$/, '')));
    if (!item) return;
    const ans = (history || []).slice(i + 1).find((x) => x.from === 'candidate' && !x.skipped);
    if (!ans) return;
    const a = analyse(ans.text, item);
    if (!best || a.coverage > best.coverage) best = { ...a, answer: ans.text, item };
  });
  if (!best || !best.hit.length) {
    const term = (history || []).filter((h) => h.from === 'candidate').map((h) => findTechTerm(h.text)).find(Boolean);
    return term ? `the way you talked through ${term}` : 'the clear way you structured your answers';
  }
  return `how you explained ${best.hit[0]}`;
}

function localNext(payload) {
  const state = {
    topic: payload.topic || 'javascript',
    round: payload.round || 'start',
    techIdx: Number(payload.techIdx || 0),
    techPicked: Array.isArray(payload.techPicked) ? payload.techPicked : [],
    followUpUsed: !!payload.followUpUsed,
    hintUsed: !!payload.hintUsed,
    dsaIdx: Number(payload.dsaIdx || 0),
    projectProbed: !!payload.projectProbed,
  };
  const { lastAnswer = '', skipped = false, history = [] } = payload;
  const items = topicItems(state.topic);
  const blank = (round) => ({ round, techIdx: 0, techPicked: [], followUpUsed: false, hintUsed: false, dsaIdx: 0, projectProbed: false });

  const toClosing = (feedback) => ({
    type: 'question', round: 'closing', feedback, aiUsed: false, text: CLOSING_QUESTION, scoreRef: null,
    nextState: { ...blank('closing'), techPicked: state.techPicked, techIdx: state.techIdx, dsaIdx: state.dsaIdx, projectProbed: true },
  });
  const toDsa = (feedback) => {
    const dsaItems = topicItems('dsa');
    const dsaIdx = pickDsaIdx(dsaItems);
    const item = dsaItems[dsaIdx];
    if (!item) return toClosing(feedback);
    return {
      type: 'question', round: 'dsa', feedback, aiUsed: false,
      text: `Now a quick DSA one — talk me through your approach, don't code, just the idea. ${item.question}`,
      scoreRef: item,
      nextState: { ...blank('dsa'), techPicked: state.techPicked, techIdx: state.techIdx, dsaIdx },
    };
  };
  const advanceTechnical = (feedback) => {
    const nextIdx = state.techIdx + 1;
    if (nextIdx >= state.techPicked.length) return toDsa(feedback);
    const item = items[state.techPicked[nextIdx]];
    if (!item) return toDsa(feedback);
    return {
      type: 'question', round: 'technical', feedback, aiUsed: false,
      text: `${TECH_RAMPS[Math.min(nextIdx, TECH_RAMPS.length - 1)]}${item.question}`, scoreRef: item,
      nextState: { ...state, round: 'technical', techIdx: nextIdx, followUpUsed: false, hintUsed: false },
    };
  };
  const toTechnical = (feedback) => {
    const techPicked = pickTechPicked(items);
    const item = items[techPicked[0]];
    if (!item) return toDsa(feedback);
    return {
      type: 'question', round: 'technical', feedback, aiUsed: false,
      text: `Lovely. Let's move to the technical round. ${TECH_RAMPS[0]}${item.question}`, scoreRef: item,
      nextState: { ...blank('technical'), techPicked, dsaIdx: state.dsaIdx },
    };
  };

  if (state.round === 'start') {
    return { type: 'question', round: 'intro', text: INTRO_TEXT, scoreRef: null, aiUsed: false, nextState: blank('intro') };
  }
  if (state.round === 'intro') {
    return {
      type: 'question', round: 'project', aiUsed: false,
      feedback: "Great, thanks — lovely to meet you. Let's talk about your work.",
      text: PROJECT_QUESTION, scoreRef: PROJECT_ITEM,
      nextState: { ...blank('project'), dsaIdx: state.dsaIdx },
    };
  }
  if (state.round === 'project') {
    if (!state.projectProbed) {
      if (skipped) return toTechnical(answerFeedback('', PROJECT_ITEM, { skipped: true }));
      const term = findTechTerm(lastAnswer);
      return {
        type: 'followup', round: 'project', aiUsed: false,
        feedback: answerFeedback(lastAnswer, PROJECT_ITEM),
        text: term
          ? `You mentioned ${term} — what was the trickiest part of using it there?`
          : 'What was the trickiest part of building it — and how did you get past it?',
        scoreRef: null, nextState: { ...state, projectProbed: true },
      };
    }
    return toTechnical(skipped ? answerFeedback('', PROJECT_ITEM, { skipped: true }) : 'Thanks — that gives me a good picture of the project.');
  }
  if (state.round === 'technical') {
    const item = items[state.techPicked[state.techIdx]];
    if (!item) return toDsa(null);
    if (skipped) return advanceTechnical(answerFeedback('', item, { skipped: true }));
    const a = analyse(lastAnswer, item);
    if (!state.hintUsed && a.words < 10) {
      return {
        type: 'hint', round: 'technical', aiUsed: false,
        feedback: "No rush — take a second and think it through. Here's a small nudge:",
        text: `Hint: think about how ${a.missed[0] || item.keywords[0] || 'the core idea'} fits in.`,
        scoreRef: null, nextState: { ...state, hintUsed: true },
      };
    }
    if (!state.followUpUsed) {
      if (a.missed.length >= 1) {
        return {
          type: 'followup', round: 'technical', aiUsed: false, scoreRef: null,
          feedback: answerFeedback(lastAnswer, item),
          text: a.hit.length
            ? `You covered ${a.hit[0]} well. You didn't mention ${a.missed[0]} — where does that fit?`
            : `Let's dig a little there — where does ${a.missed[0]} fit in?`,
          nextState: { ...state, followUpUsed: true },
        };
      }
      const term = findTechTerm(lastAnswer);
      if (term) {
        return {
          type: 'followup', round: 'technical', aiUsed: false, scoreRef: null,
          feedback: answerFeedback(lastAnswer, item),
          text: `You mentioned ${term} — can you expand on that a bit?`,
          nextState: { ...state, followUpUsed: true },
        };
      }
    }
    return advanceTechnical(answerFeedback(lastAnswer, item));
  }
  if (state.round === 'dsa') {
    const item = topicItems('dsa')[state.dsaIdx];
    if (skipped) return toClosing(answerFeedback('', item, { skipped: true }));
    if (!state.followUpUsed && !/o\(/i.test(lastAnswer || '')) {
      return {
        type: 'followup', round: 'dsa', aiUsed: false, scoreRef: null,
        feedback: 'Good approach. One more thing —',
        text: "And what's the time and space complexity?",
        nextState: { ...state, followUpUsed: true },
      };
    }
    return toClosing(state.followUpUsed ? 'Perfect, thanks for adding that.' : answerFeedback(lastAnswer, item));
  }
  if (state.round === 'closing') {
    const strength = strongestFromHistory(history, state.topic);
    return {
      type: 'closing', round: 'done', done: true, scoreRef: null, aiUsed: false,
      text: `That's everything from my side — thank you for your time! One thing that really stood out was ${strength}. Your scorecard below breaks down every answer, so do revise the shaky ones and run this again. All the best!`,
      nextState: blank('done'),
    };
  }
  return { type: 'closing', round: 'done', done: true, text: 'Thank you — your scorecard is ready.', scoreRef: null, aiUsed: false, nextState: blank('done') };
}

async function askBrain(payload) {
  try {
    const res = await fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('bad status');
    return await res.json();
  } catch {
    return localNext(payload);
  }
}

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || []; } catch { return []; }
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function LiveInterview({ initialTopic, onReadTopic }) {
  const [phase, setPhase] = useState('setup'); // setup | live | done
  const [topicSel, setTopicSel] = useState(initialTopic || 'javascript');
  const [useCamera, setUseCamera] = useState(true);
  const [useMic, setUseMic] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [mediaMode, setMediaMode] = useState('av'); // av | audio | text
  const [mediaNote, setMediaNote] = useState('');
  const [entries, setEntries] = useState([]); // {from, text, scoreRef?, kind?, round?, skipped?}
  const [answer, setAnswer] = useState('');
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [qElapsed, setQElapsed] = useState(0);
  const [round, setRound] = useState('intro');
  const [aiUsed, setAiUsed] = useState(false);
  const [pastSessions] = useState(loadSessions);

  const stateRef = useRef({ round: 'start', techIdx: 0, techPicked: [], followUpUsed: false, hintUsed: false, dsaIdx: 0, projectProbed: false });
  const streamRef = useRef(null);
  const recRef = useRef(null);
  const videoRef = useRef(null);
  const bottomRef = useRef(null);
  const startedAtRef = useRef(null);
  const qStartRef = useRef(null);

  const sttAvailable = useMemo(() => hasRecognition(), []);
  const topic = TOPICS.find((t) => t.slug === topicSel);
  const answerWords = useMemo(() => (answer.trim() ? answer.trim().split(/\s+/).length : 0), [answer]);
  const roundIdx = Math.max(0, ROUNDS.findIndex((r) => r.key === round));

  useEffect(() => { if (initialTopic) setTopicSel(initialTopic); }, [initialTopic]);

  // Total + per-question timers while live
  useEffect(() => {
    if (phase !== 'live') return undefined;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      if (qStartRef.current) setQElapsed(Math.floor((Date.now() - qStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Keep the transcript scrolled to the latest message
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [entries, thinking]);

  useEffect(() => () => { stopSpeaking(); streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  const attachStream = () => {
    if (videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  };

  function applyResponse(res, baseEntries) {
    stateRef.current = res.nextState;
    if (res.aiUsed) setAiUsed(true);
    setRound(res.round || res.nextState?.round || 'intro');
    const additions = [];
    if (res.feedback) additions.push({ from: 'feedback', text: res.feedback });
    additions.push({ from: 'interviewer', text: res.text, scoreRef: res.scoreRef || null, kind: res.type, round: res.round });
    const all = [...baseEntries, ...additions];
    setEntries(all);
    if (res.type === 'question') { qStartRef.current = Date.now(); setQElapsed(0); }
    if (voiceOn && res.text) speak(res.text);
    if (res.done) finish(all);
  }

  async function start() {
    stopSpeaking();
    setEntries([]); setAnswer(''); setElapsed(0); setQElapsed(0); setAiUsed(false);
    stateRef.current = { round: 'start', techIdx: 0, techPicked: [], followUpUsed: false, hintUsed: false, dsaIdx: 0, projectProbed: false };
    let mode = 'text';
    if (useCamera || useMic) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: useCamera, audio: useMic });
        streamRef.current = stream;
        mode = useCamera ? 'av' : 'audio';
      } catch {
        setMediaNote('Camera/mic permission was not granted — no problem, continuing in text + voice-answer mode. Nothing is recorded or uploaded either way.');
        mode = 'text';
      }
    }
    setMediaMode(mode);
    startedAtRef.current = Date.now();
    qStartRef.current = Date.now();
    setPhase('live');
    setThinking(true);
    const res = await askBrain({ topic: topicSel, ...stateRef.current, lastAnswer: '', history: [] });
    setThinking(false);
    applyResponse(res, []);
    setTimeout(attachStream, 60);
  }

  function toggleListening() {
    if (listening) {
      recRef.current?.rec.stop();
      setListening(false);
      return;
    }
    const r = createRecognizer({ onInterim: (text) => setAnswer(text) });
    if (!r) return;
    recRef.current = r;
    r.rec.onend = () => setListening(false);
    r.rec.onerror = () => setListening(false);
    try { r.rec.start(); setListening(true); } catch { /* already running */ }
  }

  async function submitAnswer({ skipped = false } = {}) {
    const text = skipped ? '' : answer.trim();
    if (thinking || (!skipped && !text)) return;
    if (listening) toggleListening();
    stopSpeaking();
    const candidateEntry = { from: 'candidate', text: skipped ? '⏭ Skipped this one' : text, skipped };
    const newEntries = [...entries, candidateEntry];
    setEntries(newEntries);
    setAnswer('');
    setThinking(true);
    const res = await askBrain({
      topic: topicSel,
      ...stateRef.current,
      lastAnswer: text,
      skipped,
      history: newEntries.map((e) => ({ from: e.from, text: e.text, skipped: !!e.skipped })),
    });
    setThinking(false);
    applyResponse(res, newEntries);
  }

  // Build the report: intro is an unscored warm-up (word count only); every
  // scored question is graded on all the candidate's words for that question
  // (main answer + follow-up/hint retries), so extra depth counts.
  function grade(transcript) {
    const rows = [];
    transcript.forEach((e, i) => {
      if (e.from === 'interviewer' && e.round === 'intro') {
        const ans = transcript.slice(i + 1).find((x) => x.from === 'candidate');
        if (ans) rows.push({ kind: 'warmup', question: 'Tell me about yourself', transcript: ans.skipped ? '' : ans.text, words: ans.skipped ? 0 : (ans.text.trim() ? ans.text.trim().split(/\s+/).length : 0), skipped: !!ans.skipped });
      }
      if (e.from === 'interviewer' && e.scoreRef) {
        const block = [];
        let hintUsed = false;
        for (let j = i + 1; j < transcript.length; j += 1) {
          const x = transcript[j];
          if (x.from === 'interviewer' && (x.scoreRef || x.round === 'closing' || x.round === 'done')) break;
          if (x.from === 'interviewer' && x.kind === 'hint') hintUsed = true;
          if (x.from === 'candidate') block.push(x);
        }
        const answered = block.filter((c) => !c.skipped);
        const scoreText = answered.map((c) => c.text).join(' ');
        rows.push({
          kind: 'scored',
          round: e.round,
          revTopic: e.round === 'dsa' ? 'dsa' : e.round === 'project' ? 'projects-hr' : topicSel,
          question: e.scoreRef.question,
          modelAnswer: e.scoreRef.answer,
          transcript: scoreText,
          ...scoreInterviewAnswer(scoreText, e.scoreRef, { skipped: block.length > 0 && answered.length === 0, hintUsed }),
        });
      }
    });
    return rows;
  }

  function finish(transcript) {
    stopSpeaking();
    const rows = grade(transcript);
    const scored = rows.filter((r) => r.kind === 'scored');
    const avg = scored.length ? Math.round(scored.reduce((s, r) => s + r.score, 0) / scored.length) : 0;
    const band = avg >= 65 ? 'Strong' : avg >= 38 ? 'Good' : 'Needs work';
    const session = {
      date: new Date().toISOString(), topic: topicSel, score: avg, band,
      rows: scored.map((r) => ({ question: r.question, band: r.band })),
    };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify([session, ...loadSessions()].slice(0, 10)));
    } catch { /* storage full/blocked — results still show on screen */ }
    setPhase('done');
  }

  const endEarly = () => finish(entries);
  const rows = phase === 'done' ? grade(entries) : [];
  const scoredRows = rows.filter((r) => r.kind === 'scored');
  const scorePct = scoredRows.length ? Math.round(scoredRows.reduce((s, r) => s + r.score, 0) / scoredRows.length) : 0;
  const overallBand = scorePct >= 65 ? 'Strong' : scorePct >= 38 ? 'Good' : 'Needs work';
  const mmss = fmt(elapsed);
  const qMmss = fmt(qElapsed);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {phase === 'setup' && (
        <div className="bg-white rounded-2xl shadow-card border border-brand-100 p-6 md:p-8">
          <h2 className="text-2xl font-extrabold text-brand-900">🎥 Live AI Interview room</h2>
          <p className="text-slate-600 mt-2 leading-relaxed">
            Meet <strong>👩‍💻 Ananya, Senior Software Engineer</strong> — your interviewer. She <strong>speaks each
            question aloud</strong>, you answer by voice or typing, she probes your answers like a real interviewer,
            and you get a scored report at the end. Works fully with no API key.
          </p>
          <div className="callout note mt-5">
            <div className="callout-title">🔒 Your privacy</div>
            <p>Your camera and mic are used only to show you a live preview and hear your answers.
              <strong> Nothing is recorded, uploaded, or stored</strong> — the preview never leaves your browser,
              and interview sessions save only a text summary on this device.</p>
          </div>

          <label className="block mt-6 text-sm font-bold text-slate-700">Interview topic (technical round)</label>
          <select value={topicSel} onChange={(e) => setTopicSel(e.target.value)}
            className="mt-2 w-full rounded-xl border border-brand-200 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-brand-400">
            {TOPICS.filter((t) => t.questions.length >= 5).map((t) => (
              <option key={t.slug} value={t.slug}>{t.emoji} {t.title} ({t.questions.length} questions)</option>
            ))}
          </select>

          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            <label className="flex items-center gap-2.5 bg-[#fbfdfc] border border-brand-100 rounded-xl px-4 py-3 cursor-pointer">
              <input type="checkbox" checked={useCamera} onChange={(e) => setUseCamera(e.target.checked)} className="w-4 h-4 accent-brand-600" />
              <span className="text-sm font-semibold">📷 Camera preview</span>
            </label>
            <label className="flex items-center gap-2.5 bg-[#fbfdfc] border border-brand-100 rounded-xl px-4 py-3 cursor-pointer">
              <input type="checkbox" checked={useMic} onChange={(e) => setUseMic(e.target.checked)} className="w-4 h-4 accent-brand-600" />
              <span className="text-sm font-semibold">🎙️ Microphone</span>
            </label>
            <label className="flex items-center gap-2.5 bg-[#fbfdfc] border border-brand-100 rounded-xl px-4 py-3 cursor-pointer">
              <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} className="w-4 h-4 accent-brand-600" />
              <span className="text-sm font-semibold">🔊 Interviewer voice</span>
            </label>
          </div>
          {!sttAvailable && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4">
              This browser doesn’t support voice answers (SpeechRecognition) — Chrome or Edge work best.
              You can still type every answer; the interview runs exactly the same.
            </p>
          )}
          {mediaNote && <p className="text-sm text-slate-600 mt-3">{mediaNote}</p>}

          <button onClick={start} className="mt-6 w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 rounded-xl shadow-card transition">
            Start interview — {topic?.title}
          </button>
          <p className="text-xs text-slate-400 mt-3 text-center">
            Flow: intro → your project → 4 technical questions → 1 DSA approach → your questions → scored report.
          </p>

          {pastSessions.length > 0 && (
            <div className="mt-7">
              <h3 className="font-bold text-slate-800">Past live sessions</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {pastSessions.slice(0, 4).map((s, i) => (
                  <li key={i} className="flex justify-between items-center bg-[#fbfdfc] border border-brand-100 rounded-lg px-3 py-2">
                    <span>{TOPICS.find((t) => t.slug === s.topic)?.title || s.topic} · {new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span className="flex items-center gap-2">
                      {s.band && <span className={`px-2 py-0.5 rounded-md border text-xs font-extrabold ${BAND_STYLES[s.band] || ''}`}>{s.band}</span>}
                      <strong className="text-brand-700">{s.score}%</strong>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {phase === 'live' && (
        <div className="grid lg:grid-cols-[300px_1fr] gap-4 items-start">
          {/* Self view + status */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-card lg:sticky lg:top-24">
            {mediaMode === 'av' ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-[4/3] object-cover bg-slate-800" />
            ) : (
              <div className="w-full aspect-[4/3] grid place-items-center text-slate-300 text-sm px-4 text-center">
                {mediaMode === 'audio' ? '🎙️ Audio-only mode — mic is live, no camera preview.' : '⌨️ Text mode — type your answers below.'}
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 text-white">
              <span className="font-mono font-bold">⏱ {mmss}</span>
              <span className="text-xs bg-white/15 px-2 py-1 rounded-md font-semibold">{aiUsed ? '🤖 Gemini' : '🎚️ Scripted'}</span>
            </div>
            {mediaMode === 'av' && <p className="px-4 pb-3 text-[0.7rem] text-slate-400 -mt-1">Preview only — nothing is recorded or uploaded.</p>}
          </div>

          {/* Conversation */}
          <div className="bg-white rounded-2xl shadow-card border border-brand-100 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-brand-100">
              <div className="flex items-center justify-between gap-2">
                <p className="font-extrabold text-brand-900">👩‍💻 Ananya · Senior Software Engineer</p>
                <span className="text-xs bg-brand-50 border border-brand-100 px-2 py-1 rounded-md font-semibold text-brand-700">{aiUsed ? '🤖 Gemini' : '🎚️ Scripted'} · {topic?.title}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-2">
                <p className="text-xs font-bold text-slate-500">Round {roundIdx + 1} of 5 · {ROUNDS[roundIdx]?.label}</p>
                <button onClick={endEarly} className="text-sm font-bold text-red-600 hover:text-red-500">End interview</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ROUNDS.map((r, i) => (
                  <span key={r.key} className={`px-2 py-0.5 rounded-full border text-[0.7rem] font-bold ${
                    i < roundIdx ? 'bg-brand-600 text-white border-brand-600'
                    : i === roundIdx ? 'bg-brand-50 text-brand-800 border-brand-400'
                    : 'bg-white text-slate-400 border-slate-200'}`}>
                    {i < roundIdx ? '✓ ' : ''}{r.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="px-5 py-4 space-y-3 overflow-y-auto nice-scroll max-h-[46vh]">
              {entries.map((e, i) => (
                <div key={i} className={`flex ${e.from === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed shadow-sm ${
                    e.from === 'candidate' ? 'bg-brand-600 text-white rounded-br-md'
                    : e.from === 'feedback' ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-md'
                    : 'bg-[#f2f7f4] border border-brand-100 text-slate-800 rounded-bl-md'}`}>
                    <p className={`text-[0.65rem] font-extrabold tracking-widest mb-1 ${e.from === 'candidate' ? 'text-brand-100' : 'text-brand-500'}`}>
                      {e.from === 'candidate' ? 'YOU' : e.from === 'feedback' ? '👩‍💻 ANANYA · FEEDBACK' : '👩‍💻 ANANYA'}
                    </p>
                    {e.text}
                  </div>
                </div>
              ))}
              {thinking && <p className="text-sm text-slate-400 italic">Ananya is thinking…</p>}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-brand-100 p-4 bg-[#fbfdfc]">
              <p className="text-xs font-semibold text-slate-400 mb-2">⏱ {qMmss} on this question</p>
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3}
                placeholder={sttAvailable ? 'Speak with the mic button, or type your answer here…' : 'Type your answer here…'}
                className="w-full rounded-xl border border-brand-200 px-4 py-3 text-[0.95rem] outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
              {answerWords > 0 && answerWords < 10 && (
                <p className="text-xs text-amber-700 mt-1.5">Short answers score low in real interviews — add the <em>why</em>.</p>
              )}
              <div className="flex gap-2 mt-3">
                {sttAvailable && (
                  <button onClick={toggleListening}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm shadow-card transition ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-white border border-brand-200 text-brand-800'}`}>
                    {listening ? '⏹ Stop mic' : '🎙️ Answer by voice'}
                  </button>
                )}
                <button onClick={() => submitAnswer()} disabled={!answer.trim() || thinking}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow-card transition">
                  Submit answer →
                </button>
                <button onClick={() => submitAnswer({ skipped: true })} disabled={thinking}
                  className="px-4 py-2.5 rounded-xl bg-white border border-brand-200 text-sm font-bold text-slate-600 disabled:opacity-50">
                  Skip ⏭
                </button>
                <button onClick={() => setVoiceOn((v) => { if (v) stopSpeaking(); return !v; })}
                  className="px-3 py-2.5 rounded-xl bg-white border border-brand-200 text-sm" title="Toggle interviewer voice">
                  {voiceOn ? '🔊' : '🔇'}
                </button>
              </div>
              {listening && <p className="text-xs text-red-500 font-semibold mt-2">Listening… speak now, your words appear above.</p>}
            </div>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="bg-white rounded-2xl shadow-card border border-brand-100 p-6 md:p-8">
          <h2 className="text-2xl font-extrabold text-brand-900">Interview report 📋</h2>
          <p className="text-sm text-slate-500 mt-1">with 👩‍💻 Ananya · Senior Software Engineer · {aiUsed ? '🤖 Gemini' : '🎚️ Scripted'} mode</p>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="bg-brand-700 text-white rounded-2xl px-6 py-4">
              <p className="text-3xl font-extrabold">{scorePct}%</p>
              <p className="text-brand-100 text-xs font-bold">overall score</p>
            </div>
            <span className={`px-3 py-1.5 rounded-lg border text-sm font-extrabold ${BAND_STYLES[overallBand]}`}>{overallBand}</span>
            <p className="text-slate-600 text-sm max-w-md leading-relaxed">
              {overallBand === 'Strong' ? 'Strong round — keep this level and polish the shaky ones.'
                : overallBand === 'Good' ? 'A workable base. The report below shows exactly what to revise.'
                : 'Every expert started here — revise the topics below and run it again tomorrow.'}
            </p>
          </div>

          <div className="space-y-3 mt-6">
            {rows.map((r, i) => (
              r.kind === 'warmup' ? (
                <div key={i} className="border border-brand-100 rounded-xl overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-[#fbfdfc]">
                    <span className="font-bold text-slate-800 text-sm flex-1">Warm-up. {r.question}</span>
                    <span className="px-2.5 py-1 rounded-lg border text-xs font-extrabold bg-slate-100 text-slate-600 border-slate-200">unscored · {r.words} words</span>
                  </div>
                  <div className="px-4 py-3 text-sm">
                    <p className="text-slate-600"><strong className="text-slate-800">You said:</strong> {r.transcript || <em>(skipped)</em>}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="border border-brand-100 rounded-xl overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-[#fbfdfc]">
                    <span className="font-bold text-slate-800 text-sm flex-1">{r.question}</span>
                    <span className={`px-2.5 py-1 rounded-lg border text-xs font-extrabold ${BAND_STYLES[r.band]}`}>{r.band} · {r.score}%</span>
                  </div>
                  <div className="px-4 py-3 text-sm space-y-2">
                    <p className="text-slate-600"><strong className="text-slate-800">You said:</strong> {r.transcript || <em>{r.skipped ? '(skipped)' : '(no answer)'}</em>}</p>
                    {r.skipped && <p className="text-slate-500">⏭ You skipped this one.</p>}
                    {r.hintUsed && <p className="text-slate-500">💡 Hint used on this one — totally fine, just note it for revision.</p>}
                    {r.hitKeywords.length > 0 && (
                      <p className="text-slate-600"><strong className="text-slate-800">You said well:</strong> {r.hitKeywords.slice(0, 6).map((k) => <code key={k} className="bg-brand-100 text-brand-900 px-1.5 py-0.5 rounded mx-0.5 font-mono text-[0.8em]">{k}</code>)}</p>
                    )}
                    {r.missedKeywords.length > 0 && (
                      <p className="text-slate-500"><strong className="text-slate-700">Add next time:</strong> {r.missedKeywords.slice(0, 6).map((k) => <code key={k} className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded mx-0.5 font-mono text-[0.8em]">{k}</code>)}</p>
                    )}
                    <details>
                      <summary className="cursor-pointer font-semibold text-brand-700 text-[0.85rem]">Model answer</summary>
                      <p className="mt-1.5 text-slate-700 leading-relaxed">{r.modelAnswer}</p>
                    </details>
                    <button onClick={() => onReadTopic(r.revTopic)} className="text-sm font-bold text-brand-700 hover:text-brand-500">
                      {r.round === 'dsa' ? '📖 Revise DSA notes →' : r.round === 'project' ? '📖 Project pitch + HR tips →' : `📖 Revise ${topic?.title} notes →`}
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-7">
            <button onClick={() => onReadTopic(topicSel)} className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-5 py-3 rounded-xl shadow-card">
              📖 Revise {topic?.title} notes
            </button>
            <button onClick={() => setPhase('setup')} className="bg-white border border-brand-200 font-bold px-5 py-3 rounded-xl text-brand-800">
              ↻ New interview
            </button>
          </div>

          <details className="mt-6">
            <summary className="cursor-pointer font-semibold text-slate-600 text-sm">Full transcript</summary>
            <div className="mt-3 space-y-2 text-sm">
              {entries.filter((e) => e.from !== 'feedback').map((e, i) => (
                <p key={i}><strong>{e.from === 'candidate' ? 'You' : 'Ananya'}:</strong> {e.text}</p>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
