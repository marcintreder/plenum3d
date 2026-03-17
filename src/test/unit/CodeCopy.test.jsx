import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CodeCopyPanel from '../../components/CodeCopyPanel';

describe('CodeCopyPanel', () => {
  it('should copy code content on click', async () => {
    const code = 'const x = 1;';
    const clipboardMock = { writeText: vi.fn().mockResolvedValue() };
    navigator.clipboard = clipboardMock;

    render(<CodeCopyPanel codeContent={code} />);
    const button = screen.getByRole('button', { name: /copy code/i });
    fireEvent.click(button);

    expect(clipboardMock.writeText).toHaveBeenCalledWith(code);
    await waitFor(() => expect(screen.getByText(/copied!/i)).toBeDefined());
  });
});
