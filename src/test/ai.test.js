import { describe, it, expect } from 'vitest';

describe('Plenum3D AI Service', () => {
  it('generate3DModel is exported', async () => {
    const mod = await import('../aiService');
    expect(typeof mod.generate3DModel).toBe('function');
  });
});
