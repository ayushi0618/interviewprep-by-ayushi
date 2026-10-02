import { TOPICS, TOTAL_QUESTIONS } from '../content/topics';
import { PROBLEMS } from '../data/dsaSheet';
import { PLANS, planItemCount } from '../data/plans';
import { useProgress } from '../lib/progress.jsx';
import { useAuth } from '../lib/auth.jsx';
import { isTopicComplete, isChapterDone, isProblemSolved, isPlanItemDone, topicChapterCounts, courseChapterTotals, problemSolvedCount } from '../lib/progress';
import Logo from '../components/Logo';

// Small SVG progress ring (used on plan cards + dashboard).
function Ring({ pct, size = 52, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ECE8F9" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#7C6BD9" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`} />
      <text x="50%" y="50%" dy="0.35em" textAnchor="middle" className="fill-brand-800 font-extrabold"
        fontSize={size / 3.6} transform={`rotate(90 ${size / 2} ${size / 2})`}>{pct}%</text>
    </svg>
  );
}

export default function Home({ onNotes, onMock, onPlayground, onSheet, onPlans, onOpenProblem, onProblems, onRoadmap }) {
  const { progress, syncState } = useProgress();
  const { user } = useAuth();
  const practiceTopics = TOPICS.filter((t) => t.questions.length > 0).length;
  const groups = [...new Set(TOPICS.map((t) => t.group))];

  // --- dashboard numbers (one progress store → every meter agrees) ---
  const chTotals = courseChapterTotals(progress, TOPICS.map((t) => t.slug));
  const problemsSolved = problemSolvedCount(progress, PROBLEMS.map((p) => p.id));
  const planTotals = PLANS.map((plan) => ({
    plan,
    total: planItemCount(plan),
    done: plan.chapters.flatMap((c) => c.items).filter((it) => isPlanItemDone(progress, plan, it)).length,
  }));
  const planItemsTotal = planTotals.reduce((n, x) => n + x.total, 0);
  const planItemsDone = planTotals.reduce((n, x) => n + x.done, 0);

  // Continue where you left off: next unfinished chapter, else next problem.
  const nextTopic = TOPICS.find((t) => !isTopicComplete(progress, t.slug));
  const nextChapter = nextTopic?.chapters.find((c) => !isChapterDone(progress, nextTopic.slug, c.slug));
  const nextProblem = PROBLEMS.find((p) => !isProblemSolved(progress, p.id));
  const started = chTotals.done + problemsSolved + planItemsDone > 0;

  const meter = (done, total) => (
    <div className="h-2 rounded-full bg-brand-100 overflow-hidden mt-2">
      <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
    </div>
  );

  const goProblems = onProblems || onSheet;
  const goRoadmap = onRoadmap || onPlans;

  return (
    <div>
      {/* Hero — soft lavender */}
      <section className="bg-gradient-to-b from-brand-50 via-[#FCFAFF] to-white border-b border-brand-100">
        <div className="max-w-7xl mx-auto px-4 py-14 md:py-20">
          <p className="text-brand-600 font-bold tracking-wide text-sm">FULL-STACK INTERVIEW PREPARATION</p>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mt-3 text-brand-900">
            InterviewPrep <span className="text-brand-500 text-2xl md:text-4xl align-middle font-bold">by Ayushi Singh</span>
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600 text-lg leading-relaxed">
            Notes that read like notes — highlighted, example-first, in speakable language — a DSA sheet you
            solve in the browser, study plans that tick themselves, and a mock-interview room where an AI
            interviewer asks you questions <em>out loud</em>.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => onNotes('javascript')} className="btn-primary px-6 py-3 text-base">
              📚 Start reading
            </button>
            <button onClick={() => onMock()} className="bg-amber-400 text-amber-950 font-bold px-6 py-3 rounded-xl shadow-card hover:bg-amber-300 transition">
              🎤 Enter the mock room
            </button>
            <button onClick={goProblems} className="btn-outline px-6 py-3 text-base">
              🧩 Browse problems
            </button>
          </div>
          {/* Live-computed stats strip */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
            {[
              [`${TOPICS.length}`, 'topic guides'],
              [`${PROBLEMS.length}`, 'DSA problems'],
              [`${TOTAL_QUESTIONS}+`, 'mock questions'],
              [`${PLANS.length}`, 'study plans'],
            ].map(([n, l]) => (
              <div key={l} className="bg-white rounded-xl px-4 py-3 border border-brand-100 shadow-card">
                <p className="text-2xl font-extrabold text-brand-900">{n}</p>
                <p className="text-slate-500 text-sm">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Continue learning dashboard */}
      <section className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-3xl border border-brand-100 shadow-card p-6 md:p-7">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-extrabold text-brand-900">
              {user ? `Welcome back, ${user.name.split(/\s+/)[0]} 👋` : 'Your progress 👋'}
            </h2>
            <span className="text-xs font-bold rounded-full bg-brand-50 border border-brand-200 text-brand-800 px-2.5 py-1">
              {syncState === 'synced' ? '☁️ Synced to your profile ✓'
                : syncState === 'syncing' ? '☁️ Syncing…'
                : syncState === 'error' ? '☁️ Sync will retry shortly'
                : 'Guest mode — create a profile to sync across devices'}
            </span>
            {nextTopic ? (
              <button onClick={() => onNotes(nextTopic.slug, nextChapter?.slug)} className="btn-primary ml-auto text-sm">
                Continue: {nextTopic.emoji} {nextTopic.title}{nextChapter ? ` · ${nextChapter.title}` : ''} →
              </button>
            ) : nextProblem ? (
              <button onClick={() => onOpenProblem(nextProblem.id)} className="btn-primary ml-auto text-sm">
                Next problem: {nextProblem.title} →
              </button>
            ) : (
              <span className="ml-auto text-sm font-bold text-brand-700">🎉 Course + sheet complete — amazing!</span>
            )}
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-5">
            <button onClick={() => onNotes()} className="card-hover text-left rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
              <p className="font-extrabold text-brand-900">📚 Notes <span className="float-right text-brand-800">{chTotals.done}/{chTotals.total}</span></p>
              {meter(chTotals.done, chTotals.total)}
              <p className="text-xs font-semibold text-slate-500 mt-2">{started ? 'Chapters ticked off across all guides' : 'Read a chapter, tick it complete'}</p>
            </button>
            <button onClick={onSheet} className="card-hover text-left rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
              <p className="font-extrabold text-brand-900">🧩 DSA Sheet <span className="float-right text-brand-800">{problemsSolved}/{PROBLEMS.length}</span></p>
              {meter(problemsSolved, PROBLEMS.length)}
              <p className="text-xs font-semibold text-slate-500 mt-2">Problems solved in the browser judge</p>
            </button>
            <button onClick={onPlans} className="card-hover text-left rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
              <p className="font-extrabold text-brand-900">📋 Study Plans <span className="float-right text-brand-800">{planItemsDone}/{planItemsTotal}</span></p>
              {meter(planItemsDone, planItemsTotal)}
              <p className="text-xs font-semibold text-slate-500 mt-2">Plan items ticked (many tick themselves)</p>
            </button>
          </div>
        </div>
      </section>

      {/* Topics strip — quick-jump pills */}
      <section className="bg-white border-b border-brand-100 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3 overflow-x-auto nice-scroll pb-1">
            <span className="text-sm font-extrabold text-brand-900 whitespace-nowrap">Tutorials:</span>
            {TOPICS.map((t) => (
              <button key={t.slug} onClick={() => onNotes(t.slug)}
                className="whitespace-nowrap rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-600 hover:text-white hover:border-brand-600">
                {t.emoji} {t.title}
                {isTopicComplete(progress, t.slug) && <span className="ml-1.5 text-brand-600 font-extrabold">✓</span>}
              </button>
            ))}
            <button onClick={onPlayground}
              className="whitespace-nowrap rounded-full bg-brand-600 px-3.5 py-1.5 text-sm font-bold text-white transition hover:bg-brand-700">
              ▶ Code Playground
            </button>
          </div>
        </div>
      </section>

      {/* Study plan cards */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-brand-900">Study plans 📋</h2>
            <p className="text-slate-600 mt-1">LeetCode-style plans — chapters of real work on this site, ticking themselves off as you go.</p>
          </div>
          <button onClick={onPlans} className="btn-outline ml-auto text-sm">All study plans →</button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
          {planTotals.map(({ plan, total, done }) => {
            const pct = total ? Math.round((done / total) * 100) : 0;
            const isStarted = Boolean(progress.planStart?.[plan.id]) || done > 0;
            return (
              <button key={plan.id} onClick={onPlans}
                className="card-hover text-left bg-white rounded-2xl border border-brand-100 shadow-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl">{plan.emoji}</span>
                  {isStarted && <Ring pct={pct} />}
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 mt-3">{plan.title}</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed line-clamp-2">{plan.tagline}</p>
                <p className="text-xs font-bold text-brand-600 mt-3">
                  {total} items · {plan.chapters.length} chapters{isStarted ? ` · ${done} done` : ''} →
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Topic cards — grouped by TOPICS group */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-2xl md:text-3xl font-extrabold text-brand-900">Pick a topic, read it like notes 📖</h2>
        <p className="text-slate-600 mt-1">Every guide ends with mock questions and a 60-second revision checklist.</p>
        {groups.map((g) => (
          <div key={g} className="mt-8">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-500">{g}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {TOPICS.filter((t) => t.group === g).map((t) => {
                const doneGuide = isTopicComplete(progress, t.slug);
                const counts = topicChapterCounts(progress, t.slug);
                return (
                  <button key={t.slug} onClick={() => onNotes(t.slug)}
                    className="card-hover text-left bg-white rounded-2xl border border-brand-100 shadow-card p-5">
                    <div className="flex items-start justify-between">
                      <span className="text-3xl">{t.emoji}</span>
                      {doneGuide
                        ? <span className="text-[0.65rem] font-extrabold bg-brand-600 text-white px-2 py-0.5 rounded-full">✓ DONE</span>
                        : t.isNew && <span className="text-[0.65rem] font-extrabold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">NEW</span>}
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mt-3 leading-snug">{t.title}</h3>
                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{t.blurb}</p>
                    <p className="text-xs font-bold text-brand-600 mt-3">
                      {t.group} · {counts.done}/{counts.total} chapters · {t.questions.length > 0 ? `🎤 ${t.questions.length} mock questions` : '📖 Guide'} →
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Features strip */}
      <section className="bg-white border-y border-brand-100">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-extrabold text-brand-900">Everything you need, one site ✨</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
            {[
              ['🧩', 'Problems', `${PROBLEMS.length} problems to browse by topic and difficulty.`, goProblems],
              ['🗺️', 'Roadmap', 'A guided path from first guide to interview-ready.', goRoadmap],
              ['📋', 'DSA Sheet', `${PROBLEMS.length} problems — explain, code, run tests, submit.`, onSheet],
              ['🎯', 'Study Plans', `${PLANS.length} plans that tick themselves as you learn.`, onPlans],
              ['▶', 'Run Code', 'A JavaScript + SQL compiler in your browser. Ctrl+Enter and go.', onPlayground],
            ].map(([icon, title, body, go]) => (
              <button key={title} onClick={go} className="card-hover text-left rounded-2xl bg-white border border-brand-100 p-5 shadow-card">
                <span className="text-3xl">{icon}</span>
                <h3 className="font-bold text-brand-900 mt-3">{title}</h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{body}</p>
              </button>
            ))}
          </div>

          <h2 className="text-2xl font-extrabold text-brand-900 mt-12">The 3-pass method 🗺️</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {[
              ['1️⃣ Read', 'Read one guide end-to-end (30–45 min). Don’t memorise — understand. The highlight boxes are the interview traps.'],
              ['2️⃣ Say it + solve it', 'Explain each topic out loud, then prove it on the DSA Sheet — code it, run the tests, submit.'],
              ['3️⃣ Get interviewed', 'Attempt the mock questions, follow a study plan, then enter the mock room — the AI asks, follows up, and scores you.'],
            ].map(([h, b]) => (
              <div key={h} className="rounded-2xl bg-white border border-brand-100 p-5 shadow-card">
                <h3 className="font-bold text-brand-900">{h}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Author section */}
      <footer className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-brand-900 text-white rounded-3xl p-7 md:p-10 flex flex-col md:flex-row gap-6 md:items-center shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-white grid place-items-center shrink-0 shadow-card">
            <Logo size={52} />
          </div>
          <div className="flex-1">
            <p className="text-brand-300 text-xs font-extrabold tracking-widest">ABOUT THE AUTHOR</p>
            <h3 className="text-xl font-extrabold mt-1">Ayushi Singh</h3>
            <p className="text-brand-100/90 text-sm leading-relaxed mt-1 max-w-xl">
              Final-year B.Tech CSE student (AKTU, Ghaziabad) and MERN-stack developer. These notes are my real
              interview preparation — if they help you crack a question, that’s the whole point.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold transition" href="https://www.linkedin.com/in/ayushi0618/" target="_blank" rel="noreferrer">LinkedIn ↗</a>
            <a className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold transition" href="https://ayushi-tech-06181.vercel.app" target="_blank" rel="noreferrer">Portfolio ↗</a>
            <a className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold transition" href="https://github.com/ayushi0618" target="_blank" rel="noreferrer">GitHub ↗</a>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">{practiceTopics} practice decks · InterviewPrep by Ayushi Singh · Made with ☕ and real interview prep 🚀</p>
      </footer>
    </div>
  );
}
