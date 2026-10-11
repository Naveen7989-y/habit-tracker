import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const availableThemes = ['midnight-sea', 'fresh-sky', 'soft-sunrise', 'warm-horizon'];
export const DEFAULT_THEME = 'midnight-sea';

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  toggleTheme: () => {},
  setTheme: () => {},
  availableThemes,
  applyAccountTheme: () => false,
  saveAccountTheme: () => {},
  getAccountTheme: () => null,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    // 1. Check if there's an active logged-in user with a saved theme
    try {
      const savedUserStr = localStorage.getItem('habitpulse_user');
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser?.email) {
          const userTheme = localStorage.getItem(`habytat_theme_${savedUser.email.toLowerCase().trim()}`);
          if (userTheme && availableThemes.includes(userTheme)) {
            return userTheme;
          }
        }
      }
    } catch (e) {
      // Fallback
    }

    // 2. Check general stored preference
    const saved = localStorage.getItem('habytat_theme');
    if (saved && availableThemes.includes(saved)) {
      return saved;
    }

    // 3. System default theme is Midnight Sea
    return DEFAULT_THEME;
  });

  // Apply DOM classes and persist
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Sync theme class list for utility compatibility
    root.classList.remove('theme-fresh-sky', 'theme-soft-sunrise', 'theme-warm-horizon', 'theme-midnight-sea', 'dark');
    root.classList.add(`theme-${theme}`);
    if (theme === 'midnight-sea') {
      root.classList.add('dark');
    }

    localStorage.setItem('habytat_theme', theme);
  }, [theme]);

  // Set theme and bind to current logged-in account if present
  const setTheme = useCallback((newTheme) => {
    if (!availableThemes.includes(newTheme)) return;
    setThemeState(newTheme);

    // Save for active user if logged in
    try {
      const savedUserStr = localStorage.getItem('habitpulse_user');
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser?.email) {
          localStorage.setItem(`habytat_theme_${savedUser.email.toLowerCase().trim()}`, newTheme);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Cycle to next available theme
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const idx = availableThemes.indexOf(prev);
      const nextIdx = (idx + 1) % availableThemes.length;
      const nextTheme = availableThemes[nextIdx];

      // Save for active user if logged in
      try {
        const savedUserStr = localStorage.getItem('habitpulse_user');
        if (savedUserStr) {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser?.email) {
            localStorage.setItem(`habytat_theme_${savedUser.email.toLowerCase().trim()}`, nextTheme);
          }
        }
      } catch (e) {
        // ignore
      }

      return nextTheme;
    });
  }, []);

  // Retrieve an account's saved theme
  const getAccountTheme = useCallback((emailOrId) => {
    if (!emailOrId) return null;
    const cleanKey = String(emailOrId).toLowerCase().trim();
    const saved = localStorage.getItem(`habytat_theme_${cleanKey}`);
    if (saved && availableThemes.includes(saved)) {
      return saved;
    }
    return null;
  }, []);

  // Save a theme for a specific account
  const saveAccountTheme = useCallback((emailOrId, themeName) => {
    if (!emailOrId || !availableThemes.includes(themeName)) return;
    const cleanKey = String(emailOrId).toLowerCase().trim();
    localStorage.setItem(`habytat_theme_${cleanKey}`, themeName);
    localStorage.setItem('habytat_theme', themeName);
  }, []);

  // Apply an account's theme immediately if known, or fallback to default
  const applyAccountTheme = useCallback((emailOrId) => {
    if (!emailOrId) return false;
    const cleanKey = String(emailOrId).toLowerCase().trim();
    const accountTheme = localStorage.getItem(`habytat_theme_${cleanKey}`);
    if (accountTheme && availableThemes.includes(accountTheme)) {
      setThemeState(accountTheme);
      return true;
    }
    return false;
  }, []);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      setTheme, 
      availableThemes,
      applyAccountTheme,
      saveAccountTheme,
      getAccountTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
