'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const defaultContext: ThemeContextType = {
  theme: 'dark',
  isDarkMode: true,
  toggleTheme: () => {}
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setMounted(true);

    try {
      // Check localStorage first
      const savedTheme = localStorage.getItem('theme') as Theme | null;

      if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
        setTheme(savedTheme);
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Error initializing theme:', error);
      // Default to dark theme if there's an error
      setTheme('dark');
    }
  }, []);

  // Update data-theme attribute and localStorage when theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set data-theme attribute on document
    document.documentElement.setAttribute('data-theme', theme);

    // Save to localStorage
    localStorage.setItem('theme', theme);

    // Log theme change
    console.log(`Theme changed to: ${theme}`);

  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  // Compute isDarkMode for backward compatibility
  const isDarkMode = theme === 'dark';

  // We don't need to prevent rendering anymore
  // Just ensure we don't access window/document during SSR

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  return useContext(ThemeContext);
};
