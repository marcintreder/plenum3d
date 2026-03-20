# Plenum3D — Development Plan

> **For Openclaw factory agents:** This is the active project plan. Read this file first. Only work on tasks listed under REMAINING TASKS. Do NOT invent new tasks or "improve" things not listed. A task is DONE when: (1) code is written, (2) `npm test` exits 0 with zero skips, (3) a git commit exists with the task number.

---

## Project Overview

**Plenum3D** is an AI-powered 3D modeling web app, deployed at plenum3d.com.

**Tech stack:**
- React 19, Vite 6, Three.js r183, React Three Fiber v9.5, @react-three/drei v10.7
- Tailwind CSS v4, Zustand v5, Vitest v4
- Google OAuth (access token flow via `useGoogleLogin`, NOT FedCM/JWT)
- Backend: Vercel serverless functions in `api/` directory
- Database: Neon PostgreSQL (`@neondatabase/serverless`) — table `user_data(user_id, key, value jsonb)`
- Deployment: Vercel → plenum3d.com

**Key files:**
- `src/App.jsx` — main editor UI and state wiring
- `src/useStore.jsx` — Zustand store (objects, groups, scenes, history)
- `src/agentService.js` — AI agent command execution
- `src/aiService.js` — AI model generation (single-pass THREE.js code gen)
- `src/EditableMesh.jsx` — 3D mesh rendering and interaction
- `src/useKeyboardShortcuts.js` — keyboard shortcut handling
- `api/_db.js` — Neon DB helpers (getData/setData use ::jsonb cast — do not change)
- `api/projects.js`, `api/settings.js` — serverless API handlers

---

## ✅ COMPLETED

- Persistent Google auth with silent token refresh
- Multi-object select + bulk operations (shift/cmd+click, marquee)
- Copy/paste objects (Cmd+C / Cmd+V)
- Project management UI: new project, inline rename, thumbnails
- AI generation auto-retry on parse error (1 retry max)
- Playwright E2E smoke tests (5 tests, auth mocked via addInitScript)
- Select All (Cmd+A)
- Undo/redo, GLB export, Inspector, Primitives, Vertex editing
- Neon DB persistence (settings + projects saved per user)
- LandingPage (marketing page shown to logged-out users)

### Task F6 — Layer and Group operations
**Files: `src/App.jsx`, `src/useStore.jsx`, `src/useKeyboardShortcuts.js`**

Implement layer/group interaction model inspired by Figma.
1. **Multiselect**: Hold `Cmd` (or `Ctrl`) while clicking items in the sidebar or viewport to toggle selection state.
2. **Context Menu**: Add a right-click context menu on selected sidebar items containing "Group" and "Ungroup".
3. **Shortcuts**: Wire `Cmd+G` to group all currently selected items (creating a new group node in the store) and `Cmd+Shift+G` to dissolve the selected group.

**Definition of done:**
- Multiselect via `Cmd+Click` implemented and reflected in `useStore` state.
- Right-click context menu implemented for items in the sidebar.
- "Group" action creates a logical grouping in the store; "Ungroup" removes the grouping.
- `Cmd+G` / `Cmd+Shift+G` shortcuts functional.
- `npm test` verification.
- One git commit: "task F6: layer and group operations"

---

### Task F7 — Fix rescaling of skeleton models
**Files: `src/useStore.jsx`, `src/utils/meshAnalysis.js`, `src/EditableMesh.jsx`**

The F1 model has a hierarchical skeleton/mesh structure. Currently, rescaling logic only updates the transform of the parent or internal data, leaving the visible mesh at its original scale.
1. Traverse the model hierarchy in `EditableMesh.jsx` to locate the correct target `Object3D` (visible mesh) before applying scaling.
2. Ensure scaling operations in `useStore.jsx` (and agent commands) correctly target the visible geometry, not just the parent/hidden nodes.

**Definition of done:**
- Visible geometry scales correctly when rescaling F1 wheels (or similar complex models).
- Scaling operation targets the actual mesh geometry/visible node rather than metadata nodes.
- One git commit: "task F7: fix rescaling of skeleton models"

---

### Task F8 — Integrated R3F Code Editor
**Files: `src/CodeView.jsx`, `src/App.jsx`**

Embed a code editor into the CodeView panel to enable live model editing.
1. Replace current static display with an editable `react-simple-code-editor` instance (with syntax highlighting via `prismjs`).
2. Implement auto-update: changes in the editor should parse the code and update the model state in real-time (with a small debounce).
3. Ensure errors (parsing/compilation) are handled gracefully (show error in UI, do not crash store).

