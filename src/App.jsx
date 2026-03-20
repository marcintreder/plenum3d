import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, TransformControls } from "@react-three/drei";
import {
  Settings, Download, Circle, Square,
  Triangle, Cylinder as CylinderIcon, Code,
  Undo2, Redo2, Bot, Sparkles, Paperclip, Terminal, Sun,
  Disc, Minus, Mountain, Pill, MessageSquare, Cloud, CloudOff, Loader
} from "lucide-react";
import ConsolePanel from "./components/ConsolePanel";
import ProjectThumbnails from "./components/ProjectThumbnails";

import EditableMesh from "./EditableMesh";
import Inspector from "./Inspector";
import Exporter from "./Exporter";
import CodeView from "./CodeView";

import * as THREE from "three";
import useStore from "./useStore";
import useKeyboardShortcuts from "./useKeyboardShortcuts";
import { generate3DModel } from "./aiService";
import { executeAgentCommand, resolveTargets } from "./agentService";
import { saveSettings, saveProjects } from "./apiClient";
import { getObjectIdsInMarquee } from "./utils/marqueeIntersection";

// Lives inside <Canvas> — exposes a screenshot function via callback ref
const ScreenshotHelper = ({ onCapture }) => {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    onCapture.current = () => {
      const prevBg = scene.background;
      scene.background = null;
      gl.setClearColor(0x000000, 0);
      gl.render(scene, camera);
      const url = gl.domElement.toDataURL('image/png');
      scene.background = prevBg;
      gl.setClearColor(0x0F0F0F, 1);
      return url;
    };
  }, [gl, scene, camera, onCapture]);
  return null;
};

// Lives inside <Canvas> — shows a 3-axis translate gizmo for the selected group
const GroupGizmo = () => {
  const selectedGroupId    = useStore(s => s.selectedGroupId);
  const objects            = useStore(s => s.objects);
  const batchUpdatePositions = useStore(s => s.batchUpdatePositions);
  const setOrbitEnabled    = useStore(s => s.setOrbitEnabled);
  const saveHistory        = useStore(s => s.saveHistory);

  const [pivot, setPivot] = React.useState(null);
  const dragRef = React.useRef(null);
  // Buffer pending position updates to flush outside the Three.js event dispatch
  const pendingUpdates = React.useRef(null);

  const members = React.useMemo(
    () => objects.filter(o => o.groupId === selectedGroupId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedGroupId, objects]
  );

  const centroid = React.useMemo(() => {
    if (!members.length) return [0, 0, 0];
    return [
      members.reduce((s, o) => s + (o.position?.[0] ?? 0), 0) / members.length,
      members.reduce((s, o) => s + (o.position?.[1] ?? 0), 0) / members.length,
      members.reduce((s, o) => s + (o.position?.[2] ?? 0), 0) / members.length,
    ];
  }, [members]);

  // Sync pivot to centroid whenever not dragging
  React.useEffect(() => {
    if (pivot && !dragRef.current) pivot.position.set(...centroid);
  }, [centroid, pivot]);

  // Flush buffered position updates at the start of each frame, outside event dispatch
  useFrame(() => {
    if (pendingUpdates.current) {
      batchUpdatePositions(pendingUpdates.current);
      pendingUpdates.current = null;
    }
  });

  if (!selectedGroupId || !members.length) return null;

  return (
    <>
      <mesh ref={setPivot} position={centroid} visible={false}>
        <sphereGeometry args={[0.001]} />
        <meshBasicMaterial />
      </mesh>
      {pivot && (
        <TransformControls
          object={pivot}
          mode="translate"
          onMouseDown={() => {
            setOrbitEnabled(false);
            saveHistory();
            dragRef.current = {
              startPivot: pivot.position.clone(),
              memberStarts: Object.fromEntries(members.map(o => [o.id, [...(o.position || [0, 0, 0])]])),
            };
          }}
          onChange={() => {
            if (!dragRef.current) return;
            const { startPivot, memberStarts } = dragRef.current;
            const dx = pivot.position.x - startPivot.x;
            const dy = pivot.position.y - startPivot.y;
            const dz = pivot.position.z - startPivot.z;
            const updates = {};
            Object.entries(memberStarts).forEach(([id, start]) => {
              updates[id] = [start[0] + dx, start[1] + dy, start[2] + dz];
            });
            // Buffer instead of calling setState directly inside Three.js event dispatch
            pendingUpdates.current = updates;
          }}
          onMouseUp={() => { dragRef.current = null; setOrbitEnabled(true); }}
        />
      )}
    </>
  );
};

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

