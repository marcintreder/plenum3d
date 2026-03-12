import React, { useRef, useMemo } from 'react';
import { PivotControls, Sphere } from '@react-three/drei';
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
    
    // We update the store. Note: This will trigger a re-render of this component.
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
                onDrag={handleDrag}
                onDragEnd={saveHistory}
                scale={0.75}
                lineWidth={3}
                fixed
                disableAxes={false}
                displayValues={false}
                autoScale={false}
              >
                <Sphere
                  args={[0.07, 16, 16]}
                  position={vertex}
                  onClick={(e) => e.stopPropagation()}
                >
                  <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={2} />
                </Sphere>
              </PivotControls>
            ) : (
              <Sphere
                args={[0.05, 12, 12]}
                position={vertex}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedJointIndex(index);
                }}
              >
                <meshStandardMaterial color="#ffffff" opacity={0.5} transparent />
              </Sphere>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default JointManipulator;
