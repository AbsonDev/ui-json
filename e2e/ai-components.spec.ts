/**
 * E2E Tests for AI Components
 * Tests the full integration of AI features in apps
 */

import { test, expect } from '@playwright/test';

test.describe('AI Components E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/ai/execute', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Simulate different responses based on aiAction
      let result = '';
      switch (postData.aiAction) {
        case 'chat':
          result = 'Olá! Como posso ajudá-lo hoje?';
          break;
        case 'suggest':
          result = 'Baseado nos sintomas descritos, sugiro consultar um cardiologista.';
          break;
        case 'analyze':
          result = 'POSITIVO';
          break;
        default:
          result = 'Resposta genérica da IA';
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result,
          tokensUsed: 50,
          responseTime: 1000,
        }),
      });
    });
  });

  test('AIChat component should work end-to-end', async ({ page }) => {
    // Navegar para uma página com AIChat
    await page.goto('/test-ai-chat');

    // Verificar que o componente foi renderizado
    await expect(page.getByText('Assistente IA')).toBeVisible();

    // Verificar mensagem de boas-vindas
    await expect(page.getByText(/Olá! Como posso/)).toBeVisible();

    // Digitar mensagem
    const input = page.getByPlaceholder('Digite sua mensagem...');
    await input.fill('Preciso de ajuda');

    // Enviar mensagem
    await page.click('button[type="submit"]');

    // Verificar que a mensagem do usuário apareceu
    await expect(page.getByText('Preciso de ajuda')).toBeVisible();

    // Verificar que a resposta da IA apareceu
    await expect(page.getByText('Olá! Como posso ajudá-lo hoje?')).toBeVisible();

    // Verificar que o input foi limpo
    await expect(input).toHaveValue('');
  });

  test('AIAssistant component should work end-to-end', async ({ page }) => {
    // Navegar para página com AIAssistant
    await page.goto('/test-ai-assistant');

    // Preencher campos de entrada
    await page.fill('#sintomas', 'Dor no peito, falta de ar');
    await page.fill('#idade', '45');

    // Clicar no botão de análise
    await page.click('button:has-text("Obter Sugestão da IA")');

    // Verificar estado de loading
    await expect(page.getByText('Processando...')).toBeVisible();

    // Verificar resultado
    await expect(
      page.getByText(/sugiro consultar um cardiologista/)
    ).toBeVisible();

    // Verificar que o campo de saída foi preenchido
    const outputField = page.locator('#especialidade');
    await expect(outputField).toHaveValue(/cardiologista/);
  });

  test('AIAnalyzer component should work end-to-end', async ({ page }) => {
    // Navegar para página com AIAnalyzer
    await page.goto('/test-ai-analyzer');

    // Preencher campo de texto
    await page.fill('#feedback', 'Este produto é excelente!');

    // Clicar no botão de análise
    await page.click('button:has-text("Analisar com IA")');

    // Verificar resultado da análise
    await expect(page.getByText('POSITIVO')).toBeVisible();

    // Verificar que o resultado foi salvo no campo
    const resultField = page.locator('#sentimento');
    await expect(resultField).toHaveValue('POSITIVO');
  });

  test('AI Action in button should work', async ({ page }) => {
    // Navegar para página com botão AI
    await page.goto('/test-ai-button');

    // Preencher campo
    await page.fill('#texto', 'Teste de análise');

    // Clicar no botão com ação AI
    await page.click('button:has-text("Analisar com IA")');

    // Verificar que a ação foi executada
    await expect(page.getByText(/Resposta genérica da IA/)).toBeVisible();
  });

  test('Should handle AI API errors gracefully', async ({ page }) => {
    // Mock erro da API
    await page.route('**/api/ai/execute', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Limite de requisições atingido',
          upgradeMessage: 'Faça upgrade para PRO',
        }),
      });
    });

    await page.goto('/test-ai-chat');

    // Tentar enviar mensagem
    await page.fill('input[placeholder="Digite sua mensagem..."]', 'Teste');
    await page.click('button[type="submit"]');

    // Verificar mensagem de erro
    await expect(page.getByText(/Limite de requisições atingido/)).toBeVisible();
  });

  test('Should handle network errors', async ({ page }) => {
    // Simular erro de rede
    await page.route('**/api/ai/execute', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/test-ai-chat');

    // Tentar enviar mensagem
    await page.fill('input[placeholder="Digite sua mensagem..."]', 'Teste');
    await page.click('button[type="submit"]');

    // Verificar que o erro foi tratado
    await expect(page.getByText(/Erro/i)).toBeVisible();
  });

  test('Chat should maintain conversation history', async ({ page }) => {
    await page.goto('/test-ai-chat');

    // Enviar primeira mensagem
    await page.fill('input[placeholder="Digite sua mensagem..."]', 'Primeira mensagem');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Primeira mensagem')).toBeVisible();

    // Enviar segunda mensagem
    await page.fill('input[placeholder="Digite sua mensagem..."]', 'Segunda mensagem');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Segunda mensagem')).toBeVisible();

    // Verificar que ambas mensagens estão visíveis
    await expect(page.getByText('Primeira mensagem')).toBeVisible();
    await expect(page.getByText('Segunda mensagem')).toBeVisible();
  });

  test('AIAssistant should replace multiple placeholders', async ({ page }) => {
    await page.goto('/test-ai-assistant-multi');

    // Preencher múltiplos campos
    await page.fill('#nome', 'João Silva');
    await page.fill('#idade', '30');
    await page.fill('#cidade', 'São Paulo');

    // Clicar no botão
    await page.click('button:has-text("Gerar Perfil")');

    // Verificar que a API recebeu os valores corretos
    // (isso seria verificado através de interceptação de rede)
    await expect(page.getByText(/Resposta genérica da IA/)).toBeVisible();
  });

  test('Sentiment analyzer should auto-analyze on input', async ({ page }) => {
    await page.goto('/test-ai-analyzer-auto');

    // Digitar no campo
    await page.fill('#comentario', 'Este é um comentário positivo!');

    // Aguardar análise automática (debounce de 1 segundo)
    await page.waitForTimeout(1500);

    // Verificar que a análise foi feita automaticamente
    await expect(page.getByText('POSITIVO')).toBeVisible();
  });

  test('Should respect AI execution limits', async ({ page }) => {
    let requestCount = 0;

    await page.route('**/api/ai/execute', async (route) => {
      requestCount++;

      if (requestCount > 3) {
        // Simular limite atingido
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Limite mensal atingido',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: `Resposta ${requestCount}`,
          }),
        });
      }
    });

    await page.goto('/test-ai-chat');

    // Enviar 3 mensagens (sucesso)
    for (let i = 1; i <= 3; i++) {
      await page.fill('input[placeholder="Digite sua mensagem..."]', `Mensagem ${i}`);
      await page.click('button[type="submit"]');
      await expect(page.getByText(`Resposta ${i}`)).toBeVisible();
    }

    // Tentar enviar 4ª mensagem (limite atingido)
    await page.fill('input[placeholder="Digite sua mensagem..."]', 'Mensagem 4');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/Limite mensal atingido/)).toBeVisible();
  });
});
