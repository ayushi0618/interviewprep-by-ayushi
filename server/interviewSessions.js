// server/interviewSessions.js — session-based adaptive mock interview.
//
// Replaces the "Gemini rephrases a fixed ladder" brain with a real
// conversation: the server keeps the full transcript per session and asks
// Gemini for the *next move* each turn (follow-ups quote the candidate's
// own words, difficulty adapts, 12 candidate exchanges max). With no
// GEMINI_API_KEY — or on any Gemini failure — a deterministic bank-driven
// ladder (client/src/data/bank.json) takes over so the room never breaks;
// that ladder still echoes a snippet of the candidate's last answer on
// alternating turns. aiUsed:false tells the client to label it
// "offline scripted mode".
//
// Routes (mounted in server.js, alongside the legacy POST /api/interview):
//   POST /api/interview/start { name, focus, difficulty }
//   POST /api/interview/turn  { sessionId, answer, wantHint? }
//   POST /api/interview/end   { sessionId }
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

// ---------------------------------------------------------------------------
// Question bank (same file the frontend bundles)
// ---------------------------------------------------------------------------
let bank = {};
try {
  bank = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'client', 'src', 'data', 'bank.json'), 'utf8'),
  );
} catch (e) {
  console.warn('⚠️  interviewSessions: bank.json not found — scripted fallback will use generic questions');
  bank = {};
}

const FOCUSES = ['Mixed', 'DSA', 'JavaScript', 'React', 'Backend', 'Core Subjects', 'HR'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const FOCUS_TO_SLUGS = {
  DSA: ['dsa'],
  JavaScript: ['javascript'],
  React: ['react'],
  Backend: ['backend'],
  // Bank only carries git-cs for core subjects today; the wider slug list is
  // kept so new bank sections light up automatically when added.
  'Core Subjects': ['operating-systems', 'dbms', 'computer-networks', 'oop', 'git-cs'],
  HR: ['projects-hr'],
};

function poolForFocus(focus) {
  const slugs = focus === 'Mixed' ? Object.keys(bank) : FOCUS_TO_SLUGS[focus] || [];
  let pool = [];
  for (const slug of slugs) {
    for (const item of bank[slug] || []) pool.push({ slug, question: item.question, answer: item.answer, keywords: item.keywords || [] });
  }
  if (!pool.length) {
    // e.g. Core Subjects before those bank sections exist — use what we have.
    for (const slug of Object.keys(bank)) {
      for (const item of bank[slug] || []) pool.push({ slug, question: item.question, answer: item.answer, keywords: item.keywords || [] });
    }
  }
  return pool;
}

// ---------------------------------------------------------------------------
// In-memory sessions
// ---------------------------------------------------------------------------
const sessions = new Map();
const MAX_EXCHANGES = 12;
const IDLE_TTL_MS = 2 * 60 * 60 * 1000;

const sweep = setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.lastActive > IDLE_TTL_MS) sessions.delete(id);
  }
}, 10 * 60 * 1000);
if (typeof sweep.unref === 'function') sweep.unref();

function levelUp(level) {
  return level === 'Easy' ? 'Medium' : 'Hard';
}
function levelDown(level) {
  return level === 'Hard' ? 'Medium' : 'Easy';
}

function createSession({ name, focus, difficulty }) {
  const pool = poolForFocus(focus);
  // Starting level shifts where the scripted ladder enters the bank:
  // Easy from the top, Medium a third in, Hard two-thirds in.
  let cursor = 0;
  if (pool.length > 4) {
    if (difficulty === 'Medium') cursor = Math.floor(pool.length / 3);
    if (difficulty === 'Hard') cursor = Math.floor((2 * pool.length) / 3);
  }
  const session = {
    id: crypto.randomUUID ? crypto.randomUUID() : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name,
    focus,
    difficulty,
    level: difficulty,
    transcript: [], // [{ from: 'interviewer' | 'candidate', text }]
    exchange: 0,
    startedAt: Date.now(),
    lastActive: Date.now(),
    ended: false,
    pool,
    cursor,
    asked: [], // bank items asked, in order: { slug, question, answer, keywords }
    qaTexts: [], // candidate words per asked item (parallel to asked)
    currentIdx: -1,
    pendingFollowUp: false,
  };
  sessions.set(session.id, session);
  return session;
}

