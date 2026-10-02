import { TOPICS } from '../content/topics';

// Left topic list. Sticky on desktop; the Notes page wraps this in a
// slide-in drawer on mobile.
export default function Sidebar({ active, onSelect }) {
  const groups = [...new Set(TOPICS.map((t) => t.group))];
  return (
    <div className="py-4">
      {groups.map((g) => (
        <div key={g} className="mb-5">
          <p className="px-4 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-500">{g}</p>
          <ul className="mt-2 space-y-0.5">
            {TOPICS.filter((t) => t.group === g).map((t) => (
              <li key={t.slug}>
                <button
                  onClick={() => onSelect(t.slug)}
                  className={`w-full text-left px-4 py-2.5 rounded-r-xl text-[0.92rem] font-medium flex items-center gap-2.5 transition border-l-4 ${
                    active === t.slug
                      ? 'bg-brand-600 text-white border-brand-800 shadow-card'
                      : 'text-slate-700 hover:bg-brand-50 border-transparent'
                  }`}
                >
                  <span className="text-base">{t.emoji}</span>
                  <span className="flex-1 leading-snug">{t.title}</span>
                  {t.questions.length > 0 && (
                    <span className={`text-[0.68rem] font-bold px-1.5 py-0.5 rounded-md ${active === t.slug ? 'bg-white/25 text-white' : 'bg-brand-100 text-brand-700'}`}>
                      {t.questions.length} Q
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
