'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Command, Search, Save, Undo, Redo, Copy, Code, Eye, Palette, HelpCircle } from 'lucide-react'

interface Shortcut {
  keys: string[]
  description: string
  icon?: React.ReactNode
}

interface ShortcutCategory {
  category: string
  shortcuts: Shortcut[]
}

const SHORTCUTS: ShortcutCategory[] = [
  {
    category: 'General',
    shortcuts: [
      { keys: ['Cmd', 'K'], description: 'Open command palette', icon: <Command size={16} /> },
      { keys: ['?'], description: 'Show keyboard shortcuts', icon: <HelpCircle size={16} /> },
      { keys: ['Cmd', 'S'], description: 'Save current app', icon: <Save size={16} /> },
      { keys: ['Esc'], description: 'Close dialog/modal', icon: <X size={16} /> },
    ],
  },
  {
    category: 'Editor',
    shortcuts: [
      { keys: ['Cmd', 'F'], description: 'Find in editor', icon: <Search size={16} /> },
      { keys: ['Cmd', 'Shift', 'F'], description: 'Format JSON', icon: <Code size={16} /> },
      { keys: ['Cmd', 'Z'], description: 'Undo', icon: <Undo size={16} /> },
      { keys: ['Cmd', 'Shift', 'Z'], description: 'Redo', icon: <Redo size={16} /> },
      { keys: ['Cmd', 'C'], description: 'Copy', icon: <Copy size={16} /> },
    ],
  },
  {
    category: 'View',
    shortcuts: [
      { keys: ['Cmd', 'P'], description: 'Toggle preview', icon: <Eye size={16} /> },
      { keys: ['Cmd', 'B'], description: 'Toggle sidebar', icon: <Palette size={16} /> },
    ],
  },
]

export const KeyboardShortcutsOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with "?" key
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        // Don't trigger if user is typing in an input
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return
        }
        e.preventDefault()
        setIsOpen(true)
      }

      // Close with Esc
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const formatKey = (key: string) => {
    if (key === 'Cmd') return isMac ? '⌘' : 'Ctrl'
    if (key === 'Shift') return '⇧'
    if (key === 'Alt') return '⌥'
    if (key === 'Ctrl') return isMac ? '⌃' : 'Ctrl'
    return key
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1400]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-0 z-[1401] flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Keyboard Shortcuts
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Press <kbd className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">?</kbd> anytime to toggle
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                  aria-label="Close shortcuts"
                >
                  <X size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                <div className="space-y-8">
                  {SHORTCUTS.map((section, idx) => (
                    <motion.div
                      key={section.category}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        {section.category}
                      </h3>
                      <div className="grid gap-3">
                        {section.shortcuts.map((shortcut, shortcutIdx) => (
                          <motion.div
                            key={shortcutIdx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (idx * 0.1) + (shortcutIdx * 0.05) }}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              {shortcut.icon && (
                                <div className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {shortcut.icon}
                                </div>
                              )}
                              <span className="text-gray-700 dark:text-gray-300">
                                {shortcut.description}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              {shortcut.keys.map((key, keyIdx) => (
                                <React.Fragment key={keyIdx}>
                                  <kbd className="px-3 py-1.5 text-sm font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 shadow-sm min-w-[2.5rem] text-center">
                                    {formatKey(key)}
                                  </kbd>
                                  {keyIdx < shortcut.keys.length - 1 && (
                                    <span className="text-gray-400 dark:text-gray-500 mx-1 self-center">+</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  {isMac ? '⌘ = Command key' : 'Ctrl = Control key'} • Press <kbd className="px-2 py-1 text-xs bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Esc</kbd> to close
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
