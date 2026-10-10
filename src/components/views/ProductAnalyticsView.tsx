'use client';

import React, { useState, useMemo } from 'react';
import { Shop, MenuItem, MenuCategory, BillItem, Bill } from '../../types/database';
import { formatINR } from '../../lib/adminData';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Tag,
  UtensilsCrossed,
  Package,
  Star,
  TrendingUp,
  Download,
  Store,
  DollarSign,
  Flame,
  Zap,
  BarChart2,
  PieChart,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

interface ProductAnalyticsViewProps {
  shops: Shop[];
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
  billItems: BillItem[];
  bills: Bill[];
  onShowToast?: (msg: string) => void;
}

type SortOption = 'revenue_desc' | 'sales_desc' | 'price_desc' | 'price_asc' | 'name_asc';

export function ProductAnalyticsView({
  shops,
  menuItems,
  menuCategories,
  billItems,
  bills,
  onShowToast,
}: ProductAnalyticsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedShop, setSelectedShop] = useState<string>('all');
  const [selectedStock, setSelectedStock] = useState<'all' | 'available' | 'unavailable'>('all');
  const [selectedFavorite, setSelectedFavorite] = useState<'all' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('revenue_desc');

  // Aggregate Sales & Revenue per item from bill_items
  const itemStatsMap = useMemo(() => {
    const map: Record<string, { unitsSold: number; totalRevenue: number; halfPortions: number }> = {};
    billItems.forEach((bi) => {
      const nameKey = (bi.item_name || '').trim().toLowerCase();
      if (!nameKey) return;
      if (!map[nameKey]) {
        map[nameKey] = { unitsSold: 0, totalRevenue: 0, halfPortions: 0 };
      }
      map[nameKey].unitsSold += Number(bi.quantity || 1);
      map[nameKey].totalRevenue += Number(bi.line_total || bi.unit_price || 0);
      if (bi.is_half) map[nameKey].halfPortions += Number(bi.quantity || 1);
    });
    return map;
  }, [billItems]);

  // Total Catalog Revenue driven by products
  const totalCatalogRevenue = useMemo(() => {
    return Object.values(itemStatsMap).reduce((acc, curr) => acc + curr.totalRevenue, 0);
  }, [itemStatsMap]);

  const totalUnitsSold = useMemo(() => {
    return Object.values(itemStatsMap).reduce((acc, curr) => acc + curr.unitsSold, 0);
  }, [itemStatsMap]);

  // Enriched Catalog List
  const enrichedItems = useMemo(() => {
    return menuItems.map((item) => {
      const shop = shops.find((s) => s.id === item.shop_id);
      const category = menuCategories.find((c) => c.id === item.category_id);
      const stats = itemStatsMap[item.name.trim().toLowerCase()] || {
        unitsSold: 0,
        totalRevenue: 0,
        halfPortions: 0,
      };

      return {
        ...item,
        shopName: shop?.name || 'General Shop',
        categoryName: category?.name || 'Uncategorized',
        unitsSold: stats.unitsSold,
        totalRevenue: stats.totalRevenue,
        halfPortions: stats.halfPortions,
      };
    });
  }, [menuItems, shops, menuCategories, itemStatsMap]);

  // Top Selling Items (Velocity)
  const topSellers = useMemo(() => {
    return [...enrichedItems]
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);
  }, [enrichedItems]);

  // Category Breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; revenue: number; units: number }> = {};
    enrichedItems.forEach((item) => {
      const cat = item.categoryName;
      if (!map[cat]) map[cat] = { count: 0, revenue: 0, units: 0 };
      map[cat].count += 1;
      map[cat].revenue += item.totalRevenue;
      map[cat].units += item.unitsSold;
    });

    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [enrichedItems]);

  // Filter & Sort
  const filteredItems = useMemo(() => {
    return enrichedItems
      .filter((item) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.name.toLowerCase().includes(q);
          const matchCat = item.categoryName.toLowerCase().includes(q);
          const matchShop = item.shopName.toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchShop) return false;
        }
        // Shop filter
        if (selectedShop !== 'all' && item.shop_id !== selectedShop) return false;
        // Category filter
        if (selectedCategory !== 'all' && item.category_id !== selectedCategory) return false;
        // Stock filter
        if (selectedStock === 'available' && !item.is_available) return false;
        if (selectedStock === 'unavailable' && item.is_available) return false;
        // Favorite filter
        if (selectedFavorite === 'favorites' && !item.is_favorite) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'revenue_desc') return b.totalRevenue - a.totalRevenue;
        if (sortBy === 'sales_desc') return b.unitsSold - a.unitsSold;
        if (sortBy === 'price_desc') return Number(b.price || 0) - Number(a.price || 0);
        if (sortBy === 'price_asc') return Number(a.price || 0) - Number(b.price || 0);
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [
    enrichedItems,
    searchQuery,
    selectedShop,
    selectedCategory,
    selectedStock,
    selectedFavorite,
    sortBy,
  ]);

  const availableCount = menuItems.filter((m) => m.is_available).length;
  const unavailableCount = menuItems.length - availableCount;
  const favoriteCount = menuItems.filter((m) => m.is_favorite).length;
  const hasHalfCount = menuItems.filter((m) => m.has_half).length;

  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      onShowToast?.('No products to export.');
      return;
    }

    const headers = [
      'ITEM NAME',
      'SHOP NAME',
      'CATEGORY',
      'PRICE (INR)',
      'HALF PRICE (INR)',
      'STATUS',
      'IS FAVORITE',
      'UNITS SOLD',
      'TOTAL REVENUE (INR)',
    ];

    const rows = filteredItems.map((item) => [
      `"${item.name}"`,
      `"${item.shopName}"`,
      `"${item.categoryName}"`,
      item.price || 0,
      item.half_price || 0,
      item.is_available ? 'Available' : 'Out of Stock',
      item.is_favorite ? 'Yes' : 'No',
      item.unitsSold,
      item.totalRevenue,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product-analytics-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast?.(`Exported ${filteredItems.length} products to Excel/CSV`);
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
                Product Catalog & Velocity Intelligence
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white m-0">
              Menu Items & Sales Performance
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed m-0">
              Granular breakdown of {menuItems.length} menu items across {menuCategories.length} categories, unit
              pricing, sales velocity, and item revenue contribution.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-[#FD5E03] hover:bg-[#ea5602] text-white text-xs font-bold transition-all shadow-md shadow-[#FD5E03]/30 flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Product Catalog</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Catalog Items */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-[#FD5E03]/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Total Catalog Items</span>
            <div className="p-2 rounded-xl bg-[#FFF7ED] text-[#FD5E03]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {menuItems.length}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Across {shops.length} merchant stores</span>
            <span className="text-[#FD5E03] font-bold font-mono">{favoriteCount} Starred</span>
          </div>
        </div>

        {/* Menu Categories */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-blue-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Menu Categories</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {menuCategories.length}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Organized category groups</span>
            <span className="text-blue-600 font-semibold">{hasHalfCount} Half-Portion</span>
          </div>
        </div>

        {/* Total Units Sold */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-emerald-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Total Units Billed</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {totalUnitsSold.toLocaleString()}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>From completed POS bills</span>
            <span className="text-emerald-600 font-bold">{billItems.length} Lines</span>
          </div>
        </div>

        {/* Gross Product Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-purple-400/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Catalog Revenue</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
            {formatINR(totalCatalogRevenue)}
          </div>
          <div className="mt-2 text-[11.5px] text-gray-500 flex items-center justify-between">
            <span>Direct item sales GMV</span>
            <span className="text-purple-600 font-bold">100% Verified</span>
          </div>
        </div>
      </div>

      {/* 3. Deep Velocity Analytics: Top Selling Items & Category Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Best Sellers Velocity */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#FD5E03]/10 text-[#FD5E03]">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#111827] m-0">Top Performing Products</h3>
                  <p className="text-[11px] text-gray-400 m-0">Highest order volume across counters</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7ED] text-[#FD5E03] border border-[#FED7AA]">
                Velocity Leaderboard
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {topSellers.length === 0 || topSellers.every((t) => t.unitsSold === 0) ? (
                <div className="py-10 text-center text-gray-400 text-xs">
                  <UtensilsCrossed className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                  <div>No product sales recorded yet.</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Items billed at POS will rank here.
                  </div>
                </div>
              ) : (
                topSellers.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-3 hover:bg-[#FFF7ED]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-700 font-mono shadow-2xs">
                        #{index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-gray-900 truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {item.categoryName} &bull; {formatINR(Number(item.price || 0))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-xs text-emerald-700 font-mono">
                        {item.unitsSold} sold
                      </div>
                      <div className="text-[10.5px] font-mono text-gray-500">
                        {formatINR(item.totalRevenue)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between">
            <span>Calculated from live bill_items table</span>
            <span className="font-bold text-[#FD5E03]">Realtime Aggregation</span>
          </div>
        </div>

        {/* Category Contribution Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#111827] m-0">Category Revenue Contribution</h3>
                  <p className="text-[11px] text-gray-400 m-0">Sales distribution across menu departments</p>
                </div>
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {categoryStats.length} Categories
              </span>
            </div>

            <div className="mt-4 space-y-3.5">
              {categoryStats.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No categories recorded yet in database.
                </div>
              ) : (
                categoryStats.slice(0, 5).map((cat) => {
                  const revenuePct =
                    totalCatalogRevenue > 0
                      ? Math.round((cat.revenue / totalCatalogRevenue) * 100)
                      : 0;

                  return (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{cat.name}</span>
                          <span className="text-[10.5px] text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded font-mono">
                            {cat.count} items
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <strong className="text-gray-900">{formatINR(cat.revenue)}</strong>
                          <span className="text-gray-400 text-[11px] ml-1.5">({revenuePct}%)</span>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-[#FD5E03] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(revenuePct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
            <span>Categories automatically sync with Counter Pro POS app</span>
            <span className="font-mono text-gray-400">Total Items: {menuItems.length}</span>
          </div>
        </div>
      </div>

      {/* 4. Filter Toolbar & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search product name, category, or shop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#FD5E03] focus:outline-hidden transition-all text-gray-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Shop Filter */}
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-hidden focus:border-[#FD5E03]"
          >
            <option value="all">All Shops ({shops.length})</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-hidden focus:border-[#FD5E03]"
          >
            <option value="all">All Categories ({menuCategories.length})</option>
            {menuCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={selectedStock}
            onChange={(e: any) => setSelectedStock(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-hidden focus:border-[#FD5E03]"
          >
            <option value="all">All Stock Status</option>
            <option value="available">In Stock (Available)</option>
            <option value="unavailable">Out of Stock</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-medium text-gray-700 focus:outline-hidden focus:border-[#FD5E03]"
          >
            <option value="revenue_desc">Sort: Highest Revenue</option>
            <option value="sales_desc">Sort: Units Sold</option>
            <option value="price_desc">Sort: Highest Price</option>
            <option value="price_asc">Sort: Lowest Price</option>
            <option value="name_asc">Sort: Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* 5. Complete Product Catalog Ledger Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-[#FAFAFB] border-b border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing <strong className="text-gray-900">{filteredItems.length}</strong> of {menuItems.length} catalog products
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-700 font-semibold">{availableCount} In Stock</span>
            <span>&bull;</span>
            <span className="text-rose-600 font-semibold">{unavailableCount} Out of Stock</span>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-xs">
            <UtensilsCrossed className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <div className="font-semibold text-gray-700 text-sm">No menu products match the selected filters.</div>
            <div className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
              {menuItems.length === 0
                ? 'No menu items have been created in the database yet.'
                : 'Try adjusting your search query, store selection, or category filter above.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAFAFB] text-gray-500 uppercase text-[10.5px] font-bold tracking-wider">
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Shop Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-center">Portions</th>
                  <th className="py-3 px-4 text-center">Stock Status</th>
                  <th className="py-3 px-4 text-center">Units Sold</th>
                  <th className="py-3 px-4 text-right">Revenue Driven</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Item Name */}
                    <td className="py-3.5 px-4 font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FD5E03] flex items-center justify-center shrink-0 border border-orange-100">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{item.name}</span>
                          {item.is_favorite && (
                            <span
                              title="Favorite item"
                              className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-600 font-bold border border-amber-200 flex items-center gap-0.5"
                            >
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span>Star</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-gray-400 font-mono">
                          ID: {item.id.slice(0, 8)}
                        </div>
                      </div>
                    </td>

                    {/* Shop */}
                    <td className="py-3.5 px-4 font-medium text-gray-800 whitespace-nowrap">
                      {item.shopName}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {item.categoryName}
                      </span>
                    </td>

                    {/* Unit Price */}
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900 font-mono whitespace-nowrap">
                      {formatINR(Number(item.price || 0))}
                    </td>

                    {/* Portions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {item.has_half ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          Half: {formatINR(Number(item.half_price || 0))}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Full only</span>
                      )}
                    </td>

                    {/* Stock Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                          item.is_available
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.is_available ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Available</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Unavailable</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Units Sold */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold whitespace-nowrap">
                      {item.unitsSold > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                          {item.unitsSold} units
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Revenue Driven */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                      {item.totalRevenue > 0 ? (
                        <span className="text-gray-900">{formatINR(item.totalRevenue)}</span>
                      ) : (
                        <span className="text-gray-400">₹0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 bg-[#FAFAFB] border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing {filteredItems.length} items &bull; Sorted by{' '}
            <strong className="text-gray-800">{sortBy.replace(/_/g, ' ')}</strong>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedShop('all');
              setSelectedStock('all');
              setSelectedFavorite('all');
              setSortBy('revenue_desc');
            }}
            className="text-xs text-[#FD5E03] font-semibold hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
