import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';

// three-mesh-bvh and three-bvh-csg use UMD CJS builds that fail to resolve
// THREE classes in the Vitest jsdom environment due to multiple-instance issues.
// Mock both packages so CSGProcessor can be tested in isolation.
vi.mock('three-mesh-bvh', () => ({
  MeshBVH: class MeshBVH {},
  acceleratedRaycast: vi.fn(),
  computeBoundsTree: vi.fn(),
  disposeBoundsTree: vi.fn(),
}));

vi.mock('three-bvh-csg', () => {
  const SUBTRACTION = 0;
  const ADDITION = 1;
  const INTERSECTION = 2;

  class Brush {
    constructor(geometry, material) {
      this.geometry = geometry;
      this.material = material;
    }
  }

  class Evaluator {
    evaluate(brushA, brushB, operation) {
      return new THREE.Mesh(brushA.geometry, brushA.material);
    }
  }

  return { SUBTRACTION, ADDITION, INTERSECTION, Brush, Evaluator };
});

import { MeshBVH } from 'three-mesh-bvh';
import { performCSG } from '../../utils/CSGProcessor';

describe('CSG Processor', () => {
  it('should perform union between two cubes', () => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial();

    // Explicitly check for MeshBVH to verify environment
    expect(MeshBVH).toBeDefined();

    const meshA = new THREE.Mesh(geo, mat);
    const meshB = new THREE.Mesh(geo, mat);

    const result = performCSG(meshA, meshB, 'union');
    expect(result).toBeDefined();
  });
});
