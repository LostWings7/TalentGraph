import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Award, 
  CheckCircle2, 
  Check,
  Target,
  Briefcase,
  BookOpen,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';
import { useTalent } from '../context/TalentContext';
import { TalentAPI } from '../api/client';
import { BreadcrumbNav } from '../components/common/BreadcrumbNav';
import { NextStepBanner } from '../components/actions/NextStepBanner';
import { getSkillLabel, getSkillId } from '../utils/formatters';

export const CareerRoadmapView = () => {
  const { 
    activeEmployee, 
    employeeDetail,
    activeRoleMatches,
    selectedTargetRoleId, 
    setSelectedTargetRoleId,
    showToast,
    navigateTo 
  } = useTalent();

  // Auto-resolve target role ID
  const effectiveRoleId = selectedTargetRoleId || 
                          employeeDetail?.career_goal?.target_role_id || 
                          activeRoleMatches[0]?.role_id || 
                          activeRoleMatches[0]?.id;

  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

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

  // Keep selectedTargetRoleId synced if it wasn't set initially
  useEffect(() => {
    if (!selectedTargetRoleId && effectiveRoleId) {
      setSelectedTargetRoleId(effectiveRoleId);
    }
  }, [selectedTargetRoleId, effectiveRoleId, setSelectedTargetRoleId]);

  const fetchRoadmap = async () => {
    if (!activeEmployee?.id || !effectiveRoleId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);
      const res = await TalentAPI.getCareerRoadmap(activeEmployee.id, effectiveRoleId);
      setRoadmapData(res.data);
      if (res.data?.stages?.length > 0 && activeStageIdx >= res.data.stages.length) {
        setActiveStageIdx(0);
      }
    } catch (err) {
      console.warn('Error fetching career roadmap for target role:', effectiveRoleId, err);
      setFetchError(err.response?.data?.error || 'Could not synthesize career roadmap for this role.');
      // If 404, fallback to first active role match
      if (err.response?.status === 404 && activeRoleMatches.length > 0 && effectiveRoleId !== activeRoleMatches[0].role_id) {
        setSelectedTargetRoleId(activeRoleMatches[0].role_id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [activeEmployee?.id, effectiveRoleId]);

  const toggleMilestone = (key) => {
    setCompletedMilestones((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (next[key]) {
        showToast('Milestone achieved! Synchronized with career trajectory.', 'success');
      }
      return next;
    });
  };

  // Loading State
  if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <BreadcrumbNav 
          items={[
            { label: 'Role Marketplace', tab: 'roles' },
            { label: 'Match Breakdown', tab: 'match' },
            { label: 'Synthesizing Career Roadmap...', tab: 'roadmap' }
          ]} 
          onBack={() => navigateTo('match')}
        />
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <div className="text-center space-y-1">
            <span className="font-mono text-xs text-white light:text-slate-900 font-bold">
              Synthesizing Multi-Stage Career Progression Roadmap
            </span>
            <p className="text-[11px] text-slate-400 font-mono">
              Sequencing skill milestones, production stretch projects, and learning pathways...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error State with Retry
  if (fetchError || !roadmapData) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <BreadcrumbNav 
          items={[
            { label: 'Role Marketplace', tab: 'roles' },
            { label: 'Match Breakdown', tab: 'match' },
            { label: 'Career Roadmap', tab: 'roadmap' }
          ]} 
          onBack={() => navigateTo('match')}
        />

        <div className="atlas-surface p-8 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white light:text-slate-900">
              {fetchError || 'No Target Role Selected'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select a target aspirational milestone to construct your multi-phase career journey.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigateTo('roles')}
              className="atlas-btn-primary text-xs"
            >
              <span>Explore Roles</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={fetchRoadmap}
              className="atlas-btn-secondary text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stages = roadmapData.stages || [];
  const currentStage = stages[activeStageIdx] || stages[0];
  const targetRoleTitle = roadmapData.target_role_title || roadmapData.target_role || 'Target Role';
  const totalDuration = roadmapData.estimated_total_months || (stages.reduce((acc, s) => acc + (s.estimated_months || 0), 0) || 12);

  // Compute total progress across all milestones
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

      {/* Header Banner & Target Role Switcher */}
      <div className="atlas-surface-elevated p-6 rounded-2xl border border-white/[0.1] light:border-slate-300 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 text-xs font-mono">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
              <span>Destination-Driven Career Trajectory</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white light:text-slate-900 tracking-tight">
              Roadmap: {activeEmployee.current_role} → {targetRoleTitle}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600">
              A structured {stages.length}-phase sequence ({totalDuration} months total) designed to bridge capability gaps, complete key production projects, and reach 100% role qualification.
            </p>

            {roadmapData.readiness_assessment && (
              <p className="text-xs text-cyan-300/90 light:text-cyan-800 font-mono pt-1">
                AI Assessment: {roadmapData.readiness_assessment}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
            {/* Target Role Selector Dropdown */}
            <div className="p-3 rounded-xl bg-slate-950/60 light:bg-slate-100 border border-white/[0.08] light:border-slate-300">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mb-1">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>Target Milestone:</span>
              </div>
              <select
                value={effectiveRoleId || ''}
                onChange={(e) => setSelectedTargetRoleId(Number(e.target.value))}
                className="bg-slate-900 light:bg-white text-xs font-bold text-white light:text-slate-900 border border-white/[0.12] light:border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-cyan-500 cursor-pointer min-w-[180px]"
              >
                {activeRoleMatches.map((m) => (
                  <option key={m.role_id || m.id} value={m.role_id || m.id}>
                    {m.role_title} ({Math.round((m.overall_score || 0.8) * 100)}% fit)
                  </option>
                ))}
              </select>
            </div>

            {/* Progress Tracker */}
            <div className="p-4 rounded-xl bg-slate-950/70 light:bg-slate-50 border border-white/[0.08] light:border-slate-300 flex flex-col justify-between space-y-2 min-w-[190px]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Roadmap Progress</span>
                <span className="font-bold text-cyan-400 light:text-cyan-700">{progressPercent}%</span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-900 light:bg-slate-200 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="text-[10px] font-mono text-slate-400 text-right">
                {completedCount} of {totalMilestonesCount} Milestones Done
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Destination Stage Navigator (Horizontal Stepper Track) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stages.map((st, idx) => {
          const isActive = idx === activeStageIdx;
          const stageName = st.role_title || st.stage_name || `Milestone Phase #${idx + 1}`;
          const estMonths = st.estimated_months || 3;
          const stageDesc = (st.recommended_projects && st.recommended_projects.length > 0)
            ? st.recommended_projects[0]
            : 'Target capability development and deliverable validation.';

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
                  PHASE 0{st.stage_number || (idx + 1)}
                </span>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {estMonths} Mos
                </span>
              </div>

              <h3 className="text-sm font-bold text-white light:text-slate-900 mt-2 line-clamp-1">
                {stageName}
              </h3>

              <p className="text-[11px] text-slate-300 light:text-slate-600 mt-1 line-clamp-2">
                {stageDesc}
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
                Detailed Phase Execution Plan • Phase 0{currentStage.stage_number || (activeStageIdx + 1)}
              </div>
              <h2 className="text-lg font-bold text-white light:text-slate-900 mt-0.5">
                {currentStage.role_title || currentStage.stage_name || `Milestone Stage #${activeStageIdx + 1}`}
              </h2>
            </div>

            <div className="text-xs font-mono text-slate-400">
              Estimated Duration: <span className="text-cyan-400 light:text-cyan-700 font-bold">{currentStage.estimated_months || 3} Months</span>
            </div>
          </div>

          {/* Key Capabilities Focus */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white light:text-slate-900 flex items-center gap-1.5 font-mono uppercase">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Capabilities to Develop in this Phase:</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {(currentStage.focus_skills || ['Cross-Functional Collaboration', 'Generative AI']).map((sk, sIdx) => {
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
              <span>Actionable Deliverables & Progression Milestones:</span>
            </h4>

            <div className="space-y-2.5">
              {(currentStage.milestones || [
                'Complete practical coursework and pass technical certification benchmark',
                'Deliver production milestone with verified deliverable artifacts'
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

          {/* Recommended Production Projects & Stretch Work */}
          {currentStage.recommended_projects && currentStage.recommended_projects.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-white/[0.06] light:border-slate-200">
              <h4 className="text-xs font-bold text-white light:text-slate-900 flex items-center gap-1.5 font-mono uppercase">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>Recommended Production Initiatives & Stretch Projects:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentStage.recommended_projects.map((proj, pIdx) => (
                  <div 
                    key={pIdx}
                    className="p-3 rounded-xl bg-slate-950/40 light:bg-slate-50 border border-white/[0.04] light:border-slate-200 text-xs text-slate-300 light:text-slate-700 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>{typeof proj === 'string' ? proj : JSON.stringify(proj)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Learning & Certifications */}
          {currentStage.recommended_learning && currentStage.recommended_learning.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-white/[0.06] light:border-slate-200">
              <h4 className="text-xs font-bold text-white light:text-slate-900 flex items-center gap-1.5 font-mono uppercase">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Recommended Curriculum & Certification Pathways:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentStage.recommended_learning.map((learn, lIdx) => (
                  <div 
                    key={lIdx}
                    className="p-3 rounded-xl bg-slate-950/40 light:bg-slate-50 border border-white/[0.04] light:border-slate-200 text-xs text-slate-300 light:text-slate-700 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{typeof learn === 'string' ? learn : JSON.stringify(learn)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
