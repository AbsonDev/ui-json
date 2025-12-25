/**
 * @jest-environment node
 */

import { POST, GET } from '../route';
import { NextRequest } from 'next/server';
import { mobileBuilder } from '@/lib/mobile-builder/MobileBuilder';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/mobile-builder/MobileBuilder');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    build: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockedMobileBuilder = mobileBuilder as jest.Mocked<typeof mobileBuilder>;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('POST /api/projects/[id]/export', () => {
  let mockRequest: NextRequest;
  const mockParams = { params: { id: 'test-project-123' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation', () => {
    it('should reject invalid platform', async () => {
      mockRequest = new NextRequest('http://localhost/api/projects/123/export', {
        method: 'POST',
        body: JSON.stringify({
          platform: 'invalid',
          buildType: 'debug',
          config: { name: 'Test', bundleId: 'com.test' },
        }),
      });

      const response = await POST(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid platform');
    });

    it('should reject invalid build type', async () => {
      mockRequest = new NextRequest('http://localhost/api/projects/123/export', {
        method: 'POST',
        body: JSON.stringify({
          platform: 'android',
          buildType: 'invalid',
          config: { name: 'Test', bundleId: 'com.test' },
        }),
      });

      const response = await POST(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid build type');
    });

    it('should reject missing config', async () => {
      mockRequest = new NextRequest('http://localhost/api/projects/123/export', {
        method: 'POST',
        body: JSON.stringify({
          platform: 'android',
          buildType: 'debug',
        }),
      });

      const response = await POST(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid project config');
    });

    it('should reject config without name', async () => {
      mockRequest = new NextRequest('http://localhost/api/projects/123/export', {
        method: 'POST',
        body: JSON.stringify({
          platform: 'android',
          buildType: 'debug',
          config: { bundleId: 'com.test' },
        }),
      });

      const response = await POST(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Required: name, bundleId');
    });

    it('should reject config without bundleId', async () => {
      mockRequest = new NextRequest('http://localhost/api/projects/123/export', {
        method: 'POST',
        body: JSON.stringify({
          platform: 'android',
          buildType: 'debug',
          config: { name: 'Test' },
        }),
      });

      const response = await POST(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Required: name, bundleId');
    });
  });

  describe('Successful builds', () => {
    const validRequestBody = {
      platform: 'android',
      buildType: 'debug',
      config: {
        name: 'Test App',
        bundleId: 'com.test.app',
        version: '1.0.0',
        versionCode: 1,
        description: 'Test app',
      },
    };

    beforeEach(() => {
      (mockedPrisma.build.create as jest.Mock).mockResolvedValue({
        id: 'build-123',
        appId: 'test-project-123',
        platform: 'android',
        buildType: 'debug',
        status: 'pending',
        bundleId: 'com.test.app',
        appVersion: '1.0.0',
        versionCode: 1,
        appName: 'Test App',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (mockedPrisma.build.update as jest.Mock).mockResolvedValue({});

      (mockedMobileBuilder.initialize as jest.Mock).mockResolvedValue(undefined);
      (mockedMobileBuilder.buildProject as jest.Mock).mockResolvedValue({
        id: 'result-123',
        projectId: 'test-project-123',
        platform: 'android',
        buildType: 'debug',
        status: 'success',
        downloadUrl: '/api/builds/result-123/download',
        createdAt: new Date(),
        completedAt: new Date(),
      });
    });

    it('should create build record in database', async () => {
      mockRequest = new NextRequest('http://localhost/api/projects/123/export', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      await POST(mockRequest, mockParams);

      expect(mockedPrisma.build.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          appId: 'test-project-123',
          platform: 'android',
          buildType: 'debug',
          status: 'pending',
          bundleId: 'com.test.app',
          appVersion: '1.0.0',
          versionCode: 1,
          appName: 'Test App',
        }),
      });
    });

    it('should initialize mobile builder', async () => {
      mockRequest = new NextRequest('http://localhost/api/projects/123/export', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      await POST(mockRequest, mockParams);

      expect(mockedMobileBuilder.initialize).toHaveBeenCalled();
    });

    it('should update build status to building', async () => {
      mockRequest = new NextRequest('http://localhost/api/projects/123/export', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      await POST(mockRequest, mockParams);

      expect(mockedPrisma.build.update).toHaveBeenCalledWith({
        where: { id: 'build-123' },
        data: { status: 'building' },
      });
    });

    it('should call buildProject with correct config', async () => {
      mockRequest = new NextRequest('http://localhost/api/projects/123/export', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      await POST(mockRequest, mockParams);

      expect(mockedMobileBuilder.buildProject).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'test-project-123',
          platform: 'android',
          buildType: 'debug',
          config: expect.objectContaining({
            name: 'Test App',
            bundleId: 'com.test.app',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should update build with success result', async () => {
      mockRequest = new NextRequest('http://localhost/api/projects/123/export', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      await POST(mockRequest, mockParams);

      const updateCalls = (mockedPrisma.build.update as jest.Mock).mock.calls;
      const finalUpdate = updateCalls[updateCalls.length - 1];

      expect(finalUpdate[0].data).toMatchObject({
        status: 'success',
        downloadUrl: expect.any(String),
        buildDuration: expect.any(Number),
      });
    });

    it('should return build result with buildId', async () => {
      mockRequest = new NextRequest('http://localhost/api/projects/123/export', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.buildId).toBe('build-123');
      expect(data.status).toBe('success');
      expect(data.downloadUrl).toBeDefined();
    });

    it('should use default version if not provided', async () => {
      const requestWithoutVersion = {
        ...validRequestBody,
        config: {
          name: 'Test',
          bundleId: 'com.test',
        },
      };

      mockRequest = new NextRequest('http://localhost/api/projects/123/export', {
        method: 'POST',
        body: JSON.stringify(requestWithoutVersion),
      });

      await POST(mockRequest, mockParams);

      expect(mockedPrisma.build.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          appVersion: '1.0.0',
          versionCode: 1,
        }),
      });
    });
  });

  describe('Failed builds', () => {
    const validRequestBody = {
      platform: 'android',
      buildType: 'debug',
      config: {
        name: 'Test App',
        bundleId: 'com.test.app',
      },
    };

    beforeEach(() => {
      (mockedPrisma.build.create as jest.Mock).mockResolvedValue({
        id: 'build-123',
        appId: 'test-project-123',
        platform: 'android',
        buildType: 'debug',
        status: 'pending',
        bundleId: 'com.test.app',
        appVersion: '1.0.0',
        versionCode: 1,
        appName: 'Test App',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (mockedPrisma.build.update as jest.Mock).mockResolvedValue({});
      (mockedMobileBuilder.initialize as jest.Mock).mockResolvedValue(undefined);
    });

    it('should handle build failure and update database', async () => {
      (mockedMobileBuilder.buildProject as jest.Mock).mockRejectedValue(
        new Error('Build failed: Gradle error')
      );

      mockRequest = new NextRequest('http://localhost/api/projects/123/export', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(mockRequest, mockParams);

      expect(mockedPrisma.build.update).toHaveBeenCalledWith({
        where: { id: 'build-123' },
        data: expect.objectContaining({
          status: 'failed',
          error: 'Build failed: Gradle error',
          completedAt: expect.any(Date),
        }),
      });

      expect(response.status).toBe(500);
    });

    it('should handle unknown errors', async () => {
      (mockedMobileBuilder.buildProject as jest.Mock).mockRejectedValue('Unknown error');

      mockRequest = new NextRequest('http://localhost/api/projects/123/export', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      await POST(mockRequest, mockParams);

      expect(mockedPrisma.build.update).toHaveBeenCalledWith({
        where: { id: 'build-123' },
        data: expect.objectContaining({
          status: 'failed',
          error: 'Build failed',
        }),
      });
    });
  });
});

describe('GET /api/projects/[id]/export', () => {
  const mockParams = { params: { id: 'test-project-123' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of builds for project', async () => {
    const mockBuilds = [
      {
        id: 'build-1',
        appId: 'test-project-123',
        platform: 'android',
        buildType: 'debug',
        status: 'success',
        bundleId: 'com.test',
        appVersion: '1.0.0',
        versionCode: 1,
        appName: 'Test',
        downloadUrl: '/download/1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'build-2',
        appId: 'test-project-123',
        platform: 'ios',
        buildType: 'release',
        status: 'failed',
        bundleId: 'com.test',
        appVersion: '1.0.1',
        versionCode: 2,
        appName: 'Test',
        error: 'Build error',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ];

    (mockedPrisma.build.findMany as jest.Mock).mockResolvedValue(mockBuilds);

    const mockRequest = new NextRequest('http://localhost/api/projects/123/export');
    const response = await GET(mockRequest, mockParams);
    const data = await response.json();

    expect(mockedPrisma.build.findMany).toHaveBeenCalledWith({
      where: { appId: 'test-project-123' },
      orderBy: { createdAt: 'desc' },
    });

    expect(response.status).toBe(200);
    expect(data.builds).toHaveLength(2);
    expect(data.builds[0].id).toBe('build-1');
    expect(data.builds[1].id).toBe('build-2');
  });

  it('should return empty array when no builds exist', async () => {
    (mockedPrisma.build.findMany as jest.Mock).mockResolvedValue([]);

    const mockRequest = new NextRequest('http://localhost/api/projects/123/export');
    const response = await GET(mockRequest, mockParams);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.builds).toEqual([]);
  });

  it('should handle database errors', async () => {
    (mockedPrisma.build.findMany as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const mockRequest = new NextRequest('http://localhost/api/projects/123/export');
    const response = await GET(mockRequest, mockParams);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to list builds');
  });

  it('should order builds by creation date descending', async () => {
    (mockedPrisma.build.findMany as jest.Mock).mockResolvedValue([]);

    const mockRequest = new NextRequest('http://localhost/api/projects/123/export');
    await GET(mockRequest, mockParams);

    expect(mockedPrisma.build.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );
  });
});
