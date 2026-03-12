import React, { useRef, useMemo } from 'react';
import { PivotControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import useStore from './useStore';

const JointManipulator = () => {
  const vertices = useStore((state) => state.vertices);
  const selectedJointIndex = useStore((state) => state.selectedJointIndex);
  const setSelectedJointIndex = useStore((state) => state.setSelectedJointIndex);
  const updateVertex = useStore((state) => state.updateVertex);
  
  const onDrag = (matrix) => {
    if (selectedJointIndex === null) return;
    
    // Extract position from matrix
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    matrix.decompose(position, quaternion, scale);
    
    updateVertex(selectedJointIndex, [position.x, position.y, position.z]);
  };

  return (
    <group>
      {vertices.map((vertex, index) => (
        <React.Fragment key={index}>
          {selectedJointIndex === index ? (
            <PivotControls
              depthTest={false}
              anchor={vertex}
              onDrag={onDrag}
              scale={0.5}
              lineWidth={2}
              fixed
              activeAxes={[true, true, true]}
            >
              <Sphere
                args={[0.05, 16, 16]}
                position={vertex}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedJointIndex(index);
                }}
              >
                <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={2} />
              </Sphere>
            </PivotControls>
          ) : (
            <Sphere
              args={[0.04, 16, 16]}
              position={vertex}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedJointIndex(index);
              }}
            >
              <meshStandardMaterial color="#555" />
            </Sphere>
          )}
        </React.Fragment>
      ))}
    </group>
  );
};

export default JointManipulator;
