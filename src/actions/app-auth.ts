'use server';

import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, registerSchema, loginSchema, updateProfileSchema, changePasswordSchema, sanitizeMetadata } from '@/lib/app-auth';
import { generateToken, verifyToken, getExpirationDate } from '@/lib/jwt';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  AppUserResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '@/types';

// ============================================
// Helper Functions
// ============================================

function formatAppUserResponse(user: any): AppUserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
    avatar: user.avatar || undefined,
    emailVerified: user.emailVerified,
    metadata: user.metadata as Record<string, any> || undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
  };
}

async function verifyAppOwnership(appId: string): Promise<boolean> {
  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: { id: true },
  });

  return !!app;
}

// ============================================
// Authentication Actions
// ============================================

/**
 * Register new app user
 */
export async function registerAppUser(appId: string, data: RegisterRequest): Promise<AuthResponse> {
  try {
    // Verify app exists
    const appExists = await verifyAppOwnership(appId);
    if (!appExists) {
      return { success: false, error: 'App not found' };
    }

    // Validate input
    const validated = registerSchema.parse(data);

    // Check if user already exists
    const existingUser = await prisma.appUser.findUnique({
      where: {
        appId_email: {
          appId,
          email: validated.email.toLowerCase(),
        },
      },
    });

    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }

    // Hash password
    const passwordHash = await hashPassword(validated.password);

    // Sanitize metadata
    const metadata = validated.metadata ? sanitizeMetadata(validated.metadata) : undefined;

    // Create user
    const user = await prisma.appUser.create({
      data: {
        appId,
        email: validated.email.toLowerCase(),
        passwordHash,
        name: validated.name,
        metadata: metadata as any,
        emailVerified: false,
      },
    });

    // Create session
    const expiresAt = getExpirationDate('7d');
    const session = await prisma.appSession.create({
      data: {
        appUserId: user.id,
        token: '', // Will be updated after generating JWT
        expiresAt,
      },
    });

    // Generate JWT
    const token = await generateToken({
      userId: user.id,
      appId: user.appId,
      email: user.email,
      sessionId: session.id,
    });

    // Update session with token
    await prisma.appSession.update({
      where: { id: session.id },
      data: { token },
    });

    return {
      success: true,
      user: formatAppUserResponse(user),
      token,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error: any) {
    console.error('Error registering app user:', error);

    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation error: ' + error.errors.map((e: any) => e.message).join(', '),
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to register user',
    };
  }
}

/**
 * Login app user
 */
export async function loginAppUser(appId: string, data: LoginRequest): Promise<AuthResponse> {
  try {
    // Verify app exists
    const appExists = await verifyAppOwnership(appId);
    if (!appExists) {
      return { success: false, error: 'App not found' };
    }

    // Validate input
    const validated = loginSchema.parse(data);

    // Find user
    const user = await prisma.appUser.findUnique({
      where: {
        appId_email: {
          appId,
          email: validated.email.toLowerCase(),
        },
      },
    });

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Verify password
    const isPasswordValid = await verifyPassword(validated.password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Update last login
    await prisma.appUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create new session
    const expiresAt = getExpirationDate('7d');
    const session = await prisma.appSession.create({
      data: {
        appUserId: user.id,
        token: '', // Will be updated
        expiresAt,
      },
    });

    // Generate JWT
    const token = await generateToken({
      userId: user.id,
      appId: user.appId,
      email: user.email,
      sessionId: session.id,
    });

    // Update session
    await prisma.appSession.update({
      where: { id: session.id },
      data: { token },
    });

    return {
      success: true,
      user: formatAppUserResponse({ ...user, lastLoginAt: new Date() }),
      token,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error: any) {
    console.error('Error logging in app user:', error);

    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation error: ' + error.errors.map((e: any) => e.message).join(', '),
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to login',
    };
  }
}

/**
 * Get current user from token
 */
export async function getCurrentAppUser(token: string): Promise<{ success: boolean; user?: AppUserResponse; error?: string }> {
  try {
    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return { success: false, error: 'Invalid or expired token' };
    }

    // Check session exists and is valid
    const session = await prisma.appSession.findUnique({
      where: { id: payload.sessionId },
      include: { appUser: true },
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.expiresAt < new Date()) {
      return { success: false, error: 'Session expired' };
    }

    // Update last used
    await prisma.appSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      success: true,
      user: formatAppUserResponse(session.appUser),
    };
  } catch (error: any) {
    console.error('Error getting current app user:', error);
    return {
      success: false,
      error: error.message || 'Failed to get user',
    };
  }
}

/**
 * Logout app user
 */
export async function logoutAppUser(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return { success: false, error: 'Invalid token' };
    }

    // Delete session
    await prisma.appSession.delete({
      where: { id: payload.sessionId },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error logging out app user:', error);
    return {
      success: false,
      error: error.message || 'Failed to logout',
    };
  }
}

/**
 * Update user profile
 */
export async function updateAppUserProfile(
  token: string,
  data: UpdateProfileRequest
): Promise<{ success: boolean; user?: AppUserResponse; error?: string }> {
  try {
    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return { success: false, error: 'Invalid or expired token' };
    }

    // Validate input
    const validated = updateProfileSchema.parse(data);

    // Sanitize metadata
    const metadata = validated.metadata ? sanitizeMetadata(validated.metadata) : undefined;

    // Update user
    const user = await prisma.appUser.update({
      where: { id: payload.userId },
      data: {
        name: validated.name,
        avatar: validated.avatar,
        metadata: metadata as any,
      },
    });

    return {
      success: true,
      user: formatAppUserResponse(user),
    };
  } catch (error: any) {
    console.error('Error updating app user profile:', error);

    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation error: ' + error.errors.map((e: any) => e.message).join(', '),
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to update profile',
    };
  }
}

/**
 * Change password
 */
export async function changeAppUserPassword(
  token: string,
  data: ChangePasswordRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return { success: false, error: 'Invalid or expired token' };
    }

    // Validate input
    const validated = changePasswordSchema.parse(data);

    // Get user
    const user = await prisma.appUser.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(validated.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Hash new password
    const newPasswordHash = await hashPassword(validated.newPassword);

    // Update password
    await prisma.appUser.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all sessions except current
    await prisma.appSession.deleteMany({
      where: {
        appUserId: user.id,
        id: { not: payload.sessionId },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error changing password:', error);

    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation error: ' + error.errors.map((e: any) => e.message).join(', '),
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to change password',
    };
  }
}

/**
 * Delete user account
 */
export async function deleteAppUserAccount(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return { success: false, error: 'Invalid or expired token' };
    }

    // Delete user (cascade will delete sessions)
    await prisma.appUser.delete({
      where: { id: payload.userId },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting app user account:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete account',
    };
  }
}
