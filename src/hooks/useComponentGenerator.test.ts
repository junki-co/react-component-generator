import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';

const COMPONENTS_KEY = 'rcg:components';
const HISTORY_KEY = 'rcg:history';

function mockFetchOk(code = 'render(<div />)') {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code }) }),
  );
}

async function generateOnce(
  result: { current: ReturnType<typeof useComponentGenerator> },
  prompt: string,
) {
  await act(async () => {
    await result.current.generate(prompt, undefined, 'google');
  });
}

describe('useComponentGenerator 영속화', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('저장된 컴포넌트를 복원하고 createdAt을 Date로 되살린다', () => {
    localStorage.setItem(
      COMPONENTS_KEY,
      JSON.stringify([
        { id: '1', prompt: '카드', code: 'c', createdAt: '2024-01-01T00:00:00.000Z' },
      ]),
    );
    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].createdAt).toBeInstanceOf(Date);
    expect(result.current.components[0].createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('저장된 컴포넌트 데이터가 손상되면 빈 목록으로 시작한다', () => {
    localStorage.setItem(COMPONENTS_KEY, JSON.stringify([{ foo: 'bar' }]));
    const { result } = renderHook(() => useComponentGenerator());
    expect(result.current.components).toEqual([]);
  });

  it('생성에 성공하면 컴포넌트를 localStorage에 저장한다', async () => {
    mockFetchOk();
    const { result } = renderHook(() => useComponentGenerator());
    await generateOnce(result, '카드');

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(COMPONENTS_KEY) ?? '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].prompt).toBe('카드');
    });
  });

  it('컴포넌트를 삭제하면 저장소에도 반영된다', async () => {
    mockFetchOk();
    const { result } = renderHook(() => useComponentGenerator());
    await generateOnce(result, '카드');
    act(() => result.current.removeComponent(result.current.components[0].id));

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(COMPONENTS_KEY) ?? 'null')).toEqual([]);
    });
  });

  it('전체 삭제하면 저장소도 비워진다', async () => {
    mockFetchOk();
    const { result } = renderHook(() => useComponentGenerator());
    await generateOnce(result, '카드');
    act(() => result.current.clearAll());

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(COMPONENTS_KEY) ?? 'null')).toEqual([]);
    });
  });

  it('컴포넌트는 최근 50개까지만 저장한다', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({
      id: String(i),
      prompt: `p${i}`,
      code: 'c',
      createdAt: '2024-01-01T00:00:00.000Z',
    }));
    localStorage.setItem(COMPONENTS_KEY, JSON.stringify(many));
    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components).toHaveLength(50);
    expect(result.current.components[0].id).toBe('0');
  });

  it('생성하면 프롬프트가 히스토리 맨 앞에 추가된다', async () => {
    mockFetchOk();
    const { result } = renderHook(() => useComponentGenerator());
    await generateOnce(result, '첫 번째');
    await generateOnce(result, '두 번째');

    expect(result.current.history).toEqual(['두 번째', '첫 번째']);
  });

  it('중복 프롬프트는 맨 앞으로 이동하고 중복 저장되지 않는다', async () => {
    mockFetchOk();
    const { result } = renderHook(() => useComponentGenerator());
    await generateOnce(result, 'A');
    await generateOnce(result, 'B');
    await generateOnce(result, 'A');

    expect(result.current.history).toEqual(['A', 'B']);
  });

  it('히스토리는 최근 20개까지만 유지한다', async () => {
    mockFetchOk();
    const { result } = renderHook(() => useComponentGenerator());
    for (let i = 0; i < 25; i++) await generateOnce(result, `p${i}`);

    expect(result.current.history).toHaveLength(20);
    expect(result.current.history[0]).toBe('p24');
  });

  it('히스토리를 localStorage에 저장하고 재마운트 시 복원한다', async () => {
    mockFetchOk();
    const first = renderHook(() => useComponentGenerator());
    await generateOnce(first.result, '카드');
    first.unmount();

    expect(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')).toEqual(['카드']);
    const second = renderHook(() => useComponentGenerator());
    expect(second.result.current.history).toEqual(['카드']);
  });
});
