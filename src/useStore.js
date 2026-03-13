import { create } from 'zustand';

export const useStore = create((set, get) => ({
  objects: [],
  history: [[]],
  historyIndex: 0,
  
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
    return { objects: JSON.parse(JSON.stringify(state.history[newIndex])), historyIndex: newIndex };
  }),

  redo: () => set((state) => {
    if (state.historyIndex >= state.history.length - 1) return {};
    const newIndex = state.historyIndex + 1;
    return { objects: JSON.parse(JSON.stringify(state.history[newIndex])), historyIndex: newIndex };
  }),

  addPrimitive: (type) => {
    const { objects, saveHistory } = get();
    saveHistory();
    set({ objects: [...objects, { id: Math.random(), name: type + ' 1' }] });
  }
}));

export default useStore;
