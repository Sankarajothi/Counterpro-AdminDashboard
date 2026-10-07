'use client';

import React from 'react';
import {
  Shop,
  Bill,
  Payment,
  Subscription,
  Profile,
  ShopMember,
} from '../../types/database';
import { formatINR, formatLakhs, timeAgo, formatDate } from '../../lib/adminData';
import {
  Store,
  Receipt,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface FounderDashboardViewProps {
  shops: Shop[];
  bills: Bill[];
  payments: Payment[];
  subscriptions: Subscription[];
  profiles: Profile[];
  shopMembers: ShopMember[];
  onOpenShopDrawer: (shop: Shop) => void;
  onNavigate: (view: string) => void;
}

export function FounderDashboardView({
  shops,
  bills,
  payments,
  subscriptions,
  profiles,
  shopMembers,
  onOpenShopDrawer,
  onNavigate,
}: FounderDashboardViewProps) {
  const completedBills = bills.filter((b) => b.status === 'completed');
  const totalGMV = completedBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0);
  const totalBillsCount = completedBills.length;
  const avgBill = totalBillsCount > 0 ? Math.round(totalGMV / totalBillsCount) : 0;

  // Today's metrics
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayBills = completedBills.filter(
    (b) => new Date(b.created_at || b.completed_at || 0).getTime() >= startOfToday
  );
  const todayGMV = todayBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0);

  // Payment splits
  let cashGmv = 0;
  let upiGmv = 0;
  let pendingGmv = 0;

  completedBills.forEach((b) => {
    const amt = Number(b.total_amount || 0);
    const mode = (b.payment_mode || '').toLowerCase();
    const pend = Number(b.pending_amount || 0);

    if (pend > 0) pendingGmv += pend;
    if (mode.includes('upi') || mode.includes('gpay') || mode.includes('online')) {
      upiGmv += amt - pend;
    } else {
      cashGmv += amt - pend;
    }
  });

  const totalSplit = Math.max(cashGmv + upiGmv + pendingGmv, 1);
  const cashPct = Math.round((cashGmv / totalSplit) * 100);
  const upiPct = Math.round((upiGmv / totalSplit) * 100);
  const pendingPct = Math.max(100 - cashPct - upiPct, 0);

  const activeShops = shops.filter((s) => s.is_active);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Real Zero Pro / Free Quota Notice Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#1c1f26] to-[#252932] border border-[#2d3139] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#FD5E03]/20 border border-[#FD5E03]/30 text-[#FD5E03] shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-[15px] leading-tight text-white">
                All 4 Registered Shops on Free Tier (100 Sales Limit)
              </h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                0 Pro Subscribers
              </span>
            </div>
            <p className="text-[12px] text-neutral-400 mt-1">
              Shops operate within the default 100 free sales quota. Additional multi-staff biller accounts remain locked until upgraded to Pro.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('subscription_plans')}
          className="px-3.5 py-1.5 rounded-lg bg-[#FD5E03] text-white hover:bg-[#e05302] text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm self-start sm:self-auto"
        >
          View Quotas
        </button>
      </div>

      {/* KPI Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total GMV */}
        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Total Platform GMV</span>
            <div className="p-1.5 rounded-lg bg-orange-50 text-[#FD5E03]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
            {formatINR(totalGMV)}
          </div>
          <div className="mt-1 text-[11.5px] text-gray-500">
            Across {completedBills.length} completed transactions
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Today&apos;s Live Sales</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
            {formatINR(todayGMV)}
          </div>
          <div className="mt-1 text-[11.5px] text-gray-500">
            {todayBills.length} bills processed today
          </div>
        </div>

        {/* Active Shops */}
        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Registered Shops</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
            {shops.length}
          </div>
          <div className="mt-1 text-[11.5px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {activeShops.length} active in system
          </div>
        </div>

        {/* Avg Ticket Size */}
        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Avg Bill Size</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
            {formatINR(avgBill)}
          </div>
          <div className="mt-1 text-[11.5px] text-gray-500">
            Pending dues: {formatINR(pendingGmv)}
          </div>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods Split */}
        <div className="bg-white rounded-xl p-5 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[14px] text-[#101318]">Payment Modes Split</h3>
            <span className="text-[11px] text-gray-400">Live DB</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">Cash Payment</span>
                <span className="font-bold text-[#101318]">{formatINR(cashGmv)} ({cashPct}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${cashPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">UPI / Online / GPay</span>
                <span className="font-bold text-[#FD5E03]">{formatINR(upiGmv)} ({upiPct}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-[#FD5E03] rounded-full" style={{ width: `${upiPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">Pending Amount</span>
                <span className="font-bold text-amber-600">{formatINR(pendingGmv)} ({pendingPct}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pendingPct}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 text-[11.5px] text-gray-500">
            Realtime distribution across all recorded Counter Pro orders.
          </div>
        </div>

        {/* Shop 100 Quotas Live Tracking */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[14px] text-[#101318]">Shop Sales & 100 Free Quota Tracker</h3>
            <button
              onClick={() => onNavigate('salons_360')}
              className="text-xs font-semibold text-[#FD5E03] hover:underline flex items-center gap-1"
            >
              All Shops <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {shops.map((shop) => {
              const shopBills = completedBills.filter((b) => b.shop_id === shop.id);
              const shopGmv = shopBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0);
              const usedSales = shopBills.length;
              const quotaPct = Math.min(Math.round((usedSales / 100) * 100), 100);

              return (
                <div
                  key={shop.id}
                  onClick={() => onOpenShopDrawer(shop)}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-gray-50/80 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-gray-900 truncate">
                        {shop.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-mono">
                        {shop.shop_type || 'General'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1">
                      <span>{shop.city || 'Tamil Nadu'}</span>
                      <span>•</span>
                      <span>{shop.phone}</span>
                    </div>
                  </div>

                  {/* Quota Progress */}
                  <div className="w-36 hidden sm:block">
                    <div className="flex items-center justify-between text-[10.5px] font-mono text-gray-600 mb-1">
                      <span>{usedSales}/100 Sales</span>
                      <span>{quotaPct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-[#FD5E03] rounded-full"
                        style={{ width: `${quotaPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs text-gray-900 font-heading">
                      {formatINR(shopGmv)}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {usedSales} orders
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders Live Table */}
      <div className="bg-white rounded-xl p-5 border border-[var(--color-divider)] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[14px] text-[#101318]">Recent Transactions</h3>
            <p className="text-[11px] text-gray-500">Live verified bills from Supabase database</p>
          </div>
          <button
            onClick={() => onNavigate('daily_bills')}
            className="text-xs font-semibold text-[#FD5E03] hover:underline flex items-center gap-1"
          >
            View All Bills <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {bills.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No bills recorded yet in Counter Pro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 text-gray-400 font-medium">
                <tr>
                  <th className="pb-2.5">Bill #</th>
                  <th className="pb-2.5">Shop</th>
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5">Payment</th>
                  <th className="pb-2.5 text-right">Amount</th>
                  <th className="pb-2.5 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bills.slice(0, 8).map((bill) => {
                  const shop = shops.find((s) => s.id === bill.shop_id);
                  return (
                    <tr key={bill.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-2.5 font-bold font-heading text-gray-900">
                        {bill.bill_number}
                      </td>
                      <td className="py-2.5 text-gray-700">
                        {shop?.name || 'Shop'}
                      </td>
                      <td className="py-2.5 text-gray-500">
                        {bill.customer_name || 'Walk-in'}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            bill.payment_mode?.toLowerCase().includes('pending')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-orange-50 text-[#FD5E03] border border-orange-200'
                          }`}
                        >
                          {bill.payment_mode || 'Cash'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-gray-900 font-heading">
                        {formatINR(Number(bill.total_amount || 0))}
                      </td>
                      <td className="py-2.5 text-right text-gray-400">
                        {timeAgo(bill.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
