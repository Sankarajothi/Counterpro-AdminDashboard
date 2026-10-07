'use client';

import React, { useState } from 'react';
import { Shop, Subscription, Payment, Bill } from '../../types/database';
import { formatINR, formatDate } from '../../lib/adminData';

interface PaymentsViewProps {
  shops: Shop[];
  subscriptions: Subscription[];
  payments: Payment[];
  bills: Bill[];
  period: string;
  searchQuery: string;
  onOpenShopDrawer: (shop: Shop) => void;
}

export function PaymentsView({
  shops,
  subscriptions,
  payments,
  bills,
  period,
  searchQuery,
  onOpenShopDrawer,
}: PaymentsViewProps) {
  const [filter, setFilter] = useState('All');

  // Successful payments sum
  const successfulPayments = payments.filter((p) => p.status === 'successful');
  const totalCollected = successfulPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  // Annual Recurring Revenue from real Pro subscriptions only
  const proSubs = subscriptions.filter((s) => s.plan?.toLowerCase() === 'pro');
  const annualRecurring = proSubs.reduce((acc, s) => acc + Number(s.amount || 0), 0);
  const freeSubs = subscriptions.filter((s) => s.plan?.toLowerCase() !== 'pro');

  const failedCount = payments.filter((p) => p.status === 'failed').length;
  const pendingCount = subscriptions.filter((s) => s.status === 'trialing' || s.status === 'pending').length;

  // Build rows combining subscriptions and payments
  const paymentRows: {
    id: string;
    shop: Shop | null;
    shopName: string;
    ref: string;
    plan: string;
    mode: string;
    amount: number;
    date: string;
    status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  }[] = [];

  // 1. Real Subscription records
  subscriptions.forEach((sub) => {
    const shop = shops.find((s) => s.id === sub.shop_id) || null;
    const isPro = sub.plan?.toLowerCase() === 'pro';
    paymentRows.push({
      id: sub.id,
      shop,
      shopName: shop?.name || 'Unknown Shop',
      ref: `sub_${sub.id.substring(0, 8)}`,
      plan: isPro ? `Pro — ${sub.interval || 'yearly'}` : `Free Plan (100 Sales Limit)`,
      mode: isPro ? 'UPI / Online' : 'Free Lifetime Plan',
      amount: Number(sub.amount || 0),
      date: formatDate(sub.current_period_start || sub.created_at),
      status: 'PAID',
    });
  });

  // 2. POS payments records
  payments.forEach((pay) => {
    const shop = shops.find((s) => s.id === pay.shop_id) || null;
    const bill = bills.find((b) => b.id === pay.bill_id);
    const status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED' =
      pay.status === 'successful'
        ? 'PAID'
        : pay.status === 'failed'
        ? 'FAILED'
        : pay.status === 'refunded'
        ? 'REFUNDED'
        : 'PENDING';

    paymentRows.push({
      id: pay.id,
      shop,
      shopName: shop?.name || 'POS Shop',
      ref: `txn_${pay.id.substring(0, 8)}${bill?.bill_number ? ` (${bill.bill_number})` : ''}`,
      plan: 'Counter POS Bill',
      mode: pay.payment_method || 'Cash',
      amount: Number(pay.amount || 0),
      date: formatDate(pay.paid_at || pay.created_at),
      status,
    });
  });

  const filterChips = ['All', 'Paid', 'Pending', 'Failed', 'Refunded'];

  // Filtering
  const q = searchQuery.trim().toLowerCase();
  let filtered = paymentRows.filter((p) => {
    if (!q) return true;
    return `${p.shopName} ${p.ref} ${p.plan} ${p.mode}`.toLowerCase().includes(q);
  });

  if (filter !== 'All') {
    filtered = filtered.filter((p) => p.status.toUpperCase() === filter.toUpperCase());
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {/* 4 Payment KPIs */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-[14px]">
        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">POS BILLING COLLECTED</div>
          <div className="font-heading text-[30px] font-bold leading-none text-[#101318]">
            {formatINR(totalCollected)}
          </div>
          <div className="text-[11px] text-black/50">
            {successfulPayments.length} counter sales settled
          </div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">SUBSCRIPTION ARR</div>
          <div className="font-heading text-[30px] font-bold leading-none text-gray-400">
            {formatINR(annualRecurring)}
          </div>
          <div className="text-[11px] text-black/50">
            {proSubs.length} Pro active shops
          </div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">PRO SUBSCRIBERS</div>
          <div className="font-heading text-[30px] font-bold leading-none text-gray-400">
            0 <span className="text-[16px] font-normal text-gray-400">/ {shops.length}</span>
          </div>
          <div className="text-[11px] text-black/50">
            0% paid subscriber rate
          </div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">FREE SHOPS ON 100 LIMIT</div>
          <div className="font-heading text-[30px] font-bold leading-none text-[#FD5E03]">
            {shops.length - proSubs.length}
          </div>
          <div className="text-[11px] text-black/50">
            capped at 100 free sales per shop
          </div>
        </div>
      </div>

      {/* 100 Sales Limit Tracking Section */}
      <div className="bg-white rounded-[8px] shadow-sm p-[16px_18px] border border-[var(--color-divider)]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-divider)] mb-3">
          <div>
            <h3 className="m-0 text-[15px] font-bold text-[#101318]">
              100 Sales Limit & Free Quota Consumption
            </h3>
            <p className="text-xs text-gray-500 m-0 mt-0.5">
              Shops on Free Tier are restricted to 100 sales. Once reached, they must subscribe to CounterPro Pro for unlimited billing.
            </p>
          </div>
          <span className="tag bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] font-bold text-xs">
            100 SALES CAP APPLIES
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {shops.map((s) => {
            const FREE_LIMIT = 100;
            const shopBills = bills.filter((b) => b.shop_id === s.id && b.status === 'completed');
            const sub = subscriptions.find((sub) => sub.shop_id === s.id);
            const isPro = sub?.plan?.toLowerCase() === 'pro';
            const count = shopBills.length;
            const remaining = Math.max(0, FREE_LIMIT - count);
            const percent = Math.min(100, Math.round((count / FREE_LIMIT) * 100));

            return (
              <div key={s.id} className="p-3 rounded-lg border border-gray-200 bg-[#FAFAFB] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-gray-900 truncate max-w-[130px]">{s.name}</span>
                    <span className={`tag text-[9.5px] font-bold ${isPro ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                      {isPro ? 'PRO' : 'FREE'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mb-2">
                    {s.city} &bull; +91 {s.phone}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-800">{count} / {FREE_LIMIT} sales</span>
                    <span className="text-[#FD5E03] font-mono font-bold text-[11px]">{remaining} left</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent > 80 ? 'bg-red-500' : 'bg-[#FD5E03]'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscription & POS Payments Table */}
      <div className="bg-white rounded-[8px] shadow-sm p-[16px_16px_10px] border border-[var(--color-divider)]">
        <div className="flex items-center gap-2 flex-wrap pb-3.5 border-b border-[var(--color-divider)]">
          <h3 className="m-0 text-[15px] font-bold text-[#101318] mr-2">
            Subscription & POS payments
          </h3>
          <div className="flex gap-2 flex-wrap ml-auto">
            {filterChips.map((chip) => {
              const isActive = filter === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setFilter(chip)}
                  className={`min-h-[32px] px-3 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer border ${
                    isActive
                      ? 'border-[#FD5E03] bg-[#FD5E03] text-white'
                      : 'border-[var(--color-divider)] bg-white text-[#101318] hover:bg-[#FFF7ED]'
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Shop & Ref</th>
                <th>Plan / Type</th>
                <th>Mode</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Date</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-black/40 py-8">
                    Nothing matches this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => p.shop && onOpenShopDrawer(p.shop)}
                    className={p.shop ? 'cursor-pointer hover:bg-[#FFF7ED]/50 transition-colors' : ''}
                  >
                    <td>
                      <span className="block font-heading font-bold text-[14px] text-[#101318]">
                        {p.shopName}
                      </span>
                      <span className="text-[11px] text-black/50 font-mono">
                        {p.ref}
                      </span>
                    </td>
                    <td className="text-black/70 text-[12.5px]">{p.plan}</td>
                    <td className="text-black/70 text-[12.5px]">{p.mode}</td>
                    <td className="text-right font-heading font-semibold text-[#101318]">
                      {formatINR(p.amount)}
                    </td>
                    <td className="text-right text-black/50 text-[12px]">
                      {p.date}
                    </td>
                    <td className="text-right">
                      <span
                        className={`tag ${
                          p.status === 'PAID'
                            ? 'bg-[#101318] text-white'
                            : p.status === 'PENDING'
                            ? 'bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
