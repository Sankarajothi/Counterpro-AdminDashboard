'use client';

import React, { useState } from 'react';
import { Shop, Bill, MenuItem, Expense, Subscription, ShopMember, AccountDeletion } from '../../types/database';
import { formatINR } from '../../lib/adminData';

interface LogsViewProps {
  shops: Shop[];
  bills: Bill[];
  menuItems: MenuItem[];
  expenses: Expense[];
  subscriptions: Subscription[];
  shopMembers: ShopMember[];
  accountDeletions?: AccountDeletion[];
  searchQuery: string;
}

export function LogsView({
  shops,
  bills,
  menuItems,
  expenses,
  subscriptions,
  shopMembers,
  accountDeletions = [],
  searchQuery,
}: LogsViewProps) {
  const [filter, setFilter] = useState('All');

  // Synthesize real events from live database records
  const allEvents: {
    id: string;
    timestamp: Date;
    timeString: string;
    msg: string;
    who: string;
    kind: 'Signup' | 'Payment' | 'Users' | 'Menu' | 'Pending' | 'Expense' | 'Order';
    dotColor: string;
  }[] = [];

  // 1. Shop Signups
  shops.forEach((s) => {
    const d = new Date(s.created_at);
    allEvents.push({
      id: `signup-${s.id}`,
      timestamp: d,
      timeString: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      msg: `Shop registered — category "${s.shop_type}", located in ${s.city}, ${s.state}`,
      who: `${s.name} · +91 ${s.phone}`,
      kind: 'Signup',
      dotColor: '#FD5E03',
    });
  });

  // 2. Subscriptions
  subscriptions.forEach((sub) => {
    const shop = shops.find((s) => s.id === sub.shop_id);
    const d = new Date(sub.created_at);
    allEvents.push({
      id: `sub-${sub.id}`,
      timestamp: d,
      timeString: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      msg: `Subscription ${sub.status} — ${sub.plan.toUpperCase()} (${sub.interval || 'yearly'}) for ${formatINR(Number(sub.amount || 199))}`,
      who: `${shop?.name || 'Shop'} · Billing engine`,
      kind: 'Payment',
      dotColor: '#101318',
    });
  });

  // 3. Bills / Orders
  bills.forEach((b) => {
    const shop = shops.find((s) => s.id === b.shop_id);
    const d = new Date(b.completed_at || b.created_at);
    const isPending = Number(b.pending_amount || 0) > 0;
    
    allEvents.push({
      id: `bill-${b.id}`,
      timestamp: d,
      timeString: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      msg: isPending
        ? `Bill #${b.bill_number} generated with ₹${b.pending_amount} pending balance`
        : `Bill #${b.bill_number} completed — ${formatINR(Number(b.total_amount))} settled via ${b.payment_mode || 'Cash'}`,
      who: `${shop?.name || 'Shop'} · ${b.customer_name ? `Customer: ${b.customer_name}` : 'Counter POS'}`,
      kind: isPending ? 'Pending' : 'Order',
      dotColor: isPending ? '#C2410C' : '#10B981',
    });
  });

  // 4. Expenses
  expenses.forEach((e) => {
    const shop = shops.find((s) => s.id === e.shop_id);
    const d = new Date(e.created_at);
    allEvents.push({
      id: `exp-${e.id}`,
      timestamp: d,
      timeString: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      msg: `Expense logged — ${formatINR(Number(e.amount))} for "${e.description}"`,
      who: `${shop?.name || 'Shop'} · Expenses`,
      kind: 'Expense',
      dotColor: '#EF4444',
    });
  });

  // 5. Menu Items Created
  menuItems.slice(0, 15).forEach((m) => {
    const shop = shops.find((s) => s.id === m.shop_id);
    const d = new Date(m.created_at);
    allEvents.push({
      id: `menu-${m.id}`,
      timestamp: d,
      timeString: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      msg: `Menu item added — "${m.name}" priced at ${formatINR(Number(m.price))}`,
      who: `${shop?.name || 'Shop'} · Catalog Manager`,
      kind: 'Menu',
      dotColor: '#FB923C',
    });
  });

  // 6. Shop Members added
  shopMembers.forEach((sm) => {
    const shop = shops.find((s) => s.id === sm.shop_id);
    const d = new Date(sm.created_at);
    allEvents.push({
      id: `mem-${sm.id}`,
      timestamp: d,
      timeString: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      msg: `Team member joined as ${sm.role} role`,
      who: `${shop?.name || 'Shop'} · Permissions`,
      kind: 'Users',
      dotColor: '#EA580C',
    });
  });

  // 7. Account Deletions
  accountDeletions.forEach((ad) => {
    const d = new Date(ad.deleted_at);
    allEvents.push({
      id: `del-${ad.id}`,
      timestamp: d,
      timeString: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      msg: `Account deleted — ${ad.shop_name || 'Shop'} (Reason: "${ad.reason || 'Unspecified'}")`,
      who: `${ad.owner_name || 'Owner'} · ${ad.phone ? `+91 ${ad.phone}` : 'No phone'}`,
      kind: 'Deletion' as any,
      dotColor: '#DC2626',
    });
  });

  // Sort newest first
  allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const filterChips = ['All', 'Signup', 'Payment', 'Order', 'Pending', 'Expense', 'Menu', 'Users', 'Deletion'];

  // Filtering
  const q = searchQuery.trim().toLowerCase();
  let filtered = allEvents.filter((ev) => {
    if (!q) return true;
    return `${ev.msg} ${ev.who} ${ev.kind}`.toLowerCase().includes(q);
  });

  if (filter !== 'All') {
    filtered = filtered.filter((ev) => ev.kind.toLowerCase() === filter.toLowerCase());
  }

  return (
    <div className="bg-white rounded-[8px] shadow-sm p-[18px] border border-[var(--color-divider)]">
      {/* Filters Header */}
      <div className="flex items-center gap-2 flex-wrap pb-3.5 border-b border-[var(--color-divider)]">
        {filterChips.map((chip) => {
          const isActive = filter === chip;
          return (
            <button
              key={chip}
              onClick={() => setFilter(chip)}
              className={`min-h-[32px] px-3 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer border ${
                isActive
                  ? 'border-[#FD5E03] bg-[#FD5E03] text-white'
                  : 'border-[var(--color-divider)] bg-white text-[#101318] hover:bg-[#FFF7ED]'
              }`}
            >
              {chip}
            </button>
          );
        })}
        <span className="text-[12px] text-black/50 ml-auto font-medium">
          {filtered.length} live events
        </span>
      </div>

      {/* Log Feed */}
      <div className="flex flex-col mt-1 divide-y divide-[var(--color-divider)]">
        {filtered.length === 0 ? (
          <div className="text-center text-black/40 py-8 text-[13px]">
            No live events match this filter.
          </div>
        ) : (
          filtered.map((log) => (
            <div
              key={log.id}
              className="flex gap-3.5 py-3 items-start hover:bg-gray-50/50 transition-colors px-1"
            >
              {/* Timestamp */}
              <span className="text-[11px] text-black/50 w-[115px] flex-none font-mono pt-0.5">
                {log.timeString}
              </span>

              {/* Status Dot */}
              <span
                style={{ backgroundColor: log.dotColor }}
                className="w-2 h-2 rounded-full flex-none mt-1.5"
              />

              {/* Event Body */}
              <div className="flex-1 min-w-0">
                <span className="block text-[13.5px] font-medium text-[#101318] leading-snug">
                  {log.msg}
                </span>
                <span className="text-[11px] text-black/50 mt-0.5 block truncate">
                  {log.who}
                </span>
              </div>

              {/* Kind Tag */}
              <span
                className="tag text-[10.5px] flex-none"
                style={{
                  backgroundColor: log.kind === 'Payment' ? '#101318' : '#FFF7ED',
                  color: log.kind === 'Payment' ? '#FFFFFF' : '#C2410C',
                }}
              >
                {log.kind.toUpperCase()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
