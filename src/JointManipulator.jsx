import React, { useRef, useMemo, useState } from 'react';
import { PivotControls } from '@react-three/drei';
import * as THREE from 'three';
import useStore from './useStore';
import { getGridSnap } from './utils/GridManager';

const JointManipulator = () => {
  const objects = useStore((state) => state.objects);
  const selectedObjectId = useStore((state) => state.selectedObjectId);
  const selectedJointIndex = useStore((state) => state.selectedJointIndex);
  const setSelectedJointIndex = useStore((state) => state.setSelectedJointIndex);
  const updateVertex = useStore((state) => state.updateVertex);
  const editMode = useStore((state) => state.editMode);
  const saveHistory = useStore((state) => state.saveHistory);
  
  const [isDragging, setIsDragging] = useState(false);

  const selectedObject = useMemo(() => 
    objects.find(o => o.id === selectedObjectId), 
    [objects, selectedObjectId]
  );

  if (!selectedObject || !selectedObject.visible || editMode !== 'vertex') return null;

  return (
    <group name="JointManipulatorGroup">
      {selectedObject.vertices.map((vertex, index) => {
        const isSelected = selectedJointIndex === index;
        const vertexPos = new THREE.Vector3(...vertex);
        
        return (
          <group key={`${selectedObjectId}-${index}`}>
            {isSelected ? (
              <PivotControls
                depthTest={false}
                position={vertexPos}
                onDragStart={() => setIsDragging(true)}
                onDrag={(matrix) => {
                  const localMatrix = new THREE.Matrix4();
                  localMatrix.copy(selectedObject.meshRef?.current?.matrixWorld || new THREE.Matrix4()).invert().multiply(matrix);
                  const pos = new THREE.Vector3();
                  const q = new THREE.Quaternion();
                  const s = new THREE.Vector3();
                  localMatrix.decompose(pos, q, s);
                  const snapped = getGridSnap([pos.x, pos.y, pos.z], 0.1);
                  updateVertex(selectedObjectId, index, snapped);
                }}
                onDragEnd={() => {
                  setIsDragging(false);
                  saveHistory();
                }}
                scale={0.8}
                lineWidth={4}
                fixed
                displayValues={false}
                autoScale={false}
              >
                <mesh>
                  <sphereGeometry args={[0.08, 16, 16]} />
                  <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={3} />
                </mesh>
              </PivotControls>
            ) : (
              <mesh
                position={vertexPos}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedJointIndex(index);
                }}
              >
                <sphereGeometry args={[0.06, 12, 12]} />
                <meshStandardMaterial 
                  color="#ffffff" 
                  opacity={0.6} 
                  transparent 
                  depthTest={!isDragging}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default JointManipulator;
