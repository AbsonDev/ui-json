import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Bot, AlertCircle } from 'lucide-react';
import { UIAIChat, UIAIAssistant, UIAIAnalyzer } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIComponentProps {
  appId: string;
  formData: Record<string, any>;
  onFieldChange?: (fieldId: string, value: any) => void;
}

/**
 * AIChat Component - Interactive chatbot
 */
export const RenderAIChat: React.FC<UIAIChat & AIComponentProps> = ({
  id,
  appId,
  persona = 'Você é um assistente prestativo.',
  welcomeMessage = 'Olá! Como posso ajudar?',
  placeholder = 'Digite sua mensagem...',
  height = 400,
  showHistory = true,
  maxMessages = 50,
  formData,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId,
          aiAction: 'chat',
          prompt: input.trim(),
          persona,
          context: formData,
          chatHistory: showHistory
            ? messages.slice(-10).map((m) => ({
                role: m.role,
                content: m.content,
              }))
            : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar mensagem');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.result,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const newMessages = [...prev, assistantMessage];
        // Limitar número de mensagens
        if (maxMessages && newMessages.length > maxMessages) {
          return newMessages.slice(-maxMessages);
        }
        return newMessages;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col border rounded-lg bg-white shadow-sm" style={{ height }}>
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <Bot size={20} />
        <span className="font-semibold">Assistente IA</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <Loader2 size={16} className="animate-spin text-gray-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <div className="flex items-start gap-2 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t bg-gray-50 rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * AIAssistant Component - One-click AI assistance
 */
export const RenderAIAssistant: React.FC<UIAIAssistant & AIComponentProps> = ({
  id,
  appId,
  prompt,
  inputFields,
  outputField,
  buttonText = 'Obter Sugestão da IA',
  loadingText = 'Processando...',
  icon,
  formData,
  onFieldChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Substituir placeholders no prompt
      let finalPrompt = prompt;
      const context: Record<string, any> = {};

      inputFields.forEach((fieldId) => {
        const value = formData[fieldId];
        finalPrompt = finalPrompt.replace(new RegExp(`{{${fieldId}}}`, 'g'), value || '');
        context[fieldId] = value;
      });

      const response = await fetch('/api/ai/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId,
          aiAction: 'suggest',
          prompt: finalPrompt,
          context,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar');
      }

      setResult(data.result);

      // Salvar no campo de saída
      if (onFieldChange && outputField) {
        onFieldChange(outputField, data.result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao executar IA:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleAnalyze}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>{loadingText}</span>
          </>
        ) : (
          <>
            <Sparkles size={18} />
            <span>{buttonText}</span>
          </>
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Sparkles size={16} className="text-purple-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-900 mb-1">Sugestão da IA:</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{result}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * AIAnalyzer Component - Automatic text analysis
 */
export const RenderAIAnalyzer: React.FC<UIAIAnalyzer & AIComponentProps> = ({
  id,
  appId,
  analyzeType,
  sourceField,
  resultField,
  placeholder = 'Analisando...',
  autoAnalyze = false,
  formData,
  onFieldChange,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const sourceValue = formData[sourceField];

  const analyze = async () => {
    if (!sourceValue || !sourceValue.trim()) return;

    setIsAnalyzing(true);

    try {
      let prompt = '';
      switch (analyzeType) {
        case 'sentiment':
          prompt = `Analise o sentimento do seguinte texto e responda apenas com: POSITIVO, NEGATIVO ou NEUTRO.\n\nTexto: ${sourceValue}`;
          break;
        case 'category':
          prompt = `Classifique o seguinte texto em uma categoria apropriada. Responda apenas com a categoria.\n\nTexto: ${sourceValue}`;
          break;
        case 'summary':
          prompt = `Resuma o seguinte texto em uma frase concisa:\n\nTexto: ${sourceValue}`;
          break;
        default:
          prompt = `Analise o seguinte texto:\n\n${sourceValue}`;
      }

      const response = await fetch('/api/ai/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId,
          aiAction: 'analyze',
          prompt,
          context: { sourceValue },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.result);
        if (onFieldChange && resultField) {
          onFieldChange(resultField, data.result);
        }
      }
    } catch (err) {
      console.error('Erro ao analisar:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (autoAnalyze && sourceValue) {
      const timeout = setTimeout(() => analyze(), 1000);
      return () => clearTimeout(timeout);
    }
  }, [sourceValue, autoAnalyze]);

  return (
    <div className="space-y-2">
      {!autoAnalyze && (
        <button
          onClick={analyze}
          disabled={isAnalyzing || !sourceValue}
          className="w-full px-4 py-2 bg-indigo-500 text-white text-sm rounded-md hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              {placeholder}
            </span>
          ) : (
            'Analisar com IA'
          )}
        </button>
      )}

      {result && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md">
          <p className="text-xs font-semibold text-indigo-900 mb-1">Resultado da Análise:</p>
          <p className="text-sm text-gray-800">{result}</p>
        </div>
      )}
    </div>
  );
};
