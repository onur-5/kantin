import { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('kantin_theme') || 'light');

  useEffect(() => {
    // Standard Bootstrap themes
    if (theme === 'corporate') {
      document.documentElement.setAttribute('data-bs-theme', 'light');
      document.body.classList.add('corporate-theme');
    } else {
      document.documentElement.setAttribute('data-bs-theme', theme);
      document.body.classList.remove('corporate-theme');
    }
    localStorage.setItem('kantin_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('corporate');
    else setTheme('light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
