import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '../types';
import { apiFetch } from '../utils/api';
import { useToast } from '../components/ToastProvider';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { email: string; password: string; name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ user: User | null }>('/me');
      setUser(data.user ?? null);
    } catch (error) {
      console.warn('Impossibile recuperare il profilo', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      try {
        const data = await apiFetch<{ user: User }>('/auth/login', {
          method: 'POST',
          json: input,
        });
        setUser(data.user);
        showToast('Accesso eseguito con successo', 'success');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Errore durante il login';
        showToast(message, 'error');
        throw error;
      }
    },
    [showToast],
  );

  const register = useCallback(
    async (input: { email: string; password: string; name?: string }) => {
      try {
        const data = await apiFetch<{ user: User }>('/auth/register', {
          method: 'POST',
          json: input,
        });
        setUser(data.user);
        showToast('Registrazione completata. Benvenuto!', 'success');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Errore durante la registrazione';
        showToast(message, 'error');
        throw error;
      }
    },
    [showToast],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
      setUser(null);
      showToast('Sessione terminata', 'info');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore durante il logout';
      showToast(message, 'error');
      throw error;
    }
  }, [showToast]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve essere utilizzato all’interno di AuthProvider');
  }
  return ctx;
}
