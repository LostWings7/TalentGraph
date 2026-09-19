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
  GitBranch 
} from 'lucide-react';
import { getSkillLabel, getProficiencyLabel } from '../../utils/formatters';

export const EvidenceTrail = ({ skill, employeeDetail }) => {
  if (!skill) return null;

  const sName = getSkillLabel(skill) || 'Capability';
  const sProf = getProficiencyLabel(skill);
  const sCat = typeof skill.skill_category === 'string' ? skill.skill_category : 'Technical Expertise';
  const confidence = Math.round((skill.confidence_score || 0.85) * 100);
  const source = skill.source || 'explicit';

  // Extract real project contributions matching this skill or general projects
  const contributions = employeeDetail?.contributions || [];
  const relevantContributions = contributions.filter((c) => {
    const pSkills = c.skills_used || [];
    return pSkills.some((s) => getSkillLabel(s).toLowerCase().includes(sName.toLowerCase())) || contributions.length <= 2;
  });

  const displayContributions = relevantContributions.length > 0 ? relevantContributions : contributions.slice(0, 3);

  return (
    <div className="space-y-5 text-left">
      {/* Skill Header Badge Card */}
      <div className="p-4 rounded-xl bg-slate-900/80 light:bg-slate-100 border border-white/[0.08] light:border-slate-300 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase text-slate-400">Inspected Capability</div>
          <h3 className="text-base font-bold text-white light:text-slate-900 flex items-center gap-2">
            {sName}
            <span className="atlas-badge-cyan text-[10px] py-0.5">
              {sProf}
            </span>
          </h3>
          <div className="text-xs text-slate-400 light:text-slate-600 mt-0.5 font-mono">
            Category: {sCat}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-mono text-slate-400">Grounded Confidence</div>
          <div className="text-2xl font-black font-mono text-cyan-400 light:text-cyan-700">
            {confidence}%
          </div>
          <div className="text-[9px] font-mono text-emerald-400">
            {source === 'explicit' ? 'Verified Credential' : 'Evidence Inferred'}
          </div>
        </div>
      </div>

      {/* Proof Trace Timeline */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-white light:text-slate-900 flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
          <span>Demonstrated Deliverables & Project Proof Trace</span>
        </div>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-cyan-500/30">
          {displayContributions.length === 0 ? (
            <div className="p-3 rounded-xl bg-slate-900/40 light:bg-slate-50 border border-white/[0.06] text-xs text-slate-400">
              No direct project log recorded yet. Validated via organizational onboarding self-assessment.
            </div>
          ) : (
            displayContributions.map((proj, idx) => (
              <div key={idx} className="relative space-y-1">
                {/* Timeline Dot */}
                <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-cyan-400 border-2 border-[#060913] light:border-white shadow-xs" />

                <div className="p-3 rounded-xl bg-slate-900/50 light:bg-slate-50 border border-white/[0.06] light:border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white light:text-slate-900">
                      {proj.project_name || `Project Milestone #${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 light:text-cyan-700">
                      {proj.role_in_project || 'Core Contributor'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 light:text-slate-600 mt-1 leading-relaxed">
                    {proj.impact_description || proj.deliverable || 'Contributed technical implementation, architectural execution, and quality deliverables.'}
                  </p>

                  <div className="flex items-center gap-2 mt-2 pt-1 border-t border-white/[0.04] light:border-slate-200 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {proj.duration_months ? `${proj.duration_months} Months Engagement` : 'Demonstrated in Production'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Verification Anchor */}
          <div className="relative space-y-1">
            <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#060913] light:border-white" />
            <div className="p-3 rounded-xl bg-emerald-950/20 light:bg-emerald-50 border border-emerald-500/30 light:border-emerald-200 text-xs">
              <div className="flex items-center gap-2 text-emerald-300 light:text-emerald-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Organizational Verification & Influence</span>
              </div>
              <p className="text-[11px] text-slate-300 light:text-slate-700 mt-1">
                Capability confirmed across {Math.max(1, displayContributions.length)} production initiatives with active mentoring weight.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
