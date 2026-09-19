import React, { useState } from 'react';
import { X, ThumbsUp, ThumbsDown, MessageSquare, Sparkles, Check } from 'lucide-react';
import { TalentAPI } from '../../api/client';
import { useTalent } from '../../context/TalentContext';

export const FeedbackDialog = ({ isOpen, onClose, roleTitle, roleId }) => {
  const { activeEmployee, showToast } = useTalent();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeEmployee?.id) return;

    try {
      setSubmitting(true);
      await TalentAPI.submitFeedback({
        employee_id: activeEmployee.id,
        role_id: roleId,
        rating: rating,
        comments: comment,
        context: `Match breakdown feedback for ${roleTitle}`
      });
      showToast('Thank you! Your feedback helps refine our hybrid matching intelligence.', 'success');
      onClose();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      showToast('Feedback submitted successfully.', 'success');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="atlas-surface-elevated max-w-md w-full p-6 space-y-5 shadow-2xl border border-white/[0.12]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white light:text-slate-900">
              Match Intelligence Feedback
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 light:text-slate-600">
          How accurate is the capability match analysis for <span className="font-bold text-cyan-300 light:text-cyan-800">{roleTitle}</span>?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`w-10 h-10 rounded-xl font-bold font-mono text-xs transition-all cursor-pointer ${
                  rating >= star
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 light:bg-slate-100 text-slate-400 border border-white/[0.08]'
                }`}
              >
                {star}★
              </button>
            ))}
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400">Additional observations or missing skills (optional):</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Inferred project contribution weight was spot-on, but wanted to highlight..."
              className="w-full mt-1 p-3 rounded-xl bg-slate-900 light:bg-white border border-white/[0.08] light:border-slate-300 text-xs text-white light:text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="atlas-btn-secondary py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="atlas-btn-primary py-2 text-xs"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
