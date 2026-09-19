import React from 'react';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { useTalent } from '../../context/TalentContext';

export const BreadcrumbNav = ({ items = [], onBack }) => {
  const { navigateTo, goBack } = useTalent();

  return (
    <nav className="flex items-center justify-between gap-3 text-xs mb-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => navigateTo('dashboard')}
          className="flex items-center gap-1 text-slate-400 hover:text-white light:text-slate-500 light:hover:text-slate-900 transition-colors p-1 rounded-md hover:bg-white/[0.05] light:hover:bg-slate-200 cursor-pointer"
          title="Return to Dashboard"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px]">Talent Atlas</span>
        </button>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 text-slate-400 light:text-slate-500 shrink-0" />
              {isLast ? (
                <span className="font-semibold text-cyan-400 light:text-cyan-700 font-mono text-[11px] truncate max-w-[200px] sm:max-w-none">
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={() => item.tab && navigateTo(item.tab)}
                  className="text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors font-mono text-[11px] cursor-pointer"
                >
                  {item.label}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <button
        onClick={onBack || goBack}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 border border-white/[0.08] light:border-slate-300 text-slate-300 light:text-slate-700 text-[11px] font-mono transition-all cursor-pointer shadow-xs"
      >
        <ArrowLeft className="w-3 h-3 text-cyan-400 light:text-cyan-600" />
        <span>Back</span>
      </button>
    </nav>
  );
};