**Definition of done:**
- Code editor is embedded in the CodeView panel.
- Edits in the editor trigger re-parsing and model updates.
- Invalid code shows a clear error indicator; does not apply broken state.
- One git commit: "task F8: integrated R3F code editor"

---

### Task F9 — Fix Capsule shape primitive
**Files: `src/utils/primitiveBuilder.js`**

The capsule primitive builder currently creates a sphere instead of a capsule.
1. Update `primitiveBuilder.js` to use `THREE.CapsuleGeometry` (instead of `SphereGeometry`) with appropriate height and radius parameters.
2. Ensure it respects the same positioning and material properties as other primitives.

**Definition of done:**
- Capsule renders as a Capsule (pill shape).
- One git commit: "task F9: fix Capsule primitive shape"

---

### Task F10 — User data sync
**Files: `api/projects.js`, `src/apiClient.js`, `src/App.jsx`**

Address data loss by robustly syncing project data.
1. Verify `apiClient.js` fetch/POST logic is atomic and handle potential concurrency issues.
2. On `App` mount (for `marcintreder@gmail.com`), perform a full sync of local versus DB-stored projects.
3. Add a explicit "Sync" button in the Settings panel for manual force-sync.

**Definition of done:**
- Projects for `marcintreder@gmail.com` are reliably synced on startup.
- Conflicts between local and remote are handled (favor remote/DB for serverless consistency).
- One git commit: "task F10: user data sync"

---

### Task F11 — Advanced 3D Space Operations
**Files: `src/App.jsx`, `src/EditableMesh.jsx`, `src/utils/snap.js`**

Add professional-grade 3D editing capabilities.
1. **Snapping**: Implement grid snapping (configurable) for movement and rotation.
2. **Gizmo-based manipulation**: Integrate a sophisticated 3D transformation gizmo (e.g., `THREE.TransformControls`) that allows visual manipulation of selected items.
3. **Camera Views**: Add orthographic preset buttons (Top, Front, Right, Isometric).

**Definition of done:**
- Professional 3D manipulation tools implemented (Transform Gizmo + Snapping).
- Orthographic camera presets implemented.
- One git commit: "task F11: advanced 3D space operations"

**Files: `src/App.jsx`**

The sidebar shows all objects in the scene. When there are many objects, it's hard to find one by name. Add a small search input above the object list that filters the displayed list in real time by object name (case-insensitive substring match). Filtering does not change selection or scene state — it only affects what is visible in the sidebar list. Clearing the input restores the full list.

**Definition of done:**
- Search input renders above the object list in the sidebar
- Typing in the input filters the list to only show objects whose name contains the typed string (case-insensitive)
- Clearing the input restores the full list
- `npm test` exits 0 with zero skips, including a unit test that verifies the filter logic
- One git commit: "task F1: object search filter in sidebar"

---

### Task F2 — Object duplication (Cmd+D)
**Files: `src/useStore.jsx`, `src/useKeyboardShortcuts.js`**

Add a `duplicateObject(id)` action to the Zustand store that clones the object with a new unique ID, offsets its position by [0.2, 0.2, 0] so it doesn't land exactly on top of the original, and adds it to the scene. Wire it to Cmd+D (or Ctrl+D on Windows) in `useKeyboardShortcuts.js`. The duplicate should be selected immediately after creation.

**Definition of done:**
- `duplicateObject` action exists in the store and creates a proper clone with new ID
- Position of duplicate is offset by [0.2, 0.2, 0] from the original
- Cmd+D triggers duplication of the currently selected object
- If no object is selected, Cmd+D is a no-op
- `npm test` exits 0 with zero skips, including a unit test for `duplicateObject`
- One git commit: "task F2: object duplication Cmd+D"

---

### Task F3 — Rename objects inline in the Inspector
**Files: `src/App.jsx` (Inspector panel section)**

Currently the Inspector shows the object name as static text. Make it editable: clicking the name text replaces it with an `<input>` field pre-filled with the current name. Pressing Enter or blurring the input saves the new name via `updateObject(id, { name })`. Pressing Escape cancels and restores the original name. The name field in the inspector should visually indicate it is editable (e.g. subtle underline or pencil icon on hover).

**Definition of done:**
- Object name in Inspector is clickable and becomes an input on click
- Enter/blur saves, Escape cancels
- `updateObject` is called with the new name on save
- `npm test` exits 0 with zero skips, including a unit test that verifies the rename updates the store
- One git commit: "task F3: inline object rename in Inspector"

---

### Task F4 — Scene background color picker
**Files: `src/App.jsx` (Canvas/scene settings area)**

