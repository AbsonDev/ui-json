'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  isValidMimeType,
  isValidFileSize,
  generateUniqueFilename,
  getFileUrl,
  saveFile,
  deleteFile as deleteFileFromStorage,
  isImageFile,
} from '@/lib/file-utils';
import type {
  FileResponse,
  UploadFileResponse,
  ListFilesRequest,
  FileQuota,
  FileQuotaResponse,
} from '@/types';
import { FILE_UPLOAD_CONFIG } from '@/types';

// ============================================
// Helper Functions
// ============================================

function formatFileResponse(file: any): FileResponse {
  return {
    id: file.id,
    originalName: file.originalName,
    filename: file.filename,
    mimeType: file.mimeType,
    size: file.size,
    url: file.url,
    thumbnailUrl: file.thumbnailUrl || undefined,
    width: file.width || undefined,
    height: file.height || undefined,
    isPublic: file.isPublic,
    appUserId: file.appUserId || undefined,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
  };
}

async function verifyAppOwnership(appId: string, userId: string) {
  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: { userId: true },
  });

  if (!app) {
    throw new Error('App not found');
  }

  if (app.userId !== userId) {
    throw new Error('Unauthorized: You do not own this app');
  }

  return app;
}

// ============================================
// Server Actions
// ============================================

/**
 * Upload a file
 */
export async function uploadFile(
  appId: string,
  formData: FormData,
  appUserId?: string
): Promise<UploadFileResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify app ownership
    await verifyAppOwnership(appId, session.user.id);

    // Get file from form data
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate mime type
    if (!isValidMimeType(file.type)) {
      return {
        success: false,
        error: `File type ${file.type} is not allowed. Allowed types: images, documents, audio, video, archives.`,
      };
    }

    // Validate file size
    if (!isValidFileSize(file.size)) {
      return {
        success: false,
        error: `File size ${file.size} bytes exceeds maximum allowed size of ${FILE_UPLOAD_CONFIG.MAX_FILE_SIZE} bytes (10MB).`,
      };
    }

    // Check quota if app user is specified
    if (appUserId) {
      const quota = await getFileQuota(appId, appUserId);
      if (!quota.success || !quota.quota) {
        return { success: false, error: 'Failed to check quota' };
      }

      // Check storage quota
      if (quota.quota.used + file.size > quota.quota.limit) {
        return {
          success: false,
          error: `Storage quota exceeded. Used: ${quota.quota.used} bytes, Limit: ${quota.quota.limit} bytes.`,
        };
      }

      // Check file count quota
      if (quota.quota.count >= quota.quota.countLimit) {
        return {
          success: false,
          error: `File count limit reached. You have ${quota.quota.count} files (max: ${quota.quota.countLimit}).`,
        };
      }
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save file to storage
    const filePath = await saveFile(buffer, filename);
    const url = getFileUrl(filename);

    // Get isPublic from form data
    const isPublic = formData.get('isPublic') === 'true';

    // Get image dimensions if it's an image (simplified - would use sharp in production)
    let width: number | undefined;
    let height: number | undefined;

    // Create file record in database
    const fileRecord = await prisma.file.create({
      data: {
        originalName: file.name,
        filename,
        mimeType: file.type,
        size: file.size,
        path: filePath,
        url,
        isPublic,
        appId,
        appUserId: appUserId || null,
        userId: session.user.id,
        width,
        height,
      },
    });

    return {
      success: true,
      file: formatFileResponse(fileRecord),
    };
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload file',
    };
  }
}

/**
 * Get all files for an app
 */
export async function getFiles(appId: string, query?: ListFilesRequest, appUserId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify app ownership
    await verifyAppOwnership(appId, session.user.id);

    const limit = query?.limit || 50;
    const offset = query?.offset || 0;

    // Build where clause
    const where: any = { appId };

    // Filter by app user if provided
    if (appUserId) {
      where.appUserId = appUserId;
    }

    // Filter by mime type if provided
    if (query?.mimeType) {
      if (query.mimeType.endsWith('/*')) {
        // e.g., "image/*"
        const prefix = query.mimeType.replace('/*', '/');
        where.mimeType = { startsWith: prefix };
      } else {
        where.mimeType = query.mimeType;
      }
    }

    // Get total count
    const total = await prisma.file.count({ where });

    // Get files
    const files = await prisma.file.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      files: files.map(formatFileResponse),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + files.length < total,
      },
    };
  } catch (error: any) {
    console.error('Error getting files:', error);
    return {
      success: false,
      error: error.message || 'Failed to get files',
    };
  }
}

/**
 * Get a single file by ID
 */
export async function getFile(fileId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        app: { select: { userId: true } },
      },
    });

    if (!file) {
      return { success: false, error: 'File not found' };
    }

    // Verify ownership
    if (file.app.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    return {
      success: true,
      file: formatFileResponse(file),
    };
  } catch (error: any) {
    console.error('Error getting file:', error);
    return {
      success: false,
      error: error.message || 'Failed to get file',
    };
  }
}

/**
 * Delete a file
 */
export async function deleteFile(fileId: string, appUserId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        app: { select: { userId: true } },
      },
    });

    if (!file) {
      return { success: false, error: 'File not found' };
    }

    // Verify ownership
    if (file.app.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // If appUserId is provided, verify that the file belongs to this app user
    if (appUserId && file.appUserId !== appUserId) {
      return { success: false, error: 'Unauthorized: You can only delete your own files' };
    }

    // Delete file from storage
    try {
      await deleteFileFromStorage(file.filename);

      // Delete thumbnail if exists
      if (file.thumbnailPath) {
        await deleteFileFromStorage(file.thumbnailPath);
      }
    } catch (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete file from database
    await prisma.file.delete({
      where: { id: fileId },
    });

    return {
      success: true,
      message: 'File deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete file',
    };
  }
}

/**
 * Get file quota for an app user
 */
export async function getFileQuota(appId: string, appUserId: string): Promise<FileQuotaResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify app ownership
    await verifyAppOwnership(appId, session.user.id);

    // Get total size and count of files for this user
    const files = await prisma.file.findMany({
      where: {
        appId,
        appUserId,
      },
      select: {
        size: true,
      },
    });

    const used = files.reduce((sum, file) => sum + file.size, 0);
    const count = files.length;

    const quota: FileQuota = {
      used,
      limit: FILE_UPLOAD_CONFIG.MAX_STORAGE_PER_USER,
      count,
      countLimit: FILE_UPLOAD_CONFIG.MAX_FILES_PER_USER,
    };

    return {
      success: true,
      quota,
    };
  } catch (error: any) {
    console.error('Error getting file quota:', error);
    return {
      success: false,
      error: error.message || 'Failed to get quota',
    };
  }
}
