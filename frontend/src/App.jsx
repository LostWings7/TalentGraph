import React, { useEffect } from 'react';
import { TalentProvider, useTalent } from './context/TalentContext';
import { AppHeader } from './components/layout/AppHeader';
import { ContextBar } from './components/layout/ContextBar';
import { Footer } from './components/layout/Footer';
import { GuideDrawer } from './components/layout/GuideDrawer';
import { OnboardingSpotlight } from './components/layout/OnboardingSpotlight';
import { PersonaModal } from './components/auth/PersonaModal';
import { LandingHero } from './components/auth/LandingHero';
import { LoginView } from './components/auth/LoginView';
import { CommandCenter } from './components/command/CommandCenter';
import { ToastNotification } from './components/common/ToastNotification';

import { EmployeeShell } from './components/shells/EmployeeShell';
import { EnterpriseShell } from './components/shells/EnterpriseShell';

const MainShell = () => {
  const { 
    activeTab, 
    setActiveTab, 
    userRole, 
    loading, 
    isCommandPaletteOpen, 
    setCommandPaletteOpen,
    isPersonaModalOpen,
    setIsPersonaModalOpen,
    onboardingCompleted,
    setIsOnboardingOpen,
    authToken
  } = useTalent();

  // Trigger onboarding on first-time login if not completed
  useEffect(() => {
    if (!loading && !onboardingCompleted && activeTab === 'dashboard') {
      setIsOnboardingOpen(true);
    }
  }, [loading, onboardingCompleted, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#060913] light:bg-slate-50 text-white light:text-slate-900 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 p-0.5 animate-spin">
          <div className="w-full h-full bg-[#060913] light:bg-slate-50 rounded-[14px]" />
        </div>
        <div className="text-xs font-semibold tracking-wider text-slate-300 light:text-slate-700 font-mono">
          Synthesizing Multi-Tenant TalentGraph Operating System...
        </div>
      </div>
    );
  }

  // View: Landing Entry Experience
  if (activeTab === 'landing') {
    return (
      <>
        <LandingHero
          onEnterEmployee={() => setActiveTab('dashboard')}
          onEnterHR={() => setActiveTab('hr')}
          onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
        />
        <PersonaModal
          isOpen={isPersonaModalOpen}
          onClose={() => setIsPersonaModalOpen(false)}
          onSelectPersona={() => setActiveTab('dashboard')}
        />
        <ToastNotification />
      </>
    );
  }

  // View: Dedicated Demo Login View
  if (activeTab === 'login') {
    return (
      <>
        <LoginView />
        <PersonaModal
          isOpen={isPersonaModalOpen}
          onClose={() => setIsPersonaModalOpen(false)}
          onSelectPersona={() => setActiveTab('dashboard')}
        />
        <ToastNotification />
      </>
    );
  }

  const isHROnlyTab = ['hr', 'staffing', 'approvals', 'audit', 'capability_map', 'studio'].includes(activeTab);
  const showEnterpriseShell = userRole === 'hr_admin' && isHROnlyTab;

  // Authenticated Workspace Shell
  return (
    <div className="min-h-screen bg-[#060913] light:bg-[#f8fafc] text-slate-100 light:text-slate-900 flex flex-col selection:bg-cyan-500/25 selection:text-white transition-colors duration-200">
      {/* Top Application Header */}
      <AppHeader />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-12">
        {showEnterpriseShell ? <EnterpriseShell /> : <EmployeeShell />}
      </main>

      {/* System Footer */}
      <Footer />

      {/* Global Interactive Command Center (Ctrl+K) */}
      <CommandCenter
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* 30-Persona Switcher Modal */}
      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
      />

      {/* Slide-Over Guide Drawer */}
      <GuideDrawer />

      {/* Guided Onboarding Spotlight Tour */}
      <OnboardingSpotlight />

      {/* Toast Feedback */}
      <ToastNotification />
    </div>
  );
};

export default function App() {
  return (
    <TalentProvider>
      <MainShell />
    </TalentProvider>
  );
}

