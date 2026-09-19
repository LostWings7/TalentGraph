import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTalent } from '../../context/TalentContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTalent();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 border border-white/[0.08] light:border-slate-300 text-slate-300 light:text-slate-700 transition-all cursor-pointer shadow-xs"
      title={`Switch to ${isLight ? 'Dark Intelligence Mode' : 'Light Editorial Mode'}`}
      aria-label="Toggle visual theme"
    >
      {isLight ? (
        <Moon className="w-4 h-4 text-indigo-500" />
      ) : (
        <Sun className="w-4 h-4 text-amber-400" />
      )}
    </button>
  );
};
