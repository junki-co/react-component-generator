import { useState, useEffect } from 'react';
import { loadStored, saveStored } from '../utils/storage';

export function usePersistentState<T>(
  key: string,
  initial: T,
  parse?: (raw: unknown) => T | undefined,
) {
  const [value, setValue] = useState<T>(() => loadStored(key, initial, parse));

  useEffect(() => {
    saveStored(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
