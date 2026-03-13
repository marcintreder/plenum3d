import { create } from 'zustand';
import { generateF1 } from './f1Model';

const initialObjects = generateF1();

const useStore = create((set, get) => ({
  objects: initialObjects,
  history: [JSON.parse(JSON.stringify(initialObjects))],
  historyIndex: 0,
  selectedObjectId: null,
  selectedJointIndex: null,
  editMode: 'object',
  isGenerating: false,
  exportRequested: false,

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

  setEditMode: (mode) => set({ editMode: mode, selectedJointIndex: null }),
  setSelectedObjectId: (id) => set({ 
    selectedObjectId: id, 
    selectedJointIndex: null
  }),
  
  setSelectedJointIndex: (index) => set({ selectedJointIndex: index }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setExportRequested: (exportRequested) => set({ exportRequested }),

  // This replaces the entire scene or merges into it
  setGeometry: (data) => set((state) => {
    // If it's an array (like from f1Model), replace objects
    if (Array.isArray(data)) {
      return { objects: data, selectedObjectId: data[0]?.id || null, selectedJointIndex: null };
    }
    // If it's a single object (like from older AI service), wrap it
    const newObj = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Generated Mesh',
      ...data,
      color: data.color || '#7C3AED',
      materialType: data.materialType || 'physical',
      visible: true,
      position: [0,0,0],
      rotation: [0,0,0],
      scale: [1,1,1]
    };
    return { objects: [...state.objects, newObj], selectedObjectId: newObj.id, selectedJointIndex: null };
  }),

  updateObject: (id, updates) => set((state) => {
    const newObjects = state.objects.map(obj => obj.id === id ? { ...obj, ...updates } : obj);
    return { objects: newObjects };
  }),

  updateObjectTransform: (id, position, rotation, scale) => {
    const { saveHistory, objects } = get();
    saveHistory();
    const newObjects = objects.map(obj => 
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
    // Vertex updates can be frequent, maybe only save on 'mouseUp' 
    // but for now let's just do it to be safe.
    return { objects: newObjects };
  }),

  addPrimitive: (type) => {
    const { saveHistory, objects } = get();
    saveHistory();
    const id = Math.random().toString(36).substr(2, 9);
    let vertices = [];
    let indices = [];

    // Add at a slight offset from center so they aren't buried
    const zOffset = (objects.length * 0.5) % 2;

    if (type === 'cube') {
      vertices = [
        [-0.5,-0.5,-0.5], [0.5,-0.5,-0.5], [0.5,0.5,-0.5], [-0.5,0.5,-0.5],
        [-0.5,-0.5,0.5], [0.5,-0.5,0.5], [0.5,0.5,0.5], [-0.5,0.5,0.5]
      ].map(([x,y,z]) => [x, y, z + zOffset]);
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
            Math.sin(theta) * Math.sin(phi) + zOffset
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
        vertices.push([x, -0.5, z + zOffset], [x, 0.5, z + zOffset]);
      }
      for (let i = 0; i < segments; i++) {
        const b1 = i * 2;
        const t1 = b1 + 1;
        const b2 = (i + 1) * 2;
        const t2 = b2 + 1;
        indices.push(b1, t1, b2, t1, t2, b2);
      }
    } else if (type === 'cone') {
      const segments = 16;
      vertices.push([0, 0.5, zOffset]); // Tip
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        vertices.push([Math.cos(theta) * 0.5, -0.5, Math.sin(theta) * 0.5 + zOffset]);
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
      position: [0,0,0],
      rotation: [0,0,0],
      scale: [1,1,1]
    };

    set({ 
      objects: [...objects, newObj],
      selectedObjectId: id,
      selectedJointIndex: null
    });
  }),

  deleteObject: (id) => {
    const { saveHistory, objects, selectedObjectId } = get();
    saveHistory();
    const newObjects = objects.filter(obj => obj.id !== id);
    set({
      objects: newObjects,
      selectedObjectId: selectedObjectId === id ? (newObjects[0]?.id || null) : selectedObjectId,
      selectedJointIndex: null
    });
  }
}));

export default useStore;