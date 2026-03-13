import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../useStore';

describe('useStore History', () => {
  beforeEach(() => {
    // Reset state
    useStore.setState({ 
        objects: [], 
        history: [[]], 
        historyIndex: 0 
    }, true);
  });

  it('should save deep-copied state in history when adding primitive', () => {
    useStore.getState().addPrimitive('cube');
    const state = useStore.getState();
    
    expect(state.history.length).toBe(2);
    expect(state.history[0]).toEqual([]);
    expect(state.history[1].length).toBe(1);
    expect(state.history[1][0].name).toContain('cube');
    
    // Verify it's a deep copy
    state.history[1][0].name = 'Modified';
    expect(state.objects[0].name).not.toBe('Modified');
  });

  it('should undo and redo correctly', () => {
    useStore.getState().addPrimitive('cube');
    useStore.getState().addPrimitive('sphere');
    
    expect(useStore.getState().objects.length).toBe(2);
    expect(useStore.getState().historyIndex).toBe(2);
    
    useStore.getState().undo();
    expect(useStore.getState().historyIndex).toBe(1);
    expect(useStore.getState().objects.length).toBe(1);
    
    useStore.getState().redo();
    expect(useStore.getState().historyIndex).toBe(2);
    expect(useStore.getState().objects.length).toBe(2);
  });
});
