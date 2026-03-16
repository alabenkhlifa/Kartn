import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SuggestionButtons from '@/components/suggestions/SuggestionButtons';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      // Filter out framer-motion specific props to avoid React warnings
      const { variants, initial, animate, whileTap, ...htmlProps } = props;
      return <div {...htmlProps}>{children}</div>;
    },
    button: ({
      children,
      onClick,
      disabled,
      className,
      ...rest
    }: any) => {
      const { variants, whileTap, ...htmlProps } = rest;
      return (
        <button
          onClick={onClick}
          disabled={disabled}
          className={className}
          {...htmlProps}
        >
          {children}
        </button>
      );
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('SuggestionButtons', () => {
  const mockOptions = [
    { number: 1, text: 'Acheter une voiture' },
    { number: 2, text: 'Procédures FCR' },
    { number: 3, text: 'Comparer des voitures' },
  ];

  it('renders all options', () => {
    render(<SuggestionButtons options={mockOptions} onSelect={vi.fn()} />);
    expect(screen.getByText('Acheter une voiture')).toBeInTheDocument();
    expect(screen.getByText('Procédures FCR')).toBeInTheDocument();
    expect(screen.getByText('Comparer des voitures')).toBeInTheDocument();
  });

  it('calls onSelect with correct option when clicked', () => {
    const onSelect = vi.fn();
    render(<SuggestionButtons options={mockOptions} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Procédures FCR'));
    expect(onSelect).toHaveBeenCalledWith({
      number: 2,
      text: 'Procédures FCR',
    });
  });

  it('disables buttons when disabled prop is true', () => {
    render(
      <SuggestionButtons
        options={mockOptions}
        onSelect={vi.fn()}
        disabled
      />
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('returns null for empty options', () => {
    const { container } = render(
      <SuggestionButtons options={[]} onSelect={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('uses grid layout for 3+ options', () => {
    render(<SuggestionButtons options={mockOptions} onSelect={vi.fn()} />);
    const container = screen.getByRole('group');
    expect(container.className).toContain('grid');
  });

  it('uses flex layout for fewer than 3 options', () => {
    const twoOptions = [
      { number: 1, text: 'Option A' },
      { number: 2, text: 'Option B' },
    ];
    render(<SuggestionButtons options={twoOptions} onSelect={vi.fn()} />);
    const container = screen.getByRole('group');
    expect(container.className).toContain('flex');
  });
});
