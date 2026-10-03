import { useEffect, useMemo, useRef, useState } from 'react';
import { TOPICS } from '../content/topics';
import { speak, stopSpeaking, hasRecognition, createRecognizer } from '../lib/speech';
import { scoreInterviewAnswer, BAND_STYLES } from '../lib/scoring';

const SESSION_KEY = 'ip_live_sessions';
const MAX_EXCHANGES = 12;

const FOCUS_OPTIONS = ['Mixed', 'DSA', 'JavaScript', 'React', 'Backend', 'Core Subjects', 'HR'];
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

// Focus (new session API) <-> topic slug (bank / notes / saved sessions).
const FOCUS_TO_SLUG = {
  Mixed: 'javascript',
  DSA: 'dsa',
  JavaScript: 'javascript',
  React: 'react',
  Backend: 'backend',
  'Core Subjects': 'git-cs',
  HR: 'projects-hr',
};
const SLUG_TO_FOCUS = {
  dsa: 'DSA',
  javascript: 'JavaScript',
  react: 'React',
  backend: 'Backend',
  'git-cs': 'Core Subjects',
  'projects-hr': 'HR',
};

// --- Offline scripted ladder (fallback ONLY) ---------------------------------
// This is the old deterministic engine, kept verbatim in spirit. Its ONLY role
// now is to keep the room alive when the session API itself is unreachable
// (e.g. opening the built site with no Express server, or the network drops
// mid-interview). The real interviewer is session-based on the server:
// POST /api/interview/start -> /turn -> /end (see server/interviewSessions.js).
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

// Grade a local (offline-ladder) transcript into scored rows — the old
// report engine, now used only to build a report when /api/interview/end
// itself is unreachable.
function grade(transcript, topicSlug) {
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
        revTopic: e.round === 'dsa' ? 'dsa' : e.round === 'project' ? 'projects-hr' : topicSlug,
        question: e.scoreRef.question,
        modelAnswer: e.scoreRef.answer,
        transcript: scoreText,
        ...scoreInterviewAnswer(scoreText, e.scoreRef, { skipped: block.length > 0 && answered.length === 0, hintUsed }),
      });
    }
  });
  return rows;
}

function bandForScore(pct) {
  return pct >= 65 ? 'Strong' : pct >= 38 ? 'Good' : 'Needs work';
}

// Shape a locally-graded transcript into the same report shape the server
// returns ({ overallBand, overallScore, summary, perQuestion, strengths,
// gaps }), so the report screen renders one way regardless of source.
function buildLocalReport(transcript, focusLabel) {
  const rows = grade(transcript, FOCUS_TO_SLUG[focusLabel] || 'javascript');
  const scored = rows.filter((r) => r.kind === 'scored');
  const overallScore = scored.length ? Math.round(scored.reduce((s, r) => s + r.score, 0) / scored.length) : 0;
  const perQuestion = scored.map((r) => ({
    question: r.question,
    score: Math.round(r.score / 10),
    feedback: r.skipped
      ? 'You skipped this one.'
      : r.band === 'Strong'
        ? `Strong answer${r.hitKeywords?.length ? ` — you covered ${r.hitKeywords.slice(0, 3).join(', ')}` : ''}.`
        : r.band === 'Good'
          ? `Workable answer${r.missedKeywords?.length ? ` — add ${r.missedKeywords.slice(0, 2).join(' and ')} next time` : ''}.`
          : `Needs work${r.missedKeywords?.length ? ` — revise ${r.missedKeywords.slice(0, 2).join(' and ')}` : ''}.`,
    transcript: r.transcript,
    _modelAnswer: r.modelAnswer,
  }));
  const weakest = [...perQuestion].sort((a, b) => a.score - b.score).slice(0, Math.min(3, perQuestion.length));
  for (const q of perQuestion) {
    if (weakest.includes(q)) q.modelAnswer = q._modelAnswer;
    delete q._modelAnswer;
  }
  return {
    overallBand: bandForScore(overallScore),
    overallScore,
    summary: scored.length
      ? `Offline review of your ${focusLabel} session across ${scored.length} scored question${scored.length === 1 ? '' : 's'}. Run it with the AI interviewer for feedback tied to your exact words.`
      : 'No scored questions were completed — try again and answer each one out loud, even briefly.',
    perQuestion,
    strengths: scored.filter((r) => r.band === 'Strong').map((r) => `Strong answer on: ${r.question}`).slice(0, 6),
    gaps: scored.filter((r) => r.band !== 'Strong').map((r) => `Revise: ${r.question}`).slice(0, 6),
  };
}

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || []; } catch { return []; }
}