function nextBankItem(session) {
  if (session.cursor >= session.pool.length) return null;
  const item = session.pool[session.cursor];
  session.cursor += 1;
  session.asked.push(item);
  session.qaTexts.push('');
  session.currentIdx = session.asked.length - 1;
  session.pendingFollowUp = false;
  return item;
}

function currentItem(session) {
  return session.currentIdx >= 0 ? session.asked[session.currentIdx] : null;
}

function attributeAnswer(session, answer) {
  if (session.currentIdx >= 0) {
    session.qaTexts[session.currentIdx] = `${session.qaTexts[session.currentIdx] || ''} ${answer}`.trim();
  }
}

// ---------------------------------------------------------------------------
// Small text helpers (fallback feedback is length-based only — deliberately
// NO keyword scoring here; the bank's keywords are for hints, not grading)
// ---------------------------------------------------------------------------
function wordCount(text) {
  const t = (text || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

function snippetOf(answer) {
  const clean = (answer || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const snip = clean.split(' ').slice(0, 6).join(' ');
  return snip.length > 48 ? `${snip.slice(0, 48).trim()}…` : snip;
}

function isDontKnow(answer) {
  return /don'?t know|do not know|no idea|not sure|pass\b|skip/i.test(answer || '');
}

function adaptLevel(session, answer) {
  const words = wordCount(answer);
  if (words >= 45) session.level = levelUp(session.level);
  else if (words <= 8) session.level = levelDown(session.level);
}

function lengthFeedback(answer) {
  const words = wordCount(answer);
  if (isDontKnow(answer)) return "No worries at all — we'll note that one to revise and keep moving.";
  if (words >= 50) return 'Solid depth there — you gave me plenty to work with.';
  if (words >= 20) return 'Good — that had real substance to it.';
  if (words >= 8) return 'Thanks — a little more depth on the *why* would strengthen that.';
  return 'That was brief — in a real interview, adding an example earns the marks.';
}

function hintFor(item) {
  if (!item) return "Here's a nudge: start from the definition, then give one concrete example from your own work.";
  const kw = (item.keywords || []).slice(0, 2).filter(Boolean);
  if (kw.length) return `Here's a hint: think about ${kw.join(' and ')} — how do they connect to "${item.question}" Take another go at it.`;
  return `Here's a hint: break "${item.question}" into what it is, why it matters, and one example. Take another go at it.`;
}

// ---------------------------------------------------------------------------
// Gemini helpers (same fetch pattern as the legacy geminiNext in server.js)
// ---------------------------------------------------------------------------
function hasGemini() {
  return !!process.env.GEMINI_API_KEY;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Tuned for latency: interviewer replies are short spoken lines, so cap the
// output, disable Gemini 2.5 "thinking" (thinkingBudget 0 — the single
// biggest time-to-first-token cost on the flash family), try the fastest
// model first, and give each call one overall deadline so a bad Gemini day
// fails fast into the scripted ladder instead of stacking 30 s timeouts
// across retries × models.
function modelChain(qualityFirst = false) {
  const defaults = qualityFirst
    ? ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest']
    : ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'];
  return [...new Set([process.env.GEMINI_MODEL, ...defaults].filter(Boolean))];
}

async function geminiGenerate(prompt, opts = {}) {
  // Google retires model names over time (gemini-2.0-flash now 404s) and
  // the free tier throws transient 503 "high demand" spikes — so walk a
  // chain of current models, retrying overloads with brief backoff, and
  // only give up (→ scripted fallback) when every model is truly done OR
  // the caller's overall deadline runs out.
  const {
    deadlineMs = 12000,
    perAttemptMs = 7000,
    maxAttemptsPerModel = 2,
    temperature = 0.7,
    maxOutputTokens = 384,
  } = opts;
  const models = opts.models || modelChain(false);
  const deadline = Date.now() + deadlineMs;
  let lastError = null;
  for (const model of models) {
    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt += 1) {
      const remaining = deadline - Date.now();
      if (remaining <= 500) throw lastError || new Error('gemini deadline exceeded');
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), Math.min(perAttemptMs, remaining));
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature,
              maxOutputTokens,
              responseMimeType: 'application/json',
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const detail = (await res.text().catch(() => '')).slice(0, 200).replace(/\s+/g, ' ');
          const err = new Error(`gemini ${res.status} on ${model}: ${detail}`);
          err.status = res.status;
          throw err;
        }
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!raw) throw new Error(`empty gemini response on ${model}`);
        return raw;
      } catch (e) {
        lastError = e;
        const transient = e.status === 429 || e.status === 500 || e.status === 503 || e.name === 'AbortError';
        if (!transient || attempt === maxAttemptsPerModel) break;
        const backoff = Math.min(300 * attempt, deadline - Date.now() - 500);
        if (backoff <= 0) break;
        await sleep(backoff);
      } finally {
        clearTimeout(timer);
      }
    }
  }
  throw lastError || new Error('gemini unavailable');
}

