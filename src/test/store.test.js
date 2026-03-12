import { describe, it, expect } from 'vitest';
import useStore from '../useStore';

describe('Sculpt3D Store', () => {
  it('should initialize with default vertices and indices', () => {
    const state = useStore.getState();
    expect(state.vertices.length).toBeGreaterThan(0);
    expect(state.indices.length).toBeGreaterThan(0);
  });

  it('should update vertices via updateVertex', () => {
    const { updateVertex } = useStore.getState();
    const newPos = [10, 10, 10];
    updateVertex(0, newPos);
    
    const state = useStore.getState();
    expect(state.vertices[0]).toEqual(newPos);
  });

  it('should set geometry correctly', () => {
    const { setGeometry } = useStore.getState();
    const mockGeo = {
      vertices: [[0,0,0], [1,1,1]],
      indices: [0,1,0],
      color: '#ff0000',
      materialType: 'physical'
    };
    
    setGeometry(mockGeo);
    const state = useStore.getState();
    expect(state.vertices).toEqual(mockGeo.vertices);
    expect(state.color).toBe(mockGeo.color);
    expect(state.materialType).toBe(mockGeo.materialType);
  });
});
