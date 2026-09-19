import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useTalent } from '../../context/TalentContext';

export const ToastNotification = () => {
  const { notification } = useTalent();

  if (!notification) return null;

  const { message, type } = notification;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 light:text-emerald-600 shrink-0" />,
    error: <XCircle className="w-4 h-4 text-rose-400 light:text-rose-600 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 light:text-amber-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-cyan-400 light:text-cyan-600 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-500/40 bg-slate-900/95 light:bg-emerald-50',
    error: 'border-rose-500/40 bg-slate-900/95 light:bg-rose-50',
    warning: 'border-amber-500/40 bg-slate-900/95 light:bg-amber-50',
    info: 'border-cyan-500/40 bg-slate-900/95 light:bg-sky-50'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-200">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${borders[type] || borders.info} shadow-2xl backdrop-blur-xl`}>
        {icons[type] || icons.info}
        <div className="text-xs font-medium text-slate-100 light:text-slate-900">
          {message}
        </div>
      </div>
    </div>
  );
};
