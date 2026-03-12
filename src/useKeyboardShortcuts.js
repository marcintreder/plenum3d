import { useEffect } from 'react';
import useStore from './useStore';

const useKeyboardShortcuts = () => {
  const { 
    selectedObjectId, 
    deleteObject, 
    setEditMode, 
    editMode,
    setSelectedJointIndex,
    setSelectedObjectId
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      const key = e.key.toLowerCase();

      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && key === 'z') {
        if (e.shiftKey) {
          useStore.getState().redo();
        } else {
          useStore.getState().undo();
        }
        e.preventDefault();
        return;
      }

      // Delete object (Backspace or Delete)
      if ((key === 'backspace' || key === 'delete') && selectedObjectId) {
        deleteObject(selectedObjectId);
      }

      // Deselect (Escape)
      if (key === 'escape') {
        setSelectedObjectId(null);
        setSelectedJointIndex(null);
      }

      // Switch Modes
      if (key === 'v') setEditMode('object'); // V for Move/Object mode
      if (key === 'j') setEditMode('vertex'); // J for Joint/Vertex mode

      // Multi-select or precision (Placeholder for future logic)
      if (e.shiftKey) {
        // shift logic here
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, deleteObject, setEditMode, editMode, setSelectedJointIndex, setSelectedObjectId]);
};

export default useKeyboardShortcuts;
