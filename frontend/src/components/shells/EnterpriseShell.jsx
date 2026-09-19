import React, { useEffect } from 'react';
import { useTalent } from '../../context/TalentContext';

// Enterprise & HR-Facing Views
import { HRIntelligenceView } from '../../pages/HRIntelligenceView';
import { HRStaffingView } from '../../pages/HRStaffingView';
import { ApprovalsView } from '../../pages/ApprovalsView';
import { AuditLogView } from '../../pages/AuditLogView';
import { EnterpriseProfileView } from '../../pages/EnterpriseProfileView';
import { PersonaStudioView } from '../../pages/PersonaStudioView';

// Sub-navigation & Header for Enterprise Perspective
import { ShieldCheck, Users, Briefcase, CheckCircle2, History, Layers } from 'lucide-react';

const HR_ALLOWED_TABS = [
  'hr',
  'staffing',
  'approvals',
  'audit',
  'capability_map',
  'studio'
];

export const EnterpriseShell = () => {
  const { activeTab, navigateTo, addToast, userRole, currentEnterprise, stats } = useTalent();

  // Strict route guard: Ensure user is HR Admin
  useEffect(() => {
    if (userRole !== 'hr_admin') {
      console.warn('[EnterpriseShell] Unauthorized role attempted to enter Enterprise Shell:', userRole);
      navigateTo('dashboard');
      addToast('error', 'Access denied. HR Administrator privileges required.');
    } else if (!HR_ALLOWED_TABS.includes(activeTab)) {
      // If HR navigated to an employee tab, allow or default to 'hr'
      if (!['dashboard', 'profile', 'roles', 'match', 'gap', 'roadmap', 'projects', 'assistant'].includes(activeTab)) {
        navigateTo('hr');
      }
    }
  }, [userRole, activeTab, navigateTo, addToast]);

  return (
    <div className="w-full space-y-5">
      {/* Enterprise Executive Header Banner */}
      <div className="atlas-surface p-4 border border-purple-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white light:text-slate-900">
                {currentEnterprise?.name || 'Enterprise Workspace'}
              </h2>
              <span className="atlas-badge-purple text-[10px] py-0.5">
                Executive Console
              </span>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-500">
              Workforce capability modeling, automated staffing optimization & governance audit
            </p>
          </div>
        </div>

        {/* Quick Tabs for HR */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => navigateTo('hr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'hr'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Workforce</span>
          </button>
          <button
            onClick={() => navigateTo('staffing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'staffing'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-white/5'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Staffing</span>
          </button>
          <button
            onClick={() => navigateTo('approvals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer relative ${
              activeTab === 'approvals'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approvals</span>
          </button>
          <button
            onClick={() => navigateTo('capability_map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'capability_map'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Capability Map</span>
          </button>
          <button
            onClick={() => navigateTo('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-white/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Log</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content Container */}
      <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
        {activeTab === 'hr' && <HRIntelligenceView />}
        {activeTab === 'staffing' && <HRStaffingView />}
        {activeTab === 'approvals' && <ApprovalsView />}
        {activeTab === 'audit' && <AuditLogView />}
        {activeTab === 'capability_map' && <EnterpriseProfileView />}
        {activeTab === 'studio' && <PersonaStudioView />}
      </div>
    </div>
  );
};
