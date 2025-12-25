import { FILE_UPLOAD_CONFIG } from '@/types';
import { randomBytes } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

/**
 * Validate file mime type
 */
export function isValidMimeType(mimeType: string): boolean {
  return FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= FILE_UPLOAD_CONFIG.MAX_FILE_SIZE;
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const randomString = randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${randomString}${ext}`;
}

/**
 * Get file extension from mime type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'video/mp4': '.mp4',
    'video/mpeg': '.mpeg',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'application/zip': '.zip',
    'application/x-zip-compressed': '.zip',
    'application/x-rar-compressed': '.rar',
  };

  return mimeMap[mimeType] || '';
}

/**
 * Check if file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Get storage directory path
 */
export function getStorageDir(): string {
  // Store files in public/uploads directory
  return path.join(process.cwd(), 'public', 'uploads');
}

/**
 * Get file path for a given filename
 */
export function getFilePath(filename: string): string {
  return path.join(getStorageDir(), filename);
}

/**
 * Get public URL for a file
 */
export function getFileUrl(filename: string): string {
  // Return URL relative to public directory
  return `/uploads/${filename}`;
}

/**
 * Ensure storage directory exists
 */
export async function ensureStorageDir(): Promise<void> {
  const dir = getStorageDir();

  if (!existsSync(dir)) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Save file buffer to storage
 */
export async function saveFile(buffer: Buffer, filename: string): Promise<string> {
  await ensureStorageDir();
  const filePath = getFilePath(filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

/**
 * Delete file from storage
 */
export async function deleteFile(filename: string): Promise<void> {
  const filePath = getFilePath(filename);

  if (existsSync(filePath)) {
    await fs.unlink(filePath);
  }
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get mime type category
 */
export function getMimeTypeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'document';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
  return 'other';
}