// Lives inside <Canvas> — syncs the Three.js camera to an external ref
const MarqueeCameraSync = ({ cameraRef }) => {
  const { camera } = useThree();
  useEffect(() => { cameraRef.current = camera; }, [camera, cameraRef]);
  return null;
};

const App = ({ user, onLogout, initialData }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isCodeViewOpen, setCodeViewOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [keys, setKeys] = useState(() => {
    // DB data takes priority over localStorage
    if (initialData?.settings && Object.keys(initialData.settings).length > 0) return initialData.settings;
    try { return JSON.parse(localStorage.getItem("3d_sculpt_keys") || "{}"); }
    catch { return {}; }
  });
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
  const [renamingSceneId, setRenamingSceneId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renamingProjectId, setRenamingProjectId] = useState(null);
  const [renameProjectValue, setRenameProjectValue] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const screenshotRef = React.useRef(null);

  // ── Marquee selection ────────────────────────────────────────────────────────
  const cameraRef = React.useRef(null);
  const marqueeStartRef = React.useRef(null);
  const [marquee, setMarquee] = useState(null); // { x1, y1, x2, y2 } in px or null

  const handleMarqueePointerDown = useCallback((e) => {
    if (useStore.getState().meshPointerActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    marqueeStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMarqueePointerMove = useCallback((e) => {
    if (!marqueeStartRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - marqueeStartRef.current.x;
    const dy = y - marqueeStartRef.current.y;
    if (marquee || Math.hypot(dx, dy) > 5) {
      setMarquee({ x1: marqueeStartRef.current.x, y1: marqueeStartRef.current.y, x2: x, y2: y });
    }
  }, [marquee]);

  const handleMarqueePointerUp = useCallback((e) => {
    if (!marqueeStartRef.current) return;
    if (marquee && cameraRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const { width, height } = rect;
      const camera = cameraRef.current;
      const projectToScreen = (position) => {
        const vec = new THREE.Vector3(...position);
        vec.project(camera);
        return { x: (vec.x + 1) / 2 * width, y: (1 - vec.y) / 2 * height };
      };
      const ids = getObjectIdsInMarquee(useStore.getState().objects, marquee, projectToScreen);
      useStore.getState().selectObjectsInMarquee(ids);
    }
    marqueeStartRef.current = null;
    setMarquee(null);
  }, [marquee]);

  // ── Save status ─────────────────────────────────────────────────────────────
  // 'idle' | 'pending' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // ── Project management ──────────────────────────────────────────────────────
  const [projects, setProjects] = useState(() => {
    // DB data takes priority
    if (Array.isArray(initialData?.projects) && initialData.projects.length > 0) return initialData.projects;
    try {
      const saved = JSON.parse(localStorage.getItem('sculpt3d_projects') || 'null');
      return Array.isArray(saved) && saved.length > 0 ? saved : [{ id: 'proj-default', name: 'My Project' }];
    } catch { return [{ id: 'proj-default', name: 'My Project' }]; }
  });
  const [activeProjectId, setActiveProjectId] = useState(() =>
    JSON.parse(localStorage.getItem('sculpt3d_active_project') || '"proj-default"')
  );


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
    scenes,
    activeSceneId,
    switchScene,
    addScene,
    duplicateScene,
    deleteScene,
    renameScene,
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
    loadProject,
  } = useStore();

  // True when at least one AI backend is explicitly configured
  const hasProvider = !!(keys.Anthropic || keys.OpenAI || keys.Gemini || keys['Ollama Generate Model']);

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

  // On mount: if the user has saved projects in DB, load the active one.
  // This overrides the default F1-car store state for returning users.
  useEffect(() => {
    if (!initialData?.projects?.length) return;
    const active = initialData.projects.find(p => p.id === activeProjectId) || initialData.projects[0];
    if (active?.scenes?.length) {
      loadProject(active.scenes, active.activeSceneId || active.scenes[0]?.id);
      setActiveProjectId(active.id);
      localStorage.setItem('sculpt3d_active_project', JSON.stringify(active.id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  // Snapshot the store's current scenes array with the active scene saved
  const getSceneSnapshot = useCallback(() => {
    const { scenes: s, activeSceneId: aid, objects: o, groups: g } = useStore.getState();
    // Strip history — too large for localStorage/DB; undo history is session-only
    return s.map(sc => sc.id === aid
      ? { ...sc, objects: o, groups: g, history: [[]], historyIndex: 0 }
      : { ...sc, history: [[]], historyIndex: 0 }
    );
  }, []);

  const persistProjects = useCallback((updated, newActiveId) => {
    setProjects(updated);
    localStorage.setItem('sculpt3d_projects', JSON.stringify(updated));
    if (newActiveId !== undefined) {
      setActiveProjectId(newActiveId);
      localStorage.setItem('sculpt3d_active_project', JSON.stringify(newActiveId));
    }
  }, []);

  const handleScreenshot = useCallback(() => {
    const dataUrl = screenshotRef.current?.();
    if (!dataUrl) return;
    // Update active project with the new thumbnail
    const updated = projects.map(p =>
      p.id === activeProjectId ? { ...p, thumbnail: dataUrl } : p
    );
    persistProjects(updated);
  }, [projects, activeProjectId, persistProjects]);

  const saveCurrentProject = useCallback(() => {
    const snapshot = getSceneSnapshot();
    const updated = projects.map(p => p.id === activeProjectId ? { ...p, scenes: snapshot, activeSceneId: useStore.getState().activeSceneId } : p);
    persistProjects(updated);
  }, [projects, activeProjectId, getSceneSnapshot, persistProjects]);

  const switchToProject = useCallback((pid) => {
    if (pid === activeProjectId) return;
    // Save current project first
    const snapshot = getSceneSnapshot();
    const updated = projects.map(p =>
      p.id === activeProjectId
        ? { ...p, scenes: snapshot, activeSceneId: useStore.getState().activeSceneId }
        : p
    );
    const target = updated.find(p => p.id === pid);
    if (!target) return;
    persistProjects(updated, pid);
    if (target.scenes?.length) {
      loadProject(target.scenes, target.activeSceneId || target.scenes[0]?.id);
    }
  }, [activeProjectId, projects, getSceneSnapshot, persistProjects, loadProject]);

  // Activate global shortcuts
  useKeyboardShortcuts();

  // Keep a ref so the save function always has fresh projects without stale closure
  const projectsRef = React.useRef(projects);
  useEffect(() => { projectsRef.current = projects; }, [projects]);

  const dbSyncTimer = React.useRef(null);

  const doSaveToDb = useCallback(async (updated) => {
    if (!user?.credential) return;
    setSaveStatus('saving');
    try {
      await saveProjects(user.credential, updated);
      setLastSavedAt(Date.now());
      setSaveStatus('saved');
    } catch (err) {
      console.error('DB save failed:', err);
      addLog('error', 'Cloud save failed: ' + err.message);
      setSaveStatus('error');
    }
  }, [user?.credential]);

  const manualSave = useCallback(() => {
    clearTimeout(dbSyncTimer.current);
    const snapshot = getSceneSnapshot();
    const updated = projectsRef.current.map(p =>
      p.id === activeProjectId ? { ...p, scenes: snapshot, activeSceneId: useStore.getState().activeSceneId } : p
    );
    setProjects(updated);
    localStorage.setItem('sculpt3d_projects', JSON.stringify(updated));
    doSaveToDb(updated);
  }, [activeProjectId, getSceneSnapshot, doSaveToDb]);

  // Auto-save whenever objects, groups, scenes, or active project change
  useEffect(() => {
    const snapshot = getSceneSnapshot();
    const updated = projectsRef.current.map(p =>
      p.id === activeProjectId ? { ...p, scenes: snapshot, activeSceneId: useStore.getState().activeSceneId } : p
    );
    setProjects(updated);
    localStorage.setItem('sculpt3d_projects', JSON.stringify(updated));
    if (user?.credential) {
      setSaveStatus('pending');
      clearTimeout(dbSyncTimer.current);
      dbSyncTimer.current = setTimeout(() => doSaveToDb(updated), 1500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objects, groups, scenes, activeProjectId]);

  const saveKey = (provider, value) => {
    const newKeys = { ...keys, [provider]: value };
    setKeys(newKeys);
    localStorage.setItem("3d_sculpt_keys", JSON.stringify(newKeys));
    // Sync to DB immediately on settings change
    if (user?.credential) saveSettings(user.credential, newKeys).catch(console.error);
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
          <h1 className="text-xl font-black tracking-tighter text-white italic shrink-0">Plenum<span className="text-[#7C3AED]">3D</span></h1>
          {user && (
            <div className="flex items-center gap-2 shrink-0">
              {user.picture
                ? <img src={user.picture} alt={user.name} className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                : <div className="w-5 h-5 rounded-full bg-[#7C3AED]/40 flex items-center justify-center text-[9px] font-bold">{user.name?.[0]}</div>
              }
              <button
                onClick={onLogout}
                className="text-[9px] text-gray-600 hover:text-red-400 transition-colors whitespace-nowrap"
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Editor</div>
          <div className="mb-2">
            <input 
              type="text" 
              placeholder="Search objects..." 
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-[#0F0F0F] border border-[#333] text-sm p-2 rounded-lg outline-none focus:border-[#7C3AED] text-white"
            />
          </div>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-3 p-2 hover:bg-[#333] rounded-lg text-sm text-gray-400 hover:text-white transition-all">
             <Settings size={16} /> Settings
          </button>
        </div>

        {/* Projects */}
        <ProjectThumbnails
          projects={projects}
          activeProjectId={activeProjectId}
          onSelect={switchToProject}
          onRename={(id, name) => { setRenamingProjectId(id); setRenameProjectValue(name); }}
          onDelete={(id) => {
            if (id === activeProjectId) {
              const idx = projects.findIndex(p => p.id === id);
              const remaining = projects.filter(p => p.id !== id);
              persistProjects(remaining, remaining[Math.max(0, idx-1)]?.id);
              const next = remaining[Math.max(0, idx-1)];
              if (next?.scenes?.length) loadProject(next.scenes, next.activeSceneId || next.scenes[0]?.id);
            } else {
              const remaining = projects.filter(p => p.id !== id);
              persistProjects(remaining);
            }
          }}
          renamingProjectId={renamingProjectId}
          renameProjectValue={renameProjectValue}
          onRenameChange={setRenameProjectValue}
          onRenameBlur={() => {
            const updated = projects.map(p => p.id === renamingProjectId ? { ...p, name: renameProjectValue || p.name } : p);
            persistProjects(updated);
            setRenamingProjectId(null);
          }}
          onRenameKeyDown={e => {
            if (e.key === 'Enter') {
              const updated = projects.map(p => p.id === renamingProjectId ? { ...p, name: renameProjectValue || p.name } : p);
              persistProjects(updated);
              setRenamingProjectId(null);
            } else if (e.key === 'Escape') setRenamingProjectId(null);
          }}
        />

        <button
          onClick={() => {
            const newId = `proj-${Date.now()}`;
            const newProject = { 
              id: newId, 
              name: 'New Project', 
              scenes: [{ id: 's1', name: 'Scene 1', objects: [], groups: [], history: [[]], historyIndex: 0 }], 
              activeSceneId: 's1' 
            };
            persistProjects([...projects, newProject], newId);
            loadProject(newProject.scenes, newProject.scenes[0].id);
          }}
          className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-[#7C3AED] hover:text-[#A78BFA] transition-colors mt-1"
        >
          + New project
        </button>

        <div className="flex flex-col gap-1 mt-4">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Primitives</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'cube',     icon: Square,       label: 'Cube' },
              { id: 'sphere',   icon: Circle,       label: 'Sphere' },
              { id: 'cylinder', icon: CylinderIcon, label: 'Cylinder' },
              { id: 'cone',     icon: Triangle,     label: 'Cone', class: 'rotate-180' },
              { id: 'torus',    icon: Disc,         label: 'Torus' },
              { id: 'plane',    icon: Minus,        label: 'Plane' },
              { id: 'pyramid',  icon: Mountain,     label: 'Pyramid' },
              { id: 'capsule',  icon: Pill,         label: 'Capsule' },
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

        <div className="flex flex-col gap-1 mt-auto gap-2">
          <a
            href="https://github.com/marcintreder/plenum3d/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-2.5 bg-[#1A1A1A] border border-[#333] hover:border-[#7C3AED]/50 text-gray-500 hover:text-white rounded-xl text-sm transition-all"
          >
            <MessageSquare size={14} /> Send Feedback
          </a>
          <button
            onClick={() => setExportRequested(true)}
            className="flex items-center justify-center gap-2 p-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-200 transition-all shadow-lg active:scale-95"
          >
            <Download size={16} /> Export .GLB
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative bg-black flex flex-col">
        {/* Scene Tabs */}
        <div className="flex items-center bg-[#111] border-b border-[#222] px-2 gap-0.5 flex-shrink-0 h-9 select-none">
          {scenes.map(scene => (
            <div
              key={scene.id}
              onClick={() => switchScene(scene.id)}
              onDoubleClick={() => { setRenamingSceneId(scene.id); setRenameValue(scene.name); }}
              className={`group/tab relative flex items-center gap-1.5 px-3 h-full text-[10px] font-medium cursor-pointer transition-all flex-shrink-0 border-b-2 ${
                scene.id === activeSceneId
                  ? 'border-[#7C3AED] text-white bg-[#1A1A1A]'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#1A1A1A]/50'
              }`}
            >
              {renamingSceneId === scene.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => { renameScene(scene.id, renameValue || scene.name); setRenamingSceneId(null); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { renameScene(scene.id, renameValue || scene.name); setRenamingSceneId(null); }
                    if (e.key === 'Escape') setRenamingSceneId(null);
                  }}
                  onClick={e => e.stopPropagation()}
                  className="bg-[#333] border border-[#7C3AED]/60 rounded px-1 py-0.5 text-[10px] outline-none text-white w-24"
                />
              ) : (
                <span>{scene.name}</span>
              )}
              {scenes.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); deleteScene(scene.id); }}
                  className="opacity-0 group-hover/tab:opacity-100 text-gray-600 hover:text-red-400 transition-opacity ml-0.5 leading-none"
                  title="Delete scene"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => addScene(`Scene ${scenes.length + 1}`)}
            className="flex items-center justify-center w-7 h-7 my-auto ml-1 rounded text-gray-600 hover:text-white hover:bg-[#333] transition-all text-base leading-none flex-shrink-0"
            title="Add scene"
          >
            +
          </button>
          <button
            onClick={() => duplicateScene()}
            className="flex items-center justify-center px-2 h-7 my-auto rounded text-[9px] text-gray-600 hover:text-white hover:bg-[#333] transition-all flex-shrink-0"
            title="Duplicate current scene"
          >
            ⎘
          </button>

          {/* Undo / Redo — right side */}
          <div className="flex items-center gap-0.5 ml-auto flex-shrink-0 pl-2 border-l border-[#222]">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="flex items-center gap-1 px-2 h-7 my-auto rounded text-gray-500 hover:text-white hover:bg-[#333] disabled:opacity-20 transition-all"
              title="Undo (⌘Z)"
            >
              <Undo2 size={12} />
              <span className="text-[9px] font-mono text-gray-600">⌘Z</span>
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="flex items-center gap-1 px-2 h-7 my-auto rounded text-gray-500 hover:text-white hover:bg-[#333] disabled:opacity-20 transition-all"
              title="Redo (⌘⇧Z)"
            >
              <Redo2 size={12} />
              <span className="text-[9px] font-mono text-gray-600">⌘⇧Z</span>
            </button>
          </div>

          {/* Save status */}
          {user?.credential && (
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-[#222] flex-shrink-0">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-[9px] text-gray-500">
                  <Loader size={10} className="animate-spin" /> Saving…
                </span>
              )}
              {saveStatus === 'pending' && (
                <span className="text-[9px] text-yellow-600">Unsaved</span>
              )}
              {saveStatus === 'saved' && lastSavedAt && (
                <span className="text-[9px] text-gray-600">
                  Saved {Math.max(0, Math.round((Date.now() - lastSavedAt) / 60000))}m ago
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-[9px] text-red-500 flex items-center gap-1">
                  <CloudOff size={10} /> Save failed
                </span>
              )}
              <button
                onClick={manualSave}
                title="Save all projects to database"
                className="flex items-center justify-center w-6 h-6 rounded text-gray-500 hover:text-white hover:bg-[#333] transition-all"
              >
                <Cloud size={11} />
              </button>
            </div>
          )}
        </div>

        <div
          className="flex-1 relative"
          onPointerDown={handleMarqueePointerDown}
          onPointerMove={handleMarqueePointerMove}
          onPointerUp={handleMarqueePointerUp}
        >
        <Canvas
          key={activeProjectId}
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
          <ScreenshotHelper onCapture={screenshotRef} />
          <MarqueeCameraSync cameraRef={cameraRef} />
          <GroupGizmo />
          {objects
            .filter(o => o.name.toLowerCase().includes(searchFilter.toLowerCase()))
            .map(obj => (
            <EditableMesh key={obj.id} object={obj} />
          ))}

          <Grid infiniteGrid fadeDistance={50} sectionColor="#333" cellColor="#222" />
          <OrbitControls makeDefault enabled={orbitEnabled} />
        </Canvas>
        {marquee && (
          <div
            className="absolute pointer-events-none border border-blue-400/80 bg-blue-400/10"
            style={{
              left:   Math.min(marquee.x1, marquee.x2),
              top:    Math.min(marquee.y1, marquee.y2),
              width:  Math.abs(marquee.x2 - marquee.x1),
              height: Math.abs(marquee.y2 - marquee.y1),
            }}
          />
        )}
        </div>

        {/* Light Controls */}
        <div className="absolute top-14 right-4 z-10 flex flex-col items-end" onClick={e => e.stopPropagation()}>
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
                !hasProvider
                  ? "Add an API key in Settings to generate models…"
                  : isGenerating
                    ? (isCommandMode ? "Executing command..." : "Synthesizing geometry...")
                    : isCommandMode
                      ? "Agent: 'decrease wheel size by 50%'"
                      : "Generate: 'A vintage radio'"
              }
              disabled={isGenerating || !hasProvider}
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); if (agentFeedback) setAgentFeedback(null); }}
              onKeyDown={handleKeyDown}
              className={`w-full bg-[#1A1A1A]/90 backdrop-blur-2xl border p-5 rounded-3xl outline-none transition-all text-sm pl-12 pr-12 font-medium shadow-2xl ${
                !hasProvider
                  ? 'border-[#333] text-gray-600 cursor-not-allowed'
                  : isGenerating
                    ? (isCommandMode ? 'border-[#EA580C] shadow-[0_0_20px_rgba(234,88,12,0.3)] animate-pulse text-white' : 'border-[#7C3AED] shadow-[0_0_20px_rgba(124,58,237,0.3)] animate-pulse text-white')
                    : isCommandMode
                      ? 'border-[#EA580C]/40 focus:border-[#EA580C] text-white'
                      : 'border-[#333] focus:border-[#7C3AED] text-white'
              }`}
            />
            {!hasProvider && (
              <button
                onClick={() => setModalOpen(true)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] bg-[#7C3AED] hover:brightness-110 px-2.5 py-1 rounded-lg text-white font-bold transition-all"
              >
                Settings
              </button>
            )}
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] bg-[#333] px-2 py-1 rounded-md text-gray-400 font-mono transition-opacity duration-200 ${prompt ? 'opacity-100' : 'opacity-0'}`}>
              {isGenerating ? "..." : "⏎"}
            </div>
            {refImage && !isCommandMode && <div className="absolute top-[-40px] left-4 w-8 h-8 rounded-lg overflow-hidden border border-[#7C3AED]"><img src={refImage} alt="Ref" /></div>}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Inspector */}
      <Inspector onScreenshot={handleScreenshot} />

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
                    Keep the terminal open while using Plenum3D. The URL stays <span className="font-mono text-gray-500">http://localhost:11434</span>.
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
