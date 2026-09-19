import React from 'react';

export const ToggleSwitch = ({ checked, onChange, label, sublabel, disabled = false }) => {
  return (
    <label className={`flex items-center justify-between gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {(label || sublabel) && (
        <div className="flex flex-col">
          {label && <span className="text-xs font-semibold text-slate-200 light:text-slate-800">{label}</span>}
          {sublabel && <span className="text-[10px] text-slate-400 light:text-slate-500">{sublabel}</span>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
          checked ? 'bg-cyan-500' : 'bg-slate-700 light:bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
};

export const CustomCheckbox = ({ checked, onChange, label, sublabel, disabled = false }) => {
  return (
    <label className={`flex items-start gap-2.5 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-700 light:border-slate-300 bg-slate-900 light:bg-white text-cyan-500 focus:ring-cyan-500/20 focus:ring-offset-0 cursor-pointer"
      />
      {(label || sublabel) && (
        <div className="flex flex-col">
          {label && <span className="text-xs font-semibold text-slate-200 light:text-slate-800">{label}</span>}
          {sublabel && <span className="text-[10px] text-slate-400 light:text-slate-500">{sublabel}</span>}
        </div>
      )}
    </label>
  );
};
