import { buildPrimitiveMesh } from '../../utils/primitiveBuilder';

describe('primitiveBuilder', () => {
  test('capsule primitive should return valid mesh data', () => {
    const { vertices, indices } = buildPrimitiveMesh('capsule', [2, 4, 2]); // radius 1, height 4
    
    expect(Array.isArray(vertices)).toBe(true);
    expect(vertices.length).toBeGreaterThan(0);
    expect(Array.isArray(indices)).toBe(true);
    expect(indices.length).toBeGreaterThan(0);
    
    // Check some points to ensure they are within reasonable bounds
    vertices.forEach(v => {
      expect(v.length).toBe(3);
      expect(Math.abs(v[0])).toBeLessThanOrEqual(1.1); // radius
      expect(Math.abs(v[1])).toBeLessThanOrEqual(2.1); // height/2
      expect(Math.abs(v[2])).toBeLessThanOrEqual(1.1); // radius
    });
  });
});
