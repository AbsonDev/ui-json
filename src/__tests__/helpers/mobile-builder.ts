/**
 * Test helpers para Mobile Builder
 */

import type { BuildRequest, BuildResult, ProjectConfig } from '@/lib/mobile-builder/types';

export const mockProjectConfig = (overrides?: Partial<ProjectConfig>): ProjectConfig => ({
  id: 'test-project-123',
  name: 'Test App',
  bundleId: 'com.test.app',
  version: '1.0.0',
  versionCode: 1,
  description: 'Test app description',
  ...overrides,
});

export const mockBuildRequest = (overrides?: Partial<BuildRequest>): BuildRequest => ({
  projectId: 'test-project-123',
  platform: 'android',
  buildType: 'debug',
  config: mockProjectConfig(),
  ...overrides,
});

export const mockBuildResult = (overrides?: Partial<BuildResult>): BuildResult => ({
  id: 'build-123',
  projectId: 'test-project-123',
  platform: 'android',
  buildType: 'debug',
  status: 'success',
  downloadUrl: '/api/builds/build-123/download',
  createdAt: new Date('2024-01-15T10:00:00Z'),
  completedAt: new Date('2024-01-15T10:05:00Z'),
  ...overrides,
});

export const mockBuild = (overrides?: any) => ({
  id: 'build-1',
  appId: 'test-app-123',
  platform: 'android',
  buildType: 'debug',
  status: 'success',
  bundleId: 'com.test.app',
  appVersion: '1.0.0',
  versionCode: 1,
  appName: 'Test App',
  downloadUrl: '/api/builds/build-1/download',
  fileSize: 5242880,
  fileName: 'app-debug.aab',
  buildDuration: 125,
  completedAt: '2024-01-15T10:30:00.000Z',
  createdAt: '2024-01-15T10:28:00.000Z',
  updatedAt: '2024-01-15T10:30:00.000Z',
  ...overrides,
});

export const mockBuilds = {
  success: mockBuild(),
  failed: mockBuild({
    id: 'build-2',
    status: 'failed',
    error: 'Build failed',
    downloadUrl: null,
    fileSize: null,
    fileName: null,
    completedAt: '2024-01-15T11:00:00.000Z',
  }),
  building: mockBuild({
    id: 'build-3',
    status: 'building',
    downloadUrl: null,
    completedAt: null,
  }),
  pending: mockBuild({
    id: 'build-4',
    status: 'pending',
    downloadUrl: null,
    completedAt: null,
    buildDuration: null,
  }),
};

export const mockFetchSuccess = (data: any) => {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  });
};

export const mockFetchError = (error: string) => {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error }),
  });
};

export const mockFetchNetworkError = () => {
  global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));
};

export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));
