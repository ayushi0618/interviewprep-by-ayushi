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

### Capacity estimation without fear (small, real numbers)

Interviewers don't want precision — they want to see you *bound* the problem. Use round numbers and say your assumptions out loud. For a fresher URL shortener, this is a complete, respectable estimate:

```text
Writes: 1,000 new links/day ≈ 1 link every ~90 seconds (trivial)
Reads: 100× writes = 100,000 clicks/day ≈ 1–2 requests/second average
Peak: assume 10× average → ~20 req/sec (one small server handles this easily)
Storage: 1,000 links/day × 365 days × ~500 bytes ≈ 180 MB/year (tiny)
Conclusion: this fits on ONE server + ONE database — we add cache/LB only if traffic grows
```

Three habits make any estimate sound senior: state the read/write ratio, convert "per day" into "per second" (that's what servers feel), and end with a *conclusion* about what the numbers let you skip. If your estimate shows one server is enough, proudly design one server — matching the design to the numbers is the skill being tested.

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

Each box also has a failure you should be able to name — interviewers test this right after the happy path. If the cache dies, answers get slower but stay correct (the database still has everything). If one app server dies, the load balancer routes around it *provided your servers are stateless* — the moment a server keeps sessions in its own memory, that promise breaks. If the database dies, you have a real outage — which is why replication exists, and why you save chat messages *before* delivering them. Naming what breaks, and what the user notices, is the difference between a diagram and a design.

> [!NOTE]
> **Under the hood:** "stateless server" means every request carries everything needed to serve it (usually a token), and nothing user-specific lives only in one machine's memory. That single property is what makes load balancing, auto-scaling, and surviving a dead server possible.

### SQL vs NoSQL — choosing at design time

| Pick SQL when… | Pick NoSQL when… |
|---|---|
| Data is relational (users ↔ orders ↔ payments) | Data is document-shaped (posts, product catalogs) |
| You need JOINs and strict consistency | Schema changes often or varies per record |
| Examples: bookings, billing, inventory | Examples: feeds, chat messages, user content |

> [!NOTE]
> **One-line interview answer:** "I choose by data shape: fixed, relational, consistency-critical data goes to SQL; flexible, document-shaped data goes to NoSQL. When unsure for a fresher-scale app, I start with SQL — it's the safer default."

Apply it to this file's two designs so the rule stops being abstract: the URL shortener's `short_code → long_url` pair is fixed-shape and relational by nature, so a tiny SQL table with a unique index on `short_code` is the natural home. Chat messages are single, self-contained documents (`sender, receiver, text, time`) that never need a JOIN to be useful, so a document store like MongoDB fits — but at fresher scale an SQL table answers the same queries, and saying "either works here, I'd pick by team familiarity" is more honest than brand loyalty. Interviewers are scoring the *reasoning order* — shape first, product second.

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

### How to say it — minute by minute

Minute 1 (clarify, don't draw yet): *"Before I design, three quick checks — should links expire or live forever? Roughly how many new links per day, and is it read-heavy? Do we need click analytics, or just redirects?"* You've shown product thinking before touching architecture.

Minute 3 (high-level, keep it small): *"Given ~1,000 writes and ~100,000 reads a day, I'll start deliberately simple: one API server and one database with a `short_code → long_url` table. POST creates a code from an auto-increment ID encoded in Base62, GET looks it up and returns a 302. At this scale that's genuinely enough."* Naming the numbers proves the simplicity is a decision, not a gap.

Minute 5 (deep-dive where it earns marks): *"The interesting part is read load. Clicks repeat the same hot codes, so I'll cache code→URL pairs in Redis — most redirects never touch the database. If traffic outgrows one server, I put stateless copies behind a load balancer; the database and cache stay shared, so scaling the servers is trivial."* You ends on the bottleneck *and* its fix, which is exactly the note the interviewer writes down.

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

### How to say it — minute by minute

Minute 1 (clarify the scope): *"Is this 1-to-1 only or groups too? Must messages arrive if the receiver is offline, or is best-effort okay? Are we storing history, or is it ephemeral like Snapchat?"* Each answer removes a whole branch of design — that *is* the work.

Minute 3 (core flow, durability first): *"Each user keeps one open WebSocket to the server. When Ayesha sends a message, my server saves it to the database first, then pushes it to Rohan if he's online. If he's offline, nothing is lost — he fetches unread messages on his next login. Durability before delivery."* That ordering sentence is the one interviewers circle.

Minute 5 (numbers + the honest limit): *"At fresher scale — say 10,000 users sending 20 messages a day — that's 200,000 small rows a day, nothing for one database, and 10,000 concurrent connections is already where one server sweats. So my scale-up path is: load balancer that understands WebSockets, plus a pub/sub layer so any server can reach a user connected to any other. I'd name that limit now rather than pretend one box holds everyone."*

Small capacity check to keep in your pocket: messages are tiny (~200 bytes), so even 200k/day is ~40 MB/day of storage — trivial to store, which is why you can afford the save-first design. Do the arithmetic out loud; rough-and-right beats precise-and-silent.

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

Quick self-test before any interview — cover the right column and recite:

- Cache → "what repeats?" Hot reads live in memory.
- Load Balancer → "who's the door?" One entry, many identical servers.
- CDN → "what's static?" Files served from near the user.
- Sharding → "what's too big?" Split by key across machines.
- Replication → "what if it dies?" Copies; primary writes, replicas read.

> [!NOTE]
> **One-line interview answer:** "Scale reads with caching and replicas, scale traffic with a load balancer and stateless servers, and shard only when one database truly can't hold or serve the data."

### Where exactly does each box sit? Trace one request

Follow a single click on your URL shortener and watch each box take its turn:

```text
1. Browser asks DNS for sho.rt → connects to the LOAD BALANCER (the only public door)
2. Load balancer picks the least-busy API server and forwards the request
3. Static assets (logo, CSS) never reach your server — the CDN already served
   cached copies from a machine near the user
4. API server checks the CACHE (Redis): "aB3xK9 → long URL?" — hit → answer now
5. Cache miss → query the DATABASE → store the pair in cache → 302 redirect
6. Next 10,000 clicks on aB3xK9 repeat steps 1–4 only. The DB rests.
```

Each box earns its place in that trace: the CDN absorbs static traffic before it costs you anything, the load balancer makes your servers replaceable, the cache absorbs repeat reads, and the database — your source of truth — only handles what nobody has cached yet. If an interviewer points at any box and asks "why is this here?", retrace the request and show the step that disappears without it. No step, no box.

> [!WARNING]
> **Common mistake:** drawing a cache, CDN, and load balancer into a design for 100 users "for scalability." Every box you add is a box you must operate and explain. Add each piece only when your capacity numbers show the simpler design straining.

### The 10× question, answered in order

"Your app just got 10× traffic" is a scripted follow-up — answer it as a sequence, not a shopping list:

```text
Step 1: MEASURE — which box is hot? (CPU? DB queries? bandwidth?)
Step 2: CACHE the hottest reads (usually removes 80–90% of repeat DB load)
Step 3: SCALE servers horizontally behind the load balancer (stateless → trivial)
Step 4: REPLICAS if the database is still the wall (reads spread, writes stay primary)
Step 5: SHARD only when one database cannot hold or serve the data at all
```

Notice what is *not* on the list: rewriting into microservices. Scaling is about relieving the measured bottleneck one cheap step at a time, and saying "I'd measure first, because the obvious guess is wrong half the time" is a genuinely senior sentence. Each step also maps to a glossary word above — use their names.

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

A closing habit that ties this whole file together: after any design, volunteer your own bottleneck before the interviewer finds it. One honest sentence — "the single database is my limit today; if writes grow 100× I'd shard by user_id, and if reads grow I'd add replicas behind the cache" — converts every weakness into evidence you were thinking like an engineer the whole time. Interviewers remember candidates who grade themselves accurately.

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
