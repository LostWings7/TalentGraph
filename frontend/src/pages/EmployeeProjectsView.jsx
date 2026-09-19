import React, { useState, useEffect } from 'react';
import { 
  FolderGit2, 
  Plus, 
  ShieldAlert, 
  ShieldCheck, 
  Shield,
  Lock, 
  CheckCircle2, 
  Clock, 
  Award, 
  Send, 
  Users, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { TalentAPI } from '../api/client';
import { useTalent } from '../context/TalentContext';

export const EmployeeProjectsView = () => {
  const { activeEmployee, showToast } = useTalent();
  const [projects, setProjects] = useState([]);
  const [myContributions, setMyContributions] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitProject, setSubmitProject] = useState(null);
  const [roleInProject, setRoleInProject] = useState('Core Contributor');
  const [summary, setSummary] = useState('');
  const [evidence, setEvidence] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, contribRes] = await Promise.all([
        TalentAPI.getProjects(),
        activeEmployee?.id ? TalentAPI.getEmployeeContributions(activeEmployee.id) : Promise.resolve({ data: [] })
      ]);
      setProjects(projRes.data || []);
      const contribList = Array.isArray(contribRes.data) ? contribRes.data : (contribRes.data.results || []);
      setMyContributions(contribList);
    } catch (err) {
      console.error('Failed to load employee projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeEmployee?.id]);

  const handleSubmitContribution = async (e) => {
    e.preventDefault();
    if (!submitProject) return;

    try {
      setSubmitting(true);
      await TalentAPI.submitProjectContribution(submitProject.id, {
        role_in_project: roleInProject,
        contribution_summary: summary,
        evidence: evidence,
        technologies_demonstrated: technologies,
        allocation_pct: 0.5
      });
      showToast('Project contribution submitted! It has entered the HR Approval Queue for review.', 'success');
      setIsSubmitModalOpen(false);
      setSummary('');
      setEvidence('');
      setTechnologies('');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit project contribution.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="atlas-surface-elevated p-6 border-l-4 border-l-cyan-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
              Project Participation & Evidence Grounding
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white light:text-slate-900 tracking-tight">
            Projects & Work Demonstrations
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-600 max-w-2xl mt-1">
            Inspect enterprise initiatives and submit evidence of project contributions to earn HR-verified skill badges and boost role match scores.
          </p>
        </div>
      </div>

      {/* My Verified Project Contributions */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white light:text-slate-900 flex items-center gap-2 font-mono uppercase tracking-wider">
          <Award className="w-4 h-4 text-cyan-400" />
          My Project Contributions ({myContributions.length})
        </h2>

        {myContributions.length === 0 ? (
          <div className="atlas-surface-elevated p-6 text-center text-slate-400 text-xs">
            No active project contributions recorded yet. Submit evidence on a project below to request HR verification.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myContributions.map((contrib, idx) => {
              const isApproved = contrib.verification_status === 'approved';
              return (
                <div 
                  key={contrib.id || idx}
                  className={`atlas-surface-elevated p-4 space-y-3 border-l-4 ${
                    isApproved ? 'border-l-emerald-500' : 'border-l-amber-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {contrib.role_in_project}
                      </span>
                      <h3 className="font-bold text-sm text-white mt-1">
                        {contrib.project_name || contrib.project?.name || 'Enterprise Initiative'}
                      </h3>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isApproved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {isApproved ? 'HR Verified' : 'Pending Review'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed">
                    {contrib.contribution_summary}
                  </p>

                  {contrib.evidence && (
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/[0.04] text-[11px] text-slate-400 font-mono">
                      Evidence: {contrib.evidence}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enterprise Projects Catalog */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-bold text-white light:text-slate-900 flex items-center gap-2 font-mono uppercase tracking-wider">
          <Layers className="w-4 h-4 text-cyan-400" />
          Enterprise Projects Catalog ({projects.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(proj => {
            const isConfidential = proj.sensitivity_level === 'HR_ONLY';
            const isContributed = myContributions.some(c => c.project === proj.id || c.project_name === proj.name);

            return (
              <div 
                key={proj.id}
                className="atlas-surface-elevated p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/30 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {proj.department}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isConfidential ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-mono font-bold flex items-center gap-1 border border-rose-500/30">
                          <Lock className="w-2.5 h-2.5" /> Confidential
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-mono font-bold">
                          {proj.status}
                        </span>
                      )}

                      {/* AI Processing Policy (Section 23) */}
                      {proj.ai_processing_mode === 'NO_EXTERNAL_AI' && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 text-[8px] font-mono font-bold flex items-center gap-1 border border-rose-500/30" title="Air-Gapped: Confidential details never reach external AI">
                          <ShieldAlert className="w-2.5 h-2.5" /> NO_EXTERNAL_AI
                        </span>
                      )}
                      {proj.ai_processing_mode === 'AI_SAFE_SUMMARY' && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 text-[8px] font-mono font-bold flex items-center gap-1 border border-amber-500/30" title="Sanitized: Redacted high-level summary only reaches AI layer">
                          <Shield className="w-2.5 h-2.5" /> AI_SAFE_SUMMARY
                        </span>
                      )}
                      {(!proj.ai_processing_mode || proj.ai_processing_mode === 'AI_ALLOWED') && (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 text-[8px] font-mono font-bold flex items-center gap-1 border border-cyan-500/30" title="Full context permitted for AI capability synthesis">
                          <Sparkles className="w-2.5 h-2.5" /> AI_ALLOWED
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-white light:text-slate-900">
                    {proj.name}
                  </h3>

                  <p className="text-xs text-slate-400 light:text-slate-600 line-clamp-3 leading-relaxed">
                    {proj.description}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {(proj.technologies ? proj.technologies.split(',') : []).map((t, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.05]">
                  {isContributed ? (
                    <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Already Contributed</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSubmitProject(proj);
                        setIsSubmitModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Submit Contribution Evidence</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Contribution Modal */}
      {isSubmitModalOpen && submitProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0B1120] border border-cyan-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-cyan-400" />
              Submit Contribution: {submitProject.name}
            </h2>

            <form onSubmit={handleSubmitContribution} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Your Role in Project</label>
                <input
                  type="text"
                  required
                  value={roleInProject}
                  onChange={(e) => setRoleInProject(e.target.value)}
                  placeholder="e.g. Lead Backend Engineer, Tech Lead, Contributor"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Contribution Summary</label>
                <textarea
                  rows="3"
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Summarize your key responsibilities, deliverables, and measurable architecture impact..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Evidence / Artifact Link / Benchmarks</label>
                <input
                  type="text"
                  required
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="e.g. Deployed 64-GPU cluster, reduced latency by 35%, authored design doc"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Technologies Demonstrated</label>
                <input
                  type="text"
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                  placeholder="e.g. PyTorch Distributed, Kubernetes, Python"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="atlas-btn-primary py-2 px-4 text-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Send for HR Approval'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
