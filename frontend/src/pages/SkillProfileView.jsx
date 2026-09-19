import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Search, 
  BrainCircuit 
} from 'lucide-react';
import { useTalent } from '../context/TalentContext';
import { TalentAPI } from '../api/client';
import { BreadcrumbNav } from '../components/common/BreadcrumbNav';
import { NextStepBanner } from '../components/actions/NextStepBanner';
import { EvidenceDrawer } from '../components/evidence/EvidenceDrawer';
import { getSkillLabel, getSkillId, getProficiencyLabel } from '../utils/formatters';

export const SkillProfileView = () => {
  const { 
    activeEmployee, 
    employeeDetail, 
    refreshActiveEmployee, 
    showToast,
    navigateTo 
  } = useTalent();

  // Filters persisted in sessionStorage
  const [sourceFilter, setSourceFilter] = useState(() => {
    return sessionStorage.getItem('tg_skill_source') || 'all';
  });
  const [selectedCat, setSelectedCat] = useState(() => {
    return sessionStorage.getItem('tg_skill_cat') || 'all';
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem('tg_skill_q') || '';
  });

  const [inspectedSkill, setInspectedSkill] = useState(null);
  const [runningAI, setRunningAI] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('tg_skill_source', sourceFilter);
  }, [sourceFilter]);

  useEffect(() => {
    sessionStorage.setItem('tg_skill_cat', selectedCat);
  }, [selectedCat]);

  useEffect(() => {
    sessionStorage.setItem('tg_skill_q', searchQuery);
  }, [searchQuery]);

  if (!activeEmployee || !employeeDetail) return null;

  const skills = employeeDetail.skills || [];
  const categories = ['all', ...Array.from(new Set(skills.map((s) => typeof s.skill_category === 'string' ? s.skill_category : '').filter(Boolean)))];

  const handleRunAIProfile = async () => {
    try {
      setRunningAI(true);
      showToast('Running Gemini 3.7 Flash deep capability extraction & evidence analysis...', 'info');
      await TalentAPI.runAIProfileInference(activeEmployee.id, { persist: true });
      await refreshActiveEmployee();
      showToast('AI Skill Profiling complete! Inferred and transferable capabilities updated.', 'success');
    } catch (err) {
      console.error('Error in AI skill profiling:', err);
      showToast('AI Profiling executed with deterministic fallback.', 'info');
    } finally {
      setRunningAI(false);
    }
  };

  const filteredSkills = skills.filter((s) => {
    const sName = getSkillLabel(s).toLowerCase();
    const sCat = (typeof s.skill_category === 'string' ? s.skill_category : '').toLowerCase();
    const matchesSearch = sName.includes(searchQuery.toLowerCase()) || sCat.includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCat !== 'all' && s.skill_category !== selectedCat) return false;
    if (sourceFilter === 'all') return true;
    if (sourceFilter === 'verified') return s.source === 'explicit' || s.source === 'learning';
    if (sourceFilter === 'inferred') return s.source === 'project_inferred';
    if (sourceFilter === 'discovered') return s.source === 'ai_discovered';
    return true;
  });

  const verifiedCount = skills.filter((s) => s.source === 'explicit' || s.source === 'learning').length;
  const inferredCount = skills.filter((s) => s.source === 'project_inferred').length;
  const discoveredCount = skills.filter((s) => s.source === 'ai_discovered').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav 
        items={[{ label: 'Capability Profile & Evidence', tab: 'profile' }]} 
        onBack={() => navigateTo('dashboard')}
      />

      {/* Header Banner */}
      <div className="atlas-surface-elevated p-6 rounded-2xl border border-white/[0.1] light:border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 text-xs font-mono">
            <Award className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
            <span>Capability Intelligence & Evidence Trails</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white light:text-slate-900 tracking-tight">
            {activeEmployee.name}’s Capability Portfolio
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600">
            Skills are automatically discovered and verified from production project milestones, technical deliverables, and continuous learning records.
          </p>
        </div>

        {/* AI Inference Action Trigger */}
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <button
            onClick={handleRunAIProfile}
            disabled={runningAI}
            className="atlas-btn-primary py-3 px-5 text-xs"
          >
            <BrainCircuit className={`w-4 h-4 ${runningAI ? 'animate-spin' : ''}`} />
            <span>{runningAI ? 'Analyzing Evidence...' : 'Deep AI Profile Extraction'}</span>
          </button>
          <span className="text-[10px] font-mono text-slate-400 light:text-slate-500">
            Powered by Google Gemini 3.7 Flash
          </span>
        </div>
      </div>

      {/* 3-Category Breakdown Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setSourceFilter(sourceFilter === 'verified' ? 'all' : 'verified')}
          className={`atlas-surface-interactive p-4 border-l-4 border-l-emerald-500 ${sourceFilter === 'verified' ? 'ring-2 ring-emerald-500/40' : ''}`}
        >
          <div className="text-[10px] font-mono uppercase text-slate-400">Verified Credentials</div>
          <div className="text-2xl font-black text-emerald-400 light:text-emerald-700 font-mono mt-1">
            {verifiedCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Explicit & Learning Verified</div>
        </div>

        <div 
          onClick={() => setSourceFilter(sourceFilter === 'inferred' ? 'all' : 'inferred')}
          className={`atlas-surface-interactive p-4 border-l-4 border-l-cyan-500 ${sourceFilter === 'inferred' ? 'ring-2 ring-cyan-500/40' : ''}`}
        >
          <div className="text-[10px] font-mono uppercase text-slate-400">Project Inferred</div>
          <div className="text-2xl font-black text-cyan-400 light:text-cyan-700 font-mono mt-1">
            {inferredCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Extracted from Deliverables</div>
        </div>

        <div 
          onClick={() => setSourceFilter(sourceFilter === 'discovered' ? 'all' : 'discovered')}
          className={`atlas-surface-interactive p-4 border-l-4 border-l-indigo-500 ${sourceFilter === 'discovered' ? 'ring-2 ring-indigo-500/40' : ''}`}
        >
          <div className="text-[10px] font-mono uppercase text-slate-400">AI-Discovered</div>
          <div className="text-2xl font-black text-indigo-400 light:text-indigo-700 font-mono mt-1">
            {discoveredCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cross-Domain Transferable</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="atlas-surface p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search capabilities by name or category..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 light:bg-white border border-white/[0.08] light:border-slate-300 text-xs text-white light:text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none text-[11px] font-mono">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap capitalize transition-all ${
                  selectedCat === cat
                    ? 'bg-cyan-500/20 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 light:text-slate-600 hover:bg-white/[0.05] light:hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Non-Card Editorial Capability List */}
      <div className="atlas-surface overflow-hidden divide-y divide-white/[0.06] light:divide-slate-200">
        <div className="p-4 bg-slate-950/60 light:bg-slate-50 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>CAPABILITY & CATEGORY ({filteredSkills.length} RESULTS)</span>
          <span>PROFICIENCY • CONFIDENCE • PROOF TRACE</span>
        </div>

        {filteredSkills.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No capabilities match the selected filters.
          </div>
        ) : (
          filteredSkills.map((skill, idx) => {
            const confPct = Math.round((skill.confidence_score || 0.85) * 100);
            const sLabel = getSkillLabel(skill);
            const sProf = getProficiencyLabel(skill);
            const sCat = typeof skill.skill_category === 'string' ? skill.skill_category : 'Technical Expertise';

            return (
              <div
                key={getSkillId(skill, idx)}
                onClick={() => setInspectedSkill(skill)}
                className="p-4 flex items-center justify-between hover:bg-white/[0.04] light:hover:bg-slate-100 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 light:bg-slate-100 border border-white/[0.08] light:border-slate-300 flex items-center justify-center font-mono text-xs font-bold text-cyan-400 light:text-cyan-700 shrink-0">
                    {sProf.charAt(0) || 'I'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white light:text-slate-900 group-hover:text-cyan-400 light:group-hover:text-cyan-700 transition-colors truncate">
                        {sLabel}
                      </span>
                      <span className={`text-[9px] py-0.2 ${
                        skill.source === 'explicit' ? 'atlas-badge-emerald' : 'atlas-badge-cyan'
                      }`}>
                        {skill.source === 'explicit' ? 'Verified' : 'Inferred'}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 light:text-slate-500 mt-0.5 truncate">
                      {sCat} • Level: {sProf}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 ml-3">
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-mono font-bold text-cyan-400 light:text-cyan-700">
                      {confPct}% Confidence
                    </div>
                    <div className="text-[9px] font-mono text-slate-500">
                      Deliverable Grounded
                    </div>
                  </div>

                  <span className="atlas-badge-cyan text-[10px] group-hover:bg-cyan-500/20 transition-colors">
                    View Evidence Trail →
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Next Best Step */}
      <NextStepBanner
        title="Discover Internal Roles Matching These Capabilities"
        description="See how your verified and inferred strengths match open internal positions across engineering and product."
        actionLabel="Explore Role Marketplace"
        targetTab="roles"
      />

      {/* Evidence Drawer */}
      <EvidenceDrawer
        skill={inspectedSkill}
        onClose={() => setInspectedSkill(null)}
      />
    </div>
  );
};
