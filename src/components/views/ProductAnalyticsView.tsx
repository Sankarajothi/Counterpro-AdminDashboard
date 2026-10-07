'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

interface ProductAnalyticsViewProps {
  shops: Shop[];
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
  billItems: BillItem[];
  bills: Bill[];
}

export function ProductAnalyticsView({
  shops,
  menuItems,
  menuCategories,
  billItems,
  bills,
}: ProductAnalyticsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedShop, setSelectedShop] = useState<string>('all');

  // Filtered menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesShop =
      selectedShop === 'all' || item.shop_id === selectedShop;
    return matchesSearch && matchesCat && matchesShop;
  });

  // Calculate sales from bill items
  const itemSalesMap: Record<string, { count: number; total: number }> = {};
  billItems.forEach((bi) => {
    const key = bi.item_name || 'Item';
    if (!itemSalesMap[key]) itemSalesMap[key] = { count: 0, total: 0 };
    itemSalesMap[key].count += Number(bi.quantity || 1);
    itemSalesMap[key].total += Number(bi.line_total || bi.unit_price || 0);
  });

  const availableCount = menuItems.filter((m) => m.is_available).length;
  const unavailableCount = menuItems.length - availableCount;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Total Catalog Items</span>
            <div className="p-1.5 rounded-lg bg-orange-50 text-[#FD5E03]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
            {menuItems.length}
          </div>
          <div className="mt-1 text-[11.5px] text-gray-500">
            Across {shops.length} registered shops
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Menu Categories</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-[#101318]">
            {menuCategories.length}
          </div>
          <div className="mt-1 text-[11.5px] text-gray-500">
            Active category groupings
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Active in Stock</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-emerald-700">
            {availableCount}
          </div>
          <div className="mt-1 text-[11.5px] text-gray-500">
            Ready for billing at counter
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[var(--color-divider)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Out of Stock</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-rose-700">
            {unavailableCount}
          </div>
          <div className="mt-1 text-[11.5px] text-gray-500">
            Temporarily marked unavailable
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[var(--color-divider)] shadow-xs flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search dish or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FD5E03] focus:bg-white transition-all"
          />
        </div>

        <select
          value={selectedShop}
          onChange={(e) => setSelectedShop(e.target.value)}
          className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-[#FD5E03]"
        >
          <option value="all">All Shops</option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-[#FD5E03]"
        >
          <option value="all">All Categories</option>
          {menuCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Product Catalog Table */}
      <div className="bg-white rounded-xl p-5 border border-[var(--color-divider)] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[14px] text-[#101318]">Menu Items Catalog</h3>
            <p className="text-[11px] text-gray-500">
              Showing {filteredItems.length} products verified from Counter Pro database
            </p>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-16 text-center">
            <UtensilsCrossed className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <div className="text-gray-500 text-xs font-semibold">No menu items match your search.</div>
            <div className="text-gray-400 text-[11px] mt-0.5">
              Items created in Counter Pro POS app appear here instantly.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 text-gray-400 font-medium">
                <tr>
                  <th className="pb-2.5">Item Name</th>
                  <th className="pb-2.5">Shop</th>
                  <th className="pb-2.5">Category</th>
                  <th className="pb-2.5 text-right">Price</th>
                  <th className="pb-2.5 text-center">Status</th>
                  <th className="pb-2.5 text-right">Units Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => {
                  const shop = shops.find((s) => s.id === item.shop_id);
                  const cat = menuCategories.find((c) => c.id === item.category_id);
                  const sales = itemSalesMap[item.name];

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 font-semibold text-gray-900 flex items-center gap-2">
                        {item.name}
                        {item.is_favorite && (
                          <span className="text-[9.5px] px-1 py-0.2 rounded bg-amber-50 text-amber-600 font-bold">
                            ★ Star
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-gray-600">
                        {shop?.name || 'General'}
                      </td>
                      <td className="py-3 text-gray-500">
                        {cat?.name || 'Uncategorized'}
                      </td>
                      <td className="py-3 text-right font-bold text-gray-900 font-heading">
                        {formatINR(Number(item.price || 0))}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            item.is_available
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-gray-700 font-semibold">
                        {sales ? `${sales.count} sold` : '—'}
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
