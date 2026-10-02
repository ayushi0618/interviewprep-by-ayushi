// InterviewPrep server — serves the built React site (client/dist) and the
// one API endpoint behind the Live Interview room: POST /api/interview.
//
// The interview "brain" has two modes:
//  • Gemini mode — if GEMINI_API_KEY is set, Gemini rephrases Ananya's lines
//    and feedback. Progression, follow-up pacing and scoreRef always come
//    from the scripted engine below, so grading stays aligned; any Gemini
//    failure falls back to the scripted text for that turn.
//  • Scripted mode — a deterministic 5-round state machine that fully works
//    with NO API key (the frontend also mirrors it in case fetch fails):
//      intro → project pitch (+1 probe) → 4 technical (ramp, ≤1 hint +
//      ≤1 follow-up each) → 1 DSA approach (+complexity probe) → closing.
//
// Persona: "Ananya, Senior Software Engineer" — warm, professional.
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '256kb' }));

const PORT = process.env.PORT || 3002;

// ---------------------------------------------------------------------------
// Shared interview vocabulary (mirrored in client LiveInterview.jsx localNext)
// ---------------------------------------------------------------------------
const TECH_TERMS = [
  'authentication', 'typescript', 'javascript', 'websocket', 'websockets',
  'mongodb', 'mongo', 'tailwind', 'deployment', 'database', 'express',
  'react', 'node', 'redis', 'docker', 'testing', 'graphql', 'supabase',
  'firebase', 'next.js', 'nextjs', 'hooks', 'hook', 'state', 'deploy',
  'cache', 'vite', 'html', 'css', 'python', 'sql', 'api', 'jwt', 'auth',
  'git', 'aws', 'db',
];

// Synthetic scored item for the project-pitch round.
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

// The same bank.json the frontend uses (generated from the notes markdown).
let bank = {};
try {
  bank = JSON.parse(fs.readFileSync(path.join(__dirname, 'client', 'src', 'data', 'bank.json'), 'utf8'));
} catch (e) {
  console.warn('⚠️  question bank not found — run: node scripts/extract-bank.mjs');
}