const VOICE_KEY = 'ip_voice_on';
function loadVoicePref() {
  try { const v = localStorage.getItem(VOICE_KEY); return v === null ? true : v === '1'; } catch { return true; }
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// --- Session API (the real interviewer) --------------------------------------
async function apiStart(body) {
  const res = await fetch('/api/interview/start', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `start failed (${res.status})`);
  return data;
}
async function apiTurn(body) {
  const res = await fetch('/api/interview/turn', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `turn failed (${res.status})`);
  return data;
}
async function apiEnd(body) {
  const res = await fetch('/api/interview/end', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `end failed (${res.status})`);
  return data;
}

export default function LiveInterview({ initialTopic, onReadTopic }) {
  const [phase, setPhase] = useState('setup'); // setup | live | done
  const [candidateName, setCandidateName] = useState('');
  const [focus, setFocus] = useState(SLUG_TO_FOCUS[initialTopic] || 'Mixed');
  const [difficulty, setDifficulty] = useState('Medium');
  const [useCamera, setUseCamera] = useState(true);
  const [useMic, setUseMic] = useState(true);
  const [voiceOn, setVoiceOn] = useState(loadVoicePref);
  const [mediaMode, setMediaMode] = useState('av'); // av | audio | text
  const [mediaNote, setMediaNote] = useState('');
  const [entries, setEntries] = useState([]); // {from, text, scoreRef?, kind?, round?, skipped?}
  const [answer, setAnswer] = useState('');
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [qElapsed, setQElapsed] = useState(0);
  const [aiUsed, setAiUsed] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [exchange, setExchange] = useState(0);
  const [report, setReport] = useState(null);
  const [pastSessions, setPastSessions] = useState(loadSessions);

  const sessionIdRef = useRef(null);
  const offlineRef = useRef(false);
  const localStateRef = useRef({ round: 'start', techIdx: 0, techPicked: [], followUpUsed: false, hintUsed: false, dsaIdx: 0, projectProbed: false });
  const entriesRef = useRef([]);
  const finishingRef = useRef(false);
  const streamRef = useRef(null);
  const recRef = useRef(null);
  const dictBaseRef = useRef('');
  const videoRef = useRef(null);
  const bottomRef = useRef(null);
  const startedAtRef = useRef(null);
  const qStartRef = useRef(null);

  const sttAvailable = useMemo(() => hasRecognition(), []);
  const ttsAvailable = useMemo(() => typeof window !== 'undefined' && 'speechSynthesis' in window, []);
  const localSlug = FOCUS_TO_SLUG[focus] || 'javascript';
  const localTopicTitle = TOPICS.find((t) => t.slug === localSlug)?.title || focus;
  const answerWords = useMemo(() => (answer.trim() ? answer.trim().split(/\s+/).length : 0), [answer]);
  const badge = offlineMode || !aiUsed ? '🎚️ Offline scripted mode' : '🤖 AI interviewer';

  useEffect(() => { if (initialTopic && SLUG_TO_FOCUS[initialTopic]) setFocus(SLUG_TO_FOCUS[initialTopic]); }, [initialTopic]);

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

  // Remember the interviewer-voice choice across visits
  useEffect(() => {
    try { localStorage.setItem(VOICE_KEY, voiceOn ? '1' : '0'); } catch { /* storage blocked — choice just won't persist */ }
  }, [voiceOn]);

  useEffect(() => () => {
    stopSpeaking();
    try { recRef.current?.rec.stop(); } catch { /* recognizer already stopped */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const attachStream = () => {
    if (videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  };

  function setEntriesBoth(next) {
    entriesRef.current = next;
    setEntries(next);
  }

  // Speak Ananya's words aloud (feedback first, then the question) whenever
  // the voice is on and this browser can synthesize speech.
  const speakNow = (parts) => {
    if (!voiceOn || !ttsAvailable) return;
    const text = parts.filter(Boolean).join(' ').trim();
    if (text) speak(text);
  };

  const toggleVoice = () => setVoiceOn((v) => { if (v) stopSpeaking(); return !v; });

  // --- Local ladder plumbing (fallback path only) ---------------------------
  function initLocalMidState() {
    const items = topicItems(localSlug);
    localStateRef.current = {
      round: 'technical', techIdx: 0, techPicked: pickTechPicked(items),
      followUpUsed: false, hintUsed: false, dsaIdx: pickDsaIdx(topicItems('dsa')), projectProbed: true,
    };
  }

  function applyLocalResponse(res, baseEntries) {
    localStateRef.current = res.nextState;
    const additions = [];
    if (res.feedback) additions.push({ from: 'feedback', text: res.feedback });
    additions.push({ from: 'interviewer', text: res.text, scoreRef: res.scoreRef || null, kind: res.type, round: res.round });
    const all = [...baseEntries, ...additions];
    setEntriesBoth(all);
    qStartRef.current = Date.now(); setQElapsed(0);
    speakNow([res.feedback, res.text]);
    if (res.done) finishInterview(all, { localOnly: true });
  }

  function localTurn(baseEntries, { text, skipped }) {
    const res = localNext({
      topic: localSlug,
      ...localStateRef.current,
      lastAnswer: skipped ? '' : text,
      skipped,
      history: baseEntries.map((e) => ({ from: e.from, text: e.text, skipped: !!e.skipped })),
    });
    applyLocalResponse(res, baseEntries);
  }

  function switchToOffline(baseEntries, { text, skipped }) {
    offlineRef.current = true;
    setOfflineMode(true);
    setAiUsed(false);
    initLocalMidState();
    localTurn(baseEntries, { text, skipped });
  }

  // --- Report / session-meta persistence ------------------------------------
  // Preserved from the previous room: every finished session writes
  // { date, topic (slug), focus, score, band, rows } to localStorage
  // 'ip_live_sessions' (capped at 10). That list is what powers
  // Past sessions here, Profile's "Live interviews taken / Best" card,
  // and progress.jsx readLiveMeta() (taken / best band+score / last date)
  // for account sync — the shape must not change.
  function saveSessionMeta(rep) {
    const session = {
      date: new Date().toISOString(),
      topic: localSlug,
      focus,
      score: rep.overallScore,
      band: rep.overallBand,
      rows: (rep.perQuestion || []).map((q) => ({ question: q.question, band: bandForScore((q.score || 0) * 10) })),
    };
    try {
      const next = [session, ...loadSessions()].slice(0, 10);
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setPastSessions(next);
    } catch { /* storage full/blocked — results still show on screen */ }
  }

  async function finishInterview(transcript, { localOnly = false } = {}) {
    if (finishingRef.current) return;
    finishingRef.current = true;
    stopSpeaking();
    setThinking(true);
    let rep = null;
    let usedAi = aiUsed;
    if (!localOnly && !offlineRef.current && sessionIdRef.current) {
      try {
        const data = await apiEnd({ sessionId: sessionIdRef.current });
        rep = data.report;
        usedAi = !!data.aiUsed || usedAi;
      } catch {
        rep = null; // fall through to the local report below
      }
    }
    if (!rep) {
      rep = buildLocalReport(transcript, focus);
      usedAi = false;
    }
    setReport(rep);
    setAiUsed(usedAi);
    saveSessionMeta(rep);
    setThinking(false);
    setPhase('done');
  }

  // --- Room flow -------------------------------------------------------------
  async function start() {
    stopSpeaking();
    finishingRef.current = false;
    setEntriesBoth([]); setAnswer(''); setElapsed(0); setQElapsed(0);
    setAiUsed(false); setOfflineMode(false); setExchange(0); setReport(null);
    sessionIdRef.current = null;
    offlineRef.current = false;
    localStateRef.current = { round: 'start', techIdx: 0, techPicked: [], followUpUsed: false, hintUsed: false, dsaIdx: 0, projectProbed: false };
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
    try {
      const data = await apiStart({ name: candidateName.trim(), focus, difficulty });
      sessionIdRef.current = data.sessionId;
      setAiUsed(!!data.aiUsed);
      setExchange(data.exchange || 0);
      const first = [{ from: 'interviewer', text: data.text, kind: 'question' }];
      setEntriesBoth(first);
      speakNow([data.text]);
    } catch {
      // Session API unreachable — run the local scripted ladder instead of
      // dead-ending (the ladder's only remaining job).
      offlineRef.current = true;
      setOfflineMode(true);
      setAiUsed(false);
      const res = localNext({ topic: localSlug, ...localStateRef.current, lastAnswer: '', history: [] });
      applyLocalResponse(res, []);
    }
    setThinking(false);
    setTimeout(attachStream, 60);
  }

  function toggleListening() {
    if (listening) {
      try { recRef.current?.rec.stop(); } catch { /* already stopped */ }
      setListening(false);
      return;
    }
    stopSpeaking();
    // Dictation appends after whatever is already typed — never wipes it.
    dictBaseRef.current = answer.trim();
    const r = createRecognizer({
      onInterim: (text) => {
        const base = dictBaseRef.current;
        setAnswer(base ? `${base} ${text}` : text);
      },
    });
    if (!r) return;
    recRef.current = r;
    r.rec.onend = () => setListening(false);
    r.rec.onerror = () => setListening(false);
    try { r.rec.start(); setListening(true); } catch { /* already running */ }
  }

  async function submitAnswer({ skipped = false } = {}) {
    const text = skipped ? "I don't know — let's skip this one." : answer.trim();
    if (thinking || finishingRef.current || (!skipped && !text)) return;
    if (listening) toggleListening();
    stopSpeaking();
    const candidateEntry = { from: 'candidate', text: skipped ? '⏭ Skipped this one' : text, skipped };
    const newEntries = [...entriesRef.current, candidateEntry];
    setEntriesBoth(newEntries);
    setAnswer('');
    setThinking(true);

    if (!offlineRef.current && sessionIdRef.current) {
      try {
        const data = await apiTurn({ sessionId: sessionIdRef.current, answer: text });
        if (data.aiUsed) setAiUsed(true);
        setExchange(data.exchange ?? exchange + 1);
        const additions = [];
        if (data.feedback) additions.push({ from: 'feedback', text: data.feedback });
        additions.push({ from: 'interviewer', text: data.text, kind: data.done ? 'closing' : 'question' });
        const all = [...newEntries, ...additions];
        setEntriesBoth(all);
        qStartRef.current = Date.now(); setQElapsed(0);
        speakNow([data.feedback, data.text]);
        setThinking(false);
        if (data.done) finishInterview(all);
        return;
      } catch {
        // Server dropped mid-interview — continue on the local ladder with
        // the candidate's answer already on the transcript.
        setThinking(false);
        switchToOffline(newEntries, { text, skipped });
        return;
      }
    }
    localTurn(newEntries, { text, skipped });
    setThinking(false);
  }

  async function requestHint() {
    if (thinking || finishingRef.current || phase !== 'live') return;
    stopSpeaking();
    setThinking(true);
    if (!offlineRef.current && sessionIdRef.current) {
      try {
        const data = await apiTurn({ sessionId: sessionIdRef.current, answer: '', wantHint: true });
        if (data.aiUsed) setAiUsed(true);
        const additions = [];
        if (data.feedback) additions.push({ from: 'feedback', text: data.feedback });
        additions.push({ from: 'interviewer', text: data.text, kind: 'hint' });
        const all = [...entriesRef.current, ...additions];
        setEntriesBoth(all);
        speakNow([data.feedback, data.text]);
        setThinking(false);
        return;
      } catch {
        setThinking(false);
        switchOfflineHint();
        return;
      }
    }
    switchOfflineHint();
    setThinking(false);
  }

  function switchOfflineHint() {
    offlineRef.current = true;
    setOfflineMode(true);
    // If we dropped offline before any local question was asked, park the
    // ladder in the technical round so the next answer continues sensibly.
    if (localStateRef.current.round === 'start') initLocalMidState();
    const current = [...entriesRef.current].reverse().find((e) => e.from === 'interviewer' && e.scoreRef);
    const kw = current?.scoreRef?.keywords?.[0] || 'the core idea';
    const all = [...entriesRef.current, { from: 'interviewer', text: `Hint: think about how ${kw} fits in — then take another go at it.`, kind: 'hint' }];
    setEntriesBoth(all);
  }

  const endEarly = () => finishInterview(entriesRef.current);

  const newInterview = () => {
    finishingRef.current = false;
    sessionIdRef.current = null;
    offlineRef.current = false;
    setReport(null);
    setEntriesBoth([]);
    setPhase('setup');
  };

  const mmss = fmt(elapsed);
  const qMmss = fmt(qElapsed);

  // "You said" per reported question, zipped by order (follow-ups merge into
  // the current question's block, like the old grader did).
  const candidateBlocks = useMemo(() => {
    if (phase !== 'done') return [];
    const blocks = [];
    let current = null;
    for (const e of entries) {
      if (e.from === 'interviewer' && e.kind !== 'feedback' && e.kind !== 'hint') {
        current = [];
        blocks.push(current);
      } else if (e.from === 'candidate' && current) {
        if (!e.skipped) current.push(e.text);
      }
    }
    return blocks.map((b) => b.join(' '));
  }, [entries, phase]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {phase === 'setup' && (
        <div className="bg-white rounded-2xl shadow-card border border-brand-100 p-6 md:p-8">
          <h2 className="text-2xl font-extrabold text-brand-900">🎥 Live AI Interview room</h2>
          <p className="text-slate-600 mt-2 leading-relaxed">
            Meet <strong>👩‍💻 Ananya, Senior Software Engineer</strong> — your interviewer. She <strong>speaks each
            question aloud</strong>, listens to your actual answers, follows up on your own words, adapts the
            difficulty as you go, and gives you a scored report at the end (up to {MAX_EXCHANGES} answers).
            With no AI key configured she runs in offline scripted mode instead — the badge in the room tells you which.
          </p>
          <div className="callout note mt-5">
            <div className="callout-title">🔒 Your privacy</div>
            <p>Your camera and mic are used only to show you a live preview and hear your answers.
              <strong> Nothing is recorded, uploaded, or stored</strong> — the preview never leaves your browser,
              and interview sessions save only a text summary on this device.</p>
          </div>

          <label className="block mt-6 text-sm font-bold text-slate-700">Your name</label>
          <input value={candidateName} onChange={(e) => setCandidateName(e.target.value)}
            placeholder="e.g. Ayushi"
            className="mt-2 w-full rounded-xl border border-brand-200 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-brand-400" />

          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="block text-sm font-bold text-slate-700">Interview focus</label>
              <select value={focus} onChange={(e) => setFocus(e.target.value)}
                className="mt-2 w-full rounded-xl border border-brand-200 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-brand-400">
                {FOCUS_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">Starting difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                className="mt-2 w-full rounded-xl border border-brand-200 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-brand-400">
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1.5">Ananya adapts up or down from here based on your answers.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            <label className="flex items-center gap-2.5 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 cursor-pointer">
              <input type="checkbox" checked={useCamera} onChange={(e) => setUseCamera(e.target.checked)} className="w-4 h-4 accent-brand-600" />
              <span className="text-sm font-semibold">📷 Camera preview</span>
            </label>
            <label className="flex items-center gap-2.5 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 cursor-pointer">
              <input type="checkbox" checked={useMic} onChange={(e) => setUseMic(e.target.checked)} className="w-4 h-4 accent-brand-600" />
              <span className="text-sm font-semibold">🎙️ Microphone</span>
            </label>
            {ttsAvailable && (
              <label className="flex items-center gap-2.5 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 cursor-pointer">
                <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} className="w-4 h-4 accent-brand-600" />
                <span className="text-sm font-semibold">🔊 Interviewer voice</span>
              </label>
            )}
          </div>
          {!sttAvailable && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4">
              This browser doesn’t support voice answers (SpeechRecognition) — Chrome or Edge work best.
              You can still type every answer; the interview runs exactly the same.
            </p>
          )}
          {mediaNote && <p className="text-sm text-slate-600 mt-3">{mediaNote}</p>}

          <button onClick={start} className="mt-6 w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 rounded-xl shadow-card transition">
            Start interview — {focus} · {difficulty}
          </button>
          <p className="text-xs text-slate-400 mt-3 text-center">
            A real conversation, not a fixed script: follow-ups build on your words, and you can ask for a hint anytime.
          </p>

          {pastSessions.length > 0 && (
            <div className="mt-7">
              <h3 className="font-bold text-slate-800">Past live sessions</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {pastSessions.slice(0, 4).map((s, i) => (
                  <li key={i} className="flex justify-between items-center bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
                    <span>{TOPICS.find((t) => t.slug === s.topic)?.title || s.focus || s.topic} · {new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
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
              <span className="text-xs bg-white/15 px-2 py-1 rounded-md font-semibold">{badge}</span>
            </div>
            {mediaMode === 'av' && <p className="px-4 pb-3 text-[0.7rem] text-slate-400 -mt-1">Preview only — nothing is recorded or uploaded.</p>}
          </div>

          {/* Conversation */}
          <div className="bg-white rounded-2xl shadow-card border border-brand-100 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-brand-100">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-extrabold text-brand-900">👩‍💻 Ananya · Senior Software Engineer</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-brand-50 border border-brand-100 px-2 py-1 rounded-md font-semibold text-brand-700">{badge} · {focus} · {difficulty}</span>
                  {ttsAvailable && (
                    <button onClick={toggleVoice}
                      className="px-3 py-1.5 rounded-xl bg-white border border-brand-200 text-xs font-bold text-brand-800 shadow-card"
                      title={voiceOn ? 'Mute Ananya' : 'Unmute Ananya'}>
                      {voiceOn ? '🔊 Voice on' : '🔇 Voice off'}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 mt-2">
                <p className="text-xs font-bold text-slate-500">Exchange {Math.min(exchange + 1, MAX_EXCHANGES)} of {MAX_EXCHANGES} · {exchange} answered</p>
                <button onClick={endEarly} disabled={thinking} className="text-sm font-bold text-red-600 hover:text-red-500 disabled:opacity-50">End interview</button>
              </div>
              <div className="h-1.5 bg-brand-50 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-brand-500 transition-all" style={{ width: `${(exchange / MAX_EXCHANGES) * 100}%` }} />
              </div>
            </div>

            <div className="px-5 py-4 space-y-3 overflow-y-auto nice-scroll max-h-[46vh]">
              {entries.map((e, i) => (
                <div key={i} className={`flex ${e.from === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed shadow-sm ${
                    e.from === 'candidate' ? 'bg-brand-600 text-white rounded-br-md'
                    : e.from === 'feedback' ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-md'
                    : e.kind === 'hint' ? 'bg-amber-50 border border-amber-300 text-amber-900 rounded-bl-md'
                    : 'bg-brand-50 border border-brand-100 text-slate-800 rounded-bl-md'}`}>
                    <p className={`text-[0.65rem] font-extrabold tracking-widest mb-1 ${e.from === 'candidate' ? 'text-brand-100' : 'text-brand-500'}`}>
                      {e.from === 'candidate' ? 'YOU' : e.from === 'feedback' ? '👩‍💻 ANANYA · FEEDBACK' : e.kind === 'hint' ? '👩‍💻 ANANYA · HINT 💡' : '👩‍💻 ANANYA'}
                    </p>
                    {e.text}
                  </div>
                </div>
              ))}
              {thinking && <p className="text-sm text-slate-400 italic">Ananya is thinking…</p>}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-brand-100 p-4 bg-brand-50/50">
              <p className="text-xs font-semibold text-slate-400 mb-2">⏱ {qMmss} on this question</p>
              <textarea value={answer} onChange={(e) => { stopSpeaking(); setAnswer(e.target.value); }} rows={3}
                placeholder={sttAvailable ? 'Speak with the mic button, or type your answer here…' : 'Type your answer here…'}
                className="w-full rounded-xl border border-brand-200 px-4 py-3 text-[0.95rem] outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
              {answerWords > 0 && answerWords < 10 && (
                <p className="text-xs text-amber-700 mt-1.5">Short answers score low in real interviews — add the <em>why</em>.</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
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
                <button onClick={requestHint} disabled={thinking}
                  className="px-4 py-2.5 rounded-xl bg-white border border-amber-300 text-sm font-bold text-amber-800 disabled:opacity-50">
                  💡 Ask for a hint
                </button>
                <button onClick={() => submitAnswer({ skipped: true })} disabled={thinking}
                  className="px-4 py-2.5 rounded-xl bg-white border border-brand-200 text-sm font-bold text-slate-600 disabled:opacity-50">
                  Skip ⏭
                </button>
              </div>
              {listening && <p className="text-xs text-red-500 font-semibold mt-2">Listening… speak now, your words appear above.</p>}
            </div>
          </div>
        </div>
      )}

      {phase === 'done' && report && (
        <div className="bg-white rounded-2xl shadow-card border border-brand-100 p-6 md:p-8">
          <h2 className="text-2xl font-extrabold text-brand-900">Interview report 📋</h2>
          <p className="text-sm text-slate-500 mt-1">with 👩‍💻 Ananya · Senior Software Engineer · {badge} · {focus} · {difficulty}</p>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="bg-brand-700 text-white rounded-2xl px-6 py-4">
              <p className="text-3xl font-extrabold">{report.overallScore}%</p>
              <p className="text-brand-100 text-xs font-bold">overall score</p>
            </div>
            <span className={`px-3 py-1.5 rounded-lg border text-sm font-extrabold ${BAND_STYLES[report.overallBand] || ''}`}>{report.overallBand}</span>
            <span className="text-xs bg-brand-50 border border-brand-100 px-2 py-1 rounded-md font-semibold text-brand-700">{badge}</span>
          </div>
          {report.summary && <p className="text-slate-600 text-sm leading-relaxed mt-4 max-w-3xl">{report.summary}</p>}

          {(report.strengths?.length > 0 || report.gaps?.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="border border-brand-100 rounded-xl px-4 py-3 bg-brand-50/50">
                <p className="font-bold text-slate-800 text-sm">💪 Strengths</p>
                {report.strengths?.length ? (
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-600 list-disc list-inside">
                    {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                ) : <p className="text-sm text-slate-500 mt-2">Keep building — answer in more depth to surface clear strengths.</p>}
              </div>
              <div className="border border-amber-200 rounded-xl px-4 py-3 bg-amber-50/60">
                <p className="font-bold text-slate-800 text-sm">🎯 Gaps to revise</p>
                {report.gaps?.length ? (
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-600 list-disc list-inside">
                    {report.gaps.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                ) : <p className="text-sm text-slate-500 mt-2">No major gaps flagged — polish accuracy next.</p>}
              </div>
            </div>
          )}

          <div className="space-y-3 mt-6">
            {(report.perQuestion || []).map((r, i) => (
              <div key={i} className="border border-brand-100 rounded-xl overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-brand-50/60">
                  <span className="font-bold text-slate-800 text-sm flex-1">{r.question}</span>
                  <span className={`px-2.5 py-1 rounded-lg border text-xs font-extrabold ${BAND_STYLES[bandForScore((r.score || 0) * 10)] || ''}`}>{r.score}/10</span>
                </div>
                <div className="px-4 py-2">
                  <div className="h-1.5 bg-brand-50 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 transition-all" style={{ width: `${(r.score || 0) * 10}%` }} />
                  </div>
                </div>
                <div className="px-4 py-3 text-sm space-y-2">
                  {(candidateBlocks[i] || r.transcript) && (
                    <p className="text-slate-600"><strong className="text-slate-800">You said:</strong> {candidateBlocks[i] || r.transcript}</p>
                  )}
                  {r.feedback && <p className="text-slate-600"><strong className="text-slate-800">Feedback:</strong> {r.feedback}</p>}
                  {r.modelAnswer && (
                    <details>
                      <summary className="cursor-pointer font-semibold text-brand-700 text-[0.85rem]">Model answer (weakest answers only)</summary>
                      <p className="mt-1.5 text-slate-700 leading-relaxed">{r.modelAnswer}</p>
                    </details>
                  )}
                </div>
              </div>
            ))}
            {(!report.perQuestion || report.perQuestion.length === 0) && (
              <p className="text-sm text-slate-500">No scored questions in this session — start again and answer each question out loud, even briefly.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-7">
            <button onClick={() => onReadTopic(localSlug)} className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-5 py-3 rounded-xl shadow-card">
              📖 Revise {localTopicTitle} notes
            </button>
            <button onClick={newInterview} className="bg-white border border-brand-200 font-bold px-5 py-3 rounded-xl text-brand-800">
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
