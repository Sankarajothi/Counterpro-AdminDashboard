import { supabase } from '../lib/supabase';
import { AppBroadcast } from '../types/database';

export interface CreateBroadcastInput {
  title?: string | null;
  message?: string | null;
  type: 'push' | 'in_app' | 'popup';
  priority?: 'normal' | 'high' | 'urgent';
  target_audience: string;
  target_shop_id?: string | null;
  target_state?: string | null;
  target_city?: string | null;
  placement?: 'full_screen' | 'banner';
  display_type?: 'single' | 'carousel';
  image_url?: string | null;
  images?: string[];
  action_label?: string | null;
  action_deep_link?: string | null;
  is_dismissible?: boolean;
  is_active?: boolean;
  frequency?: string;
  max_impressions?: number;
  scheduled_for?: string | null;
  expires_at?: string | null;
  status?: 'draft' | 'scheduled' | 'sent' | 'archived';
}

function parseBroadcastMeta(b: any): AppBroadcast {
  let extraMeta: any = {};

  if (b.message && (b.message.startsWith('{') || b.message.startsWith('['))) {
    try {
      const parsed = JSON.parse(b.message);
      if (typeof parsed === 'object' && parsed !== null) {
        extraMeta = parsed;
      }
    } catch {}
  }

  let images: string[] = [];
  if (b.images && Array.isArray(b.images) && b.images.length > 0) {
    images = b.images;
  } else if (extraMeta.images && Array.isArray(extraMeta.images)) {
    images = extraMeta.images;
  } else if (b.image_url) {
    if (b.image_url.startsWith('[') || b.image_url.startsWith('{')) {
      try {
        const parsed = JSON.parse(b.image_url);
        if (Array.isArray(parsed)) {
          images = parsed;
        } else if (parsed?.images && Array.isArray(parsed.images)) {
          images = parsed.images;
          extraMeta = { ...extraMeta, ...parsed };
        }
      } catch {
        images = [b.image_url];
      }
    } else {
      images = [b.image_url];
    }
  }

  const placement = b.placement || extraMeta.placement || (b.type === 'in_app' ? 'banner' : 'full_screen');
  const display_type = b.display_type || extraMeta.display_type || (images.length > 1 ? 'carousel' : 'single');
  const target_state = b.target_state || extraMeta.target_state || 'all';
  const is_active = b.is_active !== undefined ? b.is_active : (b.status === 'sent' || b.status === 'active');
  const frequency = b.frequency || extraMeta.frequency || (b.max_impressions === 1 ? 'Once per user' : 'Every session');

  return {
    ...b,
    title: b.title || extraMeta.title || '',
    message: extraMeta.text !== undefined ? extraMeta.text : b.message || '',
    placement,
    display_type,
    target_state,
    images: images.length > 0 ? images : [],
    image_url: images[0] || b.image_url || null,
    is_active,
    frequency,
  };
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

    return data.map((b) => {
      const parsed = parseBroadcastMeta(b);
      return {
        ...parsed,
        interactions_count: countsMap[b.id] || { received: 0, viewed: 0, clicked: 0, dismissed: 0 },
      };
    });
  } catch (err) {
    console.error('Error fetching broadcasts:', err);
    return [];
  }
}

