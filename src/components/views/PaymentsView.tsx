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

  // Annual Recurring Revenue
  const proSubs = subscriptions.filter((s) => s.plan === 'pro');
  const annualRecurring = proSubs.reduce((acc, s) => acc + Number(s.amount || 199), 0);

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

  // 1. Subscription records
  subscriptions.forEach((sub, i) => {
    const shop = shops.find((s) => s.id === sub.shop_id) || null;
    const isPaid = sub.plan === 'pro' && sub.status !== 'past_due' && sub.status !== 'cancelled';
    const status = sub.status === 'trialing' ? 'PENDING' : isPaid ? 'PAID' : 'FAILED';
    paymentRows.push({
      id: sub.id,
      shop,
      shopName: shop?.name || 'Unknown Shop',
      ref: `sub_${sub.id.substring(0, 8)}`,
      plan: `Pro — ${sub.interval || 'yearly'}`,
      mode: 'Subscription (UPI/Online)',
      amount: Number(sub.amount || 199),
      date: formatDate(sub.current_period_start || sub.created_at),
      status,
    });
  });

  // 2. POS payments records
  payments.forEach((pay, i) => {
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
      plan: 'Counter Sale',
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
          <div className="card-kicker">COLLECTED — {period.toUpperCase()}</div>
          <div className="font-heading text-[30px] font-bold leading-none text-[#101318]">
            {formatINR(totalCollected)}
          </div>
          <div className="text-[11px] text-black/50">
            {successfulPayments.length} successful payment charges
          </div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">ANNUAL RECURRING (ARR)</div>
          <div className="font-heading text-[30px] font-bold leading-none text-[#FD5E03]">
            {formatINR(annualRecurring)}
          </div>
          <div className="text-[11px] text-black/50">
            {proSubs.length} Pro active shops
          </div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">FAILED</div>
          <div className="font-heading text-[30px] font-bold leading-none text-[#101318]">
            {failedCount}
          </div>
          <div className="text-[11px] text-black/50">
            declined / cancelled
          </div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">PENDING / TRIAL</div>
          <div className="font-heading text-[30px] font-bold leading-none text-[#101318]">
            {pendingCount}
          </div>
          <div className="text-[11px] text-black/50">
            trial conversions in flight
          </div>
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
