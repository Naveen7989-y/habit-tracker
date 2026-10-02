import React, { createContext, useContext, useState, useEffect } from 'react';

const availableThemes = ['fresh-sky', 'soft-sunrise', 'warm-horizon', 'midnight-sea'];

const ThemeContext = createContext({
  theme: 'fresh-sky',
  toggleTheme: () => {},
  setTheme: () => {},
  availableThemes,
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('habytat_theme');
    if (saved && availableThemes.includes(saved)) {
      return saved;
    }
    // Default active theme is Fresh Sky
    return 'fresh-sky';
  });

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

  const toggleTheme = () => {
    setTheme((prev) => {
      const idx = availableThemes.indexOf(prev);
      const nextIdx = (idx + 1) % availableThemes.length;
      return availableThemes[nextIdx];
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, availableThemes }}>
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
