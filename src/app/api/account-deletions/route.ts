import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, shop_name, owner_name, reason, feedback } = body;

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { success: false, message: 'Registered mobile phone number is required.' },
        { status: 400 }
      );
    }

    if (!shop_name || !shop_name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Shop name is required.' },
        { status: 400 }
      );
    }

    // Clean phone number
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Attempt to lookup shop or user in the database
    let shopId: string | null = null;
    let userId: string = '00000000-0000-0000-0000-000000000000';

    try {
      // Find shop by phone or name
      const { data: matchedShops } = await supabase
        .from('shops')
        .select('id, name, phone')
        .or(`phone.ilike.%${cleanPhone}%,name.ilike.%${shop_name.trim()}%`)
        .limit(1);

      if (matchedShops && matchedShops.length > 0) {
        shopId = matchedShops[0].id;

        // Try finding owner/member for this shop
        const { data: members } = await supabase
          .from('shop_members')
          .select('user_id')
          .eq('shop_id', shopId)
          .limit(1);

        if (members && members.length > 0 && members[0].user_id) {
          userId = members[0].user_id;
        }
      }
    } catch (lookupErr) {
      console.warn('Shop lookup warning (continuing with deletion record):', lookupErr);
    }

    // If still dummy user ID, generate random UUID
    if (userId === '00000000-0000-0000-0000-000000000000') {
      userId = crypto.randomUUID();
    }

    const deletionPayload = {
      user_id: userId,
      shop_id: shopId,
      shop_name: shop_name.trim(),
      owner_name: owner_name?.trim() || 'Shop Owner',
      phone: cleanPhone || phone.trim(),
      reason: reason || 'Not Specified',
      feedback: feedback?.trim() || null,
      deleted_at: new Date().toISOString(),
      metadata: {
        submitted_via: 'web_public_delete_page',
        platform: 'Counter365 Web',
        user_agent: req.headers.get('user-agent') || 'browser',
      },
    };

    const { data, error } = await supabase
      .from('account_deletions')
      .insert([deletionPayload])
      .select();

    if (error) {
      console.error('Supabase account_deletions insert error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to record account deletion.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data && data[0] ? data[0].id : null,
      message: 'Your Counter365 account deletion request has been submitted successfully.',
    });
  } catch (err: any) {
    console.error('Account deletion handler error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Server processing error.' },
      { status: 500 }
    );
  }
}
