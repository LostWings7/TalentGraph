import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Award, 
  Compass, 
  GitMerge, 
  Layers, 
  MapPin, 
  Shield, 
  Search, 
  Command, 
  Sliders, 
  HelpCircle, 
  Menu, 
  X,
  User,
  Users,
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  FileText,
  Building2,
  FolderGit2,
  LogOut,
  KeyRound,
  ChevronDown
} from 'lucide-react';
import { useTalent } from '../../context/TalentContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';

export const AppHeader = () => {
  const { 
    activeTab, 
    navigateTo, 
    setCommandPaletteOpen, 
    setIsGuideOpen, 
    setIsPersonaModalOpen,
    activeEmployee,
    currentUser,
    userRole,
    currentEnterprise,
    logout,
    pendingApprovalsCount,
    isChangePasswordModalOpen,
    setIsChangePasswordModalOpen,
    isMustChangePasswordOpen,
    setIsMustChangePasswordOpen
  } = useTalent();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // HR Navigation Pillars
  const hrNavSections = [
    {
      label: 'EXECUTIVE INTELLIGENCE',
      items: [
        { id: 'hr', label: 'Workforce Intelligence', icon: Shield, badge: 'Executive' },
        { id: 'capability_map', label: 'Capability Map', icon: Building2 },
      ]
    },
    {
      label: 'TALENT DEPLOYMENT',
      items: [
        { id: 'staffing', label: 'Project Staffing', icon: Briefcase, badge: 'AI Engine' },
        { 
          id: 'approvals', 
          label: 'Approvals Queue', 
          icon: CheckSquare, 
          count: pendingApprovalsCount 
        },
      ]
    },
    {
      label: 'COMPLIANCE & STUDIO',
      items: [
        { id: 'audit', label: 'Audit Trail', icon: FileText },
        { id: 'studio', label: 'Talent & Account Studio', icon: Users, badge: 'Add Employee' },
      ]
    }
  ];

  // Employee Navigation Pillars
  const employeeNavSections = [
    {
      label: 'MY CAPABILITY',
      items: [
        { id: 'dashboard', label: 'Atlas Overview', icon: LayoutDashboard },
        { id: 'profile', label: 'Skill DNA', icon: Award },
      ]
    },
    {
      label: 'MY OPPORTUNITIES',
      items: [
        { id: 'roles', label: 'Role Marketplace', icon: Compass },
        { id: 'match', label: 'Match Breakdown', icon: GitMerge },
      ]
    },
    {
      label: 'MY GROWTH & WORK',
      items: [
        { id: 'gap', label: 'Skill Gaps', icon: Layers },
        { id: 'roadmap', label: 'Career Roadmap', icon: MapPin },
        { id: 'projects', label: 'Projects & Evidence', icon: FolderGit2 },
      ]
    },
    {
      label: 'INTELLIGENCE',
      items: [
        { id: 'assistant', label: 'Career Copilot', icon: BrainCircuit, badge: 'Gemini 3.7' },
      ]
    }
  ];

  const currentNavSections = userRole === 'hr_admin' ? hrNavSections : employeeNavSections;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#060913]/95 light:bg-white/95 backdrop-blur-xl border-b border-white/[0.08] light:border-slate-200 shadow-xl transition-colors">
        {/* Top Tenant Identity Sub-Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 light:from-slate-100 light:via-slate-50 light:to-slate-100 border-b border-white/[0.04] light:border-slate-200 px-4 py-1 text-[11px] font-mono flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                userRole === 'hr_admin' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}>
                {userRole === 'hr_admin' ? '🛡️ ENTERPRISE ADMIN' : '👤 EMPLOYEE'}
              </span>
              <span className="text-slate-400 light:text-slate-600">—</span>
              <span className="font-semibold text-white light:text-slate-800">
                {userRole === 'hr_admin' 
                  ? (currentEnterprise?.name || 'NovaTech Solutions')
                  : `${currentUser?.name || activeEmployee?.name || 'Maya Lin'} (${currentEnterprise?.name || 'NovaTech Solutions'})`}
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-400 light:text-slate-600">
              <span className="hidden sm:inline">Industry: {currentEnterprise?.industry || 'Enterprise Software'}</span>
              <span className="hidden md:inline">•</span>
              <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Tenant Isolated
              </span>
            </div>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo & Product Title */}
            <div 
              className="flex items-center gap-3 cursor-pointer select-none group"
              onClick={() => navigateTo(userRole === 'hr_admin' ? 'hr' : 'dashboard')}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 p-0.5 shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
                <div className="w-full h-full bg-[#060913] light:bg-slate-900 rounded-[10px] flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4 text-cyan-400 group-hover:rotate-6 transition-transform" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white light:text-slate-900 font-sans">
                    TalentGraph
                  </span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 light:text-cyan-700 border border-cyan-500/35 font-mono">
                    AI
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Utility Tools */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Command Palette Trigger */}
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 border border-white/[0.08] light:border-slate-300 text-xs text-slate-300 light:text-slate-700 transition-all cursor-pointer shadow-xs"
                title="Open Global Command Center (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
                <span className="hidden md:inline text-slate-400 light:text-slate-500 text-[11px]">Command Center</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-slate-950 light:bg-white border border-white/[0.1] light:border-slate-300 text-[9px] font-mono text-slate-400 light:text-slate-600">
                  <Command className="w-2.5 h-2.5" /> K
                </kbd>
              </button>

              {/* Persona Switcher Quick Button (for Employee mode) */}
              {userRole !== 'hr_admin' && activeEmployee && (
                <button
                  onClick={() => setIsPersonaModalOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 border border-white/[0.08] light:border-slate-300 text-xs font-semibold text-slate-200 light:text-slate-800 transition-all cursor-pointer"
                  title="Switch Employee Persona"
                >
                  <User className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
                  <span className="truncate max-w-[120px]">{activeEmployee.name}</span>
                </button>
              )}

              {/* Guide Drawer Trigger */}
              <button
                onClick={() => setIsGuideOpen(true)}
                className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 border border-white/[0.08] light:border-slate-300 text-slate-300 light:text-slate-700 transition-all cursor-pointer shadow-xs"
                title="How TalentGraph Works (?)"
              >
                <HelpCircle className="w-4 h-4 text-cyan-400 light:text-cyan-600" />
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Profile & Account Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 border border-white/[0.08] light:border-slate-300 text-xs text-slate-300 transition-all cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px]">
                    {currentUser?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#0B1120] light:bg-white border border-slate-700 light:border-slate-200 rounded-xl shadow-2xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-800 light:border-slate-100">
                      <div className="font-bold text-white light:text-slate-900 truncate">
                        {currentUser?.name || currentUser?.username || 'Authenticated User'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {currentUser?.email || 'user@novatech.demo'}
                      </div>
                      <div className="mt-1 inline-block px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-mono">
                        {userRole === 'hr_admin' ? 'HR Administrator' : 'Employee Account'}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsChangePasswordModalOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-800/60 light:hover:bg-slate-100 flex items-center gap-2 text-slate-300 light:text-slate-700"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Change Password</span>
                    </button>

                    {userRole !== 'hr_admin' && (
                      <button
                        onClick={() => {
                          setIsPersonaModalOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-800/60 light:hover:bg-slate-100 flex items-center gap-2 text-slate-300 light:text-slate-700"
                      >
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Switch Persona Profile</span>
                      </button>
                    )}

                    <div className="border-t border-slate-800 light:border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-rose-500/10 text-rose-400 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden p-1.5 rounded-xl bg-slate-900/80 light:bg-slate-100 text-slate-300 light:text-slate-700 border border-white/[0.08] light:border-slate-300"
              >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Desktop Role-Specific Grouped Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-5 overflow-x-auto py-2 border-t border-white/[0.05] light:border-slate-200 text-xs">
            {currentNavSections.map((section, sIdx) => (
              <div key={sIdx} className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] font-mono font-bold text-slate-400 light:text-slate-500 tracking-wider uppercase mr-1">
                  {section.label}
                </span>
                <div className="flex items-center gap-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigateTo(item.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-cyan-500/20 light:bg-cyan-100 text-white light:text-cyan-900 border border-cyan-400/50 light:border-cyan-400 shadow-xs font-bold'
                            : 'text-slate-300 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.05] light:hover:bg-slate-100'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400 light:text-cyan-600' : 'text-slate-400 light:text-slate-500'}`} />
                        <span>{item.label}</span>
                        {item.count > 0 && (
                          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[9px] font-mono font-bold animate-pulse">
                            {item.count}
                          </span>
                        )}
                        {item.badge && (
                          <span className="px-1.5 py-0.2 bg-purple-500/20 light:bg-purple-100 text-purple-300 light:text-purple-700 border border-purple-500/30 rounded text-[9px] font-mono font-bold">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {sIdx < currentNavSections.length - 1 && (
                  <div className="h-3.5 w-px bg-white/[0.08] light:bg-slate-300 ml-2" />
                )}
              </div>
            ))}
          </nav>

          {/* Mobile Navigation Drawer */}
          {isMobileOpen && (
            <div className="lg:hidden py-3 border-t border-white/[0.08] light:border-slate-200 space-y-3 animate-in slide-in-from-top-2 duration-150">
              {currentNavSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <div className="text-[9px] font-mono font-bold text-slate-400 light:text-slate-500 uppercase px-2">
                    {section.label}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigateTo(item.id);
                            setIsMobileOpen(false);
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left ${
                            isActive
                              ? 'bg-cyan-500/20 light:bg-cyan-100 text-white light:text-cyan-900 border border-cyan-400/50'
                              : 'text-slate-300 light:text-slate-700 hover:bg-white/[0.05] light:hover:bg-slate-100'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400 light:text-cyan-600' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                          {item.count > 0 && (
                            <span className="ml-auto px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[9px] font-bold">
                              {item.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Forced Password Change Modal */}
      <ChangePasswordModal
        isOpen={isMustChangePasswordOpen}
        onClose={() => setIsMustChangePasswordOpen(false)}
        isForced={true}
      />

      {/* User Initiated Password Change Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        isForced={false}
      />
    </>
  );
};
