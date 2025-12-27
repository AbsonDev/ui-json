import { GET, HEAD } from '../route';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return healthy status when all checks pass', async () => {
      // Mock successful database query
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.checks.database.status).toBe('healthy');
      expect(data.checks.memory.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(data.uptime).toBeGreaterThan(0);
      expect(data.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy status when database check fails', async () => {
      // Mock database error
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.checks.database.status).toBe('unhealthy');
      expect(data.checks.database.error).toBe('Database connection failed');
    });

    it('should include database response time', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const response = await GET();
      const data = await response.json();

      expect(data.checks.database.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should include memory usage information', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const response = await GET();
      const data = await response.json();

      expect(data.checks.memory.usage).toBeDefined();
      expect(data.checks.memory.usage.heapUsed).toBeGreaterThan(0);
      expect(data.checks.memory.usage.heapTotal).toBeGreaterThan(0);
      expect(data.checks.memory.heapUsedPercentage).toBeGreaterThanOrEqual(0);
      expect(data.checks.memory.heapUsedPercentage).toBeLessThanOrEqual(100);
    });

    it('should include correct environment information', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const response = await GET();
      const data = await response.json();

      expect(data.environment).toBeDefined();
      expect(data.version).toBeDefined();
    });

    it('should set no-cache headers', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const response = await GET();

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });
  });

  describe('HEAD', () => {
    it('should return 200 when database is healthy', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const response = await HEAD();

      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
    });

    it('should return 503 when database is unhealthy', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await HEAD();

      expect(response.status).toBe(503);
      expect(response.body).toBeNull();
    });
  });
});
