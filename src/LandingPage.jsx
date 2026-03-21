import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei';
import { Bot, Sparkles, ChevronRight } from 'lucide-react';

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

const LandingPage = ({ onLogin }) => {
  const theme = {
    background: "#0A0A0A",
    primary: "#7C3AED",
    text: "#F8FAFC",
  };

  return (
    <div className="relative w-full h-screen overflow-hidden text-white" style={{ backgroundColor: theme.background }}>
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <AnimatedBackground />
        </Canvas>
        <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to bottom, rgba(10, 10, 10, 0.4), #0A0A0A)" }} />
      </div>

      {/* Navigation */}
      <nav className="absolute top-0 left-0 w-full p-8 z-30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center font-bold">P</div>
          <span className="text-xl font-bold tracking-tight">Sculpt3D</span>
        </div>
        <button 
          onClick={onLogin}
          className="px-6 py-2 rounded-full text-sm font-bold bg-[#1A1A1A] border border-[#333] hover:border-[#555] transition-all"
        >
          Sign in
        </button>
      </nav>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#A78BFA] text-sm font-medium mb-6">
          <Sparkles size={14} /> Powered by Advanced AI
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 max-w-4xl" style={{ color: theme.text }}>
          Transform Prompts into <span style={{ color: theme.primary }}>3D Models</span> Instantly.
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl">
          The world's most intuitive AI 3D JS tool. Build complex geometry, animate scenes, and export assets with just a text prompt.
        </p>
        <button 
          onClick={onLogin}
          className="group flex items-center gap-2 px-10 py-4 rounded-full text-lg font-bold tracking-tight transition-all hover:scale-105 shadow-xl shadow-[#7C3AED]/20"
          style={{ backgroundColor: theme.primary, color: 'white' }}
        >
          Launch Editor <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
