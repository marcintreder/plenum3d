import { generateF1 } from '../../f1Model';

describe('f1Model generator', () => {
  test('should generate a non-empty array of parts', () => {
    const parts = generateF1();
    expect(Array.isArray(parts)).toBe(true);
    expect(parts.length).toBeGreaterThan(0);
  });

  test('each part should have valid vertex and index data', () => {
    const parts = generateF1();
    parts.forEach(part => {
      expect(Array.isArray(part.vertices)).toBe(true);
      expect(part.vertices.length).toBeGreaterThan(0);
      expect(Array.isArray(part.indices)).toBe(true);
      expect(part.indices.length).toBeGreaterThan(0);
    });
  });
});
