import { TOPICS, TOTAL_QUESTIONS } from '../content/topics';

export default function Home({ onNotes, onMock }) {
  const practiceTopics = TOPICS.filter((t) => t.questions.length > 0).length;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-800 via-brand-700 to-brand-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-14 md:py-20">
          <p className="text-brand-200 font-bold tracking-wide text-sm">FULL-STACK INTERVIEW PREPARATION</p>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mt-3">
            InterviewPrep <span className="text-amber-300 text-2xl md:text-4xl align-middle font-bold">by Ayushi Singh</span>
          </h1>
          <p className="mt-4 max-w-2xl text-brand-50/90 text-lg leading-relaxed">
            Notes that read like notes — highlighted, example-first, in speakable language — plus a mock-interview room
            where an AI interviewer asks you questions <em>out loud</em>. Built from my own full-stack interview preparation.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => onNotes('javascript')} className="bg-white text-brand-800 font-bold px-6 py-3 rounded-xl shadow-card hover:bg-brand-50 transition">
              📚 Start reading
            </button>
            <button onClick={() => onMock()} className="bg-amber-400 text-amber-950 font-bold px-6 py-3 rounded-xl shadow-card hover:bg-amber-300 transition">
              🎤 Enter the mock room
            </button>
          </div>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
            {[
              [`${TOPICS.length}`, 'topic guides'],
              [`${TOTAL_QUESTIONS}+`, 'mock questions'],
              [`${practiceTopics}`, 'practice decks'],
              ['1', 'AI interviewer'],
            ].map(([n, l]) => (
              <div key={l} className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur">
                <p className="text-2xl font-extrabold">{n}</p>
                <p className="text-brand-100 text-sm">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Topic cards */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-extrabold text-brand-900">Pick a topic, read it like notes 📖</h2>
        <p className="text-slate-600 mt-1">Every guide ends with mock questions and a 60-second revision checklist.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-7">
          {TOPICS.map((t) => (
            <button key={t.slug} onClick={() => onNotes(t.slug)}
              className="text-left bg-white rounded-2xl border border-brand-100 shadow-card p-5 hover:-translate-y-0.5 hover:border-brand-300 transition">
              <div className="flex items-start justify-between">
                <span className="text-3xl">{t.emoji}</span>
                {t.isNew && <span className="text-[0.65rem] font-extrabold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">NEW</span>}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mt-3 leading-snug">{t.title}</h3>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{t.blurb}</p>
              <p className="text-xs font-bold text-brand-600 mt-3">
                {t.questions.length > 0 ? `🎤 ${t.questions.length} mock questions inside` : '📖 Read the guide'} →
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* How to use */}
      <section className="bg-white border-y border-brand-100">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-extrabold text-brand-900">The 3-pass method 🗺️</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {[
              ['1️⃣ Read', 'Read one guide end-to-end (30–45 min). Don’t memorise — understand. The highlight boxes are the interview traps.'],
              ['2️⃣ Say it out loud', 'Close the guide and explain each topic like the interviewer just asked. Where you stumble = what to re-read.'],
              ['3️⃣ Get interviewed', 'Attempt the mock questions at the end, then enter the mock room — the AI asks, follows up, and scores you.'],
            ].map(([h, b]) => (
              <div key={h} className="rounded-2xl bg-[#fbfdfc] border border-brand-100 p-5 shadow-card">
                <h3 className="font-bold text-brand-900">{h}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Author footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-brand-900 text-white rounded-3xl p-7 md:p-10 flex flex-col md:flex-row gap-6 md:items-center shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 text-brand-900 grid place-items-center text-3xl shrink-0">👩‍💻</div>
          <div className="flex-1">
            <p className="text-brand-300 text-xs font-extrabold tracking-widest">ABOUT THE AUTHOR</p>
            <h3 className="text-xl font-extrabold mt-1">Ayushi Singh</h3>
            <p className="text-brand-100/90 text-sm leading-relaxed mt-1 max-w-xl">
              Final-year B.Tech CSE student (AKTU, Ghaziabad) and MERN-stack developer. These notes are my real
              interview preparation — if they help you crack a question, that’s the whole point.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold" href="https://www.linkedin.com/in/ayushi0618/" target="_blank" rel="noreferrer">LinkedIn ↗</a>
            <a className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold" href="https://ayushi-tech-06181.vercel.app" target="_blank" rel="noreferrer">Portfolio ↗</a>
            <a className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold" href="https://github.com/ayushi0618" target="_blank" rel="noreferrer">GitHub ↗</a>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">InterviewPrep by Ayushi Singh · Made with ☕ and real interview prep · Good luck — go get the offer 🚀</p>
      </footer>
    </div>
  );
}
