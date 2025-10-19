import React from 'react';
import { snippets } from '../constants';

interface SnippetsProps {
  onAddSnippet: (snippetJson: string) => void;
}

export const Snippets: React.FC<SnippetsProps> = ({ onAddSnippet }) => {
  return (
    <div className="p-4 flex flex-col h-full bg-gray-50 rounded-b-lg overflow-y-auto">
      <p className="text-sm text-gray-600 mb-4">
        Clique em "Adicionar" para inserir um componente ou um conjunto de componentes pré-configurados na tela atual.
      </p>
      <div className="space-y-3">
        {snippets.map((snippet, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-800">{snippet.name}</h3>
            <p className="text-sm text-gray-600 mt-1 mb-3">{snippet.description}</p>
            <button
              onClick={() => onAddSnippet(snippet.json)}
              className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Adicionar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
