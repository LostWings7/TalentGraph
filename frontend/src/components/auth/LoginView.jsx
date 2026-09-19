import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Mail, 
  KeyRound, 
  Building2, 
  Shield, 
  Zap,
  UserCheck
} from 'lucide-react';
import { useTalent } from '../../context/TalentContext';
import { ThemeToggle } from '../common/ThemeToggle';

export const LoginView = () => {
  const { login, currentEnterprise } = useTalent();
  const [email, setEmail] = useState('hr@novatech.demo');
  const [password, setPassword] = useState('password123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    try {
      setSubmitting(true);
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const quickSwitchAccount = async (demoEmail, demoPass = 'password123') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    try {
      setSubmitting(true);
      await login(demoEmail, demoPass);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#060913] light:bg-[#f8fafc] text-white light:text-slate-900 transition-colors p-6">
      {/* Header */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#060913] light:bg-slate-900 rounded-[10px] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight flex items-center gap-2">
              <span>TalentGraph AI</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Enterprise 2.0
              </span>
            </div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto my-auto py-8">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Two-Sided Enterprise & Employee Platform</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Sign In to {currentEnterprise?.name || 'NovaTech Solutions'}
          </h1>
          <p className="text-xs text-slate-300 light:text-slate-600 max-w-lg mx-auto">
            Tenant-isolated workforce operating system powered by Gemini 3.7 Flash intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Real Auth Login Form */}
          <div className="lg:col-span-6 atlas-surface-elevated p-6 border-l-4 border-l-cyan-500 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white light:text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                Account Credentials
              </h2>
              <span className="text-[11px] font-mono text-cyan-400 light:text-cyan-700">Token Auth</span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 light:text-slate-600 mb-1">Corporate Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@novatech.demo"
                    className="w-full bg-slate-900 light:bg-white border border-slate-700 light:border-slate-300 rounded-xl px-3 py-2 text-xs text-white light:text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 light:text-slate-600 mb-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 light:bg-white border border-slate-700 light:border-slate-300 rounded-xl px-3 py-2 text-xs text-white light:text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full atlas-btn-primary justify-center py-3 text-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Authenticating...' : 'Sign In to Workspace'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick Demo Switcher Chips */}
          <div className="lg:col-span-6 space-y-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              One-Click Seeded Accounts
            </div>

            {/* HR Admin Card */}
            <div 
              onClick={() => quickSwitchAccount('hr@novatech.demo', 'password123')}
              className="p-4 rounded-xl bg-[#0B1120] hover:bg-slate-800/80 border border-emerald-500/30 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 flex items-center gap-2">
                    HR & Enterprise Admin
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">NovaTech HR</span>
                  </div>
                  <div className="text-[11px] text-slate-400">hr@novatech.demo • Full Staffing & Governance</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>

            {/* Employee Quick Cards */}
            <div className="space-y-2">
              <div 
                onClick={() => quickSwitchAccount('maya@novatech.demo', 'password123')}
                className="p-3 rounded-xl bg-[#0B1120] hover:bg-slate-800/80 border border-cyan-500/20 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    ML
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-300">Maya Lin</div>
                    <div className="text-[10px] text-slate-400">Principal ML Engineer • AI Research</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-cyan-400">maya@novatech.demo</span>
              </div>

              <div 
                onClick={() => quickSwitchAccount('alex@novatech.demo', 'password123')}
                className="p-3 rounded-xl bg-[#0B1120] hover:bg-slate-800/80 border border-cyan-500/20 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    AR
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-indigo-300">Alex Rivera</div>
                    <div className="text-[10px] text-slate-400">Senior Full Stack Engineer • Core Platform</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-indigo-400">alex@novatech.demo</span>
              </div>

              <div 
                onClick={() => quickSwitchAccount('marcus@novatech.demo', 'password123')}
                className="p-3 rounded-xl bg-[#0B1120] hover:bg-slate-800/80 border border-cyan-500/20 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    MV
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-purple-300">Marcus Vance</div>
                    <div className="text-[10px] text-slate-400">Principal Cloud Architect • Infrastructure</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-purple-400">marcus@novatech.demo</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 light:text-slate-500 font-mono">
        TalentGraph AI • Multi-Tenant Isolation & Continuous Capability Feedback
      </footer>
    </div>
  );
};
