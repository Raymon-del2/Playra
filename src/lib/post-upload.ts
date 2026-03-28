import { supabase } from './supabase';

const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions (max 800px for base64, maintain aspect ratio)
      const maxDim = 800;
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
      
      // Draw and compress as JPEG at 70% quality
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read blob'));
          reader.readAsDataURL(blob);
        } else {
          reject(new Error('Failed to compress'));
        }
      }, 'image/jpeg', 0.7);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const uploadPostImages = async (files: File[], userId: string): Promise<string[]> => {
  const base64Promises = files.map(async (file) => {
    try {
      return await compressImage(file);
    } catch (e) {
      console.warn('Compression failed:', e);
      // Fallback: just read as base64 without compression
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(e);
        reader.readAsDataURL(file);
      });
    }
  });

  return Promise.all(base64Promises);
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
