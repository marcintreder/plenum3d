import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei';
import { Bot, Sparkles, ChevronRight, Layers, Zap, MousePointer2 } from 'lucide-react';

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
    <div className="relative w-full min-h-screen text-white" style={{ backgroundColor: theme.background }}>
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] flex items-center justify-center font-bold text-lg shadow-lg shadow-[#7C3AED]/20">P</div>
          <span className="text-2xl font-bold tracking-tighter">Plenum3D</span>
        </div>
        <button 
          onClick={onLogin}
          className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#1A1A1A] border border-[#333] hover:border-[#555] transition-all"
        >
          Sign in
        </button>
      </nav>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen text-center px-4 pt-32 pb-20">
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-6 max-w-5xl leading-none" style={{ color: theme.text }}>
          AI 3D Editor <br/> for <span style={{ color: theme.primary }}>Three.js</span>
        </h1>
        <p className="text-2xl text-gray-400 mb-12 max-w-2xl font-light">
          Build complex scenes faster with AI-assisted generation and procedural editing.
        </p>
        <button 
          onClick={onLogin}
          className="group flex items-center gap-2 px-12 py-5 rounded-full text-xl font-bold tracking-tight transition-all hover:scale-105 shadow-xl shadow-[#7C3AED]/20"
          style={{ backgroundColor: theme.primary, color: 'white' }}
        >
          Launch Editor <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Features Section */}
      <section className="relative z-20 px-8 py-24 bg-[#0A0A0A]/90 backdrop-blur-sm border-t border-[#1A1A1A]">
        <h2 className="text-4xl font-bold text-center mb-16">Powerful Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { title: "Intelligent Layer Management", icon: Layers, desc: "Organize and manipulate complex scene hierarchies effortlessly." },
            { title: "AI-Driven Shape Refinement", icon: Sparkles, desc: "Transform rough drafts into precise, production-ready models." },
            { title: "Real-time Canvas Panning", icon: MousePointer2, desc: "Smooth, interactive navigation designed for rapid iteration." }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-3xl bg-[#111] border border-[#222] hover:border-[#7C3AED]/50 transition-colors">
              <feature.icon className="w-10 h-10 text-[#7C3AED] mb-6" />
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-20 px-8 py-24 bg-[#0A0A0A]">
        <h2 className="text-4xl font-bold text-center mb-16">Why Plenum3D?</h2>
        <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto text-center">
          {["High-Speed Generation", "Browser-Native Performance", "Procedural Efficiency"].map((benefit, i) => (
            <div key={i} className="px-8 py-4 rounded-full bg-[#1A1A1A] border border-[#333] text-lg font-medium">
              {benefit}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
