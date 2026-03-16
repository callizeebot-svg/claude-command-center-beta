'use client';

import { useState, useRef, useCallback } from 'react';
import type { CollaboratorStateHook } from './useCollaboratorState';

interface TouchRef {
  lastTouchDistance: number | null;
  lastTouchCenter: { x: number; y: number } | null;
  isPinching: boolean;
}

function getTouchDistance(touches: React.TouchList): number | null {
  if (touches.length < 2) return null;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchCenter(touches: React.TouchList): { x: number; y: number } {
  if (touches.length < 2) {
    return { x: touches[0].clientX, y: touches[0].clientY };
  }
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

export function useCollaboratorGestures(state: CollaboratorStateHook) {
  const { panOffset, setPanOffset, zoom, setZoom, setSelectedTileId } = state;

  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef({ startX: 0, startY: 0 });
  const touchRef = useRef<TouchRef>({
    lastTouchDistance: null,
    lastTouchCenter: null,
    isPinching: false,
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan on canvas background, not on tiles
    if ((e.target as HTMLElement).closest('.canvas-tile')) return;
    if ((e.target as HTMLElement).closest('.canvas-toolbar')) return;

    setIsPanning(true);
    panRef.current = { startX: e.clientX - panOffset.x, startY: e.clientY - panOffset.y };
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panRef.current.startX,
        y: e.clientY - panRef.current.startY,
      });
    }
  }, [isPanning, setPanOffset]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      setZoom((prev: number) => Math.min(3, Math.max(0.2, prev + delta)));
    }
  }, [setZoom]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.canvas-tile')) return;

    if (e.touches.length === 2) {
      e.preventDefault();
      touchRef.current.isPinching = true;
      touchRef.current.lastTouchDistance = getTouchDistance(e.touches);
      touchRef.current.lastTouchCenter = getTouchCenter(e.touches);
    } else if (e.touches.length === 1) {
      setIsPanning(true);
      panRef.current = {
        startX: e.touches[0].clientX - panOffset.x,
        startY: e.touches[0].clientY - panOffset.y,
      };
    }
  }, [panOffset]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.canvas-tile')) return;

    if (e.touches.length === 2 && touchRef.current.isPinching) {
      e.preventDefault();
      const newDistance = getTouchDistance(e.touches);
      const newCenter = getTouchCenter(e.touches);

      if (newDistance && touchRef.current.lastTouchDistance) {
        const scale = newDistance / touchRef.current.lastTouchDistance;
        const newZoom = Math.min(3, Math.max(0.2, zoom * scale));
        setZoom(newZoom);
      }

      if (touchRef.current.lastTouchCenter && newCenter) {
        const dx = newCenter.x - touchRef.current.lastTouchCenter.x;
        const dy = newCenter.y - touchRef.current.lastTouchCenter.y;
        setPanOffset((prev: { x: number; y: number }) => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));
      }

      touchRef.current.lastTouchDistance = newDistance;
      touchRef.current.lastTouchCenter = newCenter;
    } else if (e.touches.length === 1 && isPanning && !touchRef.current.isPinching) {
      setPanOffset({
        x: e.touches[0].clientX - panRef.current.startX,
        y: e.touches[0].clientY - panRef.current.startY,
      });
    }
  }, [isPanning, zoom, setZoom, setPanOffset]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchRef.current.isPinching = false;
      touchRef.current.lastTouchDistance = null;
      touchRef.current.lastTouchCenter = null;
    }
    if (e.touches.length === 0) {
      setIsPanning(false);
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.canvas-tile')) {
      setSelectedTileId(null);
    }
  }, [setSelectedTileId]);

  return {
    isPanning,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onWheel: handleWheel,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onClick: handleClick,
    },
  };
}
