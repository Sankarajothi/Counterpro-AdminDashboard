import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPICardProps } from '../../types/dashboard';

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  isDateFilterable = true,
  isUnavailable = false,
  unavailableReason,
  icon: Icon,
  onClick,
  size = 'default',
}) => {
  const isXs = size === 'xs';
  const isSm = size === 'sm' || isXs;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-slate-200/80 p-3.5 transition-colors ${
        onClick ? 'cursor-pointer hover:bg-slate-50/70 hover:border-slate-300' : ''
      }`}
    >
      {/* Top row: Label */}
      <div className={`flex items-center justify-between gap-1.5 ${isXs ? 'mb-0' : isSm ? 'mb-0.5' : 'mb-1'}`}>
        <span
          className={`${
            isXs ? 'text-[10px]' : isSm ? 'text-[10.5px]' : 'text-[11.5px]'
          } font-normal text-slate-500 truncate`}
        >
          {title}
        </span>
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
      </div>

      {/* Main Metric Value */}
      <div className={isXs ? 'my-0' : isSm ? 'my-0' : 'my-0.5'}>
        {isUnavailable ? (
          <div className="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded inline-block">
            Unavailable
          </div>
        ) : (
          <div
            className={`${
              isXs
                ? 'text-base sm:text-[17px]'
                : isSm
                ? 'text-lg sm:text-xl'
                : 'text-2xl sm:text-[26px]'
            } font-semibold tracking-tight text-slate-900 font-mono tabular-nums leading-tight`}
          >
            {value}
          </div>
        )}
      </div>

      {/* Footer: Subtitle and Trend */}
      <div className={`${isXs ? 'mt-0' : isSm ? 'mt-0.5' : 'mt-1'} flex items-center justify-between gap-1.5 text-xs`}>
        {isUnavailable ? (
          <span className="text-slate-400 text-[10px]">
            {unavailableReason || 'Source unavailable'}
          </span>
        ) : (
          <>
            <span className={`text-slate-400 ${isXs ? 'text-[10px]' : isSm ? 'text-[10.5px]' : 'text-[11px]'} truncate font-normal`}>
              {subtitle || (isDateFilterable ? 'Filtered period' : 'All-time')}
            </span>

            {change && (
              <div
                className={`inline-flex items-center gap-1 font-mono text-[10.5px] tabular-nums shrink-0 ${
                  changeType === 'positive'
                    ? 'text-emerald-700'
                    : changeType === 'negative'
                    ? 'text-rose-700'
                    : 'text-slate-500'
                }`}
              >
                {changeType === 'positive' && <TrendingUp className="w-2.5 h-2.5 stroke-[2]" />}
                {changeType === 'negative' && <TrendingDown className="w-2.5 h-2.5 stroke-[2]" />}
                {changeType === 'neutral' && <Minus className="w-2.5 h-2.5 stroke-[2]" />}
                <span>{change}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
