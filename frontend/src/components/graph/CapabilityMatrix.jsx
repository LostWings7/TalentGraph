import React from 'react';
import { Award, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Zap, Layers } from 'lucide-react';
import { getSkillLabel, getSkillId, getProficiencyLabel } from '../../utils/formatters';

export const CapabilityMatrix = ({ skills = [], onSelectSkill }) => {
  const verified = skills.filter((s) => s.source === 'explicit' || s.source === 'learning');
  const inferred = skills.filter((s) => s.source === 'project_inferred');
  const discovered = skills.filter((s) => s.source === 'ai_discovered');

  const groups = [
    { title: 'Verified Core Competencies', count: verified.length, items: verified, color: 'text-emerald-400', badgeClass: 'atlas-badge-emerald' },
    { title: 'Project-Inferred Capabilities', count: inferred.length, items: inferred, color: 'text-cyan-400', badgeClass: 'atlas-badge-cyan' },
    { title: 'AI-Discovered Transferable Strengths', count: discovered.length, items: discovered, color: 'text-indigo-400', badgeClass: 'atlas-badge-indigo' },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="atlas-surface p-5 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] light:border-slate-200">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-cyan-400 light:text-cyan-600" />
          <h3 className="text-xs font-bold text-white light:text-slate-900 font-mono uppercase tracking-wider">
            Capability Evidence Matrix
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {skills.length} Total Capabilities Evaluated
        </span>
      </div>

      <div className="space-y-5">
        {groups.map((grp, gIdx) => (
          <div key={gIdx} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-xs font-bold text-slate-200 light:text-slate-800">
                  {grp.title}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {grp.count} Skills
              </span>
            </div>

            {/* Dense Editorial List instead of cards */}
            <div className="divide-y divide-white/[0.06] light:divide-slate-200 rounded-xl bg-slate-950/40 light:bg-slate-50 border border-white/[0.06] light:border-slate-200 overflow-hidden">
              {grp.items.map((skill, sIdx) => {
                const confPct = Math.round((skill.confidence_score || 0.85) * 100);
                const sLabel = getSkillLabel(skill);
                const sProf = getProficiencyLabel(skill);
                const sCat = typeof skill.skill_category === 'string' ? skill.skill_category : 'Technical';

                return (
                  <div
                    key={getSkillId(skill, sIdx)}
                    onClick={() => onSelectSkill && onSelectSkill(skill)}
                    className="p-3 flex items-center justify-between hover:bg-white/[0.04] light:hover:bg-slate-100 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 light:bg-white border border-white/[0.08] light:border-slate-300 flex items-center justify-center font-mono text-[11px] font-bold text-cyan-400 light:text-cyan-700 shrink-0">
                        {sProf.charAt(0) || 'I'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white light:text-slate-900 group-hover:text-cyan-400 light:group-hover:text-cyan-700 transition-colors truncate">
                          {sLabel}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 light:text-slate-500 truncate flex items-center gap-2">
                          <span>{sCat}</span>
                          <span>•</span>
                          <span>{sProf}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 ml-3">
                      <div className="text-right hidden sm:block">
                        <div className="text-[9px] font-mono text-slate-400">Grounded Confidence</div>
                        <div className="text-xs font-bold font-mono text-cyan-400 light:text-cyan-700">
                          {confPct}%
                        </div>
                      </div>
                      <span className={`${grp.badgeClass} text-[10px]`}>
                        Inspect Evidence →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
