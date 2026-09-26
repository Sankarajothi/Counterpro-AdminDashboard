'use client';

import React, { useState } from 'react';
import { Shop, Bill, Subscription } from '../../types/database';
import { formatLakhs, timeAgo } from '../../lib/adminData';

interface ShopsViewProps {
  shops: Shop[];
  bills: Bill[];
  subscriptions: Subscription[];
  searchQuery: string;
  period: string;
  onOpenShopDrawer: (shop: Shop) => void;
}

export function ShopsView({
  shops,
  bills,
  subscriptions,
  searchQuery,
  period,
  onOpenShopDrawer,
}: ShopsViewProps) {
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'gmv' | 'name' | 'orders'>('gmv');

  // Compute per-shop metrics
  const shopData = shops.map((shop) => {
    const sub = subscriptions.find((s) => s.shop_id === shop.id);
    const plan = sub?.plan === 'pro' ? 'Pro' : sub?.status === 'trialing' ? 'Trial' : shop.is_active ? 'Trial' : 'Expired';
    const shopBills = bills.filter((b) => b.shop_id === shop.id && b.status === 'completed');
    const gmv = shopBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0);
    const orders = shopBills.length;
    
    // Find latest activity
    const latestBill = bills.filter((b) => b.shop_id === shop.id)[0];
    const lastSeen = latestBill?.completed_at || latestBill?.created_at || shop.updated_at || shop.created_at;

    return {
      shop,
      plan,
      gmv,
      orders,
      lastSeen,
    };
  });

  // Unique shop types from DB
  const dynamicTypes = Array.from(new Set(shops.map((s) => s.shop_type).filter(Boolean)));
  const filterChips = ['All', 'Pro', 'Trial', 'Expired', ...dynamicTypes];

  // Filtering
  const q = searchQuery.trim().toLowerCase();
  let filtered = shopData.filter(({ shop }) => {
    if (!q) return true;
    const matchStr = `${shop.name} ${shop.city} ${shop.state} ${shop.phone} ${shop.shop_type}`.toLowerCase();
    return matchStr.includes(q);
  });

  if (filter !== 'All') {
    if (['Pro', 'Trial', 'Expired'].includes(filter)) {
      filtered = filtered.filter((item) => item.plan === filter);
    } else {
      filtered = filtered.filter((item) => item.shop.shop_type === filter);
    }
  }

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === 'name') return a.shop.name.localeCompare(b.shop.name);
    if (sortBy === 'orders') return b.orders - a.orders;
    return b.gmv - a.gmv;
  });

  return (
    <div className="bg-white rounded-[8px] shadow-sm p-[16px_16px_10px] border border-[var(--color-divider)]">
      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 flex-wrap pb-3.5 border-b border-[var(--color-divider)]">
        {filterChips.map((chip) => {
          const isActive = filter === chip;
          return (
            <button
              key={chip}
              onClick={() => setFilter(chip)}
              className={`min-h-[34px] px-3 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer border ${
                isActive
                  ? 'border-[#FD5E03] bg-[#FD5E03] text-white shadow-xs'
                  : 'border-[var(--color-divider)] bg-white text-[#101318] hover:bg-[#FFF7ED]'
              }`}
            >
              {chip}
            </button>
          );
        })}
        <span className="text-[12px] text-black/50 ml-auto font-medium">
          {filtered.length} of {shops.length} shops
        </span>
      </div>

      {/* Shops Table */}
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th
                onClick={() => setSortBy('name')}
                className="cursor-pointer hover:text-[#FD5E03]"
              >
                Shop {sortBy === 'name' ? '▲' : ''}
              </th>
              <th>Type</th>
              <th>Owner Phone</th>
              <th
                onClick={() => setSortBy('orders')}
                className="text-right cursor-pointer hover:text-[#FD5E03]"
              >
                Orders {sortBy === 'orders' ? '▼' : ''}
              </th>
              <th
                onClick={() => setSortBy('gmv')}
                className="text-right cursor-pointer hover:text-[#FD5E03]"
              >
                GMV / {period.toLowerCase()} {sortBy === 'gmv' ? '▼' : ''}
              </th>
              <th className="text-right">Last Seen</th>
              <th className="text-right">Plan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-black/40 py-8">
                  No shop matches the current filter or search query “{searchQuery}”.
                </td>
              </tr>
            ) : (
              filtered.map(({ shop, plan, gmv, orders, lastSeen }) => (
                <tr
                  key={shop.id}
                  onClick={() => onOpenShopDrawer(shop)}
                  className="cursor-pointer hover:bg-[#FFF7ED]/50 transition-colors"
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-[#FFF7ED] text-[#FD5E03] flex items-center justify-center font-heading font-black text-[13px] flex-none border border-[#FED7AA]">
                        {shop.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <span className="block font-heading font-bold text-[14.5px] text-[#101318] truncate">
                          {shop.name}
                        </span>
                        <span className="text-[11px] text-black/50 truncate block">
                          {shop.city}, {shop.state}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="text-black/70 text-[12.5px]">{shop.shop_type}</td>
                  <td className="text-black/70 text-[12.5px] font-mono">
                    +91 {shop.phone}
                  </td>
                  <td className="text-right font-heading font-semibold text-[#101318]">
                    {orders}
                  </td>
                  <td className="text-right font-heading font-semibold text-[#101318]">
                    {formatLakhs(gmv)}
                  </td>
                  <td className="text-right text-black/50 text-[12px]">
                    {timeAgo(lastSeen)}
                  </td>
                  <td className="text-right">
                    <span
                      className={`tag ${
                        plan === 'Pro'
                          ? 'bg-[#101318] text-white'
                          : plan === 'Trial'
                          ? 'bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {plan.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
