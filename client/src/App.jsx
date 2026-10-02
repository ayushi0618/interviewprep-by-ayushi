import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Notes from './pages/Notes';
import MockInterview from './pages/MockInterview';
import Playground from './pages/Playground';

// Simple state-based routing (home | notes | mock | playground) — enough
// for a notes site, and it keeps the build a single static page the
// Express server can serve without extra config.
export default function App() {
  const [route, setRoute] = useState(() => {
    const saved = localStorage.getItem('ip_route');
    try { return saved ? JSON.parse(saved) : { name: 'home' }; } catch { return { name: 'home' }; }
  });

  useEffect(() => {
    localStorage.setItem('ip_route', JSON.stringify(route));
    window.scrollTo({ top: 0 });
  }, [route]);

  const goNotes = (slug) => setRoute({ name: 'notes', slug: slug || route.slug || localStorage.getItem('ip_last_slug') || 'javascript' });
  const goMock = (topic, mode) => setRoute({ name: 'mock', topic, mode });
  const goPlayground = () => setRoute({ name: 'playground' });

  useEffect(() => { if (route.name === 'notes' && route.slug) localStorage.setItem('ip_last_slug', route.slug); }, [route]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        route={route}
        onHome={() => setRoute({ name: 'home' })}
        onNotes={(slug) => goNotes(slug)}
        onMock={() => goMock()}
        onPlayground={goPlayground}
        onPracticeTopic={(slug) => goMock(slug, 'practice')}
      />
      <div className="flex-1">
        {route.name === 'home' && <Home onNotes={(slug) => goNotes(slug)} onMock={() => goMock()} onPlayground={goPlayground} />}
        {route.name === 'playground' && <Playground />}
        {route.name === 'notes' && (
          <Notes slug={route.slug || 'javascript'} onSelect={(slug) => goNotes(slug)} onMock={(slug) => goMock(slug, 'practice')} />
        )}
        {route.name === 'mock' && (
          <MockInterview
            key={`${route.topic || 'any'}-${route.mode || 'live'}`}
            practiceTopic={route.mode === 'practice' ? route.topic : null}
            liveTopic={route.mode !== 'practice' ? route.topic : null}
            onReadTopic={(slug) => goNotes(slug)}
          />
        )}
      </div>
    </div>
  );
}
