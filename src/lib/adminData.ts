import { supabase } from './supabase';
import {
  Shop,
  Profile,
  ShopMember,
  Bill,
  BillItem,
  Payment,
  MenuItem,
  MenuCategory,
  Expense,
  Subscription,
  Customer,
  AccountDeletion,
} from '../types/database';

export interface AdminDataState {
  shops: Shop[];
  profiles: Profile[];
  shopMembers: ShopMember[];
  bills: Bill[];
  billItems: BillItem[];
  payments: Payment[];
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
  expenses: Expense[];
  subscriptions: Subscription[];
  customers: Customer[];
  accountDeletions: AccountDeletion[];
  lastFetched: Date;
}

export async function fetchAdminData(): Promise<AdminDataState> {
  const [
    shopsRes,
    profilesRes,
    membersRes,
    billsRes,
    billItemsRes,
    paymentsRes,
    menuItemsRes,
    menuCatsRes,
    expensesRes,
    subsRes,
    customersRes,
    deletionsRes,
  ] = await Promise.all([
    supabase.from('shops').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*'),
    supabase.from('shop_members').select('*'),
    supabase.from('bills').select('*').order('created_at', { ascending: false }),
    supabase.from('bill_items').select('*').order('created_at', { ascending: false }),
    supabase.from('payments').select('*').order('created_at', { ascending: false }),
    supabase.from('menu_items').select('*'),
    supabase.from('menu_categories').select('*'),
    supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
    supabase.from('subscriptions').select('*'),
    supabase.from('customers').select('*'),
    supabase.from('account_deletions').select('*').order('deleted_at', { ascending: false }),
  ]);

  if (shopsRes.error) console.error('Error fetching shops:', shopsRes.error);
  if (billsRes.error) console.error('Error fetching bills:', billsRes.error);
  if (deletionsRes.error) console.error('Error fetching account deletions:', deletionsRes.error);

  return {
    shops: shopsRes.data || [],
    profiles: profilesRes.data || [],
    shopMembers: membersRes.data || [],
    bills: billsRes.data || [],
    billItems: billItemsRes.data || [],
    payments: paymentsRes.data || [],
    menuItems: menuItemsRes.data || [],
    menuCategories: menuCatsRes.data || [],
    expenses: expensesRes.data || [],
    subscriptions: subsRes.data || [],
    customers: customersRes.data || [],
    accountDeletions: deletionsRes.data || [],
    lastFetched: new Date(),
  };
}

export function formatINR(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '₹0';
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

export function formatLakhs(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '₹0';
  if (val >= 10000000) {
    return '₹' + (val / 10000000).toFixed(1) + 'Cr';
  }
  if (val >= 100000) {
    return '₹' + (val / 100000).toFixed(val >= 1000000 ? 0 : 1) + 'L';
  }
  return formatINR(val);
}

export function timeAgo(dateString?: string | null): string {
  if (!dateString) return '—';
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffSec < 0) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} mo ago`;
  return past.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(dateString?: string | null): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
