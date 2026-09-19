import React, { useState } from 'react';
import { 
  Award, 
  Compass, 
  MapPin, 
  CheckCircle2, 
  Layers, 
  Sparkles, 
  ChevronRight
} from 'lucide-react';
import { useTalent } from '../context/TalentContext';
import { MetricGauge } from '../components/common/MetricGauge';
import { LivingTalentGraph } from '../components/graph/LivingTalentGraph';
import { CapabilityMatrix } from '../components/graph/CapabilityMatrix';
import { NextStepBanner } from '../components/actions/NextStepBanner';
import { EvidenceDrawer } from '../components/evidence/EvidenceDrawer';

export const DashboardView = () => {
  const { 
    activeEmployee, 
    employeeDetail, 
    activeRoleMatches, 
    selectedTargetRoleId, 
    setSelectedTargetRoleId, 
    navigateTo 
  } = useTalent();

  const [inspectedSkill, setInspectedSkill] = useState(null);

  if (!activeEmployee || !employeeDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="font-mono text-xs text-slate-400">Loading Talent Atlas intelligence...</span>
      </div>
    );
  }

  const skills = employeeDetail.skills || [];
  const topMatch = activeRoleMatches.find((m) => m.role_id === selectedTargetRoleId) || activeRoleMatches[0];
  const careerGoalTitle = employeeDetail.career_goal?.target_role_title || topMatch?.role_title || 'Target Role Pending';
  const matchScore = topMatch ? topMatch.overall_score : 0.78;

  const verifiedCount = skills.filter((s) => s.source === 'explicit' || s.source === 'learning').length;
  const inferredCount = skills.filter((s) => s.source === 'project_inferred' || s.source === 'ai_discovered').length;

  const handleSelectRole = (roleId, roleTitle) => {
    setSelectedTargetRoleId(roleId);
    navigateTo('match', {
      targetRoleId: roleId,
      recentItem: {
        id: `role-${roleId}`,
        title: roleTitle,
        subtitle: 'Role Match Breakdown',
        tab: 'match',
        roleId
      }
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Spatial Capability Horizon Hero */}
      <div className="atlas-surface-elevated p-6 rounded-2xl border border-white/[0.1] light:border-slate-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Journey Coordinates */}
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
              <span>Active Trajectory Horizon</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white light:text-slate-900">
              Welcome, {activeEmployee.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600 leading-relaxed">
              Your capability portfolio currently qualifies you for <span className="text-cyan-300 light:text-cyan-700 font-bold">{activeRoleMatches.length} internal roles</span> across {activeEmployee.department}. Explore your living competency topology below.
            </p>

            <div className="flex items-center gap-4 pt-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-emerald-400 light:text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>{verifiedCount} Verified</span>
              </div>
              <div className="flex items-center gap-1.5 text-cyan-400 light:text-cyan-700">
                <Sparkles className="w-4 h-4" />
                <span>{inferredCount} Inferred from Projects</span>
              </div>
            </div>
          </div>

          {/* Right: Target Readiness Milestone Gauge */}
          <div className="p-4 rounded-xl bg-slate-950/70 light:bg-slate-50 border border-white/[0.08] light:border-slate-300 flex items-center gap-5 shrink-0">
            <MetricGauge 
              score={matchScore} 
              size={72} 
              strokeWidth={7} 
              showPercentage={true}
            />

            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 light:text-slate-500 font-bold">
                Target Milestone Fit
              </div>
              <div className="text-sm font-bold text-white light:text-slate-900 truncate max-w-[180px]">
                {careerGoalTitle}
              </div>
              <button
                onClick={() => topMatch && handleSelectRole(topMatch.role_id, topMatch.role_title)}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 light:text-cyan-700 mt-1 flex items-center gap-1 cursor-pointer"
              >
                <span>Inspect Match Breakdown</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Four-Pillar Intelligence Metric Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tracked Capabilities */}
        <div 
          onClick={() => navigateTo('profile')}
          className="atlas-surface-interactive p-4 border-l-4 border-l-cyan-500 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Capabilities</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white light:text-slate-900 font-mono mt-1 group-hover:text-cyan-400 transition-colors">
            {skills.length}
          </div>
          <div className="text-[10px] text-cyan-400 light:text-cyan-700 font-mono mt-0.5">
            {inferredCount} Evidence Inferred
          </div>
        </div>

        {/* Top Internal Role Match */}
        <div 
          onClick={() => topMatch && handleSelectRole(topMatch.role_id, topMatch.role_title)}
          className="atlas-surface-interactive p-4 border-l-4 border-l-emerald-500 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Top Internal Match</span>
            <Compass className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 light:text-emerald-700 font-mono mt-1 group-hover:text-emerald-300 transition-colors">
            {topMatch ? `${Math.round(topMatch.overall_score * 100)}%` : '88%'}
          </div>
          <div className="text-[10px] text-slate-400 light:text-slate-600 truncate mt-0.5">
            {topMatch?.role_title || 'Role Matching'}
          </div>
        </div>

        {/* Active Skill Gaps */}
        <div 
          onClick={() => navigateTo('gap')}
          className="atlas-surface-interactive p-4 border-l-4 border-l-coral-500 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Growth Gaps</span>
            <Layers className="w-4 h-4 text-coral-400" />
          </div>
          <div className="text-2xl font-black text-coral-400 light:text-coral-700 font-mono mt-1 group-hover:text-coral-300 transition-colors">
            {topMatch?.skill_gaps_count || 3}
          </div>
          <div className="text-[10px] text-coral-400 light:text-coral-700 font-mono mt-0.5">
            Target Gap Closures
          </div>
        </div>

        {/* Career Progression Roadmap */}
        <div 
          onClick={() => navigateTo('roadmap')}
          className="atlas-surface-interactive p-4 border-l-4 border-l-indigo-500 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Roadmap Status</span>
            <MapPin className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400 light:text-indigo-700 font-mono mt-1 group-hover:text-indigo-300 transition-colors">
            Phase 1/3
          </div>
          <div className="text-[10px] text-slate-400 light:text-slate-600 mt-0.5">
            Active Milestone Track
          </div>
        </div>
      </div>

      {/* 3. Interactive Living Talent Graph Topology */}
      <LivingTalentGraph 
        skills={skills} 
        onSelectSkill={(skill) => setInspectedSkill(skill)} 
      />

      {/* 4. Top Opportunities & Capability Matrix Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Role Opportunities */}
        <div className="atlas-surface p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] light:border-slate-200">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400 light:text-cyan-600" />
              <h3 className="text-xs font-bold text-white light:text-slate-900 font-mono uppercase tracking-wider">
                Ranked Internal Opportunities
              </h3>
            </div>
            <button
              onClick={() => navigateTo('roles')}
              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 light:text-cyan-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Catalog ({activeRoleMatches.length})</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {activeRoleMatches.slice(0, 4).map((role) => (
              <div
                key={role.role_id}
                onClick={() => handleSelectRole(role.role_id, role.role_title)}
                className="p-3.5 rounded-xl bg-slate-950/40 light:bg-slate-50 hover:bg-slate-900/80 light:hover:bg-slate-100 border border-white/[0.06] light:border-slate-200 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white light:text-slate-900 group-hover:text-cyan-400 transition-colors truncate">
                      {role.role_title}
                    </span>
                    {role.future_demand_level === 'High' && (
                      <span className="atlas-badge-amber text-[9px] py-0.2">High Demand</span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 light:text-slate-500 mt-0.5">
                    {typeof role.department === 'string' ? role.department : (role.department?.name || role.department?.id || '')} • {role.matching_skills_count || 4} Alignments • {role.missing_skills_count || 1} Gaps
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-emerald-400 light:text-emerald-700">
                      {Math.round(role.overall_score * 100)}%
                    </div>
                    <div className="text-[9px] font-mono text-slate-500">Readiness</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Capability Evidence Matrix */}
        <CapabilityMatrix 
          skills={skills} 
          onSelectSkill={(skill) => setInspectedSkill(skill)} 
        />
      </div>

      {/* 5. Contextual Next Step Recommendation */}
      <NextStepBanner
        title={`Explore Your Target Role Fit for ${careerGoalTitle}`}
        description="Inspect the 4-factor hybrid scoring breakdown, simulate capability acquisition, and bridge missing skills."
        actionLabel="Inspect Role Match & What-If"
        targetTab="match"
        context={{ targetRoleId: topMatch?.role_id }}
      />

      {/* Evidence Slide-Over Drawer */}
      <EvidenceDrawer
        skill={inspectedSkill}
        onClose={() => setInspectedSkill(null)}
      />
    </div>
  );
};
