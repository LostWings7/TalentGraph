import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  User, 
  Shield, 
  ArrowRight, 
  Award, 
  Compass, 
  Sliders, 
  Layers, 
  MapPin, 
  BrainCircuit, 
  TrendingUp,
  BarChart3,
  Users
} from 'lucide-react';
import { useTalent } from '../../context/TalentContext';

export const GuideDrawer = () => {
  const { isGuideOpen, setIsGuideOpen, navigateTo } = useTalent();
  const [guidePerspective, setGuidePerspective] = useState('employee'); // 'employee' | 'hr'

  if (!isGuideOpen) return null;

  const employeeSteps = [
    { num: '01', title: 'Choose Your Persona', desc: 'Select any of 30 synthetic employees across Engineering, Data, Product, Security, and Design.', icon: User, tab: null },
    { num: '02', title: 'Inspect Grounded Capabilities', desc: 'Explore explicit, project-inferred, and AI-discovered skills backed by actual contribution records.', icon: Award, tab: 'profile' },
    { num: '03', title: 'Discover Internal Roles', desc: 'Review ranked role opportunities evaluated with our transparent 4-factor hybrid algorithm.', icon: Compass, tab: 'roles' },
    { num: '04', title: 'Simulate What-If Upskilling', desc: 'Toggle missing skills in the live simulator to see projected match score increases and gap closures.', icon: Sliders, tab: 'match' },
    { num: '05', title: 'Bridge Skill Gaps with Learning', desc: 'Review priority gaps (Critical to Low) and enroll directly in targeted learning pathways.', icon: Layers, tab: 'gap' },
    { num: '06', title: 'Track Your Career Roadmap', desc: 'Follow structured sequential phases toward your target milestone role with progress tracking.', icon: MapPin, tab: 'roadmap' },
    { num: '07', title: 'Consult Gemini Career Copilot', desc: 'Ask complex career strategy questions grounded directly in your organizational profile.', icon: BrainCircuit, tab: 'assistant' },
  ];

  const hrSteps = [
    { num: '01', title: 'Workforce Topology Health', desc: 'Analyze capability density, average readiness scores, and active talent mobility velocity.', icon: BarChart3, tab: 'hr' },
    { num: '02', title: 'Detect Emerging Skill Scarcity', desc: 'Spot enterprise-wide capability deficits and risk levels before they impact key roadmap delivery.', icon: Layers, tab: 'hr' },
    { num: '03', title: 'Succession Bench Readiness', desc: 'Evaluate internal pipelines for critical leadership and senior technical positions.', icon: Users, tab: 'hr' },
    { num: '04', title: 'Inspect Succession Candidates', desc: 'Click any bench candidate to immediately inspect their match breakdown and simulate upskilling.', icon: User, tab: 'match' },
    { num: '05', title: 'Strategic Upskilling Investment', desc: 'Align organization learning programs directly with documented capability shortages.', icon: TrendingUp, tab: 'hr' },
  ];

  const steps = guidePerspective === 'employee' ? employeeSteps : hrSteps;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="atlas-surface-elevated w-full max-w-md h-full flex flex-col shadow-2xl border-l border-white/[0.1] light:border-slate-300 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/[0.08] light:border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 light:bg-cyan-100 text-cyan-400 light:text-cyan-700 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white light:text-slate-900">
                How TalentGraph Works
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                Interactive Architecture Guide
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsGuideOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Perspective Switcher */}
        <div className="p-3 border-b border-white/[0.06] light:border-slate-200 bg-slate-950/40 light:bg-slate-50 flex gap-2">
          <button
            onClick={() => setGuidePerspective('employee')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              guidePerspective === 'employee'
                ? 'bg-cyan-500/20 text-cyan-300 light:bg-cyan-100 light:text-cyan-800 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Employee Guide</span>
          </button>
          <button
            onClick={() => setGuidePerspective('hr')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              guidePerspective === 'hr'
                ? 'bg-emerald-500/20 text-emerald-300 light:bg-emerald-100 light:text-emerald-800 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>HR Intelligence</span>
          </button>
        </div>

        {/* Step-by-Step Flow List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/40 light:bg-slate-50 border border-white/[0.06] light:border-slate-200 space-y-2 group hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-cyan-400 light:text-cyan-700 px-1.5 py-0.5 rounded bg-cyan-950/60 light:bg-cyan-100 border border-cyan-500/20">
                      {s.num}
                    </span>
                    <h3 className="text-xs font-bold text-white light:text-slate-900">
                      {s.title}
                    </h3>
                  </div>
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>

                <p className="text-[11px] text-slate-300 light:text-slate-600 leading-relaxed pl-7">
                  {s.desc}
                </p>

                {s.tab && (
                  <div className="pl-7 pt-1">
                    <button
                      onClick={() => {
                        navigateTo(s.tab);
                        setIsGuideOpen(false);
                      }}
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 light:text-cyan-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Jump to view</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-white/[0.08] light:border-slate-200 bg-slate-950/60 light:bg-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[10px]">Press ? anytime to open</span>
          <button
            onClick={() => setIsGuideOpen(false)}
            className="atlas-btn-secondary py-1 text-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
