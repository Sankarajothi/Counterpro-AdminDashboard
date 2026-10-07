'use client';

import React, { useState } from 'react';
import { Customer, Bill, Shop } from '../../types/database';
import { formatINR, formatDate, timeAgo } from '../../lib/adminData';
import { UserCheck, Search, Users, Phone, Calendar, ShoppingBag } from 'lucide-react';

interface CustomerTrackingViewProps {
  customers: Customer[];
  bills: Bill[];
  shops: Shop[];
  title?: string;
  subtitle?: string;
}

export function CustomerTrackingView({
  customers,
  bills,
  shops,
  title = 'Customer Tracking & CRM',
  subtitle = 'Verified customer database from Counter Pro POS billing',
}: CustomerTrackingViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Consolidate customers from `customers` table and `bills` table
  const customerMap: Record<
    string,
    {
      id: string;
      name: string;
      phone: string;
      visitCount: number;
      totalSpent: number;
      lastVisit: string;
      shopName: string;
    }
  > = {};

  // First from `customers` table
  customers.forEach((c) => {
    const key = c.phone || c.id;
    const shop = shops.find((s) => s.id === c.shop_id);
    customerMap[key] = {
      id: c.id,
      name: c.name || 'Customer',
      phone: c.phone || '—',
      visitCount: 0,
      totalSpent: 0,
      lastVisit: c.created_at,
      shopName: shop?.name || 'Shop',
    };
  });

  // Aggregate from `bills` table
  bills.forEach((b) => {
    if (b.customer_phone || (b.customer_name && b.customer_name.toLowerCase() !== 'walk-in')) {
      const key = b.customer_phone || b.customer_name || b.id;
      const shop = shops.find((s) => s.id === b.shop_id);
      if (!customerMap[key]) {
        customerMap[key] = {
          id: b.id,
          name: b.customer_name || 'Counter Customer',
          phone: b.customer_phone || '—',
          visitCount: 0,
          totalSpent: 0,
          lastVisit: b.created_at,
          shopName: shop?.name || 'Shop',
        };
      }
      customerMap[key].visitCount += 1;
      customerMap[key].totalSpent += Number(b.total_amount || 0);
      if (new Date(b.created_at).getTime() > new Date(customerMap[key].lastVisit).getTime()) {
        customerMap[key].lastVisit = b.created_at;
      }
    }
  });

  const allCustomers = Object.values(customerMap);

  const filteredCustomers = allCustomers.filter((c) => {
    return (
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.shopName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalSpentAcrossCustomers = allCustomers.reduce((acc, c) => acc + c.totalSpent, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Total Registered Customers</div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
            {allCustomers.length}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Profiled across {shops.length} shops
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Customer Revenue Contribution</div>
          <div className="mt-2 text-2xl font-bold font-heading text-emerald-700">
            {formatINR(totalSpentAcrossCustomers)}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            From identified shoppers
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Avg Value per Identified User</div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#FD5E03]">
            {allCustomers.length > 0
              ? formatINR(Math.round(totalSpentAcrossCustomers / allCustomers.length))
              : '₹0'}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Lifetime ticket average
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-[var(--color-divider)] shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, shop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FD5E03] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-xl p-5 border border-[var(--color-divider)] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[14px] text-[#101318]">{title}</h3>
            <p className="text-[11px] text-gray-500">{subtitle}</p>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {filteredCustomers.length} Records
          </span>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            No customer profiles match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 text-gray-400 font-medium">
                <tr>
                  <th className="pb-2.5">Customer Name</th>
                  <th className="pb-2.5">Phone Number</th>
                  <th className="pb-2.5">Associated Shop</th>
                  <th className="pb-2.5 text-center">Visit Count</th>
                  <th className="pb-2.5 text-right">Total Spent</th>
                  <th className="pb-2.5 text-right">Last Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 font-semibold text-gray-900">
                      {cust.name}
                    </td>
                    <td className="py-3 font-mono text-gray-600">
                      {cust.phone}
                    </td>
                    <td className="py-3 text-gray-700">
                      {cust.shopName}
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-700">
                        {cust.visitCount} visits
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-gray-900 font-heading">
                      {formatINR(cust.totalSpent)}
                    </td>
                    <td className="py-3 text-right text-gray-400">
                      {timeAgo(cust.lastVisit)}
                    </td>
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
