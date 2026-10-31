import { createContext, useContext, useState, type ReactNode } from 'react';
import { loginResident, logoutResident, type ResidentSession } from '@/api/auth';

type AuthContextValue = {
  session: ResidentSession | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (name: string, email: string) => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ResidentSession | null>(null);
  async function signIn(email: string, password: string) {
    const next = await loginResident(email, password);
    setSession(next);
  }
  async function signOut() {
    if (!session) return;
    await logoutResident(session.token);
    setSession(null);
  }
  function updateUser(name: string, email: string) {
    setSession(current => current ? { ...current, user: { ...current.user, name, email } } : null);
  }
  return <AuthContext.Provider value={{ session, signIn, signOut, updateUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is missing.');
  return context;
}