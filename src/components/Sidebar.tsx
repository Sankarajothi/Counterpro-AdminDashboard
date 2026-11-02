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
        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors group relative text-left cursor-pointer ${
          active
            ? 'bg-slate-900 text-white font-medium shadow-2xs'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-normal'
        }`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 transition-colors ${
            active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
          }`}
        />
        {!isCollapsed && (
          <div className="flex-1 flex items-center justify-between overflow-hidden">
            <span className="truncate">{label}</span>
            <div className="flex items-center gap-1.5 ml-2 shrink-0">
              {hasDot && (
                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-orange-400' : 'bg-orange-500'} animate-pulse`} />
              )}
              {badge !== undefined && Number(badge) > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums transition-colors ${
                    active
                      ? 'bg-white/20 text-white font-medium'
                      : 'bg-slate-200/70 text-slate-600 font-normal'
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
          isCollapsed ? 'px-2.5 justify-center' : 'pl-7 pr-2.5'
        } py-1.5 rounded-md text-[12.5px] transition-colors group relative text-left cursor-pointer ${
          active
            ? 'bg-slate-900 text-white font-medium shadow-2xs'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-normal'
        }`}
      >
        <Icon
          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
            active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
          }`}
        />
        {!isCollapsed && (
          <>
            <span className="truncate flex-1">{label}</span>
            {badge !== undefined && Number(badge) > 0 && (
              <span
                className={`ml-auto px-1.5 py-0.2 rounded text-[9.5px] font-mono tabular-nums transition-colors shrink-0 ${
                  active
                    ? 'bg-white/20 text-white font-medium'
                    : 'bg-slate-200/70 text-slate-600 font-normal'
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
      className={`flex flex-col h-screen bg-[#f8fafc] text-slate-900 select-none sticky top-0 transition-all duration-150 z-30 shrink-0 border-r border-slate-200/80 ${
        isCollapsed ? 'w-[60px]' : 'w-[236px]'
      }`}
    >
      {/* Brand Header - 48px height matching topbar */}
      <div className="h-12 px-3 border-b border-slate-200/80 flex items-center justify-between shrink-0">
        {!isCollapsed ? (
          <div className="w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
                <img
                  src="/assets/counterpro-logo.png"
                  alt="CounterPro"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0 leading-none">
                <span className="text-[12.5px] font-semibold text-slate-900 tracking-tight truncate">
                  Counter365
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Admin Console
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-1">
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-7 h-7 rounded-lg bg-white p-1 flex items-center justify-center border border-slate-200 shadow-2xs cursor-pointer hover:border-slate-300"
              title="Expand Sidebar"
            >
              <img
                src="/assets/counterpro-logo.png"
                alt="CounterPro"
                className="w-full h-full object-contain"
              />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tree */}
      <nav className="flex-1 px-2 py-2.5 space-y-3 overflow-y-auto overflow-x-hidden">
        {/* Section: Workspace */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <div className="px-2.5 pb-1 text-[10px] font-medium tracking-wider text-slate-400 uppercase font-mono">
              Workspace
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
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13px] transition-colors group cursor-pointer ${
                isAppActivityActive
                  ? 'text-slate-900 font-medium bg-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-normal'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Activity
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isAppActivityActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                {!isCollapsed && <span className="truncate">App Activity</span>}
              </div>
              {!isCollapsed && (
                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-150 shrink-0 ${
                    isAppActivityOpen ? 'rotate-90 text-slate-700' : ''
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
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13px] transition-colors group cursor-pointer ${
                isShopAnalyticsActive
                  ? 'text-slate-900 font-medium bg-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-normal'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Store
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isShopAnalyticsActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                {!isCollapsed && <span className="truncate">Shop Analytics</span>}
              </div>
              {!isCollapsed && (
                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-150 shrink-0 ${
                    isShopAnalyticsOpen ? 'rotate-90 text-slate-700' : ''
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

        {/* Section: Engagement */}
        <div className="pt-1">
          {!isCollapsed && (
            <div className="px-2.5 pb-1 text-[10px] font-medium tracking-wider text-slate-400 uppercase font-mono">
              Engagement
            </div>
          )}
          <div className="space-y-0.5">
            {renderNavItem('support_messages', 'Support', MessageSquare, undefined, true)}
          </div>
        </div>
      </nav>

      {/* Footer Area */}
      <div className="p-2 border-t border-slate-200/80 bg-[#f8fafc]">
        {!isCollapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-slate-500 truncate">Live Supabase</span>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Actions Control Bar */}
            <div className="flex items-center justify-between gap-1 p-0.5 bg-slate-100/80 rounded-lg border border-slate-200/60">
              <button
                onClick={onOpenPrivacy || (() => onSelectView('privacy'))}
                className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer flex-1 flex justify-center"
                title="Privacy Policy"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onOpenDeleteAccount || (() => onSelectView('account_deletions'))}
                className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer flex-1 flex justify-center"
                title="Delete Account Management"
              >
                <UserX className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3.5 bg-slate-200 mx-0.5" />
              <button
                onClick={onLogout}
                className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer flex-1 flex justify-center"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
              title="Live Connection"
            />
            <button
              onClick={onOpenPrivacy || (() => onSelectView('privacy'))}
              className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Privacy Policy"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onLogout}
              className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsCollapsed(false)}
              className="hidden lg:flex p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer mt-0.5"
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
