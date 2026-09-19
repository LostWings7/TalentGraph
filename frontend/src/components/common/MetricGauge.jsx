import React, { useEffect, useState } from 'react';

export const MetricGauge = ({ 
  score = 0, 
  size = 64, 
  strokeWidth = 6, 
  label = '', 
  sublabel = '',
  color = '#06b6d4',
  showPercentage = true,
  animate = true
}) => {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      return;
    }
    let startTime;
    const startVal = displayScore;
    const endVal = score;
    const duration = 600;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayScore(startVal + (endVal - startVal) * easeProgress);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [score, animate]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore * circumference);
  const percentage = Math.round(displayScore * 100);

  // Color selection based on score threshold if not overridden
  const activeColor = color || (
    displayScore >= 0.8 ? '#10b981' :
    displayScore >= 0.6 ? '#06b6d4' :
    displayScore >= 0.4 ? '#f59e0b' : '#f43f5e'
  );

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-800/80 light:text-slate-200 fill-none"
          />
          {/* Active Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="fill-none transition-all duration-300 ease-out"
          />
        </svg>

        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-xs font-black font-mono text-white light:text-slate-900">
              {percentage}%
            </span>
          </div>
        )}
      </div>

      {(label || sublabel) && (
        <div className="min-w-0">
          {label && (
            <div className="text-xs font-bold text-white light:text-slate-900 truncate">
              {label}
            </div>
          )}
          {sublabel && (
            <div className="text-[10px] font-mono text-slate-400 light:text-slate-500 truncate">
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
