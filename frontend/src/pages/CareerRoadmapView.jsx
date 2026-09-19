import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Award, 
  CheckCircle2, 
  Check
} from 'lucide-react';
import { useTalent } from '../context/TalentContext';
import { TalentAPI } from '../api/client';
import { BreadcrumbNav } from '../components/common/BreadcrumbNav';
import { NextStepBanner } from '../components/actions/NextStepBanner';

import { getSkillLabel, getSkillId } from '../utils/formatters';

export const CareerRoadmapView = () => {
  const { 
    activeEmployee, 
    selectedTargetRoleId, 
    showToast,
    navigateTo 
  } = useTalent();

  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active stage index
  const [activeStageIdx, setActiveStageIdx] = useState(() => {
    return Number(sessionStorage.getItem('tg_roadmap_stage_idx')) || 0;
  });

  // Completed milestones map
  const [completedMilestones, setCompletedMilestones] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('tg_completed_milestones')) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    sessionStorage.setItem('tg_roadmap_stage_idx', String(activeStageIdx));
  }, [activeStageIdx]);

  useEffect(() => {
    sessionStorage.setItem('tg_completed_milestones', JSON.stringify(completedMilestones));
  }, [completedMilestones]);

  useEffect(() => {
    if (!activeEmployee?.id || !selectedTargetRoleId) return;

    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        const res = await TalentAPI.getCareerRoadmap(activeEmployee.id, selectedTargetRoleId);
        setRoadmapData(res.data);
      } catch (err) {
        console.warn('Error fetching career roadmap for target role:', selectedTargetRoleId, err);
        // If 404, role ID is stale; clear or fallback
        setRoadmapData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [activeEmployee?.id, selectedTargetRoleId]);

  const toggleMilestone = (key) => {
    setCompletedMilestones((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (next[key]) {
        showToast('Milestone achieved! Synchronized with career trajectory.', 'success');
      }
      return next;
    });
  };

  if (loading || !roadmapData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="font-mono text-xs text-slate-400">Synthesizing personalized career roadmap...</span>
      </div>
    );
  }

  const stages = roadmapData.stages || [];
  const currentStage = stages[activeStageIdx] || stages[0];
  const targetRoleTitle = roadmapData.target_role_title || 'Target Role';

  // Compute total progress
  let totalMilestonesCount = 0;
  let completedCount = 0;
  stages.forEach((st, sIdx) => {
    const mList = st.milestones || [];
    totalMilestonesCount += mList.length;
    mList.forEach((_, mIdx) => {
      if (completedMilestones[`${sIdx}-${mIdx}`]) completedCount++;
    });
  });

  const progressPercent = totalMilestonesCount > 0 
    ? Math.round((completedCount / totalMilestonesCount) * 100) 
    : 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav 
        items={[
          { label: 'Role Marketplace', tab: 'roles' },
          { label: 'Match Breakdown', tab: 'match' },
          { label: `Career Roadmap toward ${targetRoleTitle}`, tab: 'roadmap' }
        ]} 
        onBack={() => navigateTo('match')}
      />

      {/* Header Banner */}
      <div className="atlas-surface-elevated p-6 rounded-2xl border border-white/[0.1] light:border-slate-300 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 text-xs font-mono">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
              <span>Destination-Driven Career Trajectory</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white light:text-slate-900 tracking-tight">
              Roadmap: {activeEmployee.current_role} → {targetRoleTitle}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600">
              A structured {stages.length}-phase sequence designed to bridge capability gaps, complete key production projects, and reach 100% role qualification.
            </p>
          </div>

          {/* Progress Tracker */}
          <div className="p-4 rounded-xl bg-slate-950/70 light:bg-slate-50 border border-white/[0.08] light:border-slate-300 flex flex-col justify-between space-y-2 shrink-0 min-w-[200px]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Total Progress</span>
              <span className="font-bold text-cyan-400 light:text-cyan-700">{progressPercent}%</span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-900 light:bg-slate-200 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="text-[10px] font-mono text-slate-400 text-right">
              {completedCount} of {totalMilestonesCount} Milestones
            </div>
          </div>
        </div>
      </div>

      {/* Destination Stage Navigator (Horizontal / Stepper Track) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stages.map((st, idx) => {
          const isActive = idx === activeStageIdx;
          return (
            <div
              key={idx}
              onClick={() => setActiveStageIdx(idx)}
              className={`atlas-surface p-4 transition-all cursor-pointer border ${
                isActive
                  ? 'border-cyan-400/60 bg-cyan-500/10 light:bg-cyan-50 shadow-md ring-1 ring-cyan-500/30'
                  : 'hover:border-white/[0.15] light:hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-cyan-400 light:text-cyan-700 px-2 py-0.5 rounded bg-cyan-950/60 light:bg-cyan-100">
                  PHASE 0{idx + 1}
                </span>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {st.estimated_months || 3} Mos
                </span>
              </div>

              <h3 className="text-sm font-bold text-white light:text-slate-900 mt-2">
                {st.stage_name || `Milestone Phase #${idx + 1}`}
              </h3>

              <p className="text-[11px] text-slate-300 light:text-slate-600 mt-1 line-clamp-2">
                {st.description || 'Target proficiency development and deliverable validation.'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Active Phase Deep Dive */}
      {currentStage && (
        <div className="atlas-surface p-6 space-y-6 border border-white/[0.08] light:border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.08] light:border-slate-200">
            <div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                Detailed Phase Execution Plan
              </div>
              <h2 className="text-lg font-bold text-white light:text-slate-900 mt-0.5">
                {currentStage.stage_name}
              </h2>
            </div>

            <div className="text-xs font-mono text-slate-400">
              Target Duration: <span className="text-slate-200 light:text-slate-800 font-bold">{currentStage.estimated_months || 3} Months</span>
            </div>
          </div>

          {/* Key Capabilities Focus */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white light:text-slate-900 flex items-center gap-1.5 font-mono uppercase">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Capabilities to Develop:</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {(currentStage.focus_skills || ['MLOps', 'Distributed Training', 'Docker']).map((sk, sIdx) => {
                const skLabel = getSkillLabel(sk);
                return (
                  <span
                    key={getSkillId(sk, sIdx)}
                    className="atlas-badge-cyan text-xs py-1 px-3"
                  >
                    {skLabel}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Actionable Milestones Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white light:text-slate-900 flex items-center gap-1.5 font-mono uppercase">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Actionable Deliverables & Milestones:</span>
            </h4>

            <div className="space-y-2.5">
              {(currentStage.milestones || [
                'Complete practical coursework and pass technical certification benchmark',
                'Pair with principal engineer on enterprise architecture review',
                'Deliver production PR incorporating zero-downtime deployment patterns'
              ]).map((milestone, mIdx) => {
                const key = `${activeStageIdx}-${mIdx}`;
                const isChecked = !!completedMilestones[key];
                const milestoneText = typeof milestone === 'object' 
                  ? (milestone?.title || milestone?.milestone || milestone?.description || JSON.stringify(milestone))
                  : String(milestone);

                return (
                  <div
                    key={mIdx}
                    onClick={() => toggleMilestone(key)}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-950/20 light:bg-emerald-50 border-emerald-500/40 text-emerald-200 light:text-emerald-900'
                        : 'bg-slate-950/50 light:bg-white hover:bg-slate-900/80 light:hover:bg-slate-100 border-white/[0.06] light:border-slate-200 text-slate-300 light:text-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : 'border-slate-600 bg-slate-900 light:bg-white'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="text-xs leading-relaxed">
                      <span className={isChecked ? 'line-through opacity-80' : 'font-medium'}>
                        {milestoneText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Next Step */}
      <NextStepBanner
        title="Consult AI Career Copilot for Personalized Execution Advice"
        description="Ask Gemini 3.7 Flash for project recommendations, interview preparation, and mentorship strategies."
        actionLabel="Consult Career Copilot"
        targetTab="assistant"
      />
    </div>
  );
};
