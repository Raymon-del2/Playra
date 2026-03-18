import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Auth check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // First, get the post to check ownership and get image URLs
    const { data: post, error: fetchError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check ownership
    if (post.channel_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete images from storage if it's an image post
    if (post.post_type === 'image' && post.content?.images) {
      const images = post.content.images;
      for (const imageUrl of images) {
        try {
          const url = new URL(imageUrl);
          const pathParts = url.pathname.split('/');
          const bucketIndex = pathParts.indexOf('posts');
          
          if (bucketIndex !== -1) {
            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            await supabase.storage.from('posts').remove([filePath]);
          }
        } catch (e) {
          console.error('Failed to delete image:', e);
        }
      }
    }

    // Delete the post
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('id', params.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Delete post error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
