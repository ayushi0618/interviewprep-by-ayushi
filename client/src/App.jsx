import { useEffect, useState } from 'react';
import { AuthProvider } from './lib/auth.jsx';
import { ProgressProvider } from './lib/progress.jsx';
import { TOPICS } from './content/topics';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Notes from './pages/Notes';
import MockInterview from './pages/MockInterview';
import Playground from './pages/Playground';
import DsaSheet from './pages/DsaSheet';
import ProblemPage from './pages/ProblemPage';
import StudyPlans from './pages/StudyPlans';
import Problems from './pages/Problems';
import Roadmap from './pages/Roadmap';
import Auth from './pages/Auth';
import Profile from './pages/Profile';

// State-based routing, mirrored into real URLs so pages are shareable:
//   /notes/:topic            → a guide's course page (chapter list)
//   /notes/:topic/:chapter   → one chapter of the guide
//   /problem/:id, /problems, /plans, /mock, ... for the rest.
// The URL wins on load (deep links), the saved route (ip_route) is the
// fallback at '/', and Back/Forward work via popstate.
//   home | notes | problems | roadmap | sheet | problem | plans | mock | playground | auth | profile
const PATH_FOR = {
  home: '/', problems: '/problems', roadmap: '/roadmap', sheet: '/sheet',
  plans: '/plans', mock: '/mock', playground: '/playground', auth: '/auth', profile: '/profile',
};

function routeFromPath(pathname) {
  const seg = String(pathname || '/').split('/').filter(Boolean).map((s) => {
    try { return decodeURIComponent(s); } catch { return s; }
  });
  if (!seg.length) return { name: 'home' };
  if (seg[0] === 'notes') {
    const slug = TOPICS.some((t) => t.slug === seg[1]) ? seg[1] : 'javascript';
    return { name: 'notes', slug, chapter: seg[2] || null };
  }
  if (seg[0] === 'problem' && seg[1]) return { name: 'problem', problemId: seg[1] };
  const name = Object.keys(PATH_FOR).find((k) => PATH_FOR[k] === `/${seg[0]}`);
  return name ? { name } : null;
}

function pathForRoute(route) {
  if (!route) return '/';
  if (route.name === 'notes') return `/notes/${route.slug || 'javascript'}${route.chapter ? `/${route.chapter}` : ''}`;
  if (route.name === 'problem') return `/problem/${route.problemId}`;
  return PATH_FOR[route.name] || '/';
}

export default function App() {
  const [route, setRoute] = useState(() => {
    const fromUrl = routeFromPath(window.location.pathname);
    if (fromUrl && window.location.pathname !== '/') return fromUrl;
    const saved = localStorage.getItem('ip_route');
    try { return saved ? JSON.parse(saved) : (fromUrl || { name: 'home' }); } catch { return fromUrl || { name: 'home' }; }
  });

  useEffect(() => {
    localStorage.setItem('ip_route', JSON.stringify(route));
    const target = pathForRoute(route);
    if (window.location.pathname !== target) window.history.pushState(null, '', target);
    window.scrollTo({ top: 0 });
  }, [route]);

  useEffect(() => {
    const onPop = () => { const r = routeFromPath(window.location.pathname); if (r) setRoute(r); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const goHome = () => setRoute({ name: 'home' });
  const goNotes = (slug, chapter) => setRoute({
    name: 'notes',
    slug: slug || route.slug || localStorage.getItem('ip_last_slug') || 'javascript',
    chapter: chapter || null,
  });
  const goMock = (topic, mode) => setRoute({ name: 'mock', topic, mode });
  const goPlayground = () => setRoute({ name: 'playground' });
  const goSheet = () => setRoute({ name: 'sheet' });
  const goProblems = () => setRoute({ name: 'problems' });
  const goRoadmap = () => setRoute({ name: 'roadmap' });
  const goProblem = (problemId) => setRoute({ name: 'problem', problemId });
  const goPlans = () => setRoute({ name: 'plans' });
  const goAuth = () => setRoute({ name: 'auth' });
  const goProfile = () => setRoute({ name: 'profile' });

  useEffect(() => { if (route.name === 'notes' && route.slug) localStorage.setItem('ip_last_slug', route.slug); }, [route]);

  return (
    <AuthProvider>
      <ProgressProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar
            route={route}
            onHome={goHome}
            onNotes={(slug, chapter) => goNotes(slug, chapter)}
            onProblems={goProblems}
            onRoadmap={goRoadmap}
            onSheet={goSheet}
            onPlans={goPlans}
            onMock={() => goMock()}
            onPlayground={goPlayground}
            onPracticeTopic={(slug) => goMock(slug, 'practice')}
            onProblem={goProblem}
            onAuth={goAuth}
            onProfile={goProfile}
          />
          <div className="flex-1">
            {route.name === 'home' && (
              <Home
                onNotes={(slug, chapter) => goNotes(slug, chapter)}
                onMock={() => goMock()}
                onPlayground={goPlayground}
                onSheet={goSheet}
                onPlans={goPlans}
                onOpenProblem={goProblem}
                onProblems={goProblems}
                onRoadmap={goRoadmap}
              />
            )}
            {route.name === 'playground' && <Playground />}
            {route.name === 'notes' && (
              <Notes
                slug={route.slug || 'javascript'}
                chapter={route.chapter || null}
                onSelectTopic={(slug) => goNotes(slug)}
                onSelectChapter={(chapterSlug) => goNotes(route.slug || 'javascript', chapterSlug)}
                onMock={(slug) => goMock(slug, 'practice')}
                onHome={goHome}
              />
            )}
            {route.name === 'problems' && <Problems onProblem={goProblem} />}
            {route.name === 'roadmap' && <Roadmap onSheet={goSheet} onProblem={goProblem} />}
            {route.name === 'sheet' && <DsaSheet onOpenProblem={goProblem} />}
            {route.name === 'problem' && (
              <ProblemPage
                key={route.problemId}
                problemId={route.problemId}
                onBack={goSheet}
                onOpenProblem={goProblem}
                onOpenArticle={(slug) => goNotes(slug)}
              />
            )}
            {route.name === 'plans' && (
              <StudyPlans
                onOpenArticle={(slug, chapter) => goNotes(slug, chapter)}
                onOpenProblem={goProblem}
                onPractice={(slug) => goMock(slug, 'practice')}
                onOpenPlayground={goPlayground}
                onOpenInterview={() => goMock()}
              />
            )}
            {route.name === 'auth' && <Auth onDone={goProfile} />}
            {route.name === 'profile' && (
              <Profile
                onAuth={goAuth}
                onNotes={() => goNotes()}
                onSheet={goSheet}
                onPlans={goPlans}
                onMock={() => goMock()}
                onHome={goHome}
              />
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
          <Footer
            onNotes={(slug) => goNotes(slug)}
            onSheet={goSheet}
            onPlans={goPlans}
            onMock={() => goMock()}
            onPlayground={goPlayground}
            onProblems={goProblems}
            onRoadmap={goRoadmap}
          />
        </div>
      </ProgressProvider>
    </AuthProvider>
  );
}
