import { create } from 'zustand';
import { generateF1 } from './f1Model';

const useStore = create((set) => ({
  objects: [
    {
      id: 'initial-f1',
      name: 'F1 Car',
      ...generateF1(),
      color: '#7C3AED',
      materialType: 'physical',
      metalness: 0.8,
      roughness: 0.2,
      visible: true,
    }
  ],
  selectedObjectId: 'initial-f1',
  selectedJointIndex: null,
  isGenerating: false,
  exportRequested: false,

  setSelectedObjectId: (id) => set({ selectedObjectId: id, selectedJointIndex: null }),
  setSelectedJointIndex: (index) => set({ selectedJointIndex: index }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setExportRequested: (exportRequested) => set({ exportRequested }),

  updateObject: (id, updates) => set((state) => ({
    objects: state.objects.map(obj => obj.id === id ? { ...obj, ...updates } : obj)
  })),

  updateVertex: (objectId, vertexIndex, newPosition) => set((state) => ({
    objects: state.objects.map(obj => {
      if (obj.id === objectId) {
        const newVertices = [...obj.vertices];
        newVertices[vertexIndex] = newPosition;
        return { ...obj, vertices: newVertices };
      }
      return obj;
    })
  })),

  addPrimitive: (type) => set((state) => {
    const id = Math.random().toString(36).substr(2, 9);
    let vertices = [];
    let indices = [];

    if (type === 'cube') {
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
          vertices.push([Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)]);
        }
      }
      for (let lat = 0; lat < segments; lat++) {
        for (let lon = 0; lon < segments; lon++) {
          const first = lat * (segments + 1) + lon;
          const second = first + segments + 1;
          indices.push(first, second, first + 1, second, second + 1, first + 1);
        }
      }
    }

    const newObj = {
      id,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${state.objects.length + 1}`,
      vertices,
      indices,
      color: '#7C3AED',
      materialType: 'standard',
      metalness: 0.5,
      roughness: 0.5,
      visible: true
    };

    return {
      objects: [...state.objects, newObj],
      selectedObjectId: id
    };
  }),

  deleteObject: (id) => set((state) => ({
    objects: state.objects.filter(obj => obj.id !== id),
    selectedObjectId: state.selectedObjectId === id ? (state.objects[0]?.id || null) : state.selectedObjectId
  }))
}));

export default useStore;
