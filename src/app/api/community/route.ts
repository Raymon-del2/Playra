import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';

async function ensureTable() {
  try {
    await turso.execute({
      sql: `
        CREATE TABLE IF NOT EXISTS community_messages (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          type TEXT CHECK (type IN ('problem','feature')) NOT NULL,
          message TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `,
      args: [],
    });
  } catch (error) {
    console.error('Failed to ensure community_messages table', error);
    throw error;
  }
}

export async function GET() {
  try {
    await ensureTable();
    const res = await turso.execute({
      sql: `
        SELECT id, type, message, created_at
        FROM community_messages
        ORDER BY created_at DESC
        LIMIT 100
      `,
      args: [],
    });
    return NextResponse.json({ data: res.rows || [] });
  } catch (error) {
    console.error('Community GET error', error);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTable();
    const body = await req.json();
    const type = body?.type === 'feature' ? 'feature' : 'problem';
    const message = (body?.message || '').trim();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await turso.execute({
      sql: `
        INSERT INTO community_messages (type, message, created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `,
      args: [type, message],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Community POST error', error);
    return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    await turso.execute({
      sql: `DELETE FROM community_messages WHERE id = ?`,
      args: [id],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Community DELETE error', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
