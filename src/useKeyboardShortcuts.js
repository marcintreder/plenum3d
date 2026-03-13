import { useEffect } from 'react';
import useStore from './useStore';

const useKeyboardShortcuts = () => {
  const { 
    selectedObjectId, 
    deleteObject, 
    setEditMode, 
    editMode,
    setSelectedJointIndex,
    setSelectedObjectId,
    undo,
    redo,
    addPrimitive,
    objects,
    updateObject
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      const key = e.key.toLowerCase();

      // --- Meta Shortcuts ---
      if (e.metaKey || e.ctrlKey) {
        // Undo/Redo (Cmd-Z / Cmd-Shift-Z)
        if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
          return;
        }

        // Duplication (Cmd-D)
        if (key === 'd') {
          e.preventDefault();
          if (selectedObjectId) {
            const obj = objects.find(o => o.id === selectedObjectId);
            if (obj) {
              const newObj = JSON.parse(JSON.stringify(obj));
              newObj.id = Math.random().toString(36).substr(2, 9);
              newObj.name += " (Copy)";
              newObj.position[0] += 0.5; // Offset copy
              useStore.setState((state) => ({ 
                objects: [...state.objects, newObj],
                selectedObjectId: newObj.id
              }));
              useStore.getState().saveHistory();
            }
          }
          return;
        }
      }

      // --- Simple Shortcuts ---

      // Delete (Backspace/Delete)
      if ((key === 'backspace' || key === 'delete') && selectedObjectId) {
        deleteObject(selectedObjectId);
      }

      // Deselect (Escape)
      if (key === 'escape') {
        setSelectedObjectId(null);
        setSelectedJointIndex(null);
      }

      // Mode Switch
      if (key === 'v') setEditMode('object');
      if (key === 'j') setEditMode('vertex');

      // Layer Cycling ([ and ])
      if (key === '[' || key === ']') {
        const currentIndex = objects.findIndex(o => o.id === selectedObjectId);
        let nextIndex = key === '[' ? currentIndex - 1 : currentIndex + 1;
        if (nextIndex < 0) nextIndex = objects.length - 1;
        if (nextIndex >= objects.length) nextIndex = 0;
        if (objects[nextIndex]) setSelectedObjectId(objects[nextIndex].id);
      }

      // Nudge (Arrows)
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) && selectedObjectId) {
        e.preventDefault();
        const obj = objects.find(o => o.id === selectedObjectId);
        if (obj) {
          const moveStep = e.shiftKey ? 0.5 : 0.1;
          const newPos = [...obj.position];
          if (key === 'arrowup') newPos[1] += moveStep;
          if (key === 'arrowdown') newPos[1] -= moveStep;
          if (key === 'arrowleft') newPos[0] -= moveStep;
          if (key === 'arrowright') newPos[0] += moveStep;
          updateObject(selectedObjectId, { position: newPos });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, deleteObject, setEditMode, editMode, setSelectedJointIndex, setSelectedObjectId, undo, redo, objects, updateObject]);
};

export default useKeyboardShortcuts;
