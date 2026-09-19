import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  Sparkles, 
  BrainCircuit, 
  ShieldCheck, 
  CheckCircle2, 
  UserPlus, 
  Sliders, 
  Plus, 
  Layers, 
  Filter, 
  ArrowRight, 
  AlertCircle,
  Clock,
  Award,
  ChevronRight,
  TrendingUp,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { TalentAPI } from '../api/client';
import { useTalent } from '../context/TalentContext';

export const HRStaffingView = () => {
  const { currentEnterprise, showToast } = useTalent();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [teamOptimizerResult, setTeamOptimizerResult] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [isTeamOptimizerModalOpen, setIsTeamOptimizerModalOpen] = useState(false);

  // Form State for New Staffing Request
  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqDept, setNewReqDept] = useState('Engineering');
  const [newReqTeamSize, setNewReqTeamSize] = useState(3);
  const [newReqSkills, setNewReqSkills] = useState('Kubernetes, Go, Distributed Systems');
  const [newReqMinExp, setNewReqMinExp] = useState(3.0);
  const [newReqDesc, setNewReqDesc] = useState('');

  const fetchStaffingRequests = async () => {
    try {
      setLoading(true);
      const res = await TalentAPI.getStaffingRequests();
      const list = res.data.results || [];
      setRequests(list);
      if (list.length > 0 && !selectedRequest) {
        setSelectedRequest(list[0]);
      }
    } catch (err) {
      console.error('Failed to load staffing requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffingRequests();
  }, []);

  // Run AI candidate scoring when selected request changes
  const runStaffingAnalysis = async (reqId) => {
    try {
      setAnalyzing(true);
      const res = await TalentAPI.analyzeStaffing(reqId);
      setCandidates(res.data.results || []);
      showToast(`Analyzed ${res.data.total_evaluated || res.data.results?.length} candidates for staffing fit.`, 'success');
    } catch (err) {
      console.error('Failed to analyze candidates:', err);
      showToast('Error analyzing staffing candidates.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (selectedRequest?.id) {
      runStaffingAnalysis(selectedRequest.id);
    }
  }, [selectedRequest?.id]);

  // Run Greedy Team Optimizer
  const handleRunTeamOptimizer = async () => {
    if (!selectedRequest) return;
    try {
      setAnalyzing(true);
      const res = await TalentAPI.buildOptimalTeam(selectedRequest.id, {
        team_size: selectedRequest.team_size || 4
      });
      setTeamOptimizerResult(res.data);
      setIsTeamOptimizerModalOpen(true);
    } catch (err) {
      console.error('Failed to build team:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Assign Candidate to Project
  const handleAssignCandidate = async (empId, empName) => {
    if (!selectedRequest) return;
    try {
      await TalentAPI.assignStaffingCandidate(selectedRequest.id, empId, {
        role_in_project: 'Assigned Project Specialist',
        allocation_pct: 0.5
      });
      showToast(`Assigned ${empName} to ${selectedRequest.project_title}!`, 'success');
      // Refresh candidates
      runStaffingAnalysis(selectedRequest.id);
    } catch (err) {
      showToast('Failed to assign candidate.', 'error');
    }
  };

  // Create Staffing Request
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = newReqSkills.split(',').map(s => ({
        name: s.trim(),
        min_proficiency: 'Intermediate',
        importance: 'Essential'
      })).filter(s => s.name);

      const res = await TalentAPI.createStaffingRequest({
        project_title: newReqTitle,
        department: newReqDept,
        team_size: Number(newReqTeamSize),
        required_skills: skillsArray,
        minimum_experience: Number(newReqMinExp),
        description: newReqDesc
      });

      showToast('Staffing request created!', 'success');
      setIsNewRequestModalOpen(false);
      setRequests(prev => [res.data, ...prev]);
      setSelectedRequest(res.data);
    } catch (err) {
      showToast('Failed to create staffing request.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="atlas-surface-elevated p-6 border-l-4 border-l-cyan-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
              AI Project Staffing Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white light:text-slate-900 tracking-tight">
            Project Staffing & Squad Optimizer
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-600 max-w-2xl mt-1">
            Deterministic multi-factor scoring (Skill 30%, Experience 20%, Project Fit 20%, Verified Evidence 10%, Freshness 10%, Availability 10%) coupled with grounded Gemini 3.7 Flash explainability.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsNewRequestModalOpen(true)}
            className="atlas-btn-primary py-2.5 px-4 text-xs cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Staffing Initiative</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Staffing Requests List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Active Staffing Requisitions ({requests.length})
            </h2>
            <button 
              onClick={fetchStaffingRequests}
              className="text-slate-400 hover:text-white text-xs p-1 rounded hover:bg-slate-800"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {requests.map(req => {
              const isSelected = selectedRequest?.id === req.id;
              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-slate-900/90 light:bg-cyan-50/50 border-cyan-500/50 shadow-lg shadow-cyan-500/10' 
                      : 'bg-[#0B1120] light:bg-white border-white/[0.06] light:border-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700">
                        {req.department}
                      </span>
                      <h3 className="font-bold text-sm text-white light:text-slate-900 mt-1.5">
                        {req.project_title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                      {req.team_size} needed
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 light:text-slate-600 line-clamp-2 mt-2">
                    {req.description || 'Enterprise technical initiative requiring multi-disciplinary skill coverage.'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-800/80 light:border-slate-100">
                    <span>Min {req.minimum_experience} yrs exp</span>
                    <span className="text-cyan-400 flex items-center gap-1">
                      {req.recommendations_count || 0} candidates <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Candidate Recommendations & Squad Optimizer */}
        <div className="lg:col-span-8 space-y-4">
          {selectedRequest ? (
            <div className="space-y-4">
              {/* Selected Request Top Action Bar */}
              <div className="atlas-surface-elevated p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Candidate Ranking & Explainability</span>
                    <h2 className="text-xl font-bold text-white light:text-slate-900">
                      {selectedRequest.project_title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunTeamOptimizer}
                      disabled={analyzing}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Greedy Team Optimizer</span>
                    </button>

                    <button
                      onClick={() => runStaffingAnalysis(selectedRequest.id)}
                      disabled={analyzing}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
                      title="Refresh Analysis"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Required Skills Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono text-slate-400 mr-1">Required Skills:</span>
                  {(selectedRequest.required_skills || []).map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                      {typeof s === 'string' ? s : `${s.name} (${s.min_proficiency || 'Intermediate'})`}
                    </span>
                  ))}
                </div>
              </div>

              {/* Candidate Ranked Table */}
              <div className="space-y-3">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between px-1">
                  <span>Ranked Candidates by Deterministic Fit Score</span>
                  <span>{candidates.length} Scored Candidates</span>
                </div>

                {candidates.length === 0 && !analyzing && (
                  <div className="atlas-surface-elevated p-8 text-center text-slate-400 text-xs">
                    No candidates scored yet. Click "Refresh Analysis" to evaluate enterprise employees.
                  </div>
                )}

                {candidates.map((cand, idx) => {
                  const fitPct = Math.round(cand.overall_score * 100);
                  const isAssigned = cand.status === 'Assigned';

                  return (
                    <div 
                      key={cand.id || idx}
                      className="atlas-surface-elevated p-5 space-y-4 hover:border-cyan-500/40 transition-all border-l-4 border-l-indigo-500"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                            #{cand.rank || idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base text-white light:text-slate-900">
                                {cand.employee_name || cand.employee?.name}
                              </h4>
                              {isAssigned && (
                                <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold">
                                  Assigned to Project
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 light:text-slate-600">
                              {cand.current_role} • {cand.department}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs font-mono text-slate-400">Match Fit</div>
                            <div className="text-lg font-black text-cyan-400">
                              {fitPct}%
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-mono text-slate-400">Availability</div>
                            <div className="text-sm font-bold text-emerald-400">
                              {cand.availability_pct}% capacity
                            </div>
                          </div>

                          {!isAssigned && (
                            <button
                              onClick={() => handleAssignCandidate(cand.employee, cand.employee_name)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Assign</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Multi-Factor Score Breakdown */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-2.5 rounded-xl bg-slate-950/60 light:bg-slate-100 border border-white/[0.04] light:border-slate-200 text-center text-[10px] font-mono">
                        <div>
                          <div className="text-slate-400">Skills (30%)</div>
                          <div className="font-bold text-cyan-300">{Math.round((cand.skill_score || 0) * 100)}%</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Exp (20%)</div>
                          <div className="font-bold text-cyan-300">{Math.round((cand.experience_score || 0) * 100)}%</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Project (20%)</div>
                          <div className="font-bold text-cyan-300">{Math.round((cand.project_score || 0) * 100)}%</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Evidence (10%)</div>
                          <div className="font-bold text-emerald-300">{Math.round((cand.evidence_score || 0) * 100)}%</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Freshness (10%)</div>
                          <div className="font-bold text-amber-300">{Math.round((cand.freshness_score || 0) * 100)}%</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Avail (10%)</div>
                          <div className="font-bold text-emerald-300">{Math.round((cand.availability_score || 0) * 100)}%</div>
                        </div>
                      </div>

                      {/* Why This Person? Explanation Box */}
                      {cand.explanation && (
                        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border border-purple-500/20 text-xs text-purple-200 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-purple-400 font-bold uppercase">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span>Why This Person? (Gemini 3.7 Flash Grounded Match)</span>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-300 light:text-slate-700">
                            {cand.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="atlas-surface-elevated p-12 text-center text-slate-400 text-xs">
              Select or create a staffing requisition to inspect candidates and run team optimization.
            </div>
          )}
        </div>
      </div>

      {/* Greedy Team Optimizer Result Modal */}
      {isTeamOptimizerModalOpen && teamOptimizerResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0B1120] border border-purple-500/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold uppercase">
                  <Cpu className="w-4 h-4" />
                  <span>Greedy Complementary Squad Optimizer</span>
                </div>
                <h2 className="text-xl font-bold mt-1 text-white">
                  Optimized Team for {selectedRequest?.project_title}
                </h2>
              </div>
              <button 
                onClick={() => setIsTeamOptimizerModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            {/* Team Summary Telemetry */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-white/[0.06] text-center">
                <div className="text-[10px] font-mono text-slate-400">Team Size</div>
                <div className="text-lg font-black text-cyan-400">{teamOptimizerResult.team_size} Members</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-white/[0.06] text-center">
                <div className="text-[10px] font-mono text-slate-400">Average Squad Fit</div>
                <div className="text-lg font-black text-purple-400">{teamOptimizerResult.average_team_fit_pct}%</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-white/[0.06] text-center">
                <div className="text-[10px] font-mono text-slate-400">Squad Availability</div>
                <div className="text-lg font-black text-emerald-400">{teamOptimizerResult.average_availability_pct}%</div>
              </div>
            </div>

            {/* Selected Members */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono text-slate-400 uppercase font-bold">Recommended Squad Members</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teamOptimizerResult.selected_members?.map((member, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-white">{member.employee_name}</div>
                      <div className="text-[10px] text-slate-400">{member.current_role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-cyan-400">{Math.round(member.overall_score * 100)}% fit</div>
                      <div className="text-[9px] text-emerald-400">{member.availability_pct}% avail</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Coverage Breakdown */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono text-slate-400 uppercase font-bold">Skill Requirement Coverage Matrix</h3>
              <div className="space-y-1.5">
                {teamOptimizerResult.coverage_breakdown?.map((cov, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${cov.is_covered ? 'text-emerald-400' : 'text-rose-400'}`} />
                      <span className="font-bold text-white">{cov.skill_name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {cov.coverage_count} provider(s): <span className="text-cyan-300 font-mono">{cov.providers?.join(', ') || 'None'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Staffing Request Modal */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0B1120] border border-cyan-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-cyan-400" />
              Create Project Staffing Requisition
            </h2>

            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Project Initiative Title</label>
                <input
                  type="text"
                  required
                  value={newReqTitle}
                  onChange={(e) => setNewReqTitle(e.target.value)}
                  placeholder="e.g. NextGen Microservices Platform"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Department</label>
                  <select
                    value={newReqDept}
                    onChange={(e) => setNewReqDept(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="AI Research">AI Research</option>
                    <option value="Data Platform">Data Platform</option>
                    <option value="Cloud Architecture">Cloud Architecture</option>
                    <option value="Security">Security</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Headcount Needed</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newReqTeamSize}
                    onChange={(e) => setNewReqTeamSize(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Required Skills (Comma-separated)</label>
                <input
                  type="text"
                  required
                  value={newReqSkills}
                  onChange={(e) => setNewReqSkills(e.target.value)}
                  placeholder="e.g. Kubernetes, Go Microservices, Kafka"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Minimum Experience (Years)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newReqMinExp}
                  onChange={(e) => setNewReqMinExp(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Project Objective & Context</label>
                <textarea
                  rows="3"
                  value={newReqDesc}
                  onChange={(e) => setNewReqDesc(e.target.value)}
                  placeholder="Describe technical objectives and deliverables..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewRequestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="atlas-btn-primary py-2 px-4 text-xs cursor-pointer"
                >
                  Create Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
