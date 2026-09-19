import React, { useRef, useEffect, useState } from 'react';
import { GitFork, Sparkles, Link2 } from 'lucide-react';
import { useTalent } from '../../context/TalentContext';
import { getSkillLabel, getSkillId, getProficiencyLabel } from '../../utils/formatters';

// Comprehensive domain ontology mapping meaningful engineering, AI, cloud, and leadership synergies
const SKILL_RELATIONSHIPS = {
  // AI, ML & Data Science
  'generative ai': ['prompt engineering', 'rag', 'deep learning', 'machine learning', 'natural language processing', 'nlp', 'pytorch', 'ai agent', 'langchain', 'gemini', 'transformers', 'python', 'software architecture', 'product management'],
  'machine learning': ['deep learning', 'python', 'pytorch', 'mlops', 'data science', 'feature engineering', 'scikit-learn', 'nlp', 'computer vision', 'statistics'],
  'deep learning': ['pytorch', 'tensorflow', 'machine learning', 'neural networks', 'computer vision', 'nlp', 'generative ai', 'gpu computing', 'python'],
  'nlp': ['natural language processing', 'generative ai', 'transformers', 'machine learning', 'rag', 'llm', 'tokenization', 'python'],
  'natural language processing': ['generative ai', 'transformers', 'machine learning', 'rag', 'nlp', 'pytorch', 'python'],
  'mlops': ['machine learning', 'kubernetes', 'docker', 'ci/cd', 'model monitoring', 'data pipelines', 'python', 'devops'],
  'rag': ['generative ai', 'vector databases', 'nlp', 'retrieval augmented generation', 'langchain', 'embeddings', 'postgresql', 'python'],
  'pytorch': ['python', 'deep learning', 'machine learning', 'neural networks', 'generative ai'],
  'data science': ['machine learning', 'python', 'sql', 'statistics', 'data analysis', 'pandas'],

  // Core Systems, Backend & Languages
  'python': ['django', 'fastapi', 'machine learning', 'data science', 'backend', 'api design', 'pytorch', 'asyncio', 'postgresql', 'generative ai'],
  'django': ['python', 'postgresql', 'backend', 'rest framework', 'api design', 'redis'],
  'fastapi': ['python', 'asyncio', 'pydantic', 'backend', 'api design', 'rest api', 'docker'],
  'go': ['microservices', 'kubernetes', 'distributed systems', 'grpc', 'backend', 'concurrency', 'docker'],
  'postgresql': ['sql', 'database design', 'django', 'backend', 'query optimization', 'redis'],
  'sql': ['postgresql', 'data engineering', 'snowflake', 'bigquery', 'database design', 'data science'],
  'redis': ['caching', 'postgresql', 'backend', 'distributed systems', 'microservices'],
  'microservices': ['docker', 'kubernetes', 'grpc', 'system design', 'distributed systems', 'api gateway', 'go', 'software architecture'],
  'system design': ['distributed systems', 'microservices', 'software architecture', 'scalability', 'backend', 'technical leadership'],
  'software architecture': ['system design', 'microservices', 'technical leadership', 'domain-driven design', 'clean code', 'product management', 'cross-functional collaboration', 'generative ai'],
  'distributed systems': ['microservices', 'system design', 'kubernetes', 'kafka', 'go', 'grpc', 'scalability'],

  // Cloud, Data Platform & DevOps
  'kubernetes': ['docker', 'terraform', 'cloud architecture', 'helm', 'microservices', 'ci/cd', 'devops', 'aws', 'gcp', 'devsecops'],
  'docker': ['kubernetes', 'ci/cd', 'containerization', 'backend', 'linux', 'devops', 'microservices'],
  'terraform': ['infrastructure as code', 'aws', 'gcp', 'cloud architecture', 'kubernetes', 'devops'],
  'aws': ['cloud architecture', 'terraform', 'kubernetes', 's3', 'lambda', 'devops', 'iam', 'cloud'],
  'gcp': ['cloud architecture', 'google cloud', 'kubernetes', 'bigquery', 'terraform', 'devops', 'cloud'],
  'ci/cd': ['devops', 'docker', 'kubernetes', 'github actions', 'jenkins', 'automated testing'],
  'kafka': ['event-driven', 'spark', 'data streaming', 'distributed systems', 'microservices', 'data engineering'],
  'spark': ['kafka', 'data engineering', 'hadoop', 'python', 'sql', 'big data', 'airflow'],
  'airflow': ['data pipelines', 'etl', 'spark', 'python', 'data engineering', 'sql'],
  'snowflake': ['sql', 'data warehousing', 'data engineering', 'dbt', 'cloud data'],

  // Architecture, Security & Leadership
  'cybersecurity': ['zero trust', 'devsecops', 'network security', 'threat modeling', 'iam', 'penetration testing', 'security'],
  'security': ['cybersecurity', 'zero trust', 'devsecops', 'iam', 'governance'],
  'devsecops': ['kubernetes', 'ci/cd', 'security', 'cybersecurity', 'docker', 'cloud security'],
  'zero trust': ['cybersecurity', 'identity & access management', 'network security', 'compliance', 'security'],
  'technical leadership': ['cross-functional collaboration', 'system design', 'software architecture', 'mentorship', 'product management', 'agile'],
  'cross-functional collaboration': ['technical leadership', 'product management', 'stakeholder communication', 'agile', 'scrum', 'software architecture'],
  'product management': ['technical leadership', 'product strategy', 'agile', 'cross-functional collaboration', 'user research', 'software architecture', 'generative ai']
};

