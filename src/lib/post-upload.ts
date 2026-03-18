import { supabase } from './supabase';

export const uploadPostImages = async (files: File[], userId: string) => {
  const uploadPromises = files.map(async (file) => {
    // Create a unique path: userId/timestamp-filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('posts')
      .upload(fileName, file);

    if (error) throw error;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(fileName);

    return publicUrl;
  });

  return Promise.all(uploadPromises);
};

export const deletePostImage = async (imageUrl: string) => {
  // Extract the path from the URL
  const url = new URL(imageUrl);
  const pathParts = url.pathname.split('/');
  const bucketIndex = pathParts.indexOf('posts');
  
  if (bucketIndex === -1) return;
  
  const filePath = pathParts.slice(bucketIndex + 1).join('/');
  
  const { error } = await supabase.storage
    .from('posts')
    .remove([filePath]);

  if (error) throw error;
};