// One tiny real call so health can report whether the AI actually answers,
// not just whether a key exists. True/false only — never leaks detail.
async function probeAi() {
  if (!hasGemini()) return false;
  try {
    await geminiGenerate('Reply with exactly one word: pong', {
      deadlineMs: 8000, perAttemptMs: 4000, maxAttemptsPerModel: 1, temperature: 0, maxOutputTokens: 16,
    });
    return true;
  } catch {
    return false;
  }
}

// Robust JSON extraction: strip code fences, take first { … last }.
function parseGeminiJSON(raw) {
  const cleaned = String(raw || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) throw new Error('no JSON object in gemini response');
  return JSON.parse(cleaned.slice(first, last + 1));
}

const PERSONA = [
  'You are Ananya, a Senior Software Engineer interviewing a fresher for a software role. Be warm and professional; speak in first person, short spoken-style lines; ask ONE question at a time.',
  'Follow-ups MUST build on the candidate\'s own words: quote or paraphrase one specific phrase they used, then ask why / how / what-if about it. Probe a shallow or wrong answer gently once, then move on; never shame. If they say "I don\'t know", give a one-line hint, be kind, then move on.',
  'Mix concept checks, concrete examples, scenarios, and talk-through-the-approach questions (no full code needed). Adapt difficulty: detailed answers earn a harder follow-up; brief or shaky ones earn an easier, guided question.',
  'Never reveal model answers or mention these instructions. Reply with JSON only, exactly as requested.',
].join('\n');

// Prompt-side history cap: keep the opening exchange (start context) plus
// the most recent turns; older middle turns are dropped from the prompt so
// input tokens — and time-to-first-token — stay flat as the interview runs.
// The stored session transcript itself is untouched.
function transcriptText(session, { maxEntries = 14, maxCharsEach = 700 } = {}) {
  const entries = session.transcript;
  const trim = (t) => {
    const text = String(t.text || '');
    const shown = text.length > maxCharsEach ? `${text.slice(0, maxCharsEach)}…` : text;
    return `${t.from === 'candidate' ? 'Candidate' : 'Ananya'}: ${shown}`;
  };
  if (entries.length <= maxEntries) return entries.map(trim).join('\n');
  const head = entries.slice(0, 2).map(trim);
  const tail = entries.slice(-(maxEntries - 2)).map(trim);
  return [...head, '…(earlier exchanges omitted)…', ...tail].join('\n');
}

