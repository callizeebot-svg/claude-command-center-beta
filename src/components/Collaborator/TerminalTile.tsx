'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GripHorizontal, Play, Square, Trash2, X, Maximize2, Minimize2 } from 'lucide-react';
import { useXtermTerminal } from '@/hooks/useXtermTerminal';
import { getTerminalTheme } from '@/components/AgentWorld/constants';
import { useStore } from '@/store';
import { isElectron } from '@/hooks/useElectron';
import type { CanvasTile } from './types';

interface TerminalTileProps {
  tile: CanvasTile;
  isSelected: boolean;
  zoom: number;
  onSelect: () => void;
  onClose: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onStart: (cols?: number, rows?: number) => void;
  onStop: () => void;
  onSendInput: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
  onClear: () => void;
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  idle: { text: 'Idle', color: 'text-zinc-500' },
  starting: { text: 'Starting...', color: 'text-amber-400' },
  running: { text: 'Running', color: 'text-green-400' },
  waiting: { text: 'Waiting', color: 'text-amber-400' },
  completed: { text: 'Done', color: 'text-cyan-400' },
  error: { text: 'Error', color: 'text-red-400' },
  stopped: { text: 'Stopped', color: 'text-zinc-500' },
};

const EMPTY_MESSAGE = '\x1b[90mClick ▶ Start to launch an agent in this tile.\x1b[0m\r\n';

export default function TerminalTile({
  tile,
  isSelected,
  zoom,
  onSelect,
  onClose,
  onDragStart,
  onResizeStart,
  onStart,
  onStop,
  onSendInput,
  onResize,
  onClear,
}: TerminalTileProps) {
  const { darkMode } = useStore();
  const renderedOutputRef = useRef('');
  const showingPlaceholderRef = useRef(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const { terminalRef, isReady, write, clear, focus, fit, getSize } = useXtermTerminal(true, {
    theme: getTerminalTheme(darkMode ? 'dark' : 'light'),
    fontSize: 12,
    onData: (data) => {
      onSendInput(data);
    },
    onResize: (cols, rows) => {
      onResize(cols, rows);
    },
  });

  // Sync output to terminal
  useEffect(() => {
    if (!isReady) return;
    const nextOutput = tile.output || '';

    // Full re-render if output was reset or diverged
    if (nextOutput.length < renderedOutputRef.current.length || !nextOutput.startsWith(renderedOutputRef.current)) {
      clear();
      if (nextOutput) {
        write(nextOutput);
        showingPlaceholderRef.current = false;
      } else {
        write(EMPTY_MESSAGE);
        showingPlaceholderRef.current = true;
      }
      renderedOutputRef.current = nextOutput;
      return;
    }

    // Incremental append
    if (nextOutput.length > renderedOutputRef.current.length) {
      if (showingPlaceholderRef.current) {
        clear();
        write(nextOutput);
        showingPlaceholderRef.current = false;
      } else {
        write(nextOutput.slice(renderedOutputRef.current.length));
      }
      renderedOutputRef.current = nextOutput;
      return;
    }

    // Show placeholder if no output
    if (!nextOutput && !showingPlaceholderRef.current) {
      clear();
      write(EMPTY_MESSAGE);
      renderedOutputRef.current = '';
      showingPlaceholderRef.current = true;
    }
  }, [clear, isReady, tile.output, write]);

  // Re-fit terminal when tile size changes or on ready
  useEffect(() => {
    if (!isReady) return;
    const timers = [
      window.setTimeout(() => fit(), 10),
      window.setTimeout(() => fit(), 120),
      window.setTimeout(() => fit(), 300),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [isReady, fit, tile.size.width, tile.size.height, isMaximized]);

  const handleStart = useCallback(() => {
    if (!tile.projectPath && isElectron()) {
      // Open folder picker
      window.electronAPI?.dialog?.openFolder().then((folderPath) => {
        if (folderPath) {
          const size = getSize();
          onStart(size?.cols, size?.rows);
        }
      });
      return;
    }
    const size = getSize();
    onStart(size?.cols, size?.rows);
    focus();
  }, [tile.projectPath, getSize, onStart, focus]);

  const statusInfo = STATUS_LABELS[tile.status || 'idle'] || STATUS_LABELS.idle;
  const isRunning = tile.status === 'running' || tile.status === 'waiting';

  return (
    <div
      className={`canvas-tile absolute flex flex-col rounded-xl border bg-[#0D0B08] shadow-2xl transition-shadow ${
        isSelected
          ? 'border-primary/60 shadow-primary/10 ring-1 ring-primary/30'
          : 'border-zinc-700/50 hover:border-zinc-600/60'
      } ${isMaximized ? 'fixed inset-4 z-[100]' : ''}`}
      style={
        isMaximized
          ? undefined
          : {
              left: tile.position.x,
              top: tile.position.y,
              width: tile.size.width,
              height: tile.size.height,
            }
      }
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Title bar - draggable */}
      <div
        className="flex items-center justify-between border-b border-zinc-700/50 px-3 py-2 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={(e) => {
          if (isMaximized) return;
          if ((e.target as HTMLElement).closest('button')) return;
          e.stopPropagation();
          onDragStart(e);
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
          <span className="text-xs font-medium text-zinc-300 truncate">{tile.title}</span>
          <span className={`text-[10px] ${statusInfo.color}`}>
            {isRunning && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current mr-1 animate-pulse" />
            )}
            {statusInfo.text}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isRunning && (
            <button
              type="button"
              onClick={handleStart}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-green-400 transition-colors"
              title="Start agent"
            >
              <Play className="h-3.5 w-3.5" />
            </button>
          )}
          {isRunning && (
            <button
              type="button"
              onClick={onStop}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors"
              title="Stop agent"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
            title="Clear output"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors"
            title="Close tile"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal body */}
      <div className="flex-1 min-h-0 p-1">
        <div
          ref={terminalRef}
          onClick={focus}
          className="h-full w-full rounded-lg"
          style={{ background: '#0D0B08' }}
        />
      </div>

      {/* Resize handle */}
      {!isMaximized && (
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
      )}
    </div>
  );
}
