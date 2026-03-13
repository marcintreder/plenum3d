import { renderHook, act } from '@testing-library/react';
import useStore from '../../useStore';

describe('grouping logic', () => {
  beforeEach(() => {
    // Reset store state
    act(() => {
      useStore.setState({ 
        objects: [], 
        history: [[]], 
        historyIndex: 0, 
        selectedObjectId: null 
      });
    });
  });

  it('should allow grouping an object', () => {
    act(() => {
      useStore.getState().addPrimitive('cube');
    });
    const { objects } = useStore.getState();
    const objId = objects[0].id;
    
    act(() => {
      useStore.setState({ selectedObjectId: objId });
      useStore.getState().setGroup('group-1');
    });

    expect(useStore.getState().objects[0].groupId).toBe('group-1');
  });

  it('should allow ungrouping an object', () => {
    act(() => {
      useStore.getState().addPrimitive('cube');
      const objId = useStore.getState().objects[0].id;
      useStore.setState({ selectedObjectId: objId });
      useStore.getState().setGroup('group-1');
      useStore.getState().setGroup(null);
    });

    expect(useStore.getState().objects[0].groupId).toBeNull();
  });
});
