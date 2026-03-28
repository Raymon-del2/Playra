import { supabase } from './supabase';

const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions (max 1200px, maintain aspect ratio)
      const maxDim = 1200;
      let { width, height } = img;
      
      if (width > height && width > maxDim) {
        height = (height * maxDim) / width;
        width = maxDim;
      } else if (height > maxDim) {
        width = (width * maxDim) / height;
        height = maxDim;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress as JPEG at 80% quality
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to compress'));
      }, 'image/jpeg', 0.8);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const uploadPostImages = async (files: File[], userId: string) => {
  // Ensure bucket exists first
  try {
    await fetch('/api/ensure-bucket');
  } catch (e) { /* ignore */ }
  
  const uploadPromises = files.map(async (file, index) => {
    // Compress image first
    let fileToUpload: File | Blob = file;
    try {
      const compressed = await compressImage(file);
      fileToUpload = new File([compressed], `image_${index}.jpg`, { type: 'image/jpeg' });
    } catch (e) {
      console.warn('Compression failed, using original:', e);
    }
    
    // Create a unique path: userId/timestamp-filename
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('posts')
      .upload(fileName, fileToUpload);

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
