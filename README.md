# 🎤 InterviewPrep — by Ayushi Singh

**I built this for myself first. Then I realised every student around me was preparing the same messy way — so I made it for everyone.**

While preparing for my own full-stack interviews, my notes were scattered across notebooks, screenshots, random tabs and half-finished docs. Revise one topic, forget where I wrote the next. So I sat down and built the thing I actually wanted: **one website where my notes live like real highlighted paper notes, where I can practise questions against a timer, and where an AI interviewer talks to me on camera and grades my answers.**

If you're a student or fresher preparing for full-stack / SDE interviews — **please use it. It's free, it's public, and it's yours as much as mine.** If it helps you crack even one interview question, it did its job. ⭐ Star it so other students find it.

🔗 **Live website:** https://interviewprep-by-ayushi.onrender.com

---

## ✨ What you get

📚 **Notes that read like notes** — 12 topics written the way I explain things to myself: definitions in highlighted boxes, comparison tables, code examples, the traps interviewers love, and a mock-question list with answers you can actually *say out loud* at the end of every topic.

🎯 **Practice mode** — pick a topic, get timed question cards, rate yourself honestly (Knew it / Shaky / Missed), and watch your score history improve. 119 questions and counting.

🧩 **DSA Sheet** — 41 classic problems across 12 patterns (arrays → DP). Read the explanation, write your solution in the browser, run the test cases, hit submit — it judges your code right there, tracks your attempts, and restores your last attempt when you come back.

📋 **Study plans** — LeetCode-style plans (SQL 50, JavaScript 30, DSA 75, React 25, Backend 30, TypeScript 15, CS Fundamentals 20, Top Interview 60). Chapters of real work on this site — and most items tick themselves the moment you actually do them.

📈 **A course track that remembers** — mark guides complete, watch the sidebar fill up, and pick up exactly where you left off from the home dashboard.

👤 **Your own profile (optional)** — create a free account and your progress syncs across devices: guides done, problems solved (per topic), plans in progress, mock interviews taken. Guest mode always works too — a profile is an upgrade, never a wall.

🤖 **Live AI mock interview** — this is my favourite part. Turn your camera on, the interviewer *speaks* a question out loud, you answer with your voice, it follows up on what you said — and at the end you get a report card: what you covered, what you missed, and which topics to revise. Nothing is recorded or uploaded; your camera is only a mirror. Practise at 2 AM, no senior required.

---

## 📖 Topics covered

| Topic | What's inside |
|---|---|
| ⚡ JavaScript | Types & traps, closures, promises, event loop, output puzzles |
| ⚛️ React | Hooks done properly, `useEffect`, bug hunting, performance |
| 🖥️ Backend | Node.js, Express, REST, JWT, MongoDB vs SQL, status codes |
| 🧩 DSA | Big-O, patterns (two pointers, sliding window…), complexity tables |
| 🔷 TypeScript | Types, generics, narrowing, TS with React |
| ▲ Next.js | SSR/SSG/CSR, routing, when Next beats plain React |
| 🗄️ SQL | Joins, grouping, subqueries + 10 practice queries with solutions |
| 🏗️ System Design | Fresher-friendly walkthroughs: URL shortener, chat app, scaling basics |
| 🌿 Git & CS Fundamentals | Git commands, OS, DBMS, networks, OOP — 30-second answers |
| 🎨 HTML & CSS | Box model, flexbox vs grid, the rapid-fire questions |
| 🎯 My Projects + HR | How I explain my own projects, honest HR answers |
| 📅 Full Mock Bank | A 45-minute timed mock + 7-day revision plan |

---

## 🚀 Use it your way

**Just open the live site** — no signup, nothing to install: https://interviewprep-by-ayushi.onrender.com

**Run it locally** (or fork it and make it yours):

```bash
git clone https://github.com/ayushi0618/interviewprep-by-ayushi.git
cd interviewprep-by-ayushi
npm install
npm install --prefix client
npm run build
npm start        # http://localhost:10000 (or your PORT)
```

**Optional — smarter AI interviewer:** the live mock interview works fully on its own, but if you add a `GEMINI_API_KEY` in a `.env` file, the interviewer generates its follow-up questions with AI instead of the built-in set:

```
GEMINI_API_KEY=your_key_here
```

**Optional — accounts & progress sync:** profiles work out of the box with zero setup (accounts are stored in a local JSON file, `server/data/users.json`). If you want them in MongoDB instead, just set:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_string
```

With `MONGO_URI` set but unreachable, the server logs it and falls back to the JSON file — it never crashes over storage. `JWT_SECRET` signs login tokens; if it's unset, a random dev secret is generated (logins then reset when the server restarts), so set it anywhere real.

Passwords are bcrypt-hashed, never stored or returned in plain text.

---

## 🛠️ Built with

React 18 · Vite · Tailwind CSS · Express · MongoDB (optional, via Mongoose) + bcrypt/JWT for accounts · the browser's own voice & camera APIs (Speech Recognition + Speech Synthesis) · optional Google Gemini · deployed on Render

## 🤝 For students, by a student

Found a topic missing? An explanation that could be simpler? A question an interviewer asked you that's not here? Open an issue or a PR — the whole point of putting this up is that it keeps getting better for the next person. My only request: keep explanations simple enough to say out loud to a friend. That's the rule I wrote every note by.

## 👩‍💻 About me

I'm **Ayushi Singh**, a final-year B.Tech CSE student (AKTU, Ghaziabad) graduating in April 2027. I build full-stack products with React, Node.js and TypeScript — Food for Mood AI, DSA Daily Coach, Trishul and UrjaSetu are mine — and I interned at Army Base Workshop, Meerut. This site started as my personal interview prep; it's now my gift to anyone preparing alongside me.

🔗 [LinkedIn](https://www.linkedin.com/in/ayushi0618/) · [Portfolio](https://ayushi-tech-06181.vercel.app) · [GitHub](https://github.com/ayushi0618)

---

*Prepare well, speak your answers out loud, and go get that offer. Good luck — I'm rooting for you.* 🚀
