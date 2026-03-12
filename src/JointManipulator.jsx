import React, { useRef } from 'react';
import { PivotControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import useStore from './useStore';

const JointManipulator = () => {
  const objects = useStore((state) => state.objects);
  const selectedObjectId = useStore((state) => state.selectedObjectId);
  const selectedJointIndex = useStore((state) => state.selectedJointIndex);
  const setSelectedJointIndex = useStore((state) => state.setSelectedJointIndex);
  const updateVertex = useStore((state) => state.updateVertex);

  const selectedObject = objects.find(o => o.id === selectedObjectId);
  if (!selectedObject || !selectedObject.visible) return null;

  const onDrag = (matrix) => {
    if (selectedJointIndex === null) return;
    const position = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    matrix.decompose(position, q, s);
    updateVertex(selectedObjectId, selectedJointIndex, [position.x, position.y, position.z]);
  };

  return (
    <group>
      {selectedObject.vertices.map((vertex, index) => (
        <React.Fragment key={`${selectedObjectId}-${index}`}>
          {selectedJointIndex === index ? (
            <PivotControls
              depthTest={false}
              anchor={vertex}
              onDrag={onDrag}
              scale={0.5}
              lineWidth={2}
              fixed
              activeAxes={[true, true, true]}
              displayValues={false}
            >
              <Sphere
                args={[0.05, 16, 16]}
                position={vertex}
                onClick={(e) => { e.stopPropagation(); setSelectedJointIndex(index); }}
              >
                <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={2} />
              </Sphere>
            </PivotControls>
          ) : (
            <Sphere
              args={[0.04, 16, 16]}
              position={vertex}
              onClick={(e) => { e.stopPropagation(); setSelectedJointIndex(index); }}
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
