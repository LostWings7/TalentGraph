import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, X, Award, Compass, Sliders, BrainCircuit } from 'lucide-react';
import { useTalent } from '../../context/TalentContext';

export const OnboardingSpotlight = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, setOnboardingCompleted, navigateTo } = useTalent();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOnboardingOpen) return null;

  const steps = [
    {
      title: 'Your Living Capability Profile & Grounded Evidence',
      icon: Award,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      description: 'TalentGraph extracts verified and project-inferred competencies directly from your historical project deliverables, certifications, and technical contributions.',
      actionLabel: 'Next: Explore Roles',
      tab: 'profile'
    },
    {
      title: 'Discover Internal Opportunities & Hybrid Match Scoring',
      icon: Compass,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      description: 'Explore enterprise roles matched using our hybrid intelligence formula (30% semantic fit, 35% skill alignment, 20% experience, 15% project deliverables).',
      actionLabel: 'Next: What-If Simulation',
      tab: 'roles'
    },
    {
      title: 'Simulate Career Growth with Live What-If Simulator',
      icon: Sliders,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'Select target skills to simulate capability acquisition in real time. Watch your projected match score and roadmap dynamically calculate uplift.',
      actionLabel: 'Next: AI Career Copilot',
      tab: 'match'
    },
    {
      title: 'AI Career Copilot Powered by Gemini 3.7 Flash',
      icon: BrainCircuit,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      description: 'Ask deep career questions grounded in your actual skills, organizational role catalog, and active career milestones.',
      actionLabel: 'Finish & Enter Atlas',
      tab: 'dashboard'
    }
  ];

  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStepIdx = currentStep + 1;
      setCurrentStep(nextStepIdx);
      if (steps[nextStepIdx].tab) {
        navigateTo(steps[nextStepIdx].tab);
      }
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setOnboardingCompleted(true);
    setIsOnboardingOpen(false);
    navigateTo('dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="atlas-surface-elevated max-w-lg w-full p-6 space-y-6 shadow-2xl border border-cyan-500/30 relative">
        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-6 bg-cyan-400'
                    : idx < currentStep
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleComplete}
            className="text-xs text-slate-400 hover:text-white light:hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Skip tour</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="space-y-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${step.color}`}>
            <StepIcon className="w-6 h-6" />
          </div>

          <div>
            <div className="text-[10px] font-mono text-cyan-400 light:text-cyan-700 font-bold uppercase tracking-wider">
              Step {currentStep + 1} of {steps.length}
            </div>
            <h2 className="text-lg font-bold text-white light:text-slate-900 mt-0.5">
              {step.title}
            </h2>
            <p className="text-xs text-slate-300 light:text-slate-600 mt-2 leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] light:border-slate-200">
          <span className="text-[11px] font-mono text-slate-400">
            TalentGraph Guided Onboarding
          </span>

          <button
            onClick={handleNext}
            className="atlas-btn-primary"
          >
            <span>{step.actionLabel}</span>
            {currentStep === steps.length - 1 ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
