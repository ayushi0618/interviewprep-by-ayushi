import { useEffect, useState } from 'react';
import { AuthProvider } from './lib/auth.jsx';
import { ProgressProvider } from './lib/progress.jsx';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Notes from './pages/Notes';
import MockInterview from './pages/MockInterview';
import Playground from './pages/Playground';
import DsaSheet from './pages/DsaSheet';
import ProblemPage from './pages/ProblemPage';
import StudyPlans from './pages/StudyPlans';
import Auth from './pages/Auth';
import Profile from './pages/Profile';

// Simple state-based routing — enough for a notes site, and it keeps the
// build a single static page the Express server can serve. The route is
// remembered (ip_route) so a refresh keeps your place.
//   home | notes | sheet | problem | plans | mock | playground | auth | profile
export default function App() {
  const [route, setRoute] = useState(() => {
    const saved = localStorage.getItem('ip_route');
    try { return saved ? JSON.parse(saved) : { name: 'home' }; } catch { return { name: 'home' }; }
  });

  useEffect(() => {
    localStorage.setItem('ip_route', JSON.stringify(route));
    window.scrollTo({ top: 0 });
  }, [route]);

  const goHome = () => setRoute({ name: 'home' });
  const goNotes = (slug) => setRoute({ name: 'notes', slug: slug || route.slug || localStorage.getItem('ip_last_slug') || 'javascript' });
  const goMock = (topic, mode) => setRoute({ name: 'mock', topic, mode });
  const goPlayground = () => setRoute({ name: 'playground' });
  const goSheet = () => setRoute({ name: 'sheet' });
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
            onNotes={(slug) => goNotes(slug)}
            onSheet={goSheet}
            onPlans={goPlans}
            onMock={() => goMock()}
            onPlayground={goPlayground}
            onPracticeTopic={(slug) => goMock(slug, 'practice')}
            onAuth={goAuth}
            onProfile={goProfile}
          />
          <div className="flex-1">
            {route.name === 'home' && (
              <Home
                onNotes={(slug) => goNotes(slug)}
                onMock={() => goMock()}
                onPlayground={goPlayground}
                onSheet={goSheet}
                onPlans={goPlans}
                onOpenProblem={goProblem}
              />
            )}
            {route.name === 'playground' && <Playground />}
            {route.name === 'notes' && (
              <Notes slug={route.slug || 'javascript'} onSelect={(slug) => goNotes(slug)} onMock={(slug) => goMock(slug, 'practice')} />
            )}
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
                onOpenArticle={(slug) => goNotes(slug)}
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
          />
        </div>
      </ProgressProvider>
    </AuthProvider>
  );
}
