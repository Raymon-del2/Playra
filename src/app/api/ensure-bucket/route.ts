'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const postsBucket = buckets?.find(b => b.name === 'posts');
    
    if (!postsBucket) {
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket('posts', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/*']
      });
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, message: 'Created posts bucket' });
    }
    
    return NextResponse.json({ success: true, message: 'Posts bucket already exists' });
  } catch (error: any) {
    console.error('Bucket error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
