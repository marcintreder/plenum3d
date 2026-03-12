import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from './useStore';

const EditableMesh = () => {
  const { vertices, indices, color, materialType, metalness, roughness } = useStore();
  const meshRef = useRef();
  const [displayColor] = useState(() => new THREE.Color(color));

  const flatVertices = useMemo(() => new Float32Array(vertices.flat()), [vertices]);
  const flatIndices = useMemo(() => new Uint32Array(indices), [indices]);

  // Smooth color transition
  useFrame(() => {
    if (meshRef.current) {
      displayColor.lerp(new THREE.Color(color), 0.1);
      meshRef.current.material.color.copy(displayColor);
      
      // Gentle floating animation
      meshRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.05;
    }
  });

  // Scale in effect on new geometry
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.set(0, 0, 0);
    }
  }, [vertices]);

  useFrame(() => {
    if (meshRef.current && meshRef.current.scale.x < 1) {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  const MaterialComponent = useMemo(() => {
    const props = {
      metalness,
      roughness,
      transparent: true,
      opacity: 0.9,
    };

    switch (materialType) {
      case 'physical':
        return <meshPhysicalMaterial {...props} />;
      case 'wireframe':
        return <meshStandardMaterial {...props} wireframe />;
      default:
        return <meshStandardMaterial {...props} />;
    }
  }, [materialType, metalness, roughness]);

  return (
    <mesh ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={vertices.length}
          array={flatVertices}
          itemSize={3}
        />
        <bufferAttribute
          attach="index"
          count={indices.length}
          array={flatIndices}
          itemSize={1}
        />
      </bufferGeometry>
      {MaterialComponent}
    </mesh>
  );
};

export default EditableMesh;
