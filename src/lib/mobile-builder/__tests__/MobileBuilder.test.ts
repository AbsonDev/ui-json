/**
 * @jest-environment node
 */

// Mock modules BEFORE importing anything else
jest.mock('fs/promises');
jest.mock('child_process');

import { MobileBuilder } from '@/lib/mobile-builder/MobileBuilder';
import type { BuildRequest, ProjectConfig } from '@/lib/mobile-builder/types';
import fs from 'fs/promises';
import { exec } from 'child_process';

const mockMkdir = jest.mocked(fs.mkdir);
const mockWriteFile = jest.mocked(fs.writeFile);
const mockCopyFile = jest.mocked(fs.copyFile);
const mockReadFile = jest.mocked(fs.readFile);
const mockRm = jest.mocked(fs.rm);
const mockAccess = jest.mocked(fs.access);
const mockExec = jest.mocked(exec);

describe('MobileBuilder', () => {
  let mobileBuilder: MobileBuilder;
  let mockProjectConfig: ProjectConfig;
  let mockBuildRequest: BuildRequest;

  beforeEach(() => {
    mobileBuilder = new MobileBuilder();

    mockProjectConfig = {
      id: 'test-project-123',
      name: 'Test App',
      bundleId: 'com.test.app',
      version: '1.0.0',
      versionCode: 1,
      description: 'Test app description',
    };

    mockBuildRequest = {
      projectId: 'test-project-123',
      platform: 'android',
      buildType: 'debug',
      config: mockProjectConfig,
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should create necessary directories', async () => {
      mockMkdir.mockResolvedValue(undefined);

      await mobileBuilder.initialize();

      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('builds'),
        { recursive: true }
      );
      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('templates/mobile'),
        { recursive: true }
      );
    });

    it('should handle errors when creating directories', async () => {
      mockMkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(mobileBuilder.initialize()).rejects.toThrow('Permission denied');
    });
  });

  describe('generateHTML', () => {
    it('should generate valid HTML with project config', () => {
      const html = (mobileBuilder as any).generateHTML(mockProjectConfig);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain(`<title>${mockProjectConfig.name}</title>`);
      expect(html).toContain(`<h1>${mockProjectConfig.name}</h1>`);
      expect(html).toContain(`Version ${mockProjectConfig.version}`);
      expect(html).toContain('viewport-fit=cover');
    });

    it('should include description in meta tag', () => {
      const html = (mobileBuilder as any).generateHTML(mockProjectConfig);

      expect(html).toContain(`content="${mockProjectConfig.description}"`);
    });

    it('should handle missing description', () => {
      const configWithoutDesc = { ...mockProjectConfig, description: undefined };
      const html = (mobileBuilder as any).generateHTML(configWithoutDesc);

      expect(html).toContain('content=""');
    });
  });

  describe('generateCSS', () => {
    it('should generate valid CSS', () => {
      const css = (mobileBuilder as any).generateCSS(mockProjectConfig);

      expect(css).toContain('box-sizing: border-box');
      expect(css).toContain('font-family:');
      expect(css).toContain('#app {');
      expect(css).toContain('max-width:');
    });
  });

  describe('generateJS', () => {
    it('should generate JavaScript with project info', () => {
      const js = (mobileBuilder as any).generateJS(mockProjectConfig);

      expect(js).toContain(`// ${mockProjectConfig.name}`);
      expect(js).toContain(`v${mockProjectConfig.version}`);
      expect(js).toContain('DOMContentLoaded');
      expect(js).toContain(`App initialized: ${mockProjectConfig.name}`);
    });
  });

  describe('generateBuildId', () => {
    it('should generate unique build IDs', () => {
      const id1 = (mobileBuilder as any).generateBuildId();
      const id2 = (mobileBuilder as any).generateBuildId();

      expect(id1).toMatch(/^build-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^build-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should include timestamp in build ID', () => {
      const beforeTime = Date.now();
      const id = (mobileBuilder as any).generateBuildId();
      const afterTime = Date.now();

      const timestamp = parseInt(id.split('-')[1]);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('buildProject', () => {
    beforeEach(() => {
      // Mock file system operations
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockCopyFile.mockResolvedValue(undefined);
    });

    it('should create build result with pending status initially', async () => {
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (callback) callback(null, '', '');
        return {} as any;
      });

      const result = await mobileBuilder.buildProject(mockBuildRequest);

      expect(result.projectId).toBe(mockBuildRequest.projectId);
      expect(result.platform).toBe(mockBuildRequest.platform);
      expect(result.buildType).toBe(mockBuildRequest.buildType);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('createdAt');
    });

    it('should handle Android debug build', async () => {
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (callback) callback(null, 'Build successful', '');
        return {} as any;
      });

      const result = await mobileBuilder.buildProject({
        ...mockBuildRequest,
        platform: 'android',
        buildType: 'debug',
      });

      expect(result.platform).toBe('android');
      expect(result.buildType).toBe('debug');
    });

    it('should handle build errors', async () => {
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (callback) callback(new Error('Build failed'), '', 'Error output');
        return {} as any;
      });

      const result = await mobileBuilder.buildProject(mockBuildRequest);

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    it('should set completed timestamp on success', async () => {
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (callback) callback(null, 'Success', '');
        return {} as any;
      });

      const beforeTime = new Date();
      const result = await mobileBuilder.buildProject(mockBuildRequest);
      const afterTime = new Date();

      if (result.completedAt) {
        expect(new Date(result.completedAt).getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(new Date(result.completedAt).getTime()).toBeLessThanOrEqual(afterTime.getTime());
      }
    });
  });

  describe('createCapacitorProject', () => {
    it('should create capacitor.config.json', async () => {
      mockWriteFile.mockResolvedValue(undefined);

      await (mobileBuilder as any).createCapacitorProject('/test/path', mockProjectConfig);

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('capacitor.config.json'),
        expect.stringContaining(mockProjectConfig.bundleId)
      );
    });

    it('should create package.json with correct dependencies', async () => {
      mockWriteFile.mockResolvedValue(undefined);

      await (mobileBuilder as any).createCapacitorProject('/test/path', mockProjectConfig);

      const packageJsonCall = (mockWriteFile as jest.Mock).mock.calls.find(
        call => call[0].includes('package.json')
      );

      expect(packageJsonCall).toBeDefined();
      const packageJson = JSON.parse(packageJsonCall[1]);
      expect(packageJson.dependencies).toHaveProperty('@capacitor/core');
      expect(packageJson.dependencies).toHaveProperty('@capacitor/android');
      expect(packageJson.dependencies).toHaveProperty('@capacitor/ios');
    });

    it('should use correct app name and bundle ID', async () => {
      mockWriteFile.mockResolvedValue(undefined);

      await (mobileBuilder as any).createCapacitorProject('/test/path', mockProjectConfig);

      const configCall = (mockWriteFile as jest.Mock).mock.calls.find(
        call => call[0].includes('capacitor.config.json')
      );

      const config = JSON.parse(configCall[1]);
      expect(config.appId).toBe(mockProjectConfig.bundleId);
      expect(config.appName).toBe(mockProjectConfig.name);
    });
  });

  describe('Platform-specific builds', () => {
    describe('buildAndroid', () => {
      it('should call gradlew bundleDebug for debug builds', async () => {
        mockExec.mockImplementation((cmd, opts, callback) => {
          if (callback) callback(null, 'Success', '');
          return {} as any;
        });

        await (mobileBuilder as any).buildAndroid('/test/path', 'debug');

        expect(mockExec).toHaveBeenCalledWith(
          expect.stringContaining('bundleDebug'),
          expect.any(Object),
          expect.any(Function)
        );
      });

      it('should call gradlew bundleRelease for release builds', async () => {
        mockExec.mockImplementation((cmd, opts, callback) => {
          if (callback) callback(null, 'Success', '');
          return {} as any;
        });

        await (mobileBuilder as any).buildAndroid('/test/path', 'release');

        expect(mockExec).toHaveBeenCalledWith(
          expect.stringContaining('bundleRelease'),
          expect.any(Object),
          expect.any(Function)
        );
      });

      it('should configure signing for release builds', async () => {
        const signing = {
          keystorePath: 'test.keystore',
          keystorePassword: 'password',
          keyAlias: 'test-key',
          keyPassword: 'keypass',
        };

        mockWriteFile.mockResolvedValue(undefined);
        mockExec.mockImplementation((cmd, opts, callback) => {
          if (callback) callback(null, 'Success', '');
          return {} as any;
        });

        await (mobileBuilder as any).buildAndroid('/test/path', 'release', signing);

        expect(mockWriteFile).toHaveBeenCalledWith(
          expect.stringContaining('gradle.properties'),
          expect.stringContaining('RELEASE_STORE_FILE')
        );
      });
    });

    describe('buildIOS', () => {
      it('should throw error indicating macOS requirement', async () => {
        await expect(
          (mobileBuilder as any).buildIOS('/test/path', 'release', {})
        ).rejects.toThrow('iOS build requires macOS');
      });
    });
  });

  describe('generateProjectFiles', () => {
    it('should create www directory', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await (mobileBuilder as any).generateProjectFiles(mockProjectConfig, '/test/path');

      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('www'),
        { recursive: true }
      );
    });

    it('should write HTML, CSS, and JS files', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await (mobileBuilder as any).generateProjectFiles(mockProjectConfig, '/test/path');

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('index.html'),
        expect.any(String)
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('styles.css'),
        expect.any(String)
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('app.js'),
        expect.any(String)
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle missing optional config fields', async () => {
      const minimalConfig: ProjectConfig = {
        id: 'test',
        name: 'Test',
        bundleId: 'com.test',
        version: '1.0.0',
        versionCode: 1,
      };

      const html = (mobileBuilder as any).generateHTML(minimalConfig);
      expect(html).toBeDefined();
      expect(html).toContain('Test');
    });

    it('should handle very long project names', () => {
      const longNameConfig = {
        ...mockProjectConfig,
        name: 'A'.repeat(200),
      };

      const html = (mobileBuilder as any).generateHTML(longNameConfig);
      expect(html).toContain('A'.repeat(200));
    });

    it('should handle special characters in bundle ID', () => {
      const specialConfig = {
        ...mockProjectConfig,
        bundleId: 'com.test-app.my_app',
      };

      const result = (mobileBuilder as any).generateBuildId();
      expect(result).toBeDefined();
    });
  });
});
