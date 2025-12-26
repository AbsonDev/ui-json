/**
 * Tests for Payment Email Templates
 */

import {
  getPaymentFailedEmailTemplate,
  getPaymentSuccessEmailTemplate,
  getSubscriptionCanceledEmailTemplate,
} from '../payment-templates';

describe('Payment Email Templates', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXTAUTH_URL: 'https://uijson.com',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getPaymentFailedEmailTemplate', () => {
    it('should generate payment failed email with all details', () => {
      const html = getPaymentFailedEmailTemplate(
        'João Silva',
        'PRO',
        29.0,
        'Insufficient funds'
      );

      expect(html).toContain('João Silva');
      expect(html).toContain('PRO');
      expect(html).toContain('$29.00');
      expect(html).toContain('Insufficient funds');
    });

    it('should include failure warning header', () => {
      const html = getPaymentFailedEmailTemplate('User', 'PRO', 29.0, 'Error');

      expect(html).toContain('Falha no Pagamento');
      expect(html).toContain('⚠️');
    });

    it('should include troubleshooting steps', () => {
      const html = getPaymentFailedEmailTemplate('User', 'PRO', 29.0, 'Error');

      expect(html).toContain('O que fazer agora?');
      expect(html).toContain('fundos suficientes');
      expect(html).toContain('dados do cartão');
      expect(html).toContain('atualize seu método de pagamento');
    });

    it('should include update payment method button', () => {
      const html = getPaymentFailedEmailTemplate('User', 'PRO', 29.0, 'Error');

      expect(html).toContain('Atualizar Método de Pagamento');
      expect(html).toContain('https://uijson.com/settings/billing');
    });

    it('should format amount with 2 decimal places', () => {
      const html = getPaymentFailedEmailTemplate('User', 'PRO', 19.99, 'Error');

      expect(html).toContain('$19.99');
    });

    it('should handle whole number amounts', () => {
      const html = getPaymentFailedEmailTemplate('User', 'PRO', 50, 'Error');

      expect(html).toContain('$50.00');
    });

    it('should include proper HTML structure', () => {
      const html = getPaymentFailedEmailTemplate('User', 'PRO', 29.0, 'Error');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
      expect(html).toContain('charset="utf-8"');
    });

    it('should have responsive viewport meta tag', () => {
      const html = getPaymentFailedEmailTemplate('User', 'PRO', 29.0, 'Error');

      expect(html).toContain('viewport');
      expect(html).toContain('width=device-width');
    });

    it('should include contact support message', () => {
      const html = getPaymentFailedEmailTemplate('User', 'PRO', 29.0, 'Error');

      expect(html).toContain('dúvidas');
      expect(html).toContain('entre em contato');
    });

    it('should include branding', () => {
      const html = getPaymentFailedEmailTemplate('User', 'PRO', 29.0, 'Error');

      expect(html).toContain('UI-JSON Visualizer');
    });

    it('should handle different plan tiers', () => {
      const htmlPro = getPaymentFailedEmailTemplate('User', 'PRO', 29, 'Error');
      const htmlEnterprise = getPaymentFailedEmailTemplate(
        'User',
        'ENTERPRISE',
        99,
        'Error'
      );

      expect(htmlPro).toContain('plano <strong>PRO</strong>');
      expect(htmlEnterprise).toContain('plano <strong>ENTERPRISE</strong>');
    });

    it('should handle different error messages', () => {
      const html1 = getPaymentFailedEmailTemplate(
        'User',
        'PRO',
        29,
        'Card expired'
      );
      const html2 = getPaymentFailedEmailTemplate(
        'User',
        'PRO',
        29,
        'Invalid card number'
      );

      expect(html1).toContain('Card expired');
      expect(html2).toContain('Invalid card number');
    });
  });

  describe('getPaymentSuccessEmailTemplate', () => {
    it('should generate payment success email with all details', () => {
      const html = getPaymentSuccessEmailTemplate(
        'Maria Costa',
        'PRO',
        29.0,
        'https://invoices.example.com/123'
      );

      expect(html).toContain('Maria Costa');
      expect(html).toContain('PRO');
      expect(html).toContain('$29.00');
      expect(html).toContain('https://invoices.example.com/123');
    });

    it('should include success confirmation header', () => {
      const html = getPaymentSuccessEmailTemplate(
        'User',
        'PRO',
        29.0,
        'invoice-url'
      );

      expect(html).toContain('Pagamento Confirmado');
      expect(html).toContain('✅');
      expect(html).toContain('sucesso');
    });

    it('should include payment details table', () => {
      const html = getPaymentSuccessEmailTemplate(
        'User',
        'ENTERPRISE',
        99.0,
        'invoice-url'
      );

      expect(html).toContain('Plano:');
      expect(html).toContain('ENTERPRISE');
      expect(html).toContain('Valor pago:');
      expect(html).toContain('$99.00');
    });

    it('should include view invoice button', () => {
      const invoiceUrl = 'https://invoices.stripe.com/abc123';
      const html = getPaymentSuccessEmailTemplate('User', 'PRO', 29.0, invoiceUrl);

      expect(html).toContain('Ver Fatura');
      expect(html).toContain(invoiceUrl);
    });

    it('should include dashboard button', () => {
      const html = getPaymentSuccessEmailTemplate(
        'User',
        'PRO',
        29.0,
        'invoice-url'
      );

      expect(html).toContain('Ir para Dashboard');
      expect(html).toContain('https://uijson.com/dashboard');
    });

    it('should format amount with 2 decimal places', () => {
      const html = getPaymentSuccessEmailTemplate(
        'User',
        'PRO',
        199.99,
        'invoice-url'
      );

      expect(html).toContain('$199.99');
    });

    it('should include access confirmation message', () => {
      const html = getPaymentSuccessEmailTemplate(
        'User',
        'PRO',
        29.0,
        'invoice-url'
      );

      expect(html).toContain('acesso ao plano PRO está garantido');
      expect(html).toContain('Aproveite todos os recursos');
    });

    it('should include proper HTML structure', () => {
      const html = getPaymentSuccessEmailTemplate(
        'User',
        'PRO',
        29.0,
        'invoice-url'
      );

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
    });

    it('should include branding and support', () => {
      const html = getPaymentSuccessEmailTemplate(
        'User',
        'PRO',
        29.0,
        'invoice-url'
      );

      expect(html).toContain('UI-JSON Visualizer');
      expect(html).toContain('Precisa de ajuda?');
    });

    it('should thank user for payment', () => {
      const html = getPaymentSuccessEmailTemplate(
        'User',
        'PRO',
        29.0,
        'invoice-url'
      );

      expect(html).toContain('Obrigado por continuar usando');
    });
  });

  describe('getSubscriptionCanceledEmailTemplate', () => {
    it('should generate subscription canceled email with all details', () => {
      const html = getSubscriptionCanceledEmailTemplate(
        'Pedro Santos',
        'PRO',
        '31 de Janeiro de 2025'
      );

      expect(html).toContain('Pedro Santos');
      expect(html).toContain('PRO');
      expect(html).toContain('31 de Janeiro de 2025');
    });

    it('should include cancellation header', () => {
      const html = getSubscriptionCanceledEmailTemplate(
        'User',
        'PRO',
        'End Date'
      );

      expect(html).toContain('Assinatura Cancelada');
      expect(html).toContain('📋');
    });

    it('should confirm cancellation', () => {
      const html = getSubscriptionCanceledEmailTemplate(
        'User',
        'ENTERPRISE',
        'End Date'
      );

      expect(html).toContain('Confirmamos o cancelamento');
      expect(html).toContain('ENTERPRISE');
    });

    it('should prominently display end date', () => {
      const endDate = '15 de Fevereiro de 2025';
      const html = getSubscriptionCanceledEmailTemplate('User', 'PRO', endDate);

      expect(html).toContain('Você ainda tem acesso até');
      expect(html).toContain(endDate);
      expect(html).toContain('font-size: 24px');
    });

    it('should mention FREE plan conversion', () => {
      const html = getSubscriptionCanceledEmailTemplate(
        'User',
        'PRO',
        'End Date'
      );

      expect(html).toContain('convertida para o plano');
      expect(html).toContain('FREE');
    });

    it('should request feedback', () => {
      const html = getSubscriptionCanceledEmailTemplate(
        'User',
        'PRO',
        'End Date'
      );

      expect(html).toContain('Sentiremos sua falta');
      expect(html).toContain('o que podemos melhorar');
      expect(html).toContain('Responda este email com seu feedback');
    });

    it('should include reactivation button', () => {
      const html = getSubscriptionCanceledEmailTemplate(
        'User',
        'PRO',
        'End Date'
      );

      expect(html).toContain('Reativar Assinatura');
      expect(html).toContain('https://uijson.com/pricing');
    });

    it('should include proper HTML structure', () => {
      const html = getSubscriptionCanceledEmailTemplate(
        'User',
        'PRO',
        'End Date'
      );

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
    });

    it('should thank user', () => {
      const html = getSubscriptionCanceledEmailTemplate(
        'User',
        'PRO',
        'End Date'
      );

      expect(html).toContain('Obrigado por ter usado');
      expect(html).toContain('Esperamos vê-lo de volta');
    });

    it('should include branding', () => {
      const html = getSubscriptionCanceledEmailTemplate(
        'User',
        'PRO',
        'End Date'
      );

      expect(html).toContain('UI-JSON Visualizer');
    });

    it('should handle different plan tiers', () => {
      const htmlPro = getSubscriptionCanceledEmailTemplate('User', 'PRO', 'Date');
      const htmlEnterprise = getSubscriptionCanceledEmailTemplate(
        'User',
        'ENTERPRISE',
        'Date'
      );

      expect(htmlPro).toContain('plano <strong>PRO</strong>');
      expect(htmlEnterprise).toContain('plano <strong>ENTERPRISE</strong>');
    });
  });

  describe('Common Template Features', () => {
    it('should use inline styles for email compatibility', () => {
      const html1 = getPaymentFailedEmailTemplate('U', 'P', 10, 'E');
      const html2 = getPaymentSuccessEmailTemplate('U', 'P', 10, 'url');
      const html3 = getSubscriptionCanceledEmailTemplate('U', 'P', 'D');

      expect(html1).toContain('style=');
      expect(html2).toContain('style=');
      expect(html3).toContain('style=');
    });

    it('should use web-safe fonts', () => {
      const html = getPaymentFailedEmailTemplate('U', 'P', 10, 'E');

      expect(html).toContain('font-family');
      expect(html).toContain('-apple-system');
      expect(html).toContain('sans-serif');
    });

    it('should have max-width for readability', () => {
      const html1 = getPaymentFailedEmailTemplate('U', 'P', 10, 'E');
      const html2 = getPaymentSuccessEmailTemplate('U', 'P', 10, 'url');

      expect(html1).toContain('max-width: 600px');
      expect(html2).toContain('max-width: 600px');
    });

    it('should use UTF-8 charset', () => {
      const html = getPaymentSuccessEmailTemplate('U', 'P', 10, 'url');

      expect(html).toContain('charset="utf-8"');
    });

    it('should have responsive viewport', () => {
      const html = getSubscriptionCanceledEmailTemplate('U', 'P', 'D');

      expect(html).toContain('name="viewport"');
      expect(html).toContain('width=device-width');
    });
  });

  describe('Button Styling', () => {
    it('should style buttons consistently', () => {
      const html = getPaymentFailedEmailTemplate('U', 'P', 10, 'E');

      expect(html).toContain('display: inline-block');
      expect(html).toContain('padding: 14px 28px');
      expect(html).toContain('text-decoration: none');
      expect(html).toContain('border-radius: 6px');
    });

    it('should use branded colors for primary buttons', () => {
      const html = getPaymentSuccessEmailTemplate('U', 'P', 10, 'url');

      expect(html).toContain('background: #0070f3');
      expect(html).toContain('color: white');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user names', () => {
      const html = getPaymentFailedEmailTemplate('', 'PRO', 29.0, 'Error');

      expect(html).toContain('Olá ,');
    });

    it('should handle very large amounts', () => {
      const html = getPaymentSuccessEmailTemplate('U', 'P', 999999.99, 'url');

      expect(html).toContain('$999999.99');
    });

    it('should handle zero amount', () => {
      const html = getPaymentFailedEmailTemplate('U', 'P', 0, 'Error');

      expect(html).toContain('$0.00');
    });

    it('should handle special characters in names', () => {
      const html = getPaymentSuccessEmailTemplate(
        'José María Álvarez',
        'PRO',
        29.0,
        'url'
      );

      expect(html).toContain('José María Álvarez');
    });

    it('should handle special characters in error messages', () => {
      const html = getPaymentFailedEmailTemplate(
        'User',
        'PRO',
        29,
        "Card declined - don't retry"
      );

      expect(html).toContain("Card declined - don't retry");
    });
  });
});
