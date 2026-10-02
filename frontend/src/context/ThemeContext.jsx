import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'fresh-sky',
  toggleTheme: () => {},
  setTheme: () => {},
  availableThemes: ['fresh-sky', 'soft-sunrise', 'golden-olive', 'vibrant-red', 'dark', 'light'],
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('habytat_theme');
    if (saved && ['fresh-sky', 'soft-sunrise', 'golden-olive', 'vibrant-red', 'dark', 'light'].includes(saved)) {
      return saved;
    }
    // Default active theme is Fresh Sky
    return 'fresh-sky';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Sync theme class list for utility compatibility
    root.classList.remove('theme-fresh-sky', 'theme-soft-sunrise', 'theme-golden-olive', 'theme-vibrant-red', 'dark', 'light');

    if (theme === 'fresh-sky') {
      root.classList.add('theme-fresh-sky', 'light');
    } else if (theme === 'soft-sunrise') {
      root.classList.add('theme-soft-sunrise', 'light');
    } else if (theme === 'golden-olive') {
      root.classList.add('theme-golden-olive', 'dark');
    } else if (theme === 'vibrant-red') {
      root.classList.add('theme-vibrant-red', 'dark');
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.add('light');
    }

    localStorage.setItem('habytat_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'fresh-sky') return 'soft-sunrise';
      if (prev === 'soft-sunrise') return 'golden-olive';
      if (prev === 'golden-olive') return 'vibrant-red';
      if (prev === 'vibrant-red') return 'dark';
      if (prev === 'dark') return 'light';
      return 'fresh-sky';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, availableThemes: ['fresh-sky', 'soft-sunrise', 'golden-olive', 'vibrant-red', 'dark', 'light'] }}>
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
