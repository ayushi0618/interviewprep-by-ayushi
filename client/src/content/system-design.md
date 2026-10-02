# 🏗️ System Design for Freshers — Complete Interview Notes

System design sounds like a senior-engineer topic, but fresher interviews ask it too — usually as "How would you build a URL shortener?" or "Design a simple chat app." You are not expected to design Google. You are expected to think out loud, in order, without panicking. This file gives you that order, plus the handful of building blocks every beginner design needs.

> 📚 Part of **InterviewPrep by Ayushi Singh** — my complete interview-preparation series for final-year students and freshers. Read one topic a day, say the answers out loud, and walk in ready.

---

## 📌 1. How to Approach ANY Design Question

Interviewers grade your **process**, not a perfect final diagram. Use the same four steps every time — it calms you down and makes you sound structured.

| Step | Do this | Say this |
|---|---|---|
| **1. Clarify** | Ask about features, users, scale | "Should links expire? How many users are we expecting?" |
| **2. Estimate lightly** | Rough numbers only — no calculator marathons | "Say 1,000 new links a day, reads are 100× writes." |
| **3. High-level boxes** | Draw client → server → database, add pieces as needed | "Start simple: one API server and one database." |
| **4. Deep dive one part** | Pick ONE interesting piece and go deeper | "The tricky part is generating short, unique IDs — let me explain options." |

> [!IMPORTANT]
> **Never start drawing immediately.** The first two minutes of clarifying questions are free marks — they show you won't build the wrong thing. A design that ignores the requirements fails no matter how fancy the diagram is.

> [!NOTE]
> **One-line interview answer:** "First I clarify the requirements and scale, then sketch the high-level components, and only then deep-dive into one core piece like ID generation or message delivery."

🎤 What the interviewer actually asks: "Design a URL shortener." They are really asking: *can you break a vague problem into pieces and make sensible trade-offs?* The four steps above are the whole game at fresher level.

---

## 🧰 2. The Box Vocabulary

You only need seven boxes for almost every fresher design. One line each — that's all you must be able to say.

| Box | One-line job |
|---|---|
| **Client** | The browser or mobile app the user touches; sends requests, shows responses. |
| **Server (API)** | Your backend code — receives requests, applies logic, talks to storage, replies. |
| **Database** | Permanent storage that survives restarts; source of truth for your data. |
| **Cache** | Fast in-memory copy (e.g., Redis) of hot data, so repeated reads skip the database. |
| **Load Balancer** | Front door that spreads incoming traffic evenly across many server copies. |
| **CDN** | Copies of static files (images, JS, CSS) stored near users worldwide for fast loading. |
| **Queue** | A waiting line for slow jobs (emails, video processing) so users don't wait on them. |

> [!TIP]
> Draw in this order: Client → Load Balancer → Servers → Cache/Database, with a Queue hanging off the server for slow work. If you can draw that and explain each arrow, you can survive most fresher design rounds.

### SQL vs NoSQL — choosing at design time

| Pick SQL when… | Pick NoSQL when… |
|---|---|
| Data is relational (users ↔ orders ↔ payments) | Data is document-shaped (posts, product catalogs) |
| You need JOINs and strict consistency | Schema changes often or varies per record |
| Examples: bookings, billing, inventory | Examples: feeds, chat messages, user content |

> [!NOTE]
> **One-line interview answer:** "I choose by data shape: fixed, relational, consistency-critical data goes to SQL; flexible, document-shaped data goes to NoSQL. When unsure for a fresher-scale app, I start with SQL — it's the safer default."

🎤 What the interviewer actually asks: "SQL or NoSQL for this?" — Never answer with a brand name first. Answer with the data shape, then the name.

---

## ✂️ 3. Worked Walkthrough 1 — URL Shortener

**Clarify first:** Shorten a long URL → get a short link → visiting it redirects to the original. Scale: reads heavily outnumber writes (people click links far more than they create them).

### API

```text
POST /shorten        body: { "longUrl": "https://very-long-link..." }
                     → 201 { "shortUrl": "https://sho.rt/aB3xK9" }

GET  /aB3xK9         → 302 Redirect to the long URL
                     → 404 if the code doesn't exist
```

### Storage — one tiny table

| short_code (PK) | long_url | created_at |
|---|---|---|
| `aB3xK9` | `https://very-long-link...` | 2026-10-01 |

