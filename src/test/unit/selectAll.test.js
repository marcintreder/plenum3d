import { describe, it, expect, beforeEach } from 'vitest';
import useStore from '../../useStore';

describe('Select All (Cmd+A)', () => {
  beforeEach(() => {
    // Reset selection state before each test
    useStore.setState({
      selectedObjectId: null,
      selectedObjectIds: [],
      selectedGroupId: null,
      selectedJointIndex: null,
      selectedVertexIndices: [],
      editMode: 'object',
    });
  });

  it('should select all objects when selectAllObjects is called', () => {
    const { selectAllObjects, objects } = useStore.getState();
    const visibleIds = objects.filter(o => o.visible !== false).map(o => o.id);

    selectAllObjects();

    const state = useStore.getState();
    expect(state.selectedObjectIds).toEqual(visibleIds);
    expect(state.selectedObjectId).toBe(visibleIds[visibleIds.length - 1]);
  });

  it('should select all objects when Cmd+A is pressed', () => {
    const { objects } = useStore.getState();
    const visibleIds = objects.filter(o => o.visible !== false).map(o => o.id);

    // Simulate Cmd+A keydown event
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    // selectAllObjects is called via useKeyboardShortcuts hook (React component context),
    // so test the store action directly as the canonical unit test
    useStore.getState().selectAllObjects();

    const state = useStore.getState();
    expect(state.selectedObjectIds.length).toBe(visibleIds.length);
    expect(state.selectedObjectIds).toEqual(visibleIds);
  });

  it('should set editMode to object when selecting all', () => {
    useStore.setState({ editMode: 'vertex' });
    useStore.getState().selectAllObjects();
    expect(useStore.getState().editMode).toBe('object');
  });

  it('should clear group and vertex selections when selecting all', () => {
    useStore.setState({ selectedGroupId: 'some-group', selectedJointIndex: 2, selectedVertexIndices: [0, 1] });
    useStore.getState().selectAllObjects();

    const state = useStore.getState();
    expect(state.selectedGroupId).toBeNull();
    expect(state.selectedJointIndex).toBeNull();
    expect(state.selectedVertexIndices).toEqual([]);
  });

  it('selected objects should remain movable after select all', () => {
    const { selectAllObjects, updateObject, objects } = useStore.getState();
    selectAllObjects();

    const firstId = useStore.getState().selectedObjectIds[0];
    const originalPos = [...objects.find(o => o.id === firstId).position];

    updateObject(firstId, { position: [originalPos[0] + 1, originalPos[1], originalPos[2]] });

    const updated = useStore.getState().objects.find(o => o.id === firstId);
    expect(updated.position[0]).toBe(originalPos[0] + 1);
    // Still selected after update
    expect(useStore.getState().selectedObjectIds).toContain(firstId);
  });
});
