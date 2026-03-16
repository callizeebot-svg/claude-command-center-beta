'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  COLLABORATOR_STATE_KEY,
  DEFAULT_TERMINAL_SIZE,
  DEFAULT_NOTE_SIZE,
  MIN_TILE_WIDTH,
  MIN_TILE_HEIGHT,
} from './types';
import type { CanvasTile, CollaboratorState } from './types';

function loadSavedState(): Partial<CollaboratorState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(COLLABORATOR_STATE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return null;
}

function generateId() {
  return `tile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useCollaboratorState() {
  const savedState = useMemo(() => loadSavedState(), []);

  const [tiles, setTiles] = useState<CanvasTile[]>(savedState?.tiles || []);
  const [zoom, setZoom] = useState(savedState?.zoom || 1);
  const [panOffset, setPanOffset] = useState(savedState?.panOffset || { x: 0, y: 0 });
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);

  // Persist state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const state: CollaboratorState = { tiles, panOffset, zoom };
    try {
      localStorage.setItem(COLLABORATOR_STATE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [tiles, panOffset, zoom]);

  const addTerminalTile = useCallback((projectPath?: string) => {
    const id = generateId();
    // Place new tiles in the visible area based on current pan offset
    const baseX = (-panOffset.x + 100) / zoom;
    const baseY = (-panOffset.y + 100) / zoom;
    // Offset slightly for each new tile so they don't stack
    const offset = (tiles.length % 8) * 40;

    const tile: CanvasTile = {
      id,
      type: 'terminal',
      position: { x: baseX + offset, y: baseY + offset },
      size: DEFAULT_TERMINAL_SIZE,
      title: projectPath ? projectPath.split('/').pop() || 'Terminal' : 'Agent Terminal',
      projectPath,
      status: 'idle',
      output: '',
    };
    setTiles((prev) => [...prev, tile]);
    setSelectedTileId(id);
    return id;
  }, [panOffset, zoom, tiles.length]);

  const addNoteTile = useCallback(() => {
    const id = generateId();
    const baseX = (-panOffset.x + 120) / zoom;
    const baseY = (-panOffset.y + 120) / zoom;
    const offset = (tiles.length % 8) * 40;

    const tile: CanvasTile = {
      id,
      type: 'note',
      position: { x: baseX + offset, y: baseY + offset },
      size: DEFAULT_NOTE_SIZE,
      title: 'Note',
      content: '',
    };
    setTiles((prev) => [...prev, tile]);
    setSelectedTileId(id);
    return id;
  }, [panOffset, zoom, tiles.length]);

  const removeTile = useCallback((id: string) => {
    setTiles((prev) => prev.filter((t) => t.id !== id));
    setSelectedTileId((prev) => (prev === id ? null : prev));
  }, []);

  const updateTile = useCallback((id: string, updates: Partial<CanvasTile>) => {
    setTiles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const moveTile = useCallback((id: string, delta: { x: number; y: number }) => {
    setTiles((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, position: { x: t.position.x + delta.x / zoom, y: t.position.y + delta.y / zoom } }
          : t
      )
    );
  }, [zoom]);

  const resizeTile = useCallback((id: string, delta: { width: number; height: number }) => {
    setTiles((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              size: {
                width: Math.max(MIN_TILE_WIDTH, t.size.width + delta.width / zoom),
                height: Math.max(MIN_TILE_HEIGHT, t.size.height + delta.height / zoom),
              },
            }
          : t
      )
    );
  }, [zoom]);

  const bringToFront = useCallback((id: string) => {
    setTiles((prev) => {
      const tile = prev.find((t) => t.id === id);
      if (!tile) return prev;
      return [...prev.filter((t) => t.id !== id), tile];
    });
    setSelectedTileId(id);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedTileId(null);
  }, []);

  return {
    tiles,
    zoom,
    panOffset,
    selectedTileId,
    setZoom,
    setPanOffset,
    setSelectedTileId,
    addTerminalTile,
    addNoteTile,
    removeTile,
    updateTile,
    moveTile,
    resizeTile,
    bringToFront,
    resetView,
  };
}

export type CollaboratorStateHook = ReturnType<typeof useCollaboratorState>;
