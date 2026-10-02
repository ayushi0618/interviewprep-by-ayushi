// auth.js — accounts, sessions and progress sync API.
//
//   POST /api/auth/signup   { name, email, password } → { token, user }
//   POST /api/auth/login    { email, password }       → { token, user }
//   GET  /api/progress      (Bearer) → { progress, liveSessionsMeta, updatedAt }
//   PUT  /api/progress      (Bearer) { progress, liveSessionsMeta } → saved
//   GET  /api/profile       (Bearer) → { name, email, createdAt, stats }
//   PUT  /api/profile       (Bearer) { name } → { user }
//   PUT  /api/profile/password (Bearer) { currentPassword, newPassword }
//
// Passwords are bcrypt-hashed (bcryptjs — no native builds); plain text
// is never stored or returned. Sessions are JWTs (7 days). If JWT_SECRET
// is unset we generate a random dev secret + warn (tokens then reset on
// server restart — fine for local dev, set the env var in production).
// A simple in-memory counter rate-limits the auth routes per IP.
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let devSecretWarned = false;
function jwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (!jwtSecret.dev) {
    jwtSecret.dev = crypto.randomBytes(32).toString('hex');
    if (!devSecretWarned) {
      devSecretWarned = true;
      console.warn('⚠️  JWT_SECRET not set — using a random dev secret (logins reset on server restart).');
    }
  }
  return jwtSecret.dev;
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, jwtSecret(), { expiresIn: '7d' });
}

function publicUser(user) {
  return { name: user.name, email: user.email, createdAt: user.createdAt };
}

// Whitelist + light shape-check for synced progress so a client can never
// store arbitrary blobs against an account.
function sanitizeProgress(input) {
  const p = input && typeof input === 'object' ? input : {};
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const problems = {};
  for (const [id, e] of Object.entries(obj(p.problems))) {
    if (!e || typeof e !== 'object') continue;
    problems[id] = {
      solved: Boolean(e.solved),
      attempts: Number(e.attempts) || 0,
      lastCode: typeof e.lastCode === 'string' ? e.lastCode.slice(0, 20000) : '',
      solvedAt: e.solvedAt || null,
    };
  }
  const plans = {};
  for (const [planId, items] of Object.entries(obj(p.plans))) {
    if (!items || typeof items !== 'object') continue;
    plans[planId] = {};
    for (const [k, v] of Object.entries(items)) if (v) plans[planId][k] = true;
  }
  const chapters = {};
  for (const [topic, chs] of Object.entries(obj(p.chapters))) {
    if (!chs || typeof chs !== 'object' || Array.isArray(chs)) continue;
    const clean = {};
    for (const [c, v] of Object.entries(chs)) clean[String(c).slice(0, 120)] = Number(v) || 0;
    chapters[String(topic).slice(0, 60)] = clean;
  }
  return {
    articles: obj(p.articles),
    chapters,
    problems,
    plans,
    planStart: obj(p.planStart),
  };
}

function sanitizeLiveMeta(input) {
  if (!input || typeof input !== 'object') return null;
  return {
    taken: Number(input.taken) || 0,
    bestBand: typeof input.bestBand === 'string' ? input.bestBand.slice(0, 40) : null,
    bestScore: Number(input.bestScore) || 0,
    lastDate: typeof input.lastDate === 'string' ? input.lastDate.slice(0, 40) : null,
  };
}

// Stats for the profile page, computed from the stored progress.
function computeStats(saved) {
  const p = saved?.progress || {};
  const problems = Object.values(p.problems || {});
  const meta = saved?.liveSessionsMeta || null;
  return {
    articlesCompleted: Object.keys(p.articles || {}).length,
    problemsSolved: problems.filter((x) => x.solved).length,
    problemsAttempted: problems.filter((x) => (x.attempts || 0) > 0).length,
    plansStarted: Object.keys(p.planStart || {}).length,
    planItemsDone: Object.values(p.plans || {}).reduce((n, items) => n + Object.keys(items || {}).length, 0),
    liveSessionsTaken: meta?.taken || 0,
    liveBestBand: meta?.bestBand || null,
    liveBestScore: meta?.bestScore || 0,
    progressUpdatedAt: saved?.updatedAt || null,
  };
}

// Basic per-IP rate limit for auth routes: 30 requests / 10 minutes.
function makeRateLimit() {
  const hits = new Map(); // ip → { count, resetAt }
  const LIMIT = 30;
  const WINDOW = 10 * 60 * 1000;
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    const entry = hits.get(key);
    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + WINDOW });
      return next();
    }
    entry.count += 1;
    if (entry.count > LIMIT) {
      return res.status(429).json({ error: 'Too many attempts — please wait a few minutes and try again.' });
    }
    return next();
  };
}

