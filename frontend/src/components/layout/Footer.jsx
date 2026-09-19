import React from 'react';

export const Footer = () => {
  return (
    <footer className="border-t border-white/[0.06] light:border-slate-200 py-6 text-center text-xs text-slate-400 light:text-slate-500 bg-[#060913]/80 light:bg-white/90 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="font-bold text-slate-300 light:text-slate-800">TalentGraph AI</span> • The Living Talent Atlas — Internal Capability & Mobility Intelligence
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span>Decision Support Architecture</span>
          <span>•</span>
          <span className="text-cyan-400 light:text-cyan-700 font-bold">Powered by Gemini 3.7 Flash</span>
        </div>
      </div>
    </footer>
  );
};
