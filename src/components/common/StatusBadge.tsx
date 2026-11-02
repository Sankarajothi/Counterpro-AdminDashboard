import React from 'react';

interface StatusBadgeProps {
  status: string | null | undefined;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-white text-black border border-stone-300">
        Unknown
      </span>
    );
  }

  const normalized = status.toLowerCase().trim();

  let styles = 'bg-white text-black border border-stone-300 font-bold';

  if (['active', 'completed', 'paid', 'resolved', 'processed', 'done', 'confirmed', 'live', 'pro', 'successful'].includes(normalized)) {
    styles = 'bg-[#EA580C] text-white border border-[#EA580C] font-bold shadow-2xs';
  } else if (['pending', 'in_progress', 'open', 'not confirmed', 'trial', 'trialing'].includes(normalized)) {
    styles = 'bg-[#FFEDD5] text-[#C2410C] border border-[#EA580C]/30 font-bold';
  } else if (['cancelled', 'closed', 'expired', 'failed', 'deleted', 'suspended', 'churned', 'refunded'].includes(normalized)) {
    styles = 'bg-stone-800 text-white border border-stone-700 font-bold';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded-md border capitalize transition-colors ${styles} ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
      {status}
    </span>
  );
};
