import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { performCSG } from '../../utils/CSGProcessor';
// Attempt to use import from a different path or alias if mesh-bvh versioned issues occur
// Force reload or re-import if Vitest cache is an issue
import { MeshBVH } from 'three-mesh-bvh';

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
