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

### The four steps on a clock — a 90-second chat-app sketch

Watch the steps fire in order on a fresh prompt, "Design a simple chat app":

```text
Clarify (≈20 sec): "1-to-1 or groups? Must messages wait for an offline user,
or is best-effort fine? Roughly how many users?"
Estimate (≈20 sec): "Say 10,000 users, 20 messages a day each — 200,000 small
messages a day. One server and one database are honestly enough to start."
Boxes (≈30 sec): client → API server → database; one WebSocket per online user
so the server can push. (The full flow lives in Section 4 — here you only name the boxes.)
Deep-dive (≈20 sec): pick ONE: "The part I'd dig into is delivery — I save each
message before pushing it, so a crash mid-send loses nothing."
```

Notice what did *not* happen: no load balancer, no sharding, no second database — because the estimate said 200k tiny messages a day. If the interviewer then says "now make it a million users," *that* is when the extra boxes earn their place. The flow is the skill; the boxes are just vocabulary.


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

### How each mistake sounds from the other side of the table

- **Over-engineering** — the interviewer hears: "this candidate adds machinery to look senior." *Say instead:* "At 1,000 users a day I'd run one server and one database, and I'd add a cache only when repeat reads show up in the numbers."
- **Microservices on day one** — they hear: "this candidate has read about scale but never paid its cost" — every service boundary is a network call that can fail, time out, and need its own deployment. *Say instead:* "I'd keep one clean monolith and split a piece out only when it clearly outgrows the rest."
- **Sketching before clarifying** — they hear: "give this person a vague ticket and they'll build the wrong thing beautifully." *Say instead:* spend the first two minutes on three questions — who uses it, what must it do, roughly how much traffic — and let the answers choose your boxes.
- **"It scales infinitely"** — they hear a claim no system on earth can back. *Say instead:* volunteer the limit first: "My bottleneck is the single database; at 100× writes I'd shard by user, and reads are already behind a cache." Owning one limit beats hiding five.
- **Explaining all five boxes deeply** — they hear the clock, not the candidate. *Say instead:* give every box one honest line, then spend your depth on the single part with a real trade-off — ID generation in a shortener, delivery order in chat.

> [!TIP]
> **The repair sentence:** whenever you catch yourself reaching for a fancy box, finish this sentence first — "I need this because my estimate says ___." If the blank stays empty, the box comes off the diagram.


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


---

## ✂️ 7. Deep Dive — Designing a URL Shortener at Scale

You already know the basic version from Section 3: POST creates a code, GET redirects with a 302. This deep dive is what the interviewer is *really* hoping you'll reach for when they say "okay, now make it handle a billion clicks." Nothing here replaces the simple design — it grows out of it.

The one idea to hold onto: **a URL shortener is a read machine with a tiny write problem attached.** Almost every smart decision in this chapter comes from honouring that ratio.

### Start with the numbers again — bigger this time

At fresher scale we assumed 1,000 writes a day. Say the interviewer pushes you:

```text
Writes: 100 million new links/day ≈ 1,160 writes/sec average, ~3,500/sec peak
Reads: 100× writes = 10 billion clicks/day ≈ 116,000 reads/sec average
Storage: 100M/day × 500 bytes ≈ 50 GB/day of new rows — this DB fills FAST
Conclusion: writes are now the interesting problem; reads must almost never touch the DB
```

That last line is why we cache aggressively and why ID generation stops being "just increment a counter" — a single auto-increment sequence becomes a hot spot when thousands of writers queue on it every second.

> [!NOTE]
> **One-line interview answer:** "At scale a shortener is read-dominated, so I optimise the read path with caching and make ID generation cheap and collision-free on the write path."

### Base62 math you can do out loud

Base62 means 62 symbols: `a–z` (26) + `A–Z` (26) + `0–9` (10). Each extra character multiplies your space by 62:

| Code length | Total codes | Plain-English feel |
|---|---|---|
| 3 chars | 62³ ≈ 238k | A side project |
| 5 chars | 62⁵ ≈ 916 million | A solid startup |
| 6 chars | 62⁶ ≈ 56.8 billion | Years of headroom |
| 7 chars | 62⁷ ≈ 3.5 trillion | "We will never refill this" |

So when an interviewer asks "how long should the code be?", don't guess — derive it. "At 100 million links a day, 6 characters gives me 56 billion codes, roughly 18 months of writes; I'd pick 7 to be safe and keep links short." Deriving beats memorising every time.

Encoding itself is just repeated division. To encode ID `12345`:

```text
12345 ÷ 62 = 199 remainder 9   → '9'
  199 ÷ 62 =   3 remainder 13  → 'd'  (a=0 … z=25, A=26 …, so 13 = 'd' offset in lowercase set)
    3 ÷ 62 =   0 remainder 3   → 'd'
Read remainders bottom-up → "dd9" (padded to your chosen length)
```

You will never hand-encode in an interview, but saying "it's the same repeated-division trick as converting to binary, just base 62" proves you understand it rather than reciting it.

🎤 What the interviewer actually asks: "How many characters do you need?" They want the powers-of-62 reasoning, not a magic number.

### Three ways to make an ID — pick with trade-offs

| Strategy | How it works | Strength | Weakness |
|---|---|---|---|
| **Counter + Base62** | Global counter (DB sequence, Redis `INCR`, or a range allocated per server), encoded in Base62 | Zero collisions by construction; shortest possible codes | Predictable — anyone can enumerate `…/aB3`, `…/aB4`. Needs coordination so two servers don't hand out the same range |
| **Hash the URL** | MD5/SHA of the long URL, take first 6–7 chars of Base62 of the hash | Same URL always gets the same code — free dedupe | Collisions are *guaranteed* eventually (birthday paradox); two different URLs can share a prefix |
| **Random + check** | Generate 6–7 random Base62 chars, insert, retry if the unique index rejects it | Unpredictable; no coordination needed | Retry cost grows as the space fills; needs the DB round-trip to know you collided |

The senior-sounding move is not picking one — it's naming *when* each wins. Counter is simplest and cheapest while you control the write path. Random wins when predictability is a real problem (private links, abuse). Hashing wins only when dedupe matters more than collision handling — and you must say the next sentence.

### Collision handling — the sentence that saves you

For hash or random strategies, collisions are not an edge case; they're the design. The pattern is always the same:

```text
1. Generate candidate code
2. INSERT with a UNIQUE constraint on short_code
3. Constraint fires? → you collided → generate again (or append a salt/counter and re-hash)
4. Never "check then insert" as two steps — two writers can both pass the check. Let the DB index be the referee.
```

For the counter approach there's no collision to handle, but there *is* a coordination problem. The fix interviewers like: hand each app server a **block of IDs** (say 1,000 at a time) from a central allocator. A server that crashes wastes its leftover block — and that's fine, because gaps in the sequence cost you nothing.

> [!WARNING]
> **Don't say "collisions are rare so I'll ignore them."** At billions of rows, "rare" happens daily. Always pair a generation strategy with its collision story.

### The read path — caching driven by the ratio

With reads at 100× writes, even a 95% cache hit rate means the database still sees 5,000 reads/sec. So the read flow from Section 3 gets two upgrades:

