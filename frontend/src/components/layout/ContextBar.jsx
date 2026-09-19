import React from 'react';
import { 
  User, 
  Target, 
  Sparkles, 
  Sliders, 
  ChevronRight, 
  Award, 
  GitFork, 
  Layers, 
  ShieldCheck 
} from 'lucide-react';
import { useTalent } from '../../context/TalentContext';
import { MetricGauge } from '../common/MetricGauge';

export const ContextBar = () => {
  const { 
    activeEmployee, 
    employeeDetail, 
    activeRoleMatches, 
    selectedTargetRoleId, 
    setIsPersonaModalOpen,
    navigateTo,
    aiStatus 
  } = useTalent();

  if (!activeEmployee) return null;

  const targetMatch = activeRoleMatches.find((m) => m.role_id === selectedTargetRoleId) || activeRoleMatches[0];
  const careerGoalTitle = employeeDetail?.career_goal?.target_role_title || targetMatch?.role_title || 'Target Role Pending';
  const matchScore = targetMatch ? targetMatch.overall_score : 0.75;
  const skillsCount = employeeDetail?.skills?.length || activeEmployee.skills_count || 0;

  return (
    <div className="atlas-surface-subtle border border-white/[0.08] light:border-slate-200 rounded-2xl p-3.5 mb-6 backdrop-blur-md shadow-lg transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Active Subject Persona Profile */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500/30 via-indigo-500/30 to-purple-500/30 border border-cyan-500/30 flex items-center justify-center font-black text-sm text-cyan-300 light:text-cyan-800 shadow-inner">
              {activeEmployee.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#060913] light:border-white rounded-full" title="Active Employee Profile" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm text-white light:text-slate-900 tracking-tight">
                {activeEmployee.name}
              </span>
              <span className="atlas-badge-cyan text-[10px] py-0.2">
                {activeEmployee.department}
              </span>
              <span className="text-[10px] font-mono text-slate-400 light:text-slate-500">
                {activeEmployee.years_experience} Years Exp
              </span>
            </div>
            <div className="text-xs text-slate-300 light:text-slate-600 font-medium truncate mt-0.5 flex items-center gap-2">
              <span>{activeEmployee.current_role}</span>
              <span className="text-slate-500">•</span>
              <span className="text-[11px] font-mono text-cyan-400 light:text-cyan-700">
                {skillsCount} Tracked Skills
              </span>
            </div>
          </div>
        </div>

        {/* Center: Target Trajectory Goal & Match Readiness */}
        <div className="flex items-center gap-4 bg-slate-950/60 light:bg-slate-100/90 px-3.5 py-2 rounded-xl border border-white/[0.06] light:border-slate-300 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 light:bg-indigo-100 text-indigo-400 light:text-indigo-700 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-mono uppercase text-slate-400 light:text-slate-500 font-bold">
                Target Milestone
              </div>
              <div className="text-xs font-bold text-white light:text-slate-900 truncate">
                {careerGoalTitle}
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-white/[0.08] light:bg-slate-300 shrink-0" />

          {/* Animated Gauge */}
          <MetricGauge 
            score={matchScore} 
            size={36} 
            strokeWidth={4} 
            showPercentage={true}
          />

          <button
            onClick={() => targetMatch && navigateTo('match', { targetRoleId: targetMatch.role_id })}
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 light:text-cyan-700 underline shrink-0 cursor-pointer hidden sm:block"
          >
            Inspect Match
          </button>
        </div>

        {/* Right: Persona Switcher & AI Status */}
        <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
          <button
            onClick={() => setIsPersonaModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 light:bg-white light:hover:bg-slate-100 border border-white/[0.08] light:border-slate-300 text-slate-300 light:text-slate-700 text-xs font-mono transition-all cursor-pointer shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
            <span>Switch Persona</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-950/40 light:bg-cyan-50 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 light:text-cyan-800">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Gemini 3.7</span>
          </div>
        </div>
      </div>
    </div>
  );
};
