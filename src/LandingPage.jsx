import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei';

function AnimatedBackground() {
  const mesh = useRef();
  useFrame((state) => {
    mesh.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.5;
  });
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={mesh} args={[1, 64, 64]} scale={2}>
        <MeshDistortMaterial
          color="#7C3AED"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0}
        />
      </Sphere>
    </Float>
  );
}

const LandingPage = () => {
  const theme = {
    background: "#0A0A0A",
    primary: "#7C3AED",
    text: "#F8FAFC",
  };

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: theme.background }}>
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <AnimatedBackground />
        </Canvas>
        <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to bottom, rgba(10, 10, 10, 0.4), #0A0A0A)" }} />
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
        <h1 className="text-7xl md:text-9xl font-bold tracking-tighter mb-8" style={{ color: theme.text }}>
          The Future of 3D Design.
        </h1>
        <button 
          className="px-10 py-4 rounded-full text-xl font-bold tracking-tight transition-all hover:scale-105 shadow-lg"
          style={{ backgroundColor: theme.primary, color: 'white' }}
        >
          Launch Editor
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
