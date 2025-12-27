import React, { useState, useEffect, useMemo } from 'react';
import { Wand2, AlertCircle, Info, Lightbulb } from 'lucide-react';
import { getPromptSuggestions, getContextualTips } from '@/lib/ai/promptSuggestions';

interface AILimits {
  current: number;
  max: number;
  remaining: number;
}

interface AIAssistantProps {
  jsonString: string;
  setJsonString: (json: string) => void;
  setActiveTab: (tab: 'editor' | 'ai' | 'database' | 'flow' | 'snippets') => void;
}

const SuggestionModal: React.FC<{ current: string; suggestion: string; onAccept: () => void; onCancel: () => void }> = ({ current, suggestion, onAccept, onCancel }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl h-[90vh] flex flex-col">
        <h3 className="text-xl font-bold mb-4 text-gray-900">Sugestão da IA</h3>
        <p className="text-gray-600 mb-4">Revise as alterações sugeridas. Você pode aplicá-las ou cancelá-las.</p>
        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
          <div className="flex flex-col">
            <h4 className="font-semibold mb-2 text-gray-700">JSON Atual</h4>
            <pre className="flex-1 p-2 bg-gray-100 rounded text-xs overflow-auto border">{current}</pre>
          </div>
          <div className="flex flex-col">
            <h4 className="font-semibold mb-2 text-green-700">JSON Sugerido</h4>
            <pre className="flex-1 p-2 bg-green-50 rounded text-xs overflow-auto border border-green-300">{suggestion}</pre>
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700"
          >
            Aplicar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};


export const AIAssistant: React.FC<AIAssistantProps> = ({ jsonString, setJsonString, setActiveTab }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [limits, setLimits] = useState<AILimits | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [currentUsageId, setCurrentUsageId] = useState<string | null>(null);

  // Gerar sugestões inteligentes baseadas no JSON atual
  const suggestions = useMemo(() => getPromptSuggestions(jsonString), [jsonString]);
  const tips = useMemo(() => getContextualTips(jsonString), [jsonString]);

  // Carregar limites ao montar componente
  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      const response = await fetch('/api/ai/generate');
      if (response.ok) {
        const data = await response.json();
        setLimits(data.limits);
      }
    } catch (error) {
      console.error('Erro ao carregar limites:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Por favor, descreva a tela que deseja criar');
      return;
    }

    setIsGenerating(true);
    setSuggestion(null);
    setError(null);
    setWarnings([]);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          currentJson: jsonString,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Erros de limite, validação, etc.
        if (response.status === 429) {
          setError(data.upgradeMessage || 'Limite diário atingido');
          setLimits(data.limits);
        } else {
          setError(data.error || 'Erro ao gerar interface');
        }
        return;
      }

      // Sucesso
      if (data.prettyJson) {
        setSuggestion(data.prettyJson);
        setWarnings(data.warnings || []);
        setLimits(data.limits);
        // Armazenar ID do registro para feedback posterior
        setCurrentUsageId(data.usageId);
      }
    } catch (error) {
      console.error('Erro ao chamar API:', error);
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleAcceptSuggestion = async () => {
    if (suggestion) {
      setJsonString(suggestion);
      setSuggestion(null);
      setPrompt('');
      setActiveTab('editor');

      // Enviar feedback positivo se tivermos o usageId
      if (currentUsageId) {
        try {
          await fetch('/api/ai/feedback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              usageId: currentUsageId,
              accepted: true,
            }),
          });
        } catch (error) {
          console.error('Erro ao enviar feedback:', error);
        }
      }
    }
  };

  const handleCancelSuggestion = async () => {
    // Enviar feedback negativo se tivermos o usageId
    if (currentUsageId) {
      try {
        await fetch('/api/ai/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usageId: currentUsageId,
            accepted: false,
          }),
        });
      } catch (error) {
        console.error('Erro ao enviar feedback:', error);
      }
    }

    setSuggestion(null);
    setCurrentUsageId(null);
  };

  return (
    <div className="p-4 flex flex-col h-full bg-gray-50 rounded-b-lg relative">
        {/* Limites de uso */}
        {limits && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <Info size={16} className="text-blue-600" />
              <span className="text-blue-900">
                Requisições hoje: <strong>{limits.current}/{limits.max === -1 ? '∞' : limits.max}</strong>
                {limits.remaining > 0 && limits.remaining !== -1 && (
                  <span className="text-blue-700"> ({limits.remaining} restantes)</span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">Erro</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Warnings de validação */}
        {warnings.length > 0 && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-900">Avisos</p>
                <ul className="text-sm text-yellow-700 list-disc list-inside">
                  {warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setWarnings([])}
                className="text-yellow-400 hover:text-yellow-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">
            Descreva a interface que você quer criar ou modificar, e a IA irá gerar o JSON para você.
        </p>

        {/* Dicas contextuais */}
        {tips.length > 0 && (
          <div className="mb-3 p-2 bg-purple-50 border border-purple-200 rounded-md">
            <div className="flex items-start gap-2">
              <Lightbulb size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                {tips.map((tip, idx) => (
                  <p key={idx} className="text-xs text-purple-700 mb-1 last:mb-0">
                    {tip}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sugestões inteligentes */}
        {suggestions.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <Lightbulb size={14} />
              Sugestões baseadas no seu app:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(suggestion)}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50 hover:border-blue-400 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
            <label htmlFor="ai-prompt" className="text-sm font-medium text-gray-700 mb-2">Seu pedido:</label>
            <textarea
                id="ai-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Adicione um campo 'confirmar senha' no formulário"
                className="w-full flex-1 p-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-900"
                rows={5}
            />
        </div>

        <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
            {isGenerating ? (
                <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Gerando...
                </>
            ) : (
                <>
                    <Wand2 size={18} />
                    Gerar Interface
                </>
            )}
        </button>
        {suggestion && (
            <SuggestionModal 
                current={jsonString} 
                suggestion={suggestion} 
                onAccept={handleAcceptSuggestion}
                onCancel={handleCancelSuggestion}
            />
        )}
    </div>
  );
};