async function geminiStartText(session) {
  const prompt = [
    PERSONA,
    `Candidate name: ${session.name || 'there'}. Focus: ${session.focus}. Starting difficulty: ${session.difficulty} (current level: ${session.level}). This is exchange 0 of ${MAX_EXCHANGES}.`,
    'Task: give a warm 1–2 line intro (greet them by name, say who you are, name the focus) and then ask your FIRST question, calibrated to the starting difficulty.',
    'Reply with ONLY this JSON: {"text": "your intro + first question, spoken-style, short lines"}',
  ].join('\n');
  const parsed = parseGeminiJSON(await geminiGenerate(prompt, { maxOutputTokens: 256 }));
  if (!parsed.text) throw new Error('gemini start: missing text');
  return String(parsed.text);
}

async function geminiTurn(session, { answer, wantHint }) {
  const transcript = transcriptText(session);
  const task = wantHint
    ? 'The candidate has asked for a hint on your CURRENT question. Give a brief, kind hint (1–2 short lines) that points at the idea without giving the answer away. Do NOT ask a new question and do NOT end the interview.'
    : `The candidate just answered. Decide your next move: if their answer was shallow, partial, or wrong, probe it once with a follow-up anchored in their own words; otherwise move to a fresh question in the focus area at the adapted level. Current level: ${session.level}. This is exchange ${session.exchange} of ${MAX_EXCHANGES}${session.exchange >= MAX_EXCHANGES ? ' — the cap is reached, so wrap up warmly and set done:true' : ''}.`;
  const prompt = [
    PERSONA,
    `Focus: ${session.focus}. Starting difficulty: ${session.difficulty}. Adapted level right now: ${session.level}.`,
    task,
    'Reply with ONLY this JSON: {"feedback": "at most ONE sentence, specific to what the candidate actually said (empty string only at the very start)", "text": "your next spoken line — a follow-up, a new question, a hint, or a warm wrap-up", "done": false}',
    `Set "done": true only when you are wrapping up (exchange ${MAX_EXCHANGES} reached or a natural close); otherwise false.`,
    'Transcript so far (the candidate\'s latest answer is the last Candidate line):',
    transcript || '(interview just started)',
  ].join('\n');
  const parsed = parseGeminiJSON(await geminiGenerate(prompt, { maxOutputTokens: 384 }));
  if (!parsed.text) throw new Error('gemini turn: missing text');
  return {
    feedback: parsed.feedback ? String(parsed.feedback).slice(0, 400) : '',
    text: String(parsed.text),
    done: !!parsed.done,
  };
}

async function geminiReport(session) {
  const askedList = session.asked.length
    ? session.asked.map((a, i) => `${i + 1}. ${a.question}`).join('\n')
    : '(questions were conversational — reconstruct them from the transcript)';
  const prompt = [
    'You are Ananya, a Senior Software Engineer. The mock interview just ended — write the final report.',
    `Focus: ${session.focus}. Starting difficulty: ${session.difficulty}. Candidate: ${session.name || 'Candidate'}.`,
    'Be honest and specific: every feedback line must tie to words the candidate actually used. Score each question 0–10 (10 = hire-ready fresher answer).',
    'Questions asked (in order):',
    askedList,
    'Full transcript:',
    transcriptText(session, { maxEntries: 24, maxCharsEach: 1000 }) || '(no transcript)',
    'Reply with ONLY this JSON (no markdown, no extra keys):',
    '{"overallBand": "Strong | Good | Needs work", "overallScore": 0-100, "summary": "2-3 sentence honest summary", "perQuestion": [{"question": "the question as asked", "score": 0-10, "feedback": "one line tied to their words", "modelAnswer": "ONLY include this field for the weakest 2-3 answers — a concise model answer; omit it entirely for the rest"}], "strengths": ["short strengths"], "gaps": ["short gaps to revise"]}',
    'overallBand guide: Strong ≈ overallScore 70+, Good ≈ 40–69, Needs work < 40. Include modelAnswer for the weakest 2–3 answers ONLY.',
  ].join('\n');
  // The report is one call at the very end, so trade a little latency for
  // quality: strongest model first and a generous output budget (perQuestion
  // entries + model answers don't fit the conversational cap).
  const report = parseGeminiJSON(await geminiGenerate(prompt, {
    models: modelChain(true),
    deadlineMs: 30000,
    perAttemptMs: 20000,
    temperature: 0.5,
    maxOutputTokens: 4096,
  }));
  return normalizeReport(report);
}

