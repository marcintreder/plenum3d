import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { 
  Settings, Box, MousePointer2, Download, Circle, Square, 
  Triangle, Cylinder as CylinderIcon, Code, Scissors, Move,
  Undo2, Redo2
} from "lucide-react";
import EditableMesh from "./EditableMesh";
import JointManipulator from "./JointManipulator";
import Inspector from "./Inspector";
import Exporter from "./Exporter";
import CodeView from "./CodeView";
import useStore from "./useStore";
import useKeyboardShortcuts from "./useKeyboardShortcuts";
import { generate3DModel } from "./aiService";

const App = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isCodeViewOpen, setCodeViewOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [keys, setKeys] = useState(() => JSON.parse(localStorage.getItem("3d_sculpt_keys") || "{}"));
  
  const { 
    objects,
    setSelectedJointIndex, 
    isGenerating, 
    setGenerating, 
    setGeometry, 
    setExportRequested, 
    addPrimitive,
    editMode,
    setEditMode,
    undo,
    redo,
    historyIndex,
    history
  } = useStore();

  // Activate global shortcuts
  useKeyboardShortcuts();

  const saveKey = (provider, value) => {
    const newKeys = { ...keys, [provider]: value };
    setKeys(newKeys);
    localStorage.setItem("3d_sculpt_keys", JSON.stringify(newKeys));
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
    <div className="flex h-screen w-screen bg-[#0F0F0F] text-white overflow-hidden font-sans select-none">
      {/* Sidebar: Simplified Editor Mode Switchers */}
      <div className="w-64 bg-[#1A1A1A] border-r border-[#333] p-4 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tighter text-white italic">Sculpt<span className="text-[#7C3AED]">3D</span></h1>
          <div className="flex gap-2">
            <button 
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-[#333] rounded-lg text-gray-500 hover:text-white disabled:opacity-20"
            >
              <Undo2 size={16} />
            </button>
            <button 
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-[#333] rounded-lg text-gray-500 hover:text-white disabled:opacity-20"
            >
              <Redo2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Editor Mode</div>
          <div className="grid grid-cols-2 gap-2">
            <button 
              id="object-mode-btn"
              onClick={() => setEditMode('object')}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${
                editMode === 'object' ? 'bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]' : 'bg-[#222] text-gray-400 hover:bg-[#333]'
              }`}
            >
              Object
            </button>
            <button 
              id="sculpt-mode-btn"
              onClick={() => setEditMode('vertex')}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${
                editMode === 'vertex' ? 'bg-[#06B6D4] text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-[#222] text-gray-400 hover:bg-[#333]'
              }`}
            >
              Sculpt
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-4">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Primitives</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'cube', icon: Square, label: 'Cube' },
              { id: 'sphere', icon: Circle, label: 'Sphere' },
              { id: 'cylinder', icon: CylinderIcon, label: 'Cylinder' },
              { id: 'cone', icon: Triangle, label: 'Cone', class: 'rotate-180' }
            ].map(prim => (
              <button 
                key={prim.id}
                onClick={() => addPrimitive(prim.id)}
                className="flex items-center gap-2 p-2 hover:bg-[#333] rounded-lg text-[10px] text-gray-400 hover:text-white transition-colors border border-transparent hover:border-[#333]"
              >
                <prim.icon size={12} className={prim.class} /> {prim.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-4">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Developer</div>
          <button 
            onClick={() => setCodeViewOpen(true)}
            className="flex items-center gap-3 p-2 hover:bg-[#333] rounded-lg text-sm text-gray-400 hover:text-white transition-all"
          >
            <Code size={16} /> View R3F Code
          </button>
        </div>

        <div className="flex flex-col gap-1 mt-auto">
          <button 
            onClick={() => setExportRequested(true)}
            className="flex items-center justify-center gap-2 p-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-200 transition-all shadow-lg active:scale-95"
          >
            <Download size={16} /> Export .GLB
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative bg-black">
        <Canvas 
          camera={{ position: [5, 5, 5], fov: 45 }} 
          className="transition-opacity duration-500 ease-in-out"
          onPointerMissed={() => setSelectedJointIndex(null)}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          shadows
        >
          <color attach="background" args={["#0F0F0F"]} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 10]} intensity={1.5} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#7C3AED" />
          
          <Exporter />
          {objects.map(obj => (
            <EditableMesh key={obj.id} object={obj} />
          ))}
          <JointManipulator />
          
          <Grid infiniteGrid fadeDistance={50} sectionColor="#333" cellColor="#222" />
          <OrbitControls makeDefault />
        </Canvas>

        {/* Floating Prompt Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-10 transition-all duration-300 transform hover:scale-[1.01]" onClick={(e) => e.stopPropagation()}>
          <div className="relative group">
            <input 
              type="text" 
              placeholder={isGenerating ? "Synthesizing geometry..." : "AI Command: 'A vintage radio'"}
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

      {/* Overlays */}
      <CodeView isOpen={isCodeViewOpen} onClose={() => setCodeViewOpen(false)} />

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