### How short codes are generated

| Option | Idea | Trade-off |
|---|---|---|
| **Auto-increment ID → Base62** | Row id 12345 → encode in `a-zA-Z0-9` → short code | Simple, no collisions; codes are predictable (fine for most cases) |
| **Random string + retry** | Generate 6 random chars; if taken, regenerate | Unpredictable; needs a uniqueness check on insert |
| **Hash of the URL (MD5, first 6–7 chars)** | Same URL → same code automatically | Collisions possible when two URLs share the prefix — must handle |

> [!WARNING]
> **Don't suggest hashing the URL and stopping there.** Two different URLs can collide on the same 6 characters. Always say: "I'd check for a collision and retry or extend the code." That one sentence is the difference between a memorised answer and an engineered one.

### Redirect flow

```text
User clicks sho.rt/aB3xK9
  → Load balancer → API server
  → Check cache: code → long URL?  (most clicks end here)
  → Miss? Query database, then store the pair in cache
  → Reply 302 with Location: <long URL>
```

**One scaling note:** Because reads dominate, cache the hottest codes in Redis and let the database handle only cache misses. If writes ever grow, multiple app servers behind the load balancer share the same database — the app servers themselves stay stateless.

🎤 What the interviewer actually asks: "What if two people shorten the same URL?" — Perfectly fine either way: two codes pointing to one URL, or dedupe by checking for an existing row first. Name the behaviour; don't freeze.

---

## 💬 4. Worked Walkthrough 2 — Simple Chat App

**Clarify first:** One-to-one chats? Group chats? Must messages survive if the user is offline? For a fresher design: 1-to-1 + history is enough.

### Why WebSockets

Normal HTTP is request–response: the client must keep asking "any new messages?" That polling wastes battery and still feels laggy. A **WebSocket** is one connection that stays open, so the server can *push* a message the instant it arrives.

```text
REST (polling):   client ──"new?"──▶ server   (every few seconds, mostly "no")
WebSocket:        client ════════════ server   (open line; server speaks first when news arrives)
```

### Message flow

```text
1. Ayesha sends "hi" over her open WebSocket
2. Server receives it → saves it to the database FIRST
3. Server looks up: is Rohan online? → push "hi" down his WebSocket
4. Rohan offline? → message waits in the DB; he fetches unread on next login
```

### Storage

```text
messages(id, sender_id, receiver_id, text, sent_at)
```

- One row per message; query by `(sender_id, receiver_id, sent_at)` to load a conversation.
- Saving **before** delivering is the key decision: if the server crashes mid-send, no message is lost.

> [!IMPORTANT]
> **Durability before delivery.** Always say "I store the message first, then push it." Interviewers listen for exactly this — it shows you think about failure, not just the happy path.

**One honest limit to state:** A single server can hold only so many open WebSockets. At real scale you'd add a load balancer that understands WebSockets and a pub/sub layer so Server A can reach a user connected to Server B. Naming the limit (without solving all of it) is peak fresher-level maturity.

---

## 📖 5. Scaling Words Glossary

Learn these five cold — one line each. This is 80% of the "scaling" vocabulary in fresher interviews.

| Word | One-line meaning |
|---|---|
| **Cache** | Keep hot data in fast memory (Redis) so repeated reads skip the slow database. |
| **Load Balancer** | One front door that spreads traffic across many identical servers, and routes around dead ones. |
| **CDN** | Static files copied to servers near the user, so an image loads from their city, not yours. |
| **Sharding** | Split one huge database into pieces by a key (e.g., user_id) across machines — each holds a slice. |
| **Replication** | Keep copies of the database; writes go to the primary, reads can spread across replicas. |

> [!TIP]
> **Vertical vs horizontal scaling** is the favourite follow-up: "Vertical = a bigger machine (simple, hits a ceiling). Horizontal = more machines (needs a load balancer, scales much further)." Say both halves.

> [!NOTE]
> **One-line interview answer:** "Scale reads with caching and replicas, scale traffic with a load balancer and stateless servers, and shard only when one database truly can't hold or serve the data."

---

## 🚫 6. What Freshers Should NOT Do