export const LivingTalentGraph = ({ skills = [], onSelectSkill }) => {
  const { theme, employeeDetail } = useTalent();
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const hoveredNodeRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Group skills into 4 core capability clusters with distinct coordinates and themes
  const clusters = [
    {
      id: 'aiml',
      name: 'AI, ML & Data Science',
      color: theme === 'light' ? '#0284c7' : '#22d3ee',
      glowColor: 'rgba(6, 182, 212, 0.4)',
      keywords: ['machine learning', 'deep learning', 'natural language', 'generative ai', 'rag', 'pytorch', 'mlops', 'computer vision', 'data science', 'ai', 'prompt engineering']
    },
    {
      id: 'systems',
      name: 'Core Systems & Backend',
      color: theme === 'light' ? '#4f46e5' : '#818cf8',
      glowColor: 'rgba(99, 102, 241, 0.4)',
      keywords: ['python', 'django', 'fastapi', 'go', 'java', 'postgresql', 'redis', 'node.js', 'c++', 'backend', 'api', 'microservices', 'distributed systems', 'sql']
    },
    {
      id: 'cloud',
      name: 'Cloud, Data Platform & DevOps',
      color: theme === 'light' ? '#059669' : '#34d399',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      keywords: ['aws', 'gcp', 'kubernetes', 'docker', 'terraform', 'ci/cd', 'kafka', 'spark', 'airflow', 'snowflake', 'dbt', 'cloud', 'devops']
    },
    {
      id: 'arch',
      name: 'Architecture, Security & Strategy',
      color: theme === 'light' ? '#d97706' : '#fbbf24',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      keywords: ['system design', 'architecture', 'leadership', 'product', 'security', 'devsecops', 'zero trust', 'governance', 'strategy', 'collaboration', 'cross-functional']
    }
  ];

  // Helper for deterministic pseudo-random distribution based on integer seed
  const deterministicPseudo = (seed) => {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  };

  // Helper to determine whether two skills have an actual semantic or co-occurrence relationship
  const areSkillsRelated = (nameA, nameB, contributions = []) => {
    const a = nameA.toLowerCase().trim();
    const b = nameB.toLowerCase().trim();

    if (a === b) return false;
    // Direct substring match
    if (a.includes(b) || b.includes(a)) return true;

    // Semantic ontology lookup
    for (const [key, targets] of Object.entries(SKILL_RELATIONSHIPS)) {
      if (a === key || a.includes(key) || key.includes(a)) {
        if (targets.some((t) => b === t || b.includes(t) || t.includes(b))) return true;
      }
      if (b === key || b.includes(key) || key.includes(b)) {
        if (targets.some((t) => a === t || a.includes(t) || t.includes(a))) return true;
      }
    }

    // Project deliverable co-occurrence check
    if (contributions && contributions.length > 0) {
      for (const c of contributions) {
        const pSkills = (c.skills_used || []).map((s) => getSkillLabel(s).toLowerCase());
        const pTech = (c.technologies_demonstrated || '').toLowerCase();
        const pSummary = (c.contribution_summary || '').toLowerCase();

        const hasA = pSkills.some((s) => s.includes(a) || a.includes(s)) || pTech.includes(a) || pSummary.includes(a);
        const hasB = pSkills.some((s) => s.includes(b) || b.includes(s)) || pTech.includes(b) || pSummary.includes(b);
        if (hasA && hasB) return true;
      }
    }

    return false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.offsetWidth || 800);
    let height = (canvas.height = canvas.parentElement.offsetHeight || 380);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth || 800;
      height = canvas.height = canvas.parentElement.offsetHeight || 380;
      initNodes();
    };
    window.addEventListener('resize', handleResize);

    const initNodes = () => {
      // 4 distinct quadrant anchor centers spread across the canvas
      const clusterAnchors = {
        aiml: { x: width * 0.22, y: height * 0.30 },    // Top-Left
        systems: { x: width * 0.78, y: height * 0.30 }, // Top-Right
        cloud: { x: width * 0.78, y: height * 0.72 },   // Bottom-Right
        arch: { x: width * 0.22, y: height * 0.72 }     // Bottom-Left
      };

      const clusterCounts = { aiml: 0, systems: 0, cloud: 0, arch: 0 };

      // Initial rough placement near their cluster anchor
      const calculatedNodes = skills.map((skill, idx) => {
        const sName = getSkillLabel(skill);
        const sProf = getProficiencyLabel(skill);
        const sNameLower = sName.toLowerCase();

        let cluster = clusters.find((c) => c.keywords.some((k) => sNameLower.includes(k))) || clusters[idx % 4];
        const countInCluster = clusterCounts[cluster.id]++;
        const anchor = clusterAnchors[cluster.id];

        // Spread skills initially in a clean radial arc around their cluster anchor
        const seed = idx * 23 + 17;
        const angle = (countInCluster * 1.3) + deterministicPseudo(seed) * 0.8;
        const initialDist = 45 + (countInCluster * 28);

        const initX = anchor.x + Math.cos(angle) * initialDist;
        const initY = anchor.y + Math.sin(angle) * initialDist;

        const profMap = { 'Expert': 14, 'Advanced': 12, 'Intermediate': 10, 'Beginner': 8 };
        const nodeRadius = profMap[sProf] || 10;

        return {
          id: getSkillId(skill, idx),
          skill,
          name: sName,
          proficiency: sProf,
          cluster,
          anchor,
          x: initX,
          y: initY,
          baseX: initX,
          baseY: initY,
          radius: nodeRadius,
          phase: (idx * 1.4) % (Math.PI * 2),
          speed: 0.0010 + (deterministicPseudo(seed + 7) * 0.0006),
          confidence: skill.confidence_score || skill.confidence || 0.85,
          connectedNeighbors: []
        };
      });

      // Force-Directed Anti-Collision Spatial Relaxation
      const minDistance = 88; // Strict minimum distance between any 2 node centers (prevents overlapping!)
      const iterations = 100;

      for (let iter = 0; iter < iterations; iter++) {
        // 1. Repel every pair of nodes if closer than minDistance
        for (let i = 0; i < calculatedNodes.length; i++) {
          for (let j = i + 1; j < calculatedNodes.length; j++) {
            const n1 = calculatedNodes[i];
            const n2 = calculatedNodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.hypot(dx, dy) || 1;

            if (dist < minDistance) {
              const overlap = (minDistance - dist) / 2;
              const nx = (dx / dist) * overlap;
              const ny = (dy / dist) * overlap;
              n1.x -= nx * 0.85;
              n1.y -= ny * 0.85;
              n2.x += nx * 0.85;
              n2.y += ny * 0.85;
            }
          }
        }

        // 2. Gravitational pull toward respective cluster anchor
        calculatedNodes.forEach((node) => {
          const dx = node.anchor.x - node.x;
          const dy = node.anchor.y - node.y;
          node.x += dx * 0.04;
          node.y += dy * 0.04;

          // 3. Keep within safe canvas margin so labels are never cut off
          const marginX = 80;
          const marginY = 40;
          node.x = Math.max(marginX, Math.min(width - marginX, node.x));
          node.y = Math.max(marginY, Math.min(height - marginY, node.y));
        });
      }

      // Lock in the relaxed baseX and baseY coordinates
      calculatedNodes.forEach((node) => {
        node.baseX = node.x;
        node.baseY = node.y;
      });

      // Calculate meaningful semantic & co-occurrence connections
      const calculatedLinks = [];
      const contributions = employeeDetail?.contributions || [];

      for (let i = 0; i < calculatedNodes.length; i++) {
        for (let j = i + 1; j < calculatedNodes.length; j++) {
          const n1 = calculatedNodes[i];
          const n2 = calculatedNodes[j];

          if (areSkillsRelated(n1.name, n2.name, contributions)) {
            calculatedLinks.push({ n1, n2, type: 'semantic' });
            n1.connectedNeighbors.push(n2.name);
            n2.connectedNeighbors.push(n1.name);
          }
        }
      }

      // If a node has 0 connections, connect it to the closest node in its cluster
      calculatedNodes.forEach((node) => {
        if (node.connectedNeighbors.length === 0) {
          let closest = null;
          let minD = Infinity;
          calculatedNodes.forEach((other) => {
            if (other.id !== node.id && other.cluster.id === node.cluster.id) {
              const d = Math.hypot(node.baseX - other.baseX, node.baseY - other.baseY);
              if (d < minD) {
                minD = d;
                closest = other;
              }
            }
          });
          if (closest) {
            calculatedLinks.push({ n1: node, n2: closest, type: 'cluster_companion' });
            node.connectedNeighbors.push(closest.name);
            closest.connectedNeighbors.push(node.name);
          }
        }
      });

      nodesRef.current = calculatedNodes;
      linksRef.current = calculatedLinks;
    };

    initNodes();

    const isLight = theme === 'light';
    let startTime = performance.now();

    const render = (time) => {
      ctx.clearRect(0, 0, width, height);
      const elapsed = time - startTime;
      const nodes = nodesRef.current;
      const links = linksRef.current;
      const activeHovered = hoveredNodeRef.current;

      // 1. Update gentle organic breathing physics without scrambling positions
      nodes.forEach((node) => {
        const driftAmount = 3.5;
        node.x = node.baseX + Math.cos(elapsed * node.speed + node.phase) * driftAmount;
        node.y = node.baseY + Math.sin(elapsed * node.speed + node.phase * 1.3) * driftAmount;
      });

      // 2. Draw Cluster Sector Anchors & Background Glow
      const clusterAnchors = {
        aiml: { x: width * 0.22, y: height * 0.30 },
        systems: { x: width * 0.78, y: height * 0.30 },
        cloud: { x: width * 0.78, y: height * 0.72 },
        arch: { x: width * 0.22, y: height * 0.72 }
      };

      clusters.forEach((cluster) => {
        const anchor = clusterAnchors[cluster.id];
        if (!anchor) return;

        // Subtle quadrant radial halo
        const grad = ctx.createRadialGradient(anchor.x, anchor.y, 10, anchor.x, anchor.y, 120);
        grad.addColorStop(0, cluster.glowColor || 'rgba(6, 182, 212, 0.12)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(anchor.x, anchor.y, 120, 0, Math.PI * 2);
        ctx.fill();

        // Cluster Hub Indicator
        ctx.beginPath();
        ctx.arc(anchor.x, anchor.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = cluster.color;
        ctx.globalAlpha = isLight ? 0.4 : 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Cluster Tag in Quadrant
        ctx.fillStyle = isLight ? '#64748b' : 'rgba(148, 163, 184, 0.6)';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(cluster.name.toUpperCase(), anchor.x, anchor.y - 12);
      });

      // 3. Draw Cluster Conduit to Center Core
      ctx.setLineDash([3, 6]);
      clusters.forEach((cluster) => {
        const anchor = clusterAnchors[cluster.id];
        ctx.beginPath();
        ctx.moveTo(width / 2, height / 2);
        ctx.lineTo(anchor.x, anchor.y);
        ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // 4. Draw Meaningful Synapses Between Related Skills
      links.forEach(({ n1, n2, type }) => {
        const isHoveredLine = activeHovered && (activeHovered.id === n1.id || activeHovered.id === n2.id);
        const isAnyHovered = !!activeHovered;

        let lineAlpha = isHoveredLine ? 0.95 : isAnyHovered ? 0.08 : (isLight ? 0.35 : 0.45);
        let lineWidth = isHoveredLine ? 2.5 : 1.4;

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        
        // Gradient stroke connecting both node colors
        const strokeColor = isHoveredLine 
          ? '#38bdf8' 
          : (n1.cluster.id === n2.cluster.id ? n1.cluster.color : (isLight ? '#64748b' : '#94a3b8'));

        ctx.strokeStyle = strokeColor;
        ctx.globalAlpha = lineAlpha;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Animated Synaptic Pulses
        if (isHoveredLine || (!isAnyHovered && Math.random() < 0.04)) {
          const t = (elapsed * 0.001 + n1.phase) % 1;
          const px = n1.x + (n2.x - n1.x) * t;
          const py = n1.y + (n2.y - n1.y) * t;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#38bdf8';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 5. Central Talent Graph Core Node
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 8, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? '#0284c7' : '#06b6d4';
      ctx.shadowBlur = isLight ? 0 : 14;
      ctx.shadowColor = '#06b6d4';
      ctx.fill();
      ctx.shadowBlur = 0;

      // 6. Draw Skill Nodes and High-Contrast Labels
      nodes.forEach((node) => {
        const isSelfHovered = activeHovered?.id === node.id;
        const isNeighborHovered = activeHovered && activeHovered.connectedNeighbors?.includes(node.name);
        const isAnyHovered = !!activeHovered;

        // Opacity: bright if self/neighbor, dimmed if unrelated
        const nodeAlpha = isSelfHovered || isNeighborHovered ? 1 : isAnyHovered ? 0.25 : 1;
        const currentRadius = isSelfHovered ? node.radius + 4 : isNeighborHovered ? node.radius + 1.5 : node.radius;

        ctx.globalAlpha = nodeAlpha;

        // Outer Glow when Hovered
        if (isSelfHovered || isNeighborHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, currentRadius + (isSelfHovered ? 6 : 3), 0, Math.PI * 2);
          ctx.fillStyle = node.cluster.glowColor || 'rgba(6, 182, 212, 0.4)';
          ctx.fill();
        }

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = node.cluster.color;
        ctx.shadowBlur = isSelfHovered ? 18 : (isLight ? 0 : 10);
        ctx.shadowColor = node.cluster.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner core dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(3, currentRadius - 4), 0, Math.PI * 2);
        ctx.fillStyle = isLight ? '#ffffff' : '#060913';
        ctx.fill();

        // Node Label with subtle backdrop pill for perfect legibility
        const labelText = node.name;
        const labelY = node.y + currentRadius + 14;
        
        ctx.font = isSelfHovered 
          ? 'bold 11px JetBrains Mono, monospace' 
          : isNeighborHovered 
          ? 'bold 10px JetBrains Mono, monospace' 
          : '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';

        const textWidth = ctx.measureText(labelText).width;
        
        // Label Backdrop Pill
        ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(6, 9, 19, 0.8)';
        ctx.beginPath();
        ctx.roundRect(node.x - textWidth / 2 - 4, labelY - 9, textWidth + 8, 14, 4);
        ctx.fill();

        // Label Text
        ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
        ctx.fillText(labelText, node.x, labelY + 1);

        ctx.globalAlpha = 1;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    // Mouse Interactions
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found = null;
      const nodes = nodesRef.current;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        if (Math.hypot(dx, dy) <= node.radius + 10) {
          found = node;
          break;
        }
      }

      if (hoveredNodeRef.current?.id !== found?.id) {
        hoveredNodeRef.current = found;
        setHoveredNode(found);
      }
      canvas.style.cursor = found ? 'pointer' : 'default';
    };

    const handleMouseLeave = () => {
      hoveredNodeRef.current = null;
      setHoveredNode(null);
      if (canvas) canvas.style.cursor = 'default';
    };

    const handleClick = () => {
      if (hoveredNodeRef.current && onSelectSkill) {
        onSelectSkill(hoveredNodeRef.current.skill);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
        canvas.removeEventListener('click', handleClick);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [skills, theme, employeeDetail]);

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
              Force-directed capability constellation • Hover to focus synapses • Click any node to inspect evidence trace
            </p>
          </div>
        </div>

        {/* Cluster Legend */}
        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
          <span className="flex items-center gap-1 text-cyan-400 light:text-cyan-700">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> AI & ML
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
        <canvas ref={canvasRef} className="w-full h-full block" />

        {hoveredNode && (
          <div className="absolute top-3 left-3 p-3.5 rounded-xl bg-slate-900/95 light:bg-white border border-cyan-500/40 shadow-2xl backdrop-blur-md pointer-events-none animate-in fade-in duration-150 max-w-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white light:text-slate-900">
                {hoveredNode.name}
              </span>
              <span className="atlas-badge-cyan text-[9px]">
                {hoveredNode.proficiency}
              </span>
            </div>
            
            <div className="text-[10px] text-slate-400 light:text-slate-500 flex items-center justify-between">
              <span>Cluster: {hoveredNode.cluster.name}</span>
              <span className="font-mono text-cyan-400 font-bold">{Math.round((hoveredNode.confidence || 0.85) * 100)}% Conf</span>
            </div>

            {/* Synergistic Connections Preview */}
            {hoveredNode.connectedNeighbors && hoveredNode.connectedNeighbors.length > 0 && (
              <div className="text-[10px] font-mono text-slate-300 light:text-slate-700 pt-1.5 border-t border-white/[0.06] light:border-slate-200 space-y-1">
                <div className="flex items-center gap-1 text-cyan-400 light:text-cyan-700 font-bold">
                  <Link2 className="w-3 h-3" />
                  <span>Related Synergies ({hoveredNode.connectedNeighbors.length}):</span>
                </div>
                <div className="text-[9px] text-slate-400 light:text-slate-600 line-clamp-2">
                  {hoveredNode.connectedNeighbors.join(', ')}
                </div>
              </div>
            )}

            <div className="text-[9px] font-mono text-cyan-300 light:text-cyan-700 pt-1 border-t border-white/[0.06] light:border-slate-200 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Click node to inspect grounded proof trace →</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
