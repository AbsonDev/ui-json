import React from 'react';
import { Undo2, Redo2 } from 'lucide-react';

interface UndoRedoButtonsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  currentIndex?: number;
  historySize?: number;
}

export const UndoRedoButtons: React.FC<UndoRedoButtonsProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  currentIndex,
  historySize,
}) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="p-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-gray-200 enabled:text-gray-700 text-gray-400"
        title="Desfazer (Ctrl+Z)"
      >
        <Undo2 size={18} />
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="p-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-gray-200 enabled:text-gray-700 text-gray-400"
        title="Refazer (Ctrl+Y / Ctrl+Shift+Z)"
      >
        <Redo2 size={18} />
      </button>

      {currentIndex !== undefined && historySize !== undefined && (
        <span className="text-xs text-gray-500 ml-1">
          {currentIndex + 1}/{historySize}
        </span>
      )}
    </div>
  );
};
