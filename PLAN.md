# Execution Plan: Sculpt3D (3D Figma)

## ⚡ RESUME STATE — 2026-03-15

This project is partially built. Do NOT re-implement completed work. Read this file
carefully before doing anything — it tells you exactly where to pick up.

> **CRITICAL: DO NOT INVENT TASKS.** Execute ONLY the numbered tasks under REMAINING TASKS below.
> Do NOT create a new roadmap, a "Professional Workspace" plan, or any other task list.
> If you want to do something not on this list, stop and ask the user.
> A task is only DONE when: (1) git commit exists, (2) npm test passes with ZERO skipped tests.

---

## ✅ COMPLETED (skip these entirely)

**Foundation:** done
- Vite 6 + React 19 + Three.js r183 + React Three Fiber v9.5 + @react-three/drei v10.7
- Tailwind CSS v4, Zustand v5, Vitest v4, Playwright v1.58
- Dark viewport: infinite grid, OrbitControls, ambient + directional + point lighting

**3D Editing:** done
- PivotControls gizmo for translate/rotate/scale on whole objects
- Vertex spheres in sculpt mode (cyan = selected, white = unselected)
- Scene hierarchy panel (right sidebar): visibility toggle, delete, select ✅ (restored 2026-03-15)
- Undo/redo history stack (50-deep), keyboard shortcuts ✅ (fixed 2026-03-15)

**Export:** done
- GLB export via GLTFExporter ✅
- R3F/JSX code export via CodeGenerator.js ✅
- Code viewer modal with copy-to-clipboard ✅

**Demo content:** done
- F1 car generator (src/f1Model.jsx) — 20+ parts ✅
- Primitive generators: Cube, Sphere, Cylinder, Cone ✅

**AI:** done
- Prompt bar UI ✅
- Ollama connector (src/aiService.js) ✅
- Settings panel with provider tabs (Ollama/OpenAI/Anthropic/Google) ✅
- Reference image upload/base64 injection ✅

**Inspector:** done
- Full Scene Graph/Layer panel with visibility toggle and delete ✅
- Object name edit, position/rotation/scale numeric inputs ✅
- Texture/Visuals panel: color picker, local texture upload, roughness/metalness sliders ✅
- Vertex coordinate inputs in sculpt mode ✅
- CSG Boolean operations (Union/Subtract/Intersect) ✅

**Tests:** done
- 14/14 unit tests passing, 0 skipped ✅ (fixed 2026-03-15)

---

## ❌ REMAINING TASKS (implement in this exact order)

### Task 1 — Interaction Polish
**Files to touch: src/EditableMesh.jsx, src/App.jsx**
- Double-click on an object in the viewport should activate vertex sculpt mode (set editMode to 'vertex' and select the object). Currently requires manual toggle.
- Single-click on empty viewport space should deselect all.
- Verify: switching between objects in the Scene Graph panel correctly updates the 3D selection gizmo.
- Definition of done: double-click-to-sculpt works, npm test 14/14 zero skips, git commit.

### Task 2 — BYOK Settings Panel Polish
**Files to touch: src/App.jsx (settings modal)**
- The Settings gear icon should open a full provider settings panel.
- Tabs: Ollama | OpenAI | Anthropic | Google — each with URL/API key input.
- Keys persist to localStorage key `3d_sculpt_keys`. Already partially done — verify it works end-to-end.
- Definition of done: can enter an Anthropic API key, close settings, send a prompt, and aiService uses that key. git commit.

### Task 3 — AI Streaming + Error Boundary
**Files to touch: src/aiService.js, src/App.jsx, new src/GenerationErrorBoundary.jsx**
- Stream tokens from Anthropic/OpenAI (use streaming API). Show skeleton/spinner while generating.
- Wrap the generated mesh display in an Error Boundary — if generation produces invalid geometry, show error message instead of crashing.
- Definition of done: Anthropic streaming visibly streams in the UI, invalid generation shows error boundary, npm test 14/14, git commit.

### Task 4 — Grouping + OBJ Export
**Files to touch: src/useStore.jsx, src/Inspector.jsx, src/Exporter.jsx**
- Add `groupObjects(ids)` and `ungroupObjects(groupId)` to useStore. Group appears as a single entry in the Scene Graph that can be expanded/collapsed.
- Add OBJ export option alongside existing GLB export.
- Definition of done: can group 2 cubes into a group, toggle visibility of group, ungroup, export as OBJ. npm test 14/14, git commit.

### Task 5 — Visual Polish + Deploy
**Files to touch: src/index.css, src/App.jsx, src/Inspector.jsx, vercel deploy**
- Glassmorphism on panels (backdrop-blur, semi-transparent backgrounds).
- Cyan pulsing outline on hovered objects in viewport.
- Loading state while AI is generating (skeleton animation).
- `data-testid` attributes on all interactive elements for Playwright.
- Deploy to marcintreder@gmail.com Vercel account: `vercel deploy --prod` (ensure logged in as marcintreder).
- Definition of done: deployed URL working, all visual polish visible, npm test 14/14, git commit + deploy.

---

## Technical Stack

- React 19, Vite 6, Three.js r183, React Three Fiber v9.5, @react-three/drei v10.7
- Tailwind CSS v4, Zustand v5
- Vitest v4 (unit tests), Playwright v1.58 (E2E)
- Provider-agnostic AI wrapper: OpenAI / Anthropic / Google / Ollama (BYOK, localStorage only)

## Key Constraints
- All API keys in browser localStorage only — no server storage
- Must maintain 60FPS during manipulation of moderately complex scenes
- AI-generated code must be sandboxed with error boundary

## Out of Scope for This MVP
- Joint/hinge mechanical constraints — implement after Tasks 1-5 ship
- Physics simulation (Cannon-es / Rapier)
- Edge/face selection (vertex-only for now)
- The fabricated "Professional Workspace" 20-task roadmap that the factory agent invented — DO NOT implement it
