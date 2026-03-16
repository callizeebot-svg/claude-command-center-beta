'use client';

import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Terminal,
  StickyNote,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  FolderOpen,
} from 'lucide-react';
import { isElectron } from '@/hooks/useElectron';
import { useCollaboratorState } from './useCollaboratorState';
import { useCollaboratorGestures } from './useCollaboratorGestures';
import { useCollaboratorTerminals } from './useCollaboratorTerminals';
import TerminalTile from './TerminalTile';
import NoteTile from './NoteTile';

function DotGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="collabDotPattern" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="16" cy="16" r="1" fill="rgba(255,255,255,0.06)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#collabDotPattern)" />
      </svg>
    </div>
  );
}

export default function CollaboratorCanvas() {
  const state = useCollaboratorState();
  const {
    tiles,
    zoom,
    panOffset,
    selectedTileId,
    setZoom,
    addTerminalTile,
    addNoteTile,
    removeTile,
    updateTile,
    moveTile,
    resizeTile,
    bringToFront,
    resetView,
  } = state;

  const { isPanning, handlers: gestureHandlers } = useCollaboratorGestures(state);
  const terminals = useCollaboratorTerminals(tiles, updateTile);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const dragRef = useRef<{ tileId: string; startX: number; startY: number } | null>(null);
  const resizeRef = useRef<{ tileId: string; startX: number; startY: number } | null>(null);

  // Tile dragging
  const handleTileDragStart = useCallback((tileId: string, e: React.MouseEvent) => {
    bringToFront(tileId);
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMove = (me: MouseEvent) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      moveTile(tileId, { x: dx, y: dy });
      // Reset for next delta
      dragRef.current = { tileId, startX: me.clientX, startY: me.clientY };
    };

    const handleUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    dragRef.current = { tileId, startX, startY };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [bringToFront, moveTile]);

  // Tile resizing
  const handleTileResizeStart = useCallback((tileId: string, e: React.MouseEvent) => {
    bringToFront(tileId);
    let lastX = e.clientX;
    let lastY = e.clientY;

    const handleMove = (me: MouseEvent) => {
      const dw = me.clientX - lastX;
      const dh = me.clientY - lastY;
      resizeTile(tileId, { width: dw, height: dh });
      lastX = me.clientX;
      lastY = me.clientY;
    };

    const handleUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    resizeRef.current = { tileId, startX: e.clientX, startY: e.clientY };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [bringToFront, resizeTile]);

  // Add terminal with folder picker
  const handleAddTerminal = useCallback(async () => {
    setShowAddMenu(false);
    if (isElectron() && window.electronAPI?.dialog?.openFolder) {
      const folderPath = await window.electronAPI.dialog.openFolder();
      if (folderPath) {
        const tileId = addTerminalTile(folderPath);
        // Auto-start after a brief delay for terminal to initialize
        setTimeout(() => {
          terminals.startTerminal(tileId, folderPath);
        }, 500);
      }
    } else {
      addTerminalTile();
    }
  }, [addTerminalTile, terminals]);

  const handleAddNote = useCallback(() => {
    setShowAddMenu(false);
    addNoteTile();
  }, [addNoteTile]);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div
      className={`relative w-full h-full bg-[#0A0908] overflow-hidden touch-none select-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      {...gestureHandlers}
    >
      <DotGrid />

      {/* Toolbar */}
      <div className="canvas-toolbar absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl border border-zinc-700/50 bg-zinc-900/90 px-3 py-2 backdrop-blur-sm shadow-xl">
        {/* Add button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Tile
          </button>

          {showAddMenu && (
            <div className="absolute top-full left-0 mt-2 w-48 rounded-xl border border-zinc-700/50 bg-zinc-900 shadow-xl overflow-hidden">
              <button
                type="button"
                onClick={handleAddTerminal}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <Terminal className="h-4 w-4 text-green-400" />
                Agent Terminal
              </button>
              <button
                type="button"
                onClick={handleAddNote}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <StickyNote className="h-4 w-4 text-amber-400" />
                Note
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-zinc-700/50" />

        {/* Zoom controls */}
        <button
          type="button"
          onClick={() => setZoom((z: number) => Math.max(0.2, z - 0.15))}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-[11px] text-zinc-500 font-mono w-10 text-center tabular-nums">
          {zoomPercent}%
        </span>
        <button
          type="button"
          onClick={() => setZoom((z: number) => Math.min(3, z + 0.15))}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <div className="w-px h-5 bg-zinc-700/50" />

        {/* Reset view */}
        <button
          type="button"
          onClick={resetView}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          title="Reset view (Cmd+F)"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Canvas transform layer */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Render tiles */}
        {tiles.map((tile) => {
          if (tile.type === 'terminal') {
            return (
              <TerminalTile
                key={tile.id}
                tile={tile}
                isSelected={selectedTileId === tile.id}
                zoom={zoom}
                onSelect={() => bringToFront(tile.id)}
                onClose={() => {
                  terminals.stopTerminal(tile.id).catch(() => {});
                  removeTile(tile.id);
                }}
                onDragStart={(e) => handleTileDragStart(tile.id, e)}
                onResizeStart={(e) => handleTileResizeStart(tile.id, e)}
                onStart={(cols, rows) => {
                  if (tile.projectPath) {
                    terminals.startTerminal(tile.id, tile.projectPath, cols, rows);
                  }
                }}
                onStop={() => terminals.stopTerminal(tile.id)}
                onSendInput={(data) => terminals.sendInput(tile.id, data)}
                onResize={(cols, rows) => terminals.resizeTerminal(tile.id, cols, rows)}
                onClear={() => terminals.clearOutput(tile.id)}
              />
            );
          }

          if (tile.type === 'note') {
            return (
              <NoteTile
                key={tile.id}
                tile={tile}
                isSelected={selectedTileId === tile.id}
                onSelect={() => bringToFront(tile.id)}
                onClose={() => removeTile(tile.id)}
                onDragStart={(e) => handleTileDragStart(tile.id, e)}
                onResizeStart={(e) => handleTileResizeStart(tile.id, e)}
                onUpdate={(updates) => updateTile(tile.id, updates)}
              />
            );
          }

          return null;
        })}
      </div>

      {/* Status bar */}
      <div className="absolute bottom-4 left-4 z-40 flex items-center gap-3">
        <span className="text-xs font-mono text-zinc-700 italic">Collaborator</span>
        <span className="text-[10px] text-zinc-600 font-mono tabular-nums">
          {tiles.length} tile{tiles.length !== 1 ? 's' : ''}
        </span>
        <span className="text-[10px] text-zinc-600 font-mono tabular-nums">
          {tiles.filter((t) => t.type === 'terminal' && (t.status === 'running' || t.status === 'waiting')).length} active
        </span>
      </div>

      {/* Empty state */}
      {tiles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-center">
              <Terminal className="h-7 w-7 text-zinc-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">No tiles yet</p>
              <p className="text-xs text-zinc-600 mt-1">Click "Add Tile" to place an agent terminal on the canvas</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
