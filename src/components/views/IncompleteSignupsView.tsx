'use client';

import React from 'react';
import { Shop } from '../../types/database';
import { formatDate, timeAgo } from '../../lib/adminData';
import { UserMinus, CheckCircle2, AlertCircle, Printer, MapPin, Phone, Shield } from 'lucide-react';

interface IncompleteSignupsViewProps {
  shops: Shop[];
  onOpenShopDrawer?: (shop: Shop) => void;
}

export function IncompleteSignupsView({
  shops,
  onOpenShopDrawer,
}: IncompleteSignupsViewProps) {
  // Analyze completeness for each shop
  const auditedShops = shops.map((shop) => {
    const checks = [
      { name: 'Shop Name', ok: Boolean(shop.name && shop.name.trim().length > 0) },
      { name: 'Phone Verified', ok: Boolean(shop.phone && shop.phone.trim().length >= 10) },
      { name: 'Location / City', ok: Boolean(shop.city && shop.city.trim().length > 0) },
      { name: 'Shop Business Type', ok: Boolean(shop.shop_type && shop.shop_type.trim().length > 0) },
      { name: 'Printer Configured', ok: Boolean(shop.printer_enabled && shop.printer_name) },
      { name: 'GST Tax Number', ok: Boolean(shop.gst_number && shop.gst_number.trim().length > 0) },
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

  const incompleteCount = auditedShops.filter((s) => s.isIncomplete).length;
  const fullyConfiguredCount = auditedShops.length - incompleteCount;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Incomplete Configurations</div>
          <div className="mt-2 text-2xl font-bold font-heading text-amber-600">
            {incompleteCount}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Shops with pending setup items
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Fully Ready Shops</div>
          <div className="mt-2 text-2xl font-bold font-heading text-emerald-700">
            {fullyConfiguredCount}
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">
            100% onboarding checklist passed
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Average Setup Readiness</div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
            {Math.round(
              auditedShops.reduce((acc, s) => acc + s.score, 0) / Math.max(auditedShops.length, 1)
            )}
            %
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Across {shops.length} merchant profiles
          </div>
        </div>
      </div>

      {/* Incomplete Signups and Audits List */}
      <div className="bg-white rounded-xl p-5 border border-[var(--color-divider)] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[14px] text-[#101318]">Shop Onboarding &amp; Readiness Audit</h3>
            <p className="text-[11px] text-gray-500">
              Evaluated directly from Counter Pro database records
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {auditedShops.map(({ shop, score, missing, checks }) => (
            <div
              key={shop.id}
              onClick={() => onOpenShopDrawer?.(shop)}
              className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/70 p-3 rounded-xl transition-colors cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-gray-900">{shop.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-gray-100 text-gray-700">
                    {shop.shop_type || 'General'}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      score === 100
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {score}% Complete
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {checks.map((c) => (
                    <span
                      key={c.name}
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded ${
                        c.ok
                          ? 'bg-emerald-50/60 text-emerald-700'
                          : 'bg-rose-50 text-rose-700 font-medium'
                      }`}
                    >
                      {c.ok ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                      )}
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                {missing.length > 0 ? (
                  <div className="text-right">
                    <span className="text-[11px] text-amber-700 font-medium block">
                      Needs: {missing.slice(0, 2).join(', ')}
                      {missing.length > 2 ? ` +${missing.length - 2}` : ''}
                    </span>
                    <span className="text-[10px] text-gray-400">Click to view details</span>
                  </div>
                ) : (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Ready for Live POS
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
