# 🎤 Full Mock Interview Bank

> [!IMPORTANT]
> **How to run this mock:** sit with a friend, a senior, or even your phone's voice recorder. Set a timer. The *interviewer* asks from the rounds below — no hints, no "let me just check my notes." Answer out loud, every time. Shaky answers get marked and revised from the topic files. A real interview is 60–70% speaking confidence on things you already know.

---

## 🔴 Use this bank with the Live Interview room

Use this page as the question source, and the site's two modes as the training loop: in **Practice mode**, rehearse one round at a time without pressure — say each answer out loud, then open the topic file and fix only what wobbled. In the **Live Interview room**, run the full 45-minute format below exactly as written, camera and mic on, no notes and no pausing — treat it like the real slot. After every Live run, score yourself with the rubric on this page, take the 1s and 2s back into Practice, then go Live again. Practice builds the answers; Live builds the nerve.

## 🕐 The format (45 minutes, like a real round)

| Round | Time | From |
|-------|------|------|
| 1. Rapid Fire | 5 min | 10 one-line questions, no thinking time |
| 2. JavaScript + React | 15 min | Concepts + one output question + one bug to spot |
| 3. Backend + DSA | 15 min | Concepts + one approach question (talk, don't code) |
| 4. Projects + HR | 10 min | Your story, your projects, your questions for them |

---

## ⚡ Round 1 — Rapid Fire (answer in one line each)

1. `typeof null` → ? *(object — a famous old bug)*
2. Difference between `==` and `===`?
3. What does `useState` return?
4. HTTP status 401 vs 403?
5. Time complexity of binary search?
6. What is a closure?
7. GET vs POST — one difference?
8. What does `git pull` do?
9. MongoDB or MySQL — which is NoSQL?
10. What is JSX?

> [!TIP]
> Missed one? It's a 2-minute fix — every one of these is a highlighted box in the topic files. Rapid fire is free marks; don't lose them.

---

## 💻 Round 2 — JavaScript + React (pick any 6)

Full model answers live at the end of [01-javascript.md](./01-javascript.md) and [02-react.md](./02-react.md). Interviewer: ask 2 from each + the exercises.

**JavaScript**
1. Explain the event loop with a `setTimeout(0)` example.
2. `var`, `let`, `const` — scope, hoisting, TDZ.
3. What is a closure? Give a real use case.
4. `==` vs `===` — what will `1 + "2"` and `"A" - "B"` print, and why?
5. How do Promises work? How do you handle errors in `async/await`?

**React**
6. Why does a `useEffect` with no dependency array cause an infinite loop sometimes?
7. Why do lists need keys? Why is the array index a risky key?
8. `useMemo` vs `useCallback` — and when should you *not* use them?
9. How do you fetch data in React? Where do loading and error states live?
10. Props vs state — who owns what?

**Exercises (interviewer reads these aloud)**
- 🐛 *Bug spot:* "My component fetches data and sets state inside `useEffect` with no dependency array. The page keeps flickering and the network tab shows hundreds of calls. What's wrong?" → [Bug Hunt, 02-react.md](./02-react.md)
- 🎯 *Output:* "A loop with `var` and a zero-delay `setTimeout` prints the same number three times. Why — and what's the one-word fix?" → [Output Questions, 01-javascript.md](./01-javascript.md)

---

## 🖥️ Round 3 — Backend + DSA (pick any 6)

Model answers: end of [03-backend.md](./03-backend.md) and [04-dsa.md](./04-dsa.md).

**Backend**
1. Walk me through what happens when a request hits your Express server.
2. How does JWT authentication work? Where do you store the token?
3. Why do we hash passwords? What does bcrypt do?
4. SQL vs NoSQL — when would you pick each?
5. Explain middleware. What is `next()`?
6. Your API returns 500s under load — first three things you check?

**DSA (talk the approach — no code)**
7. How do you detect a cycle in a linked list?
8. "Find two numbers that add up to a target" — slowest way, then fastest way. What changes?
9. When do you reach for sliding window vs two pointers?
10. BFS vs DFS — one problem where each wins.

---

## 🎯 Round 4 — Projects + HR

Your complete scripts are in [06-projects-and-hr.md](./06-projects-and-hr.md). Interviewer asks:

1. "Tell me about yourself." *(45 seconds, no life story)*
2. Pick your strongest project — explain it like I'm a smart non-programmer.
3. What was the hardest bug you fixed? How did you find it?
4. What would you rebuild differently today?
5. "Why should we hire a fresher?" 
6. **Your turn:** ask them 2 questions. *(Never say "no questions." Ask about the team, the tech, what a good first 90 days looks like.)*

---

## 📊 Scoring rubric (interviewer fills this in)

| Skill | 1 — Shaky | 2 — Getting there | 3 — Interview-ready |
|-------|-----------|-------------------|---------------------|
| Concepts | Defines vaguely, no example | Defines + example with prompting | Defines, example, *and* a trap to avoid |
| Speaking | Reads/whispers, long pauses | Answers in own words | Structured: point → example → wrap-up |
| Projects | Lists features | Explains flow | Explains flow + one hard problem + one improvement |
| DSA approach | Jumps to code | States brute force, then improves | States pattern first, complexity, then approach |
| Confidence | Apologises for answers | Neutral | Calm, honest "I don't know — here's how I'd find out" |

> [!NOTE]
> **The rule for "I don't know":** never bluff. Say what you *do* know nearby, then "I'd verify this by…" — interviewers rate honest-and-close above confident-and-wrong, every single time.

---

## 🆘 Panic recovery — what to say when you blank

Blanking for five seconds feels like a disaster. It isn't — silence and panic-apologies are what hurt you. Interviewers expect small pauses; what they judge is how you recover. Keep one of these three lines ready and say it calmly, exactly as written:

- **Buy yourself time (use first, always works):** "Let me think about that for a second — I want to structure this properly." Then breathe, find your first point (definition, example, or step one), and start there. Five quiet seconds after this line reads as *thoughtful*, not stuck.
- **You know the neighbourhood, not the exact answer:** "I haven't used that directly in a project, but here's what I do know around it…" Say the closest true thing you know — a related concept, where it appears, what problem it solves — then finish honestly. Nearby-and-true beats exact-and-invented every single time.
- **Complete blank (the honest rescue):** "I'm not fully sure about that one. If I hit this in real work, my first step would be…" — then describe your actual first step: checking the docs, reproducing it small, or logging what the code receives. You have just answered a different, better question: *how does this person handle not knowing?* That's a question every team asks.

> [!TIP]
> After you recover, **stop**. Give the answer, land it, and let the interviewer move on. The fastest way to turn a small blank into a bad impression is over-explaining for two minutes to compensate. Recover, answer, stop — in that order.

**After each Live run — the 5-minute debrief (do this while it's fresh):**

- Write down every question where you blanked or rambled, word for word. No judging, just capture — memory rewrites the run kindly within an hour.
- For each one, say the fixed 30-second version out loud *once*, right then. One clean repetition now beats ten panicked re-reads tomorrow.
- Score honestly with the rubric above, then pick at most **three** fixes for your next Practice session. A list of twelve fixes means none of them get fixed.
- Note one thing that went *well* too — a clean project story, a calm recovery. You are training confidence on evidence, not just hunting for flaws.

Keep the debrief ruthless and short: five minutes, three fixes maximum, then close the file. Reviewing a mock for an hour teaches you less than running a second mock does.
The next Live run is where the fix gets proven — not in your notes, out loud.

---

## 📅 The 7-day mock plan

| Day | Do this |
|-----|---------|
| 1 | Rapid Fire + JS round (record yourself) |
| 2 | React round + both exercises |
| 3 | Backend round |
| 4 | DSA approach round (talk only, no code) |
| 5 | Projects + HR, out loud, standing up |
| 6 | Full 45-min mock with the rubric |
| 7 | Fix only the 1s and 2s. Sleep early. |

---

*Part of **Full-Stack Interview Notes by Ayushi Singh** · [← Back to index](./README.md)*
