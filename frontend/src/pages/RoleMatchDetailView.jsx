import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Bookmark, 
  MessageSquare
} from 'lucide-react';
import { useTalent } from '../context/TalentContext';
import { TalentAPI } from '../api/client';
import { MetricGauge } from '../components/common/MetricGauge';
import { BreadcrumbNav } from '../components/common/BreadcrumbNav';
import { WhatIfSimulator } from '../components/simulation/WhatIfSimulator';
import { FeedbackDialog } from '../components/feedback/FeedbackDialog';
import { NextStepBanner } from '../components/actions/NextStepBanner';
import { getSkillLabel, getSkillId, getProficiencyLabel } from '../utils/formatters';

export const RoleMatchDetailView = () => {
  const { 
    activeEmployee, 
    selectedTargetRoleId, 
    refreshActiveEmployee,
    showToast,
    navigateTo 
  } = useTalent();

  const [matchDetail, setMatchDetail] = useState(null);
  const [roleDetail, setRoleDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    if (!activeEmployee?.id || !selectedTargetRoleId) return;

    const fetchMatchAndRole = async () => {
      try {
        setLoading(true);
        const [matchRes, roleRes] = await Promise.all([
          TalentAPI.getRoleMatchDetail(activeEmployee.id, selectedTargetRoleId, { refresh: false }),
          TalentAPI.getRoleDetail(selectedTargetRoleId),
        ]);
        setMatchDetail(matchRes.data);
        setRoleDetail(roleRes.data);
      } catch (err) {
        console.error('Error fetching role match detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchAndRole();
  }, [activeEmployee?.id, selectedTargetRoleId]);

  const handleSetTargetGoal = async () => {
    if (!roleDetail || !activeEmployee?.id) return;
    try {
      await TalentAPI.setEmployeeCareerGoal(activeEmployee.id, {
        target_role_title: roleDetail.title,
        target_role_id: roleDetail.id,
        notes: `Set target career goal to ${roleDetail.title} via Role Match Explorer.`,
      });
      await refreshActiveEmployee();
      showToast(`Set "${roleDetail.title}" as active target career milestone!`, 'success');
    } catch (err) {
      console.error('Error setting career goal:', err);
    }
  };

  if (loading || !matchDetail || !roleDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="font-mono text-xs text-slate-400">Loading deep match intelligence...</span>
      </div>
    );
  }

  const weights = matchDetail.weights || { semantic: 0.3, skill: 0.35, experience: 0.2, project: 0.15 };
  const isCurrentTarget = activeEmployee?.career_goal?.target_role_id === roleDetail.id;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav 
        items={[
          { label: 'Role Marketplace', tab: 'roles' },
          { label: `${roleDetail.title} Match Breakdown`, tab: 'match' }
        ]} 
        onBack={() => navigateTo('roles')}
      />

      {/* Hero Match Horizon Header */}
      <div className="atlas-surface-elevated p-6 rounded-2xl border border-white/[0.1] light:border-slate-300 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="atlas-badge-cyan text-xs">
                {typeof roleDetail.department === 'string' ? roleDetail.department : (roleDetail.department?.name || roleDetail.department?.id || '')}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Min Experience: {roleDetail.min_experience_years}+ Years
              </span>
              {isCurrentTarget && (
                <span className="atlas-badge-emerald text-xs">
                  ★ Active Career Milestone
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white light:text-slate-900 tracking-tight">
              {roleDetail.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600 leading-relaxed">
              {roleDetail.description}
            </p>

            {/* Target Career Goal CTA */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSetTargetGoal}
                disabled={isCurrentTarget}
                className={`atlas-btn-primary text-xs ${isCurrentTarget ? 'opacity-60 cursor-default' : ''}`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isCurrentTarget ? 'Active Career Milestone' : 'Set as Active Career Milestone'}</span>
              </button>

              <button
                onClick={() => setIsFeedbackOpen(true)}
                className="atlas-btn-secondary text-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Rate Match Accuracy</span>
              </button>
            </div>
          </div>

          {/* Overall Match Score Gauge */}
          <div className="p-5 rounded-2xl bg-slate-950/70 light:bg-slate-50 border border-white/[0.08] light:border-slate-300 flex items-center gap-5 shrink-0">
            <MetricGauge 
              score={matchDetail.overall_score} 
              size={80} 
              strokeWidth={8} 
              showPercentage={true}
            />

            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Overall Hybrid Fit
              </div>
              <div className="text-2xl font-black font-mono text-white light:text-slate-900">
                {Math.round(matchDetail.overall_score * 100)}%
              </div>
              <div className="text-[10px] font-mono text-emerald-400 light:text-emerald-700">
                {matchDetail.matching_skills?.length || 0} Alignments • {matchDetail.missing_skills?.length || 0} Gaps
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Four-Pillar Mathematical Breakdown Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Skill Score */}
        <div className="atlas-surface p-4 border-t-4 border-t-cyan-500 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Skill Match</span>
            <span>Weight: 35%</span>
          </div>
          <div className="text-2xl font-black font-mono text-cyan-400 light:text-cyan-700">
            {Math.round((matchDetail.skill_score || 0.7) * 100)}%
          </div>
          <p className="text-[11px] text-slate-300 light:text-slate-600">
            Overlap with mandatory role capabilities.
          </p>
        </div>

        {/* 2. Semantic Score */}
        <div className="atlas-surface p-4 border-t-4 border-t-indigo-500 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Semantic Vector Fit</span>
            <span>Weight: 30%</span>
          </div>
          <div className="text-2xl font-black font-mono text-indigo-400 light:text-indigo-700">
            {Math.round((matchDetail.semantic_score || 0.75) * 100)}%
          </div>
          <p className="text-[11px] text-slate-300 light:text-slate-600">
            Deep contextual embedding alignment.
          </p>
        </div>

        {/* 3. Experience Score */}
        <div className="atlas-surface p-4 border-t-4 border-t-emerald-500 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Seniority Fit</span>
            <span>Weight: 20%</span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 light:text-emerald-700">
            {Math.round((matchDetail.experience_score || 0.8) * 100)}%
          </div>
          <p className="text-[11px] text-slate-300 light:text-slate-600">
            Years experience vs role seniority baseline.
          </p>
        </div>

        {/* 4. Project Score */}
        <div className="atlas-surface p-4 border-t-4 border-t-amber-500 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Project Deliverables</span>
            <span>Weight: 15%</span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 light:text-amber-700">
            {Math.round((matchDetail.project_score || 0.7) * 100)}%
          </div>
          <p className="text-[11px] text-slate-300 light:text-slate-600">
            Demonstrated deliverables in similar domains.
          </p>
        </div>
      </div>

      {/* Flagship Live What-If Readiness Simulator */}
      <WhatIfSimulator
        roleTitle={roleDetail.title}
        roleId={roleDetail.id}
        currentScore={matchDetail.overall_score}
        semanticScore={matchDetail.semantic_score}
        skillScore={matchDetail.skill_score}
        experienceScore={matchDetail.experience_score}
        projectScore={matchDetail.project_score}
        missingSkills={matchDetail.missing_skills || []}
        weights={weights}
      />

      {/* Alignments vs Gaps Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Alignments */}
        <div className="atlas-surface p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] light:border-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white light:text-slate-900 uppercase font-mono">
                Matching Capability Strengths ({matchDetail.matching_skills?.length || 0})
              </h3>
            </div>
            <span className="atlas-badge-emerald text-[9px]">Verified Fit</span>
          </div>

          <div className="space-y-2">
            {(matchDetail.matched_skills || matchDetail.matching_skills || []).map((skill, idx) => (
              <div
                key={getSkillId(skill, idx)}
                className="p-3 rounded-xl bg-slate-950/40 light:bg-slate-50 border border-white/[0.04] light:border-slate-200 flex items-center justify-between"
              >
                <div className="text-xs font-bold text-white light:text-slate-900">
                  {getSkillLabel(skill)}
                </div>
                <span className="text-[10px] font-mono text-emerald-400 light:text-emerald-700 font-bold">
                  {getProficiencyLabel(skill, 'Advanced')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Gaps */}
        <div className="atlas-surface p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] light:border-slate-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-coral-400" />
              <h3 className="text-xs font-bold text-white light:text-slate-900 uppercase font-mono">
                Critical Growth Gaps ({(matchDetail.missing_skills || []).length})
              </h3>
            </div>
            <span className="atlas-badge-coral text-[9px]">Priority Closures</span>
          </div>

          <div className="space-y-2">
            {(matchDetail.missing_skills || []).map((gap, idx) => (
              <div
                key={getSkillId(gap, idx)}
                className="p-3 rounded-xl bg-coral-950/10 light:bg-rose-50 border border-coral-500/20 light:border-rose-200 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white light:text-slate-900">
                    {getSkillLabel(gap)}
                  </div>
                  <div className="text-[10px] text-coral-400 light:text-rose-700 font-mono">
                    Required: {getProficiencyLabel(gap, 'Advanced')}
                  </div>
                </div>

                <button
                  onClick={() => navigateTo('gap')}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 light:text-cyan-700 underline cursor-pointer"
                >
                  View Course →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next Step */}
      <NextStepBanner
        title={`Bridge Gaps for ${roleDetail.title} via Learning Pathways`}
        description="Enroll directly in targeted courses and structured project milestones to acquire required proficiencies."
        actionLabel="View Skill Gaps & Courses"
        targetTab="gap"
      />

      {/* Feedback Dialog */}
      <FeedbackDialog
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        roleTitle={roleDetail.title}
        roleId={roleDetail.id}
      />
    </div>
  );
};
