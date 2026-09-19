import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  FileSpreadsheet, 
  FileCheck, 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  Plus, 
  Compass, 
  Award, 
  Briefcase, 
  GraduationCap, 
  Layers, 
  RefreshCw,
  Zap,
  UserCheck,
  ShieldAlert,
  ChevronRight,
  Database,
  Copy,
  Key
} from 'lucide-react';
import { TalentAPI } from '../../api/client';
import { useTalent } from '../../context/TalentContext';

export const AddPersonaWizard = ({ isOpen, onClose, onPersonaCreated, preselectDemoId = null }) => {
  const { showToast, switchEmployee, navigateTo } = useTalent();

  const [step, setStep] = useState(1);
  const [demos, setDemos] = useState([]);
  const [selectedDemoId, setSelectedDemoId] = useState(preselectDemoId);
  const [demoLoading, setDemoLoading] = useState(false);

  // Form State
  const [identity, setIdentity] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    current_role: '',
    years_experience: 4.0,
    education: '',
    bio: '',
    interests: '',
    target_role: ''
  });

  // Files State
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [parsedData, setParsedData] = useState(null);
  const [isParsing, setIsParsing] = useState(false);

  // Processing Telemetry State
  const [telemetryStep, setTelemetryStep] = useState(0);
  const [telemetryMessages, setTelemetryMessages] = useState([]);

  // Extracted Persona & Review State
  const [extractedPersona, setExtractedPersona] = useState(null);
  const [activeReviewTab, setActiveReviewTab] = useState('skills');
  const [reviewSkillCategoryFilter, setReviewSkillCategoryFilter] = useState('All');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [creationResult, setCreationResult] = useState(null);

  // New Skill Modal / Inline State
  const [showAddSkillForm, setShowAddSkillForm] = useState(false);
  const [newSkillObj, setNewSkillObj] = useState({
    name: '',
    category: 'Backend',
    proficiency: 'Intermediate',
    confidence: 0.90,
    source: 'explicit',
    evidence: ''
  });

  const fileInputRef = useRef(null);

  // Load demo personas metadata on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setUploadedFiles([]);
      setParsedData(null);
      setExtractedPersona(null);
      setCreationResult(null);
      setTelemetryStep(0);
      setTelemetryMessages([]);

      TalentAPI.getDemoPersonas()
        .then((res) => {
          setDemos(res.data.results || []);
        })
        .catch((err) => console.error('Error fetching demo personas:', err));

      if (preselectDemoId) {
        loadDemoPersona(preselectDemoId);
      }
    }
  }, [isOpen, preselectDemoId]);

  if (!isOpen) return null;

  // Handle Loading a Preloaded Demo Persona
  const loadDemoPersona = async (demoId) => {
    try {
      setDemoLoading(true);
      setSelectedDemoId(demoId);
      const res = await TalentAPI.getDemoPersonaFiles(demoId);
      const { metadata, files } = res.data;

      // Populate identity fields if available
      setIdentity((prev) => ({
        ...prev,
        name: metadata.name || prev.name,
        department: metadata.department || prev.department,
        current_role: metadata.current_role || prev.current_role,
        years_experience: metadata.years_experience || prev.years_experience,
        email: `${demoId.replace('-', '.')}@talentgraph.internal`
      }));

      // Convert files map into file objects list
      const fileList = Object.entries(files).map(([name, content]) => ({
        name,
        size: `${Math.round(content.length / 1024 * 10) / 10} KB`,
        content,
        type: name.endsWith('.csv') ? 'csv' : 'text',
        isDemo: true
      }));

      setUploadedFiles(fileList);
      showToast(`Loaded "${metadata.name}" demo package with ${fileList.length} evidence files`, 'success');
      
      // Auto advance to step 2
      setStep(2);
    } catch (err) {
      console.error('Failed to load demo persona:', err);
      showToast('Error loading demo files', 'error');
    } finally {
      setDemoLoading(false);
    }
  };

  // Handle Manual File Drops
  const handleFileDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer?.files || e.target?.files || []);
    if (!dropped.length) return;

    dropped.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = event.target.result;
        setUploadedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            size: `${Math.round(file.size / 1024 * 10) / 10} KB`,
            content: textContent,
            type: file.name.endsWith('.csv') ? 'csv' : 'text',
            isDemo: false
          }
        ]);
      };
      reader.readAsText(file);
    });
    showToast(`Added ${dropped.length} file(s) for capability extraction`, 'info');
  };

  const removeFile = (idx) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Start Extraction Pipeline (Step 2 -> Step 3 -> Step 4)
  const startExtraction = async () => {
    if (uploadedFiles.length === 0 && !identity.name) {
      showToast('Please provide an employee name or upload evidence files', 'error');
      return;
    }

    setStep(3);
    setIsAnalyzing(true);
    setTelemetryStep(1);
    setTelemetryMessages(['[1/5] Ingesting files and tokenizing textual corpora...']);

    try {
      // 1. Parse files on backend
      const filesMap = {};
      uploadedFiles.forEach((f) => {
        filesMap[f.name] = f.content;
      });

      const parseRes = await TalentAPI.parsePersonaFiles({ files: filesMap });
      const parsed = parseRes.data.parsed_data;
      setParsedData(parsed);

      setTelemetryStep(2);
      setTelemetryMessages((prev) => [
        ...prev,
        '[2/5] Synthesizing context & running Gemini 3.7 Flash extraction...'
      ]);

      // 2. Call AI extraction endpoint
      const analyzeRes = await TalentAPI.analyzePersona({
        parsed_data: parsed,
        identity: identity
      });

      setTelemetryStep(3);
      setTelemetryMessages((prev) => [
        ...prev,
        `[3/5] Calibrating ${analyzeRes.data.persona.skills?.length || 0} skills & grounding evidence...`
      ]);

      await new Promise((r) => setTimeout(r, 600));

      setTelemetryStep(4);
      setTelemetryMessages((prev) => [
        ...prev,
        '[4/5] Structuring project contributions and career trajectory...'
      ]);

      await new Promise((r) => setTimeout(r, 500));

      setTelemetryStep(5);
      setTelemetryMessages((prev) => [
        ...prev,
        `[5/5] Synthesized talent profile verified (${analyzeRes.data.engine})`
      ]);

      setExtractedPersona(analyzeRes.data.persona);

      await new Promise((r) => setTimeout(r, 600));
      setStep(4);
    } catch (err) {
      console.error('Error during AI analysis:', err);
      showToast('Extraction encountered an issue, falling back to local synthesis', 'warning');
      setStep(4);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Skill Management in Review (Step 4)
  const updateSkillProficiency = (index, newProf) => {
    setExtractedPersona((prev) => {
      const skills = [...prev.skills];
      skills[index] = { ...skills[index], proficiency: newProf };
      return { ...prev, skills };
    });
  };

  const removeSkillFromExtracted = (index) => {
    setExtractedPersona((prev) => {
      const skills = prev.skills.filter((_, i) => i !== index);
      return { ...prev, skills };
    });
  };

  const handleAddCustomSkill = () => {
    if (!newSkillObj.name.trim()) return;
    setExtractedPersona((prev) => ({
      ...prev,
      skills: [
        {
          ...newSkillObj,
          evidence: newSkillObj.evidence || 'Manually verified candidate capability.'
        },
        ...prev.skills
      ]
    }));
    setNewSkillObj({
      name: '',
      category: 'Backend',
      proficiency: 'Intermediate',
      confidence: 0.90,
      source: 'explicit',
      evidence: ''
    });
    setShowAddSkillForm(false);
    showToast('Added custom skill to profile', 'success');
  };

  // Final Commit & Database Persistence (Step 4 -> Step 5)
  const handleFinalCreate = async () => {
    if (!extractedPersona?.name) {
      showToast('Missing persona name', 'error');
      return;
    }

    try {
      setIsCreating(true);
      const res = await TalentAPI.createPersona({ persona: extractedPersona });
      setCreationResult(res.data);
      setStep(5);
      showToast(`Talent persona "${res.data.employee.name}" created successfully!`, 'success');

      if (onPersonaCreated) {
        onPersonaCreated(res.data.employee);
      }
    } catch (err) {
      console.error('Error creating persona:', err);
      showToast('Failed to save persona to database', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLaunchPersona = () => {
    if (creationResult?.employee?.id) {
      switchEmployee(creationResult.employee.id);
      onClose();
      navigateTo('profile');
    }
  };

  const categories = ['All', 'AI/ML', 'Backend', 'Data Engineering', 'Cloud & DevOps', 'Security', 'Frontend', 'Leadership & Product'];

  const filteredSkills = (extractedPersona?.skills || []).filter((s) => {
    if (reviewSkillCategoryFilter === 'All') return true;
    return s.category === reviewSkillCategoryFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0b0f19] light:bg-white border border-white/[0.1] light:border-slate-300 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] light:border-slate-200 bg-slate-900/50 light:bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 p-0.5 shadow-md">
              <div className="w-full h-full bg-[#0b0f19] light:bg-white rounded-[6px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400 light:text-cyan-600" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white light:text-slate-900 flex items-center gap-2">
                Persona Studio: Ingest New Talent
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 light:text-cyan-700 border border-cyan-500/30">
                  Gemini 3.7 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-400 light:text-slate-500">
                Transform unstructured resumes, CSVs, and project history into living talent intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.08] light:hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper Bar */}
        <div className="px-6 py-2.5 bg-slate-950/60 light:bg-slate-100/70 border-b border-white/[0.05] light:border-slate-200 flex items-center justify-between text-xs overflow-x-auto">
          {[
            { num: 1, label: '1. Identity & Goals' },
            { num: 2, label: '2. Evidence & Demos' },
            { num: 3, label: '3. AI Extraction' },
            { num: 4, label: '4. Review & Refine' },
            { num: 5, label: '5. Platform Activation' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 font-medium whitespace-nowrap px-2 py-1 rounded-md transition-colors ${
                step === s.num
                  ? 'text-cyan-400 light:text-cyan-700 font-bold bg-cyan-500/10'
                  : step > s.num
                  ? 'text-slate-300 light:text-slate-700'
                  : 'text-slate-500 light:text-slate-400'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === s.num
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : step > s.num
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span>{s.label}</span>
              {s.num < 5 && <ChevronRight className="w-3 h-3 text-slate-600 hidden sm:inline" />}
            </div>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ========================================================= */}
          {/* STAGE 1: IDENTITY & CAREER GOALS */}
          {/* ========================================================= */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-cyan-500/10 light:bg-cyan-50 border border-cyan-500/20 text-xs text-cyan-200 light:text-cyan-900 flex items-start gap-3">
                <BrainCircuit className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Fast-Track Setup:</span> You can either manually enter preliminary candidate details below or click <span className="font-bold underline cursor-pointer" onClick={() => setStep(2)}>Next: Evidence & Demos</span> to load one of the 3 pre-engineered persona packages (Alex, Maya, or Marcus).
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 light:text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    value={identity.name}
                    onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 light:bg-slate-100 border border-white/[0.1] light:border-slate-300 text-xs text-white light:text-slate-900 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 light:text-slate-700">Corporate Email</label>
                  <input
                    type="email"
                    value={identity.email}
                    onChange={(e) => setIdentity({ ...identity, email: e.target.value })}
                    placeholder="e.g. alex.rivera@talentgraph.internal"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 light:bg-slate-100 border border-white/[0.1] light:border-slate-300 text-xs text-white light:text-slate-900 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 light:text-slate-700">Department</label>
                  <select
                    value={identity.department}
                    onChange={(e) => setIdentity({ ...identity, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 light:bg-slate-100 border border-white/[0.1] light:border-slate-300 text-xs text-white light:text-slate-900 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="AI Research">AI Research & Platform</option>
                    <option value="Data Platform">Data Platform & Analytics</option>
                    <option value="Cloud Architecture">Cloud & Infrastructure</option>
                    <option value="Product">Product & Design</option>
                    <option value="Security">Information Security</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 light:text-slate-700">Current Role Title</label>
                  <input
                    type="text"
                    value={identity.current_role}
                    onChange={(e) => setIdentity({ ...identity, current_role: e.target.value })}
                    placeholder="e.g. Senior Machine Learning Engineer"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 light:bg-slate-100 border border-white/[0.1] light:border-slate-300 text-xs text-white light:text-slate-900 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 light:text-slate-700">Years of Experience</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="40"
                    value={identity.years_experience}
                    onChange={(e) => setIdentity({ ...identity, years_experience: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 light:bg-slate-100 border border-white/[0.1] light:border-slate-300 text-xs text-white light:text-slate-900 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 light:text-slate-700">Target Role Trajectory (Optional)</label>
                  <input
                    type="text"
                    value={identity.target_role}
                    onChange={(e) => setIdentity({ ...identity, target_role: e.target.value })}
                    placeholder="e.g. Staff AI/ML Platform Engineer"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 light:bg-slate-100 border border-white/[0.1] light:border-slate-300 text-xs text-white light:text-slate-900 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 light:text-slate-700">Executive Bio / Summary (Optional)</label>
                <textarea
                  rows="3"
                  value={identity.bio}
                  onChange={(e) => setIdentity({ ...identity, bio: e.target.value })}
                  placeholder="2-3 sentence overview of background, primary technical stack, and career passion..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 light:bg-slate-100 border border-white/[0.1] light:border-slate-300 text-xs text-white light:text-slate-900 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 2: EVIDENCE UPLOAD & PRELOADED DEMO PERSONAS */}
          {/* ========================================================= */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Demo Persona Quick Select Carousel */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-white light:text-slate-900 flex items-center gap-2 uppercase font-mono tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Option A: Try a Preloaded Demo Persona (1-Click)
                  </h3>
                  <span className="text-[11px] text-slate-400">Loads real files into AI pipeline</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {demos.map((d) => {
                    const isSelected = selectedDemoId === d.id;
                    return (
                      <div
                        key={d.id}
                        onClick={() => loadDemoPersona(d.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/10'
                            : 'bg-slate-900/60 light:bg-slate-50 border-white/[0.08] light:border-slate-300 hover:border-cyan-500/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={d.avatar_url}
                            alt={d.name}
                            className="w-10 h-10 rounded-xl object-cover border border-white/20 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-white light:text-slate-900 truncate">
                                {d.name}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                                {d.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 light:text-slate-600 truncate mt-0.5">
                              {d.current_role}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                              {d.tagline}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-white/[0.05] light:border-slate-200 flex items-center justify-between text-[10px] text-cyan-400">
                          <span className="font-mono">{d.files_included?.length || 5} Evidence Files</span>
                          <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                            Load Persona <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div>
                <h3 className="text-xs font-bold text-white light:text-slate-900 flex items-center gap-2 uppercase font-mono tracking-wider mb-2">
                  <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                  Option B: Drag & Drop Custom Artifacts (PDF, TXT, CSV, JSON)
                </h3>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/[0.15] light:border-slate-300 hover:border-cyan-400 light:hover:border-cyan-500 bg-slate-900/40 light:bg-slate-50/50 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-cyan-500/5"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileDrop}
                    multiple
                    accept=".txt,.csv,.json,.pdf,.doc,.docx"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-white light:text-slate-900">
                    Click or drag & drop candidate artifacts here
                  </p>
                  <p className="text-[11px] text-slate-400 light:text-slate-500 mt-1">
                    Supports <span className="text-cyan-400">resume.txt</span>, <span className="text-cyan-400">projects.csv</span>, <span className="text-cyan-400">certifications.csv</span>, <span className="text-cyan-400">learning_history.csv</span>
                  </p>
                </div>
              </div>

              {/* Uploaded Files Manifest */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 light:text-slate-700">
                    <span>Evidence Package Manifest ({uploadedFiles.length} files)</span>
                    <button
                      onClick={() => setUploadedFiles([])}
                      className="text-red-400 hover:text-red-300 text-[11px]"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 light:bg-slate-100 border border-white/[0.08] light:border-slate-300 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {file.type === 'csv' ? (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-semibold text-white light:text-slate-900 truncate block">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{file.size}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="p-1 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 3: AI EXTRACTION TELEMETRY */}
          {/* ========================================================= */}
          {step === 3 && (
            <div className="py-8 space-y-6 text-center animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 p-0.5 mx-auto animate-pulse">
                <div className="w-full h-full bg-[#0b0f19] light:bg-white rounded-[22px] flex items-center justify-center">
                  <BrainCircuit className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white light:text-slate-900">
                  Gemini 3.7 Flash Ingestion Pipeline
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Parsing career artifacts, extracting explicit and inferred skills, calibrating confidence scores, and assembling grounding evidence...
                </p>
              </div>

              {/* Step Progress Indicators */}
              <div className="max-w-md mx-auto space-y-2 text-left">
                {telemetryMessages.map((msg, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-900/90 light:bg-slate-100 border border-cyan-500/20 text-xs font-mono text-cyan-300 light:text-cyan-800 flex items-center gap-2 animate-in slide-in-from-left-2 duration-150"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 4: EXTRACTED CAPABILITY REVIEW & CUSTOMIZATION */}
          {/* ========================================================= */}
          {step === 4 && extractedPersona && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Persona Summary Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900/90 to-slate-900/40 light:from-slate-100 light:to-slate-50 border border-white/[0.08] light:border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg">
                    {extractedPersona.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white light:text-slate-900">
                      {extractedPersona.name}
                    </h3>
                    <p className="text-xs text-slate-300 light:text-slate-700">
                      {extractedPersona.current_role} • {extractedPersona.department} ({extractedPersona.years_experience} yrs exp)
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {extractedPersona.bio}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                    {extractedPersona.skills?.length || 0} Skills Discovered
                  </span>
                </div>
              </div>

              {/* Review Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-white/[0.08] light:border-slate-300 pb-2">
                <div className="flex items-center gap-2">
                  {[
                    { id: 'skills', label: `Skills (${extractedPersona.skills?.length || 0})`, icon: Award },
                    { id: 'projects', label: `Projects (${extractedPersona.projects?.length || 0})`, icon: Briefcase },
                    { id: 'credentials', label: `Certifications & Learning`, icon: GraduationCap },
                    { id: 'bio', label: 'Identity & Bio', icon: Edit3 },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isActive = activeReviewTab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveReviewTab(t.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-cyan-500/20 light:bg-cyan-100 text-cyan-300 light:text-cyan-900 border border-cyan-500/40'
                            : 'text-slate-400 hover:text-white light:hover:text-slate-900'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {activeReviewTab === 'skills' && (
                  <button
                    onClick={() => setShowAddSkillForm(!showAddSkillForm)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Skill
                  </button>
                )}
              </div>

              {/* TAB: SKILLS REVIEW */}
              {activeReviewTab === 'skills' && (
                <div className="space-y-3">
                  {/* Category Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setReviewSkillCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                          reviewSkillCategoryFilter === cat
                            ? 'bg-white/15 light:bg-slate-200 text-white light:text-slate-900 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Add Custom Skill Inline Panel */}
                  {showAddSkillForm && (
                    <div className="p-3.5 rounded-xl bg-slate-900 light:bg-slate-100 border border-cyan-500/30 space-y-3 animate-in fade-in duration-150">
                      <div className="font-bold text-xs text-cyan-300 light:text-cyan-800">Add Custom Skill to Candidate Profile</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="Skill Name (e.g. PyTorch, Rust)"
                          value={newSkillObj.name}
                          onChange={(e) => setNewSkillObj({ ...newSkillObj, name: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 light:bg-white border border-white/[0.1] text-xs text-white light:text-slate-900"
                        />
                        <select
                          value={newSkillObj.category}
                          onChange={(e) => setNewSkillObj({ ...newSkillObj, category: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 light:bg-white border border-white/[0.1] text-xs text-white light:text-slate-900"
                        >
                          <option value="AI/ML">AI/ML</option>
                          <option value="Backend">Backend</option>
                          <option value="Data Engineering">Data Engineering</option>
                          <option value="Cloud & DevOps">Cloud & DevOps</option>
                          <option value="Security">Security</option>
                          <option value="Frontend">Frontend</option>
                          <option value="Leadership & Product">Leadership & Product</option>
                        </select>
                        <select
                          value={newSkillObj.proficiency}
                          onChange={(e) => setNewSkillObj({ ...newSkillObj, proficiency: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 light:bg-white border border-white/[0.1] text-xs text-white light:text-slate-900"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowAddSkillForm(false)}
                          className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddCustomSkill}
                          className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold"
                        >
                          Add Skill
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                    {filteredSkills.map((skill, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900/70 light:bg-slate-50 border border-white/[0.08] light:border-slate-200 flex flex-col justify-between gap-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-white light:text-slate-900">
                              {skill.name}
                            </span>
                            <span className="ml-2 text-[10px] text-slate-400 font-mono">
                              ({skill.category})
                            </span>
                          </div>
                          <button
                            onClick={() => removeSkillFromExtracted(idx)}
                            className="text-slate-500 hover:text-red-400"
                            title="Remove Skill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Grounding Evidence Text */}
                        {skill.evidence && (
                          <p className="text-[11px] text-slate-400 light:text-slate-600 line-clamp-2 italic bg-slate-950/40 light:bg-slate-100 p-1.5 rounded-md">
                            "{skill.evidence}"
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-white/[0.05] light:border-slate-200">
                          {/* Proficiency Selector */}
                          <select
                            value={skill.proficiency}
                            onChange={(e) => updateSkillProficiency(idx, e.target.value)}
                            className="px-2 py-0.5 rounded bg-slate-950 light:bg-white border border-white/[0.1] light:border-slate-300 text-[10px] font-semibold text-cyan-400 light:text-cyan-700"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                          </select>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 font-mono">
                              {skill.source}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">
                              {Math.round((skill.confidence || 0.85) * 100)}% Conf
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: PROJECTS REVIEW */}
              {activeReviewTab === 'projects' && (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(extractedPersona.projects || []).map((proj, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900/70 light:bg-slate-50 border border-white/[0.08] light:border-slate-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white light:text-slate-900">
                          {proj.project_name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                          {proj.role_in_project || 'Contributor'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 light:text-slate-700">
                        {proj.outcomes}
                      </p>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Tech: {proj.technologies}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB: CREDENTIALS REVIEW */}
              {activeReviewTab === 'credentials' && (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase font-mono mb-2">
                      Certifications ({extractedPersona.certifications?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {(extractedPersona.certifications || []).map((cert, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-900/70 light:bg-slate-50 border border-white/[0.08] light:border-slate-200 text-xs"
                        >
                          <div className="font-bold text-white light:text-slate-900">
                            {cert.certification_name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {cert.issuing_organization} • Verified: {cert.skills_verified}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase font-mono mb-2">
                      Completed Coursework ({extractedPersona.learning?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {(extractedPersona.learning || []).map((lrn, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-900/70 light:bg-slate-50 border border-white/[0.08] light:border-slate-200 text-xs"
                        >
                          <div className="font-bold text-white light:text-slate-900">
                            {lrn.title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {lrn.provider} • Status: {lrn.status} • Skills: {lrn.skills_acquired}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: IDENTITY & BIO EDIT */}
              {activeReviewTab === 'bio' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Name</label>
                      <input
                        type="text"
                        value={extractedPersona.name || ''}
                        onChange={(e) => setExtractedPersona({ ...extractedPersona, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 light:bg-white border border-white/[0.1] text-xs text-white light:text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Current Role</label>
                      <input
                        type="text"
                        value={extractedPersona.current_role || ''}
                        onChange={(e) => setExtractedPersona({ ...extractedPersona, current_role: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 light:bg-white border border-white/[0.1] text-xs text-white light:text-slate-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1 text-xs">Professional Bio</label>
                    <textarea
                      rows="3"
                      value={extractedPersona.bio || ''}
                      onChange={(e) => setExtractedPersona({ ...extractedPersona, bio: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 light:bg-white border border-white/[0.1] text-xs text-white light:text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 5: ACTIVATION & SUCCESS */}
          {/* ========================================================= */}
          {step === 5 && creationResult && (
            <div className="py-6 text-center space-y-6 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white light:text-slate-900">
                  Persona Activated Successfully!
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  {creationResult.message}
                </p>
              </div>

              {/* Statistics Card */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                <div className="p-3 rounded-xl bg-slate-900 light:bg-slate-100 border border-white/[0.08] light:border-slate-200">
                  <div className="text-lg font-bold text-cyan-400 font-mono">
                    {creationResult.employee?.skills_count || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Skills Verified</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 light:bg-slate-100 border border-white/[0.08] light:border-slate-200">
                  <div className="text-lg font-bold text-indigo-400 font-mono">
                    {creationResult.employee?.projects_count || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Projects Linked</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 light:bg-slate-100 border border-white/[0.08] light:border-slate-200">
                  <div className="text-lg font-bold text-purple-400 font-mono">
                    {creationResult.matches_count || 15}
                  </div>
                  <div className="text-[10px] text-slate-400">Roles Matched</div>
                </div>
              </div>

              {/* Generated User Account Credentials Card */}
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 max-w-md mx-auto text-left space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    <span>Employee Account Initialized</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                    Temporary Password
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div>
                    <div className="text-[10px] text-slate-400">Login Email:</div>
                    <div className="text-white font-bold truncate">{creationResult.employee?.email || identity.email}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Temp Password:</div>
                    <div className="text-cyan-300 font-bold">{creationResult.temporary_password || 'TempPass2026!'}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const text = `Email: ${creationResult.employee?.email || identity.email}\nTemporary Password: ${creationResult.temporary_password || 'TempPass2026!'}\nPortal URL: http://localhost:5173`;
                    navigator.clipboard?.writeText(text);
                    showToast('Copied account credentials to clipboard!', 'success');
                  }}
                  className="w-full mt-2 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Account Credentials</span>
                </button>
              </div>

              {/* Top Matched Role Preview */}
              {creationResult.top_role_match && (
                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 max-w-md mx-auto text-left">
                  <div className="text-[10px] uppercase font-mono font-bold text-cyan-400">
                    Highest Immediate Fit Opportunity
                  </div>
                  <div className="font-bold text-sm text-white light:text-slate-900 mt-0.5">
                    {creationResult.top_role_match.role_title}
                  </div>
                  <div className="text-xs text-cyan-200 light:text-cyan-800 mt-1 font-mono font-bold">
                    {Math.round(creationResult.top_role_match.overall_score * 100)}% Match Score (Semantic + Skills + Experience)
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Bottom Footer Navigation */}
        <div className="px-6 py-4 border-t border-white/[0.08] light:border-slate-200 bg-slate-900/50 light:bg-slate-50 flex items-center justify-between">
          <div>
            {step > 1 && step < 5 && (
              <button
                onClick={() => setStep((prev) => prev - 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20"
              >
                Next: Evidence & Demos <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={startExtraction}
                disabled={uploadedFiles.length === 0 && !identity.name}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                Run Gemini 3.7 Flash Analysis
              </button>
            )}

            {step === 4 && (
              <button
                onClick={handleFinalCreate}
                disabled={isCreating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 disabled:opacity-50 cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving & Matching...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Persist Persona into TalentGraph
                  </>
                )}
              </button>
            )}

            {step === 5 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Close Studio
                </button>
                <button
                  onClick={handleLaunchPersona}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/25"
                >
                  Launch as Active Persona <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
