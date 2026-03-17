# Implementation Plan
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
8. **Persistent Auth (Task 8)**: Implement silent authentication refresh flow to handle Google OAuth token expiry (1 hour limit) without interrupting the user session or syncing.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.

9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
8. **Persistent Auth (Task 8)**: Implement silent authentication refresh flow to handle Google OAuth token expiry (1 hour limit) without interrupting the user session or syncing.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
1. **Inspector UI (Task 1)**: Create `AIInspector.jsx` for model properties and AI prompt UI.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
8. **Persistent Auth (Task 8)**: Implement silent authentication refresh flow to handle Google OAuth token expiry (1 hour limit) without interrupting the user session or syncing.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
2. **AI Service Hook (Task 2)**: Create a React hook to connect UI to `aiService.js`.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
8. **Persistent Auth (Task 8)**: Implement silent authentication refresh flow to handle Google OAuth token expiry (1 hour limit) without interrupting the user session or syncing.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
3. **State Sync (Task 3)**: Update `useStore` to handle geometry patching reliably.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
8. **Persistent Auth (Task 8)**: Implement silent authentication refresh flow to handle Google OAuth token expiry (1 hour limit) without interrupting the user session or syncing.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
4. **Verification (Task 4)**: Implement Vitest unit tests for AI Refine logic. Playwright is scoped to a single E2E smoke test covering the core AI Refine flow only: select object → enter prompt → receive update → verify canvas refresh. No Playwright tests outside this flow. Vitest and Playwright must use separate config files and runner entry points to avoid shared `describe`/`test` globals or test registration conflicts.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
8. **Persistent Auth (Task 8)**: Implement silent authentication refresh flow to handle Google OAuth token expiry (1 hour limit) without interrupting the user session or syncing.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
5. **AI Object Refinement (Task 5)**: Select object(s), send structure to AI via prompt, and patch resulting geometry onto canvas.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
8. **Persistent Auth (Task 8)**: Implement silent authentication refresh flow to handle Google OAuth token expiry (1 hour limit) without interrupting the user session or syncing.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
6. **Command+A (Select All) (Task 6)**: Implement keyboard shortcut (Cmd+A) to select all objects on the canvas for unified movement and deletion.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
8. **Persistent Auth (Task 8)**: Implement silent authentication refresh flow to handle Google OAuth token expiry (1 hour limit) without interrupting the user session or syncing.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
7. **Marquee Selection Tool (Task 7)**: Implement a new canvas tool that allows users to drag a selection box (marquee) to select multiple objects at once, then perform movement or deletion actions on the entire selection group.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
8. **Persistent Auth (Task 8)**: Implement silent authentication refresh flow to handle Google OAuth token expiry (1 hour limit) without interrupting the user session or syncing.
9. **Selective Code Copy (Task 9)**: Enable users to select and copy specific code segments within the editor UI.
