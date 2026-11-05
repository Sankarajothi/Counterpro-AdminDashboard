'use client';

import { SHOW_STAFF_ADMIN } from '../lib/featureFlags';
import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  Users,
  Receipt,
  TrendingUp,
  PieChart,
  UserCheck,
  UserMinus,
  UserX,
  Activity,
  MousePointer,
  Bug,
  Store,
  CreditCard,
  ShieldCheck,
  History,
  Contact,
  Wallet,
  HeartPulse,
  BarChart3,
  UserPlus,
  MessageSquare,
  Radio,
  Clock,
  Bell,
  ChevronRight,
  LogOut,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Globe,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  shopCount: number;
  staffCount?: number;
  billsCount?: number;
  paymentAlertCount?: number;
  logCount?: number;
  deletionsCount: number;
  lastUpdated: Date | null;
  adminUser?: {
    email: string;
    role: string;
    name?: string;
    access_type?: 'full' | 'strict';
    allowed_modules?: string[];
  } | null;
  onLogout?: () => void;
  onOpenPrivacy?: () => void;
  onOpenDeleteAccount?: () => void;
}

export function Sidebar({
  currentView,
  onSelectView,
  shopCount,
  staffCount = 0,
  billsCount = 0,
  deletionsCount = 0,
  lastUpdated,
  adminUser,
  onLogout,
  onOpenPrivacy,
  onOpenDeleteAccount,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAppActivityOpen, setIsAppActivityOpen] = useState(
    currentView === 'app_telemetry' ||
      currentView === 'diagnostic_logs'
  );
  const [isShopAnalyticsOpen, setIsShopAnalyticsOpen] = useState(
    currentView === 'salons_360' ||
      currentView === 'shops' ||
      currentView === 'subscription_plans' ||
      currentView === 'staff_access' ||
      currentView === 'staff' ||
      currentView === 'platform_audit' ||
      currentView === 'logs' ||
      currentView === 'user_details' ||
      currentView === 'purchases' ||
      currentView === 'payments' ||
      currentView === 'system_health' ||
      currentView === 'health' ||
      currentView === 'reports_bi' ||
      currentView === 'reports'
  );

  const canAccess = (id: string) => {
    if (!adminUser || !adminUser.access_type || adminUser.access_type === 'full') return true;
    if (adminUser.access_type === 'strict' && Array.isArray(adminUser.allowed_modules)) {
      return adminUser.allowed_modules.includes(id);
    }
    return true;
  };

  const isCurrent = (id: string) => {
    if (currentView === id) return true;
    if (id === 'dashboard' && currentView === 'executive_kpis') return true;
    if (id === 'daily_bills' && currentView === 'orders') return true;
    if (id === 'salons_360' && currentView === 'shops') return true;
    if (id === 'staff_access' && currentView === 'staff') return true;
    if (id === 'platform_audit' && currentView === 'logs') return true;
    if (id === 'purchases' && currentView === 'payments') return true;
    if (id === 'system_health' && currentView === 'health') return true;
    if (id === 'reports_bi' && currentView === 'reports') return true;
    return false;
  };

  const isAppActivityActive =
    isCurrent('app_telemetry') || isCurrent('diagnostic_logs');

  const isShopAnalyticsActive =
    isCurrent('salons_360') ||
    isCurrent('subscription_plans') ||
    isCurrent('staff_access') ||
    isCurrent('platform_audit') ||
    isCurrent('user_details') ||
    isCurrent('purchases') ||
    isCurrent('system_health') ||
    isCurrent('reports_bi');

  const renderNavItem = (
    id: string,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    badge?: number | string,
    hasDot?: boolean
  ) => {
    if (!canAccess(id)) return null;
    const active = isCurrent(id);
    return (
      <button
        key={id}
        onClick={() => onSelectView(id)}
        title={isCollapsed ? label : undefined}
        className={`w-full flex items-center gap-2 px-2.5 py-1 rounded-md text-[11.5px] transition-all group relative text-left cursor-pointer ${
          active
            ? 'bg-[#EA580C] !text-white font-bold shadow-xs'
            : 'text-stone-300 hover:bg-white/10 hover:!text-white font-medium'
        }`}
      >
        <Icon
          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
            active ? '!text-white' : 'text-stone-300 group-hover:!text-white'
          }`}
        />
        {!isCollapsed && (
          <div className="flex-1 flex items-center justify-between overflow-hidden">
            <span className={`truncate ${active ? '!text-white font-bold' : 'text-stone-300 group-hover:!text-white'}`}>
              {label}
            </span>
            <div className="flex items-center gap-1 ml-1.5">
              {hasDot && (
                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-[#EA580C]'} animate-pulse`} />
              )}
              {badge !== undefined && Number(badge) > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold transition-colors ${
                    active
                      ? 'bg-white/25 text-white'
                      : 'bg-white/10 text-stone-200 group-hover:bg-white/20'
                  }`}
                >
                  {badge}
                </span>
              )}
            </div>
          </div>
        )}
      </button>
    );
  };

  const renderSubmenuItem = (
    id: string,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    badge?: number | string
  ) => {
    if (!canAccess(id)) return null;
    const active = isCurrent(id);
    return (
      <button
        key={id}
        onClick={() => onSelectView(id)}
        title={isCollapsed ? label : undefined}
        className={`w-full flex items-center gap-2 ${
          isCollapsed ? 'px-2 justify-center' : 'pl-6 pr-2'
        } py-1 rounded-md text-[11px] transition-all group relative text-left cursor-pointer ${
          active
            ? 'bg-[#EA580C] !text-white font-bold shadow-xs'
            : 'text-stone-300 hover:bg-white/10 hover:!text-white font-medium'
        }`}
      >
        <Icon
          className={`w-3 h-3 shrink-0 ${
            active ? '!text-white' : 'text-stone-300 group-hover:!text-white'
          }`}
        />
        {!isCollapsed && (
          <>
            <span className={`truncate ${active ? '!text-white font-bold' : 'text-stone-300 group-hover:!text-white'}`}>
              {label}
            </span>
            {badge !== undefined && Number(badge) > 0 && (
              <span
                className={`ml-auto px-1.5 py-0.2 rounded-full text-[8.5px] font-mono font-bold transition-colors ${
                  active
                    ? 'bg-white/25 text-white'
                    : 'bg-white/10 text-stone-200 group-hover:bg-white/20'
                }`}
              >
                {badge}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`flex flex-col h-screen bg-[#181311] text-white select-none sticky top-0 transition-all duration-200 z-30 shrink-0 border-r border-white/10 ${
        isCollapsed ? 'w-[56px]' : 'w-[220px]'
      }`}
    >
      {/* Brand Header: Seamless Counter365 Logo & Wordmark matching dark theme */}
      <div className="px-3 py-2.5 border-b border-white/10 bg-[#181311]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center min-w-0">
              <img
                src="/assets/counter365-dark-theme-logo.png"
                alt="Counter365 - A Tecstellar Product"
                className="h-6 w-auto max-w-[155px] object-contain"
              />
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="hidden lg:flex p-1 rounded-md text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-1.5 py-0.5">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
              title="Expand Sidebar"
            >
              <img
                src="/assets/counter365-dark-theme-emblem.png"
                alt="Counter365"
                className="w-6 h-6 object-contain"
              />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tree without gaps and no scrollable bar */}
      <nav className="flex-1 px-2 py-2 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Section: WORKSPACE */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <div className="px-2 pb-0.5 text-[9.5px] font-bold tracking-[0.08em] text-stone-400 uppercase font-mono">
              WORKSPACE
            </div>
          )}

          {renderNavItem('dashboard', 'Founder Dashboard', LayoutDashboard)}
          {renderNavItem('daily_user_metrics', 'Daily User Metrics', Users)}
          {renderNavItem('daily_bills', 'Daily Order Metrics', Receipt, billsCount)}
          {renderNavItem('revenue_trend', 'Revenue Trend', TrendingUp)}
          {renderNavItem('overview', 'Overview', PieChart)}
          {renderNavItem('customer_tracking', 'Customer Tracking', Users)}
          {renderNavItem('incomplete_signups', 'Incomplete signups', UserMinus)}
          {renderNavItem('account_deletions', 'Deleted users', UserX, deletionsCount)}

          {/* Submenu 1: App Activity */}
          <div className="pt-0.5">
            <button
              onClick={() => setIsAppActivityOpen(!isAppActivityOpen)}
              title={isCollapsed ? 'App Activity' : undefined}
              className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md text-[11.5px] transition-all group cursor-pointer ${
                isAppActivityActive
                  ? 'text-white font-bold bg-white/10'
                  : 'text-white/85 hover:text-white hover:bg-white/10 font-medium'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Activity
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    isAppActivityActive ? 'text-white' : 'text-white/75 group-hover:text-white'
                  }`}
                />
                {!isCollapsed && <span className="truncate">App Activity</span>}
              </div>
              {!isCollapsed && (
                <ChevronRight
                  className={`w-3.5 h-3.5 text-white/75 group-hover:text-white transition-transform duration-200 shrink-0 ${
                    isAppActivityOpen ? 'rotate-90 text-white' : ''
                  }`}
                />
              )}
            </button>

            {(isAppActivityOpen || isCollapsed) && (
              <div className="space-y-0.5 mt-0.5">
                {renderSubmenuItem('app_telemetry', 'Touch Heatmap', MousePointer)}
                {renderSubmenuItem('diagnostic_logs', 'App Bugs', Bug)}
              </div>
            )}
          </div>

          {/* Submenu 2: Shop Analytics */}
          <div className="pt-0.5">
            <button
              onClick={() => setIsShopAnalyticsOpen(!isShopAnalyticsOpen)}
              title={isCollapsed ? 'Shop Analytics' : undefined}
              className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md text-[11.5px] transition-all group cursor-pointer ${
                isShopAnalyticsActive
                  ? 'text-white font-bold bg-white/10'
                  : 'text-white/85 hover:text-white hover:bg-white/10 font-medium'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Store
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    isShopAnalyticsActive ? 'text-white' : 'text-white/75 group-hover:text-white'
                  }`}
                />
                {!isCollapsed && <span className="truncate">Shop Analytics</span>}
              </div>
              {!isCollapsed && (
                <ChevronRight
                  className={`w-3.5 h-3.5 text-white/75 group-hover:text-white transition-transform duration-200 shrink-0 ${
                    isShopAnalyticsOpen ? 'rotate-90 text-white' : ''
                  }`}
                />
              )}
            </button>

            {(isShopAnalyticsOpen || isCollapsed) && (
              <div className="space-y-0.5 mt-0.5">
                {renderSubmenuItem('salons_360', 'Shop Directory', Store, shopCount)}
                {renderSubmenuItem('subscription_plans', 'Subscription & 100 Quotas', CreditCard)}
                {SHOW_STAFF_ADMIN && renderSubmenuItem('staff_access', 'Staff Access Control', ShieldCheck, staffCount)}
                {renderSubmenuItem('platform_audit', 'Activity Logs', History)}
                {renderSubmenuItem('user_details', 'User Details', Contact)}
                {renderSubmenuItem('purchases', 'Payment History', Wallet)}
                {renderSubmenuItem('system_health', 'Shop Health', HeartPulse)}
                {renderSubmenuItem('reports_bi', 'Analytics', BarChart3)}
              </div>
            )}
          </div>
        </div>

        {/* Section: ENGAGEMENT */}
        <div className="pt-1">
          {!isCollapsed && (
            <div className="px-2 pb-0.5 text-[9.5px] font-bold tracking-[0.08em] text-stone-400 uppercase font-mono">
              ENGAGEMENT
            </div>
          )}
          <div className="space-y-0.5">
            {renderNavItem('broadcasts', 'Broadcasts & Pop-ups', Radio)}
            {renderNavItem('support_messages', 'Support', MessageSquare, undefined, true)}
          </div>
        </div>
      </nav>

      {/* Footer Area */}
      <div className="p-2 border-t border-white/10 bg-[#120E0C]">
        {!isCollapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1 text-[9.5px]">
              <div className="flex items-center gap-1 text-white font-bold font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
                <span className="text-[9px] tracking-wide uppercase text-white/90 truncate">
                  Live Supabase (ap-south-1)
                </span>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex p-0.5 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Actions Control Bar */}
            <div className="flex items-center justify-between gap-1 p-0.5 bg-black/20 rounded-lg border border-white/15">
              <button
                onClick={onOpenPrivacy || (() => onSelectView('privacy'))}
                className="p-1 rounded text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer flex-1 flex justify-center"
                title="Privacy Policy"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onOpenDeleteAccount || (() => onSelectView('account_deletions'))}
                className="p-1 rounded text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer flex-1 flex justify-center"
                title="Delete Account Management"
              >
                <UserX className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3.5 bg-white/20 mx-0.5" />
              <button
                onClick={onLogout}
                className="p-1 rounded text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer flex-1 flex justify-center"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <span
              className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse"
              title="Live Connection"
            />
            <button
              onClick={onOpenPrivacy || (() => onSelectView('privacy'))}
              className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Privacy Policy"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onLogout}
              className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsCollapsed(false)}
              className="hidden lg:flex p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Expand Sidebar"
            >
              <PanelLeftOpen className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
