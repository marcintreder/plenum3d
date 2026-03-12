import { describe, it, expect } from 'vitest';
import useStore from '../useStore';

describe('Sculpt3D Multi-Object Store', () => {
  it('should initialize with the F1 Car object', () => {
    const state = useStore.getState();
    expect(state.objects.length).toBe(1);
    expect(state.objects[0].name).toBe('F1 Car');
  });

  it('should add a new primitive object', () => {
    const { addPrimitive } = useStore.getState();
    addPrimitive('cube');
    
    const state = useStore.getState();
    expect(state.objects.length).toBe(2);
    expect(state.objects[1].name).toContain('Cube');
    expect(state.selectedObjectId).toBe(state.objects[1].id);
  });

  it('should update a vertex in a specific object', () => {
    const { updateVertex, objects } = useStore.getState();
    const targetObj = objects[0];
    const newPos = [9, 9, 9];
    
    updateVertex(targetObj.id, 0, newPos);
    
    const state = useStore.getState();
    expect(state.objects[0].vertices[0]).toEqual(newPos);
  });

  it('should delete an object', () => {
    const { deleteObject, objects } = useStore.getState();
    const idToDelete = objects[1].id;
    
    deleteObject(idToDelete);
    
    const state = useStore.getState();
    expect(state.objects.length).toBe(1);
    expect(state.objects.find(o => o.id === idToDelete)).toBeUndefined();
  });
});
