'use strict';
import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const joinOrder = searchParams.get('order');

    if (!email || !joinOrder) {
      return NextResponse.json({ 
        error: 'Missing email or order param. Use: /api/set-join-order?email=you@gmail.com&order=1' 
      }, { status: 400 });
    }

    const orderNum = parseInt(joinOrder);
    if (isNaN(orderNum)) {
      return NextResponse.json({ error: 'Order must be a number' }, { status: 400 });
    }

    // Update user's join_order
    const result = await turso.execute({
      sql: `UPDATE users SET join_order = ? WHERE email = ?`,
      args: [orderNum, email]
    });

    // Also update all their channels
    const userResult = await turso.execute({
      sql: `SELECT id FROM users WHERE email = ?`,
      args: [email]
    });

    if (userResult.rows?.[0]) {
      const userId = userResult.rows[0].id;
      await turso.execute({
        sql: `UPDATE channels SET join_order = ? WHERE user_id = ?`,
        args: [orderNum, userId]
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Set join_order to ${orderNum} for ${email}` 
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
