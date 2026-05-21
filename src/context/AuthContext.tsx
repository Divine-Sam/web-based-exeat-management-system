import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../lib/api';
import { AuthUser, Profile, Role } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signUp: (fullName: string, crawfordNumber: string, password: string, role: Role) => Promise<void>;
  login: (crawfordNumber: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('exeat_token');
    if (!token) { setLoading(false); return; }

    api.get<{ user: Profile }>('/auth/me')
      .then(({ user: profile }) => {
        setUser({
          id: profile.id,
          email: `${profile.crawford_number}@exeat.internal`,
          profile
        });
      })
      .catch(() => {
        localStorage.removeItem('exeat_token');
      })
      .finally(() => setLoading(false));
  }, []);

  async function signUp(
    fullName: string,
    crawfordNumber: string,
    password: string,
    role: Role
  ): Promise<void> {
    const { token, user: profile } = await api.post<{ token: string; user: Profile }>(
      '/auth/register',
      { full_name: fullName, crawford_number: crawfordNumber, password, role }
    );
    localStorage.setItem('exeat_token', token);
    setUser({
      id: profile.id,
      email: `${profile.crawford_number}@exeat.internal`,
      profile
    });
  }

  async function login(
    crawfordNumber: string,
    password: string,
    role: Role
  ): Promise<void> {
    const { token, user: profile } = await api.post<{ token: string; user: Profile }>(
      '/auth/login',
      { crawford_number: crawfordNumber, password, role }
    );
    localStorage.setItem('exeat_token', token);
    setUser({
      id: profile.id,
      email: `${profile.crawford_number}@exeat.internal`,
      profile
    });
  }

  async function logout(): Promise<void> {
    localStorage.removeItem('exeat_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}