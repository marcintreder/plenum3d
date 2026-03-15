import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import {
  Settings, Download, Circle, Square,
  Triangle, Cylinder as CylinderIcon, Code,
  Undo2, Redo2, Bot, Sparkles, Paperclip, Terminal, Sun
} from "lucide-react";
import ConsolePanel from "./components/ConsolePanel";
import EditableMesh from "./EditableMesh";
import Inspector from "./Inspector";
import Exporter from "./Exporter";
import CodeView from "./CodeView";
import useStore from "./useStore";
import useKeyboardShortcuts from "./useKeyboardShortcuts";
import { generate3DModel } from "./aiService";
import { executeAgentCommand, resolveTargets } from "./agentService";

const COMMERCIAL_MODELS = {
  Anthropic: ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5-20251001'],
  OpenAI:    ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1', 'gpt-4.1-mini'],
  Gemini:    ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-pro'],
};

const MODEL_LABELS = {
  'claude-sonnet-4-6':       'Sonnet 4.6',
  'claude-opus-4-6':         'Opus 4.6',
  'claude-haiku-4-5-20251001':'Haiku 4.5',
  'gpt-4o':                  'GPT-4o',
  'gpt-4o-mini':             '4o mini',
  'gpt-4.1':                 'GPT-4.1',
  'gpt-4.1-mini':            '4.1 mini',
  'gemini-2.0-flash':        'Flash 2.0',
  'gemini-1.5-flash':        'Flash 1.5',
  'gemini-1.5-pro':          'Pro 1.5',
  'gemini-2.5-pro':          'Pro 2.5',
};