function createAuthRouter({ store, storeReady }) {
  const router = express.Router();
  const ready = async (_req, res, next) => {
    try { await storeReady; next(); } catch { res.status(503).json({ error: 'Storage is warming up — try again in a second.' }); }
  };
  router.use(ready);

  const db = () => store.store();

  async function authRequired(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Please log in first.' });
    try {
      const payload = jwt.verify(token, jwtSecret());
      const user = await (await db()).findUserById(payload.sub);
      if (!user) return res.status(401).json({ error: 'Session expired — please log in again.' });
      req.user = user;
      return next();
    } catch {
      return res.status(401).json({ error: 'Session expired — please log in again.' });
    }
  }

  const rateLimit = makeRateLimit();

  router.post('/auth/signup', rateLimit, async (req, res) => {
    try {
      const name = String(req.body?.name || '').trim();
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      if (name.length < 2) return res.status(400).json({ error: 'Please add your name (at least 2 characters).' });
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'That email doesn’t look right — check it and try again.' });
      if (password.length < 6) return res.status(400).json({ error: 'Password needs at least 6 characters.' });
      const s = await db();
      if (await s.findUserByEmail(email)) {
        return res.status(409).json({ error: 'An account with this email already exists — try logging in instead.' });
      }
      const passHash = await bcrypt.hash(password, 10);
      const user = await s.createUser({ name, email, passHash });
      return res.status(201).json({ token: signToken(user), user: publicUser(user) });
    } catch (e) {
      if (e.code === 'DUPLICATE_EMAIL') return res.status(409).json({ error: 'An account with this email already exists — try logging in instead.' });
      console.error('signup failed:', e.message);
      return res.status(500).json({ error: 'Something went wrong creating your account. Please try again.' });
    }
  });

  router.post('/auth/login', rateLimit, async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      if (!EMAIL_RE.test(email) || !password) return res.status(400).json({ error: 'Add your email and password to log in.' });
      const s = await db();
      const user = await s.findUserByEmail(email);
      const ok = user ? await bcrypt.compare(password, user.passHash) : false;
      if (!ok) return res.status(401).json({ error: 'Email or password doesn’t match. Try again.' });
      return res.json({ token: signToken(user), user: publicUser(user) });
    } catch (e) {
      console.error('login failed:', e.message);
      return res.status(500).json({ error: 'Something went wrong logging you in. Please try again.' });
    }
  });

  router.get('/progress', authRequired, async (req, res) => {
    try {
      const saved = await (await db()).getProgress(req.user.id);
      return res.json({
        progress: saved?.progress || { articles: {}, chapters: {}, problems: {}, plans: {}, planStart: {} },
        liveSessionsMeta: saved?.liveSessionsMeta || null,
        updatedAt: saved?.updatedAt || null,
      });
    } catch (e) {
      console.error('progress get failed:', e.message);
      return res.status(500).json({ error: 'Could not load your progress right now.' });
    }
  });

  router.put('/progress', authRequired, async (req, res) => {
    try {
      const progress = sanitizeProgress(req.body?.progress);
      const liveSessionsMeta = sanitizeLiveMeta(req.body?.liveSessionsMeta);
      const saved = await (await db()).saveProgress(req.user.id, progress, liveSessionsMeta);
      return res.json({ ok: true, updatedAt: saved.updatedAt });
    } catch (e) {
      console.error('progress save failed:', e.message);
      return res.status(500).json({ error: 'Could not save your progress right now.' });
    }
  });

  router.get('/profile', authRequired, async (req, res) => {
    try {
      const saved = await (await db()).getProgress(req.user.id);
      return res.json({ ...publicUser(req.user), stats: computeStats(saved) });
    } catch (e) {
      console.error('profile failed:', e.message);
      return res.status(500).json({ error: 'Could not load your profile right now.' });
    }
  });

  router.put('/profile', authRequired, async (req, res) => {
    try {
      const name = String(req.body?.name || '').trim();
      if (name.length < 2) return res.status(400).json({ error: 'Name needs at least 2 characters.' });
      const user = await (await db()).updateUserName(req.user.id, name);
      if (!user) return res.status(404).json({ error: 'Account not found.' });
      return res.json({ user: publicUser(user) });
    } catch (e) {
      console.error('profile update failed:', e.message);
      return res.status(500).json({ error: 'Could not update your profile right now.' });
    }
  });

  router.put('/profile/password', authRequired, async (req, res) => {
    try {
      const current = String(req.body?.currentPassword || '');
      const next = String(req.body?.newPassword || '');
      if (next.length < 6) return res.status(400).json({ error: 'New password needs at least 6 characters.' });
      const ok = await bcrypt.compare(current, req.user.passHash);
      if (!ok) return res.status(401).json({ error: 'Current password doesn’t match.' });
      const passHash = await bcrypt.hash(next, 10);
      await (await db()).updateUserPassword(req.user.id, passHash);
      return res.json({ ok: true });
    } catch (e) {
      console.error('password change failed:', e.message);
      return res.status(500).json({ error: 'Could not change your password right now.' });
    }
  });

  return router;
}

module.exports = { createAuthRouter };
