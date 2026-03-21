## 0. Modern Landing Experience
- **0.1.1 Stitch-Powered Landing Page**:
    - Use `stitch_design` to generate stunning, high-fidelity UI tokens for the landing page.
    - Replace the basic `LoginPage.jsx` with a modern, motion-rich landing experience.
    - Implement smooth entry animations and interactive 3D scene background showcasing Plenum3D capabilities.

- **1.1.1 Environment Mapping Integration**
  - Implement `Environment` loader in `SceneManager.jsx`.
  - Add HDRI selector UI (using a dedicated `EnvMapPanel.jsx`).
- **1.1.2 Material System Expansion**
  - Refactor `EditableMesh.jsx` material pipeline.
  - Expose maps (roughness, metalness, normal, bump) via `Inspector.jsx`.
  - Add file-upload drag-and-drop zone in the Inspector for texture assets.
- **1.1.3 EffectComposer Layer**
  - Configure `EffectComposer` in `App.jsx`.
  - Implement Bloom, Depth of Field, and SSAO UI controls.
- **1.1.4 Advanced Lighting Engine**
  - Update `SceneManager` to include `SpotLight` and `PointLight` class support.
  - Expose shadow map properties (Bias, MapSize, Softness) in a new `LightInspector`.

## 2. Supercharging the AI Agent (Agentic Logic)
- **2.1.1 Animation Parser & Hook**
  - Develop `AnimationGenerator` to map natural language to keyframe arrays.
  - Implement `useAnimationHook` that injects `useFrame` logic into mesh entities.
- **2.1.2 Procedural Material Generation**
  - Integrate `stitch_design` output with PBR map generation.
  - Implement a `MaterialTextureMap` that interprets JSON tokens into Three.js texture instances.
- **2.1.3 Spatial Reasoning Engine**
  - Create a `BoundingBoxService` that computes the AABB (Axis-Aligned Bounding Box) for all scene objects.
  - Update `AgentContext` to provide "Spatial Awareness": proximity, intersection, and alignment checks (e.g., "grounded on X").

## 3. Bridging the Developer Experience (DX)
- **3.1.1 Bi-directional Code Editor**
  - Implement `CodeEditor` (using Monaco editor) in `CodeView.jsx`.
  - Add a "Live Sync" bridge: `monaco.onChange` -> `R3F Parser` -> `useStore.updateObjects()`.
- **3.1.2 Next.js Boilerplate Generator**
  - Create a template-engine that wraps the current scene into a full `next.config.js` and `package.json` boilerplate.
  - Add "Export as Next.js Project" button to trigger file-stream download.
- **3.1.3 Component Extraction Engine**
  - Add `ExtractionUI` logic: allows selection of group/mesh -> triggers component refactoring -> generates `.jsx` file -> replaces in scene graph with `<NewComponent />`.

## 4. Final System Polish (Integration & Performance)
- **4.1.1 Asset Performance (Memory)**
  - Implement lazy-loading of high-fidelity textures/HDRIs.
  - Add a memory-usage monitor panel in the Inspector.
- **4.1.2 Integration QA Suite**
  - Expand Playwright smoke tests to include high-fidelity material switching and lighting changes.
  - Automated performance regression test (Render loop fps check).
