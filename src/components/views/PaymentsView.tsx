'use client';

import React, { useState } from 'react';
import { Shop, Subscription, Payment, Bill } from '../../types/database';
import { formatINR, formatDate, timeAgo } from '../../lib/adminData';
import {
  CreditCard,
  Download,
  Printer,
  Search,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  DollarSign
} from 'lucide-react';

interface PaymentsViewProps {
  shops: Shop[];
  subscriptions: Subscription[];
  payments: Payment[];
  bills: Bill[];
  period: string;
  searchQuery: string;
  onOpenShopDrawer: (shop: Shop) => void;
  onShowToast?: (msg: string) => void;
}

export function PaymentsView({
  shops,
  subscriptions,
  payments,
  bills,
  period,
  searchQuery,
  onOpenShopDrawer,
  onShowToast,
}: PaymentsViewProps) {
  const [filter, setFilter] = useState('All');
  const [localSearch, setLocalSearch] = useState('');

  // Successful payments sum
  const successfulPayments = payments.filter((p) => p.status === 'successful');
  const totalCollected = successfulPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  // Annual Recurring Revenue from real Pro subscriptions only
  const proSubs = subscriptions.filter((s) => s.plan?.toLowerCase() === 'pro');
  const annualRecurring = proSubs.reduce((acc, s) => acc + Number(s.amount || 0), 0);

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
      shopName: shop?.name || 'Registered Store',
      ref: `sub_${sub.id.substring(0, 8)}`,
      plan: isPro ? `Pro Plan (${sub.interval || 'yearly'})` : 'Free Lifetime (100 Sales Limit)',
      mode: isPro ? 'UPI / Online' : 'Free Tier Grant',
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
      shopName: shop?.name || 'Counter POS Shop',
      ref: `txn_${pay.id.substring(0, 8)}${bill?.bill_number ? ` (#${bill.bill_number})` : ''}`,
      plan: 'Counter POS Bill',
      mode: pay.payment_method || 'Cash',
      amount: Number(pay.amount || 0),
      date: formatDate(pay.paid_at || pay.created_at),
      status,
    });
  });

  const filterChips = ['All', 'Paid', 'Pending', 'Failed', 'Refunded'];

  // Filtering
  const effectiveQuery = (searchQuery || localSearch).trim().toLowerCase();
  let filtered = paymentRows.filter((p) => {
    if (!effectiveQuery) return true;
    return `${p.shopName} ${p.ref} ${p.plan} ${p.mode}`.toLowerCase().includes(effectiveQuery);
  });

  if (filter !== 'All') {
    filtered = filtered.filter((p) => p.status.toUpperCase() === filter.toUpperCase());
  }

  // Quota high usage shops
  const nearQuotaShops = shops.filter((s) => {
    const shopBills = bills.filter((b) => b.shop_id === s.id && b.status === 'completed');
    return shopBills.length >= 50;
  });

  // WhatsApp Alert for near quota
  const handleQuotaAlert = (phone: string, name: string, sales: number) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      if (onShowToast) onShowToast('No phone number recorded.');
      return;
    }
    const remaining = Math.max(0, 100 - sales);
    const msg = encodeURIComponent(
      `Hello ${name}! This is CounterPro Admin. Your store has used ${sales}/100 free sales (${remaining} remaining). Please upgrade to CounterPro Pro to avoid billing interruptions once 100 bills are reached.`
    );
    window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
    if (onShowToast) onShowToast(`Sent quota alert to ${name}`);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!paymentRows.length) {
      if (onShowToast) onShowToast('No transactions to export.');
      return;
    }
    const headers = ['Transaction Ref', 'Shop Name', 'Type/Plan', 'Payment Mode', 'Amount (INR)', 'Date', 'Status'];
    const rows = paymentRows.map((p) => [
      `"${p.ref}"`,
      `"${p.shopName.replace(/"/g, '""')}"`,
      `"${p.plan}"`,
      `"${p.mode}"`,
      p.amount,
      `"${p.date}"`,
      p.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `counterpro-payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onShowToast) onShowToast('Exported Payment Ledger CSV');
  };

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Hero Banner */}
      <div className="bg-white rounded-xl shadow-xs p-5 border border-gray-200/80 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FD5E03] animate-pulse" />
            <h2 className="text-[17px] font-bold text-[#101318] m-0">
              Subscription Plans & Payment Ledger
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FD5E03] border border-orange-200 font-semibold">
              100-Quota Governance
            </span>
          </div>
          <p className="text-xs text-gray-500 m-0 mt-1">
            Tracking merchant 100-bill allowances, subscription status, and live retail POS collection records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary text-xs min-h-[34px] px-3 gap-1.5 border-gray-300 hover:border-[#FD5E03]"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary text-xs min-h-[34px] px-3 gap-1.5 border-gray-300"
          >
            <Printer className="w-3.5 h-3.5 text-gray-500" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* 4 Payment KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">POS BILLING SETTLED</div>
            <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
              {formatINR(totalCollected)}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium">
            {successfulPayments.length} transactions paid
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">SUBSCRIPTION ARR</div>
            <div className="mt-2 text-2xl font-bold font-heading text-gray-400">
              {formatINR(annualRecurring)}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-gray-400">
            {proSubs.length} active Pro subscribers
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">FREE TIER (100 LIMIT)</div>
            <div className="mt-2 text-2xl font-bold font-heading text-[#FD5E03]">
              {shops.length - proSubs.length}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-medium">
            Stores on 100 free sales cap
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">HIGH QUOTA CONSUMPTION</div>
            <div className="mt-2 text-2xl font-bold font-heading text-red-600">
              {nearQuotaShops.length}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-red-600 font-medium">
            Stores at &ge; 50% of free quota
          </div>
        </div>
      </div>

      {/* 100 Sales Limit Tracking Section */}
      <div className="bg-white rounded-xl shadow-xs p-5 border border-gray-200/80">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4 flex-wrap gap-2">
          <div>
            <h3 className="m-0 text-sm font-bold text-[#101318] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FD5E03]" />
              <span>100 Sales Quota Tracker & Upgrade Watchlist</span>
            </h3>
            <p className="text-xs text-gray-500 m-0 mt-0.5">
              Free Tier shops are restricted to 100 completed bills. Trigger proactive WhatsApp outreach when nearing the limit.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-[#FD5E03] border border-orange-200 font-bold">
            100 SALES CAP ENFORCED
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {shops.map((s) => {
            const FREE_LIMIT = 100;
            const shopBills = bills.filter((b) => b.shop_id === s.id && b.status === 'completed');
            const sub = subscriptions.find((sub) => sub.shop_id === s.id);
            const isPro = sub?.plan?.toLowerCase() === 'pro';
            const count = shopBills.length;
            const remaining = Math.max(0, FREE_LIMIT - count);
            const percent = Math.min(100, Math.round((count / FREE_LIMIT) * 100));

            return (
              <div
                key={s.id}
                className="p-3.5 rounded-xl border border-gray-200/80 bg-[#FAFAFB] hover:bg-white hover:border-orange-200 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-gray-900 truncate max-w-[130px]">{s.name}</span>
                    <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold uppercase ${isPro ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-[#FD5E03]'}`}>
                      {isPro ? 'PRO' : 'FREE'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mb-3">
                    {s.city || 'India'} &bull; +91 {s.phone}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-gray-800">{count} / {FREE_LIMIT} bills</span>
                    <span className="text-[#FD5E03] font-mono font-bold text-[11px]">{remaining} left</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden mb-2.5">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent > 80 ? 'bg-red-500' : 'bg-[#FD5E03]'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <button
                    onClick={() => handleQuotaAlert(s.phone, s.name, count)}
                    className="w-full text-[11px] py-1 rounded font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>WhatsApp Quota Alert</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscription & POS Payments Table */}
      <div className="bg-white rounded-xl shadow-xs p-5 border border-gray-200/80">
        <div className="flex items-center justify-between gap-3 flex-wrap pb-4 border-b border-gray-100">
          <div>
            <h3 className="m-0 text-sm font-bold text-[#101318]">
              Transaction & Subscription Ledger
            </h3>
            <p className="text-xs text-gray-400 m-0 mt-0.5">
              Live records from Supabase payments and subscriptions tables
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {filterChips.map((chip) => {
              const isActive = filter === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setFilter(chip)}
                  className={`min-h-[32px] px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    isActive
                      ? 'border-[#FD5E03] bg-[#FD5E03] text-white shadow-xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-200'
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] text-gray-400 uppercase tracking-wider">
                <th className="py-3 text-left">Store & Reference ID</th>
                <th className="py-3 text-left">Plan / Category</th>
                <th className="py-3 text-left">Payment Mode</th>
                <th className="text-right py-3">Amount</th>
                <th className="text-right py-3">Timestamp</th>
                <th className="text-right py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-12 text-xs">
                    No transaction matches the current filter &ldquo;{filter}&rdquo;.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => p.shop && onOpenShopDrawer(p.shop)}
                    className={p.shop ? 'cursor-pointer hover:bg-orange-50/30 transition-colors' : ''}
                  >
                    <td className="py-3.5">
                      <span className="block font-heading font-bold text-xs text-[#101318]">
                        {p.shopName}
                      </span>
                      <span className="text-[10.5px] text-gray-400 font-mono">
                        {p.ref}
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-gray-700">{p.plan}</td>
                    <td className="py-3.5 text-xs font-medium text-gray-700">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-[11px]">
                        {p.mode}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-heading font-bold text-xs text-[#101318]">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3.5 text-right text-gray-400 text-xs">
                      {p.date}
                    </td>
                    <td className="py-3.5 text-right">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          p.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
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
