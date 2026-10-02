# 🎤 InterviewPrep by Ayushi Singh

A GeeksforGeeks-style interview-preparation website: full-stack notes that read like highlighted paper notes, timed flash-card practice, and a **live AI mock-interview room** (camera + voice) that asks you questions out loud, follows up on your answers, and grades you at the end.

Built from my own interview preparation — every note is written the way you'd explain it *out loud* in an interview.

## ✨ Features

- **📚 Notes library** — 12 topic guides with a sticky sidebar: JavaScript, React, Backend (Node/Express/APIs/DB), DSA, TypeScript, Next.js, SQL Deep-Dive, System Design for Freshers, Git & CS Fundamentals, HTML/CSS, Project Explainers + HR, and a Full Mock Bank with a 7-day plan
- **📝 "Paper notes" rendering** — warm paper cards, colored highlight boxes (Note / Tip / Important / Warning), comparison tables, diagram cards, dark code blocks with copy buttons, collapsible solutions, and paper checkboxes for revision checklists
- **🔍 Search** — filter topics *and* individual mock questions from the navbar
- **🎴 Practice mode** — pick a topic deck, answer out loud against a 60-second timer, reveal the model answer, rate yourself (Knew it / Shaky / Missed), and get a score summary with "revise these" links; progress is saved in your browser
- **🎥 Live AI Interview room** — camera/mic preview (never recorded or uploaded), the interviewer *speaks* questions (text-to-speech), you answer by voice (speech-to-text in Chrome/Edge) or typing, and at the end you get a per-question rubric, keyword gaps, model answers, and a full transcript
- **📱 Responsive** — desktop-first multi-column layout that stacks cleanly on mobile

## 🧠 How the AI interviewer works

`POST /api/interview` (Express) has two brains:

1. **Gemini mode** — if `GEMINI_API_KEY` is set, Gemini improvises follow-ups and feedback, anchored to the same question bank so scoring still works. Any API failure quietly falls back to scripted mode for that turn.
2. **Scripted mode** — a deterministic ladder with **no key required**: intro → 5 bank questions (up to 2 follow-ups each) → closing, with keyword-based feedback. If the API call itself ever fails, the frontend runs the same ladder locally — so the room *always* works.

Scoring is deliberately simple and explainable: answer length + keyword coverage against the model answer → Knew it / Shaky / Missed.

## 🛠️ Stack

- **Frontend:** React 18, Vite, Tailwind CSS, `marked` (markdown → HTML with custom callout/diagram transforms)
- **Backend:** Node.js + Express (serves the built site + the interview API)
- **Speech:** Web Speech API (`speechSynthesis` + `SpeechRecognition`) — no external services
- **Content:** each topic is a markdown file in `client/src/content/`; the practice question bank is generated from those files by `scripts/extract-bank.mjs`

## 🚀 Run it

```bash
npm install            # server deps
npm run install:client # frontend deps
npm run build          # builds the client into client/dist
npm start              # Express serves everything
```

Open the URL it prints (default port 3002, override with `PORT`).

For local development with hot reload:

```bash
npm run dev   # Vite on 5174 (proxies /api) + Express on 3002
```

### Optional: AI interviewer

Copy `.env.example` to `.env` and add your key:

```bash
GEMINI_API_KEY=your_key_here
```

Without it, everything — including the live interview room — still works in scripted mode.

### Regenerating the question bank

After editing any file in `client/src/content/`:

```bash
node scripts/extract-bank.mjs   # rewrites client/src/data/bank.json
```

## ✍️ Author

**Ayushi Singh** — final-year B.Tech CSE student (AKTU, Ghaziabad), MERN-stack developer.

[LinkedIn](https://www.linkedin.com/in/ayushi0618/) · [Portfolio](https://ayushi-tech-06181.vercel.app) · [GitHub](https://github.com/ayushi0618)

*Good luck — go get the offer.* 🚀
