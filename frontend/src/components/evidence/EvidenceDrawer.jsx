import React from 'react';
import { X, Award, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { EvidenceTrail } from './EvidenceTrail';
import { useTalent } from '../../context/TalentContext';

export const EvidenceDrawer = ({ skill, onClose }) => {
  const { employeeDetail, activeRoleMatches, navigateTo } = useTalent();

  if (!skill) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="atlas-surface-elevated w-full max-w-lg h-full flex flex-col shadow-2xl border-l border-white/[0.1] light:border-slate-300 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] light:border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 light:bg-cyan-100 text-cyan-400 light:text-cyan-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white light:text-slate-900">
                Grounded Capability Proof Trace
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                Evidence-Based Talent Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <EvidenceTrail 
            skill={skill} 
            employeeDetail={employeeDetail} 
            activeRoleMatches={activeRoleMatches}
            navigateTo={navigateTo}
            onClose={onClose}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] light:border-slate-200 bg-slate-950/40 light:bg-slate-50 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Grounded in employee deliverables</span>
          <button
            onClick={onClose}
            className="atlas-btn-secondary py-1 text-xs"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  );
};
