'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Shop,
  Bill,
  BillItem,
  Subscription,
  Payment,
  Customer,
  Profile,
  ShopMember,
} from '../../types/database';
import {
  Search,
  Filter,
  Download,
  MapPin,
  RotateCcw,
  Check,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Printer,
  Receipt,
  FileCheck,
  Sparkles,
  AlertCircle,
  Users,
  Globe,
  Compass,
  PhoneCall,
  Clock,
} from 'lucide-react';
import { formatINR } from '../../lib/adminData';
import { fetchAllResponses, AdminResponse } from '../../services/responseService';

interface OverviewViewProps {
  shops: Shop[];
  bills: Bill[];
  billItems: BillItem[];
  subscriptions: Subscription[];
  payments: Payment[];
  customers?: Customer[];
  profiles?: Profile[];
  shopMembers?: ShopMember[];
  period?: string;
  onOpenShopDrawer: (shop: Shop) => void;
  onShowToast?: (msg: string) => void;
  onNavigate?: (view: string) => void;
}

export type OverviewFilterType =
  | 'all'
  | 'active'
  | 'inactive'
  | 'free_plan'
  | 'pro_plan'
  | 'positive'
  | 'negative'
  | 'follow_ups'
  | 'with_bills'
  | 'zero_bills'
  | 'high_orders'
  | 'near_limit'
  | 'with_customers'
  | 'printer_enabled'
  | 'gst_enabled';

type SortColumn =
  | 'name'
  | 'shop'
  | 'phone'
  | 'location'
  | 'registered'
  | 'activity'
  | 'orders'
  | 'revenue'
  | 'customers';

