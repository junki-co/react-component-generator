import { useState, useCallback, useEffect } from 'react';
import type { GeneratedComponent, Provider } from '../types';
import { loadStored, saveStored } from '../utils/storage';

export const COMPONENTS_KEY = 'rcg:components';
export const HISTORY_KEY = 'rcg:history';
const MAX_COMPONENTS = 50;
const MAX_HISTORY = 20;

function parseComponents(raw: unknown): GeneratedComponent[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items: GeneratedComponent[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item.id === 'string' &&
      typeof item.prompt === 'string' &&
      typeof item.code === 'string'
    ) {
      const createdAt = new Date(item.createdAt);
      if (!Number.isNaN(createdAt.getTime())) {
        items.push({ id: item.id, prompt: item.prompt, code: item.code, createdAt });
      }
    }
  }
  return items.slice(0, MAX_COMPONENTS);
}

function parseHistory(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.filter((v): v is string => typeof v === 'string').slice(0, MAX_HISTORY);
}

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  history: string[];
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useState<GeneratedComponent[]>(() =>
    loadStored(COMPONENTS_KEY, [], parseComponents),
  );
  const [history, setHistory] = useState<string[]>(() =>
    loadStored(HISTORY_KEY, [], parseHistory),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveStored(COMPONENTS_KEY, components);
  }, [components]);

  useEffect(() => {
    saveStored(HISTORY_KEY, history);
  }, [history]);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);
    setHistory((prev) => [prompt, ...prev.filter((p) => p !== prompt)].slice(0, MAX_HISTORY));

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate component');
      }

      const newComponent: GeneratedComponent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        prompt,
        code: data.code,
        createdAt: new Date(),
      };

      setComponents((prev) => [newComponent, ...prev].slice(0, MAX_COMPONENTS));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, []);

  return { components, history, isLoading, error, generate, removeComponent, clearAll };
}
