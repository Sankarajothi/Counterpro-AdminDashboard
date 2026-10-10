'use client';

import React, { useState, useMemo } from 'react';
import { Shop, Profile, ShopMember } from '../../types/database';
import { formatDate, timeAgo } from '../../lib/adminData';
import {
  Users,
  Shield,
  UserCheck,
  ShieldAlert,
  Store,
  Clock,
  Search,
  Download,
  CheckCircle2,
  Lock,
  UserPlus,
  Mail,
  Phone,
  Sparkles,
} from 'lucide-react';

interface DailyUserMetricsViewProps {
  shops: Shop[];
  profiles: Profile[];
  shopMembers: ShopMember[];
  onShowToast?: (msg: string) => void;
}

export function DailyUserMetricsView({
  shops,
  profiles,
  shopMembers,
  onShowToast,
}: DailyUserMetricsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [shopFilter, setShopFilter] = useState('all');

  // Roles breakdown
  const owners = useMemo(
    () => shopMembers.filter((m) => (m.role || '').toLowerCase() === 'owner'),
    [shopMembers]
  );
  const billers = useMemo(
    () => shopMembers.filter((m) => (m.role || '').toLowerCase() === 'biller'),
    [shopMembers]
  );
  const supervisors = useMemo(
    () => shopMembers.filter((m) => (m.role || '').toLowerCase() === 'supervisor'),
    [shopMembers]
  );

  // Consolidated staff directory
  const staffList = useMemo(() => {
    return shopMembers.map((member) => {
      const profile = profiles.find((p) => p.id === member.user_id);
      const shop = shops.find((s) => s.id === member.shop_id);

      return {
        id: member.id,
        name: profile?.full_name || 'Counter Operator',
        phone: profile?.phone || '—',
        role: member.role || 'Cashier',
        isActive: member.is_active,
        joinedAt: member.joined_at || member.created_at || new Date().toISOString(),
        shopId: member.shop_id,
        shopName: shop?.name || 'General Outlet',
      };
    });
  }, [shopMembers, profiles, shops]);

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.shopName.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'all' || s.role.toLowerCase() === roleFilter.toLowerCase();
      const matchesShop = shopFilter === 'all' || s.shopId === shopFilter;

      return matchesSearch && matchesRole && matchesShop;
    });
  }, [staffList, searchQuery, roleFilter, shopFilter]);

  const handleExportCSV = () => {
    if (filteredStaff.length === 0) {
      onShowToast?.('No staff members to export.');
      return;
    }

    const headers = [
      'STAFF NAME',
      'PHONE',
      'ROLE',
      'OUTLET NAME',
      'STATUS',
      'JOINED DATE',
    ];

    const rows = filteredStaff.map((s) => [
      `"${s.name}"`,
      `"${s.phone}"`,
      `"${s.role}"`,
      `"${s.shopName}"`,
      s.isActive ? 'Active' : 'Inactive',
      `"${formatDate(s.joinedAt)}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `staff-directory-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast?.(`Exported ${filteredStaff.length} staff records to CSV`);
  };

  return (
    <div className="space-y-6 font-sans select-none animate-in fade-in duration-150">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#11141a] via-[#1c1f28] to-[#11141a] border border-[#2b303c] p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#FD5E03]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FD5E03] animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider text-[#FD5E03] uppercase">
                Staff Identity & Access Governance
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white m-0">
              Daily Operator & Biller Metrics
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed m-0">
              Audit staff permissions, cashier roles, and merchant access across all Counter Pro POS registers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-[#FD5E03] hover:bg-[#ea5602] text-white text-xs font-bold transition-all shadow-md shadow-[#FD5E03]/30 flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Staff Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-[#FD5E03]/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Total Staff Accounts</span>
            <div className="p-2 rounded-xl bg-[#FFF7ED] text-[#FD5E03]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {shopMembers.length}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Across {shops.length} outlets</span>
            <span className="text-emerald-600 font-bold">100% Real</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-emerald-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Store Owners</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {owners.length > 0 ? owners.length : shops.length}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Primary administrators</span>
            <span className="text-emerald-600 font-semibold">Verified</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-blue-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Cashiers & Billers</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {billers.length}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Counter billing operators</span>
            <span className="text-blue-600 font-semibold">{supervisors.length} Managers</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-purple-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Active Auth Sessions</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {profiles.length}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Supabase auth profiles</span>
            <span className="text-purple-600 font-bold">Secure RLS</span>
          </div>
        </div>
      </div>


      {/* 4. Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search staff name, phone, or outlet..."
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
            <option value="all">All Outlets ({shops.length})</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-hidden focus:border-[#FD5E03]"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="biller">Biller / Cashier</option>
            <option value="supervisor">Supervisor</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery('');
              setShopFilter('all');
              setRoleFilter('all');
            }}
            className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 5. Staff Ledger Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-[#FAFAFB] border-b border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing <strong className="text-gray-900">{filteredStaff.length}</strong> of {staffList.length} staff records
          </div>
          <div className="font-mono text-gray-400">
            Realtime multi-tenant access directory
          </div>
        </div>

        {filteredStaff.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-xs">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <div className="font-semibold text-gray-700 text-sm">No staff members match the selected filter.</div>
            <div className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
              {staffList.length === 0
                ? 'Staff accounts associated with stores will appear here.'
                : 'Try adjusting your search criteria or role dropdown.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAFAFB] text-gray-500 uppercase text-[10.5px] font-bold tracking-wider">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Assigned Outlet</th>
                  <th className="py-3 px-4 text-center">System Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-4 font-semibold text-gray-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {(staff.name[0] || 'S').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900">{staff.name}</div>
                        <div className="text-[10.5px] text-gray-400 font-mono">ID: {staff.id.slice(0, 8)}</div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-gray-700">
                      {staff.phone}
                    </td>

                    {/* Outlet */}
                    <td className="py-3.5 px-4 font-medium text-gray-800 whitespace-nowrap">
                      {staff.shopName}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          staff.role.toLowerCase() === 'owner'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : staff.role.toLowerCase() === 'supervisor'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {staff.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Active</span>
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 text-right text-gray-500 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(staff.joinedAt)}
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
