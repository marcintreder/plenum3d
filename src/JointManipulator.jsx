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
    
    updateVertex(selectedObjectId, selectedJointIndex, [position.x, position.y, position.z]);
  };

  return (
    <group>
      {selectedObject.vertices.map((vertex, index) => {
        const isSelected = selectedJointIndex === index;
        
        return (
          <group key={`${selectedObjectId}-${index}`}>
            {isSelected ? (
              <PivotControls
                depthTest={false}
                anchor={vertex}
                onDragStart={() => setIsDragging(true)}
                onDrag={handleDrag}
                onDragEnd={() => {
                  setIsDragging(false);
                  saveHistory();
                }}
                scale={0.8}
                lineWidth={4}
                fixed
                disableAxes={false}
                displayValues={false}
                autoScale={false}
              >
                <Sphere
                  args={[0.08, 16, 16]}
                  position={vertex}
                  onClick={(e) => e.stopPropagation()}
                >
                  <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={3} />
                </Sphere>
              </PivotControls>
            ) : (
              <Sphere
                args={[0.06, 12, 12]}
                position={vertex}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedJointIndex(index);
                }}
              >
                <meshStandardMaterial 
                  color="#ffffff" 
                  opacity={0.6} 
                  transparent 
                  depthTest={!isDragging} // Make them invisible while dragging for clarity
                />
              </Sphere>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default JointManipulator;
