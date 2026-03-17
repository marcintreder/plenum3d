import { describe, it, expect } from 'vitest';
import { extractObjectStructure } from '../../utils/objectStructure.js';
import useStore from '../../useStore.jsx';

// ── Shared fixture ────────────────────────────────────────────────────────────

const cubeObject = {
  id: 'test-cube',
  name: 'Test Cube',
  vertices: [
    [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5],
    [-0.5, -0.5,  0.5], [0.5, -0.5,  0.5], [0.5, 0.5,  0.5], [-0.5, 0.5,  0.5],
  ],
  indices: [
    0, 2, 1,  0, 3, 2,
    4, 5, 6,  4, 6, 7,
    0, 1, 5,  0, 5, 4,
    2, 3, 7,  2, 7, 6,
    0, 4, 7,  0, 7, 3,
    1, 2, 6,  1, 6, 5,
  ],
  position: [1, 2, 3],
  rotation: [0, 0.5, 0],
  scale: [2, 2, 2],
  color: '#FF0000',
  metalness: 0.5,
  roughness: 0.3,
  materialType: 'physical',
};

// ── extractObjectStructure ────────────────────────────────────────────────────

describe('extractObjectStructure', () => {
  it('returns the object name', () => {
    expect(extractObjectStructure(cubeObject).name).toBe('Test Cube');
  });

  it('counts vertices correctly', () => {
    expect(extractObjectStructure(cubeObject).vertexCount).toBe(8);
  });

  it('counts faces (triangles) correctly', () => {
    // 36 indices / 3 = 12 triangles
    expect(extractObjectStructure(cubeObject).faceCount).toBe(12);
  });

  it('computes bounding box min correctly', () => {
    const { boundingBox } = extractObjectStructure(cubeObject);
    expect(boundingBox.min).toEqual([-0.5, -0.5, -0.5]);
  });

  it('computes bounding box max correctly', () => {
    const { boundingBox } = extractObjectStructure(cubeObject);
    expect(boundingBox.max).toEqual([0.5, 0.5, 0.5]);
  });

  it('computes bounding box size correctly', () => {
    const { boundingBox } = extractObjectStructure(cubeObject);
    expect(boundingBox.size).toEqual([1, 1, 1]);
  });

  it('preserves position', () => {
    expect(extractObjectStructure(cubeObject).position).toEqual([1, 2, 3]);
  });

  it('preserves rotation', () => {
    expect(extractObjectStructure(cubeObject).rotation).toEqual([0, 0.5, 0]);
  });

  it('preserves scale', () => {
    expect(extractObjectStructure(cubeObject).scale).toEqual([2, 2, 2]);
  });

  it('preserves color', () => {
    expect(extractObjectStructure(cubeObject).color).toBe('#FF0000');
  });

  it('preserves metalness', () => {
    expect(extractObjectStructure(cubeObject).metalness).toBe(0.5);
  });

  it('preserves roughness', () => {
    expect(extractObjectStructure(cubeObject).roughness).toBe(0.3);
  });

  it('preserves materialType', () => {
    expect(extractObjectStructure(cubeObject).materialType).toBe('physical');
  });

  it('handles empty vertices gracefully', () => {
    const s = extractObjectStructure({ name: 'Empty', vertices: [], indices: [] });
    expect(s.vertexCount).toBe(0);
    expect(s.faceCount).toBe(0);
    expect(s.boundingBox).toEqual({ min: [0, 0, 0], max: [0, 0, 0], size: [0, 0, 0] });
  });

  it('applies defaults when optional fields are missing', () => {
    const s = extractObjectStructure({ vertices: [[0, 0, 0]], indices: [0, 0, 0] });
    expect(s.name).toBe('Object');
    expect(s.position).toEqual([0, 0, 0]);
    expect(s.rotation).toEqual([0, 0, 0]);
    expect(s.scale).toEqual([1, 1, 1]);
    expect(s.color).toBe('#888888');
    expect(s.metalness).toBe(0.3);
    expect(s.roughness).toBe(0.7);
    expect(s.materialType).toBe('standard');
  });
});

// ── patchObjectGeometry ───────────────────────────────────────────────────────

describe('patchObjectGeometry', () => {
  it('updates vertices and indices of the target object', () => {
    const { objects, patchObjectGeometry } = useStore.getState();
    const target = objects[0];
    const newVertices = [[0, 0, 0], [1, 0, 0], [0, 1, 0]];
    const newIndices = [0, 1, 2];

    patchObjectGeometry(target.id, newVertices, newIndices);

    const updated = useStore.getState().objects.find(o => o.id === target.id);
    expect(updated.vertices).toEqual(newVertices);
    expect(updated.indices).toEqual(newIndices);
  });

  it('does not modify other objects', () => {
    const { objects, patchObjectGeometry } = useStore.getState();
    // Need at least two objects (F1 assembly has many)
    expect(objects.length).toBeGreaterThan(1);

    const target = objects[0];
    const other = objects[1];
    const originalOtherVertices = other.vertices;

    patchObjectGeometry(target.id, [[9, 9, 9]], [0]);

    const otherAfter = useStore.getState().objects.find(o => o.id === other.id);
    expect(otherAfter.vertices).toEqual(originalOtherVertices);
  });

  it('preserves non-geometry properties of the patched object', () => {
    const { objects, patchObjectGeometry } = useStore.getState();
    const target = objects[0];
    const { color, position, rotation, scale, materialType } = target;

    patchObjectGeometry(target.id, [[0, 0, 0]], [0]);

    const updated = useStore.getState().objects.find(o => o.id === target.id);
    expect(updated.color).toBe(color);
    expect(updated.position).toEqual(position);
    expect(updated.rotation).toEqual(rotation);
    expect(updated.scale).toEqual(scale);
    expect(updated.materialType).toBe(materialType);
  });
});
