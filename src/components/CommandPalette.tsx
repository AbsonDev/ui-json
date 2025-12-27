'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Zap, Plus, Download, Clock, Sparkles, Code, Database, Workflow, Library, Settings } from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'app' | 'tools' | 'help';
}

interface CommandPaletteProps {
  onCreateApp: () => void;
  onOpenTemplates: () => void;
  onOpenAI: () => void;
  onOpenDatabase: () => void;
  onOpenFlow: () => void;
  onOpenSnippets: () => void;
  onExport: () => void;
  onVersionHistory: () => void;
  onOpenSettings: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  onCreateApp,
  onOpenTemplates,
  onOpenAI,
  onOpenDatabase,
  onOpenFlow,
  onOpenSnippets,
  onExport,
  onVersionHistory,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    // App Management
    {
      id: 'new-app',
      label: 'New Application',
      description: 'Create a new app',
      icon: <Plus size={18} />,
      shortcut: 'Ctrl+N',
      action: () => { onCreateApp(); setIsOpen(false); },
      category: 'app',
    },
    {
      id: 'export',
      label: 'Export & Share',
      description: 'Export or share your app',
      icon: <Download size={18} />,
      shortcut: 'Ctrl+E',
      action: () => { onExport(); setIsOpen(false); },
      category: 'app',
    },
    {
      id: 'version-history',
      label: 'Version History',
      description: 'View and restore previous versions',
      icon: <Clock size={18} />,
      shortcut: 'Ctrl+H',
      action: () => { onVersionHistory(); setIsOpen(false); },
      category: 'app',
    },

    // Navigation
    {
      id: 'templates',
      label: 'Templates Gallery',
      description: 'Browse app templates',
      icon: <Sparkles size={18} />,
      shortcut: 'Ctrl+T',
      action: () => { onOpenTemplates(); setIsOpen(false); },
      category: 'navigation',
    },
    {
      id: 'ai',
      label: 'AI Assistant',
      description: 'Open AI-powered code generator',
      icon: <Zap size={18} />,
      shortcut: 'Ctrl+I',
      action: () => { onOpenAI(); setIsOpen(false); },
      category: 'navigation',
    },
    {
      id: 'database',
      label: 'Database Manager',
      description: 'Manage app database',
      icon: <Database size={18} />,
      shortcut: 'Ctrl+D',
      action: () => { onOpenDatabase(); setIsOpen(false); },
      category: 'navigation',
    },
    {
      id: 'flow',
      label: 'Screen Flow',
      description: 'View screen flow diagram',
      icon: <Workflow size={18} />,
      shortcut: 'Ctrl+F',
      action: () => { onOpenFlow(); setIsOpen(false); },
      category: 'navigation',
    },
    {
      id: 'snippets',
      label: 'Component Library',
      description: 'Browse component snippets',
      icon: <Library size={18} />,
      shortcut: 'Ctrl+L',
      action: () => { onOpenSnippets(); setIsOpen(false); },
      category: 'navigation',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Open settings panel',
      icon: <Settings size={18} />,
      action: () => { onOpenSettings(); setIsOpen(false); },
      category: 'tools',
    },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open command palette with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearch('');
        setSelectedIndex(0);
        return;
      }

      // Navigation with arrow keys
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
        }
      }

      // Keyboard shortcuts
      if (!isOpen) {
        commands.forEach(cmd => {
          if (cmd.shortcut) {
            const keys = cmd.shortcut.toLowerCase().split('+');
            const ctrl = keys.includes('ctrl');
            const key = keys[keys.length - 1];

            if ((ctrl && (e.ctrlKey || e.metaKey)) && e.key.toLowerCase() === key) {
              e.preventDefault();
              cmd.action();
            }
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, search, selectedIndex, filteredCommands]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!isOpen) return null;

  const categoryNames = {
    navigation: 'Navigation',
    app: 'App Management',
    tools: 'Tools',
    help: 'Help',
  };

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center pt-[15vh] p-4 z-[100]">
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Search className="text-gray-400" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-gray-900 placeholder-gray-400"
          />
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 border border-gray-300">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {Object.entries(groupedCommands).map(([category, items]) => (
            <div key={category} className="p-2">
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {categoryNames[category as keyof typeof categoryNames]}
              </div>
              {items.map((cmd, idx) => {
                const globalIndex = filteredCommands.indexOf(cmd);
                const isSelected = globalIndex === selectedIndex;

                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                      {cmd.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{cmd.label}</div>
                      {cmd.description && (
                        <div className="text-xs text-gray-500">{cmd.description}</div>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 border border-gray-300">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Search className="mx-auto mb-2 text-gray-400" size={32} />
              <p>No commands found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300">ESC</kbd>
              Close
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command size={12} />
            <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300">Ctrl+K</kbd>
          </span>
        </div>
      </div>
    </div>
  );
};

// Hook to manage command palette
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
};
