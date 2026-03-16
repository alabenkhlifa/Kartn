import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChat } from '@/hooks/useChat';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage and sessionStorage
const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
});
Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
});

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('initializes with empty messages', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('adds user message and calls API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({
        message: 'Bot response',
        conversation_id: 'conv-123',
        state: 'goal_selection',
        intent: 'general_info',
        language: 'french',
      }),
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendUserMessage('Hello');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].content).toBe('Bot response');
  });

  it('marks message as failed on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal server error',
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendUserMessage('Hello');
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].error).toBe(true);
    expect(result.current.error).toBeTruthy();
  });

  it('clears conversation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({
        message: 'Hi',
        conversation_id: 'conv-123',
        intent: 'general_info',
        language: 'french',
      }),
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendUserMessage('Hello');
    });

    expect(result.current.messages.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearConversation();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('does not send empty messages', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendUserMessage('   ');
    });

    expect(result.current.messages).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('stores conversation_id from API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({
        message: 'Welcome!',
        conversation_id: 'conv-456',
        intent: 'general_info',
        language: 'french',
      }),
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendUserMessage('Bonjour');
    });

    expect(result.current.conversationId).toBe('conv-456');
  });
});
