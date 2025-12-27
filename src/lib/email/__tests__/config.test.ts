/**
 * Tests for Email Configuration
 */

// Mock Resend before imports
const mockSend = jest.fn();
const mockResend = {
  emails: {
    send: mockSend,
  },
};

jest.mock('resend', () => ({
  Resend: jest.fn(() => mockResend),
}));

describe('Email Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('sendEmail', () => {
    it('should send email successfully with all parameters', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      mockSend.mockResolvedValue({ id: 'email-123' });

      jest.resetModules();
      const { sendEmail } = require('../config');

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 'email-123' });
      expect(mockSend).toHaveBeenCalledWith({
        from: 'UI-JSON <onboarding@uijson.com>',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        replyTo: 'support@uijson.com',
      });
    });

    it('should use custom from and replyTo if provided', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      mockSend.mockResolvedValue({ id: 'email-456' });

      jest.resetModules();
      const { sendEmail } = require('../config');

      await sendEmail({
        to: 'user@example.com',
        subject: 'Custom Email',
        html: '<p>Content</p>',
        from: 'Custom <custom@example.com>',
        replyTo: 'reply@example.com',
      });

      expect(mockSend).toHaveBeenCalledWith({
        from: 'Custom <custom@example.com>',
        to: 'user@example.com',
        subject: 'Custom Email',
        html: '<p>Content</p>',
        replyTo: 'reply@example.com',
      });
    });

    it('should log success message', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      mockSend.mockResolvedValue({ id: 'email-123' });

      jest.resetModules();
      const { sendEmail } = require('../config');

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Email sent to test@example.com: Test')
      );

      consoleLogSpy.mockRestore();
    });

    it('should handle API errors gracefully', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      const error = new Error('API Error');
      mockSend.mockRejectedValue(error);

      jest.resetModules();
      const { sendEmail } = require('../config');

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to send email:',
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it('should warn when API key is not configured', async () => {
      process.env.RESEND_API_KEY = '';

      jest.resetModules();
      const { sendEmail } = require('../config');

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email not configured');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('RESEND_API_KEY not configured')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Would send email to: test@example.com'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('Subject: Test');
      expect(mockSend).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should send email with default from address', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      mockSend.mockResolvedValue({ id: 'email-123' });

      jest.resetModules();
      const { sendEmail, EMAIL_FROM } = require('../config');

      await sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: EMAIL_FROM,
        })
      );
    });

    it('should send email with default replyTo address', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      mockSend.mockResolvedValue({ id: 'email-123' });

      jest.resetModules();
      const { sendEmail, EMAIL_REPLY_TO } = require('../config');

      await sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: EMAIL_REPLY_TO,
        })
      );
    });

    it('should handle multiple recipients', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      mockSend.mockResolvedValue({ id: 'email-123' });

      jest.resetModules();
      const { sendEmail } = require('../config');

      await sendEmail({
        to: 'user1@example.com,user2@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user1@example.com,user2@example.com',
        })
      );
    });

    it('should handle HTML with special characters', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      mockSend.mockResolvedValue({ id: 'email-123' });

      jest.resetModules();
      const { sendEmail } = require('../config');

      const htmlContent = '<p>Special: &lt; &gt; &amp; "quotes" \'apostrophe\'</p>';

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: htmlContent,
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: htmlContent,
        })
      );
    });

    it('should handle long subjects', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      mockSend.mockResolvedValue({ id: 'email-123' });

      jest.resetModules();
      const { sendEmail } = require('../config');

      const longSubject = 'A'.repeat(200);

      await sendEmail({
        to: 'test@example.com',
        subject: longSubject,
        html: '<p>Test</p>',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: longSubject,
        })
      );
    });

    it('should return Resend response data on success', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      const responseData = {
        id: 'email-789',
        from: 'UI-JSON <onboarding@uijson.com>',
        to: 'test@example.com',
        created_at: '2025-01-01T00:00:00.000Z',
      };
      mockSend.mockResolvedValue(responseData);

      jest.resetModules();
      const { sendEmail } = require('../config');

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(responseData);
    });
  });

  describe('Constants', () => {
    it('should export EMAIL_FROM constant', () => {
      jest.resetModules();
      const { EMAIL_FROM } = require('../config');

      expect(EMAIL_FROM).toBe('UI-JSON <onboarding@uijson.com>');
    });

    it('should export EMAIL_REPLY_TO constant', () => {
      jest.resetModules();
      const { EMAIL_REPLY_TO } = require('../config');

      expect(EMAIL_REPLY_TO).toBe('support@uijson.com');
    });
  });

  describe('Resend Integration', () => {
    it('should initialize Resend with API key', () => {
      process.env.RESEND_API_KEY = 'test-key-123';

      jest.resetModules();
      const { Resend } = require('resend');

      require('../config');

      expect(Resend).toHaveBeenCalledWith('test-key-123');
    });

    it('should initialize Resend with undefined when no API key', () => {
      delete process.env.RESEND_API_KEY;

      jest.resetModules();
      const { Resend } = require('resend');

      require('../config');

      expect(Resend).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty HTML content', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      mockSend.mockResolvedValue({ id: 'email-123' });

      jest.resetModules();
      const { sendEmail } = require('../config');

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Empty',
        html: '',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '',
        })
      );
    });

    it('should handle special characters in email addresses', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      mockSend.mockResolvedValue({ id: 'email-123' });

      jest.resetModules();
      const { sendEmail } = require('../config');

      await sendEmail({
        to: 'user+tag@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user+tag@example.com',
        })
      );
    });

    it('should handle Unicode characters in subject', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      mockSend.mockResolvedValue({ id: 'email-123' });

      jest.resetModules();
      const { sendEmail } = require('../config');

      await sendEmail({
        to: 'test@example.com',
        subject: 'Olá! 你好 🎉',
        html: '<p>Test</p>',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Olá! 你好 🎉',
        })
      );
    });

    it('should handle network timeout errors', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockSend.mockRejectedValue(timeoutError);

      jest.resetModules();
      const { sendEmail } = require('../config');

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(timeoutError);
    });
  });
});
