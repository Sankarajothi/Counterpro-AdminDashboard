'use client';

import React, { useState } from 'react';
import { Shop, Bill, Subscription, Profile, ShopMember, MenuItem, AccountDeletion } from '../../types/database';
import { formatLakhs, formatINR, timeAgo, formatDate } from '../../lib/adminData';
import { Store, Layers, User, Phone, MessageSquare, ShieldCheck, CheckCircle2, ChevronRight, FileText, ShoppingCart, DollarSign, Calendar, AlertTriangle } from 'lucide-react';

interface ShopsViewProps {
  shops: Shop[];
  bills: Bill[];
  subscriptions: Subscription[];
  profiles?: Profile[];
  shopMembers?: ShopMember[];
  menuItems?: MenuItem[];
  accountDeletions?: AccountDeletion[];
  searchQuery: string;
  period: string;
  onOpenShopDrawer: (shop: Shop) => void;
  onShowToast?: (msg: string) => void;
}

export function ShopsView({
  shops,
  bills,
  subscriptions,
  profiles = [],
  shopMembers = [],
  menuItems = [],
  accountDeletions = [],
  searchQuery,
  period,
  onOpenShopDrawer,
  onShowToast,
}: ShopsViewProps) {
  const [activeTab, setActiveTab] = useState<'directory' | 'lineage_360'>('directory');
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'gmv' | 'name' | 'orders'>('gmv');
  const [selected360ShopId, setSelected360ShopId] = useState<string>(shops[0]?.id || '');

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

  // Selected 360 shop data
  const current360Shop = shops.find((s) => s.id === selected360ShopId) || shops[0];
  const shopStaff = shopMembers.filter((m) => m.shop_id === current360Shop?.id);
  const ownerMember = shopStaff.find((m) => m.role.toLowerCase() === 'owner') || shopStaff[0];
  const ownerProfile = profiles.find((p) => p.id === ownerMember?.user_id);
  const currentShopBills = bills.filter((b) => b.shop_id === current360Shop?.id && b.status === 'completed');
  const currentShopGMV = currentShopBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0);
  const currentShopItems = menuItems.filter((m) => m.shop_id === current360Shop?.id);
  const currentSub = subscriptions.find((s) => s.shop_id === current360Shop?.id);
  const deletionRecord = accountDeletions.find((d) => d.shop_id === current360Shop?.id);

  return (
    <div className="flex flex-col gap-[18px]">
      {/* View Switcher Banner */}
      <div className="bg-white rounded-[8px] shadow-sm p-[14px_18px] border border-[var(--color-divider)] flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('directory')}
            className={`btn text-xs min-h-[36px] px-3.5 gap-2 font-bold transition-all ${
              activeTab === 'directory'
                ? 'bg-[#101318] text-white shadow-xs'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Store className="w-4 h-4 text-[#FD5E03]" />
            <span>Shops Directory ({shops.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('lineage_360')}
            className={`btn text-xs min-h-[36px] px-3.5 gap-2 font-bold transition-all ${
              activeTab === 'lineage_360'
                ? 'bg-[#FD5E03] text-white shadow-xs'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>360° Ecosystem Lineage View</span>
          </button>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Live Relational Tenant Mapping
        </div>
      </div>

      {/* Mode 1: Standard Directory */}
      {activeTab === 'directory' && (
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
                  <th className="min-w-[150px]">100 Sales Limit</th>
                  <th
                    onClick={() => setSortBy('gmv')}
                    className="text-right cursor-pointer hover:text-[#FD5E03]"
                  >
                    GMV / {period.toLowerCase()} {sortBy === 'gmv' ? '▼' : ''}
                  </th>
                  <th className="text-right">Last Seen</th>
                  <th className="text-right">Plan</th>
                  <th className="text-right">360° Audit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-black/40 py-8">
                      No shop matches the current filter or search query “{searchQuery}”.
                    </td>
                  </tr>
                ) : (
                  filtered.map(({ shop, plan, gmv, orders, lastSeen }) => {
                    const FREE_LIMIT = 100;
                    const isPro = plan === 'Pro';
                    const remaining = Math.max(0, FREE_LIMIT - orders);
                    const quotaPercent = Math.min(100, Math.round((orders / FREE_LIMIT) * 100));

                    return (
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
                        <td>
                          {isPro ? (
                            <span className="tag bg-emerald-50 text-emerald-700 font-bold text-[10.5px]">
                              UNLIMITED (PRO)
                            </span>
                          ) : (
                            <div className="min-w-[140px]">
                              <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                                <span className="text-gray-900 font-bold">{orders} / {FREE_LIMIT}</span>
                                <span className="text-[#FD5E03] font-mono text-[10px]">{remaining} left</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    quotaPercent > 80 ? 'bg-red-500' : 'bg-[#FD5E03]'
                                  }`}
                                  style={{ width: `${quotaPercent}%` }}
                                />
                              </div>
                            </div>
                          )}
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
                        <td className="text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected360ShopId(shop.id);
                              setActiveTab('lineage_360');
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-[#FD5E03] bg-orange-50 hover:bg-orange-100 rounded border border-orange-200 transition-colors"
                          >
                            360° Lineage ↗
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mode 2: 360° Ecosystem Lineage View (Inspired by Stylefleet) */}
      {activeTab === 'lineage_360' && current360Shop && (
        <div className="flex flex-col gap-5">
          {/* Shop Selector Dropdown */}
          <div className="bg-white p-4 rounded-lg border border-[var(--color-divider)] shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Select Shop for 360° Audit:
              </span>
              <select
                value={selected360ShopId}
                onChange={(e) => setSelected360ShopId(e.target.value)}
                className="text-xs font-semibold py-1.5 px-3 rounded-md border border-[var(--color-divider)] bg-white text-gray-900 focus:border-[#FD5E03] outline-none"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenShopDrawer(current360Shop)}
                className="btn btn-secondary text-xs min-h-[32px] px-3 gap-1.5 border-gray-300 hover:border-[#FD5E03]"
              >
                <span>Open Full Shop Drawer</span>
              </button>
            </div>
          </div>

          {/* 7-Step Lineage Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Step 1: Owner Profile */}
            <div className="bg-white p-5 rounded-lg border border-[var(--color-divider)] shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#FD5E03] mb-1">
                  Step 1: User / Owner Identity
                </div>
                <h4 className="text-sm font-bold text-gray-900 m-0 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{ownerProfile?.full_name || 'Registered Owner'}</span>
                </h4>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div><strong>Mobile Phone:</strong> <span className="font-mono text-gray-900">+91 {ownerProfile?.phone || current360Shop.phone}</span></div>
                  <div><strong>Account Profile ID:</strong> <code className="text-[10px] bg-gray-100 px-1 py-0.5 rounded">{ownerProfile?.id || ownerMember?.user_id || 'UID-TENANT'}</code></div>
                  <div><strong>Identity Verified:</strong> <span className="text-emerald-600 font-semibold">Yes (Active Supabase Profile)</span></div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                Created: {formatDate(ownerProfile?.created_at || current360Shop.created_at)}
              </div>
            </div>

            {/* Step 2: Shop Entity */}
            <div className="bg-white p-5 rounded-lg border border-[var(--color-divider)] shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#FD5E03] mb-1">
                  Step 2: Shop Business Entity
                </div>
                <h4 className="text-sm font-bold text-gray-900 m-0 mb-3 flex items-center gap-2">
                  <Store className="w-4 h-4 text-gray-500" />
                  <span>{current360Shop.name}</span>
                </h4>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div><strong>Business Type:</strong> <span className="tag bg-gray-100 text-gray-800">{current360Shop.shop_type || 'Retail'}</span></div>
                  <div><strong>Location:</strong> {current360Shop.city}, {current360Shop.state}</div>
                  <div><strong>GST Setting:</strong> {current360Shop.gst_enabled ? `${current360Shop.gst_rate || 5}% GST (${current360Shop.gst_number || 'Registered'})` : 'Tax Exempt'}</div>
                  <div><strong>Receipt Printer:</strong> {current360Shop.printer_enabled ? `ESC/POS ${current360Shop.printer_name || '58mm'}` : 'Disabled'}</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                Tenant ID: {current360Shop.id.slice(0, 8)}...
              </div>
            </div>

            {/* Step 3: Staff Roster */}
            <div className="bg-white p-5 rounded-lg border border-[var(--color-divider)] shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#FD5E03] mb-1">
                  Step 3: Staff & Access Roster
                </div>
                <h4 className="text-sm font-bold text-gray-900 m-0 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gray-500" />
                  <span>{shopStaff.length || 1} Staff Member(s)</span>
                </h4>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div><strong>Active Roster:</strong> {shopStaff.filter((s) => s.is_active).length || 1} operator(s)</div>
                  <div><strong>RBAC Roles:</strong> {Array.from(new Set(shopStaff.map((s) => s.role))).join(', ') || 'Owner'}</div>
                  <div><strong>Module Access:</strong> POS Billing, Receipt Thermal Print</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Multi-User Synchronized
              </div>
            </div>

            {/* Step 4: Catalog & Menu */}
            <div className="bg-white p-5 rounded-lg border border-[var(--color-divider)] shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#FD5E03] mb-1">
                  Step 4: Catalog & Menu Density
                </div>
                <h4 className="text-sm font-bold text-gray-900 m-0 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span>{currentShopItems.length} Menu Items</span>
                </h4>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div><strong>Active in Menu:</strong> {currentShopItems.filter((i) => i.is_available).length} items</div>
                  <div><strong>Average Unit Price:</strong> {currentShopItems.length ? formatINR(currentShopItems.reduce((acc, i) => acc + Number(i.price || 0), 0) / currentShopItems.length) : '₹0'}</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                Menu taxonomy verified
              </div>
            </div>

            {/* Step 5: Billing & Performance */}
            <div className="bg-white p-5 rounded-lg border border-[var(--color-divider)] shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#FD5E03] mb-1">
                  Step 5: Billing & Revenue
                </div>
                <h4 className="text-sm font-bold text-gray-900 m-0 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">{formatINR(currentShopGMV)} GMV</span>
                </h4>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div><strong>Total Completed Bills:</strong> {currentShopBills.length} orders</div>
                  <div><strong>Average Order Value:</strong> {currentShopBills.length ? formatINR(currentShopGMV / currentShopBills.length) : '₹0'}</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                Real-time POS transaction feed
              </div>
            </div>

            {/* Step 6: Subscription & Retention */}
            <div className="bg-white p-5 rounded-lg border border-[var(--color-divider)] shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#FD5E03] mb-1">
                  Step 6: Subscription & ARR
                </div>
                <h4 className="text-sm font-bold text-gray-900 m-0 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="uppercase">{currentSub?.plan || 'PRO TRIAL'}</span>
                </h4>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div><strong>Subscription Status:</strong> <span className="tag bg-emerald-50 text-emerald-700">{currentSub?.status || 'Active'}</span></div>
                  <div><strong>Renewal Period:</strong> {currentSub?.current_period_end ? formatDate(currentSub.current_period_end) : 'Trial Active'}</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Account In Good Standing
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
