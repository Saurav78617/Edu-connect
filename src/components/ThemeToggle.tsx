import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'motion/react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="p-2.5 hover:bg-surface-primary rounded-xl transition-all border border-transparent hover:border-border-primary group relative"
    >
      {theme === 'dark' ? (
        <Sun size={20} className="text-text-primary/60 group-hover:text-brand-accent transition-colors" />
      ) : (
        <Moon size={20} className="text-text-primary/60 group-hover:text-brand-accent transition-colors" />
      )}
      <span className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-text-primary text-bg-primary text-[8px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </span>
    </motion.button>
  );
}
