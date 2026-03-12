import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box, Grid } from "@react-three/drei";
import { Settings } from "lucide-react";

const App = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [keys, setKeys] = useState(() => JSON.parse(localStorage.getItem("3d_figma_keys") || "{}"));

  const saveKey = (provider, value) => {
    const newKeys = { ...keys, [provider]: value };
    setKeys(newKeys);
    localStorage.setItem("3d_figma_keys", JSON.stringify(newKeys));
  };

  return (
    <div className="flex h-screen w-screen bg-[#0F0F0F] text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#1A1A1A] border-r border-[#333] p-4 flex flex-col gap-4">
        <h1 className="text-xl font-bold tracking-tighter text-[#7C3AED]">3D FIGMA</h1>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 p-2 hover:bg-[#333] rounded-lg transition-colors text-sm"
        >
          <Settings size={16} /> Settings
        </button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative">
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
          <color attach="background" args={["#0F0F0F"]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Box args={[1, 1, 1]}>
            <meshStandardMaterial color="#7C3AED" />
          </Box>
          <Grid infiniteGrid fadeDistance={50} sectionColor="#333" cellColor="#222" />
          <OrbitControls makeDefault />
        </Canvas>

        {/* Floating Prompt Bar */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-xl">
          <input 
            type="text" 
            placeholder="Describe a 3D object (e.g., An F1 car with carbon fiber finish)..."
            className="w-full bg-[#1A1A1A]/80 backdrop-blur-md border border-[#333] p-4 rounded-2xl shadow-2xl outline-none focus:border-[#7C3AED] transition-all text-sm"
          />
        </div>
      </div>

      {/* BYOK Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#333] p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Provider Settings</h2>
            <div className="space-y-4">
              {["OpenAI", "Anthropic", "Gemini", "Ollama URL"].map(provider => (
                <div key={provider}>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">{provider}</label>
                  <input 
                    type="password" 
                    placeholder={provider === "Ollama URL" ? "http://localhost:11434" : "Enter API Key..."}
                    value={keys[provider] || ""}
                    onChange={(e) => saveKey(provider, e.target.value)}
                    className="w-full bg-[#0F0F0F] border border-[#333] p-3 rounded-xl outline-none focus:border-[#7C3AED]"
                  />
                </div>
              ))}
            </div>
            <button 
              onClick={() => setModalOpen(false)}
              className="mt-8 w-full bg-[#7C3AED] p-4 rounded-xl font-bold hover:brightness-110 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
