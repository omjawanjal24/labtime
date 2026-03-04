'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check stored theme preference
    const savedTheme = localStorage.getItem('theme');
    
    // Check current HTML class
    const isDarkClass = document.documentElement.classList.contains('dark');
    
    // Determine theme
    const currentTheme = (savedTheme as Theme) || (isDarkClass ? 'dark' : 'light');
    
    setTheme(currentTheme);
    setMounted(true);

    // Listen for storage changes in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        const newTheme = e.newValue as Theme;
        setTheme(newTheme);
        updateDOMTheme(newTheme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateDOMTheme = (newTheme: Theme) => {
    const html = document.documentElement;
    if (newTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    updateDOMTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  if (!mounted) {
    return children;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    return {
      theme: 'dark' as Theme,
      toggleTheme: () => {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';
        if (newTheme === 'dark') {
          html.classList.add('dark');
        } else {
          html.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
      },
    };
  }
  
  return context;
}
