import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  BookOpen, 
  AlertTriangle, 
  Sparkles, 
  Flame, 
  Check
} from 'lucide-react';
import { useTalent } from '../context/TalentContext';
import { TalentAPI } from '../api/client';
import { BreadcrumbNav } from '../components/common/BreadcrumbNav';
import { NextStepBanner } from '../components/actions/NextStepBanner';
import { getSkillLabel, getSkillId, getProficiencyLabel } from '../utils/formatters';

export const SkillGapLearningView = () => {
  const { 
    activeEmployee, 
    selectedTargetRoleId, 
    refreshActiveEmployee, 
    showToast,
    navigateTo 
  } = useTalent();

  const [gapData, setGapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [enrolledMap, setEnrolledMap] = useState({});

  const [priorityFilter, setPriorityFilter] = useState(() => {
    return sessionStorage.getItem('tg_gap_priority') || 'all';
  });

  useEffect(() => {
    sessionStorage.setItem('tg_gap_priority', priorityFilter);
  }, [priorityFilter]);

  useEffect(() => {
    if (!activeEmployee?.id || !selectedTargetRoleId) return;

    const fetchGaps = async () => {
      try {
        setLoading(true);
        const res = await TalentAPI.getSkillGapAnalysis(activeEmployee.id, selectedTargetRoleId);
        setGapData(res.data);
      } catch (err) {
        console.error('Error fetching skill gaps:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGaps();
  }, [activeEmployee?.id, selectedTargetRoleId]);

  const handleEnroll = async (resourceId, courseTitle) => {
    try {
      setEnrollingId(resourceId);
      await TalentAPI.enrollEmployeeLearning(activeEmployee.id, {
        resource_id: resourceId,
        status: 'In Progress',
      });
      setEnrolledMap((prev) => ({ ...prev, [resourceId]: true }));
      await refreshActiveEmployee();
      showToast(`Enrolled in "${courseTitle}"! Pathway synced with your employee record.`, 'success');
    } catch (err) {
      console.error('Error enrolling in resource:', err);
    } finally {
      setEnrollingId(null);
    }
  };

  if (loading || !gapData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="font-mono text-xs text-slate-400">Evaluating skill gap pathways...</span>
      </div>
    );
  }

  const roleTitle = gapData.role_title || 'Target Role';
  const gaps = gapData.gaps || [];

  const filteredGaps = gaps.filter((g) => {
    if (priorityFilter === 'all') return true;
    return g.priority?.toLowerCase() === priorityFilter.toLowerCase();
  });

  const criticalCount = gaps.filter((g) => g.priority === 'Critical').length;
  const highCount = gaps.filter((g) => g.priority === 'High').length;
  const mediumCount = gaps.filter((g) => g.priority === 'Medium' || g.priority === 'Low').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav 
        items={[
          { label: 'Role Marketplace', tab: 'roles' },
          { label: 'Match Breakdown', tab: 'match' },
          { label: `Skill Gaps & Learning for ${roleTitle}`, tab: 'gap' }
        ]} 
        onBack={() => navigateTo('match')}
      />

      {/* Header Banner */}
      <div className="atlas-surface-elevated p-6 rounded-2xl border border-white/[0.1] light:border-slate-300 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 text-xs font-mono">
          <Layers className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
          <span>Priority Gap Diagnostics & Learning Pathways</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white light:text-slate-900 tracking-tight">
          Bridge Skill Gaps for {roleTitle}
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600 max-w-2xl">
          Identified capability shortages categorized by organizational urgency. Enroll directly into targeted internal and external coursework to qualify for this role.
        </p>
      </div>

      {/* Priority Ribbon Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setPriorityFilter(priorityFilter === 'critical' ? 'all' : 'critical')}
          className={`atlas-surface-interactive p-4 border-l-4 border-l-coral-500 ${priorityFilter === 'critical' ? 'ring-2 ring-coral-500/40' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">Critical Deficits</span>
            <Flame className="w-4 h-4 text-coral-400" />
          </div>
          <div className="text-2xl font-black text-coral-400 light:text-coral-700 font-mono mt-1">
            {criticalCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Blocks Core Qualification</div>
        </div>

        <div 
          onClick={() => setPriorityFilter(priorityFilter === 'high' ? 'all' : 'high')}
          className={`atlas-surface-interactive p-4 border-l-4 border-l-amber-500 ${priorityFilter === 'high' ? 'ring-2 ring-amber-500/40' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">High Priority Gaps</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 light:text-amber-700 font-mono mt-1">
            {highCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Recommended Within 3 Months</div>
        </div>

        <div 
          onClick={() => setPriorityFilter(priorityFilter === 'medium' ? 'all' : 'medium')}
          className={`atlas-surface-interactive p-4 border-l-4 border-l-cyan-500 ${priorityFilter === 'medium' ? 'ring-2 ring-cyan-500/40' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">Medium & Growth Areas</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 light:text-cyan-700 font-mono mt-1">
            {mediumCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Adjacent Complementary Skills</div>
        </div>
      </div>

      {/* Priority Gaps & Learning Pathways */}
      <div className="space-y-4">
        {filteredGaps.length === 0 ? (
          <div className="atlas-surface p-12 text-center text-xs text-slate-400">
            No skill gaps match the selected priority filter.
          </div>
        ) : (
          filteredGaps.map((gap, gIdx) => {
            const priorityBadge = gap.priority === 'Critical' 
              ? 'atlas-badge-coral' 
              : gap.priority === 'High' 
              ? 'atlas-badge-amber' 
              : 'atlas-badge-cyan';

            const resources = gap.recommended_resources || [];
            const skillTitle = getSkillLabel(gap);
            const reqProf = getProficiencyLabel({ proficiency: gap.required_proficiency }, 'Intermediate');
            const curProf = getProficiencyLabel({ proficiency: gap.current_proficiency }, 'Not Evidenced');

            return (
              <div
                key={getSkillId(gap, gIdx)}
                className="atlas-surface p-5 space-y-4 border border-white/[0.08] light:border-slate-200"
              >
                {/* Gap Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06] light:border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white light:text-slate-900">
                        {skillTitle}
                      </h3>
                      <span className={`${priorityBadge} text-[9px]`}>
                        {gap.priority} Priority
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Required Level: <span className="text-cyan-400 light:text-cyan-700 font-bold">{reqProf}</span> • Current: {curProf}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    Category: {typeof gap.skill_category === 'string' ? gap.skill_category : 'Core Skill'}
                  </span>
                </div>

                {/* Recommended Learning Resources */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Recommended Learning Pathway & Coursework:</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {resources.length === 0 ? (
                      <div className="p-3 rounded-xl bg-slate-950/40 text-xs text-slate-400 col-span-2">
                        Custom internal mentorship and hands-on project paired with senior lead recommended.
                      </div>
                    ) : (
                      resources.map((res, rIdx) => {
                        const isEnrolled = enrolledMap[res.id] || res.enrolled;
                        const isEnrolling = enrollingId === res.id;
                        const courseTitle = typeof res.title === 'object' ? (res.title?.title || JSON.stringify(res.title)) : (res.title || 'Course');

                        return (
                          <div
                            key={rIdx}
                            className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-white/[0.06] light:border-slate-200 flex flex-col justify-between space-y-3"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-white light:text-slate-900">
                                  {courseTitle}
                                </span>
                                <span className="atlas-badge-indigo text-[9px]">
                                  {res.resource_type || 'Course'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 light:text-slate-600 mt-1 line-clamp-2">
                                {res.provider} • {res.estimated_hours} Hours • {res.difficulty_level || 'Intermediate'}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] light:border-slate-200">
                              <span className="text-[10px] font-mono text-emerald-400 light:text-emerald-700">
                                Bridges gap to {reqProf}
                              </span>

                              <button
                                onClick={() => handleEnroll(res.id, courseTitle)}
                                disabled={isEnrolled || isEnrolling}
                                className={`text-xs py-1 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                                  isEnrolled
                                    ? 'bg-emerald-500/20 text-emerald-300 light:bg-emerald-100 light:text-emerald-800 border border-emerald-500/40 cursor-default'
                                    : 'atlas-btn-primary'
                                }`}
                              >
                                {isEnrolling ? (
                                  'Enrolling...'
                                ) : isEnrolled ? (
                                  <span className="flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Enrolled
                                  </span>
                                ) : (
                                  'Enroll Pathway'
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Next Step */}
      <NextStepBanner
        title={`Review Your Structured Career Roadmap for ${roleTitle}`}
        description="Follow sequential milestone stages from foundations to mastery with real-time milestone checkboxes."
        actionLabel="View Career Roadmap"
        targetTab="roadmap"
      />
    </div>
  );
};
