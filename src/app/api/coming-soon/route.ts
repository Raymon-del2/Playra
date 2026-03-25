// Full route implementation using crypto.randomUUID()
import { NextRequest, NextResponse } from 'next/server';
import { turso } from '@/lib/turso';

const ADMIN_EMAIL = 'wambuiraymond03@gmail.com';

// GET all items
export async function GET() {
  try {
    const res = await turso.execute('SELECT * FROM coming_soon ORDER BY created_at DESC');
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error('Coming Soon GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST new item (Admin only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, release_date, is_premier, user_email } = body;

    if (user_email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const id = crypto.randomUUID();
    await turso.execute({
      sql: 'INSERT INTO coming_soon (id, title, description, release_date, is_premier) VALUES (?, ?, ?, ?, ?)',
      args: [id, title, description || null, release_date || null, is_premier ? 1 : 0]
    });

    return NextResponse.json({ id, title, description, release_date, is_premier });
  } catch (error) {
    console.error('Coming Soon POST Error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}

// PATCH update item (Admin only)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, description, release_date, is_premier, user_email } = body;

    if (user_email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await turso.execute({
      sql: 'UPDATE coming_soon SET title = ?, description = ?, release_date = ?, is_premier = ? WHERE id = ?',
      args: [title, description || null, release_date || null, is_premier ? 1 : 0, id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Coming Soon PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE item (Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const user_email = searchParams.get('user_email');

    if (user_email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await turso.execute({
      sql: 'DELETE FROM coming_soon WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Coming Soon DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
