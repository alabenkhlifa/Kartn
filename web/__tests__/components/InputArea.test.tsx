import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InputArea from '@/components/chat/InputArea';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, onClick, disabled, className, type, ...rest }: any) => (
      <button onClick={onClick} disabled={disabled} className={className} type={type}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Send: (props: any) => <svg data-testid="send-icon" {...props} />,
}));

// Mock i18n
vi.mock('@/lib/i18n', () => ({
  t: (key: string) => key,
}));

// Mock LanguageContext
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'french', setLanguage: vi.fn(), isRTL: false }),
}));

// Mock localStorage
const localStorageMock = (() => {
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
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('InputArea', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders textarea with placeholder', () => {
    render(<InputArea onSend={vi.fn()} />);
    expect(
      screen.getByPlaceholderText('input.placeholder')
    ).toBeInTheDocument();
  });

  it('calls onSend when form is submitted', async () => {
    const onSend = vi.fn();
    render(<InputArea onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('input.placeholder');
    await userEvent.type(textarea, 'Hello');
    fireEvent.submit(textarea.closest('form')!);

    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('does not send empty messages', async () => {
    const onSend = vi.fn();
    render(<InputArea onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('input.placeholder');
    fireEvent.submit(textarea.closest('form')!);

    expect(onSend).not.toHaveBeenCalled();
  });

  it('clears input after sending', async () => {
    const onSend = vi.fn();
    render(<InputArea onSend={onSend} />);

    const textarea = screen.getByPlaceholderText(
      'input.placeholder'
    ) as HTMLTextAreaElement;
    await userEvent.type(textarea, 'Hello');
    fireEvent.submit(textarea.closest('form')!);

    expect(textarea.value).toBe('');
  });

  it('disables input when disabled prop is true', () => {
    render(<InputArea onSend={vi.fn()} disabled />);
    const textarea = screen.getByPlaceholderText('input.placeholder');
    expect(textarea).toBeDisabled();
  });

  it('sends on Enter key (not Shift+Enter)', async () => {
    const onSend = vi.fn();
    render(<InputArea onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('input.placeholder');
    await userEvent.type(textarea, 'Hello');
    await userEvent.keyboard('{Enter}');

    expect(onSend).toHaveBeenCalledWith('Hello');
  });
});
