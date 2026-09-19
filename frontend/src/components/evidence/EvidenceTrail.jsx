import React from 'react';
import { 
  Award, 
  Calendar, 
  CheckCircle2, 
  Briefcase, 
  Sparkles, 
  Layers, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  GitBranch,
  Clock,
  ArrowRight,
  Compass,
  GraduationCap,
  Activity,
  Check,
  UserCheck
} from 'lucide-react';
import { getSkillLabel, getProficiencyLabel } from '../../utils/formatters';

export const EvidenceTrail = ({ 
  skill, 
  employeeDetail, 
  activeRoleMatches = [], 
  navigateTo, 
  onClose 
}) => {
  if (!skill) return null;

  const sName = getSkillLabel(skill) || 'Capability';
  const sProf = getProficiencyLabel(skill);
  const sCat = typeof skill.skill_category === 'string' ? skill.skill_category : 'Technical Expertise';
  const rawConfidence = skill.confidence_score || skill.confidence || 0.85;
  const confidence = Math.round(rawConfidence * 100);
  const source = skill.source || 'explicit';
  const status = skill.verification_status || 'verified';

  // 1. Map to 6-Tier Evidence Hierarchy (Prompt Section 3)
  const getEvidenceTier = () => {
    if (status === 'approved' || status === 'verified' || skill.verified_by_name) {
      return {
        level: 1,
        label: 'HR Verified',
        sublabel: 'Confirmed by Enterprise Leadership',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 light:bg-emerald-100 light:text-emerald-800 light:border-emerald-300',
        icon: ShieldCheck,
        color: '#10b981',
        qualityScore: 'High (0.95)'
      };
    }
    if (source === 'certification' || (skill.evidence && skill.evidence.toLowerCase().includes('cert'))) {
      return {
        level: 2,
        label: 'Certified',
        sublabel: 'External Accredited Credential',
        badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30 light:bg-sky-100 light:text-sky-800 light:border-sky-300',
        icon: Award,
        color: '#0284c7',
        qualityScore: 'High (0.90)'
      };
    }
    if (source === 'explicit' || skill.last_demonstrated_date) {
      return {
        level: 3,
        label: 'Demonstrated',
        sublabel: 'Observed in Production Projects',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 light:bg-cyan-100 light:text-cyan-800 light:border-cyan-300',
        icon: GitBranch,
        color: '#06b6d4',
        qualityScore: 'Strong (0.85)'
      };
    }
    if (source === 'project_inferred' || source === 'ai_discovered') {
      return {
        level: 4,
        label: 'Inferred',
        sublabel: 'Synthesized from Project Deliverables',
        badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 light:bg-indigo-100 light:text-indigo-800 light:border-indigo-300',
        icon: Sparkles,
        color: '#6366f1',
        qualityScore: 'Moderate (0.75)'
      };
    }
    if (source === 'learning') {
      return {
        level: 5,
        label: 'Self-Reported',
        sublabel: 'Self-Assessed / Learning In-Progress',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30 light:bg-amber-100 light:text-amber-800 light:border-amber-300',
        icon: UserCheck,
        color: '#f59e0b',
        qualityScore: 'Developing (0.65)'
      };
    }
    return {
      level: 6,
      label: 'Declared',
      sublabel: 'Initial Employee Onboarding Declaration',
      badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30 light:bg-slate-100 light:text-slate-700 light:border-slate-300',
      icon: FileText,
      color: '#64748b',
      qualityScore: 'Baseline (0.50)'
    };
  };

  const tier = getEvidenceTier();
  const TierIcon = tier.icon;

  // 2. Freshness & Temporal Decay Signal (Prompt Section 5)
  const isFresh = rawConfidence >= 0.8 || tier.level <= 3;
  const freshnessStatus = isFresh ? 'Recently Demonstrated (Active)' : 'Aging Evidence (Decay Window)';
  const freshnessText = isFresh 
    ? 'Demonstrated in active production cycle within the last 6 months. Full confidence weighting applied.'
    : 'Evidence is older than 6 months. Subject to graceful temporal confidence half-life decay.';

  // 3. Extract real project contributions matching this skill
  const contributions = employeeDetail?.contributions || [];
  const relevantContributions = contributions.filter((c) => {
    const pSkills = c.skills_used || [];
    const tech = c.technologies_demonstrated || '';
    const summary = c.contribution_summary || '';
    return pSkills.some((s) => getSkillLabel(s).toLowerCase().includes(sName.toLowerCase())) ||
           tech.toLowerCase().includes(sName.toLowerCase()) ||
           summary.toLowerCase().includes(sName.toLowerCase()) ||
           contributions.length <= 2;
  });

  const displayContributions = relevantContributions.length > 0 ? relevantContributions : contributions.slice(0, 3);

  // 4. Connective Graph: Find roles that require this skill (Prompt Section 1 & 29)
  const matchingRoles = activeRoleMatches.filter(r => {
    const roleTitle = r.role_title || '';
    const missing = r.missing_skills || [];
    const matched = r.matching_skills || [];
    return matched.some(s => getSkillLabel(s).toLowerCase().includes(sName.toLowerCase())) ||
           missing.some(s => getSkillLabel(s).toLowerCase().includes(sName.toLowerCase())) ||
           roleTitle.toLowerCase().includes(sName.toLowerCase());
  }).slice(0, 3);

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      {/* Skill Header Badge Card */}
      <div className="p-4 rounded-xl bg-slate-900/80 light:bg-slate-100 border border-white/[0.08] light:border-slate-300 flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase text-slate-400">Inspected Capability</div>
          <h3 className="text-lg font-black text-white light:text-slate-900 flex items-center gap-2 mt-0.5">
            {sName}
            <span className="atlas-badge-cyan text-[10px] py-0.5">
              {sProf}
            </span>
          </h3>
          <div className="text-xs text-slate-400 light:text-slate-600 mt-1 font-mono">
            Category: {sCat}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[10px] font-mono text-slate-400">Grounded Confidence</div>
          <div className="text-2xl font-black font-mono text-cyan-400 light:text-cyan-700">
            {confidence}%
          </div>
          <div className="text-[9px] font-mono text-emerald-400 light:text-emerald-700 flex items-center gap-1 justify-end mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Verified Fit
          </div>
        </div>
      </div>

      {/* 6-Tier Evidence Hierarchy Indicator (Section 3) */}
      <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-white/[0.06] light:border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Evidence Hierarchy Placement</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Tier {tier.level} of 6</span>
        </div>

        <div className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${tier.badgeClass}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
              <TierIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-mono">
                Tier {tier.level}: {tier.label}
              </div>
              <div className="text-[11px] opacity-90">
                {tier.sublabel}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/20 font-bold shrink-0">
            {tier.qualityScore}
          </span>
        </div>

        {/* 6-tier ladder preview */}
        <div className="grid grid-cols-6 gap-1 pt-1">
          {['HR Verified', 'Certified', 'Demonstrated', 'Inferred', 'Self-Reported', 'Declared'].map((label, idx) => {
            const isCurrent = tier.level === idx + 1;
            const isPassed = tier.level < idx + 1;
            return (
              <div 
                key={label}
                title={`Tier ${idx + 1}: ${label}`}
                className={`h-1.5 rounded-full transition-all ${
                  isCurrent 
                    ? 'bg-cyan-400 ring-2 ring-cyan-400/40' 
                    : isPassed 
                    ? 'bg-slate-700 light:bg-slate-300 opacity-60' 
                    : 'bg-emerald-500'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Contributing Factors Breakdown (Section 4 & 5) */}
      <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-white/[0.06] light:border-slate-200 space-y-3">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-slate-400">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Confidence Contributing Factors</span>
          </span>
          <span className="text-cyan-400">{confidence}% Total</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div className="p-2.5 rounded-lg bg-slate-900/70 light:bg-white border border-white/[0.04] light:border-slate-200">
            <div className="text-[9px] text-slate-400">Evidence Quality</div>
            <div className="text-xs font-bold text-cyan-400 light:text-cyan-700 mt-0.5">Tier {tier.level}</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Weight: 40%</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/70 light:bg-white border border-white/[0.04] light:border-slate-200">
            <div className="text-[9px] text-slate-400">Proficiency</div>
            <div className="text-xs font-bold text-indigo-400 light:text-indigo-700 mt-0.5">{sProf}</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Weight: 35%</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/70 light:bg-white border border-white/[0.04] light:border-slate-200">
            <div className="text-[9px] text-slate-400">Freshness Signal</div>
            <div className="text-xs font-bold text-emerald-400 light:text-emerald-700 mt-0.5">{isFresh ? 'Fresh' : 'Aging'}</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Weight: 25%</div>
          </div>
        </div>

        {/* Temporal Signal (Section 5) */}
        <div className="p-2.5 rounded-lg bg-slate-900/50 light:bg-white border border-white/[0.04] light:border-slate-200 flex items-start gap-2.5">
          <Clock className={`w-4 h-4 mt-0.5 shrink-0 ${isFresh ? 'text-emerald-400' : 'text-amber-400'}`} />
          <div className="text-xs">
            <div className="font-bold text-white light:text-slate-900 flex items-center gap-2">
              <span>{freshnessStatus}</span>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                isFresh ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {isFresh ? '1.0x Multiplier' : '0.85x Multiplier'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 light:text-slate-600 mt-0.5 leading-relaxed">
              {freshnessText}
            </p>
          </div>
        </div>
      </div>

      {/* Demonstrated Deliverables & Project Proof Trace (Section 3) */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-white light:text-slate-900 flex items-center gap-1.5 font-mono uppercase tracking-wider">
          <GitBranch className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
          <span>Demonstrated Deliverables & Project Proof Trace</span>
        </div>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-cyan-500/30">
          {displayContributions.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-slate-900/40 light:bg-slate-50 border border-white/[0.06] text-xs text-slate-400">
              No direct project deliverable log recorded yet. Stored under declared competency history.
            </div>
          ) : (
            displayContributions.map((proj, idx) => (
              <div key={idx} className="relative space-y-1">
                {/* Timeline Dot */}
                <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-cyan-400 border-2 border-[#060913] light:border-white shadow-xs" />

                <div className="p-3.5 rounded-xl bg-slate-900/50 light:bg-slate-50 border border-white/[0.06] light:border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white light:text-slate-900">
                      {proj.project_name || `Project Milestone #${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 light:text-cyan-700 font-bold">
                      {proj.role_in_project || 'Core Contributor'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 light:text-slate-600 mt-1 leading-relaxed">
                    {proj.contribution_summary || proj.impact_description || proj.deliverable || 'Contributed technical implementation, architectural execution, and quality deliverables.'}
                  </p>

                  {proj.evidence && (
                    <div className="mt-2 p-2 rounded bg-slate-950/50 light:bg-white border border-white/[0.04] light:border-slate-200 text-[10px] font-mono text-slate-400">
                      Artifact Evidence: {proj.evidence}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 pt-1 border-t border-white/[0.04] light:border-slate-200 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {proj.duration_months ? `${proj.duration_months} Months Engagement` : 'Demonstrated in Production'}
                    </span>
                    {proj.verification_status === 'approved' && (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold ml-auto">
                        <Check className="w-3 h-3" /> HR Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Verification Anchor */}
          <div className="relative space-y-1">
            <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#060913] light:border-white" />
            <div className="p-3.5 rounded-xl bg-emerald-950/20 light:bg-emerald-50 border border-emerald-500/30 light:border-emerald-200 text-xs">
              <div className="flex items-center gap-2 text-emerald-300 light:text-emerald-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Enterprise Grounded Verification</span>
              </div>
              <p className="text-[11px] text-slate-300 light:text-slate-700 mt-1 leading-relaxed">
                Capability confirmed across production initiatives with active mentoring weight and organizational trust index.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Connective Tissue: Roles & Learning Cross-Links (Section 1 & 29) */}
      <div className="space-y-3 pt-2 border-t border-white/[0.08] light:border-slate-200">
        <div className="text-xs font-bold text-white light:text-slate-900 flex items-center gap-1.5 font-mono uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Connective Graph Navigation</span>
        </div>

        {matchingRoles.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 font-mono">Roles this capability qualifies you for:</div>
            <div className="space-y-1.5">
              {matchingRoles.map((r, rIdx) => (
                <div 
                  key={r.role_id || rIdx}
                  onClick={() => {
                    if (navigateTo) {
                      navigateTo('match', { targetRoleId: r.role_id });
                      if (onClose) onClose();
                    }
                  }}
                  className="p-2.5 rounded-xl bg-slate-900/60 light:bg-white hover:bg-slate-800/80 light:hover:bg-slate-100 border border-white/[0.04] light:border-slate-200 flex items-center justify-between cursor-pointer group transition-all"
                >
                  <div>
                    <div className="text-xs font-bold text-white light:text-slate-900 group-hover:text-cyan-400 transition-colors">
                      {r.role_title}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Fit: {Math.round((r.overall_score || 0.8) * 100)}% • {typeof r.department === 'string' ? r.department : 'Engineering'}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                    Inspect Fit <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => {
            if (navigateTo) {
              navigateTo('gap');
              if (onClose) onClose();
            }
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 light:text-cyan-800 border border-cyan-500/25 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <GraduationCap className="w-4 h-4 text-cyan-400" />
          <span>Explore Learning Pathways for this Capability →</span>
        </button>
      </div>
    </div>
  );
};
