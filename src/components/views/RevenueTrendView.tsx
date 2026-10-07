'use client';

import React from 'react';
import { Shop, Bill, Payment } from '../../types/database';
import { formatINR, formatLakhs } from '../../lib/adminData';
import { TrendingUp, ArrowUpRight, DollarSign, Wallet, CreditCard } from 'lucide-react';

interface RevenueTrendViewProps {
  bills: Bill[];
  shops: Shop[];
  payments: Payment[];
}

export function RevenueTrendView({ bills, shops, payments }: RevenueTrendViewProps) {
  const completedBills = bills.filter((b) => b.status === 'completed');
  const totalGMV = completedBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0);

  // Group revenue by date (last 14 days)
  const dateMap: Record<string, { total: number; count: number; dateStr: string }> = {};
  completedBills.forEach((b) => {
    const d = b.created_at ? b.created_at.split('T')[0] : 'Unknown';
    if (!dateMap[d]) {
      dateMap[d] = {
        total: 0,
        count: 0,
        dateStr: new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      };
    }
    dateMap[d].total += Number(b.total_amount || 0);
    dateMap[d].count += 1;
  });

  const trendBars = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14);

  const maxDailyRevenue = Math.max(...trendBars.map(([, v]) => v.total), 1);

  // Shop revenue contribution
  const shopRevMap: Record<string, { gmv: number; count: number; shop: Shop }> = {};
  shops.forEach((s) => {
    shopRevMap[s.id] = { gmv: 0, count: 0, shop: s };
  });

  completedBills.forEach((b) => {
    if (shopRevMap[b.shop_id]) {
      shopRevMap[b.shop_id].gmv += Number(b.total_amount || 0);
      shopRevMap[b.shop_id].count += 1;
    }
  });

  const shopContributions = Object.values(shopRevMap).sort((a, b) => b.gmv - a.gmv);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Revenue Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-[var(--color-divider)] shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Cumulative Gross Revenue</div>
          <div className="mt-2 text-3xl font-bold font-heading text-[#101318]">
            {formatINR(totalGMV)}
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Across {completedBills.length} recorded bills
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[var(--color-divider)] shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Average Order Value</div>
          <div className="mt-2 text-3xl font-bold font-heading text-[#FD5E03]">
            {completedBills.length > 0 ? formatINR(Math.round(totalGMV / completedBills.length)) : '₹0'}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Per completed ticket
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[var(--color-divider)] shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Top Performing Shop</div>
          <div className="mt-2 text-xl font-bold font-heading text-gray-900 truncate">
            {shopContributions[0]?.shop?.name || 'Shop'}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {formatINR(shopContributions[0]?.gmv || 0)} generated
          </div>
        </div>
      </div>

      {/* Revenue Trajectory Bar Chart */}
      <div className="bg-white rounded-xl p-5 border border-[var(--color-divider)] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[14px] text-[#101318]">Revenue Trajectory by Date</h3>
            <p className="text-[11px] text-gray-500">Daily gross volume recorded in Supabase</p>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">Live Data</span>
        </div>

        {trendBars.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No daily transactions recorded yet.
          </div>
        ) : (
          <div className="pt-4 pb-2">
            <div className="flex items-end gap-3 h-48 border-b border-gray-100 pb-2">
              {trendBars.map(([date, data]) => {
                const heightPct = Math.max(Math.round((data.total / maxDailyRevenue) * 100), 8);
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatINR(data.total)}
                    </span>
                    <div
                      className="w-full bg-[#FD5E03] rounded-t-md hover:bg-[#e05302] transition-all cursor-pointer"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-gray-500 truncate w-full text-center">
                      {data.dateStr}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Shop Revenue Breakdown */}
      <div className="bg-white rounded-xl p-5 border border-[var(--color-divider)] shadow-xs">
        <h3 className="font-bold text-[14px] text-[#101318] mb-4">Shop Revenue Contribution</h3>
        <div className="space-y-4">
          {shopContributions.map((item) => {
            const pct = totalGMV > 0 ? Math.round((item.gmv / totalGMV) * 100) : 0;
            return (
              <div key={item.shop.id}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-900">{item.shop.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{item.count} orders</span>
                    <span className="font-bold text-gray-900 font-heading">{formatINR(item.gmv)} ({pct}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-[#FD5E03] rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
