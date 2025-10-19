import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Wand2 } from 'lucide-react';

const SYSTEM_INSTRUCTION = `Você é um especialista em gerar e modificar UI-JSON, uma linguagem declarativa para criar interfaces e esquemas de dados de aplicativos.

ESTRUTURA COMPLETA:
{
  "version": "1.0",
  "app": {
    "name": "Nome do App",
    "theme": { ... },
    "designTokens": { "primaryColor": "#HEX", "spacingMedium": 16 },
    "databaseSchema": { ... },
    "authentication": {
      "enabled": true,
      "userTable": "users",
      "emailField": "email",
      "passwordField": "password",
      "postLoginScreen": "dashboard",
      "authRedirectScreen": "auth:login"
    }
  },
  "screens": { "screen_id": { "requiresAuth": true, ... } },
  "initialScreen": "screen_id"
}

SUAS CAPACIDADES:

1. GERENCIAR TELAS E COMPONENTES:
   - Criar, remover ou modificar telas e componentes.
   - Componentes disponíveis: text, input, button, image, list, card, select, checkbox, container, divider, datepicker, timepicker.
   - Usar \`"showIf": "session.isLoggedIn"|"session.isLoggedOut"\` para renderização condicional.

2. GERENCIAR O SCHEMA DE BANCO DE DADOS:
   - Criar e modificar o "databaseSchema".
   - Tipos de campo suportados: "string", "number", "boolean", "date", "time".
   - Exemplo: "fields": { "title": { "type": "string", "description": "Título da tarefa" }, "isComplete": { "type": "boolean", "default": false } }

3. GERENCIAR AUTENTICAÇÃO:
   - Habilitar autenticação configurando o objeto \`app.authentication\`.
   - Proteger telas com \`"requiresAuth": true\`.
   - Usar as telas mágicas \`"auth:login"\` e \`"auth:signup"\` em ações de navegação.
   - Usar as ações \`"auth:login"\`, \`"auth:signup"\`, e \`"auth:logout"\` em botões.

4. USAR DESIGN TOKENS:
   - Usar variáveis definidas em \`app.designTokens\` para manter a consistência.
   - Aplicar tokens a propriedades de estilo prefixando com '$', por exemplo: \`"marginBottom": "$spacingMedium"\`.

CONECTANDO UI AO BANCO DE DADOS:
- Botões: \`"action": { "type": "submit", "target": "database", ... }\`.
- Listas: \`"dataSource": { "table": "table_name" }\`.
- Templates: \`"title": "{{fieldName}}"\` para dados de lista, e \`"content": "{{session.user.email}}"\` para dados do usuário logado.

MODIFICANDO JSON EXISTENTE:
- Se um JSON ATUAL for fornecido, seu trabalho é MODIFICÁ-LO, não recriá-lo do zero.
- Analise o pedido do usuário e o JSON ATUAL para entender o contexto.
- Aplique as alterações solicitadas de forma incremental.

REGRAS DE RESPOSTA:
- RESPONDA APENAS COM O JSON COMPLETO E ATUALIZADO.
- NÃO inclua explicações, comentários ou markdown (como \`\`\`json). Apenas o JSON puro.`;

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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Por favor, descreva a tela que deseja criar');
      return;
    }
    setIsGenerating(true);
    setSuggestion(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const fullPrompt = `JSON ATUAL:\n${jsonString}\n\nPEDIDO DO USUÁRIO: ${prompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });

      let generated = response.text.trim();
      if (generated.startsWith('```json')) {
        generated = generated.substring(7, generated.length - 3).trim();
      } else if (generated.startsWith('```')) {
        generated = generated.substring(3, generated.length - 3).trim();
      }

      try {
        const parsed = JSON.parse(generated);
        const prettyJson = JSON.stringify(parsed, null, 2);
        setSuggestion(prettyJson);
      } catch (e) {
        console.error("Generated content is not valid JSON:", e);
        alert("A IA retornou um JSON inválido. Tente novamente ou ajuste o pedido.");
      }
    } catch (error) {
      console.error('Error generating UI with Gemini:', error);
      alert('An error occurred while generating the UI. Please check the console for details.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleAcceptSuggestion = () => {
      if (suggestion) {
          setJsonString(suggestion);
          setSuggestion(null);
          setPrompt('');
          setActiveTab('editor');
      }
  }

  const handleCancelSuggestion = () => {
      setSuggestion(null);
  }

  return (
    <div className="p-4 flex flex-col h-full bg-gray-50 rounded-b-lg relative">
        <p className="text-sm text-gray-600 mb-4">
            Descreva a interface que você quer criar ou modificar, e a IA irá gerar o JSON para você.
        </p>
        
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