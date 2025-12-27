'use client'

import React, { useRef } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { Skeleton } from './Skeleton'

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
  readOnly?: boolean
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  height = '100%',
  readOnly = false,
}) => {
  const { theme, systemTheme } = useTheme()
  const editorRef = useRef<any>(null)

  const currentTheme = theme === 'system' ? systemTheme : theme
  const monacoTheme = currentTheme === 'dark' ? 'vs-dark' : 'vs-light'

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Configure JSON validation
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: true,
    })

    // Add custom keyboard shortcuts
    editor.addAction({
      id: 'format-json',
      label: 'Format JSON',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
      run: (ed) => {
        ed.getAction('editor.action.formatDocument')?.run()
      },
    })
  }

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value)
    }
  }

  return (
    <Editor
      height={height}
      defaultLanguage="json"
      value={value}
      onChange={handleChange}
      theme={monacoTheme}
      loading={
        <div className="w-full h-full bg-gray-50 dark:bg-gray-900 p-4">
          <Skeleton className="w-full h-4 mb-2" />
          <Skeleton className="w-3/4 h-4 mb-2" />
          <Skeleton className="w-5/6 h-4 mb-2" />
          <Skeleton className="w-2/3 h-4 mb-2" />
          <Skeleton className="w-4/5 h-4" />
        </div>
      }
      options={{
        readOnly,
        minimap: {
          enabled: true,
        },
        fontSize: 14,
        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', 'Monaco', monospace",
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
        suggest: {
          showWords: true,
          showSnippets: true,
        },
        quickSuggestions: {
          other: true,
          strings: true,
        },
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'always',
        matchBrackets: 'always',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        cursorBlinking: 'smooth',
        smoothScrolling: true,
        padding: {
          top: 16,
          bottom: 16,
        },
      }}
      onMount={handleEditorDidMount}
    />
  )
}
