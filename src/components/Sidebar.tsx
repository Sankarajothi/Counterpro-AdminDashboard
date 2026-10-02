'use client';

import React from 'react';
import Image from 'next/image';
import { LogOut, User } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  badge?: string;
}

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  shopCount: number;
  paymentAlertCount: number;
  logCount: number;
  deletionsCount: number;
  lastUpdated: Date | null;
  adminUser?: { email: string; role: string } | null;
  onLogout?: () => void;
}

export function Sidebar({
  currentView,
  onSelectView,
  shopCount,
  paymentAlertCount,
  logCount,
  deletionsCount,
  lastUpdated,
  adminUser,
  onLogout,
}: SidebarProps) {
  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'shops', label: 'Shops', badge: String(shopCount) },
    { id: 'deletions', label: 'Account deletions', badge: deletionsCount > 0 ? String(deletionsCount) : undefined },
    { id: 'usage', label: 'Usage' },
    { id: 'payments', label: 'Payments', badge: paymentAlertCount > 0 ? String(paymentAlertCount) : undefined },
    { id: 'orders', label: 'Orders & items' },
    { id: 'logs', label: 'Activity logs', badge: String(logCount) },
    { id: 'privacy', label: 'Privacy Policy' },
  ];

  const timeString = lastUpdated
    ? lastUpdated.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) + ', ' + lastUpdated.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Syncing...';

  return (
    <aside className="w-[216px] flex-none bg-[#101318] text-[#FFFFFF] flex flex-col sticky top-0 h-screen select-none z-10 border-r border-[#1E2430]">
      {/* Brand Header */}
      <div className="p-[18px_18px_16px] border-b border-[#1E2430]/60">
        <div className="flex items-center gap-2 mb-1">
          <div className="relative w-8 h-8 rounded-md overflow-hidden bg-white flex items-center justify-center p-0.5">
            <img
              src="/assets/counterpro-logo.png"
              alt="Counter365"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="font-heading font-black tracking-wider text-[17px] leading-tight text-white flex items-center">
              COUNTER<span className="text-[#FD5E03]">365</span>
            </div>
            <div className="text-[9px] tracking-[0.18em] uppercase text-white/60 font-semibold">
              ADMIN CONSOLE
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col py-2 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-[11px] min-h-[46px] px-[18px] border-0 border-l-[3px] text-left text-[14px] font-medium transition-all ${
                isActive
                  ? 'border-l-[#FD5E03] bg-white/[0.12] text-white font-semibold'
                  : 'border-l-transparent bg-transparent text-white/70 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span
                  className={`font-heading text-[11px] px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#FD5E03] text-white font-bold'
                      : 'bg-white/10 text-white/80'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin User Profile Card & Sign Out */}
      {adminUser && (
        <div className="p-[12px_16px] bg-white/[0.04] border-t border-white/[0.08] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#FD5E03] text-white flex items-center justify-center font-bold text-[11px] flex-none">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-white truncate leading-tight">
              {adminUser.email}
            </div>
            <div className="text-[10px] text-[#FD5E03] font-medium tracking-wide">
              {adminUser.role || 'Super Admin'}
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="w-7 h-7 rounded flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Status Footer */}
      <div className="p-[14px_18px] border-t border-white/[0.12] text-[11px] text-white/70 leading-[1.6]">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-medium">Supabase Live Data</span>
        </div>
        <div className="text-white/60 text-[10.5px]">
          {timeString}
        </div>
        <div className="text-white/50 text-[10px] mt-0.5 flex items-center justify-between">
          <span>Region: India (ap-south-1)</span>
        </div>
        <div className="mt-2 pt-2 border-t border-white/[0.08] flex items-center justify-between text-[10px]">
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noreferrer"
            className="text-[#FD5E03] hover:underline"
          >
            Privacy Policy
          </a>
          <a
            href="/delete-account"
            target="_blank"
            rel="noreferrer"
            className="text-white/70 hover:text-[#FD5E03] hover:underline flex items-center gap-0.5"
          >
            Delete Account ↗
          </a>
        </div>
      </div>
    </aside>
  );
}
