# Execution Plan: Sculpt3D (3D Figma)

## ⚡ RESUME STATE — 2026-03-15

> **CRITICAL: DO NOT INVENT TASKS.** Execute ONLY the numbered tasks under REMAINING TASKS below.
> A task is only DONE when: (1) git commit exists, (2) npm test passes with ZERO skipped tests.

---

## ✅ COMPLETED

- Vite 6 + React 19 + Three.js r183 + React Three Fiber v9.5 + @react-three/drei v10.7
- Tailwind CSS v4, Zustand v5, Vitest v4, Playwright v1.58
- Dark viewport: infinite grid, OrbitControls, ambient + directional + point lighting
- PivotControls gizmo for whole-object translate/rotate/scale
- Scene hierarchy panel (right sidebar): visibility toggle, delete, select
- Undo/redo history stack (50-deep), keyboard shortcuts — 14/14 tests passing
- GLB export + R3F/JSX code export + code viewer modal
- F1 car generator (20+ parts), Cube/Sphere/Cylinder/Cone primitives
- AI prompt bar: Ollama connector, reference image upload, BYOK settings panel
- Inspector: name, position/rotation/scale inputs, color/material, texture/roughness/metalness, CSG booleans

---

## ❌ REMAINING TASKS

### Task V1 — Draggable Vertex Handles (Figma-style node editing) [BLOCKER]
**The core editing feature. Nothing else matters until this works.**

**Files: src/VertexHandles.jsx (NEW), src/EditableMesh.jsx, src/App.jsx**

**What "Figma-like" means here:**
- Double-click a mesh → enter vertex edit mode (mesh glows/outline changes)
- Every vertex shows as a small dot/sphere
- Hover a vertex → it highlights (cyan)
- Click a vertex → it selects (bright cyan, slightly larger)
- Drag a vertex → it moves fluidly in the camera's view plane (exactly like dragging a node in Figma — movement tracks the cursor, not a fixed world axis)
- Escape → exit vertex mode, back to object mode
- Clicking empty space → deselects vertex, stays in vertex mode
- The mesh updates in real-time as vertices move

**Technical implementation:**
1. Create `src/VertexHandles.jsx`:
   - Renders only when `editMode === 'vertex'` and this object is selected
   - For each vertex, renders a `<mesh>` (sphere geometry, r=0.04) at the vertex world position
   - `hoveredIndex` state (null or number)
   - `draggingIndex` state (null or number)
   - `dragPlane` ref (THREE.Plane) — set when drag starts, facing the camera
   - Sphere colors: white (default), #00ffff (hovered), #00ffff bright + scale 1.5x (selected/dragging)
   - `onPointerOver/Out`: update hoveredIndex, set cursor style
   - `onPointerDown(e, i)`: stopPropagation, set draggingIndex, build camera-facing drag plane through vertex world pos, attach document pointerup/pointermove handlers
   - In pointermove: unproject mouse → ray → intersect dragPlane → new world pos → transform back to object local space → updateVertex
   - In pointerup: clear draggingIndex, saveHistory, remove document listeners
   - Disable OrbitControls while dragging (pass setOrbitEnabled prop or use store flag)

2. Show wireframe edge overlay in vertex mode:
   - In `EditableMesh.jsx`, when `editMode === 'vertex'` and selected: render a second `<lineSegments>` using `THREE.EdgesGeometry` over the mesh with cyan color at 40% opacity
   - This shows the mesh topology (which vertices are connected) — critical for knowing what you're editing

3. Wire up in `App.jsx`:
   - Pass `setOrbitEnabled` into Canvas context or use a store flag `orbitEnabled`
   - `<OrbitControls enabled={orbitEnabled} makeDefault />`
   - Remove old `<JointManipulator />` — replaced by VertexHandles inside EditableMesh

4. Update `EditableMesh.jsx`:
   - Import and render `<VertexHandles>` when in vertex mode
   - Keep double-click → vertex mode working
   - Single click outside any mesh → back to object mode (onPointerMissed on Canvas)

