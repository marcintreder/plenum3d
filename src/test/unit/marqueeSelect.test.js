import { describe, it, expect, beforeEach } from 'vitest';
import { getObjectIdsInMarquee } from '../../utils/marqueeIntersection';
import useStore from '../../useStore';

// Simple linear projection: maps world-space [x, _y, z] to screen pixels.
// x * 100 + 400  →  screen x
// z * 100 + 300  →  screen y
const mockProjectToScreen = ([x, _y, z]) => ({ x: x * 100 + 400, y: z * 100 + 300 });

describe('Marquee Selection Tool', () => {
  beforeEach(() => {
    useStore.setState({
      selectedObjectId: null,
      selectedObjectIds: [],
      selectedGroupId: null,
      selectedJointIndex: null,
      selectedVertexIndices: [],
      editMode: 'object',
    });
  });

  it('should select objects contained within the marquee', () => {
    const objects = [
      { id: 'obj-a', position: [0, 0, 0], visible: true },   // projects to (400, 300) — inside
      { id: 'obj-b', position: [1, 0, 1], visible: true },   // projects to (500, 400) — inside
      { id: 'obj-c', position: [5, 0, 5], visible: true },   // projects to (900, 800) — outside
      { id: 'obj-d', position: [-5, 0, -5], visible: true }, // projects to (-100, -200) — outside
    ];
    const marqueeRect = { x1: 300, y1: 200, x2: 600, y2: 500 };

    const ids = getObjectIdsInMarquee(objects, marqueeRect, mockProjectToScreen);

    expect(ids).toContain('obj-a');
    expect(ids).toContain('obj-b');
    expect(ids).not.toContain('obj-c');
    expect(ids).not.toContain('obj-d');
  });

  it('should not include invisible objects in marquee selection', () => {
    const objects = [
      { id: 'visible', position: [0, 0, 0], visible: true },
      { id: 'hidden',  position: [0, 0, 0], visible: false },
    ];
    const marqueeRect = { x1: 0, y1: 0, x2: 1000, y2: 1000 };

    const ids = getObjectIdsInMarquee(objects, marqueeRect, mockProjectToScreen);

    expect(ids).toContain('visible');
    expect(ids).not.toContain('hidden');
  });

  it('should handle marquee dragged in any direction (x1>x2, y1>y2)', () => {
    const objects = [{ id: 'obj-a', position: [0, 0, 0], visible: true }];
    // Dragged from bottom-right to top-left — bounds same as standard drag
    const marqueeRect = { x1: 600, y1: 500, x2: 300, y2: 200 };

    const ids = getObjectIdsInMarquee(objects, marqueeRect, mockProjectToScreen);

    expect(ids).toContain('obj-a');
  });

  it('should update selectedObjectIds in store when selectObjectsInMarquee is called', () => {
    const { selectObjectsInMarquee } = useStore.getState();
    selectObjectsInMarquee(['id-1', 'id-2']);

    const state = useStore.getState();
    expect(state.selectedObjectIds).toEqual(['id-1', 'id-2']);
    expect(state.selectedObjectId).toBe('id-2');
    expect(state.editMode).toBe('object');
  });

  it('should not change selection when marquee contains no objects', () => {
    useStore.setState({ selectedObjectIds: ['existing'], selectedObjectId: 'existing' });

    useStore.getState().selectObjectsInMarquee([]);

    expect(useStore.getState().selectedObjectIds).toEqual(['existing']);
  });

  it('should clear group and vertex selections when marquee selection is applied', () => {
    useStore.setState({ selectedGroupId: 'some-group', selectedJointIndex: 2 });

    useStore.getState().selectObjectsInMarquee(['id-1']);

    const state = useStore.getState();
    expect(state.selectedGroupId).toBeNull();
    expect(state.selectedJointIndex).toBeNull();
  });
});
