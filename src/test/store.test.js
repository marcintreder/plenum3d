import { describe, it, expect, beforeEach } from 'vitest';
import useStore from '../useStore';

describe('Sculpt3D Multi-Object Store', () => {
  it('should initialize with the F1 assembly', () => {
    const state = useStore.getState();
    expect(state.objects.length).toBeGreaterThan(1);
    expect(state.objects.some(o => o.name === 'Main Chassis')).toBe(true);
  });

  it('should add a new primitive object', () => {
    const { addPrimitive } = useStore.getState();
    const countBefore = useStore.getState().objects.length;
    addPrimitive('cube');
    
    const state = useStore.getState();
    expect(state.objects.length).toBe(countBefore + 1);
    expect(state.objects.some(o => o.name.includes('Cube'))).toBe(true);
    expect(state.selectedObjectId).toBe(state.objects[state.objects.length - 1].id);
  });

  it('should update a vertex in a specific object', () => {
    const { updateVertex, objects } = useStore.getState();
    const targetObj = objects[0];
    const newPos = [9, 9, 9];
    
    updateVertex(targetObj.id, 0, newPos);
    
    const state = useStore.getState();
    expect(state.objects.find(o => o.id === targetObj.id).vertices[0]).toEqual(newPos);
  });

  it('should delete an object', () => {
    const { deleteObject, objects } = useStore.getState();
    const initialCount = objects.length;
    const idToDelete = objects[0].id;
    
    deleteObject(idToDelete);
    
    const state = useStore.getState();
    expect(state.objects.length).toBe(initialCount - 1);
    expect(state.objects.find(o => o.id === idToDelete)).toBeUndefined();
  });
});
