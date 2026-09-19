import React from 'react';
import { ArrowRight, Sparkles, Compass, Layers, MapPin, BrainCircuit } from 'lucide-react';
import { useTalent } from '../../context/TalentContext';

export const NextStepBanner = ({ 
  title, 
  description, 
  actionLabel, 
  targetTab, 
  context = {},
  variant = 'cyan' // 'cyan' | 'indigo' | 'emerald' | 'purple'
}) => {
  const { navigateTo } = useTalent();

  const variantStyles = {
    cyan: {
      bg: 'bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-slate-950/60 light:from-cyan-50 light:via-white light:to-sky-50',
      border: 'border-cyan-500/30 light:border-cyan-200',
      iconBg: 'bg-cyan-500/20 light:bg-cyan-100 text-cyan-400 light:text-cyan-700',
      btn: 'atlas-btn-primary',
    },
    indigo: {
      bg: 'bg-gradient-to-r from-indigo-950/40 via-slate-900/80 to-slate-950/60 light:from-indigo-50 light:via-white light:to-violet-50',
      border: 'border-indigo-500/30 light:border-indigo-200',
      iconBg: 'bg-indigo-500/20 light:bg-indigo-100 text-indigo-400 light:text-indigo-700',
      btn: 'atlas-btn-primary',
    },
    emerald: {
      bg: 'bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-950/60 light:from-emerald-50 light:via-white light:to-teal-50',
      border: 'border-emerald-500/30 light:border-emerald-200',
      iconBg: 'bg-emerald-500/20 light:bg-emerald-100 text-emerald-400 light:text-emerald-700',
      btn: 'atlas-btn-primary',
    },
  };

  const style = variantStyles[variant] || variantStyles.cyan;

  return (
    <div className={`atlas-surface p-4 sm:p-5 rounded-2xl border ${style.border} ${style.bg} shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-mono text-cyan-400 light:text-cyan-700 font-bold uppercase tracking-wider">
            Recommended Next Step
          </div>
          <h4 className="text-sm font-bold text-white light:text-slate-900 truncate">
            {title}
          </h4>
          <p className="text-xs text-slate-300 light:text-slate-600 mt-0.5 truncate">
            {description}
          </p>
        </div>
      </div>

      <button
        onClick={() => navigateTo(targetTab, context)}
        className={`${style.btn} shrink-0 self-end sm:self-auto py-2.5 px-4`}
      >
        <span>{actionLabel}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
