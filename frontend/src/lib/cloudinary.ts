/**
 * Cloudinary Upload Utility
 * Handles direct file uploads to Cloudinary from the frontend
 */

// Cloudinary configuration
// You can set these in your .env.local file:
// NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
// NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dyjzlhjej';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'inventory';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  width?: number;
  height?: number;
  url: string;
}

/**
 * Upload a file directly to Cloudinary
 * @param file - The file to upload
 * @param folder - Optional folder name in Cloudinary
 * @param onProgress - Optional progress callback
 * @returns Promise with Cloudinary upload result
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'receipts',
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> {
  // Validate file
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 10MB limit');
  }

  // Validate file type (images and PDFs)
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP) or PDF');
  }

  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    formData.append('resource_type', 'auto'); // Automatically detect resource type

    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

    const xhr = new XMLHttpRequest();
    
    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch (error) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error?.message || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Send request
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(error.message || 'Failed to upload file');
  }
}

/**
 * Delete a file from Cloudinary
 * Note: This requires backend implementation as deletion needs authentication
 * @param publicId - The public ID of the file to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  // This should be implemented on the backend for security
  console.warn('Delete operation should be handled by backend API');
  throw new Error('Delete operation not implemented on frontend');
}

/**
 * Get optimized image URL with transformations
 * @param url - Original Cloudinary URL
 * @param width - Desired width
 * @param height - Desired height
 * @param quality - Image quality (1-100)
 * @returns Transformed URL
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  height?: number,
  quality: number = 80
): string {
  if (!url || !url.includes('cloudinary')) {
    return url;
  }

  try {
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    const transformations: string[] = [];
    
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    transformations.push(`q_${quality}`);
    transformations.push('f_auto'); // Auto format
    
    return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
  } catch (error) {
    console.error('Error optimizing image URL:', error);
    return url;
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Public ID
 */
export function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/v\d+\/(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
}

/**
 * Download a file from a URL
 * Works with Cloudinary URLs and handles CORS
 * @param url - The URL to download from
 * @param filename - The filename to save as
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    // Fetch the file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch file');
    }

    // Convert to blob
    const blob = await response.blob();

    // Create object URL
    const blobUrl = window.URL.createObjectURL(blob);

    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download error:', error);
    // Fallback: open in new tab if download fails
    window.open(url, '_blank');
  }
}
