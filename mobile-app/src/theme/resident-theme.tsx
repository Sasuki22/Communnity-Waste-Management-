import { createContext, useContext, useState, type ReactNode } from 'react';

export const palettes = {
  light: { page: '#ebf6ed', surface: '#fff', heading: '#18281c', text: '#425249', line: '#e3eee6', notice: '#eef8f0', action: ['#d8eaf6', '#e6eef9', '#f6f8e4', '#fcedee'], badge: '#dcfbe3', badgeText: '#126a2a' },
  dark: { page: '#102e23', surface: '#1d3528', heading: '#f3fff5', text: '#c7ddcf', line: '#395647', notice: '#244735', action: ['#20382b', '#20374a', '#3a3524', '#3d2b32'], badge: '#29553a', badgeText: '#d0f6d9' },
} as const;

type Mode = keyof typeof palettes;
const ResidentThemeContext = createContext<{ mode: Mode; toggle: () => void } | null>(null);

export function ResidentThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('light');
  return <ResidentThemeContext.Provider value={{ mode, toggle: () => setMode(current => current === 'light' ? 'dark' : 'light') }}>{children}</ResidentThemeContext.Provider>;
}

export function useResidentTheme() {
  const theme = useContext(ResidentThemeContext);
  if (!theme) throw new Error('ResidentThemeProvider is missing.');
  return { ...theme, colors: palettes[theme.mode] };
}