// --- tiny analysis helpers (same spirit as client lib/scoring.js) ----------
function analyse(answer, item) {
  const text = (answer || '').trim();
  const words = text ? text.split(/\s+/).length : 0;
  const lower = ` ${text.toLowerCase()} `;
  const keywords = item?.keywords || [];
  const hit = keywords.filter((k) => lower.includes(` ${k.toLowerCase()} `) || lower.includes(k.toLowerCase()));
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

// 4 indexes spread across the topic list (difficulty ramp: easy → deep).
function pickTechPicked(items) {
  const n = items.length;
  if (!n) return [];
  const raw = [0, Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1];
  const picked = [...new Set(raw)];
  for (let i = 0; picked.length < Math.min(4, n) && i < n; i += 1) {
    if (!picked.includes(i)) picked.push(i);
  }
  return picked.slice(0, 4);
}

function pickDsaIdx(items) {
  const i = (items || []).findIndex((q) => /cycle|two sum|sliding window|binary search/i.test(q.question || ''));
  return i >= 0 ? i : 0;
}

// Ananya's per-answer feedback: warm, and specific about keywords.
function answerFeedback(answer, item, { skipped = false } = {}) {
  if (skipped) return "No worries at all — we'll skip that one and keep moving.";
  if (!item) return 'Thanks for sharing that.';
  const { words, hit, missed } = analyse(answer, item);
  if (words < 10) return 'Thanks — that was quite brief. In a real interview, adding the *why* behind an answer is what earns the marks.';
  if (missed.length === 0 && hit.length) return `Lovely — you covered ${hit.slice(0, 3).join(', ')}, which is really the heart of it.`;
  if (hit.length) return `Good — you covered ${hit.slice(0, 3).join(', ')} well. The piece worth adding there is ${missed.slice(0, 2).join(' and ')}.`;
  return `Fair start. The piece usually missing there is ${missed.slice(0, 2).join(' and ')} — worth a quick revise after this round.`;
}

// Name one strength from the candidate's best-scored answer (for the wrap-up).
function strongestFromHistory(history, topic) {
  const pools = [...(bank[topic] || []), ...(bank.dsa || []), PROJECT_ITEM];
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

// ---------------------------------------------------------------------------
// Scripted state machine.
// State: { round, techIdx, techPicked, followUpUsed, hintUsed, dsaIdx,
//          projectProbed }
// ---------------------------------------------------------------------------
function blankState(round) {
  return { round, techIdx: 0, techPicked: [], followUpUsed: false, hintUsed: false, dsaIdx: 0, projectProbed: false };
}

function toTechnical(state, feedback) {
  const items = bank[state.topic] || [];
  const techPicked = pickTechPicked(items);
  const item = items[techPicked[0]];
  if (!item) return toDsa(state, feedback);
  return {
    type: 'question', round: 'technical', feedback, aiUsed: false,
    text: `Lovely. Let's move to the technical round. ${TECH_RAMPS[0]}${item.question}`,
    scoreRef: item,
    nextState: { ...blankState('technical'), techPicked, dsaIdx: state.dsaIdx },
  };
}

function toDsa(state, feedback) {
  const items = bank.dsa || [];
  const dsaIdx = pickDsaIdx(items);
  const item = items[dsaIdx];
  if (!item) return toClosing(state, feedback);
  return {
    type: 'question', round: 'dsa', feedback, aiUsed: false,
    text: `Now a quick DSA one — talk me through your approach, don't code, just the idea. ${item.question}`,
    scoreRef: item,
    nextState: { ...blankState('dsa'), techPicked: state.techPicked, techIdx: state.techIdx, dsaIdx },
  };
}

function toClosing(state, feedback) {
  return {
    type: 'question', round: 'closing', feedback, aiUsed: false,
    text: CLOSING_QUESTION, scoreRef: null,
    nextState: { ...blankState('closing'), techPicked: state.techPicked, techIdx: state.techIdx, dsaIdx: state.dsaIdx, projectProbed: true },
  };
}

function advanceTechnical(state, feedback) {
  const items = bank[state.topic] || [];
  const nextIdx = state.techIdx + 1;
  if (nextIdx >= state.techPicked.length) return toDsa(state, feedback);
  const item = items[state.techPicked[nextIdx]];
  if (!item) return toDsa(state, feedback);
  return {
    type: 'question', round: 'technical', feedback, aiUsed: false,
    text: `${TECH_RAMPS[Math.min(nextIdx, TECH_RAMPS.length - 1)]}${item.question}`,
    scoreRef: item,
    nextState: { ...state, round: 'technical', techIdx: nextIdx, followUpUsed: false, hintUsed: false },
  };
}

function scriptedNext(payload) {
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
  const items = bank[state.topic] || [];

  // 0 — interview just opened.
  if (state.round === 'start') {
    return { type: 'question', round: 'intro', text: INTRO_TEXT, scoreRef: null, aiUsed: false, nextState: blankState('intro') };
  }

  // 1 — intro (unscored warm-up) → project round.
  if (state.round === 'intro') {
    return {
      type: 'question', round: 'project',
      feedback: "Great, thanks — lovely to meet you. Let's talk about your work.",
      text: PROJECT_QUESTION, scoreRef: PROJECT_ITEM, aiUsed: false,
      nextState: { ...blankState('project'), dsaIdx: state.dsaIdx },
    };
  }

  // 2 — project pitch, then exactly one probing follow-up.
  if (state.round === 'project') {
    if (!state.projectProbed) {
      if (skipped) return toTechnical(state, answerFeedback('', PROJECT_ITEM, { skipped: true }));
      const term = findTechTerm(lastAnswer);
      return {
        type: 'followup', round: 'project',
        feedback: answerFeedback(lastAnswer, PROJECT_ITEM),
        text: term
          ? `You mentioned ${term} — what was the trickiest part of using it there?`
          : 'What was the trickiest part of building it — and how did you get past it?',
        scoreRef: null, aiUsed: false,
        nextState: { ...state, projectProbed: true },
      };
    }
    return toTechnical(state, skipped ? answerFeedback('', PROJECT_ITEM, { skipped: true }) : 'Thanks — that gives me a good picture of the project.');
  }

  // 3 — technical: 4 bank questions, ≤1 hint + ≤1 follow-up each.
  if (state.round === 'technical') {
    const item = items[state.techPicked[state.techIdx]];
    if (!item) return toDsa(state, null);
    if (skipped) return advanceTechnical(state, answerFeedback('', item, { skipped: true }));

    const a = analyse(lastAnswer, item);
    // Hint path: very short answer, hint not yet spent on this question.
    if (!state.hintUsed && a.words < 10) {
      return {
        type: 'hint', round: 'technical',
        feedback: "No rush — take a second and think it through. Here's a small nudge:",
        text: `Hint: think about how ${a.missed[0] || item.keywords[0] || 'the core idea'} fits in.`,
        scoreRef: null, aiUsed: false,
        nextState: { ...state, hintUsed: true },
      };
    }
    // One follow-up: targeted probe on a missed keyword first, else expand
    // on a tech term the candidate themselves brought up.
    if (!state.followUpUsed) {
      if (a.missed.length >= 1) {
        return {
          type: 'followup', round: 'technical', scoreRef: null, aiUsed: false,
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
          type: 'followup', round: 'technical', scoreRef: null, aiUsed: false,
          feedback: answerFeedback(lastAnswer, item),
          text: `You mentioned ${term} — can you expand on that a bit?`,
          nextState: { ...state, followUpUsed: true },
        };
      }
    }
    return advanceTechnical(state, answerFeedback(lastAnswer, item));
  }

  // 4 — DSA approach; probe for complexity if they didn't state it.
  if (state.round === 'dsa') {
    const item = (bank.dsa || [])[state.dsaIdx];
    if (skipped) return toClosing(state, answerFeedback('', item, { skipped: true }));
    if (!state.followUpUsed && !/o\(/i.test(lastAnswer || '')) {
      return {
        type: 'followup', round: 'dsa', scoreRef: null, aiUsed: false,
        feedback: 'Good approach. One more thing —',
        text: "And what's the time and space complexity?",
        nextState: { ...state, followUpUsed: true },
      };
    }
    return toClosing(state, state.followUpUsed ? 'Perfect, thanks for adding that.' : answerFeedback(lastAnswer, item));
  }

  // 5 — closing: whatever they ask (or skip), wrap up warmly and finish.
  if (state.round === 'closing') {
    const strength = strongestFromHistory(history, state.topic);
    return {
      type: 'closing', round: 'done', done: true, scoreRef: null, aiUsed: false,
      text: `That's everything from my side — thank you for your time! One thing that really stood out was ${strength}. Your scorecard below breaks down every answer, so do revise the shaky ones and run this again. All the best!`,
      nextState: blankState('done'),
    };
  }

  return { type: 'closing', round: 'done', done: true, text: 'Thank you — your scorecard is ready.', scoreRef: null, aiUsed: false, nextState: blankState('done') };
}

// The bank item the candidate is currently being scored against (Gemini ctx).
function currentItemFor(payload) {
  const topic = payload.topic || 'javascript';
  if (payload.round === 'project') return PROJECT_ITEM;
  if (payload.round === 'technical') {
    const picked = Array.isArray(payload.techPicked) ? payload.techPicked : [];
    return (bank[topic] || [])[picked[Number(payload.techIdx || 0)]] || null;
  }
  if (payload.round === 'dsa') return (bank.dsa || [])[Number(payload.dsaIdx || 0)] || null;
  return null;
}

// Gemini only rephrases Ananya's line + feedback. The scripted engine owns
// progression, pacing and scoreRef, so grading always lines up; any failure
// returns the scripted turn untouched.
async function geminiNext(payload) {
  const base = scriptedNext(payload);
  const current = currentItemFor(payload);
  const missed = current ? analyse(payload.lastAnswer, current).missed : [];
  const transcript = (payload.history || [])
    .map((h) => `${h.from === 'candidate' ? 'Candidate' : 'Ananya'}: ${h.text}`)
    .join('\n');
  const prompt = [
    'You are Ananya, a Senior Software Engineer running a friendly but sharp mock interview for a fresher full-stack role. Speak warmly and professionally, in first person, one question at a time.',
    `Current round: ${base.round}. The scripted engine has decided the next line should be (rephrase it naturally, keep its intent, do NOT change which question is asked): "${base.text}"`,
    current?.question ? `The candidate is being scored against this bank item: "${current.question}". Model answer (never quote or reveal it): "${current.answer}". Keywords they have not mentioned yet: ${missed.join(', ') || 'none'}.` : '',
    'Rules: follow-ups must be grounded ONLY in the candidate\'s last answer; keep a gentle difficulty ramp; give brief, specific feedback (name what they covered or missed); never quote model answers; keep every line short and spoken-style.',
    'Reply with ONLY a JSON object: {"feedback": "one short warm sentence on the candidate\'s last answer (empty string at the very start)", "text": "your next spoken line", "done": false}',
    `The interview is ${base.done ? 'now finished — set "done": true and make the text a warm closing' : 'not finished — set "done": false'}.`,
    'Transcript so far:',
    transcript || '(interview just started)',
  ].filter(Boolean).join('\n');

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`gemini ${res.status}`);
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if (!parsed.text) throw new Error('empty gemini text');
    return {
      ...base,
      text: String(parsed.text),
      feedback: parsed.feedback ? String(parsed.feedback) : base.feedback,
      aiUsed: true,
    };
  } finally {
    clearTimeout(timer);
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true, ai: !!process.env.GEMINI_API_KEY }));

