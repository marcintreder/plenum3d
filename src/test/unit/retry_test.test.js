import { vi, describe, it, expect } from 'vitest';
import * as aiService from '../../aiService.js';
import * as THREE from 'three';

describe('aiService retry mechanism', () => {
  it('should retry once when generateWithAnthropic fails', async () => {
    // Mock fetch to fail once then succeed
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'return [ { geometry: new THREE.BoxGeometry(1,1,1), name: "test" } ];' }]
        })
      });
    global.fetch = mockFetch;

    const log = vi.fn();
    const keys = { Anthropic: 'test-key' };
    
    // Call the function
    const result = await aiService.generate3DModel('cube', null, keys, log, 'Anthropic', 'test-model');
    
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith('warn', expect.stringContaining('Retry'));
    expect(result.name).toBe('cube');
  });

  it('should fail after one retry', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const log = vi.fn();
    const keys = { Anthropic: 'test-key' };

    await expect(aiService.generate3DModel('cube', null, keys, log, 'Anthropic', 'test-model'))
      .rejects.toThrow('Network error');
    
    expect(global.fetch).toHaveBeenCalledTimes(2); // Initial call + 1 retry
  });
});
