import { useState, useCallback, useEffect } from 'react';

/**
 * Hook para gerenciar histórico de Undo/Redo
 * Útil para editores de código, canvas, etc.
 *
 * @param initialState Estado inicial
 * @param maxHistory Número máximo de estados no histórico (padrão: 50)
 * @returns { state, setState, undo, redo, canUndo, canRedo, clearHistory }
 */
export function useUndoRedo<T>(
  initialState: T,
  maxHistory: number = 50
) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Estado atual é o item no índice atual do histórico
  const state = history[currentIndex];

  /**
   * Atualiza o estado e adiciona ao histórico
   */
  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory((prevHistory) => {
      const resolvedState = typeof newState === 'function'
        ? (newState as (prev: T) => T)(prevHistory[currentIndex])
        : newState;

      // Remove estados futuros se estamos no meio do histórico
      const newHistory = prevHistory.slice(0, currentIndex + 1);

      // Adiciona novo estado
      newHistory.push(resolvedState);

      // Limita tamanho do histórico
      if (newHistory.length > maxHistory) {
        newHistory.shift(); // Remove o mais antigo
        return newHistory;
      }

      return newHistory;
    });

    setCurrentIndex((prev) => {
      // Se estamos no limite do histórico, não incrementa mais
      if (history.length >= maxHistory && currentIndex === maxHistory - 1) {
        return maxHistory - 1;
      }
      return prev + 1;
    });
  }, [currentIndex, history.length, maxHistory]);

  /**
   * Desfaz a última ação
   */
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  /**
   * Refaz a ação desfeita
   */
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history.length]);

  /**
   * Limpa todo o histórico e reseta para o estado atual
   */
  const clearHistory = useCallback(() => {
    setHistory([state]);
    setCurrentIndex(0);
  }, [state]);

  /**
   * Reseta para um estado específico sem afetar histórico
   */
  const reset = useCallback((newState: T) => {
    setHistory([newState]);
    setCurrentIndex(0);
  }, []);

  // Verifica se pode desfazer/refazer
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Atalhos de teclado (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo(); // Ctrl+Shift+Z = Redo
        } else {
          undo(); // Ctrl+Z = Undo
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo(); // Ctrl+Y = Redo
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    reset,
    historySize: history.length,
    currentIndex,
  };
}