```text
Click arrives → CDN/edge or API server
  → Redis lookup: short_code → long_url   (hot links live here, ~sub-millisecond)
  → Hit (the usual case): 302 immediately, DB untouched
  → Miss: one DB read, write the pair back into Redis with a TTL, then 302
```

Two details separate a good answer from a memorised one. First, **cache the 404s too** (negative caching): a flood of requests for codes that don't exist will otherwise hammer the database asking the same empty question. A short TTL on "this code does not exist" absorbs that. Second, links follow a power law — a tiny fraction of codes get most clicks — so an LRU cache of even modest size catches almost everything. Say that out loud; it justifies the cache with data shape, not vibes.

### Counting clicks without slowing the redirect

Analytics ("how many clicks did my link get?") is the feature that quietly breaks naive designs, because writing a counter row on *every* redirect turns your read path into a write path. The standard escape:

```text
Redirect path:  serve the 302 FIRST, then drop a "click" event onto a queue (fire-and-forget)
Analytics workers: drain the queue, batch-aggregate counts (by link, hour, country…) into a stats table
Dashboard reads the pre-aggregated stats — never scans raw click events
```

The redirect stays fast because counting happens off the hot path, and batching 1,000 clicks into one stats update is 1,000× fewer database writes. The trade-off to name: counts are *eventually* consistent — a dashboard may lag by seconds. For analytics, that's always acceptable.

### Common pitfalls in this design

- **301 instead of 302:** a 301 is cached by browsers forever, so repeat clicks never reach you — analytics die and you can't disable a bad link. Use 302 when you want to keep counting and stay in control.
- **One global counter with no block allocation:** every write waits on one sequence; at thousands of writes/sec it's your bottleneck wearing a trench coat.
- **Checking existence before insert:** the classic race — two writers, one code. Unique index + retry, always.
- **No expiry or cleanup story:** at 50 GB/day, "keep everything forever" is a storage bill, not a design. Mention TTLs or cold-storage archival for ancient links.

### Range allocation, in one picture

Worth drawing once so the counter stops sounding like a single point of failure:

```text
Central allocator (or DB sequence) hands out blocks — never single IDs:
  Server A gets IDs 1,000,000–1,000,999 → encodes locally, zero coordination per link
  Server B gets IDs 1,001,000–1,001,999
  Server A crashes at 1,000,412? IDs 1,000,413–1,000,999 are simply skipped.
Gaps are free. Collisions are impossible. The allocator is touched once per 1,000 writes, not once per write.
```

That is the whole trick — trade a few wasted numbers (of which Base62 gives you trillions) for a write path with no per-request coordination. If an interviewer asks "what if the allocator dies?", the answer is that servers keep serving from their current blocks while it restarts; only a server that exhausts its block mid-outage must pause writes, and sizing blocks generously makes that window tiny.

🎤 What the interviewer actually asks: "What breaks first at 10 billion clicks a day?" Answer: the read path's database dependency — which is exactly why the cache and negative caching exist.

> [!NOTE]
> **One-line interview answer:** "Short codes come from a counter or random generator encoded in Base62 — 7 chars gives trillions of codes — with a unique index as the collision referee, and reads are served almost entirely from cache because reads outnumber writes ~100 to 1."

> **30-second interview answer:** "I'd generate short codes by encoding IDs in Base62 — 6 characters gives about 57 billion codes, 7 gives trillions. My default is a counter with blocks of IDs allocated per server so there's no collision and no single hot spot; if links must be unpredictable I'd use random codes with a unique index and retry on conflict. Since reads outnumber writes roughly 100 to 1, redirects are served from a Redis cache — including cached 404s — and click analytics are counted asynchronously through a queue so the redirect itself never waits on a database write. I'd return a 302, not a 301, so I keep control of the link and the counts."

---

## 💬 8. Deep Dive — Chat System: Fanout, Presence, and Delivery

