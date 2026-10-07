'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Search, Calendar, ChevronDown, Download, Activity, Check, Store, Receipt, Users, UserX, X, FileSpreadsheet, FileText, Code, Printer } from 'lucide-react';

export type ExportFormat = 'csv' | 'excel' | 'json' | 'print';

interface HeaderProps {
  title: string;
  subtitle: string;
  dateFilter: string;
  onDateFilterChange: (filter: string, customStart?: string, customEnd?: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  onExportFormat?: (format: ExportFormat) => void;
  isLoading: boolean;
  searchResults?: {
    shops: { id: string; name: string; city: string; phone: string }[];
    bills: { id: string; billNumber: string; amount: number; shopName: string }[];
    staff: { id: string; name: string; role: string; shopName: string }[];
    deletions: { id: string; shopName: string; reason: string }[];
  };
  onSelectSearchResult?: (type: string, id: string) => void;
}

export function Header({
  title,
  subtitle,
  dateFilter,
  onDateFilterChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  onExportFormat,
  isLoading,
  searchResults,
  onSelectSearchResult,
}: HeaderProps) {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const datePresets = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this_week', label: 'This Week' },
    { id: 'last_week', label: 'Last Week' },
    { id: '7days', label: 'Last 7 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: '30days', label: 'Last 30 Days' },
    { id: '90days', label: 'Last 90 Days' },
    { id: 'this_year', label: 'This Year (YTD)' },
    { id: 'custom', label: 'Custom Range' },
  ];

  const currentPresetLabel = datePresets.find((p) => p.id === dateFilter)?.label || 'All Time';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setIsDateOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasSearchMatches =
    searchResults &&
    (searchResults.shops.length > 0 ||
      searchResults.bills.length > 0 ||
      searchResults.staff.length > 0 ||
      searchResults.deletions.length > 0);

  return (
    <header className="flex items-center gap-4 px-[24px] py-[14px] bg-white border-b border-[var(--color-divider)] shadow-xs flex-wrap sticky top-0 z-20">
      <div>
        <h1 className="m-0 text-[20px] font-bold tracking-tight text-[#101318]">
          {title}
        </h1>
        <div className="text-[11.5px] text-gray-500 font-normal mt-0.5">
          {subtitle}
        </div>
      </div>

      <div className="flex items-center gap-2.5 ml-auto flex-wrap">
        {/* Realtime Live Supabase Indicator */}
        <div
          title="Connected to Supabase Realtime (ap-south-1)"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Realtime Live</span>
        </div>

        {/* Date Filter Dropdown (Inspired by Stylefleet) */}
        <div ref={dateRef} className="relative">
          <button
            onClick={() => setIsDateOpen(!isDateOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-divider)] bg-white text-xs font-semibold text-gray-700 hover:text-black hover:border-[#FD5E03] transition-colors cursor-pointer shadow-xs min-h-[36px]"
          >
            <Calendar className="w-3.5 h-3.5 text-[#FD5E03]" />
            <span className="truncate max-w-[130px] sm:max-w-none">{currentPresetLabel}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {isDateOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-[var(--color-divider)] rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">
                Select Date Filter
              </div>
              <div className="space-y-0.5 mt-1">
                {datePresets.map((preset) => {
                  const isSelected = dateFilter === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onDateFilterChange(preset.id);
                        if (preset.id !== 'custom') setIsDateOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#FFF7ED] text-[#FD5E03] font-bold border border-[#FED7AA]'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{preset.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#FD5E03]" />}
                    </button>
                  );
                })}
              </div>

              {dateFilter === 'custom' && (
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-2 px-1">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5 font-medium">Start Date</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-gray-200 bg-white text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5 font-medium">End Date</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-gray-200 bg-white text-gray-800"
                    />
                  </div>
                  <button
                    onClick={() => {
                      onDateFilterChange('custom', customStart, customEnd);
                      setIsDateOpen(false);
                    }}
                    className="w-full btn btn-primary text-xs py-1.5 bg-[#FD5E03] text-white font-bold rounded-md"
                  >
                    Apply Range
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Live Search Bar */}
        <div ref={searchRef} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="input bg-[#FAFAFB] w-[230px] min-h-[36px] pl-9 pr-7 text-xs rounded-lg border border-[var(--color-divider)] focus:border-[#FD5E03] focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
            placeholder="Search shops, bills, staff..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setIsSearchDropdownOpen(Boolean(e.target.value.trim()));
            }}
            onFocus={() => {
              if (searchQuery.trim()) setIsSearchDropdownOpen(true);
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange('');
                setIsSearchDropdownOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Instant Search Results Dropdown */}
          {isSearchDropdownOpen && searchQuery.trim() && searchResults && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[var(--color-divider)] rounded-xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto animate-in fade-in zoom-in-95 divide-y divide-gray-100">
              <div className="p-2 text-[10.5px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 flex items-center justify-between">
                <span>Universal Search Matches</span>
                <span className="font-mono text-gray-500">Live DB</span>
              </div>

              {!hasSearchMatches ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  No matching records in database.
                </div>
              ) : (
                <>
                  {searchResults.shops.length > 0 && (
                    <div className="p-1">
                      <div className="text-[10px] font-bold text-gray-400 px-2 py-0.5 uppercase flex items-center gap-1">
                        <Store className="w-3 h-3 text-[#FD5E03]" />
                        <span>Shops ({searchResults.shops.length})</span>
                      </div>
                      {searchResults.shops.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            onSelectSearchResult?.('shop', s.id);
                            setIsSearchDropdownOpen(false);
                          }}
                          className="p-2 hover:bg-[#FFF7ED] rounded-lg cursor-pointer transition-colors text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-gray-900">{s.name}</div>
                            <div className="text-[10.5px] text-gray-400">{s.city} &bull; +91 {s.phone}</div>
                          </div>
                          <span className="text-[9.5px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">
                            SHOP
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.bills.length > 0 && (
                    <div className="p-1">
                      <div className="text-[10px] font-bold text-gray-400 px-2 py-0.5 uppercase flex items-center gap-1">
                        <Receipt className="w-3 h-3 text-purple-600" />
                        <span>Bills & Invoices ({searchResults.bills.length})</span>
                      </div>
                      {searchResults.bills.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => {
                            onSelectSearchResult?.('bill', b.id);
                            setIsSearchDropdownOpen(false);
                          }}
                          className="p-2 hover:bg-[#FFF7ED] rounded-lg cursor-pointer transition-colors text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-mono font-bold text-gray-900">#{b.billNumber}</div>
                            <div className="text-[10.5px] text-gray-400">{b.shopName}</div>
                          </div>
                          <span className="font-bold text-emerald-600 text-xs">
                            ₹{b.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.staff.length > 0 && (
                    <div className="p-1">
                      <div className="text-[10px] font-bold text-gray-400 px-2 py-0.5 uppercase flex items-center gap-1">
                        <Users className="w-3 h-3 text-blue-600" />
                        <span>Staff Members ({searchResults.staff.length})</span>
                      </div>
                      {searchResults.staff.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => {
                            onSelectSearchResult?.('staff', st.id);
                            setIsSearchDropdownOpen(false);
                          }}
                          className="p-2 hover:bg-[#FFF7ED] rounded-lg cursor-pointer transition-colors text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-gray-900">{st.name}</div>
                            <div className="text-[10.5px] text-gray-400">{st.shopName}</div>
                          </div>
                          <span className="text-[9.5px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                            {st.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.deletions.length > 0 && (
                    <div className="p-1">
                      <div className="text-[10px] font-bold text-gray-400 px-2 py-0.5 uppercase flex items-center gap-1">
                        <UserX className="w-3 h-3 text-red-600" />
                        <span>Account Deletions ({searchResults.deletions.length})</span>
                      </div>
                      {searchResults.deletions.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => {
                            onSelectSearchResult?.('deletion', d.id);
                            setIsSearchDropdownOpen(false);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg cursor-pointer transition-colors text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-gray-900">{d.shopName}</div>
                            <div className="text-[10.5px] text-red-600">{d.reason}</div>
                          </div>
                          <span className="text-[9.5px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                            DELETED
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Export Data Dropdown Menu */}
        {onExportFormat && (
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              title="Export Current View Data"
              className="min-h-[36px] px-3 rounded-lg border border-[var(--color-divider)] bg-white text-gray-700 hover:border-[#FD5E03] hover:text-[#FD5E03] transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#FD5E03]" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[var(--color-divider)] rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 divide-y divide-gray-100">
                <div className="text-[10px] font-bold text-gray-400 px-2.5 py-1.5 uppercase tracking-wider">
                  Export Options
                </div>
                <div className="space-y-0.5 pt-1">
                  <button
                    onClick={() => {
                      onExportFormat('csv');
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-[#FFF7ED] hover:text-[#FD5E03] transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#FD5E03] flex-none" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 leading-tight">Export as CSV</span>
                      <span className="text-[10px] text-gray-500">Comma-separated (.csv)</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onExportFormat('excel');
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-[#FFF7ED] hover:text-[#FD5E03] transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-none" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 leading-tight">Export as Excel</span>
                      <span className="text-[10px] text-gray-500">UTF-8 Excel sheet (.csv)</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onExportFormat('json');
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-[#FFF7ED] hover:text-[#FD5E03] transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <Code className="w-4 h-4 text-blue-600 flex-none" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 leading-tight">Export as JSON</span>
                      <span className="text-[10px] text-gray-500">Structured data payload (.json)</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onExportFormat('print');
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-[#FFF7ED] hover:text-[#FD5E03] transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-purple-600 flex-none" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 leading-tight">Print / Save PDF</span>
                      <span className="text-[10px] text-gray-500">Printable view document</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Refresh Live Data Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh Live Supabase Data"
          className="btn-icon min-h-[36px] min-w-[36px] rounded-lg border border-[var(--color-divider)] bg-white text-gray-700 hover:border-[#FD5E03] hover:text-[#FD5E03] transition-colors flex items-center justify-center cursor-pointer shadow-xs"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#FD5E03]' : ''}`} />
        </button>
      </div>
    </header>
  );
}