const App = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isCodeViewOpen, setCodeViewOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [keys, setKeys] = useState(() => JSON.parse(localStorage.getItem("3d_sculpt_keys") || "{}"));
  const [refImage, setRefImage] = useState(null);
  const [isCommandMode, setIsCommandMode] = useState(false);
  const [agentFeedback, setAgentFeedback] = useState(null);
  const [ollamaModels, setOllamaModels] = useState([]);
  const [ollamaModelsFetching, setOllamaModelsFetching] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [providerOverride, setProviderOverride] = useState(null);
  const [modelOverride, setModelOverride] = useState(null);
  const [lightOpen, setLightOpen] = useState(false);
  const [light, setLight] = useState({ ambientInt: 1.5, dirInt: 1.5, azimuth: 45, elevation: 45 });

  const addLog = useCallback((type, msg) => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setConsoleLogs(prev => {
      const next = [...prev, { id: Date.now() + Math.random(), ts, type, msg }];
      return next.length > 100 ? next.slice(next.length - 100) : next;
    });
  }, []);

  const fileInputRef = React.useRef(null);

  const {
    objects,
    groups,
    setSelectedObjectId,
    isGenerating,
    setGenerating,
    setGeometry,
    addObjects,
    setExportRequested,
    addPrimitive,
    deleteObject,
    removeGroup,
    editMode,
    setEditMode,
    orbitEnabled,
    undo,
    redo,
    historyIndex,
    history,
    saveHistory,
    scaleUniform,
    smoothObject,
    updateObject,
    batchUpdatePositions,
    addGroup,
    setObjectGroup,
  } = useStore();

  // Available providers — Auto plus any configured ones
  const providerOptions = useMemo(() => {
    const opts = [{ id: null, label: 'Auto' }];
    if (keys.Anthropic) opts.push({ id: 'Anthropic', label: 'Claude' });
    if (keys.OpenAI)    opts.push({ id: 'OpenAI',    label: 'GPT-4o' });
    if (keys.Gemini)    opts.push({ id: 'Gemini',    label: 'Gemini' });
    opts.push({ id: 'Ollama', label: 'Ollama' });
    return opts;
  }, [keys]);

  // Model options for the selected commercial provider
  const modelOptions = useMemo(() => {
    if (!providerOverride || providerOverride === 'Ollama') return [];
    return COMMERCIAL_MODELS[providerOverride] || [];
  }, [providerOverride]);

  // Reset model override when provider changes
  useEffect(() => { setModelOverride(null); }, [providerOverride]);

  // Activate global shortcuts
  useKeyboardShortcuts();

  const saveKey = (provider, value) => {
    const newKeys = { ...keys, [provider]: value };
    setKeys(newKeys);
    localStorage.setItem("3d_sculpt_keys", JSON.stringify(newKeys));
  };

  const fetchOllamaModels = async () => {
    const url = keys["Ollama URL"] || "http://localhost:11434";
    setOllamaModelsFetching(true);
    setOllamaModels([]);
    try {
      const res = await fetch(`${url}/api/tags`);
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setOllamaModels((data.models || []).map(m => m.name));
    } catch {
      setOllamaModels(null); // null = error
    } finally {
      setOllamaModelsFetching(false);
    }
  };

  // Auto-fetch models whenever Settings opens so the list is always current
  useEffect(() => {
    if (isModalOpen) fetchOllamaModels();
  }, [isModalOpen]);

  // Execute a parsed agent operation against the store
  const executeOp = ({ tool, input }) => {
    const { objects: objs, groups: grps } = useStore.getState();
    const targets = resolveTargets(input.target || 'all', objs, grps);
    if (!targets.length) return;

    switch (tool) {
      case 'scale_objects': {
        const factor = 1 + (input.percent / 100);
        // If all targets share the same group, use scaleGroup (shared centroid keeps
        // parts in correct relative positions). Otherwise scale each object individually.
        const groupIds = [...new Set(targets.map(o => o.groupId).filter(Boolean))];
        const allSameGroup = groupIds.length === 1 && targets.every(o => o.groupId === groupIds[0]);
        if (allSameGroup) {
          useStore.getState().scaleGroup(groupIds[0], factor);
        } else {
          targets.forEach(obj => scaleUniform(obj.id, factor));
        }
        break;
      }
      case 'smooth_objects':
        targets.forEach(obj => smoothObject(obj.id, input.iterations ?? 2, input.factor ?? 0.5));
        break;
      case 'change_color':
        targets.forEach(obj => updateObject(obj.id, { color: input.color }));
        break;
      case 'change_material':
        targets.forEach(obj => {
          const upd = {};
          if (input.materialType !== undefined) upd.materialType = input.materialType;
          if (input.metalness !== undefined) upd.metalness = input.metalness;
          if (input.roughness !== undefined) upd.roughness = input.roughness;
          updateObject(obj.id, upd);
        });
        break;
      case 'move_objects': {
        const posUpdates = {};
        targets.forEach(obj => {
          const p = obj.position || [0, 0, 0];
          posUpdates[obj.id] = [p[0] + (input.x || 0), p[1] + (input.y || 0), p[2] + (input.z || 0)];
        });
        batchUpdatePositions(posUpdates);
        break;
      }
      case 'toggle_visibility':
        targets.forEach(obj => updateObject(obj.id, { visible: input.visible }));
        break;
      case 'group_objects': {
        const gid = addGroup(input.group_name);
        targets.forEach(obj => setObjectGroup(obj.id, gid));
        break;
      }
      case 'ungroup_objects': {
        const t = (input.target || '').toLowerCase().trim();
        const grp = groups.find(g => g.name.toLowerCase().includes(t) || t.includes(g.name.toLowerCase()));
        if (grp) removeGroup(grp.id);
        break;
      }
      case 'rotate_objects': {
        const axis = input.axis || 'y';
        const rad = ((input.degrees || 0) * Math.PI) / 180;
        targets.forEach(obj => {
          const r = obj.rotation || [0, 0, 0];
          updateObject(obj.id, {
            rotation: [
              r[0] + (axis === 'x' ? rad : 0),
              r[1] + (axis === 'y' ? rad : 0),
              r[2] + (axis === 'z' ? rad : 0),
            ],
          });
        });
        break;
      }
      case 'delete_objects':
        targets.forEach(obj => deleteObject(obj.id));
        break;
      case 'add_primitive': {
        addPrimitive(input.primitive_type || 'cube');
        const newId = useStore.getState().selectedObjectId;
        if (newId && input.color) updateObject(newId, { color: input.color });
        break;
      }
      default:
        console.warn('Unknown agent tool:', tool);
    }
  };

  const handleKeyDown = async (e) => {
    if (e.key !== "Enter" || !prompt.trim() || isGenerating) return;

    if (isCommandMode) {
      setGenerating(true);
      setAgentFeedback(null);
      setConsoleLogs([]);
      if (!consoleOpen) setConsoleOpen(true);
      try {
        const { objects: objs, groups: grps } = useStore.getState();
        const ops = await executeAgentCommand(prompt, { objects: objs, groups: grps }, keys, addLog, providerOverride, modelOverride);
        if (ops.length === 0) {
          setAgentFeedback('No matching operations found.');
        } else {
          saveHistory();
          ops.forEach(executeOp);
          setAgentFeedback(`Applied ${ops.length} operation${ops.length !== 1 ? 's' : ''}: ${ops.map(o => o.tool.replace(/_/g, ' ')).join(', ')}`);
        }
        setPrompt("");
      } catch (err) {
        console.error("Agent command failed", err);
        addLog('error', 'Command failed: ' + err.message);
        setAgentFeedback('Command failed: ' + err.message);
      } finally {
        setGenerating(false);
      }
      return;
    }

    setGenerating(true);
    setConsoleLogs([]);
    if (!consoleOpen) setConsoleOpen(true);
    try {
      const newGeometry = await generate3DModel(prompt, refImage, keys, addLog, providerOverride, modelOverride);
      if (newGeometry.isParts) {
        addObjects(newGeometry.parts, newGeometry.name);
      } else {
        setGeometry(newGeometry);
      }
      setPrompt("");
      setRefImage(null);
    } catch (error) {
      console.error("Generation failed", error);
      addLog('error', 'Generation failed: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setRefImage(event.target.result);
      reader.readAsDataURL(file);
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
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Editor</div>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-3 p-2 hover:bg-[#333] rounded-lg text-sm text-gray-400 hover:text-white transition-all">
             <Settings size={16} /> Settings
          </button>
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
            id="view-code-btn"
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
          onPointerMissed={() => {
            // Click on empty space: if in vertex mode exit to object mode, else deselect
            const { editMode: em, setEditMode: sem, setSelectedObjectId: ssoi } = useStore.getState();
            if (em === 'vertex') { sem('object'); } else { ssoi(null); }
          }}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          shadows
        >
          <color attach="background" args={["#0F0F0F"]} />
          <ambientLight intensity={light.ambientInt} />
          <directionalLight
            position={[
              Math.cos(light.azimuth * Math.PI / 180) * Math.cos(light.elevation * Math.PI / 180) * 10,
              Math.sin(light.elevation * Math.PI / 180) * 10,
              Math.sin(light.azimuth * Math.PI / 180) * Math.cos(light.elevation * Math.PI / 180) * 10,
            ]}
            intensity={light.dirInt}
            castShadow
          />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#7C3AED" />

          <Exporter />
          {objects.map(obj => (
            <EditableMesh key={obj.id} object={obj} />
          ))}

          <Grid infiniteGrid fadeDistance={50} sectionColor="#333" cellColor="#222" />
          <OrbitControls makeDefault enabled={orbitEnabled} />
        </Canvas>

        {/* Light Controls */}
        <div className="absolute top-4 right-4 z-10" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setLightOpen(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-lg ${
              lightOpen ? 'bg-[#1A1A1A] border border-[#555] text-yellow-300' : 'bg-[#1A1A1A]/80 border border-[#333] text-gray-500 hover:text-yellow-300 hover:border-[#555]'
            }`}
          >
            <Sun size={11} /> Light
          </button>

          {lightOpen && (
            <div className="mt-1.5 bg-[#1A1A1A]/95 border border-[#333] rounded-2xl p-4 shadow-2xl w-56 space-y-4 backdrop-blur-xl">
              {[
                { label: 'Ambient', key: 'ambientInt', min: 0, max: 5, step: 0.1 },
                { label: 'Sun Intensity', key: 'dirInt', min: 0, max: 5, step: 0.1 },
                { label: 'Azimuth', key: 'azimuth', min: 0, max: 360, step: 1, unit: '°' },
                { label: 'Elevation', key: 'elevation', min: 0, max: 90, step: 1, unit: '°' },
              ].map(({ label, key, min, max, step, unit }) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[9px] text-gray-500 uppercase font-bold">{label}</span>
                    <span className="text-[9px] font-mono text-gray-400">{light[key].toFixed(step < 1 ? 1 : 0)}{unit || ''}</span>
                  </div>
                  <input
                    type="range" min={min} max={max} step={step}
                    value={light[key]}
                    onChange={e => setLight(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                    className="w-full accent-yellow-400"
                  />
                </div>
              ))}
              <button
                onClick={() => setLight({ ambientInt: 1.5, dirInt: 1.5, azimuth: 45, elevation: 45 })}
                className="w-full text-[9px] text-gray-600 hover:text-gray-400 transition-colors py-0.5"
              >
                Reset defaults
              </button>
            </div>
          )}
        </div>

        {/* Floating Prompt Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-10" onClick={(e) => e.stopPropagation()}>
          {/* Console panel — slides in above mode toggles */}
          <ConsolePanel logs={consoleLogs} isOpen={consoleOpen} />

          {/* Mode toggle */}
          <div className="flex justify-center mb-2 gap-2 items-center">
            <button
              onClick={() => { setIsCommandMode(false); setAgentFeedback(null); }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${!isCommandMode ? 'bg-[#7C3AED] text-white' : 'bg-[#1A1A1A] text-gray-500 border border-[#333] hover:text-white'}`}
            >
              <Sparkles size={10} /> Generate
            </button>
            <button
              onClick={() => { setIsCommandMode(true); setAgentFeedback(null); }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${isCommandMode ? 'bg-[#EA580C] text-white' : 'bg-[#1A1A1A] text-gray-500 border border-[#333] hover:text-white'}`}
            >
              <Bot size={10} /> Agent
            </button>
            <button
              onClick={() => setConsoleOpen(v => !v)}
              title="Toggle console"
              className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                consoleOpen
                  ? 'bg-[#1A1A1A] text-green-400 border border-green-400/40'
                  : 'bg-[#1A1A1A] text-gray-600 border border-[#333] hover:text-gray-400'
              }`}
            >
              <Terminal size={10} /> Console
            </button>
          </div>

          {/* Provider selector pills */}
          {providerOptions.length > 2 && (
            <div className="flex justify-center mb-1 gap-1 flex-wrap">
              {providerOptions.map(p => (
                <button
                  key={String(p.id)}
                  onClick={() => setProviderOverride(p.id)}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all ${
                    providerOverride === p.id
                      ? 'bg-[#333] text-white border border-[#666]'
                      : 'bg-transparent text-gray-600 border border-[#222] hover:text-gray-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Model sub-pills — shown when a commercial provider is selected */}
          {modelOptions.length > 0 && (
            <div className="flex justify-center mb-2 gap-1 flex-wrap">
              {modelOptions.map(m => (
                <button
                  key={m}
                  onClick={() => setModelOverride(modelOverride === m ? null : m)}
                  className={`px-2 py-0.5 rounded-full text-[9px] transition-all ${
                    modelOverride === m
                      ? 'bg-[#7C3AED]/30 text-[#A78BFA] border border-[#7C3AED]/60'
                      : 'bg-transparent text-gray-600 border border-[#222] hover:text-gray-400'
                  }`}
                >
                  {MODEL_LABELS[m] || m}
                </button>
              ))}
            </div>
          )}

          {/* Feedback toast */}
          {agentFeedback && (
            <div className="mb-2 text-center text-[10px] text-[#EA580C] bg-[#EA580C]/10 border border-[#EA580C]/20 rounded-xl px-3 py-1.5">
              {agentFeedback}
            </div>
          )}

          <div className="relative group">
            <input
              type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange}
            />
            {!isCommandMode && (
              <button className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white" onClick={() => fileInputRef.current.click()}>
                <Paperclip size={16} />
              </button>
            )}
            {isCommandMode && (
              <Bot size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#EA580C]" />
            )}
            <input
              type="text"
              placeholder={
                isGenerating
                  ? (isCommandMode ? "Executing command..." : "Synthesizing geometry...")
                  : isCommandMode
                    ? "Agent: 'decrease wheel size by 50%'"
                    : "Generate: 'A vintage radio'"
              }
              disabled={isGenerating}
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); if (agentFeedback) setAgentFeedback(null); }}
              onKeyDown={handleKeyDown}
              className={`w-full bg-[#1A1A1A]/90 backdrop-blur-2xl border p-5 rounded-3xl outline-none transition-all text-sm pl-12 pr-12 text-white font-medium shadow-2xl ${
                isGenerating
                  ? (isCommandMode ? 'border-[#EA580C] shadow-[0_0_20px_rgba(234,88,12,0.3)] animate-pulse' : 'border-[#7C3AED] shadow-[0_0_20px_rgba(124,58,237,0.3)] animate-pulse')
                  : isCommandMode
                    ? 'border-[#EA580C]/40 focus:border-[#EA580C]'
                    : 'border-[#333] focus:border-[#7C3AED]'
              }`}
            />
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] bg-[#333] px-2 py-1 rounded-md text-gray-400 font-mono transition-opacity duration-200 ${prompt ? 'opacity-100' : 'opacity-0'}`}>
              {isGenerating ? "..." : "⏎"}
            </div>
            {refImage && !isCommandMode && <div className="absolute top-[-40px] left-4 w-8 h-8 rounded-lg overflow-hidden border border-[#7C3AED]"><img src={refImage} alt="Ref" /></div>}
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
          <div className="bg-[#1A1A1A] border border-[#333] rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            {/* Fixed header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4 flex-shrink-0">
              <h2 className="text-2xl font-bold">Provider Settings</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-white text-xl leading-none"
                aria-label="Close"
              >✕</button>
            </div>
            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-8 pb-2 space-y-4">
              {["OpenAI", "Anthropic", "Gemini"].map(provider => (
                <div key={provider}>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">{provider}</label>
                  <input
                    type="password"
                    placeholder="Enter API Key..."
                    value={keys[provider] || ""}
                    onChange={(e) => saveKey(provider, e.target.value)}
                    className="w-full bg-[#0F0F0F] border border-[#333] p-3 rounded-xl outline-none focus:border-[#7C3AED]"
                  />
                  {keys[provider] && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {[
                        { key: `${provider} Generate Model`, label: 'Generate' },
                        { key: `${provider} Agent Model`,    label: 'Agent' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1">{label} model</label>
                          <select
                            value={keys[key] || ''}
                            onChange={(e) => saveKey(key, e.target.value)}
                            className="w-full bg-[#0F0F0F] border border-[#333] p-2 rounded-lg text-[11px] outline-none appearance-none cursor-pointer text-gray-300 focus:border-[#7C3AED]"
                          >
                            <option value="">Default</option>
                            {(COMMERCIAL_MODELS[provider] || []).map(m => (
                              <option key={m} value={m}>{MODEL_LABELS[m] || m}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Ollama section */}
              <div className="pt-2 border-t border-[#333]">
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Ollama URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="http://localhost:11434"
                    value={keys["Ollama URL"] || ""}
                    onChange={(e) => saveKey("Ollama URL", e.target.value)}
                    className="flex-1 bg-[#0F0F0F] border border-[#333] p-3 rounded-xl outline-none focus:border-[#7C3AED] font-mono text-sm"
                  />
                  <button
                    onClick={fetchOllamaModels}
                    disabled={ollamaModelsFetching}
                    className="px-3 bg-[#0F0F0F] border border-[#333] hover:border-[#7C3AED] rounded-xl text-xs text-gray-400 hover:text-white transition-all disabled:opacity-40"
                    title="Fetch available models from Ollama"
                  >
                    {ollamaModelsFetching ? "…" : "Detect"}
                  </button>
                </div>

                {/* Model pickers — shown after Detect or if saved */}
                {ollamaModels === null && (
                  <p className="mt-2 text-[10px] text-red-400">
                    Could not connect. Make sure Ollama is running with <span className="font-mono">OLLAMA_ORIGINS=*</span>.
                  </p>
                )}
                {(() => {
                  const hasSavedModels = keys["Ollama Generate Model"] || keys["Ollama Agent Model"];
                  const detectedModels = Array.isArray(ollamaModels) && ollamaModels.length > 0;
                  if (!hasSavedModels && !detectedModels) return null;
                  return (
                    <div className="mt-3 space-y-3">
                      {detectedModels && (
                        <p className="text-[10px] text-green-400 font-bold">✓ {ollamaModels.length} model{ollamaModels.length !== 1 ? 's' : ''} found</p>
                      )}
                      {hasSavedModels && !detectedModels && (
                        <p className="text-[10px] text-gray-500 italic">Click Detect to refresh model list</p>
                      )}
                      {[
                        { key: "Ollama Generate Model", label: "Generate model", hint: "Used to create 3D geometry from prompts" },
                        { key: "Ollama Agent Model",    label: "Agent model",    hint: "Used for scene commands (Agent mode)" },
                      ].map(({ key, label, hint }) => (
                        <div key={key}>
                          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">{label}</label>
                          <p className="text-[9px] text-gray-600 mb-1 italic">{hint}</p>
                          <select
                            value={keys[key] || ""}
                            onChange={(e) => saveKey(key, e.target.value)}
                            className="w-full bg-[#0F0F0F] border border-[#333] p-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer text-gray-300 focus:border-[#7C3AED]"
                          >
                            <option value="">Auto (mistral / llava)</option>
                            {detectedModels
                              ? ollamaModels.map(m => <option key={m} value={m}>{m}</option>)
                              : keys[key] ? <option value={keys[key]}>{keys[key]}</option> : null
                            }
                          </select>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Cross-origin instructions */}
                <div className="mt-3 bg-[#0F0F0F] border border-[#333] rounded-xl p-4 space-y-3">
                  <p className="text-[11px] text-yellow-400 font-bold flex items-center gap-1.5">
                    ⚠ Required: allow browser access to Ollama
                  </p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    By default Ollama blocks requests from websites. You need to stop the running instance and restart it with one extra flag.
                  </p>

                  <div className="space-y-2">
                    <p className="text-[9px] uppercase tracking-widest text-gray-600 font-bold">Step 1 — stop the running process</p>
                    <div className="bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 font-mono text-[11px] text-yellow-300 select-all">
                      pkill ollama
                    </div>
                    <p className="text-[9px] text-gray-600">Or quit the Ollama app from the menu bar if you launched it as a Mac app.</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] uppercase tracking-widest text-gray-600 font-bold">Step 2 — restart with cross-origin flag</p>
                    <p className="text-[9px] text-gray-600 font-bold">Mac / Linux</p>
                    <div className="bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 font-mono text-[11px] text-green-400 select-all">
                      OLLAMA_ORIGINS=* ollama serve
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] text-gray-600 font-bold">Windows (PowerShell)</p>
                    <div className="bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 font-mono text-[11px] text-green-400 select-all">
                      $env:OLLAMA_ORIGINS="*"; ollama serve
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] text-gray-600 font-bold">Windows (Command Prompt)</p>
                    <div className="bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 font-mono text-[11px] text-green-400 select-all">
                      set OLLAMA_ORIGINS=* && ollama serve
                    </div>
                  </div>

                  <p className="text-[9px] text-gray-600 leading-relaxed">
                    Keep the terminal open while using Sculpt3D. The URL stays <span className="font-mono text-gray-500">http://localhost:11434</span>.
                  </p>
                </div>
              </div>
            </div>
            {/* Fixed footer */}
            <div className="px-8 py-5 flex-shrink-0 border-t border-[#333]">
              <button
                onClick={() => setModalOpen(false)}
                className="w-full bg-[#7C3AED] p-4 rounded-xl font-bold hover:brightness-110 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
