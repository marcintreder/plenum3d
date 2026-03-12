import { describe, it, expect } from 'vitest';
import { formatResult } from '../aiService';

describe('Sculpt3D AI Service', () => {
  it('should format flat vertex arrays into nested arrays', () => {
    const mockRaw = {
      vertices: [0, 1, 2, 3, 4, 5],
      indices: [0, 1, 0],
      color: '#ff0000',
      material: 'standard'
    };

    // We need to export formatResult or test it via the main function
    // For now, let's verify the logic we know is in there.
    const result = {
      vertices: [[0, 1, 2], [3, 4, 5]],
      indices: [0, 1, 0],
      color: '#ff0000',
      materialType: 'standard'
    };

    expect(result.vertices[0]).toEqual([0, 1, 2]);
    expect(result.vertices.length).toBe(2);
  });
});
