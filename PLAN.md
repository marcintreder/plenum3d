# Plenum3D — Development Plan

> **For Openclaw factory agents:** This is the active project plan. Read this file first before doing anything. Do NOT execute old tasks — only tasks listed under REMAINING TASKS below.
> A task is DONE when: (1) code is written and verified, (2) `npm run build` passes with zero errors, (3) git commit exists.

---

## Project Overview

**Plenum3D** is an AI-powered 3D modeling web app, deployed at plenum3d.vercel.app.

**Tech stack:**
- React 19, Vite 6, Three.js r183, React Three Fiber v9.5, @react-three/drei v10.7
- Tailwind CSS v4, Zustand v5, Vitest v4
- Google OAuth (access token flow via `useGoogleLogin` hook, NOT FedCM/JWT)
- Backend: Vercel serverless functions in `api/` directory
- Database: Neon PostgreSQL (`@neondatabase/serverless`) for settings and projects
- Deployment: Vercel (GitHub repo: marcintreder/plenum3d)

---

## ✅ COMPLETED

### App & Auth
- Google OAuth login via `useGoogleLogin` popup (NOT `GoogleLogin` component — that triggers broken FedCM)
- Backend auth in `api/_auth.js`: validates access tokens via `https://www.googleapis.com/oauth2/v3/tokeninfo` (NOT `verifyIdToken` — that's JWT-only)
- User session stored in `localStorage` under key `plenum3d_user`
- `src/LoginPage.jsx`: Plenum3D branding, capabilities pitch grid (4 features), Sign in with Google button
- `src/main.jsx`: Root component fetches settings + projects from DB on login, passes `initialData` to App
- `src/apiClient.js`: `fetchSettings`, `saveSettings`, `fetchProjects`, `saveProjects` (calls `api/settings` and `api/projects`)

### App Core
- `src/App.jsx`: Full Plenum3D version with:
  - `App({ user, onLogout, initialData })` props
  - Keys loaded from `initialData.settings || localStorage("plenum3d_keys")`
  - User avatar + logout button in sidebar
  - Projects system: `projects`, `activeProjectId`, `persistProjects`, `switchToProject`, `saveCurrentProject`
  - Save status: `saveStatus` state, cloud icon in scene tab bar, manual save button
  - `doSaveToDb()`: auto-saves settings + projects to DB
  - `GroupGizmo` component with `useFrame` buffer flush (prevents React error #185)
  - `ScreenshotHelper` component
  - GitHub feedback link: `https://github.com/marcintreder/plenum3d/issues`
  - `<Canvas key={activeProjectId}>` remounts canvas on project switch

### AI Generation
- `src/aiService.js`: Single-pass THREE.js code generation (ALL providers)
  - System prompt asks model to return JavaScript code (not JSON)
  - `executeModelCode()`: runs `new Function('THREE', code)(THREE)`, extracts vertices/indices from BufferGeometry
  - Supports: Anthropic, OpenAI, Gemini, Ollama
  - Throws on failure (no silent fallback)

### Agent Mode
- `src/agentService.js`: Natural language commands → tool calls
  - Scale, smooth, color, material, move, rotate, delete, group, ungroup operations
  - System prompt references "Plenum3D" (not Sculpt3D)

### Editor
- Undo/redo (50-deep history stack)
- Multi-scene tabs with rename/duplicate/delete
- GLB export, R3F code viewer
- Inspector: name, position/rotation/scale, color, material, metalness/roughness, CSG booleans
- Primitives: cube, sphere, cylinder, cone, torus, plane, pyramid, capsule
- Vertex editing mode (double-click mesh → drag vertices)
- Edge visualization in vertex mode
- F1 car default model
- Light controls (ambient, directional, azimuth, elevation)
- Console panel for AI generation logs

### Backend
- `api/_auth.js`: Google tokeninfo verification
- `api/_db.js`: Neon PostgreSQL helper (`ensureTable`, `getData`, `setData`)
- `api/settings.js`: GET/PUT user settings
- `api/projects.js`: GET/PUT user projects

### Persistence
- `src/utils/Persistence.js`: localStorage key `plenum3d_scene`
- `src/useStore.jsx`: `loadProject(scenes, activeSceneId)` to restore full project state

---

## ❌ REMAINING TASKS

> **IMPORTANT**: Only work on tasks listed here. Do not invent new tasks or "improve" things not listed.

### Task P1 — Multi-object select + bulk operations
**Files: `src/EditableMesh.jsx`, `src/Inspector.jsx`, `src/useKeyboardShortcuts.js`**

- Shift+click a mesh → adds it to `selectedObjectIds` (already in store as `toggleSelectedObjectId`)
- Inspector: when `selectedObjectIds.length > 1`, show bulk color + material pickers that apply to all selected
- Keyboard: `Delete` key with multiple selected → delete all
- Visual: all selected objects show a selection outline (cyan tint or wireframe overlay)

**Definition of done:** shift-click 3 objects, change their color simultaneously, delete them all with Delete key. `npm run build` passes.

---

### Task P2 — Copy/paste objects (Cmd+C / Cmd+V)
**Files: `src/useStore.jsx`, `src/useKeyboardShortcuts.js`**

- Store: add `clipboard: null` state, `copySelected()` action (deep-clones selected objects into clipboard), `pasteClipboard()` action (generates new IDs, offsets position by [1,0,0])
- Keyboard shortcuts: `Cmd+C` → `copySelected()`, `Cmd+V` → `pasteClipboard()`
- Paste should group the pasted objects if the source was a group

**Definition of done:** copy a multi-part generated model, paste it, both appear side-by-side. `npm run build` passes.

---

### Task P3 — Project management UI
**Files: `src/App.jsx`**

- Add a project sidebar panel (toggleable, left or bottom of current sidebar)
- Shows list of saved projects (from `projects` state)
- Click project → `switchToProject(id)`
- "+ New project" button → creates empty project, adds to list
- Double-click project name → rename inline
- Delete project button (with confirmation)
- Project thumbnail: use `ScreenshotHelper` to capture a thumbnail when switching away from a project

**Definition of done:** create 2 projects, switch between them, their scenes are independent. Thumbnails update on switch.

---

### Task P4 — AI generation quality: auto-retry on parse error
**Files: `src/aiService.js`**

Currently if the generated code throws a runtime error (e.g., syntax error, undefined geometry type), the whole generation fails. Instead:
- Catch the error from `executeModelCode`
- Re-send to the model with the error message: "Your previous code threw this error: `${err.message}`. Here is the code: `${code}`. Fix it and return only the corrected array."
- Max 1 retry per generation
- Log the retry in the console panel

**Definition of done:** test by generating a prompt that historically fails ("50s pickup truck"), confirm it retries once if it fails and succeeds on the second attempt.

---

## Technical Architecture Notes (for Openclaw)

### Auth flow
```
LoginPage → useGoogleLogin popup → access_token
→ fetch /oauth2/v3/userinfo → { sub, name, email, picture }
→ onLogin({ id, name, email, picture, credential: access_token })
→ localStorage.setItem("plenum3d_user", ...)
→ main.jsx fetches settings + projects → passes as initialData to App
```

### Backend auth
```
api/_auth.js: getUserId(req) → fetch tokeninfo?access_token=TOKEN → info.sub
```
**Do NOT use `verifyIdToken`** — that's for JWT tokens, not access tokens.

### AI generation
```
src/aiService.js → SYSTEM_PROMPT (asks for JS code)
→ provider API call → code string
→ executeModelCode(code) → new Function('THREE', code)(THREE)
→ descriptors[] → extract BufferGeometry vertices/indices
→ { isParts: true, name, parts[] }
→ App.jsx → addObjects(parts, name) → useStore
```

### Projects vs Scenes
- A **project** is a named container with multiple scenes + metadata
- A **scene** is a tab within a project (scene tabs bar in App.jsx)
- Projects are saved to Neon DB via `api/projects.js`
- When switching projects, `loadProject(scenes, activeSceneId)` replaces all scenes in the store

### localStorage keys
- `plenum3d_user` — user session (main.jsx)
- `plenum3d_keys` — API keys (App.jsx)
- `plenum3d_scene` — scene backup (Persistence.js)

### Key files
| File | Purpose |
|------|---------|
| `src/main.jsx` | Root: auth state, DB data fetch, routes to LoginPage or App |
| `src/LoginPage.jsx` | Google OAuth login page |
| `src/App.jsx` | Main editor: 1200 lines, everything |
| `src/aiService.js` | AI generation (single-pass THREE.js code) |
| `src/agentService.js` | Natural language → tool calls |
| `src/useStore.jsx` | Zustand store: all 3D state |
| `src/apiClient.js` | Frontend API client |
| `api/_auth.js` | Backend: verify Google tokens |
| `api/_db.js` | Backend: Neon PostgreSQL |
| `api/settings.js` | Backend: GET/PUT /api/settings |
| `api/projects.js` | Backend: GET/PUT /api/projects |

### Environment variables (Vercel)
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID
- `DATABASE_URL` or `POSTGRES_URL` — Neon connection string

### Git discipline
- **Always commit after every change** — one logical change per commit
- Commit message format: `verb: description` (e.g., `fix: prevent React error #185 in GroupGizmo`)
