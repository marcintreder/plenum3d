import { describe, it, expect } from 'vitest';
import useStore from '../../src/useStore';

describe('Shortcut Modal', () => {
    it('toggles modal state', () => {
        const { isShortcutModalOpen, toggleShortcutModal } = useStore.getState();
        expect(isShortcutModalOpen).toBe(false);
        toggleShortcutModal();
        expect(useStore.getState().isShortcutModalOpen).toBe(true);
    });
});
