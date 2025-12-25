'use client'

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Sparkles, Code, Database, Wand2, Rocket } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      title: 'Bem-vindo ao UI-JSON Visualizer! 🎉',
      description: 'A plataforma low-code para criar apps móveis com JSON',
      icon: <Sparkles className="text-yellow-500" size={48} />,
      content: (
        <div className="text-center">
          <p className="text-gray-700 mb-6">
            Crie aplicativos móveis incríveis usando apenas JSON declarativo.
            Sem código complexo, sem configuração complicada.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl mb-2">⚡</div>
              <div className="font-semibold text-sm text-gray-900">Rápido</div>
              <div className="text-xs text-gray-600">Deploy em minutos</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-3xl mb-2">🎨</div>
              <div className="font-semibold text-sm text-gray-900">Visual</div>
              <div className="text-xs text-gray-600">Preview em tempo real</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl mb-2">🤖</div>
              <div className="font-semibold text-sm text-gray-900">AI-Powered</div>
              <div className="text-xs text-gray-600">Assistente inteligente</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Editor JSON',
      description: 'Defina sua interface com JSON declarativo',
      icon: <Code className="text-blue-500" size={48} />,
      content: (
        <div>
          <p className="text-gray-700 mb-4">
            O editor JSON permite que você defina toda a estrutura do seu app:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <Check className="text-green-500 flex-shrink-0 mt-1" size={18} />
              <div>
                <strong className="text-gray-900">Componentes</strong>
                <p className="text-sm text-gray-600">Buttons, inputs, lists, cards e mais</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-green-500 flex-shrink-0 mt-1" size={18} />
              <div>
                <strong className="text-gray-900">Navegação</strong>
                <p className="text-sm text-gray-600">Múltiplas telas com transições</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-green-500 flex-shrink-0 mt-1" size={18} />
              <div>
                <strong className="text-gray-900">Temas</strong>
                <p className="text-sm text-gray-600">Cores, fonts e design tokens</p>
              </div>
            </li>
          </ul>
          <div className="mt-6 p-3 bg-gray-100 rounded font-mono text-xs text-gray-800">
            <div className="text-gray-500">// Example:</div>
            {`{
  "type": "button",
  "text": "Hello World",
  "action": { "type": "popup", "message": "👋" }
}`}
          </div>
        </div>
      ),
    },
    {
      title: 'Templates & Snippets',
      description: 'Comece rápido com templates prontos',
      icon: <Sparkles className="text-purple-500" size={48} />,
      content: (
        <div>
          <p className="text-gray-700 mb-4">
            Não sabe por onde começar? Use nossos templates e snippets!
          </p>
          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-purple-600" size={20} />
                <strong className="text-gray-900">Templates Gallery</strong>
              </div>
              <p className="text-sm text-gray-700">
                Apps completos por categoria: E-commerce, Saúde, Educação, Delivery e mais
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Code className="text-blue-600" size={20} />
                <strong className="text-gray-900">Component Library</strong>
              </div>
              <p className="text-sm text-gray-700">
                Componentes prontos para adicionar: Forms, cards, listas e mais
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Database Manager',
      description: 'Gerencie dados com PostgreSQL',
      icon: <Database className="text-emerald-500" size={48} />,
      content: (
        <div>
          <p className="text-gray-700 mb-4">
            Crie schemas de banco de dados e gerencie dados diretamente na plataforma:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <Check className="text-green-500 flex-shrink-0 mt-1" size={18} />
              <div>
                <strong className="text-gray-900">Visual Schema Editor</strong>
                <p className="text-sm text-gray-600">Defina tabelas e campos visualmente</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-green-500 flex-shrink-0 mt-1" size={18} />
              <div>
                <strong className="text-gray-900">Data Management</strong>
                <p className="text-sm text-gray-600">CRUD completo com interface amigável</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-green-500 flex-shrink-0 mt-1" size={18} />
              <div>
                <strong className="text-gray-900">Auto-sync</strong>
                <p className="text-sm text-gray-600">Dados salvos automaticamente</p>
              </div>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'AI Assistant',
      description: 'Deixe a IA criar apps para você',
      icon: <Wand2 className="text-indigo-500" size={48} />,
      content: (
        <div>
          <p className="text-gray-700 mb-4">
            Nosso assistente AI powered by Google Gemini pode:
          </p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2">
              <Check className="text-green-500 flex-shrink-0 mt-1" size={18} />
              <span className="text-gray-700">Gerar JSON completo a partir de descrições</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-green-500 flex-shrink-0 mt-1" size={18} />
              <span className="text-gray-700">Modificar apps existentes com comandos naturais</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-green-500 flex-shrink-0 mt-1" size={18} />
              <span className="text-gray-700">Criar schemas de banco de dados automaticamente</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-green-500 flex-shrink-0 mt-1" size={18} />
              <span className="text-gray-700">Sugerir melhorias e otimizações</span>
            </li>
          </ul>
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
            <p className="text-sm text-gray-700 italic">
              "Crie um app de to-do list com autenticação e dark mode"
            </p>
            <p className="text-xs text-gray-500 mt-2">→ A IA gera tudo em segundos! ✨</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Pronto para começar! 🚀',
      description: 'Crie seu primeiro app agora',
      icon: <Rocket className="text-orange-500" size={48} />,
      content: (
        <div className="text-center">
          <p className="text-gray-700 mb-6">
            Você está pronto! Comece explorando:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer">
              <Sparkles className="text-purple-600 mx-auto mb-2" size={24} />
              <div className="font-semibold text-sm text-gray-900">Templates Gallery</div>
              <div className="text-xs text-gray-600">Comece com um template</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
              <Code className="text-blue-600 mx-auto mb-2" size={24} />
              <div className="font-semibold text-sm text-gray-900">Editor</div>
              <div className="text-xs text-gray-600">Edite o JSON diretamente</div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer">
              <Wand2 className="text-indigo-600 mx-auto mb-2" size={24} />
              <div className="font-semibold text-sm text-gray-900">AI Assistant</div>
              <div className="text-xs text-gray-600">Deixe a IA ajudar</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer">
              <Database className="text-green-600 mx-auto mb-2" size={24} />
              <div className="font-semibold text-sm text-gray-900">Database</div>
              <div className="text-xs text-gray-600">Configure dados</div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-700">
              💡 <strong>Dica:</strong> Pressione <kbd className="px-2 py-1 bg-white rounded text-xs border">Ctrl+K</kbd> para abrir o Command Palette
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {currentStepData.icon}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentStepData.title}</h2>
                <p className="text-gray-600">{currentStepData.description}</p>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Pular tutorial"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all ${
                  idx <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Passo {currentStep + 1} de {steps.length}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
          >
            Pular tutorial
          </button>

          <div className="flex gap-3">
            {!isFirstStep && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <ChevronLeft size={18} />
                Anterior
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {isLastStep ? (
                <>
                  Começar
                  <Rocket size={18} />
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to manage onboarding state
export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
};
