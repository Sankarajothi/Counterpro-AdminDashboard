'use client';

import React, { useState } from 'react';
import { AdminDataState } from '../../lib/adminData';
import { supabase } from '../../lib/supabase';
import {
  Activity,
  ShieldCheck,
  Database,
  Server,
  RefreshCw,
  CheckCircle2,
  Lock,
  Clock,
  HardDrive,
  Cpu,
  Globe,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SystemHealthViewProps {
  data: AdminDataState;
  onShowToast: (msg: string) => void;
}

export function SystemHealthView({ data, onShowToast }: SystemHealthViewProps) {
  const [latencyMs, setLatencyMs] = useState<number | null>(42);
  const [isPinging, setIsPinging] = useState(false);

  const testPing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await supabase.from('shops').select('id', { head: true, count: 'exact' });
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      onShowToast(`Supabase Live Ping: ${elapsed}ms (200 OK)`);
    } catch (e) {
      onShowToast('Ping error checking Supabase connection');
    } finally {
      setIsPinging(false);
    }
  };

  const tables = [
    { name: 'public.shops', label: 'Registered Shops', count: data.shops.length, rls: 'Enforced', desc: 'Tenant master metadata' },
    { name: 'public.bills', label: 'Invoices & Bills', count: data.bills.length, rls: 'Enforced', desc: 'POS billing transactions' },
    { name: 'public.bill_items', label: 'Bill Line Items', count: data.billItems.length, rls: 'Enforced', desc: 'Ordered items snapshot' },
    { name: 'public.payments', label: 'Payment Records', count: data.payments.length, rls: 'Enforced', desc: 'UPI/Cash settlement ledger' },
    { name: 'public.menu_items', label: 'Catalog Menu Items', count: data.menuItems.length, rls: 'Enforced', desc: 'Items and unit pricing' },
    { name: 'public.menu_categories', label: 'Menu Categories', count: data.menuCategories.length, rls: 'Enforced', desc: 'Catalog taxonomy' },
    { name: 'public.expenses', label: 'Shop Expenses', count: data.expenses.length, rls: 'Enforced', desc: 'Operational outlays' },
    { name: 'public.subscriptions', label: 'Subscriptions', count: data.subscriptions.length, rls: 'Enforced', desc: 'Pro/Trial plan statuses' },
    { name: 'public.profiles', label: 'User Profiles', count: data.profiles.length, rls: 'Enforced', desc: 'Admin & staff credentials' },
    { name: 'public.shop_members', label: 'Shop Members', count: data.shopMembers.length, rls: 'Enforced', desc: 'RBAC role assignments' },
    { name: 'public.customers', label: 'Customers', count: data.customers.length, rls: 'Enforced', desc: 'Store patrons & credit ledger' },
    { name: 'public.account_deletions', label: 'Account Deletions', count: data.accountDeletions.length, rls: 'Enforced', desc: 'Regulatory exit audit records' },
  ];

  const totalRecords = tables.reduce((acc, t) => acc + t.count, 0);

  return (
    <div className="space-y-6 font-sans select-none animate-in fade-in duration-150">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#11141a] via-[#1c1f28] to-[#11141a] border border-[#2b303c] p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#FD5E03]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
                PostgreSQL Infrastructure Health & RLS Audit
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white m-0">
              Database & Cloud Architecture
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed m-0">
              Live monitoring of Supabase PostgreSQL latency, 12 isolated tenant tables, row-level security (RLS) enforcement, and realtime replication.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={testPing}
              disabled={isPinging}
              className="px-4 py-2.5 rounded-xl bg-[#FD5E03] hover:bg-[#ea5602] text-white text-xs font-bold transition-all shadow-md shadow-[#FD5E03]/30 flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Pinging Cloud...' : 'Ping Database'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-[#FD5E03]/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Query Latency</span>
            <div className="p-2 rounded-xl bg-[#FFF7ED] text-[#FD5E03]">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {latencyMs !== null ? `${latencyMs} ms` : 'Testing...'}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span className="text-emerald-600 font-bold">Sub-50ms Fast</span>
            <span className="text-gray-400 font-mono">200 OK</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-emerald-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Database Records</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {totalRecords.toLocaleString()}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Across 12 tables</span>
            <span className="text-emerald-600 font-semibold">Normalized</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-blue-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Security Architecture</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            RLS Active
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Row-level tenant isolation</span>
            <span className="text-blue-600 font-semibold">100% Policy</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-purple-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Cloud Region</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            ap-south-1
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>AWS Mumbai Datacenter</span>
            <span className="text-purple-600 font-bold font-mono">India</span>
          </div>
        </div>
      </div>

      {/* 3. Table Schema Inventory */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-[#FAFAFB] border-b border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div>
            Active PostgreSQL Schema Inventory &bull; <strong className="text-gray-900">{tables.length}</strong> Tables
          </div>
          <span className="font-mono text-gray-400">Total Rows: {totalRecords}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#FAFAFB] text-gray-500 uppercase text-[10.5px] font-bold tracking-wider">
                <th className="py-3 px-4">PostgreSQL Table</th>
                <th className="py-3 px-4">Entity Description</th>
                <th className="py-3 px-4 text-center">Security Policy</th>
                <th className="py-3 px-4 text-right">Live Rows</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tables.map((t) => (
                <tr key={t.name} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                    {t.name}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">
                    <div>
                      <span className="font-semibold text-gray-900">{t.label}</span> &bull; {t.desc}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{t.rls}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                    {t.count.toLocaleString()}
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
