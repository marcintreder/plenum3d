import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { Settings, Layers, Box, MousePointer2, Download } from "lucide-react";
import EditableMesh from "./EditableMesh";
import JointManipulator from "./JointManipulator";
import Inspector from "./Inspector";
import Exporter from "./Exporter";
import useStore from "./useStore";
import { generate3DModel } from "./aiService";

const App = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [keys, setKeys] = useState(() => JSON.parse(localStorage.getItem("3d_figma_keys") || "{}"));
  const { setSelectedJointIndex, isGenerating, setGenerating, setGeometry, setExportRequested } = useStore();

  const saveKey = (provider, value) => {
    const newKeys = { ...keys, [provider]: value };
    setKeys(newKeys);
    localStorage.setItem("3d_figma_keys", JSON.stringify(newKeys));
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && prompt.trim() && !isGenerating) {
      setGenerating(true);
      try {
        const ollamaUrl = keys["Ollama URL"] || "http://localhost:11434";
        const newGeometry = await generate3DModel(prompt, ollamaUrl);
        setGeometry(newGeometry);
        setPrompt("");
      } catch (error) {
        console.error("Generation failed", error);
        alert("Failed to generate model. Ensure Ollama is running and accessible.");
      } finally {
        setGenerating(false);
      }
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0F0F0F] text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#1A1A1A] border-r border-[#333] p-4 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tighter text-white">Figma<span className="text-[#7C3AED]">3D</span></h1>
          <button 
            onClick={() => setModalOpen(true)}
            className="p-2 hover:bg-[#333] rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <Settings size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Tools</div>
          <button className="flex items-center gap-3 p-2 bg-[#7C3AED]/10 text-[#7C3AED] rounded-lg text-sm font-medium">
            <MousePointer2 size={16} /> Select
          </button>
          <button className="flex items-center gap-3 p-2 hover:bg-[#333] rounded-lg text-sm text-gray-400">
            <Layers size={16} /> Layers
          </button>
        </div>

        <div className="flex flex-col gap-1 mt-4">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Assets</div>
          <div className="p-3 bg-[#0F0F0F] border border-[#333] rounded-xl flex items-center gap-3 cursor-pointer hover:border-[#7C3AED] transition-colors">
            <div className="w-8 h-8 bg-[#7C3AED] rounded-lg flex items-center justify-center">
               <Box size={16} color="white" />
            </div>
            <span className="text-sm font-medium">Generic Mesh</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-auto">
          <button 
            onClick={() => setExportRequested(true)}
            className="flex items-center justify-center gap-2 p-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-200 transition-all shadow-lg"
          >
            <Download size={16} /> Download .GLB
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative bg-black" onClick={() => setSelectedJointIndex(null)}>
        <Canvas camera={{ position: [3, 3, 3], fov: 45 }} className="transition-opacity duration-500 ease-in-out">
          <color attach="background" args={["#0F0F0F"]} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 10]} intensity={1.5} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#7C3AED" />
          
          <Exporter />
          <EditableMesh />
          <JointManipulator />
          
          <Grid infiniteGrid fadeDistance={50} sectionColor="#333" cellColor="#222" />
          <OrbitControls makeDefault />
        </Canvas>

        {/* Floating Prompt Bar */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-10 transition-all duration-300 transform hover:scale-[1.01]" onClick={(e) => e.stopPropagation()}>
          <div className="relative group">
            <input 
              type="text" 
              placeholder={isGenerating ? "Consulting the AI geometry engine..." : "What shall we create today? (e.g. 'A futuristic car')"}
              disabled={isGenerating}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full bg-[#1A1A1A]/90 backdrop-blur-2xl border ${isGenerating ? 'border-[#7C3AED] shadow-[0_0_20px_rgba(124,58,237,0.3)] animate-pulse' : 'border-[#333] shadow-2xl'} p-5 rounded-3xl outline-none focus:border-[#7C3AED] transition-all text-sm pr-12 text-white font-medium`}
            />
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] bg-[#333] px-2 py-1 rounded-md text-gray-400 font-mono transition-opacity duration-200 ${prompt ? 'opacity-100' : 'opacity-0'}`}>
              {isGenerating ? "..." : "⏎"}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Inspector */}
      <Inspector />

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
