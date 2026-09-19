import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Sparkles, 
  UserPlus, 
  Search, 
  Filter, 
  Trash2, 
  Award, 
  Compass, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  BrainCircuit, 
  Zap,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { TalentAPI } from '../api/client';
import { useTalent } from '../context/TalentContext';
import { AddPersonaWizard } from '../components/studio/AddPersonaWizard';
import { getSkillLabel } from '../utils/formatters';

export const PersonaStudioView = () => {
  const { 
    employees, 
    activeEmployee, 
    switchEmployee, 
    navigateTo, 
    showToast 
  } = useTalent();

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedDemoIdForWizard, setSelectedDemoIdForWizard] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [personaTypeFilter, setPersonaTypeFilter] = useState('All'); // 'All' | 'Custom' | 'Benchmark'

  const [stats, setStats] = useState({
    total_personas: 30,
    custom_personas: 0,
    benchmark_personas: 30,
    departments: {}
  });

  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Persona Studio stats
  const fetchStats = async () => {
    try {
      const res = await TalentAPI.getPersonasStats();
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Error fetching persona stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [employees]);

  // Demo cards quick metadata
  const demoProfiles = [
    {
      id: 'alex-rivera',
      name: 'Alex Rivera',
      role: 'Senior ML Engineer',
      dept: 'AI Research',
      exp: '6.5 yrs',
      tags: ['PyTorch', 'Transformers', 'Ray', 'Kubernetes'],
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      tagline: 'Distributed ML, LoRA Fine-Tuning & High-Throughput Inference'
    },
    {
      id: 'maya-lin',
      name: 'Maya Lin',
      role: 'Lead Data Scientist',
      dept: 'Data Platform',
      exp: '7.0 yrs',
      tags: ['Snowflake', 'dbt', 'PySpark', 'A/B Testing'],
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      tagline: 'Modern Lakehouse, Causal Analytics & Experimentation Platforms'
    },
    {
      id: 'marcus-chen',
      name: 'Marcus Chen',
      role: 'Staff Platform Engineer',
      dept: 'Cloud Architecture',
      exp: '8.0 yrs',
      tags: ['Kubernetes', 'Terraform', 'Istio', 'Vault'],
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      tagline: 'Multi-Cloud Reliability, GitOps Automation & Zero-Trust Mesh'
    }
  ];

  // Filtered Persona List
  const filteredEmployees = useMemo(() => {
    return (employees || []).filter((emp) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        emp.name?.toLowerCase().includes(q) ||
        emp.current_role?.toLowerCase().includes(q) ||
        emp.department?.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q)
      );

      // 2. Department Filter
      const matchesDept = selectedDept === 'All' || emp.department === selectedDept;

      // 3. Type Filter
      const isCustom = emp.id > 60 || (emp.id < 31 && employees.length >= 30);
      const matchesType = 
        personaTypeFilter === 'All' ||
        (personaTypeFilter === 'Custom' && isCustom) ||
        (personaTypeFilter === 'Benchmark' && !isCustom);

      return matchesSearch && matchesDept && matchesType;
    });
  }, [employees, searchQuery, selectedDept, personaTypeFilter]);

  // Handle Opening Ingestion Wizard with specific Demo
  const handleOpenDemo = (demoId) => {
    setSelectedDemoIdForWizard(demoId);
    setIsWizardOpen(true);
  };

  const handleOpenNewWizard = () => {
    setSelectedDemoIdForWizard(null);
    setIsWizardOpen(true);
  };

  const handlePersonaCreated = async (newEmp) => {
    fetchStats();
    showToast(`Persona ${newEmp.name} ready! Loading talent atlas...`, 'success');
  };

  // Handle Deleting Custom Persona
  const confirmDeletePersona = async () => {
    if (!deleteCandidate) return;
    try {
      setIsDeleting(true);
      await TalentAPI.deletePersona(deleteCandidate.id);
      showToast(`Deleted persona "${deleteCandidate.name}"`, 'info');
      setDeleteCandidate(null);
      
      // If currently active employee was deleted, switch to first remaining
      if (activeEmployee?.id === deleteCandidate.id && employees.length > 1) {
        const remaining = employees.find((e) => e.id !== deleteCandidate.id);
        if (remaining) {
          switchEmployee(remaining.id);
        }
      }
      fetchStats();
    } catch (err) {
      console.error('Failed to delete persona:', err);
      const errMsg = err.response?.data?.error || 'Could not delete persona.';
      showToast(errMsg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const departments = ['All', 'Engineering', 'AI Research', 'Data Platform', 'Cloud Architecture', 'Product', 'Security'];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-white/[0.08] light:border-slate-200 light:bg-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 light:text-cyan-700 border border-cyan-500/35">
                PERSONA STUDIO
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 light:text-purple-700 border border-purple-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> Gemini 3.7 Flash Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white light:text-slate-900">
              Talent Ingestion & Persona Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600 leading-relaxed">
              Upload candidate resumes, project logs, and certifications to synthesize verifiable talent profiles with grounded evidence, multi-source skill calibration, and instant role fit matching.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenNewWizard}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>+ Ingest New Talent</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/[0.08] light:border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-slate-950/50 light:bg-slate-50 border border-white/[0.05] light:border-slate-200">
            <div className="text-xs text-slate-400 font-medium">Total Talent Graph</div>
            <div className="text-xl font-bold text-white light:text-slate-900 font-mono mt-0.5">
              {employees?.length || stats.total_personas} Personas
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 light:bg-slate-50 border border-white/[0.05] light:border-slate-200">
            <div className="text-xs text-slate-400 font-medium">Custom Ingested</div>
            <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5">
              {stats.custom_personas} Ingested
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 light:bg-slate-50 border border-white/[0.05] light:border-slate-200">
            <div className="text-xs text-slate-400 font-medium">Enterprise Benchmarks</div>
            <div className="text-xl font-bold text-indigo-400 font-mono mt-0.5">
              {stats.benchmark_personas} Seeded
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 light:bg-slate-50 border border-white/[0.05] light:border-slate-200">
            <div className="text-xs text-slate-400 font-medium">Active Candidate</div>
            <div className="text-sm font-bold text-emerald-400 truncate mt-1">
              {activeEmployee?.name || 'None Selected'}
            </div>
          </div>
        </div>
      </div>

      {/* Try a Demo Persona Quick-Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-white light:text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-cyan-400" />
            Instant Ingestion Demos (Try with Real Career Evidence)
          </h2>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Each package includes resume, project CSVs, certs, and learning history
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {demoProfiles.map((demo) => (
            <div
              key={demo.id}
              className="p-4 rounded-xl bg-slate-900/70 light:bg-white border border-white/[0.08] light:border-slate-200 shadow-md hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <img
                  src={demo.avatar}
                  alt={demo.name}
                  className="w-11 h-11 rounded-xl object-cover border border-white/20 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white light:text-slate-900 truncate">
                      {demo.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                      {demo.exp}
                    </span>
                  </div>
                  <p className="text-xs text-cyan-400 light:text-cyan-700 font-medium truncate mt-0.5">
                    {demo.role}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {demo.tagline}
                  </p>
                </div>
              </div>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1">
                {demo.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] light:bg-slate-100 text-slate-300 light:text-slate-700 border border-white/[0.05] light:border-slate-200 font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleOpenDemo(demo.id)}
                className="w-full py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 light:text-cyan-800 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Ingest & Extract with Gemini
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Talent Directory Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 light:bg-white border border-white/[0.08] light:border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, role, skill, or email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 light:bg-slate-100 border border-white/[0.1] light:border-slate-300 text-xs text-white light:text-slate-900 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Department Select */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 light:bg-slate-100 border border-white/[0.1] light:border-slate-300 text-xs text-slate-200 light:text-slate-800 focus:outline-none focus:border-cyan-400"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'All' ? 'All Departments' : d}
              </option>
            ))}
          </select>

          {/* Type Filter Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 light:bg-slate-100 border border-white/[0.08] light:border-slate-200 text-xs">
            {[
              { id: 'All', label: 'All' },
              { id: 'Custom', label: 'Custom' },
              { id: 'Benchmark', label: 'Benchmark' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPersonaTypeFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  personaTypeFilter === tab.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white light:hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Persona Cards Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 light:bg-slate-50 border border-dashed border-white/[0.1] light:border-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white light:text-slate-900">No personas match your filters</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria or click "+ Ingest New Talent" to upload a new candidate persona.
          </p>
          <button
            onClick={handleOpenNewWizard}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-md"
          >
            + Ingest New Talent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const isActive = activeEmployee?.id === emp.id;
            const isCustom = emp.id > 60 || (emp.id < 31 && employees.length >= 30);

            return (
              <div
                key={emp.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 relative overflow-hidden group ${
                  isActive
                    ? 'bg-slate-900/90 light:bg-white border-cyan-400/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                    : 'bg-slate-900/60 light:bg-white border-white/[0.08] light:border-slate-200 hover:border-white/20'
                }`}
              >
                {/* Active Indicator Top Tag */}
                {isActive && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-indigo-500 text-slate-950 font-black text-[9px] px-3 py-0.5 rounded-bl-lg font-mono">
                    ACTIVE CANDIDATE
                  </div>
                )}

                <div>
                  <div className="flex items-start gap-3">
                    <img
                      src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={emp.name}
                      className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white light:text-slate-900 truncate">
                          {emp.name}
                        </span>
                        {isCustom && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                            CUSTOM
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 light:text-slate-700 truncate mt-0.5">
                        {emp.current_role}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span>{emp.department}</span>
                        <span>•</span>
                        <span>{emp.years_experience} yrs exp</span>
                      </div>
                    </div>
                  </div>

                  {emp.bio && (
                    <p className="text-[11px] text-slate-400 light:text-slate-600 line-clamp-2 mt-2.5 italic">
                      "{emp.bio}"
                    </p>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-white/[0.05] light:border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {!isActive ? (
                      <button
                        onClick={() => {
                          switchEmployee(emp.id);
                          showToast(`Switched active perspective to ${emp.name}`, 'info');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 light:bg-slate-100 light:hover:bg-slate-200 text-xs font-semibold text-slate-200 light:text-slate-800 transition-colors"
                      >
                        Switch To
                      </button>
                    ) : (
                      <button
                        onClick={() => navigateTo('profile')}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 light:text-cyan-800 border border-cyan-500/40 text-xs font-bold transition-colors"
                      >
                        View Profile
                      </button>
                    )}

                    <button
                      onClick={() => {
                        switchEmployee(emp.id);
                        navigateTo('roles');
                      }}
                      className="px-2.5 py-1 rounded-lg hover:bg-white/[0.05] light:hover:bg-slate-100 text-xs text-slate-400 hover:text-white light:hover:text-slate-900 transition-colors"
                      title="Explore Role Matches"
                    >
                      <Compass className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Delete Button for Custom Personas */}
                  {isCustom ? (
                    <button
                      onClick={() => setDeleteCandidate(emp)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Custom Persona"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1" title="Benchmark personas are protected">
                      <ShieldCheck className="w-3 h-3 text-slate-500" /> Benchmark
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0b0f19] light:bg-white border border-red-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white light:text-slate-900">Delete Talent Persona</h3>
                <p className="text-xs text-slate-400">This action will remove the candidate from the Talent Graph</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 light:text-slate-700">
              Are you sure you want to delete <span className="font-bold text-white light:text-slate-900">{deleteCandidate.name}</span> ({deleteCandidate.current_role})? All associated skill proficiencies, project contributions, and match records will be purged.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePersona}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold shadow-md shadow-red-500/20 flex items-center gap-2"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Persona Multi-Stage Wizard Modal */}
      <AddPersonaWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onPersonaCreated={handlePersonaCreated}
        preselectDemoId={selectedDemoIdForWizard}
      />

    </div>
  );
};
