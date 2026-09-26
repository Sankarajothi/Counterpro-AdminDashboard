'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { ShopDrawer } from '../components/ShopDrawer';
import { LoginPage } from '../components/LoginPage';
import { OverviewView } from '../components/views/OverviewView';
import { ShopsView } from '../components/views/ShopsView';
import { UsageView } from '../components/views/UsageView';
import { PaymentsView } from '../components/views/PaymentsView';
import { OrdersView } from '../components/views/OrdersView';
import { LogsView } from '../components/views/LogsView';
import { DeletionsView } from '../components/views/DeletionsView';
import { PrivacyView } from '../components/views/PrivacyView';
import { fetchAdminData, AdminDataState, formatINR } from '../lib/adminData';
import { Shop } from '../types/database';

export default function AdminConsolePage() {
  const [adminUser, setAdminUser] = useState<{ email: string; role: string; name: string } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentView, setCurrentView] = useState('overview');
  const [period, setPeriod] = useState('Month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AdminDataState>({
    shops: [],
    profiles: [],
    shopMembers: [],
    bills: [],
    billItems: [],
    payments: [],
    menuItems: [],
    menuCategories: [],
    expenses: [],
    subscriptions: [],
    customers: [],
    accountDeletions: [],
    lastFetched: new Date(),
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2800);
  }, []);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const result = await fetchAdminData();
      setData(result);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      showToast('Error syncing with Supabase');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Check existing auth session
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const json = await res.json();
          if (json.authenticated && json.user) {
            setAdminUser(json.user);
          }
        }
      } catch (e) {
        console.error('Session check failed:', e);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (!adminUser) return;
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [adminUser, loadData]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('counterpro_admin_logged_in');
    setAdminUser(null);
    showToast('Logged out of Admin Console');
  };

  // Derived counts
  const activeShops = data.shops.filter((s) => s.is_active);
  const trialShops = data.subscriptions.filter((s) => s.status === 'trialing');
  const expiredShops = data.subscriptions.filter((s) => s.status === 'expired');
  const proSubs = data.subscriptions.filter((s) => s.plan === 'pro');
  const arr = proSubs.reduce((acc, s) => acc + Number(s.amount || 199), 0);
  const completedBills = data.bills.filter((b) => b.status === 'completed');

  // Dynamic View Titles & Subtitles matching reference HTML
  const viewMeta: { [key: string]: [string, string] } = {
    overview: [
      'Revenue summary',
      `Platform-wide totals for the ${period.toLowerCase()}`,
    ],
    shops: [
      'Registered shops',
      `${data.shops.length} shops — ${activeShops.length} active, ${trialShops.length} on trial, ${expiredShops.length} expired`,
    ],
    deletions: [
      'Account deletions',
      `${data.accountDeletions.length} deleted accounts & offboarding feedback`,
    ],
    usage: [
      'Usage & engagement',
      `How shops actually use the app this ${period.toLowerCase()}`,
    ],
    payments: [
      'Payments',
      `Subscription & POS billing — ${formatINR(arr)} annual recurring`,
    ],
    orders: [
      'Orders & items',
      `${completedBills.length} orders processed this ${period.toLowerCase()}`,
    ],
    logs: [
      'Activity logs',
      'Every account, menu, payment and sync event',
    ],
    privacy: [
      'Privacy Policy',
      'Official legal compliance, app store governance & public policy documentation',
    ],
  };

  const currentMeta = viewMeta[currentView] || ['Admin Console', 'CounterPro System'];

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#FD5E03] border-t-transparent rounded-full animate-spin" />
          <div className="text-[13px] font-semibold text-[#101318]">Checking Admin Session...</div>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setAdminUser(user);
          showToast(`Welcome back, ${user.name}`);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-[#101318]">
      {/* Fixed Sticky Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        shopCount={data.shops.length}
        paymentAlertCount={data.payments.filter((p) => p.status === 'failed').length || 2}
        logCount={data.bills.length + data.expenses.length + data.shops.length + data.accountDeletions.length}
        deletionsCount={data.accountDeletions.length}
        lastUpdated={data.lastFetched}
        adminUser={adminUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Sticky Header Bar */}
        <Header
          title={currentMeta[0]}
          subtitle={currentMeta[1]}
          period={period}
          onPeriodChange={(p) => {
            setPeriod(p);
            showToast(`Timeframe switched to ${p}`);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={() => {
            loadData();
            showToast('Refreshed data from Supabase');
          }}
          isLoading={isLoading}
        />

        {/* View Container */}
        <div className="flex-1 p-[22px_26px_40px] flex flex-col gap-[22px]">
          {currentView === 'overview' && (
            <OverviewView
              shops={data.shops}
              bills={data.bills}
              billItems={data.billItems}
              subscriptions={data.subscriptions}
              payments={data.payments}
              period={period}
              onOpenShopDrawer={setSelectedShop}
            />
          )}

          {currentView === 'shops' && (
            <ShopsView
              shops={data.shops}
              bills={data.bills}
              subscriptions={data.subscriptions}
              searchQuery={searchQuery}
              period={period}
              onOpenShopDrawer={setSelectedShop}
            />
          )}

          {currentView === 'usage' && (
            <UsageView
              shops={data.shops}
              bills={data.bills}
              profiles={data.profiles}
              shopMembers={data.shopMembers}
              menuItems={data.menuItems}
              expenses={data.expenses}
              period={period}
              onOpenShopDrawer={setSelectedShop}
            />
          )}

          {currentView === 'payments' && (
            <PaymentsView
              shops={data.shops}
              subscriptions={data.subscriptions}
              payments={data.payments}
              bills={data.bills}
              period={period}
              searchQuery={searchQuery}
              onOpenShopDrawer={setSelectedShop}
            />
          )}

          {currentView === 'deletions' && (
            <DeletionsView
              deletions={data.accountDeletions}
              searchQuery={searchQuery}
              onShowToast={showToast}
            />
          )}

          {currentView === 'orders' && (
            <OrdersView
              shops={data.shops}
              bills={data.bills}
              billItems={data.billItems}
              menuItems={data.menuItems}
              menuCategories={data.menuCategories}
              period={period}
              onOpenShopDrawer={setSelectedShop}
            />
          )}

          {currentView === 'logs' && (
            <LogsView
              shops={data.shops}
              bills={data.bills}
              menuItems={data.menuItems}
              expenses={data.expenses}
              subscriptions={data.subscriptions}
              shopMembers={data.shopMembers}
              accountDeletions={data.accountDeletions}
              searchQuery={searchQuery}
            />
          )}

          {currentView === 'privacy' && (
            <PrivacyView onShowToast={showToast} />
          )}
        </div>
      </main>

      {/* Slide-out Shop Drawer */}
      {selectedShop && (
        <ShopDrawer
          shop={selectedShop}
          subscription={data.subscriptions.find((s) => s.shop_id === selectedShop.id)}
          bills={data.bills}
          members={data.shopMembers}
          profiles={data.profiles}
          menuItems={data.menuItems}
          expenses={data.expenses}
          period={period}
          onClose={() => setSelectedShop(null)}
          onShowToast={showToast}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[26px] bg-[#101318] text-white px-5 py-3 text-[13px] font-semibold rounded-[6px] shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 border border-white/10">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
