import { describe, it, expect, vi, beforeEach } from 'vitest';
import useStore from '../../useStore';

describe('Copy/Paste functionality', () => {
  beforeEach(() => {
    // Reset store
    useStore.setState({
      objects: [
        { id: '1', name: 'Cube', position: [0, 0, 0], vertices: [], indices: [] },
        { id: '2', name: 'Sphere', position: [1, 1, 1], vertices: [], indices: [] }
      ],
      selectedObjectIds: ['1'],
      selectedObjectId: '1',
      history: [],
      historyIndex: 0
    });
  });

  it('should copy selected objects to clipboard and paste them with offset', () => {
    const { copyObjects, pasteObjects, objects } = useStore.getState();

    // 1. Copy
    const clipboard = copyObjects();
    expect(clipboard).toHaveLength(1);
    expect(clipboard[0].id).toBe('1');

    // 2. Paste
    pasteObjects(clipboard);

    const updatedObjects = useStore.getState().objects;
    expect(updatedObjects).toHaveLength(3); // 2 originals + 1 copy
    
    const pasted = updatedObjects.find(o => o.name === 'Cube (Copy)');
    expect(pasted).toBeDefined();
    expect(pasted.id).not.toBe('1');
    expect(pasted.position).toEqual([0.5, 0.5, 0.5]);
  });

  it('should copy multiple objects and paste them maintaining relative positions', () => {
    useStore.setState({ selectedObjectIds: ['1', '2'] });
    const { copyObjects, pasteObjects } = useStore.getState();

    const clipboard = copyObjects();
    expect(clipboard).toHaveLength(2);

    pasteObjects(clipboard);

    const updatedObjects = useStore.getState().objects;
    expect(updatedObjects).toHaveLength(4);
    
    const pasted1 = updatedObjects.find(o => o.name === 'Cube (Copy)');
    const pasted2 = updatedObjects.find(o => o.name === 'Sphere (Copy)');
    
    expect(pasted1.position).toEqual([0.5, 0.5, 0.5]);
    expect(pasted2.position).toEqual([1.5, 1.5, 1.5]); // Original sphere was [1,1,1] + [0.5,0.5,0.5] = [1.5, 1.5, 1.5]
  });
});
