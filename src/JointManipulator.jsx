import React, { useRef, useMemo, useState } from 'react';
import { PivotControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import useStore from './useStore';

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

  const handleDrag = (matrix) => {
    if (selectedJointIndex === null) return;
    const position = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    matrix.decompose(position, q, s);
    
    // Crucial: The pivot controls are local to the object.
    // Ensure we are translating the vertex relative to the object's original position.
    updateVertex(selectedObjectId, selectedJointIndex, [position.x, position.y, position.z]);
  };

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
                  updateVertex(selectedObjectId, index, [pos.x, pos.y, pos.z]);
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
