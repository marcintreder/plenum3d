import { generateF1 } from '../../f1Model';

describe('f1Model generator', () => {
  test('should generate a non-empty array of parts', () => {
    const { objects } = generateF1();
    expect(Array.isArray(objects)).toBe(true);
    expect(objects.length).toBeGreaterThan(0);
  });

  test('each part should have valid vertex and index data', () => {
    const { objects } = generateF1();
    objects.forEach(part => {
      expect(Array.isArray(part.vertices)).toBe(true);
      expect(part.vertices.length).toBeGreaterThan(0);
      expect(Array.isArray(part.indices)).toBe(true);
      expect(part.indices.length).toBeGreaterThan(0);
    });
  });
});
