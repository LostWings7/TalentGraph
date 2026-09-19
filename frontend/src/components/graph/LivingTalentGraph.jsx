import React, { useRef, useEffect, useState } from 'react';
import { GitFork } from 'lucide-react';
import { useTalent } from '../../context/TalentContext';
import { getSkillLabel, getSkillId, getProficiencyLabel } from '../../utils/formatters';

export const LivingTalentGraph = ({ skills = [], onSelectSkill }) => {
  const { theme } = useTalent();
  const canvasRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Group skills into 4 core capability clusters
  const clusters = [
    {
      id: 'aiml',
      name: 'AI, ML & Data Science',
      color: theme === 'light' ? '#0284c7' : '#22d3ee',
      keywords: ['Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Generative AI', 'RAG', 'PyTorch', 'MLOps', 'Computer Vision', 'Data Science']
    },
    {
      id: 'systems',
      name: 'Core Systems & Backend',
      color: theme === 'light' ? '#4f46e5' : '#818cf8',
      keywords: ['Python', 'Django', 'FastAPI', 'Go', 'Java', 'PostgreSQL', 'Redis', 'Node.js', 'C++', 'Backend', 'API']
    },
    {
      id: 'cloud',
      name: 'Cloud, Data Engineering & DevOps',
      color: theme === 'light' ? '#059669' : '#34d399',
      keywords: ['AWS', 'GCP', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Kafka', 'Spark', 'Airflow', 'Snowflake', 'dbt', 'SQL', 'Cloud']
    },
    {
      id: 'arch',
      name: 'Architecture, Security & Leadership',
      color: theme === 'light' ? '#d97706' : '#fbbf24',
      keywords: ['System Design', 'Software Architecture', 'Technical Leadership', 'Product Management', 'Cybersecurity', 'DevSecOps', 'Zero Trust', 'Microservices']
    }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight || 380);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight || 380;
    };
    window.addEventListener('resize', handleResize);

    // Position nodes radially per cluster
    const nodes = skills.map((skill, idx) => {
      const sName = getSkillLabel(skill);
      const sProf = getProficiencyLabel(skill);
      let cluster = clusters.find((c) => c.keywords.some((k) => sName.toLowerCase().includes(k.toLowerCase()))) || clusters[1];
      
      const clusterIdx = clusters.indexOf(cluster);
      const angleOffset = (clusterIdx * Math.PI) / 2;
      const angle = angleOffset + ((idx % 6) / 6) * (Math.PI / 2) + Math.random() * 0.2;
      const radiusDist = 60 + Math.random() * (Math.min(width, height) / 3);

      const centerX = width / 2;
      const centerY = height / 2;

      const profMap = { 'Expert': 16, 'Advanced': 13, 'Intermediate': 10, 'Beginner': 8 };
      const nodeRadius = profMap[sProf] || 11;

      return {
        id: getSkillId(skill, idx),
        skill,
        name: sName,
        proficiency: sProf,
        cluster,
        x: centerX + Math.cos(angle) * radiusDist,
        y: centerY + Math.sin(angle) * radiusDist,
        baseX: centerX + Math.cos(angle) * radiusDist,
        baseY: centerY + Math.sin(angle) * radiusDist,
        radius: nodeRadius,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        confidence: skill.confidence_score || 0.85,
      };
    });

    const isLight = theme === 'light';

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw cluster hub centers
      const hubRadius = Math.min(width, height) / 3.5;
      clusters.forEach((cluster, cIdx) => {
        const angle = (cIdx * Math.PI) / 2 + Math.PI / 4;
        const hx = width / 2 + Math.cos(angle) * hubRadius;
        const hy = height / 2 + Math.sin(angle) * hubRadius;

        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fillStyle = cluster.color;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw connection lines between related skill nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];

          // Same cluster or high proximity
          if (n1.cluster.id === n2.cluster.id) {
            const dx = n1.x - n2.x;
            const dy = n1.y - n2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 140) {
              const lineAlpha = (1 - dist / 140) * 0.4;
              ctx.beginPath();
              ctx.moveTo(n1.x, n1.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.strokeStyle = n1.cluster.color;
              ctx.globalAlpha = lineAlpha;
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          }
        }
      }

      // Draw Central Atlas Core
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 8, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? '#0284c7' : '#06b6d4';
      ctx.shadowBlur = isLight ? 0 : 15;
      ctx.shadowColor = '#06b6d4';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounded drift
        if (Math.abs(node.x - node.baseX) > 15) node.vx *= -1;
        if (Math.abs(node.y - node.baseY) > 15) node.vy *= -1;

        const isHovered = hoveredNode?.id === node.id;

        ctx.beginPath();
        ctx.arc(node.x, node.y, isHovered ? node.radius + 3 : node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.cluster.color;
        ctx.shadowBlur = isHovered ? 15 : (isLight ? 0 : 8);
        ctx.shadowColor = node.cluster.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
        ctx.font = isHovered ? 'bold 11px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + node.radius + 12);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Mouse Interaction for hover/click
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found = null;
      for (const node of nodes) {
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 6) {
          found = node;
          break;
        }
      }
      setHoveredNode(found);
      canvas.style.cursor = found ? 'pointer' : 'default';
    };

    const handleClick = () => {
      if (hoveredNode && onSelectSkill) {
        onSelectSkill(hoveredNode.skill);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [skills, theme, hoveredNode?.id]);

  return (
    <div className="atlas-surface p-5 space-y-4 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08] light:border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 light:bg-cyan-100 text-cyan-400 light:text-cyan-700 flex items-center justify-center">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white light:text-slate-900 font-mono uppercase tracking-wider">
              Living Competency Topology
            </h3>
            <p className="text-[10px] text-slate-400 light:text-slate-500">
              Interactive capability constellation • Click any skill node to inspect grounded evidence trail
            </p>
          </div>
        </div>

        {/* Cluster Legend */}
        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
          <span className="flex items-center gap-1 text-cyan-400 light:text-cyan-700">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> AI & Data
          </span>
          <span className="flex items-center gap-1 text-indigo-400 light:text-indigo-700">
            <span className="w-2 h-2 rounded-full bg-indigo-400" /> Systems
          </span>
          <span className="flex items-center gap-1 text-emerald-400 light:text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Cloud & DevOps
          </span>
          <span className="flex items-center gap-1 text-amber-400 light:text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Architecture
          </span>
        </div>
      </div>

      {/* Interactive 2D Canvas */}
      <div className="relative h-[340px] w-full rounded-xl bg-slate-950/60 light:bg-slate-50 border border-white/[0.04] light:border-slate-200 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        {hoveredNode && (
          <div className="absolute top-3 left-3 p-3 rounded-xl bg-slate-900/95 light:bg-white border border-cyan-500/40 shadow-2xl backdrop-blur-md pointer-events-none animate-in fade-in duration-150 max-w-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white light:text-slate-900">
                {hoveredNode.name}
              </span>
              <span className="atlas-badge-cyan text-[9px]">
                {hoveredNode.proficiency}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 light:text-slate-500 mt-1 flex items-center justify-between">
              <span>Cluster: {hoveredNode.cluster.name}</span>
              <span className="font-mono text-cyan-400">{Math.round((hoveredNode.confidence || 0.85) * 100)}% Conf</span>
            </div>
            <div className="text-[9px] font-mono text-cyan-300 light:text-cyan-700 mt-1.5 pt-1 border-t border-white/[0.08] light:border-slate-200">
              Click node to unfold full proof trace →
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