**Definition of done:** double-click a cube → vertices appear as dots → drag any dot → vertex moves fluidly tracking the cursor → mesh deforms in real time → Escape returns to object mode. npm test 14/14, git commit.

---

### Task V2 — Multi-Vertex Selection + Marquee
**Files: src/useStore.jsx, src/VertexHandles.jsx**

- Store: replace `selectedJointIndex: number|null` with `selectedVertexIndices: number[]` (array for multi-select). Add `setSelectedVertexIndices(indices)`, `toggleVertexSelection(index)`, `clearVertexSelection()`. Keep `selectedJointIndex` as a computed getter (first of selectedVertexIndices) for Inspector backward compat.
- VertexHandles: shift+click → toggle vertex in selection, drag any selected vertex → move ALL selected vertices by the same delta
- Marquee: `onPointerDown` on the background plane in vertex mode → drag draws a 2D screen-space rectangle → on pointerup, test which vertex screen projections are inside the rect → select them all
- Selected vertices: bright cyan. Multiple selected vertices move together.

**Definition of done:** can shift-click 4 vertices, drag one, all 4 move together. Drag box to select a region. npm test, git commit.

---

### Task V3 — Edge Visualization + Precision Controls
**Files: src/VertexHandles.jsx, src/Inspector.jsx**

- Edges as hoverable lines: In vertex mode, render `THREE.EdgesGeometry` as `<lineSegments>`. When mouse hovers an edge (within ~5px screen distance), highlight it cyan.
- Clicking an edge selects both its endpoint vertices.
- Inspector upgrade: when exactly 1 vertex selected, show its X/Y/Z inputs (already there). When multiple selected, show delta-move inputs (type "+0.5" to move all selected by 0.5 on that axis).
- Axis constraint while dragging: hold X/Y/Z key during drag → constrain movement to that world axis (show axis line as visual feedback)

**Definition of done:** can click an edge to select both endpoints, can type a value to move selected vertices precisely, axis constraint works. npm test, git commit.

---

### Task V4 — BYOK Settings + AI Streaming
**Files: src/App.jsx, src/aiService.js, src/components/GenerationErrorBoundary.jsx (new)**

- Settings panel fully functional: Ollama | OpenAI | Anthropic | Google tabs, URL + key per provider, persisted to localStorage `3d_sculpt_keys`
- AI service: detect active provider from keys, route to correct API with streaming
- Stream tokens: show skeleton/spinner in viewport while generating, stream the code output in CodeView
- Error boundary around generated mesh display — invalid geometry shows error message, doesn't crash

**Definition of done:** enter Anthropic key → send prompt → see streaming response → mesh appears. npm test, git commit.

---

### Task V5 — Grouping + OBJ Export + Visual Polish + Deploy
**Files: src/useStore.jsx, src/Inspector.jsx, src/Exporter.jsx, src/index.css**

- Group: select 2+ objects, Cmd+G → group them. Group appears as single collapsible entry in Scene Graph. Ungroup: Cmd+Shift+G.
- OBJ export alongside GLB.
- Visual polish: glassmorphism panels (backdrop-blur-xl, bg-opacity-80), cyan pulsing ring on selected object outline, data-testid attributes on all interactive elements.
- Deploy: `vercel deploy --prod` logged in as marcintreder@gmail.com.

**Definition of done:** grouping works, OBJ export works, visual polish applied, deployed to vercel. npm test, git commit.

---

## Technical Stack
- React 19, Vite 6, Three.js r183, React Three Fiber v9.5, @react-three/drei v10.7
- Tailwind CSS v4, Zustand v5 — Vitest v4 — Playwright v1.58
- BYOK: OpenAI / Anthropic / Google / Ollama (localStorage only)

## Key Constraints
- API keys in localStorage only — no server
- 60FPS during vertex manipulation
- Drag must track the cursor (camera-plane intersection), not fixed-axis gizmo
