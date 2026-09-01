import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface ImageUploadProgress {
  progress: number;
  state: 'idle' | 'running' | 'paused' | 'success' | 'error';
  downloadUrl?: string;
  error?: string;
}

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * Validates the image file before processing
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload a valid image (JPEG, PNG, WebP, GIF, or AVIF).',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb}MB). Maximum allowed image size is 8MB.`,
    };
  }

  return { valid: true };
}

/**
 * Compresses/resizes large images on a canvas to optimize for web and reduce Firebase storage costs
 */
export async function optimizeImage(
  file: File,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.85
): Promise<Blob> {
  // If file is GIF or animated, return as-is to preserve frames
  if (file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Calculate aspect ratio preserving resize
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file); // Fallback to raw file if canvas fails
        return;
      }

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP if supported, fallback to JPEG
      const outputType = 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(blob);
          } else {
            // If optimization didn't reduce size, keep original
            resolve(file);
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fallback to raw file
    };

    img.src = url;
  });
}

/**
 * Uploads an image to Firebase Storage and returns the public download URL.
 * NEVER converts or returns base64.
 */
export function uploadStoryCover(
  file: File,
  storySlugOrProgress?: string | ((progress: number) => void),
  onProgressCallback?: (progress: number) => void
): Promise<string> {
  const storySlug = typeof storySlugOrProgress === 'string' ? storySlugOrProgress : 'cover';
  const onProgress = typeof storySlugOrProgress === 'function' ? storySlugOrProgress : onProgressCallback;

  return new Promise(async (resolve, reject) => {
    // 1. Validate
    const validation = validateImageFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error || 'Invalid image file.'));
      return;
    }

    try {
      // 2. Client-side optimization
      const optimizedBlob = await optimizeImage(file);

      // 3. Generate clean storage path
      const cleanSlug = (storySlug || 'story')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);

      const timestamp = Date.now();
      const ext = optimizedBlob.type === 'image/webp' ? 'webp' : file.name.split('.').pop() || 'jpg';
      const storagePath = `covers/${cleanSlug}-${timestamp}.${ext}`;
      const coverRef = ref(storage, storagePath);

      const metadata = {
        contentType: optimizedBlob.type || file.type || 'image/jpeg',
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      };

      // 4. Resumable upload with progress tracking
      const uploadTask = uploadBytesResumable(coverRef, optimizedBlob, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Firebase Storage upload failed:', error);
          reject(
            new Error(
              `Image upload failed: ${error.message || 'Check storage permissions and network connection.'}`
            )
          );
        },
        async () => {
          try {
            // 5. Retrieve public download URL
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) {
              onProgress(100);
            }
            resolve(downloadUrl);
          } catch (err: any) {
            reject(new Error(`Failed to retrieve image download URL: ${err.message}`));
          }
        }
      );
    } catch (err: any) {
      reject(new Error(`Image preparation error: ${err.message}`));
    }
  });
}

/**
 * Removes an old image from Firebase Storage if it's a valid Firebase Storage URL
 */
export async function deleteImageFromStorage(imageUrl?: string): Promise<void> {
  if (!imageUrl) return;

  // Verify URL belongs to Firebase Storage
  const isFirebaseStorage =
    imageUrl.includes('firebasestorage.googleapis.com') ||
    imageUrl.includes('firebasestorage.app');

  if (!isFirebaseStorage) {
    return;
  }

  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    console.log('Successfully cleaned up old storage image:', imageUrl);
  } catch (error: any) {
    // If image doesn't exist or already deleted, don't break operation
    if (error?.code !== 'storage/object-not-found') {
      console.warn('Non-fatal error deleting storage object:', error.message);
    }
  }
}