The 3D canvas background is currently hardcoded to black. Add a color picker (use a standard `<input type="color">`) in the scene settings or toolbar that lets the user set the canvas background color. The selected color should be stored in Zustand state and applied to the R3F `<Canvas>` background. The color persists as part of the scene save (it should be included in the scene object in the store).

**Definition of done:**
- Color picker renders in the UI (scene settings or toolbar area)
- Changing the color updates the canvas background in real time
- The background color is stored in scene state and survives scene switches
- `npm test` exits 0 with zero skips, including a unit test that verifies background color is stored and retrieved from scene state
- One git commit: "task F4: scene background color picker"

---

### Task F5 — Keyboard shortcut reference panel
**Files: `src/App.jsx`**

Add a "?" button (bottom-right corner of the canvas or bottom of the sidebar) that opens a modal listing all keyboard shortcuts. The modal should be dismissible with Escape or by clicking outside it. The shortcut list should be hardcoded (not dynamic). Include at minimum: Cmd+Z (undo), Cmd+Shift+Z (redo), Cmd+C (copy), Cmd+V (paste), Cmd+D (duplicate), Cmd+A (select all), Cmd+G (group), Cmd+Shift+G (ungroup), Space+drag (pan), Delete (delete selected), Escape (deselect / exit vertex mode).

**Definition of done:**
- "?" button renders and opens the shortcuts modal on click
- Modal closes on Escape or outside click
- All shortcuts listed above appear in the modal
- `npm test` exits 0 with zero skips, including a unit test that verifies the shortcut list contains all required entries
- One git commit: "task F5: keyboard shortcut reference panel"

---

## 🎨 VISUAL FIDELITY

### Task V1 — Environment map (HDRI) panel
**Files: `src/useStore.jsx`, `src/App.jsx`**

Use `@react-three/drei`'s `<Environment>` component (already available in the installed package) to add environment map support. Add an `environment` field to each scene in the Zustand store (default: `null`). In the Inspector or a new "Scene" panel in the sidebar, render a row of preset buttons: None, Studio, City, Sunset, Forest, Warehouse. Clicking a preset sets `environment` on the active scene. Pass the active scene's `environment` value to `<Environment preset={...} />` inside the Canvas. When `environment` is `null`, render nothing (existing behavior preserved).

**Definition of done:**
- `environment` field exists on scene objects in the store
- Preset buttons render in the UI and update the active scene's environment
- The Canvas reflects the selected environment map in real time
- Switching scenes restores each scene's environment independently
- `npm test` exits 0 with zero skips, including a unit test that verifies setting environment updates the correct scene in the store
- One git commit: "task V1: environment map HDRI panel"

---

### Task V2 — PBR texture maps in Inspector
**Files: `src/App.jsx` (Inspector panel), `src/EditableMesh.jsx`**

Extend the Inspector to support uploading roughness, metalness, normal, and bump map textures per object, in addition to the existing base color texture. Add four file-input buttons (one per map type) in the Inspector's material section. On file select, read the image as a data URL and store it in the object via `updateObject(id, { roughnessMap, metalnessMap, normalMap, bumpMap })`. In `EditableMesh.jsx`, load each map with `THREE.TextureLoader` (in separate `useMemo` hooks keyed on the respective prop) and pass them to `meshStandardMaterial` or `meshPhysicalMaterial`. If a map is not set, the corresponding material prop is `undefined` (Three.js default behavior preserved).

**Definition of done:**
- Four file-input buttons render in the Inspector's material section for roughness, metalness, normal, and bump maps
- Selecting a file stores the data URL on the object and the mesh updates in the viewport
- Each map is loaded independently; clearing one does not affect others
- `npm test` exits 0 with zero skips, including a unit test that verifies each map property is stored on the object via `updateObject`
- One git commit: "task V2: PBR texture maps in Inspector"

---

### Task V3 — Post-processing effects panel (Bloom + SSAO)
**Files: `src/useStore.jsx`, `src/App.jsx`**

Install `@react-three/postprocessing` (run `npm install @react-three/postprocessing`). Add a `postProcessing` object to the global store state: `{ bloom: false, bloomIntensity: 0.5, ssao: false }`. Add a "Effects" section to the Inspector or sidebar with toggle switches for Bloom and SSAO, and a slider for Bloom intensity (0–2). Wrap the Canvas content with `<EffectComposer>` from `@react-three/postprocessing` and conditionally include `<Bloom luminanceThreshold={0} intensity={bloomIntensity} />` and `<SSAO />` based on the store flags. When both are off, `<EffectComposer>` renders with no children (zero performance cost).

