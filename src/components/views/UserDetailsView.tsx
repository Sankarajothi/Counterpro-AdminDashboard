'use client';

import React from 'react';
import { Profile, ShopMember, Shop } from '../../types/database';
import { formatDate, timeAgo } from '../../lib/adminData';
import { Contact, Phone, Calendar, Shield, Store, User } from 'lucide-react';

interface UserDetailsViewProps {
  profiles: Profile[];
  shopMembers: ShopMember[];
  shops: Shop[];
}

export function UserDetailsView({ profiles, shopMembers, shops }: UserDetailsViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Registered User Profiles</div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
            {profiles.length}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Authenticated via Supabase Auth
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Shop Associations</div>
          <div className="mt-2 text-2xl font-bold font-heading text-emerald-700">
            {shopMembers.length}
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">
            Active merchant links
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Registered Shops</div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#FD5E03]">
            {shops.length}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Operated by registered owners
          </div>
        </div>
      </div>

      {/* Profiles Directory Table */}
      <div className="bg-white rounded-xl p-5 border border-[var(--color-divider)] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[14px] text-[#101318]">User Account Details</h3>
            <p className="text-[11px] text-gray-500">
              Profiles authenticated and registered in Counter Pro
            </p>
          </div>
          <span className="text-xs font-mono text-gray-400">
            {profiles.length} Accounts
          </span>
        </div>

        {profiles.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            No profiles registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 text-gray-400 font-medium">
                <tr>
                  <th className="pb-2.5">User Name</th>
                  <th className="pb-2.5">Phone Number</th>
                  <th className="pb-2.5">Associated Shops</th>
                  <th className="pb-2.5">Role</th>
                  <th className="pb-2.5 text-right">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((profile) => {
                  const memberLinks = shopMembers.filter((m) => m.user_id === profile.id);
                  const linkedShops = memberLinks.map((m) => {
                    const sh = shops.find((s) => s.id === m.shop_id);
                    return { name: sh?.name || 'Shop', role: m.role };
                  });

                  return (
                    <tr key={profile.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-orange-100 text-[#FD5E03] flex items-center justify-center font-bold text-xs shrink-0">
                          {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div>{profile.full_name || 'Counter Pro User'}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            ID: {profile.id.slice(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-gray-600">
                        {profile.phone || '—'}
                      </td>
                      <td className="py-3 text-gray-700">
                        {linkedShops.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {linkedShops.map((ls, idx) => (
                              <span
                                key={idx}
                                className="text-[10.5px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium"
                              >
                                {ls.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No shop linked</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-orange-50 text-[#FD5E03] border border-orange-200">
                          {linkedShops[0]?.role || 'Owner'}
                        </span>
                      </td>
                      <td className="py-3 text-right text-gray-400">
                        {formatDate(profile.created_at)}
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
