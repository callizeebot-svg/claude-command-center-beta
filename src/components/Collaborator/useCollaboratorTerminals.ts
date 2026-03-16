'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isElectron } from '@/hooks/useElectron';
import type { AgentEvent, AgentStatus } from '@/types/electron';
import type { CanvasTile } from './types';

const MAX_OUTPUT_CHARS = 200_000;

function trimOutput(output: string): string {
  if (output.length <= MAX_OUTPUT_CHARS) return output;
  return output.slice(output.length - MAX_OUTPUT_CHARS);
}

/**
 * Manages terminal sessions for Collaborator canvas tiles.
 * Each terminal tile gets its own Dorothy agent instance.
 */
export function useCollaboratorTerminals(
  tiles: CanvasTile[],
  updateTile: (id: string, updates: Partial<CanvasTile>) => void,
) {
  const [, setVersion] = useState(0);
  const tileAgentMap = useRef<Map<string, string>>(new Map()); // tileId -> agentId
  const agentTileMap = useRef<Map<string, string>>(new Map()); // agentId -> tileId

  // Listen for agent output events
  useEffect(() => {
    if (!isElectron()) return;

    const cleanupOutput = window.electronAPI?.agent?.onOutput?.((event: AgentEvent) => {
      const tileId = agentTileMap.current.get(event.agentId);
      if (!tileId) return;

      const tile = tiles.find((t) => t.id === tileId);
      if (!tile) return;

      const newOutput = trimOutput((tile.output || '') + event.data);
      updateTile(tileId, { output: newOutput, status: 'running' });
      setVersion((v) => v + 1);
    });

    const cleanupComplete = window.electronAPI?.agent?.onComplete?.((event: AgentEvent) => {
      const tileId = agentTileMap.current.get(event.agentId);
      if (!tileId) return;

      updateTile(tileId, {
        status: (event.exitCode ?? 0) === 0 ? 'completed' : 'error',
      });
      setVersion((v) => v + 1);
    });

    const cleanupStatus = window.electronAPI?.agent?.onStatus?.((event: { type: string; agentId: string; status: string; timestamp: string }) => {
      const tileId = agentTileMap.current.get(event.agentId);
      if (!tileId) return;

      updateTile(tileId, {
        status: event.status as CanvasTile['status'],
      });
      setVersion((v) => v + 1);
    });

    return () => {
      cleanupOutput?.();
      cleanupComplete?.();
      cleanupStatus?.();
    };
  }, [tiles, updateTile]);

  // Restore agent mappings for tiles that already have agentIds (from persisted state)
  useEffect(() => {
    for (const tile of tiles) {
      if (tile.type === 'terminal' && tile.agentId) {
        tileAgentMap.current.set(tile.id, tile.agentId);
        agentTileMap.current.set(tile.agentId, tile.id);
      }
    }
  }, [tiles]);

  const startTerminal = useCallback(async (tileId: string, projectPath: string, cols?: number, rows?: number) => {
    if (!isElectron() || !window.electronAPI?.agent?.create || !window.electronAPI?.agent?.start) return;

    const tile = tiles.find((t) => t.id === tileId);
    if (!tile) return;

    updateTile(tileId, { status: 'starting', projectPath });

    try {
      let agentId = tileAgentMap.current.get(tileId);
      let agent: AgentStatus | null = null;

      // Try to get existing agent
      if (agentId) {
        agent = await window.electronAPI.agent.get(agentId);
      }

      // Create new agent if needed
      if (!agent) {
        agent = await window.electronAPI.agent.create({
          projectPath,
          skills: [],
          name: `Collab · ${projectPath.split('/').pop() || 'Terminal'}`,
          skipPermissions: true,
          provider: 'claude',
          source: 'manual',
          workspaceRootPath: projectPath,
        });
      }

      // Store mappings
      tileAgentMap.current.set(tileId, agent.id);
      agentTileMap.current.set(agent.id, tileId);
      updateTile(tileId, { agentId: agent.id });

      // If already running, just sync output
      if (agent.ptyId && (agent.status === 'running' || agent.status === 'waiting')) {
        const output = agent.output?.join('') || '';
        updateTile(tileId, {
          status: agent.status,
          output: trimOutput(output),
        });
        if (typeof cols === 'number' && typeof rows === 'number') {
          await window.electronAPI.agent.resize({ id: agent.id, cols, rows }).catch(() => {});
        }
        return;
      }

      // Start agent
      updateTile(tileId, {
        output: `\x1b[90mLaunching Claude Code in ${projectPath}\x1b[0m\r\n`,
      });

      await window.electronAPI.agent.start({
        id: agent.id,
        prompt: '',
        options: { provider: agent.provider || 'claude' },
      });

      if (typeof cols === 'number' && typeof rows === 'number') {
        await window.electronAPI.agent.resize({ id: agent.id, cols, rows }).catch(() => {});
      }

      // Refresh agent data
      const refreshed = await window.electronAPI.agent.get(agent.id);
      if (refreshed) {
        const output = refreshed.output?.join('') || '';
        updateTile(tileId, {
          status: refreshed.status,
          output: trimOutput(output),
        });
      }
    } catch (err) {
      updateTile(tileId, {
        status: 'error',
        output: `\r\n\x1b[31mFailed to start: ${err instanceof Error ? err.message : 'Unknown error'}\x1b[0m\r\n`,
      });
    }
  }, [tiles, updateTile]);

  const stopTerminal = useCallback(async (tileId: string) => {
    if (!isElectron() || !window.electronAPI?.agent?.stop) return;

    const agentId = tileAgentMap.current.get(tileId);
    if (!agentId) return;

    await window.electronAPI.agent.stop(agentId);
    updateTile(tileId, { status: 'stopped' });
  }, [updateTile]);

  const sendInput = useCallback(async (tileId: string, data: string) => {
    if (!isElectron() || !window.electronAPI?.agent?.sendInput) return;

    const agentId = tileAgentMap.current.get(tileId);
    if (!agentId) return;

    await window.electronAPI.agent.sendInput({ id: agentId, input: data });
  }, []);

  const resizeTerminal = useCallback(async (tileId: string, cols: number, rows: number) => {
    if (!isElectron() || !window.electronAPI?.agent?.resize) return;

    const agentId = tileAgentMap.current.get(tileId);
    if (!agentId) return;

    await window.electronAPI.agent.resize({ id: agentId, cols, rows });
  }, []);

  const clearOutput = useCallback((tileId: string) => {
    updateTile(tileId, { output: '' });
  }, [updateTile]);

  return {
    startTerminal,
    stopTerminal,
    sendInput,
    resizeTerminal,
    clearOutput,
  };
}
