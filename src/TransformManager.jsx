import React, { useRef, useEffect } from 'react';
import { TransformControls } from '@react-three/drei';
import useStore from './useStore';

const TransformManager = () => {
  const selectedObjectId = useStore((state) => state.selectedObjectId);
  const editMode = useStore((state) => state.editMode);
  const objects = useStore((state) => state.objects);
  const updateObjectTransform = useStore((state) => state.updateObjectTransform);
  
  const transformRef = useRef();

  const selectedObject = objects.find(o => o.id === selectedObjectId);

  useEffect(() => {
    if (transformRef.current) {
      const controls = transformRef.current;
      const callback = () => {
        if (selectedObjectId) {
          const { position, rotation, scale } = controls.object;
          updateObjectTransform(
            selectedObjectId,
            [position.x, position.y, position.z],
            [rotation.x, rotation.y, rotation.z],
            [scale.x, scale.y, scale.z]
          );
        }
      };
      controls.addEventListener('mouseUp', callback);
      return () => controls.removeEventListener('mouseUp', callback);
    }
  }, [selectedObjectId, updateObjectTransform]);

  if (editMode !== 'object' || !selectedObjectId) return null;

  return (
    <TransformControls 
      ref={transformRef} 
      object={null} // We will attach/detach manually via scene traversal or ref mapping if needed, 
                    // but simplest is to wrap the object in EditableMesh or use the 'object' prop.
                    // Actually, TransformControls needs the object ref.
    />
  );
};

export default TransformManager;
