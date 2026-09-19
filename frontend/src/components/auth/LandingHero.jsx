import React, { useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  ArrowRight, 
  Users, 
  ShieldCheck, 
  Compass, 
  Layers, 
  GitFork, 
  Award, 
  CheckCircle2,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { useTalent } from '../../context/TalentContext';
import { ThemeToggle } from '../common/ThemeToggle';

export const LandingHero = ({ onEnterEmployee, onEnterHR, onOpenPersonaModal }) => {
  const { aiStatus, theme } = useTalent();
  const canvasRef = useRef(null);

  // Dynamic Living Talent Constellation Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate constellation nodes (People, Skills, Roles, Evidence)
    const nodeTypes = ['person', 'skill', 'role', 'evidence', 'project'];
    const nodes = Array.from({ length: 42 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2.5 + 2,
      type: nodeTypes[Math.floor(Math.random() * nodeTypes.length)],
      alpha: Math.random() * 0.6 + 0.4,
    }));

    const isLight = theme === 'light';

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const lineAlpha = (1 - dist / 120) * 0.25;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = isLight 
              ? `rgba(2, 132, 199, ${lineAlpha})` 
              : `rgba(6, 182, 212, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

        let nodeColor;
        if (node.type === 'person') nodeColor = isLight ? '#0284c7' : '#38bdf8';
        else if (node.type === 'skill') nodeColor = isLight ? '#4f46e5' : '#818cf8';
        else if (node.type === 'role') nodeColor = isLight ? '#059669' : '#34d399';
        else nodeColor = isLight ? '#d97706' : '#fbbf24';

        ctx.fillStyle = nodeColor;
        ctx.shadowBlur = isLight ? 0 : 8;
        ctx.shadowColor = nodeColor;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#060913] light:bg-[#f8fafc] text-white light:text-slate-900 transition-colors">
      {/* Background Interactive Constellation */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Top Brand Bar */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#060913] light:bg-slate-900 rounded-[10px] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white light:text-slate-900">
                TalentGraph
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 light:text-cyan-700 border border-cyan-500/35 font-mono">
                AI
              </span>
            </div>
            <p className="text-[9px] text-slate-400 light:text-slate-500 font-mono tracking-widest uppercase">
              The Living Talent Atlas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 light:bg-white border border-white/[0.08] light:border-slate-300 text-[11px] font-mono text-cyan-400 light:text-cyan-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini 3.7 Flash Engine</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Value Proposition Hero */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 text-center flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 light:bg-cyan-100 border border-cyan-500/30 light:border-cyan-300 text-xs font-semibold text-cyan-300 light:text-cyan-800">
          <GitFork className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
          <span>Internal Talent Mobility & Decision Support Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] max-w-4xl">
          See the talent beyond <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            the job title.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 light:text-slate-600 max-w-2xl font-normal leading-relaxed">
          Map human capability as an interconnected living topology. Discover hidden competencies, simulate career readiness in real-time, and close enterprise skill gaps with grounded evidence.
        </p>

        {/* Action Gateway */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full sm:w-auto">
          {/* Employee Entry Button */}
          <button
            onClick={onEnterEmployee}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
          >
            <Users className="w-4 h-4" />
            <span>Continue as Employee</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* HR Executive Entry Button */}
          <button
            onClick={onEnterHR}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 light:bg-white light:hover:bg-slate-100 border border-white/[0.12] light:border-slate-300 text-white light:text-slate-900 font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 light:text-emerald-600" />
            <span>Enter as HR Leader</span>
          </button>

          {/* Switch Persona Trigger */}
          <button
            onClick={onOpenPersonaModal}
            className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-slate-950/60 light:bg-slate-100/80 hover:bg-slate-900 light:hover:bg-slate-200 border border-cyan-500/30 text-cyan-300 light:text-cyan-800 font-mono text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Pick Persona (30 Seeded)</span>
          </button>
        </div>

        {/* Product Model Flow Pills */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl text-left">
          <div className="p-3 rounded-xl bg-slate-900/60 light:bg-white border border-white/[0.06] light:border-slate-200">
            <div className="text-[10px] font-mono text-cyan-400 light:text-cyan-600 font-bold">01. CAPABILITY</div>
            <div className="text-xs font-semibold text-slate-200 light:text-slate-800 mt-0.5">Evidence-Grounded Skills</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 light:bg-white border border-white/[0.06] light:border-slate-200">
            <div className="text-[10px] font-mono text-indigo-400 light:text-indigo-600 font-bold">02. OPPORTUNITY</div>
            <div className="text-xs font-semibold text-slate-200 light:text-slate-800 mt-0.5">Hybrid Role Matching</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 light:bg-white border border-white/[0.06] light:border-slate-200">
            <div className="text-[10px] font-mono text-emerald-400 light:text-emerald-600 font-bold">03. READINESS</div>
            <div className="text-xs font-semibold text-slate-200 light:text-slate-800 mt-0.5">Live What-If Simulator</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 light:bg-white border border-white/[0.06] light:border-slate-200">
            <div className="text-[10px] font-mono text-amber-400 light:text-amber-600 font-bold">04. GUIDANCE</div>
            <div className="text-xs font-semibold text-slate-200 light:text-slate-800 mt-0.5">AI Career Copilot</div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 border-t border-white/[0.06] light:border-slate-200 text-xs text-slate-400 light:text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          TalentGraph AI • Enterprise Workforce Topology & Mobility Engine
        </div>
        <div className="font-mono text-[11px] text-cyan-400 light:text-cyan-700">
          Powered by Google Gemini 3.7 Flash
        </div>
      </footer>
    </div>
  );
};
