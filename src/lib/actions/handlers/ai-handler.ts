/**
 * AI Action Handler
 * Handles AI actions (chat, analyze, suggest, classify, generate)
 */

import { UIAction } from '../../../types';
import { ActionContext } from '../action-context';

export async function handleAI(
  action: Extract<UIAction, { type: 'ai' }>,
  context: ActionContext
): Promise<void> {
  const { formState, setFormState, handleAction, uiApp } = context;

  // Validar que temos um app
  if (!uiApp) {
    console.error('No app context available for AI action');
    return;
  }

  try {
    // Substituir placeholders no prompt com valores do formState
    let finalPrompt = action.prompt;
    const contextData: Record<string, any> = { ...action.context };

    // Substituir {{fieldId}} pelo valor do campo
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    const matches = finalPrompt.match(placeholderRegex);

    if (matches) {
      matches.forEach((match) => {
        const fieldId = match.replace(/\{\{|\}\}/g, '');
        const value = formState[fieldId] || '';
        finalPrompt = finalPrompt.replace(match, value);
        contextData[fieldId] = value;
      });
    }

    // Preparar request body
    const requestBody = {
      appId: uiApp.app.name, // Usar nome do app como ID temporário
      aiAction: action.aiAction,
      prompt: finalPrompt,
      persona: action.persona,
      context: contextData,
    };

    // Fazer chamada à API
    const response = await fetch('/api/ai/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao executar IA');
    }

    // Salvar resultado no campo especificado
    if (action.saveToField && data.result) {
      setFormState({
        ...formState,
        [action.saveToField]: data.result,
      });
    }

    // Executar ação de sucesso se houver
    if (action.onSuccess) {
      handleAction(action.onSuccess);
    }
  } catch (error) {
    console.error('Erro ao executar ação de IA:', error);

    // Executar ação de erro se houver
    if (action.onError) {
      handleAction(action.onError);
    } else {
      // Mostrar erro padrão
      if (context.setPopup) {
        context.setPopup({
          title: 'Erro na IA',
          message: error instanceof Error ? error.message : 'Erro desconhecido ao executar IA',
          variant: 'alert',
        });
      }
    }
  }
}
