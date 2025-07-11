"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getFromDB, setToDB } from '../lib/db';

type Theme =
  | "light"
  | "dark"
  | "catppuccin-mocha"
  | "catppuccin-macchiato"
  | "catppuccin-frappe"
  | "catppuccin-latte"
  | "gruvbox-dark-hard"
  | "gruvbox-dark-medium"
  | "gruvbox-dark-soft"
  | "gruvbox-light-hard"
  | "gruvbox-light-medium"
  | "gruvbox-light-soft"
  | "nord";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined
);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  // Load theme from IndexedDB
  useEffect(() => {
    getFromDB('webtui-theme', 'theme').then(stored => {
      if (stored) setTheme(stored as Theme);
    });
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute("data-webtui-theme", theme);
    setToDB('webtui-theme', 'theme', theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}; 