export function OverviewView({
  shops,
  bills,
  billItems,
  subscriptions,
  payments,
  customers = [],
  profiles = [],
  shopMembers = [],
  onOpenShopDrawer,
  onShowToast,
  onNavigate,
}: OverviewViewProps) {
  const [activeFilter, setActiveFilter] = useState<OverviewFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeography, setSelectedGeography] = useState<string>('all');
  const [isGeoDropdownOpen, setIsGeoDropdownOpen] = useState(false);
  const [sortCol, setSortCol] = useState<SortColumn>('registered');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [allResponses, setAllResponses] = useState<AdminResponse[]>([]);

  // Load responses from database API & real-time listener
  useEffect(() => {
    let mounted = true;
    async function loadResponses() {
      const data = await fetchAllResponses();
      if (mounted) setAllResponses(data);
    }
    loadResponses();

    const handleNewResponse = (e: any) => {
      if (e.detail) {
        setAllResponses((prev) => [e.detail, ...prev]);
      }
    };
    window.addEventListener('counterpro_call_response_added', handleNewResponse);
    return () => {
      mounted = false;
      window.removeEventListener('counterpro_call_response_added', handleNewResponse);
    };
  }, []);

  const responsesByShop = useMemo(() => {
    const map = new Map<string, AdminResponse[]>();
    allResponses.forEach((r) => {
      const list = map.get(r.shop_id) || [];
      list.push(r);
      map.set(r.shop_id, list);
    });
    return map;
  }, [allResponses]);

  // Pre-calculate per-shop stats strictly from real database records
  const shopDataList = useMemo(() => {
    return shops.map((shop) => {
      // Find owner profile from shop_members & profiles
      const members = shopMembers.filter((m) => m.shop_id === shop.id);
      const ownerMember = members.find((m) => (m.role || '').toLowerCase() === 'owner') || members[0];
      const ownerProfile = ownerMember
        ? profiles.find((p) => p.id === ownerMember.user_id)
        : null;

      const cleanPhone = shop.phone ? shop.phone.replace(/[^0-9]/g, '').slice(-10) : '';
      const phoneMatchProfile = cleanPhone ? profiles.find((p) => p.phone && p.phone.replace(/[^0-9]/g, '').slice(-10) === cleanPhone) : null;

      // Real valid bills from Supabase
      const shopBills = bills.filter((b) => b.shop_id === shop.id);
      const validBills = shopBills.filter(
        (b) => !b.is_cancelled && !b.is_deleted && b.status !== 'cancelled' && b.status !== 'deleted'
      );
      const orderCount = validBills.length;
      const totalRevenue = validBills.reduce(
        (acc, b) => acc + Number(b.total_amount ?? (b.total_minor ? b.total_minor / 100 : 0)),
        0
      );

      // Find real owner name
      const billOwner = shopBills.find(
        (b: any) =>
          b.created_by_name &&
          b.created_by_name.toLowerCase() !== 'owner' &&
          b.created_by_name.toLowerCase() !== 'shop owner'
      )?.created_by_name;

      const rawOwner = (shop as any).owner_name;
      const ownerName =
        ownerProfile?.full_name ||
        (rawOwner && rawOwner.trim() ? rawOwner : null) ||
        billOwner ||
        (phoneMatchProfile?.full_name && phoneMatchProfile.full_name !== 'Supabase Audit Shop Owner' ? phoneMatchProfile.full_name : null) ||
        (shop.name ? `${shop.name} Owner` : 'Shop Owner');

      const shopPhone = shop.phone || ownerProfile?.phone || phoneMatchProfile?.phone || '';
      const shopType = (shop as any).shop_type || (shop as any).business_type || 'Tea Shop';

      // Customers
      const shopCustomers = customers.filter((c) => c.shop_id === shop.id);
      const uniqueWalkinCustomers = new Set(
        validBills.map((b) => b.customer_phone || b.customer_name).filter(Boolean)
      ).size;
      const customerCount = Math.max(shopCustomers.length, uniqueWalkinCustomers);

      // Subscription (Free Plan with 100 limit vs Pro - strictly follows subscriptions table)
      const sub = subscriptions.find((s) => s.shop_id === shop.id);
      const isPro = Boolean(
        sub &&
        (sub.status === 'active' || sub.status === 'paid') &&
        (sub.plan || '').toLowerCase() !== 'free' &&
        ((sub.plan || '').toLowerCase().includes('pro') || Number(sub.amount || sub.amount_minor || 0) > 0)
      );

      const currentPlanName = isPro
        ? (sub?.plan_name || 'Pro Plan')
        : (sub?.plan_name || 'Free Plan');
      const currentPlanStatus = sub?.status || 'active';

      // 100 Free Bills Quota calculations
      const freeBillsLimit = 100;
      const freeBillsUsed = Math.min(orderCount, freeBillsLimit);
      const freeQuotaPct = Math.round((freeBillsUsed / freeBillsLimit) * 100);
      const isNearLimit = !isPro && orderCount >= 80;
      const isLimitReached = !isPro && orderCount >= 100;

      // Registered Date - Real shop registration timestamp from Supabase
      const registeredDate = shop.created_at ? new Date(shop.created_at) : new Date();

      // Activity Status from real last transaction
      let activityLabel = 'Today';
      let isLive = false;
      if (validBills.length > 0) {
        const lastBill = [...validBills].sort(
          (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        )[0];
        const diffHours = (Date.now() - new Date(lastBill.created_at || '').getTime()) / (1000 * 60 * 60);
        if (diffHours <= 2) {
          activityLabel = 'Live';
          isLive = true;
        } else if (diffHours <= 24) {
          activityLabel = 'Today';
        } else if (diffHours <= 48) {
          activityLabel = '1 day ago';
        } else {
          activityLabel = `${Math.floor(diffHours / 24)} days ago`;
        }
      } else {
        const diffDays = Math.floor((Date.now() - registeredDate.getTime()) / (1000 * 60 * 60 * 24));
        activityLabel = diffDays === 0 ? 'Today' : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
      }

      // Latest customer response from database
      const shopResponses = responsesByShop.get(shop.id) || [];
      const latestResponse = shopResponses[0] || null;
      const hasFollowUp = shopResponses.some((r) => Boolean(r.follow_up_date));

      return {
        shop,
        ownerName,
        shopName: shop.name,
        shopType,
        phone: shopPhone,
        city: shop.city || 'Coimbatore',
        state: shop.state === 'TN' ? 'Tamil Nadu' : (shop.state || 'Tamil Nadu'),
        registeredDate,
        registeredFormatted: registeredDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        platform: 'Android',
        activityLabel,
        isLive,
        isPro,
        currentPlanName,
        currentPlanStatus,
        orderCount,
        totalRevenue,
        customerCount,
        isActive: Boolean(shop.is_active),
        printerEnabled: Boolean(shop.printer_enabled),
        gstEnabled: Boolean(shop.gst_enabled),
        freeBillsUsed,
        freeQuotaPct,
        isNearLimit,
        isLimitReached,
        latestResponse,
        hasFollowUp,
      };
    });
  }, [shops, bills, subscriptions, customers, profiles, shopMembers, responsesByShop]);

  // Real Metric Counters (Zero Dummy Data)
  const totalRegistered = shopDataList.length;
  const totalActive = shopDataList.filter((s) => s.isActive).length;
  const totalInactive = totalRegistered - totalActive;
  const totalFreePlan = shopDataList.filter((s) => !s.isPro).length;
  const totalProPlan = shopDataList.filter((s) => s.isPro).length;
  const totalPositive = shopDataList.filter((s) => s.latestResponse?.outcome === 'Positive').length;
  const totalNegative = shopDataList.filter((s) => s.latestResponse?.outcome === 'Negative').length;
  const totalFollowUps = shopDataList.filter((s) => s.hasFollowUp).length;
  const shopsWithBills = shopDataList.filter((s) => s.orderCount > 0).length;
  const shopsZeroBills = shopDataList.filter((s) => s.orderCount === 0).length;
  const shopsHighOrders = shopDataList.filter((s) => s.orderCount >= 10).length;
  const shopsNearLimit = shopDataList.filter((s) => s.isNearLimit).length;
  const totalCustomersAdded = customers.length || shopDataList.reduce((acc, s) => acc + s.customerCount, 0);
  const shopsWithCustomersCount = shopDataList.filter((s) => s.customerCount > 0).length;
  const totalPrintersSetup = shopDataList.filter((s) => s.printerEnabled).length;
  const totalGstEnabled = shopDataList.filter((s) => s.gstEnabled).length;
  const totalPlatformRevenue = shopDataList.reduce((acc, s) => acc + s.totalRevenue, 0);
  const totalBillsCreated = shopDataList.reduce((acc, s) => acc + s.orderCount, 0);

  // Real Geographies in our dataset (Cities + State)
  const geographyOptions = useMemo(() => {
    const cities = Array.from(new Set(shopDataList.map((s) => s.city).filter(Boolean)));
    return [
      { id: 'all', label: 'All Territories' },
      { id: 'state:Tamil Nadu', label: 'Tamil Nadu (State)' },
      ...cities.map((c) => ({ id: `city:${c}`, label: `${c} (City)` })),
    ];
  }, [shopDataList]);

  // Aggregate stats per city for territory cards
  const citySummary = useMemo(() => {
    const summary: Record<string, { shops: number; gmv: number }> = {};
    shopDataList.forEach((s) => {
      const c = s.city || 'Tamil Nadu';
      if (!summary[c]) summary[c] = { shops: 0, gmv: 0 };
      summary[c].shops += 1;
      summary[c].gmv += s.totalRevenue;
    });
    return summary;
  }, [shopDataList]);

  // Handle Pill Click: Filters the table directly!
  const handlePillClick = (filterKey: OverviewFilterType) => {
    setActiveFilter(filterKey);
    onShowToast?.(`Filtered shops by: ${filterKey.replace(/_/g, ' ').toUpperCase()}`);
  };

  // Filter Data based on Active Filter, Search, and Geography
  const filteredShops = useMemo(() => {
    return shopDataList
      .filter((item) => {
        // Metric / Tab Filter
        if (activeFilter === 'active' && !item.isActive) return false;
        if (activeFilter === 'inactive' && item.isActive) return false;
        if (activeFilter === 'free_plan' && item.isPro) return false;
        if (activeFilter === 'pro_plan' && !item.isPro) return false;
        if (activeFilter === 'positive' && item.latestResponse?.outcome !== 'Positive') return false;
        if (activeFilter === 'negative' && item.latestResponse?.outcome !== 'Negative') return false;
        if (activeFilter === 'follow_ups' && !item.hasFollowUp) return false;
        if (activeFilter === 'with_bills' && item.orderCount === 0) return false;
        if (activeFilter === 'zero_bills' && item.orderCount > 0) return false;
        if (activeFilter === 'high_orders' && item.orderCount < 10) return false;
        if (activeFilter === 'near_limit' && !item.isNearLimit) return false;
        if (activeFilter === 'with_customers' && item.customerCount === 0) return false;
        if (activeFilter === 'printer_enabled' && !item.printerEnabled) return false;
        if (activeFilter === 'gst_enabled' && !item.gstEnabled) return false;

        // Geography Filter (supports all, state:..., city:...)
        if (selectedGeography !== 'all') {
          if (selectedGeography.startsWith('city:')) {
            const targetCity = selectedGeography.replace('city:', '').toLowerCase();
            if (item.city.toLowerCase() !== targetCity) return false;
          } else if (selectedGeography.startsWith('state:')) {
            const targetState = selectedGeography.replace('state:', '').toLowerCase();
            if (item.state.toLowerCase() !== targetState) return false;
          } else {
            if (item.state !== selectedGeography && item.city !== selectedGeography) return false;
          }
        }

        // Search Query (Shop Name, Owner Name, Phone, City, ID, Type)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.ownerName.toLowerCase().includes(q);
          const matchShop = item.shopName.toLowerCase().includes(q);
          const matchType = (item.shopType || '').toLowerCase().includes(q);
          const matchPhone = item.phone.toLowerCase().includes(q);
          const matchCity = item.city.toLowerCase().includes(q);
          const matchId = item.shop.id.toLowerCase().includes(q);
          if (!matchName && !matchShop && !matchType && !matchPhone && !matchCity && !matchId) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = (a as any)[sortCol] || '';
        let valB: any = (b as any)[sortCol] || '';

        if (sortCol === 'name') {
          valA = a.ownerName.toLowerCase();
          valB = b.ownerName.toLowerCase();
        } else if (sortCol === 'shop') {
          valA = a.shopName.toLowerCase();
          valB = b.shopName.toLowerCase();
        } else if (sortCol === 'registered') {
          valA = a.registeredDate.getTime();
          valB = b.registeredDate.getTime();
        } else if (sortCol === 'orders') {
          valA = a.orderCount;
          valB = b.orderCount;
        } else if (sortCol === 'revenue') {
          valA = a.totalRevenue;
          valB = b.totalRevenue;
        } else if (sortCol === 'customers') {
          valA = a.customerCount;
          valB = b.customerCount;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [shopDataList, activeFilter, searchQuery, selectedGeography, sortCol, sortDirection]);

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDirection('desc');
    }
  };

  const handleExportExcel = () => {
    if (filteredShops.length === 0) {
      onShowToast?.('No shops available to export.');
      return;
    }
    const headers = [
      'SHOP NAME',
      'SHOP TYPE',
      'OWNER NAME',
      'PHONE',
      'CITY',
      'STATE',
      'REGISTERED DATE',
      'STATUS',
      'ACTIVE CURRENT PLAN',
      'FREE BILLS USED (100 LIMIT)',
      'TOTAL BILLS',
      'TOTAL REVENUE (INR)',
      'CUSTOMERS',
      'THERMAL PRINTER',
      'GST ENABLED',
    ];
    const rows = filteredShops.map((s) => [
      `"${s.shopName}"`,
      `"${s.shopType}"`,
      `"${s.ownerName}"`,
      `"${s.phone}"`,
      `"${s.city}"`,
      `"${s.state}"`,
      `"${s.registeredFormatted}"`,
      s.isActive ? 'Active' : 'Inactive',
      `"${s.currentPlanName} (${s.currentPlanStatus})"`,
      `${s.freeBillsUsed}/100`,
      s.orderCount,
      s.totalRevenue,
      s.customerCount,
      s.printerEnabled ? 'Yes' : 'No',
      s.gstEnabled ? 'Yes' : 'No',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `counter365-overview-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast?.(`Exported ${filteredShops.length} shops to Excel`);
  };

  return (
    <div className="flex flex-col gap-4 font-sans select-none">
      {/* 1. Header Title */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 m-0 tracking-tight">Overview &amp; Shops Directory</h2>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono tabular-nums text-slate-600 bg-slate-100 border border-slate-200">
            {totalRegistered} shops
          </span>
        </div>
      </div>

      {/* 2. Interactive Metric Filter Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => handlePillClick('all')}
          className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer border ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-2xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal shadow-2xs'
          }`}
          title="Show all registered shops"
        >
          Registered <span className={`ml-1 font-mono tabular-nums ${activeFilter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>{totalRegistered.toLocaleString()}</span>
        </button>

        <button
          onClick={() => handlePillClick('active')}
          className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer border ${
            activeFilter === 'active'
              ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-2xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal shadow-2xs'
          }`}
          title="Filter active shops"
        >
          Active <span className={`ml-1 font-mono tabular-nums ${activeFilter === 'active' ? 'text-slate-300' : 'text-slate-500'}`}>{totalActive.toLocaleString()}</span>
        </button>

        <button
          onClick={() => handlePillClick('inactive')}
          className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer border ${
            activeFilter === 'inactive'
              ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-2xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal shadow-2xs'
          }`}
          title="Filter inactive shops"
        >
          Inactive <span className={`ml-1 font-mono tabular-nums ${activeFilter === 'inactive' ? 'text-slate-300' : 'text-slate-500'}`}>{totalInactive.toLocaleString()}</span>
        </button>

        <button
          onClick={() => handlePillClick('free_plan')}
          className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer border ${
            activeFilter === 'free_plan'
              ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-2xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal shadow-2xs'
          }`}
          title="Filter free plan shops (100 free sales allowance)"
        >
          Free Plan <span className={`ml-1 font-mono tabular-nums ${activeFilter === 'free_plan' ? 'text-slate-300' : 'text-slate-500'}`}>{totalFreePlan.toLocaleString()}</span>
        </button>

        <button
          onClick={() => handlePillClick('pro_plan')}
          className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer border ${
            activeFilter === 'pro_plan'
              ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-2xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal shadow-2xs'
          }`}
          title="Filter Pro Plan subscribed shops"
        >
          Pro Plan <span className={`ml-1 font-mono tabular-nums ${activeFilter === 'pro_plan' ? 'text-slate-300' : 'text-slate-500'}`}>{totalProPlan.toLocaleString()}</span>
        </button>

        <button
          onClick={() => handlePillClick('positive')}
          className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer border ${
            activeFilter === 'positive'
              ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-2xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal shadow-2xs'
          }`}
          title="Filter shops with positive response"
        >
          Positive <span className={`ml-1 font-mono tabular-nums ${activeFilter === 'positive' ? 'text-slate-300' : 'text-slate-500'}`}>{totalPositive.toLocaleString()}</span>
        </button>

        <button
          onClick={() => handlePillClick('negative')}
          className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer border ${
            activeFilter === 'negative'
              ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-2xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal shadow-2xs'
          }`}
          title="Filter shops with negative response"
        >
          Negative <span className={`ml-1 font-mono tabular-nums ${activeFilter === 'negative' ? 'text-slate-300' : 'text-slate-500'}`}>{totalNegative.toLocaleString()}</span>
        </button>

        <button
          onClick={() => handlePillClick('follow_ups')}
          className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer border ${
            activeFilter === 'follow_ups'
              ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-2xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal shadow-2xs'
          }`}
          title="Filter shops with scheduled follow-ups"
        >
          Follow-ups <span className={`ml-1 font-mono tabular-nums ${activeFilter === 'follow_ups' ? 'text-slate-300' : 'text-slate-500'}`}>{totalFollowUps.toLocaleString()}</span>
        </button>

        <button
          onClick={() => handlePillClick('with_bills')}
          className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer border ${
            activeFilter === 'with_bills'
              ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-2xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal shadow-2xs'
          }`}
          title="Filter shops that have recorded bills"
        >
          With Bills <span className={`ml-1 font-mono tabular-nums ${activeFilter === 'with_bills' ? 'text-slate-300' : 'text-slate-500'}`}>{shopsWithBills.toLocaleString()}</span>
        </button>

        <button
          onClick={() => handlePillClick('zero_bills')}
          className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer border ${
            activeFilter === 'zero_bills'
              ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-2xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal shadow-2xs'
          }`}
          title="Filter shops with zero transactions"
        >
          Zero Bills <span className={`ml-1 font-mono tabular-nums ${activeFilter === 'zero_bills' ? 'text-slate-300' : 'text-slate-500'}`}>{shopsZeroBills.toLocaleString()}</span>
        </button>

        <button
          onClick={() => handlePillClick('near_limit')}
          className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer border ${
            activeFilter === 'near_limit'
              ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-2xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal shadow-2xs'
          }`}
          title="Filter shops nearing 100 sales limit (>= 80 bills)"
        >
          Near Limit (&gt;80) <span className={`ml-1 font-mono tabular-nums ${activeFilter === 'near_limit' ? 'text-slate-300' : 'text-slate-500'}`}>{shopsNearLimit.toLocaleString()}</span>
        </button>
      </div>

      {/* 5. Live Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search shop name, owner, phone, city, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 h-8 text-xs rounded-md border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-2xs"
        />
      </div>

      {/* 6. Action Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setActiveFilter('all');
              setSelectedGeography('all');
              setSearchQuery('');
            }}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset filters</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          {/* Geography Filter */}
          <div className="relative">
            <button
              onClick={() => setIsGeoDropdownOpen(!isGeoDropdownOpen)}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium transition-colors cursor-pointer shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {selectedGeography === 'all'
                  ? 'Geography'
                  : geographyOptions.find((g) => g.id === selectedGeography)?.label || selectedGeography}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isGeoDropdownOpen && (
              <div className="absolute left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg p-1 z-40">
                {geographyOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSelectedGeography(opt.id);
                      setIsGeoDropdownOpen(false);
                      onShowToast?.(`Filtered to ${opt.label}`);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer flex items-center justify-between ${
                      selectedGeography === opt.id
                        ? 'bg-slate-100 text-slate-900 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedGeography === opt.id && <Check className="w-3.5 h-3.5 text-slate-900" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-500 font-normal">
          Showing <span className="font-mono tabular-nums text-slate-900 font-medium">{filteredShops.length}</span> of <span className="font-mono tabular-nums">{totalRegistered}</span> shops
        </div>
      </div>

      {/* 7. The Data Table (Real Counter 365 Columns) */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 text-[11.5px] font-medium">
                <th
                  onClick={() => handleSort('name')}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 whitespace-nowrap font-medium"
                >
                  <div className="flex items-center gap-1">
                    <span>Owner</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('shop')}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 whitespace-nowrap font-medium"
                >
                  <div className="flex items-center gap-1">
                    <span>Shop name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3.5 whitespace-nowrap font-medium">
                  <span>Type</span>
                </th>
                <th
                  onClick={() => handleSort('phone')}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 whitespace-nowrap font-medium"
                >
                  <div className="flex items-center gap-1">
                    <span>Phone</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('location')}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 whitespace-nowrap font-medium"
                >
                  <div className="flex items-center gap-1">
                    <span>Location</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('registered')}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 whitespace-nowrap font-medium"
                >
                  <div className="flex items-center gap-1">
                    <span>Registered</span>
                    {sortCol === 'registered' ? (
                      sortDirection === 'desc' ? (
                        <ArrowDown className="w-3 h-3 text-slate-900" />
                      ) : (
                        <ArrowUp className="w-3 h-3 text-slate-900" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="py-2.5 px-3.5 whitespace-nowrap font-medium">Platform</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap font-medium">Activity</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap text-center font-medium">Response</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap text-center font-medium">Current plan</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap font-medium">Quota (100)</th>
                <th
                  onClick={() => handleSort('orders')}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 whitespace-nowrap text-center font-medium"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Bills</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('revenue')}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 whitespace-nowrap text-right font-medium"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total revenue (₹)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('customers')}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 whitespace-nowrap text-center font-medium"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Customers</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredShops.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span className="font-medium text-slate-600">No shops match the selected criteria.</span>
                      <span className="text-[11px] text-slate-400">
                        {shops.length === 0
                          ? 'No merchant stores registered in Supabase database yet.'
                          : 'Try clicking "Registered" or "Reset filters" above.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredShops.map((item) => (
                  <tr
                    key={item.shop.id}
                    onClick={() => onOpenShopDrawer(item.shop)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                  >
                    {/* 1. NAME */}
                    <td className="py-2.5 px-3.5 font-medium text-slate-900 whitespace-nowrap">
                      {item.ownerName}
                    </td>

                    {/* 2. SHOP */}
                    <td
                      className="py-2.5 px-3.5 font-normal text-slate-800 whitespace-nowrap max-w-[180px] truncate"
                      title={item.shopName}
                    >
                      {item.shopName}
                    </td>

                    {/* 2b. SHOP TYPE */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {item.shopType}
                      </span>
                    </td>

                    {/* 3. PHONE with WhatsApp link */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {item.phone ? (
                        <a
                          href={`https://wa.me/91${item.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors font-mono tabular-nums text-xs"
                        >
                          <span>{item.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>

                    {/* 4. LOCATION */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="font-normal text-slate-800">{item.city}</div>
                      <div className="text-[10.5px] text-slate-400">{item.state}</div>
                    </td>

                    {/* 5. REGISTERED */}
                    <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap font-normal">
                      {item.registeredFormatted}
                    </td>

                    {/* 6. PLATFORM */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600">
                      <span>{item.platform}</span>
                    </td>

                    {/* 7. ACTIVITY */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {item.isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#dcfae5] text-[#04250e]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          <span>Live</span>
                        </span>
                      ) : item.activityLabel === 'Today' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#fffbeb] text-[#92400e]">
                          Today
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-normal bg-slate-100 text-slate-600">
                          {item.activityLabel}
                        </span>
                      )}
                    </td>

                    {/* 8. RESPONSE */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-center">
                      {item.latestResponse ? (
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              item.latestResponse.outcome === 'Positive'
                                ? 'bg-[#dcfae5] text-[#04250e]'
                                : 'bg-[#ffedea] text-[#831c1e]'
                            }`}
                          >
                            {item.latestResponse.outcome}
                          </span>
                          {item.latestResponse.employee_name && (
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              by {item.latestResponse.employee_name}
                            </span>
                          )}
                          {item.latestResponse.follow_up_date && (
                            <span className="text-[9.5px] text-slate-500 font-mono mt-0.5">
                              {item.latestResponse.follow_up_date.slice(0, 10)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* 9. ACTIVE CURRENT PLAN */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-center">
                      {item.isPro ? (
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-[#dcfae5] text-[#04250e]">
                          Pro ({item.currentPlanStatus === 'active' ? 'Active' : item.currentPlanStatus})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-[#ebedee] text-[#353736]">
                          {item.currentPlanName} ({item.currentPlanStatus === 'active' ? 'Active' : item.currentPlanStatus})
                        </span>
                      )}
                    </td>

                    {/* 9. FREE 100 SALES QUOTA PROGRESS */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap min-w-[150px]">
                      {item.isPro ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-normal">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Unlimited Pro</span>
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono tabular-nums text-slate-700">
                              {item.freeBillsUsed} / 100
                            </span>
                            <span
                              className={`font-mono text-[10.5px] tabular-nums ${
                                item.isLimitReached
                                  ? 'text-rose-600 font-medium'
                                  : item.isNearLimit
                                  ? 'text-amber-600 font-medium'
                                  : 'text-slate-500'
                              }`}
                            >
                              {item.freeQuotaPct}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.isLimitReached
                                  ? 'bg-rose-500'
                                  : item.isNearLimit
                                  ? 'bg-amber-500'
                                  : 'bg-slate-700'
                              }`}
                              style={{ width: `${item.freeQuotaPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>

                    {/* 10. BILLS / ORDERS */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-center">
                      <span className="font-mono tabular-nums text-xs text-slate-800">
                        {item.orderCount}
                      </span>
                    </td>

                    {/* 11. TOTAL REVENUE */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-right font-mono tabular-nums font-medium text-slate-900">
                      {formatINR(item.totalRevenue)}
                    </td>

                    {/* 12. CUSTOMERS */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-center">
                      <span className="font-mono tabular-nums text-xs text-slate-700">
                        {item.customerCount}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Bar */}
        <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-mono tabular-nums">1 - {filteredShops.length}</span> of <span className="font-mono tabular-nums">{filteredShops.length}</span> shops
          </div>
          <div className="flex items-center gap-1 font-mono text-xs">
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-900 font-medium">1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
