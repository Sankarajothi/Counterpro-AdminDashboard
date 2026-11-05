import { supabase } from '../lib/supabase';
import { AppBroadcast } from '../types/database';

export interface CreateBroadcastInput {
  title: string;
  message: string;
  type: 'push' | 'in_app' | 'popup';
  priority?: 'normal' | 'high' | 'urgent';
  target_audience: 'all' | 'free_plan' | 'pro_plan' | 'specific_shop' | 'specific_city';
  target_shop_id?: string | null;
  target_city?: string | null;
  image_url?: string | null;
  action_label?: string | null;
  action_deep_link?: string | null;
  is_dismissible?: boolean;
  max_impressions?: number;
  scheduled_for?: string | null;
  expires_at?: string | null;
  status?: 'draft' | 'scheduled' | 'sent' | 'archived';
}

export async function fetchBroadcasts(): Promise<AppBroadcast[]> {
  try {
    const { data, error } = await supabase
      .from('app_broadcasts')
      .select('*, target_shop:shops(id, name, city)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not query app_broadcasts:', error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Also fetch interactions summary for each broadcast
    const broadcastIds = data.map((b) => b.id);
    const { data: interactions } = await supabase
      .from('broadcast_interactions')
      .select('broadcast_id, status')
      .in('broadcast_id', broadcastIds);

    const countsMap: Record<string, { received: number; viewed: number; clicked: number; dismissed: number }> = {};
    if (interactions) {
      interactions.forEach((item) => {
        if (!countsMap[item.broadcast_id]) {
          countsMap[item.broadcast_id] = { received: 0, viewed: 0, clicked: 0, dismissed: 0 };
        }
        if (item.status === 'received') countsMap[item.broadcast_id].received++;
        if (item.status === 'viewed') countsMap[item.broadcast_id].viewed++;
        if (item.status === 'clicked') countsMap[item.broadcast_id].clicked++;
        if (item.status === 'dismissed') countsMap[item.broadcast_id].dismissed++;
      });
    }

    return data.map((b) => ({
      ...b,
      interactions_count: countsMap[b.id] || { received: 0, viewed: 0, clicked: 0, dismissed: 0 },
    }));
  } catch (err) {
    console.error('Error fetching broadcasts:', err);
    return [];
  }
}

export async function createBroadcast(input: CreateBroadcastInput): Promise<{ success: boolean; data?: AppBroadcast; error?: string }> {
  try {
    const payload = {
      title: input.title.trim(),
      message: input.message.trim(),
      type: input.type,
      priority: input.priority || 'normal',
      target_audience: input.target_audience,
      target_shop_id: input.target_shop_id || null,
      target_city: input.target_city || null,
      image_url: input.image_url?.trim() || null,
      action_label: input.action_label?.trim() || null,
      action_deep_link: input.action_deep_link?.trim() || null,
      is_dismissible: input.is_dismissible !== undefined ? input.is_dismissible : true,
      max_impressions: input.max_impressions || 1,
      status: input.status || (input.scheduled_for ? 'scheduled' : 'sent'),
      scheduled_for: input.scheduled_for || null,
      expires_at: input.expires_at || null,
      sent_at: input.scheduled_for ? null : new Date().toISOString(),
      created_by: 'Super Admin',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('app_broadcasts')
      .insert(payload)
      .select('*, target_shop:shops(id, name, city)')
      .single();

    if (error) {
      console.error('Failed to create broadcast in Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Error in createBroadcast:', err);
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

export async function deleteBroadcast(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('app_broadcasts').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete broadcast:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in deleteBroadcast:', err);
    return false;
  }
}

export async function archiveBroadcast(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('app_broadcasts')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      console.error('Failed to archive broadcast:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in archiveBroadcast:', err);
    return false;
  }
}

export async function getActiveDeviceTokensCount(): Promise<{ total: number; android: number; ios: number; web: number }> {
  try {
    const { data, error } = await supabase
      .from('device_push_tokens')
      .select('platform')
      .eq('is_active', true);

    if (error || !data) {
      return { total: 0, android: 0, ios: 0, web: 0 };
    }

    const counts = { total: data.length, android: 0, ios: 0, web: 0 };
    data.forEach((d) => {
      const p = (d.platform || '').toLowerCase();
      if (p.includes('android')) counts.android++;
      else if (p.includes('ios')) counts.ios++;
      else counts.web++;
    });

    return counts;
  } catch {
    return { total: 0, android: 0, ios: 0, web: 0 };
  }
}
