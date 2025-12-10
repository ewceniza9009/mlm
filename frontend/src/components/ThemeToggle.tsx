import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-yellow-400 hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
      aria-label="Toggle Theme"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} className="text-slate-300" />}
    </button>
  );
};