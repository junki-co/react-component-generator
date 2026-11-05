import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';

describe('usePersistentState', () => {
  beforeEach(() => localStorage.clear());

  it('저장된 값이 없으면 초기값을 쓴다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('저장된 값이 있으면 초기값 대신 복원한다', () => {
    localStorage.setItem('k', JSON.stringify('saved'));
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    expect(result.current[0]).toBe('saved');
  });

  it('값을 바꾸면 localStorage에 저장한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    act(() => result.current[1]('next'));
    expect(localStorage.getItem('k')).toBe('"next"');
  });

  it('parse가 거부한 저장값은 무시하고 초기값을 쓴다', () => {
    localStorage.setItem('k', JSON.stringify('bogus'));
    const { result } = renderHook(() =>
      usePersistentState<'a' | 'b'>('k', 'a', (raw) => (raw === 'a' || raw === 'b' ? raw : undefined)),
    );
    expect(result.current[0]).toBe('a');
  });
});