function normalizeReport(report) {
  const band = ['Strong', 'Good', 'Needs work'].includes(report?.overallBand) ? report.overallBand : 'Good';
  const score = Math.max(0, Math.min(100, Math.round(Number(report?.overallScore) || 0)));
  const perQuestion = (Array.isArray(report?.perQuestion) ? report.perQuestion : []).map((q) => {
    const entry = {
      question: String(q?.question || 'Question'),
      score: Math.max(0, Math.min(10, Math.round(Number(q?.score) || 0))),
      feedback: String(q?.feedback || ''),
    };
    if (q?.modelAnswer) entry.modelAnswer = String(q.modelAnswer);
    return entry;
  });
  // Enforce "modelAnswer only for the weakest 2–3": if Gemini over-shared,
  // keep model answers only on the lowest-scored entries.
  const withModel = perQuestion.filter((q) => q.modelAnswer);
  if (withModel.length > 3) {
    const keep = new Set([...perQuestion].sort((a, b) => a.score - b.score).slice(0, 3));
    for (const q of perQuestion) if (!keep.has(q)) delete q.modelAnswer;
  }
  return {
    overallBand: band,
    overallScore: score,
    summary: String(report?.summary || ''),
    perQuestion,
    strengths: (Array.isArray(report?.strengths) ? report.strengths : []).map(String).slice(0, 6),
    gaps: (Array.isArray(report?.gaps) ? report.gaps : []).map(String).slice(0, 6),
  };
}

// ---------------------------------------------------------------------------
// Scripted fallback report: per-question entries from the asked bank items,
// scores from an answer-length heuristic only (no keyword scoring), bank
// answers attached as modelAnswer for the weakest answers.
// ---------------------------------------------------------------------------
function buildFallbackReport(session) {
  const perQuestion = session.asked.map((item, idx) => {
    const ansText = (session.qaTexts[idx] || '').trim();
    const words = wordCount(ansText);
    let score;
    if (!ansText) score = 0;
    else if (words >= 60) score = 9;
    else if (words >= 40) score = 8;
    else if (words >= 25) score = 7;
    else if (words >= 15) score = 5;
    else if (words >= 8) score = 4;
    else score = 2;
    let feedback;
    if (!ansText) feedback = 'No answer recorded for this one — worth a first attempt next time.';
    else if (words >= 40) feedback = 'Detailed answer — you gave plenty of depth here.';
    else if (words >= 20) feedback = 'A workable answer — more depth on the why would lift it further.';
    else if (words >= 8) feedback = 'Quite brief — expanding with an example would strengthen this a lot.';
    else feedback = 'Very brief — this one needs a fuller answer; see the model answer below.';
    if (isDontKnow(ansText)) feedback = 'You flagged this as unsure — exactly the one to revise first.';
    return { question: item.question, score, feedback };
  });

  const weakestCount = Math.min(3, perQuestion.length);
  const weakestIdx = perQuestion
    .map((q, i) => ({ i, score: q.score }))
    .sort((a, b) => a.score - b.score)
    .slice(0, weakestCount)
    .map((x) => x.i);
  for (const i of weakestIdx) {
    if (session.asked[i]) perQuestion[i].modelAnswer = session.asked[i].answer;
  }

  const overallScore = perQuestion.length
    ? Math.round(perQuestion.reduce((s, q) => s + q.score, 0) / perQuestion.length * 10)
    : 0;
  const overallBand = overallScore >= 65 ? 'Strong' : overallScore >= 40 ? 'Good' : 'Needs work';

  const avgWords = session.asked.length
    ? Math.round(session.qaTexts.reduce((s, t) => s + wordCount(t), 0) / session.asked.length)
    : 0;
  const summary = perQuestion.length
    ? `Offline scripted review for your ${session.focus} session (${session.exchange} exchanges, ~${avgWords} words per answer on average). Scores here come from answer depth alone, so treat them as a revision guide — run it again with the AI interviewer for word-specific feedback.`
    : 'No questions were completed in this session — start again and try to answer each one out loud, even briefly.';

  const strengths = [];
  perQuestion.forEach((q, i) => {
    if (q.score >= 7) strengths.push(`Good depth on: ${q.question}`);
  });
  if (!strengths.length && session.exchange > 0) strengths.push('You showed up and worked through the full session — consistency is half the prep.');
  const gaps = perQuestion
    .filter((q) => q.score < 5)
    .map((q) => `Expand your answer on: ${q.question}`);
  if (!gaps.length && perQuestion.length) gaps.push('No major gaps on depth — now polish accuracy against the model answers.');

  return { overallBand, overallScore, summary, perQuestion, strengths: strengths.slice(0, 6), gaps: gaps.slice(0, 6) };
}

