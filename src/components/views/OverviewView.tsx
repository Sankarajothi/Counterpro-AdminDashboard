'use client';

import React from 'react';
import {
  Shop,
  Bill,
  BillItem,
  Subscription,
  Payment,
} from '../../types/database';
import { formatINR, formatLakhs } from '../../lib/adminData';

interface OverviewViewProps {
  shops: Shop[];
  bills: Bill[];
  billItems: BillItem[];
  subscriptions: Subscription[];
  payments: Payment[];
  period: string;
  onOpenShopDrawer: (shop: Shop) => void;
}

export function OverviewView({
  shops,
  bills,
  billItems,
  subscriptions,
  payments,
  period,
  onOpenShopDrawer,
}: OverviewViewProps) {
  // Filter bills by status
  const completedBills = bills.filter((b) => b.status === 'completed');
  const gmvTotal = completedBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0);
  const ordersTotal = completedBills.length;
  const avgBill = ordersTotal > 0 ? Math.round(gmvTotal / ordersTotal) : 0;

  const activeShops = shops.filter((s) => s.is_active);
  const activePct = shops.length > 0 ? Math.round((activeShops.length / shops.length) * 100) : 0;

  // Subscriptions
  const proSubs = subscriptions.filter((s) => s.plan === 'pro');
  const trialSubs = subscriptions.filter((s) => s.status === 'trialing');
  const expiredSubs = subscriptions.filter((s) => s.status === 'expired' || s.status === 'cancelled');
  const totalSubRevenue = subscriptions.reduce((acc, s) => acc + Number(s.amount || 199), 0);

  // Group GMV by month from bills
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthTotals: { [key: string]: number } = {};
  monthNames.forEach((m) => (monthTotals[m] = 0));

  completedBills.forEach((b) => {
    const d = new Date(b.completed_at || b.created_at);
    const m = monthNames[d.getMonth()];
    monthTotals[m] = (monthTotals[m] || 0) + Number(b.total_amount || 0);
  });

  // Calculate bars for the last 6-12 months
  const currentMonthIdx = new Date().getMonth();
  const displayMonths: { label: string; amount: number; pct: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const mIdx = (currentMonthIdx - i + 12) % 12;
    const mLabel = monthNames[mIdx];
    displayMonths.push({
      label: mLabel,
      amount: monthTotals[mLabel] || 0,
      pct: 0,
    });
  }

  const maxMonthGmv = Math.max(...displayMonths.map((d) => d.amount), 1);
  displayMonths.forEach((d) => {
    d.pct = Math.max(Math.round((d.amount / maxMonthGmv) * 100), d.amount > 0 ? 12 : 4);
  });

  // Shops by type
  const typeMap: { [key: string]: { count: number; gmv: number } } = {};
  shops.forEach((s) => {
    const t = s.shop_type || 'Other';
    if (!typeMap[t]) typeMap[t] = { count: 0, gmv: 0 };
    typeMap[t].count += 1;
  });

  completedBills.forEach((b) => {
    const shop = shops.find((s) => s.id === b.shop_id);
    const t = shop?.shop_type || 'Other';
    if (typeMap[t]) {
      typeMap[t].gmv += Number(b.total_amount || 0);
    }
  });

  const shopTypes = Object.entries(typeMap).map(([name, data]) => ({
    name,
    count: data.count,
    gmv: data.gmv,
  }));
  const maxTypeGmv = Math.max(...shopTypes.map((t) => t.gmv), 1);

  // Top Items aggregated from bill_items
  const itemMap: { [key: string]: { units: number; value: number; shopIds: Set<string> } } = {};
  billItems.forEach((bi) => {
    const name = bi.item_name || 'Unnamed Item';
    if (!itemMap[name]) {
      itemMap[name] = { units: 0, value: 0, shopIds: new Set() };
    }
    itemMap[name].units += Number(bi.quantity || 1);
    itemMap[name].value += Number(bi.line_total || bi.unit_price || 0);
    if (bi.shop_id) itemMap[name].shopIds.add(bi.shop_id);
  });

  const topItems = Object.entries(itemMap)
    .map(([name, data]) => ({
      name,
      units: data.units,
      value: data.value,
      shops: data.shopIds.size,
    }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 8);

  // Dynamic Real Needs-Attention Alerts
  const alerts: {
    id: string;
    title: string;
    subtitle: string;
    tag: string;
    color: string;
    shop: Shop | null;
  }[] = [];

  // Check 1: Shops with pending bill balances
  const shopsWithPending = shops.filter((s) => {
    const pendingSum = bills
      .filter((b) => b.shop_id === s.id && Number(b.pending_amount || 0) > 0)
      .reduce((sum, b) => sum + Number(b.pending_amount || 0), 0);
    return pendingSum > 0;
  });

  shopsWithPending.forEach((s) => {
    const pSum = bills
      .filter((b) => b.shop_id === s.id)
      .reduce((sum, b) => sum + Number(b.pending_amount || 0), 0);
    alerts.push({
      id: `pending-${s.id}`,
      title: s.name,
      subtitle: `${formatINR(pSum)} pending outstanding balance`,
      tag: 'Pending',
      color: '#FD5E03',
      shop: s,
    });
  });

  // Check 2: Shops on Trial
  shops.forEach((s) => {
    const sub = subscriptions.find((sub) => sub.shop_id === s.id);
    if (sub?.status === 'trialing') {
      alerts.push({
        id: `trial-${s.id}`,
        title: s.name,
        subtitle: `Trial period active (Pro features enabled)`,
        tag: 'Trial',
        color: '#EA580C',
        shop: s,
      });
    }
  });

  // Check 3: Printer or GST configuration alerts
  shops.forEach((s) => {
    if (!s.printer_enabled) {
      alerts.push({
        id: `printer-${s.id}`,
        title: s.name,
        subtitle: `Thermal bluetooth printer unconfigured`,
        tag: 'Setup',
        color: '#101318',
        shop: s,
      });
    }
  });

  const displayAlerts = alerts.slice(0, 5);

  return (
    <div className="flex flex-col gap-[22px]">
      {/* 6 Key Performance Indicator Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-[14px]">
        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">GMV PROCESSED</div>
          <div className="font-heading text-[30px] font-bold leading-none text-[#101318]">
            {formatLakhs(gmvTotal)}
          </div>
          <div className="text-[11px] text-[#FD5E03] font-semibold">
            {period.toUpperCase()}: {formatINR(gmvTotal)} processed
          </div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">ORDERS</div>
          <div className="font-heading text-[30px] font-bold leading-none text-[#101318]">
            {ordersTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-black/50">
            avg {formatINR(avgBill)} per bill
          </div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">REGISTERED SHOPS</div>
          <div className="font-heading text-[30px] font-bold leading-none text-[#101318]">
            {shops.length}
          </div>
          <div className="text-[11px] text-[#FD5E03] font-semibold">
            {activeShops.length} active on platform
          </div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">ACTIVE SHOPS</div>
          <div className="font-heading text-[30px] font-bold leading-none text-[#101318]">
            {activeShops.length}
          </div>
          <div className="text-[11px] text-black/50">
            {activePct}% of registered
          </div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">SUBSCRIPTION REVENUE</div>
          <div className="font-heading text-[30px] font-bold leading-none text-[#FD5E03]">
            {formatINR(totalSubRevenue)}
          </div>
          <div className="text-[11px] text-black/50">
            annual recurring, ₹199 / shop
          </div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">CHURN RISK</div>
          <div className="font-heading text-[30px] font-bold leading-none text-[#101318]">
            {expiredSubs.length + trialSubs.length}
          </div>
          <div className="text-[11px] text-black/50">
            {expiredSubs.length} expired, {trialSubs.length} trials ending
          </div>
        </div>
      </div>

      {/* Middle Section: GMV Processed Chart & Shops By Type */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-[18px] items-start">
        {/* GMV Processed Bar Chart */}
        <div className="bg-white rounded-[8px] shadow-sm p-[18px] border border-[var(--color-divider)]">
          <div className="flex items-baseline gap-2">
            <h3 className="m-0 text-[15px] font-bold text-[#101318]">
              GMV processed
            </h3>
            <span className="text-[11px] text-black/50 ml-auto">
              Total {formatLakhs(gmvTotal)} across platform
            </span>
          </div>

          <div className="flex items-end gap-2 h-[155px] mt-4 pt-4 border-b border-[var(--color-divider)]">
            {displayMonths.map((bar, i) => {
              const isCurrent = i === displayMonths.length - 1;
              return (
                <div
                  key={bar.label + i}
                  className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 group relative"
                >
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#101318] text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-20">
                    {formatINR(bar.amount)}
                  </div>
                  <div
                    style={{ height: `${bar.pct}%` }}
                    className={`w-full rounded-t-[3px] transition-all duration-300 ${
                      isCurrent
                        ? 'bg-[#101318]'
                        : bar.amount > 0
                        ? 'bg-[#FD5E03]'
                        : 'bg-gray-100'
                    }`}
                  />
                  <div className="text-[10px] text-black/50 font-medium">
                    {bar.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shops By Type & Subscription Mix */}
        <div className="bg-white rounded-[8px] shadow-sm p-[18px] border border-[var(--color-divider)]">
          <h3 className="m-0 mb-3 text-[15px] font-bold text-[#101318]">
            Shops by type
          </h3>
          <div className="flex flex-col gap-2.5">
            {shopTypes.map((t) => {
              const pct = Math.max(Math.round((t.gmv / maxTypeGmv) * 100), 10);
              return (
                <div key={t.name} className="flex items-center gap-2.5">
                  <span className="text-[13px] font-medium w-[95px] truncate">
                    {t.name}
                  </span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-[3px] overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-[#FD5E03] rounded-[3px]"
                    />
                  </div>
                  <span className="font-heading text-[13px] font-bold w-7 text-right text-[#101318]">
                    {t.count}
                  </span>
                  <span className="text-[11px] text-black/50 w-[78px] text-right">
                    {formatLakhs(t.gmv)}
                  </span>
                </div>
              );
            })}
          </div>

          <h3 className="m-0 mt-5 mb-2.5 text-[15px] font-bold text-[#101318]">
            Subscription mix
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#101318] flex-none" />
              <span className="text-[13px] font-medium flex-1">Pro — yearly</span>
              <span className="text-[11px] text-black/50">₹199 / year</span>
              <span className="font-heading text-[13px] font-bold w-12 text-right">
                {proSubs.length}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FD5E03] flex-none" />
              <span className="text-[13px] font-medium flex-1">Trial — 30 days</span>
              <span className="text-[11px] text-black/50">all active</span>
              <span className="font-heading text-[13px] font-bold w-12 text-right">
                {trialSubs.length}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FDBA74] flex-none" />
              <span className="text-[13px] font-medium flex-1">Expired</span>
              <span className="text-[11px] text-black/50">win-back queue</span>
              <span className="font-heading text-[13px] font-bold w-12 text-right">
                {expiredSubs.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top items & Needs Attention */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[18px] items-start">
        {/* Top Items Table */}
        <div className="bg-white rounded-[8px] shadow-sm p-[18px] border border-[var(--color-divider)]">
          <div className="flex items-baseline">
            <h3 className="m-0 text-[15px] font-bold text-[#101318]">
              Top items — all shops
            </h3>
            <span className="text-[11px] text-black/50 ml-auto">
              ranked by units
            </span>
          </div>

          <div className="overflow-x-auto mt-2.5">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="text-right">Units</th>
                  <th className="text-right">Value</th>
                  <th className="text-right">Shops</th>
                </tr>
              </thead>
              <tbody>
                {topItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-black/40 py-6">
                      No bill items recorded yet.
                    </td>
                  </tr>
                ) : (
                  topItems.map((item) => (
                    <tr key={item.name}>
                      <td className="font-medium text-[#101318]">{item.name}</td>
                      <td className="text-right font-heading font-semibold text-[#101318]">
                        {item.units.toLocaleString('en-IN')}
                      </td>
                      <td className="text-right font-heading font-semibold text-[#101318]">
                        {formatLakhs(item.value)}
                      </td>
                      <td className="text-right text-black/50 text-[12px]">
                        {item.shops} {item.shops === 1 ? 'shop' : 'shops'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Needs Attention Alerts */}
        <div className="bg-white rounded-[8px] shadow-sm p-[18px] border border-[var(--color-divider)]">
          <div className="flex items-baseline">
            <h3 className="m-0 text-[15px] font-bold text-[#101318]">
              Needs attention
            </h3>
            <span className="tag tag-outline ml-auto font-mono text-[11px]">
              {displayAlerts.length} OPEN
            </span>
          </div>

          <div className="flex flex-col gap-2.5 mt-3">
            {displayAlerts.length === 0 ? (
              <div className="text-[13px] text-black/40 italic py-6 text-center">
                All shops operating smoothly. No urgent alerts.
              </div>
            ) : (
              displayAlerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => alert.shop && onOpenShopDrawer(alert.shop)}
                  className="flex items-center gap-3 p-[11px_12px] border-0 border-l-[3px] bg-[#F8F9FA] rounded-[6px] text-left hover:bg-[#FFF7ED] transition-colors cursor-pointer group"
                  style={{ borderLeftColor: alert.color }}
                >
                  <div className="flex-1 min-w-0">
                    <span className="block font-heading text-[14px] font-bold text-[#101318] group-hover:text-[#FD5E03] transition-colors truncate">
                      {alert.title}
                    </span>
                    <span className="text-[11px] text-black/50 truncate block">
                      {alert.subtitle}
                    </span>
                  </div>
                  <span
                    className="tag font-semibold"
                    style={{
                      backgroundColor: alert.tag === 'Pending' ? '#FFF7ED' : '#F3F4F6',
                      color: alert.tag === 'Pending' ? '#C2410C' : '#1F2937',
                    }}
                  >
                    {alert.tag}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
