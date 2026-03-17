import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIInspector from '../AIInspector';
import useStore from '../useStore';

// Mock useStore so we control what the component sees
vi.mock('../useStore', () => {
  const store = vi.fn();
  store.getState = vi.fn();
  return { default: store };
});

const mockObject = {
  id: 'obj-1',
  name: 'Test Cube',
  position: [1, 2, 3],
  rotation: [0, 0.5, 0],
  scale: [1, 1, 1],
  vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
};

const makeState = (overrides = {}) => ({
  objects: [mockObject],
  selectedObjectId: 'obj-1',
  ...overrides,
});

describe('AIInspector', () => {
  beforeEach(() => {
    useStore.mockImplementation((selector) => {
      if (typeof selector === 'function') return selector(makeState());
      return makeState();
    });
  });

  it('renders the ai-inspector container', () => {
    render(<AIInspector />);
    expect(screen.getByTestId('ai-inspector')).toBeInTheDocument();
  });

  it('shows model properties when an object is selected', () => {
    render(<AIInspector />);
    expect(screen.getByTestId('model-properties')).toBeInTheDocument();
    expect(screen.getByTestId('object-name')).toHaveTextContent('Test Cube');
  });

  it('shows vertex count for the selected object', () => {
    render(<AIInspector />);
    expect(screen.getByTestId('vertex-count')).toHaveTextContent('3');
  });

  it('shows no-selection message when nothing is selected', () => {
    useStore.mockImplementation((selector) => {
      const state = makeState({ selectedObjectId: null });
      if (typeof selector === 'function') return selector(state);
      return state;
    });
    render(<AIInspector />);
    expect(screen.getByTestId('no-selection-message')).toBeInTheDocument();
    expect(screen.queryByTestId('model-properties')).not.toBeInTheDocument();
  });

  it('renders the prompt textarea with correct data-testid', () => {
    render(<AIInspector />);
    expect(screen.getByTestId('ai-prompt-input')).toBeInTheDocument();
  });

  it('renders the Refine button with correct data-testid', () => {
    render(<AIInspector />);
    expect(screen.getByTestId('ai-refine-button')).toBeInTheDocument();
  });

  it('Refine button is disabled when prompt is empty', () => {
    render(<AIInspector />);
    expect(screen.getByTestId('ai-refine-button')).toBeDisabled();
  });

  it('Refine button is disabled when no object is selected', () => {
    useStore.mockImplementation((selector) => {
      const state = makeState({ selectedObjectId: null });
      if (typeof selector === 'function') return selector(state);
      return state;
    });
    render(<AIInspector />);
    const input = screen.getByTestId('ai-prompt-input');
    fireEvent.change(input, { target: { value: 'make it rounder' } });
    expect(screen.getByTestId('ai-refine-button')).toBeDisabled();
  });

  it('Refine button is enabled when prompt has text and object is selected', () => {
    render(<AIInspector />);
    const input = screen.getByTestId('ai-prompt-input');
    fireEvent.change(input, { target: { value: 'make it rounder' } });
    expect(screen.getByTestId('ai-refine-button')).not.toBeDisabled();
  });

  it('calls onRefine with object and prompt when button is clicked', async () => {
    const onRefine = vi.fn().mockResolvedValue(undefined);
    render(<AIInspector onRefine={onRefine} />);

    const input = screen.getByTestId('ai-prompt-input');
    fireEvent.change(input, { target: { value: 'make it rounder' } });
    fireEvent.click(screen.getByTestId('ai-refine-button'));

    await waitFor(() => {
      expect(onRefine).toHaveBeenCalledWith({
        object: mockObject,
        prompt: 'make it rounder',
      });
    });
  });

  it('clears the prompt after submission', async () => {
    const onRefine = vi.fn().mockResolvedValue(undefined);
    render(<AIInspector onRefine={onRefine} />);

    const input = screen.getByTestId('ai-prompt-input');
    fireEvent.change(input, { target: { value: 'make it rounder' } });
    fireEvent.click(screen.getByTestId('ai-refine-button'));

    await waitFor(() => {
      expect(screen.getByTestId('ai-prompt-input')).toHaveValue('');
    });
  });

  it('submits on Enter key press', async () => {
    const onRefine = vi.fn().mockResolvedValue(undefined);
    render(<AIInspector onRefine={onRefine} />);

    const input = screen.getByTestId('ai-prompt-input');
    fireEvent.change(input, { target: { value: 'sharpen edges' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(onRefine).toHaveBeenCalledWith({
        object: mockObject,
        prompt: 'sharpen edges',
      });
    });
  });

  it('does not submit on Shift+Enter', async () => {
    const onRefine = vi.fn().mockResolvedValue(undefined);
    render(<AIInspector onRefine={onRefine} />);

    const input = screen.getByTestId('ai-prompt-input');
    fireEvent.change(input, { target: { value: 'sharpen edges' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(onRefine).not.toHaveBeenCalled();
  });
});
