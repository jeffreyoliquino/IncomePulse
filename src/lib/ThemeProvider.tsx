import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';
import { createMMKVStorage } from './storage';

export type ThemeMode = 'system' | 'light' | 'dark';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ColorScheme;
  themeMode: ThemeMode;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'light',
  themeMode: 'system',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

let themeStorage: ReturnType<typeof createMMKVStorage> | null = null;

function getStorage() {
  if (!themeStorage) {
    themeStorage = createMMKVStorage('theme-storage');
  }
  return {
    get: (key: string) => themeStorage!.getItem(key),
    set: (key: string, value: string) => themeStorage!.setItem(key, value),
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useNativeColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  useEffect(() => {
    try {
      const storage = getStorage();
      const saved = storage.get('theme-mode');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeMode(saved);
      }
    } catch {}
  }, []);

  const colorScheme: ColorScheme =
    themeMode === 'system'
      ? 'light'
      : themeMode;

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      const storage = getStorage();
      storage.set('theme-mode', mode);
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    const next = colorScheme === 'light' ? 'dark' : 'light';
    setTheme(next);
  }, [colorScheme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        themeMode,
        isDark: colorScheme === 'dark',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
