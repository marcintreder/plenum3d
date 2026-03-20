import { describe, it, expect, vi } from 'vitest';
import useStore from '../../useStore';

describe('Object duplication', () => {
    it('duplicates an object and offsets it', () => {
        const { duplicateObject, objects, setState } = useStore.getState();
        const initialCount = objects.length;
        const testId = objects[0].id;
        const initialPos = objects[0].position;
        
        duplicateObject(testId);
        
        const { objects: newObjects } = useStore.getState();
        expect(newObjects.length).toBe(initialCount + 1);
        const cloned = newObjects.find(o => o.id !== testId && o.name.includes('(Copy)'));
        expect(cloned.position[0]).toBe(initialPos[0] + 0.2);
    });
});
