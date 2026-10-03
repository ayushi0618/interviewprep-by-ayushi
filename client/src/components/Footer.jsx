import { TOPICS } from '../content/topics';
import Logo from './Logo';

// Site footer — brand + columns (Topics, Practice, About). Rendered on
// every page by App.jsx.
export default function Footer({ onNotes, onSheet, onPlans, onMock, onPlayground, onProblems, onRoadmap }) {
  const link = 'block text-sm text-brand-100/80 hover:text-white transition py-0.5 text-left';
  return (
    <footer className="bg-brand-900 text-white mt-auto">
      <div className="page-container py-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-white grid place-items-center shadow-card"><Logo size={30} /></span>
            <span className="leading-tight">
              <span className="block font-extrabold">InterviewPrep</span>
              <span className="block text-[0.7rem] font-semibold text-brand-300 -mt-0.5">by Ayushi Singh</span>
            </span>
          </div>
          <p className="text-sm text-brand-100/80 leading-relaxed mt-3 max-w-xs">
            My own interview preparation, turned into a website for every student
            preparing alongside me. Read, run, get interviewed.
          </p>
        </div>

        <nav aria-label="Topics">
          <p className="text-xs font-extrabold tracking-widest text-brand-300">TOPICS</p>
          <div className="mt-3">
            {TOPICS.slice(0, 6).map((t) => (
              <button key={t.slug} className={link} onClick={() => onNotes(t.slug)}>{t.emoji} {t.title}</button>
            ))}
          </div>
        </nav>

        <nav aria-label="Practice">
          <p className="text-xs font-extrabold tracking-widest text-brand-300">PRACTICE</p>
          <div className="mt-3">
            {onProblems && <button className={link} onClick={onProblems}>🧩 Problems</button>}
            {onRoadmap && <button className={link} onClick={onRoadmap}>🗺️ Roadmap</button>}
            <button className={link} onClick={onSheet}>📋 DSA Sheet</button>
            <button className={link} onClick={onPlans}>🎯 Study Plans</button>
            <button className={link} onClick={() => onMock()}>🎤 Mock Interview</button>
            <button className={link} onClick={onPlayground}>▶ Run Code</button>
            <button className={link} onClick={() => onNotes('mock-bank')}>🎤 Full Mock Bank</button>
          </div>
        </nav>

        <div>
          <p className="text-xs font-extrabold tracking-widest text-brand-300">ABOUT AYUSHI</p>
          <p className="text-sm text-brand-100/80 leading-relaxed mt-3">
            Final-year B.Tech CSE student (AKTU, Ghaziabad) · MERN-stack developer ·
            graduating April 2027.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <a className="bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition" href="https://www.linkedin.com/in/ayushi0618/" target="_blank" rel="noreferrer">LinkedIn ↗</a>
            <a className="bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition" href="https://ayushi-tech-06181.vercel.app" target="_blank" rel="noreferrer">Portfolio ↗</a>
            <a className="bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition" href="https://github.com/ayushi0618" target="_blank" rel="noreferrer">GitHub ↗</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="page-container py-4 text-center text-xs text-brand-200/70">
          InterviewPrep by Ayushi Singh · Free for every student · Good luck — go get the offer 🚀
        </p>
      </div>
    </footer>
  );
}
