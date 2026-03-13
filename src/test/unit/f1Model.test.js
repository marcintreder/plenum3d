import { generateF1 } from '../../f1Model';

describe('f1Model generator', () => {
  test('should generate a non-empty array of parts', () => {
    const parts = generateF1();
    expect(Array.isArray(parts)).toBe(true);
    expect(parts.length).toBeGreaterThan(0);
  });

  test('each part should have valid TypedArray buffers', () => {
    const parts = generateF1();
    parts.forEach(part => {
      expect(part.vertices).toBeInstanceOf(Float32Array);
      expect(part.vertices.length).toBeGreaterThan(0);
      expect(part.indices).toBeInstanceOf(Uint16Array);
      expect(part.indices.length).toBeGreaterThan(0);
      // Ensure vertex data is normalized/flat
      expect(part.vertices.length % 3).toBe(0);
    });
  });
});
