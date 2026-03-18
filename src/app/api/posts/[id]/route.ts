import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
