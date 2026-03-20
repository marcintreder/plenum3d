import { create } from 'zustand';

const useStore = create((set, get) => ({
  objects: [],
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
}));

export default useStore;
