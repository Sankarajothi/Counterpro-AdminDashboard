import React from 'react';

interface StatusBadgeProps {
  status: string | null | undefined;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#ebedee] text-[#353736]">
        Unknown
      </span>
    );
  }

  const normalized = status.toLowerCase().trim();

  let styles = 'bg-[#ebedee] text-[#353736]';

  if (['active', 'completed', 'paid', 'resolved', 'processed', 'done', 'confirmed', 'live', 'pro', 'successful'].includes(normalized)) {
    styles = 'bg-[#dcfae5] text-[#04250e]';
  } else if (['pending', 'in_progress', 'open', 'not confirmed', 'trial', 'trialing'].includes(normalized)) {
    styles = 'bg-[#fffbeb] text-[#92400e]';
  } else if (['cancelled', 'closed', 'expired', 'failed', 'deleted', 'suspended', 'churned', 'refunded'].includes(normalized)) {
    styles = 'bg-[#ffedea] text-[#831c1e]';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded font-medium capitalize tracking-tight ${styles} ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {status}
    </span>
  );
};