// ---------------------------------------------------------------------------
// Scripted fallback turns
// ---------------------------------------------------------------------------
function fallbackStartText(session) {
  const first = nextBankItem(session);
  const firstQ = first ? first.question : 'Tell me about yourself — your background, your stack, and what you are preparing for.';
  return `Hi ${session.name || 'there'}, I'm Ananya, a Senior Software Engineer — great to meet you. We'll focus on ${session.focus} today, starting at ${session.difficulty === 'Easy' ? 'an' : 'a'} ${session.difficulty} level. Let's jump in: ${firstQ}`;
}

function fallbackTurn(session, answer) {
  const item = currentItem(session);
  const feedback = lengthFeedback(answer);

  if (session.exchange >= MAX_EXCHANGES) {
    return { feedback, text: "That's a great place to wrap up — thank you for your time! Your report is ready below.", done: true };
  }

  // We just answered a follow-up probe — move to a fresh question now.
  if (session.pendingFollowUp) {
    const next = nextBankItem(session);
    if (!next) return { feedback, text: "That's everything I wanted to cover — thank you! Your report is ready below.", done: true };
    return { feedback, text: next.question, done: false };
  }

  // Alternating turns: echo a snippet of their own answer, one level deeper.
  const snip = snippetOf(answer);
  if (session.exchange % 2 === 1 && snip && !isDontKnow(answer) && item) {
    session.pendingFollowUp = true;
    return { feedback, text: `You mentioned '${snip}' — can you go one level deeper on that?`, done: false };
  }

  if (isDontKnow(answer) && item) {
    const next = nextBankItem(session);
    const hint = hintFor(item);
    if (!next) return { feedback, text: `${hint} That's everything from my side — thank you! Your report is ready below.`, done: true };
    return { feedback, text: `No worries — ${hint.charAt(0).toLowerCase()}${hint.slice(1)} Let's try the next one: ${next.question}`, done: false };
  }

  const next = nextBankItem(session);
  if (!next) return { feedback, text: "That's everything I wanted to cover — thank you! Your report is ready below.", done: true };
  return { feedback, text: next.question, done: false };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
router.post('/api/interview/start', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim().slice(0, 80);
    const focus = String(req.body?.focus || '').trim();
    const difficulty = String(req.body?.difficulty || '').trim();
    if (!FOCUSES.includes(focus)) return res.status(400).json({ error: `focus must be one of: ${FOCUSES.join(', ')}` });
    if (!DIFFICULTIES.includes(difficulty)) return res.status(400).json({ error: 'difficulty must be Easy, Medium, or Hard' });

    const session = createSession({ name, focus, difficulty });

    let text;
    let aiUsed = false;
    if (hasGemini()) {
      try {
        text = await geminiStartText(session);
        aiUsed = true;
        // Keep the scripted ladder's first bank item queued too, so a later
        // Gemini failure mid-interview can fall back without losing place.
        nextBankItem(session);
      } catch (e) {
        console.warn('interviewSessions: Gemini start failed, using scripted intro:', e.message);
      }
    }
    if (!text) text = fallbackStartText(session);

    session.transcript.push({ from: 'interviewer', text });
    return res.json({ sessionId: session.id, text, aiUsed, exchange: 0 });
  } catch (e) {
    console.warn('interviewSessions start failed:', e.message);
    return res.status(500).json({ error: 'Could not start the interview — please try again.' });
  }
});