| Mistake | Why it backfires | Do this instead |
|---|---|---|
| **Over-engineering** | Kubernetes + 5 databases for 100 users signals no judgment | Start with one server + one database; scale only the proven bottleneck |
| **Jumping to microservices** | Turns one simple app into ten services that must talk over a network | Build a clean monolith first; split only when a part outgrows the rest |
| **Skipping the clarify step** | You design the wrong product beautifully | Ask 3–4 questions before drawing anything |
| **Claiming "it scales infinitely"** | Every real system has a bottleneck; hiding yours looks naive | Name one limit and one fix ("single DB is the bottleneck; I'd add read replicas") |
| **Deep-diving everything** | You run out of time and finish nothing | Sketch all boxes quickly, then go deep on ONE interesting part |

> [!WARNING]
> **The golden rule:** a simple design you can fully explain beats a complex diagram you memorised. If you can't say *why* a box exists, delete the box.

---

## 🎤 Mock Interview Questions — System Design

Practice saying these **out loud**. Each answer is 2–4 lines — the length you can actually speak in an interview.

**1. How would you design a URL shortener?**
> First I'd clarify scale and whether links expire. Then a simple API — POST creates a short code from an auto-increment ID encoded in Base62, GET redirects with a 302. I'd cache hot codes in Redis since reads dominate, and store code-to-URL pairs in one small table.

**2. How do you generate short, unique codes without collisions?**
> The simplest reliable way is an auto-increment database ID encoded in Base62 — uniqueness is guaranteed by the ID itself. Random strings also work but need a collision check and retry on insert. Pure hashing can collide between different URLs, so I wouldn't rely on it alone.

**3. SQL or NoSQL for a chat app — and why?**
> The data is document-shaped and the schema is simple, so NoSQL like MongoDB works well for messages. But honestly, SQL is equally fine at this scale — messages fit a table with sender, receiver, and timestamp. I'd pick based on team familiarity and say so; the shape matters more than the brand.

**4. Why WebSockets for chat instead of normal HTTP requests?**
> With HTTP polling the client keeps asking "any new messages?" every few seconds, wasting battery and still feeling laggy. A WebSocket keeps one connection open so the server pushes a message the moment it arrives. That's the difference between "near-real-time" and actually real-time.

**5. Your app suddenly gets 10× traffic. What's your first move?**
> Find the bottleneck before touching anything — usually it's the database or one slow endpoint. Then the cheapest wins: cache hot reads, add a load balancer with stateless app servers, and add read replicas if the database is the limit. I wouldn't rewrite anything until I knew what was actually slow.

**6. What does a load balancer actually do?**
> It's the single front door for traffic. It spreads requests evenly across multiple server copies, and if one server dies it routes around it. It only works if the servers are stateless — no user data stored on just one machine.

**7. Cache vs database — when does data live in each?**
> The database is the permanent source of truth; everything is saved there first. The cache holds temporary copies of frequently read data in memory for speed. If the cache dies, we lose speed, not data — that's the line I always state.

**8. What's the difference between vertical and horizontal scaling?**
> Vertical scaling means a bigger machine — more RAM and CPU — which is simple but hits a hard ceiling. Horizontal scaling means more machines behind a load balancer, which scales much further but needs stateless services. I start vertical for simplicity and go horizontal when traffic demands it.

---

## ✅ 60-Second Revision Checklist

- [ ] **Approach** — Clarify → estimate lightly → draw high-level boxes → deep-dive ONE part
- [ ] **Never draw first** — 2 minutes of questions shows you won't build the wrong thing
- [ ] **Seven boxes** — Client, Server, Database, Cache, Load Balancer, CDN, Queue — one line each
- [ ] **SQL vs NoSQL** — answer with data shape first, brand name second; SQL is the safe default
- [ ] **URL shortener** — POST creates, GET redirects (302); Base62 of auto-increment ID = no collisions; cache the hot codes
- [ ] **Chat app** — WebSocket = server can push; store the message BEFORE delivering it
- [ ] **Scaling words** — Cache (hot data in memory), Load Balancer (spread traffic), CDN (files near users), Sharding (split the DB), Replication (copies of the DB)
- [ ] **Vertical vs horizontal** — bigger machine vs more machines; horizontal needs stateless servers
- [ ] **Don't over-engineer** — monolith first, microservices only when earned; name one bottleneck and one fix
- [ ] **Explain or delete** — if you can't say why a box exists, remove it from the diagram
