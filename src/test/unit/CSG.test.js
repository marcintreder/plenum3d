import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { performCSG } from '../../utils/CSGProcessor';

describe('CSG Processor', () => {
  it('should perform union between two cubes', () => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial();
    // Ensure geometry is fully initialized (e.g. has indices/attributes)
    const meshA = { geometry: geo, material: mat };
    const meshB = { geometry: geo, material: mat };
    
    // Note:three-bvh-csg might require more than just geometry+material. 
    // This is a minimal test.
    const result = performCSG(meshA, meshB, 'union');
    expect(result).toBeDefined();
  });
});
