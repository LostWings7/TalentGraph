import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  BookOpen, 
  AlertTriangle, 
  Sparkles, 
  Flame, 
  Check,
  Target,
  Clock,
  RotateCcw,
  ExternalLink,
  Award,
  ChevronRight
} from 'lucide-react';
import { useTalent } from '../context/TalentContext';
import { TalentAPI } from '../api/client';
import { BreadcrumbNav } from '../components/common/BreadcrumbNav';
import { NextStepBanner } from '../components/actions/NextStepBanner';
import { getSkillLabel, getSkillId, getProficiencyLabel } from '../utils/formatters';

export const SkillGapLearningView = () => {
  const { 
    activeEmployee, 
    employeeDetail,
    activeRoleMatches,
    selectedTargetRoleId, 
    setSelectedTargetRoleId,
    refreshActiveEmployee, 
    showToast,
    navigateTo 
  } = useTalent();

  // Auto-resolve target role ID if missing or stale
  const effectiveRoleId = selectedTargetRoleId || 
                          employeeDetail?.career_goal?.target_role_id || 
                          activeRoleMatches[0]?.role_id || 
                          activeRoleMatches[0]?.id;

  const [gapData, setGapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null);
  const [enrolledMap, setEnrolledMap] = useState({});

  const [priorityFilter, setPriorityFilter] = useState(() => {
    return sessionStorage.getItem('tg_gap_priority') || 'all';
  });

  useEffect(() => {
    sessionStorage.setItem('tg_gap_priority', priorityFilter);
  }, [priorityFilter]);

  // Keep selectedTargetRoleId synced if it wasn't set initially
  useEffect(() => {
    if (!selectedTargetRoleId && effectiveRoleId) {
      setSelectedTargetRoleId(effectiveRoleId);
    }
  }, [selectedTargetRoleId, effectiveRoleId, setSelectedTargetRoleId]);

  const fetchGaps = async () => {
    if (!activeEmployee?.id || !effectiveRoleId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);
      const res = await TalentAPI.getSkillGapAnalysis(activeEmployee.id, effectiveRoleId);
      setGapData(res.data);
    } catch (err) {
      console.error('Error fetching skill gaps:', err);
      setFetchError(err.response?.data?.error || 'Could not evaluate skill gaps for this target role.');
      // If 404, the stored role ID might be stale; reset to top match if available
      if (err.response?.status === 404 && activeRoleMatches.length > 0 && effectiveRoleId !== activeRoleMatches[0].role_id) {
        setSelectedTargetRoleId(activeRoleMatches[0].role_id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, [activeEmployee?.id, effectiveRoleId]);

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
      showToast('Enrollment noted in career pathway.', 'info');
      setEnrolledMap((prev) => ({ ...prev, [resourceId]: true }));
    } finally {
      setEnrollingId(null);
    }
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <BreadcrumbNav 
          items={[
            { label: 'Role Marketplace', tab: 'roles' },
            { label: 'Match Breakdown', tab: 'match' },
            { label: 'Evaluating Skill Gaps...', tab: 'gap' }
          ]} 
          onBack={() => navigateTo('match')}
        />
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <div className="text-center space-y-1">
            <span className="font-mono text-xs text-white light:text-slate-900 font-bold">
              Evaluating Skill Gap Decomposition & Learning Pathways
            </span>
            <p className="text-[11px] text-slate-400 font-mono">
              Analyzing required vs demonstrated proficiencies across role requirements...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error State with Retry
  if (fetchError || !gapData) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <BreadcrumbNav 
          items={[
            { label: 'Role Marketplace', tab: 'roles' },
            { label: 'Match Breakdown', tab: 'match' },
            { label: 'Skill Gaps & Learning Pathways', tab: 'gap' }
          ]} 
          onBack={() => navigateTo('match')}
        />

        <div className="atlas-surface p-8 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-coral-500/10 text-coral-400 border border-coral-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white light:text-slate-900">
              {fetchError || 'No Target Role Selected'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select an aspirational role from the role marketplace to diagnose missing proficiencies and recommended learning courses.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigateTo('roles')}
              className="atlas-btn-primary text-xs"
            >
              <span>Explore Role Marketplace</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={fetchGaps}
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

  const roleTitle = gapData.role_title || 'Target Role';
  // Backend returns skill_gaps list
  const gaps = gapData.skill_gaps || gapData.gaps || [];
  const matchedSkills = gapData.matched_skills || [];
  const readinessPct = gapData.readiness_percentage || 0;

  const filteredGaps = gaps.filter((g) => {
    if (priorityFilter === 'all') return true;
    return g.priority?.toLowerCase() === priorityFilter.toLowerCase();
  });

  const criticalCount = gapData.critical_gap_count ?? gaps.filter((g) => g.priority === 'Critical').length;
  const highCount = gaps.filter((g) => g.priority === 'High').length;
  const mediumCount = gaps.filter((g) => g.priority === 'Medium' || g.priority === 'Low').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav 
        items={[
          { label: 'Role Marketplace', tab: 'roles' },
          { label: 'Match Breakdown', tab: 'match' },
          { label: `Skill Gaps for ${roleTitle}`, tab: 'gap' }
        ]} 
        onBack={() => navigateTo('match')}
      />

      {/* Header Banner & Target Role Switcher */}
      <div className="atlas-surface-elevated p-6 rounded-2xl border border-white/[0.1] light:border-slate-300 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 text-xs font-mono">
              <Layers className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
              <span>Priority Gap Diagnostics & Learning Pathways</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white light:text-slate-900 tracking-tight">
              Skill Gaps toward {roleTitle}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600">
              {gapData.department ? `${gapData.department} • ` : ''}Readiness: <span className="font-bold text-cyan-400 light:text-cyan-700 font-mono">{readinessPct}%</span> ({gapData.matched_count || matchedSkills.length} of {gapData.total_requirements || (gaps.length + matchedSkills.length)} requirements evidenced).
            </p>
          </div>

          {/* Interactive Role Selector Dropdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 light:bg-slate-100 border border-white/[0.08] light:border-slate-300 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>Target Role:</span>
            </div>
            <select
              value={effectiveRoleId || ''}
              onChange={(e) => {
                const newId = Number(e.target.value);
                setSelectedTargetRoleId(newId);
              }}
              className="bg-slate-900 light:bg-white text-xs font-bold text-white light:text-slate-900 border border-white/[0.12] light:border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:border-cyan-500 cursor-pointer min-w-[200px]"
            >
              {activeRoleMatches.map((m) => (
                <option key={m.role_id || m.id} value={m.role_id || m.id}>
                  {m.role_title} ({Math.round((m.overall_score || 0.8) * 100)}% fit)
                </option>
              ))}
            </select>
          </div>
        </div>
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
          <div className="text-[10px] text-slate-400 mt-0.5">Blocks Core Role Qualification</div>
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
          <div className="text-[10px] text-slate-400 mt-0.5">Adjacent Complementary Capabilities</div>
        </div>
      </div>

      {/* Priority Gaps & Learning Pathways */}
      <div className="space-y-4">
        {filteredGaps.length === 0 ? (
          <div className="atlas-surface p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white light:text-slate-900">
              {gaps.length === 0 
                ? 'No Skill Gaps Found — Full Capability Coverage!' 
                : `No Gaps Matching the "${priorityFilter}" Priority Filter`}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {gaps.length === 0
                ? `You possess demonstrated or verified evidence for 100% of the core capabilities required for ${roleTitle}.`
                : 'Clear the priority filter or inspect your career progression roadmap.'}
            </p>
            {priorityFilter !== 'all' && (
              <button
                onClick={() => setPriorityFilter('all')}
                className="atlas-btn-secondary text-xs mt-2"
              >
                Reset Filter to All
              </button>
            )}
          </div>
        ) : (
          filteredGaps.map((gap, gIdx) => {
            const priorityBadge = gap.priority === 'Critical' 
              ? 'atlas-badge-coral' 
              : gap.priority === 'High' 
              ? 'atlas-badge-amber' 
              : 'atlas-badge-cyan';

            const resources = gap.recommended_resources || [];
            const skillTitle = gap.skill_name || getSkillLabel(gap);
            const reqProf = gap.required_proficiency || 'Intermediate';
            const curProf = gap.candidate_proficiency || gap.current_proficiency || 'None';
            const category = gap.category || gap.skill_category || 'Core Capability';
            const gapDesc = gap.gap_description || `Required at ${reqProf} proficiency level.`;

            return (
              <div
                key={gap.skill_id || gIdx}
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
                        {gap.priority || 'High'} Priority
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Required: <span className="text-cyan-400 light:text-cyan-700 font-bold">{reqProf}</span> • Current: <span className="text-slate-300 light:text-slate-700">{curProf}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    Category: {category}
                  </span>
                </div>

                {gapDesc && (
                  <p className="text-xs text-slate-300 light:text-slate-600 leading-relaxed">
                    {gapDesc}
                  </p>
                )}

                {/* Recommended Learning Resources */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 font-bold uppercase">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Recommended Learning Pathways & Coursework ({resources.length}):</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {resources.length === 0 ? (
                      <div className="p-3 rounded-xl bg-slate-950/40 text-xs text-slate-400 col-span-3">
                        Internal mentoring pairing and stretch production project recommended to bridge this gap.
                      </div>
                    ) : (
                      resources.map((res, rIdx) => {
                        const isEnrolled = enrolledMap[res.id] || res.enrolled;
                        const isEnrolling = enrollingId === res.id;
                        const courseTitle = typeof res.title === 'object' ? (res.title?.title || JSON.stringify(res.title)) : (res.title || 'Course');
                        const hours = res.duration_hours || res.estimated_hours || 12;
                        const difficulty = res.difficulty || res.difficulty_level || 'Intermediate';
                        const provider = res.provider || 'Internal Academy';
                        const cert = res.certification_name || res.resource_type || 'Skill Pathway';

                        return (
                          <div
                            key={res.id || rIdx}
                            className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-white/[0.06] light:border-slate-200 flex flex-col justify-between space-y-3 hover:border-cyan-500/30 transition-all"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-white light:text-slate-900 line-clamp-2">
                                  {courseTitle}
                                </span>
                                <span className="atlas-badge-cyan text-[9px] shrink-0">
                                  {difficulty}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                                <span>{provider}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-cyan-400" />
                                  {hours} Hours
                                </span>
                              </div>

                              {res.description && (
                                <p className="text-[11px] text-slate-400 light:text-slate-600 line-clamp-2 leading-relaxed">
                                  {res.description}
                                </p>
                              )}

                              {cert && (
                                <div className="text-[10px] font-mono text-emerald-400 light:text-emerald-700 flex items-center gap-1 pt-0.5">
                                  <Award className="w-3 h-3" />
                                  <span className="truncate">{cert}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] light:border-slate-200">
                              <span className="text-[10px] font-mono text-cyan-400 light:text-cyan-700">
                                Bridges to {reqProf}
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
        description="Follow sequential milestone stages from foundations to mastery with real-time milestone tracking."
        actionLabel="View Career Roadmap"
        targetTab="roadmap"
      />
    </div>
  );
};
