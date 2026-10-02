import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'vibrant-red',
  toggleTheme: () => {},
  setTheme: () => {},
  availableThemes: ['vibrant-red', 'dark', 'light'],
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('habytat_theme');
    if (saved && ['vibrant-red', 'dark', 'light'].includes(saved)) {
      return saved;
    }
    // Default active theme is Vibrant Red
    return 'vibrant-red';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Sync theme class list for utility compatibility
    root.classList.remove('theme-vibrant-red', 'dark', 'light');

    if (theme === 'vibrant-red') {
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
      if (prev === 'vibrant-red') return 'dark';
      if (prev === 'dark') return 'light';
      return 'vibrant-red';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, availableThemes: ['vibrant-red', 'dark', 'light'] }}>
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
