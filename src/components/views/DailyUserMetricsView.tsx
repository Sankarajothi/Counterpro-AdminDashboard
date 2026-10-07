'use client';

import React from 'react';
import { Shop, Profile, ShopMember } from '../../types/database';
import { formatDate, timeAgo } from '../../lib/adminData';
import { Users, Shield, UserCheck, ShieldAlert, Store, Clock } from 'lucide-react';

interface DailyUserMetricsViewProps {
  shops: Shop[];
  profiles: Profile[];
  shopMembers: ShopMember[];
}

export function DailyUserMetricsView({
  shops,
  profiles,
  shopMembers,
}: DailyUserMetricsViewProps) {
  // Roles breakdown
  const owners = shopMembers.filter((m) => m.role?.toLowerCase() === 'owner');
  const billers = shopMembers.filter((m) => m.role?.toLowerCase() === 'biller');
  const supervisors = shopMembers.filter(
    (m) => m.role?.toLowerCase() === 'supervisor'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Pro Locked Info Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#1c1f26] to-[#252932] border border-[#2d3139] text-white flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#FD5E03]/20 border border-[#FD5E03]/30 text-[#FD5E03] shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-[14px] text-white">
              Multi-User Staff Access is a CounterPro Pro Feature
            </h4>
            <p className="text-[12px] text-neutral-400 mt-0.5">
              Current shops are on Free Tier (single-device owner billing). Additional cashier &amp; biller team seats will activate once shops upgrade to Pro.
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white font-mono shrink-0">
          0 Additional Billers
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Total Staff Accounts</span>
            <div className="p-1.5 rounded-lg bg-orange-50 text-[#FD5E03]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
            {shopMembers.length}
          </div>
          <div className="mt-1 text-[11.5px] text-gray-500">
            Associated with {shops.length} shops
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Shop Owners</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
            {owners.length > 0 ? owners.length : shops.length}
          </div>
          <div className="mt-1 text-[11.5px] text-emerald-600 font-medium">
            Primary account administrators
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Cashiers / Billers</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
            {billers.length}
          </div>
          <div className="mt-1 text-[11.5px] text-gray-400">
            Pro multi-biller accounts
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Supervisors</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
            {supervisors.length}
          </div>
          <div className="mt-1 text-[11.5px] text-gray-400">
            Manager privilege accounts
          </div>
        </div>
      </div>

      {/* Staff and User Accounts Directory */}
      <div className="bg-white rounded-xl p-5 border border-[var(--color-divider)] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[14px] text-[#101318]">Active Users &amp; Staff</h3>
            <p className="text-[11px] text-gray-500">Live directory verified from Supabase</p>
          </div>
        </div>

        {shopMembers.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            No secondary team members added yet. Shops currently operate under primary owner profile.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 text-gray-400 font-medium">
                <tr>
                  <th className="pb-2.5">User / Staff</th>
                  <th className="pb-2.5">Phone</th>
                  <th className="pb-2.5">Shop</th>
                  <th className="pb-2.5">Role</th>
                  <th className="pb-2.5 text-center">Status</th>
                  <th className="pb-2.5 text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shopMembers.map((member) => {
                  const prof = profiles.find((p) => p.id === member.user_id);
                  const shop = shops.find((s) => s.id === member.shop_id);

                  return (
                    <tr key={member.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 font-semibold text-gray-900">
                        {prof?.full_name || 'Staff Member'}
                      </td>
                      <td className="py-3 text-gray-600 font-mono">
                        {prof?.phone || '—'}
                      </td>
                      <td className="py-3 text-gray-700">
                        {shop?.name || 'Shop'}
                      </td>
                      <td className="py-3">
                        <span className="text-[10.5px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold uppercase">
                          {member.role || 'Owner'}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            member.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 text-right text-gray-400">
                        {formatDate(member.joined_at || member.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
