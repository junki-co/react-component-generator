export function loadStored<T>(
  key: string,
  fallback: T,
  parse?: (raw: unknown) => T | undefined,
): T {
  try {
    const text = localStorage.getItem(key);
    if (text === null) return fallback;
    const raw: unknown = JSON.parse(text);
    if (!parse) return raw as T;
    const parsed = parse(raw);
    return parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function saveStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 용량 초과·사생활 보호 모드 등에서는 저장을 포기하고 앱은 계속 동작한다.
  }
}
