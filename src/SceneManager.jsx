import React from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import useStore from './useStore';

// Wrapper to forward double click to the Mesh component
const DoubleClickWrapper = ({ children, onDoubleClick }) => {
  const { camera } = useThree();
  return (
    <mesh
      onDoubleClick={onDoubleClick}
      onPointerMissed={() => camera.lookAt(0,0,0)}
    >
      {children}
    </mesh>
  );
};

const Scene = () => {
  const objects = useStore((state) => state.objects);
  const { setSelectedObjectId, setSelectedJointIndex } = useStore();

  const handleDoubleClick = (id) => {
    setSelectedObjectId(id);
    setSelectedJointIndex(null);
  };

  return (
    <Canvas camera={{ position: [4, 4, 4], fov: 45 }}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 10]} intensity={1.5} />
      <pointLight position={[-10, -10, -10]} intensity={1} />
      {objects.map(obj => (
        <DoubleClickWrapper key={obj.id} onDoubleClick={() => handleDoubleClick(obj.id)}>
          {/* Actual Mesh logic stays the same */}
          {obj.visible && <EditableMesh object={obj} />}
        </DoubleClickWrapper>
      ))}
      <Grid infiniteGrid />
      <OrbitControls />
    </Canvas>
  );
};

export default Scene;
