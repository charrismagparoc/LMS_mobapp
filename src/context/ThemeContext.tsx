import React, { createContext, useContext, useState } from 'react';

// ── Color tokens matching the web (App.css) ─────────────────────────────────
const DARK = {
  bg: '#0f1117',
  surface: '#1a1d27',
  surface2: '#222535',
  surface3: '#2a2e42',
  border: '#2e3248',
  borderAccent: 'rgba(99,102,241,0.2)',
  text: '#e8eaf2',
  textMuted: '#9499b8',
  indigo: '#6366f1',
  indigoLight: '#818cf8',
  emerald: '#10b981',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  teal: '#14b8a6',
  red: '#ef4444',
  tabBar: '#0e1420',
  isDark: true,
};

const LIGHT = {
  bg: '#f6f2ea',
  surface: '#ffffff',
  surface2: '#ede7db',
  surface3: '#e4dcd0',
  border: '#d4c4af',
  borderAccent: 'rgba(83,44,46,0.2)',
  text: '#2C1A0E',
  textMuted: '#5c4030',
  indigo: '#532c2e',
  indigoLight: '#a97954',
  emerald: '#2d7a5c',
  violet: '#6b3d8a',
  amber: '#a97900',
  rose: '#c0392b',
  teal: '#1a7a6e',
  red: '#c0392b',
  tabBar: '#f0e9de',
  isDark: false,
};

export type Theme = typeof DARK;

interface ThemeCtx {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: DARK,
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? DARK : LIGHT;
  const toggleTheme = () => setIsDark(v => !v);
  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
