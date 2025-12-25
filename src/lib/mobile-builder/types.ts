/**
 * Tipos para o sistema de build mobile
 */

export type Platform = 'android' | 'ios';
export type BuildType = 'debug' | 'release';
export type BuildStatus = 'pending' | 'building' | 'success' | 'failed';

export interface ProjectConfig {
  id: string;
  name: string;
  bundleId: string; // ex: com.myapp.myproject
  version: string;
  versionCode: number;
  description?: string;
  author?: string;
  icon?: string;
  splashScreen?: string;
}

export interface BuildRequest {
  projectId: string;
  platform: Platform;
  buildType: BuildType;
  config: ProjectConfig;
}

export interface BuildResult {
  id: string;
  projectId: string;
  platform: Platform;
  buildType: BuildType;
  status: BuildStatus;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ExportOptions {
  includeAssets: boolean;
  minify: boolean;
  signing?: SigningConfig;
}

export interface SigningConfig {
  // Android
  keystorePath?: string;
  keystorePassword?: string;
  keyAlias?: string;
  keyPassword?: string;

  // iOS
  developmentTeam?: string;
  provisioningProfile?: string;
  certificate?: string;
}
