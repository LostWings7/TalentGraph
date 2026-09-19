import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Flame, 
  ChevronRight,
  Search
} from 'lucide-react';
import { useTalent } from '../context/TalentContext';
import { TalentAPI } from '../api/client';
import { MetricGauge } from '../components/common/MetricGauge';
import { BreadcrumbNav } from '../components/common/BreadcrumbNav';
import { getSkillLabel, getSkillId } from '../utils/formatters';

export const HRIntelligenceView = () => {
  const { 
    navigateTo, 
    switchEmployee, 
    setSelectedTargetRoleId,
    showToast 
  } = useTalent();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gapSearch, setGapSearch] = useState('');
  
  const [selectedRiskFilter, setSelectedRiskFilter] = useState(() => {
    return sessionStorage.getItem('tg_hr_risk_filter') || 'all';
  });

  useEffect(() => {
    sessionStorage.setItem('tg_hr_risk_filter', selectedRiskFilter);
  }, [selectedRiskFilter]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await TalentAPI.getHRIntelligence();
        setAnalytics(res.data);
      } catch (err) {
        console.error('Error fetching HR intelligence data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        <span className="font-mono text-xs text-slate-400">Loading Executive Workforce Intelligence...</span>
      </div>
    );
  }

  const summary = analytics.summary || {};
  const gaps = analytics.emerging_skill_gaps || [];
  const bench = analytics.role_bench_readiness || [];

  const filteredGaps = gaps.filter((g) => {
    const sName = getSkillLabel(g).toLowerCase();
    const cat = (typeof g.category === 'string' ? g.category : '').toLowerCase();
    const matches = sName.includes(gapSearch.toLowerCase()) || cat.includes(gapSearch.toLowerCase());
    if (!matches) return false;
    if (selectedRiskFilter !== 'all' && g.risk_level?.toLowerCase() !== selectedRiskFilter.toLowerCase()) return false;
    return true;
  });

  const handleInspectCandidate = (employeeId, employeeName, roleId) => {
    switchEmployee(employeeId);
    if (roleId) setSelectedTargetRoleId(roleId);
    showToast(`Switched persona to ${employeeName} to inspect succession capability match.`, 'info');
    navigateTo('match');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav 
        items={[{ label: 'HR Executive Workforce Topology & Analytics', tab: 'hr' }]} 
        onBack={() => navigateTo('dashboard')}
      />

      {/* Executive Header Banner */}
      <div className="atlas-surface-elevated p-6 rounded-2xl border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 light:bg-emerald-100 text-emerald-300 light:text-emerald-800 text-xs font-mono">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
              <span>Executive Workforce Topology</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white light:text-slate-900 tracking-tight">
              Workforce Capability & Succession Intelligence
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600">
              Macro diagnostic view of organization-wide talent density, emerging skill deficits, succession bench readiness, and internal mobility velocity.
            </p>
          </div>

          {/* Org Health Gauge */}
          <div className="p-4 rounded-xl bg-slate-950/70 light:bg-slate-50 border border-white/[0.08] light:border-slate-300 flex items-center gap-5 shrink-0">
            <MetricGauge 
              score={summary.average_role_readiness || 0.76} 
              size={72} 
              strokeWidth={7} 
              color="#10b981"
            />
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Workforce Readiness Index
              </div>
              <div className="text-xl font-black font-mono text-emerald-300 light:text-emerald-800">
                {Math.round((summary.average_role_readiness || 0.76) * 100)}% Average
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {summary.total_employees || 30} Employees • {summary.total_roles || 18} Roles
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-KPI Executive Stat Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="atlas-surface p-4 border-l-4 border-l-cyan-500">
          <div className="text-[10px] font-mono uppercase text-slate-400">Total Workforce</div>
          <div className="text-2xl font-black font-mono text-white light:text-slate-900 mt-1">
            {summary.total_employees || 30}
          </div>
          <div className="text-[10px] text-cyan-400 mt-0.5">5 Departments</div>
        </div>

        <div className="atlas-surface p-4 border-l-4 border-l-emerald-500">
          <div className="text-[10px] font-mono uppercase text-slate-400">Tracked Skills</div>
          <div className="text-2xl font-black font-mono text-emerald-400 light:text-emerald-700 mt-1">
            {summary.total_skills_tracked || 45}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Evidence Grounded</div>
        </div>

        <div className="atlas-surface p-4 border-l-4 border-l-coral-500">
          <div className="text-[10px] font-mono uppercase text-slate-400">Critical Skill Deficits</div>
          <div className="text-2xl font-black font-mono text-coral-400 light:text-coral-700 mt-1">
            {gaps.filter((g) => g.risk_level === 'Critical').length}
          </div>
          <div className="text-[10px] text-coral-400 mt-0.5">Immediate Risk</div>
        </div>

        <div className="atlas-surface p-4 border-l-4 border-l-indigo-500">
          <div className="text-[10px] font-mono uppercase text-slate-400">Avg Bench Depth</div>
          <div className="text-2xl font-black font-mono text-indigo-400 light:text-indigo-700 mt-1">
            {bench.length > 0 ? (bench.reduce((acc, b) => acc + (b.ready_candidates?.length || 0), 0) / bench.length).toFixed(1) : '2.4'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Candidates per Role</div>
        </div>
      </div>

      {/* Emerging Skill Shortages & Scarcity Table */}
      <div className="atlas-surface p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08] light:border-slate-200">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-coral-400" />
            <h3 className="text-xs font-bold text-white light:text-slate-900 uppercase font-mono">
              Emerging Skill Scarcity & Deficit Heatmap
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={gapSearch}
                onChange={(e) => setGapSearch(e.target.value)}
                placeholder="Filter shortages..."
                className="w-full pl-8 pr-3 py-1 rounded-lg bg-slate-900 light:bg-white border border-white/[0.08] light:border-slate-300 text-xs text-white light:text-slate-900 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1 text-[11px] font-mono">
              {['all', 'critical', 'high', 'moderate'].map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRiskFilter(r)}
                  className={`px-2 py-1 rounded-md capitalize transition-all ${
                    selectedRiskFilter === r
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:bg-white/[0.05]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-white/[0.06] light:divide-slate-200 rounded-xl bg-slate-950/40 light:bg-slate-50 border border-white/[0.06] light:border-slate-200 overflow-hidden">
          <div className="p-3 bg-slate-950/80 light:bg-slate-100 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>SCARCE SKILL & CATEGORY</span>
            <span>AFFECTED ROLES • RISK LEVEL</span>
          </div>

          {filteredGaps.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No scarcity items found.
            </div>
          ) : (
            filteredGaps.map((gap, idx) => {
              const riskBadge = gap.risk_level === 'Critical' 
                ? 'atlas-badge-coral' 
                : gap.risk_level === 'High' 
                ? 'atlas-badge-amber' 
                : 'atlas-badge-cyan';

              return (
                <div
                  key={getSkillId(gap, idx)}
                  className="p-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white light:text-slate-900">
                        {getSkillLabel(gap)}
                      </span>
                      <span className={`${riskBadge} text-[9px]`}>
                        {gap.risk_level} Risk
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Category: {typeof gap.category === 'string' ? gap.category : 'Technical'} • Market Scarcity Index: {gap.scarcity_score ? `${Math.round(gap.scarcity_score * 100)}%` : '85%'}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-300 light:text-slate-700">
                      {gap.affected_roles_count || 3} Roles Affected
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Role Bench Readiness & Succession Pipelines */}
      <div className="atlas-surface p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] light:border-slate-200">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white light:text-slate-900 uppercase font-mono">
              Succession Bench Pipeline & Ready Candidates
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Click candidate to inspect readiness match
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bench.map((roleBench, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-white/[0.06] light:border-slate-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white light:text-slate-900">
                    {roleBench.role_title}
                  </h4>
                  <div className="text-[10px] font-mono text-slate-400">
                    {typeof roleBench.department === 'string' ? roleBench.department : (roleBench.department?.name || roleBench.department?.id || '')} • Bench Depth: {roleBench.ready_candidates?.length || 0}
                  </div>
                </div>
                <span className="atlas-badge-emerald text-[9px]">
                  Pipeline Active
                </span>
              </div>

              {/* Ready Candidates List */}
              <div className="space-y-1.5 pt-1">
                {(roleBench.ready_candidates || []).slice(0, 3).map((cand, cIdx) => {
                  const candName = typeof cand.name === 'string' ? cand.name : (cand.name?.name || 'Candidate');
                  const initials = candName.split(' ').map((n) => n[0]).join('') || 'C';

                  return (
                    <div
                      key={cIdx}
                      onClick={() => handleInspectCandidate(cand.employee_id, candName, roleBench.role_id)}
                      className="p-2.5 rounded-lg bg-slate-900/80 light:bg-white hover:bg-slate-800 light:hover:bg-slate-100 border border-white/[0.04] light:border-slate-300 flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                          {initials}
                        </div>
                        <span className="text-xs font-semibold text-slate-200 light:text-slate-800 group-hover:text-cyan-400 transition-colors truncate">
                          {candName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono font-bold text-emerald-400 light:text-emerald-700">
                          {Math.round((cand.readiness_score || 0.8) * 100)}% Fit
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
