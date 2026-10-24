import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const availableThemes = ['dark', 'light', 'midnight-sea', 'fresh-sky'];
export const DEFAULT_THEME = 'dark';

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  isDark: true,
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
          if (userTheme) {
            return userTheme === 'light' || userTheme === 'fresh-sky' || userTheme === 'soft-sunrise' || userTheme === 'warm-horizon'
              ? 'light'
              : 'dark';
          }
        }
      }
    } catch (e) {
      // Fallback
    }

    // 2. Check general stored preference
    const saved = localStorage.getItem('habytat_theme');
    if (saved) {
      return saved === 'light' || saved === 'fresh-sky' || saved === 'soft-sunrise' || saved === 'warm-horizon'
        ? 'light'
        : 'dark';
    }

    // 3. System default theme is Dark
    return DEFAULT_THEME;
  });

  const isDark = theme === 'dark' || theme === 'midnight-sea';

  // Apply DOM classes and persist
  useEffect(() => {
    const root = document.documentElement;
    const currentIsDark = theme === 'dark' || theme === 'midnight-sea';

    root.setAttribute('data-theme', currentIsDark ? 'dark' : 'light');

    if (currentIsDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    localStorage.setItem('habytat_theme', currentIsDark ? 'dark' : 'light');
  }, [theme]);

  // Set theme and bind to current logged-in account if present
  const setTheme = useCallback((newTheme) => {
    const normalized = (newTheme === 'dark' || newTheme === 'midnight-sea') ? 'dark' : 'light';
    setThemeState(normalized);

    // Save for active user if logged in
    try {
      const savedUserStr = localStorage.getItem('habitpulse_user');
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser?.email) {
          localStorage.setItem(`habytat_theme_${savedUser.email.toLowerCase().trim()}`, normalized);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Toggle between dark and light theme
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const isCurrentlyDark = prev === 'dark' || prev === 'midnight-sea';
      const nextTheme = isCurrentlyDark ? 'light' : 'dark';

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
    if (saved) {
      return saved === 'light' ? 'light' : 'dark';
    }
    return null;
  }, []);

  // Save a theme for a specific account
  const saveAccountTheme = useCallback((emailOrId, themeName) => {
    if (!emailOrId) return;
    const normalized = themeName === 'light' ? 'light' : 'dark';
    const cleanKey = String(emailOrId).toLowerCase().trim();
    localStorage.setItem(`habytat_theme_${cleanKey}`, normalized);
    localStorage.setItem('habytat_theme', normalized);
  }, []);

  // Apply an account's theme immediately if known, or fallback to default
  const applyAccountTheme = useCallback((emailOrId) => {
    if (!emailOrId) return false;
    const cleanKey = String(emailOrId).toLowerCase().trim();
    const accountTheme = localStorage.getItem(`habytat_theme_${cleanKey}`);
    if (accountTheme) {
      const normalized = accountTheme === 'light' ? 'light' : 'dark';
      setThemeState(normalized);
      return true;
    }
    return false;
  }, []);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      isDark,
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
