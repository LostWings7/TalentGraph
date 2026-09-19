import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  MapPin, 
  Layers, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Edit,
  Save
} from 'lucide-react';
import { TalentAPI } from '../api/client';
import { useTalent } from '../context/TalentContext';

export const EnterpriseProfileView = () => {
  const { currentEnterprise, showToast } = useTalent();
  const [profileData, setProfileData] = useState(null);
  const [capabilityData, setCapabilityData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEnterpriseData = async () => {
    try {
      setLoading(true);
      const [profRes, capRes] = await Promise.all([
        TalentAPI.getEnterpriseProfile().catch(() => ({ data: currentEnterprise })),
        TalentAPI.getCapabilityMap().catch(() => ({ data: null }))
      ]);
      setProfileData(profRes.data);
      setCapabilityData(capRes.data);
    } catch (err) {
      console.error('Failed to load enterprise data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnterpriseData();
  }, []);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="atlas-surface-elevated p-6 border-l-4 border-l-emerald-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
              Enterprise Identity & Capability Map
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white light:text-slate-900 tracking-tight">
            {profileData?.name || currentEnterprise?.name || 'NovaTech Solutions'}
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-600 max-w-2xl mt-1">
            Comprehensive organizational skill architecture, verified talent density across departments, and capability risk assessment.
          </p>
        </div>

        <button
          onClick={fetchEnterpriseData}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Map</span>
        </button>
      </div>

      {/* Enterprise Metadata Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="atlas-surface-elevated p-4 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Industry Sector</div>
          <div className="text-sm font-bold text-white">
            {profileData?.industry || 'Enterprise Software & Cloud AI'}
          </div>
        </div>
        <div className="atlas-surface-elevated p-4 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Total Headcount</div>
          <div className="text-sm font-bold text-cyan-400">
            {capabilityData?.total_employees || 30} Seeded Employees
          </div>
        </div>
        <div className="atlas-surface-elevated p-4 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Departments</div>
          <div className="text-sm font-bold text-emerald-400">
            {(profileData?.departments || ['Engineering', 'AI Research', 'Cloud Architecture']).length} Active Org Units
          </div>
        </div>
      </div>

      {/* Organizational Capability Map by Categories */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white light:text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          Hierarchical Skill Capability Matrix & Talent Pools
        </h2>

        {capabilityData?.capability_groups ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(capabilityData.capability_groups).map(([catCode, group]) => (
              <div key={catCode} className="atlas-surface-elevated p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {group.category_name || catCode}
                    </h3>
                    <div className="text-[10px] font-mono text-slate-400">
                      {group.skills_count} skill domain(s)
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-mono">
                    <span className="text-cyan-400 font-bold">{group.total_talent_pool} total</span>
                    <span className="text-slate-400"> / </span>
                    <span className="text-emerald-400 font-bold">{group.verified_talent_pool} verified</span>
                  </div>
                </div>

                {/* Skill Nodes in Category */}
                <div className="space-y-2">
                  {group.skills?.map(skill => (
                    <div key={skill.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-white/[0.04] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-200">{skill.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {skill.employee_count} employee(s) • {skill.active_projects_count} active project(s)
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          {skill.verified_count} verified
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                          skill.risk_level === 'Critical' 
                            ? 'bg-rose-500/20 text-rose-300' 
                            : skill.risk_level === 'High' 
                              ? 'bg-amber-500/20 text-amber-300' 
                              : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {skill.risk_level} Risk
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="atlas-surface-elevated p-8 text-center text-slate-400 text-xs">
            Loading organizational capability matrix...
          </div>
        )}
      </div>
    </div>
  );
};
