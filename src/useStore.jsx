import { create } from 'zustand';
import { generateF1 } from './f1Model';
import { buildPrimitiveMesh } from './utils/primitiveBuilder';
import {
  bevelSelectedVertices,
  subdivideEdge as meshSubdivideEdge,
  dissolveVertex as meshDissolveVertex,
  laplacianSmooth,
  laplacianSmoothSelected,
} from './utils/MeshAnalysis';

const { objects: initialObjects, groups: initialGroups } = generateF1();

const FIRST_SCENE_ID = 'scene-init';
const initialScene = {
  id: FIRST_SCENE_ID,
  name: 'Scene 1',
  objects: initialObjects,
  groups: initialGroups,
  history: [JSON.parse(JSON.stringify(initialObjects))],
  historyIndex: 0,
};

// Helpers to save/load scene state
const saveCurrentToScene = (state) =>
  state.scenes.map(s =>
    s.id === state.activeSceneId
      ? { ...s, objects: state.objects, groups: state.groups, history: state.history, historyIndex: state.historyIndex }
      : s
  );

const CLEAR_SELECTION = {
  selectedObjectId: null,
  selectedObjectIds: [],
  selectedGroupId: null,
  selectedJointIndex: null,
  selectedVertexIndices: [],
  editMode: 'object',
};

