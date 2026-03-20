import { describe, it, expect } from 'vitest';
import useStore from '../../useStore';

describe('Object rename', () => {
    it('updates object name in store', () => {
        const { objects, updateObject } = useStore.getState();
        const objId = objects[0].id;
        const newName = 'Renamed Object';
        updateObject(objId, { name: newName });
        const { objects: updated } = useStore.getState();
        expect(updated.find(o => o.id === objId).name).toBe(newName);
    });
});
