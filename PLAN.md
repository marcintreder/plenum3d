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

Currently if the generated code throws a runtime error (e.g., syntax error, undefined geometry type), the whole generation fails. Instead:
- Catch the error from `executeModelCode`
- Re-send to the model with the error message: "Your previous code threw this error: `${err.message}`. Here is the code: `${code}`. Fix it and return only the corrected array."
- Max 1 retry per generation
- Log the retry in the console panel

**Definition of done:** test by generating a prompt that historically fails ("50s pickup truck"), confirm it retries once if it fails and succeeds on the second attempt.

---

### Task P5 — Playwright E2E smoke tests
**Files: `playwright.config.js` (new), `src/test/fix_verification.test.js`, `package.json`**

Set up Playwright to smoke-test the UI shell. The 3D canvas is not testable via DOM — only test what is.

**Setup:**
- Add `playwright.config.js` at project root
- Create `src/test/e2e/smoke.spec.js`
- Add `"test:e2e": "playwright test"` to `package.json`
- Delete or empty `src/test/fix_verification.test.js`

**Tests to write:**
1. Login page renders
2. Settings modal appears/closes
3. Scene tabs "+ " adds new tab
4. Prompt bar visible
5. Export button in DOM

**Definition of done:** `npm run test:e2e` passes with all 5 smoke tests.
