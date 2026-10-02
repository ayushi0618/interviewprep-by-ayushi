// auth.jsx — client side of accounts: token storage, an API helper, and
// an AuthProvider exposing { user, login, signup, logout, refreshUser }.
//
// The token lives in localStorage ("ip_token") and rides along as
// `Authorization: Bearer …`. Guests are fully supported — nothing in the
// app requires an account; logging in only adds cross-device sync.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const TOKEN_KEY = 'ip_token';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage blocked — session just won't persist */ }
}

// fetch wrapper: JSON in/out, Bearer when we have a token, friendly errors.
export async function apiFetch(pathname, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(pathname, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Network hiccup — check your connection and try again.');
  }
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON response */ }
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { name, email, createdAt }
  const [authLoading, setAuthLoading] = useState(Boolean(getToken()));

  const refreshUser = useCallback(async () => {
    if (!getToken()) { setUser(null); return null; }
    try {
      const profile = await apiFetch('/api/profile');
      const { stats: _stats, ...u } = profile || {};
      setUser(u);
      return u;
    } catch {
      setToken(null); // stale/expired token — back to guest mode
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await refreshUser();
      if (alive) setAuthLoading(false);
    })();
    return () => { alive = false; };
  }, [refreshUser]);

  const login = useCallback(async (email, password) => {
    const data = await apiFetch('/api/auth/login', { method: 'POST', auth: false, body: { email, password } });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const data = await apiFetch('/api/auth/signup', { method: 'POST', auth: false, body: { name, email, password } });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, authLoading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