**Definition of done:**
- `postProcessing` state exists in the store with the three fields above
- Bloom and SSAO toggles render in the UI and update the store
- Bloom intensity slider updates `bloomIntensity` in real time
- Toggling Bloom on adds visible glow to bright objects in the viewport
- `npm test` exits 0 with zero skips, including a unit test that verifies toggling bloom updates the store
- One git commit: "task V3: post-processing effects panel"

---

### Task V4 — Scene lights panel
**Files: `src/useStore.jsx`, `src/App.jsx`**

Add a `lights` array to each scene in the Zustand store. Each light object has: `{ id, type: 'directional'|'point'|'spot', color: '#ffffff', intensity: 1, position: [x,y,z], castShadow: false }`. Add a "Lights" section to the sidebar with an "+ Add Light" button that creates a default directional light. Each light entry shows its type, color swatch, intensity slider (0–5), and a shadow toggle checkbox. Lights render as actual Three.js lights inside the Canvas using R3F (`<directionalLight>`, `<pointLight>`, `<spotLight>`). The existing hardcoded ambient/directional light in `App.jsx` is NOT removed — the new lights are additive.

**Definition of done:**
- `lights` array exists on scene objects in the store; adding a light updates the active scene
- "+ Add Light" button creates a directional light with defaults
- Color, intensity, and shadow controls update the light in real time in the viewport
- Switching scenes restores each scene's lights independently
- `npm test` exits 0 with zero skips, including a unit test that verifies adding and updating lights in the store
- One git commit: "task V4: scene lights panel"

---

## 🤖 AI AGENT SUPERPOWERS

### Task A1 — Spatial awareness: bounding box context in agent prompts
**Files: `src/agentService.js`**

The agent currently receives object position and scale in its scene description. Extend the scene description in `buildSceneDescription` to also include each object's computed world-space bounding box: `bbox(minX,minY,minZ)→(maxX,maxY,maxZ)` and `center(x,y,z)`. Compute the bounding box from `object.position` and `object.scale` (treat scale as half-extents of a box centered on position — approximate is fine since exact geometry varies). This gives the AI enough context to handle relative placement prompts like "place object A on top of object B" or "align all wheels to y=0". Add a `move_objects` tool to `AGENT_TOOLS` with `{ object_ids: string[], position: [number,number,number] }` that calls `updateObject(id, { position })` on each target.

**Definition of done:**
- `buildSceneDescription` output includes `bbox(...)→(...)` and `center(...)` for each object
- `move_objects` tool exists in `AGENT_TOOLS` and is handled in `executeOp`
- `npm test` exits 0 with zero skips, including a unit test that verifies the scene description contains `bbox` and `center` for a known fixture, and a unit test that verifies `move_objects` updates positions correctly
- One git commit: "task A1: spatial bounding box context and move_objects tool"

---

### Task A2 — Agentic animation: agent writes useFrame loops
**Files: `src/useStore.jsx`, `src/agentService.js`, `src/EditableMesh.jsx`**

Add an `animationCode` string field to each object in the store (default: `null`). Add an `animate_object` tool to `AGENT_TOOLS` with `{ object_ids: string[], animation_code: string }`. The `animation_code` is a JavaScript function body (as a string) that receives `(mesh, delta, elapsed)` — `mesh` is the Three.js Mesh ref, `delta` is the frame delta in seconds, `elapsed` is total elapsed seconds. The agent generates this code from natural language. In `EditableMesh.jsx`, if `object.animationCode` is set, use `useFrame` to call `new Function('mesh', 'delta', 'elapsed', object.animationCode)(meshRef.current, delta, state.clock.getDelta(), state.clock.elapsedTime)` each frame. Wrap in try/catch — on error, log to console and stop the animation. Store `animationCode` via `updateObject(id, { animationCode })`.

**Definition of done:**
- `animationCode` field exists on objects in the store
- `animate_object` tool exists in `AGENT_TOOLS` and is handled in `executeOp`
- In `EditableMesh`, `useFrame` runs the animation code when `animationCode` is set
- Errors in animation code are caught and logged without crashing the app
- `npm test` exits 0 with zero skips, including a unit test that verifies `animate_object` stores the code on the correct objects
- One git commit: "task A2: agentic animation via animate_object tool"

---

### Task A3 — Procedural material: agent applies PBR material prompts
**Files: `src/agentService.js`, `src/App.jsx`**

