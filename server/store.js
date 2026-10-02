// store.js — persistence for accounts + progress, behind ONE async
// interface with two interchangeable backends:
//
//   • MongoDB (mongoose) when MONGO_URI is set AND reachable — the
//     production home (users + progress collections).
//   • Local JSON file (server/data/users.json) otherwise — zero-config
//     dev fallback. Also the safety net: if Mongo is configured but
//     unreachable at boot, we log it and fall back instead of crashing.
//
// Every method is async in both backends so callers never care which is
// live. `init()` resolves (never rejects) once the mode is chosen; the
// boot log states the mode clearly.
const fs = require('fs');
const path = require('path');

let mode = 'starting'; // 'mongo' | 'json'
let impl = null;
let readyPromise = null;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

// ---------------------------------------------------------------------------
// JSON file backend
// ---------------------------------------------------------------------------
function createJsonStore() {
  let db = null;

  function load() {
    if (db) return db;
    try {
      db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
      db = { users: [], progress: {} };
    }
    if (!Array.isArray(db.users)) db.users = [];
    if (!db.progress || typeof db.progress !== 'object') db.progress = {};
    return db;
  }

  function persist() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(load(), null, 2));
    fs.renameSync(tmp, DATA_FILE); // atomic-ish: no half-written file
  }

  const toUser = (u) => (u ? { id: u.id, name: u.name, email: u.email, passHash: u.passHash, createdAt: u.createdAt } : null);

  return {
    async findUserByEmail(email) {
      return toUser(load().users.find((u) => u.email === email) || null);
    },
    async findUserById(id) {
      return toUser(load().users.find((u) => u.id === id) || null);
    },
    async createUser({ name, email, passHash }) {
      const data = load();
      if (data.users.some((u) => u.email === email)) {
        const err = new Error('duplicate email');
        err.code = 'DUPLICATE_EMAIL';
        throw err;
      }
      const user = {
        id: `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        name, email, passHash, createdAt: new Date().toISOString(),
      };
      data.users.push(user);
      persist();
      return toUser(user);
    },
    async updateUserName(id, name) {
      const data = load();
      const u = data.users.find((x) => x.id === id);
      if (!u) return null;
      u.name = name;
      persist();
      return toUser(u);
    },
    async updateUserPassword(id, passHash) {
      const data = load();
      const u = data.users.find((x) => x.id === id);
      if (!u) return false;
      u.passHash = passHash;
      persist();
      return true;
    },
    async getProgress(userId) {
      return load().progress[userId] || null;
    },
    async saveProgress(userId, progress, liveSessionsMeta) {
      const data = load();
      data.progress[userId] = {
        progress,
        liveSessionsMeta: liveSessionsMeta || null,
        updatedAt: new Date().toISOString(),
      };
      persist();
      return data.progress[userId];
    },
  };
}

// ---------------------------------------------------------------------------
// MongoDB backend (mongoose)
// ---------------------------------------------------------------------------
function createMongoStore(mongoose) {
  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  });
  const progressSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    progress: { type: mongoose.Schema.Types.Mixed, default: {} },
    liveSessionsMeta: { type: mongoose.Schema.Types.Mixed, default: null },
    updatedAt: { type: Date, default: Date.now },
  });
  const User = mongoose.models.IpUser || mongoose.model('IpUser', userSchema);
  const Progress = mongoose.models.IpProgress || mongoose.model('IpProgress', progressSchema);

  const toUser = (u) => (u ? {
    id: String(u._id), name: u.name, email: u.email, passHash: u.passHash,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
  } : null);

  return {
    async findUserByEmail(email) { return toUser(await User.findOne({ email })); },
    async findUserById(id) { return toUser(await User.findById(id).catch(() => null)); },
    async createUser({ name, email, passHash }) {
      try {
        return toUser(await User.create({ name, email, passHash }));
      } catch (e) {
        if (e && e.code === 11000) { const err = new Error('duplicate email'); err.code = 'DUPLICATE_EMAIL'; throw err; }
        throw e;
      }
    },
    async updateUserName(id, name) {
      return toUser(await User.findByIdAndUpdate(id, { name }, { new: true }).catch(() => null));
    },
    async updateUserPassword(id, passHash) {
      const u = await User.findByIdAndUpdate(id, { passHash }).catch(() => null);
      return Boolean(u);
    },
    async getProgress(userId) {
      const doc = await Progress.findOne({ userId });
      return doc ? { progress: doc.progress || {}, liveSessionsMeta: doc.liveSessionsMeta || null, updatedAt: doc.updatedAt } : null;
    },
    async saveProgress(userId, progress, liveSessionsMeta) {
      const doc = await Progress.findOneAndUpdate(
        { userId },
        { progress, liveSessionsMeta: liveSessionsMeta || null, updatedAt: new Date() },
        { new: true, upsert: true },
      );
      return { progress: doc.progress, liveSessionsMeta: doc.liveSessionsMeta, updatedAt: doc.updatedAt };
    },
  };
}

// ---------------------------------------------------------------------------
// init — pick the backend once, never crash the server over storage.
// ---------------------------------------------------------------------------
function init() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    const uri = process.env.MONGO_URI;
    if (uri) {
      try {
        // Required lazily so JSON-mode boots never even load mongoose.
        const mongoose = require('mongoose');
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000, connectTimeoutMS: 4000 });
        impl = createMongoStore(mongoose);
        mode = 'mongo';
        console.log('💾 Progress store: MongoDB (MONGO_URI)');
        return impl;
      } catch (e) {
        console.warn(`⚠️  MongoDB unreachable (${e.message}) — falling back to local JSON store.`);
      }
    } else {
      console.log('💾 Progress store: local JSON file (server/data/users.json) — set MONGO_URI for MongoDB.');
    }
    impl = createJsonStore();
    mode = 'json';
    return impl;
  })();
  return readyPromise;
}

// Handlers await this; it resolves to the live impl (post-fallback).
async function store() {
  await init();
  return impl;
}

module.exports = { init, store, mode: () => mode };
