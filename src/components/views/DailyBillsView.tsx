'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

interface DailyBillsViewProps {
  bills: Bill[];
  shops: Shop[];
  payments: Payment[];
  onOpenShopDrawer?: (shop: Shop) => void;
}

export function DailyBillsView({
  bills,
  shops,
  payments,
  onOpenShopDrawer,
}: DailyBillsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shopFilter, setShopFilter] = useState('all');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const completedBills = bills.filter((b) => b.status === 'completed');
  const totalGMV = completedBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0);
  const totalPaid = completedBills.reduce((acc, b) => acc + Number(b.paid_amount || b.total_amount || 0), 0);
  const totalPending = completedBills.reduce((acc, b) => acc + Number(b.pending_amount || 0), 0);

  // Filter bills
  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      !searchQuery ||
      b.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.customer_name && b.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.customer_phone && b.customer_phone.includes(searchQuery));
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesShop = shopFilter === 'all' || b.shop_id === shopFilter;
    return matchesSearch && matchesStatus && matchesShop;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Total Orders Logged</span>
            <div className="p-1.5 rounded-lg bg-orange-50 text-[#FD5E03]">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
            {bills.length}
          </div>
          <div className="mt-1 text-[11.5px] text-gray-500">
            {completedBills.length} completed successfully
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Total Gross Sales</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-emerald-700">
            {formatINR(totalGMV)}
          </div>
          <div className="mt-1 text-[11.5px] text-gray-500">
            Collected: {formatINR(totalPaid)}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Pending Balance</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-amber-700">
            {formatINR(totalPending)}
          </div>
          <div className="mt-1 text-[11.5px] text-gray-500">
            Customer balance across shops
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Average Bill Size</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <ArrowUpDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
            {completedBills.length > 0
              ? formatINR(Math.round(totalGMV / completedBills.length))
              : '₹0'}
          </div>
          <div className="mt-1 text-[11.5px] text-gray-500">
            Average ticket per customer
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[var(--color-divider)] shadow-xs flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Bill #, customer name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FD5E03] focus:bg-white transition-all"
          />
        </div>

        <select
          value={shopFilter}
          onChange={(e) => setShopFilter(e.target.value)}
          className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-[#FD5E03]"
        >
          <option value="all">All Shops</option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-[#FD5E03]"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="draft">Draft</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl p-5 border border-[var(--color-divider)] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[14px] text-[#101318]">Order Transactions Log</h3>
            <p className="text-[11px] text-gray-500">
              Showing {filteredBills.length} orders verified from Counter Pro database
            </p>
          </div>
        </div>

        {filteredBills.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            No bills match your current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 text-gray-400 font-medium">
                <tr>
                  <th className="pb-2.5">Bill #</th>
                  <th className="pb-2.5">Shop</th>
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5">Payment Mode</th>
                  <th className="pb-2.5 text-center">Status</th>
                  <th className="pb-2.5 text-right">Pending</th>
                  <th className="pb-2.5 text-right">Total Amount</th>
                  <th className="pb-2.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBills.map((bill) => {
                  const shop = shops.find((s) => s.id === bill.shop_id);
                  const isPending = Number(bill.pending_amount || 0) > 0;

                  return (
                    <tr
                      key={bill.id}
                      onClick={() => setSelectedBill(bill)}
                      className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3 font-bold font-heading text-gray-900">
                        {bill.bill_number}
                      </td>
                      <td className="py-3 text-gray-700 font-medium">
                        {shop?.name || 'Shop'}
                      </td>
                      <td className="py-3 text-gray-500">
                        <div>{bill.customer_name || 'Walk-in'}</div>
                        {bill.customer_phone && (
                          <div className="text-[10px] text-gray-400 font-mono">
                            {bill.customer_phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="text-[10.5px] px-2 py-0.5 rounded font-bold uppercase bg-gray-100 text-gray-700">
                          {bill.payment_mode || 'Cash'}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            bill.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-medium text-amber-600">
                        {isPending ? formatINR(Number(bill.pending_amount || 0)) : '—'}
                      </td>
                      <td className="py-3 text-right font-bold text-gray-900 font-heading">
                        {formatINR(Number(bill.total_amount || 0))}
                      </td>
                      <td className="py-3 text-right text-gray-400">
                        <div>{timeAgo(bill.created_at)}</div>
                        <div className="text-[10px] text-gray-300">
                          {formatDate(bill.created_at)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bill Details Inspector Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h4 className="font-bold text-base text-gray-900">
                  Bill {selectedBill.bill_number}
                </h4>
                <p className="text-xs text-gray-500">
                  {formatDate(selectedBill.created_at)} at {formatTime(selectedBill.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Shop</span>
                <span className="font-semibold text-gray-900">
                  {shops.find((s) => s.id === selectedBill.shop_id)?.name || 'Shop'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Customer</span>
                <span className="font-semibold text-gray-900">
                  {selectedBill.customer_name || 'Walk-in'} {selectedBill.customer_phone ? `(${selectedBill.customer_phone})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Payment Mode</span>
                <span className="font-semibold text-gray-900 uppercase">
                  {selectedBill.payment_mode || 'Cash'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-mono font-semibold text-gray-900">
                  {formatINR(Number(selectedBill.subtotal || selectedBill.total_amount || 0))}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">GST Amount</span>
                <span className="font-mono font-semibold text-gray-900">
                  {formatINR(Number(selectedBill.gst_amount || 0))}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Paid Amount</span>
                <span className="font-mono font-semibold text-emerald-600">
                  {formatINR(Number(selectedBill.paid_amount || selectedBill.total_amount || 0))}
                </span>
              </div>
              {Number(selectedBill.pending_amount || 0) > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-amber-600 font-semibold">Pending Due</span>
                  <span className="font-mono font-bold text-amber-600">
                    {formatINR(Number(selectedBill.pending_amount || 0))}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 text-sm font-bold border-t border-gray-100">
                <span>Total Bill Value</span>
                <span className="text-[#FD5E03] font-heading font-black">
                  {formatINR(Number(selectedBill.total_amount || 0))}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedBill(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
