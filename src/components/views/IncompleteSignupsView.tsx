'use client';

import React, { useMemo, useState } from 'react';
import { Shop } from '../../types/database';
import { formatDate, timeAgo } from '../../lib/adminData';
import {
  UserMinus,
  CheckCircle2,
  AlertCircle,
  Printer,
  MapPin,
  Phone,
  Shield,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Store,
  Sparkles,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface IncompleteSignupsViewProps {
  shops: Shop[];
  onOpenShopDrawer?: (shop: Shop) => void;
  onShowToast?: (msg: string) => void;
}

export function IncompleteSignupsView({
  shops,
  onOpenShopDrawer,
  onShowToast,
}: IncompleteSignupsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'incomplete' | 'ready'>('all');

  // Analyze completeness for each shop based on real Counter 365 POS readiness
  const auditedShops = useMemo(() => {
    return shops.map((shop) => {
      const checks = [
        { name: 'Shop Name', ok: Boolean(shop.name && shop.name.trim().length > 0) },
        { name: 'Phone Verified', ok: Boolean(shop.phone && shop.phone.trim().length >= 10) },
        { name: 'City / Location', ok: Boolean(shop.city && shop.city.trim().length > 0) },
        { name: 'Business Category', ok: Boolean(shop.shop_type && shop.shop_type.trim().length > 0) },
        { name: 'Thermal Printer Setup', ok: Boolean(shop.printer_enabled) },
        { name: 'GSTIN Tax Details', ok: Boolean(shop.gst_enabled && shop.gst_number) },
      ];

      const passedCount = checks.filter((c) => c.ok).length;
      const score = Math.round((passedCount / checks.length) * 100);
      const missing = checks.filter((c) => !c.ok).map((c) => c.name);

      return {
        shop,
        checks,
        score,
        missing,
        isIncomplete: score < 100,
      };
    });
  }, [shops]);

  const incompleteCount = auditedShops.filter((s) => s.isIncomplete).length;
  const fullyConfiguredCount = auditedShops.length - incompleteCount;
  const missingPrinterCount = auditedShops.filter((s) => !s.shop.printer_enabled).length;
  const missingGstCount = auditedShops.filter((s) => !s.shop.gst_enabled).length;

  const filteredShops = useMemo(() => {
    return auditedShops.filter(({ shop, missing, isIncomplete }) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        shop.name.toLowerCase().includes(q) ||
        shop.phone.includes(q) ||
        (shop.city && shop.city.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (filterMode === 'incomplete') return isIncomplete;
      if (filterMode === 'ready') return !isIncomplete;
      return true;
    });
  }, [auditedShops, searchQuery, filterMode]);

  return (
    <div className="space-y-6 font-sans select-none animate-in fade-in duration-150">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#11141a] via-[#1c1f28] to-[#11141a] border border-[#2b303c] p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#FD5E03]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FD5E03] animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider text-[#FD5E03] uppercase">
                Merchant Onboarding Governance
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white m-0">
              Incomplete Signups & Hardware Audit
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed m-0">
              Identify merchant stores with missing configuration parameters such as unverified phone numbers, missing receipt printers, or incomplete tax profiles.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[11px] font-mono text-gray-400 uppercase">Onboarding Readiness</div>
              <div className="text-2xl font-bold font-mono text-[#FD5E03]">
                {shops.length > 0 ? `${Math.round((fullyConfiguredCount / shops.length) * 100)}%` : '0%'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-amber-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Pending Setup Items</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-amber-700">
            {incompleteCount}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Requires onboarding assist</span>
            <span className="text-amber-700 font-bold font-mono">Action Needed</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-emerald-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Fully Configured Outlets</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {fullyConfiguredCount}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>100% Onboarding complete</span>
            <span className="text-emerald-600 font-bold">POS Ready</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-teal-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Printer Not Configured</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Printer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {missingPrinterCount}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Missing ESC/POS printer</span>
            <span className="text-teal-700 font-semibold">Hardware</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-blue-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Non-GST Counters</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {missingGstCount}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Operating without GST number</span>
            <span className="text-blue-600 font-semibold">Standard Bill</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search store name, phone, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#FD5E03] focus:outline-hidden transition-all text-gray-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-[#1c1f26] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:text-black'
            }`}
          >
            All Stores ({shops.length})
          </button>
          <button
            onClick={() => setFilterMode('incomplete')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'incomplete'
                ? 'bg-[#1c1f26] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:text-black'
            }`}
          >
            Incomplete Only ({incompleteCount})
          </button>
          <button
            onClick={() => setFilterMode('ready')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'ready'
                ? 'bg-[#1c1f26] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:text-black'
            }`}
          >
            100% Ready ({fullyConfiguredCount})
          </button>
        </div>
      </div>

      {/* 4. Onboarding Audit Cards */}
      <div className="space-y-3">
        {filteredShops.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-16 text-center text-gray-400 text-xs shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <div className="font-semibold text-gray-700 text-sm">All stores have completed setup!</div>
            <div className="text-[11px] text-gray-400 mt-1">No incomplete signup records match your filter.</div>
          </div>
        ) : (
          filteredShops.map(({ shop, checks, score, missing, isIncomplete }) => (
            <div
              key={shop.id}
              onClick={() => onOpenShopDrawer?.(shop)}
              className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:border-[#FD5E03]/50 transition-all cursor-pointer group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-sm text-[#111827] m-0 group-hover:text-[#FD5E03] transition-colors truncate">
                      {shop.name}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">
                      {shop.shop_type || 'General'}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        score === 100
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {score}% Onboarding Score
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-mono">{shop.phone}</span>
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{shop.city || 'Tamil Nadu'}</span>
                    </span>
                    <span>&bull;</span>
                    <span>Enrolled: {formatDate(shop.created_at)}</span>
                  </div>
                </div>

                {/* Score Progress Bar */}
                <div className="w-full md:w-56 shrink-0 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Readiness</span>
                    <span className="font-mono font-bold text-gray-900">{score}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        score === 100 ? 'bg-emerald-500' : score >= 60 ? 'bg-[#FD5E03]' : 'bg-amber-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Checklist Badges */}
              <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {checks.map((chk) => (
                    <span
                      key={chk.name}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium ${
                        chk.ok
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {chk.ok ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span>{chk.name}</span>
                    </span>
                  ))}
                </div>

                <span className="text-xs font-semibold text-[#FD5E03] group-hover:underline inline-flex items-center gap-1">
                  Configure Outlet &rarr;
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
