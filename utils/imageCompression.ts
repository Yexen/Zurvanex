/**
 * Image compression utilities for handling large images in Supabase
 * Compresses images to fit within size limits while maintaining quality
 */

export interface CompressionResult {
  compressed: string;
  originalSize: number;
  compressedSize: number;
  quality: number;
}

/**
 * Compress an image to fit within the specified size limit
 * @param imageDataUrl - Base64 data URL of the image
 * @param maxSizeBytes - Maximum size in bytes (default: 800KB for Supabase)
 * @param minQuality - Minimum quality to maintain (default: 0.3)
 * @returns Promise<CompressionResult>
 */
export async function compressImage(
  imageDataUrl: string, 
  maxSizeBytes: number = 800 * 1024, // 800KB default
  minQuality: number = 0.3
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Calculate dimensions to maintain aspect ratio
      let { width, height } = img;
      const maxDimension = 1920; // Max width/height
      
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      let quality = 0.9;
      let compressedDataUrl = '';
      
      // Binary search for optimal quality
      while (quality >= minQuality) {
        compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const size = Math.round((compressedDataUrl.length - 22) * 3 / 4); // Estimate base64 size
        
        if (size <= maxSizeBytes) {
          break;
        }
        
        quality -= 0.1;
      }
      
      const originalSize = Math.round((imageDataUrl.length - 22) * 3 / 4);
      const compressedSize = Math.round((compressedDataUrl.length - 22) * 3 / 4);
      
      resolve({
        compressed: compressedDataUrl,
        originalSize,
        compressedSize,
        quality: Math.max(quality, minQuality)
      });
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}

/**
 * Compress multiple images in batch
 * @param images - Array of base64 data URLs
 * @param maxSizeBytes - Maximum size per image
 * @returns Promise<CompressionResult[]>
 */
export async function compressImages(
  images: string[],
  maxSizeBytes: number = 800 * 1024
): Promise<CompressionResult[]> {
  const compressionPromises = images.map(image => 
    compressImage(image, maxSizeBytes)
  );
  
  return Promise.all(compressionPromises);
}

/**
 * Check if images need compression based on total message size
 * @param images - Array of image data URLs
 * @param textContent - Text content of the message
 * @param maxMessageSize - Maximum total message size in bytes
 * @returns boolean
 */
export function needsCompression(
  images: string[],
  textContent: string,
  maxMessageSize: number = 900 * 1024 // 900KB
): boolean {
  const testMessage = {
    content: textContent,
    images,
    timestamp: new Date().toISOString()
  };
  
  const messageSize = new Blob([JSON.stringify(testMessage)]).size;
  return messageSize > maxMessageSize;
}

/**
 * Get estimated size of a base64 image
 * @param dataUrl - Base64 data URL
 * @returns size in bytes
 */
export function getImageSize(dataUrl: string): number {
  // Remove data URL prefix and calculate base64 size
  const base64 = dataUrl.split(',')[1] || dataUrl;
  return Math.round((base64.length * 3) / 4);
}

/**
 * Format size in human readable format
 * @param bytes - Size in bytes
 * @returns formatted string
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}