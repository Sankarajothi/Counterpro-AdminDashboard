'use client';

import React, { useState } from 'react';
import { Profile, ShopMember, Shop } from '../../types/database';
import { formatDate, timeAgo } from '../../lib/adminData';
import {
  User,
  Phone,
  Calendar,
  Shield,
  Store,
  Search,
  Download,
  MessageSquare,
  Copy,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react';

interface UserDetailsViewProps {
  profiles: Profile[];
  shopMembers: ShopMember[];
  shops: Shop[];
  onShowToast?: (msg: string) => void;
}

export function UserDetailsView({ profiles, shopMembers, shops, onShowToast }: UserDetailsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<'All' | 'Owner' | 'Staff'>('All');
  const [inspectProfile, setInspectProfile] = useState<Profile | null>(null);

  // Computed metrics
  const ownersCount = profiles.filter((p) => {
    const links = shopMembers.filter((m) => m.user_id === p.id);
    return links.some((l) => l.role.toLowerCase() === 'owner') || links.length > 0;
  }).length;

  const multiShopUsers = profiles.filter((p) => {
    const links = shopMembers.filter((m) => m.user_id === p.id);
    return links.length > 1;
  }).length;

  // Filtering
  const filteredProfiles = profiles.filter((p) => {
    const q = search.trim().toLowerCase();
    const links = shopMembers.filter((m) => m.user_id === p.id);
    const linkedShopNames = links.map((l) => shops.find((s) => s.id === l.shop_id)?.name || '').join(' ').toLowerCase();

    const matchesSearch =
      !q ||
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.phone || '').includes(q) ||
      p.id.toLowerCase().includes(q) ||
      linkedShopNames.includes(q);

    const isOwner = links.some((l) => l.role.toLowerCase() === 'owner') || links.length > 0;
    const matchesRole =
      selectedRole === 'All' ||
      (selectedRole === 'Owner' && isOwner) ||
      (selectedRole === 'Staff' && !isOwner);

    return matchesSearch && matchesRole;
  });

  const handleCopyId = (id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
      if (onShowToast) onShowToast(`Copied profile UID: ${id}`);
    }
  };

  const handleWhatsApp = (phone?: string | null, name?: string | null) => {
    const clean = (phone || '').replace(/[^0-9]/g, '');
    if (!clean) {
      if (onShowToast) onShowToast('No phone number recorded for this user profile.');
      return;
    }
    const msg = encodeURIComponent(`Hello ${name || 'Merchant'}! This is CounterPro Admin support team.`);
    window.open(`https://wa.me/91${clean}?text=${msg}`, '_blank');
    if (onShowToast) onShowToast(`Opened WhatsApp chat for ${name || 'User'}`);
  };

  const handleExportCSV = () => {
    if (!profiles.length) {
      if (onShowToast) onShowToast('No profiles to export.');
      return;
    }
    const headers = ['Profile ID', 'Full Name', 'Phone', 'Associated Stores', 'Role', 'Created At'];
    const rows = profiles.map((p) => {
      const links = shopMembers.filter((m) => m.user_id === p.id);
      const storeNames = links.map((l) => shops.find((s) => s.id === l.shop_id)?.name || 'Store').join('; ');
      const role = links[0]?.role || 'Owner';
      return [
        `"${p.id}"`,
        `"${(p.full_name || 'CounterPro User').replace(/"/g, '""')}"`,
        `"${p.phone || ''}"`,
        `"${storeNames.replace(/"/g, '""')}"`,
        `"${role}"`,
        `"${formatDate(p.created_at)}"`,
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `counterpro-user-profiles-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onShowToast) onShowToast('Exported User Profiles CSV');
  };

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Hero Banner */}
      <div className="bg-white rounded-xl shadow-xs p-5 border border-gray-200/80 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FD5E03] animate-pulse" />
            <h2 className="text-[17px] font-bold text-[#101318] m-0">
              User Profiles & Authentication Directory
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FD5E03] border border-orange-200 font-semibold">
              Supabase Auth
            </span>
          </div>
          <p className="text-xs text-gray-500 m-0 mt-1">
            Complete list of all {profiles.length} authenticated operator identities and store link associations.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn btn-secondary text-xs min-h-[34px] px-3 gap-1.5 border-gray-300 hover:border-[#FD5E03]"
        >
          <Download className="w-3.5 h-3.5 text-gray-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">REGISTERED PROFILES</div>
            <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
              {profiles.length}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-gray-500">
            Authenticated via Supabase Auth
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">STORE ASSOCIATIONS</div>
            <div className="mt-2 text-2xl font-bold font-heading text-emerald-700">
              {shopMembers.length}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium">
            Active merchant links
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">STORE OWNERS</div>
            <div className="mt-2 text-2xl font-bold font-heading text-[#FD5E03]">
              {ownersCount}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-medium">
            Primary merchant admins
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">MULTI-STORE USERS</div>
            <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
              {multiShopUsers}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-gray-500">
            Users linked to &gt;1 store
          </div>
        </div>
      </div>

      {/* Profiles Directory Table Card */}
      <div className="bg-white rounded-xl shadow-xs p-5 border border-gray-200/80">
        <div className="flex items-center gap-3 flex-wrap pb-4 border-b border-gray-100">
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, UID, store..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 bg-[#FAFAFB] focus:bg-white focus:border-[#FD5E03] outline-none shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500">Role:</span>
            {(['All', 'Owner', 'Staff'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`text-xs px-3 py-1 rounded-lg font-semibold border transition-all ${
                  selectedRole === role
                    ? 'bg-[#FD5E03] text-white border-[#FD5E03] shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-orange-50 hover:border-orange-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-400 ml-auto font-medium">
            Showing {filteredProfiles.length} of {profiles.length} accounts
          </span>
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            No profiles match the search or filter.
          </div>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="table w-full">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] text-gray-400 uppercase tracking-wider">
                  <th className="py-3 text-left">User Name & Identity</th>
                  <th className="py-3 text-left">Mobile Number</th>
                  <th className="py-3 text-left">Associated Stores</th>
                  <th className="py-3 text-left">RBAC Role</th>
                  <th className="text-right py-3">Registered Date</th>
                  <th className="text-right py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProfiles.map((profile) => {
                  const memberLinks = shopMembers.filter((m) => m.user_id === profile.id);
                  const linkedShops = memberLinks.map((m) => {
                    const sh = shops.find((s) => s.id === m.shop_id);
                    return { name: sh?.name || 'Store', role: m.role };
                  });

                  return (
                    <tr
                      key={profile.id}
                      className="hover:bg-orange-50/30 transition-colors cursor-pointer"
                      onClick={() => setInspectProfile(profile)}
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FD5E03] flex items-center justify-center font-bold text-xs shrink-0 border border-orange-200">
                            {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[#101318]">
                              {profile.full_name || 'CounterPro User'}
                            </div>
                            <div className="text-[10.5px] text-gray-400 font-mono flex items-center gap-1">
                              <span>ID: {profile.id.slice(0, 8)}...</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyId(profile.id);
                                }}
                                title="Copy UID"
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-xs text-gray-700">
                        {profile.phone ? `+91 ${profile.phone}` : '—'}
                      </td>
                      <td className="py-3.5">
                        {linkedShops.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {linkedShops.map((ls, idx) => (
                              <span
                                key={idx}
                                className="text-[10.5px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium"
                              >
                                {ls.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">No store linked</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-orange-50 text-[#FD5E03] border border-orange-200">
                          {linkedShops[0]?.role || 'Owner'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-gray-400 text-xs">
                        {formatDate(profile.created_at)}
                      </td>
                      <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {profile.phone && (
                            <button
                              onClick={() => handleWhatsApp(profile.phone, profile.full_name)}
                              className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 transition-colors"
                              title="WhatsApp Chat"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setInspectProfile(profile)}
                            className="px-2 py-1 text-[11px] font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
                          >
                            Inspect
                          </button>
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

      {/* Profile Detail Inspection Modal */}
      {inspectProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-lg w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FD5E03] flex items-center justify-center font-bold text-base border border-orange-200">
                  {inspectProfile.full_name ? inspectProfile.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#101318] m-0">
                    {inspectProfile.full_name || 'CounterPro User'}
                  </h3>
                  <div className="text-xs text-gray-400 font-mono">
                    ID: {inspectProfile.id}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectProfile(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-5 space-y-3 text-xs text-gray-600">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="font-semibold text-gray-500">Phone Number:</span>
                <span className="font-mono text-gray-900 font-bold">
                  {inspectProfile.phone ? `+91 ${inspectProfile.phone}` : 'Not provided'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="font-semibold text-gray-500">Registration Date:</span>
                <span className="text-gray-900">{formatDate(inspectProfile.created_at)} ({timeAgo(inspectProfile.created_at)})</span>
              </div>

              <div className="py-2">
                <span className="font-semibold text-gray-500 block mb-2">Associated Stores:</span>
                <div className="space-y-1.5">
                  {shopMembers
                    .filter((m) => m.user_id === inspectProfile.id)
                    .map((m) => {
                      const sh = shops.find((s) => s.id === m.shop_id);
                      return (
                        <div key={m.id} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-gray-900">{sh?.name || 'Store'}</div>
                            <div className="text-[11px] text-gray-400">{sh?.city || 'India'}</div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-orange-50 text-[#FD5E03] border border-orange-200">
                            {m.role}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              {inspectProfile.phone && (
                <button
                  onClick={() => handleWhatsApp(inspectProfile.phone, inspectProfile.full_name)}
                  className="btn btn-secondary text-xs min-h-[34px] px-3 gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              )}
              <button
                onClick={() => setInspectProfile(null)}
                className="btn btn-primary text-xs min-h-[34px] px-4 bg-[#101318] hover:bg-black text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
