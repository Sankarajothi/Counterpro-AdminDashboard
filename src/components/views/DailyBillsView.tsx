'use client';

import React, { useState, useMemo } from 'react';
import { Shop, Bill, Payment } from '../../types/database';
import { formatINR, timeAgo, formatDate, formatTime } from '../../lib/adminData';
import {
  Receipt,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  Filter,
  Download,
  Store,
  DollarSign,
  X,
  CreditCard,
  User,
  Calendar,
  FileText,
} from 'lucide-react';

interface DailyBillsViewProps {
  bills: Bill[];
  shops: Shop[];
  payments: Payment[];
  onOpenShopDrawer?: (shop: Shop) => void;
  onShowToast?: (msg: string) => void;
}

export function DailyBillsView({
  bills,
  shops,
  payments,
  onOpenShopDrawer,
  onShowToast,
}: DailyBillsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shopFilter, setShopFilter] = useState('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const completedBills = useMemo(() => bills.filter((b) => b.status === 'completed'), [bills]);
  const totalGMV = useMemo(
    () => completedBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0),
    [completedBills]
  );
  const totalPaid = useMemo(
    () => completedBills.reduce((acc, b) => acc + Number(b.paid_amount || b.total_amount || 0), 0),
    [completedBills]
  );
  const totalPending = useMemo(
    () => completedBills.reduce((acc, b) => acc + Number(b.pending_amount || 0), 0),
    [completedBills]
  );
  const avgBill = completedBills.length > 0 ? Math.round(totalGMV / completedBills.length) : 0;

  // Filter bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (b.bill_number && b.bill_number.toLowerCase().includes(q)) ||
        (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
        (b.customer_phone && b.customer_phone.includes(q));

      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchesShop = shopFilter === 'all' || b.shop_id === shopFilter;

      const mode = (b.payment_mode || '').toLowerCase();
      let matchesMode = true;
      if (paymentModeFilter === 'cash') matchesMode = mode.includes('cash');
      else if (paymentModeFilter === 'upi') matchesMode = mode.includes('upi') || mode.includes('gpay') || mode.includes('online');
      else if (paymentModeFilter === 'pending') matchesMode = Number(b.pending_amount || 0) > 0 || mode.includes('pending');

      return matchesSearch && matchesStatus && matchesShop && matchesMode;
    });
  }, [bills, searchQuery, statusFilter, shopFilter, paymentModeFilter]);

  const handleExportCSV = () => {
    if (filteredBills.length === 0) {
      onShowToast?.('No bills to export.');
      return;
    }

    const headers = [
      'BILL NUMBER',
      'SHOP NAME',
      'CUSTOMER NAME',
      'CUSTOMER PHONE',
      'PAYMENT MODE',
      'STATUS',
      'SUBTOTAL (INR)',
      'GST AMOUNT (INR)',
      'TOTAL AMOUNT (INR)',
      'PAID AMOUNT (INR)',
      'PENDING AMOUNT (INR)',
      'DATE & TIME',
    ];

    const rows = filteredBills.map((b) => {
      const shop = shops.find((s) => s.id === b.shop_id);
      return [
        `"#${b.bill_number}"`,
        `"${shop?.name || 'Shop'}"`,
        `"${b.customer_name || 'Walk-in'}"`,
        `"${b.customer_phone || ''}"`,
        `"${b.payment_mode || 'Cash'}"`,
        `"${b.status}"`,
        b.subtotal || 0,
        b.gst_amount || 0,
        b.total_amount || 0,
        b.paid_amount || 0,
        b.pending_amount || 0,
        `"${formatDate(b.created_at)} ${formatTime(b.created_at)}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily-bills-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast?.(`Exported ${filteredBills.length} bills to CSV`);
  };

  return (
    <div className="space-y-6 font-sans select-none animate-in fade-in duration-150">
      {/* 1. Header Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#11141a] via-[#1c1f28] to-[#11141a] border border-[#2b303c] p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#FD5E03]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FD5E03] animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider text-[#FD5E03] uppercase">
                Transaction Feed & Orders Console
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white m-0">
              Daily Order Metrics & Invoices
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed m-0">
              Audited transaction ledger across all Counter Pro registers, payment settlement states, customer billings, and live receipts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-[#FD5E03] hover:bg-[#ea5602] text-white text-xs font-bold transition-all shadow-md shadow-[#FD5E03]/30 flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Order Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-[#FD5E03]/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Total Orders Logged</span>
            <div className="p-2 rounded-xl bg-[#FFF7ED] text-[#FD5E03]">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {bills.length}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>{completedBills.length} Completed</span>
            <span className="text-emerald-600 font-bold">100% Real DB</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-emerald-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Gross Sales Volume</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {formatINR(totalGMV)}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Paid: {formatINR(totalPaid)}</span>
            <span className="text-emerald-600 font-semibold">Settled</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-amber-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Pending Credit (Udhaar)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {formatINR(totalPending)}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Pending settlement</span>
            <span className="text-amber-700 font-bold font-mono">Udhaar</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-purple-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Average Ticket Size</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {formatINR(avgBill)}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Per completed checkout</span>
            <span className="text-purple-600 font-bold">POS Average</span>
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
              placeholder="Search bill number, customer name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#FD5E03] focus:outline-hidden transition-all text-gray-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-hidden focus:border-[#FD5E03]"
          >
            <option value="all">All Shops ({shops.length})</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-hidden focus:border-[#FD5E03]"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentModeFilter}
            onChange={(e) => setPaymentModeFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-hidden focus:border-[#FD5E03]"
          >
            <option value="all">All Payment Modes</option>
            <option value="cash">Cash Only</option>
            <option value="upi">UPI / Online / QR</option>
            <option value="pending">Pending Credit</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery('');
              setShopFilter('all');
              setStatusFilter('all');
              setPaymentModeFilter('all');
            }}
            className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 4. Complete Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-[#FAFAFB] border-b border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing <strong className="text-gray-900">{filteredBills.length}</strong> of {bills.length} total orders
          </div>
          <div className="font-mono text-gray-400">
            Click any row to inspect invoice details
          </div>
        </div>

        {filteredBills.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-xs">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <div className="font-semibold text-gray-700 text-sm">No orders match the selected criteria.</div>
            <div className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
              {bills.length === 0
                ? 'No transactions have been processed on Counter Pro yet.'
                : 'Try clearing your search query or reset filter options.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAFAFB] text-gray-500 uppercase text-[10.5px] font-bold tracking-wider">
                  <th className="py-3 px-4">Bill #</th>
                  <th className="py-3 px-4">Outlet</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Bill Total (₹)</th>
                  <th className="py-3 px-4 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBills.map((bill) => {
                  const shop = shops.find((s) => s.id === bill.shop_id);
                  const isPending = (bill.payment_mode || '').toLowerCase().includes('pending') || Number(bPendingAmount(bill)) > 0;

                  return (
                    <tr
                      key={bill.id}
                      onClick={() => setSelectedBill(bill)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Bill Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        #{bill.bill_number}
                      </td>

                      {/* Outlet */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {shop?.name || 'General Outlet'}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 text-gray-700">
                        <div className="font-medium text-gray-900">{bill.customer_name || 'Walk-in Shopper'}</div>
                        {bill.customer_phone && (
                          <div className="text-[10.5px] text-gray-400 font-mono">{bill.customer_phone}</div>
                        )}
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-[#FFF7ED] text-[#FD5E03] border border-[#FED7AA]'
                          }`}
                        >
                          {bill.payment_mode || 'Cash'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            bill.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                        {formatINR(Number(bill.total_amount || 0))}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-right text-gray-500 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(bill.created_at)} {formatTime(bill.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Bill Details Modal / Drawer */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FFF7ED] text-[#FD5E03]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 m-0">
                    Invoice #{selectedBill.bill_number}
                  </h3>
                  <p className="text-[11px] text-gray-400 m-0 font-mono">
                    ID: {selectedBill.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <span className="text-gray-400 text-[10.5px]">Store</span>
                  <div className="font-semibold text-gray-900">
                    {shops.find((s) => s.id === selectedBill.shop_id)?.name || 'Store'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-[10.5px]">Shopper</span>
                  <div className="font-semibold text-gray-900">
                    {selectedBill.customer_name || 'Walk-in'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-[10.5px]">Payment Mode</span>
                  <div className="font-bold text-[#FD5E03]">
                    {selectedBill.payment_mode || 'Cash'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-[10.5px]">Status</span>
                  <div className="font-bold text-emerald-700 uppercase">
                    {selectedBill.status}
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold">{formatINR(Number(selectedBill.subtotal || 0))}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST Tax</span>
                  <span className="font-mono">{formatINR(Number(selectedBill.gst_amount || 0))}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Pending Balance (Udhaar)</span>
                  <span className="font-mono text-amber-600 font-bold">{formatINR(Number(selectedBill.pending_amount || 0))}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span className="font-mono text-[#FD5E03]">{formatINR(Number(selectedBill.total_amount || 0))}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => setSelectedBill(null)}
                className="w-full py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function bPendingAmount(bill: Bill) {
  return bill.pending_amount || 0;
}
