import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AuthService, type AuthUser } from '../services/auth.service';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    AuthService.me().then((current) => { if (active) setUser(current); }).catch(() => { if (active) setUser(null); }).finally(() => { if (active) setLoading(false); });
    const unauthorized = () => setUser(null);
    window.addEventListener('onwallet:unauthorized', unauthorized);
    return () => { active = false; window.removeEventListener('onwallet:unauthorized', unauthorized); };
  }, []);

  const login = async (email: string, password: string) => { setUser(await AuthService.login(email, password)); };
  const logout = async () => { try { await AuthService.logout(); } finally { setUser(null); } };
  const refresh = async () => { setUser(await AuthService.me()); };

  return <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider ausente');
  return context;
}
