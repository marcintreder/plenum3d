import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock useStore so CodeView renders without a real Zustand store
vi.mock('../../useStore', () => ({
  default: (selector) =>
    selector({
      objects: [],
    }),
}));

// Mock CodeGenerator
vi.mock('../../CodeGenerator', () => ({
  generateR3FCode: () => 'const scene = <Canvas />;',
}));

import CodeView from '../../CodeView';

describe('CodeView – Copy Selection', () => {
  let clipboardMock;

  beforeEach(() => {
    clipboardMock = { writeText: vi.fn().mockResolvedValue(undefined) };
    Object.defineProperty(navigator, 'clipboard', {
      value: clipboardMock,
      writable: true,
      configurable: true,
    });
  });

  it('copies only the selected text, not the full code', () => {
    const selectedText = 'const scene';

    // Simulate a text selection via window.getSelection
    window.getSelection = vi.fn().mockReturnValue({
      toString: () => selectedText,
    });

    render(<CodeView isOpen={true} onClose={() => {}} />);

    const copySelectionBtn = screen.getByTestId('copy-selection-btn');
    fireEvent.click(copySelectionBtn);

    expect(clipboardMock.writeText).toHaveBeenCalledTimes(1);
    expect(clipboardMock.writeText).toHaveBeenCalledWith(selectedText);
    // Must NOT have been called with the full generated code
    expect(clipboardMock.writeText).not.toHaveBeenCalledWith('const scene = <Canvas />;');
  });

  it('does not call clipboard.writeText when there is no selection', () => {
    window.getSelection = vi.fn().mockReturnValue({
      toString: () => '',
    });

    render(<CodeView isOpen={true} onClose={() => {}} />);

    const copySelectionBtn = screen.getByTestId('copy-selection-btn');
    fireEvent.click(copySelectionBtn);

    expect(clipboardMock.writeText).not.toHaveBeenCalled();
  });
});
