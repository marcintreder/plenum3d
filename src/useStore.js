import { create } from 'zustand';
import { generateF1 } from './f1Model';

const initialGeometry = generateF1();

const useStore = create((set) => ({
  vertices: initialGeometry.vertices,
  indices: initialGeometry.indices,
  selectedJointIndex: null,
  isGenerating: false,
  exportRequested: false,
  
  // Material state
  color: '#7C3AED',
  materialType: 'standard', // 'standard', 'physical', 'wireframe'
  metalness: 0.5,
  roughness: 0.5,
  
  setSelectedJointIndex: (index) => set({ selectedJointIndex: index }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setExportRequested: (exportRequested) => set({ exportRequested }),
  
  setColor: (color) => set({ color }),
  setMaterialType: (materialType) => set({ materialType }),
  setMetalness: (metalness) => set({ metalness }),
  setRoughness: (roughness) => set({ roughness }),

  setGeometry: ({ vertices, indices, color, materialType }) => set((state) => ({ 
    vertices, 
    indices, 
    color: color || state.color,
    materialType: materialType || state.materialType,
    selectedJointIndex: null 
  })),
  
  updateVertex: (index, position) => set((state) => {
    const newVertices = [...state.vertices];
    newVertices[index] = position;
    return { vertices: newVertices };
  }),

  addPrimitive: (type) => set((state) => {
    let newVertices = [];
    let newIndices = [];
    const offset = state.vertices.length;

    if (type === 'cube') {
      newVertices = [
        [-0.5,-0.5,-0.5], [0.5,-0.5,-0.5], [0.5,0.5,-0.5], [-0.5,0.5,-0.5],
        [-0.5,-0.5,0.5], [0.5,-0.5,0.5], [0.5,0.5,0.5], [-0.5,0.5,0.5]
      ];
      newIndices = [
        0,2,1, 0,3,2, 4,5,6, 4,6,7, 0,1,5, 0,5,4, 2,3,7, 2,7,6, 0,4,7, 0,7,3, 1,2,6, 1,6,5
      ];
    } else if (type === 'sphere') {
      const segments = 8;
      for (let lat = 0; lat <= segments; lat++) {
        const theta = (lat * Math.PI) / segments;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        for (let lon = 0; lon <= segments; lon++) {
          const phi = (lon * 2 * Math.PI) / segments;
          const sinPhi = Math.sin(phi);
          const cosPhi = Math.cos(phi);
          newVertices.push([sinTheta * cosPhi, cosTheta, sinTheta * sinPhi]);
        }
      }
      for (let lat = 0; lat < segments; lat++) {
        for (let lon = 0; lon < segments; lon++) {
          const first = lat * (segments + 1) + lon;
          const second = first + segments + 1;
          newIndices.push(first, second, first + 1);
          newIndices.push(second, second + 1, first + 1);
        }
      }
    }

    return {
      vertices: [...state.vertices, ...newVertices],
      indices: [...state.indices, ...newIndices.map(i => i + offset)]
    };
  }),
}));

export default useStore;
