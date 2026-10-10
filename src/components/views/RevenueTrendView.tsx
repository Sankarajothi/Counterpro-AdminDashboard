'use client';

import React, { useMemo } from 'react';
import { Shop, Bill, Payment } from '../../types/database';
import { formatINR } from '../../lib/adminData';
import {
  TrendingUp,
  ArrowUpRight,
  DollarSign,
  Wallet,
  CreditCard,
  Calendar,
  Store,
  Sparkles,
  ArrowRight,
  Download,
  Activity,
  Layers,
} from 'lucide-react';

interface RevenueTrendViewProps {
  bills: Bill[];
  shops: Shop[];
  payments: Payment[];
  onShowToast?: (msg: string) => void;
}

export function RevenueTrendView({ bills, shops, payments, onShowToast }: RevenueTrendViewProps) {
  const completedBills = useMemo(() => bills.filter((b) => b.status === 'completed'), [bills]);
  const totalGMV = useMemo(
    () => completedBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0),
    [completedBills]
  );
  const avgOrderTicket = completedBills.length > 0 ? Math.round(totalGMV / completedBills.length) : 0;

  // Group revenue by date (last 14 days trajectory)
  const last14Days = useMemo(() => {
    const days: { label: string; dateStr: string; gmv: number; bills: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

      const dayBills = completedBills.filter((b) => {
        const bDate = (b.created_at || b.completed_at || '').split('T')[0];
        return bDate === dateStr;
      });

      const dayGmv = dayBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0);
      days.push({ label, dateStr, gmv: dayGmv, bills: dayBills.length });
    }
    const maxGmv = Math.max(...days.map((d) => d.gmv), 1);
    return days.map((d) => ({
      ...d,
      heightPct: Math.max(Math.round((d.gmv / maxGmv) * 100), d.gmv > 0 ? 12 : 5),
    }));
  }, [completedBills]);

  // Peak Day
  const peakDay = useMemo(() => {
    return [...last14Days].sort((a, b) => b.gmv - a.gmv)[0] || { label: 'Today', gmv: 0, bills: 0 };
  }, [last14Days]);

  // Shop revenue contribution
  const shopContributions = useMemo(() => {
    return shops
      .map((shop) => {
        const shopBills = completedBills.filter((b) => b.shop_id === shop.id);
        const gmv = shopBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0);
        const count = shopBills.length;
        const pct = totalGMV > 0 ? Math.round((gmv / totalGMV) * 100) : 0;
        return { shop, gmv, count, pct };
      })
      .sort((a, b) => b.gmv - a.gmv);
  }, [shops, completedBills, totalGMV]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let upi = 0;
    let pending = 0;

    completedBills.forEach((b) => {
      const amt = Number(b.total_amount || 0);
      const mode = (b.payment_mode || '').toLowerCase();
      const pend = Number(b.pending_amount || 0);

      if (pend > 0) pending += pend;
      if (mode.includes('upi') || mode.includes('gpay') || mode.includes('online')) {
        upi += Math.max(amt - pend, 0);
      } else {
        cash += Math.max(amt - pend, 0);
      }
    });

    const total = Math.max(cash + upi + pending, 1);
    return {
      cash,
      upi,
      pending,
      cashPct: Math.round((cash / total) * 100),
      upiPct: Math.round((upi / total) * 100),
      pendingPct: Math.max(100 - Math.round((cash / total) * 100) - Math.round((upi / total) * 100), 0),
    };
  }, [completedBills]);

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
                Financial Revenue Trajectory
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white m-0">
              Platform Gross Revenue Velocity
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed m-0">
              Comprehensive GMV growth tracking across {shops.length} outlets, daily billing velocity, and payment settlement modes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[11px] font-mono text-gray-400 uppercase">14-Day Cumulative GMV</div>
              <div className="text-2xl font-bold font-mono text-[#FD5E03]">{formatINR(totalGMV)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-[#FD5E03]/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Cumulative Gross Revenue</span>
            <div className="p-2 rounded-xl bg-[#FFF7ED] text-[#FD5E03]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {formatINR(totalGMV)}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>{completedBills.length} completed transactions</span>
            <span className="text-emerald-600 font-bold">100% Real</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-emerald-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Average Order Value</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {formatINR(avgOrderTicket)}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Per completed checkout ticket</span>
            <span className="text-emerald-600 font-semibold">Average</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-blue-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Peak 14-Day Velocity</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {formatINR(peakDay.gmv)}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Recorded on {peakDay.label}</span>
            <span className="text-blue-600 font-bold">{peakDay.bills} bills</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-amber-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Pending Credit Balance</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {formatINR(paymentBreakdown.pending)}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Udhaar customer balance</span>
            <span className="text-amber-700 font-bold font-mono">Udhaar</span>
          </div>
        </div>
      </div>

      {/* 3. 14-Day Visual Velocity Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#FD5E03]/10 text-[#FD5E03]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827] m-0">14-Day Revenue Velocity Chart</h3>
              <p className="text-[11px] text-gray-400 m-0">Daily gross revenue across all retail registers</p>
            </div>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {completedBills.length} Total Platform Transactions
          </span>
        </div>

        <div className="h-52 flex items-end justify-between gap-2.5 pt-6 pb-2 border-b border-gray-100">
          {last14Days.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded shadow-2xs whitespace-nowrap">
                {formatINR(day.gmv)} ({day.bills})
              </div>
              <div className="w-full max-w-[42px] bg-gray-100 rounded-t-lg overflow-hidden h-full flex items-end">
                <div
                  className="w-full bg-gradient-to-t from-[#ea5602] to-[#FD5E03] rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                  style={{ height: `${day.heightPct}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-gray-400 group-hover:text-black">
                {day.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FD5E03]" />
              <span>Gross Billed GMV</span>
            </span>
          </div>
          <span className="text-[11px] font-mono text-gray-400">
            Realtime Daily Settlement
          </span>
        </div>
      </div>

      {/* 4. Store Leaderboard & Payment Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store Contribution Leaderboard */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div>
              <h3 className="font-bold text-sm text-[#111827] m-0">Store Revenue Contribution</h3>
              <p className="text-[11px] text-gray-400 m-0">Gross volume distribution across merchant stores</p>
            </div>
            <span className="text-xs text-gray-500 font-mono">
              {shops.length} Registered Outlets
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {shopContributions.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No stores recorded in database.
              </div>
            ) : (
              shopContributions.map(({ shop, gmv, count, pct }, index) => (
                <div key={shop.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center font-mono font-bold text-xs">
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-gray-900 truncate">
                        {shop.name}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {shop.city || 'Tamil Nadu'} &bull; {count} orders
                      </div>
                    </div>
                  </div>

                  <div className="w-36 hidden sm:block">
                    <div className="flex justify-between text-[10.5px] font-mono mb-1 text-gray-500">
                      <span>Share</span>
                      <span className="font-bold text-gray-700">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-[#FD5E03] rounded-full"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono font-bold text-xs text-gray-900">
                    {formatINR(gmv)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Methods Split */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-sm text-[#111827] m-0">Payment Settlement</h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Live
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700">Cash Collections</span>
                  <span className="font-mono font-bold text-gray-900">
                    {formatINR(paymentBreakdown.cash)} ({paymentBreakdown.cashPct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-slate-800 rounded-full"
                    style={{ width: `${paymentBreakdown.cashPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700">UPI / QR Collections</span>
                  <span className="font-mono font-bold text-[#FD5E03]">
                    {formatINR(paymentBreakdown.upi)} ({paymentBreakdown.upiPct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-[#FD5E03] rounded-full"
                    style={{ width: `${paymentBreakdown.upiPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700">Pending Credit (Udhaar)</span>
                  <span className="font-mono font-bold text-amber-700">
                    {formatINR(paymentBreakdown.pending)} ({paymentBreakdown.pendingPct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${paymentBreakdown.pendingPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-gray-100 text-[11px] text-gray-400 text-center">
            Synchronized directly from Counter Pro transaction records
          </div>
        </div>
      </div>
    </div>
  );
}
