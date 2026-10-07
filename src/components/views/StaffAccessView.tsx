'use client';

import React, { useState } from 'react';
import { Shop, Profile, ShopMember, Bill, Subscription } from '../../types/database';
import { formatDate } from '../../lib/adminData';
import { Users, Shield, Phone, MessageSquare, Search, Lock, AlertCircle, CheckCircle2, Store, Sparkles, TrendingUp } from 'lucide-react';

interface StaffAccessViewProps {
  shops: Shop[];
  profiles: Profile[];
  shopMembers: ShopMember[];
  bills?: Bill[];
  subscriptions?: Subscription[];
  onShowToast: (msg: string) => void;
}

export function StaffAccessView({
  shops,
  profiles,
  shopMembers,
  bills = [],
  subscriptions = [],
  onShowToast,
}: StaffAccessViewProps) {
  const [search, setSearch] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<'All' | 'Free' | 'Pro'>('All');

  const FREE_SALES_LIMIT = 100;

  // Build real shop-by-shop member and 100-sales quota data
  const shopQuotaList = shops.map((shop) => {
    const sub = subscriptions.find((s) => s.shop_id === shop.id);
    const isPro = sub?.plan?.toLowerCase() === 'pro';
    const shopBills = bills.filter((b) => b.shop_id === shop.id && b.status === 'completed');
    const completedSales = shopBills.length;
    const quotaUsedPercent = Math.min(100, Math.round((completedSales / FREE_SALES_LIMIT) * 100));
    const remainingSales = Math.max(0, FREE_SALES_LIMIT - completedSales);

    // Members for this shop
    const members = shopMembers.filter((m) => m.shop_id === shop.id);
    const ownerMember = members.find((m) => m.role.toLowerCase() === 'owner') || members[0];
    const ownerProfile = profiles.find((p) => p.id === ownerMember?.user_id);
    const additionalStaff = members.filter((m) => m.role.toLowerCase() !== 'owner');

    return {
      shop,
      sub,
      isPro,
      completedSales,
      quotaUsedPercent,
      remainingSales,
      ownerName: ownerProfile?.full_name || 'Registered Owner',
      ownerPhone: ownerProfile?.phone || shop.phone,
      totalMembers: members.length,
      additionalStaffCount: isPro ? additionalStaff.length : 0,
      canAddMembers: isPro,
    };
  });

  const proShopsCount = shopQuotaList.filter((s) => s.isPro).length;
  const freeShopsCount = shopQuotaList.filter((s) => !s.isPro).length;
  const totalCompletedSales = shopQuotaList.reduce((acc, s) => acc + s.completedSales, 0);

  const filteredShops = shopQuotaList.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      item.shop.name.toLowerCase().includes(q) ||
      item.ownerName.toLowerCase().includes(q) ||
      item.ownerPhone.includes(q) ||
      item.shop.city.toLowerCase().includes(q);

    const matchPlan =
      selectedPlanFilter === 'All' ||
      (selectedPlanFilter === 'Pro' && item.isPro) ||
      (selectedPlanFilter === 'Free' && !item.isPro);

    return matchSearch && matchPlan;
  });

  const handleWhatsApp = (phone: string, name: string, shop: string, sales: number) => {
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean) {
      const remaining = Math.max(0, FREE_SALES_LIMIT - sales);
      const msg = encodeURIComponent(
        `Hello ${name}! This is CounterPro Admin. Your shop ${shop} has completed ${sales}/${FREE_SALES_LIMIT} free sales (${remaining} remaining). To unlock additional team members (Supervisors & Billers) and unlimited billing, upgrade to CounterPro Pro.`
      );
      window.open(`https://wa.me/91${clean}?text=${msg}`, '_blank');
      onShowToast(`Opened WhatsApp for ${shop}`);
    } else {
      onShowToast('No phone number recorded');
    }
  };

  const handleCall = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean) {
      window.location.href = `tel:+91${clean}`;
      onShowToast(`Calling +91 ${clean}`);
    } else {
      onShowToast('No phone number recorded');
    }
  };

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Real Policy Notification Banner */}
      <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-[8px] p-4 flex items-start gap-3 shadow-xs">
        <Lock className="w-5 h-5 text-[#FD5E03] shrink-0 mt-0.5" />
        <div className="text-xs text-[#9A3412] leading-relaxed">
          <div className="font-bold text-[13px] text-[#C2410C] mb-0.5">
            CounterPro Subscription Architecture: Multi-User Access & 100 Free Sales Limit
          </div>
          <div>
            In CounterPro, multi-user staff members (Supervisors, Billers, and Cashiers) are only enabled for shops that subscribe to the <strong>CounterPro Pro Plan</strong>. Free tier shops have a strict cap of <strong>100 sales limit</strong> and are restricted to a single Owner login. Below is the real-time consumption of each shop towards their 100 sales limit.
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[14px]">
        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">SHOP OWNERS (REGISTERED)</div>
          <div className="font-heading text-[28px] font-bold leading-none text-[#101318]">
            {shops.length}
          </div>
          <div className="text-[11px] text-black/50">1 registered owner per shop</div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">PRO SUBSCRIBED SHOPS</div>
          <div className="font-heading text-[28px] font-bold leading-none text-[#FD5E03]">
            {proShopsCount}
          </div>
          <div className="text-[11px] text-black/50">{freeShopsCount} shops on 100 sales limit</div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">UNLOCKED ADDITIONAL STAFF</div>
          <div className="font-heading text-[28px] font-bold leading-none text-gray-400">
            0
          </div>
          <div className="text-[11px] text-black/50">0 staff until shops subscribe to Pro</div>
        </div>

        <div className="bg-white rounded-[8px] shadow-sm p-[14px_16px] flex flex-col gap-1 border border-[var(--color-divider)]">
          <div className="card-kicker">TOTAL SALES COMPLETED</div>
          <div className="font-heading text-[28px] font-bold leading-none text-emerald-600">
            {totalCompletedSales}
          </div>
          <div className="text-[11px] text-black/50">across all free tier quotas</div>
        </div>
      </div>

      {/* Main Quota & Member Roster Table Card */}
      <div className="bg-white rounded-[8px] shadow-sm p-[16px_16px_10px] border border-[var(--color-divider)]">
        {/* Filter Bar */}
        <div className="flex items-center gap-3 flex-wrap pb-3.5 border-b border-[var(--color-divider)]">
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search shop, owner, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-[var(--color-divider)] bg-[#FAFAFB] focus:bg-white focus:border-[#FD5E03] outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11.5px] font-semibold text-gray-500">Plan:</span>
            {(['All', 'Free', 'Pro'] as const).map((plan) => (
              <button
                key={plan}
                onClick={() => setSelectedPlanFilter(plan)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors ${
                  selectedPlanFilter === plan
                    ? 'bg-[#101318] text-white border-[#101318]'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {plan === 'All' ? 'All Plans' : plan === 'Free' ? 'Free (100 Sales Cap)' : 'Pro (Unlimited)'}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-400 ml-auto font-medium">
            Showing {filteredShops.length} of {shops.length} merchant accounts
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Shop & City</th>
                <th>Registered Owner</th>
                <th>Subscription Tier</th>
                <th className="min-w-[200px]">100 Sales Limit Progress</th>
                <th>Additional Members</th>
                <th className="text-right">Pro Upgrade Outreach</th>
              </tr>
            </thead>
            <tbody>
              {filteredShops.map((item) => (
                <tr key={item.shop.id} className="hover:bg-[#FAFAFB]">
                  <td>
                    <div className="font-semibold text-[13px] text-gray-900">{item.shop.name}</div>
                    <div className="text-[11px] text-gray-400">{item.shop.city || 'India'} &bull; {item.shop.shop_type}</div>
                  </td>
                  <td>
                    <div className="font-medium text-[13px] text-gray-900">{item.ownerName}</div>
                    <div className="text-[11px] text-gray-400 font-mono">+91 {item.ownerPhone}</div>
                  </td>
                  <td>
                    {item.isPro ? (
                      <span className="tag bg-[#FD5E03] text-white font-bold text-[10.5px]">
                        PRO (UNLIMITED)
                      </span>
                    ) : (
                      <span className="tag bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] font-bold text-[10.5px]">
                        FREE (100 LIMIT)
                      </span>
                    )}
                  </td>
                  <td>
                    <div>
                      <div className="flex items-center justify-between text-[11.5px] font-medium mb-1">
                        <span className="text-gray-900 font-bold">
                          {item.completedSales} / {FREE_SALES_LIMIT} sales
                        </span>
                        <span className="text-[#FD5E03] font-mono text-[11px]">
                          {item.remainingSales} remaining
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.quotaUsedPercent > 80
                              ? 'bg-red-500'
                              : item.quotaUsedPercent > 50
                              ? 'bg-amber-500'
                              : 'bg-[#FD5E03]'
                          }`}
                          style={{ width: `${item.quotaUsedPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    {item.canAddMembers ? (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.additionalStaffCount} Active Staff
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-1" title="Locked until Pro subscription">
                        <Lock className="w-3 h-3 text-gray-400" />
                        0 (Locked to Pro)
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleWhatsApp(item.ownerPhone, item.ownerName, item.shop.name, item.completedSales)}
                        title="Outreach regarding 100 sales limit & Pro"
                        className="btn btn-secondary text-xs py-1 px-2.5 gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Upgrade WhatsApp</span>
                      </button>
                      <button
                        onClick={() => handleCall(item.ownerPhone)}
                        title="Call Owner"
                        className="p-1.5 rounded text-gray-500 hover:bg-gray-100"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
