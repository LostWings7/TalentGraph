import React, { useEffect } from 'react';
import { useTalent } from '../../context/TalentContext';
import { ContextBar } from '../layout/ContextBar';

// Employee-Facing Views
import { DashboardView } from '../../pages/DashboardView';
import { SkillProfileView } from '../../pages/SkillProfileView';
import { RoleExplorerView } from '../../pages/RoleExplorerView';
import { RoleMatchDetailView } from '../../pages/RoleMatchDetailView';
import { SkillGapLearningView } from '../../pages/SkillGapLearningView';
import { CareerRoadmapView } from '../../pages/CareerRoadmapView';
import { CareerAssistantView } from '../../pages/CareerAssistantView';
import { EmployeeProjectsView } from '../../pages/EmployeeProjectsView';

const EMPLOYEE_ALLOWED_TABS = [
  'dashboard',
  'profile',
  'roles',
  'match',
  'gap',
  'roadmap',
  'projects',
  'assistant'
];

export const EmployeeShell = () => {
  const { activeTab, navigateTo, addToast, userRole } = useTalent();

  // Client-side route guard: Redirect away from HR-only tabs
  useEffect(() => {
    if (!EMPLOYEE_ALLOWED_TABS.includes(activeTab)) {
      console.warn(`[EmployeeShell] Route guard redirected from unauthorized tab: ${activeTab}`);
      navigateTo('dashboard');
      addToast('info', 'Redirected to Employee Workspace.');
    }
  }, [activeTab, navigateTo, addToast]);

  return (
    <div className="w-full space-y-5">
      {/* Employee Perspective Context Bar (Active Persona, Target Goal, Readiness Gauge) */}
      <ContextBar />

      {/* Main Tab Content Container */}
      <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'profile' && <SkillProfileView />}
        {activeTab === 'roles' && <RoleExplorerView />}
        {activeTab === 'match' && <RoleMatchDetailView />}
        {activeTab === 'gap' && <SkillGapLearningView />}
        {activeTab === 'roadmap' && <CareerRoadmapView />}
        {activeTab === 'projects' && <EmployeeProjectsView />}
        {activeTab === 'assistant' && <CareerAssistantView />}
      </div>
    </div>
  );
};
