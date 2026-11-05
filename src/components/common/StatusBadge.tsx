import React from 'react';

interface StatusBadgeProps {
  status: string | null | undefined;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-stone-50 text-stone-700 border border-stone-200">
        Unknown
      </span>
    );
  }

  const normalized = status.toLowerCase().trim();

  let styles = 'bg-stone-50 text-stone-800 border-stone-200 font-semibold';

  if (['active', 'completed', 'paid', 'resolved', 'processed', 'done', 'confirmed', 'live', 'successful'].includes(normalized)) {
    styles = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
  } else if (['pending', 'in_progress', 'open', 'not confirmed', 'trial', 'trialing', 'warning'].includes(normalized)) {
    styles = 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
  } else if (['cancelled', 'closed', 'expired', 'failed', 'deleted', 'suspended', 'churned', 'refunded'].includes(normalized)) {
    styles = 'bg-rose-50 text-rose-800 border-rose-200 font-semibold';
  } else if (['pro', 'premium', 'subscriber', 'vip', 'broadcast', 'featured'].includes(normalized)) {
    styles = 'bg-orange-50 text-[#EA580C] border-orange-200 font-semibold';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded-md border capitalize transition-colors ${styles} ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
      {status}
    </span>
  );
};
