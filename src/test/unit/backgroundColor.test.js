import { describe, it, expect } from 'vitest';
import useStore from '../../src/useStore';

describe('Background color', () => {
    it('updates background color in scene state', () => {
        const { setBackgroundColor, scenes, activeSceneId } = useStore.getState();
        const newColor = '#ff0000';
        setBackgroundColor(newColor);
        const { scenes: updatedScenes } = useStore.getState();
        const activeScene = updatedScenes.find(s => s.id === activeSceneId);
        expect(activeScene.backgroundColor).toBe(newColor);
    });
});
