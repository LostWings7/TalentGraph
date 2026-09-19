import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  ShieldCheck, 
  Clock, 
  RefreshCw, 
  User, 
  Activity, 
  Building2 
} from 'lucide-react';
import { TalentAPI } from '../api/client';
import { useTalent } from '../context/TalentContext';

export const AuditLogView = () => {
  const { currentEnterprise } = useTalent();
  const [logs, setLogs] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await TalentAPI.getAuditLogs({ limit: 100 });
      setLogs(res.data.results || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    if (!searchFilter) return true;
    const term = searchFilter.toLowerCase();
    return (
      l.action?.toLowerCase().includes(term) ||
      l.actor_name?.toLowerCase().includes(term) ||
      l.target_model?.toLowerCase().includes(term) ||
      JSON.stringify(l.details || {}).toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="atlas-surface-elevated p-6 border-l-4 border-l-slate-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Enterprise Governance & Security
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white light:text-slate-900 tracking-tight">
            Audit Trail & Compliance Log
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-600 max-w-2xl mt-1">
            Immutable log of all administrative actions, staffing decisions, approval resolutions, and role reassignments for <strong>{currentEnterprise?.name || 'NovaTech Solutions'}</strong>.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search audit actions, actors, or details (e.g. STAFFING, APPROVAL, NovaTech)..."
            className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="atlas-surface-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-white/[0.06] text-slate-400 font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    Loading compliance logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                      {log.actor_name || 'System / Automated'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                      {log.target_model ? `${log.target_model} #${log.target_id}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
