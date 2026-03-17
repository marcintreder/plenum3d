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

### App Core & AI
- Persistent Auth: Silent refresh of Google access tokens 5min before expiry (Task 8).
- Selective Code Copy: UI support for copying partial code segments from the editor (Task 9).
- Multi-object select + bulk operations (Task 10/P1).
- Copy/paste objects (Cmd+C / Cmd+V) (Task 11/P2).
- Project Thumbnails in sidebar (Task 12/P3 partial).
- [x] All core editor features (History, Export, Inspector, Primitives, Vertex editing).
- [x] Backend integration (Neon DB, Google Auth).

---

## ❌ REMAINING TASKS

> **IMPORTANT**: Only work on tasks listed here. Do not invent new tasks or "improve" things not listed.

### Task P3 — Project management UI (Remaining)
**Files: `src/App.jsx`, `src/components/ProjectThumbnails.jsx`**

- [x] "+ New project" button in sidebar (above or below list) → creates empty project, adds to list, switches to it.
- [x] Inline rename for projects: in `ProjectThumbnails`, show an input field when a project is being renamed.

**Definition of done:** create a new project, rename it "Test Project", confirm it appears in the list and can be switched to. `npm run build` passes.

---

### Task P4 — AI generation quality: auto-retry on parse error
**Files: `src/aiService.js`**

- [x] Catch errors from `executeModelCode`.
- [x] Re-send to model with the error message and previous code for one retry.
- [x] Max 1 retry.
- [x] Log retry in the console.

**Definition of done:** implemented and verified with a unit test.

---

### Task P5 — Playwright E2E smoke tests [COMPLETED ✅ VERIFIED]
**Files: `playwright.config.js`, `src/test/e2e/smoke.spec.js`, `src/App.jsx`, `package.json`**

All 5 smoke tests passing (`npm run test:e2e` → 5 passed in ~1.3s).

**Tests implemented and passing:**
1. [x] Login page renders — checks "Sign in with Google" button
2. [x] Settings modal appears/closes — opens modal, checks "Provider Settings" h2, closes via aria-label="Close"
3. [x] Scene tabs "+" adds new tab — clicks `button[title="Add scene"]`, verifies "Scene 2" appears
4. [x] Prompt bar visible — checks `input[type="text"]` visibility
5. [x] Export button in DOM — checks `button:has-text("Export .GLB")` visibility

**Notes:**
- Auth is mocked via `addInitScript` (localStorage injection + window.fetch mock for `/api/*`)
- Also fixed a pre-existing TDZ bug in `App.jsx`: `handleScreenshot` useCallback was declared before its dependencies (`projects`, `activeProjectId`, `persistProjects`); moved it to after `persistProjects`
- `npm run build` passes with zero errors
