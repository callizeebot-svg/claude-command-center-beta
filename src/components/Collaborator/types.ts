export interface CanvasTile {
  id: string;
  type: 'terminal' | 'note';
  position: { x: number; y: number };
  size: { width: number; height: number };
  title: string;
  // Terminal-specific
  agentId?: string;
  projectPath?: string;
  status?: 'idle' | 'starting' | 'running' | 'waiting' | 'completed' | 'error' | 'stopped';
  output?: string;
  // Note-specific
  content?: string;
}

export interface CollaboratorState {
  tiles: CanvasTile[];
  panOffset: { x: number; y: number };
  zoom: number;
}

export const COLLABORATOR_STATE_KEY = 'collaborator-canvas-state';
export const MIN_TILE_WIDTH = 320;
export const MIN_TILE_HEIGHT = 200;
export const DEFAULT_TERMINAL_SIZE = { width: 560, height: 380 };
export const DEFAULT_NOTE_SIZE = { width: 300, height: 200 };
