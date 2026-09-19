import React, { useState } from 'react';
import { 
  Sliders, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  Zap, 
  PlusCircle, 
  BookOpen 
} from 'lucide-react';
import { MetricGauge } from '../common/MetricGauge';
import { useTalent } from '../../context/TalentContext';
import { getSkillLabel, getSkillId, getProficiencyLabel } from '../../utils/formatters';

export const WhatIfSimulator = ({
  roleTitle,
  roleId,
  currentScore = 0.65,
  semanticScore = 0.70,
  skillScore = 0.60,
  experienceScore = 0.80,
  projectScore = 0.65,
  missingSkills = [],
  weights = { semantic: 0.30, skill: 0.35, experience: 0.20, project: 0.15 }
}) => {
  const { navigateTo } = useTalent();
  const [simulatedSkills, setSimulatedSkills] = useState(new Set());

  const toggleSkill = (skillId) => {
    setSimulatedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  };

  const handleReset = () => {
    setSimulatedSkills(new Set());
  };

  // Real formula recalculation
  const totalGaps = Math.max(1, missingSkills.length);
  const simulatedCount = simulatedSkills.size;
  const simulatedFraction = simulatedCount / totalGaps;

  // Skill score moves toward 1.0 based on acquired fraction
  const projectedSkillScore = Math.min(1.0, skillScore + (simulatedFraction * (1.0 - skillScore)));

  // Combined overall score
  const projectedOverallScore = Number((
    (semanticScore * weights.semantic) +
    (projectedSkillScore * weights.skill) +
    (experienceScore * weights.experience) +
    (projectScore * weights.project)
  ).toFixed(4));

  const deltaPct = Math.round((projectedOverallScore - currentScore) * 100);

  return (
    <div className="atlas-surface-elevated p-6 space-y-6 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
      {/* Decorative Conduit Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08] light:border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 light:bg-cyan-100 text-cyan-400 light:text-cyan-700 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white light:text-slate-900">
                What-If Capability Readiness Simulator
              </h3>
              <span className="atlas-badge-cyan text-[9px] py-0.2">
                Live Formula Model
              </span>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5">
              Simulate closing target skill gaps for <span className="text-cyan-300 light:text-cyan-700 font-bold">{roleTitle}</span> and preview real-time readiness uplift.
            </p>
          </div>
        </div>

        {simulatedCount > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 light:bg-slate-200 hover:bg-slate-800 text-slate-400 hover:text-white light:hover:text-slate-900 text-xs font-mono transition-all self-end sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Dynamic Comparison Scoreboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-white/[0.06] light:border-slate-200 items-center">
        {/* Current State */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/60 light:bg-white border border-white/[0.04] light:border-slate-200">
          <MetricGauge score={currentScore} size={48} strokeWidth={5} />
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400">Current Match</div>
            <div className="text-sm font-bold text-slate-200 light:text-slate-800 font-mono">
              {Math.round(currentScore * 100)}% Baseline
            </div>
          </div>
        </div>

        {/* Uplift Indicator */}
        <div className="flex flex-col items-center justify-center p-3 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Simulated Delta</div>
          <div className={`text-xl font-black font-mono flex items-center gap-1 ${
            deltaPct > 0 ? 'text-emerald-400 light:text-emerald-600' : 'text-slate-400'
          }`}>
            <TrendingUp className="w-5 h-5" />
            <span>{deltaPct > 0 ? `+${deltaPct}%` : '0%'}</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {simulatedCount} of {missingSkills.length} Skills Acquired
          </div>
        </div>

        {/* Projected State */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-950/20 light:bg-cyan-50 border border-cyan-500/30 light:border-cyan-200">
          <MetricGauge score={projectedOverallScore} size={48} strokeWidth={5} color="#10b981" />
          <div>
            <div className="text-[10px] uppercase font-mono text-cyan-400 light:text-cyan-800 font-bold">
              Projected Match
            </div>
            <div className="text-sm font-black text-emerald-300 light:text-emerald-800 font-mono">
              {Math.round(projectedOverallScore * 100)}% Target Fit
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Missing Skill Toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 light:text-slate-800">
            Select Skills to Simulate Mastery:
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Click to toggle acquisition
          </span>
        </div>

        {missingSkills.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-900/40 text-xs text-slate-400 text-center">
            No critical skill gaps found for this role. Full qualification achieved!
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {missingSkills.map((gap, idx) => {
              const skillId = getSkillId(gap, idx);
              const skillName = getSkillLabel(gap);
              const proficiency = getProficiencyLabel(gap, 'Advanced');
              const isSimulated = simulatedSkills.has(skillId);

              return (
                <button
                  key={skillId}
                  onClick={() => toggleSkill(skillId)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    isSimulated
                      ? 'bg-emerald-500/20 light:bg-emerald-100 text-emerald-300 light:text-emerald-800 border border-emerald-500/40 shadow-sm'
                      : 'bg-slate-900 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-slate-800 light:hover:bg-slate-200 border border-white/[0.08] light:border-slate-300'
                  }`}
                >
                  {isSimulated ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>{skillName}</span>
                  <span className="text-[10px] font-mono opacity-70">
                    ({proficiency})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Step Action */}
      <div className="pt-2 flex items-center justify-between border-t border-white/[0.08] light:border-slate-200">
        <span className="text-xs text-slate-400 light:text-slate-500">
          Ready to turn this simulation into real capability?
        </span>

        <button
          onClick={() => navigateTo('gap')}
          className="atlas-btn-primary text-xs py-2"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Explore Learning Pathways</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
