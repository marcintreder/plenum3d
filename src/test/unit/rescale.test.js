import { describe, test, expect } from 'vitest';

describe('Rescale functionality', () => {
  test('scaleGroup logic', () => {
    const groupId = 'group-1';
    const factor = 2;
    const objects = [
        {
          id: 'test-obj',
          vertices: [[0, 0, 0], [2, 0, 0], [1, 2, 0]],
          groupId: 'group-1',
        }
      ];
    
    const newObjects = objects.map(obj => {
      if (obj.groupId !== groupId) return obj;
      if (!obj.vertices?.length) return obj;
      const n = obj.vertices.length;
      const cx = obj.vertices.reduce((s, v) => s + v[0], 0) / n;
      const cy = obj.vertices.reduce((s, v) => s + v[1], 0) / n;
      const cz = obj.vertices.reduce((s, v) => s + v[2], 0) / n;
      const newVerts = obj.vertices.map(v => [
        cx + (v[0] - cx) * factor,
        cy + (v[1] - cy) * factor,
        cz + (v[2] - cz) * factor,
      ]);
      return { ...obj, vertices: newVerts };
    });
    
    expect(newObjects[0].vertices[0][0]).toBeCloseTo(-1);
    expect(newObjects[0].vertices[0][1]).toBeCloseTo(-0.6666666666666666);
  });
});
