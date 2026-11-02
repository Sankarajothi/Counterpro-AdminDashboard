'use client';

import React from 'react';

export type ExportFormat = 'csv' | 'excel' | 'json' | 'print';

interface HeaderProps {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  onExportFormat?: (format: ExportFormat) => void;
  adminUser?: { email: string; role: string; name?: string } | null;
  onLogout?: () => void;
  onOpenResetModal?: () => void;
  onAddUserAccount?: () => void;
  // Legacy optional props retained for seamless compatibility
  dateFilter?: string;
  onDateFilterChange?: (filter: string, customStart?: string, customEnd?: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchResults?: any;
  onSelectSearchResult?: (type: string, id: string) => void;
  onAddUser?: (user: { name: string; email: string; phone: string; role: string }) => void;
  onResetPassword?: (email: string) => void;
  onShowToast?: (msg: string) => void;
  shopsList?: { id: string; name: string }[];
}

export function Header({
  title,
  subtitle,
  onLogout,
  onOpenResetModal,
  onAddUserAccount,
}: HeaderProps) {
  return (
    <header className="h-12 px-5 bg-[#f8fafc] border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-20 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-[13.5px] font-semibold text-slate-900 tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <>
            <span className="text-slate-300 text-xs">/</span>
            <span className="text-[11.5px] text-slate-500 font-normal truncate hidden sm:inline">
              {subtitle}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Add user account button */}
        {onAddUserAccount && (
          <button
            onClick={onAddUserAccount}
            className="h-8 px-2.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-xs font-medium shadow-2xs cursor-pointer"
          >
            <span>+ Add user account</span>
          </button>
        )}

        {/* Reset password button */}
        {onOpenResetModal && (
          <button
            onClick={onOpenResetModal}
            title="Reset Password"
            className="h-8 px-2.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-xs font-medium shadow-2xs cursor-pointer"
          >
            <span>Reset password</span>
          </button>
        )}

        {/* Sign Out Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out"
            className="h-8 px-2.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition-colors flex items-center gap-1.5 text-xs font-medium shadow-2xs cursor-pointer"
          >
            <span>Sign out</span>
          </button>
        )}
      </div>
    </header>
  );
}
