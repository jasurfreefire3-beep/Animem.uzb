import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check Google redirect result
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          const firebaseUser = result.user;
          try {
            const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: firebaseUser.email,
                name: firebaseUser.displayName || 'Google User',
                uid: firebaseUser.uid,
                avatar_url: firebaseUser.photoURL
              }),
            });
            const data = await res.json();
            if (res.ok) {
              setToken(data.token);
              setUser(data.user);
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
              window.location.href = '/';
            }
          } catch (e) {
            console.error("Google redirect backend error:", e);
          }
        }
      })
      .catch((err) => {
        console.warn("getRedirectResult error:", err);
      });

    // Check URL search parameters for OAuth redirect fallback
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlUser = urlParams.get('user');

    if (urlToken && urlUser) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(urlUser));
        setToken(urlToken);
        setUser(parsedUser);
        localStorage.setItem('token', urlToken);
        localStorage.setItem('user', JSON.stringify(parsedUser));
        window.history.replaceState({}, '', window.location.pathname);
        return;
      } catch (e) {
        console.error("URL user parsing error:", e);
      }
    }

    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      if (storedToken.length > 1200) {
        console.warn("Legacy oversized token detected, purging to prevent header overflow.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } else {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const sendPing = () => {
      fetch('/api/user/ping', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {});
    };
    sendPing();
    const interval = setInterval(sendPing, 40000);
    return () => clearInterval(interval);
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
