import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Command, 
  Compass, 
  Award, 
  Layers, 
  MapPin, 
  BrainCircuit, 
  Shield, 
  User, 
  Sliders, 
  Sun, 
  Moon, 
  HelpCircle,
  ArrowRight,
  TrendingUp,
  LayoutDashboard,
  Users,
  UserPlus,
  Sparkles
} from 'lucide-react';
import { useTalent } from '../../context/TalentContext';
import { getSkillLabel, getSkillId, getProficiencyLabel } from '../../utils/formatters';

export const CommandCenter = ({ isOpen, onClose }) => {
  const { 
    navigateTo, 
    employees, 
    switchEmployee, 
    activeEmployee, 
    employeeDetail, 
    activeRoleMatches, 
    toggleTheme, 
    setIsGuideOpen,
    setSelectedTargetRoleId 
  } = useTalent();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build searchable items
  const staticNavigation = [
    { id: 'nav-dash', category: 'Navigation', title: 'Atlas Overview', subtitle: 'Executive Capability Horizon', icon: LayoutDashboard, action: () => navigateTo('dashboard') },
    { id: 'nav-prof', category: 'Navigation', title: 'Capability Profile & Evidence', subtitle: 'Verified & Inferred Skills', icon: Award, action: () => navigateTo('profile') },
    { id: 'nav-roles', category: 'Navigation', title: 'Role Marketplace', subtitle: 'Internal Opportunities Catalog', icon: Compass, action: () => navigateTo('roles') },
    { id: 'nav-match', category: 'Navigation', title: 'Role Match Breakdown', subtitle: '4-Factor Hybrid Fit Scoring', icon: Compass, action: () => navigateTo('match') },
    { id: 'nav-gap', category: 'Navigation', title: 'Skill Gaps & Learning Pathways', subtitle: 'Priority Deficits & Courses', icon: Layers, action: () => navigateTo('gap') },
    { id: 'nav-road', category: 'Navigation', title: 'Career Roadmap', subtitle: 'Destination Progression Journey', icon: MapPin, action: () => navigateTo('roadmap') },
    { id: 'nav-ai', category: 'Navigation', title: 'AI Career Copilot', subtitle: 'Gemini 3.7 Flash Intelligence', icon: BrainCircuit, action: () => navigateTo('assistant') },
    { id: 'nav-hr', category: 'Navigation', title: 'HR Workforce Intelligence', subtitle: 'Workforce Topology & Scarcity', icon: Shield, action: () => navigateTo('hr') },
    { id: 'nav-studio', category: 'Navigation', title: 'Persona Studio & Talent Ingestion', subtitle: 'Synthesize & calibrate talent with Gemini 3.7 Flash', icon: Users, action: () => navigateTo('studio') },
  ];

  const actionItems = [
    { id: 'act-ingest', category: 'Actions', title: 'Ingest New Talent Persona', subtitle: 'Upload candidate resume, project CSVs & certs', icon: UserPlus, action: () => navigateTo('studio') },
    { id: 'act-sim', category: 'Actions', title: 'Run What-If Readiness Simulator', subtitle: 'Simulate upskilling impact', icon: Sliders, action: () => navigateTo('match') },
    { id: 'act-copilot', category: 'Actions', title: 'Consult Gemini Career Coach', subtitle: 'Ask career strategy questions', icon: BrainCircuit, action: () => navigateTo('assistant') },
    { id: 'act-guide', category: 'Actions', title: 'Open TalentGraph Guide', subtitle: 'How the platform works', icon: HelpCircle, action: () => { setIsGuideOpen(true); onClose(); } },
    { id: 'act-theme', category: 'Actions', title: 'Toggle Light / Dark Mode', subtitle: 'Switch visual theme', icon: Sun, action: () => { toggleTheme(); onClose(); } },
  ];

  // Role matches as searchable items
  const roleItems = (activeRoleMatches || []).map((m) => ({
    id: `role-${m.role_id}`,
    category: 'Roles & Opportunities',
    title: m.role_title,
    subtitle: `${Math.round(m.overall_score * 100)}% Match Fit • ${typeof m.department === 'string' ? m.department : (m.department?.name || m.department?.id || '')}`,
    icon: Compass,
    badge: `${Math.round(m.overall_score * 100)}%`,
    action: () => {
      setSelectedTargetRoleId(m.role_id);
      navigateTo('match', { targetRoleId: m.role_id });
    }
  }));

  // Employee's skills as searchable items
  const skillItems = (employeeDetail?.skills || []).map((s, idx) => {
    const sLabel = getSkillLabel(s);
    const sProf = getProficiencyLabel(s);
    return {
      id: getSkillId(s, idx),
      category: 'My Skills & Evidence',
      title: sLabel,
      subtitle: `Proficiency: ${sProf} • Source: ${typeof s.source === 'string' ? s.source : 'verified'}`,
      icon: Award,
      badge: sProf,
      action: () => navigateTo('profile')
    };
  });

  // Employee personas as searchable items
  const personaItems = (employees || []).slice(0, 15).map((e) => ({
    id: `emp-${e.id}`,
    category: 'Personas (30 Seeded)',
    title: e.name,
    subtitle: `${e.current_role} • ${e.department} (${e.years_experience} yrs)`,
    icon: User,
    action: () => {
      switchEmployee(e.id);
      onClose();
    }
  }));

  const allItems = [...staticNavigation, ...actionItems, ...roleItems, ...skillItems, ...personaItems];

  const filteredItems = query.trim() === ''
    ? [...staticNavigation.slice(0, 4), ...actionItems, ...roleItems.slice(0, 3)]
    : allItems.filter((item) => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 12);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="atlas-surface-elevated max-w-2xl w-full shadow-2xl border border-white/[0.15] light:border-slate-300 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/[0.08] light:border-slate-200 flex items-center gap-3 bg-slate-950/60 light:bg-slate-50">
          <Search className="w-5 h-5 text-cyan-400 light:text-cyan-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, role, skill, person, or action..."
            className="w-full bg-transparent text-sm text-white light:text-slate-900 placeholder:text-slate-500 focus:outline-hidden"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-slate-900 light:bg-white border border-white/[0.1] light:border-slate-300 text-[10px] font-mono text-slate-400">
            ESC to close
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No results found for "{query}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/15 light:bg-cyan-50 border border-cyan-400/40 text-white light:text-slate-900'
                      : 'hover:bg-white/[0.04] light:hover:bg-slate-100 text-slate-300 light:text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected 
                        ? 'bg-cyan-500/20 text-cyan-400 light:bg-cyan-100 light:text-cyan-800' 
                        : 'bg-slate-900 light:bg-slate-200 text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">
                          {item.title}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 px-1.5 py-0.2 rounded bg-slate-900/60 light:bg-slate-200 uppercase">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 light:text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.badge && (
                      <span className="atlas-badge-cyan text-[10px]">
                        {item.badge}
                      </span>
                    )}
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="p-3 border-t border-white/[0.08] light:border-slate-200 bg-slate-950/40 light:bg-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-cyan-400 light:text-cyan-700">TalentGraph Command Center</span>
        </div>
      </div>
    </div>
  );
};
