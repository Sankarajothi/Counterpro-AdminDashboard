'use client';

import React, { useState } from 'react';
import { Shop, Bill, BillItem, Subscription, AccountDeletion, Payment, MenuItem } from '../../types/database';
import { formatINR, formatDate, formatTime } from '../../lib/adminData';
import { Download, Printer, FileText, Calendar, Filter, Search, BarChart3, TrendingUp, DollarSign } from 'lucide-react';

interface ReportsBIViewProps {
  shops: Shop[];
  bills: Bill[];
  billItems: BillItem[];
  payments: Payment[];
  subscriptions: Subscription[];
  accountDeletions: AccountDeletion[];
  menuItems: MenuItem[];
  onShowToast: (msg: string) => void;
}

export function ReportsBIView({
  shops,
  bills,
  billItems,
  payments,
  subscriptions,
  accountDeletions,
  menuItems,
  onShowToast,
}: ReportsBIViewProps) {
  const [activeTab, setActiveTab] = useState<'shops' | 'bills' | 'items' | 'subscriptions' | 'deletions'>('shops');
  const [search, setSearch] = useState('');

  // 1. Shops Report Data
  const shopsReport = shops.map((s) => {
    const shopBills = bills.filter((b) => b.shop_id === s.id);
    const shopGMV = shopBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0);
    const shopItems = menuItems.filter((m) => m.shop_id === s.id);
    const sub = subscriptions.find((sub) => sub.shop_id === s.id);
    return {
      id: s.id,
      name: s.name,
      type: s.shop_type || 'Retail',
      city: s.city || 'India',
      phone: s.phone,
      totalOrders: shopBills.length,
      gmv: shopGMV,
      catalogItems: shopItems.length,
      plan: sub?.plan?.toUpperCase() || 'FREE',
      status: s.is_active ? 'Active' : 'Inactive',
      registeredAt: s.created_at,
    };
  });

  // 2. Bills Report Data
  const billsReport = bills.map((b) => {
    const shop = shops.find((s) => s.id === b.shop_id);
    const itemsCount = billItems.filter((bi) => bi.bill_id === b.id).length;
    return {
      id: b.id,
      billNumber: b.bill_number,
      shopName: shop?.name || 'Unknown',
      amount: Number(b.total_amount || 0),
      paymentMode: (b.payment_mode || 'Cash').toUpperCase(),
      status: b.status || 'completed',
      itemsCount: itemsCount || 1,
      customer: b.customer_name || 'Walk-in Customer',
      createdAt: b.created_at,
    };
  });

  // 3. Items Report Data
  const itemFreqMap: { [name: string]: { units: number; gmv: number; occurrences: number } } = {};
  billItems.forEach((bi) => {
    const name = bi.item_name || 'Standard Item';
    if (!itemFreqMap[name]) {
      itemFreqMap[name] = { units: 0, gmv: 0, occurrences: 0 };
    }
    itemFreqMap[name].units += Number(bi.quantity || 1);
    itemFreqMap[name].gmv += Number(bi.line_total || bi.unit_price || 0);
    itemFreqMap[name].occurrences += 1;
  });

  const itemsReport = Object.entries(itemFreqMap).map(([name, data]) => ({
    name,
    unitsSold: data.units,
    totalGMV: data.gmv,
    avgPrice: data.units > 0 ? Math.round(data.gmv / data.units) : 0,
    timesOrdered: data.occurrences,
  })).sort((a, b) => b.unitsSold - a.unitsSold);

  // 4. Subscriptions Report Data
  const subsReport = subscriptions.map((s) => {
    const shop = shops.find((sh) => sh.id === s.shop_id);
    return {
      id: s.id,
      shopName: shop?.name || 'Unknown Shop',
      plan: (s.plan || 'free').toUpperCase(),
      status: (s.status || 'active').toUpperCase(),
      amount: Number(s.amount || 0),
      interval: s.interval || 'lifetime',
      periodStart: s.current_period_start || s.created_at,
      periodEnd: s.current_period_end || s.updated_at,
    };
  });

  // 5. Deletions Report Data
  const deletionsReport = accountDeletions.map((d) => ({
    id: d.id,
    shopName: d.shop_name || 'Unknown Shop',
    ownerName: d.owner_name || 'Former Owner',
    phone: d.phone || '—',
    reason: d.reason || 'Unspecified Reason',
    feedback: d.feedback || 'No feedback provided',
    deletedAt: d.deleted_at,
  }));

  // CSV Export utility
  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) {
      onShowToast('No data to export.');
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...data.map((row) =>
          headers
            .map((field) => {
              const val = row[field];
              if (val === null || val === undefined) return '""';
              const str = String(val).replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(',')
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Exported ${filename}.csv successfully`);
  };

  // JSON Export utility
  const exportJSON = (data: any[], filename: string) => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Exported ${filename}.json successfully`);
  };

  // Print friendly view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Top Banner with Report Tabs & Export Tools */}
      <div className="bg-white rounded-[8px] shadow-sm p-[16px_20px] border border-[var(--color-divider)] flex items-center justify-between gap-4 flex-wrap">
        {/* Report Selector Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'shops', label: '🏪 Shop Registrations', count: shops.length },
            { id: 'bills', label: '🧾 Invoices & Bills', count: bills.length },
            { id: 'items', label: '📦 Items & Sales', count: itemsReport.length },
            { id: 'subscriptions', label: '💳 Subscriptions', count: subscriptions.length },
            { id: 'deletions', label: '🚪 Account Churn', count: accountDeletions.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all border ${
                  isActive
                    ? 'bg-[#101318] text-white border-[#101318] shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-1.5 opacity-60 text-[10.5px]">({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'shops') exportCSV(shopsReport, 'counter365-shops-report');
              if (activeTab === 'bills') exportCSV(billsReport, 'counter365-bills-report');
              if (activeTab === 'items') exportCSV(itemsReport, 'counter365-items-report');
              if (activeTab === 'subscriptions') exportCSV(subsReport, 'counter365-subscriptions-report');
              if (activeTab === 'deletions') exportCSV(deletionsReport, 'counter365-deletions-report');
            }}
            className="btn btn-secondary text-xs min-h-[34px] px-3 gap-1.5 border-gray-300 hover:border-[#FD5E03]"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              if (activeTab === 'shops') exportJSON(shopsReport, 'counter365-shops-report');
              if (activeTab === 'bills') exportJSON(billsReport, 'counter365-bills-report');
              if (activeTab === 'items') exportJSON(itemsReport, 'counter365-items-report');
              if (activeTab === 'subscriptions') exportJSON(subsReport, 'counter365-subscriptions-report');
              if (activeTab === 'deletions') exportJSON(deletionsReport, 'counter365-deletions-report');
            }}
            className="btn btn-secondary text-xs min-h-[34px] px-3 gap-1.5 border-gray-300 hover:border-[#FD5E03]"
          >
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn btn-secondary text-xs min-h-[34px] px-3 gap-1.5 border-gray-300"
          >
            <Printer className="w-3.5 h-3.5 text-gray-500" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[8px] shadow-sm p-[16px_16px_10px] border border-[var(--color-divider)]">
        {/* Search inside report */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--color-divider)]">
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search current report data..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-[var(--color-divider)] bg-[#FAFAFB] focus:bg-white focus:border-[#FD5E03] outline-none"
            />
          </div>

          <div className="text-xs text-gray-400 font-medium">
            Verified Supabase Live Intelligence Report
          </div>
        </div>

        {/* Tab 1: Shops Report */}
        {activeTab === 'shops' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Shop Name</th>
                  <th>Category</th>
                  <th>City</th>
                  <th>Contact</th>
                  <th className="text-right">Total Orders</th>
                  <th className="text-right">Gross GMV</th>
                  <th>Plan Tier</th>
                  <th className="text-right">Registered</th>
                </tr>
              </thead>
              <tbody>
                {shopsReport
                  .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()))
                  .map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAFAFB]">
                      <td className="font-semibold text-gray-900">{s.name}</td>
                      <td><span className="tag bg-gray-100 text-gray-700">{s.type}</span></td>
                      <td className="text-gray-600">{s.city}</td>
                      <td className="text-gray-600 font-mono text-[11px]">+91 {s.phone}</td>
                      <td className="text-right font-medium">{s.totalOrders}</td>
                      <td className="text-right font-bold text-emerald-600">{formatINR(s.gmv)}</td>
                      <td>
                        <span className={`tag ${s.plan === 'PRO' ? 'bg-[#FD5E03] text-white font-bold' : 'bg-gray-100 text-gray-600'}`}>
                          {s.plan}
                        </span>
                      </td>
                      <td className="text-right text-xs text-gray-400">{formatDate(s.registeredAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Bills Report */}
        {activeTab === 'bills' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Shop</th>
                  <th>Customer</th>
                  <th>Payment Mode</th>
                  <th className="text-right">Items</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th className="text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {billsReport
                  .filter((b) => !search || b.billNumber.toLowerCase().includes(search.toLowerCase()) || b.shopName.toLowerCase().includes(search.toLowerCase()))
                  .slice(0, 100)
                  .map((b) => (
                    <tr key={b.id} className="hover:bg-[#FAFAFB]">
                      <td className="font-mono font-bold text-[12px] text-gray-900">#{b.billNumber}</td>
                      <td className="font-medium text-gray-800">{b.shopName}</td>
                      <td className="text-gray-600">{b.customer}</td>
                      <td>
                        <span className={`tag text-[10.5px] ${b.paymentMode === 'UPI' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                          {b.paymentMode}
                        </span>
                      </td>
                      <td className="text-right text-gray-500">{b.itemsCount}</td>
                      <td className="text-right font-bold text-gray-900">{formatINR(b.amount)}</td>
                      <td><span className="tag bg-emerald-50 text-emerald-700">{b.status}</span></td>
                      <td className="text-right text-xs text-gray-400">{formatDate(b.createdAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Items Report */}
        {activeTab === 'items' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Catalog Item Name</th>
                  <th className="text-right">Total Units Sold</th>
                  <th className="text-right">Times Ordered</th>
                  <th className="text-right">Avg Unit Price</th>
                  <th className="text-right">Gross Item Revenue</th>
                </tr>
              </thead>
              <tbody>
                {itemsReport
                  .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()))
                  .map((i, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAFB]">
                      <td className="font-semibold text-gray-900">{i.name}</td>
                      <td className="text-right font-bold text-gray-900">{i.unitsSold}</td>
                      <td className="text-right text-gray-600">{i.timesOrdered}</td>
                      <td className="text-right text-gray-600">{formatINR(i.avgPrice)}</td>
                      <td className="text-right font-bold text-emerald-600">{formatINR(i.totalGMV)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Subscriptions Report */}
        {activeTab === 'subscriptions' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Plan Tier</th>
                  <th>Billing Interval</th>
                  <th className="text-right">Recurring Fee</th>
                  <th>Status</th>
                  <th>Current Period Start</th>
                  <th className="text-right">Renewal Date</th>
                </tr>
              </thead>
              <tbody>
                {subsReport
                  .filter((s) => !search || s.shopName.toLowerCase().includes(search.toLowerCase()))
                  .map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAFAFB]">
                      <td className="font-semibold text-gray-900">{s.shopName}</td>
                      <td>
                        <span className={`tag font-bold ${s.plan === 'PRO' ? 'bg-[#FD5E03] text-white' : 'bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]'}`}>
                          {s.plan} (100 LIMIT)
                        </span>
                      </td>
                      <td className="capitalize text-gray-700">{s.interval}</td>
                      <td className="text-right font-bold text-gray-900">{formatINR(s.amount)}</td>
                      <td><span className="tag bg-emerald-50 text-emerald-700">{s.status}</span></td>
                      <td className="text-xs text-gray-500">{formatDate(s.periodStart)}</td>
                      <td className="text-right text-xs text-gray-500">{formatDate(s.periodEnd)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 5: Deletions Report */}
        {activeTab === 'deletions' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Shop Name</th>
                  <th>Former Owner</th>
                  <th>Contact Phone</th>
                  <th>Primary Reason</th>
                  <th>Exit Feedback</th>
                  <th className="text-right">Deleted Date</th>
                </tr>
              </thead>
              <tbody>
                {deletionsReport
                  .filter((d) => !search || d.shopName.toLowerCase().includes(search.toLowerCase()) || d.reason.toLowerCase().includes(search.toLowerCase()))
                  .map((d) => (
                    <tr key={d.id} className="hover:bg-[#FAFAFB]">
                      <td className="font-semibold text-gray-900">{d.shopName}</td>
                      <td className="text-gray-700">{d.ownerName}</td>
                      <td className="font-mono text-xs text-gray-600">{d.phone}</td>
                      <td><span className="tag bg-red-50 text-red-700 border border-red-200">{d.reason}</span></td>
                      <td className="text-xs text-gray-600 max-w-[280px] truncate">{d.feedback}</td>
                      <td className="text-right text-xs text-gray-400">{formatDate(d.deletedAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
