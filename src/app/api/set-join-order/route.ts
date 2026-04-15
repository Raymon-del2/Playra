'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profileId');
    const joinOrder = searchParams.get('order');

    if (!profileId || !joinOrder) {
      return NextResponse.json({ 
        error: 'Missing profileId or order param. Use: /api/set-join-order?profileId=xxx&order=1' 
      }, { status: 400 });
    }

    const orderNum = parseInt(joinOrder);
    if (isNaN(orderNum)) {
      return NextResponse.json({ error: 'Order must be a number' }, { status: 400 });
    }

    // Update profile's join_order in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ join_order: orderNum })
      .eq('id', profileId);

    if (error) {
      console.error('Failed to update join_order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Set join_order to ${orderNum} for ${profileId}` 
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
