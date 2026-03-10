import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { applyTheme, getActiveTheme } from '../constants/colors';
import { defaultTheme } from '../constants/themes';
import { useAuth } from './AuthProvider';
import { getOrCreateProfileTheme, updateProfileTheme } from '../services/profileService';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { session, isSupabaseConfigured } = useAuth();
  const [themeId, setThemeId] = useState(defaultTheme);
  const [isLoadingTheme, setIsLoadingTheme] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadTheme() {
      if (!isSupabaseConfigured || !session?.user?.id) {
        applyTheme(defaultTheme);
        if (active) setThemeId(defaultTheme);
        return;
      }

      try {
        setIsLoadingTheme(true);
        const savedThemeId = await getOrCreateProfileTheme(session.user.id);
        applyTheme(savedThemeId);
        if (active) setThemeId(savedThemeId);
      } catch {
        applyTheme(defaultTheme);
        if (active) setThemeId(defaultTheme);
      } finally {
        if (active) setIsLoadingTheme(false);
      }
    }

    loadTheme();
    return () => {
      active = false;
    };
  }, [session?.user?.id, isSupabaseConfigured]);

  async function changeTheme(nextThemeId) {
    try {
      setIsLoadingTheme(true);
      const applied = !isSupabaseConfigured || !session?.user?.id
        ? nextThemeId
        : await updateProfileTheme(session.user.id, nextThemeId);

      applyTheme(applied);
      setThemeId(applied);
      return applied;
    } finally {
      setIsLoadingTheme(false);
    }
  }

  const value = useMemo(
    () => ({
      themeId,
      theme: getActiveTheme(),
      isLoadingTheme,
      changeTheme,
    }),
    [themeId, isLoadingTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
