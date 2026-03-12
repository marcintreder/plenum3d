import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from './useStore';

const EditableMesh = () => {
  const { vertices, indices, color, materialType, metalness, roughness } = useStore();
  const meshRef = useRef();
  const [displayColor] = useState(() => new THREE.Color(color));

  const flatVertices = useMemo(() => {
    if (!vertices || vertices.length === 0) return new Float32Array([0,0,0, 1,0,0, 0,1,0]);
    return new Float32Array(vertices.flat());
  }, [vertices]);

  const flatIndices = useMemo(() => {
    if (!indices || indices.length === 0) return new Uint32Array([0,1,2]);
    return new Uint32Array(indices);
  }, [indices]);

  // Smooth color transition
  useFrame(() => {
    if (meshRef.current && meshRef.current.material) {
      displayColor.lerp(new THREE.Color(color || '#7C3AED'), 0.1);
      meshRef.current.material.color.copy(displayColor);
      
      // Gentle floating animation
      meshRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.05;
    }
  });

  // Scale in effect on new geometry
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.set(0.1, 0.1, 0.1);
    }
  }, [vertices]);

  useFrame(() => {
    if (meshRef.current && meshRef.current.scale.x < 1) {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  const MaterialComponent = useMemo(() => {
    const props = {
      metalness: metalness ?? 0.5,
      roughness: roughness ?? 0.5,
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

  const geomRef = useRef();

  useEffect(() => {
    if (geomRef.current) {
      geomRef.current.computeVertexNormals();
    }
  }, [vertices, indices]);

  if (!vertices || vertices.length < 3 || !indices || indices.length < 3) {
    return (
      <mesh position={[0, 0, 0]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#333" wireframe />
      </mesh>
    );
  }

  return (
    <mesh ref={meshRef}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          count={flatVertices.length / 3}
          array={flatVertices}
          itemSize={3}
        />
        <bufferAttribute
          attach="index"
          count={flatIndices.length}
          array={flatIndices}
          itemSize={1}
        />
      </bufferGeometry>
      {MaterialComponent}
    </mesh>
  );
};

export default EditableMesh;