router.post('/api/interview/turn', async (req, res) => {
  try {
    const sessionId = String(req.body?.sessionId || '').trim();
    const session = sessions.get(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found — it may have expired, please start a new interview.' });
    if (session.ended) return res.status(400).json({ error: 'This interview has already ended.' });

    const wantHint = !!req.body?.wantHint;
    const answer = String(req.body?.answer || '').trim().slice(0, 4000);
    session.lastActive = Date.now();

    // Hint request: interviewer hints at the CURRENT question; it is not a
    // candidate exchange and does not advance the interview.
    if (wantHint) {
      let text;
      let aiUsed = false;
      if (hasGemini()) {
        try {
          const out = await geminiTurn(session, { answer: '', wantHint: true });
          text = out.text;
          aiUsed = true;
        } catch (e) {
          console.warn('interviewSessions: Gemini hint failed, using scripted hint:', e.message);
        }
      }
      if (!text) text = hintFor(currentItem(session));
      session.transcript.push({ from: 'interviewer', text });
      return res.json({ text, feedback: "Here's a nudge — take another go at it.", done: false, exchange: session.exchange, aiUsed });
    }

    if (!answer) return res.status(400).json({ error: 'answer is required' });

    session.transcript.push({ from: 'candidate', text: answer });
    attributeAnswer(session, answer);
    session.exchange += 1;
    adaptLevel(session, answer);

    let out;
    let aiUsed = false;
    if (hasGemini()) {
      try {
        out = await geminiTurn(session, { answer, wantHint: false });
        aiUsed = true;
      } catch (e) {
        console.warn('interviewSessions: Gemini turn failed, using scripted turn:', e.message);
      }
    }
    if (!out) out = fallbackTurn(session, answer);

    // Hard cap: 12 candidate exchanges, whatever the brain decided.
    const done = !!out.done || session.exchange >= MAX_EXCHANGES;
    const text = String(out.text || '');
    session.transcript.push({ from: 'interviewer', text });
    if (done) session.ended = true;
    return res.json({ text, feedback: out.feedback ? String(out.feedback) : '', done, exchange: session.exchange, aiUsed });
  } catch (e) {
    console.warn('interviewSessions turn failed:', e.message);
    return res.status(500).json({ error: 'Something went wrong on that turn — please try again.' });
  }
});

router.post('/api/interview/end', async (req, res) => {
  try {
    const sessionId = String(req.body?.sessionId || '').trim();
    const session = sessions.get(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found — it may have expired, please start a new interview.' });
    session.lastActive = Date.now();
    session.ended = true;

    let report;
    let aiUsed = false;
    if (hasGemini()) {
      try {
        report = await geminiReport(session);
        aiUsed = true;
      } catch (e) {
        console.warn('interviewSessions: Gemini report failed, using scripted report:', e.message);
      }
    }
    if (!report) report = buildFallbackReport(session);
    return res.json({ report, aiUsed });
  } catch (e) {
    console.warn('interviewSessions end failed:', e.message);
    return res.status(500).json({ error: 'Could not build your report — please try again.' });
  }
});

module.exports = router;
module.exports.probeAi = probeAi;