app.post('/api/interview', async (req, res) => {
  const payload = {
    topic: String(req.body?.topic || 'javascript'),
    round: String(req.body?.round || 'start'),
    techIdx: Number(req.body?.techIdx || 0),
    techPicked: Array.isArray(req.body?.techPicked) ? req.body.techPicked.map(Number) : [],
    followUpUsed: !!req.body?.followUpUsed,
    hintUsed: !!req.body?.hintUsed,
    dsaIdx: Number(req.body?.dsaIdx || 0),
    projectProbed: !!req.body?.projectProbed,
    lastAnswer: String(req.body?.lastAnswer || ''),
    skipped: !!req.body?.skipped,
    history: Array.isArray(req.body?.history) ? req.body.history : [],
  };
  if (process.env.GEMINI_API_KEY) {
    try {
      return res.json(await geminiNext(payload));
    } catch (e) {
      console.warn('Gemini turn failed, using scripted turn:', e.message);
    }
  }
  return res.json(scriptedNext(payload));
});

// Static site + SPA fallback
const dist = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(path.join(dist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => res.send('InterviewPrep: run `npm run build` first, or use `npm run dev` for local development.'));
}

app.listen(PORT, () => console.log(`🎤 InterviewPrep server on http://localhost:${PORT} (AI: ${process.env.GEMINI_API_KEY ? 'Gemini' : 'scripted'})`));
