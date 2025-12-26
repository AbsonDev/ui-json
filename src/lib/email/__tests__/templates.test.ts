/**
 * Tests for Email Templates
 */

import {
  welcomeEmail,
  educationEmail,
  valueEmail,
  urgencyEmail,
  lastChanceEmail,
  getTrialEmail,
} from '../templates';

describe('Email Templates', () => {
  describe('welcomeEmail', () => {
    it('should generate welcome email with user name and plan', () => {
      const html = welcomeEmail('João Silva', 'PRO');

      expect(html).toContain('João Silva');
      expect(html).toContain('PRO Plan');
      expect(html).toContain('Bem-vindo');
      expect(html).toContain('14 dias');
    });

    it('should include call to action button', () => {
      const html = welcomeEmail('Test User', 'PRO');

      expect(html).toContain('Criar Primeiro App Pro');
      expect(html).toContain('https://uijson.com/dashboard');
    });

    it('should include key features', () => {
      const html = welcomeEmail('User', 'PRO');

      expect(html).toContain('templates premium');
      expect(html).toContain('AI Assistant');
      expect(html).toContain('mobile build');
    });

    it('should include documentation link', () => {
      const html = welcomeEmail('User', 'PRO');

      expect(html).toContain('https://uijson.com/docs');
    });

    it('should include trial information', () => {
      const html = welcomeEmail('User', 'PRO');

      expect(html).toContain('trial de 14 dias');
      expect(html).toContain('cancelar a qualquer momento');
    });

    it('should work with different plan tiers', () => {
      const htmlPro = welcomeEmail('User', 'PRO');
      const htmlEnterprise = welcomeEmail('User', 'ENTERPRISE');

      expect(htmlPro).toContain('PRO Plan');
      expect(htmlEnterprise).toContain('ENTERPRISE Plan');
    });
  });

  describe('educationEmail', () => {
    it('should generate education email with user name', () => {
      const html = educationEmail('Maria Costa', 3);

      expect(html).toContain('Maria Costa');
      expect(html).toContain('3 formas de criar apps 10x mais rápido');
    });

    it('should show correct apps count (singular)', () => {
      const html = educationEmail('User', 1);

      expect(html).toContain('1 app');
      expect(html).not.toContain('1 apps');
    });

    it('should show correct apps count (plural)', () => {
      const html = educationEmail('User', 5);

      expect(html).toContain('5 apps');
    });

    it('should include AI Assistant section', () => {
      const html = educationEmail('User', 2);

      expect(html).toContain('AI Assistant Pro');
      expect(html).toContain('100 requests/dia');
    });

    it('should include Templates section', () => {
      const html = educationEmail('User', 2);

      expect(html).toContain('Templates Premium');
      expect(html).toContain('E-commerce');
    });

    it('should include Mobile Builds section', () => {
      const html = educationEmail('User', 2);

      expect(html).toContain('Mobile Builds');
      expect(html).toContain('iOS e Android');
      expect(html).toContain('10 builds/mês');
    });

    it('should include case study', () => {
      const html = educationEmail('User', 2);

      expect(html).toContain('Case de Sucesso');
      expect(html).toContain('30 horas');
    });

    it('should include templates link', () => {
      const html = educationEmail('User', 2);

      expect(html).toContain('https://uijson.com/templates');
    });

    it('should show remaining trial days', () => {
      const html = educationEmail('User', 2);

      expect(html).toContain('10 dias');
    });
  });

  describe('valueEmail', () => {
    it('should calculate hours saved correctly', () => {
      const stats = {
        appsCreated: 5,
        exportsCreated: 10,
        aiRequestsUsed: 50,
      };

      const html = valueEmail('User', stats);

      // 5 apps * 4h + 10 exports * 0.5h = 20 + 5 = 25 hours
      expect(html).toContain('25 horas');
    });

    it('should show user statistics', () => {
      const stats = {
        appsCreated: 3,
        exportsCreated: 7,
        aiRequestsUsed: 25,
      };

      const html = valueEmail('Pedro', stats);

      expect(html).toContain('3 apps criados');
      expect(html).toContain('7 exports realizados');
      expect(html).toContain('25 requisições de IA');
    });

    it('should calculate value generated', () => {
      const stats = {
        appsCreated: 4, // 16 hours
        exportsCreated: 2, // 1 hour
        aiRequestsUsed: 10,
      };

      const html = valueEmail('User', stats);

      // 17 hours * $50 = $850
      expect(html).toContain('$850');
    });

    it('should include pricing information', () => {
      const stats = {
        appsCreated: 2,
        exportsCreated: 1,
        aiRequestsUsed: 5,
      };

      const html = valueEmail('User', stats);

      expect(html).toContain('$19/mês');
    });

    it('should include testimonial', () => {
      const stats = {
        appsCreated: 1,
        exportsCreated: 1,
        aiRequestsUsed: 1,
      };

      const html = valueEmail('User', stats);

      expect(html).toContain('Maria Costa');
      expect(html).toContain('Agência Digital');
    });

    it('should show remaining trial days', () => {
      const stats = {
        appsCreated: 1,
        exportsCreated: 1,
        aiRequestsUsed: 1,
      };

      const html = valueEmail('User', stats);

      expect(html).toContain('6 dias');
    });

    it('should include discount offer', () => {
      const stats = {
        appsCreated: 1,
        exportsCreated: 1,
        aiRequestsUsed: 1,
      };

      const html = valueEmail('User', stats);

      expect(html).toContain('20% OFF');
    });

    it('should handle zero stats', () => {
      const stats = {
        appsCreated: 0,
        exportsCreated: 0,
        aiRequestsUsed: 0,
      };

      const html = valueEmail('User', stats);

      expect(html).toContain('0 apps criados');
      expect(html).toContain('0 horas');
    });
  });

  describe('urgencyEmail', () => {
    it('should include trial end date', () => {
      const html = urgencyEmail('User', '20 de Janeiro');

      expect(html).toContain('20 de Janeiro');
    });

    it('should show 3 days urgency', () => {
      const html = urgencyEmail('User', '2025-01-20');

      expect(html).toContain('3 dias');
    });

    it('should list features that will be lost', () => {
      const html = urgencyEmail('User', '2025-01-20');

      expect(html).toContain('Apps ilimitados');
      expect(html).toContain('Mobile builds');
      expect(html).toContain('AI Assistant 100/dia');
      expect(html).toContain('Exports ilimitados');
      expect(html).toContain('Analytics dashboard');
      expect(html).toContain('Templates premium');
    });

    it('should include discount offer', () => {
      const html = urgencyEmail('User', '2025-01-20');

      expect(html).toContain('20% de desconto');
      expect(html).toContain('$46/ano');
    });

    it('should include pricing link', () => {
      const html = urgencyEmail('User', '2025-01-20');

      expect(html).toContain('https://uijson.com/pricing');
    });

    it('should mention cancellation policy', () => {
      const html = urgencyEmail('User', '2025-01-20');

      expect(html).toContain('cancelar a qualquer momento');
    });

    it('should include free plan limits', () => {
      const html = urgencyEmail('User', '2025-01-20');

      expect(html).toContain('máximo 3');
      expect(html).toContain('10/dia');
      expect(html).toContain('5/mês');
    });
  });

  describe('lastChanceEmail', () => {
    it('should emphasize urgency', () => {
      const html = lastChanceEmail('User');

      expect(html).toContain('Último dia');
      expect(html).toContain('termina hoje');
      expect(html).toContain('meia-noite');
    });

    it('should list what will be lost', () => {
      const html = lastChanceEmail('Ana');

      expect(html).toContain('projetos premium ficam em modo somente leitura');
      expect(html).toContain('Não poderá criar novos mobile builds');
      expect(html).toContain('AI Assistant limitado a 10 requests/dia');
      expect(html).toContain('Máximo de 3 apps');
    });

    it('should list what will be maintained', () => {
      const html = lastChanceEmail('User');

      expect(html).toContain('projetos e dados preservados');
      expect(html).toContain('Acesso ilimitado');
      expect(html).toContain('Suporte prioritário');
    });

    it('should show pricing', () => {
      const html = lastChanceEmail('User');

      expect(html).toContain('$19/mês');
      expect(html).toContain('$199/ano');
      expect(html).toContain('economize 17%');
    });

    it('should have prominent CTA', () => {
      const html = lastChanceEmail('User');

      expect(html).toContain('Ativar Plano Pro Agora');
      expect(html).toContain('https://uijson.com/pricing');
    });

    it('should include support contact', () => {
      const html = lastChanceEmail('User');

      expect(html).toContain('support@uijson.com');
      expect(html).toContain('Tem dúvidas?');
    });

    it('should show trial end time', () => {
      const html = lastChanceEmail('User');

      expect(html).toContain('23:59');
    });
  });

  describe('getTrialEmail', () => {
    it('should return Day 1 email', () => {
      const result = getTrialEmail(1, {
        userName: 'João',
        planTier: 'PRO',
      });

      expect(result).not.toBeNull();
      expect(result?.subject).toContain('Bem-vindo');
      expect(result?.subject).toContain('PRO');
      expect(result?.html).toContain('João');
    });

    it('should return Day 4 email', () => {
      const result = getTrialEmail(4, {
        userName: 'Maria',
        planTier: 'PRO',
        appsCreated: 5,
      });

      expect(result).not.toBeNull();
      expect(result?.subject).toContain('3 formas');
      expect(result?.html).toContain('Maria');
      expect(result?.html).toContain('5 apps');
    });

    it('should return Day 8 email with calculated hours in subject', () => {
      const result = getTrialEmail(8, {
        userName: 'Pedro',
        planTier: 'PRO',
        appsCreated: 10,
        exportsCreated: 5,
      });

      expect(result).not.toBeNull();
      // 10 * 4 + 5 * 0.5 = 42.5 rounded to 43
      expect(result?.subject).toContain('43 horas');
    });

    it('should return Day 11 email', () => {
      const result = getTrialEmail(11, {
        userName: 'Ana',
        planTier: 'PRO',
        trialEndsAt: '25 de Janeiro',
      });

      expect(result).not.toBeNull();
      expect(result?.subject).toContain('3 dias');
      expect(result?.html).toContain('25 de Janeiro');
    });

    it('should return Day 14 email', () => {
      const result = getTrialEmail(14, {
        userName: 'Carlos',
        planTier: 'PRO',
      });

      expect(result).not.toBeNull();
      expect(result?.subject).toContain('Último dia');
      expect(result?.html).toContain('Carlos');
    });

    it('should return null for invalid day', () => {
      const result = getTrialEmail(5, {
        userName: 'User',
        planTier: 'PRO',
      });

      expect(result).toBeNull();
    });

    it('should handle missing optional parameters with defaults', () => {
      const result = getTrialEmail(4, {
        userName: 'User',
        planTier: 'PRO',
      });

      expect(result?.html).toContain('0 app');
    });

    it('should handle zero values in stats', () => {
      const result = getTrialEmail(8, {
        userName: 'User',
        planTier: 'PRO',
        appsCreated: 0,
        exportsCreated: 0,
        aiRequestsUsed: 0,
      });

      expect(result?.subject).toContain('0 horas');
    });
  });

  describe('Email Formatting', () => {
    it('should include proper DOCTYPE and HTML structure', () => {
      const html = welcomeEmail('User', 'PRO');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
    });

    it('should include base styles', () => {
      const html = welcomeEmail('User', 'PRO');

      expect(html).toContain('<style>');
      expect(html).toContain('font-family');
      expect(html).toContain('.button');
    });

    it('should have UI-JSON branding', () => {
      const html = educationEmail('User', 1);

      expect(html).toContain('UI-JSON');
    });

    it('should include footer in all emails', () => {
      expect(welcomeEmail('U', 'P')).toContain('class="footer"');
      expect(educationEmail('U', 1)).toContain('class="footer"');
      expect(valueEmail('U', { appsCreated: 1, exportsCreated: 1, aiRequestsUsed: 1 })).toContain('class="footer"');
      expect(urgencyEmail('U', 'date')).toContain('class="footer"');
      expect(lastChanceEmail('U')).toContain('class="footer"');
    });
  });
});
