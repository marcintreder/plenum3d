# Execution Plan: 3D Figma

## 1. Technical Stack

### Core Frontend
- **Framework:** React 19 (Vite-based for speed).
- **Styling:** Tailwind CSS.
- **UI Components:** Shadcn UI + Radix UI (for accessible sidebars, dialogs, and panels).

### 3.D Engine & Math
- **Engine:** Three.js.
- **React Integration:** React Three Fiber (R3F).
- **Utility Library:** @react-three/drei (for Gizmos, Cameras, and HTML overlays).
- **Physics/Math:** Cannon-es or Rapier (if simulation is needed), Three-mesh-bvh for raycasting.

### State Management
- **Zustand:** To manage the global scene graph, active selection, and UI state without the boilerplate of Redux.

### AI Implementation
- **LLM Connector:** A custom provider-agnostic wrapper for OpenAI, Anthropic, Google, and Ollama.
- **Dynamic Execution:** Using `new Function()` or a sandboxed runner to execute R3F code strings returned by AI.

## 2. Architecture Diagram (Conceptual)
1. **The Core:** Three.js Scene.
2. **The Wrapper:** R3F Components.
3. **The Editor:** A Zustand-driven layer that tracks "Part" hierarchy and vertex data.
4. **The Brain:** AI prompt engine that modifies the Zustand state or injects new R3F components.

## 3. Development Phases

### Phase 1: Foundation (Week 1)
- Initialize Vite/React/Tailwind project.
- Basic 3D Viewport with Grid, OrbitControls, and Lighting.
- Implementation of the "Local Storage Key Manager" for BYOK.

### Phase 2: The "Brain" (Week 2)
- Build the prompt input UI.
- Implement the streaming LLM interface (including Ollama local support).
- Create a system to "mount" AI-generated code into the live scene.

### Phase 3: Selection & Direct Manipulation (Week 3)
- Implement Raycasting for surface/part selection.
- Add Transform Gizmos (Translate/Rotate/Scale).
- Build the "Scene Tree" (Layers panel) for selecting nested parts (e.g., F1 -> Wheel -> Rim).

### Phase 4: Vector-Style Editing (Week 4)
- Joint system: Defining parent-child relationships via UI.
- Edge/Vertex selection mode.
- Implementation of "Point-to-Point" joint manipulation.

### Phase 5: Export & Final Polish (Week 5)
- GLTFExporter and OBJExporter integration.
- JSX/R3F code string generator.
- UI/UX polish (Dark mode, F1-car demo scene).

## 4. Key Challenges & Mitigations
- **Challenge:** AI generating broken R3F code.
  - **Mitigation:** Strict system prompting and a robust error-boundary around the AI-generated components.
- **Challenge:** Large model performance.
  - **Mitigation:** Use InstancedMesh where applicable and Three-mesh-bvh for selection optimization.
