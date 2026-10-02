import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import Logo from '../components/Logo';

// Login / Sign up. Accounts are an enhancement, never a wall: guests keep
// every feature with progress saved on this device; a profile adds
// cross-device sync (see lib/progress.jsx).
export default function Auth({ onDone }) {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (tab === 'signup') await signup(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
      onDone();
    } catch (err) {
      setError(err.message || 'Something went wrong — try again.');
    } finally {
      setBusy(false);
    }
  };

  const tabCls = (active) =>
    `flex-1 py-2.5 rounded-lg text-sm font-bold transition ${active ? 'bg-brand-600 text-white shadow-card' : 'text-brand-800 hover:bg-brand-100'}`;

  const inputCls =
    'w-full rounded-xl border border-brand-200 bg-[#fbfdfc] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400';

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl border border-brand-100 shadow-card p-7 md:p-8">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-brand-50 grid place-items-center shrink-0"><Logo size={34} /></span>
            <div>
              <h1 className="text-xl font-extrabold text-brand-900 leading-tight">
                {tab === 'signup' ? 'Create your profile' : 'Welcome back'}
              </h1>
              <p className="text-xs font-semibold text-brand-600">InterviewPrep by Ayushi Singh</p>
            </div>
          </div>

          <div className="mt-6 flex rounded-xl border border-brand-200 bg-white p-1">
            <button type="button" className={tabCls(tab === 'login')} onClick={() => { setTab('login'); setError(''); }}>Login</button>
            <button type="button" className={tabCls(tab === 'signup')} onClick={() => { setTab('signup'); setError(''); }}>Sign up</button>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3">
            {tab === 'signup' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1" htmlFor="auth-name">Your name</label>
                <input id="auth-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma" autoComplete="name" required />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1" htmlFor="auth-email">Email</label>
              <input id="auth-email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1" htmlFor="auth-password">Password</label>
              <input id="auth-password" type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === 'signup' ? 'At least 6 characters' : 'Your password'}
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'} required />
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
              {busy ? 'One moment…' : tab === 'signup' ? 'Create profile →' : 'Login →'}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-500 leading-relaxed">
            {tab === 'signup'
              ? 'Your progress from this device merges into your profile automatically — nothing you’ve done as a guest is lost.'
              : 'New here? Switch to Sign up — it takes ten seconds.'}
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          No account? No problem — <span className="font-semibold text-slate-700">guest mode keeps everything</span>,
          saved on this device. A profile just syncs it everywhere.
        </p>
      </div>
    </div>
  );
}
