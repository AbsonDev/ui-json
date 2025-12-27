'use client'

import React, { useState } from 'react';
import { templates, templateCategories, Template } from '@/data/templates';
import { Download, Star, TrendingUp, Search, X } from 'lucide-react';

interface TemplatesGalleryProps {
  onImportTemplate: (json: string, name: string) => void;
}

export const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({ onImportTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleImport = (template: Template) => {
    onImportTemplate(template.json, template.name);
    setSelectedTemplate(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b">
        <h3 className="text-xl font-bold text-gray-900 mb-3">📚 Templates Gallery</h3>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todos
          </button>
          {Object.entries(templateCategories).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === key
                  ? 'text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={selectedCategory === key ? { backgroundColor: cat.color } : {}}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
              onClick={() => setSelectedTemplate(template)}
            >
              {/* Preview Image */}
              <div
                className="h-32 bg-cover bg-center rounded-t-lg"
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${template.preview})`,
                }}
              >
                <div className="p-3 flex justify-between items-start">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(template.difficulty)}`}>
                    {template.difficulty === 'beginner' && 'Iniciante'}
                    {template.difficulty === 'intermediate' && 'Intermediário'}
                    {template.difficulty === 'advanced' && 'Avançado'}
                  </span>
                  {template.rating && (
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-semibold text-gray-900">{template.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-gray-900 text-lg">{template.name}</h4>
                  <span className="text-xs text-gray-500 ml-2">
                    {templateCategories[template.category].icon}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.features.slice(0, 3).map((feature, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                  {template.features.length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      +{template.features.length - 3}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Download size={14} />
                    {template.downloads?.toLocaleString()} downloads
                  </span>
                  {template.author && (
                    <span>por {template.author}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum template encontrado</p>
          </div>
        )}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedTemplate.name}</h3>
                  <p className="text-gray-600">{selectedTemplate.description}</p>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 mt-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(selectedTemplate.difficulty)}`}>
                  {selectedTemplate.difficulty === 'beginner' && 'Iniciante'}
                  {selectedTemplate.difficulty === 'intermediate' && 'Intermediário'}
                  {selectedTemplate.difficulty === 'advanced' && 'Avançado'}
                </span>
                {selectedTemplate.rating && (
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-gray-900">{selectedTemplate.rating}</span>
                  </div>
                )}
                <span className="text-sm text-gray-500">
                  <Download size={14} className="inline mr-1" />
                  {selectedTemplate.downloads?.toLocaleString()} downloads
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <h4 className="font-semibold text-gray-900 mb-3">✨ Recursos incluídos:</h4>
              <ul className="space-y-2 mb-6">
                {selectedTemplate.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    {feature}
                  </li>
                ))}
              </ul>

              {selectedTemplate.author && (
                <p className="text-sm text-gray-600 mb-4">
                  Criado por <span className="font-semibold">{selectedTemplate.author}</span>
                </p>
              )}

              {/* Preview Image */}
              <div
                className="h-48 bg-cover bg-center rounded-lg mb-4"
                style={{
                  backgroundImage: `url(${selectedTemplate.preview})`,
                }}
              />
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleImport(selectedTemplate)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Usar Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
