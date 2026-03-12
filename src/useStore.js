import { create } from 'zustand';

const useStore = create((set) => ({
  vertices: [
    [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5],
    [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]
  ],
  indices: [
    0, 2, 1, 0, 3, 2,
    4, 5, 6, 4, 6, 7,
    0, 1, 5, 0, 5, 4,
    2, 3, 7, 2, 7, 6,
    0, 4, 7, 0, 7, 3,
    1, 2, 6, 1, 6, 5
  ],
  selectedJointIndex: null,
  isGenerating: false,
  
  setSelectedJointIndex: (index) => set({ selectedJointIndex: index }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  
  setGeometry: ({ vertices, indices }) => set({ 
    vertices, 
    indices, 
    selectedJointIndex: null 
  }),
  
  updateVertex: (index, position) => set((state) => {
    const newVertices = [...state.vertices];
    newVertices[index] = position;
    return { vertices: newVertices };
  }),
}));

export default useStore;
