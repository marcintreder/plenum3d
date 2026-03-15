import React, { useState, useEffect } from 'react';
import { PivotControls } from '@react-three/drei';
import * as THREE from 'three';
import useStore from './useStore';
import { getGridSnap } from './utils/GridManager';
import { getConstrainedPosition } from './utils/ConstraintManager';

const JointManipulator = () => {
  const { objects, selectedObjectId, selectedJointIndex, setSelectedJointIndex, updateVertex, editMode, saveHistory } = useStore();
  const [axis, setAxis] = useState(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'x') setAxis('x');
      if (e.key === 'y') setAxis('y');
      if (e.key === 'z') setAxis('z');
    };
    const onKeyUp = () => setAxis(null);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const selectedObject = objects.find(o => o.id === selectedObjectId);
  if (!selectedObject || editMode !== 'vertex' || selectedJointIndex === null) return null;

  return (
    <PivotControls
      position={new THREE.Vector3(...selectedObject.vertices[selectedJointIndex])}
      onDrag={(matrix) => {
        const pos = new THREE.Vector3();
        matrix.decompose(pos, new THREE.Quaternion(), new THREE.Vector3());
        let snapped = getGridSnap([pos.x, pos.y, pos.z], 0.1);
        if (axis) snapped = getConstrainedPosition(snapped, axis, selectedObject.vertices[selectedJointIndex]);
        updateVertex(selectedObjectId, selectedJointIndex, snapped);
      }}
      onDragEnd={saveHistory}
    />
  );
};
export default JointManipulator;
