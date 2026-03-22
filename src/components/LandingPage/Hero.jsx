import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { generateF1 } from '../../f1Model';

function F1Scene() {
  const model = useMemo(() => generateF1(), []);
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1} color="#A78BFA" />
      <directionalLight position={[-5, -3, -5]} intensity={0.3} color="#7C3AED" />
      <group scale={0.18} position={[0, -0.5, 0]}>
        {model.objects.map(obj => (
          <mesh key={obj.id} position={obj.position} rotation={obj.rotation} scale={obj.scale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={obj.color} metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.5} />
    </>
  );
}

export const Hero = ({ onLaunch }) => (
  <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#0e0e0e]">
    {/* Fixed nav */}
    <nav className="fixed top-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex justify-between items-center px-12 py-5 max-w-[1440px] mx-auto">
        <div className="text-xl font-black tracking-tighter text-white">
          Plenum<span className="text-[#7C3AED]">3D</span>
        </div>
        <a
          href="/auth/google"
          className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors border border-[#333] hover:border-[#7C3AED]/50 px-5 py-2 rounded-full"
        >
          Sign in
        </a>
      </div>
    </nav>

    {/* Ambient glow */}
    <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#7C3AED]/15 blur-[120px] rounded-full pointer-events-none" />
    <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#A78BFA]/8 blur-[160px] rounded-full pointer-events-none" />

    {/* Hero content */}
    <main className="max-w-[1440px] mx-auto px-12 pt-40 pb-24 w-full flex-1 relative z-10">
      <div className="grid lg:grid-cols-12 gap-16 items-center">
        {/* Left: text */}
        <div className="lg:col-span-6 flex flex-col items-start gap-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A1A1A] rounded-full border border-[#333]">
            <span className="w-2 h-2 rounded-full bg-[#7C3AED] shadow-[0_0_8px_#7C3AED]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A78BFA]">Powered by AI</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[0.92] text-white">
            AI-Powered<br />
            3D Modeling<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#7C3AED] to-[#A78BFA]">For Everyone</span>
          </h1>

          <p className="text-xl text-[#9CA3AF] leading-relaxed max-w-lg">
            Describe an object to the AI agent, have it generate it with r3f (three.js) and get into tweaking it with advanced tooling
          </p>

          <button
            onClick={onLaunch}
            className="px-8 py-4 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white font-bold rounded-full shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)] hover:shadow-[0_0_50px_-5px_rgba(124,58,237,0.6)] transition-all hover:scale-[1.02] active:scale-95"
          >
            Start Building Free
          </button>

          <p className="text-xs text-[#6B7280]">No credit card required · Works in your browser</p>
        </div>

        {/* Right: live F1 3D viewport */}
        <div className="lg:col-span-6 relative">
          <div className="absolute -inset-4 bg-gradient-to-br from-[#7C3AED]/15 to-transparent blur-2xl opacity-50 rounded-3xl" />
          <div className="relative bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden shadow-2xl">
            {/* Viewport header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2A2A2A] bg-[#151515]">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              <span className="ml-3 text-[11px] text-[#6B7280] font-mono">plenum3d — Scene Editor</span>
            </div>

            {/* Live 3D canvas */}
            <div className="relative aspect-video bg-[#0F0F0F]">
              <Canvas camera={{ position: [4, 2, 4], fov: 50 }}>
                <F1Scene />
              </Canvas>

              {/* AI prompt overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-[#1A1A1A]/90 backdrop-blur border border-[#7C3AED]/30 rounded-xl p-4 pointer-events-none">
                <div className="text-[11px] text-[#6B7280] mb-1 uppercase tracking-widest font-semibold">AI Prompt</div>
                <div className="text-sm text-white font-medium">"A sleek Formula 1 racing car in metallic red"</div>
                <div className="mt-2 h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] rounded-full" />
                </div>
              </div>

              {/* Corner decoration */}
              <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-[#7C3AED]/30 rounded-tr-xl pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </main>

    {/* Scroll hint */}
    <div className="text-center pb-8 relative z-10">
      <span className="text-[10px] text-[#6B7280] uppercase tracking-widest font-semibold">Scroll to explore</span>
    </div>
  </section>
);
