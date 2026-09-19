import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Search, 
  Flame, 
  ChevronRight, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import { useTalent } from '../context/TalentContext';
import { TalentAPI } from '../api/client';
import { MetricGauge } from '../components/common/MetricGauge';
import { BreadcrumbNav } from '../components/common/BreadcrumbNav';
import { NextStepBanner } from '../components/actions/NextStepBanner';

export const RoleExplorerView = () => {
  const { 
    setSelectedTargetRoleId, 
    activeRoleMatches,
    navigateTo 
  } = useTalent();

  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Persistent filters from sessionStorage
  const [selectedDept, setSelectedDept] = useState(() => {
    return sessionStorage.getItem('tg_role_dept') || 'all';
  });
  const [selectedDemand, setSelectedDemand] = useState(() => {
    return sessionStorage.getItem('tg_role_demand') || 'all';
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem('tg_role_search') || '';
  });
  const [sortBy, setSortBy] = useState(() => {
    return sessionStorage.getItem('tg_role_sort') || 'fit';
  });

  useEffect(() => {
    sessionStorage.setItem('tg_role_dept', selectedDept);
  }, [selectedDept]);

  useEffect(() => {
    sessionStorage.setItem('tg_role_demand', selectedDemand);
  }, [selectedDemand]);

  useEffect(() => {
    sessionStorage.setItem('tg_role_search', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem('tg_role_sort', sortBy);
  }, [sortBy]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const [rolesRes, deptsRes] = await Promise.all([
          TalentAPI.getRoles(),
          TalentAPI.getRoleDepartments()
        ]);
        setRoles(rolesRes.data.results || rolesRes.data || []);
        // Normalize: backend may return [{id, name}] objects OR plain strings
        const rawDepts = deptsRes.data || [];
        const normalizedDepts = rawDepts.map((d) => {
          if (typeof d === 'string') return d;
          if (d && typeof d === 'object') return d.name || d.id || '';
          return String(d);
        }).filter(Boolean);
        setDepartments(normalizedDepts);
      } catch (err) {
        console.error('Failed to load roles catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const getRoleMatch = (roleId) => {
    return activeRoleMatches.find((m) => m.role_id === roleId);
  };

  const handleSelectRole = (role) => {
    setSelectedTargetRoleId(role.id);
    navigateTo('match', {
      targetRoleId: role.id,
      recentItem: {
        id: `role-${role.id}`,
        title: role.title,
        subtitle: 'Role Match Breakdown',
        tab: 'match',
        roleId: role.id
      }
    });
  };

  // Safely extract department string from a role (guard against {id, name} objects)
  const getRoleDeptStr = (role) => {
    if (!role.department) return '';
    if (typeof role.department === 'string') return role.department;
    if (typeof role.department === 'object') return role.department.name || role.department.id || '';
    return String(role.department);
  };

  const filteredRoles = roles.filter((r) => {
    const deptStr = getRoleDeptStr(r);
    const titleStr = typeof r.title === 'string' ? r.title : '';
    const descStr = typeof r.description === 'string' ? r.description : '';
    const q = searchQuery.toLowerCase();
    const matchesSearch = titleStr.toLowerCase().includes(q) ||
                          descStr.toLowerCase().includes(q) ||
                          deptStr.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (selectedDept !== 'all' && deptStr !== selectedDept) return false;
    if (selectedDemand !== 'all' && r.future_demand_level !== selectedDemand) return false;
    return true;
  });

  // Sort
  filteredRoles.sort((a, b) => {
    const matchA = getRoleMatch(a.id)?.overall_score || 0;
    const matchB = getRoleMatch(b.id)?.overall_score || 0;

    if (sortBy === 'fit') return matchB - matchA;
    if (sortBy === 'demand') {
      const weight = { 'Critical': 3, 'High': 2, 'Moderate': 1 };
      return (weight[b.future_demand_level] || 0) - (weight[a.future_demand_level] || 0);
    }
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav 
        items={[{ label: 'Role Marketplace & Opportunity Horizon', tab: 'roles' }]} 
        onBack={() => navigateTo('dashboard')}
      />

      {/* Header Banner */}
      <div className="atlas-surface-elevated p-6 rounded-2xl border border-white/[0.1] light:border-slate-300 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 text-xs font-mono">
          <Compass className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
          <span>Internal Career Mobility & Opportunity Horizon</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white light:text-slate-900 tracking-tight">
          Enterprise Opportunity Marketplace
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600 max-w-2xl">
          Discover open and emerging organizational roles evaluated against your capability portfolio using our transparent 4-factor hybrid scoring model.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="atlas-surface p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles by title, keyword, department..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 light:bg-white border border-white/[0.08] light:border-slate-300 text-xs text-white light:text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none text-[11px] font-mono">
            {['all', ...departments].map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap capitalize transition-all ${
                  selectedDept === dept
                    ? 'bg-cyan-500/20 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 light:text-slate-600 hover:bg-white/[0.05] light:hover:bg-slate-200'
                }`}
              >
                {dept === 'all' ? 'All Departments' : dept}
              </button>
            ))}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 light:bg-white border border-white/[0.08] light:border-slate-300 text-[11px] font-mono text-slate-300 light:text-slate-700 focus:outline-hidden"
            >
              <option value="fit">Sort: Highest Match</option>
              <option value="demand">Sort: High Demand</option>
              <option value="name">Sort: Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Role Horizon List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto mb-2" />
            Evaluating opportunity catalog...
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 atlas-surface">
            No internal opportunities found matching your filters.
          </div>
        ) : (
          filteredRoles.map((role) => {
            const match = getRoleMatch(role.id);
            const score = match ? match.overall_score : 0.65;
            const alignmentsCount = match?.matching_skills_count || (role.required_skills ? Math.round(role.required_skills.length * 0.7) : 3);
            const gapsCount = match?.missing_skills_count || (role.required_skills ? Math.max(1, role.required_skills.length - alignmentsCount) : 2);
            const deptLabel = getRoleDeptStr(role);

            return (
              <div
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className="atlas-surface-interactive p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Left: Role Info & Alignment Tags */}
                <div className="space-y-2 min-w-0 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white light:text-slate-900 group-hover:text-cyan-400 light:group-hover:text-cyan-700 transition-colors">
                      {role.title}
                    </h3>
                    <span className="atlas-badge-cyan text-[10px]">
                      {deptLabel}
                    </span>
                    {role.future_demand_level === 'Critical' && (
                      <span className="atlas-badge-coral text-[10px] flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Critical Demand
                      </span>
                    )}
                    {role.future_demand_level === 'High' && (
                      <span className="atlas-badge-amber text-[10px]">
                        High Demand
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 light:text-slate-600 line-clamp-2 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] font-mono pt-1">
                    <span className="text-emerald-400 light:text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {alignmentsCount} Strong Alignments
                    </span>
                    <span className="text-coral-400 light:text-coral-700 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {gapsCount} Growth Areas
                    </span>
                    <span className="text-slate-400 hidden sm:inline">
                      Experience Target: {role.min_experience_years}+ Years
                    </span>
                  </div>
                </div>

                {/* Right: Readiness Match Gauge & Action */}
                <div className="flex items-center gap-5 shrink-0 self-end md:self-center">
                  <div className="flex items-center gap-3">
                    <MetricGauge 
                      score={score} 
                      size={54} 
                      strokeWidth={5} 
                    />
                    <div className="text-right">
                      <div className="text-xs font-black font-mono text-white light:text-slate-900">
                        {Math.round(score * 100)}% Fit
                      </div>
                      <div className="text-[9px] font-mono text-slate-400">
                        Hybrid Match
                      </div>
                    </div>
                  </div>

                  <button className="atlas-btn-primary py-2 px-3 text-xs flex items-center gap-1">
                    <span>Inspect Match</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Next Step */}
      <NextStepBanner
        title="Simulate Capability Acquisition for Your Top Match"
        description="Open any role to run the live What-If simulator and see projected readiness score increases."
        actionLabel="Open Top Match Breakdown"
        targetTab="match"
      />
    </div>
  );
};
