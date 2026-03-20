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

---

## ❌ REMAINING TASKS

> Only work on tasks listed here. Send the task list to the user for approval before starting.

---

### Task F1 — Object search / filter in sidebar
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