const useStore = create((set, get) => ({
  setState: (state, replace) => set(state, replace),
  getState: () => get(),
  scenes: [initialScene],
  activeSceneId: FIRST_SCENE_ID,
  objects: initialObjects,
  groups: initialGroups,
  history: [JSON.parse(JSON.stringify(initialObjects))],
  historyIndex: 0,
  selectedObjectId: null,
  selectedObjectIds: [],
  selectedGroupId: null,
  selectedJointIndex: null,
  selectedVertexIndices: [],
  editMode: 'object',
  orbitEnabled: true,
  isGenerating: false,
  exportRequested: false,

  setEditMode: (mode) => set({
    editMode: mode,
    ...(mode !== 'vertex' ? { selectedVertexIndices: [], selectedJointIndex: null } : {}),
  }),
  setOrbitEnabled: (enabled) => set({ orbitEnabled: enabled }),

  setSelectedVertexIndices: (indices) => set({
    selectedVertexIndices: indices,
    selectedJointIndex: indices[0] ?? null,
  }),

  // ── Group management ────────────────────────────────────────────────────────

  setGroups: (groups) => set({ groups }),

  addGroup: (name) => {
    const id = Math.random().toString(36).substr(2, 9);
    set(state => ({ groups: [...state.groups, { id, name }] }));
    return id;
  },

  removeGroup: (groupId) => set(state => ({
    groups: state.groups.filter(g => g.id !== groupId),
    objects: state.objects.map(o => o.groupId === groupId ? { ...o, groupId: null } : o),
    selectedGroupId: state.selectedGroupId === groupId ? null : state.selectedGroupId,
  })),

  setObjectGroup: (objectId, groupId) => set(state => ({
    objects: state.objects.map(o => o.id === objectId ? { ...o, groupId } : o),
  })),

  setSelectedGroupId: (groupId) => set(state => {
    if (!groupId) return { selectedGroupId: null };
    const groupObjectIds = state.objects.filter(o => o.groupId === groupId).map(o => o.id);
    return {
      selectedGroupId: groupId,
      selectedObjectIds: groupObjectIds,
      selectedObjectId: groupObjectIds[0] ?? null,
      selectedVertexIndices: [],
      selectedJointIndex: null,
      editMode: 'object',
    };
  }),

  // ── Uniform scale toward vertex centroid ────────────────────────────────────

  scaleUniform: (objectId, factor) => set(state => {
    const obj = state.objects.find(o => o.id === objectId);
    if (!obj?.vertices?.length) return {};
    const n = obj.vertices.length;
    const cx = obj.vertices.reduce((s, v) => s + v[0], 0) / n;
    const cy = obj.vertices.reduce((s, v) => s + v[1], 0) / n;
    const cz = obj.vertices.reduce((s, v) => s + v[2], 0) / n;
    const newVerts = obj.vertices.map(v => [
      cx + (v[0] - cx) * factor,
      cy + (v[1] - cy) * factor,
      cz + (v[2] - cz) * factor,
    ]);
    return { objects: state.objects.map(o => o.id === objectId ? { ...o, vertices: newVerts } : o) };
  }),

  // Scale each object in a group toward its own centroid (each part scales in-place)
  scaleGroup: (groupId, factor) => set(state => {
    const newObjects = state.objects.map(obj => {
      if (obj.groupId !== groupId) return obj;
      if (!obj.vertices?.length) return obj;
      const n = obj.vertices.length;
      const cx = obj.vertices.reduce((s, v) => s + v[0], 0) / n;
      const cy = obj.vertices.reduce((s, v) => s + v[1], 0) / n;
      const cz = obj.vertices.reduce((s, v) => s + v[2], 0) / n;
      const newVerts = obj.vertices.map(v => [
        cx + (v[0] - cx) * factor,
        cy + (v[1] - cy) * factor,
        cz + (v[2] - cz) * factor,
      ]);
      return { ...obj, vertices: newVerts };
    });
    return { objects: newObjects };
  }),

  // ── Select similar ──────────────────────────────────────────────────────────

  selectSimilar: (objectId) => set(state => {
    const obj = state.objects.find(o => o.id === objectId);
    if (!obj) return {};
    let similar;
    let matchedGroupId = null;
    if (obj.groupId) {
      similar = state.objects.filter(o => o.groupId === obj.groupId);
      matchedGroupId = obj.groupId;
    } else {
      const prefix = obj.name.split(' ')[0].toLowerCase();
      const vCount = obj.vertices.length;
      similar = state.objects.filter(o =>
        o.name.toLowerCase().startsWith(prefix) &&
        Math.abs(o.vertices.length - vCount) / Math.max(vCount, 1) < 0.2
      );
    }
    return {
      selectedObjectIds: similar.map(o => o.id),
      selectedObjectId: objectId,
      selectedGroupId: matchedGroupId,
    };
  }),

  // ── Smooth ──────────────────────────────────────────────────────────────────

  smoothObject: (objectId, iterations = 1, factor = 0.5) => set(state => {
    const obj = state.objects.find(o => o.id === objectId);
    if (!obj?.vertices?.length || !obj?.indices?.length) return {};
    const verts = laplacianSmooth(obj.vertices, obj.indices, iterations, factor);
    return { objects: state.objects.map(o => o.id === objectId ? { ...o, vertices: verts } : o) };
  }),

  smoothSelectedVertices: (objectId, selectedIndices, iterations = 1, factor = 0.5) => set(state => {
    const obj = state.objects.find(o => o.id === objectId);
    if (!obj?.vertices?.length || !obj?.indices?.length) return {};
    const verts = laplacianSmoothSelected(obj.vertices, obj.indices, selectedIndices, iterations, factor);
    return { objects: state.objects.map(o => o.id === objectId ? { ...o, vertices: verts } : o) };
  }),

  // ── Batch position update (used by group drag) ──────────────────────────────

  batchUpdatePositions: (updates) => set(state => {
    // updates: { [objectId]: [x,y,z] }
    return {
      objects: state.objects.map(obj =>
        updates[obj.id] !== undefined ? { ...obj, position: updates[obj.id] } : obj
      ),
    };
  }),

  // ── Vertices ────────────────────────────────────────────────────────────────

  updateVertices: (objectId, updates) => set((state) => {
    const updateMap = new Map(updates.map(u => [u.index, u.position]));
    const newObjects = state.objects.map(obj => {
      if (obj.id !== objectId) return obj;
      const newVertices = obj.vertices.map((v, i) => updateMap.has(i) ? updateMap.get(i) : v);
      return { ...obj, vertices: newVertices };
    });
    return { objects: newObjects };
  }),

  saveHistory: () => {
    const { history, historyIndex, objects } = get();
    const isAtEnd = historyIndex === history.length - 1;
    const newHistory = isAtEnd ? [...history] : history.slice(0, historyIndex + 1);
    const snapshot = JSON.parse(JSON.stringify(objects));
    newHistory.push(snapshot);
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => set((state) => {
    if (state.historyIndex <= 0) return {};
    const newIndex = state.historyIndex - 1;
    return {
      objects: JSON.parse(JSON.stringify(state.history[newIndex])),
      historyIndex: newIndex
    };
  }),

  redo: () => set((state) => {
    if (state.historyIndex >= state.history.length - 1) return {};
    const newIndex = state.historyIndex + 1;
    return {
      objects: JSON.parse(JSON.stringify(state.history[newIndex])),
      historyIndex: newIndex
    };
  }),

  setSelectedObjectId: (id) => set({
    selectedObjectId: id,
    selectedObjectIds: id ? [id] : [],
    selectedGroupId: null,
    selectedJointIndex: null,
    selectedVertexIndices: [],
    editMode: id ? get().editMode : 'object',
  }),

  toggleSelectedObjectId: (id) => {
    const { selectedObjectIds, selectedObjectId } = get();
    const next = selectedObjectIds.includes(id)
      ? selectedObjectIds.filter(i => i !== id)
      : [...selectedObjectIds, id];
    set({
      selectedObjectIds: next,
      selectedObjectId: next[next.length - 1] ?? null,
      selectedGroupId: null,
      selectedJointIndex: null,
      selectedVertexIndices: [],
    });
  },

  selectAllObjects: () => {
    const { objects } = get();
    const visibleIds = objects.filter(o => o.visible !== false).map(o => o.id);
    set({
      selectedObjectIds: visibleIds,
      selectedObjectId: visibleIds[visibleIds.length - 1] ?? null,
      selectedGroupId: null,
      selectedJointIndex: null,
      selectedVertexIndices: [],
      editMode: 'object',
    });
  },

  updateSelectedObjects: (updates) => {
    const { selectedObjectIds } = get();
    set(state => ({
      objects: state.objects.map(obj =>
        selectedObjectIds.includes(obj.id) ? { ...obj, ...updates } : obj
      ),
    }));
  },

  setSelectedJointIndex: (index) => set({ selectedJointIndex: index }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setExportRequested: (exportRequested) => set({ exportRequested }),

  // Add multiple parts as a named group (used by parametric generation)
  addObjects: (parts, groupName = 'Generated Object') => {
    const state = get();
    // Compute spawn X to the right of the existing scene
    let spawnX = 3;
    if (state.objects.length > 0) {
      let maxX = -Infinity;
      for (const obj of state.objects) {
        const px = obj.position?.[0] ?? 0;
        for (const v of (obj.vertices || [])) maxX = Math.max(maxX, px + v[0]);
      }
      if (maxX > -Infinity) spawnX = maxX + 2;
    }
    const groupId = Math.random().toString(36).substr(2, 9);
    const newObjects = parts.map(part => ({
      id: Math.random().toString(36).substr(2, 9),
      name: part.label || 'Part',
      vertices: part.vertices,
      indices: part.indices,
      color: part.color || '#7C3AED',
      materialType: part.materialType || 'standard',
      metalness: 0.5,
      roughness: 0.5,
      visible: true,
      position: [spawnX + (part.position?.[0] ?? 0), part.position?.[1] ?? 0, part.position?.[2] ?? 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      groupId,
    }));
    set(s => ({
      objects: [...s.objects, ...newObjects],
      groups: [...s.groups, { id: groupId, name: groupName }],
      selectedObjectId: newObjects[0]?.id || null,
      selectedGroupId: groupId,
      selectedObjectIds: newObjects.map(o => o.id),
      selectedJointIndex: null,
    }));
  },

  setGeometry: (data) => set((state) => {
    if (Array.isArray(data)) {
      return { objects: data, selectedObjectId: data[0]?.id || null, selectedJointIndex: null };
    }
    // Place generated object to the right of the existing scene so it doesn't overlap
    let spawnX = 3;
    if (state.objects.length > 0) {
      let maxX = -Infinity;
      for (const obj of state.objects) {
        const px = obj.position?.[0] ?? 0;
        for (const v of (obj.vertices || [])) maxX = Math.max(maxX, px + v[0]);
      }
      if (maxX > -Infinity) spawnX = maxX + 2;
    }
    const newObj = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Generated Mesh',
      ...data,
      color: data.color || '#7C3AED',
      materialType: data.materialType || 'physical',
      visible: true,
      position: [spawnX, 0, 0],
      rotation: [0,0,0],
      scale: [1,1,1]
    };
    return { objects: [...state.objects, newObj], selectedObjectId: newObj.id, selectedJointIndex: null };
  }),

  updateObject: (id, updates) => set((state) => {
    const newObjects = state.objects.map(obj => obj.id === id ? { ...obj, ...updates } : obj);
    return { objects: newObjects };
  }),

  // Patch the vertices and indices of an existing object in-place (used by AI refinement).
  // Preserves all other object properties (position, color, material, etc.).
  patchObjectGeometry: (id, vertices, indices) => set((state) => ({
    objects: state.objects.map(o => o.id === id ? { ...o, vertices, indices } : o),
  })),

  updateObjectTransform: (id, position, rotation, scale) => {
    const newObjects = get().objects.map(obj =>
      obj.id === id ? { ...obj, position, rotation, scale } : obj
    );
    set({ objects: newObjects });
  },

  updateVertex: (objectId, vertexIndex, newPosition) => set((state) => {
    const newObjects = state.objects.map(obj => {
      if (obj.id === objectId) {
        const newVertices = [...obj.vertices];
        newVertices[vertexIndex] = newPosition;
        return { ...obj, vertices: newVertices };
      }
      return obj;
    });
    return { objects: newObjects };
  }),

  addPrimitive: (type) => {
    const { objects } = get();
    const id = Math.random().toString(36).substr(2, 9);
    let vertices = [];
    let indices = [];

    // New shapes delegate to shared primitive builder
    if (['torus', 'plane', 'pyramid', 'capsule'].includes(type)) {
      const result = buildPrimitiveMesh(type, [1, 1, 1]);
      vertices = result.vertices;
      indices = result.indices;
    } else if (type === 'cube') {
      vertices = [
        [-0.5,-0.5,-0.5], [0.5,-0.5,-0.5], [0.5,0.5,-0.5], [-0.5,0.5,-0.5],
        [-0.5,-0.5,0.5], [0.5,-0.5,0.5], [0.5,0.5,0.5], [-0.5,0.5,0.5]
      ];
      indices = [
        0,2,1, 0,3,2, 4,5,6, 4,6,7, 0,1,5, 0,5,4, 2,3,7, 2,7,6, 0,4,7, 0,7,3, 1,2,6, 1,6,5
      ];
    } else if (type === 'sphere') {
      const segments = 12;
      for (let lat = 0; lat <= segments; lat++) {
        const theta = (lat * Math.PI) / segments;
        for (let lon = 0; lon <= segments; lon++) {
          const phi = (lon * 2 * Math.PI) / segments;
          vertices.push([
            Math.sin(theta) * Math.cos(phi),
            Math.cos(theta),
            Math.sin(theta) * Math.sin(phi)
          ]);
        }
      }
      for (let lat = 0; lat < segments; lat++) {
        for (let lon = 0; lon < segments; lon++) {
          const first = lat * (segments + 1) + lon;
          const second = first + segments + 1;
          indices.push(first, second, first + 1, second, second + 1, first + 1);
        }
      }
    } else if (type === 'cylinder') {
      const segments = 16;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = Math.cos(theta) * 0.5;
        const z = Math.sin(theta) * 0.5;
        vertices.push([x, -0.5, z], [x, 0.5, z]);
      }
      for (let i = 0; i < segments; i++) {
        const b1 = i * 2, t1 = b1 + 1, b2 = (i + 1) * 2, t2 = b2 + 1;
        indices.push(b1, t1, b2, t1, t2, b2);
      }
    } else if (type === 'cone') {
      const segments = 16;
      vertices.push([0, 0.5, 0]);
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        vertices.push([Math.cos(theta) * 0.5, -0.5, Math.sin(theta) * 0.5]);
      }
      for (let i = 1; i <= segments; i++) {
        indices.push(0, i, i + 1);
      }
    }

    const newObj = {
      id,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${objects.length + 1}`,
      vertices,
      indices,
      color: '#7C3AED',
      materialType: 'standard',
      metalness: 0.5,
      roughness: 0.5,
      visible: true,
      position: [3, 0.5, 0],
      rotation: [0,0,0],
      scale: [1,1,1]
    };

    set({
      objects: [...objects, newObj],
      selectedObjectId: id,
      selectedGroupId: null,
      selectedJointIndex: null
    });
    get().saveHistory();
  },

  setGroup: (groupId) => set((state) => ({
    objects: state.objects.map(o => o.id === state.selectedObjectId ? {...o, groupId} : o)
  })),
  unsetGroup: () => set((state) => ({
    objects: state.objects.map(o => o.id === state.selectedObjectId ? {...o, groupId: null} : o)
  })),

  applyBevel: (objectId, selectedIndices, amount) => set(state => {
    const obj = state.objects.find(o => o.id === objectId);
    if (!obj) return {};
    const result = bevelSelectedVertices(obj.vertices, obj.indices, selectedIndices, amount);
    return {
      objects: state.objects.map(o => o.id === objectId ? { ...o, ...result } : o),
      selectedVertexIndices: [],
      selectedJointIndex: null,
    };
  }),

  subdivideEdge: (objectId, v1, v2) => set(state => {
    const obj = state.objects.find(o => o.id === objectId);
    if (!obj) return {};
    const result = meshSubdivideEdge(obj.vertices, obj.indices, v1, v2);
    return {
      objects: state.objects.map(o => o.id === objectId ? { ...o, vertices: result.vertices, indices: result.indices } : o),
      selectedVertexIndices: [result.newVertexIndex],
      selectedJointIndex: result.newVertexIndex,
    };
  }),

  dissolveVertex: (objectId, vi) => set(state => {
    const obj = state.objects.find(o => o.id === objectId);
    if (!obj) return {};
    const result = meshDissolveVertex(obj.vertices, obj.indices, vi);
    const shiftIdx = i => i === vi ? null : i > vi ? i - 1 : i;
    const newSelected = state.selectedVertexIndices
      .map(shiftIdx).filter(i => i !== null);
    return {
      objects: state.objects.map(o => o.id === objectId ? { ...o, vertices: result.vertices, indices: result.indices } : o),
      selectedVertexIndices: newSelected,
      selectedJointIndex: newSelected[0] ?? null,
    };
  }),

  deleteObject: (id) => {
    const { saveHistory, objects, selectedObjectId } = get();
    saveHistory();
    const newObjects = objects.filter(obj => obj.id !== id);
    set({
      objects: newObjects,
      selectedObjectId: selectedObjectId === id ? null : selectedObjectId,
      selectedJointIndex: null
    });
  },

  // ── Scenes ──────────────────────────────────────────────────────────────────

  switchScene: (id) => {
    const state = get();
    if (id === state.activeSceneId) return;
    const updatedScenes = saveCurrentToScene(state);
    const next = updatedScenes.find(s => s.id === id);
    if (!next) return;
    set({
      scenes: updatedScenes,
      activeSceneId: id,
      objects: next.objects,
      groups: next.groups,
      history: next.history,
      historyIndex: next.historyIndex,
      ...CLEAR_SELECTION,
    });
  },

  addScene: (name) => {
    const state = get();
    const id = Math.random().toString(36).substr(2, 9);
    const newScene = { id, name, objects: [], groups: [], history: [[]], historyIndex: 0 };
    const updatedScenes = saveCurrentToScene(state);
    set({
      scenes: [...updatedScenes, newScene],
      activeSceneId: id,
      objects: [],
      groups: [],
      history: [[]],
      historyIndex: 0,
      ...CLEAR_SELECTION,
    });
    return id;
  },

  duplicateScene: () => {
    const state = get();
    const current = state.scenes.find(s => s.id === state.activeSceneId);
    if (!current) return;
    const id = Math.random().toString(36).substr(2, 9);
    const snap = JSON.parse(JSON.stringify(state.objects));
    // Re-assign all IDs to avoid conflicts
    const idMap = {};
    const newObjects = snap.map(o => {
      const nid = Math.random().toString(36).substr(2, 9);
      idMap[o.id] = nid;
      return { ...o, id: nid };
    });
    const groupIdMap = {};
    const newGroups = state.groups.map(g => {
      const ngid = Math.random().toString(36).substr(2, 9);
      groupIdMap[g.id] = ngid;
      return { ...g, id: ngid };
    });
    const remappedObjects = newObjects.map(o => ({
      ...o,
      groupId: o.groupId ? (groupIdMap[o.groupId] ?? null) : null,
    }));
    const dupScene = {
      id,
      name: current.name + ' Copy',
      objects: remappedObjects,
      groups: newGroups,
      history: [JSON.parse(JSON.stringify(remappedObjects))],
      historyIndex: 0,
    };
    const updatedScenes = saveCurrentToScene(state);
    const idx = updatedScenes.findIndex(s => s.id === state.activeSceneId);
    const spliced = [...updatedScenes.slice(0, idx + 1), dupScene, ...updatedScenes.slice(idx + 1)];
    set({
      scenes: spliced,
      activeSceneId: id,
      objects: remappedObjects,
      groups: newGroups,
      history: dupScene.history,
      historyIndex: 0,
      ...CLEAR_SELECTION,
    });
  },

  deleteScene: (id) => {
    const state = get();
    if (state.scenes.length <= 1) return;
    const idx = state.scenes.findIndex(s => s.id === id);
    const newScenes = state.scenes.filter(s => s.id !== id);
    if (id !== state.activeSceneId) {
      set({ scenes: newScenes });
      return;
    }
    const next = newScenes[Math.max(0, idx - 1)];
    set({
      scenes: newScenes,
      activeSceneId: next.id,
      objects: next.objects,
      groups: next.groups,
      history: next.history,
      historyIndex: next.historyIndex,
      ...CLEAR_SELECTION,
    });
  },

  renameScene: (id, name) => set(state => ({
    scenes: state.scenes.map(s => s.id === id ? { ...s, name } : s),
  })),

  // Replace all scenes (used when loading a saved project from the DB)
  loadProject: (scenes, activeSceneId) => {
    const active = scenes.find(s => s.id === activeSceneId) || scenes[0];
    if (!active) return;
    set({
      scenes,
      activeSceneId: active.id,
      objects: active.objects || [],
      groups: active.groups || [],
      history: active.history || [[]],
      historyIndex: active.historyIndex ?? 0,
      ...CLEAR_SELECTION,
    });
  },
}));

export default useStore;
