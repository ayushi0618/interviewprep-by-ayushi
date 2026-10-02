// InterviewPrep server — serves the built React site (client/dist) and the
// one API endpoint behind the Live Interview room: POST /api/interview.
//
// The interview "brain" has two modes:
//  • Gemini mode — if GEMINI_API_KEY is set, Gemini improvises follow-ups
//    and feedback. Any failure falls back to scripted mode for that turn.
//  • Scripted mode — a deterministic ladder over the question bank:
//    intro → 5 main questions (each with up to 2 follow-ups) → closing.
//    The room fully works with NO API key; the frontend also carries a
//    local copy of this ladder in case the fetch itself fails.
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '256kb' }));

const PORT = process.env.PORT || 3002;
const TOTAL_MAINS = 5;
const FOLLOWUP_LIMIT = 2;
const FOLLOWUPS = [
  'Can you give me a concrete example of that?',
  'What happens if that breaks, or the input is not what you expected?',
  'How would you explain that to a teammate in one line?',
];
const INTRO_QUESTION =
  "Let's begin. Tell me about yourself — your background, your stack, and what you're preparing for.";

// The same bank.json the frontend uses (generated from the notes markdown).
let bank = {};
try {
  bank = JSON.parse(fs.readFileSync(path.join(__dirname, 'client', 'src', 'data', 'bank.json'), 'utf8'));
} catch (e) {
  console.warn('⚠️  question bank not found — run: node scripts/extract-bank.mjs');
}

// Tiny keyword feedback, same spirit as the client rubric (lib/scoring.js).
function quickFeedback(answer, item) {
  const text = (answer || '').trim();
  const words = text ? text.split(/\s+/).length : 0;
  if (!item) return null;
  const lower = ` ${text.toLowerCase()} `;
  const hits = (item.keywords || []).filter((k) => lower.includes(k.toLowerCase()));
  if (words < 10) return 'Quite brief — interviewers score depth. Try adding the *why* behind that answer.';
  if (hits.length >= Math.ceil((item.keywords || []).length / 2)) {
    return `Good — you covered ${hits.slice(0, 3).join(', ')}, which is the core of it.`;
  }
  const missing = (item.keywords || []).filter((k) => !hits.includes(k));
  return `Fair start. The piece usually missing there is ${missing.slice(0, 2).join(' and ')} — worth a quick revise after this round.`;
}

// Deterministic ladder. Mirrors localNext() in client/src/components/LiveInterview.jsx.
function scriptedNext({ topic, stage, mainIndex, followUpsOnCurrent, lastAnswer }) {
  const items = bank[topic] || [];
  const total = Math.min(TOTAL_MAINS, items.length);
  if (stage === 'start' || !stage) {
    return { type: 'question', text: INTRO_QUESTION, scoreRef: null, aiUsed: false,
      nextState: { stage: 'intro', mainIndex: 0, followUpsOnCurrent: 0 } };
  }
  if (stage === 'intro') {
    const item = items[0];
    if (!item) return closing();
    return { type: 'question', text: item.question, scoreRef: item, aiUsed: false,
      nextState: { stage: 'main', mainIndex: 0, followUpsOnCurrent: 0 } };
  }
  const current = items[mainIndex];
  const feedback = quickFeedback(lastAnswer, current);
  if (followUpsOnCurrent < FOLLOWUP_LIMIT) {
    return { type: 'followup', feedback, text: FOLLOWUPS[(mainIndex + followUpsOnCurrent) % FOLLOWUPS.length],
      scoreRef: null, aiUsed: false,
      nextState: { stage: 'main', mainIndex, followUpsOnCurrent: followUpsOnCurrent + 1 } };
  }
  const nextIdx = mainIndex + 1;
  if (nextIdx >= total) return closing(feedback);
  const item = items[nextIdx];
  return { type: 'question', feedback, text: item.question, scoreRef: item, aiUsed: false,
    nextState: { stage: 'main', mainIndex: nextIdx, followUpsOnCurrent: 0 } };

  function closing(fb) {
    return { type: 'closing', feedback: fb, done: true, scoreRef: null, aiUsed: false,
      text: 'That brings us to the end. Thank you — that was a solid round. Your scorecard is ready.',
      nextState: { stage: 'done', mainIndex, followUpsOnCurrent: 0 } };
  }
}

async function geminiNext(payload) {
  const { topic, history = [], mainIndex } = payload;
  const items = bank[topic] || [];
  const current = items[mainIndex] || {};
  const transcript = history.map((h) => `${h.from === 'candidate' ? 'Candidate' : 'Interviewer'}: ${h.text}`).join('\n');
  const prompt = [
    'You are a friendly but sharp technical interviewer running a mock interview for a fresher full-stack (MERN) role.',
    `Topic: ${topic}. This is main question ${mainIndex + 1} of ${TOTAL_MAINS}.`,
    current.question ? `Base this part of the interview around the question: "${current.question}" with model answer: "${current.answer}". Do not quote the model answer.` : '',
    'From the transcript, reply with ONLY a JSON object:',
    '{"feedback": "one short encouraging sentence on the candidate\'s last answer (or empty string at the very start)", "text": "your next spoken line — the next main question, a follow-up, or a warm closing if 5 main questions are done", "done": false}',
    'Keep questions spoken-style and short. Ask at most 2 follow-ups per main question, then move on.',
    'Transcript so far:',
    transcript || '(interview just started — open with a short greeting plus the intro question: tell me about yourself)',
  ].filter(Boolean).join('\n');

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

  // Keep the same bank progression as scripted mode so the end-of-interview
  // rubric (keyword coverage vs the model answer) still lines up.
  const base = scriptedNext({ ...payload, lastAnswer: '' });
  return {
    type: parsed.done ? 'closing' : base.type,
    text: String(parsed.text || base.text),
    feedback: parsed.feedback || undefined,
    scoreRef: base.scoreRef,
    done: !!parsed.done || base.done,
    aiUsed: true,
    nextState: base.nextState,
  };
}

app.get('/api/health', (_req, res) => res.json({ ok: true, ai: !!process.env.GEMINI_API_KEY }));

app.post('/api/interview', async (req, res) => {
  const payload = {
    topic: String(req.body?.topic || 'javascript'),
    stage: req.body?.stage || 'start',
    mainIndex: Number(req.body?.mainIndex || 0),
    followUpsOnCurrent: Number(req.body?.followUpsOnCurrent || 0),
    lastAnswer: String(req.body?.lastAnswer || ''),
    history: Array.isArray(req.body?.history) ? req.body.history : [],
  };
  if (process.env.GEMINI_API_KEY) {
    try {
      return res.json(await geminiNext(payload));
    } catch (e) {
      console.warn('Gemini turn failed, using scripted ladder:', e.message);
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
