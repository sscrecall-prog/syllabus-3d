import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'oled' | 'sepia' | 'luxury' | 'glass';

interface ThemeContextType {
  theme: Theme;
  previousTheme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  revertToPreviousTheme: () => void;
  isDark: boolean;
  isOled: boolean;
  isSepia: boolean;
  isLuxury: boolean;
  isGlass: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [previousTheme, setPreviousThemeState] = useState<Theme>(() => {
    try {
      const savedPrev = localStorage.getItem('syllabus3d_previous_theme') as Theme | null;
      if (savedPrev && ['light', 'dark', 'oled', 'sepia', 'luxury'].includes(savedPrev)) {
        return savedPrev;
      }
    } catch {}
    return 'dark';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('syllabus3d_theme') as Theme | null;
        if (saved === 'light' || saved === 'dark' || saved === 'oled' || saved === 'sepia' || saved === 'luxury' || saved === 'glass') {
          return saved;
        }
        // Activate requested Fluid Glass theme by default for immediate evaluation
        return 'glass';
      } catch {
        return 'glass';
      }
    }
    return 'glass';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'oled', 'sepia', 'luxury', 'glass');
    if (theme === 'oled') {
      root.classList.add('dark', 'oled');
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'sepia') {
      root.classList.add('sepia');
    } else if (theme === 'luxury') {
      root.classList.add('luxury');
    } else if (theme === 'glass') {
      root.classList.add('glass');
    }
    // 'light' = no class needed
    try {
      localStorage.setItem('syllabus3d_theme', theme);
    } catch {}
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    if (newTheme !== theme) {
      if (theme !== 'glass') {
        setPreviousThemeState(theme);
        try {
          localStorage.setItem('syllabus3d_previous_theme', theme);
        } catch {}
      }
      setThemeState(newTheme);
    }
  };

  const revertToPreviousTheme = () => {
    const target = previousTheme || 'dark';
    setThemeState(target);
    try {
      localStorage.setItem('syllabus3d_theme', target);
    } catch {}
  };

  const toggleTheme = () => {
    setThemeState(prev => {
      if (prev === 'glass') return 'dark';
      if (prev === 'dark') return 'oled';
      if (prev === 'oled') return 'light';
      if (prev === 'light') return 'sepia';
      if (prev === 'sepia') return 'luxury';
      if (prev === 'luxury') return 'glass';
      return 'glass';
    });
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      previousTheme,
      toggleTheme,
      setTheme,
      revertToPreviousTheme,
      isDark: theme === 'dark' || theme === 'oled',
      isOled: theme === 'oled',
      isSepia: theme === 'sepia',
      isLuxury: theme === 'luxury',
      isGlass: theme === 'glass'
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
