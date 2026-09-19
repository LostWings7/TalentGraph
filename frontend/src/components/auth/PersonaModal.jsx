import React, { useState } from 'react';
import { X, Search, User, Briefcase, Award, CheckCircle2, Sliders, ChevronRight } from 'lucide-react';
import { useTalent } from '../../context/TalentContext';

export const PersonaModal = ({ isOpen, onClose, onSelectPersona }) => {
  const { employees, activeEmployee, switchEmployee, showToast } = useTalent();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  if (!isOpen) return null;

  const departments = ['all', ...Array.from(new Set(employees.map((e) => e.department).filter(Boolean)))];

  const filtered = employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
                          emp.current_role.toLowerCase().includes(search.toLowerCase()) ||
                          emp.department.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedDept !== 'all' && emp.department !== selectedDept) return false;
    return true;
  });

  const handleSelect = async (emp) => {
    await switchEmployee(emp.id);
    showToast(`Switched active persona to ${emp.name} (${emp.current_role})`, 'success');
    if (onSelectPersona) onSelectPersona(emp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="atlas-surface-elevated max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-white/[0.12] light:border-slate-300">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/[0.08] light:border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 light:bg-cyan-100 text-cyan-400 light:text-cyan-700 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white light:text-slate-900">
                Switch Employee Persona
              </h2>
              <p className="text-xs text-slate-400 light:text-slate-500">
                Explore TalentGraph intelligence through 30 diverse synthetic employee profiles.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Department Filters */}
        <div className="p-4 border-b border-white/[0.06] light:border-slate-200 space-y-3 bg-slate-950/40 light:bg-slate-50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee by name, role, department..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 light:bg-white border border-white/[0.08] light:border-slate-300 text-xs text-white light:text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-2.5 py-1 rounded-lg font-mono capitalize whitespace-nowrap transition-all ${
                  selectedDept === dept
                    ? 'bg-cyan-500/20 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 light:text-slate-600 hover:bg-white/[0.05] light:hover:bg-slate-200'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Employee List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[480px]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No employee profiles matching "{search}"
            </div>
          ) : (
            filtered.map((emp) => {
              const isActive = activeEmployee?.id === emp.id;
              return (
                <div
                  key={emp.id}
                  onClick={() => handleSelect(emp)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/15 light:bg-cyan-50 border-cyan-400/50 light:border-cyan-400 shadow-sm'
                      : 'bg-slate-900/50 light:bg-white hover:bg-slate-800/80 light:hover:bg-slate-100 border-white/[0.06] light:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-white/[0.08] light:border-slate-300 flex items-center justify-center font-bold text-sm text-cyan-300 light:text-cyan-800 shrink-0">
                      {emp.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white light:text-slate-900 truncate">
                          {emp.name}
                        </span>
                        {isActive && (
                          <span className="atlas-badge-cyan text-[9px] py-0.5">Active</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 light:text-slate-600 truncate flex items-center gap-1.5 mt-0.5">
                        <span>{emp.current_role}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px] text-cyan-400 light:text-cyan-700">{emp.department}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] font-mono text-slate-400 light:text-slate-500">Experience</div>
                      <div className="text-xs font-bold text-slate-200 light:text-slate-800 font-mono">
                        {emp.years_experience} yrs
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
