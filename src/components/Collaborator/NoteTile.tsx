'use client';

import { useCallback, useRef, useState } from 'react';
import { GripHorizontal, X, StickyNote } from 'lucide-react';
import type { CanvasTile } from './types';

interface NoteTileProps {
  tile: CanvasTile;
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onUpdate: (updates: Partial<CanvasTile>) => void;
}

export default function NoteTile({
  tile,
  isSelected,
  onSelect,
  onClose,
  onDragStart,
  onResizeStart,
  onUpdate,
}: NoteTileProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleTitleDoubleClick = useCallback(() => {
    setIsEditingTitle(true);
    requestAnimationFrame(() => titleInputRef.current?.select());
  }, []);

  const handleTitleBlur = useCallback(() => {
    setIsEditingTitle(false);
  }, []);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
    }
  }, []);

  return (
    <div
      className={`canvas-tile absolute flex flex-col rounded-xl border shadow-xl transition-shadow ${
        isSelected
          ? 'border-amber-500/50 shadow-amber-500/10 ring-1 ring-amber-500/20'
          : 'border-zinc-700/50 hover:border-zinc-600/60'
      }`}
      style={{
        left: tile.position.x,
        top: tile.position.y,
        width: tile.size.width,
        height: tile.size.height,
        background: '#1a1814',
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between border-b border-zinc-700/40 px-3 py-2 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          if ((e.target as HTMLElement).closest('input')) return;
          e.stopPropagation();
          onDragStart(e);
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
          <StickyNote className="h-3.5 w-3.5 text-amber-500/60 shrink-0" />
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              className="text-xs font-medium text-zinc-300 bg-transparent border-b border-zinc-600 outline-none w-full"
              value={tile.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              autoFocus
            />
          ) : (
            <span
              className="text-xs font-medium text-zinc-300 truncate cursor-text"
              onDoubleClick={handleTitleDoubleClick}
            >
              {tile.title}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors shrink-0"
          title="Close note"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Note content */}
      <textarea
        className="flex-1 min-h-0 w-full resize-none bg-transparent p-3 text-sm text-zinc-300 placeholder-zinc-600 outline-none"
        placeholder="Type your notes here..."
        value={tile.content || ''}
        onChange={(e) => onUpdate({ content: e.target.value })}
      />

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={(e) => {
          e.stopPropagation();
          onResizeStart(e);
        }}
      >
        <svg viewBox="0 0 16 16" className="w-full h-full text-zinc-600">
          <path d="M14 14L8 14L14 8Z" fill="currentColor" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}
