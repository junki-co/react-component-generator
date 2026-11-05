import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadStored, saveStored } from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('저장된 값이 없으면 fallback을 반환한다', () => {
    expect(loadStored('k', 'default')).toBe('default');
  });

  it('저장된 JSON을 파싱해 반환한다', () => {
    localStorage.setItem('k', JSON.stringify({ a: 1 }));
    expect(loadStored('k', { a: 0 })).toEqual({ a: 1 });
  });

  it('JSON이 깨져 있으면 fallback을 반환한다', () => {
    localStorage.setItem('k', '{broken');
    expect(loadStored('k', 'default')).toBe('default');
  });

  it('parse가 undefined를 반환하면 fallback을 반환한다', () => {
    localStorage.setItem('k', JSON.stringify(123));
    expect(loadStored('k', 'default', (raw) => (typeof raw === 'string' ? raw : undefined))).toBe(
      'default',
    );
  });

  it('parse가 반환한 값을 사용한다', () => {
    localStorage.setItem('k', JSON.stringify('2024-01-01T00:00:00.000Z'));
    const result = loadStored<Date>('k', new Date(0), (raw) => new Date(raw as string));
    expect(result.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('값을 JSON으로 저장한다', () => {
    saveStored('k', { a: 1 });
    expect(localStorage.getItem('k')).toBe('{"a":1}');
  });

  it('저장소가 예외를 던져도 throw하지 않는다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveStored('k', 'v')).not.toThrow();
  });
});
