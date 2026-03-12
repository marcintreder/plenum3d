export const generateR3FCode = (objects) => {
  const meshCode = objects.map(obj => {
    if (!obj.visible) return '';
    
    const pos = obj.position ? `[${obj.position.map(v => v.toFixed(2)).join(', ')}]` : '[0, 0, 0]';
    const rot = obj.rotation ? `[${obj.rotation.map(v => v.toFixed(2)).join(', ')}]` : '[0, 0, 0]';
    const scl = obj.scale ? `[${obj.scale.map(v => v.toFixed(2)).join(', ')}]` : '[1, 1, 1]';
    
    // Flatten vertices for code display
    const vertices = `[${obj.vertices.map(v => `[${v.join(', ')}]`).join(', ')}]`;
    const indices = `[${obj.indices.join(', ')}]`;

    return `
      <mesh 
        name="${obj.name}" 
        position={${pos}} 
        rotation={${rot}} 
        scale={${scl}}
      >
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={${obj.vertices.length}}
            array={new Float32Array(${vertices}.flat())}
            itemSize={3}
          />
          <bufferAttribute
            attach="index"
            count={${obj.indices.length}}
            array={new Uint32Array(${indices})}
            itemSize={1}
          />
        </bufferGeometry>
        <meshPhysicalMaterial 
          color="${obj.color}" 
          metalness={${obj.metalness}} 
          roughness={${obj.roughness}} 
          ${obj.materialType === 'wireframe' ? 'wireframe' : ''}
        />
      </mesh>`;
  }).join('\n');

  return `
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';

const Scene = () => {
  return (
    <Canvas camera={{ position: [3, 3, 3] }}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 10]} intensity={1.5} />
      ${meshCode}
      <OrbitControls />
      <Grid infiniteGrid />
    </Canvas>
  );
};

export default Scene;
  `.trim();
};
