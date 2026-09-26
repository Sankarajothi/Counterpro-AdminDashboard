'use client';

import React from 'react';
import { RotateCw, Search } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  period: string;
  onPeriodChange: (p: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function Header({
  title,
  subtitle,
  period,
  onPeriodChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading,
}: HeaderProps) {
  const periods = ['Day', 'Week', 'Month', 'Year'];

  return (
    <header className="flex items-center gap-4 px-[26px] py-[16px] bg-white border-b border-[var(--color-divider)] shadow-sm flex-wrap sticky top-0 z-10">
      <div>
        <h1 className="m-0 text-[22px] font-bold tracking-tight text-[var(--color-text)]">
          {title}
        </h1>
        <div className="text-[12px] text-black/50 font-normal mt-0.5">
          {subtitle}
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto flex-wrap">
        {/* Period Selector Segment */}
        <div className="seg flex rounded-[6px] border border-[var(--color-divider)] overflow-hidden bg-white shadow-xs">
          {periods.map((p, index) => {
            const isSelected = period === p;
            return (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`min-h-[38px] px-[14px] text-[12px] font-semibold transition-colors cursor-pointer border-0 ${
                  index > 0 ? 'border-l border-[var(--color-divider)]' : ''
                } ${
                  isSelected
                    ? 'bg-[#FD5E03] text-white'
                    : 'bg-white text-[var(--color-text)] hover:bg-[#FFF7ED]'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="input bg-[#FAFAFB] w-[240px] min-h-[38px] pl-9 pr-3 text-[13px] rounded-[6px] border border-[var(--color-divider)] focus:border-[#FD5E03] focus:bg-white transition-all text-[var(--color-text)] placeholder:text-gray-400"
            placeholder="Search shop, city, phone"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh Live Data"
          className="btn-icon min-h-[38px] min-w-[38px] rounded-[6px] border border-[var(--color-divider)] bg-white text-gray-700 hover:border-[#FD5E03] hover:text-[#FD5E03] transition-colors"
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FD5E03]' : ''}`} />
        </button>
      </div>
    </header>
  );
}