export async function createBroadcast(input: CreateBroadcastInput): Promise<{ success: boolean; data?: AppBroadcast; error?: string }> {
  try {
    const images = input.images && input.images.length > 0 ? input.images : (input.image_url ? [input.image_url] : []);
    const primaryImage = images[0] || null;
    const isDismissible = input.is_dismissible !== undefined ? input.is_dismissible : true;
    const isActive = input.is_active !== undefined ? input.is_active : true;
    const initialStatus = isActive ? (input.scheduled_for ? 'scheduled' : 'sent') : 'draft';

    // Metadata payload for zero-breaking fallback
    const metaPayload = {
      placement: input.placement || 'full_screen',
      display_type: input.display_type || (images.length > 1 ? 'carousel' : 'single'),
      target_state: input.target_state || 'all',
      images,
      frequency: input.frequency || (input.max_impressions === 1 ? 'Once per user' : 'Every session'),
      text: input.message?.trim() || '',
    };

    const standardPayload = {
      title: (input.title?.trim() || ''),
      message: JSON.stringify(metaPayload),
      type: input.type,
      priority: input.priority || 'normal',
      target_audience: input.target_audience,
      target_shop_id: input.target_shop_id || null,
      target_city: input.target_city || null,
      image_url: images.length > 1 ? JSON.stringify(images) : primaryImage,
      action_label: input.action_label?.trim() || null,
      action_deep_link: input.action_deep_link?.trim() || null,
      is_dismissible: isDismissible,
      max_impressions: input.max_impressions || 1,
      status: initialStatus,
      scheduled_for: input.scheduled_for || null,
      expires_at: input.expires_at || null,
      sent_at: input.scheduled_for ? null : new Date().toISOString(),
      created_by: 'Super Admin',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('app_broadcasts')
      .insert(standardPayload)
      .select('*, target_shop:shops(id, name, city)')
      .single();

    if (error) {
      console.error('Failed to create broadcast in Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: parseBroadcastMeta(data) };
  } catch (err: any) {
    console.error('Error in createBroadcast:', err);
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

export async function updateBroadcast(id: string, input: Partial<CreateBroadcastInput>): Promise<{ success: boolean; data?: AppBroadcast; error?: string }> {
  try {
    const images = input.images && input.images.length > 0 ? input.images : (input.image_url ? [input.image_url] : []);
    const primaryImage = images[0] || null;

    const metaPayload = {
      placement: input.placement || 'full_screen',
      display_type: input.display_type || (images.length > 1 ? 'carousel' : 'single'),
      target_state: input.target_state || 'all',
      images,
      frequency: input.frequency || (input.max_impressions === 1 ? 'Once per user' : 'Every session'),
      text: input.message?.trim() || '',
    };

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updatePayload.title = input.title?.trim() || '';
    if (input.message !== undefined || input.placement !== undefined || input.display_type !== undefined) {
      updatePayload.message = JSON.stringify(metaPayload);
    }
    if (input.type !== undefined) updatePayload.type = input.type;
    if (input.priority !== undefined) updatePayload.priority = input.priority;
    if (input.target_audience !== undefined) updatePayload.target_audience = input.target_audience;
    if (input.target_shop_id !== undefined) updatePayload.target_shop_id = input.target_shop_id;
    if (input.target_city !== undefined) updatePayload.target_city = input.target_city;
    if (images.length > 0 || input.image_url !== undefined) {
      updatePayload.image_url = images.length > 1 ? JSON.stringify(images) : primaryImage;
    }
    if (input.action_label !== undefined) updatePayload.action_label = input.action_label?.trim() || null;
    if (input.action_deep_link !== undefined) updatePayload.action_deep_link = input.action_deep_link?.trim() || null;
    if (input.is_dismissible !== undefined) updatePayload.is_dismissible = input.is_dismissible;
    if (input.is_active !== undefined) {
      updatePayload.status = input.is_active ? 'sent' : 'draft';
    } else if (input.status !== undefined) {
      updatePayload.status = input.status;
    }
    if (input.scheduled_for !== undefined) updatePayload.scheduled_for = input.scheduled_for;
    if (input.expires_at !== undefined) updatePayload.expires_at = input.expires_at;

    const { data, error } = await supabase
      .from('app_broadcasts')
      .update(updatePayload)
      .eq('id', id)
      .select('*, target_shop:shops(id, name, city)')
      .single();

    if (error) {
      console.error('Failed to update broadcast:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: parseBroadcastMeta(data) };
  } catch (err: any) {
    console.error('Error in updateBroadcast:', err);
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

export async function toggleBroadcastActive(id: string, is_active: boolean): Promise<boolean> {
  try {
    const status = is_active ? 'sent' : 'draft';
    const { error } = await supabase
      .from('app_broadcasts')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to toggle broadcast status:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in toggleBroadcastActive:', err);
    return false;
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
