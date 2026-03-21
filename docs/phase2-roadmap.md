# Plenum3D Phase 2: Implementation Roadmap

## 1. Elevating Visual Fidelity
- [ ] **Task 1.1: Environment Mapping (HDRI)**:
    - Implement a library of studio/outdoor HDRI environments.
    - Create a UI panel in `Inspector.jsx` to load and toggle environment maps.
    - Integrate `Environment` component from `@react-three/drei`.
- [ ] **Task 1.2: Advanced PBR Texture Support**:
    - Update `EditableMesh.jsx` to support maps (roughness, metalness, normal, bump).
    - Add texture-loading UI in the Material Inspector.
- [ ] **Task 1.3: Post-Processing Integration**:
    - Add `EffectComposer` to `App.jsx`.
    - Implement Bloom, Depth of Field, and SSAO toggles with intensity sliders.
- [ ] **Task 1.4: Advanced Lighting Engine**:
    - Expose `Directional`, `Point`, and `SpotLight` controls in `SceneManager`.
    - Implement real-time shadow mapping configuration (shadowMap, bias, resolution).

## 2. Supercharging the AI Agent
- [ ] **Task 2.1: Agentic Animation Loop**:
    - Add `AnimationGenerator` service.
    - Expand `agentService.js` to parse animation intents (e.g., "spin," "hover").
    - Inject `useFrame` logic into object components dynamically.
- [ ] **Task 2.2: Procedural Material Generation**:
    - Implement texture-mapping AI pipeline using Stitch tokens.
    - Update `aiService.js` to map prompt descriptions (e.g., "carbon fiber") to PBR texture assets.
- [ ] **Task 2.3: Spatial & Physics Awareness**:
    - Extend `Agent` context with bounding box (AABB) data for all objects.
    - Implement spatial-aware placement logic (align to ground, stack objects, relative distances).

## 3. Bridging the Developer Experience (DX)
- [ ] **Task 3.1: Bi-Directional Code Sync**:
    - Refactor `CodeView` to use an editable code editor (e.g., Monaco).
    - Implement live parsing (R3F code → `useStore` state) and inverse mapping.
- [ ] **Task 3.2: Next.js Boilerplate Export**:
    - Implement a dynamic project-template generator.
    - Zip and serve a ready-to-run Vercel project repository containing the current scene configuration.
- [ ] **Task 3.3: Component Modularity**:
    - Add "Extract to Component" functionality in `SceneManager`.
    - Update `CodeGenerator.js` to support modular component splitting and clean-up of the scene graph.
