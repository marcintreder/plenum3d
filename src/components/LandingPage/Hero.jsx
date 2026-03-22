import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { generateF1 } from '../../f1Model';
import { OrbitControls } from '@react-three/drei';

export const Hero = ({ design, onLaunch }) => {
  const model = useMemo(() => generateF1(), []);
  return (
    <section className="py-20 px-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div>
        <h1 className="text-6xl font-bold mb-6">{design.headline}</h1>
        <p className="text-xl text-gray-400 mb-8 max-w-lg">Describe an object to the AI agent, have it generate it with r3f (three.js) and get into tweaking it with advanced tooling</p>
        <button onClick={onLaunch} className="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold">
          {design.cta}
        </button>
        <div className="mt-4 text-sm text-gray-500">Powered by AI</div>
      </div>
      <div className="h-96 bg-[#1A1A1A] rounded-xl overflow-hidden relative">
        <Canvas camera={{ position: [5, 5, 5] }}>
          <ambientLight intensity={0.5} />
          <group>
            {model.objects.map(obj => (
              <mesh key={obj.id} position={[0,0,0]}>
                <boxGeometry args={[0.2, 0.2, 0.2]} />
                <meshStandardMaterial color={obj.color} />
              </mesh>
            ))}
          </group>
          <OrbitControls />
        </Canvas>
        <div className="absolute bottom-4 left-4 bg-black/50 p-2 rounded text-xs text-white">
          Prompt: "A sleek Formula 1 racing car in metallic red"
        </div>
      </div>
    </section>
  );
};
