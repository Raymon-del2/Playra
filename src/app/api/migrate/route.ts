import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';

// Auto-migration for videos table columns
export async function GET() {
  const results: string[] = [];
  
  try {
    // Check if videos table exists and has required columns
    const columns = [
      { name: 'is_post', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'post_type', type: 'TEXT' },
      { name: 'content_type', type: 'TEXT DEFAULT \'video\'' },
      { name: 'visibility', type: 'TEXT DEFAULT \'public\'' },
    ];
    
    for (const col of columns) {
      try {
        // Try to add column (will fail silently if exists)
        await turso.execute({
          sql: `ALTER TABLE videos ADD COLUMN ${col.name} ${col.type}`,
          args: []
        });
        results.push(`Added column: ${col.name}`);
      } catch (e: any) {
        if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
          results.push(`Column exists: ${col.name}`);
        } else {
          results.push(`Error adding ${col.name}: ${e.message}`);
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed',
      results 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