Add a `set_material` tool to `AGENT_TOOLS` with `{ object_ids: string[], color?: string, metalness?: number, roughness?: number, materialType?: 'standard'|'physical'|'wireframe' }`. Handle it in `executeOp` by calling `updateObject(id, { color, metalness, roughness, materialType })` for each target, only applying fields that are present in the input. Update the agent system prompt to inform the AI it can use `set_material` to fulfill prompts like "make it look like brushed steel" (high metalness ~0.9, low roughness ~0.1) or "make it look like matte rubber" (zero metalness, high roughness ~0.9). Include a reference table of 6 common material presets in the system prompt.

**Definition of done:**
- `set_material` tool exists in `AGENT_TOOLS` and is handled in `executeOp`
- Partial inputs work — passing only `metalness` updates only metalness, leaves other fields unchanged
- System prompt includes the 6-preset reference table
- `npm test` exits 0 with zero skips, including a unit test that verifies `set_material` applies only the provided fields
- One git commit: "task A3: set_material agent tool with PBR presets"

---

## 🛠 DEVELOPER EXPERIENCE

### Task D1 — Editable R3F code panel (bi-directional)
**Files: `src/CodeView.jsx`, `src/useStore.jsx`**

The existing `CodeView` panel displays generated R3F code as read-only text. Make it editable: replace the `<pre>` with a `<textarea>` styled identically (monospace, same colors, same padding). When the user edits the code and presses Cmd+Enter (or a "Apply" button), parse the JSX to extract updated prop values and apply them to the store. For the parsing step, limit scope to detecting changes to `position`, `scale`, `rotation`, and `color` props on mesh elements — use regex to extract `position={[x,y,z]}`, `scale={[x,y,z]}`, `rotation={[x,y,z]}`, `color="..."` for each object ID. Call `updateObject` for each changed prop. If parsing fails, show an inline error message in the panel and make no store changes.

**Definition of done:**
- `<CodeView>` renders a `<textarea>` instead of `<pre>`, editable by the user
- Cmd+Enter applies changes: extracts position/scale/rotation/color from the code and calls `updateObject` for each changed value
- Parse errors show an inline error message without modifying the store
- `npm test` exits 0 with zero skips, including a unit test that verifies the parser correctly extracts position, scale, and color from a known JSX string
- One git commit: "task D1: editable bi-directional R3F code panel"

---

### Task D2 — One-click Next.js boilerplate export
**Files: `src/utils/exportNextjs.js` (new), `src/App.jsx`**

Add an "Export Next.js" button next to the existing "Export .GLB" button. Clicking it generates a ZIP file (use the `jszip` package — run `npm install jszip`) containing a minimal Next.js project with: `package.json` (deps: next, react, react-dom, three, @react-three/fiber, @react-three/drei), `app/page.js` (imports the scene component), `app/layout.js` (minimal root layout), and `components/Scene.jsx` (the current R3F scene code as a Canvas-wrapped component with ambient light, OrbitControls, and all current objects). The ZIP downloads automatically via a blob URL. The export logic lives in `src/utils/exportNextjs.js`; the button in `src/App.jsx` calls it.

**Definition of done:**
- "Export Next.js" button renders next to "Export .GLB"
- Clicking it triggers a ZIP download named `plenum3d-export.zip`
- The ZIP contains exactly the four files listed above
- `components/Scene.jsx` contains the current scene's R3F code (same as CodeView output)
- `npm test` exits 0 with zero skips, including a unit test that verifies `exportNextjs` generates a ZIP containing the four expected file paths
- One git commit: "task D2: one-click Next.js boilerplate export"

---

### Task D3 — Extract group to reusable component
**Files: `src/agentService.js`, `src/useStore.jsx`**

Add an `extract_component` tool to `AGENT_TOOLS` with `{ group_id: string, component_name: string }`. When executed: (1) find all objects in the group, (2) generate a self-contained JSX component string named `component_name` that renders those objects with their current positions/scales/colors as props defaulting to the stored values, (3) store the component string on the group object via a new `componentCode` field in the store, (4) display it in the CodeView panel. The component name must be a valid PascalCase React component name — validate with `/^[A-Z][A-Za-z0-9]*$/` and reject with an error message if invalid. The objects remain in the scene (extraction is non-destructive — it only generates code).

**Definition of done:**
- `extract_component` tool exists in `AGENT_TOOLS` and is handled in `executeOp`
- Generated component is valid JSX containing all objects in the group
- Component name validation rejects non-PascalCase names with a clear error
- `componentCode` is stored on the group object in the store
- `npm test` exits 0 with zero skips, including a unit test that verifies the generated code contains all object IDs in the group and uses the correct component name
- One git commit: "task D3: extract group to reusable component"