Section 4 gave you the honest fresher chat app: one server, WebSockets, save-before-deliver. The moment the interviewer says "now put it on five servers" or "now add group chats," three new problems appear: **fanout** (getting a message to people connected elsewhere), **presence** (knowing who's online), and **delivery proof** (ticks and receipts). This chapter names each one and gives you the standard answer.

Keep the anchor from before: **durability before delivery** still holds at every scale. Everything below is plumbing around that rule, never a replacement for it.

### Problem 1 — Your friend is on a different server

One server holds a limited number of open WebSockets (memory and file descriptors run out — tens of thousands is already serious). So you scale to many servers behind a load balancer. Instantly, a new question appears:

```text
Ayesha ──WebSocket──▶ Server A
Rohan   ──WebSocket──▶ Server B

Ayesha sends "hi" → Server A saves it → …Rohan's socket is on Server B. How does B know?
```

Server A cannot push down a socket it doesn't own. This is *the* chat-scaling problem, and it has one standard shape:

```text
Ayesha → Server A → save to DB → publish event to Pub/Sub (e.g., Redis Pub/Sub, Kafka)
                                      │
                    ┌─────────────────┼─────────────────┐
                 Server A          Server B          Server C
                 (ignores: not     (Rohan is here!   (ignores)
                  my user)          push "hi" ▼)
                                 Rohan's WebSocket
```

Every server subscribes to the message stream. When an event arrives, each server asks one cheap question: "is the recipient connected to *me*?" Only the server holding that socket delivers. The database write still happens first — pub/sub is just the doorbell, never the storage.

> [!NOTE]
> **One-line interview answer:** "With many servers, the sending server saves the message, then publishes it to a pub/sub layer; whichever server holds the recipient's WebSocket delivers it."

### Sticky sessions — the half-fix to know and name

A load balancer can use **sticky sessions** (always route Ayesha to Server A). That helps *her* requests, but it does nothing for the A-to-B problem above, and it makes load uneven and failover messy. Mention stickiness only to explain why it *isn't* the whole answer — pub/sub is.

🎤 What the interviewer actually asks: "Two users, two different servers — walk me through one message." They want: save → publish → owning server pushes. Three beats.

### Problem 2 — Presence: "is Rohan online?"

Presence looks trivial and is quietly one of the hardest parts of real chat apps. The working design:

```text
On connect:    write presence key  user:123 → { server: B, last_seen: now }  in Redis, with a TTL (~30–60s)
While online:  client sends a heartbeat ("ping") every ~20–30s → server refreshes the TTL
On disconnect: socket closes → server deletes the key immediately (the polite path)
On crash:      no heartbeats arrive → TTL expires on its own → user shows offline (the safety net)
```

Why heartbeats at all? Because connections die silently — phones lose signal, laptops close, tunnels drop — and the server may never see a clean "goodbye." The TTL is your lie detector: no heartbeat, no presence. The trade-off to state: presence is *eventually* accurate. A user can show "online" for up to one TTL after vanishing. Every real app accepts this; saying so sounds experienced.

Reading presence is then one Redis lookup, and "last seen" is just the timestamp you stopped refreshing.

### Problem 3 — Delivery and read receipts (the ticks)

One tick, two ticks, blue ticks — each is a tiny state machine on the message row:

| State | Meaning | What triggers it |
|---|---|---|
| `sent` | Saved on server | The save-before-deliver step itself |
| `delivered` | Reached the recipient's device | Recipient's client sends back an ack over its WebSocket |
| `read` | Recipient opened the conversation | Client sends a "read up to message X" event |

Implement receipts as lightweight events flowing back through the same pub/sub layer, updating the message status (or a per-recipient status for groups). Two fresher-friendly cautions: receipts should never block message sending — they're metadata, not cargo — and in big groups you aggregate ("read by 48") rather than storing a row per reader per message forever.

### Problem 4 — Group chat: fanout-on-write vs fanout-on-read

A group message must reach N members. You have exactly two strategies, and choosing between them is the classic chat interview moment:

| | Fanout-on-write | Fanout-on-read |
|---|---|---|
| **Idea** | When a message is sent, copy/deliver it into every member's inbox immediately | Store the message once in the group; each member reads it from the group when they open it |
| **Read cost** | Cheap — your inbox is pre-built | Expensive — assemble from all your groups on open |
| **Write cost** | Expensive — a 10,000-member group means 10,000 deliveries per message | Cheap — one write |
| **Wins when** | Small groups, everyone reads everything | Huge groups/channels, most members rarely read |

The honest answer is usually **hybrid**: fanout-on-write for normal groups (it's what makes chat feel instant), fanout-on-read for celebrity-scale channels where one message would otherwise trigger millions of writes. Naming the celebrity problem — "one post, ten million inboxes" — is the sentence interviewers remember.

```text
Fanout-on-write:  sender → save once → pub/sub → push to each online member's server (+ per-member inbox rows)
Fanout-on-read:   sender → save once in group timeline → members pull/merge on open (fast only with good indexing/caching)
```

### Ordering and the offline catch-up

Two small promises round out a believable design. **Ordering:** give every message a server-assigned sequence (per conversation) or trust server timestamps plus message IDs as a tiebreak, so two phones never show the same chat in different orders. **Offline catch-up:** on reconnect, the client says "my last seen message is X" and the server streams everything after X from the database — which only works because you saved before delivering, every time.

### A worked minute — one group message, end to end

Say Ayesha sends "standup in 5" to a 6-person group, three members online on two different servers, three offline:

```text
1. Ayesha's phone sends over her WebSocket to Server A
2. Server A saves the message (status: sent) with the next group sequence number
3. Server A publishes one event: { groupId, messageId, seq }
4. Server A and Server B both see it; each pushes to the group members connected to it (2 + 1 online)
5. Each online phone acks → status nudges to delivered for those recipients
6. The 3 offline members have an unread inbox row waiting; on next login they fetch "everything after my last seq"
```

Notice the database was written once and the pub/sub event was tiny — the fanout cost lands on cheap pushes and per-member inbox rows, not on repeated storage of the message body. In a 6-person group that's obviously right; in a 600,000-person channel you'd flip to fanout-on-read and store almost nothing per member. Same building blocks, different group size, different choice — and *saying why you flipped* is the interview answer.

### Common pitfalls in this design

- **Storing presence in each server's memory:** Server B can never answer "is Rohan online?" about Server A's users. Presence lives in shared storage (Redis) or it doesn't exist.
- **Delivering before saving "for speed":** one crash and the message existed only in a dead process. The ordering rule from Section 4 is non-negotiable.
- **Fanout-on-write for a million-member channel:** a single message becomes a million writes and a self-inflicted traffic spike. Match the strategy to group size.
- **Receipts as synchronous database writes on the send path:** ticks should trail messages, never delay them.

> [!TIP]
> **Connection-count reality check:** each open WebSocket costs memory on its server (buffers, bookkeeping — order of tens of KB). A lakh of concurrent users is therefore a fleet question, not a code question — another reason the load balancer and pub/sub layer arrive together, and why heartbeats double as the mechanism that reclaims dead connections' presence keys.

> [!TIP]
> If you remember one diagram from this chapter, make it the pub/sub one: save → publish → the server that owns the socket delivers. That single flow answers half of all chat follow-ups.

> **30-second interview answer:** "Each user holds a WebSocket to one of many servers. When a message arrives, the server saves it first, then publishes it to a pub/sub layer like Redis — whichever server holds the recipient's socket delivers it, and offline users catch up from the database on reconnect. Presence is a Redis key per user with a short TTL refreshed by client heartbeats, so crashes clean themselves up. Group chats use fanout-on-write for small groups and fanout-on-read for huge channels, and delivery/read ticks are lightweight status events that trail the message instead of blocking it."


---

## 🚦 9. Deep Dive — Designing a Rate Limiter

A rate limiter answers one question, thousands of times a second: "has this user/IP/API key done this too many times lately?" You build one to stop abuse, protect a struggling backend, enforce fair use between customers, and keep one noisy client from eating everyone's capacity. Interviewers love it because it's small enough to design fully and rich enough to have real trade-offs.

The intuition first: a rate limiter is a **doorman with a memory**. The algorithms below are just different kinds of memory.

### The four classic algorithms

| Algorithm | Mental model | Allows bursts? | Memory cost | Quirk to name |
|---|---|---|---|---|
| **Fixed window counter** | Count requests in this clock minute; reset at the boundary | Accidentally, yes | Tiny — one counter per window | Boundary bug: 100 requests at 12:00:59 and 100 more at 12:01:01 = 200 in two seconds, all "legal" |
| **Sliding window** | Count over the *last* 60 seconds, continuously (log of timestamps, or weighted blend of two windows) | No sneaky bursts | Higher — timestamps or two counters | The fix for the boundary bug; slightly more math |
| **Token bucket** | Bucket refills at a steady rate; each request spends a token; empty bucket = rejected | Yes — saved-up tokens allow a burst, then you're throttled to the refill rate | Tiny — token count + last refill time | The industry favourite (AWS, Stripe-style APIs) because bursts are often legitimate |
| **Leaky bucket** | Requests enter a bucket that drains at a fixed rate; overflow is dropped | No — output is perfectly smooth | Tiny | Great for protecting a fragile downstream; queues or drops the spikes instead of absorbing them |

If you can only prepare one deeply, prepare **token bucket**: "capacity 100, refill 10/sec" is a complete, speakable spec. A user can burst 100 instantly, then sustain 10/sec forever. That single sentence covers most interview scenarios.

```text
Token bucket, capacity 5, refill 1/sec — watch a burst die down:

t=0s   ●●●●●  burst of 5 arrives → all pass, bucket empty
t=0s   ○○○○○  6th request → REJECTED (429)
t=3s   ●●●○○  3 tokens refilled → next 3 pass, then rejections again
Steady state: exactly the refill rate gets through. Bursts are a loan, not a gift.
```

> [!NOTE]
> **One-line interview answer:** "I'd default to a token bucket — it allows short legitimate bursts up to the bucket size, then enforces a steady refill rate."

### Where does the limiter live?

Placement is half the interview. Three honest options:

```text
Client → [CDN / API Gateway rate limit] → [per-service limit] → backend
              coarse, cheap, IP-based          fine, user/key-based
```

- **API gateway / edge:** rejects abuse before it costs you real compute. Coarse (often per-IP) but unbeatable economics — a rejected request should be as cheap as possible.
- **Application middleware:** knows *who* the user is (API key, account tier), so limits can be per-plan: free tier 100/day, paid tier 10,000/day.
- **Per-downstream limits:** a separate, stricter bucket protecting one fragile dependency (say, a payments provider that allows 50/sec) regardless of what the front door allowed.

Say the layered version: "cheap and coarse at the edge, precise and identity-aware in the app." That's how real systems do it.

🎤 What the interviewer actually asks: "Where would you put the rate limiter?" — Never answer with an algorithm first. Placement, then algorithm.

### The distributed problem — counting across many servers

One server can count in memory. Ten servers behind a load balancer each see only their slice, so a per-server limit of 100/sec quietly becomes 1,000/sec globally. The standard fix is a **shared counter in Redis**:

```text
Request arrives at any server
  → Redis: INCR  ratelimit:{userId}:{window}     (atomic — Redis runs it as one step)
  → If this is the first request in the window: EXPIRE the key at window end
  → Count > limit? → 429 Too Many Requests (+ Retry-After header)
  → Else proceed
```

For token bucket in Redis, the same idea with a tiny Lua script: read tokens + last-refill time, compute refill, decide, write back — atomically, so two servers can't both spend the last token. Two trade-offs you must volunteer: every request now pays a Redis round-trip (fast, but real — keep the limiter data in the same region), and you must decide what happens when Redis is down. **Fail open** (allow traffic; availability wins, risk abuse briefly) vs **fail closed** (reject; safety wins, risk a self-inflicted outage). Naming that choice, with a lean, is senior behaviour. For most APIs: fail open with an alert, plus a coarse in-memory fallback limit per server.

Also name your **key dimensions** before the interviewer asks: per user? per IP? per API key? per endpoint (login limits must be far stricter than read limits)? The limit is a policy — the algorithm is just its enforcement.

### What the client should see — headers that make limits polite

A rate limiter that only says "no" creates retry storms. A production limiter teaches clients how to behave:

```text
HTTP/1.1 429 Too Many Requests
Retry-After: 12                          ← seconds until a token is available; good clients wait this long
X-RateLimit-Limit: 100                   ← the bucket size / window limit
X-RateLimit-Remaining: 0                 ← nothing left right now
X-RateLimit-Reset: 2026-10-03T12:01:00Z  ← when the window or bucket refills
```

Even allowed requests should carry the `X-RateLimit-*` headers so well-behaved clients can throttle themselves *before* hitting the wall. Mentioning headers unprompted signals you've consumed real APIs, not just read about limiting them. SDKs and retry libraries literally read `Retry-After` — your limiter is an interface, not just a gate.

### Numbers you can say without a calculator

Interviewers rarely check your arithmetic, but they do check that you *have* numbers:

```text
Free tier:      100 requests/day per API key   (token bucket would be overkill; a daily fixed window is honest here)
Logged-in user: token bucket 60 capacity, refill 1/sec  (comfortable browsing, kills scrapers)
Login endpoint: 5 attempts per 15 min per IP + per account  (strictest key you own; brute force lives here)
Global safety:  per-IP ceiling at the gateway, e.g. 1,000/min  (catches the flood before identity is even known)
```

The pattern to articulate: **the more sensitive the endpoint, the stricter and more identity-aware the key.** Anonymous, IP-only limiting is the weakest layer — NATs put thousands of real users behind one IP, and attackers rotate IPs for free — so it should be generous, with the precise per-account limits doing the real protective work behind it.

### Common pitfalls in this design

- **Fixed window with no boundary awareness:** the 2× burst at the window edge is the classic trap — know it before it's used on you.
- **Counting only successes:** attackers care about *attempts* — count requests, including failed logins, or your login limiter is decorative.
- **Silent rejections:** always return `429` with `Retry-After` (and ideally `X-RateLimit-Remaining`) so good clients can back off politely instead of retry-storming you.
- **One global limit for everything:** a single hammered endpoint should never starve the rest of the API; key limits per endpoint class too.

### Choosing in ten seconds — a pocket decision table

When the interviewer swaps the scenario, swap the algorithm by rule, not by vibes:

| Scenario the interviewer describes | Reach for | One-line why |
|---|---|---|
| Public API, partners, "allow short bursts" | Token bucket | Bursts are legitimate traffic, not abuse |
| Protecting a fragile downstream that must see smooth load | Leaky bucket | Output rate is fixed no matter how spiky the input |
| Simple quota — "free users get 1,000 calls a day" | Fixed window | A daily quota doesn't need sliding precision; say the boundary quirk and move on |
| Login / OTP / password reset | Sliding window, strict and per-account | This is where the boundary trick and brute force actually live |

If they ask "and if we had to build it this weekend?" the honest fresher answer is: fixed window in Redis (`INCR` + `EXPIRE`) first, upgrade the login path to sliding/token logic later. Shipping the simple correct thing beats designing the perfect thing — naming your own upgrade path is the senior move.

> [!TIP]
> **Say the failure mode before they ask:** "If I had to cut one corner, it would be precision — a fixed window's boundary burst is acceptable for a v1 quota, unacceptable for login protection. So I'd ship the simple counter globally and hand-roll the stricter logic exactly where abuse concentrates."

### One last check — testing a limiter without angering everyone

A limiter you cannot test is a limiter you'll misconfigure in production. The habits worth naming: ship new limits in **shadow mode** first (count and log what *would* have been rejected, change nothing for users) for a day, and read the would-be-rejected list before enforcing — it is almost always full of one legitimate integration you forgot. Roll limits out per key class, alert on rejection spikes the same way you'd alert on errors (a sudden 429 storm is either an attack or *your* bug, and both deserve a page), and keep an emergency raise-the-limit switch that doesn't need a deploy. Thirty seconds of this in an interview reframes you from "can recite token bucket" to "would not take the site down with one" — which is, not coincidentally, the actual job.

> [!WARNING]
> **Race conditions are the real exam.** Any "read the count, then decide, then increment" as separate steps breaks under concurrency. The counter increment (or a Lua script) must be atomic — say the word "atomic" out loud.

> **30-second interview answer:** "I'd use a token bucket — say capacity 100, refilling at 10 per second — so users can burst briefly but sustain only the refill rate. With multiple servers, the counts live in Redis and are updated atomically with INCR plus an expiry, or a small Lua script for the bucket, so the limit is global rather than per-server. I'd place a coarse per-IP limit at the gateway and a precise per-user or per-API-key limit in the app, return 429 with Retry-After when limited, and fail open with alerting if Redis goes down so the limiter itself never causes an outage."

---

## 🔔 10. Deep Dive — Notification System

"Design a notification system" sounds like "send some emails" until you count the channels (push, email, SMS), the failure modes (provider down, user opted out, phone off), and the scale (a password reset for one user; a match-day alert for ten million). The design that survives all of it has one core idea: **notifications are jobs in a queue, not function calls in a request.**

The moment a user action needs a notification, your API should record the *intent* and move on. Everything slow, flaky, and provider-shaped happens afterwards, in workers.

### The high-level flow

```text
Something happens (order shipped, OTP requested, match starts)
  → API writes a notification request row + enqueues a job        (fast; user never waits)
  → Dispatcher worker reads the job:
       check user preferences & opt-outs ── opted out? → drop, log why
       pick channel(s) → render template with the user's data
  → Channel workers send via providers (push service, email API, SMS API)
  → Record result; failures go to a retry queue with backoff
  → Permanently failing? → dead-letter queue + alert, never silent loss
```

Every arrow there is a place an interviewer can poke — preferences, retries, duplicates — so let's arm each one.

### Channels are not interchangeable

| Channel | Strength | Weakness | Typical use |
|---|---|---|---|
| **Push** (mobile/web) | Instant, free per message | Needs the app/token; user can disable at OS level; no delivery guarantee | Chat messages, live alerts |
| **Email** | Rich content, durable, searchable | Slow to be *seen*; spam filters; needs templates per client | Receipts, digests, password resets |
| **SMS** | Reaches any phone, high open rate | Costs money per message; short; regulated | OTPs, critical alerts |

The design consequence: one notification *event* can fan out to several channels with different urgency, and your dispatcher — not the calling code — decides which. "Order shipped" might be push + email; "OTP" is SMS (and never email-only if you can help it).

> [!NOTE]
> **One-line interview answer:** "One event enters; a dispatcher checks preferences and renders per-channel templates, and channel workers send through queues so providers never block the user request."

### Preferences and opt-outs — the part that shows product sense

Every send must pass a gate: does this user want this *category* on this *channel*? Marketing emails: opt-out honoured instantly and legally. Transactional alerts ("your OTP", "your order shipped"): usually always on, because the user asked for the thing itself. Store preferences per user per category per channel, check them in the dispatcher, and log every drop — "why didn't I get the email?" is a support question you want a data answer to. Bonus maturity: respect quiet hours for non-urgent pushes, and batch low-urgency items into a digest instead of twelve separate buzzes.

🎤 What the interviewer actually asks: "A user unsubscribed but still got an email. How?" — They want to hear that the preference check happens at *dispatch time*, not enqueue time — a job queued yesterday must re-check today.

### Retries with backoff — because providers fail politely and rudely

Providers time out, rate-limit you, and occasionally catch fire. The standard retry pattern:

```text
Attempt 1 fails → wait ~1 min → Attempt 2 fails → wait ~5 min → Attempt 3 fails → wait ~30 min
  → still failing? → DEAD-LETTER QUEUE (park it, alert a human, keep the payload for replay)
```

That's **exponential backoff**, ideally with a little random jitter so a thousand failing jobs don't all retry in the same second (a retry stampede is just a second outage you scheduled yourself). Two rules to state: retry only *transient* failures (timeouts, 5xx, provider rate limits) — a permanently invalid email address will fail forever, so validate and dead-letter fast instead. And distinguish channels: an OTP that arrives after 20 minutes of retries is worse than useless, so time-critical notifications get a short expiry — fail fast or switch channel.

### Deduplication — never send "your order shipped" four times

Queues typically guarantee **at-least-once** delivery, which means your worker may see the same job twice. Add retries on top and duplicates are not a risk, they're a certainty — unless you design against them. Give every notification a deterministic **idempotency key** (e.g., `order:123:shipped:email`) and record it when a send succeeds; before sending, check the key. Already sent? Skip. This one mechanism is the difference between a system and a spam cannon, and it's the same idempotency idea that protects payment APIs — say that connection out loud.

### Templates and rendering

Workers should never hand-build strings like `"Hi " + name + ", your order…"`. Store **templates per channel per locale** (`order_shipped.email.en`), render with the event's data payload, and version them — so marketing can fix a typo without a code deploy, and a bad template can be rolled back. Keep the payload in the job small and self-contained (order ID, name, tracking link) so a job queued today still renders correctly tomorrow.

### Ordering and priority

Not all notifications are equal, and a single queue would let a million marketing emails delay someone's OTP. Use **separate queues by priority**: transactional (OTPs, security, order updates) always drains first; promotional traffic yields. That's a one-sentence design choice that sounds like you've operated a real system — because it's learned from a real failure.

### What to track — because "did it send?" is three questions

Interviewers quietly check whether you can operate this thing the day after shipping it. Notifications have three distinct success points, and mature designs record each:

| Stage | Question it answers | Signal |
|---|---|---|
| **Accepted** | Did the provider take it? | Provider API returned success + a provider message ID you store |
| **Delivered** | Did it reach the device/mailbox? | Push/email provider webhook callbacks (delivered, bounced, opened) |
| **Acted on** | Did the user care? | Click/open tracking on links — product analytics, not delivery plumbing |

Storing the provider's message ID on your notification row is the tiny decision that makes debugging possible later: when a user says "no OTP," you can look up exactly what the SMS provider claims happened instead of shrugging. Bounce and complaint webhooks should also feed back into preferences automatically — an address that hard-bounces gets suppressed before it torches your sender reputation. One honest sentence — "provider acceptance is not delivery, so I'd persist their callbacks against the message ID" — moves you from candidate-who-desgins diagrams to candidate-who-has-been-paged.

Delivery volume math is worth a breath too: ten million match-day pushes are ten million small jobs, but the real ceiling is the push provider's throughput and your SMS budget, not your worker count — workers scale horizontally until the provider says stop.

### Common pitfalls in this design

- **Sending synchronously inside the API request:** provider latency becomes *your* latency, and a provider outage becomes your outage. Queue it.
- **Retrying forever / never dead-lettering:** infinite retries hide bugs and burn provider quota; everything needs a final resting place and an alert.
- **No idempotency key:** at-least-once queues plus retries guarantee duplicate sends. It's when, not if.
- **Checking preferences only when the job is created:** a user who opted out an hour ago still gets the queued email. Check again at dispatch.

### Two flows worth rehearsing out loud

**Password reset (transactional, one user):** request → API enqueues a priority job with template `password_reset` and a link containing a single-use, expiring token → dispatcher confirms the account exists (always reply "if an account exists, we've sent a link" — never confirm which emails are registered) → email worker sends → delivery webhook updates the row → link expires in ~30 minutes whether used or not. Notice what's *not* here: no marketing queue, no waiting, no duplicates on retry because the token and the idempotency key make a second send harmless and detectable.

**Match-day alert (promotional-ish, ten million users):** the event fans out into per-user jobs (preferences filter first — only users who follow that team, only channels they enabled) → jobs drain through workers at a rate capped by your provider agreement → pushes go out in waves by timezone/fixture time, not one ten-million-message thunderclap → failures retry quietly behind the transactional queue, which always wins. The design words the interviewer is listening for in this half: fan-out, preference filtering, provider rate ceiling, priority isolation. Say all four and you've told the whole story.

### Quiet hours, digests, and not becoming the spam folder

The last product layer, and the one that quietly proves taste: restraint. Non-urgent pushes respect local quiet hours (a 2 AM "sale ends soon" is how apps get their notifications switched off permanently — an OS-level, unrecoverable loss). Low-urgency events batch into a morning digest rather than arriving as individual interruptions. Every category gets its own unsubscribe that takes effect at the next dispatch check, and frequency caps ("never more than N marketing pushes per user per day") live in the dispatcher next to the preference check, because no single campaign team can be trusted to know what the other three sent this week. Interviewers rarely demand this paragraph — volunteer two sentences of it anyway. A notification system that *can* send everything but *chooses* not to is the difference between a delivery pipeline and a product, and noticing the difference is precisely what they say freshers never do.

### How you'd prove it works — the fresher testing story

Close the design with operability, briefly. Each stage is observable on its own terms: queue depth and age (are jobs piling up faster than workers drain them?), per-channel success and retry rates (is the email provider degrading, or is it us?), dead-letter counts (anything above zero gets a human glance daily), and end-to-end delivery latency for the priority queue specifically — an OTP that took four minutes is a failed OTP wearing a success costume, so it gets its own alert threshold. Template changes ship behind a small-percentage rollout exactly like code, because a broken merge-field ("Hi {null}!") sends to everyone at once and cannot be unsent. You don't need dashboards drawn in the interview; two sentences naming *what would page you* at 2 AM tells the interviewer this system could actually be trusted in production — and trust, not diagram size, is what they're hiring for.

Quick self-check before you call this design done — can you answer all five without pausing?

- Where does the send actually happen? → In channel workers, off the request path.
- What stops a duplicate "order shipped"? → The idempotency key, checked before every send.
- A provider dies for an hour — what do users see? → Nothing for transactional; retries absorb it, dead-letter + alert if it outlasts the backoff.
- A user opted out mid-queue — protected? → Yes, preferences are re-checked at dispatch time.
- What pages you at 2 AM? → Priority-queue latency and a dead-letter count climbing above zero.

> [!NOTE]
> **One-line interview answer:** "Notifications are queued jobs — dispatched with a fresh preference check, sent per channel from versioned templates, retried with backoff, deduplicated by idempotency key, and dead-lettered loudly instead of lost silently."

🎤 What the interviewer actually asks: "It's Diwali sale, ten million notifications in an hour — what breaks first?" Answer honestly: not your workers — your *provider quotas* and your users' patience. That's why waves, caps, and priority queues exist.

If you remember nothing else from this chapter, remember the shape: **event → queue → preference check → template → channel worker → backoff-or-dead-letter.** Every follow-up question is a poke at one arrow in that chain.

> [!TIP]
> **Scale note to keep in your pocket:** the trigger event is tiny and cheap — even ten million notifications start as ten million small queue jobs. Workers scale horizontally per channel, and the provider's own rate limit (not your servers) is usually the real ceiling. Say which ceiling you'd hit first.

> **30-second interview answer:** "A notification starts as a small job on a queue, so the user request never waits on a provider. A dispatcher checks the user's current preferences and opt-outs, picks the channels — push, email, SMS — and renders a versioned template. Channel workers send through the providers, retry transient failures with exponential backoff and jitter, and park permanent failures in a dead-letter queue with an alert. Every notification carries an idempotency key so retries and at-least-once delivery never double-send, and transactional messages like OTPs run on a priority queue ahead of marketing traffic."


---

## 📁 11. Deep Dive — File Upload & Storage

"Design a file upload system" (think: profile photos, assignment PDFs, a Drive clone) traps beginners in one specific way: they route the file *through* the API server. A 2 GB video flowing browser → your server → storage means your server spends its life as an expensive pipe, and one slow upload ties up a worker. The professional design has a single governing idea: **the file should travel directly between the client and storage; your server only hands out permission and keeps the records.**

Everything else in this chapter — chunking, presigned URLs, virus scanning — hangs off that idea.

### The direct-to-storage flow (presigned URLs)

A **presigned URL** is a storage URL your server signs with its credentials, valid for one operation (usually one PUT of one file) for a few minutes. The flow:

```text
1. Client → API server:  "I want to upload report.pdf (2 MB, PDF)"
2. API server:  creates a file record (status: PENDING), asks storage for a presigned PUT URL
3. API server → Client:   { fileId, presignedUrl }          (tiny JSON — no file bytes!)
4. Client → Storage:      PUT file bytes straight to the presigned URL
5. Client → API server:   "upload done for fileId"  (or storage fires a completion event)
6. API server:  verify the object exists/size matches → status: READY → serve it via CDN
```

Your server moved a few hundred bytes of JSON while the storage service — built exactly for this — absorbed the gigabytes. It also can't be tricked into accepting the wrong file: the signature binds the URL to one key, one operation, and an expiry.

> [!NOTE]
> **One-line interview answer:** "The client uploads bytes directly to storage with a short-lived presigned URL; my server only issues the URL and tracks the file's metadata and status."

### Small files vs large files — chunking and resumability

A presigned single PUT is perfect for a photo. For a 2 GB video on flaky mobile data, failing at 97% and restarting from zero is misery. Large uploads go **chunked (multipart)**:

```text
File split into parts (e.g., 5–10 MB each)
  → Server initiates a multipart upload, returns an uploadId + presigned URL per part
  → Client uploads parts (can parallelise; can retry ONE failed part, not the whole file)
  → Internet dies at part 340/400? Reconnect later, ask "which parts do you have?", send only the missing 60
  → Client says "complete" → storage stitches the parts into one object
```

Three properties to name: **resumable** (progress survives disconnects), **parallel** (parts race each other, faster on good connections), and **bounded retries** (a bad chunk costs megabytes, not gigabytes). This is how real Drive/Dropbox-style uploads feel unbreakable, and the mechanism fits in four lines.

🎤 What the interviewer actually asks: "A user's upload dies at 90%. What happens?" — With chunking: only the missing parts re-send. Without it, say honestly: the whole file restarts — which is why chunk size is a design decision, not a detail.

### Metadata is yours; bytes are storage's

Keep a clean split that interviewers love hearing:

| Lives in your database | Lives in object storage (e.g., S3) |
|---|---|
| `file_id`, owner, original name, size, type | The actual bytes, keyed by `file_id` (never by user filename) |
| Status: `PENDING → UPLOADED → SCANNED → READY` (or `REJECTED`) | Versioning/replication, handled by the provider |
| Permissions: who may view/download this file | — |

Keying stored objects by generated ID (not the user's filename) quietly kills a whole bug class: name collisions, `../../` path tricks, and two users both uploading `photo.jpg`.

### Lifecycle — the uploads nobody finishes

A detail that separates a demo from a design: most upload systems slowly fill with *abandoned* bytes. Users start multipart uploads and never complete them; presigned URLs get issued and never used; files sit in `PENDING` forever. Storage bills don't care that the upload was abandoned. The grown-up design adds a janitor:

```text
PENDING records older than ~24h with no object in storage → delete the record, forget it
Incomplete multipart uploads older than a few days → abort via the storage lifecycle rule (storage does this natively)
READY files deleted by the user → mark deleted immediately, hard-delete bytes after a grace period (undo window)
```

You don't need to belabour this in an interview — one sentence ("I'd add lifecycle rules so incomplete multipart uploads auto-abort instead of billing me forever") proves you've thought about day two, not just demo day. The same instinct applies to quotas: enforce per-user storage limits at the *presign* step, when you're told the declared size, not after 2 GB has already landed.

### The async virus-scan step — never serve an unscanned file

Uploaded files are untrusted input in its most dangerous costume. The safe pipeline inserts a scan between upload and availability:

```text
Upload completes → status: UPLOADED → event onto a queue
  → Scan worker pulls the file, runs antivirus/malware scan (async — takes seconds, user already moved on)
  → Clean → status: READY (now it may be downloaded/shared)
  → Infected → status: REJECTED, quarantine/delete the object, notify the uploader
```

While scanning, the owner can see "processing…"; nobody else can fetch the file. The same async step is the natural home for other post-processing: image thumbnails in several sizes, video transcoding, PDF text extraction. All of it belongs *after* the upload, in workers, off the request path — exactly the queue pattern from the notification chapter wearing different clothes.

### Delivery — the CDN does the heavy lifting

Serving downloads from your API server repeats the pipe mistake in reverse. Instead: files are public-ish (profile pictures) → serve through a **CDN** with the storage bucket as origin, so a file requested in another country loads from a nearby copy. Files are private (a student's assignment) → your server checks permissions, then hands out a short-lived **presigned GET URL** (CDN-signed where possible). The permission decision is yours; the byte-shipping is not. Also mention range requests ("resume this download / stream from 1:32") — storage and CDNs support them natively, another reason not to proxy bytes yourself.

### Common pitfalls in this design

- **Uploading through the API server "for simplicity":** fine for a 50 KB avatar in a class project — say so — but name it as the first thing that breaks at real file sizes and concurrency.
- **Trusting the client's file type/size claims:** verify size and sniff the real content type server-side (or in the scan worker). A `.pdf` that is actually an executable is the oldest trick there is.
- **Serving files the moment the PUT finishes:** unscanned, unprocessed files handed to other users is how platforms distribute malware. Status gate first.
- **Presigned URLs that live for days:** the URL *is* the permission. Minutes, not days — and one URL, one object, one operation.

### Sizing the chunks — the 30-second derivation

Chunk size is a trade-off you can derive live. Too small (say 100 KB) and a 2 GB video becomes 20,000 parts — 20,000 signed URLs, 20,000 requests, and per-request overhead eats your throughput. Too large (say 500 MB) and one dropped connection on mobile data re-sends half a gigabyte; resumability stops helping. The sweet spot real systems cluster around is 5–25 MB: a 2 GB file is then roughly 100–400 parts, each cheap to retry, few enough to parallelise meaningfully (upload 4–8 parts at once and saturate the connection without melting the phone). Add the overhead check for completeness: part uploads are independent, so a second presigned-URL batch can be fetched when the first runs out — the client never needs 400 live URLs at once, just the next handful. Deriving the range from failure cost versus request count — instead of reciting "5 MB" as doctrine — is exactly the fresher-to-thoughtful jump interviewers reward.

### Validation order — what gets checked, and when

A closing habit that ties the whole pipeline together: validate as *early* as the information honestly allows, and never twice expensively. At presign time you know only what the client *claims* (name, size, type) — check quotas and declared limits there, cheaply. When the bytes land, storage can confirm the real size for free. Only then does the expensive truth-telling happen: the scan worker sniffs the actual content type, runs the malware check, and extracts whatever metadata post-processing needs. If the sniffed type disagrees with the declared one, the file is quarantined and the incident is logged against the uploader — a mismatch is either a bug or an attack, and both deserve a record. Stating this order out loud ("cheap claim-checks up front, expensive truth-checks once the bytes exist") shows the same instinct as save-before-deliver in chat: never pay a heavy cost, or make a trust decision, on information you haven't verified yet.

### Downloads deserve the same suspicion as uploads

Uploads get the security paragraph in most interviews; downloads are where the marks hide. Serving a file is an authorisation decision first and a byte transfer second: every download path — CDN link, presigned GET, in-app preview — must trace back to a permission check against the metadata row ("does *this* user may-see *this* file_id?"), never to possession of a URL someone pasted into a group chat. Short-lived signed URLs are what make that enforceable after the link escapes, and they expire in minutes for exactly the reason your front door key isn't valid forever. Add the audit habit: log who downloaded what, when. It costs one row per download, it answers every future "who saw this document?" question with data instead of archaeology, and in any system handling student records or company files it stops being optional very quickly. Name both — permission check, then signed hand-off — and the interviewer hears a complete system, not an upload demo with a download afterthought.

Quick self-check — the five sentences to be able to say without notes:

- The file never travels through my API server; presigned URLs move bytes client ↔ storage directly.
- Large files upload in 5–25 MB chunks, so failures resume from the missing parts only.
- Nothing is downloadable until the async scan flips its status to READY.
- Private downloads are a permission check plus a minutes-long signed URL — never a permanent link.
- Abandoned multipart uploads are auto-aborted by lifecycle rules, so they never bill forever.

> [!NOTE]
> **One-line interview answer:** "Uploads go client-to-storage directly via short-lived presigned URLs, chunked and resumable for large files, gated by an async virus scan before anyone can download, with delivery through the CDN."

🎤 What the interviewer actually asks: "Why not just upload through your backend like your class project did?" Answer: because at real file sizes your server becomes a paid pipe that holds workers hostage — direct-to-storage is the same code complexity, minus the bottleneck.

> [!WARNING]
> **The sentence that signals senior thinking:** "My server authorises and records; storage stores and ships." If your diagram shows file bytes flowing through your API server at scale, expect the interviewer to circle it in red.

> **30-second interview answer:** "The client never uploads bytes through my API server. It asks for permission, my server creates a metadata record and returns a short-lived presigned URL, and the client uploads directly to object storage — in chunks for large files, so an interrupted upload resumes from the missing parts instead of restarting. On completion an async worker virus-scans and processes the file before its status flips to ready, and downloads are served through a CDN, with signed URLs when the file is private. My server handles authorisation and metadata; storage handles the bytes."

---

## ⚡ 12. Deep Dive — Cache Strategies & Database Scaling

This is the chapter that turns your Section 5 vocabulary into judgement. Everyone can say "add a cache" or "add read replicas." The interview skill is saying *which* cache pattern, *what* breaks when it's stale, and *when* replication stops being enough and sharding becomes unavoidable. We'll take the cache first, then the database it's protecting.

Anchor fact from earlier chapters: the **database is the source of truth; the cache is a fast, disposable copy.** Every strategy below is a different answer to one question: *who keeps the copy fresh, and when?*

### The three write strategies — who updates the cache?

| Strategy | How it works | Freshness | Cost / risk |
|---|---|---|---|
| **Cache-aside** (lazy) | App checks cache → miss → read DB → write copy into cache. Writes go to the DB; the cached copy is invalidated (deleted) | Next read after a write may miss once, then re-caches | Simplest and most common. Brief staleness possible; first read after a change pays the DB cost |
| **Write-through** | Every write updates DB *and* cache together before returning | Cache is always fresh | Every write pays both costs; cache fills with data nobody may ever read |
| **Write-back** (write-behind) | Write lands in cache, returns instantly; cache flushes to DB asynchronously | Cache fresh, DB briefly behind | Fastest writes — but a cache crash before flush = **lost data**. Only for data you can afford to lose or reconstruct |

For a fresher interview, **cache-aside is your default answer** — it's what the URL shortener's redirect flow already uses. Reach for write-through when reads must never see stale data and write volume is modest. Mention write-back only with its danger attached; saying "write-back is fast but can lose writes on a crash, so never for orders or payments" is the mark of someone who's thought past the diagram.

```text
Cache-aside read (the pattern to draw from memory):

request → cache hit? ──yes──▶ return cached value
             │no
             ▼
        read database → store copy in cache (with TTL) → return value
```

> [!NOTE]
> **One-line interview answer:** "I default to cache-aside: reads check the cache first and populate it on a miss, writes go to the database and invalidate the cached copy."

### Eviction — when the cache is full, who leaves?

Memory is finite, so the cache needs an eviction policy. Know three by their personalities:

- **TTL (time-to-live):** every entry expires after N seconds/minutes regardless of popularity. Not strictly an eviction policy but the one you'll use most — it bounds staleness, which is usually the real requirement. TTL + cache-aside is the fresher power combo.
- **LRU (least recently used):** evict whatever hasn't been touched longest. Matches real traffic (hot links, active users) beautifully — this is Redis's classic default and the safe answer to "which eviction?"
- **LFU (least frequently used):** evict whatever's been read least often. Protects long-term favourites, but a one-time traffic spike can pollute it with junk that takes ages to age out.

The honest framing: "I'd start with TTL for correctness and LRU under memory pressure, and only reach for LFU if I saw stable, frequency-shaped traffic." Policy follows traffic shape — say that.

### The cache stampede — when the hot key expires

The failure nobody sees coming: your most popular key (a viral link, a celebrity profile) expires, and in the same second *ten thousand* requests all miss, all storm the database, and the database falls over — which makes the cache repopulate even slower. This is the **thundering herd / cache stampede** problem, and naming it unprompted scores real points. Fixes, simplest first:

```text
1. TTL with jitter: expire keys at TTL ± random few seconds, so hot keys don't die simultaneously
2. Request coalescing / lock: the first miss takes a short lock and refills; everyone else waits or serves slightly stale
3. Serve-stale: on expiry, keep serving the old value while ONE background request refreshes it
4. Pre-warm / never expire true hot keys: refresh them proactively before expiry
```

You don't need all four — name the problem and one credible fix and you've outperformed most candidates.

🎤 What the interviewer actually asks: "Your cache goes down at peak traffic. What happens to your database?" — Answer: it gets every request the cache was absorbing, all at once. That's why you rate-limit, shed load, and treat cache recovery as a gradual warm-up, not a light switch.

### Database scaling step 1 — replication and read replicas

When the database itself is the wall, the first move is **replication**: one **primary** takes all writes and streams its changes to **read replicas**, which serve reads. If reads are 90% of your load (the usual case), three replicas roughly triple your read capacity without touching your write path.

```text
                 writes
   App ───────────────────▶ PRIMARY ──streams changes──▶ REPLICA 1 ─┐
   App ◀──── reads (spread) ──────────────────────────────────────────▶├── load-balanced reads
   App ◀──── reads ───────────────────────────────────────── REPLICA 2 ─┘
```

Now the consequence you *must* volunteer: **replication lag.** A replica applies changes a few milliseconds — under load, sometimes seconds — behind the primary. So a user who updates their profile and immediately re-reads it *from a replica* may see the old value. The standard coping line: route "read-your-own-write" traffic (the screen right after an edit) to the primary, let everyone else read replicas. That single sentence converts a consistency lecture into a design decision.

### A 60-second consistency story to keep in your pocket

Make lag concrete before the interviewer makes it a trap. A user changes their display name and instantly refreshes:

```text
t=0ms    Write lands on PRIMARY (name = "Khushi"). User taps save.
t=5ms    Refresh request is load-balanced to REPLICA 2 — which has not applied the change yet.
t=5ms    Replica serves the OLD name. User concludes "the app lost my edit." It didn't — it's 40ms behind.
Fix:     for ~a few seconds after any write, that user's reads stick to the primary (or carry a "must be at least this fresh" check).
Everyone else reading that profile from replicas a moment later is fine — nobody else can tell, and nobody else should pay primary prices.
```

The generalisable line: **staleness is only a bug when the reader can prove it.** Design your routing so the one person who can prove it — the writer — never reads stale.

### Database scaling step 2 — when sharding becomes unavoidable

Replicas scale reads. They do nothing when **writes** overflow one machine, or when the data simply **no longer fits** well on one disk. That's the honest trigger for **sharding**: split the data by a **shard key** so each machine owns a slice — users `A–F` on shard 1, and so on, usually by hashing `user_id` so slices stay balanced.

Say the costs in the same breath, because they're why sharding is the *last* resort:

- **Cross-shard queries hurt:** "all orders across all users this week" now fans out to every shard and merges — analytics moves to a separate warehouse.
- **JOINs across shards are effectively gone:** data that must join must live together, so the shard key is a one-way door.
- **Transactions and unique constraints** get harder the moment one operation spans two shards.
- **Rebalancing is surgery:** growing from 4 shards to 8 means moving data without downtime (consistent hashing minimises how much moves).

> [!WARNING]
> **Don't shard in an interview to look senior.** The senior sentence is: "I'd exhaust caching, replicas, and indexing first — sharding is what I do when writes or data size leave me no choice, because it taxes every query forever after."

### Putting the ladder together

The whole chapter compresses into the escalation order from Section 5, now with the reasoning attached:

```text
Slow reads?      → 1. Cache the hot data (cache-aside + TTL/LRU)
                    2. Index properly (the unglamorous fix that beats half of all scaling)
Database still hot on reads?  → 3. Read replicas (accept and manage replication lag)
Writes or data size overflow one machine? → 4. Shard by a well-chosen key (accept cross-shard pain)
```

Each step is taken only when the previous one measurably strains — the same "measure first, add one box" discipline from your very first design. If an interviewer pushes past sharding ("and then?"), the honest ceiling answer is: more shards, plus archiving cold data out of the hot path — not a magic fifth box.

### Common pitfalls in this chapter's territory

- **Caching without a TTL or invalidation story:** an immortal cache is just a second, lying database. Every cached value needs an expiry or an eviction trigger.
- **Caching everything:** cache what is read often and changes rarely. Caching volatile data buys staleness, not speed.
- **Reading your own write from a lagging replica:** the "my update didn't save!" bug. Route post-write reads to the primary.
- **Sharding on a low-cardinality key** (e.g., country, when 90% of users share one): one shard takes all the traffic — a hotspot with extra steps. Pick a high-cardinality, evenly spread key like `user_id`.

> [!TIP]
> **Worked gut-check:** if 95% of reads repeat the same 5% of rows (the usual power-law shape), a cache with a 95% hit rate turns 100,000 database reads/sec into 5,000 — you have just bought a 20× read scale-up for one Redis box. That arithmetic, said out loud, is why "cache first" beats "shard first" in every interview room.

> [!TIP]
> **The sentence that ties the ladder together:** "Scale reads with cache and replicas, scale writes and storage with sharding — in that order, only when measured." Interviewers write down sentences like that.

> **30-second interview answer:** "I default to cache-aside with a TTL and LRU eviction: reads check the cache, misses fall through to the database and repopulate it, and writes invalidate the cached copy. I'd guard hot keys against a cache stampede with jittered TTLs or a single refill lock. On the database side, I'd scale reads first with replicas — routing read-your-own-write traffic to the primary to dodge replication lag — and shard by a high-cardinality key like user_id only when writes or data size genuinely outgrow one machine, since sharding makes cross-shard queries and joins painful forever."
